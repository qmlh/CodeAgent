/**
 * Integration tests for the complete recovery system
 * Tests AutoRecoveryManager, FailoverCoordinator, and SystemHealthMonitor working together
 */

import { AutoRecoveryManager, RecoveryAction } from '../AutoRecoveryManager';
import { FailoverCoordinator, FailoverStrategy } from '../FailoverCoordinator';
import { SystemHealthMonitor, HealthCheckType, HealthStatus } from '../SystemHealthMonitor';
import { AgentError, TaskError, SystemError } from '../../errors/SystemError';
import { ErrorType, ErrorSeverity } from '../../../types/error.types';
import { AgentStatus, AgentType } from '../../../types/agent.types';
import { TaskStatus, TaskPriority } from '../../../types/task.types';

// Mock system dependencies
const createMockDependencies = () => ({
  agentManager: {
    getAgent: jest.fn(),
    getAllAgents: jest.fn(),
    restartAgent: jest.fn(),
    isolateAgent: jest.fn(),
    getAvailableAgents: jest.fn(),
    updateAgentConfig: jest.fn(),
    getAgentStatistics: jest.fn()
  },
  taskManager: {
    getTaskQueue: jest.fn(),
    reassignTask: jest.fn(),
    updateTaskStatus: jest.fn(),
    getTask: jest.fn(),
    getTaskStatistics: jest.fn(),
    getTaskPerformanceMetrics: jest.fn()
  },
  coordinationManager: {
    updateAgentStatus: jest.fn(),
    restartAgent: jest.fn(),
    isolateAgent: jest.fn(),
    flagAgentForManualIntervention: jest.fn()
  },
  systemResourceMonitor: {
    getCpuUsage: jest.fn(),
    getMemoryUsage: jest.fn(),
    getDiskUsage: jest.fn(),
    getNetworkStats: jest.fn()
  }
});

describe('Recovery System Integration Tests', () => {
  let autoRecoveryManager: AutoRecoveryManager;
  let failoverCoordinator: FailoverCoordinator;
  let systemHealthMonitor: SystemHealthMonitor;
  let mockDependencies: ReturnType<typeof createMockDependencies>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockDependencies = createMockDependencies();

    // Initialize recovery components
    autoRecoveryManager = new AutoRecoveryManager(
      {
        healthCheckInterval: 1000,
        maxConsecutiveFailures: 2,
        enableAutoRestart: true,
        enableTaskReassignment: true,
        enableSystemSelfHealing: true
      },
      mockDependencies
    );

    failoverCoordinator = new FailoverCoordinator(
      {
        strategy: FailoverStrategy.GRACEFUL,
        enableStateRecovery: true,
        enableTaskCheckpointing: true
      },
      mockDependencies
    );

    systemHealthMonitor = new SystemHealthMonitor(
      {
        checkInterval: 1000,
        enableSelfHealing: true,
        alertThresholds: {
          cpuUsage: 80,
          memoryUsage: 85,
          diskUsage: 90,
          agentResponseTime: 3000,
          taskFailureRate: 0.1
        }
      },
      {
        autoRecoveryManager,
        failoverCoordinator,
        systemResourceMonitor: mockDependencies.systemResourceMonitor,
        agentManager: mockDependencies.agentManager,
        taskManager: mockDependencies.taskManager
      }
    );
  });

  afterEach(async () => {
    await Promise.all([
      autoRecoveryManager.shutdown(),
      failoverCoordinator.shutdown(),
      systemHealthMonitor.shutdown()
    ]);
  });

  describe('Complete Agent Failure Recovery', () => {
    test('should handle complete agent failure with task reassignment', async () => {
      const failedAgentId = 'failed-agent-1';
      const healthyAgentId = 'healthy-agent-1';
      
      // Setup: Register agents
      autoRecoveryManager.registerAgent(failedAgentId);
      autoRecoveryManager.registerAgent(healthyAgentId);
      
      // Setup: Mock healthy agent available for reassignment
      mockDependencies.agentManager.getAvailableAgents.mockResolvedValue([
        {
          id: healthyAgentId,
          name: 'Healthy Agent',
          type: AgentType.FRONTEND,
          status: AgentStatus.IDLE,
          capabilities: ['general'],
          workload: 30
        }
      ]);

      // Setup: Mock tasks assigned to failed agent
      const failedAgentTasks = [
        {
          id: 'task-1',
          title: 'Test Task 1',
          description: 'Description 1',
          type: 'frontend',
          status: TaskStatus.IN_PROGRESS,
          priority: TaskPriority.HIGH,
          assignedAgent: failedAgentId,
          dependencies: [],
          estimatedTime: 3600000,
          files: [],
          requirements: [],
          createdAt: new Date(),
          startedAt: new Date()
        }
      ];

      // Collect events from all components
      const allEvents: any[] = [];
      
      autoRecoveryManager.on('recovery', (event) => {
        allEvents.push({ source: 'recovery', ...event });
      });
      
      failoverCoordinator.on('failover', (event) => {
        allEvents.push({ source: 'failover', ...event });
      });
      
      systemHealthMonitor.on('alert_created', (alert) => {
        allEvents.push({ source: 'health_alert', ...alert });
      });

      // Execute: Report agent failure
      const error = new AgentError('Agent crashed unexpectedly', failedAgentId);
      await autoRecoveryManager.reportAgentFailure(failedAgentId, error);
      await autoRecoveryManager.reportAgentFailure(failedAgentId, error); // Exceed threshold

      // Execute: Initiate failover
      await failoverCoordinator.initiateFailover(failedAgentId, 'Agent failure detected');

      // Execute: Reassign tasks
      await failoverCoordinator.reassignTasks(failedAgentTasks, failedAgentId);

      // Execute: Health check to detect the issue
      await systemHealthMonitor.performHealthChecks();

      // Verify: Events were generated
      expect(allEvents.length).toBeGreaterThan(0);
      expect(allEvents.some(e => e.source === 'recovery')).toBe(true);
      expect(allEvents.some(e => e.source === 'failover')).toBe(true);
      expect(allEvents.some(e => e.source === 'health_alert')).toBe(true);

      // Verify: System health reflects the failure
      const healthStatus = await autoRecoveryManager.getSystemHealthStatus();
      expect(healthStatus.unhealthyAgents).toBeGreaterThan(0);

      // Verify: Alerts were created
      const activeAlerts = systemHealthMonitor.getActiveAlerts();
      expect(activeAlerts.length).toBeGreaterThan(0);
    });

    test('should coordinate recovery across all components', async () => {
      const agentId = 'test-agent';
      
      // Register agent in recovery manager
      autoRecoveryManager.registerAgent(agentId);
      
      // Create task checkpoint in failover coordinator
      await failoverCoordinator.createTaskCheckpoint(
        'test-task',
        agentId,
        0.5,
        { progress: 'halfway' },
        ['complete remaining work']
      );

      // Simulate agent becoming unhealthy
      autoRecoveryManager.updateAgentHealth(agentId, {
        isHealthy: false,
        consecutiveFailures: 3,
        responseTime: 10000,
        memoryUsage: 95,
        cpuUsage: 98
      });

      // Perform health check
      const healthResults = await systemHealthMonitor.performHealthChecks();
      
      // Verify health check detected issues
      const agentHealthResult = healthResults.get(HealthCheckType.AGENT_HEALTH);
      expect(agentHealthResult?.status).not.toBe(HealthStatus.HEALTHY);

      // Force recovery
      const recoveryResult = await autoRecoveryManager.forceAgentRecovery(agentId);
      expect(recoveryResult).toBeDefined();

      // Verify checkpoint is available for recovery
      const checkpoint = failoverCoordinator.getTaskCheckpoint('test-task');
      expect(checkpoint).toBeDefined();
      expect(checkpoint?.progress).toBe(0.5);
    });
  });

  describe('System-Wide Health Degradation', () => {
    test('should handle cascading failures across multiple agents', async () => {
      const agentIds = ['agent-1', 'agent-2', 'agent-3', 'agent-4', 'agent-5'];
      
      // Register all agents
      agentIds.forEach(id => {
        autoRecoveryManager.registerAgent(id);
      });

      // Simulate cascading failures
      for (let i = 0; i < 3; i++) {
        const agentId = agentIds[i];
        const error = new AgentError(`Cascading failure ${i + 1}`, agentId);
        
        // Report failure
        await autoRecoveryManager.reportAgentFailure(agentId, error);
        await autoRecoveryManager.reportAgentFailure(agentId, error);
        
        // Mark as unhealthy
        autoRecoveryManager.updateAgentHealth(agentId, {
          isHealthy: false,
          consecutiveFailures: 3
        });
      }

      // Perform system health check
      const healthStatus = await autoRecoveryManager.performSystemHealthCheck();
      
      // Verify system health is degraded
      expect(healthStatus.overallHealth).toBeLessThan(70);
      expect(healthStatus.unhealthyAgents).toBe(3);
      expect(healthStatus.criticalIssues.length).toBeGreaterThan(0);

      // Verify health monitor detects the degradation
      const healthResults = await systemHealthMonitor.performHealthChecks();
      const agentHealthResult = healthResults.get(HealthCheckType.AGENT_HEALTH);
      
      expect(agentHealthResult?.status).toBe(HealthStatus.CRITICAL);
      expect(agentHealthResult?.recommendations.length).toBeGreaterThan(0);
    });

    test('should trigger system-wide recovery actions', async () => {
      const agentIds = ['agent-1', 'agent-2', 'agent-3'];
      
      // Register agents
      agentIds.forEach(id => {
        autoRecoveryManager.registerAgent(id);
      });

      // Make all agents unhealthy
      agentIds.forEach(id => {
        autoRecoveryManager.updateAgentHealth(id, {
          isHealthy: false,
          consecutiveFailures: 5,
          responseTime: 15000,
          memoryUsage: 98,
          cpuUsage: 99
        });
      });

      // Track self-healing actions
      const healingActions: any[] = [];
      systemHealthMonitor.on('self_healing_action_started', (action) => {
        healingActions.push(action);
      });

      // Perform health checks with low thresholds to trigger healing
      const monitor = new SystemHealthMonitor(
        {
          checkInterval: 1000,
          enableSelfHealing: true,
          alertThresholds: {
            cpuUsage: 50, // Low thresholds to trigger actions
            memoryUsage: 60,
            diskUsage: 70,
            agentResponseTime: 2000,
            taskFailureRate: 0.05
          }
        },
        {
          autoRecoveryManager,
          failoverCoordinator,
          systemResourceMonitor: mockDependencies.systemResourceMonitor,
          agentManager: mockDependencies.agentManager,
          taskManager: mockDependencies.taskManager
        }
      );

      await monitor.performHealthChecks();

      // Verify self-healing actions were triggered
      expect(healingActions.length).toBeGreaterThan(0);

      await monitor.shutdown();
    });
  });

  describe('Task Recovery and State Management', () => {
    test('should recover tasks with checkpoints after agent failure', async () => {
      const failedAgentId = 'failed-agent';
      const recoveryAgentId = 'recovery-agent';
      const taskId = 'recoverable-task';

      // Setup: Create task checkpoint
      await failoverCoordinator.createTaskCheckpoint(
        taskId,
        failedAgentId,
        0.75, // 75% complete
        {
          completedSteps: ['step1', 'step2', 'step3'],
          currentData: { processed: 750, total: 1000 }
        },
        ['step4', 'step5']
      );

      // Setup: Register agents
      autoRecoveryManager.registerAgent(failedAgentId);
      autoRecoveryManager.registerAgent(recoveryAgentId);

      // Setup: Mock available agents for reassignment
      mockDependencies.agentManager.getAvailableAgents.mockResolvedValue([
        {
          id: recoveryAgentId,
          name: 'Recovery Agent',
          type: AgentType.BACKEND,
          status: AgentStatus.IDLE,
          capabilities: ['general', 'recovery'],
          workload: 20
        }
      ]);

      // Execute: Agent fails
      const error = new AgentError('Agent hardware failure', failedAgentId);
      await autoRecoveryManager.reportAgentFailure(failedAgentId, error);
      await autoRecoveryManager.reportAgentFailure(failedAgentId, error);

      // Execute: Initiate failover
      await failoverCoordinator.initiateFailover(failedAgentId, 'Hardware failure');

      // Execute: Attempt state recovery
      try {
        await failoverCoordinator.recoverAgentState(failedAgentId, recoveryAgentId);
      } catch (error) {
        // Expected to fail since we don't have actual state snapshots
        expect(error).toBeInstanceOf(Error);
      }

      // Verify: Checkpoint is available for recovery
      const checkpoint = failoverCoordinator.getTaskCheckpoint(taskId);
      expect(checkpoint).toBeDefined();
      expect(checkpoint?.progress).toBe(0.75);
      expect(checkpoint?.agentId).toBe(failedAgentId);
      expect(checkpoint?.nextSteps).toEqual(['step4', 'step5']);
    });

    test('should handle task reassignment with dependency management', async () => {
      const failedAgentId = 'failed-agent';
      const healthyAgentIds = ['agent-1', 'agent-2', 'agent-3'];

      // Setup: Register agents
      autoRecoveryManager.registerAgent(failedAgentId);
      healthyAgentIds.forEach(id => {
        autoRecoveryManager.registerAgent(id);
      });

      // Setup: Create tasks with dependencies
      const tasks = [
        {
          id: 'task-1',
          title: 'Base Task',
          description: 'Foundation task',
          type: 'backend',
          status: TaskStatus.IN_PROGRESS,
          priority: TaskPriority.HIGH,
          assignedAgent: failedAgentId,
          dependencies: [],
          estimatedTime: 3600000,
          files: ['src/base.ts'],
          requirements: ['base functionality'],
          createdAt: new Date(),
          startedAt: new Date()
        },
        {
          id: 'task-2',
          title: 'Dependent Task',
          description: 'Depends on base task',
          type: 'frontend',
          status: TaskStatus.PENDING,
          priority: TaskPriority.MEDIUM,
          assignedAgent: failedAgentId,
          dependencies: ['task-1'],
          estimatedTime: 1800000,
          files: ['src/ui.tsx'],
          requirements: ['UI components'],
          createdAt: new Date()
        }
      ];

      // Setup: Mock available agents with different specializations
      mockDependencies.agentManager.getAvailableAgents.mockResolvedValue([
        {
          id: 'agent-1',
          type: AgentType.BACKEND,
          capabilities: ['backend', 'api'],
          workload: 30
        },
        {
          id: 'agent-2',
          type: AgentType.FRONTEND,
          capabilities: ['frontend', 'ui'],
          workload: 40
        },
        {
          id: 'agent-3',
          type: AgentType.TESTING,
          capabilities: ['testing', 'qa'],
          workload: 20
        }
      ]);

      // Execute: Reassign tasks with type-specific criteria
      const reassignments = await failoverCoordinator.reassignTasks(
        tasks,
        failedAgentId,
        {
          prioritizeBy: 'workload'
        }
      );

      // Verify: Tasks were reassigned
      expect(reassignments.size).toBe(2);
      expect(reassignments.has('task-1')).toBe(true);
      expect(reassignments.has('task-2')).toBe(true);
    });
  });

  describe('Performance Under Load', () => {
    test('should handle high-frequency failure events', async () => {
      const agentCount = 20;
      const failureCount = 50;
      
      // Register many agents
      for (let i = 0; i < agentCount; i++) {
        autoRecoveryManager.registerAgent(`agent-${i}`);
      }

      const startTime = Date.now();
      
      // Generate many failure events
      const failurePromises = [];
      for (let i = 0; i < failureCount; i++) {
        const agentId = `agent-${i % agentCount}`;
        const error = new AgentError(`Failure ${i}`, agentId);
        failurePromises.push(
          autoRecoveryManager.reportAgentFailure(agentId, error)
        );
      }

      await Promise.all(failurePromises);
      
      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should handle all failures within reasonable time
      expect(duration).toBeLessThan(5000); // 5 seconds

      // Verify system health reflects the load
      const healthStatus = await autoRecoveryManager.getSystemHealthStatus();
      expect(healthStatus.totalAgents).toBe(agentCount);
    });

    test('should maintain performance during concurrent operations', async () => {
      const agentIds = ['agent-1', 'agent-2', 'agent-3', 'agent-4', 'agent-5'];
      
      // Register agents
      agentIds.forEach(id => {
        autoRecoveryManager.registerAgent(id);
      });

      const startTime = Date.now();

      // Run concurrent operations
      const operations = [
        // Health checks
        systemHealthMonitor.performHealthChecks(),
        systemHealthMonitor.performHealthChecks(),
        
        // Recovery operations
        autoRecoveryManager.performSystemHealthCheck(),
        autoRecoveryManager.forceAgentRecovery('agent-1'),
        
        // Failover operations
        failoverCoordinator.createTaskCheckpoint('task-1', 'agent-1', 0.5, {}),
        failoverCoordinator.createTaskCheckpoint('task-2', 'agent-2', 0.3, {}),
        
        // Self-healing actions
        systemHealthMonitor.triggerSelfHealingAction('cleanup_resources'),
        systemHealthMonitor.triggerSelfHealingAction('rebalance_load')
      ];

      const results = await Promise.allSettled(operations);
      
      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should complete all operations within reasonable time
      expect(duration).toBeLessThan(3000); // 3 seconds

      // Most operations should succeed
      const successfulOperations = results.filter(r => r.status === 'fulfilled').length;
      expect(successfulOperations).toBeGreaterThan(results.length * 0.7); // At least 70% success
    });
  });

  describe('Error Propagation and Handling', () => {
    test('should handle errors gracefully across components', async () => {
      const agentId = 'error-prone-agent';
      
      // Setup: Mock dependencies to fail
      mockDependencies.agentManager.restartAgent.mockRejectedValue(
        new Error('Restart service unavailable')
      );
      mockDependencies.taskManager.reassignTask.mockRejectedValue(
        new Error('Task service unavailable')
      );

      autoRecoveryManager.registerAgent(agentId);

      // Execute: Try recovery operations that will fail
      const recoveryResult = await autoRecoveryManager.forceAgentRecovery(agentId);
      
      // Should handle the failure gracefully
      expect(recoveryResult).toBeDefined();
      
      // Try failover that will encounter errors
      await expect(
        failoverCoordinator.initiateFailover(agentId, 'Test failure')
      ).resolves.not.toThrow();

      // Health monitor should still function
      const healthResults = await systemHealthMonitor.performHealthChecks();
      expect(healthResults.size).toBe(5);
    });

    test('should maintain system stability during partial failures', async () => {
      const agentIds = ['agent-1', 'agent-2', 'agent-3'];
      
      // Register agents
      agentIds.forEach(id => {
        autoRecoveryManager.registerAgent(id);
      });

      // Make some operations fail
      let callCount = 0;
      mockDependencies.coordinationManager.restartAgent.mockImplementation(() => {
        callCount++;
        if (callCount % 2 === 0) {
          throw new Error('Intermittent failure');
        }
        return Promise.resolve();
      });

      // Try multiple recovery operations
      const results = await Promise.allSettled([
        autoRecoveryManager.forceAgentRecovery('agent-1'),
        autoRecoveryManager.forceAgentRecovery('agent-2'),
        autoRecoveryManager.forceAgentRecovery('agent-3')
      ]);

      // Some should succeed, some should fail, but system should remain stable
      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;
      
      expect(successful + failed).toBe(3);
      expect(successful).toBeGreaterThan(0); // At least some should succeed

      // System should still be responsive
      const healthStatus = await autoRecoveryManager.getSystemHealthStatus();
      expect(healthStatus).toBeDefined();
    });
  });

  describe('Resource Cleanup and Memory Management', () => {
    test('should clean up resources properly on shutdown', async () => {
      const agentIds = ['agent-1', 'agent-2', 'agent-3'];
      
      // Register agents and create checkpoints
      agentIds.forEach(id => {
        autoRecoveryManager.registerAgent(id);
      });

      await failoverCoordinator.createTaskCheckpoint('task-1', 'agent-1', 0.5, {});
      await failoverCoordinator.createTaskCheckpoint('task-2', 'agent-2', 0.3, {});

      // Perform some operations to create state
      await systemHealthMonitor.performHealthChecks();
      await autoRecoveryManager.performSystemHealthCheck();

      // Shutdown all components
      await Promise.all([
        autoRecoveryManager.shutdown(),
        failoverCoordinator.shutdown(),
        systemHealthMonitor.shutdown()
      ]);

      // Verify cleanup (this is mainly to ensure no errors during shutdown)
      expect(true).toBe(true);
    });

    test('should handle memory pressure during intensive operations', async () => {
      const agentCount = 100;
      const checkpointCount = 200;
      
      // Create many agents
      for (let i = 0; i < agentCount; i++) {
        autoRecoveryManager.registerAgent(`agent-${i}`);
      }

      // Create many checkpoints
      for (let i = 0; i < checkpointCount; i++) {
        await failoverCoordinator.createTaskCheckpoint(
          `task-${i}`,
          `agent-${i % agentCount}`,
          Math.random(),
          { data: `checkpoint-data-${i}` }
        );
      }

      // Perform intensive operations
      const operations = [];
      for (let i = 0; i < 10; i++) {
        operations.push(systemHealthMonitor.performHealthChecks());
        operations.push(autoRecoveryManager.performSystemHealthCheck());
      }

      await Promise.all(operations);

      // System should remain stable
      const healthStatus = await autoRecoveryManager.getSystemHealthStatus();
      expect(healthStatus.totalAgents).toBe(agentCount);
    });
  });
});
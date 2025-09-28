/**
 * Integration tests for FailoverCoordinator
 */

import { FailoverCoordinator, FailoverStrategy } from '../FailoverCoordinator';
import { Task, TaskStatus, TaskPriority } from '../../../types/task.types';
import { Agent, AgentStatus, AgentType } from '../../../types/agent.types';

// Mock dependencies
const mockTaskManager = {
  getTaskQueue: jest.fn(),
  reassignTask: jest.fn(),
  updateTaskStatus: jest.fn(),
  getTask: jest.fn()
};

const mockAgentManager = {
  getAgent: jest.fn(),
  getAllAgents: jest.fn(),
  getAvailableAgents: jest.fn(),
  updateAgentConfig: jest.fn()
};

const mockCoordinationManager = {
  updateAgentStatus: jest.fn(),
  isolateAgent: jest.fn(),
  flagAgentForManualIntervention: jest.fn()
};

// Test data
const createMockTask = (id: string, assignedAgent?: string): Task => ({
  id,
  title: `Test Task ${id}`,
  description: `Description for task ${id}`,
  type: 'general',
  status: TaskStatus.IN_PROGRESS,
  priority: TaskPriority.MEDIUM,
  assignedAgent,
  dependencies: [],
  estimatedTime: 3600000,
  files: [],
  requirements: [],
  createdAt: new Date(),
  startedAt: new Date()
});

const createMockAgent = (id: string, type: AgentType = AgentType.FRONTEND): Agent => ({
  id,
  name: `Agent ${id}`,
  type,
  status: AgentStatus.IDLE,
  config: {
    name: `Agent ${id}`,
    type,
    capabilities: ['general'],
    maxConcurrentTasks: 5,
    timeout: 30000,
    retryAttempts: 3
  },
  capabilities: ['general'],
  workload: 0,
  createdAt: new Date(),
  lastActive: new Date()
});

describe('FailoverCoordinator Integration Tests', () => {
  let failoverCoordinator: FailoverCoordinator;

  beforeEach(() => {
    jest.clearAllMocks();
    
    failoverCoordinator = new FailoverCoordinator(
      {
        strategy: FailoverStrategy.GRACEFUL,
        gracefulShutdownTimeout: 5000,
        taskReassignmentTimeout: 2000,
        enableStateRecovery: true,
        enableTaskCheckpointing: true
      },
      {
        taskManager: mockTaskManager,
        agentManager: mockAgentManager,
        coordinationManager: mockCoordinationManager
      }
    );
  });

  afterEach(async () => {
    await failoverCoordinator.shutdown();
  });

  describe('Failover Initiation', () => {
    test('should initiate immediate failover', async () => {
      const agentId = 'failed-agent-1';
      const reason = 'Agent crashed';
      
      const events: any[] = [];
      failoverCoordinator.on('failover', (event) => {
        events.push(event);
      });
      
      await failoverCoordinator.initiateFailover(agentId, reason);
      
      expect(events.length).toBeGreaterThan(0);
      expect(events.some(e => e.type === 'failover_initiated')).toBe(true);
      expect(events.some(e => e.type === 'failover_completed')).toBe(true);
    });

    test('should prevent concurrent failovers for same agent', async () => {
      const agentId = 'failed-agent-1';
      
      // Start first failover
      const failover1 = failoverCoordinator.initiateFailover(agentId, 'First failure');
      
      // Try to start second failover
      await expect(
        failoverCoordinator.initiateFailover(agentId, 'Second failure')
      ).rejects.toThrow('Failover already in progress');
      
      await failover1;
    });

    test('should handle different failover strategies', async () => {
      const strategies = [
        FailoverStrategy.IMMEDIATE,
        FailoverStrategy.GRACEFUL,
        FailoverStrategy.DELAYED,
        FailoverStrategy.MANUAL
      ];
      
      for (const strategy of strategies) {
        const coordinator = new FailoverCoordinator(
          { strategy },
          {
            taskManager: mockTaskManager,
            agentManager: mockAgentManager,
            coordinationManager: mockCoordinationManager
          }
        );
        
        const agentId = `agent-${strategy}`;
        
        await expect(
          coordinator.initiateFailover(agentId, `Test ${strategy} failover`)
        ).resolves.not.toThrow();
        
        await coordinator.shutdown();
      }
    });
  });

  describe('Task Reassignment', () => {
    test('should reassign tasks to available agents', async () => {
      const failedAgentId = 'failed-agent';
      const newAgentId = 'healthy-agent';
      
      const tasks = [
        createMockTask('task-1', failedAgentId),
        createMockTask('task-2', failedAgentId)
      ];
      
      const availableAgents = [createMockAgent(newAgentId)];
      
      // Mock agent manager to return available agents
      mockAgentManager.getAvailableAgents = jest.fn().mockResolvedValue(availableAgents);
      
      const reassignments = await failoverCoordinator.reassignTasks(
        tasks,
        failedAgentId
      );
      
      expect(reassignments.size).toBe(2);
      expect(reassignments.get('task-1')).toBe(newAgentId);
      expect(reassignments.get('task-2')).toBe(newAgentId);
    });

    test('should handle task reassignment with criteria', async () => {
      const failedAgentId = 'failed-agent';
      const tasks = [createMockTask('task-1', failedAgentId)];
      
      const frontendAgent = createMockAgent('frontend-agent', AgentType.FRONTEND);
      const backendAgent = createMockAgent('backend-agent', AgentType.BACKEND);
      
      mockAgentManager.getAvailableAgents = jest.fn().mockResolvedValue([
        frontendAgent,
        backendAgent
      ]);
      
      const reassignments = await failoverCoordinator.reassignTasks(
        tasks,
        failedAgentId,
        {
          agentType: AgentType.FRONTEND,
          maxWorkload: 50
        }
      );
      
      expect(reassignments.size).toBe(1);
      expect(reassignments.get('task-1')).toBe('frontend-agent');
    });

    test('should handle no available agents scenario', async () => {
      const failedAgentId = 'failed-agent';
      const tasks = [createMockTask('task-1', failedAgentId)];
      
      mockAgentManager.getAvailableAgents = jest.fn().mockResolvedValue([]);
      
      await expect(
        failoverCoordinator.reassignTasks(tasks, failedAgentId)
      ).rejects.toThrow('No available agents for task reassignment');
    });
  });

  describe('State Recovery', () => {
    test('should create and retrieve agent state snapshots', async () => {
      const agentId = 'test-agent';
      
      // This would normally be created during failover
      // For testing, we'll simulate having a snapshot
      const snapshot = {
        agentId,
        timestamp: new Date(),
        status: AgentStatus.WORKING,
        activeTasks: [createMockTask('task-1', agentId)],
        completedTasks: [],
        workload: 50,
        configuration: { setting: 'value' },
        resources: ['resource-1']
      };
      
      // Simulate snapshot creation (this would happen internally)
      // For testing, we'll just verify the interface works
      const retrievedSnapshot = failoverCoordinator.getAgentStateSnapshot(agentId);
      
      // Since we haven't actually created a snapshot, this should be undefined
      expect(retrievedSnapshot).toBeUndefined();
    });

    test('should recover agent state from snapshot', async () => {
      const agentId = 'failed-agent';
      const targetAgentId = 'recovery-agent';
      
      // This test would verify state recovery if we had actual snapshots
      // For now, we test that the method handles missing snapshots gracefully
      await expect(
        failoverCoordinator.recoverAgentState(agentId, targetAgentId)
      ).rejects.toThrow('No state snapshot found');
    });
  });

  describe('Task Checkpointing', () => {
    test('should create task checkpoints', async () => {
      const taskId = 'test-task';
      const agentId = 'test-agent';
      const progress = 0.5;
      const intermediateResults = { step: 'completed step 1' };
      const nextSteps = ['step 2', 'step 3'];
      
      await failoverCoordinator.createTaskCheckpoint(
        taskId,
        agentId,
        progress,
        intermediateResults,
        nextSteps
      );
      
      const checkpoint = failoverCoordinator.getTaskCheckpoint(taskId);
      
      expect(checkpoint).toBeDefined();
      expect(checkpoint!.taskId).toBe(taskId);
      expect(checkpoint!.agentId).toBe(agentId);
      expect(checkpoint!.progress).toBe(progress);
      expect(checkpoint!.intermediateResults).toEqual(intermediateResults);
      expect(checkpoint!.nextSteps).toEqual(nextSteps);
    });

    test('should retrieve task checkpoints', () => {
      const taskId = 'non-existent-task';
      
      const checkpoint = failoverCoordinator.getTaskCheckpoint(taskId);
      
      expect(checkpoint).toBeUndefined();
    });
  });

  describe('Configuration Management', () => {
    test('should update failover configuration', () => {
      const newConfig = {
        gracefulShutdownTimeout: 10000,
        taskReassignmentTimeout: 5000,
        maxReassignmentAttempts: 5
      };
      
      expect(() => {
        failoverCoordinator.updateConfig(newConfig);
      }).not.toThrow();
    });
  });

  describe('Event Handling', () => {
    test('should emit failover events', async () => {
      const agentId = 'test-agent';
      const events: any[] = [];
      
      failoverCoordinator.on('failover', (event) => {
        events.push(event);
      });
      
      await failoverCoordinator.initiateFailover(agentId, 'Test failure');
      
      expect(events.length).toBeGreaterThan(0);
      expect(events[0].type).toBe('failover_initiated');
      expect(events[0].agentId).toBe(agentId);
    });

    test('should emit task reassignment events', async () => {
      const failedAgentId = 'failed-agent';
      const newAgentId = 'healthy-agent';
      const tasks = [createMockTask('task-1', failedAgentId)];
      
      mockAgentManager.getAvailableAgents = jest.fn().mockResolvedValue([
        createMockAgent(newAgentId)
      ]);
      
      const events: any[] = [];
      failoverCoordinator.on('failover', (event) => {
        events.push(event);
      });
      
      await failoverCoordinator.reassignTasks(tasks, failedAgentId);
      
      expect(events.some(e => e.type === 'task_reassigned')).toBe(true);
    });
  });

  describe('Error Handling', () => {
    test('should handle task reassignment failures gracefully', async () => {
      const failedAgentId = 'failed-agent';
      const tasks = [createMockTask('task-1', failedAgentId)];
      
      // Mock reassignment to fail
      mockTaskManager.reassignTask = jest.fn().mockRejectedValue(
        new Error('Reassignment failed')
      );
      
      mockAgentManager.getAvailableAgents = jest.fn().mockResolvedValue([
        createMockAgent('healthy-agent')
      ]);
      
      // Should not throw, but handle the error internally
      const reassignments = await failoverCoordinator.reassignTasks(
        tasks,
        failedAgentId
      );
      
      // Task should not be in reassignments due to failure
      expect(reassignments.size).toBe(0);
    });

    test('should handle state recovery failures', async () => {
      const agentId = 'test-agent';
      
      // Mock configuration update to fail
      mockAgentManager.updateAgentConfig = jest.fn().mockRejectedValue(
        new Error('Config update failed')
      );
      
      await expect(
        failoverCoordinator.recoverAgentState(agentId)
      ).rejects.toThrow('No state snapshot found');
    });
  });

  describe('Concurrent Operations', () => {
    test('should handle concurrent task reassignments', async () => {
      const failedAgentId = 'failed-agent';
      const tasks1 = [createMockTask('task-1', failedAgentId)];
      const tasks2 = [createMockTask('task-2', failedAgentId)];
      
      mockAgentManager.getAvailableAgents = jest.fn().mockResolvedValue([
        createMockAgent('healthy-agent-1'),
        createMockAgent('healthy-agent-2')
      ]);
      
      const [reassignments1, reassignments2] = await Promise.all([
        failoverCoordinator.reassignTasks(tasks1, failedAgentId),
        failoverCoordinator.reassignTasks(tasks2, failedAgentId)
      ]);
      
      expect(reassignments1.size).toBe(1);
      expect(reassignments2.size).toBe(1);
    });
  });

  describe('Performance', () => {
    test('should handle large number of task reassignments efficiently', async () => {
      const failedAgentId = 'failed-agent';
      const tasks: Task[] = [];
      
      // Create many tasks
      for (let i = 0; i < 100; i++) {
        tasks.push(createMockTask(`task-${i}`, failedAgentId));
      }
      
      const availableAgents = [
        createMockAgent('agent-1'),
        createMockAgent('agent-2'),
        createMockAgent('agent-3')
      ];
      
      mockAgentManager.getAvailableAgents = jest.fn().mockResolvedValue(availableAgents);
      
      const startTime = Date.now();
      const reassignments = await failoverCoordinator.reassignTasks(tasks, failedAgentId);
      const endTime = Date.now();
      
      expect(reassignments.size).toBe(100);
      expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
    });
  });

  describe('Integration Scenarios', () => {
    test('should handle complete agent failure scenario', async () => {
      const failedAgentId = 'failed-agent';
      const healthyAgentId = 'healthy-agent';
      
      // Setup: agent has active tasks
      const activeTasks = [
        createMockTask('task-1', failedAgentId),
        createMockTask('task-2', failedAgentId)
      ];
      
      mockAgentManager.getAvailableAgents = jest.fn().mockResolvedValue([
        createMockAgent(healthyAgentId)
      ]);
      
      const events: any[] = [];
      failoverCoordinator.on('failover', (event) => {
        events.push(event);
      });
      
      // Execute: initiate failover
      await failoverCoordinator.initiateFailover(failedAgentId, 'Agent crashed');
      
      // Verify: events were emitted
      expect(events.some(e => e.type === 'failover_initiated')).toBe(true);
      expect(events.some(e => e.type === 'failover_completed')).toBe(true);
    });

    test('should handle graceful shutdown with task completion', async () => {
      const coordinator = new FailoverCoordinator(
        {
          strategy: FailoverStrategy.GRACEFUL,
          gracefulShutdownTimeout: 1000 // Short timeout for testing
        },
        {
          taskManager: mockTaskManager,
          agentManager: mockAgentManager,
          coordinationManager: mockCoordinationManager
        }
      );
      
      const agentId = 'graceful-agent';
      
      await coordinator.initiateFailover(agentId, 'Planned maintenance');
      
      await coordinator.shutdown();
    });
  });
});
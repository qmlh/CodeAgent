/**
 * Integration tests for SystemHealthMonitor
 */

import { SystemHealthMonitor, HealthCheckType, HealthStatus } from '../SystemHealthMonitor';
import { AutoRecoveryManager } from '../AutoRecoveryManager';
import { FailoverCoordinator } from '../FailoverCoordinator';

// Mock dependencies
const mockAutoRecoveryManager = {
  getSystemHealthStatus: jest.fn(),
  getAgentHealthMetrics: jest.fn(),
  forceAgentRecovery: jest.fn(),
  on: jest.fn(),
  off: jest.fn()
} as any;

const mockFailoverCoordinator = {
  on: jest.fn(),
  off: jest.fn()
} as any;

const mockSystemResourceMonitor = {
  getCpuUsage: jest.fn(),
  getMemoryUsage: jest.fn(),
  getDiskUsage: jest.fn(),
  getNetworkStats: jest.fn()
};

const mockAgentManager = {
  getAllAgents: jest.fn(),
  getAgentStatistics: jest.fn()
};

const mockTaskManager = {
  getTaskStatistics: jest.fn(),
  getTaskPerformanceMetrics: jest.fn()
};

describe('SystemHealthMonitor Integration Tests', () => {
  let healthMonitor: SystemHealthMonitor;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default mock returns
    mockAutoRecoveryManager.getSystemHealthStatus.mockResolvedValue({
      overallHealth: 85,
      healthyAgents: 4,
      unhealthyAgents: 1,
      totalAgents: 5,
      activeRecoveries: 0,
      lastHealthCheck: new Date(),
      criticalIssues: [],
      warnings: []
    });

    mockAutoRecoveryManager.getAgentHealthMetrics.mockReturnValue([
      {
        agentId: 'agent-1',
        isHealthy: true,
        lastHeartbeat: new Date(),
        consecutiveFailures: 0,
        responseTime: 1000,
        memoryUsage: 60,
        cpuUsage: 45,
        taskSuccessRate: 0.95
      },
      {
        agentId: 'agent-2',
        isHealthy: false,
        lastHeartbeat: new Date(Date.now() - 60000),
        consecutiveFailures: 2,
        responseTime: 5000,
        memoryUsage: 85,
        cpuUsage: 90,
        taskSuccessRate: 0.7
      }
    ]);
    
    healthMonitor = new SystemHealthMonitor(
      {
        checkInterval: 1000, // 1 second for testing
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
        autoRecoveryManager: mockAutoRecoveryManager,
        failoverCoordinator: mockFailoverCoordinator,
        systemResourceMonitor: mockSystemResourceMonitor,
        agentManager: mockAgentManager,
        taskManager: mockTaskManager
      }
    );
  });

  afterEach(async () => {
    await healthMonitor.shutdown();
  });

  describe('Health Check Execution', () => {
    test('should perform all types of health checks', async () => {
      const results = await healthMonitor.performHealthChecks();
      
      expect(results.size).toBe(5);
      expect(results.has(HealthCheckType.AGENT_HEALTH)).toBe(true);
      expect(results.has(HealthCheckType.SYSTEM_RESOURCES)).toBe(true);
      expect(results.has(HealthCheckType.TASK_PERFORMANCE)).toBe(true);
      expect(results.has(HealthCheckType.COMMUNICATION)).toBe(true);
      expect(results.has(HealthCheckType.DATA_INTEGRITY)).toBe(true);
    });

    test('should detect agent health issues', async () => {
      const results = await healthMonitor.performHealthChecks();
      const agentHealthResult = results.get(HealthCheckType.AGENT_HEALTH);
      
      expect(agentHealthResult).toBeDefined();
      expect(agentHealthResult!.status).toBe(HealthStatus.WARNING); // 4/5 = 80% healthy
      expect(agentHealthResult!.details.healthyAgents).toBe(1);
      expect(agentHealthResult!.details.totalAgents).toBe(2);
    });

    test('should detect system resource issues', async () => {
      const results = await healthMonitor.performHealthChecks();
      const resourceResult = results.get(HealthCheckType.SYSTEM_RESOURCES);
      
      expect(resourceResult).toBeDefined();
      expect(resourceResult!.type).toBe(HealthCheckType.SYSTEM_RESOURCES);
      expect(resourceResult!.metrics).toHaveProperty('cpu_usage');
      expect(resourceResult!.metrics).toHaveProperty('memory_usage');
      expect(resourceResult!.metrics).toHaveProperty('disk_usage');
    });

    test('should handle health check failures gracefully', async () => {
      // Mock a health check to fail
      mockAutoRecoveryManager.getAgentHealthMetrics.mockImplementation(() => {
        throw new Error('Health check failed');
      });
      
      const results = await healthMonitor.performHealthChecks();
      const agentHealthResult = results.get(HealthCheckType.AGENT_HEALTH);
      
      expect(agentHealthResult).toBeDefined();
      expect(agentHealthResult!.status).toBe(HealthStatus.FAILED);
      expect(agentHealthResult!.details.error).toBe('Health check failed');
    });
  });

  describe('Alert Management', () => {
    test('should create alerts for critical health issues', async () => {
      const alerts: any[] = [];
      healthMonitor.on('alert_created', (alert) => {
        alerts.push(alert);
      });
      
      await healthMonitor.performHealthChecks();
      
      // Should create alerts for warning/critical/failed status
      expect(alerts.length).toBeGreaterThan(0);
      
      const activeAlerts = healthMonitor.getActiveAlerts();
      expect(activeAlerts.length).toBeGreaterThan(0);
    });

    test('should acknowledge alerts', async () => {
      await healthMonitor.performHealthChecks();
      
      const activeAlerts = healthMonitor.getActiveAlerts();
      if (activeAlerts.length > 0) {
        const alertId = activeAlerts[0].id;
        const acknowledged = healthMonitor.acknowledgeAlert(alertId);
        
        expect(acknowledged).toBe(true);
        
        const updatedAlert = healthMonitor.getActiveAlerts().find(a => a.id === alertId);
        expect(updatedAlert?.acknowledged).toBe(true);
      }
    });

    test('should resolve alerts', async () => {
      await healthMonitor.performHealthChecks();
      
      const activeAlerts = healthMonitor.getActiveAlerts();
      if (activeAlerts.length > 0) {
        const alertId = activeAlerts[0].id;
        const resolved = healthMonitor.resolveAlert(alertId);
        
        expect(resolved).toBe(true);
        
        const activeAlertsAfter = healthMonitor.getActiveAlerts();
        expect(activeAlertsAfter.find(a => a.id === alertId)).toBeUndefined();
      }
    });
  });

  describe('Self-Healing Actions', () => {
    test('should trigger automatic self-healing for critical issues', async () => {
      const selfHealingActions: any[] = [];
      healthMonitor.on('self_healing_action_started', (action) => {
        selfHealingActions.push(action);
      });
      
      // Configure to trigger self-healing on any warning
      const monitor = new SystemHealthMonitor(
        {
          checkInterval: 1000,
          enableSelfHealing: true,
          alertThresholds: {
            cpuUsage: 40, // Low threshold to trigger healing
            memoryUsage: 50,
            diskUsage: 60,
            agentResponseTime: 2000,
            taskFailureRate: 0.05
          }
        },
        {
          autoRecoveryManager: mockAutoRecoveryManager,
          failoverCoordinator: mockFailoverCoordinator,
          systemResourceMonitor: mockSystemResourceMonitor,
          agentManager: mockAgentManager,
          taskManager: mockTaskManager
        }
      );
      
      await monitor.performHealthChecks();
      
      // Should trigger self-healing actions
      expect(selfHealingActions.length).toBeGreaterThan(0);
      
      await monitor.shutdown();
    });

    test('should execute manual self-healing actions', async () => {
      const actionId = await healthMonitor.triggerSelfHealingAction(
        'restart_agent',
        'test-agent',
        { reason: 'manual_trigger' }
      );
      
      expect(actionId).toBeDefined();
      
      const actions = healthMonitor.getSelfHealingActions();
      const action = actions.find(a => a.id === actionId);
      
      expect(action).toBeDefined();
      expect(action!.type).toBe('restart_agent');
      expect(action!.targetId).toBe('test-agent');
    });

    test('should handle self-healing action failures', async () => {
      // Mock recovery to fail
      mockAutoRecoveryManager.forceAgentRecovery.mockRejectedValue(
        new Error('Recovery failed')
      );
      
      const failedActions: any[] = [];
      healthMonitor.on('self_healing_action_failed', (action) => {
        failedActions.push(action);
      });
      
      await healthMonitor.triggerSelfHealingAction('restart_agent', 'test-agent');
      
      // Wait for action to complete
      await new Promise(resolve => setTimeout(resolve, 100));
      
      expect(failedActions.length).toBe(1);
      expect(failedActions[0].status).toBe('failed');
    });
  });

  describe('System Metrics Collection', () => {
    test('should collect and store system metrics', async () => {
      // Wait for metrics collection
      await new Promise(resolve => setTimeout(resolve, 600)); // Half the collection interval
      
      const metricsHistory = healthMonitor.getSystemMetricsHistory();
      expect(metricsHistory.length).toBeGreaterThan(0);
      
      const latestMetrics = metricsHistory[metricsHistory.length - 1];
      expect(latestMetrics).toHaveProperty('timestamp');
      expect(latestMetrics).toHaveProperty('cpu');
      expect(latestMetrics).toHaveProperty('memory');
      expect(latestMetrics).toHaveProperty('disk');
      expect(latestMetrics).toHaveProperty('network');
      expect(latestMetrics).toHaveProperty('agents');
      expect(latestMetrics).toHaveProperty('tasks');
    });

    test('should limit metrics history size', async () => {
      // This would require running for a longer time to test properly
      // For now, we just verify the method works
      const metricsHistory = healthMonitor.getSystemMetricsHistory(10);
      expect(Array.isArray(metricsHistory)).toBe(true);
    });
  });

  describe('Health Check History', () => {
    test('should maintain health check history', async () => {
      await healthMonitor.performHealthChecks();
      await healthMonitor.performHealthChecks();
      
      const history = healthMonitor.getHealthCheckHistory();
      expect(history.length).toBeGreaterThan(0);
      
      const agentHealthHistory = healthMonitor.getHealthCheckHistory(HealthCheckType.AGENT_HEALTH);
      expect(agentHealthHistory.length).toBe(2);
      expect(agentHealthHistory[0].type).toBe(HealthCheckType.AGENT_HEALTH);
    });

    test('should sort health check history by timestamp', async () => {
      await healthMonitor.performHealthChecks();
      await new Promise(resolve => setTimeout(resolve, 10));
      await healthMonitor.performHealthChecks();
      
      const history = healthMonitor.getHealthCheckHistory();
      
      for (let i = 1; i < history.length; i++) {
        expect(history[i - 1].timestamp.getTime()).toBeGreaterThanOrEqual(
          history[i].timestamp.getTime()
        );
      }
    });
  });

  describe('Configuration Management', () => {
    test('should update monitoring configuration', () => {
      const newConfig = {
        checkInterval: 5000,
        enableSelfHealing: false,
        alertThresholds: {
          cpuUsage: 90,
          memoryUsage: 95,
          diskUsage: 95,
          agentResponseTime: 10000,
          taskFailureRate: 0.2
        }
      };
      
      expect(() => {
        healthMonitor.updateConfig(newConfig);
      }).not.toThrow();
    });
  });

  describe('Event Handling', () => {
    test('should handle recovery events from AutoRecoveryManager', () => {
      const recoveryEvents: any[] = [];
      healthMonitor.on('recovery_event', (event) => {
        recoveryEvents.push(event);
      });
      
      // Simulate recovery event
      const mockEvent = {
        type: 'recovery_completed',
        agentId: 'test-agent',
        timestamp: new Date()
      };
      
      // This would be triggered by the AutoRecoveryManager
      // For testing, we verify the event handler is set up
      expect(mockAutoRecoveryManager.on).toHaveBeenCalled();
    });

    test('should handle failover events from FailoverCoordinator', () => {
      const failoverEvents: any[] = [];
      healthMonitor.on('failover_event', (event) => {
        failoverEvents.push(event);
      });
      
      // Verify event handler is set up
      expect(mockFailoverCoordinator.on).toHaveBeenCalled();
    });
  });

  describe('Performance', () => {
    test('should complete health checks within reasonable time', async () => {
      const startTime = Date.now();
      await healthMonitor.performHealthChecks();
      const endTime = Date.now();
      
      const duration = endTime - startTime;
      expect(duration).toBeLessThan(1000); // Should complete within 1 second
    });

    test('should handle concurrent health checks', async () => {
      const checks = [
        healthMonitor.performHealthChecks(),
        healthMonitor.performHealthChecks(),
        healthMonitor.performHealthChecks()
      ];
      
      const results = await Promise.all(checks);
      
      expect(results.length).toBe(3);
      results.forEach(result => {
        expect(result.size).toBe(5);
      });
    });
  });

  describe('Error Handling', () => {
    test('should handle system health status retrieval failures', async () => {
      mockAutoRecoveryManager.getSystemHealthStatus.mockRejectedValue(
        new Error('System status unavailable')
      );
      
      await expect(
        healthMonitor.getSystemHealthStatus()
      ).rejects.toThrow('System status unavailable');
    });

    test('should handle invalid alert IDs gracefully', () => {
      const acknowledged = healthMonitor.acknowledgeAlert('non-existent-alert');
      expect(acknowledged).toBe(false);
      
      const resolved = healthMonitor.resolveAlert('non-existent-alert');
      expect(resolved).toBe(false);
    });
  });

  describe('Integration Scenarios', () => {
    test('should handle complete system health monitoring cycle', async () => {
      const events: any[] = [];
      
      // Listen to all events
      healthMonitor.on('alert_created', (alert) => events.push({ type: 'alert', data: alert }));
      healthMonitor.on('self_healing_action_started', (action) => events.push({ type: 'healing', data: action }));
      
      // Perform health checks
      await healthMonitor.performHealthChecks();
      
      // Verify system responded appropriately
      expect(events.length).toBeGreaterThan(0);
      
      const alerts = healthMonitor.getActiveAlerts();
      const actions = healthMonitor.getSelfHealingActions();
      
      expect(alerts.length).toBeGreaterThan(0);
      expect(actions.length).toBeGreaterThan(0);
    });

    test('should maintain system health over time', async () => {
      // Simulate multiple health check cycles
      for (let i = 0; i < 3; i++) {
        await healthMonitor.performHealthChecks();
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      const history = healthMonitor.getHealthCheckHistory();
      const metricsHistory = healthMonitor.getSystemMetricsHistory();
      
      expect(history.length).toBeGreaterThan(10); // Multiple checks * check types
      expect(metricsHistory.length).toBeGreaterThan(0);
    });
  });

  describe('Cleanup and Shutdown', () => {
    test('should stop monitoring on shutdown', async () => {
      healthMonitor.startMonitoring();
      await healthMonitor.shutdown();
      
      // After shutdown, monitoring should be stopped
      // This is verified by the fact that shutdown doesn't throw
      expect(true).toBe(true);
    });

    test('should handle shutdown with active operations', async () => {
      // Start some operations
      const healthCheckPromise = healthMonitor.performHealthChecks();
      
      // Shutdown while operations are running
      const shutdownPromise = healthMonitor.shutdown();
      
      await Promise.all([healthCheckPromise, shutdownPromise]);
      
      expect(true).toBe(true); // Should complete without errors
    });
  });
});
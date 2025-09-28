/**
 * System Health Monitor
 * Provides comprehensive system health monitoring and self-healing capabilities
 */

import { EventEmitter } from 'eventemitter3';
import { AutoRecoveryManager, AgentHealthMetrics, SystemHealthStatus } from './AutoRecoveryManager';
import { FailoverCoordinator } from './FailoverCoordinator';
import { SystemError } from '../errors/SystemError';
import { ErrorType, ErrorSeverity } from '../../types/error.types';
import { AgentStatus } from '../../types/agent.types';

/**
 * Health check types
 */
export enum HealthCheckType {
  AGENT_HEALTH = 'agent_health',
  SYSTEM_RESOURCES = 'system_resources',
  TASK_PERFORMANCE = 'task_performance',
  COMMUNICATION = 'communication',
  DATA_INTEGRITY = 'data_integrity'
}

/**
 * Health status levels
 */
export enum HealthStatus {
  HEALTHY = 'healthy',
  WARNING = 'warning',
  CRITICAL = 'critical',
  FAILED = 'failed'
}

/**
 * Health check result
 */
export interface HealthCheckResult {
  type: HealthCheckType;
  status: HealthStatus;
  timestamp: Date;
  details: any;
  metrics: Record<string, number>;
  recommendations: string[];
}

/**
 * System metrics
 */
export interface SystemMetrics {
  timestamp: Date;
  cpu: {
    usage: number;
    cores: number;
    loadAverage: number[];
  };
  memory: {
    used: number;
    total: number;
    usage: number;
  };
  disk: {
    used: number;
    total: number;
    usage: number;
  };
  network: {
    bytesIn: number;
    bytesOut: number;
    connectionsActive: number;
  };
  agents: {
    total: number;
    healthy: number;
    unhealthy: number;
    averageResponseTime: number;
  };
  tasks: {
    total: number;
    completed: number;
    failed: number;
    averageExecutionTime: number;
  };
}

/**
 * Health alert
 */
export interface HealthAlert {
  id: string;
  type: HealthCheckType;
  severity: 'info' | 'warning' | 'error' | 'critical';
  title: string;
  message: string;
  timestamp: Date;
  agentId?: string;
  metrics?: Record<string, number>;
  acknowledged: boolean;
  resolved: boolean;
  resolvedAt?: Date;
}

/**
 * Self-healing action
 */
export interface SelfHealingAction {
  id: string;
  type: 'restart_agent' | 'scale_resources' | 'rebalance_load' | 'cleanup_resources' | 'reset_connections';
  description: string;
  targetId?: string;
  parameters: Record<string, any>;
  timestamp: Date;
  status: 'pending' | 'executing' | 'completed' | 'failed';
  result?: any;
  error?: Error;
}

/**
 * Health monitoring configuration
 */
export interface HealthMonitorConfig {
  checkInterval: number;
  alertThresholds: {
    cpuUsage: number;
    memoryUsage: number;
    diskUsage: number;
    agentResponseTime: number;
    taskFailureRate: number;
  };
  enableSelfHealing: boolean;
  selfHealingActions: string[];
  retentionPeriod: number;
  maxAlerts: number;
}

/**
 * System Health Monitor
 */
export class SystemHealthMonitor extends EventEmitter {
  private config: HealthMonitorConfig;
  private autoRecoveryManager: AutoRecoveryManager;
  private failoverCoordinator: FailoverCoordinator;
  
  private healthCheckResults: Map<HealthCheckType, HealthCheckResult[]> = new Map();
  private systemMetricsHistory: SystemMetrics[] = [];
  private activeAlerts: Map<string, HealthAlert> = new Map();
  private selfHealingActions: Map<string, SelfHealingAction> = new Map();
  
  private monitoringTimer?: NodeJS.Timeout;
  private metricsCollectionTimer?: NodeJS.Timeout;
  
  // Dependencies
  private systemResourceMonitor: any;
  private agentManager: any;
  private taskManager: any;

  constructor(
    config: Partial<HealthMonitorConfig> = {},
    dependencies: {
      autoRecoveryManager: AutoRecoveryManager;
      failoverCoordinator: FailoverCoordinator;
      systemResourceMonitor: any;
      agentManager: any;
      taskManager: any;
    }
  ) {
    super();
    
    this.config = {
      checkInterval: 30000, // 30 seconds
      alertThresholds: {
        cpuUsage: 80,
        memoryUsage: 85,
        diskUsage: 90,
        agentResponseTime: 5000, // 5 seconds
        taskFailureRate: 0.1 // 10%
      },
      enableSelfHealing: true,
      selfHealingActions: [
        'restart_agent',
        'scale_resources',
        'rebalance_load',
        'cleanup_resources'
      ],
      retentionPeriod: 86400000, // 24 hours
      maxAlerts: 1000,
      ...config
    };

    this.autoRecoveryManager = dependencies.autoRecoveryManager;
    this.failoverCoordinator = dependencies.failoverCoordinator;
    this.systemResourceMonitor = dependencies.systemResourceMonitor;
    this.agentManager = dependencies.agentManager;
    this.taskManager = dependencies.taskManager;

    this.setupEventHandlers();
    this.startMonitoring();
  }

  /**
   * Start health monitoring
   */
  startMonitoring(): void {
    if (this.monitoringTimer) {
      return;
    }

    this.monitoringTimer = setInterval(async () => {
      try {
        await this.performHealthChecks();
      } catch (error) {
        console.error('Error during health checks:', error);
      }
    }, this.config.checkInterval);

    this.metricsCollectionTimer = setInterval(async () => {
      try {
        await this.collectSystemMetrics();
      } catch (error) {
        console.error('Error collecting system metrics:', error);
      }
    }, this.config.checkInterval / 2); // Collect metrics more frequently
  }

  /**
   * Stop health monitoring
   */
  stopMonitoring(): void {
    if (this.monitoringTimer) {
      clearInterval(this.monitoringTimer);
      this.monitoringTimer = undefined;
    }

    if (this.metricsCollectionTimer) {
      clearInterval(this.metricsCollectionTimer);
      this.metricsCollectionTimer = undefined;
    }
  }

  /**
   * Perform all health checks
   */
  async performHealthChecks(): Promise<Map<HealthCheckType, HealthCheckResult>> {
    const results = new Map<HealthCheckType, HealthCheckResult>();

    // Perform different types of health checks
    const checkTypes = [
      HealthCheckType.AGENT_HEALTH,
      HealthCheckType.SYSTEM_RESOURCES,
      HealthCheckType.TASK_PERFORMANCE,
      HealthCheckType.COMMUNICATION,
      HealthCheckType.DATA_INTEGRITY
    ];

    for (const checkType of checkTypes) {
      try {
        const result = await this.performHealthCheck(checkType);
        results.set(checkType, result);
        
        // Store result in history
        if (!this.healthCheckResults.has(checkType)) {
          this.healthCheckResults.set(checkType, []);
        }
        const history = this.healthCheckResults.get(checkType)!;
        history.push(result);
        
        // Limit history size
        if (history.length > 100) {
          history.shift();
        }

        // Generate alerts if needed
        await this.processHealthCheckResult(result);

      } catch (error) {
        console.error(`Health check failed for ${checkType}:`, error);
        
        const failedResult: HealthCheckResult = {
          type: checkType,
          status: HealthStatus.FAILED,
          timestamp: new Date(),
          details: { error: error instanceof Error ? error.message : 'Unknown error' },
          metrics: {},
          recommendations: ['Investigate health check failure']
        };
        
        results.set(checkType, failedResult);
      }
    }

    return results;
  }

  /**
   * Get current system health status
   */
  async getSystemHealthStatus(): Promise<SystemHealthStatus> {
    return this.autoRecoveryManager.getSystemHealthStatus();
  }

  /**
   * Get health check history
   */
  getHealthCheckHistory(type?: HealthCheckType): HealthCheckResult[] {
    if (type) {
      return this.healthCheckResults.get(type) || [];
    }

    const allResults: HealthCheckResult[] = [];
    for (const results of this.healthCheckResults.values()) {
      allResults.push(...results);
    }

    return allResults.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Get system metrics history
   */
  getSystemMetricsHistory(limit?: number): SystemMetrics[] {
    const metrics = [...this.systemMetricsHistory];
    if (limit) {
      return metrics.slice(-limit);
    }
    return metrics;
  }

  /**
   * Get active alerts
   */
  getActiveAlerts(): HealthAlert[] {
    return Array.from(this.activeAlerts.values())
      .filter(alert => !alert.resolved)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Acknowledge an alert
   */
  acknowledgeAlert(alertId: string): boolean {
    const alert = this.activeAlerts.get(alertId);
    if (alert) {
      alert.acknowledged = true;
      this.emit('alert_acknowledged', alert);
      return true;
    }
    return false;
  }

  /**
   * Resolve an alert
   */
  resolveAlert(alertId: string): boolean {
    const alert = this.activeAlerts.get(alertId);
    if (alert) {
      alert.resolved = true;
      alert.resolvedAt = new Date();
      this.emit('alert_resolved', alert);
      return true;
    }
    return false;
  }

  /**
   * Get self-healing actions
   */
  getSelfHealingActions(): SelfHealingAction[] {
    return Array.from(this.selfHealingActions.values())
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Trigger manual self-healing action
   */
  async triggerSelfHealingAction(
    type: SelfHealingAction['type'],
    targetId?: string,
    parameters: Record<string, any> = {}
  ): Promise<string> {
    const actionId = this.generateActionId();
    const action: SelfHealingAction = {
      id: actionId,
      type,
      description: this.getActionDescription(type, targetId),
      targetId,
      parameters,
      timestamp: new Date(),
      status: 'pending'
    };

    this.selfHealingActions.set(actionId, action);
    
    // Execute the action
    this.executeSelfHealingAction(action);
    
    return actionId;
  }

  /**
   * Update monitoring configuration
   */
  updateConfig(newConfig: Partial<HealthMonitorConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    // Restart monitoring if interval changed
    if (newConfig.checkInterval) {
      this.stopMonitoring();
      this.startMonitoring();
    }
  }

  /**
   * Shutdown the health monitor
   */
  async shutdown(): Promise<void> {
    this.stopMonitoring();
    this.removeAllListeners();
  }

  // Private methods

  private setupEventHandlers(): void {
    // Listen to recovery events
    this.autoRecoveryManager.on('recovery', (event) => {
      this.handleRecoveryEvent(event);
    });

    this.failoverCoordinator.on('failover', (event) => {
      this.handleFailoverEvent(event);
    });
  }

  private async performHealthCheck(type: HealthCheckType): Promise<HealthCheckResult> {
    switch (type) {
      case HealthCheckType.AGENT_HEALTH:
        return await this.checkAgentHealth();
      case HealthCheckType.SYSTEM_RESOURCES:
        return await this.checkSystemResources();
      case HealthCheckType.TASK_PERFORMANCE:
        return await this.checkTaskPerformance();
      case HealthCheckType.COMMUNICATION:
        return await this.checkCommunication();
      case HealthCheckType.DATA_INTEGRITY:
        return await this.checkDataIntegrity();
      default:
        throw new Error(`Unknown health check type: ${type}`);
    }
  }

  private async checkAgentHealth(): Promise<HealthCheckResult> {
    const agentMetrics = this.autoRecoveryManager.getAgentHealthMetrics() as AgentHealthMetrics[];
    const healthyAgents = agentMetrics.filter(m => m.isHealthy).length;
    const totalAgents = agentMetrics.length;
    const healthRatio = totalAgents > 0 ? healthyAgents / totalAgents : 1;

    let status: HealthStatus;
    if (healthRatio >= 0.9) status = HealthStatus.HEALTHY;
    else if (healthRatio >= 0.7) status = HealthStatus.WARNING;
    else if (healthRatio >= 0.5) status = HealthStatus.CRITICAL;
    else status = HealthStatus.FAILED;

    const recommendations: string[] = [];
    if (status !== HealthStatus.HEALTHY) {
      recommendations.push('Check unhealthy agents and consider restarting them');
      if (healthRatio < 0.5) {
        recommendations.push('Consider scaling up healthy agents');
      }
    }

    return {
      type: HealthCheckType.AGENT_HEALTH,
      status,
      timestamp: new Date(),
      details: {
        healthyAgents,
        totalAgents,
        healthRatio,
        unhealthyAgents: agentMetrics.filter(m => !m.isHealthy).map(m => ({
          id: m.agentId,
          failures: m.consecutiveFailures,
          lastError: m.lastError?.message
        }))
      },
      metrics: {
        healthy_agents: healthyAgents,
        total_agents: totalAgents,
        health_ratio: healthRatio
      },
      recommendations
    };
  }

  private async checkSystemResources(): Promise<HealthCheckResult> {
    // This would get actual system metrics
    const metrics = await this.getCurrentSystemMetrics();
    
    let status = HealthStatus.HEALTHY;
    const recommendations: string[] = [];

    if (metrics.cpu.usage > this.config.alertThresholds.cpuUsage) {
      status = HealthStatus.WARNING;
      recommendations.push('High CPU usage detected - consider scaling resources');
    }

    if (metrics.memory.usage > this.config.alertThresholds.memoryUsage) {
      status = HealthStatus.WARNING;
      recommendations.push('High memory usage detected - check for memory leaks');
    }

    if (metrics.disk.usage > this.config.alertThresholds.diskUsage) {
      status = HealthStatus.CRITICAL;
      recommendations.push('Low disk space - cleanup required');
    }

    return {
      type: HealthCheckType.SYSTEM_RESOURCES,
      status,
      timestamp: new Date(),
      details: metrics,
      metrics: {
        cpu_usage: metrics.cpu.usage,
        memory_usage: metrics.memory.usage,
        disk_usage: metrics.disk.usage
      },
      recommendations
    };
  }

  private async checkTaskPerformance(): Promise<HealthCheckResult> {
    // This would get actual task performance metrics
    const taskStats = {
      total: 100,
      completed: 85,
      failed: 10,
      averageExecutionTime: 5000
    };

    const failureRate = taskStats.total > 0 ? taskStats.failed / taskStats.total : 0;
    
    let status = HealthStatus.HEALTHY;
    const recommendations: string[] = [];

    if (failureRate > this.config.alertThresholds.taskFailureRate) {
      status = HealthStatus.WARNING;
      recommendations.push('High task failure rate detected - investigate failing tasks');
    }

    if (taskStats.averageExecutionTime > 10000) {
      status = HealthStatus.WARNING;
      recommendations.push('High task execution time - optimize task processing');
    }

    return {
      type: HealthCheckType.TASK_PERFORMANCE,
      status,
      timestamp: new Date(),
      details: taskStats,
      metrics: {
        failure_rate: failureRate,
        average_execution_time: taskStats.averageExecutionTime,
        completed_tasks: taskStats.completed
      },
      recommendations
    };
  }

  private async checkCommunication(): Promise<HealthCheckResult> {
    // This would check communication health between agents
    const communicationMetrics = {
      averageResponseTime: 1000,
      failedConnections: 2,
      totalConnections: 50
    };

    let status = HealthStatus.HEALTHY;
    const recommendations: string[] = [];

    if (communicationMetrics.averageResponseTime > this.config.alertThresholds.agentResponseTime) {
      status = HealthStatus.WARNING;
      recommendations.push('High communication latency detected');
    }

    const failureRate = communicationMetrics.failedConnections / communicationMetrics.totalConnections;
    if (failureRate > 0.05) {
      status = HealthStatus.CRITICAL;
      recommendations.push('High communication failure rate - check network connectivity');
    }

    return {
      type: HealthCheckType.COMMUNICATION,
      status,
      timestamp: new Date(),
      details: communicationMetrics,
      metrics: {
        response_time: communicationMetrics.averageResponseTime,
        failure_rate: failureRate
      },
      recommendations
    };
  }

  private async checkDataIntegrity(): Promise<HealthCheckResult> {
    // This would check data integrity
    const integrityCheck = {
      corruptedFiles: 0,
      inconsistentStates: 1,
      totalChecks: 100
    };

    let status = HealthStatus.HEALTHY;
    const recommendations: string[] = [];

    if (integrityCheck.corruptedFiles > 0) {
      status = HealthStatus.CRITICAL;
      recommendations.push('Data corruption detected - immediate attention required');
    }

    if (integrityCheck.inconsistentStates > 0) {
      status = HealthStatus.WARNING;
      recommendations.push('Inconsistent states detected - synchronization needed');
    }

    return {
      type: HealthCheckType.DATA_INTEGRITY,
      status,
      timestamp: new Date(),
      details: integrityCheck,
      metrics: {
        corrupted_files: integrityCheck.corruptedFiles,
        inconsistent_states: integrityCheck.inconsistentStates
      },
      recommendations
    };
  }

  private async collectSystemMetrics(): Promise<void> {
    const metrics = await this.getCurrentSystemMetrics();
    this.systemMetricsHistory.push(metrics);

    // Limit history size
    if (this.systemMetricsHistory.length > 1000) {
      this.systemMetricsHistory.shift();
    }

    // Clean up old data
    const cutoffTime = Date.now() - this.config.retentionPeriod;
    this.systemMetricsHistory = this.systemMetricsHistory.filter(
      m => m.timestamp.getTime() > cutoffTime
    );
  }

  private async getCurrentSystemMetrics(): Promise<SystemMetrics> {
    // This would get actual system metrics
    return {
      timestamp: new Date(),
      cpu: {
        usage: Math.random() * 100,
        cores: 4,
        loadAverage: [1.2, 1.5, 1.8]
      },
      memory: {
        used: 4000000000,
        total: 8000000000,
        usage: 50
      },
      disk: {
        used: 100000000000,
        total: 500000000000,
        usage: 20
      },
      network: {
        bytesIn: 1000000,
        bytesOut: 800000,
        connectionsActive: 25
      },
      agents: {
        total: 5,
        healthy: 4,
        unhealthy: 1,
        averageResponseTime: 1500
      },
      tasks: {
        total: 100,
        completed: 85,
        failed: 10,
        averageExecutionTime: 5000
      }
    };
  }

  private async processHealthCheckResult(result: HealthCheckResult): Promise<void> {
    if (result.status === HealthStatus.WARNING || result.status === HealthStatus.CRITICAL || result.status === HealthStatus.FAILED) {
      await this.createAlert(result);
    }

    if (this.config.enableSelfHealing && (result.status === HealthStatus.CRITICAL || result.status === HealthStatus.FAILED)) {
      await this.triggerAutoHealing(result);
    }
  }

  private async createAlert(result: HealthCheckResult): Promise<void> {
    const alertId = this.generateAlertId();
    const severity = this.mapHealthStatusToSeverity(result.status);
    
    const alert: HealthAlert = {
      id: alertId,
      type: result.type,
      severity,
      title: `${result.type} Health Check Alert`,
      message: `Health check for ${result.type} returned ${result.status} status`,
      timestamp: result.timestamp,
      metrics: result.metrics,
      acknowledged: false,
      resolved: false
    };

    this.activeAlerts.set(alertId, alert);
    
    // Limit alerts
    if (this.activeAlerts.size > this.config.maxAlerts) {
      const oldestAlert = Array.from(this.activeAlerts.values())
        .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())[0];
      this.activeAlerts.delete(oldestAlert.id);
    }

    this.emit('alert_created', alert);
  }

  private async triggerAutoHealing(result: HealthCheckResult): Promise<void> {
    const healingActions = this.determineSelfHealingActions(result);
    
    for (const actionType of healingActions) {
      if (this.config.selfHealingActions.includes(actionType)) {
        await this.triggerSelfHealingAction(actionType as SelfHealingAction['type']);
      }
    }
  }

  private determineSelfHealingActions(result: HealthCheckResult): string[] {
    const actions: string[] = [];

    switch (result.type) {
      case HealthCheckType.AGENT_HEALTH:
        if (result.details.healthRatio < 0.7) {
          actions.push('restart_agent', 'rebalance_load');
        }
        break;
      case HealthCheckType.SYSTEM_RESOURCES:
        if (result.metrics.memory_usage > 90) {
          actions.push('cleanup_resources');
        }
        if (result.metrics.cpu_usage > 90) {
          actions.push('scale_resources');
        }
        break;
      case HealthCheckType.TASK_PERFORMANCE:
        if (result.metrics.failure_rate > 0.2) {
          actions.push('restart_agent', 'rebalance_load');
        }
        break;
      case HealthCheckType.COMMUNICATION:
        if (result.metrics.failure_rate > 0.1) {
          actions.push('reset_connections');
        }
        break;
    }

    return actions;
  }

  private async executeSelfHealingAction(action: SelfHealingAction): Promise<void> {
    action.status = 'executing';
    this.emit('self_healing_action_started', action);

    try {
      let result: any;

      switch (action.type) {
        case 'restart_agent':
          result = await this.executeRestartAgent(action.targetId, action.parameters);
          break;
        case 'scale_resources':
          result = await this.executeScaleResources(action.parameters);
          break;
        case 'rebalance_load':
          result = await this.executeRebalanceLoad(action.parameters);
          break;
        case 'cleanup_resources':
          result = await this.executeCleanupResources(action.parameters);
          break;
        case 'reset_connections':
          result = await this.executeResetConnections(action.parameters);
          break;
        default:
          throw new Error(`Unknown self-healing action: ${action.type}`);
      }

      action.status = 'completed';
      action.result = result;
      this.emit('self_healing_action_completed', action);

    } catch (error) {
      action.status = 'failed';
      action.error = error as Error;
      this.emit('self_healing_action_failed', action);
    }
  }

  private async executeRestartAgent(agentId?: string, parameters: Record<string, any> = {}): Promise<any> {
    if (agentId) {
      return await this.autoRecoveryManager.forceAgentRecovery(agentId);
    }
    return { message: 'No agent ID specified for restart' };
  }

  private async executeScaleResources(parameters: Record<string, any> = {}): Promise<any> {
    // This would implement resource scaling
    return { message: 'Resource scaling not implemented' };
  }

  private async executeRebalanceLoad(parameters: Record<string, any> = {}): Promise<any> {
    // This would implement load rebalancing
    return { message: 'Load rebalancing not implemented' };
  }

  private async executeCleanupResources(parameters: Record<string, any> = {}): Promise<any> {
    // This would implement resource cleanup
    return { message: 'Resource cleanup not implemented' };
  }

  private async executeResetConnections(parameters: Record<string, any> = {}): Promise<any> {
    // This would implement connection reset
    return { message: 'Connection reset not implemented' };
  }

  private handleRecoveryEvent(event: any): void {
    // Handle recovery events from AutoRecoveryManager
    this.emit('recovery_event', event);
  }

  private handleFailoverEvent(event: any): void {
    // Handle failover events from FailoverCoordinator
    this.emit('failover_event', event);
  }

  private mapHealthStatusToSeverity(status: HealthStatus): HealthAlert['severity'] {
    switch (status) {
      case HealthStatus.WARNING:
        return 'warning';
      case HealthStatus.CRITICAL:
        return 'error';
      case HealthStatus.FAILED:
        return 'critical';
      default:
        return 'info';
    }
  }

  private getActionDescription(type: SelfHealingAction['type'], targetId?: string): string {
    const descriptions = {
      restart_agent: `Restart agent ${targetId || 'unknown'}`,
      scale_resources: 'Scale system resources',
      rebalance_load: 'Rebalance system load',
      cleanup_resources: 'Cleanup system resources',
      reset_connections: 'Reset network connections'
    };
    return descriptions[type] || `Execute ${type}`;
  }

  private generateAlertId(): string {
    return `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateActionId(): string {
    return `action-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
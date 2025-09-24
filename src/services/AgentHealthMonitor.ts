/**
 * Agent Health Monitor
 * Monitors agent health, detects failures, and handles recovery
 */

import { EventEmitter } from 'events';
import { IAgent } from '../core/interfaces/IAgent';
import { Agent, AgentStatus } from '../types/agent.types';

export interface HealthCheckConfig {
  interval: number;
  timeout: number;
  retryAttempts: number;
  retryDelay: number;
  failureThreshold: number;
  recoveryThreshold: number;
}

export interface AgentHealthMetrics {
  agentId: string;
  isHealthy: boolean;
  lastCheckTime: Date;
  responseTime: number;
  errorCount: number;
  consecutiveFailures: number;
  consecutiveSuccesses: number;
  uptime: number;
  lastError?: Error;
  healthScore: number;
  status: AgentStatus;
}

export interface HealthCheckResult {
  agentId: string;
  success: boolean;
  responseTime: number;
  timestamp: Date;
  error?: Error;
  details?: Record<string, any>;
}

export interface RecoveryAction {
  type: RecoveryActionType;
  agentId: string;
  timestamp: Date;
  parameters?: Record<string, any>;
  result?: RecoveryResult;
}

export enum RecoveryActionType {
  RESTART = 'restart',
  RESET = 'reset',
  ESCALATE = 'escalate',
  ISOLATE = 'isolate',
  REPLACE = 'replace'
}

export interface RecoveryResult {
  success: boolean;
  message: string;
  newAgentId?: string;
  error?: Error;
}

export interface HealthAlert {
  id: string;
  agentId: string;
  severity: AlertSeverity;
  type: AlertType;
  message: string;
  timestamp: Date;
  acknowledged: boolean;
  resolvedAt?: Date;
  metadata?: Record<string, any>;
}

export enum AlertSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export enum AlertType {
  HEALTH_DEGRADED = 'health_degraded',
  AGENT_UNRESPONSIVE = 'agent_unresponsive',
  HIGH_ERROR_RATE = 'high_error_rate',
  PERFORMANCE_DEGRADED = 'performance_degraded',
  RECOVERY_FAILED = 'recovery_failed',
  AGENT_OFFLINE = 'agent_offline'
}

export class AgentHealthMonitor extends EventEmitter {
  private agents: Map<string, IAgent> = new Map();
  private healthMetrics: Map<string, AgentHealthMetrics> = new Map();
  private healthCheckTimers: Map<string, NodeJS.Timeout> = new Map();
  private alerts: Map<string, HealthAlert> = new Map();
  private recoveryActions: RecoveryAction[] = [];
  private config: HealthCheckConfig;
  private isMonitoring: boolean = false;

  constructor(config: Partial<HealthCheckConfig> = {}) {
    super();
    this.config = {
      interval: 30000, // 30 seconds
      timeout: 5000, // 5 seconds
      retryAttempts: 3,
      retryDelay: 1000, // 1 second
      failureThreshold: 3,
      recoveryThreshold: 2,
      ...config
    };
  }

  // Agent registration
  registerAgent(agent: IAgent): void {
    this.agents.set(agent.id, agent);
    
    const metrics: AgentHealthMetrics = {
      agentId: agent.id,
      isHealthy: true,
      lastCheckTime: new Date(),
      responseTime: 0,
      errorCount: 0,
      consecutiveFailures: 0,
      consecutiveSuccesses: 0,
      uptime: 0,
      healthScore: 100,
      status: agent.getStatus()
    };

    this.healthMetrics.set(agent.id, metrics);
    
    if (this.isMonitoring) {
      this.startMonitoringAgent(agent.id);
    }

    this.emit('agentRegistered', { agentId: agent.id });
  }

  unregisterAgent(agentId: string): void {
    this.stopMonitoringAgent(agentId);
    this.agents.delete(agentId);
    this.healthMetrics.delete(agentId);
    
    // Clear any active alerts for this agent
    const agentAlerts = Array.from(this.alerts.values())
      .filter(alert => alert.agentId === agentId);
    
    for (const alert of agentAlerts) {
      this.alerts.delete(alert.id);
    }

    this.emit('agentUnregistered', { agentId });
  }

  // Monitoring control
  startMonitoring(): void {
    if (this.isMonitoring) {
      return;
    }

    this.isMonitoring = true;
    
    for (const agentId of this.agents.keys()) {
      this.startMonitoringAgent(agentId);
    }

    this.emit('monitoringStarted');
  }

  stopMonitoring(): void {
    if (!this.isMonitoring) {
      return;
    }

    this.isMonitoring = false;
    
    for (const agentId of this.agents.keys()) {
      this.stopMonitoringAgent(agentId);
    }

    this.emit('monitoringStopped');
  }

  private startMonitoringAgent(agentId: string): void {
    if (this.healthCheckTimers.has(agentId)) {
      return;
    }

    const timer = setInterval(async () => {
      await this.performHealthCheck(agentId);
    }, this.config.interval);

    this.healthCheckTimers.set(agentId, timer);
    
    // Perform initial health check
    setTimeout(() => this.performHealthCheck(agentId), 0);
  }

  private stopMonitoringAgent(agentId: string): void {
    const timer = this.healthCheckTimers.get(agentId);
    if (timer) {
      clearInterval(timer);
      this.healthCheckTimers.delete(agentId);
    }
  }

  // Health checking
  async performHealthCheck(agentId: string): Promise<HealthCheckResult> {
    const agent = this.agents.get(agentId);
    const metrics = this.healthMetrics.get(agentId);

    if (!agent || !metrics) {
      throw new Error(`Agent ${agentId} not found`);
    }

    const startTime = Date.now();
    let result: HealthCheckResult;

    try {
      // Perform health check with timeout
      const healthCheckPromise = this.checkAgentHealth(agent);
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Health check timeout')), this.config.timeout);
      });

      await Promise.race([healthCheckPromise, timeoutPromise]);

      const responseTime = Date.now() - startTime;
      
      result = {
        agentId,
        success: true,
        responseTime,
        timestamp: new Date(),
        details: {
          status: agent.getStatus(),
          workload: agent.getWorkload()
        }
      };

      this.updateHealthMetrics(agentId, result);
      
    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      result = {
        agentId,
        success: false,
        responseTime,
        timestamp: new Date(),
        error: error as Error
      };

      this.updateHealthMetrics(agentId, result);
      await this.handleHealthCheckFailure(agentId, error as Error);
    }

    this.emit('healthCheckCompleted', result);
    return result;
  }

  private async checkAgentHealth(agent: IAgent): Promise<void> {
    // Check if agent is responsive
    const status = agent.getStatus();
    
    if (status === AgentStatus.ERROR || status === AgentStatus.OFFLINE) {
      throw new Error(`Agent is in ${status} state`);
    }

    // Additional health checks could be added here
    // For example: checking if agent can process a simple task
  }

  private updateHealthMetrics(agentId: string, result: HealthCheckResult): void {
    const metrics = this.healthMetrics.get(agentId);
    if (!metrics) {
      return;
    }

    metrics.lastCheckTime = result.timestamp;
    metrics.responseTime = result.responseTime;

    if (result.success) {
      metrics.consecutiveFailures = 0;
      metrics.consecutiveSuccesses++;
      
      // Update health score positively
      metrics.healthScore = Math.min(100, metrics.healthScore + 2);
      
      // Check if agent has recovered
      if (!metrics.isHealthy && metrics.consecutiveSuccesses >= this.config.recoveryThreshold) {
        metrics.isHealthy = true;
        this.emit('agentRecovered', { agentId, metrics });
        this.resolveAgentAlerts(agentId);
      }
    } else {
      metrics.consecutiveSuccesses = 0;
      metrics.consecutiveFailures++;
      metrics.errorCount++;
      metrics.lastError = result.error;
      
      // Update health score negatively
      metrics.healthScore = Math.max(0, metrics.healthScore - 10);
      
      // Check if agent should be marked as unhealthy
      if (metrics.isHealthy && metrics.consecutiveFailures >= this.config.failureThreshold) {
        metrics.isHealthy = false;
        this.emit('agentUnhealthy', { agentId, metrics });
      }
    }

    // Update uptime
    const agent = this.agents.get(agentId);
    if (agent) {
      metrics.status = agent.getStatus();
    }
  }

  private async handleHealthCheckFailure(agentId: string, error: Error): Promise<void> {
    const metrics = this.healthMetrics.get(agentId);
    if (!metrics) {
      return;
    }

    // Create alert if needed
    await this.createHealthAlert(agentId, error);

    // Attempt recovery if failure threshold is reached
    if (metrics.consecutiveFailures >= this.config.failureThreshold) {
      await this.attemptRecovery(agentId);
    }
  }

  // Recovery mechanisms
  async attemptRecovery(agentId: string): Promise<RecoveryResult> {
    const agent = this.agents.get(agentId);
    const metrics = this.healthMetrics.get(agentId);

    if (!agent || !metrics) {
      throw new Error(`Agent ${agentId} not found`);
    }

    // Determine recovery strategy based on failure pattern
    const recoveryType = this.determineRecoveryStrategy(metrics);
    
    const recoveryAction: RecoveryAction = {
      type: recoveryType,
      agentId,
      timestamp: new Date()
    };

    try {
      let result: RecoveryResult;

      switch (recoveryType) {
        case RecoveryActionType.RESTART:
          result = await this.restartAgent(agentId);
          break;
        case RecoveryActionType.RESET:
          result = await this.resetAgent(agentId);
          break;
        case RecoveryActionType.ISOLATE:
          result = await this.isolateAgent(agentId);
          break;
        case RecoveryActionType.ESCALATE:
          result = await this.escalateIssue(agentId);
          break;
        case RecoveryActionType.REPLACE:
          result = await this.replaceAgent(agentId);
          break;
        default:
          result = {
            success: false,
            message: `Unknown recovery type: ${recoveryType}`
          };
      }

      recoveryAction.result = result;
      this.recoveryActions.push(recoveryAction);

      this.emit('recoveryAttempted', recoveryAction);

      if (result.success) {
        // Reset failure counters on successful recovery
        metrics.consecutiveFailures = 0;
        metrics.errorCount = 0;
        this.emit('recoverySuccessful', { agentId, recoveryAction });
      } else {
        this.emit('recoveryFailed', { agentId, recoveryAction });
        await this.createRecoveryFailureAlert(agentId, recoveryAction);
      }

      return result;

    } catch (error) {
      const result: RecoveryResult = {
        success: false,
        message: `Recovery failed: ${(error as Error).message}`,
        error: error as Error
      };

      recoveryAction.result = result;
      this.recoveryActions.push(recoveryAction);

      this.emit('recoveryFailed', { agentId, recoveryAction });
      await this.createRecoveryFailureAlert(agentId, recoveryAction);

      return result;
    }
  }

  private determineRecoveryStrategy(metrics: AgentHealthMetrics): RecoveryActionType {
    // Simple strategy based on failure count and health score
    if (metrics.consecutiveFailures < 5) {
      return RecoveryActionType.RESTART;
    } else if (metrics.consecutiveFailures < 10) {
      return RecoveryActionType.RESET;
    } else if (metrics.healthScore < 20) {
      return RecoveryActionType.REPLACE;
    } else {
      return RecoveryActionType.ESCALATE;
    }
  }

  private async restartAgent(agentId: string): Promise<RecoveryResult> {
    // This would typically involve restarting the agent process
    // For now, we'll simulate a restart
    return {
      success: true,
      message: `Agent ${agentId} restarted successfully`
    };
  }

  private async resetAgent(agentId: string): Promise<RecoveryResult> {
    // This would typically involve resetting agent state
    return {
      success: true,
      message: `Agent ${agentId} reset successfully`
    };
  }

  private async isolateAgent(agentId: string): Promise<RecoveryResult> {
    // This would typically involve isolating the agent from the system
    return {
      success: true,
      message: `Agent ${agentId} isolated successfully`
    };
  }

  private async escalateIssue(agentId: string): Promise<RecoveryResult> {
    // This would typically involve notifying administrators
    return {
      success: true,
      message: `Issue with agent ${agentId} escalated to administrators`
    };
  }

  private async replaceAgent(agentId: string): Promise<RecoveryResult> {
    // This would typically involve creating a new agent to replace the failed one
    const newAgentId = `${agentId}-replacement-${Date.now()}`;
    return {
      success: true,
      message: `Agent ${agentId} replaced with ${newAgentId}`,
      newAgentId
    };
  }

  // Alert management
  private async createHealthAlert(agentId: string, error: Error): Promise<void> {
    const metrics = this.healthMetrics.get(agentId);
    if (!metrics) {
      return;
    }

    let alertType: AlertType;
    let severity: AlertSeverity;

    if (metrics.consecutiveFailures >= this.config.failureThreshold) {
      alertType = AlertType.AGENT_UNRESPONSIVE;
      severity = AlertSeverity.HIGH;
    } else if (metrics.errorCount > 10) {
      alertType = AlertType.HIGH_ERROR_RATE;
      severity = AlertSeverity.MEDIUM;
    } else {
      alertType = AlertType.HEALTH_DEGRADED;
      severity = AlertSeverity.LOW;
    }

    const alert: HealthAlert = {
      id: this.generateAlertId(),
      agentId,
      severity,
      type: alertType,
      message: `Agent health issue: ${error.message}`,
      timestamp: new Date(),
      acknowledged: false,
      metadata: {
        errorCount: metrics.errorCount,
        consecutiveFailures: metrics.consecutiveFailures,
        healthScore: metrics.healthScore
      }
    };

    this.alerts.set(alert.id, alert);
    this.emit('alertCreated', alert);
  }

  private async createRecoveryFailureAlert(agentId: string, recoveryAction: RecoveryAction): Promise<void> {
    const alert: HealthAlert = {
      id: this.generateAlertId(),
      agentId,
      severity: AlertSeverity.CRITICAL,
      type: AlertType.RECOVERY_FAILED,
      message: `Recovery action failed: ${recoveryAction.result?.message}`,
      timestamp: new Date(),
      acknowledged: false,
      metadata: {
        recoveryType: recoveryAction.type,
        recoveryResult: recoveryAction.result
      }
    };

    this.alerts.set(alert.id, alert);
    this.emit('alertCreated', alert);
  }

  private resolveAgentAlerts(agentId: string): void {
    const agentAlerts = Array.from(this.alerts.values())
      .filter(alert => alert.agentId === agentId && !alert.resolvedAt);

    for (const alert of agentAlerts) {
      alert.resolvedAt = new Date();
      this.emit('alertResolved', alert);
    }
  }

  // Public API methods
  getAgentHealth(agentId: string): AgentHealthMetrics | undefined {
    return this.healthMetrics.get(agentId);
  }

  getAllAgentHealth(): AgentHealthMetrics[] {
    return Array.from(this.healthMetrics.values());
  }

  getHealthyAgents(): AgentHealthMetrics[] {
    return Array.from(this.healthMetrics.values()).filter(metrics => metrics.isHealthy);
  }

  getUnhealthyAgents(): AgentHealthMetrics[] {
    return Array.from(this.healthMetrics.values()).filter(metrics => !metrics.isHealthy);
  }

  getAlerts(agentId?: string): HealthAlert[] {
    const alerts = Array.from(this.alerts.values());
    return agentId ? alerts.filter(alert => alert.agentId === agentId) : alerts;
  }

  acknowledgeAlert(alertId: string): void {
    const alert = this.alerts.get(alertId);
    if (alert) {
      alert.acknowledged = true;
      this.emit('alertAcknowledged', alert);
    }
  }

  getRecoveryHistory(agentId?: string): RecoveryAction[] {
    return agentId 
      ? this.recoveryActions.filter(action => action.agentId === agentId)
      : [...this.recoveryActions];
  }

  getHealthStatistics(): Record<string, any> {
    const allMetrics = Array.from(this.healthMetrics.values());
    const healthyCount = allMetrics.filter(m => m.isHealthy).length;
    const unhealthyCount = allMetrics.length - healthyCount;
    
    const avgHealthScore = allMetrics.length > 0 
      ? allMetrics.reduce((sum, m) => sum + m.healthScore, 0) / allMetrics.length 
      : 0;

    const avgResponseTime = allMetrics.length > 0
      ? allMetrics.reduce((sum, m) => sum + m.responseTime, 0) / allMetrics.length
      : 0;

    return {
      totalAgents: allMetrics.length,
      healthyAgents: healthyCount,
      unhealthyAgents: unhealthyCount,
      averageHealthScore: Math.round(avgHealthScore),
      averageResponseTime: Math.round(avgResponseTime),
      totalAlerts: this.alerts.size,
      activeAlerts: Array.from(this.alerts.values()).filter(a => !a.resolvedAt).length,
      totalRecoveryActions: this.recoveryActions.length
    };
  }

  // Utility methods
  private generateAlertId(): string {
    return `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Cleanup
  async shutdown(): Promise<void> {
    this.stopMonitoring();
    this.agents.clear();
    this.healthMetrics.clear();
    this.alerts.clear();
    this.recoveryActions = [];
  }
}
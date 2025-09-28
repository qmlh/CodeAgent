/**
 * Automatic Recovery Manager
 * Handles agent fault detection, automatic restart, task reassignment, and system self-healing
 */

import { EventEmitter } from 'eventemitter3';
import { ErrorRecoveryManager, ErrorRecoveryEvent } from '../errors/ErrorRecoveryManager';
import { SystemError, AgentError, TaskError } from '../errors/SystemError';
import { ErrorType, ErrorSeverity, ErrorContext, RecoveryResult } from '../../types/error.types';
import { AgentStatus, AgentType } from '../../types/agent.types';
import { TaskStatus } from '../../types/task.types';

/**
 * Agent health metrics
 */
export interface AgentHealthMetrics {
  agentId: string;
  isHealthy: boolean;
  lastHeartbeat: Date;
  consecutiveFailures: number;
  responseTime: number;
  memoryUsage: number;
  cpuUsage: number;
  taskSuccessRate: number;
  lastError?: Error;
}

/**
 * Recovery action types
 */
export enum RecoveryAction {
  RESTART_AGENT = 'restart_agent',
  REASSIGN_TASKS = 'reassign_tasks',
  SCALE_UP = 'scale_up',
  ISOLATE_AGENT = 'isolate_agent',
  SYSTEM_RESTART = 'system_restart',
  MANUAL_INTERVENTION = 'manual_intervention'
}

/**
 * Recovery configuration
 */
export interface AutoRecoveryConfig {
  healthCheckInterval: number;
  maxConsecutiveFailures: number;
  agentRestartTimeout: number;
  taskReassignmentDelay: number;
  systemHealthThreshold: number;
  enableAutoRestart: boolean;
  enableTaskReassignment: boolean;
  enableSystemSelfHealing: boolean;
  maxRecoveryAttempts: number;
  recoveryBackoffMultiplier: number;
}

/**
 * Recovery event types
 */
export interface RecoveryEvent {
  type: 'agent_failure_detected' | 'recovery_started' | 'recovery_completed' | 'recovery_failed' | 'system_unhealthy';
  timestamp: Date;
  agentId?: string;
  action: RecoveryAction;
  details: any;
  success?: boolean;
  error?: Error;
}

/**
 * System health status
 */
export interface SystemHealthStatus {
  overallHealth: number; // 0-100
  healthyAgents: number;
  unhealthyAgents: number;
  totalAgents: number;
  activeRecoveries: number;
  lastHealthCheck: Date;
  criticalIssues: string[];
  warnings: string[];
}

/**
 * Automatic Recovery Manager
 */
export class AutoRecoveryManager extends EventEmitter {
  private config: AutoRecoveryConfig;
  private errorRecoveryManager: ErrorRecoveryManager;
  private agentHealthMetrics: Map<string, AgentHealthMetrics> = new Map();
  private recoveryAttempts: Map<string, number> = new Map();
  private activeRecoveries: Set<string> = new Set();
  private healthCheckTimer?: NodeJS.Timeout;
  private systemHealthStatus: SystemHealthStatus;
  
  // Dependencies - these would be injected in a real system
  private agentManager: any; // IAgentManager
  private taskManager: any; // ITaskManager
  private coordinationManager: any; // ICoordinationManager

  constructor(
    config: Partial<AutoRecoveryConfig> = {},
    dependencies: {
      agentManager: any;
      taskManager: any;
      coordinationManager: any;
    }
  ) {
    super();
    
    this.config = {
      healthCheckInterval: 30000, // 30 seconds
      maxConsecutiveFailures: 3,
      agentRestartTimeout: 60000, // 1 minute
      taskReassignmentDelay: 5000, // 5 seconds
      systemHealthThreshold: 70, // 70%
      enableAutoRestart: true,
      enableTaskReassignment: true,
      enableSystemSelfHealing: true,
      maxRecoveryAttempts: 3,
      recoveryBackoffMultiplier: 2,
      ...config
    };

    this.agentManager = dependencies.agentManager;
    this.taskManager = dependencies.taskManager;
    this.coordinationManager = dependencies.coordinationManager;

    this.errorRecoveryManager = new ErrorRecoveryManager({
      enableAutoRecovery: true,
      maxRetryAttempts: this.config.maxRecoveryAttempts
    });

    this.systemHealthStatus = {
      overallHealth: 100,
      healthyAgents: 0,
      unhealthyAgents: 0,
      totalAgents: 0,
      activeRecoveries: 0,
      lastHealthCheck: new Date(),
      criticalIssues: [],
      warnings: []
    };

    this.setupEventHandlers();
    this.startHealthMonitoring();
  }

  async initialize(): Promise<void> {
    // Initialize recovery manager components
    this.agentHealthMetrics.clear();
    this.recoveryAttempts.clear();
    this.activeRecoveries.clear();
    
    // Reset system health status
    this.systemHealthStatus = {
      overallHealth: 100,
      healthyAgents: 0,
      unhealthyAgents: 0,
      totalAgents: 0,
      activeRecoveries: 0,
      lastHealthCheck: new Date(),
      criticalIssues: [],
      warnings: []
    };
    
    // Error recovery manager is initialized in constructor
  }

  /**
   * Register an agent for health monitoring
   */
  registerAgent(agentId: string): void {
    this.agentHealthMetrics.set(agentId, {
      agentId,
      isHealthy: true,
      lastHeartbeat: new Date(),
      consecutiveFailures: 0,
      responseTime: 0,
      memoryUsage: 0,
      cpuUsage: 0,
      taskSuccessRate: 1.0
    });
  }

  /**
   * Unregister an agent from health monitoring
   */
  unregisterAgent(agentId: string): void {
    this.agentHealthMetrics.delete(agentId);
    this.recoveryAttempts.delete(agentId);
    this.activeRecoveries.delete(agentId);
  }

  /**
   * Update agent health metrics
   */
  updateAgentHealth(agentId: string, metrics: Partial<AgentHealthMetrics>): void {
    const current = this.agentHealthMetrics.get(agentId);
    if (current) {
      Object.assign(current, metrics, { lastHeartbeat: new Date() });
    }
  }

  /**
   * Report agent failure
   */
  async reportAgentFailure(agentId: string, error: Error): Promise<void> {
    const metrics = this.agentHealthMetrics.get(agentId);
    if (!metrics) {
      return;
    }

    metrics.isHealthy = false;
    metrics.consecutiveFailures++;
    metrics.lastError = error;

    this.emit('recovery', {
      type: 'agent_failure_detected',
      timestamp: new Date(),
      agentId,
      action: RecoveryAction.RESTART_AGENT,
      details: { error: error.message, failures: metrics.consecutiveFailures }
    });

    // Trigger recovery if threshold exceeded
    if (metrics.consecutiveFailures >= this.config.maxConsecutiveFailures) {
      await this.initiateAgentRecovery(agentId, error);
    }
  }

  /**
   * Perform system health check
   */
  async performSystemHealthCheck(): Promise<SystemHealthStatus> {
    const healthyAgents: string[] = [];
    const unhealthyAgents: string[] = [];
    const criticalIssues: string[] = [];
    const warnings: string[] = [];

    // Check each agent's health
    for (const [agentId, metrics] of this.agentHealthMetrics.entries()) {
      try {
        const isHealthy = await this.checkAgentHealth(agentId);
        if (isHealthy) {
          healthyAgents.push(agentId);
          metrics.consecutiveFailures = 0;
        } else {
          unhealthyAgents.push(agentId);
          metrics.consecutiveFailures++;
          
          if (metrics.consecutiveFailures >= this.config.maxConsecutiveFailures) {
            criticalIssues.push(`Agent ${agentId} has failed ${metrics.consecutiveFailures} consecutive health checks`);
          } else {
            warnings.push(`Agent ${agentId} failed health check (${metrics.consecutiveFailures}/${this.config.maxConsecutiveFailures})`);
          }
        }
      } catch (error) {
        unhealthyAgents.push(agentId);
        criticalIssues.push(`Failed to check health of agent ${agentId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    // Calculate overall system health
    const totalAgents = this.agentHealthMetrics.size;
    const overallHealth = totalAgents > 0 ? (healthyAgents.length / totalAgents) * 100 : 100;

    this.systemHealthStatus = {
      overallHealth,
      healthyAgents: healthyAgents.length,
      unhealthyAgents: unhealthyAgents.length,
      totalAgents,
      activeRecoveries: this.activeRecoveries.size,
      lastHealthCheck: new Date(),
      criticalIssues,
      warnings
    };

    // Trigger system-level recovery if health is below threshold
    if (overallHealth < this.config.systemHealthThreshold && this.config.enableSystemSelfHealing) {
      await this.initiateSystemRecovery();
    }

    return this.systemHealthStatus;
  }

  /**
   * Get current system health status
   */
  getSystemHealthStatus(): SystemHealthStatus {
    return { ...this.systemHealthStatus };
  }

  /**
   * Get agent health metrics
   */
  getAgentHealthMetrics(agentId?: string): AgentHealthMetrics | AgentHealthMetrics[] {
    if (agentId) {
      const metrics = this.agentHealthMetrics.get(agentId);
      return metrics ? { ...metrics } : null as any;
    }
    return Array.from(this.agentHealthMetrics.values()).map(m => ({ ...m }));
  }

  /**
   * Force recovery of a specific agent
   */
  async forceAgentRecovery(agentId: string): Promise<RecoveryResult> {
    const error = new AgentError(`Manual recovery initiated for agent ${agentId}`, agentId);
    return await this.initiateAgentRecovery(agentId, error);
  }

  /**
   * Enable or disable automatic recovery
   */
  setAutoRecoveryEnabled(enabled: boolean): void {
    this.config.enableAutoRestart = enabled;
    this.config.enableTaskReassignment = enabled;
    this.config.enableSystemSelfHealing = enabled;
  }

  /**
   * Update recovery configuration
   */
  updateConfig(newConfig: Partial<AutoRecoveryConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Shutdown the recovery manager
   */
  async shutdown(): Promise<void> {
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
      this.healthCheckTimer = undefined;
    }

    // Wait for active recoveries to complete
    const activeRecoveryPromises = Array.from(this.activeRecoveries).map(agentId =>
      this.waitForRecoveryCompletion(agentId, 30000) // 30 second timeout
    );

    await Promise.allSettled(activeRecoveryPromises);
    this.removeAllListeners();
  }

  // Private methods

  private setupEventHandlers(): void {
    // Listen to error recovery events
    this.errorRecoveryManager.addEventListener((event: ErrorRecoveryEvent) => {
      this.handleErrorRecoveryEvent(event);
    });
  }

  private startHealthMonitoring(): void {
    this.healthCheckTimer = setInterval(async () => {
      try {
        await this.performSystemHealthCheck();
      } catch (error) {
        console.error('Error during system health check:', error);
      }
    }, this.config.healthCheckInterval);
  }

  private async checkAgentHealth(agentId: string): Promise<boolean> {
    try {
      // This would call the actual agent's health check method
      // For now, we'll simulate based on metrics
      const metrics = this.agentHealthMetrics.get(agentId);
      if (!metrics) {
        return false;
      }

      // Check if agent has responded recently
      const timeSinceLastHeartbeat = Date.now() - metrics.lastHeartbeat.getTime();
      if (timeSinceLastHeartbeat > this.config.healthCheckInterval * 2) {
        return false;
      }

      // Check task success rate
      if (metrics.taskSuccessRate < 0.5) {
        return false;
      }

      // Check resource usage
      if (metrics.memoryUsage > 90 || metrics.cpuUsage > 95) {
        return false;
      }

      return true;
    } catch (error) {
      return false;
    }
  }

  private async initiateAgentRecovery(agentId: string, error: Error): Promise<RecoveryResult> {
    if (this.activeRecoveries.has(agentId)) {
      return {
        success: false,
        action: 'recovery_already_in_progress',
        message: `Recovery already in progress for agent ${agentId}`
      };
    }

    this.activeRecoveries.add(agentId);
    const attempts = this.recoveryAttempts.get(agentId) || 0;

    this.emit('recovery', {
      type: 'recovery_started',
      timestamp: new Date(),
      agentId,
      action: RecoveryAction.RESTART_AGENT,
      details: { attempt: attempts + 1, maxAttempts: this.config.maxRecoveryAttempts }
    });

    try {
      let result: RecoveryResult;

      if (attempts < this.config.maxRecoveryAttempts) {
        // Try automatic recovery
        result = await this.performAgentRecovery(agentId, error);
        this.recoveryAttempts.set(agentId, attempts + 1);
      } else {
        // Max attempts reached, escalate
        result = {
          success: false,
          action: RecoveryAction.MANUAL_INTERVENTION,
          message: `Maximum recovery attempts (${this.config.maxRecoveryAttempts}) reached for agent ${agentId}`
        };
      }

      this.emit('recovery', {
        type: result.success ? 'recovery_completed' : 'recovery_failed',
        timestamp: new Date(),
        agentId,
        action: RecoveryAction.RESTART_AGENT,
        details: result,
        success: result.success
      });

      if (result.success) {
        this.recoveryAttempts.delete(agentId);
        const metrics = this.agentHealthMetrics.get(agentId);
        if (metrics) {
          metrics.isHealthy = true;
          metrics.consecutiveFailures = 0;
        }
      }

      return result;
    } catch (recoveryError) {
      const result: RecoveryResult = {
        success: false,
        action: 'recovery_exception',
        message: `Recovery failed with exception: ${recoveryError instanceof Error ? recoveryError.message : 'Unknown error'}`
      };

      this.emit('recovery', {
        type: 'recovery_failed',
        timestamp: new Date(),
        agentId,
        action: RecoveryAction.RESTART_AGENT,
        details: result,
        success: false,
        error: recoveryError as Error
      });

      return result;
    } finally {
      this.activeRecoveries.delete(agentId);
    }
  }

  private async performAgentRecovery(agentId: string, error: Error): Promise<RecoveryResult> {
    const steps: Array<() => Promise<RecoveryResult>> = [];

    // Step 1: Try to restart the agent
    if (this.config.enableAutoRestart) {
      steps.push(() => this.restartAgent(agentId));
    }

    // Step 2: Reassign tasks if restart fails
    if (this.config.enableTaskReassignment) {
      steps.push(() => this.reassignAgentTasks(agentId));
    }

    // Step 3: Isolate agent if all else fails
    steps.push(() => this.isolateAgent(agentId));

    // Execute recovery steps
    for (const step of steps) {
      try {
        const result = await step();
        if (result.success) {
          return result;
        }
      } catch (stepError) {
        console.error('Recovery step failed:', stepError);
      }
    }

    return {
      success: false,
      action: RecoveryAction.MANUAL_INTERVENTION,
      message: `All recovery steps failed for agent ${agentId}`
    };
  }

  private async restartAgent(agentId: string): Promise<RecoveryResult> {
    try {
      // This would call the coordination manager to restart the agent
      // await this.coordinationManager.restartAgent(agentId);
      
      // Simulate restart process
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return {
        success: true,
        action: RecoveryAction.RESTART_AGENT,
        message: `Successfully restarted agent ${agentId}`
      };
    } catch (error) {
      return {
        success: false,
        action: RecoveryAction.RESTART_AGENT,
        message: `Failed to restart agent ${agentId}: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  private async reassignAgentTasks(agentId: string): Promise<RecoveryResult> {
    try {
      // Get tasks assigned to the failed agent
      // const tasks = await this.taskManager.getTaskQueue(agentId);
      
      // Simulate task reassignment
      await new Promise(resolve => setTimeout(resolve, this.config.taskReassignmentDelay));
      
      return {
        success: true,
        action: RecoveryAction.REASSIGN_TASKS,
        message: `Successfully reassigned tasks from agent ${agentId}`
      };
    } catch (error) {
      return {
        success: false,
        action: RecoveryAction.REASSIGN_TASKS,
        message: `Failed to reassign tasks from agent ${agentId}: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  private async isolateAgent(agentId: string): Promise<RecoveryResult> {
    try {
      // Remove agent from active pool
      // await this.coordinationManager.isolateAgent(agentId);
      
      return {
        success: true,
        action: RecoveryAction.ISOLATE_AGENT,
        message: `Successfully isolated agent ${agentId}`
      };
    } catch (error) {
      return {
        success: false,
        action: RecoveryAction.ISOLATE_AGENT,
        message: `Failed to isolate agent ${agentId}: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  private async initiateSystemRecovery(): Promise<void> {
    this.emit('recovery', {
      type: 'system_unhealthy',
      timestamp: new Date(),
      action: RecoveryAction.SYSTEM_RESTART,
      details: {
        overallHealth: this.systemHealthStatus.overallHealth,
        threshold: this.config.systemHealthThreshold
      }
    });

    // Implement system-level recovery strategies
    // This could include scaling up healthy agents, rebalancing workloads, etc.
  }

  private handleErrorRecoveryEvent(event: ErrorRecoveryEvent): void {
    // Forward error recovery events as recovery events
    this.emit('recovery', {
      type: event.type === 'recovery_succeeded' ? 'recovery_completed' : 'recovery_failed',
      timestamp: event.timestamp,
      agentId: event.error.agentId,
      action: RecoveryAction.RESTART_AGENT,
      details: event.result,
      success: event.type === 'recovery_succeeded'
    });
  }

  private async waitForRecoveryCompletion(agentId: string, timeout: number): Promise<void> {
    return new Promise((resolve) => {
      const startTime = Date.now();
      const checkInterval = setInterval(() => {
        if (!this.activeRecoveries.has(agentId) || Date.now() - startTime > timeout) {
          clearInterval(checkInterval);
          resolve();
        }
      }, 1000);
    });
  }
}
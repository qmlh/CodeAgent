/**
 * Failover Coordinator
 * Handles task reassignment, state recovery, and system failover scenarios
 */

import { EventEmitter } from 'eventemitter3';
import { Task, TaskStatus, TaskResult } from '../../types/task.types';
import { Agent, AgentStatus, AgentType } from '../../types/agent.types';
import { SystemError, TaskError, AgentError } from '../errors/SystemError';
import { ErrorType, ErrorSeverity } from '../../types/error.types';

/**
 * Failover strategy types
 */
export enum FailoverStrategy {
  IMMEDIATE = 'immediate',
  GRACEFUL = 'graceful',
  DELAYED = 'delayed',
  MANUAL = 'manual'
}

/**
 * Task reassignment criteria
 */
export interface TaskReassignmentCriteria {
  agentType?: AgentType;
  minCapabilities?: string[];
  maxWorkload?: number;
  excludeAgents?: string[];
  prioritizeBy?: 'workload' | 'success_rate' | 'response_time';
}

/**
 * Failover configuration
 */
export interface FailoverConfig {
  strategy: FailoverStrategy;
  gracefulShutdownTimeout: number;
  taskReassignmentTimeout: number;
  stateBackupInterval: number;
  maxReassignmentAttempts: number;
  enableStateRecovery: boolean;
  enableTaskCheckpointing: boolean;
}

/**
 * Agent state snapshot
 */
export interface AgentStateSnapshot {
  agentId: string;
  timestamp: Date;
  status: AgentStatus;
  activeTasks: Task[];
  completedTasks: TaskResult[];
  workload: number;
  configuration: any;
  resources: string[];
}

/**
 * Task checkpoint
 */
export interface TaskCheckpoint {
  taskId: string;
  agentId: string;
  timestamp: Date;
  progress: number;
  intermediateResults: any;
  nextSteps: string[];
  rollbackData: any;
}

/**
 * Failover event
 */
export interface FailoverEvent {
  type: 'failover_initiated' | 'task_reassigned' | 'state_recovered' | 'failover_completed' | 'failover_failed';
  timestamp: Date;
  agentId: string;
  affectedTasks: string[];
  newAgentId?: string;
  details: any;
  success?: boolean;
  error?: Error;
}

/**
 * Failover Coordinator
 */
export class FailoverCoordinator extends EventEmitter {
  private config: FailoverConfig;
  private agentStateSnapshots: Map<string, AgentStateSnapshot> = new Map();
  private taskCheckpoints: Map<string, TaskCheckpoint> = new Map();
  private activeFailovers: Set<string> = new Set();
  private stateBackupTimer?: NodeJS.Timeout;
  
  // Dependencies
  private taskManager: any;
  private agentManager: any;
  private coordinationManager: any;

  constructor(
    config: Partial<FailoverConfig> = {},
    dependencies: {
      taskManager: any;
      agentManager: any;
      coordinationManager: any;
    }
  ) {
    super();
    
    this.config = {
      strategy: FailoverStrategy.GRACEFUL,
      gracefulShutdownTimeout: 30000, // 30 seconds
      taskReassignmentTimeout: 10000, // 10 seconds
      stateBackupInterval: 60000, // 1 minute
      maxReassignmentAttempts: 3,
      enableStateRecovery: true,
      enableTaskCheckpointing: true,
      ...config
    };

    this.taskManager = dependencies.taskManager;
    this.agentManager = dependencies.agentManager;
    this.coordinationManager = dependencies.coordinationManager;

    if (this.config.enableStateRecovery) {
      this.startStateBackup();
    }
  }

  async initialize(): Promise<void> {
    // Initialize failover coordinator components
    this.agentStateSnapshots.clear();
    this.taskCheckpoints.clear();
    this.activeFailovers.clear();
    
    // Restart state backup if enabled
    if (this.config.enableStateRecovery) {
      this.stopStateBackup();
      this.startStateBackup();
    }
  }

  /**
   * Initiate failover for a failed agent
   */
  async initiateFailover(agentId: string, reason: string): Promise<void> {
    if (this.activeFailovers.has(agentId)) {
      throw new AgentError(`Failover already in progress for agent ${agentId}`, agentId);
    }

    this.activeFailovers.add(agentId);

    this.emit('failover', {
      type: 'failover_initiated',
      timestamp: new Date(),
      agentId,
      affectedTasks: [],
      details: { reason, strategy: this.config.strategy }
    });

    try {
      // Get agent's current state
      const agentState = await this.captureAgentState(agentId);
      const affectedTasks = agentState.activeTasks.map(t => t.id);

      // Execute failover based on strategy
      switch (this.config.strategy) {
        case FailoverStrategy.IMMEDIATE:
          await this.executeImmediateFailover(agentId, agentState);
          break;
        case FailoverStrategy.GRACEFUL:
          await this.executeGracefulFailover(agentId, agentState);
          break;
        case FailoverStrategy.DELAYED:
          await this.executeDelayedFailover(agentId, agentState);
          break;
        case FailoverStrategy.MANUAL:
          await this.prepareManualFailover(agentId, agentState);
          break;
      }

      this.emit('failover', {
        type: 'failover_completed',
        timestamp: new Date(),
        agentId,
        affectedTasks,
        details: { strategy: this.config.strategy },
        success: true
      });

    } catch (error) {
      this.emit('failover', {
        type: 'failover_failed',
        timestamp: new Date(),
        agentId,
        affectedTasks: [],
        details: { reason, strategy: this.config.strategy },
        success: false,
        error: error as Error
      });
      throw error;
    } finally {
      this.activeFailovers.delete(agentId);
    }
  }

  /**
   * Reassign tasks from a failed agent to healthy agents
   */
  async reassignTasks(
    tasks: Task[],
    failedAgentId: string,
    criteria: TaskReassignmentCriteria = {}
  ): Promise<Map<string, string>> {
    const reassignments = new Map<string, string>(); // taskId -> newAgentId
    const availableAgents = await this.getAvailableAgents(criteria);

    if (availableAgents.length === 0) {
      throw new SystemError(
        'No available agents for task reassignment',
        ErrorType.AGENT_ERROR,
        ErrorSeverity.HIGH,
        true,
        { agentId: failedAgentId }
      );
    }

    for (const task of tasks) {
      try {
        const newAgent = await this.selectBestAgentForTask(task, availableAgents, criteria);
        if (newAgent) {
          await this.reassignTask(task, failedAgentId, newAgent.id);
          reassignments.set(task.id, newAgent.id);

          this.emit('failover', {
            type: 'task_reassigned',
            timestamp: new Date(),
            agentId: failedAgentId,
            newAgentId: newAgent.id,
            affectedTasks: [task.id],
            details: { task: task.title, reason: 'agent_failure' }
          });
        }
      } catch (error) {
        console.error(`Failed to reassign task ${task.id}:`, error);
        // Mark task as failed if reassignment fails
        await this.markTaskAsFailed(task.id, `Reassignment failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return reassignments;
  }

  /**
   * Recover agent state from snapshot
   */
  async recoverAgentState(agentId: string, targetAgentId?: string): Promise<void> {
    const snapshot = this.agentStateSnapshots.get(agentId);
    if (!snapshot) {
      throw new AgentError(`No state snapshot found for agent ${agentId}`, agentId);
    }

    const recoveryAgentId = targetAgentId || agentId;

    try {
      // Restore agent configuration
      if (this.config.enableStateRecovery) {
        await this.restoreAgentConfiguration(recoveryAgentId, snapshot);
      }

      // Restore task checkpoints
      if (this.config.enableTaskCheckpointing) {
        await this.restoreTaskCheckpoints(agentId, recoveryAgentId);
      }

      this.emit('failover', {
        type: 'state_recovered',
        timestamp: new Date(),
        agentId,
        newAgentId: recoveryAgentId,
        affectedTasks: snapshot.activeTasks.map(t => t.id),
        details: { snapshotTimestamp: snapshot.timestamp }
      });

    } catch (error) {
      throw new SystemError(
        `Failed to recover agent state: ${error instanceof Error ? error.message : 'Unknown error'}`,
        ErrorType.AGENT_ERROR,
        ErrorSeverity.HIGH,
        true,
        { agentId, metadata: { targetAgentId } }
      );
    }
  }

  /**
   * Create a checkpoint for a task
   */
  async createTaskCheckpoint(
    taskId: string,
    agentId: string,
    progress: number,
    intermediateResults: any,
    nextSteps: string[] = []
  ): Promise<void> {
    const checkpoint: TaskCheckpoint = {
      taskId,
      agentId,
      timestamp: new Date(),
      progress,
      intermediateResults,
      nextSteps,
      rollbackData: await this.captureRollbackData(taskId)
    };

    this.taskCheckpoints.set(taskId, checkpoint);
  }

  /**
   * Get task checkpoint
   */
  getTaskCheckpoint(taskId: string): TaskCheckpoint | undefined {
    return this.taskCheckpoints.get(taskId);
  }

  /**
   * Get agent state snapshot
   */
  getAgentStateSnapshot(agentId: string): AgentStateSnapshot | undefined {
    return this.agentStateSnapshots.get(agentId);
  }

  /**
   * Get active failovers
   */
  getActiveFailovers(): string[] {
    return Array.from(this.activeFailovers);
  }

  /**
   * Update failover configuration
   */
  updateConfig(newConfig: Partial<FailoverConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    // Restart state backup if interval changed
    if (newConfig.stateBackupInterval && this.stateBackupTimer) {
      this.stopStateBackup();
      this.startStateBackup();
    }
  }

  /**
   * Shutdown the failover coordinator
   */
  async shutdown(): Promise<void> {
    this.stopStateBackup();
    
    // Wait for active failovers to complete
    const activeFailoverPromises = Array.from(this.activeFailovers).map(agentId =>
      this.waitForFailoverCompletion(agentId, 30000)
    );

    await Promise.allSettled(activeFailoverPromises);
    this.removeAllListeners();
  }

  // Private methods

  private startStateBackup(): void {
    this.stateBackupTimer = setInterval(async () => {
      try {
        await this.backupAllAgentStates();
      } catch (error) {
        console.error('Error during state backup:', error);
      }
    }, this.config.stateBackupInterval);
  }

  private stopStateBackup(): void {
    if (this.stateBackupTimer) {
      clearInterval(this.stateBackupTimer);
      this.stateBackupTimer = undefined;
    }
  }

  private async backupAllAgentStates(): Promise<void> {
    // This would get all active agents from the agent manager
    // const agents = await this.agentManager.getAllAgents();
    
    // For now, simulate backing up known agents
    for (const agentId of this.agentStateSnapshots.keys()) {
      try {
        const state = await this.captureAgentState(agentId);
        this.agentStateSnapshots.set(agentId, state);
      } catch (error) {
        console.error(`Failed to backup state for agent ${agentId}:`, error);
      }
    }
  }

  private async captureAgentState(agentId: string): Promise<AgentStateSnapshot> {
    // This would capture the actual agent state
    // For now, return a mock state
    return {
      agentId,
      timestamp: new Date(),
      status: AgentStatus.WORKING,
      activeTasks: [],
      completedTasks: [],
      workload: 0,
      configuration: {},
      resources: []
    };
  }

  private async executeImmediateFailover(agentId: string, agentState: AgentStateSnapshot): Promise<void> {
    // Immediately reassign all tasks
    if (agentState.activeTasks.length > 0) {
      await this.reassignTasks(agentState.activeTasks, agentId);
    }

    // Mark agent as offline
    await this.markAgentOffline(agentId);
  }

  private async executeGracefulFailover(agentId: string, agentState: AgentStateSnapshot): Promise<void> {
    // Try to let agent complete current tasks
    const gracefulTimeout = setTimeout(async () => {
      // Force immediate failover if graceful timeout exceeded
      await this.executeImmediateFailover(agentId, agentState);
    }, this.config.gracefulShutdownTimeout);

    try {
      // Wait for agent to complete current tasks or timeout
      await this.waitForTaskCompletion(agentId, this.config.gracefulShutdownTimeout);
      clearTimeout(gracefulTimeout);
    } catch (error) {
      // Graceful shutdown failed, proceed with immediate failover
      clearTimeout(gracefulTimeout);
      await this.executeImmediateFailover(agentId, agentState);
    }
  }

  private async executeDelayedFailover(agentId: string, agentState: AgentStateSnapshot): Promise<void> {
    // Mark agent as unhealthy but don't immediately reassign tasks
    await this.markAgentUnhealthy(agentId);
    
    // Schedule reassignment after delay
    setTimeout(async () => {
      if (this.activeFailovers.has(agentId)) {
        await this.executeImmediateFailover(agentId, agentState);
      }
    }, this.config.taskReassignmentTimeout);
  }

  private async prepareManualFailover(agentId: string, agentState: AgentStateSnapshot): Promise<void> {
    // Mark agent as requiring manual intervention
    await this.markAgentForManualIntervention(agentId);
    
    // Emit event for manual handling
    this.emit('manual_intervention_required', {
      agentId,
      agentState,
      reason: 'Manual failover strategy selected'
    });
  }

  private async getAvailableAgents(criteria: TaskReassignmentCriteria): Promise<Agent[]> {
    // This would get available agents from the agent manager
    // For now, return mock agents
    return [];
  }

  private async selectBestAgentForTask(
    task: Task,
    availableAgents: Agent[],
    criteria: TaskReassignmentCriteria
  ): Promise<Agent | null> {
    if (availableAgents.length === 0) {
      return null;
    }

    // Filter agents based on criteria
    let candidates = availableAgents.filter(agent => {
      // Check agent type
      if (criteria.agentType && agent.type !== criteria.agentType) {
        return false;
      }

      // Check capabilities
      if (criteria.minCapabilities) {
        const hasAllCapabilities = criteria.minCapabilities.every(cap =>
          agent.capabilities.includes(cap)
        );
        if (!hasAllCapabilities) {
          return false;
        }
      }

      // Check workload
      if (criteria.maxWorkload && agent.workload > criteria.maxWorkload) {
        return false;
      }

      // Check exclusions
      if (criteria.excludeAgents && criteria.excludeAgents.includes(agent.id)) {
        return false;
      }

      return true;
    });

    if (candidates.length === 0) {
      return null;
    }

    // Sort by priority criteria
    if (criteria.prioritizeBy) {
      candidates.sort((a, b) => {
        switch (criteria.prioritizeBy) {
          case 'workload':
            return a.workload - b.workload;
          case 'success_rate':
            // Would calculate success rate from agent statistics
            return 0;
          case 'response_time':
            // Would use response time metrics
            return 0;
          default:
            return 0;
        }
      });
    }

    return candidates[0];
  }

  private async reassignTask(task: Task, oldAgentId: string, newAgentId: string): Promise<void> {
    // Update task assignment
    task.assignedAgent = newAgentId;
    
    // This would call the task manager to reassign the task
    // await this.taskManager.reassignTask(task.id, newAgentId);
  }

  private async markTaskAsFailed(taskId: string, reason: string): Promise<void> {
    // This would update the task status to failed
    // await this.taskManager.updateTaskStatus(taskId, TaskStatus.FAILED);
  }

  private async restoreAgentConfiguration(agentId: string, snapshot: AgentStateSnapshot): Promise<void> {
    // This would restore the agent's configuration
    // await this.agentManager.updateAgentConfig(agentId, snapshot.configuration);
  }

  private async restoreTaskCheckpoints(oldAgentId: string, newAgentId: string): Promise<void> {
    // Find checkpoints for the old agent
    const checkpoints = Array.from(this.taskCheckpoints.values())
      .filter(cp => cp.agentId === oldAgentId);

    for (const checkpoint of checkpoints) {
      try {
        // Restore task from checkpoint
        await this.restoreTaskFromCheckpoint(checkpoint, newAgentId);
      } catch (error) {
        console.error(`Failed to restore task ${checkpoint.taskId} from checkpoint:`, error);
      }
    }
  }

  private async restoreTaskFromCheckpoint(checkpoint: TaskCheckpoint, newAgentId: string): Promise<void> {
    // This would restore a task from its checkpoint
    // Implementation would depend on the specific task type and checkpoint data
  }

  private async captureRollbackData(taskId: string): Promise<any> {
    // This would capture data needed to rollback the task if needed
    return {};
  }

  private async markAgentOffline(agentId: string): Promise<void> {
    // This would mark the agent as offline in the coordination manager
    // await this.coordinationManager.updateAgentStatus(agentId, AgentStatus.OFFLINE);
  }

  private async markAgentUnhealthy(agentId: string): Promise<void> {
    // This would mark the agent as unhealthy
    // await this.coordinationManager.updateAgentStatus(agentId, AgentStatus.ERROR);
  }

  private async markAgentForManualIntervention(agentId: string): Promise<void> {
    // This would flag the agent for manual intervention
    // await this.coordinationManager.flagAgentForManualIntervention(agentId);
  }

  private async waitForTaskCompletion(agentId: string, timeout: number): Promise<void> {
    // This would wait for the agent's tasks to complete
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error('Task completion timeout'));
      }, timeout);

      // Mock completion
      setTimeout(() => {
        clearTimeout(timeoutId);
        resolve();
      }, 1000);
    });
  }

  private async waitForFailoverCompletion(agentId: string, timeout: number): Promise<void> {
    return new Promise((resolve) => {
      const startTime = Date.now();
      const checkInterval = setInterval(() => {
        if (!this.activeFailovers.has(agentId) || Date.now() - startTime > timeout) {
          clearInterval(checkInterval);
          resolve();
        }
      }, 1000);
    });
  }
}
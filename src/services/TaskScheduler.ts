/**
 * Task Scheduler implementation
 * Handles task scheduling, dependency resolution, and queue management
 */

import { Task, TaskStatus, TaskPriority } from '../types/task.types';
import { AgentType } from '../types/agent.types';
import { ErrorType, ErrorSeverity } from '../types/error.types';
import { SystemError, ValidationError } from '../core/errors/SystemError';

/**
 * Task scheduling strategy interface
 */
export interface ITaskSchedulingStrategy {
  scheduleTask(task: Task, availableAgents: string[], agentInfo: Map<string, AgentInfo>): string | null;
  prioritizeTasks(tasks: Task[]): Task[];
}

/**
 * Agent information for scheduling decisions
 */
export interface AgentInfo {
  type: AgentType;
  workload: number;
  capabilities: string[];
  maxConcurrentTasks: number;
  currentTasks: number;
}

/**
 * Task queue entry
 */
export interface TaskQueueEntry {
  task: Task;
  priority: number;
  scheduledAt: Date;
  estimatedStartTime?: Date;
}

/**
 * Scheduling result
 */
export interface SchedulingResult {
  success: boolean;
  assignedAgent?: string;
  estimatedStartTime?: Date;
  reason?: string;
}

/**
 * Default task scheduling strategy
 */
export class DefaultSchedulingStrategy implements ITaskSchedulingStrategy {
  scheduleTask(task: Task, availableAgents: string[], agentInfo: Map<string, AgentInfo>): string | null {
    let bestAgent: string | null = null;
    let bestScore = -1;

    for (const agentId of availableAgents) {
      const info = agentInfo.get(agentId);
      if (!info) continue;

      // Skip if agent is at capacity
      if (info.currentTasks >= info.maxConcurrentTasks) continue;

      const score = this.calculateAgentScore(task, agentId, info);
      if (score > bestScore) {
        bestScore = score;
        bestAgent = agentId;
      }
    }

    return bestAgent;
  }

  prioritizeTasks(tasks: Task[]): Task[] {
    return tasks.sort((a, b) => {
      // First by priority (higher first)
      if (a.priority !== b.priority) {
        return b.priority - a.priority;
      }

      // Then by creation time (older first)
      return a.createdAt.getTime() - b.createdAt.getTime();
    });
  }

  private calculateAgentScore(task: Task, agentId: string, agentInfo: AgentInfo): number {
    let score = 0;

    // Type matching score
    const typeMatch = this.getTypeMatchScore(task.type, agentInfo.type);
    score += typeMatch * 50;

    // Capability matching score
    const capabilityMatch = this.getCapabilityMatchScore(task, agentInfo.capabilities);
    score += capabilityMatch * 30;

    // Workload penalty (prefer less loaded agents)
    const workloadPenalty = agentInfo.workload * 0.5;
    score -= workloadPenalty;

    // Current task count penalty
    const taskCountPenalty = agentInfo.currentTasks * 10;
    score -= taskCountPenalty;

    // Priority bonus
    score += task.priority * 5;

    return Math.max(0, score);
  }

  private getTypeMatchScore(taskType: string, agentType: AgentType): number {
    const typeMapping: Record<string, AgentType[]> = {
      'frontend': [AgentType.FRONTEND],
      'backend': [AgentType.BACKEND],
      'api': [AgentType.BACKEND],
      'database': [AgentType.BACKEND],
      'ui': [AgentType.FRONTEND],
      'component': [AgentType.FRONTEND],
      'test': [AgentType.TESTING],
      'testing': [AgentType.TESTING],
      'unit-test': [AgentType.TESTING],
      'integration-test': [AgentType.TESTING],
      'documentation': [AgentType.DOCUMENTATION],
      'docs': [AgentType.DOCUMENTATION],
      'review': [AgentType.CODE_REVIEW],
      'code-review': [AgentType.CODE_REVIEW],
      'deployment': [AgentType.DEVOPS],
      'devops': [AgentType.DEVOPS],
      'ci-cd': [AgentType.DEVOPS]
    };

    const matchingTypes = typeMapping[taskType.toLowerCase()] || [];
    return matchingTypes.includes(agentType) ? 1 : 0.2;
  }

  private getCapabilityMatchScore(task: Task, agentCapabilities: string[]): number {
    if (task.requirements.length === 0) return 0.5;

    let matchCount = 0;
    for (const requirement of task.requirements) {
      const reqLower = requirement.toLowerCase();
      for (const capability of agentCapabilities) {
        if (capability.toLowerCase().includes(reqLower) || reqLower.includes(capability.toLowerCase())) {
          matchCount++;
          break;
        }
      }
    }

    return matchCount / task.requirements.length;
  }
}

/**
 * Task Scheduler class
 */
export class TaskScheduler {
  private taskQueues: Map<string, TaskQueueEntry[]> = new Map();
  private dependencyGraph: Map<string, Set<string>> = new Map();
  private reverseDependencyGraph: Map<string, Set<string>> = new Map();
  private schedulingStrategy: ITaskSchedulingStrategy = new DefaultSchedulingStrategy();
  private agentInfo: Map<string, AgentInfo> = new Map();

  /**
   * Set the scheduling strategy
   */
  setSchedulingStrategy(strategy: ITaskSchedulingStrategy): void {
    this.schedulingStrategy = strategy;
  }

  /**
   * Update agent information
   */
  updateAgentInfo(agentId: string, info: AgentInfo): void {
    this.agentInfo.set(agentId, info);
    
    // Initialize queue if not exists
    if (!this.taskQueues.has(agentId)) {
      this.taskQueues.set(agentId, []);
    }
  }

  /**
   * Remove agent information
   */
  removeAgentInfo(agentId: string): void {
    this.agentInfo.delete(agentId);
    this.taskQueues.delete(agentId);
  }

  /**
   * Add task dependency
   */
  addDependency(taskId: string, dependencyId: string): void {
    // Validate no circular dependency
    if (this.wouldCreateCircularDependency(taskId, dependencyId)) {
      throw new ValidationError(`Adding dependency would create circular dependency: ${taskId} -> ${dependencyId}`);
    }

    // Add to dependency graph
    if (!this.dependencyGraph.has(taskId)) {
      this.dependencyGraph.set(taskId, new Set());
    }
    this.dependencyGraph.get(taskId)!.add(dependencyId);

    // Add to reverse dependency graph
    if (!this.reverseDependencyGraph.has(dependencyId)) {
      this.reverseDependencyGraph.set(dependencyId, new Set());
    }
    this.reverseDependencyGraph.get(dependencyId)!.add(taskId);
  }

  /**
   * Remove task dependency
   */
  removeDependency(taskId: string, dependencyId: string): void {
    const dependencies = this.dependencyGraph.get(taskId);
    if (dependencies) {
      dependencies.delete(dependencyId);
    }

    const dependents = this.reverseDependencyGraph.get(dependencyId);
    if (dependents) {
      dependents.delete(taskId);
    }
  }

  /**
   * Check if task dependencies are met
   */
  areDependenciesMet(taskId: string, completedTasks: Set<string>): boolean {
    const dependencies = this.dependencyGraph.get(taskId) || new Set();
    
    for (const depId of Array.from(dependencies)) {
      if (!completedTasks.has(depId)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Get task dependencies
   */
  getDependencies(taskId: string): string[] {
    const dependencies = this.dependencyGraph.get(taskId) || new Set();
    return Array.from(dependencies);
  }

  /**
   * Get tasks that depend on the given task
   */
  getDependents(taskId: string): string[] {
    const dependents = this.reverseDependencyGraph.get(taskId) || new Set();
    return Array.from(dependents);
  }

  /**
   * Schedule a task
   */
  scheduleTask(task: Task): SchedulingResult {
    const availableAgents = Array.from(this.agentInfo.keys());
    
    if (availableAgents.length === 0) {
      return {
        success: false,
        reason: 'No agents available'
      };
    }

    const assignedAgent = this.schedulingStrategy.scheduleTask(task, availableAgents, this.agentInfo);
    
    if (!assignedAgent) {
      return {
        success: false,
        reason: 'No suitable agent found'
      };
    }

    // Add to agent's queue
    this.addTaskToQueue(assignedAgent, task);

    // Update agent's current task count
    const agentInfo = this.agentInfo.get(assignedAgent)!;
    agentInfo.currentTasks++;

    return {
      success: true,
      assignedAgent,
      estimatedStartTime: this.estimateStartTime(assignedAgent, task)
    };
  }

  /**
   * Remove task from schedule
   */
  unscheduleTask(taskId: string, agentId: string): void {
    const queue = this.taskQueues.get(agentId);
    if (!queue) return;

    const index = queue.findIndex(entry => entry.task.id === taskId);
    if (index > -1) {
      queue.splice(index, 1);
      
      // Update agent's current task count
      const agentInfo = this.agentInfo.get(agentId);
      if (agentInfo && agentInfo.currentTasks > 0) {
        agentInfo.currentTasks--;
      }
    }
  }

  /**
   * Get next task for an agent
   */
  getNextTask(agentId: string, completedTasks: Set<string>): Task | null {
    const queue = this.taskQueues.get(agentId);
    if (!queue || queue.length === 0) return null;

    // Find first task with met dependencies
    for (const entry of queue) {
      if (entry.task.status === TaskStatus.PENDING && 
          this.areDependenciesMet(entry.task.id, completedTasks)) {
        return entry.task;
      }
    }

    return null;
  }

  /**
   * Get agent's task queue
   */
  getTaskQueue(agentId: string): TaskQueueEntry[] {
    return this.taskQueues.get(agentId) || [];
  }

  /**
   * Rebalance task queues
   */
  rebalanceQueues(tasks: Task[], completedTasks: Set<string>): void {
    // Get all unassigned tasks that can be scheduled
    const availableTasks = tasks.filter(task => 
      task.status === TaskStatus.PENDING && 
      !task.assignedAgent &&
      this.areDependenciesMet(task.id, completedTasks)
    );

    // Prioritize tasks
    const prioritizedTasks = this.schedulingStrategy.prioritizeTasks(availableTasks);

    // Reschedule tasks
    for (const task of prioritizedTasks) {
      const result = this.scheduleTask(task);
      if (result.success && result.assignedAgent) {
        task.assignedAgent = result.assignedAgent;
      }
    }
  }

  /**
   * Get scheduling statistics
   */
  getSchedulingStatistics(): {
    totalQueues: number;
    totalTasks: number;
    averageQueueLength: number;
    agentUtilization: Record<string, number>;
  } {
    const stats = {
      totalQueues: this.taskQueues.size,
      totalTasks: 0,
      averageQueueLength: 0,
      agentUtilization: {} as Record<string, number>
    };

    let totalQueueLength = 0;
    
    for (const [agentId, queue] of Array.from(this.taskQueues.entries())) {
      const queueLength = queue.length;
      totalQueueLength += queueLength;
      stats.totalTasks += queueLength;

      const agentInfo = this.agentInfo.get(agentId);
      if (agentInfo) {
        stats.agentUtilization[agentId] = (agentInfo.currentTasks / agentInfo.maxConcurrentTasks) * 100;
      }
    }

    stats.averageQueueLength = stats.totalQueues > 0 ? totalQueueLength / stats.totalQueues : 0;

    return stats;
  }

  // Private helper methods

  private addTaskToQueue(agentId: string, task: Task): void {
    const queue = this.taskQueues.get(agentId)!;
    
    const entry: TaskQueueEntry = {
      task,
      priority: task.priority,
      scheduledAt: new Date(),
      estimatedStartTime: this.estimateStartTime(agentId, task)
    };

    // Insert in priority order
    let insertIndex = queue.length;
    for (let i = 0; i < queue.length; i++) {
      if (entry.priority > queue[i].priority) {
        insertIndex = i;
        break;
      }
    }

    queue.splice(insertIndex, 0, entry);
  }

  private estimateStartTime(agentId: string, task: Task): Date {
    const queue = this.taskQueues.get(agentId)!;
    const agentInfo = this.agentInfo.get(agentId)!;

    // Calculate estimated start time based on queue
    let estimatedTime = 0;
    let tasksAhead = 0;

    for (const entry of queue) {
      if (entry.task.status === TaskStatus.PENDING || entry.task.status === TaskStatus.IN_PROGRESS) {
        estimatedTime += entry.task.estimatedTime;
        tasksAhead++;
        
        if (tasksAhead >= agentInfo.maxConcurrentTasks) {
          break;
        }
      }
    }

    return new Date(Date.now() + estimatedTime);
  }

  private wouldCreateCircularDependency(taskId: string, dependencyId: string): boolean {
    // Simple check: if dependencyId already depends on taskId (directly or indirectly),
    // then adding taskId -> dependencyId would create a cycle
    const visited = new Set<string>();
    
    const hasPath = (from: string, to: string): boolean => {
      if (from === to) {
        return true;
      }
      
      if (visited.has(from)) {
        return false;
      }
      
      visited.add(from);
      
      const deps = this.dependencyGraph.get(from) || new Set();
      for (const dep of deps) {
        if (hasPath(dep, to)) {
          return true;
        }
      }
      
      return false;
    };
    
    return hasPath(dependencyId, taskId);
  }
}
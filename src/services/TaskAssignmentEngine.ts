/**
 * Task Assignment Engine
 * Implements intelligent task assignment algorithms with dynamic reassignment and monitoring
 */

import { Task, TaskStatus, TaskPriority } from '../types/task.types';
import { AgentType } from '../types/agent.types';
import { ErrorType, ErrorSeverity } from '../types/error.types';
import { SystemError } from '../core/errors/SystemError';
import { AgentInfo } from './TaskScheduler';

/**
 * Assignment criteria for intelligent task assignment
 */
export interface AssignmentCriteria {
  agentSpecialization: number;      // Weight for agent type matching
  workloadBalance: number;          // Weight for workload balancing
  capabilityMatch: number;          // Weight for capability matching
  taskPriority: number;             // Weight for task priority
  estimatedTime: number;            // Weight for estimated completion time
  historicalPerformance: number;    // Weight for agent's past performance
}

/**
 * Agent performance metrics
 */
export interface AgentPerformance {
  agentId: string;
  tasksCompleted: number;
  tasksSuccessful: number;
  averageCompletionTime: number;
  averageQuality: number;
  specializations: Record<string, number>; // Task type -> success rate
  lastUpdated: Date;
}

/**
 * Task assignment result
 */
export interface AssignmentResult {
  success: boolean;
  assignedAgent?: string;
  confidence: number;
  reasoning: string[];
  alternativeAgents?: string[];
}

/**
 * Task execution monitoring data
 */
export interface TaskExecution {
  taskId: string;
  agentId: string;
  startTime: Date;
  expectedEndTime: Date;
  actualEndTime?: Date;
  status: TaskStatus;
  progress: number;
  timeoutWarnings: number;
  lastHeartbeat: Date;
}

/**
 * Reassignment trigger
 */
export interface ReassignmentTrigger {
  type: 'timeout' | 'agent_failure' | 'priority_change' | 'load_balancing';
  taskId: string;
  agentId: string;
  reason: string;
  timestamp: Date;
}

/**
 * Default assignment criteria
 */
export const DEFAULT_ASSIGNMENT_CRITERIA: AssignmentCriteria = {
  agentSpecialization: 0.3,
  workloadBalance: 0.25,
  capabilityMatch: 0.2,
  taskPriority: 0.1,
  estimatedTime: 0.1,
  historicalPerformance: 0.05
};

/**
 * Intelligent Task Assignment Engine
 */
export class TaskAssignmentEngine {
  private agentInfo: Map<string, AgentInfo> = new Map();
  private agentPerformance: Map<string, AgentPerformance> = new Map();
  private taskExecutions: Map<string, TaskExecution> = new Map();
  private assignmentCriteria: AssignmentCriteria = { ...DEFAULT_ASSIGNMENT_CRITERIA };
  private timeoutThreshold: number = 1.5; // 150% of estimated time
  private heartbeatInterval: number = 30000; // 30 seconds

  /**
   * Update assignment criteria weights
   */
  updateAssignmentCriteria(criteria: Partial<AssignmentCriteria>): void {
    this.assignmentCriteria = { ...this.assignmentCriteria, ...criteria };
  }

  /**
   * Update agent information
   */
  updateAgentInfo(agentId: string, info: AgentInfo): void {
    this.agentInfo.set(agentId, info);
    
    // Initialize performance if not exists
    if (!this.agentPerformance.has(agentId)) {
      this.agentPerformance.set(agentId, {
        agentId,
        tasksCompleted: 0,
        tasksSuccessful: 0,
        averageCompletionTime: 0,
        averageQuality: 0,
        specializations: {},
        lastUpdated: new Date()
      });
    }
  }

  /**
   * Remove agent information
   */
  removeAgentInfo(agentId: string): void {
    this.agentInfo.delete(agentId);
    this.agentPerformance.delete(agentId);
    
    // Remove any task executions for this agent
    for (const [taskId, execution] of Array.from(this.taskExecutions.entries())) {
      if (execution.agentId === agentId) {
        this.taskExecutions.delete(taskId);
      }
    }
  }

  /**
   * Assign task using intelligent algorithm
   */
  assignTask(task: Task, availableAgents: string[]): AssignmentResult {
    if (availableAgents.length === 0) {
      return {
        success: false,
        confidence: 0,
        reasoning: ['No agents available']
      };
    }

    // Calculate scores for each agent
    const agentScores = this.calculateAgentScores(task, availableAgents);
    
    if (agentScores.length === 0) {
      return {
        success: false,
        confidence: 0,
        reasoning: ['No suitable agents found']
      };
    }

    // Sort by score (highest first)
    agentScores.sort((a, b) => b.score - a.score);

    const bestAgent = agentScores[0];
    const alternativeAgents = agentScores.slice(1, 3).map(a => a.agentId);

    return {
      success: true,
      assignedAgent: bestAgent.agentId,
      confidence: bestAgent.score,
      reasoning: bestAgent.reasoning,
      alternativeAgents
    };
  }

  /**
   * Start task execution monitoring
   */
  startTaskExecution(taskId: string, agentId: string, task: Task): void {
    const execution: TaskExecution = {
      taskId,
      agentId,
      startTime: new Date(),
      expectedEndTime: new Date(Date.now() + task.estimatedTime),
      status: TaskStatus.IN_PROGRESS,
      progress: 0,
      timeoutWarnings: 0,
      lastHeartbeat: new Date()
    };

    this.taskExecutions.set(taskId, execution);
  }

  /**
   * Update task execution progress
   */
  updateTaskProgress(taskId: string, progress: number): void {
    const execution = this.taskExecutions.get(taskId);
    if (execution) {
      execution.progress = Math.max(0, Math.min(100, progress));
      execution.lastHeartbeat = new Date();
    }
  }

  /**
   * Complete task execution
   */
  completeTaskExecution(taskId: string, success: boolean, quality?: number): void {
    const execution = this.taskExecutions.get(taskId);
    if (!execution) return;

    execution.actualEndTime = new Date();
    execution.status = success ? TaskStatus.COMPLETED : TaskStatus.FAILED;
    execution.progress = success ? 100 : execution.progress;

    // Update agent performance
    this.updateAgentPerformance(execution, success, quality);

    // Remove from active executions
    this.taskExecutions.delete(taskId);
  }

  /**
   * Check for tasks that need reassignment
   */
  checkForReassignment(): ReassignmentTrigger[] {
    const triggers: ReassignmentTrigger[] = [];
    const now = new Date();

    for (const execution of Array.from(this.taskExecutions.values())) {
      // Check for timeout
      const elapsedTime = now.getTime() - execution.startTime.getTime();
      const estimatedTime = execution.expectedEndTime.getTime() - execution.startTime.getTime();
      const timeoutRatio = elapsedTime / estimatedTime;
      
      if (timeoutRatio > this.timeoutThreshold) {
        triggers.push({
          type: 'timeout',
          taskId: execution.taskId,
          agentId: execution.agentId,
          reason: `Task exceeded timeout threshold by ${Math.round((timeoutRatio - 1) * 100)}%`,
          timestamp: now
        });
      }

      // Check for missing heartbeat
      const heartbeatAge = now.getTime() - execution.lastHeartbeat.getTime();
      if (heartbeatAge > this.heartbeatInterval * 3) {
        triggers.push({
          type: 'agent_failure',
          taskId: execution.taskId,
          agentId: execution.agentId,
          reason: `No heartbeat for ${Math.round(heartbeatAge / 1000)} seconds`,
          timestamp: now
        });
      }
    }

    return triggers;
  }

  /**
   * Reassign task to a different agent
   */
  reassignTask(taskId: string, currentAgentId: string, availableAgents: string[], task: Task): AssignmentResult {
    // Remove current agent from available list
    const filteredAgents = availableAgents.filter(id => id !== currentAgentId);
    
    // Stop current execution monitoring
    this.taskExecutions.delete(taskId);
    
    // Find new assignment
    const result = this.assignTask(task, filteredAgents);
    
    if (result.success && result.assignedAgent) {
      // Start new execution monitoring
      this.startTaskExecution(taskId, result.assignedAgent, task);
      
      result.reasoning.unshift(`Reassigned from ${currentAgentId}`);
    }

    return result;
  }

  /**
   * Get task execution status
   */
  getTaskExecution(taskId: string): TaskExecution | null {
    return this.taskExecutions.get(taskId) || null;
  }

  /**
   * Get all active task executions
   */
  getActiveExecutions(): TaskExecution[] {
    return Array.from(this.taskExecutions.values());
  }

  /**
   * Get agent performance metrics
   */
  getAgentPerformance(agentId: string): AgentPerformance | null {
    return this.agentPerformance.get(agentId) || null;
  }

  /**
   * Get assignment engine statistics
   */
  getStatistics(): {
    totalAssignments: number;
    activeExecutions: number;
    averageAssignmentConfidence: number;
    timeoutRate: number;
    reassignmentRate: number;
    agentPerformanceSummary: Record<string, { successRate: number; avgCompletionTime: number }>;
  } {
    const stats = {
      totalAssignments: 0,
      activeExecutions: this.taskExecutions.size,
      averageAssignmentConfidence: 0,
      timeoutRate: 0,
      reassignmentRate: 0,
      agentPerformanceSummary: {} as Record<string, { successRate: number; avgCompletionTime: number }>
    };

    // Calculate agent performance summary
    for (const [agentId, performance] of Array.from(this.agentPerformance.entries())) {
      const successRate = performance.tasksCompleted > 0 ? 
        (performance.tasksSuccessful / performance.tasksCompleted) * 100 : 0;
      
      stats.agentPerformanceSummary[agentId] = {
        successRate,
        avgCompletionTime: performance.averageCompletionTime
      };
      
      stats.totalAssignments += performance.tasksCompleted;
    }

    return stats;
  }

  // Private helper methods

  private calculateAgentScores(task: Task, availableAgents: string[]): Array<{
    agentId: string;
    score: number;
    reasoning: string[];
  }> {
    const scores: Array<{ agentId: string; score: number; reasoning: string[] }> = [];

    for (const agentId of availableAgents) {
      const agentInfo = this.agentInfo.get(agentId);
      const performance = this.agentPerformance.get(agentId);
      
      if (!agentInfo) continue;

      // Skip if agent is at capacity
      if (agentInfo.currentTasks >= agentInfo.maxConcurrentTasks) continue;

      const scoreResult = this.calculateAgentScore(task, agentId, agentInfo, performance);
      scores.push(scoreResult);
    }

    return scores;
  }

  private calculateAgentScore(
    task: Task, 
    agentId: string, 
    agentInfo: AgentInfo, 
    performance?: AgentPerformance
  ): { agentId: string; score: number; reasoning: string[] } {
    let totalScore = 0;
    const reasoning: string[] = [];

    // Agent specialization score
    const specializationScore = this.getSpecializationScore(task.type, agentInfo.type);
    totalScore += specializationScore * this.assignmentCriteria.agentSpecialization;
    reasoning.push(`Specialization: ${specializationScore.toFixed(2)}`);

    // Workload balance score
    const workloadScore = this.getWorkloadScore(agentInfo);
    totalScore += workloadScore * this.assignmentCriteria.workloadBalance;
    reasoning.push(`Workload: ${workloadScore.toFixed(2)}`);

    // Capability match score
    const capabilityScore = this.getCapabilityScore(task, agentInfo.capabilities);
    totalScore += capabilityScore * this.assignmentCriteria.capabilityMatch;
    reasoning.push(`Capabilities: ${capabilityScore.toFixed(2)}`);

    // Task priority score
    const priorityScore = task.priority / TaskPriority.CRITICAL;
    totalScore += priorityScore * this.assignmentCriteria.taskPriority;
    reasoning.push(`Priority: ${priorityScore.toFixed(2)}`);

    // Estimated time score (prefer shorter tasks for busy agents)
    const timeScore = this.getTimeScore(task.estimatedTime, agentInfo.currentTasks);
    totalScore += timeScore * this.assignmentCriteria.estimatedTime;
    reasoning.push(`Time: ${timeScore.toFixed(2)}`);

    // Historical performance score
    if (performance) {
      const performanceScore = this.getPerformanceScore(task.type, performance);
      totalScore += performanceScore * this.assignmentCriteria.historicalPerformance;
      reasoning.push(`Performance: ${performanceScore.toFixed(2)}`);
    }

    return {
      agentId,
      score: totalScore,
      reasoning
    };
  }

  private getSpecializationScore(taskType: string, agentType: AgentType): number {
    const typeMapping: Record<string, AgentType[]> = {
      'frontend': [AgentType.FRONTEND],
      'backend': [AgentType.BACKEND],
      'api': [AgentType.BACKEND],
      'database': [AgentType.BACKEND],
      'ui': [AgentType.FRONTEND],
      'component': [AgentType.FRONTEND],
      'test': [AgentType.TESTING],
      'testing': [AgentType.TESTING],
      'documentation': [AgentType.DOCUMENTATION],
      'docs': [AgentType.DOCUMENTATION],
      'review': [AgentType.CODE_REVIEW],
      'code-review': [AgentType.CODE_REVIEW],
      'deployment': [AgentType.DEVOPS],
      'devops': [AgentType.DEVOPS]
    };

    const matchingTypes = typeMapping[taskType.toLowerCase()] || [];
    return matchingTypes.includes(agentType) ? 1.0 : 0.3;
  }

  private getWorkloadScore(agentInfo: AgentInfo): number {
    const utilizationRate = agentInfo.currentTasks / agentInfo.maxConcurrentTasks;
    return Math.max(0, 1 - utilizationRate);
  }

  private getCapabilityScore(task: Task, agentCapabilities: string[]): number {
    if (task.requirements.length === 0) return 0.5;

    let matchCount = 0;
    for (const requirement of task.requirements) {
      const reqLower = requirement.toLowerCase();
      for (const capability of agentCapabilities) {
        if (capability.toLowerCase().includes(reqLower) || 
            reqLower.includes(capability.toLowerCase())) {
          matchCount++;
          break;
        }
      }
    }

    return matchCount / task.requirements.length;
  }

  private getTimeScore(estimatedTime: number, currentTasks: number): number {
    // Prefer shorter tasks for busy agents
    const timeHours = estimatedTime / 3600000;
    const baseScore = Math.max(0, 1 - (timeHours / 8)); // Normalize to 8-hour workday
    
    // Adjust based on current workload
    const workloadAdjustment = Math.max(0.1, 1 - (currentTasks * 0.2));
    
    return baseScore * workloadAdjustment;
  }

  private getPerformanceScore(taskType: string, performance: AgentPerformance): number {
    // Check specialization performance
    const specializationRate = performance.specializations[taskType] || 0.5;
    
    // Overall success rate
    const overallSuccessRate = performance.tasksCompleted > 0 ? 
      performance.tasksSuccessful / performance.tasksCompleted : 0.5;
    
    // Combine specialization and overall performance
    return (specializationRate * 0.7) + (overallSuccessRate * 0.3);
  }

  private updateAgentPerformance(execution: TaskExecution, success: boolean, quality?: number): void {
    const performance = this.agentPerformance.get(execution.agentId);
    if (!performance) return;

    // Update basic metrics
    performance.tasksCompleted++;
    if (success) {
      performance.tasksSuccessful++;
    }

    // Update completion time
    if (execution.actualEndTime) {
      const completionTime = execution.actualEndTime.getTime() - execution.startTime.getTime();
      performance.averageCompletionTime = 
        (performance.averageCompletionTime * (performance.tasksCompleted - 1) + completionTime) / 
        performance.tasksCompleted;
    }

    // Update quality if provided
    if (quality !== undefined) {
      performance.averageQuality = 
        (performance.averageQuality * (performance.tasksCompleted - 1) + quality) / 
        performance.tasksCompleted;
    }

    // Update specialization performance
    const taskType = this.getTaskTypeFromExecution(execution);
    if (taskType) {
      const currentRate = performance.specializations[taskType] || 0;
      const taskCount = this.getTaskCountForType(performance, taskType);
      performance.specializations[taskType] = 
        (currentRate * (taskCount - 1) + (success ? 1 : 0)) / taskCount;
    }

    performance.lastUpdated = new Date();
  }

  private getTaskTypeFromExecution(execution: TaskExecution): string | null {
    // This would need to be enhanced to get task type from task data
    // For now, return null as we don't have direct access to task data
    return null;
  }

  private getTaskCountForType(performance: AgentPerformance, taskType: string): number {
    // This is a simplified implementation
    // In a real system, you'd track task counts per type
    return Math.max(1, Math.floor(performance.tasksCompleted / 5));
  }
}
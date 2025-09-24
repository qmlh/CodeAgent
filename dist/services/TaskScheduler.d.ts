/**
 * Task Scheduler implementation
 * Handles task scheduling, dependency resolution, and queue management
 */
import { Task } from '../types/task.types';
import { AgentType } from '../types/agent.types';
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
export declare class DefaultSchedulingStrategy implements ITaskSchedulingStrategy {
    scheduleTask(task: Task, availableAgents: string[], agentInfo: Map<string, AgentInfo>): string | null;
    prioritizeTasks(tasks: Task[]): Task[];
    private calculateAgentScore;
    private getTypeMatchScore;
    private getCapabilityMatchScore;
}
/**
 * Task Scheduler class
 */
export declare class TaskScheduler {
    private taskQueues;
    private dependencyGraph;
    private reverseDependencyGraph;
    private schedulingStrategy;
    private agentInfo;
    /**
     * Set the scheduling strategy
     */
    setSchedulingStrategy(strategy: ITaskSchedulingStrategy): void;
    /**
     * Update agent information
     */
    updateAgentInfo(agentId: string, info: AgentInfo): void;
    /**
     * Remove agent information
     */
    removeAgentInfo(agentId: string): void;
    /**
     * Add task dependency
     */
    addDependency(taskId: string, dependencyId: string): void;
    /**
     * Remove task dependency
     */
    removeDependency(taskId: string, dependencyId: string): void;
    /**
     * Check if task dependencies are met
     */
    areDependenciesMet(taskId: string, completedTasks: Set<string>): boolean;
    /**
     * Get task dependencies
     */
    getDependencies(taskId: string): string[];
    /**
     * Get tasks that depend on the given task
     */
    getDependents(taskId: string): string[];
    /**
     * Schedule a task
     */
    scheduleTask(task: Task): SchedulingResult;
    /**
     * Remove task from schedule
     */
    unscheduleTask(taskId: string, agentId: string): void;
    /**
     * Get next task for an agent
     */
    getNextTask(agentId: string, completedTasks: Set<string>): Task | null;
    /**
     * Get agent's task queue
     */
    getTaskQueue(agentId: string): TaskQueueEntry[];
    /**
     * Rebalance task queues
     */
    rebalanceQueues(tasks: Task[], completedTasks: Set<string>): void;
    /**
     * Get scheduling statistics
     */
    getSchedulingStatistics(): {
        totalQueues: number;
        totalTasks: number;
        averageQueueLength: number;
        agentUtilization: Record<string, number>;
    };
    private addTaskToQueue;
    private estimateStartTime;
    private wouldCreateCircularDependency;
}

/**
 * Task Manager implementation
 * Handles task creation, assignment, scheduling, and lifecycle management
 */
import { ITaskManager } from '../core/interfaces/ITaskManager';
import { Task, TaskStatus } from '../types/task.types';
import { AgentType } from '../types/agent.types';
/**
 * Task Manager implementation
 */
export declare class TaskManager implements ITaskManager {
    private tasks;
    private taskQueues;
    private dependencyGraph;
    private reverseDependencyGraph;
    private assignmentStrategy;
    private validator;
    private agentInfo;
    initialize(): Promise<void>;
    /**
     * Update agent information for assignment decisions
     */
    updateAgentInfo(agentId: string, type: AgentType, workload: number): void;
    /**
     * Remove agent information
     */
    removeAgentInfo(agentId: string): void;
    /**
     * Decompose a high-level requirement into specific tasks
     */
    decomposeTask(requirement: string): Promise<Task[]>;
    /**
     * Create a new task
     */
    createTask(taskData: Partial<Task>): Promise<Task>;
    /**
     * Assign task to an agent
     */
    assignTask(task: Task, agentId?: string): Promise<void>;
    /**
     * Reassign task to a different agent
     */
    reassignTask(taskId: string, newAgentId: string): Promise<void>;
    /**
     * Get task queue for an agent
     */
    getTaskQueue(agentId: string): Promise<Task[]>;
    /**
     * Get available tasks that can be assigned
     */
    getAvailableTasks(agentType?: string): Promise<Task[]>;
    /**
     * Update task status
     */
    updateTaskStatus(taskId: string, status: TaskStatus): Promise<void>;
    /**
     * Get a specific task
     */
    getTask(taskId: string): Promise<Task | null>;
    /**
     * Get tasks with optional filtering
     */
    getTasks(filter?: Partial<Task>): Promise<Task[]>;
    /**
     * Get task dependencies
     */
    getDependencies(taskId: string): Promise<Task[]>;
    /**
     * Add a dependency relationship
     */
    addDependency(taskId: string, dependencyId: string): Promise<void>;
    /**
     * Remove a dependency relationship
     */
    removeDependency(taskId: string, dependencyId: string): Promise<void>;
    /**
     * Update task priority
     */
    updateTaskPriority(taskId: string, priority: number): Promise<void>;
    /**
     * Get next task for an agent
     */
    getNextTask(agentId: string): Promise<Task | null>;
    /**
     * Get task statistics
     */
    getTaskStatistics(): Promise<{
        total: number;
        completed: number;
        failed: number;
        inProgress: number;
        pending: number;
    }>;
    private analyzeAndDecomposeRequirement;
    private assignTaskToAgent;
    private insertTaskInQueue;
    private findBestAgentForTask;
    private areDependenciesMet;
    private isTaskSuitableForAgentType;
    private wouldCreateCircularDependency;
    private checkAndUnblockDependentTasks;
}

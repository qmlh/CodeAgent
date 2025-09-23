/**
 * Task factory for creating and initializing tasks
 */
import { Task, TaskStatus, TaskPriority, TaskResult } from '../../types/task.types';
/**
 * Task creation options
 */
export interface CreateTaskOptions {
    title: string;
    description: string;
    type: string;
    priority?: TaskPriority;
    assignedAgent?: string;
    dependencies?: string[];
    estimatedTime?: number;
    files?: string[];
    requirements?: string[];
}
/**
 * Task factory class
 */
export declare class TaskFactory {
    private static taskValidator;
    /**
     * Create a new task with default values
     */
    static createTask(options: CreateTaskOptions): Task;
    /**
     * Create task from existing data with validation
     */
    static fromData(data: Partial<Task>): Task;
    /**
     * Clone an existing task with new ID
     */
    static cloneTask(sourceTask: Task, newTitle?: string): Task;
    /**
     * Create a subtask from a parent task
     */
    static createSubtask(parentTask: Task, subtaskOptions: Omit<CreateTaskOptions, 'dependencies'>): Task;
    /**
     * Update task status with validation
     */
    static updateTaskStatus(task: Task, newStatus: TaskStatus, agentId?: string): Task;
    /**
     * Add dependency to task
     */
    static addDependency(task: Task, dependencyId: string): Task;
    /**
     * Remove dependency from task
     */
    static removeDependency(task: Task, dependencyId: string): Task;
    /**
     * Assign task to agent
     */
    static assignToAgent(task: Task, agentId: string): Task;
    /**
     * Unassign task from agent
     */
    static unassignFromAgent(task: Task): Task;
    /**
     * Create task result
     */
    static createTaskResult(taskId: string, success: boolean, output?: any, error?: string, filesModified?: string[], executionTime?: number): TaskResult;
    /**
     * Create multiple related tasks
     */
    static createTaskChain(tasks: CreateTaskOptions[]): Task[];
    /**
     * Create tasks with parallel execution (no dependencies)
     */
    static createParallelTasks(tasks: CreateTaskOptions[]): Task[];
    /**
     * Validate task data without creating
     */
    static validateTaskData(data: Partial<Task>): {
        isValid: boolean;
        errors: string[];
    };
    /**
     * Check if task can be started (all dependencies completed)
     */
    static canStartTask(task: Task, completedTaskIds: string[]): boolean;
    /**
     * Calculate task progress based on subtasks
     */
    static calculateProgress(task: Task, subtasks: Task[]): number;
    /**
     * Get task duration in milliseconds
     */
    static getTaskDuration(task: Task): number | null;
    /**
     * Check if task is overdue
     */
    static isTaskOverdue(task: Task): boolean;
}
//# sourceMappingURL=TaskFactory.d.ts.map
/**
 * Task Manager interface definition
 */
import { Task, TaskStatus } from '../../types/task.types';
export interface ITaskManager {
    decomposeTask(requirement: string): Promise<Task[]>;
    createTask(taskData: Partial<Task>): Promise<Task>;
    assignTask(task: Task, agentId?: string): Promise<void>;
    reassignTask(taskId: string, newAgentId: string): Promise<void>;
    getTaskQueue(agentId: string): Promise<Task[]>;
    getAvailableTasks(agentType?: string): Promise<Task[]>;
    updateTaskStatus(taskId: string, status: TaskStatus): Promise<void>;
    getTask(taskId: string): Promise<Task | null>;
    getTasks(filter?: Partial<Task>): Promise<Task[]>;
    getDependencies(taskId: string): Promise<Task[]>;
    addDependency(taskId: string, dependencyId: string): Promise<void>;
    removeDependency(taskId: string, dependencyId: string): Promise<void>;
    updateTaskPriority(taskId: string, priority: number): Promise<void>;
    getNextTask(agentId: string): Promise<Task | null>;
    getTaskStatistics(): Promise<{
        total: number;
        completed: number;
        failed: number;
        inProgress: number;
        pending: number;
    }>;
}

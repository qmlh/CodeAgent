/**
 * Task Manager interface definition
 */

import { Task, TaskStatus } from '../../types/task.types';

export interface ITaskManager {
  // Task decomposition and creation
  decomposeTask(requirement: string): Promise<Task[]>;
  createTask(taskData: Partial<Task>): Promise<Task>;
  
  // Task assignment and scheduling
  assignTask(task: Task, agentId?: string): Promise<void>;
  reassignTask(taskId: string, newAgentId: string): Promise<void>;
  
  // Task queue management
  getTaskQueue(agentId: string): Promise<Task[]>;
  getAvailableTasks(agentType?: string): Promise<Task[]>;
  
  // Task status and lifecycle
  updateTaskStatus(taskId: string, status: TaskStatus): Promise<void>;
  getTask(taskId: string): Promise<Task | null>;
  getTasks(filter?: Partial<Task>): Promise<Task[]>;
  
  // Dependency management
  getDependencies(taskId: string): Promise<Task[]>;
  addDependency(taskId: string, dependencyId: string): Promise<void>;
  removeDependency(taskId: string, dependencyId: string): Promise<void>;
  
  // Priority and scheduling
  updateTaskPriority(taskId: string, priority: number): Promise<void>;
  getNextTask(agentId: string): Promise<Task | null>;
  
  // Analytics and monitoring
  getTaskStatistics(): Promise<{
    total: number;
    completed: number;
    failed: number;
    inProgress: number;
    pending: number;
  }>;
}
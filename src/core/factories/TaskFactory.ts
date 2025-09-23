/**
 * Task factory for creating and initializing tasks
 */

import { v4 as uuidv4 } from 'uuid';
import { Task, TaskStatus, TaskPriority, TaskResult } from '../../types/task.types';
import { TaskValidator, ValidationUtils } from '../validation/validators';
import { ValidationError } from '../errors/SystemError';

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
export class TaskFactory {
  private static taskValidator = new TaskValidator();

  /**
   * Create a new task with default values
   */
  static createTask(options: CreateTaskOptions): Task {
    const task: Task = {
      id: uuidv4(),
      title: options.title,
      description: options.description,
      type: options.type,
      status: TaskStatus.PENDING,
      priority: options.priority || TaskPriority.MEDIUM,
      assignedAgent: options.assignedAgent,
      dependencies: options.dependencies || [],
      estimatedTime: options.estimatedTime || 3600000, // 1 hour default
      files: options.files || [],
      requirements: options.requirements || [],
      createdAt: new Date()
    };

    // Validate the created task
    ValidationUtils.validateOrThrow(this.taskValidator, task, 'TaskFactory.createTask');

    return task;
  }

  /**
   * Create task from existing data with validation
   */
  static fromData(data: Partial<Task>): Task {
    if (!data.id) {
      throw new ValidationError('Task ID is required when creating from data');
    }

    const task: Task = {
      id: data.id,
      title: data.title || 'Untitled Task',
      description: data.description || 'No description provided',
      type: data.type || 'general',
      status: data.status || TaskStatus.PENDING,
      priority: data.priority || TaskPriority.MEDIUM,
      assignedAgent: data.assignedAgent,
      dependencies: data.dependencies || [],
      estimatedTime: data.estimatedTime || 3600000,
      files: data.files || [],
      requirements: data.requirements || [],
      createdAt: data.createdAt || new Date(),
      startedAt: data.startedAt,
      completedAt: data.completedAt
    };

    // Validate the created task
    ValidationUtils.validateOrThrow(this.taskValidator, task, 'TaskFactory.fromData');

    return task;
  }

  /**
   * Clone an existing task with new ID
   */
  static cloneTask(sourceTask: Task, newTitle?: string): Task {
    const clonedTask: Task = {
      ...sourceTask,
      id: uuidv4(),
      title: newTitle || `${sourceTask.title} (Copy)`,
      status: TaskStatus.PENDING,
      assignedAgent: undefined,
      createdAt: new Date(),
      startedAt: undefined,
      completedAt: undefined
    };

    // Validate the cloned task
    ValidationUtils.validateOrThrow(this.taskValidator, clonedTask, 'TaskFactory.cloneTask');

    return clonedTask;
  }

  /**
   * Create a subtask from a parent task
   */
  static createSubtask(parentTask: Task, subtaskOptions: Omit<CreateTaskOptions, 'dependencies'>): Task {
    const subtask = this.createTask({
      ...subtaskOptions,
      dependencies: [parentTask.id],
      priority: subtaskOptions.priority || parentTask.priority,
      type: subtaskOptions.type || parentTask.type
    });

    return subtask;
  }

  /**
   * Update task status with validation
   */
  static updateTaskStatus(task: Task, newStatus: TaskStatus, agentId?: string): Task {
    const now = new Date();
    const updatedTask: Task = {
      ...task,
      status: newStatus
    };

    // Update timestamps based on status
    switch (newStatus) {
      case TaskStatus.IN_PROGRESS:
        if (!task.startedAt) {
          updatedTask.startedAt = now;
        }
        if (agentId) {
          updatedTask.assignedAgent = agentId;
        }
        break;
      
      case TaskStatus.COMPLETED:
        if (!task.startedAt) {
          updatedTask.startedAt = now;
        }
        updatedTask.completedAt = now;
        break;
      
      case TaskStatus.FAILED:
        updatedTask.completedAt = now;
        break;
      
      case TaskStatus.PENDING:
        // Reset timestamps when returning to pending
        updatedTask.startedAt = undefined;
        updatedTask.completedAt = undefined;
        updatedTask.assignedAgent = undefined;
        break;
    }

    // Validate the updated task
    ValidationUtils.validateOrThrow(this.taskValidator, updatedTask, 'TaskFactory.updateTaskStatus');

    return updatedTask;
  }

  /**
   * Add dependency to task
   */
  static addDependency(task: Task, dependencyId: string): Task {
    if (task.dependencies.includes(dependencyId)) {
      return task; // Dependency already exists
    }

    if (dependencyId === task.id) {
      throw new ValidationError('Task cannot depend on itself');
    }

    const updatedTask: Task = {
      ...task,
      dependencies: [...task.dependencies, dependencyId]
    };

    // Validate the updated task
    ValidationUtils.validateOrThrow(this.taskValidator, updatedTask, 'TaskFactory.addDependency');

    return updatedTask;
  }

  /**
   * Remove dependency from task
   */
  static removeDependency(task: Task, dependencyId: string): Task {
    const updatedTask: Task = {
      ...task,
      dependencies: task.dependencies.filter(id => id !== dependencyId)
    };

    // Validate the updated task
    ValidationUtils.validateOrThrow(this.taskValidator, updatedTask, 'TaskFactory.removeDependency');

    return updatedTask;
  }

  /**
   * Assign task to agent
   */
  static assignToAgent(task: Task, agentId: string): Task {
    const updatedTask: Task = {
      ...task,
      assignedAgent: agentId
    };

    // If task is pending, move to in progress
    if (task.status === TaskStatus.PENDING) {
      return this.updateTaskStatus(updatedTask, TaskStatus.IN_PROGRESS, agentId);
    }

    // Validate the updated task
    ValidationUtils.validateOrThrow(this.taskValidator, updatedTask, 'TaskFactory.assignToAgent');

    return updatedTask;
  }

  /**
   * Unassign task from agent
   */
  static unassignFromAgent(task: Task): Task {
    const updatedTask: Task = {
      ...task,
      assignedAgent: undefined
    };

    // If task is in progress, move back to pending
    if (task.status === TaskStatus.IN_PROGRESS) {
      return this.updateTaskStatus(updatedTask, TaskStatus.PENDING);
    }

    // Validate the updated task
    ValidationUtils.validateOrThrow(this.taskValidator, updatedTask, 'TaskFactory.unassignFromAgent');

    return updatedTask;
  }

  /**
   * Create task result
   */
  static createTaskResult(
    taskId: string,
    success: boolean,
    output?: any,
    error?: string,
    filesModified: string[] = [],
    executionTime: number = 0
  ): TaskResult {
    return {
      taskId,
      success,
      output,
      error,
      filesModified,
      executionTime,
      completedAt: new Date()
    };
  }

  /**
   * Create multiple related tasks
   */
  static createTaskChain(tasks: CreateTaskOptions[]): Task[] {
    const createdTasks: Task[] = [];
    
    for (let i = 0; i < tasks.length; i++) {
      const taskOptions = tasks[i];
      const dependencies = i > 0 ? [createdTasks[i - 1].id] : [];
      
      const task = this.createTask({
        ...taskOptions,
        dependencies: [...(taskOptions.dependencies || []), ...dependencies]
      });
      
      createdTasks.push(task);
    }

    return createdTasks;
  }

  /**
   * Create tasks with parallel execution (no dependencies)
   */
  static createParallelTasks(tasks: CreateTaskOptions[]): Task[] {
    return tasks.map(taskOptions => this.createTask(taskOptions));
  }

  /**
   * Validate task data without creating
   */
  static validateTaskData(data: Partial<Task>): { isValid: boolean; errors: string[] } {
    try {
      // Create a temporary task for validation
      const tempTask = this.fromData({
        id: data.id || uuidv4(),
        ...data
      });
      return { isValid: true, errors: [] };
    } catch (error) {
      if (error instanceof ValidationError) {
        return { isValid: false, errors: [error.message] };
      }
      return { isValid: false, errors: ['Unknown validation error'] };
    }
  }

  /**
   * Check if task can be started (all dependencies completed)
   */
  static canStartTask(task: Task, completedTaskIds: string[]): boolean {
    if (task.status !== TaskStatus.PENDING && task.status !== TaskStatus.BLOCKED) {
      return false;
    }

    return task.dependencies.every(depId => completedTaskIds.includes(depId));
  }

  /**
   * Calculate task progress based on subtasks
   */
  static calculateProgress(task: Task, subtasks: Task[]): number {
    const taskSubtasks = subtasks.filter(st => st.dependencies.includes(task.id));
    
    if (taskSubtasks.length === 0) {
      // No subtasks, progress based on status
      switch (task.status) {
        case TaskStatus.PENDING:
        case TaskStatus.BLOCKED:
          return 0;
        case TaskStatus.IN_PROGRESS:
          return 50;
        case TaskStatus.COMPLETED:
          return 100;
        case TaskStatus.FAILED:
          return 0;
        default:
          return 0;
      }
    }

    // Calculate progress based on subtasks
    const completedSubtasks = taskSubtasks.filter(st => st.status === TaskStatus.COMPLETED).length;
    return Math.round((completedSubtasks / taskSubtasks.length) * 100);
  }

  /**
   * Get task duration in milliseconds
   */
  static getTaskDuration(task: Task): number | null {
    if (!task.startedAt) return null;
    
    const endTime = task.completedAt || new Date();
    return endTime.getTime() - task.startedAt.getTime();
  }

  /**
   * Check if task is overdue
   */
  static isTaskOverdue(task: Task): boolean {
    if (!task.startedAt || task.status === TaskStatus.COMPLETED) {
      return false;
    }

    const now = new Date();
    const expectedEndTime = new Date(task.startedAt.getTime() + task.estimatedTime);
    return now > expectedEndTime;
  }
}
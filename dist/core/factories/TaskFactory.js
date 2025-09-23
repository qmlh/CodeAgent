"use strict";
/**
 * Task factory for creating and initializing tasks
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskFactory = void 0;
const uuid_1 = require("uuid");
const task_types_1 = require("../../types/task.types");
const validators_1 = require("../validation/validators");
const SystemError_1 = require("../errors/SystemError");
/**
 * Task factory class
 */
class TaskFactory {
    /**
     * Create a new task with default values
     */
    static createTask(options) {
        const task = {
            id: (0, uuid_1.v4)(),
            title: options.title,
            description: options.description,
            type: options.type,
            status: task_types_1.TaskStatus.PENDING,
            priority: options.priority || task_types_1.TaskPriority.MEDIUM,
            assignedAgent: options.assignedAgent,
            dependencies: options.dependencies || [],
            estimatedTime: options.estimatedTime || 3600000, // 1 hour default
            files: options.files || [],
            requirements: options.requirements || [],
            createdAt: new Date()
        };
        // Validate the created task
        validators_1.ValidationUtils.validateOrThrow(this.taskValidator, task, 'TaskFactory.createTask');
        return task;
    }
    /**
     * Create task from existing data with validation
     */
    static fromData(data) {
        if (!data.id) {
            throw new SystemError_1.ValidationError('Task ID is required when creating from data');
        }
        const task = {
            id: data.id,
            title: data.title || 'Untitled Task',
            description: data.description || 'No description provided',
            type: data.type || 'general',
            status: data.status || task_types_1.TaskStatus.PENDING,
            priority: data.priority || task_types_1.TaskPriority.MEDIUM,
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
        validators_1.ValidationUtils.validateOrThrow(this.taskValidator, task, 'TaskFactory.fromData');
        return task;
    }
    /**
     * Clone an existing task with new ID
     */
    static cloneTask(sourceTask, newTitle) {
        const clonedTask = {
            ...sourceTask,
            id: (0, uuid_1.v4)(),
            title: newTitle || `${sourceTask.title} (Copy)`,
            status: task_types_1.TaskStatus.PENDING,
            assignedAgent: undefined,
            createdAt: new Date(),
            startedAt: undefined,
            completedAt: undefined
        };
        // Validate the cloned task
        validators_1.ValidationUtils.validateOrThrow(this.taskValidator, clonedTask, 'TaskFactory.cloneTask');
        return clonedTask;
    }
    /**
     * Create a subtask from a parent task
     */
    static createSubtask(parentTask, subtaskOptions) {
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
    static updateTaskStatus(task, newStatus, agentId) {
        const now = new Date();
        const updatedTask = {
            ...task,
            status: newStatus
        };
        // Update timestamps based on status
        switch (newStatus) {
            case task_types_1.TaskStatus.IN_PROGRESS:
                if (!task.startedAt) {
                    updatedTask.startedAt = now;
                }
                if (agentId) {
                    updatedTask.assignedAgent = agentId;
                }
                break;
            case task_types_1.TaskStatus.COMPLETED:
                if (!task.startedAt) {
                    updatedTask.startedAt = now;
                }
                updatedTask.completedAt = now;
                break;
            case task_types_1.TaskStatus.FAILED:
                updatedTask.completedAt = now;
                break;
            case task_types_1.TaskStatus.PENDING:
                // Reset timestamps when returning to pending
                updatedTask.startedAt = undefined;
                updatedTask.completedAt = undefined;
                updatedTask.assignedAgent = undefined;
                break;
        }
        // Validate the updated task
        validators_1.ValidationUtils.validateOrThrow(this.taskValidator, updatedTask, 'TaskFactory.updateTaskStatus');
        return updatedTask;
    }
    /**
     * Add dependency to task
     */
    static addDependency(task, dependencyId) {
        if (task.dependencies.includes(dependencyId)) {
            return task; // Dependency already exists
        }
        if (dependencyId === task.id) {
            throw new SystemError_1.ValidationError('Task cannot depend on itself');
        }
        const updatedTask = {
            ...task,
            dependencies: [...task.dependencies, dependencyId]
        };
        // Validate the updated task
        validators_1.ValidationUtils.validateOrThrow(this.taskValidator, updatedTask, 'TaskFactory.addDependency');
        return updatedTask;
    }
    /**
     * Remove dependency from task
     */
    static removeDependency(task, dependencyId) {
        const updatedTask = {
            ...task,
            dependencies: task.dependencies.filter(id => id !== dependencyId)
        };
        // Validate the updated task
        validators_1.ValidationUtils.validateOrThrow(this.taskValidator, updatedTask, 'TaskFactory.removeDependency');
        return updatedTask;
    }
    /**
     * Assign task to agent
     */
    static assignToAgent(task, agentId) {
        const updatedTask = {
            ...task,
            assignedAgent: agentId
        };
        // If task is pending, move to in progress
        if (task.status === task_types_1.TaskStatus.PENDING) {
            return this.updateTaskStatus(updatedTask, task_types_1.TaskStatus.IN_PROGRESS, agentId);
        }
        // Validate the updated task
        validators_1.ValidationUtils.validateOrThrow(this.taskValidator, updatedTask, 'TaskFactory.assignToAgent');
        return updatedTask;
    }
    /**
     * Unassign task from agent
     */
    static unassignFromAgent(task) {
        const updatedTask = {
            ...task,
            assignedAgent: undefined
        };
        // If task is in progress, move back to pending
        if (task.status === task_types_1.TaskStatus.IN_PROGRESS) {
            return this.updateTaskStatus(updatedTask, task_types_1.TaskStatus.PENDING);
        }
        // Validate the updated task
        validators_1.ValidationUtils.validateOrThrow(this.taskValidator, updatedTask, 'TaskFactory.unassignFromAgent');
        return updatedTask;
    }
    /**
     * Create task result
     */
    static createTaskResult(taskId, success, output, error, filesModified = [], executionTime = 0) {
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
    static createTaskChain(tasks) {
        const createdTasks = [];
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
    static createParallelTasks(tasks) {
        return tasks.map(taskOptions => this.createTask(taskOptions));
    }
    /**
     * Validate task data without creating
     */
    static validateTaskData(data) {
        try {
            // Create a temporary task for validation
            const tempTask = this.fromData({
                id: data.id || (0, uuid_1.v4)(),
                ...data
            });
            return { isValid: true, errors: [] };
        }
        catch (error) {
            if (error instanceof SystemError_1.ValidationError) {
                return { isValid: false, errors: [error.message] };
            }
            return { isValid: false, errors: ['Unknown validation error'] };
        }
    }
    /**
     * Check if task can be started (all dependencies completed)
     */
    static canStartTask(task, completedTaskIds) {
        if (task.status !== task_types_1.TaskStatus.PENDING && task.status !== task_types_1.TaskStatus.BLOCKED) {
            return false;
        }
        return task.dependencies.every(depId => completedTaskIds.includes(depId));
    }
    /**
     * Calculate task progress based on subtasks
     */
    static calculateProgress(task, subtasks) {
        const taskSubtasks = subtasks.filter(st => st.dependencies.includes(task.id));
        if (taskSubtasks.length === 0) {
            // No subtasks, progress based on status
            switch (task.status) {
                case task_types_1.TaskStatus.PENDING:
                case task_types_1.TaskStatus.BLOCKED:
                    return 0;
                case task_types_1.TaskStatus.IN_PROGRESS:
                    return 50;
                case task_types_1.TaskStatus.COMPLETED:
                    return 100;
                case task_types_1.TaskStatus.FAILED:
                    return 0;
                default:
                    return 0;
            }
        }
        // Calculate progress based on subtasks
        const completedSubtasks = taskSubtasks.filter(st => st.status === task_types_1.TaskStatus.COMPLETED).length;
        return Math.round((completedSubtasks / taskSubtasks.length) * 100);
    }
    /**
     * Get task duration in milliseconds
     */
    static getTaskDuration(task) {
        if (!task.startedAt)
            return null;
        const endTime = task.completedAt || new Date();
        return endTime.getTime() - task.startedAt.getTime();
    }
    /**
     * Check if task is overdue
     */
    static isTaskOverdue(task) {
        if (!task.startedAt || task.status === task_types_1.TaskStatus.COMPLETED) {
            return false;
        }
        const now = new Date();
        const expectedEndTime = new Date(task.startedAt.getTime() + task.estimatedTime);
        return now > expectedEndTime;
    }
}
exports.TaskFactory = TaskFactory;
TaskFactory.taskValidator = new validators_1.TaskValidator();
//# sourceMappingURL=TaskFactory.js.map
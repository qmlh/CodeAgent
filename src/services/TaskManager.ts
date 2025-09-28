/**
 * Task Manager implementation
 * Handles task creation, assignment, scheduling, and lifecycle management
 */

import { ITaskManager } from '../core/interfaces/ITaskManager';
import { Task, TaskStatus, TaskPriority, TaskResult } from '../types/task.types';
import { AgentType } from '../types/agent.types';
import { ErrorType, ErrorSeverity } from '../types/error.types';
import { TaskValidator, ValidationUtils } from '../core/validation';
import { SystemError, ValidationError } from '../core/errors/SystemError';
import { generateTaskId } from '../core/utils';

/**
 * Task decomposition result
 */
interface TaskDecompositionResult {
  tasks: Task[];
  dependencies: Map<string, string[]>;
}

/**
 * Task assignment strategy
 */
interface TaskAssignmentStrategy {
  calculateScore(task: Task, agentId: string, agentType: AgentType, currentLoad: number): number;
}

/**
 * Default task assignment strategy based on agent specialization and load
 */
class DefaultAssignmentStrategy implements TaskAssignmentStrategy {
  calculateScore(task: Task, agentId: string, agentType: AgentType, currentLoad: number): number {
    let score = 0;
    
    // Base score based on agent type matching task type
    const typeMatchScore = this.getTypeMatchScore(task.type, agentType);
    score += typeMatchScore * 50;
    
    // Penalty for high workload (0-100 scale)
    const loadPenalty = currentLoad * 0.3;
    score -= loadPenalty;
    
    // Priority bonus
    score += task.priority * 10;
    
    // Complexity penalty (based on estimated time)
    const complexityPenalty = Math.min(task.estimatedTime / 3600000, 5) * 5; // Max 5 points penalty
    score -= complexityPenalty;
    
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
    return matchingTypes.includes(agentType) ? 1 : 0.3; // Partial match for flexibility
  }
}

/**
 * Task priority calculator
 */
class TaskPriorityCalculator {
  static calculatePriority(task: Partial<Task>, dependencies: string[] = []): TaskPriority {
    let score = 0;
    
    // Base priority from task
    if (task.priority) {
      score += task.priority;
    }
    
    // Dependency factor - tasks with many dependents get higher priority
    score += Math.min(dependencies.length * 0.5, 2);
    
    // Estimated time factor - shorter tasks get slight priority boost
    if (task.estimatedTime) {
      const timeHours = task.estimatedTime / 3600000;
      if (timeHours <= 1) score += 0.5;
      else if (timeHours <= 4) score += 0.2;
    }
    
    // File count factor - tasks affecting many files get higher priority
    if (task.files && task.files.length > 5) {
      score += 0.3;
    }
    
    // Convert score to priority enum
    if (score >= 4) return TaskPriority.CRITICAL;
    if (score >= 3) return TaskPriority.HIGH;
    if (score >= 2) return TaskPriority.MEDIUM;
    return TaskPriority.LOW;
  }
}

/**
 * Task Manager implementation
 */
export class TaskManager implements ITaskManager {
  private tasks: Map<string, Task> = new Map();
  private taskQueues: Map<string, string[]> = new Map(); // agentId -> taskIds
  private dependencyGraph: Map<string, Set<string>> = new Map(); // taskId -> dependencies
  private reverseDependencyGraph: Map<string, Set<string>> = new Map(); // taskId -> dependents
  private assignmentStrategy: TaskAssignmentStrategy = new DefaultAssignmentStrategy();
  private validator = new TaskValidator();
  
  // Agent information cache for assignment decisions
  private agentInfo: Map<string, { type: AgentType; workload: number }> = new Map();

  async initialize(): Promise<void> {
    // Initialize task manager components
    // Clear any existing data
    this.tasks.clear();
    this.taskQueues.clear();
    this.dependencyGraph.clear();
    this.reverseDependencyGraph.clear();
    this.agentInfo.clear();
  }
  
  /**
   * Update agent information for assignment decisions
   */
  updateAgentInfo(agentId: string, type: AgentType, workload: number): void {
    this.agentInfo.set(agentId, { type, workload });
  }
  
  /**
   * Remove agent information
   */
  removeAgentInfo(agentId: string): void {
    this.agentInfo.delete(agentId);
    this.taskQueues.delete(agentId);
  }
  
  /**
   * Decompose a high-level requirement into specific tasks
   */
  async decomposeTask(requirement: string): Promise<Task[]> {
    try {
      const decompositionResult = await this.analyzeAndDecomposeRequirement(requirement);
      
      // Create tasks and set up dependencies
      const createdTasks: Task[] = [];
      for (const task of decompositionResult.tasks) {
        const createdTask = await this.createTask(task);
        createdTasks.push(createdTask);
      }
      
      // Set up dependencies
      for (const [taskId, deps] of Array.from(decompositionResult.dependencies.entries())) {
        for (const depId of deps) {
          await this.addDependency(taskId, depId);
        }
      }
      
      return createdTasks;
    } catch (error) {
      throw new SystemError(
        'Failed to decompose task',
        ErrorType.TASK_ERROR,
        ErrorSeverity.HIGH,
        true,
        { metadata: { requirement, originalError: error } }
      );
    }
  }
  
  /**
   * Create a new task
   */
  async createTask(taskData: Partial<Task>): Promise<Task> {
    const taskId = taskData.id || generateTaskId();
    
    const task: Task = {
      id: taskId,
      title: taskData.title || 'Untitled Task',
      description: taskData.description || '',
      type: taskData.type || 'general',
      status: taskData.status || TaskStatus.PENDING,
      priority: taskData.priority || TaskPriorityCalculator.calculatePriority(taskData),
      assignedAgent: taskData.assignedAgent,
      dependencies: taskData.dependencies || [],
      estimatedTime: taskData.estimatedTime || 3600000, // Default 1 hour
      files: taskData.files || [],
      requirements: taskData.requirements || [],
      createdAt: taskData.createdAt || new Date(),
      startedAt: taskData.startedAt,
      completedAt: taskData.completedAt
    };
    
    // Validate task
    ValidationUtils.validateOrThrow(this.validator, task, 'task creation');
    
    // Store task
    this.tasks.set(taskId, task);
    
    // Initialize dependency tracking
    this.dependencyGraph.set(taskId, new Set(task.dependencies));
    this.reverseDependencyGraph.set(taskId, new Set());
    
    // Update reverse dependencies
    for (const depId of task.dependencies) {
      if (!this.reverseDependencyGraph.has(depId)) {
        this.reverseDependencyGraph.set(depId, new Set());
      }
      this.reverseDependencyGraph.get(depId)!.add(taskId);
    }
    
    return task;
  }
  
  /**
   * Assign task to an agent
   */
  async assignTask(task: Task, agentId?: string): Promise<void> {
    if (agentId) {
      // Manual assignment
      await this.assignTaskToAgent(task.id, agentId);
    } else {
      // Automatic assignment
      const bestAgent = await this.findBestAgentForTask(task);
      if (bestAgent) {
        await this.assignTaskToAgent(task.id, bestAgent);
      } else {
        throw new SystemError(
          'No suitable agent found for task',
          ErrorType.AGENT_ERROR,
          ErrorSeverity.HIGH,
          true,
          { taskId: task.id, metadata: { taskType: task.type } }
        );
      }
    }
  }
  
  /**
   * Reassign task to a different agent
   */
  async reassignTask(taskId: string, newAgentId: string): Promise<void> {
    const task = this.tasks.get(taskId);
    if (!task) {
      throw new ValidationError(`Task not found: ${taskId}`);
    }
    
    // Remove from current agent's queue
    if (task.assignedAgent) {
      const currentQueue = this.taskQueues.get(task.assignedAgent) || [];
      const index = currentQueue.indexOf(taskId);
      if (index > -1) {
        currentQueue.splice(index, 1);
      }
    }
    
    // Assign to new agent
    await this.assignTaskToAgent(taskId, newAgentId);
  }
  
  /**
   * Get task queue for an agent
   */
  async getTaskQueue(agentId: string): Promise<Task[]> {
    const taskIds = this.taskQueues.get(agentId) || [];
    return taskIds
      .map(id => this.tasks.get(id))
      .filter((task): task is Task => task !== undefined)
      .sort((a, b) => {
        // Sort by priority (higher first), then by creation date
        if (a.priority !== b.priority) {
          return b.priority - a.priority;
        }
        return a.createdAt.getTime() - b.createdAt.getTime();
      });
  }
  
  /**
   * Get available tasks that can be assigned
   */
  async getAvailableTasks(agentType?: string): Promise<Task[]> {
    const availableTasks: Task[] = [];
    
    for (const task of Array.from(this.tasks.values())) {
      // Skip if already assigned
      if (task.assignedAgent) continue;
      
      // Skip if not pending
      if (task.status !== TaskStatus.PENDING) continue;
      
      // Skip if dependencies not met
      if (!await this.areDependenciesMet(task.id)) continue;
      
      // Filter by agent type if specified
      if (agentType && !this.isTaskSuitableForAgentType(task, agentType as AgentType)) {
        continue;
      }
      
      availableTasks.push(task);
    }
    
    return availableTasks.sort((a, b) => b.priority - a.priority);
  }
  
  /**
   * Update task status
   */
  async updateTaskStatus(taskId: string, status: TaskStatus): Promise<void> {
    const task = this.tasks.get(taskId);
    if (!task) {
      throw new ValidationError(`Task not found: ${taskId}`);
    }
    
    const oldStatus = task.status;
    task.status = status;
    
    // Update timestamps based on status
    switch (status) {
      case TaskStatus.IN_PROGRESS:
        if (!task.startedAt) {
          task.startedAt = new Date();
        }
        break;
      case TaskStatus.COMPLETED:
      case TaskStatus.FAILED:
        if (!task.completedAt) {
          task.completedAt = new Date();
        }
        break;
    }
    
    // Validate the updated task
    ValidationUtils.validateOrThrow(this.validator, task, 'task status update');
    
    // If task is completed, check if dependent tasks can now be started
    if (status === TaskStatus.COMPLETED) {
      await this.checkAndUnblockDependentTasks(taskId);
    }
  }
  
  /**
   * Get a specific task
   */
  async getTask(taskId: string): Promise<Task | null> {
    return this.tasks.get(taskId) || null;
  }
  
  /**
   * Get tasks with optional filtering
   */
  async getTasks(filter?: Partial<Task>): Promise<Task[]> {
    let tasks = Array.from(this.tasks.values());
    
    if (filter) {
      tasks = tasks.filter(task => {
        for (const [key, value] of Object.entries(filter)) {
          if (key in task && (task as any)[key] !== value) {
            return false;
          }
        }
        return true;
      });
    }
    
    return tasks;
  }
  
  /**
   * Get task dependencies
   */
  async getDependencies(taskId: string): Promise<Task[]> {
    const dependencyIds = this.dependencyGraph.get(taskId) || new Set();
    return Array.from(dependencyIds)
      .map(id => this.tasks.get(id))
      .filter((task): task is Task => task !== undefined);
  }
  
  /**
   * Add a dependency relationship
   */
  async addDependency(taskId: string, dependencyId: string): Promise<void> {
    // Validate both tasks exist
    if (!this.tasks.has(taskId)) {
      throw new ValidationError(`Task not found: ${taskId}`);
    }
    if (!this.tasks.has(dependencyId)) {
      throw new ValidationError(`Dependency task not found: ${dependencyId}`);
    }
    
    // Check for circular dependencies
    if (await this.wouldCreateCircularDependency(taskId, dependencyId)) {
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
    
    // Update task object
    const task = this.tasks.get(taskId)!;
    if (!task.dependencies.includes(dependencyId)) {
      task.dependencies.push(dependencyId);
    }
  }
  
  /**
   * Remove a dependency relationship
   */
  async removeDependency(taskId: string, dependencyId: string): Promise<void> {
    // Remove from dependency graph
    const dependencies = this.dependencyGraph.get(taskId);
    if (dependencies) {
      dependencies.delete(dependencyId);
    }
    
    // Remove from reverse dependency graph
    const dependents = this.reverseDependencyGraph.get(dependencyId);
    if (dependents) {
      dependents.delete(taskId);
    }
    
    // Update task object
    const task = this.tasks.get(taskId);
    if (task) {
      const index = task.dependencies.indexOf(dependencyId);
      if (index > -1) {
        task.dependencies.splice(index, 1);
      }
    }
  }
  
  /**
   * Update task priority
   */
  async updateTaskPriority(taskId: string, priority: number): Promise<void> {
    const task = this.tasks.get(taskId);
    if (!task) {
      throw new ValidationError(`Task not found: ${taskId}`);
    }
    
    if (!Object.values(TaskPriority).includes(priority as TaskPriority)) {
      throw new ValidationError(`Invalid priority: ${priority}`);
    }
    
    task.priority = priority as TaskPriority;
    
    // Re-sort agent queues if task is assigned
    if (task.assignedAgent) {
      const queue = this.taskQueues.get(task.assignedAgent);
      if (queue) {
        // Remove and re-add to trigger re-sorting
        const index = queue.indexOf(taskId);
        if (index > -1) {
          queue.splice(index, 1);
          this.insertTaskInQueue(task.assignedAgent, taskId);
        }
      }
    }
  }
  
  /**
   * Get next task for an agent
   */
  async getNextTask(agentId: string): Promise<Task | null> {
    const queue = await this.getTaskQueue(agentId);
    
    // Find the first task that can be started (dependencies met)
    for (const task of queue) {
      if (task.status === TaskStatus.PENDING && await this.areDependenciesMet(task.id)) {
        return task;
      }
    }
    
    return null;
  }
  
  /**
   * Get task statistics
   */
  async getTaskStatistics(): Promise<{
    total: number;
    completed: number;
    failed: number;
    inProgress: number;
    pending: number;
  }> {
    const stats = {
      total: this.tasks.size,
      completed: 0,
      failed: 0,
      inProgress: 0,
      pending: 0
    };
    
    for (const task of Array.from(this.tasks.values())) {
      switch (task.status) {
        case TaskStatus.COMPLETED:
          stats.completed++;
          break;
        case TaskStatus.FAILED:
          stats.failed++;
          break;
        case TaskStatus.IN_PROGRESS:
          stats.inProgress++;
          break;
        case TaskStatus.PENDING:
          stats.pending++;
          break;
      }
    }
    
    return stats;
  }
  
  // Private helper methods
  
  private async analyzeAndDecomposeRequirement(requirement: string): Promise<TaskDecompositionResult> {
    // This is a simplified decomposition logic
    // In a real implementation, this would use AI/ML to analyze requirements
    
    const tasks: Partial<Task>[] = [];
    const dependencies = new Map<string, string[]>();
    
    // Simple keyword-based decomposition
    const keywords = requirement.toLowerCase();
    
    if (keywords.includes('frontend') || keywords.includes('ui') || keywords.includes('interface')) {
      const frontendTaskId = generateTaskId();
      tasks.push({
        id: frontendTaskId,
        title: 'Frontend Development',
        description: `Implement frontend components for: ${requirement}`,
        type: 'frontend',
        priority: TaskPriority.HIGH,
        estimatedTime: 7200000, // 2 hours
        files: ['src/components/', 'src/pages/'],
        requirements: [requirement]
      });
    }
    
    if (keywords.includes('backend') || keywords.includes('api') || keywords.includes('server')) {
      const backendTaskId = generateTaskId();
      tasks.push({
        id: backendTaskId,
        title: 'Backend Development',
        description: `Implement backend services for: ${requirement}`,
        type: 'backend',
        priority: TaskPriority.HIGH,
        estimatedTime: 10800000, // 3 hours
        files: ['src/services/', 'src/controllers/'],
        requirements: [requirement]
      });
    }
    
    if (keywords.includes('test') || keywords.includes('testing')) {
      const testTaskId = generateTaskId();
      tasks.push({
        id: testTaskId,
        title: 'Testing Implementation',
        description: `Create tests for: ${requirement}`,
        type: 'testing',
        priority: TaskPriority.MEDIUM,
        estimatedTime: 5400000, // 1.5 hours
        files: ['src/__tests__/', 'tests/'],
        requirements: [requirement]
      });
      
      // Tests depend on implementation tasks
      const implementationTasks = tasks.filter(t => t.type !== 'testing');
      if (implementationTasks.length > 0) {
        dependencies.set(testTaskId, implementationTasks.map(t => t.id!));
      }
    }
    
    if (keywords.includes('documentation') || keywords.includes('docs')) {
      const docTaskId = generateTaskId();
      tasks.push({
        id: docTaskId,
        title: 'Documentation',
        description: `Create documentation for: ${requirement}`,
        type: 'documentation',
        priority: TaskPriority.LOW,
        estimatedTime: 3600000, // 1 hour
        files: ['docs/', 'README.md'],
        requirements: [requirement]
      });
    }
    
    // If no specific tasks identified, create a general task
    if (tasks.length === 0) {
      tasks.push({
        id: generateTaskId(),
        title: 'General Implementation',
        description: requirement,
        type: 'general',
        priority: TaskPriority.MEDIUM,
        estimatedTime: 7200000, // 2 hours
        files: [],
        requirements: [requirement]
      });
    }
    
    return {
      tasks: tasks as Task[],
      dependencies
    };
  }
  
  private async assignTaskToAgent(taskId: string, agentId: string): Promise<void> {
    const task = this.tasks.get(taskId);
    if (!task) {
      throw new ValidationError(`Task not found: ${taskId}`);
    }
    
    // Update task assignment
    task.assignedAgent = agentId;
    
    // Add to agent's queue
    if (!this.taskQueues.has(agentId)) {
      this.taskQueues.set(agentId, []);
    }
    
    this.insertTaskInQueue(agentId, taskId);
  }
  
  private insertTaskInQueue(agentId: string, taskId: string): void {
    const queue = this.taskQueues.get(agentId)!;
    const task = this.tasks.get(taskId)!;
    
    // Insert in priority order
    let insertIndex = queue.length;
    for (let i = 0; i < queue.length; i++) {
      const queueTask = this.tasks.get(queue[i])!;
      if (task.priority > queueTask.priority) {
        insertIndex = i;
        break;
      }
    }
    
    queue.splice(insertIndex, 0, taskId);
  }
  
  private async findBestAgentForTask(task: Task): Promise<string | null> {
    let bestAgent: string | null = null;
    let bestScore = -1;
    
    for (const [agentId, info] of Array.from(this.agentInfo.entries())) {
      const score = this.assignmentStrategy.calculateScore(task, agentId, info.type, info.workload);
      if (score > bestScore) {
        bestScore = score;
        bestAgent = agentId;
      }
    }
    
    return bestAgent;
  }
  
  private async areDependenciesMet(taskId: string): Promise<boolean> {
    const dependencies = this.dependencyGraph.get(taskId) || new Set();
    
    for (const depId of Array.from(dependencies)) {
      const depTask = this.tasks.get(depId);
      if (!depTask || depTask.status !== TaskStatus.COMPLETED) {
        return false;
      }
    }
    
    return true;
  }
  
  private isTaskSuitableForAgentType(task: Task, agentType: AgentType): boolean {
    const strategy = new DefaultAssignmentStrategy();
    const score = strategy.calculateScore(task, 'dummy', agentType, 0);
    return score > 30; // Threshold for suitability
  }
  
  private async wouldCreateCircularDependency(taskId: string, dependencyId: string): Promise<boolean> {
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
  
  private async checkAndUnblockDependentTasks(completedTaskId: string): Promise<void> {
    const dependents = this.reverseDependencyGraph.get(completedTaskId) || new Set();
    
    for (const dependentId of Array.from(dependents)) {
      const dependentTask = this.tasks.get(dependentId);
      if (dependentTask && dependentTask.status === TaskStatus.BLOCKED) {
        // Check if all dependencies are now met
        if (await this.areDependenciesMet(dependentId)) {
          await this.updateTaskStatus(dependentId, TaskStatus.PENDING);
        }
      }
    }
  }
}
/**
 * TaskManager unit tests
 */

import { TaskManager } from '../TaskManager';
import { Task, TaskStatus, TaskPriority } from '../../types/task.types';
import { AgentType } from '../../types/agent.types';
import { ValidationError, SystemError } from '../../core/errors/SystemError';

describe('TaskManager', () => {
  let taskManager: TaskManager;

  beforeEach(() => {
    taskManager = new TaskManager();
    
    // Set up some test agents
    taskManager.updateAgentInfo('agent-1', AgentType.FRONTEND, 20);
    taskManager.updateAgentInfo('agent-2', AgentType.BACKEND, 50);
    taskManager.updateAgentInfo('agent-3', AgentType.TESTING, 10);
  });

  describe('createTask', () => {
    it('should create a task with valid data', async () => {
      const taskData = {
        title: 'Test Task',
        description: 'A test task',
        type: 'frontend',
        priority: TaskPriority.HIGH
      };

      const task = await taskManager.createTask(taskData);

      expect(task.id).toBeDefined();
      expect(task.title).toBe('Test Task');
      expect(task.description).toBe('A test task');
      expect(task.type).toBe('frontend');
      expect(task.priority).toBe(TaskPriority.HIGH);
      expect(task.status).toBe(TaskStatus.PENDING);
      expect(task.createdAt).toBeInstanceOf(Date);
    });

    it('should generate default values for missing fields', async () => {
      const taskData = {
        title: 'Minimal Task'
      };

      const task = await taskManager.createTask(taskData);

      expect(task.description).toBe('');
      expect(task.type).toBe('general');
      expect(task.status).toBe(TaskStatus.PENDING);
      expect(task.dependencies).toEqual([]);
      expect(task.files).toEqual([]);
      expect(task.requirements).toEqual([]);
    });

    it('should throw validation error for invalid task data', async () => {
      const taskData = {
        title: '', // Invalid empty title
        description: 'Test'
      };

      await expect(taskManager.createTask(taskData)).rejects.toThrow(ValidationError);
    });
  });

  describe('decomposeTask', () => {
    it('should decompose frontend requirement into tasks', async () => {
      const requirement = 'Create a user interface for login functionality';
      
      const tasks = await taskManager.decomposeTask(requirement);
      
      expect(tasks.length).toBeGreaterThan(0);
      const frontendTask = tasks.find(t => t.type === 'frontend');
      expect(frontendTask).toBeDefined();
      expect(frontendTask?.title).toContain('Frontend');
    });

    it('should decompose backend requirement into tasks', async () => {
      const requirement = 'Implement API endpoints for user authentication';
      
      const tasks = await taskManager.decomposeTask(requirement);
      
      expect(tasks.length).toBeGreaterThan(0);
      const backendTask = tasks.find(t => t.type === 'backend');
      expect(backendTask).toBeDefined();
      expect(backendTask?.title).toContain('Backend');
    });

    it('should create dependencies between tasks', async () => {
      const requirement = 'Create login system with frontend, backend, and tests';
      
      const tasks = await taskManager.decomposeTask(requirement);
      
      const testTask = tasks.find(t => t.type === 'testing');
      if (testTask) {
        expect(testTask.dependencies.length).toBeGreaterThan(0);
      }
    });

    it('should create general task for unspecific requirements', async () => {
      const requirement = 'Fix the bug in the system';
      
      const tasks = await taskManager.decomposeTask(requirement);
      
      expect(tasks.length).toBe(1);
      expect(tasks[0].type).toBe('general');
    });
  });

  describe('assignTask', () => {
    let task: Task;

    beforeEach(async () => {
      task = await taskManager.createTask({
        title: 'Frontend Task',
        type: 'frontend',
        priority: TaskPriority.HIGH
      });
    });

    it('should assign task to specified agent', async () => {
      await taskManager.assignTask(task, 'agent-1');
      
      const updatedTask = await taskManager.getTask(task.id);
      expect(updatedTask?.assignedAgent).toBe('agent-1');
      
      const queue = await taskManager.getTaskQueue('agent-1');
      expect(queue).toContainEqual(expect.objectContaining({ id: task.id }));
    });

    it('should auto-assign task to best suitable agent', async () => {
      await taskManager.assignTask(task);
      
      const updatedTask = await taskManager.getTask(task.id);
      expect(updatedTask?.assignedAgent).toBe('agent-1'); // Frontend agent with lower workload
    });

    it('should throw error when no suitable agent available', async () => {
      // Remove all agents
      taskManager.removeAgentInfo('agent-1');
      taskManager.removeAgentInfo('agent-2');
      taskManager.removeAgentInfo('agent-3');
      
      await expect(taskManager.assignTask(task)).rejects.toThrow(SystemError);
    });
  }); 
 describe('task dependencies', () => {
    let task1: Task;
    let task2: Task;

    beforeEach(async () => {
      task1 = await taskManager.createTask({
        title: 'Task 1',
        type: 'backend'
      });
      task2 = await taskManager.createTask({
        title: 'Task 2',
        type: 'frontend'
      });
    });

    it('should add dependency between tasks', async () => {
      await taskManager.addDependency(task2.id, task1.id);
      
      const dependencies = await taskManager.getDependencies(task2.id);
      expect(dependencies).toContainEqual(expect.objectContaining({ id: task1.id }));
    });

    it('should prevent circular dependencies', async () => {
      await taskManager.addDependency(task2.id, task1.id);
      
      await expect(taskManager.addDependency(task1.id, task2.id))
        .rejects.toThrow(ValidationError);
    });

    it('should remove dependency', async () => {
      await taskManager.addDependency(task2.id, task1.id);
      await taskManager.removeDependency(task2.id, task1.id);
      
      const dependencies = await taskManager.getDependencies(task2.id);
      expect(dependencies).not.toContainEqual(expect.objectContaining({ id: task1.id }));
    });
  });

  describe('task status management', () => {
    let task: Task;

    beforeEach(async () => {
      task = await taskManager.createTask({
        title: 'Status Test Task',
        type: 'general'
      });
    });

    it('should update task status', async () => {
      await taskManager.updateTaskStatus(task.id, TaskStatus.IN_PROGRESS);
      
      const updatedTask = await taskManager.getTask(task.id);
      expect(updatedTask?.status).toBe(TaskStatus.IN_PROGRESS);
      expect(updatedTask?.startedAt).toBeInstanceOf(Date);
    });

    it('should set completion timestamp when completed', async () => {
      await taskManager.updateTaskStatus(task.id, TaskStatus.COMPLETED);
      
      const updatedTask = await taskManager.getTask(task.id);
      expect(updatedTask?.status).toBe(TaskStatus.COMPLETED);
      expect(updatedTask?.completedAt).toBeInstanceOf(Date);
    });

    it('should throw error for non-existent task', async () => {
      await expect(taskManager.updateTaskStatus('non-existent', TaskStatus.COMPLETED))
        .rejects.toThrow(ValidationError);
    });
  });

  describe('task queues and scheduling', () => {
    let task1: Task;
    let task2: Task;

    beforeEach(async () => {
      task1 = await taskManager.createTask({
        title: 'High Priority Task',
        type: 'frontend',
        priority: TaskPriority.HIGH
      });
      task2 = await taskManager.createTask({
        title: 'Low Priority Task',
        type: 'frontend',
        priority: TaskPriority.LOW
      });
    });

    it('should return tasks in priority order', async () => {
      await taskManager.assignTask(task1, 'agent-1');
      await taskManager.assignTask(task2, 'agent-1');
      
      const queue = await taskManager.getTaskQueue('agent-1');
      expect(queue[0].priority).toBeGreaterThanOrEqual(queue[1].priority);
    });

    it('should get next available task for agent', async () => {
      await taskManager.assignTask(task1, 'agent-1');
      
      const nextTask = await taskManager.getNextTask('agent-1');
      expect(nextTask?.id).toBe(task1.id);
    });

    it('should return null when no tasks available', async () => {
      const nextTask = await taskManager.getNextTask('agent-1');
      expect(nextTask).toBeNull();
    });
  });

  describe('task filtering and statistics', () => {
    beforeEach(async () => {
      // Create tasks with different statuses
      await taskManager.createTask({
        title: 'Pending Task',
        status: TaskStatus.PENDING
      });
      await taskManager.createTask({
        title: 'In Progress Task',
        status: TaskStatus.IN_PROGRESS
      });
      await taskManager.createTask({
        title: 'Completed Task',
        status: TaskStatus.COMPLETED
      });
    });

    it('should filter tasks by status', async () => {
      const pendingTasks = await taskManager.getTasks({ status: TaskStatus.PENDING });
      expect(pendingTasks.length).toBe(1);
      expect(pendingTasks[0].title).toBe('Pending Task');
    });

    it('should return all tasks when no filter provided', async () => {
      const allTasks = await taskManager.getTasks();
      expect(allTasks.length).toBe(3);
    });

    it('should return correct task statistics', async () => {
      const stats = await taskManager.getTaskStatistics();
      
      expect(stats.total).toBe(3);
      expect(stats.pending).toBe(1);
      expect(stats.inProgress).toBe(1);
      expect(stats.completed).toBe(1);
      expect(stats.failed).toBe(0);
    });
  });

  describe('available tasks', () => {
    let task1: Task;
    let task2: Task;
    let task3: Task;

    beforeEach(async () => {
      task1 = await taskManager.createTask({
        title: 'Available Task',
        type: 'frontend',
        status: TaskStatus.PENDING
      });
      task2 = await taskManager.createTask({
        title: 'Assigned Task',
        type: 'frontend',
        status: TaskStatus.PENDING
      });
      task3 = await taskManager.createTask({
        title: 'Dependent Task',
        type: 'frontend',
        status: TaskStatus.PENDING
      });
      
      // Assign task2
      await taskManager.assignTask(task2, 'agent-1');
      
      // Make task3 dependent on task1
      await taskManager.addDependency(task3.id, task1.id);
    });

    it('should return only unassigned tasks with met dependencies', async () => {
      const availableTasks = await taskManager.getAvailableTasks();
      
      expect(availableTasks).toContainEqual(expect.objectContaining({ id: task1.id }));
      expect(availableTasks).not.toContainEqual(expect.objectContaining({ id: task2.id })); // Assigned
      expect(availableTasks).not.toContainEqual(expect.objectContaining({ id: task3.id })); // Has unmet dependency
    });

    it('should filter by agent type', async () => {
      const frontendTasks = await taskManager.getAvailableTasks('frontend');
      expect(frontendTasks.length).toBeGreaterThan(0);
      expect(frontendTasks.every(t => t.type === 'frontend')).toBe(true);
    });
  });

  describe('priority management', () => {
    let task: Task;

    beforeEach(async () => {
      task = await taskManager.createTask({
        title: 'Priority Test Task',
        priority: TaskPriority.LOW
      });
    });

    it('should update task priority', async () => {
      await taskManager.updateTaskPriority(task.id, TaskPriority.HIGH);
      
      const updatedTask = await taskManager.getTask(task.id);
      expect(updatedTask?.priority).toBe(TaskPriority.HIGH);
    });

    it('should throw error for invalid priority', async () => {
      await expect(taskManager.updateTaskPriority(task.id, 999 as TaskPriority))
        .rejects.toThrow(ValidationError);
    });
  });

  describe('agent management', () => {
    it('should update agent information', () => {
      taskManager.updateAgentInfo('new-agent', AgentType.DOCUMENTATION, 75);
      
      // Verify by trying to assign a task
      expect(() => taskManager.updateAgentInfo('new-agent', AgentType.DOCUMENTATION, 75))
        .not.toThrow();
    });

    it('should remove agent information', async () => {
      const task = await taskManager.createTask({
        title: 'Test Task',
        type: 'frontend'
      });
      
      await taskManager.assignTask(task, 'agent-1');
      taskManager.removeAgentInfo('agent-1');
      
      const queue = await taskManager.getTaskQueue('agent-1');
      expect(queue).toEqual([]);
    });
  });
});
/**
 * Tests for BaseAgent class
 */

import { BaseAgent } from '../BaseAgent';
import { TestAgent } from '../TestAgent';
import { AgentType, AgentStatus, TaskStatus, TaskPriority } from '../../core';
import { AgentFactory, TaskFactory } from '../../core/factories';

describe('BaseAgent', () => {
  let agent: TestAgent;
  let config: any;

  beforeEach(() => {
    config = {
      name: 'Test Agent',
      type: AgentType.TESTING,
      capabilities: ['testing', 'analysis'],
      maxConcurrentTasks: 3,
      timeout: 5000,
      retryAttempts: 2
    };
    
    agent = new TestAgent('test-agent-1', 'Test Agent', config);
  });

  afterEach(async () => {
    if (agent.getStatus() !== AgentStatus.OFFLINE) {
      await agent.shutdown();
    }
  });

  describe('Initialization', () => {
    it('should initialize agent successfully', async () => {
      expect(agent.getStatus()).toBe(AgentStatus.OFFLINE);
      
      await agent.initialize(config);
      
      expect(agent.getStatus()).toBe(AgentStatus.IDLE);
      expect(agent.isHealthy()).toBe(true);
      expect(agent.getInitializationData()).toBeDefined();
    });

    it('should not allow double initialization', async () => {
      await agent.initialize(config);
      
      await expect(agent.initialize(config)).rejects.toThrow('Agent is already initialized');
    });

    it('should emit status-changed event during initialization', async () => {
      const statusChanges: AgentStatus[] = [];
      
      agent.on('status-changed', (oldStatus, newStatus) => {
        statusChanges.push(newStatus);
      });
      
      await agent.initialize(config);
      
      expect(statusChanges).toContain(AgentStatus.IDLE);
    });
  });

  describe('Task Execution', () => {
    beforeEach(async () => {
      await agent.initialize(config);
    });

    it('should execute a simple task successfully', async () => {
      const task = TaskFactory.createTask({
        title: 'Test Task',
        description: 'A simple test task',
        type: 'test'
      });

      const result = await agent.executeTask(task);

      expect(result.success).toBe(true);
      expect(result.taskId).toBe(task.id);
      expect(result.executionTime).toBeGreaterThan(0);
      expect(result.completedAt).toBeInstanceOf(Date);
    });

    it('should update status during task execution', async () => {
      const task = TaskFactory.createTask({
        title: 'Test Task',
        description: 'A test task',
        type: 'test'
      });

      const statusChanges: AgentStatus[] = [];
      agent.on('status-changed', (oldStatus, newStatus) => {
        statusChanges.push(newStatus);
      });

      await agent.executeTask(task);

      expect(statusChanges).toContain(AgentStatus.WORKING);
      expect(statusChanges).toContain(AgentStatus.IDLE);
    });

    it('should emit task events', async () => {
      const task = TaskFactory.createTask({
        title: 'Test Task',
        description: 'A test task',
        type: 'test'
      });

      let taskStarted = false;
      let taskCompleted = false;

      agent.on('task-started', () => { taskStarted = true; });
      agent.on('task-completed', () => { taskCompleted = true; });

      await agent.executeTask(task);

      expect(taskStarted).toBe(true);
      expect(taskCompleted).toBe(true);
    });

    it('should handle task execution errors', async () => {
      const task = TaskFactory.createTask({
        title: 'Error Task',
        description: 'A task that will fail',
        type: 'error'
      });

      // Mock the test agent to throw an error
      jest.spyOn(agent as any, 'simulateTaskExecution').mockRejectedValue(new Error('Simulated error'));

      let taskFailed = false;
      agent.on('task-failed', () => { taskFailed = true; });

      // Task execution should throw an error
      await expect(agent.executeTask(task)).rejects.toThrow('Task execution failed');
      expect(taskFailed).toBe(true);
    });

    it('should respect maximum concurrent tasks limit', async () => {
      const tasks = Array.from({ length: 5 }, (_, i) => 
        TaskFactory.createTask({
          title: `Task ${i + 1}`,
          description: `Test task ${i + 1}`,
          type: 'test'
        })
      );

      // Start multiple tasks concurrently
      const promises = tasks.map(task => agent.executeTask(task));

      // The first 3 should start, the rest should fail
      const results = await Promise.allSettled(promises);
      
      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;

      expect(successful).toBeLessThanOrEqual(config.maxConcurrentTasks);
      expect(failed).toBeGreaterThan(0);
    });

    it('should update workload based on active tasks', async () => {
      expect(agent.getWorkload()).toBe(0);

      const task = TaskFactory.createTask({
        title: 'Long Task',
        description: 'A task that takes time',
        type: 'test'
      });

      // Start task but don't wait for completion
      const promise = agent.executeTask(task);
      
      // Check workload during execution
      await new Promise(resolve => setTimeout(resolve, 100));
      expect(agent.getWorkload()).toBeGreaterThan(0);

      // Wait for completion
      await promise;
      expect(agent.getWorkload()).toBe(0);
    });

    it('should not execute tasks when not initialized', async () => {
      const uninitializedAgent = new TestAgent('test-agent-2', 'Test Agent 2', config);
      
      const task = TaskFactory.createTask({
        title: 'Test Task',
        description: 'A test task',
        type: 'test'
      });

      await expect(uninitializedAgent.executeTask(task)).rejects.toThrow('Agent must be initialized');
    });
  });

  describe('Configuration Management', () => {
    beforeEach(async () => {
      await agent.initialize(config);
    });

    it('should update configuration successfully', async () => {
      const newConfig = {
        ...config,
        maxConcurrentTasks: 5,
        timeout: 10000
      };

      let configUpdated = false;
      agent.on('config-updated', () => { configUpdated = true; });

      await agent.updateConfig({ maxConcurrentTasks: 5, timeout: 10000 });

      expect(configUpdated).toBe(true);
      expect(agent.getConfig().maxConcurrentTasks).toBe(5);
      expect(agent.getConfig().timeout).toBe(10000);
    });

    it('should validate configuration updates', async () => {
      await expect(agent.updateConfig({ maxConcurrentTasks: 0 }))
        .rejects.toThrow('Max concurrent tasks must be greater than 0');
    });

    it('should return immutable config copy', () => {
      const config1 = agent.getConfig();
      const config2 = agent.getConfig();

      expect(config1).toEqual(config2);
      expect(config1).not.toBe(config2); // Different objects

      // Modifying returned config should not affect agent
      config1.maxConcurrentTasks = 999;
      expect(agent.getConfig().maxConcurrentTasks).not.toBe(999);
    });
  });

  describe('Status and Health', () => {
    it('should track status changes correctly', async () => {
      expect(agent.getStatus()).toBe(AgentStatus.OFFLINE);
      expect(agent.isHealthy()).toBe(false);

      await agent.initialize(config);
      expect(agent.getStatus()).toBe(AgentStatus.IDLE);
      expect(agent.isHealthy()).toBe(true);

      await agent.shutdown();
      expect(agent.getStatus()).toBe(AgentStatus.OFFLINE);
      expect(agent.isHealthy()).toBe(false);
    });

    it('should provide agent capabilities', () => {
      const capabilities = agent.getCapabilities();
      expect(capabilities).toEqual(['testing', 'analysis']);
      
      // Should return a copy, not the original array
      capabilities.push('new-capability');
      expect(agent.getCapabilities()).toEqual(['testing', 'analysis']);
    });

    it('should track current task', async () => {
      await agent.initialize(config);
      
      expect(agent.getCurrentTask()).toBeNull();

      const task = TaskFactory.createTask({
        title: 'Current Task',
        description: 'A task to track',
        type: 'test'
      });

      // Start task but don't wait
      const promise = agent.executeTask(task);
      
      // Check current task during execution
      await new Promise(resolve => setTimeout(resolve, 100));
      expect(agent.getCurrentTask()?.id).toBe(task.id);

      // Wait for completion
      await promise;
      expect(agent.getCurrentTask()).toBeNull();
    });
  });

  describe('Statistics and History', () => {
    beforeEach(async () => {
      await agent.initialize(config);
    });

    it('should track task history', async () => {
      const task1 = TaskFactory.createTask({
        title: 'Task 1',
        description: 'First task',
        type: 'test'
      });

      const task2 = TaskFactory.createTask({
        title: 'Task 2',
        description: 'Second task',
        type: 'analysis'
      });

      await agent.executeTask(task1);
      await agent.executeTask(task2);

      const history = agent.getTaskHistory();
      expect(history).toHaveLength(2);
      expect(history[0].taskId).toBe(task1.id);
      expect(history[1].taskId).toBe(task2.id);
    });

    it('should provide agent statistics', async () => {
      const task = TaskFactory.createTask({
        title: 'Stats Task',
        description: 'Task for statistics',
        type: 'test'
      });

      await agent.executeTask(task);

      const stats = agent.getStatistics();
      expect(stats.totalTasks).toBe(1);
      expect(stats.completedTasks).toBe(1);
      expect(stats.failedTasks).toBe(0);
      expect(stats.successRate).toBe(1);
      expect(stats.averageExecutionTime).toBeGreaterThan(0);
      expect(stats.status).toBe(AgentStatus.IDLE);
    });

    it('should track active tasks', async () => {
      expect(agent.getActiveTasks()).toHaveLength(0);

      const task = TaskFactory.createTask({
        title: 'Active Task',
        description: 'A task to track as active',
        type: 'test'
      });

      // Start task but don't wait
      const promise = agent.executeTask(task);
      
      // Check active tasks during execution
      await new Promise(resolve => setTimeout(resolve, 100));
      expect(agent.getActiveTasks()).toHaveLength(1);
      expect(agent.getActiveTasks()[0].id).toBe(task.id);

      // Wait for completion
      await promise;
      expect(agent.getActiveTasks()).toHaveLength(0);
    });
  });

  describe('Shutdown', () => {
    beforeEach(async () => {
      await agent.initialize(config);
    });

    it('should shutdown gracefully', async () => {
      expect(agent.isHealthy()).toBe(true);
      
      await agent.shutdown();
      
      expect(agent.getStatus()).toBe(AgentStatus.OFFLINE);
      expect(agent.isHealthy()).toBe(false);
    });

    it('should handle shutdown when not initialized', async () => {
      const uninitializedAgent = new TestAgent('test-agent-3', 'Test Agent 3', config);
      
      // Should not throw
      await expect(uninitializedAgent.shutdown()).resolves.not.toThrow();
    });

    it('should clean up active tasks during shutdown', async () => {
      const task = TaskFactory.createTask({
        title: 'Long Task',
        description: 'A long running task',
        type: 'test'
      });

      // Start a long task
      const promise = agent.executeTask(task);
      
      // Shutdown while task is running
      await new Promise(resolve => setTimeout(resolve, 100));
      await agent.shutdown();

      // Task should be cleaned up
      expect(agent.getActiveTasks()).toHaveLength(0);
    });
  });
});
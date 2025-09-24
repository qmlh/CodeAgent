/**
 * TaskScheduler unit tests
 */

import { TaskScheduler, DefaultSchedulingStrategy, AgentInfo } from '../TaskScheduler';
import { Task, TaskStatus, TaskPriority } from '../../types/task.types';
import { AgentType } from '../../types/agent.types';
import { ValidationError } from '../../core/errors/SystemError';

describe('TaskScheduler', () => {
  let scheduler: TaskScheduler;
  let mockTask1: Task;
  let mockTask2: Task;
  let mockTask3: Task;

  beforeEach(() => {
    scheduler = new TaskScheduler();

    // Set up test agents
    const agentInfo1: AgentInfo = {
      type: AgentType.FRONTEND,
      workload: 20,
      capabilities: ['react', 'typescript', 'css'],
      maxConcurrentTasks: 3,
      currentTasks: 1
    };

    const agentInfo2: AgentInfo = {
      type: AgentType.BACKEND,
      workload: 50,
      capabilities: ['nodejs', 'express', 'database'],
      maxConcurrentTasks: 2,
      currentTasks: 0
    };

    scheduler.updateAgentInfo('agent-1', agentInfo1);
    scheduler.updateAgentInfo('agent-2', agentInfo2);

    // Create test tasks
    mockTask1 = {
      id: 'task-1',
      title: 'Frontend Task',
      description: 'Create React component',
      type: 'frontend',
      status: TaskStatus.PENDING,
      priority: TaskPriority.HIGH,
      dependencies: [],
      estimatedTime: 3600000, // 1 hour
      files: ['src/components/'],
      requirements: ['react', 'typescript'],
      createdAt: new Date('2023-01-01T10:00:00Z')
    };

    mockTask2 = {
      id: 'task-2',
      title: 'Backend Task',
      description: 'Create API endpoint',
      type: 'backend',
      status: TaskStatus.PENDING,
      priority: TaskPriority.MEDIUM,
      dependencies: [],
      estimatedTime: 7200000, // 2 hours
      files: ['src/api/'],
      requirements: ['nodejs', 'express'],
      createdAt: new Date('2023-01-01T11:00:00Z')
    };

    mockTask3 = {
      id: 'task-3',
      title: 'Dependent Task',
      description: 'Task that depends on task-1',
      type: 'frontend',
      status: TaskStatus.PENDING,
      priority: TaskPriority.LOW,
      dependencies: ['task-1'],
      estimatedTime: 1800000, // 30 minutes
      files: ['src/components/'],
      requirements: ['react'],
      createdAt: new Date('2023-01-01T12:00:00Z')
    };
  });

  describe('Agent Management', () => {
    it('should update agent information', () => {
      const newAgentInfo: AgentInfo = {
        type: AgentType.TESTING,
        workload: 30,
        capabilities: ['jest', 'cypress'],
        maxConcurrentTasks: 2,
        currentTasks: 0
      };

      scheduler.updateAgentInfo('agent-3', newAgentInfo);
      
      // Verify by checking if we can get the queue
      const queue = scheduler.getTaskQueue('agent-3');
      expect(queue).toEqual([]);
    });

    it('should remove agent information', () => {
      scheduler.removeAgentInfo('agent-1');
      
      const queue = scheduler.getTaskQueue('agent-1');
      expect(queue).toEqual([]);
    });
  });

  describe('Dependency Management', () => {
    it('should add task dependency', () => {
      scheduler.addDependency('task-3', 'task-1');
      
      const dependencies = scheduler.getDependencies('task-3');
      expect(dependencies).toContain('task-1');
    });

    it('should remove task dependency', () => {
      scheduler.addDependency('task-3', 'task-1');
      scheduler.removeDependency('task-3', 'task-1');
      
      const dependencies = scheduler.getDependencies('task-3');
      expect(dependencies).not.toContain('task-1');
    });

    it('should prevent circular dependencies', () => {
      scheduler.addDependency('task-2', 'task-1');
      
      expect(() => {
        scheduler.addDependency('task-1', 'task-2');
      }).toThrow();
    });

    it('should check if dependencies are met', () => {
      scheduler.addDependency('task-3', 'task-1');
      
      const completedTasks = new Set<string>();
      expect(scheduler.areDependenciesMet('task-3', completedTasks)).toBe(false);
      
      completedTasks.add('task-1');
      expect(scheduler.areDependenciesMet('task-3', completedTasks)).toBe(true);
    });

    it('should get task dependents', () => {
      scheduler.addDependency('task-3', 'task-1');
      
      const dependents = scheduler.getDependents('task-1');
      expect(dependents).toContain('task-3');
    });
  });  describe(
'Task Scheduling', () => {
    it('should schedule task to appropriate agent', () => {
      const result = scheduler.scheduleTask(mockTask1);
      
      expect(result.success).toBe(true);
      expect(result.assignedAgent).toBe('agent-1'); // Frontend agent
      expect(result.estimatedStartTime).toBeInstanceOf(Date);
    });

    it('should schedule backend task to backend agent', () => {
      const result = scheduler.scheduleTask(mockTask2);
      
      expect(result.success).toBe(true);
      expect(result.assignedAgent).toBe('agent-2'); // Backend agent
    });

    it('should fail to schedule when no agents available', () => {
      scheduler.removeAgentInfo('agent-1');
      scheduler.removeAgentInfo('agent-2');
      
      const result = scheduler.scheduleTask(mockTask1);
      
      expect(result.success).toBe(false);
      expect(result.reason).toBe('No agents available');
    });

    it('should unschedule task from agent queue', () => {
      const result = scheduler.scheduleTask(mockTask1);
      expect(result.success).toBe(true);
      
      scheduler.unscheduleTask(mockTask1.id, result.assignedAgent!);
      
      const queue = scheduler.getTaskQueue(result.assignedAgent!);
      expect(queue.find(entry => entry.task.id === mockTask1.id)).toBeUndefined();
    });
  });

  describe('Task Queue Management', () => {
    beforeEach(() => {
      scheduler.scheduleTask(mockTask1);
      scheduler.scheduleTask(mockTask2);
    });

    it('should get next available task', () => {
      const completedTasks = new Set<string>();
      
      const nextTask = scheduler.getNextTask('agent-1', completedTasks);
      expect(nextTask).toBeDefined();
      expect(nextTask?.id).toBe(mockTask1.id);
    });

    it('should respect task dependencies when getting next task', () => {
      scheduler.addDependency('task-3', 'task-1');
      scheduler.scheduleTask(mockTask3);
      
      const completedTasks = new Set<string>();
      
      // Should not return task-3 since task-1 is not completed
      const nextTask = scheduler.getNextTask('agent-1', completedTasks);
      expect(nextTask?.id).toBe(mockTask1.id);
      
      // After completing task-1, should be able to get task-3
      completedTasks.add('task-1');
      const nextTaskAfter = scheduler.getNextTask('agent-1', completedTasks);
      // Note: This might return task-1 or task-3 depending on queue order
      expect(nextTaskAfter).toBeDefined();
    });

    it('should get agent task queue', () => {
      const queue = scheduler.getTaskQueue('agent-1');
      
      expect(queue.length).toBeGreaterThan(0);
      expect(queue[0].task.id).toBe(mockTask1.id);
      expect(queue[0].scheduledAt).toBeInstanceOf(Date);
    });
  });

  describe('Queue Rebalancing', () => {
    it('should rebalance task queues', () => {
      const tasks = [mockTask1, mockTask2, mockTask3];
      const completedTasks = new Set<string>();
      
      scheduler.rebalanceQueues(tasks, completedTasks);
      
      // Verify tasks are assigned
      expect(mockTask1.assignedAgent).toBeDefined();
      expect(mockTask2.assignedAgent).toBeDefined();
    });
  });

  describe('Statistics', () => {
    beforeEach(() => {
      scheduler.scheduleTask(mockTask1);
      scheduler.scheduleTask(mockTask2);
    });

    it('should provide scheduling statistics', () => {
      const stats = scheduler.getSchedulingStatistics();
      
      expect(stats.totalQueues).toBe(2);
      expect(stats.totalTasks).toBeGreaterThan(0);
      expect(stats.averageQueueLength).toBeGreaterThan(0);
      expect(stats.agentUtilization['agent-1']).toBeDefined();
      expect(stats.agentUtilization['agent-2']).toBeDefined();
    });
  });
});

describe('DefaultSchedulingStrategy', () => {
  let strategy: DefaultSchedulingStrategy;
  let mockAgentInfo: Map<string, AgentInfo>;

  beforeEach(() => {
    strategy = new DefaultSchedulingStrategy();
    
    mockAgentInfo = new Map();
    mockAgentInfo.set('agent-1', {
      type: AgentType.FRONTEND,
      workload: 20,
      capabilities: ['react', 'typescript'],
      maxConcurrentTasks: 3,
      currentTasks: 1
    });
    mockAgentInfo.set('agent-2', {
      type: AgentType.BACKEND,
      workload: 60,
      capabilities: ['nodejs', 'express'],
      maxConcurrentTasks: 2,
      currentTasks: 2
    });
  });

  describe('Task Scheduling', () => {
    it('should select best agent for frontend task', () => {
      const frontendTask: Task = {
        id: 'task-1',
        title: 'Frontend Task',
        description: 'React component',
        type: 'frontend',
        status: TaskStatus.PENDING,
        priority: TaskPriority.HIGH,
        dependencies: [],
        estimatedTime: 3600000,
        files: [],
        requirements: ['react'],
        createdAt: new Date()
      };

      const selectedAgent = strategy.scheduleTask(frontendTask, ['agent-1', 'agent-2'], mockAgentInfo);
      expect(selectedAgent).toBe('agent-1');
    });

    it('should not select agent at capacity', () => {
      const backendTask: Task = {
        id: 'task-2',
        title: 'Backend Task',
        description: 'API endpoint',
        type: 'backend',
        status: TaskStatus.PENDING,
        priority: TaskPriority.MEDIUM,
        dependencies: [],
        estimatedTime: 7200000,
        files: [],
        requirements: ['nodejs'],
        createdAt: new Date()
      };

      const selectedAgent = strategy.scheduleTask(backendTask, ['agent-1', 'agent-2'], mockAgentInfo);
      // agent-2 is at capacity (currentTasks >= maxConcurrentTasks)
      // Should select agent-1 even though it's not the best type match
      expect(selectedAgent).toBe('agent-1');
    });

    it('should return null when no suitable agent found', () => {
      // Remove all agents
      const emptyAgentInfo = new Map<string, AgentInfo>();
      
      const task: Task = {
        id: 'task-1',
        title: 'Test Task',
        description: 'Test',
        type: 'general',
        status: TaskStatus.PENDING,
        priority: TaskPriority.LOW,
        dependencies: [],
        estimatedTime: 3600000,
        files: [],
        requirements: [],
        createdAt: new Date()
      };

      const selectedAgent = strategy.scheduleTask(task, [], emptyAgentInfo);
      expect(selectedAgent).toBeNull();
    });
  });

  describe('Task Prioritization', () => {
    it('should prioritize tasks by priority then creation time', () => {
      const tasks: Task[] = [
        {
          id: 'task-1',
          title: 'Low Priority Old',
          description: 'Test',
          type: 'general',
          status: TaskStatus.PENDING,
          priority: TaskPriority.LOW,
          dependencies: [],
          estimatedTime: 3600000,
          files: [],
          requirements: [],
          createdAt: new Date('2023-01-01T10:00:00Z')
        },
        {
          id: 'task-2',
          title: 'High Priority New',
          description: 'Test',
          type: 'general',
          status: TaskStatus.PENDING,
          priority: TaskPriority.HIGH,
          dependencies: [],
          estimatedTime: 3600000,
          files: [],
          requirements: [],
          createdAt: new Date('2023-01-01T12:00:00Z')
        },
        {
          id: 'task-3',
          title: 'High Priority Old',
          description: 'Test',
          type: 'general',
          status: TaskStatus.PENDING,
          priority: TaskPriority.HIGH,
          dependencies: [],
          estimatedTime: 3600000,
          files: [],
          requirements: [],
          createdAt: new Date('2023-01-01T09:00:00Z')
        }
      ];

      const prioritized = strategy.prioritizeTasks(tasks);
      
      // Should be ordered: High Priority Old, High Priority New, Low Priority Old
      expect(prioritized[0].id).toBe('task-3');
      expect(prioritized[1].id).toBe('task-2');
      expect(prioritized[2].id).toBe('task-1');
    });
  });
});
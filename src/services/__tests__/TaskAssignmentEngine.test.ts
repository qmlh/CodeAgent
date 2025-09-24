/**
 * TaskAssignmentEngine unit tests
 */

import { TaskAssignmentEngine, DEFAULT_ASSIGNMENT_CRITERIA } from '../TaskAssignmentEngine';
import { Task, TaskStatus, TaskPriority } from '../../types/task.types';
import { AgentType, AgentStatus } from '../../types/agent.types';
import { AgentInfo } from '../TaskScheduler';

describe('TaskAssignmentEngine', () => {
  let engine: TaskAssignmentEngine;
  let mockTask: Task;
  let frontendAgent: AgentInfo;
  let backendAgent: AgentInfo;

  beforeEach(() => {
    engine = new TaskAssignmentEngine();

    // Set up test agents
    frontendAgent = {
      type: AgentType.FRONTEND,
      workload: 30,
      capabilities: ['react', 'typescript', 'css'],
      maxConcurrentTasks: 3,
      currentTasks: 1
    };

    backendAgent = {
      type: AgentType.BACKEND,
      workload: 60,
      capabilities: ['nodejs', 'express', 'database'],
      maxConcurrentTasks: 2,
      currentTasks: 0
    };

    engine.updateAgentInfo('frontend-agent', frontendAgent);
    engine.updateAgentInfo('backend-agent', backendAgent);

    // Create test task
    mockTask = {
      id: 'task-1',
      title: 'Frontend Component',
      description: 'Create React component',
      type: 'frontend',
      status: TaskStatus.PENDING,
      priority: TaskPriority.HIGH,
      dependencies: [],
      estimatedTime: 3600000, // 1 hour
      files: ['src/components/'],
      requirements: ['react', 'typescript'],
      createdAt: new Date()
    };
  });

  describe('Agent Management', () => {
    it('should update agent information', () => {
      const newAgent: AgentInfo = {
        type: AgentType.TESTING,
        workload: 20,
        capabilities: ['jest', 'cypress'],
        maxConcurrentTasks: 2,
        currentTasks: 0
      };

      engine.updateAgentInfo('test-agent', newAgent);
      
      const performance = engine.getAgentPerformance('test-agent');
      expect(performance).toBeDefined();
      expect(performance?.agentId).toBe('test-agent');
    });

    it('should remove agent information', () => {
      engine.removeAgentInfo('frontend-agent');
      
      const performance = engine.getAgentPerformance('frontend-agent');
      expect(performance).toBeNull();
    });
  });

  describe('Assignment Criteria', () => {
    it('should update assignment criteria', () => {
      const newCriteria = {
        agentSpecialization: 0.5,
        workloadBalance: 0.3
      };

      engine.updateAssignmentCriteria(newCriteria);
      
      // Verify by checking assignment behavior changes
      const result = engine.assignTask(mockTask, ['frontend-agent', 'backend-agent']);
      expect(result.success).toBe(true);
    });
  });

  describe('Task Assignment', () => {
    it('should assign task to best matching agent', () => {
      const result = engine.assignTask(mockTask, ['frontend-agent', 'backend-agent']);
      
      expect(result.success).toBe(true);
      expect(result.assignedAgent).toBe('frontend-agent');
      expect(result.confidence).toBeGreaterThan(0);
      expect(result.reasoning).toBeDefined();
      expect(result.alternativeAgents).toBeDefined();
    });

    it('should fail when no agents available', () => {
      const result = engine.assignTask(mockTask, []);
      
      expect(result.success).toBe(false);
      expect(result.confidence).toBe(0);
      expect(result.reasoning).toContain('No agents available');
    });

    it('should not assign to agent at capacity', () => {
      // Set frontend agent to capacity
      frontendAgent.currentTasks = frontendAgent.maxConcurrentTasks;
      engine.updateAgentInfo('frontend-agent', frontendAgent);
      
      const result = engine.assignTask(mockTask, ['frontend-agent', 'backend-agent']);
      
      expect(result.success).toBe(true);
      expect(result.assignedAgent).toBe('backend-agent'); // Should fallback to backend
    });

    it('should provide reasoning for assignment decision', () => {
      const result = engine.assignTask(mockTask, ['frontend-agent']);
      
      expect(result.success).toBe(true);
      expect(result.reasoning.length).toBeGreaterThan(0);
      expect(result.reasoning.some(r => r.includes('Specialization'))).toBe(true);
      expect(result.reasoning.some(r => r.includes('Workload'))).toBe(true);
    });
  });

  describe('Task Execution Monitoring', () => {
    beforeEach(() => {
      engine.startTaskExecution('task-1', 'frontend-agent', mockTask);
    });

    it('should start task execution monitoring', () => {
      const execution = engine.getTaskExecution('task-1');
      
      expect(execution).toBeDefined();
      expect(execution?.taskId).toBe('task-1');
      expect(execution?.agentId).toBe('frontend-agent');
      expect(execution?.status).toBe(TaskStatus.IN_PROGRESS);
      expect(execution?.progress).toBe(0);
    });

    it('should update task progress', () => {
      engine.updateTaskProgress('task-1', 50);
      
      const execution = engine.getTaskExecution('task-1');
      expect(execution?.progress).toBe(50);
    });

    it('should complete task execution', () => {
      engine.completeTaskExecution('task-1', true, 0.9);
      
      const execution = engine.getTaskExecution('task-1');
      expect(execution).toBeNull(); // Should be removed after completion
      
      const performance = engine.getAgentPerformance('frontend-agent');
      expect(performance?.tasksCompleted).toBe(1);
      expect(performance?.tasksSuccessful).toBe(1);
    });

    it('should get all active executions', () => {
      engine.startTaskExecution('task-2', 'backend-agent', {
        ...mockTask,
        id: 'task-2',
        type: 'backend'
      });
      
      const executions = engine.getActiveExecutions();
      expect(executions.length).toBe(2);
    });
  });

  describe('Timeout and Reassignment', () => {
    beforeEach(() => {
      // Create a task with short timeout for testing
      const shortTask = {
        ...mockTask,
        estimatedTime: 500 // 0.5 seconds
      };
      engine.startTaskExecution('timeout-task', 'frontend-agent', shortTask);
    });

    it('should detect timeout conditions', (done) => {
      // Wait for timeout to occur (need to exceed 150% of estimated time)
      // For a 500ms task, 150% would be 750ms, so we wait 1000ms to be sure
      setTimeout(() => {
        const triggers = engine.checkForReassignment();
        
        expect(triggers.length).toBeGreaterThan(0);
        expect(triggers[0].type).toBe('timeout');
        expect(triggers[0].taskId).toBe('timeout-task');
        done();
      }, 1200); // Wait 1.2 seconds for a 0.5 second task (240% > 150%)
    }, 3000);

    it('should reassign task to different agent', () => {
      const result = engine.reassignTask(
        'task-1', 
        'frontend-agent', 
        ['backend-agent'], 
        mockTask
      );
      
      expect(result.success).toBe(true);
      expect(result.assignedAgent).toBe('backend-agent');
      expect(result.reasoning[0]).toContain('Reassigned from frontend-agent');
    });

    it('should detect agent failure through missing heartbeat', (done) => {
      // Start execution and don't update heartbeat
      engine.startTaskExecution('heartbeat-task', 'frontend-agent', mockTask);
      
      // Wait for heartbeat timeout (should be detected after 3 * heartbeatInterval)
      setTimeout(() => {
        const triggers = engine.checkForReassignment();
        
        const heartbeatTrigger = triggers.find(t => t.type === 'agent_failure');
        expect(heartbeatTrigger).toBeDefined();
        expect(heartbeatTrigger?.reason).toContain('No heartbeat');
        done();
      }, 100000); // Wait 100 seconds for heartbeat timeout
    }, 110000);
  });

  describe('Performance Tracking', () => {
    it('should track agent performance metrics', () => {
      // Initialize agent info first
      engine.updateAgentInfo('frontend-agent', {
        agentId: 'frontend-agent',
        type: AgentType.FRONTEND,
        capabilities: ['html', 'css'],
        status: AgentStatus.IDLE,
        workload: 0,
        lastActive: new Date()
      });
      
      // Complete some tasks to build performance history
      engine.startTaskExecution('perf-task-1', 'frontend-agent', mockTask);
      
      // Manually adjust the start time to simulate elapsed time
      const execution1 = (engine as any).taskExecutions.get('perf-task-1');
      if (execution1) {
        execution1.startTime = new Date(Date.now() - 1000); // 1 second ago
      }
      
      engine.completeTaskExecution('perf-task-1', true, 0.8);
      
      engine.startTaskExecution('perf-task-2', 'frontend-agent', mockTask);
      
      const execution2 = (engine as any).taskExecutions.get('perf-task-2');
      if (execution2) {
        execution2.startTime = new Date(Date.now() - 500); // 0.5 seconds ago
      }
      
      engine.completeTaskExecution('perf-task-2', false, 0.3);
      
      const performance = engine.getAgentPerformance('frontend-agent');
      
      expect(performance?.tasksCompleted).toBe(2);
      expect(performance?.tasksSuccessful).toBe(1);
      expect(performance?.averageCompletionTime).toBeGreaterThan(0);
    });

    it('should provide assignment statistics', () => {
      // Complete some tasks
      engine.startTaskExecution('stat-task-1', 'frontend-agent', mockTask);
      engine.completeTaskExecution('stat-task-1', true);
      
      const stats = engine.getStatistics();
      
      expect(stats.totalAssignments).toBeGreaterThan(0);
      expect(stats.agentPerformanceSummary['frontend-agent']).toBeDefined();
      expect(stats.agentPerformanceSummary['frontend-agent'].successRate).toBeGreaterThan(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle assignment with no suitable agents', () => {
      // Remove all agents
      engine.removeAgentInfo('frontend-agent');
      engine.removeAgentInfo('backend-agent');
      
      const result = engine.assignTask(mockTask, ['non-existent-agent']);
      
      expect(result.success).toBe(false);
      expect(result.reasoning).toContain('No suitable agents found');
    });

    it('should handle progress updates for non-existent tasks', () => {
      // Should not throw error
      expect(() => {
        engine.updateTaskProgress('non-existent-task', 50);
      }).not.toThrow();
    });

    it('should handle completion of non-existent tasks', () => {
      // Should not throw error
      expect(() => {
        engine.completeTaskExecution('non-existent-task', true);
      }).not.toThrow();
    });

    it('should handle reassignment with no alternative agents', () => {
      const result = engine.reassignTask(
        'task-1',
        'frontend-agent',
        [], // No alternative agents
        mockTask
      );
      
      expect(result.success).toBe(false);
    });
  });

  describe('Assignment Algorithm Validation', () => {
    it('should prefer specialized agents', () => {
      const frontendTask = {
        ...mockTask,
        type: 'frontend',
        requirements: ['react']
      };
      
      const backendTask = {
        ...mockTask,
        id: 'backend-task',
        type: 'backend',
        requirements: ['nodejs']
      };
      
      const frontendResult = engine.assignTask(frontendTask, ['frontend-agent', 'backend-agent']);
      const backendResult = engine.assignTask(backendTask, ['frontend-agent', 'backend-agent']);
      
      expect(frontendResult.assignedAgent).toBe('frontend-agent');
      expect(backendResult.assignedAgent).toBe('backend-agent');
    });

    it('should consider workload balance', () => {
      // Set backend agent to have lower workload
      backendAgent.workload = 10;
      backendAgent.currentTasks = 0;
      engine.updateAgentInfo('backend-agent', backendAgent);
      
      // Set frontend agent to high workload
      frontendAgent.workload = 90;
      frontendAgent.currentTasks = 2;
      engine.updateAgentInfo('frontend-agent', frontendAgent);
      
      // For a general task, should prefer less loaded agent
      const generalTask = {
        ...mockTask,
        type: 'general',
        requirements: []
      };
      
      const result = engine.assignTask(generalTask, ['frontend-agent', 'backend-agent']);
      expect(result.assignedAgent).toBe('backend-agent');
    });

    it('should handle high priority tasks appropriately', () => {
      const highPriorityTask = {
        ...mockTask,
        priority: TaskPriority.CRITICAL
      };
      
      const result = engine.assignTask(highPriorityTask, ['frontend-agent']);
      
      expect(result.success).toBe(true);
      expect(result.confidence).toBeGreaterThan(0);
    });
  });
});
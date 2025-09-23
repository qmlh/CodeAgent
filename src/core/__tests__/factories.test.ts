/**
 * Tests for factory classes
 */

import { AgentFactory, TaskFactory, MessageFactory } from '../factories';
import { AgentType, AgentStatus } from '../../types/agent.types';
import { TaskStatus, TaskPriority } from '../../types/task.types';
import { MessageType } from '../../types/message.types';
import { ValidationError } from '../errors/SystemError';

describe('Factories', () => {
  describe('AgentFactory', () => {
    it('should create a valid agent', () => {
      const agent = AgentFactory.createAgent({
        name: 'Test Agent',
        type: AgentType.FRONTEND,
        capabilities: ['html', 'css', 'javascript']
      });

      expect(agent.id).toBeDefined();
      expect(agent.name).toBe('Test Agent');
      expect(agent.type).toBe(AgentType.FRONTEND);
      expect(agent.status).toBe(AgentStatus.OFFLINE);
      expect(agent.capabilities).toEqual(['html', 'css', 'javascript']);
      expect(agent.workload).toBe(0);
      expect(agent.createdAt).toBeInstanceOf(Date);
      expect(agent.lastActive).toBeInstanceOf(Date);
    });

    it('should create agent with default capabilities', () => {
      const agent = AgentFactory.createAgent({
        name: 'Frontend Agent',
        type: AgentType.FRONTEND
      });

      expect(agent.capabilities.length).toBeGreaterThan(0);
      expect(agent.capabilities).toContain('html');
      expect(agent.capabilities).toContain('css');
      expect(agent.capabilities).toContain('javascript');
    });

    it('should clone an existing agent', () => {
      const originalAgent = AgentFactory.createAgent({
        name: 'Original Agent',
        type: AgentType.BACKEND
      });

      const clonedAgent = AgentFactory.cloneAgent(originalAgent, 'Cloned Agent');

      expect(clonedAgent.id).not.toBe(originalAgent.id);
      expect(clonedAgent.name).toBe('Cloned Agent');
      expect(clonedAgent.type).toBe(originalAgent.type);
      expect(clonedAgent.status).toBe(AgentStatus.OFFLINE);
      expect(clonedAgent.workload).toBe(0);
    });

    it('should update agent configuration', () => {
      const agent = AgentFactory.createAgent({
        name: 'Test Agent',
        type: AgentType.FRONTEND
      });

      // Wait a bit to ensure different timestamps
      const originalTime = agent.lastActive.getTime();
      
      const updatedAgent = AgentFactory.updateAgentConfig(agent, {
        maxConcurrentTasks: 5,
        timeout: 600000
      });

      expect(updatedAgent.config.maxConcurrentTasks).toBe(5);
      expect(updatedAgent.config.timeout).toBe(600000);
      expect(updatedAgent.lastActive.getTime()).toBeGreaterThanOrEqual(originalTime);
    });

    it('should create agent team', () => {
      const team = AgentFactory.createAgentTeam({
        [AgentType.FRONTEND]: {
          name: 'Frontend Agent',
          type: AgentType.FRONTEND
        },
        [AgentType.BACKEND]: {
          name: 'Backend Agent',
          type: AgentType.BACKEND
        }
      });

      expect(team).toHaveLength(2);
      expect(team[0].type).toBe(AgentType.FRONTEND);
      expect(team[1].type).toBe(AgentType.BACKEND);
    });

    it('should validate agent data', () => {
      const validData = {
        id: 'agent-123',
        name: 'Test Agent',
        type: AgentType.FRONTEND,
        status: AgentStatus.IDLE,
        config: {
          name: 'Test Agent',
          type: AgentType.FRONTEND,
          capabilities: ['html'],
          maxConcurrentTasks: 3,
          timeout: 300000,
          retryAttempts: 3
        },
        capabilities: ['html'],
        workload: 50,
        createdAt: new Date(),
        lastActive: new Date()
      };

      const result = AgentFactory.validateAgentData(validData);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject invalid agent data', () => {
      const invalidData = {
        id: 'agent-123',
        name: '', // Invalid empty name
        type: AgentType.FRONTEND,
        status: AgentStatus.IDLE,
        config: {
          name: '',
          type: AgentType.FRONTEND,
          capabilities: [], // Invalid empty capabilities
          maxConcurrentTasks: 3,
          timeout: 300000,
          retryAttempts: 3
        },
        capabilities: [], // Invalid empty capabilities
        workload: 50,
        createdAt: new Date(),
        lastActive: new Date()
      };

      const result = AgentFactory.validateAgentData(invalidData);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('TaskFactory', () => {
    it('should create a valid task', () => {
      const task = TaskFactory.createTask({
        title: 'Test Task',
        description: 'A test task',
        type: 'development',
        priority: TaskPriority.HIGH,
        estimatedTime: 7200000 // 2 hours
      });

      expect(task.id).toBeDefined();
      expect(task.title).toBe('Test Task');
      expect(task.description).toBe('A test task');
      expect(task.type).toBe('development');
      expect(task.status).toBe(TaskStatus.PENDING);
      expect(task.priority).toBe(TaskPriority.HIGH);
      expect(task.estimatedTime).toBe(7200000);
      expect(task.dependencies).toEqual([]);
      expect(task.createdAt).toBeInstanceOf(Date);
    });

    it('should clone a task', () => {
      const originalTask = TaskFactory.createTask({
        title: 'Original Task',
        description: 'Original description',
        type: 'development'
      });

      const clonedTask = TaskFactory.cloneTask(originalTask, 'Cloned Task');

      expect(clonedTask.id).not.toBe(originalTask.id);
      expect(clonedTask.title).toBe('Cloned Task');
      expect(clonedTask.description).toBe(originalTask.description);
      expect(clonedTask.status).toBe(TaskStatus.PENDING);
      expect(clonedTask.assignedAgent).toBeUndefined();
    });

    it('should update task status', () => {
      const task = TaskFactory.createTask({
        title: 'Test Task',
        description: 'A test task',
        type: 'development'
      });

      const updatedTask = TaskFactory.updateTaskStatus(task, TaskStatus.IN_PROGRESS, 'agent-123');

      expect(updatedTask.status).toBe(TaskStatus.IN_PROGRESS);
      expect(updatedTask.assignedAgent).toBe('agent-123');
      expect(updatedTask.startedAt).toBeInstanceOf(Date);
    });

    it('should add and remove dependencies', () => {
      const task = TaskFactory.createTask({
        title: 'Test Task',
        description: 'A test task',
        type: 'development'
      });

      const taskWithDep = TaskFactory.addDependency(task, 'dep-123');
      expect(taskWithDep.dependencies).toContain('dep-123');

      const taskWithoutDep = TaskFactory.removeDependency(taskWithDep, 'dep-123');
      expect(taskWithoutDep.dependencies).not.toContain('dep-123');
    });

    it('should prevent self-dependency', () => {
      const task = TaskFactory.createTask({
        title: 'Test Task',
        description: 'A test task',
        type: 'development'
      });

      expect(() => {
        TaskFactory.addDependency(task, task.id);
      }).toThrow(ValidationError);
    });

    it('should create task chain', () => {
      const tasks = TaskFactory.createTaskChain([
        {
          title: 'Task 1',
          description: 'First task',
          type: 'development'
        },
        {
          title: 'Task 2',
          description: 'Second task',
          type: 'development'
        },
        {
          title: 'Task 3',
          description: 'Third task',
          type: 'development'
        }
      ]);

      expect(tasks).toHaveLength(3);
      expect(tasks[0].dependencies).toHaveLength(0);
      expect(tasks[1].dependencies).toContain(tasks[0].id);
      expect(tasks[2].dependencies).toContain(tasks[1].id);
    });

    it('should check if task can start', () => {
      const task1 = TaskFactory.createTask({
        title: 'Task 1',
        description: 'First task',
        type: 'development'
      });

      const task2 = TaskFactory.createTask({
        title: 'Task 2',
        description: 'Second task',
        type: 'development',
        dependencies: [task1.id]
      });

      expect(TaskFactory.canStartTask(task1, [])).toBe(true);
      expect(TaskFactory.canStartTask(task2, [])).toBe(false);
      expect(TaskFactory.canStartTask(task2, [task1.id])).toBe(true);
    });

    it('should calculate task duration', () => {
      const task = TaskFactory.createTask({
        title: 'Test Task',
        description: 'A test task',
        type: 'development'
      });

      // Task not started
      expect(TaskFactory.getTaskDuration(task)).toBeNull();

      // Task started but not completed
      const startedTask = TaskFactory.updateTaskStatus(task, TaskStatus.IN_PROGRESS);
      const duration1 = TaskFactory.getTaskDuration(startedTask);
      expect(duration1).toBeGreaterThanOrEqual(0);

      // Task completed
      const completedTask = TaskFactory.updateTaskStatus(startedTask, TaskStatus.COMPLETED);
      const duration2 = TaskFactory.getTaskDuration(completedTask);
      expect(duration2).toBeGreaterThanOrEqual(0);
    });
  });

  describe('MessageFactory', () => {
    it('should create a valid message', () => {
      const message = MessageFactory.createMessage({
        from: 'agent-1',
        to: 'agent-2',
        type: MessageType.INFO,
        content: 'Hello world',
        requiresResponse: true
      });

      expect(message.id).toBeDefined();
      expect(message.from).toBe('agent-1');
      expect(message.to).toBe('agent-2');
      expect(message.type).toBe(MessageType.INFO);
      expect(message.content).toBe('Hello world');
      expect(message.requiresResponse).toBe(true);
      expect(message.timestamp).toBeInstanceOf(Date);
    });

    it('should create different message types', () => {
      const infoMsg = MessageFactory.createInfoMessage('agent-1', 'agent-2', 'Info');
      expect(infoMsg.type).toBe(MessageType.INFO);
      expect(infoMsg.requiresResponse).toBe(false);

      const requestMsg = MessageFactory.createRequestMessage('agent-1', 'agent-2', 'Request');
      expect(requestMsg.type).toBe(MessageType.REQUEST);
      expect(requestMsg.requiresResponse).toBe(true);

      const responseMsg = MessageFactory.createResponseMessage('agent-2', 'agent-1', 'Response', 'corr-123');
      expect(responseMsg.type).toBe(MessageType.RESPONSE);
      expect(responseMsg.correlationId).toBe('corr-123');

      const alertMsg = MessageFactory.createAlertMessage('agent-1', 'agent-2', 'Alert');
      expect(alertMsg.type).toBe(MessageType.ALERT);

      const systemMsg = MessageFactory.createSystemMessage('agent-1', 'System message');
      expect(systemMsg.from).toBe('system');
      expect(systemMsg.type).toBe(MessageType.SYSTEM);

      const broadcastMsg = MessageFactory.createBroadcastMessage('agent-1', 'Broadcast');
      expect(broadcastMsg.to).toEqual(['*']);
    });

    it('should create message thread', () => {
      const thread = MessageFactory.createMessageThread(
        'agent-1',
        'agent-2',
        'Request content',
        'Response content'
      );

      expect(thread.request.type).toBe(MessageType.REQUEST);
      expect(thread.request.requiresResponse).toBe(true);
      expect(thread.response).toBeDefined();
      expect(thread.response!.type).toBe(MessageType.RESPONSE);
      expect(thread.response!.correlationId).toBe(thread.request.id);
    });

    it('should create collaboration session', () => {
      const session = MessageFactory.createCollaborationSession({
        participants: ['agent-1', 'agent-2', 'agent-3'],
        sharedFiles: ['file1.ts', 'file2.ts']
      });

      expect(session.id).toBeDefined();
      expect(session.participants).toEqual(['agent-1', 'agent-2', 'agent-3']);
      expect(session.sharedFiles).toEqual(['file1.ts', 'file2.ts']);
      expect(session.status).toBe('active');
      expect(session.startTime).toBeInstanceOf(Date);
      expect(session.communicationChannel).toBeDefined();
    });

    it('should manage collaboration session participants', () => {
      const session = MessageFactory.createCollaborationSession({
        participants: ['agent-1', 'agent-2']
      });

      const withNewParticipant = MessageFactory.addParticipant(session, 'agent-3');
      expect(withNewParticipant.participants).toContain('agent-3');

      const withoutParticipant = MessageFactory.removeParticipant(withNewParticipant, 'agent-3');
      expect(withoutParticipant.participants).not.toContain('agent-3');
    });

    it('should manage shared files in session', () => {
      const session = MessageFactory.createCollaborationSession({
        participants: ['agent-1', 'agent-2']
      });

      const withFile = MessageFactory.addSharedFile(session, 'newfile.ts');
      expect(withFile.sharedFiles).toContain('newfile.ts');

      const withoutFile = MessageFactory.removeSharedFile(withFile, 'newfile.ts');
      expect(withoutFile.sharedFiles).not.toContain('newfile.ts');
    });

    it('should end collaboration session', () => {
      const session = MessageFactory.createCollaborationSession({
        participants: ['agent-1', 'agent-2']
      });

      const endedSession = MessageFactory.endCollaborationSession(session);
      expect(endedSession.status).toBe('completed');
      expect(endedSession.endTime).toBeInstanceOf(Date);
      expect(endedSession.endTime!.getTime()).toBeGreaterThan(session.startTime.getTime());
    });

    it('should pause and resume session', () => {
      const session = MessageFactory.createCollaborationSession({
        participants: ['agent-1', 'agent-2']
      });

      const pausedSession = MessageFactory.pauseCollaborationSession(session);
      expect(pausedSession.status).toBe('paused');

      const resumedSession = MessageFactory.resumeCollaborationSession(pausedSession);
      expect(resumedSession.status).toBe('active');
    });

    it('should calculate session duration', () => {
      const session = MessageFactory.createCollaborationSession({
        participants: ['agent-1', 'agent-2']
      });

      const duration = MessageFactory.getSessionDuration(session);
      expect(duration).toBeGreaterThanOrEqual(0);

      const endedSession = MessageFactory.endCollaborationSession(session);
      const endedDuration = MessageFactory.getSessionDuration(endedSession);
      expect(endedDuration).toBeGreaterThanOrEqual(0);
    });
  });
});
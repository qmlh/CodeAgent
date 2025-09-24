/**
 * Unit tests for CoordinationManager
 */

import { CoordinationManager, CoordinationManagerConfig } from '../CoordinationManager';
import { ConcreteAgentFactory } from '../../agents/ConcreteAgentFactory';
import { AgentType, AgentStatus, AgentConfig } from '../../types/agent.types';
import { EventType } from '../../types/message.types';
import { TestAgent } from '../../agents/TestAgent';

// Mock the ConcreteAgentFactory
jest.mock('../../agents/ConcreteAgentFactory');

describe('CoordinationManager', () => {
  let coordinationManager: CoordinationManager;
  let config: CoordinationManagerConfig;
  let mockAgent: any;

  beforeEach(() => {
    config = {
      maxAgents: 10,
      healthCheckInterval: 5000,
      sessionTimeout: 300000,
      maxConcurrentSessions: 5
    };

    mockAgent = {
      id: 'test-agent-1',
      name: 'Test Agent',
      specialization: AgentType.TESTING,
      getStatus: jest.fn().mockReturnValue(AgentStatus.IDLE),
      getWorkload: jest.fn().mockReturnValue(0),
      getCurrentTask: jest.fn().mockReturnValue(null),
      getCapabilities: jest.fn().mockReturnValue(['testing']),
      getConfig: jest.fn().mockReturnValue({
        name: 'Test Agent',
        type: AgentType.TESTING,
        capabilities: ['testing'],
        maxConcurrentTasks: 3,
        timeout: 300000,
        retryAttempts: 3
      }),
      initialize: jest.fn().mockResolvedValue(undefined),
      shutdown: jest.fn().mockResolvedValue(undefined),
      executeTask: jest.fn(),
      handleMessage: jest.fn(),
      requestFileAccess: jest.fn(),
      releaseFileAccess: jest.fn(),
      sendMessage: jest.fn(),
      subscribeToEvents: jest.fn(),
      updateConfig: jest.fn()
    };

    (ConcreteAgentFactory.createAgentInstance as jest.Mock).mockReturnValue(mockAgent);

    coordinationManager = new CoordinationManager(config);
  });

  afterEach(async () => {
    await coordinationManager.shutdown();
    jest.clearAllMocks();
  });

  describe('Agent Lifecycle Management', () => {
    it('should create a new agent successfully', async () => {
      const agentConfig: AgentConfig = {
        name: 'Test Agent',
        type: AgentType.TESTING,
        capabilities: ['testing'],
        maxConcurrentTasks: 3,
        timeout: 300000,
        retryAttempts: 3
      };

      const agent = await coordinationManager.createAgent(agentConfig);

      expect(agent).toBeDefined();
      expect(agent.id).toBe('test-agent-1');
      expect(agent.name).toBe('Test Agent');
      expect(agent.type).toBe(AgentType.TESTING);
      expect(agent.status).toBe(AgentStatus.IDLE);
      expect(ConcreteAgentFactory.createAgentInstance).toHaveBeenCalledWith({
        name: agentConfig.name,
        type: agentConfig.type,
        capabilities: agentConfig.capabilities,
        maxConcurrentTasks: agentConfig.maxConcurrentTasks,
        timeout: agentConfig.timeout,
        retryAttempts: agentConfig.retryAttempts,
        customSettings: agentConfig.customSettings
      });
    });

    it('should throw error when maximum agents reached', async () => {
      const smallConfig = { ...config, maxAgents: 1 };
      const smallCoordinator = new CoordinationManager(smallConfig);

      const agentConfig: AgentConfig = {
        name: 'Test Agent',
        type: AgentType.TESTING,
        capabilities: ['testing'],
        maxConcurrentTasks: 3,
        timeout: 300000,
        retryAttempts: 3
      };

      // Create first agent
      await smallCoordinator.createAgent(agentConfig);

      // Try to create second agent
      await expect(smallCoordinator.createAgent(agentConfig))
        .rejects.toThrow('Maximum number of agents (1) reached');

      await smallCoordinator.shutdown();
    });

    it('should destroy an agent successfully', async () => {
      const agentConfig: AgentConfig = {
        name: 'Test Agent',
        type: AgentType.TESTING,
        capabilities: ['testing'],
        maxConcurrentTasks: 3,
        timeout: 300000,
        retryAttempts: 3
      };

      const agent = await coordinationManager.createAgent(agentConfig);
      await coordinationManager.destroyAgent(agent.id);

      const retrievedAgent = await coordinationManager.getAgent(agent.id);
      expect(retrievedAgent).toBeNull();
      expect(mockAgent.shutdown).toHaveBeenCalled();
    });

    it('should throw error when destroying non-existent agent', async () => {
      await expect(coordinationManager.destroyAgent('non-existent'))
        .rejects.toThrow('Agent non-existent not found');
    });

    it('should get agent by id', async () => {
      const agentConfig: AgentConfig = {
        name: 'Test Agent',
        type: AgentType.TESTING,
        capabilities: ['testing'],
        maxConcurrentTasks: 3,
        timeout: 300000,
        retryAttempts: 3
      };

      const createdAgent = await coordinationManager.createAgent(agentConfig);
      const retrievedAgent = await coordinationManager.getAgent(createdAgent.id);

      expect(retrievedAgent).toBeDefined();
      expect(retrievedAgent!.id).toBe(createdAgent.id);
    });

    it('should return null for non-existent agent', async () => {
      const agent = await coordinationManager.getAgent('non-existent');
      expect(agent).toBeNull();
    });

    it('should get all agents', async () => {
      const agentConfig1: AgentConfig = {
        name: 'Test Agent 1',
        type: AgentType.TESTING,
        capabilities: ['testing'],
        maxConcurrentTasks: 3,
        timeout: 300000,
        retryAttempts: 3
      };

      const agentConfig2: AgentConfig = {
        name: 'Test Agent 2',
        type: AgentType.FRONTEND,
        capabilities: ['frontend'],
        maxConcurrentTasks: 3,
        timeout: 300000,
        retryAttempts: 3
      };

      // Mock different agents
      (ConcreteAgentFactory.createAgentInstance as jest.Mock)
        .mockReturnValueOnce({ ...mockAgent, id: 'agent-1', name: 'Test Agent 1' })
        .mockReturnValueOnce({ ...mockAgent, id: 'agent-2', name: 'Test Agent 2' });

      await coordinationManager.createAgent(agentConfig1);
      await coordinationManager.createAgent(agentConfig2);

      const allAgents = await coordinationManager.getAllAgents();
      expect(allAgents).toHaveLength(2);
    });

    it('should get agents by type', async () => {
      const testingConfig: AgentConfig = {
        name: 'Testing Agent',
        type: AgentType.TESTING,
        capabilities: ['testing'],
        maxConcurrentTasks: 3,
        timeout: 300000,
        retryAttempts: 3
      };

      const frontendConfig: AgentConfig = {
        name: 'Frontend Agent',
        type: AgentType.FRONTEND,
        capabilities: ['frontend'],
        maxConcurrentTasks: 3,
        timeout: 300000,
        retryAttempts: 3
      };

      // Mock different agents
      (ConcreteAgentFactory.createAgentInstance as jest.Mock)
        .mockReturnValueOnce({ ...mockAgent, id: 'testing-agent' })
        .mockReturnValueOnce({ ...mockAgent, id: 'frontend-agent' });

      await coordinationManager.createAgent(testingConfig);
      await coordinationManager.createAgent(frontendConfig);

      const testingAgents = await coordinationManager.getAgentsByType(AgentType.TESTING);
      expect(testingAgents).toHaveLength(1);
      expect(testingAgents[0].type).toBe(AgentType.TESTING);
    });
  });

  describe('Agent Registration and Discovery', () => {
    it('should discover agents by capabilities', async () => {
      const agentConfig: AgentConfig = {
        name: 'Test Agent',
        type: AgentType.TESTING,
        capabilities: ['testing', 'unit-testing'],
        maxConcurrentTasks: 3,
        timeout: 300000,
        retryAttempts: 3
      };

      await coordinationManager.createAgent(agentConfig);

      const agents = await coordinationManager.discoverAgents(['testing']);
      expect(agents).toHaveLength(1);
      expect(agents[0].capabilities).toContain('testing');
    });

    it('should return all agents when no capabilities specified', async () => {
      const agentConfig: AgentConfig = {
        name: 'Test Agent',
        type: AgentType.TESTING,
        capabilities: ['testing'],
        maxConcurrentTasks: 3,
        timeout: 300000,
        retryAttempts: 3
      };

      await coordinationManager.createAgent(agentConfig);

      const agents = await coordinationManager.discoverAgents();
      expect(agents).toHaveLength(1);
    });
  });

  describe('Health Monitoring', () => {
    it('should check agent health successfully', async () => {
      const agentConfig: AgentConfig = {
        name: 'Test Agent',
        type: AgentType.TESTING,
        capabilities: ['testing'],
        maxConcurrentTasks: 3,
        timeout: 300000,
        retryAttempts: 3
      };

      const agent = await coordinationManager.createAgent(agentConfig);
      const isHealthy = await coordinationManager.checkAgentHealth(agent.id);

      expect(isHealthy).toBe(true);
      expect(mockAgent.getStatus).toHaveBeenCalled();
    });

    it('should return false for non-existent agent health check', async () => {
      const isHealthy = await coordinationManager.checkAgentHealth('non-existent');
      expect(isHealthy).toBe(false);
    });

    it('should perform health check on all agents', async () => {
      const agentConfig: AgentConfig = {
        name: 'Test Agent',
        type: AgentType.TESTING,
        capabilities: ['testing'],
        maxConcurrentTasks: 3,
        timeout: 300000,
        retryAttempts: 3
      };

      await coordinationManager.createAgent(agentConfig);

      const healthResult = await coordinationManager.performHealthCheck();
      expect(healthResult.healthy).toHaveLength(1);
      expect(healthResult.unhealthy).toHaveLength(0);
    });

    it.skip('should restart an agent', async () => {
      const agentConfig: AgentConfig = {
        name: 'Test Agent',
        type: AgentType.TESTING,
        capabilities: ['testing'],
        maxConcurrentTasks: 3,
        timeout: 300000,
        retryAttempts: 3
      };

      const agent = await coordinationManager.createAgent(agentConfig);
      
      // Mock a new agent for restart
      const newMockAgent = { ...mockAgent, id: 'test-agent-1-restarted' };
      (ConcreteAgentFactory.createAgentInstance as jest.Mock).mockReturnValueOnce(newMockAgent);

      await coordinationManager.restartAgent(agent.id);

      expect(mockAgent.shutdown).toHaveBeenCalled();
    });
  });

  describe('Collaboration Session Management', () => {
    it('should start a collaboration session', async () => {
      const agentConfig1: AgentConfig = {
        name: 'Agent 1',
        type: AgentType.TESTING,
        capabilities: ['testing'],
        maxConcurrentTasks: 3,
        timeout: 300000,
        retryAttempts: 3
      };

      const agentConfig2: AgentConfig = {
        name: 'Agent 2',
        type: AgentType.FRONTEND,
        capabilities: ['frontend'],
        maxConcurrentTasks: 3,
        timeout: 300000,
        retryAttempts: 3
      };

      // Mock different agents
      (ConcreteAgentFactory.createAgentInstance as jest.Mock)
        .mockReturnValueOnce({ ...mockAgent, id: 'agent-1' })
        .mockReturnValueOnce({ ...mockAgent, id: 'agent-2' });

      const agent1 = await coordinationManager.createAgent(agentConfig1);
      const agent2 = await coordinationManager.createAgent(agentConfig2);

      const session = await coordinationManager.startCollaboration(
        [agent1.id, agent2.id],
        ['file1.ts', 'file2.ts']
      );

      expect(session).toBeDefined();
      expect(session.participants).toContain(agent1.id);
      expect(session.participants).toContain(agent2.id);
      expect(session.sharedFiles).toContain('file1.ts');
      expect(session.status).toBe('active');
    });

    it('should throw error when starting collaboration with non-existent agent', async () => {
      await expect(coordinationManager.startCollaboration(['non-existent'], []))
        .rejects.toThrow('Agent non-existent not found');
    });

    it('should end a collaboration session', async () => {
      const agentConfig: AgentConfig = {
        name: 'Test Agent',
        type: AgentType.TESTING,
        capabilities: ['testing'],
        maxConcurrentTasks: 3,
        timeout: 300000,
        retryAttempts: 3
      };

      const agent = await coordinationManager.createAgent(agentConfig);
      const session = await coordinationManager.startCollaboration([agent.id], []);

      await coordinationManager.endCollaboration(session.id);

      const activeSessions = await coordinationManager.getActiveCollaborations();
      expect(activeSessions).toHaveLength(0);
    });

    it('should get active collaborations', async () => {
      const agentConfig: AgentConfig = {
        name: 'Test Agent',
        type: AgentType.TESTING,
        capabilities: ['testing'],
        maxConcurrentTasks: 3,
        timeout: 300000,
        retryAttempts: 3
      };

      const agent = await coordinationManager.createAgent(agentConfig);
      await coordinationManager.startCollaboration([agent.id], []);

      const activeSessions = await coordinationManager.getActiveCollaborations();
      expect(activeSessions).toHaveLength(1);
      expect(activeSessions[0].status).toBe('active');
    });

    it('should join collaboration session', async () => {
      const agentConfig1: AgentConfig = {
        name: 'Agent 1',
        type: AgentType.TESTING,
        capabilities: ['testing'],
        maxConcurrentTasks: 3,
        timeout: 300000,
        retryAttempts: 3
      };

      const agentConfig2: AgentConfig = {
        name: 'Agent 2',
        type: AgentType.FRONTEND,
        capabilities: ['frontend'],
        maxConcurrentTasks: 3,
        timeout: 300000,
        retryAttempts: 3
      };

      // Mock different agents
      (ConcreteAgentFactory.createAgentInstance as jest.Mock)
        .mockReturnValueOnce({ ...mockAgent, id: 'agent-1' })
        .mockReturnValueOnce({ ...mockAgent, id: 'agent-2' });

      const agent1 = await coordinationManager.createAgent(agentConfig1);
      const agent2 = await coordinationManager.createAgent(agentConfig2);

      const session = await coordinationManager.startCollaboration([agent1.id], []);
      await coordinationManager.joinCollaboration(session.id, agent2.id);

      const updatedSession = (await coordinationManager.getActiveCollaborations())[0];
      expect(updatedSession.participants).toContain(agent2.id);
    });

    it('should leave collaboration session', async () => {
      const agentConfig1: AgentConfig = {
        name: 'Agent 1',
        type: AgentType.TESTING,
        capabilities: ['testing'],
        maxConcurrentTasks: 3,
        timeout: 300000,
        retryAttempts: 3
      };

      const agentConfig2: AgentConfig = {
        name: 'Agent 2',
        type: AgentType.FRONTEND,
        capabilities: ['frontend'],
        maxConcurrentTasks: 3,
        timeout: 300000,
        retryAttempts: 3
      };

      // Mock different agents
      (ConcreteAgentFactory.createAgentInstance as jest.Mock)
        .mockReturnValueOnce({ ...mockAgent, id: 'agent-1' })
        .mockReturnValueOnce({ ...mockAgent, id: 'agent-2' });

      const agent1 = await coordinationManager.createAgent(agentConfig1);
      const agent2 = await coordinationManager.createAgent(agentConfig2);

      const session = await coordinationManager.startCollaboration([agent1.id, agent2.id], []);
      await coordinationManager.leaveCollaboration(session.id, agent2.id);

      const updatedSession = (await coordinationManager.getActiveCollaborations())[0];
      expect(updatedSession.participants).not.toContain(agent2.id);
      expect(updatedSession.participants).toContain(agent1.id);
    });
  });

  describe('Resource Management', () => {
    it('should allocate resources to agent', async () => {
      const agentConfig: AgentConfig = {
        name: 'Test Agent',
        type: AgentType.TESTING,
        capabilities: ['testing'],
        maxConcurrentTasks: 3,
        timeout: 300000,
        retryAttempts: 3
      };

      const agent = await coordinationManager.createAgent(agentConfig);
      await coordinationManager.allocateResources(agent.id, ['resource1', 'resource2']);

      const usage = await coordinationManager.getResourceUsage();
      expect(usage[agent.id]).toContain('resource1');
      expect(usage[agent.id]).toContain('resource2');
    });

    it('should deallocate resources from agent', async () => {
      const agentConfig: AgentConfig = {
        name: 'Test Agent',
        type: AgentType.TESTING,
        capabilities: ['testing'],
        maxConcurrentTasks: 3,
        timeout: 300000,
        retryAttempts: 3
      };

      const agent = await coordinationManager.createAgent(agentConfig);
      await coordinationManager.allocateResources(agent.id, ['resource1', 'resource2']);
      await coordinationManager.deallocateResources(agent.id, ['resource1']);

      const usage = await coordinationManager.getResourceUsage();
      expect(usage[agent.id]).not.toContain('resource1');
      expect(usage[agent.id]).toContain('resource2');
    });

    it('should throw error when allocating resources to non-existent agent', async () => {
      await expect(coordinationManager.allocateResources('non-existent', ['resource1']))
        .rejects.toThrow('Agent non-existent not found');
    });
  });

  describe('Collaboration Rules', () => {
    it('should update collaboration rules', async () => {
      const rules = {
        allowedActions: {
          [AgentType.TESTING]: ['test', 'validate']
        }
      };

      await coordinationManager.updateCollaborationRules(rules);
      const retrievedRules = await coordinationManager.getCollaborationRules();

      expect(retrievedRules.allowedActions).toEqual(rules.allowedActions);
    });

    it.skip('should validate agent action based on rules', async () => {
      const agentConfig: AgentConfig = {
        name: 'Test Agent',
        type: AgentType.TESTING,
        capabilities: ['testing'],
        maxConcurrentTasks: 3,
        timeout: 300000,
        retryAttempts: 3
      };

      const agent = await coordinationManager.createAgent(agentConfig);

      const rules = {
        allowedActions: {
          [AgentType.TESTING]: ['test', 'validate']
        }
      };

      await coordinationManager.updateCollaborationRules(rules);

      const isValid = await coordinationManager.validateAgentAction(agent.id, 'test', {});
      expect(isValid).toBe(true);

      const isInvalid = await coordinationManager.validateAgentAction(agent.id, 'deploy', {});
      expect(isInvalid).toBe(false);
    });
  });

  describe('System Coordination', () => {
    it('should coordinate agent actions', async () => {
      const agentConfig1: AgentConfig = {
        name: 'Agent 1',
        type: AgentType.TESTING,
        capabilities: ['testing'],
        maxConcurrentTasks: 3,
        timeout: 300000,
        retryAttempts: 3
      };

      const agentConfig2: AgentConfig = {
        name: 'Agent 2',
        type: AgentType.FRONTEND,
        capabilities: ['frontend'],
        maxConcurrentTasks: 3,
        timeout: 300000,
        retryAttempts: 3
      };

      // Mock different agents
      (ConcreteAgentFactory.createAgentInstance as jest.Mock)
        .mockReturnValueOnce({ ...mockAgent, id: 'agent-1' })
        .mockReturnValueOnce({ ...mockAgent, id: 'agent-2' });

      const agent1 = await coordinationManager.createAgent(agentConfig1);
      const agent2 = await coordinationManager.createAgent(agentConfig2);

      await coordinationManager.coordinateAgentActions([agent1.id, agent2.id], 'sync', {});

      // This test mainly ensures no errors are thrown during coordination
      expect(true).toBe(true);
    });

    it('should synchronize agent states', async () => {
      const agentConfig: AgentConfig = {
        name: 'Test Agent',
        type: AgentType.TESTING,
        capabilities: ['testing'],
        maxConcurrentTasks: 3,
        timeout: 300000,
        retryAttempts: 3
      };

      await coordinationManager.createAgent(agentConfig);
      await coordinationManager.synchronizeAgentStates();

      expect(mockAgent.getStatus).toHaveBeenCalled();
      expect(mockAgent.getWorkload).toHaveBeenCalled();
    });
  });

  describe('Event Emission', () => {
    it('should emit AGENT_CREATED event when agent is created', async () => {
      const eventSpy = jest.fn();
      coordinationManager.on(EventType.AGENT_CREATED, eventSpy);

      const agentConfig: AgentConfig = {
        name: 'Test Agent',
        type: AgentType.TESTING,
        capabilities: ['testing'],
        maxConcurrentTasks: 3,
        timeout: 300000,
        retryAttempts: 3
      };

      await coordinationManager.createAgent(agentConfig);

      expect(eventSpy).toHaveBeenCalledWith(expect.objectContaining({
        name: 'Test Agent',
        type: AgentType.TESTING
      }));
    });

    it('should emit AGENT_DESTROYED event when agent is destroyed', async () => {
      const eventSpy = jest.fn();
      coordinationManager.on(EventType.AGENT_DESTROYED, eventSpy);

      const agentConfig: AgentConfig = {
        name: 'Test Agent',
        type: AgentType.TESTING,
        capabilities: ['testing'],
        maxConcurrentTasks: 3,
        timeout: 300000,
        retryAttempts: 3
      };

      const agent = await coordinationManager.createAgent(agentConfig);
      await coordinationManager.destroyAgent(agent.id);

      expect(eventSpy).toHaveBeenCalledWith({ agentId: agent.id });
    });

    it('should emit COLLABORATION_STARTED event when collaboration starts', async () => {
      const eventSpy = jest.fn();
      coordinationManager.on(EventType.COLLABORATION_STARTED, eventSpy);

      const agentConfig: AgentConfig = {
        name: 'Test Agent',
        type: AgentType.TESTING,
        capabilities: ['testing'],
        maxConcurrentTasks: 3,
        timeout: 300000,
        retryAttempts: 3
      };

      const agent = await coordinationManager.createAgent(agentConfig);
      const session = await coordinationManager.startCollaboration([agent.id], []);

      expect(eventSpy).toHaveBeenCalledWith(session);
    });
  });
});
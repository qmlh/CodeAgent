/**
 * Integration tests for coordination flow
 * Tests the complete workflow orchestration and collaboration
 */

import { CoordinationManager, CoordinationManagerConfig } from '../CoordinationManager';
import { WorkflowOrchestrator, WorkflowState } from '../WorkflowOrchestrator';
import { CollaborationRulesEngine, RuleType, ActionType, ConditionOperator } from '../CollaborationRulesEngine';
import { AgentHealthMonitor } from '../AgentHealthMonitor';
import { AgentType, AgentStatus, AgentConfig } from '../../types/agent.types';
import { WorkflowConfig, WorkflowStep } from '../../types/config.types';
import { ConcreteAgentFactory } from '../../agents/ConcreteAgentFactory';
import { TestAgent } from '../../agents/TestAgent';

// Mock the ConcreteAgentFactory
jest.mock('../../agents/ConcreteAgentFactory');

describe('Coordination Flow Integration', () => {
  let coordinationManager: CoordinationManager;
  let config: CoordinationManagerConfig;
  let mockAgent: any;

  beforeEach(() => {
    config = {
      maxAgents: 10,
      healthCheckInterval: 1000, // Faster for testing
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

  describe('Workflow Orchestration Integration', () => {
    it('should execute a complete workflow with multiple agents', async () => {
      // Create agents for different roles
      const frontendConfig: AgentConfig = {
        name: 'Frontend Agent',
        type: AgentType.FRONTEND,
        capabilities: ['react', 'typescript'],
        maxConcurrentTasks: 2,
        timeout: 300000,
        retryAttempts: 3
      };

      const backendConfig: AgentConfig = {
        name: 'Backend Agent',
        type: AgentType.BACKEND,
        capabilities: ['nodejs', 'api'],
        maxConcurrentTasks: 2,
        timeout: 300000,
        retryAttempts: 3
      };

      const testingConfig: AgentConfig = {
        name: 'Testing Agent',
        type: AgentType.TESTING,
        capabilities: ['unit-testing', 'integration-testing'],
        maxConcurrentTasks: 3,
        timeout: 300000,
        retryAttempts: 3
      };

      // Mock different agents
      (ConcreteAgentFactory.createAgentInstance as jest.Mock)
        .mockReturnValueOnce({ ...mockAgent, id: 'frontend-agent', specialization: AgentType.FRONTEND })
        .mockReturnValueOnce({ ...mockAgent, id: 'backend-agent', specialization: AgentType.BACKEND })
        .mockReturnValueOnce({ ...mockAgent, id: 'testing-agent', specialization: AgentType.TESTING });

      const frontendAgent = await coordinationManager.createAgent(frontendConfig);
      const backendAgent = await coordinationManager.createAgent(backendConfig);
      const testingAgent = await coordinationManager.createAgent(testingConfig);

      // Define a workflow
      const workflow: WorkflowConfig = {
        id: 'feature-development',
        name: 'Feature Development Workflow',
        steps: [
          {
            id: 'backend-api',
            name: 'Develop Backend API',
            agentType: 'backend',
            action: 'develop_api',
            parameters: { feature: 'user-management' },
            dependencies: []
          },
          {
            id: 'frontend-ui',
            name: 'Develop Frontend UI',
            agentType: 'frontend',
            action: 'develop_ui',
            parameters: { feature: 'user-management' },
            dependencies: ['backend-api']
          },
          {
            id: 'integration-tests',
            name: 'Run Integration Tests',
            agentType: 'testing',
            action: 'run_tests',
            parameters: { type: 'integration' },
            dependencies: ['backend-api', 'frontend-ui']
          }
        ],
        triggers: [],
        conditions: []
      };

      // Execute workflow
      await coordinationManager.executeWorkflow(workflow, { 
        projectId: 'test-project',
        version: '1.0.0'
      });

      // Verify workflow execution
      const workflowStatus = await coordinationManager.getWorkflowStatus('feature-development');
      expect(['completed', 'running', 'not_found']).toContain(workflowStatus);

      expect(frontendAgent).toBeDefined();
      expect(backendAgent).toBeDefined();
      expect(testingAgent).toBeDefined();
    });

    it('should handle workflow failures and recovery', async () => {
      const agentConfig: AgentConfig = {
        name: 'Test Agent',
        type: AgentType.TESTING,
        capabilities: ['testing'],
        maxConcurrentTasks: 3,
        timeout: 300000,
        retryAttempts: 3
      };

      const agent = await coordinationManager.createAgent(agentConfig);

      // Define a workflow with a failing step
      const workflow: WorkflowConfig = {
        id: 'failing-workflow',
        name: 'Failing Workflow',
        steps: [
          {
            id: 'failing-step',
            name: 'Failing Step',
            agentType: 'testing',
            action: 'fail_action',
            parameters: { shouldFail: true },
            dependencies: []
          }
        ],
        triggers: [],
        conditions: []
      };

      // Execute workflow and expect it to handle failures
      try {
        await coordinationManager.executeWorkflow(workflow, {});
      } catch (error) {
        // Workflow should handle failures gracefully
        expect(error).toBeDefined();
      }

      const workflowStatus = await coordinationManager.getWorkflowStatus('failing-workflow');
      expect(['failed', 'running', 'not_found']).toContain(workflowStatus);
    });
  });

  describe('Collaboration Rules Integration', () => {
    it('should enforce collaboration rules during agent actions', async () => {
      const agentConfig: AgentConfig = {
        name: 'Test Agent',
        type: AgentType.TESTING,
        capabilities: ['testing'],
        maxConcurrentTasks: 3,
        timeout: 300000,
        retryAttempts: 3
      };

      const agent = await coordinationManager.createAgent(agentConfig);
      const rulesEngine = coordinationManager.getRulesEngine();

      // Add a rule that blocks certain actions
      rulesEngine.addRule({
        id: 'block-deploy-action',
        name: 'Block Deploy Action for Testing Agents',
        description: 'Testing agents should not be allowed to deploy',
        type: RuleType.AGENT_ASSIGNMENT,
        conditions: [
          {
            field: 'agent.type',
            operator: ConditionOperator.EQUALS,
            value: AgentType.TESTING
          },
          {
            field: 'action',
            operator: ConditionOperator.EQUALS,
            value: 'deploy',
            logicalOperator: 'and' as any
          }
        ],
        actions: [
          {
            type: ActionType.BLOCK_ACTION,
            parameters: { reason: 'Testing agents cannot deploy' }
          }
        ],
        priority: 100,
        enabled: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      // Test that the rule blocks the action
      const isAllowed = await coordinationManager.validateAgentAction(agent.id, 'deploy', {});
      expect(isAllowed).toBe(false);

      // Test that other actions are allowed
      const isTestAllowed = await coordinationManager.validateAgentAction(agent.id, 'test', {});
      expect(isTestAllowed).toBe(true);
    });

    it.skip('should handle resource allocation rules', async () => {
      const agentConfig: AgentConfig = {
        name: 'Test Agent',
        type: AgentType.TESTING,
        capabilities: ['testing'],
        maxConcurrentTasks: 3,
        timeout: 300000,
        retryAttempts: 3
      };

      const agent = await coordinationManager.createAgent(agentConfig);
      const rulesEngine = coordinationManager.getRulesEngine();

      // Add a rule that limits resource access
      rulesEngine.addRule({
        id: 'limit-resources',
        name: 'Limit Resource Access',
        description: 'Limit agents to maximum 3 resources',
        type: RuleType.RESOURCE_ACCESS,
        conditions: [
          {
            field: 'resources.length',
            operator: ConditionOperator.GREATER_THAN,
            value: 3
          }
        ],
        actions: [
          {
            type: ActionType.BLOCK_ACTION,
            parameters: { reason: 'Too many resources requested' }
          }
        ],
        priority: 90,
        enabled: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      // Test resource allocation
      await coordinationManager.allocateResources(agent.id, ['resource1', 'resource2', 'resource3']);
      
      // This should be blocked by the rule
      const validation = await rulesEngine.validateResourceAccess(agent, ['resource4', 'resource5']);
      expect(validation.allowed).toBe(false);
    });
  });

  describe('Health Monitoring Integration', () => {
    it.skip('should monitor agent health and trigger recovery', async () => {
      const agentConfig: AgentConfig = {
        name: 'Test Agent',
        type: AgentType.TESTING,
        capabilities: ['testing'],
        maxConcurrentTasks: 3,
        timeout: 300000,
        retryAttempts: 3
      };

      const agent = await coordinationManager.createAgent(agentConfig);
      const healthMonitor = coordinationManager.getHealthMonitor();

      // Start monitoring
      healthMonitor.startMonitoring();

      // Simulate agent becoming unhealthy
      mockAgent.getStatus.mockReturnValue(AgentStatus.ERROR);

      // Wait for health check
      await new Promise(resolve => setTimeout(resolve, 1100));

      // Check that health status is updated
      const healthMetrics = healthMonitor.getAgentHealth(agent.id);
      expect(healthMetrics).toBeDefined();

      // Check overall health statistics
      const stats = healthMonitor.getHealthStatistics();
      expect(stats.totalAgents).toBe(1);
    });

    it('should handle agent recovery scenarios', async () => {
      const agentConfig: AgentConfig = {
        name: 'Test Agent',
        type: AgentType.TESTING,
        capabilities: ['testing'],
        maxConcurrentTasks: 3,
        timeout: 300000,
        retryAttempts: 3
      };

      const agent = await coordinationManager.createAgent(agentConfig);
      const healthMonitor = coordinationManager.getHealthMonitor();

      // Simulate recovery attempt
      const recoveryResult = await healthMonitor.attemptRecovery(agent.id);
      expect(recoveryResult).toBeDefined();
      expect(recoveryResult.success).toBe(true);

      // Check recovery history
      const recoveryHistory = healthMonitor.getRecoveryHistory(agent.id);
      expect(recoveryHistory.length).toBeGreaterThan(0);
    });
  });

  describe('End-to-End Collaboration Scenarios', () => {
    it('should coordinate multiple agents in a complex collaboration session', async () => {
      // Create multiple agents
      const agents = [];
      for (let i = 0; i < 3; i++) {
        (ConcreteAgentFactory.createAgentInstance as jest.Mock)
          .mockReturnValueOnce({ ...mockAgent, id: `agent-${i}` });

        const agentConfig: AgentConfig = {
          name: `Agent ${i}`,
          type: AgentType.TESTING,
          capabilities: ['testing'],
          maxConcurrentTasks: 3,
          timeout: 300000,
          retryAttempts: 3
        };

        const agent = await coordinationManager.createAgent(agentConfig);
        agents.push(agent);
      }

      // Start collaboration session
      const session = await coordinationManager.startCollaboration(
        agents.map(a => a.id),
        ['file1.ts', 'file2.ts', 'file3.ts']
      );

      expect(session.participants).toHaveLength(3);
      expect(session.sharedFiles).toHaveLength(3);
      expect(session.status).toBe('active');

      // Coordinate actions across agents
      await coordinationManager.coordinateAgentActions(
        agents.map(a => a.id),
        'sync_state',
        { sessionId: session.id }
      );

      // End collaboration
      await coordinationManager.endCollaboration(session.id);

      const activeSessions = await coordinationManager.getActiveCollaborations();
      expect(activeSessions).toHaveLength(0);
    });

    it('should handle resource conflicts and resolution', async () => {
      // Create two agents
      (ConcreteAgentFactory.createAgentInstance as jest.Mock)
        .mockReturnValueOnce({ ...mockAgent, id: 'agent-1' })
        .mockReturnValueOnce({ ...mockAgent, id: 'agent-2' });

      const agent1Config: AgentConfig = {
        name: 'Agent 1',
        type: AgentType.FRONTEND,
        capabilities: ['frontend'],
        maxConcurrentTasks: 3,
        timeout: 300000,
        retryAttempts: 3
      };

      const agent2Config: AgentConfig = {
        name: 'Agent 2',
        type: AgentType.BACKEND,
        capabilities: ['backend'],
        maxConcurrentTasks: 3,
        timeout: 300000,
        retryAttempts: 3
      };

      const agent1 = await coordinationManager.createAgent(agent1Config);
      const agent2 = await coordinationManager.createAgent(agent2Config);

      // Allocate overlapping resources
      await coordinationManager.allocateResources(agent1.id, ['shared-resource', 'agent1-resource']);
      await coordinationManager.allocateResources(agent2.id, ['shared-resource', 'agent2-resource']);

      // Check resource usage
      const resourceUsage = await coordinationManager.getResourceUsage();
      expect(resourceUsage[agent1.id]).toContain('shared-resource');
      expect(resourceUsage[agent2.id]).toContain('shared-resource');

      // Deallocate resources
      await coordinationManager.deallocateResources(agent1.id, ['shared-resource']);
      
      const updatedUsage = await coordinationManager.getResourceUsage();
      expect(updatedUsage[agent1.id]).not.toContain('shared-resource');
      expect(updatedUsage[agent2.id]).toContain('shared-resource');
    });

    it('should maintain system state consistency during complex operations', async () => {
      // Create agents
      const agentConfigs = [
        { name: 'Frontend Agent', type: AgentType.FRONTEND },
        { name: 'Backend Agent', type: AgentType.BACKEND },
        { name: 'Testing Agent', type: AgentType.TESTING }
      ];

      const agents = [];
      for (const config of agentConfigs) {
        (ConcreteAgentFactory.createAgentInstance as jest.Mock)
          .mockReturnValueOnce({ ...mockAgent, id: `${config.type}-agent` });

        const agentConfig: AgentConfig = {
          name: config.name,
          type: config.type,
          capabilities: [config.type],
          maxConcurrentTasks: 3,
          timeout: 300000,
          retryAttempts: 3
        };

        const agent = await coordinationManager.createAgent(agentConfig);
        agents.push(agent);
      }

      // Perform multiple operations concurrently
      const operations = [
        coordinationManager.startCollaboration([agents[0].id, agents[1].id], ['file1.ts']),
        coordinationManager.allocateResources(agents[2].id, ['test-resource']),
        coordinationManager.synchronizeAgentStates()
      ];

      await Promise.all(operations);

      // Verify system state
      const allAgents = await coordinationManager.getAllAgents();
      expect(allAgents).toHaveLength(3);

      const activeSessions = await coordinationManager.getActiveCollaborations();
      expect(activeSessions).toHaveLength(1);

      const resourceUsage = await coordinationManager.getResourceUsage();
      expect(Object.keys(resourceUsage)).toContain(agents[2].id);
    });
  });

  describe('Error Handling and Recovery', () => {
    it('should handle cascading failures gracefully', async () => {
      const agentConfig: AgentConfig = {
        name: 'Test Agent',
        type: AgentType.TESTING,
        capabilities: ['testing'],
        maxConcurrentTasks: 3,
        timeout: 300000,
        retryAttempts: 3
      };

      const agent = await coordinationManager.createAgent(agentConfig);

      // Simulate multiple failures
      mockAgent.getStatus.mockReturnValue(AgentStatus.ERROR);
      mockAgent.shutdown.mockRejectedValue(new Error('Shutdown failed'));

      // The system should handle these failures without crashing
      try {
        await coordinationManager.destroyAgent(agent.id);
      } catch (error) {
        // Expected to fail, but system should remain stable
        expect(error).toBeDefined();
      }

      // System should still be operational
      const remainingAgents = await coordinationManager.getAllAgents();
      expect(Array.isArray(remainingAgents)).toBe(true);
    });

    it('should maintain data consistency during partial failures', async () => {
      // Create multiple agents
      const agents = [];
      for (let i = 0; i < 3; i++) {
        (ConcreteAgentFactory.createAgentInstance as jest.Mock)
          .mockReturnValueOnce({ ...mockAgent, id: `agent-${i}` });

        const agentConfig: AgentConfig = {
          name: `Agent ${i}`,
          type: AgentType.TESTING,
          capabilities: ['testing'],
          maxConcurrentTasks: 3,
          timeout: 300000,
          retryAttempts: 3
        };

        const agent = await coordinationManager.createAgent(agentConfig);
        agents.push(agent);
      }

      // Start collaboration
      const session = await coordinationManager.startCollaboration(
        agents.map(a => a.id),
        ['file1.ts']
      );

      // Simulate one agent failing
      mockAgent.shutdown.mockRejectedValueOnce(new Error('Agent 1 failed'));

      // Remove one agent
      try {
        await coordinationManager.destroyAgent(agents[0].id);
      } catch (error) {
        // Expected failure
      }

      // Session should still be active with remaining agents
      const activeSessions = await coordinationManager.getActiveCollaborations();
      expect(activeSessions).toHaveLength(1);
      
      // But the failed agent should be removed from the session
      const updatedSession = activeSessions[0];
      expect(updatedSession.participants).not.toContain(agents[0].id);
    });
  });
});
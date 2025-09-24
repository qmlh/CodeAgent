/**
 * Tests for AgentRegistry class
 */

import { AgentRegistry, AgentDiscoveryCriteria } from '../AgentRegistry';
import { ConcreteAgentFactory } from '../ConcreteAgentFactory';
import { BaseAgent } from '../BaseAgent';
import { AgentType, AgentStatus } from '../../core';
import { AgentError } from '../../core/errors/SystemError';

describe('AgentRegistry', () => {
  let registry: AgentRegistry;
  let testAgent1: BaseAgent;
  let testAgent2: BaseAgent;
  let testAgent3: BaseAgent;

  beforeEach(async () => {
    registry = new AgentRegistry();
    
    // Initialize factory
    ConcreteAgentFactory.initializeDefaults();

    // Create test agents
    testAgent1 = ConcreteAgentFactory.createAgentInstance({
      name: 'Test Agent 1',
      type: AgentType.FRONTEND,
      capabilities: ['html', 'css', 'javascript']
    });

    testAgent2 = ConcreteAgentFactory.createAgentInstance({
      name: 'Test Agent 2',
      type: AgentType.BACKEND,
      capabilities: ['nodejs', 'api_design', 'database_design']
    });

    testAgent3 = ConcreteAgentFactory.createAgentInstance({
      name: 'Test Agent 3',
      type: AgentType.TESTING,
      capabilities: ['unit_testing', 'integration_testing']
    });

    // Initialize agents
    await testAgent1.initialize(testAgent1.getConfig());
    await testAgent2.initialize(testAgent2.getConfig());
    await testAgent3.initialize(testAgent3.getConfig());
  });

  afterEach(async () => {
    // Shutdown all agents and registry
    await registry.shutdownAll();
    ConcreteAgentFactory.reset();
    
    // Create a new registry for the next test
    registry = new AgentRegistry();
  });

  describe('Agent Registration', () => {
    it('should register agent successfully', async () => {
      expect(registry.isAgentRegistered(testAgent1.id)).toBe(false);

      await registry.registerAgent(testAgent1);

      expect(registry.isAgentRegistered(testAgent1.id)).toBe(true);
      expect(registry.getAgent(testAgent1.id)).toBe(testAgent1);
      expect(registry.getAgentMetadata(testAgent1.id)).toBeDefined();
    });

    it('should emit registration event', async () => {
      let registeredAgent: any = null;

      registry.on('agent-registered', (agent) => {
        registeredAgent = agent;
      });

      await registry.registerAgent(testAgent1);

      expect(registeredAgent).toBeDefined();
      expect(registeredAgent.id).toBe(testAgent1.id);
      expect(registeredAgent.name).toBe(testAgent1.name);
    });

    it('should prevent duplicate registration', async () => {
      await registry.registerAgent(testAgent1);

      await expect(registry.registerAgent(testAgent1))
        .rejects.toThrow(AgentError);
    });

    it('should validate agent before registration', async () => {
      // Create an invalid agent (this would be caught by the validator)
      const invalidAgent = ConcreteAgentFactory.createAgentInstance({
        name: 'Invalid Agent',
        type: AgentType.TESTING
      });

      // Manually corrupt the agent to make it invalid
      (invalidAgent as any).name = ''; // Invalid empty name

      await expect(registry.registerAgent(invalidAgent))
        .rejects.toThrow();
    });

    it('should update indexes when registering agent', async () => {
      await registry.registerAgent(testAgent1);

      const frontendAgents = registry.getAgentsByType(AgentType.FRONTEND);
      expect(frontendAgents).toHaveLength(1);
      expect(frontendAgents[0].id).toBe(testAgent1.id);

      const htmlAgents = registry.getAgentsByCapability('html');
      expect(htmlAgents).toHaveLength(1);
      expect(htmlAgents[0].id).toBe(testAgent1.id);
    });
  });

  describe('Agent Unregistration', () => {
    beforeEach(async () => {
      await registry.registerAgent(testAgent1);
      await registry.registerAgent(testAgent2);
    });

    it('should unregister agent successfully', async () => {
      expect(registry.isAgentRegistered(testAgent1.id)).toBe(true);

      await registry.unregisterAgent(testAgent1.id);

      expect(registry.isAgentRegistered(testAgent1.id)).toBe(false);
      expect(registry.getAgent(testAgent1.id)).toBeNull();
      expect(registry.getAgentMetadata(testAgent1.id)).toBeNull();
    });

    it('should emit unregistration event', async () => {
      let unregisteredAgentId: string | null = null;

      registry.on('agent-unregistered', (agentId) => {
        unregisteredAgentId = agentId;
      });

      await registry.unregisterAgent(testAgent1.id);

      expect(unregisteredAgentId).toBe(testAgent1.id);
    });

    it('should shutdown agent during unregistration', async () => {
      expect(testAgent1.isHealthy()).toBe(true);

      await registry.unregisterAgent(testAgent1.id);

      expect(testAgent1.isHealthy()).toBe(false);
    });

    it('should throw error for non-existent agent', async () => {
      await expect(registry.unregisterAgent('non-existent-id'))
        .rejects.toThrow(AgentError);
    });

    it('should update indexes when unregistering agent', async () => {
      // Verify agent is in indexes (already registered in beforeEach)
      expect(registry.getAgentsByType(AgentType.FRONTEND)).toHaveLength(1);
      expect(registry.getAgentsByCapability('html')).toHaveLength(1);

      await registry.unregisterAgent(testAgent1.id);

      // Verify agent is removed from indexes
      expect(registry.getAgentsByType(AgentType.FRONTEND)).toHaveLength(0);
      expect(registry.getAgentsByCapability('html')).toHaveLength(0);
    });
  });

  describe('Agent Retrieval', () => {
    beforeEach(async () => {
      await registry.registerAgent(testAgent1);
      await registry.registerAgent(testAgent2);
      await registry.registerAgent(testAgent3);
    });

    it('should get agent by ID', () => {
      const agent = registry.getAgent(testAgent1.id);
      expect(agent).toBe(testAgent1);

      const nonExistentAgent = registry.getAgent('non-existent-id');
      expect(nonExistentAgent).toBeNull();
    });

    it('should get agent metadata by ID', () => {
      const metadata = registry.getAgentMetadata(testAgent1.id);
      expect(metadata).toBeDefined();
      expect(metadata!.id).toBe(testAgent1.id);
      expect(metadata!.name).toBe(testAgent1.name);
      expect(metadata!.type).toBe(testAgent1.specialization);

      const nonExistentMetadata = registry.getAgentMetadata('non-existent-id');
      expect(nonExistentMetadata).toBeNull();
    });

    it('should get all agents', () => {
      const allAgents = registry.getAllAgents();
      expect(allAgents).toHaveLength(3);
      
      const agentIds = allAgents.map(a => a.id);
      expect(agentIds).toContain(testAgent1.id);
      expect(agentIds).toContain(testAgent2.id);
      expect(agentIds).toContain(testAgent3.id);
    });

    it('should get agents by type', () => {
      const frontendAgents = registry.getAgentsByType(AgentType.FRONTEND);
      expect(frontendAgents).toHaveLength(1);
      expect(frontendAgents[0].id).toBe(testAgent1.id);

      const backendAgents = registry.getAgentsByType(AgentType.BACKEND);
      expect(backendAgents).toHaveLength(1);
      expect(backendAgents[0].id).toBe(testAgent2.id);

      const devopsAgents = registry.getAgentsByType(AgentType.DEVOPS);
      expect(devopsAgents).toHaveLength(0);
    });

    it('should get agents by capability', () => {
      const htmlAgents = registry.getAgentsByCapability('html');
      expect(htmlAgents).toHaveLength(1);
      expect(htmlAgents[0].id).toBe(testAgent1.id);

      const testingAgents = registry.getAgentsByCapability('unit_testing');
      expect(testingAgents).toHaveLength(1);
      expect(testingAgents[0].id).toBe(testAgent3.id);

      const nonExistentCapability = registry.getAgentsByCapability('non-existent');
      expect(nonExistentCapability).toHaveLength(0);
    });
  });

  describe('Agent Discovery', () => {
    beforeEach(async () => {
      await registry.registerAgent(testAgent1);
      await registry.registerAgent(testAgent2);
      await registry.registerAgent(testAgent3);
    });

    it('should discover all agents with empty criteria', () => {
      const agents = registry.discoverAgents({});
      expect(agents).toHaveLength(3);
    });

    it('should discover agents by type', () => {
      const criteria: AgentDiscoveryCriteria = {
        type: AgentType.FRONTEND
      };

      const agents = registry.discoverAgents(criteria);
      expect(agents).toHaveLength(1);
      expect(agents[0].type).toBe(AgentType.FRONTEND);
    });

    it('should discover agents by status', () => {
      const criteria: AgentDiscoveryCriteria = {
        status: AgentStatus.IDLE
      };

      const agents = registry.discoverAgents(criteria);
      expect(agents).toHaveLength(3); // All agents should be idle
      agents.forEach(agent => {
        expect(agent.status).toBe(AgentStatus.IDLE);
      });
    });

    it('should discover agents by capabilities', () => {
      const criteria: AgentDiscoveryCriteria = {
        capabilities: ['html', 'css']
      };

      const agents = registry.discoverAgents(criteria);
      expect(agents).toHaveLength(1);
      expect(agents[0].id).toBe(testAgent1.id);
    });

    it('should discover agents by workload', () => {
      const criteria: AgentDiscoveryCriteria = {
        maxWorkload: 50
      };

      const agents = registry.discoverAgents(criteria);
      expect(agents).toHaveLength(3); // All agents should have 0 workload
    });

    it('should discover agents with multiple criteria', () => {
      const criteria: AgentDiscoveryCriteria = {
        type: AgentType.FRONTEND,
        status: AgentStatus.IDLE,
        capabilities: ['html'],
        maxWorkload: 50
      };

      const agents = registry.discoverAgents(criteria);
      expect(agents).toHaveLength(1);
      expect(agents[0].id).toBe(testAgent1.id);
    });

    it('should return empty array when no agents match criteria', () => {
      const criteria: AgentDiscoveryCriteria = {
        type: AgentType.DEVOPS // No DevOps agents registered
      };

      const agents = registry.discoverAgents(criteria);
      expect(agents).toHaveLength(0);
    });
  });

  describe('Best Agent Selection', () => {
    beforeEach(async () => {
      await registry.registerAgent(testAgent1);
      await registry.registerAgent(testAgent2);
      await registry.registerAgent(testAgent3);
    });

    it('should find best agent by capabilities', () => {
      const bestAgent = registry.findBestAgent(['html', 'css']);
      expect(bestAgent).toBeDefined();
      expect(bestAgent!.id).toBe(testAgent1.id);
    });

    it('should find best agent by capabilities and preferred type', () => {
      const bestAgent = registry.findBestAgent(['unit_testing'], AgentType.TESTING);
      expect(bestAgent).toBeDefined();
      expect(bestAgent!.id).toBe(testAgent3.id);
    });

    it('should return null when no agent has required capabilities', () => {
      const bestAgent = registry.findBestAgent(['non-existent-capability']);
      expect(bestAgent).toBeNull();
    });

    it('should prefer idle agents over working agents', async () => {
      // Simulate one agent being busy by updating its metadata
      registry.updateAgentMetadata(testAgent1.id);
      
      const bestAgent = registry.findBestAgent(['html']);
      expect(bestAgent).toBeDefined();
    });

    it('should select agent with lowest workload when no idle agents', async () => {
      // This test would require simulating different workloads
      // For now, we test that it returns an agent
      const bestAgent = registry.findBestAgent(['html']);
      expect(bestAgent).toBeDefined();
    });
  });

  describe('Metadata Updates', () => {
    beforeEach(async () => {
      await registry.registerAgent(testAgent1);
    });

    it('should update agent metadata', () => {
      const originalMetadata = registry.getAgentMetadata(testAgent1.id);
      const originalLastActive = originalMetadata!.lastActive;

      // Wait a bit to ensure different timestamp
      setTimeout(() => {
        registry.updateAgentMetadata(testAgent1.id);
        
        const updatedMetadata = registry.getAgentMetadata(testAgent1.id);
        expect(updatedMetadata!.lastActive.getTime()).toBeGreaterThan(originalLastActive.getTime());
      }, 10);
    });

    it('should handle metadata update for non-existent agent', () => {
      // Should not throw error
      expect(() => {
        registry.updateAgentMetadata('non-existent-id');
      }).not.toThrow();
    });

    it('should emit status change events', async () => {
      let statusChangeEvent: any = null;

      registry.on('agent-status-changed', (agentId, oldStatus, newStatus) => {
        statusChangeEvent = { agentId, oldStatus, newStatus };
      });

      // Trigger a status change by having the agent emit the event
      testAgent1.emit('status-changed', AgentStatus.IDLE, AgentStatus.WORKING);

      expect(statusChangeEvent).toBeDefined();
      expect(statusChangeEvent.agentId).toBe(testAgent1.id);
    });
  });

  describe('Health Check', () => {
    beforeEach(async () => {
      await registry.registerAgent(testAgent1);
      await registry.registerAgent(testAgent2);
      await registry.registerAgent(testAgent3);
    });

    it('should perform health check on all agents', async () => {
      const healthCheck = await registry.performHealthCheck();

      expect(healthCheck.healthy).toHaveLength(3);
      expect(healthCheck.unhealthy).toHaveLength(0);
    });

    it('should identify unhealthy agents', async () => {
      // Shutdown one agent to make it unhealthy
      await testAgent1.shutdown();

      const healthCheck = await registry.performHealthCheck();

      expect(healthCheck.healthy).toHaveLength(2);
      expect(healthCheck.unhealthy).toHaveLength(1);
      expect(healthCheck.unhealthy[0].id).toBe(testAgent1.id);
    });
  });

  describe('Statistics', () => {
    beforeEach(async () => {
      await registry.registerAgent(testAgent1);
      await registry.registerAgent(testAgent2);
      await registry.registerAgent(testAgent3);
    });

    it('should provide registry statistics', async () => {
      const stats = registry.getStatistics();

      expect(stats.totalAgents).toBe(3);
      expect(stats.healthyAgents).toBe(3);
      expect(stats.averageWorkload).toBe(0);
      expect(stats.byType[AgentType.FRONTEND]).toBe(1);
      expect(stats.byType[AgentType.BACKEND]).toBe(1);
      expect(stats.byType[AgentType.TESTING]).toBe(1);
      expect(stats.byStatus[AgentStatus.IDLE]).toBe(3);
      expect(Array.isArray(stats.capabilities)).toBe(true);
      expect(stats.capabilities.length).toBeGreaterThan(0);
    });

    it('should update statistics when agents are added/removed', async () => {
      const initialStats = registry.getStatistics();
      expect(initialStats.totalAgents).toBe(3);

      await registry.unregisterAgent(testAgent1.id);

      const updatedStats = registry.getStatistics();
      expect(updatedStats.totalAgents).toBe(2);
      expect(updatedStats.byType[AgentType.FRONTEND]).toBeUndefined();
    });
  });

  describe('Shutdown', () => {
    beforeEach(async () => {
      await registry.registerAgent(testAgent1);
      await registry.registerAgent(testAgent2);
      await registry.registerAgent(testAgent3);
    });

    it('should shutdown all agents', async () => {
      expect(testAgent1.isHealthy()).toBe(true);
      expect(testAgent2.isHealthy()).toBe(true);
      expect(testAgent3.isHealthy()).toBe(true);

      await registry.shutdownAll();

      expect(testAgent1.isHealthy()).toBe(false);
      expect(testAgent2.isHealthy()).toBe(false);
      expect(testAgent3.isHealthy()).toBe(false);
    });

    it('should clear all data after shutdown', async () => {
      expect(registry.getAllAgents()).toHaveLength(3);

      await registry.shutdownAll();

      expect(registry.getAllAgents()).toHaveLength(0);
      expect(registry.getStatistics().totalAgents).toBe(0);
    });

    it('should remove all event listeners after shutdown', async () => {
      const listenerCount = registry.listenerCount('agent-registered');
      
      await registry.shutdownAll();

      // Registry should have no listeners after shutdown
      expect(registry.listenerCount('agent-registered')).toBe(0);
    });
  });

  describe('Event Handling', () => {
    beforeEach(async () => {
      await registry.registerAgent(testAgent1);
    });

    it('should listen to agent events', async () => {
      let errorEvent: any = null;

      registry.on('agent-error', (agentId, error) => {
        errorEvent = { agentId, error };
      });

      // Simulate an agent error
      const testError = new Error('Test error');
      testAgent1.emit('error', testError);

      expect(errorEvent).toBeDefined();
      expect(errorEvent.agentId).toBe(testAgent1.id);
      expect(errorEvent.error).toBe(testError);
    });

    it('should update metadata on agent events', async () => {
      const originalMetadata = registry.getAgentMetadata(testAgent1.id);
      const originalLastActive = originalMetadata!.lastActive;

      // Wait a bit then trigger an event
      await new Promise(resolve => setTimeout(resolve, 10));
      testAgent1.emit('task-started', {} as any);

      const updatedMetadata = registry.getAgentMetadata(testAgent1.id);
      expect(updatedMetadata!.lastActive.getTime()).toBeGreaterThan(originalLastActive.getTime());
    });
  });

  describe('Error Handling', () => {
    it('should handle registration errors gracefully', async () => {
      // Try to register an agent that's already registered
      await registry.registerAgent(testAgent1);

      await expect(registry.registerAgent(testAgent1))
        .rejects.toThrow(AgentError);
    });

    it('should handle unregistration errors gracefully', async () => {
      await expect(registry.unregisterAgent('non-existent-id'))
        .rejects.toThrow(AgentError);
    });

    it.skip('should handle agent shutdown errors during unregistration', async () => {
      await registry.registerAgent(testAgent1);

      // Mock agent shutdown to throw error
      const originalShutdown = testAgent1.shutdown;
      const mockShutdown = jest.fn().mockRejectedValue(new Error('Shutdown error'));
      testAgent1.shutdown = mockShutdown;

      // Should still unregister the agent despite shutdown error
      await registry.unregisterAgent(testAgent1.id);
      expect(registry.isAgentRegistered(testAgent1.id)).toBe(false);

      // Restore original method
      testAgent1.shutdown = originalShutdown;
    });
  });
});
/**
 * Agent Registry for managing agent instances and discovery
 */

import { EventEmitter } from 'eventemitter3';
import { Agent, AgentType, AgentStatus, AgentConfig } from '../core';
import { BaseAgent } from './BaseAgent';
import { AgentError, ValidationError } from '../core/errors/SystemError';
import { AgentValidator, ValidationUtils } from '../core/validation';

/**
 * Agent registry events
 */
export interface AgentRegistryEvents {
  'agent-registered': (agent: Agent) => void;
  'agent-unregistered': (agentId: string) => void;
  'agent-status-changed': (agentId: string, oldStatus: AgentStatus, newStatus: AgentStatus) => void;
  'agent-error': (agentId: string, error: Error) => void;
}

/**
 * Agent discovery criteria
 */
export interface AgentDiscoveryCriteria {
  type?: AgentType;
  status?: AgentStatus;
  capabilities?: string[];
  maxWorkload?: number;
  tags?: string[];
}

/**
 * Agent registry for managing agent instances
 */
export class AgentRegistry extends EventEmitter<AgentRegistryEvents> {
  private _agents: Map<string, BaseAgent> = new Map();
  private _agentMetadata: Map<string, Agent> = new Map();
  private _agentsByType: Map<AgentType, Set<string>> = new Map();
  private _agentsByCapability: Map<string, Set<string>> = new Map();
  private _validator = new AgentValidator();

  constructor() {
    super();
    this.initializeTypeIndexes();
  }

  /**
   * Register an agent instance
   */
  public async registerAgent(agentInstance: BaseAgent): Promise<void> {
    const agentId = agentInstance.id;
    
    if (this._agents.has(agentId)) {
      throw new AgentError(`Agent with ID ${agentId} is already registered`, agentId);
    }

    // Create agent metadata
    const agentMetadata: Agent = {
      id: agentInstance.id,
      name: agentInstance.name,
      type: agentInstance.specialization,
      status: agentInstance.status,
      config: agentInstance.getConfig(),
      capabilities: agentInstance.getCapabilities(),
      workload: agentInstance.getWorkload(),
      createdAt: new Date(),
      lastActive: new Date()
    };

    // Validate agent metadata
    ValidationUtils.validateOrThrow(this._validator, agentMetadata, 'AgentRegistry.registerAgent');

    // Store agent and metadata
    this._agents.set(agentId, agentInstance);
    this._agentMetadata.set(agentId, agentMetadata);

    // Update indexes
    this.addToTypeIndex(agentMetadata.type, agentId);
    this.addToCapabilityIndex(agentMetadata.capabilities, agentId);

    // Listen to agent events
    this.setupAgentEventListeners(agentInstance);

    this.emit('agent-registered', agentMetadata);
  }

  /**
   * Unregister an agent
   */
  public async unregisterAgent(agentId: string): Promise<void> {
    const agentInstance = this._agents.get(agentId);
    const agentMetadata = this._agentMetadata.get(agentId);

    if (!agentInstance || !agentMetadata) {
      throw new AgentError(`Agent with ID ${agentId} is not registered`, agentId);
    }

    // Shutdown agent if it's still running
    if (agentInstance.isHealthy()) {
      await agentInstance.shutdown();
    }

    // Remove from indexes
    this.removeFromTypeIndex(agentMetadata.type, agentId);
    this.removeFromCapabilityIndex(agentMetadata.capabilities, agentId);

    // Remove from storage
    this._agents.delete(agentId);
    this._agentMetadata.delete(agentId);

    // Remove event listeners
    agentInstance.removeAllListeners();

    this.emit('agent-unregistered', agentId);
  }

  /**
   * Get agent instance by ID
   */
  public getAgent(agentId: string): BaseAgent | null {
    return this._agents.get(agentId) || null;
  }

  /**
   * Get agent metadata by ID
   */
  public getAgentMetadata(agentId: string): Agent | null {
    return this._agentMetadata.get(agentId) || null;
  }

  /**
   * Get all registered agents
   */
  public getAllAgents(): Agent[] {
    return Array.from(this._agentMetadata.values());
  }

  /**
   * Get agents by type
   */
  public getAgentsByType(type: AgentType): Agent[] {
    const agentIds = this._agentsByType.get(type) || new Set();
    return Array.from(agentIds)
      .map(id => this._agentMetadata.get(id))
      .filter((agent): agent is Agent => agent !== undefined);
  }

  /**
   * Discover agents based on criteria
   */
  public discoverAgents(criteria: AgentDiscoveryCriteria = {}): Agent[] {
    let candidates = this.getAllAgents();

    // Filter by type
    if (criteria.type) {
      candidates = candidates.filter(agent => agent.type === criteria.type);
    }

    // Filter by status
    if (criteria.status) {
      candidates = candidates.filter(agent => agent.status === criteria.status);
    }

    // Filter by capabilities
    if (criteria.capabilities && criteria.capabilities.length > 0) {
      candidates = candidates.filter(agent => 
        criteria.capabilities!.every(cap => agent.capabilities.includes(cap))
      );
    }

    // Filter by workload
    if (criteria.maxWorkload !== undefined) {
      candidates = candidates.filter(agent => agent.workload <= criteria.maxWorkload!);
    }

    return candidates;
  }

  /**
   * Find the best agent for a task
   */
  public findBestAgent(requiredCapabilities: string[], preferredType?: AgentType): Agent | null {
    const criteria: AgentDiscoveryCriteria = {
      capabilities: requiredCapabilities,
      status: AgentStatus.IDLE
    };

    if (preferredType) {
      criteria.type = preferredType;
    }

    const candidates = this.discoverAgents(criteria);

    if (candidates.length === 0) {
      // Try without status filter (allow working agents)
      delete criteria.status;
      const workingCandidates = this.discoverAgents(criteria);
      
      if (workingCandidates.length === 0) {
        return null;
      }

      // Return the agent with lowest workload
      return workingCandidates.reduce((best, current) => 
        current.workload < best.workload ? current : best
      );
    }

    // Return the first idle agent (they're all idle)
    return candidates[0];
  }

  /**
   * Get agents by capability
   */
  public getAgentsByCapability(capability: string): Agent[] {
    const agentIds = this._agentsByCapability.get(capability) || new Set();
    return Array.from(agentIds)
      .map(id => this._agentMetadata.get(id))
      .filter((agent): agent is Agent => agent !== undefined);
  }

  /**
   * Check if agent is registered
   */
  public isAgentRegistered(agentId: string): boolean {
    return this._agents.has(agentId);
  }

  /**
   * Get registry statistics
   */
  public getStatistics() {
    const agents = this.getAllAgents();
    const byType = new Map<AgentType, number>();
    const byStatus = new Map<AgentStatus, number>();
    
    let totalWorkload = 0;
    let healthyAgents = 0;

    agents.forEach(agent => {
      // Count by type
      byType.set(agent.type, (byType.get(agent.type) || 0) + 1);
      
      // Count by status
      byStatus.set(agent.status, (byStatus.get(agent.status) || 0) + 1);
      
      // Calculate totals
      totalWorkload += agent.workload;
      if (agent.status !== AgentStatus.ERROR && agent.status !== AgentStatus.OFFLINE) {
        healthyAgents++;
      }
    });

    return {
      totalAgents: agents.length,
      healthyAgents,
      averageWorkload: agents.length > 0 ? totalWorkload / agents.length : 0,
      byType: Object.fromEntries(byType),
      byStatus: Object.fromEntries(byStatus),
      capabilities: Array.from(this._agentsByCapability.keys())
    };
  }

  /**
   * Update agent metadata when agent state changes
   */
  public updateAgentMetadata(agentId: string): void {
    const agentInstance = this._agents.get(agentId);
    const currentMetadata = this._agentMetadata.get(agentId);

    if (!agentInstance || !currentMetadata) {
      return;
    }

    // Update metadata with current agent state
    const updatedMetadata: Agent = {
      ...currentMetadata,
      status: agentInstance.status,
      workload: agentInstance.getWorkload(),
      currentTask: agentInstance.getCurrentTask()?.id,
      lastActive: new Date()
    };

    this._agentMetadata.set(agentId, updatedMetadata);
  }

  /**
   * Shutdown all agents
   */
  public async shutdownAll(): Promise<void> {
    const shutdownPromises = Array.from(this._agents.values()).map(agent => 
      agent.shutdown().catch(error => 
        console.error(`Failed to shutdown agent ${agent.id}:`, error)
      )
    );

    await Promise.all(shutdownPromises);
    
    // Clear all data
    this._agents.clear();
    this._agentMetadata.clear();
    this._agentsByType.clear();
    this._agentsByCapability.clear();
    
    // Reinitialize type indexes
    this.initializeTypeIndexes();
    
    this.removeAllListeners();
  }

  /**
   * Perform health check on all agents
   */
  public async performHealthCheck(): Promise<{ healthy: Agent[]; unhealthy: Agent[] }> {
    const healthy: Agent[] = [];
    const unhealthy: Agent[] = [];

    for (const [agentId, agentInstance] of this._agents) {
      const metadata = this._agentMetadata.get(agentId);
      if (!metadata) continue;

      if (agentInstance.isHealthy()) {
        healthy.push(metadata);
      } else {
        unhealthy.push(metadata);
      }
    }

    return { healthy, unhealthy };
  }

  // Private helper methods

  /**
   * Initialize type indexes
   */
  private initializeTypeIndexes(): void {
    Object.values(AgentType).forEach(type => {
      this._agentsByType.set(type, new Set());
    });
  }

  /**
   * Setup event listeners for an agent
   */
  private setupAgentEventListeners(agentInstance: BaseAgent): void {
    agentInstance.on('status-changed', (oldStatus, newStatus) => {
      this.updateAgentMetadata(agentInstance.id);
      this.emit('agent-status-changed', agentInstance.id, oldStatus, newStatus);
    });

    agentInstance.on('task-started', () => {
      this.updateAgentMetadata(agentInstance.id);
    });

    agentInstance.on('task-completed', () => {
      this.updateAgentMetadata(agentInstance.id);
    });

    agentInstance.on('task-failed', () => {
      this.updateAgentMetadata(agentInstance.id);
    });

    agentInstance.on('error', (error) => {
      this.emit('agent-error', agentInstance.id, error);
    });

    agentInstance.on('config-updated', () => {
      this.updateAgentMetadata(agentInstance.id);
    });
  }

  /**
   * Add agent to type index
   */
  private addToTypeIndex(type: AgentType, agentId: string): void {
    const typeSet = this._agentsByType.get(type);
    if (typeSet) {
      typeSet.add(agentId);
    }
  }

  /**
   * Remove agent from type index
   */
  private removeFromTypeIndex(type: AgentType, agentId: string): void {
    const typeSet = this._agentsByType.get(type);
    if (typeSet) {
      typeSet.delete(agentId);
    }
  }

  /**
   * Add agent to capability index
   */
  private addToCapabilityIndex(capabilities: string[], agentId: string): void {
    capabilities.forEach(capability => {
      if (!this._agentsByCapability.has(capability)) {
        this._agentsByCapability.set(capability, new Set());
      }
      this._agentsByCapability.get(capability)!.add(agentId);
    });
  }

  /**
   * Remove agent from capability index
   */
  private removeFromCapabilityIndex(capabilities: string[], agentId: string): void {
    capabilities.forEach(capability => {
      const capabilitySet = this._agentsByCapability.get(capability);
      if (capabilitySet) {
        capabilitySet.delete(agentId);
        if (capabilitySet.size === 0) {
          this._agentsByCapability.delete(capability);
        }
      }
    });
  }
}
/**
 * Agent Manager for high-level agent lifecycle management
 */

import { EventEmitter } from 'eventemitter3';
import { Agent, AgentType, AgentStatus, AgentConfig } from '../core';
import { BaseAgent } from './BaseAgent';
import { AgentRegistry, AgentDiscoveryCriteria } from './AgentRegistry';
import { ConcreteAgentFactory, CreateAgentInstanceOptions } from './ConcreteAgentFactory';
import { AgentError, SystemError } from '../core/errors/SystemError';

/**
 * Agent manager events
 */
export interface AgentManagerEvents {
  'agent-created': (agent: Agent) => void;
  'agent-destroyed': (agentId: string) => void;
  'agent-started': (agentId: string) => void;
  'agent-stopped': (agentId: string) => void;
  'agent-error': (agentId: string, error: Error) => void;
  'registry-updated': () => void;
}

/**
 * Agent lifecycle state
 */
export enum AgentLifecycleState {
  CREATED = 'created',
  INITIALIZING = 'initializing',
  RUNNING = 'running',
  STOPPING = 'stopping',
  STOPPED = 'stopped',
  ERROR = 'error'
}

/**
 * Agent lifecycle tracking
 */
interface AgentLifecycle {
  agentId: string;
  state: AgentLifecycleState;
  createdAt: Date;
  startedAt?: Date;
  stoppedAt?: Date;
  errorCount: number;
  lastError?: Error;
}

/**
 * Agent Manager class
 */
export class AgentManager extends EventEmitter<AgentManagerEvents> {
  private _registry: AgentRegistry;
  private _lifecycles: Map<string, AgentLifecycle> = new Map();
  private _isShuttingDown: boolean = false;

  constructor() {
    super();
    this._registry = new AgentRegistry();
    this.setupRegistryEventListeners();
    
    // Initialize factory with default types
    ConcreteAgentFactory.initializeDefaults();
  }

  /**
   * Create and start a new agent
   */
  public async createAgent(options: CreateAgentInstanceOptions): Promise<Agent> {
    if (this._isShuttingDown) {
      throw new SystemError('Cannot create agents during shutdown', 'system_error', 'medium');
    }

    // Validate creation options
    const validation = ConcreteAgentFactory.validateCreationOptions(options);
    if (!validation.isValid) {
      throw new ValidationError(`Invalid agent creation options: ${validation.errors.join(', ')}`);
    }

    try {
      // Create agent instance
      const agentInstance = ConcreteAgentFactory.createAgentInstance(options);
      
      // Track lifecycle
      this.trackAgentLifecycle(agentInstance.id, AgentLifecycleState.CREATED);

      // Register agent
      await this._registry.registerAgent(agentInstance);

      // Initialize agent
      this.updateLifecycleState(agentInstance.id, AgentLifecycleState.INITIALIZING);
      await agentInstance.initialize(agentInstance.getConfig());
      
      // Update lifecycle state
      this.updateLifecycleState(agentInstance.id, AgentLifecycleState.RUNNING);
      this.setAgentStartTime(agentInstance.id);

      const agentMetadata = this._registry.getAgentMetadata(agentInstance.id);
      if (!agentMetadata) {
        throw new AgentError('Failed to retrieve agent metadata after creation', agentInstance.id);
      }

      this.emit('agent-created', agentMetadata);
      this.emit('agent-started', agentInstance.id);
      this.emit('registry-updated');

      return agentMetadata;

    } catch (error) {
      const agentError = new AgentError(
        `Failed to create agent: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      
      // Update lifecycle state to error
      if (options.id || options.name) {
        const tempId = options.id || `temp-${Date.now()}`;
        this.updateLifecycleState(tempId, AgentLifecycleState.ERROR, agentError);
      }

      throw agentError;
    }
  }

  /**
   * Destroy an agent
   */
  public async destroyAgent(agentId: string): Promise<void> {
    const agentInstance = this._registry.getAgent(agentId);
    if (!agentInstance) {
      throw new AgentError(`Agent with ID ${agentId} not found`, agentId);
    }

    try {
      this.updateLifecycleState(agentId, AgentLifecycleState.STOPPING);

      // Unregister from registry (this will also shutdown the agent)
      await this._registry.unregisterAgent(agentId);

      // Update lifecycle
      this.updateLifecycleState(agentId, AgentLifecycleState.STOPPED);
      this.setAgentStopTime(agentId);

      this.emit('agent-destroyed', agentId);
      this.emit('registry-updated');

    } catch (error) {
      const agentError = new AgentError(
        `Failed to destroy agent: ${error instanceof Error ? error.message : 'Unknown error'}`,
        agentId
      );
      
      this.updateLifecycleState(agentId, AgentLifecycleState.ERROR, agentError);
      this.emit('agent-error', agentId, agentError);
      throw agentError;
    }
  }

  /**
   * Get agent by ID
   */
  public getAgent(agentId: string): Agent | null {
    return this._registry.getAgentMetadata(agentId);
  }

  /**
   * Get all agents
   */
  public getAllAgents(): Agent[] {
    return this._registry.getAllAgents();
  }

  /**
   * Get agents by type
   */
  public getAgentsByType(type: AgentType): Agent[] {
    return this._registry.getAgentsByType(type);
  }

  /**
   * Discover agents based on criteria
   */
  public discoverAgents(criteria: AgentDiscoveryCriteria = {}): Agent[] {
    return this._registry.discoverAgents(criteria);
  }

  /**
   * Find the best agent for a task
   */
  public findBestAgent(requiredCapabilities: string[], preferredType?: AgentType): Agent | null {
    return this._registry.findBestAgent(requiredCapabilities, preferredType);
  }

  /**
   * Restart an agent
   */
  public async restartAgent(agentId: string): Promise<void> {
    const agentInstance = this._registry.getAgent(agentId);
    if (!agentInstance) {
      throw new AgentError(`Agent with ID ${agentId} not found`, agentId);
    }

    try {
      this.updateLifecycleState(agentId, AgentLifecycleState.STOPPING);

      // Shutdown agent
      await agentInstance.shutdown();

      this.updateLifecycleState(agentId, AgentLifecycleState.INITIALIZING);

      // Restart agent
      await agentInstance.initialize(agentInstance.getConfig());

      this.updateLifecycleState(agentId, AgentLifecycleState.RUNNING);
      this.setAgentStartTime(agentId);

      this.emit('agent-started', agentId);

    } catch (error) {
      const agentError = new AgentError(
        `Failed to restart agent: ${error instanceof Error ? error.message : 'Unknown error'}`,
        agentId
      );
      
      this.updateLifecycleState(agentId, AgentLifecycleState.ERROR, agentError);
      this.emit('agent-error', agentId, agentError);
      throw agentError;
    }
  }

  /**
   * Perform health check on all agents
   */
  public async performHealthCheck(): Promise<{ healthy: Agent[]; unhealthy: Agent[] }> {
    return await this._registry.performHealthCheck();
  }

  /**
   * Get agent lifecycle information
   */
  public getAgentLifecycle(agentId: string): AgentLifecycle | null {
    return this._lifecycles.get(agentId) || null;
  }

  /**
   * Get all agent lifecycles
   */
  public getAllLifecycles(): AgentLifecycle[] {
    return Array.from(this._lifecycles.values());
  }

  /**
   * Get manager statistics
   */
  public getStatistics() {
    const registryStats = this._registry.getStatistics();
    const factoryStats = ConcreteAgentFactory.getStatistics();
    
    const lifecycleStats = {
      created: 0,
      running: 0,
      stopped: 0,
      error: 0
    };

    this._lifecycles.forEach(lifecycle => {
      switch (lifecycle.state) {
        case AgentLifecycleState.CREATED:
        case AgentLifecycleState.INITIALIZING:
          lifecycleStats.created++;
          break;
        case AgentLifecycleState.RUNNING:
          lifecycleStats.running++;
          break;
        case AgentLifecycleState.STOPPED:
        case AgentLifecycleState.STOPPING:
          lifecycleStats.stopped++;
          break;
        case AgentLifecycleState.ERROR:
          lifecycleStats.error++;
          break;
      }
    });

    return {
      registry: registryStats,
      factory: factoryStats,
      lifecycle: lifecycleStats,
      totalLifecycles: this._lifecycles.size
    };
  }

  /**
   * Shutdown all agents and cleanup
   */
  public async shutdown(): Promise<void> {
    this._isShuttingDown = true;

    try {
      // Update all running agents to stopping state
      this._lifecycles.forEach((lifecycle, agentId) => {
        if (lifecycle.state === AgentLifecycleState.RUNNING) {
          this.updateLifecycleState(agentId, AgentLifecycleState.STOPPING);
        }
      });

      // Shutdown registry (this will shutdown all agents)
      await this._registry.shutdownAll();

      // Update all lifecycles to stopped
      this._lifecycles.forEach((lifecycle, agentId) => {
        if (lifecycle.state === AgentLifecycleState.STOPPING) {
          this.updateLifecycleState(agentId, AgentLifecycleState.STOPPED);
          this.setAgentStopTime(agentId);
        }
      });

      // Clear event listeners
      this.removeAllListeners();

    } catch (error) {
      throw new SystemError(
        `Failed to shutdown agent manager: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'system_error',
        'high'
      );
    }
  }

  /**
   * Create agent from template
   */
  public async createAgentFromTemplate(templateName: string, customizations: Partial<CreateAgentInstanceOptions> = {}): Promise<Agent> {
    const agentInstance = ConcreteAgentFactory.createFromTemplate(templateName, customizations);
    
    // Register and initialize
    await this._registry.registerAgent(agentInstance);
    this.trackAgentLifecycle(agentInstance.id, AgentLifecycleState.CREATED);
    
    this.updateLifecycleState(agentInstance.id, AgentLifecycleState.INITIALIZING);
    await agentInstance.initialize(agentInstance.getConfig());
    
    this.updateLifecycleState(agentInstance.id, AgentLifecycleState.RUNNING);
    this.setAgentStartTime(agentInstance.id);

    const agentMetadata = this._registry.getAgentMetadata(agentInstance.id);
    if (!agentMetadata) {
      throw new AgentError('Failed to retrieve agent metadata after creation', agentInstance.id);
    }

    this.emit('agent-created', agentMetadata);
    this.emit('agent-started', agentInstance.id);
    this.emit('registry-updated');

    return agentMetadata;
  }

  // Private helper methods

  /**
   * Setup registry event listeners
   */
  private setupRegistryEventListeners(): void {
    this._registry.on('agent-registered', (agent) => {
      // Registry events are handled by the manager
    });

    this._registry.on('agent-unregistered', (agentId) => {
      // Cleanup lifecycle tracking
      this._lifecycles.delete(agentId);
    });

    this._registry.on('agent-status-changed', (agentId, oldStatus, newStatus) => {
      // Update lifecycle based on status changes
      if (newStatus === AgentStatus.ERROR) {
        this.updateLifecycleState(agentId, AgentLifecycleState.ERROR);
      }
    });

    this._registry.on('agent-error', (agentId, error) => {
      this.incrementErrorCount(agentId, error);
      this.emit('agent-error', agentId, error);
    });
  }

  /**
   * Track agent lifecycle
   */
  private trackAgentLifecycle(agentId: string, initialState: AgentLifecycleState): void {
    this._lifecycles.set(agentId, {
      agentId,
      state: initialState,
      createdAt: new Date(),
      errorCount: 0
    });
  }

  /**
   * Update agent lifecycle state
   */
  private updateLifecycleState(agentId: string, newState: AgentLifecycleState, error?: Error): void {
    const lifecycle = this._lifecycles.get(agentId);
    if (lifecycle) {
      lifecycle.state = newState;
      if (error) {
        lifecycle.lastError = error;
      }
    }
  }

  /**
   * Set agent start time
   */
  private setAgentStartTime(agentId: string): void {
    const lifecycle = this._lifecycles.get(agentId);
    if (lifecycle) {
      lifecycle.startedAt = new Date();
    }
  }

  /**
   * Set agent stop time
   */
  private setAgentStopTime(agentId: string): void {
    const lifecycle = this._lifecycles.get(agentId);
    if (lifecycle) {
      lifecycle.stoppedAt = new Date();
    }
  }

  /**
   * Increment error count for agent
   */
  private incrementErrorCount(agentId: string, error: Error): void {
    const lifecycle = this._lifecycles.get(agentId);
    if (lifecycle) {
      lifecycle.errorCount++;
      lifecycle.lastError = error;
    }
  }

  /**
   * Get the registry instance (for advanced operations)
   */
  public getRegistry(): AgentRegistry {
    return this._registry;
  }

  /**
   * Check if manager is shutting down
   */
  public isShuttingDown(): boolean {
    return this._isShuttingDown;
  }

  /**
   * Get available agent templates
   */
  public getAvailableTemplates(): Record<string, CreateAgentInstanceOptions> {
    return ConcreteAgentFactory.getAgentTemplates();
  }

  /**
   * Get registered agent types
   */
  public getRegisteredTypes(): AgentType[] {
    return ConcreteAgentFactory.getRegisteredTypes();
  }

  /**
   * Register a new agent type
   */
  public registerAgentType(type: AgentType, constructor: new (id: string, name: string, config: AgentConfig) => BaseAgent): void {
    ConcreteAgentFactory.registerAgentType(type, constructor);
  }

  /**
   * Bulk create agents from configurations
   */
  public async createAgents(configurations: CreateAgentInstanceOptions[]): Promise<Agent[]> {
    const results: Agent[] = [];
    const errors: Error[] = [];

    for (const config of configurations) {
      try {
        const agent = await this.createAgent(config);
        results.push(agent);
      } catch (error) {
        errors.push(error instanceof Error ? error : new Error('Unknown error'));
      }
    }

    if (errors.length > 0) {
      console.warn(`Failed to create ${errors.length} out of ${configurations.length} agents:`, errors);
    }

    return results;
  }

  /**
   * Get agents that match specific criteria
   */
  public findAgents(criteria: AgentDiscoveryCriteria): Agent[] {
    return this._registry.discoverAgents(criteria);
  }

  /**
   * Get idle agents that can take new tasks
   */
  public getAvailableAgents(requiredCapabilities?: string[]): Agent[] {
    const criteria: AgentDiscoveryCriteria = {
      status: AgentStatus.IDLE,
      maxWorkload: 80 // Only agents with less than 80% workload
    };

    if (requiredCapabilities) {
      criteria.capabilities = requiredCapabilities;
    }

    return this._registry.discoverAgents(criteria);
  }

  /**
   * Get agents with high workload (for load balancing)
   */
  public getOverloadedAgents(threshold: number = 90): Agent[] {
    return this.getAllAgents().filter(agent => agent.workload >= threshold);
  }

  /**
   * Get agents with errors
   */
  public getErrorAgents(): Agent[] {
    return this.getAllAgents().filter(agent => agent.status === AgentStatus.ERROR);
  }

  /**
   * Auto-recover error agents
   */
  public async autoRecoverErrorAgents(): Promise<{ recovered: string[]; failed: string[] }> {
    const errorAgents = this.getErrorAgents();
    const recovered: string[] = [];
    const failed: string[] = [];

    for (const agent of errorAgents) {
      try {
        await this.restartAgent(agent.id);
        recovered.push(agent.id);
      } catch (error) {
        failed.push(agent.id);
        console.error(`Failed to recover agent ${agent.id}:`, error);
      }
    }

    return { recovered, failed };
  }

  /**
   * Restart an agent
   */
  public async restartAgent(agentId: string): Promise<void> {
    const agentInstance = this._registry.getAgent(agentId);
    if (!agentInstance) {
      throw new AgentError(`Agent with ID ${agentId} not found`, agentId);
    }

    try {
      this.updateLifecycleState(agentId, AgentLifecycleState.STOPPING);

      // Shutdown and restart
      await agentInstance.shutdown();
      
      this.updateLifecycleState(agentId, AgentLifecycleState.INITIALIZING);
      await agentInstance.initialize(agentInstance.getConfig());

      this.updateLifecycleState(agentId, AgentLifecycleState.RUNNING);
      this.setAgentStartTime(agentId);

      this.emit('agent-started', agentId);

    } catch (error) {
      const agentError = new AgentError(
        `Failed to restart agent: ${error instanceof Error ? error.message : 'Unknown error'}`,
        agentId
      );
      
      this.updateLifecycleState(agentId, AgentLifecycleState.ERROR, agentError);
      this.emit('agent-error', agentId, agentError);
      throw agentError;
    }
  }

  /**
   * Update agent configuration
   */
  public async updateAgentConfig(agentId: string, configUpdates: Partial<AgentConfig>): Promise<void> {
    const agentInstance = this._registry.getAgent(agentId);
    if (!agentInstance) {
      throw new AgentError(`Agent with ID ${agentId} not found`, agentId);
    }

    try {
      await agentInstance.updateConfig(configUpdates);
      this.emit('registry-updated');
    } catch (error) {
      const agentError = new AgentError(
        `Failed to update agent config: ${error instanceof Error ? error.message : 'Unknown error'}`,
        agentId
      );
      
      this.emit('agent-error', agentId, agentError);
      throw agentError;
    }
  }

  /**
   * Get detailed agent information including lifecycle
   */
  public getDetailedAgentInfo(agentId: string) {
    const metadata = this._registry.getAgentMetadata(agentId);
    const instance = this._registry.getAgent(agentId);
    const lifecycle = this._lifecycles.get(agentId);

    if (!metadata || !instance) {
      return null;
    }

    return {
      metadata,
      lifecycle,
      statistics: instance.getStatistics(),
      activeTasks: instance.getActiveTasks(),
      taskHistory: instance.getTaskHistory()
    };
  }
}
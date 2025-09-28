/**
 * Coordination Manager implementation
 * Manages agent lifecycle, registration, discovery, and collaboration sessions
 */

import { EventEmitter } from 'events';
import { ICoordinationManager } from '../core/interfaces/ICoordinationManager';
import { IAgent } from '../core/interfaces/IAgent';
import { 
  Agent, 
  AgentConfig, 
  AgentType, 
  AgentStatus 
} from '../types/agent.types';
import { 
  CollaborationSession, 
  EventType, 
  MessageType 
} from '../types/message.types';
import { WorkflowConfig } from '../types/config.types';
import { ConcreteAgentFactory, CreateAgentInstanceOptions } from '../agents/ConcreteAgentFactory';
import { WorkflowOrchestrator, WorkflowState } from './WorkflowOrchestrator';
import { CollaborationRulesEngine } from './CollaborationRulesEngine';
import { AgentHealthMonitor } from './AgentHealthMonitor';

export interface CoordinationManagerConfig {
  maxAgents: number;
  healthCheckInterval: number;
  sessionTimeout: number;
  maxConcurrentSessions: number;
}

export interface AgentHealthStatus {
  agentId: string;
  isHealthy: boolean;
  lastCheck: Date;
  errorCount: number;
  lastError?: Error;
}

export interface WorkflowExecution {
  id: string;
  workflowId: string;
  status: 'pending' | 'running' | 'paused' | 'completed' | 'failed';
  currentStep: number;
  context: Record<string, any>;
  startTime: Date;
  endTime?: Date;
  error?: Error;
}

export class CoordinationManager extends EventEmitter implements ICoordinationManager {
  private agents: Map<string, IAgent> = new Map();
  private agentRegistry: Map<string, Agent> = new Map();
  private collaborationSessions: Map<string, CollaborationSession> = new Map();
  private workflowExecutions: Map<string, WorkflowExecution> = new Map();
  private agentHealthStatus: Map<string, AgentHealthStatus> = new Map();
  private resourceAllocations: Map<string, string[]> = new Map();
  private collaborationRules: Record<string, any> = {};
  private healthCheckTimer?: NodeJS.Timeout;
  
  // New orchestration components
  private workflowOrchestrator: WorkflowOrchestrator;
  private rulesEngine: CollaborationRulesEngine;
  private healthMonitor: AgentHealthMonitor;
  
  constructor(
    private config: CoordinationManagerConfig
  ) {
    super();
    
    // Initialize orchestration components
    this.workflowOrchestrator = new WorkflowOrchestrator(this.getAgentProvider());
    this.rulesEngine = new CollaborationRulesEngine();
    this.healthMonitor = new AgentHealthMonitor({
      interval: this.config.healthCheckInterval,
      timeout: 10000,
      retryAttempts: 3,
      retryDelay: 2000,
      failureThreshold: 3,
      recoveryThreshold: 2
    });
    
    this.setupEventHandlers();
    this.startHealthMonitoring();
  }

  async initialize(): Promise<void> {
    // Initialize orchestration components
    await this.workflowOrchestrator.initialize();
    await this.rulesEngine.initialize();
    await this.healthMonitor.initialize();
    
    this.emit('initialized');
  }

  // Agent lifecycle management
  async createAgent(config: AgentConfig): Promise<Agent> {
    if (this.agents.size >= this.config.maxAgents) {
      throw new Error(`Maximum number of agents (${this.config.maxAgents}) reached`);
    }

    const agentInstance = ConcreteAgentFactory.createAgentInstance({
      name: config.name,
      type: config.type,
      capabilities: config.capabilities,
      maxConcurrentTasks: config.maxConcurrentTasks,
      timeout: config.timeout,
      retryAttempts: config.retryAttempts,
      customSettings: config.customSettings
    });
    const agentData: Agent = {
      id: agentInstance.id,
      name: agentInstance.name,
      type: config.type,
      status: AgentStatus.IDLE,
      config,
      capabilities: config.capabilities,
      workload: 0,
      createdAt: new Date(),
      lastActive: new Date()
    };

    this.agents.set(agentInstance.id, agentInstance);
    this.agentRegistry.set(agentInstance.id, agentData);
    this.agentHealthStatus.set(agentInstance.id, {
      agentId: agentInstance.id,
      isHealthy: true,
      lastCheck: new Date(),
      errorCount: 0
    });

    // Register with health monitor
    this.healthMonitor.registerAgent(agentInstance);

    await this.registerAgent(agentData);
    
    this.emit(EventType.AGENT_CREATED, agentData);
    return agentData;
  }

  async destroyAgent(agentId: string): Promise<void> {
    const agent = this.agents.get(agentId);
    if (!agent) {
      throw new Error(`Agent ${agentId} not found`);
    }

    // End any active collaborations
    const activeSessions = Array.from(this.collaborationSessions.values())
      .filter(session => session.participants.includes(agentId) && session.status === 'active');
    
    for (const session of activeSessions) {
      await this.leaveCollaboration(session.id, agentId);
    }

    // Deallocate resources
    const resources = this.resourceAllocations.get(agentId);
    if (resources) {
      await this.deallocateResources(agentId, resources);
    }

    // Unregister from health monitor
    this.healthMonitor.unregisterAgent(agentId);
    
    // Shutdown agent
    await agent.shutdown();
    
    // Clean up
    this.agents.delete(agentId);
    this.agentRegistry.delete(agentId);
    this.agentHealthStatus.delete(agentId);
    
    await this.unregisterAgent(agentId);
    
    this.emit(EventType.AGENT_DESTROYED, { agentId });
  }

  async getAgent(agentId: string): Promise<Agent | null> {
    return this.agentRegistry.get(agentId) || null;
  }

  async getAllAgents(): Promise<Agent[]> {
    return Array.from(this.agentRegistry.values());
  }

  async getAgentsByType(type: AgentType): Promise<Agent[]> {
    return Array.from(this.agentRegistry.values())
      .filter(agent => agent.type === type);
  }

  // Agent registration and discovery
  async registerAgent(agent: Agent): Promise<void> {
    this.agentRegistry.set(agent.id, agent);
    
    // Update agent status
    this.updateAgentStatus(agent.id, AgentStatus.IDLE);
  }

  async unregisterAgent(agentId: string): Promise<void> {
    this.agentRegistry.delete(agentId);
  }

  async discoverAgents(capabilities?: string[]): Promise<Agent[]> {
    const agents = Array.from(this.agentRegistry.values());
    
    if (!capabilities || capabilities.length === 0) {
      return agents;
    }

    return agents.filter(agent => 
      capabilities.some(capability => 
        agent.capabilities.includes(capability)
      )
    );
  }

  // Health monitoring and recovery (legacy methods for compatibility)
  async checkAgentHealthLegacy(agentId: string): Promise<boolean> {
    const agent = this.agents.get(agentId);
    const healthStatus = this.agentHealthStatus.get(agentId);
    
    if (!agent || !healthStatus) {
      return false;
    }

    try {
      // Check if agent is responsive
      const status = agent.getStatus();
      const isHealthy = status !== AgentStatus.ERROR && status !== AgentStatus.OFFLINE;
      
      // Update health status
      healthStatus.isHealthy = isHealthy;
      healthStatus.lastCheck = new Date();
      
      if (!isHealthy) {
        healthStatus.errorCount++;
      } else {
        healthStatus.errorCount = 0;
      }
      
      return isHealthy;
    } catch (error) {
      healthStatus.isHealthy = false;
      healthStatus.lastCheck = new Date();
      healthStatus.errorCount++;
      healthStatus.lastError = error as Error;
      
      return false;
    }
  }

  async restartAgentLegacy(agentId: string): Promise<void> {
    const agentData = this.agentRegistry.get(agentId);
    if (!agentData) {
      throw new Error(`Agent ${agentId} not found`);
    }

    // Destroy existing agent
    await this.destroyAgent(agentId);
    
    // Create new agent with same configuration
    await this.createAgent(agentData.config);
  }

  async performHealthCheckLegacy(): Promise<{ healthy: Agent[]; unhealthy: Agent[] }> {
    const healthy: Agent[] = [];
    const unhealthy: Agent[] = [];
    
    for (const agent of this.agentRegistry.values()) {
      const isHealthy = await this.checkAgentHealthLegacy(agent.id);
      if (isHealthy) {
        healthy.push(agent);
      } else {
        unhealthy.push(agent);
      }
    }
    
    return { healthy, unhealthy };
  }

  // Collaboration session management
  async startCollaboration(participants: string[], sharedFiles: string[]): Promise<CollaborationSession> {
    if (this.collaborationSessions.size >= this.config.maxConcurrentSessions) {
      throw new Error(`Maximum number of collaboration sessions (${this.config.maxConcurrentSessions}) reached`);
    }

    // Validate participants exist
    for (const participantId of participants) {
      if (!this.agentRegistry.has(participantId)) {
        throw new Error(`Agent ${participantId} not found`);
      }
    }

    const sessionId = this.generateSessionId();
    const session: CollaborationSession = {
      id: sessionId,
      participants: [...participants],
      sharedFiles: [...sharedFiles],
      communicationChannel: `collaboration-${sessionId}`,
      startTime: new Date(),
      status: 'active'
    };

    this.collaborationSessions.set(sessionId, session);
    
    this.emit(EventType.COLLABORATION_STARTED, session);
    return session;
  }

  async endCollaboration(sessionId: string): Promise<void> {
    const session = this.collaborationSessions.get(sessionId);
    if (!session) {
      throw new Error(`Collaboration session ${sessionId} not found`);
    }

    session.status = 'completed';
    session.endTime = new Date();
    
    this.emit(EventType.COLLABORATION_ENDED, session);
  }

  async getActiveCollaborations(): Promise<CollaborationSession[]> {
    return Array.from(this.collaborationSessions.values())
      .filter(session => session.status === 'active');
  }

  async joinCollaboration(sessionId: string, agentId: string): Promise<void> {
    const session = this.collaborationSessions.get(sessionId);
    if (!session) {
      throw new Error(`Collaboration session ${sessionId} not found`);
    }

    if (!this.agentRegistry.has(agentId)) {
      throw new Error(`Agent ${agentId} not found`);
    }

    if (!session.participants.includes(agentId)) {
      session.participants.push(agentId);
    }
  }

  async leaveCollaboration(sessionId: string, agentId: string): Promise<void> {
    const session = this.collaborationSessions.get(sessionId);
    if (!session) {
      throw new Error(`Collaboration session ${sessionId} not found`);
    }

    const index = session.participants.indexOf(agentId);
    if (index > -1) {
      session.participants.splice(index, 1);
    }

    // End session if no participants left
    if (session.participants.length === 0) {
      await this.endCollaboration(sessionId);
    }
  }

  // Workflow orchestration
  async executeWorkflow(workflowConfig: WorkflowConfig, context: Record<string, any>): Promise<void> {
    // Register workflow with orchestrator if not already registered
    const existingWorkflow = this.workflowOrchestrator.getWorkflow(workflowConfig.id);
    if (!existingWorkflow) {
      this.workflowOrchestrator.registerWorkflow(workflowConfig);
    }

    // Execute workflow using orchestrator
    const execution = await this.workflowOrchestrator.executeWorkflow(workflowConfig.id, context);
    
    // Store execution reference for compatibility
    this.workflowExecutions.set(execution.id, {
      id: execution.id,
      workflowId: execution.workflowId,
      status: this.mapWorkflowState(execution.state),
      currentStep: execution.currentStepIndex,
      context: execution.context,
      startTime: execution.startTime,
      endTime: execution.endTime,
      error: execution.error
    });
  }

  async pauseWorkflow(workflowId: string): Promise<void> {
    const activeExecutions = this.workflowOrchestrator.getActiveExecutions();
    const execution = activeExecutions.find(exec => exec.workflowId === workflowId);
    
    if (execution) {
      await this.workflowOrchestrator.pauseExecution(execution.id);
    }
  }

  async resumeWorkflow(workflowId: string): Promise<void> {
    const activeExecutions = this.workflowOrchestrator.getActiveExecutions();
    const execution = activeExecutions.find(exec => exec.workflowId === workflowId);
    
    if (execution) {
      await this.workflowOrchestrator.resumeExecution(execution.id);
    }
  }

  async getWorkflowStatus(workflowId: string): Promise<string> {
    const activeExecutions = this.workflowOrchestrator.getActiveExecutions();
    const execution = activeExecutions.find(exec => exec.workflowId === workflowId);
    
    return execution ? this.mapWorkflowState(execution.state) : 'not_found';
  }

  // Resource management
  async allocateResources(agentId: string, resources: string[]): Promise<void> {
    if (!this.agentRegistry.has(agentId)) {
      throw new Error(`Agent ${agentId} not found`);
    }

    const currentResources = this.resourceAllocations.get(agentId) || [];
    const newResources = [...currentResources, ...resources];
    this.resourceAllocations.set(agentId, newResources);
  }

  async deallocateResources(agentId: string, resources: string[]): Promise<void> {
    const currentResources = this.resourceAllocations.get(agentId) || [];
    const remainingResources = currentResources.filter(resource => 
      !resources.includes(resource)
    );
    
    if (remainingResources.length === 0) {
      this.resourceAllocations.delete(agentId);
    } else {
      this.resourceAllocations.set(agentId, remainingResources);
    }
  }

  async getResourceUsage(): Promise<Record<string, string[]>> {
    const usage: Record<string, string[]> = {};
    for (const [agentId, resources] of this.resourceAllocations.entries()) {
      usage[agentId] = [...resources];
    }
    return usage;
  }

  // System coordination
  async coordinateAgentActions(agentIds: string[], action: string, parameters?: any): Promise<void> {
    const agents = agentIds.map(id => this.agents.get(id)).filter(Boolean) as IAgent[];
    
    if (agents.length !== agentIds.length) {
      throw new Error('Some agents not found');
    }

    // Execute action on all agents concurrently
    await Promise.all(agents.map(agent => 
      this.executeAgentAction(agent, action, parameters)
    ));
  }

  async synchronizeAgentStates(): Promise<void> {
    const agents = Array.from(this.agents.values());
    
    // Update agent registry with current states
    for (const agent of agents) {
      const agentData = this.agentRegistry.get(agent.id);
      if (agentData) {
        agentData.status = agent.getStatus();
        agentData.workload = agent.getWorkload();
        agentData.lastActive = new Date();
      }
    }
  }

  // Configuration and rules
  async updateCollaborationRules(rules: Record<string, any>): Promise<void> {
    this.collaborationRules = { ...this.collaborationRules, ...rules };
    
    // Update rules engine if needed
    // This is a simplified approach - in practice, you'd convert the rules format
    // to the rules engine format and update accordingly
  }

  async getCollaborationRules(): Promise<Record<string, any>> {
    return { ...this.collaborationRules };
  }

  async validateAgentAction(agentId: string, action: string, context: any): Promise<boolean> {
    const agent = this.agentRegistry.get(agentId);
    if (!agent) {
      return false;
    }

    // Use rules engine for validation
    const validation = await this.rulesEngine.validateAgentAction(agent, action, context);
    return validation.allowed;
  }

  // Private helper methods
  private startHealthMonitoring(): void {
    this.healthCheckTimer = setInterval(async () => {
      await this.performHealthCheck();
    }, this.config.healthCheckInterval);
  }

  private stopHealthMonitoring(): void {
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
      this.healthCheckTimer = undefined;
    }
  }

  private updateAgentStatus(agentId: string, status: AgentStatus): void {
    const agentData = this.agentRegistry.get(agentId);
    if (agentData) {
      const oldStatus = agentData.status;
      agentData.status = status;
      agentData.lastActive = new Date();
      
      this.emit(EventType.AGENT_STATUS_CHANGED, {
        agentId,
        oldStatus,
        newStatus: status
      });
    }
  }

  private generateSessionId(): string {
    return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateExecutionId(): string {
    return `exec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private async executeWorkflowSteps(workflowConfig: WorkflowConfig, execution: WorkflowExecution): Promise<void> {
    for (let i = execution.currentStep; i < workflowConfig.steps.length; i++) {
      if (execution.status === 'paused') {
        break;
      }

      const step = workflowConfig.steps[i];
      execution.currentStep = i;

      // Find appropriate agent for step
      const agents = step.agentType 
        ? await this.getAgentsByType(step.agentType as AgentType)
        : await this.getAllAgents();

      if (agents.length === 0) {
        throw new Error(`No agents available for step ${step.name}`);
      }

      // Execute step with first available agent
      const agent = this.agents.get(agents[0].id);
      if (agent) {
        await this.executeAgentAction(agent, step.action, step.parameters);
      }
    }
  }

  private async executeAgentAction(agent: IAgent, action: string, parameters?: any): Promise<void> {
    // This is a simplified implementation
    // In a real system, this would dispatch to appropriate agent methods
    // based on the action type
    console.log(`Executing action ${action} on agent ${agent.id} with parameters:`, parameters);
  }

  // Private helper methods
  private getAgentProvider() {
    return async (type?: AgentType): Promise<IAgent[]> => {
      if (type) {
        const agentsOfType = Array.from(this.agentRegistry.values())
          .filter(agent => agent.type === type)
          .map(agent => this.agents.get(agent.id))
          .filter(Boolean) as IAgent[];
        return agentsOfType;
      }
      return Array.from(this.agents.values());
    };
  }

  private mapWorkflowState(state: WorkflowState): 'pending' | 'running' | 'paused' | 'completed' | 'failed' {
    switch (state) {
      case WorkflowState.PENDING: return 'pending';
      case WorkflowState.RUNNING: return 'running';
      case WorkflowState.PAUSED: return 'paused';
      case WorkflowState.COMPLETED: return 'completed';
      case WorkflowState.FAILED: return 'failed';
      case WorkflowState.CANCELLED: return 'failed'; // Map cancelled to failed for compatibility
      default: return 'failed';
    }
  }

  private setupEventHandlers(): void {
    // Health monitor events
    this.healthMonitor.on('agentUnhealthy', async (event) => {
      const { agentId } = event;
      this.updateAgentStatus(agentId, AgentStatus.ERROR);
      
      // Attempt automatic recovery
      try {
        await this.healthMonitor.attemptRecovery(agentId);
      } catch (error) {
        console.error(`Failed to recover agent ${agentId}:`, error);
      }
    });

    this.healthMonitor.on('agentRecovered', (event) => {
      const { agentId } = event;
      this.updateAgentStatus(agentId, AgentStatus.IDLE);
    });

    this.healthMonitor.on('alertCreated', (alert) => {
      this.emit('healthAlert', alert);
    });

    // Rules engine events
    this.rulesEngine.on('ruleEvaluated', (result) => {
      if (result.matched) {
        this.emit('ruleTriggered', result);
      }
    });

    this.rulesEngine.on('actionExecuted', (actionEvent) => {
      this.emit('ruleActionExecuted', actionEvent);
    });

    // Workflow orchestrator events
    this.workflowOrchestrator.on('stateChanged', (event) => {
      this.emit('workflowStateChanged', event);
    });

    this.workflowOrchestrator.on('log', (logEvent) => {
      this.emit('workflowLog', logEvent);
    });
  }

  // Public API for accessing orchestration components
  getWorkflowOrchestrator(): WorkflowOrchestrator {
    return this.workflowOrchestrator;
  }

  getRulesEngine(): CollaborationRulesEngine {
    return this.rulesEngine;
  }

  getHealthMonitor(): AgentHealthMonitor {
    return this.healthMonitor;
  }

  // Enhanced health checking using the health monitor
  async checkAgentHealth(agentId: string): Promise<boolean> {
    const healthMetrics = this.healthMonitor.getAgentHealth(agentId);
    return healthMetrics?.isHealthy ?? false;
  }

  async performHealthCheck(): Promise<{ healthy: Agent[]; unhealthy: Agent[] }> {
    const healthyMetrics = this.healthMonitor.getHealthyAgents();
    const unhealthyMetrics = this.healthMonitor.getUnhealthyAgents();
    
    const healthy = healthyMetrics
      .map(metrics => this.agentRegistry.get(metrics.agentId))
      .filter(Boolean) as Agent[];
    
    const unhealthy = unhealthyMetrics
      .map(metrics => this.agentRegistry.get(metrics.agentId))
      .filter(Boolean) as Agent[];
    
    return { healthy, unhealthy };
  }

  async restartAgent(agentId: string): Promise<void> {
    // Use health monitor's recovery mechanism
    await this.healthMonitor.attemptRecovery(agentId);
  }

  // Cleanup
  async shutdown(): Promise<void> {
    this.stopHealthMonitoring();
    
    // Shutdown orchestration components
    await this.workflowOrchestrator.shutdown();
    await this.healthMonitor.shutdown();
    
    // Shutdown all agents
    const shutdownPromises = Array.from(this.agents.values()).map(agent => 
      agent.shutdown().catch(error => 
        console.error(`Error shutting down agent ${agent.id}:`, error)
      )
    );
    
    await Promise.all(shutdownPromises);
    
    // Clear all data
    this.agents.clear();
    this.agentRegistry.clear();
    this.collaborationSessions.clear();
    this.workflowExecutions.clear();
    this.agentHealthStatus.clear();
    this.resourceAllocations.clear();
  }
}
/**
 * Coordination Manager implementation
 * Manages agent lifecycle, registration, discovery, and collaboration sessions
 */
import { EventEmitter } from 'events';
import { ICoordinationManager } from '../core/interfaces/ICoordinationManager';
import { Agent, AgentConfig, AgentType } from '../types/agent.types';
import { CollaborationSession } from '../types/message.types';
import { WorkflowConfig } from '../types/config.types';
import { WorkflowOrchestrator } from './WorkflowOrchestrator';
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
export declare class CoordinationManager extends EventEmitter implements ICoordinationManager {
    private config;
    private agents;
    private agentRegistry;
    private collaborationSessions;
    private workflowExecutions;
    private agentHealthStatus;
    private resourceAllocations;
    private collaborationRules;
    private healthCheckTimer?;
    private workflowOrchestrator;
    private rulesEngine;
    private healthMonitor;
    constructor(config: CoordinationManagerConfig);
    createAgent(config: AgentConfig): Promise<Agent>;
    destroyAgent(agentId: string): Promise<void>;
    getAgent(agentId: string): Promise<Agent | null>;
    getAllAgents(): Promise<Agent[]>;
    getAgentsByType(type: AgentType): Promise<Agent[]>;
    registerAgent(agent: Agent): Promise<void>;
    unregisterAgent(agentId: string): Promise<void>;
    discoverAgents(capabilities?: string[]): Promise<Agent[]>;
    checkAgentHealthLegacy(agentId: string): Promise<boolean>;
    restartAgentLegacy(agentId: string): Promise<void>;
    performHealthCheckLegacy(): Promise<{
        healthy: Agent[];
        unhealthy: Agent[];
    }>;
    startCollaboration(participants: string[], sharedFiles: string[]): Promise<CollaborationSession>;
    endCollaboration(sessionId: string): Promise<void>;
    getActiveCollaborations(): Promise<CollaborationSession[]>;
    joinCollaboration(sessionId: string, agentId: string): Promise<void>;
    leaveCollaboration(sessionId: string, agentId: string): Promise<void>;
    executeWorkflow(workflowConfig: WorkflowConfig, context: Record<string, any>): Promise<void>;
    pauseWorkflow(workflowId: string): Promise<void>;
    resumeWorkflow(workflowId: string): Promise<void>;
    getWorkflowStatus(workflowId: string): Promise<string>;
    allocateResources(agentId: string, resources: string[]): Promise<void>;
    deallocateResources(agentId: string, resources: string[]): Promise<void>;
    getResourceUsage(): Promise<Record<string, string[]>>;
    coordinateAgentActions(agentIds: string[], action: string, parameters?: any): Promise<void>;
    synchronizeAgentStates(): Promise<void>;
    updateCollaborationRules(rules: Record<string, any>): Promise<void>;
    getCollaborationRules(): Promise<Record<string, any>>;
    validateAgentAction(agentId: string, action: string, context: any): Promise<boolean>;
    private startHealthMonitoring;
    private stopHealthMonitoring;
    private updateAgentStatus;
    private generateSessionId;
    private generateExecutionId;
    private executeWorkflowSteps;
    private executeAgentAction;
    private getAgentProvider;
    private mapWorkflowState;
    private setupEventHandlers;
    getWorkflowOrchestrator(): WorkflowOrchestrator;
    getRulesEngine(): CollaborationRulesEngine;
    getHealthMonitor(): AgentHealthMonitor;
    checkAgentHealth(agentId: string): Promise<boolean>;
    performHealthCheck(): Promise<{
        healthy: Agent[];
        unhealthy: Agent[];
    }>;
    restartAgent(agentId: string): Promise<void>;
    shutdown(): Promise<void>;
}

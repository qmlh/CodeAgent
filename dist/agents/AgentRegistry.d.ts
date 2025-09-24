/**
 * Agent Registry for managing agent instances and discovery
 */
import { EventEmitter } from 'eventemitter3';
import { Agent, AgentType, AgentStatus } from '../core';
import { BaseAgent } from './BaseAgent';
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
export declare class AgentRegistry extends EventEmitter<AgentRegistryEvents> {
    private _agents;
    private _agentMetadata;
    private _agentsByType;
    private _agentsByCapability;
    private _validator;
    constructor();
    /**
     * Register an agent instance
     */
    registerAgent(agentInstance: BaseAgent): Promise<void>;
    /**
     * Unregister an agent
     */
    unregisterAgent(agentId: string): Promise<void>;
    /**
     * Get agent instance by ID
     */
    getAgent(agentId: string): BaseAgent | null;
    /**
     * Get agent metadata by ID
     */
    getAgentMetadata(agentId: string): Agent | null;
    /**
     * Get all registered agents
     */
    getAllAgents(): Agent[];
    /**
     * Get agents by type
     */
    getAgentsByType(type: AgentType): Agent[];
    /**
     * Discover agents based on criteria
     */
    discoverAgents(criteria?: AgentDiscoveryCriteria): Agent[];
    /**
     * Find the best agent for a task
     */
    findBestAgent(requiredCapabilities: string[], preferredType?: AgentType): Agent | null;
    /**
     * Get agents by capability
     */
    getAgentsByCapability(capability: string): Agent[];
    /**
     * Check if agent is registered
     */
    isAgentRegistered(agentId: string): boolean;
    /**
     * Get registry statistics
     */
    getStatistics(): {
        totalAgents: number;
        healthyAgents: number;
        averageWorkload: number;
        byType: {
            [k: string]: number;
        };
        byStatus: {
            [k: string]: number;
        };
        capabilities: string[];
    };
    /**
     * Update agent metadata when agent state changes
     */
    updateAgentMetadata(agentId: string): void;
    /**
     * Shutdown all agents
     */
    shutdownAll(): Promise<void>;
    /**
     * Perform health check on all agents
     */
    performHealthCheck(): Promise<{
        healthy: Agent[];
        unhealthy: Agent[];
    }>;
    /**
     * Initialize type indexes
     */
    private initializeTypeIndexes;
    /**
     * Setup event listeners for an agent
     */
    private setupAgentEventListeners;
    /**
     * Add agent to type index
     */
    private addToTypeIndex;
    /**
     * Remove agent from type index
     */
    private removeFromTypeIndex;
    /**
     * Add agent to capability index
     */
    private addToCapabilityIndex;
    /**
     * Remove agent from capability index
     */
    private removeFromCapabilityIndex;
}

/**
 * Agent Manager for high-level agent lifecycle management
 */
import { EventEmitter } from 'eventemitter3';
import { Agent, AgentType, AgentStatus, AgentConfig } from '../core';
import { BaseAgent } from './BaseAgent';
import { AgentRegistry, AgentDiscoveryCriteria } from './AgentRegistry';
import { CreateAgentInstanceOptions } from './ConcreteAgentFactory';
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
export declare enum AgentLifecycleState {
    CREATED = "created",
    INITIALIZING = "initializing",
    RUNNING = "running",
    STOPPING = "stopping",
    STOPPED = "stopped",
    ERROR = "error"
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
export declare class AgentManager extends EventEmitter<AgentManagerEvents> {
    private _registry;
    private _lifecycles;
    private _isShuttingDown;
    constructor();
    /**
     * Create and start a new agent
     */
    createAgent(options: CreateAgentInstanceOptions): Promise<Agent>;
    /**
     * Destroy an agent
     */
    destroyAgent(agentId: string): Promise<void>;
    /**
     * Get agent by ID
     */
    getAgent(agentId: string): Agent | null;
    /**
     * Get all agents
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
     * Restart an agent
     */
    restartAgent(agentId: string): Promise<void>;
    /**
     * Perform health check on all agents
     */
    performHealthCheck(): Promise<{
        healthy: Agent[];
        unhealthy: Agent[];
    }>;
    /**
     * Get agent lifecycle information
     */
    getAgentLifecycle(agentId: string): AgentLifecycle | null;
    /**
     * Get all agent lifecycles
     */
    getAllLifecycles(): AgentLifecycle[];
    /**
     * Get manager statistics
     */
    getStatistics(): {
        registry: {
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
        factory: {
            registeredTypes: number;
            availableTypes: number;
            availableTemplates: number;
            registeredTypesList: AgentType[];
        };
        lifecycle: {
            created: number;
            running: number;
            stopped: number;
            error: number;
        };
        totalLifecycles: number;
    };
    /**
     * Shutdown all agents and cleanup
     */
    shutdown(): Promise<void>;
    /**
     * Create agent from template
     */
    createAgentFromTemplate(templateName: string, customizations?: Partial<CreateAgentInstanceOptions>): Promise<Agent>;
    /**
     * Setup registry event listeners
     */
    private setupRegistryEventListeners;
    /**
     * Track agent lifecycle
     */
    private trackAgentLifecycle;
    /**
     * Update agent lifecycle state
     */
    private updateLifecycleState;
    /**
     * Set agent start time
     */
    private setAgentStartTime;
    /**
     * Set agent stop time
     */
    private setAgentStopTime;
    /**
     * Increment error count for agent
     */
    private incrementErrorCount;
    /**
     * Get the registry instance (for advanced operations)
     */
    getRegistry(): AgentRegistry;
    /**
     * Check if manager is shutting down
     */
    isShuttingDown(): boolean;
    /**
     * Get available agent templates
     */
    getAvailableTemplates(): Record<string, CreateAgentInstanceOptions>;
    /**
     * Get registered agent types
     */
    getRegisteredTypes(): AgentType[];
    /**
     * Register a new agent type
     */
    registerAgentType(type: AgentType, constructor: new (id: string, name: string, type: AgentType, config: AgentConfig) => BaseAgent): void;
    /**
     * Bulk create agents from configurations
     */
    createAgents(configurations: CreateAgentInstanceOptions[]): Promise<Agent[]>;
    /**
     * Get agents that match specific criteria
     */
    findAgents(criteria: AgentDiscoveryCriteria): Agent[];
    /**
     * Get idle agents that can take new tasks
     */
    getAvailableAgents(requiredCapabilities?: string[]): Agent[];
    /**
     * Get agents with high workload (for load balancing)
     */
    getOverloadedAgents(threshold?: number): Agent[];
    /**
     * Get agents with errors
     */
    getErrorAgents(): Agent[];
    /**
     * Auto-recover error agents
     */
    autoRecoverErrorAgents(): Promise<{
        recovered: string[];
        failed: string[];
    }>;
    /**
     * Update agent configuration
     */
    updateAgentConfig(agentId: string, configUpdates: Partial<AgentConfig>): Promise<void>;
    /**
     * Get detailed agent information including lifecycle
     */
    getDetailedAgentInfo(agentId: string): {
        metadata: Agent;
        lifecycle: AgentLifecycle | undefined;
        statistics: {
            totalTasks: number;
            completedTasks: number;
            failedTasks: number;
            activeTasks: number;
            successRate: number;
            averageExecutionTime: number;
            currentWorkload: number;
            status: AgentStatus;
            uptime: number;
        };
        activeTasks: import("../core").Task[];
        taskHistory: import("../core").TaskResult[];
    } | null;
}
export {};

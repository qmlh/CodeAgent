/**
 * Agent factory for creating and initializing agents
 */
import { Agent, AgentConfig, AgentType } from '../../types/agent.types';
/**
 * Agent creation options
 */
export interface CreateAgentOptions {
    name: string;
    type: AgentType;
    capabilities?: string[];
    maxConcurrentTasks?: number;
    timeout?: number;
    retryAttempts?: number;
    customSettings?: Record<string, any>;
}
/**
 * Agent factory class
 */
export declare class AgentFactory {
    private static configValidator;
    private static agentValidator;
    /**
     * Create a new agent with default configuration
     */
    static createAgent(options: CreateAgentOptions): Agent;
    /**
     * Create agent configuration with defaults
     */
    static createAgentConfig(options: CreateAgentOptions): AgentConfig;
    /**
     * Create agent from existing data with validation
     */
    static fromData(data: Partial<Agent>): Agent;
    /**
     * Clone an existing agent with new ID
     */
    static cloneAgent(sourceAgent: Agent, newName?: string): Agent;
    /**
     * Update agent configuration
     */
    static updateAgentConfig(agent: Agent, configUpdates: Partial<AgentConfig>): Agent;
    /**
     * Create multiple agents of different types
     */
    static createAgentTeam(teamConfig: {
        [key in AgentType]?: CreateAgentOptions;
    }): Agent[];
    /**
     * Create a default agent for a specific type
     */
    static createDefaultAgent(type: AgentType, name?: string): Agent;
    /**
     * Validate agent data without creating
     */
    static validateAgentData(data: Partial<Agent>): {
        isValid: boolean;
        errors: string[];
    };
    /**
     * Get default capabilities for agent type
     */
    static getDefaultCapabilities(type: AgentType): string[];
    /**
     * Check if agent configuration is valid
     */
    static isValidConfig(config: AgentConfig): boolean;
}
//# sourceMappingURL=AgentFactory.d.ts.map
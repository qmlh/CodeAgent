/**
 * Concrete Agent Factory for creating specific agent implementations
 */
import { AgentType, AgentConfig } from '../core';
import { BaseAgent } from './BaseAgent';
/**
 * Agent creation options
 */
export interface CreateAgentInstanceOptions {
    id?: string;
    name: string;
    type: AgentType;
    capabilities?: string[];
    maxConcurrentTasks?: number;
    timeout?: number;
    retryAttempts?: number;
    customSettings?: Record<string, any>;
}
/**
 * Agent constructor type
 */
export type AgentConstructor = new (id: string, name: string, type: AgentType, config: AgentConfig) => BaseAgent;
/**
 * Concrete Agent Factory for creating agent instances
 */
export declare class ConcreteAgentFactory {
    private static _agentTypes;
    private static _configValidator;
    /**
     * Register an agent type with its constructor
     */
    static registerAgentType(type: AgentType, constructor: AgentConstructor): void;
    /**
     * Get registered agent types
     */
    static getRegisteredTypes(): AgentType[];
    /**
     * Check if agent type is registered
     */
    static isTypeRegistered(type: AgentType): boolean;
    /**
     * Create a new agent instance
     */
    static createAgentInstance(options: CreateAgentInstanceOptions): BaseAgent;
    /**
     * Create agent configuration with defaults
     */
    static createAgentConfig(options: CreateAgentInstanceOptions): AgentConfig;
    /**
     * Create multiple agents of different types
     */
    static createAgentTeam(teamConfig: {
        [key in AgentType]?: CreateAgentInstanceOptions;
    }): BaseAgent[];
    /**
     * Create a default agent for a specific type
     */
    static createDefaultAgent(type: AgentType, name?: string): BaseAgent;
    /**
     * Clone an existing agent with new configuration
     */
    static cloneAgent(sourceAgent: BaseAgent, overrides?: Partial<CreateAgentInstanceOptions>): BaseAgent;
    /**
     * Create agent from template
     */
    static createFromTemplate(templateName: string, customizations?: Partial<CreateAgentInstanceOptions>): BaseAgent;
    /**
     * Get predefined agent templates
     */
    static getAgentTemplates(): Record<string, CreateAgentInstanceOptions>;
    /**
     * Get agent template by name
     */
    static getAgentTemplate(templateName: string): CreateAgentInstanceOptions;
    /**
     * Validate agent creation options
     */
    static validateCreationOptions(options: CreateAgentInstanceOptions): {
        isValid: boolean;
        errors: string[];
    };
    /**
     * Get default capabilities for agent type
     */
    static getDefaultCapabilities(type: AgentType): string[];
    /**
     * Initialize factory with default agent types
     */
    static initializeDefaults(): void;
    /**
     * Reset factory (mainly for testing)
     */
    static reset(): void;
    /**
     * Get factory statistics
     */
    static getStatistics(): {
        registeredTypes: number;
        availableTypes: number;
        availableTemplates: number;
        registeredTypesList: AgentType[];
    };
}

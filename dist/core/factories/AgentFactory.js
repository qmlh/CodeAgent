"use strict";
/**
 * Agent factory for creating and initializing agents
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentFactory = void 0;
const uuid_1 = require("uuid");
const agent_types_1 = require("../../types/agent.types");
const constants_1 = require("../constants");
const validators_1 = require("../validation/validators");
const SystemError_1 = require("../errors/SystemError");
/**
 * Agent factory class
 */
class AgentFactory {
    /**
     * Create a new agent with default configuration
     */
    static createAgent(options) {
        const config = this.createAgentConfig(options);
        const agent = {
            id: (0, uuid_1.v4)(),
            name: options.name,
            type: options.type,
            status: agent_types_1.AgentStatus.OFFLINE,
            config,
            capabilities: config.capabilities,
            workload: 0,
            createdAt: new Date(),
            lastActive: new Date()
        };
        // Validate the created agent
        validators_1.ValidationUtils.validateOrThrow(this.agentValidator, agent, 'AgentFactory.createAgent');
        return agent;
    }
    /**
     * Create agent configuration with defaults
     */
    static createAgentConfig(options) {
        const defaultCapabilities = constants_1.DEFAULT_AGENT_CAPABILITIES[options.type] || [];
        const config = {
            name: options.name,
            type: options.type,
            capabilities: options.capabilities || [...defaultCapabilities],
            maxConcurrentTasks: options.maxConcurrentTasks || 3,
            timeout: options.timeout || 300000, // 5 minutes
            retryAttempts: options.retryAttempts || 3,
            customSettings: options.customSettings || {}
        };
        // Validate the configuration
        validators_1.ValidationUtils.validateOrThrow(this.configValidator, config, 'AgentFactory.createAgentConfig');
        return config;
    }
    /**
     * Create agent from existing data with validation
     */
    static fromData(data) {
        if (!data.id) {
            throw new SystemError_1.ValidationError('Agent ID is required when creating from data');
        }
        const agent = {
            id: data.id,
            name: data.name || 'Unnamed Agent',
            type: data.type || agent_types_1.AgentType.FRONTEND,
            status: data.status || agent_types_1.AgentStatus.OFFLINE,
            config: data.config || this.createAgentConfig({
                name: data.name || 'Unnamed Agent',
                type: data.type || agent_types_1.AgentType.FRONTEND
            }),
            capabilities: data.capabilities || [],
            currentTask: data.currentTask,
            workload: data.workload || 0,
            createdAt: data.createdAt || new Date(),
            lastActive: data.lastActive || new Date()
        };
        // Validate the created agent
        validators_1.ValidationUtils.validateOrThrow(this.agentValidator, agent, 'AgentFactory.fromData');
        return agent;
    }
    /**
     * Clone an existing agent with new ID
     */
    static cloneAgent(sourceAgent, newName) {
        const clonedAgent = {
            ...sourceAgent,
            id: (0, uuid_1.v4)(),
            name: newName || `${sourceAgent.name} (Copy)`,
            status: agent_types_1.AgentStatus.OFFLINE,
            currentTask: undefined,
            workload: 0,
            createdAt: new Date(),
            lastActive: new Date(),
            config: {
                ...sourceAgent.config,
                name: newName || `${sourceAgent.name} (Copy)`
            }
        };
        // Validate the cloned agent
        validators_1.ValidationUtils.validateOrThrow(this.agentValidator, clonedAgent, 'AgentFactory.cloneAgent');
        return clonedAgent;
    }
    /**
     * Update agent configuration
     */
    static updateAgentConfig(agent, configUpdates) {
        const updatedConfig = {
            ...agent.config,
            ...configUpdates
        };
        // Validate the updated configuration
        validators_1.ValidationUtils.validateOrThrow(this.configValidator, updatedConfig, 'AgentFactory.updateAgentConfig');
        const updatedAgent = {
            ...agent,
            config: updatedConfig,
            capabilities: updatedConfig.capabilities,
            lastActive: new Date()
        };
        // Validate the updated agent
        validators_1.ValidationUtils.validateOrThrow(this.agentValidator, updatedAgent, 'AgentFactory.updateAgentConfig');
        return updatedAgent;
    }
    /**
     * Create multiple agents of different types
     */
    static createAgentTeam(teamConfig) {
        const agents = [];
        for (const [type, options] of Object.entries(teamConfig)) {
            if (options) {
                const agent = this.createAgent({
                    ...options,
                    type: type
                });
                agents.push(agent);
            }
        }
        return agents;
    }
    /**
     * Create a default agent for a specific type
     */
    static createDefaultAgent(type, name) {
        const defaultName = name || `${type.charAt(0).toUpperCase() + type.slice(1)} Agent`;
        return this.createAgent({
            name: defaultName,
            type,
            capabilities: constants_1.DEFAULT_AGENT_CAPABILITIES[type] || []
        });
    }
    /**
     * Validate agent data without creating
     */
    static validateAgentData(data) {
        try {
            // Validate the data directly without creating defaults
            const result = this.agentValidator.validate(data);
            return result;
        }
        catch (error) {
            if (error instanceof SystemError_1.ValidationError) {
                return { isValid: false, errors: [error.message] };
            }
            return { isValid: false, errors: ['Unknown validation error'] };
        }
    }
    /**
     * Get default capabilities for agent type
     */
    static getDefaultCapabilities(type) {
        return [...(constants_1.DEFAULT_AGENT_CAPABILITIES[type] || [])];
    }
    /**
     * Check if agent configuration is valid
     */
    static isValidConfig(config) {
        const result = this.configValidator.validate(config);
        return result.isValid;
    }
}
exports.AgentFactory = AgentFactory;
AgentFactory.configValidator = new validators_1.AgentConfigValidator();
AgentFactory.agentValidator = new validators_1.AgentValidator();
//# sourceMappingURL=AgentFactory.js.map
/**
 * Agent factory for creating and initializing agents
 */

import { v4 as uuidv4 } from 'uuid';
import { Agent, AgentConfig, AgentType, AgentStatus } from '../../types/agent.types';
import { DEFAULT_AGENT_CAPABILITIES } from '../constants';
import { AgentConfigValidator, AgentValidator, ValidationUtils } from '../validation/validators';
import { ValidationError } from '../errors/SystemError';

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
export class AgentFactory {
  private static configValidator = new AgentConfigValidator();
  private static agentValidator = new AgentValidator();

  /**
   * Create a new agent with default configuration
   */
  static createAgent(options: CreateAgentOptions): Agent {
    const config = this.createAgentConfig(options);
    const agent: Agent = {
      id: uuidv4(),
      name: options.name,
      type: options.type,
      status: AgentStatus.OFFLINE,
      config,
      capabilities: config.capabilities,
      workload: 0,
      createdAt: new Date(),
      lastActive: new Date()
    };

    // Validate the created agent
    ValidationUtils.validateOrThrow(this.agentValidator, agent, 'AgentFactory.createAgent');

    return agent;
  }

  /**
   * Create agent configuration with defaults
   */
  static createAgentConfig(options: CreateAgentOptions): AgentConfig {
    const defaultCapabilities = DEFAULT_AGENT_CAPABILITIES[options.type] || [];
    
    const config: AgentConfig = {
      name: options.name,
      type: options.type,
      capabilities: options.capabilities || [...defaultCapabilities],
      maxConcurrentTasks: options.maxConcurrentTasks || 3,
      timeout: options.timeout || 300000, // 5 minutes
      retryAttempts: options.retryAttempts || 3,
      customSettings: options.customSettings || {}
    };

    // Validate the configuration
    ValidationUtils.validateOrThrow(this.configValidator, config, 'AgentFactory.createAgentConfig');

    return config;
  }

  /**
   * Create agent from existing data with validation
   */
  static fromData(data: Partial<Agent>): Agent {
    if (!data.id) {
      throw new ValidationError('Agent ID is required when creating from data');
    }

    const agent: Agent = {
      id: data.id,
      name: data.name || 'Unnamed Agent',
      type: data.type || AgentType.FRONTEND,
      status: data.status || AgentStatus.OFFLINE,
      config: data.config || this.createAgentConfig({
        name: data.name || 'Unnamed Agent',
        type: data.type || AgentType.FRONTEND
      }),
      capabilities: data.capabilities || [],
      currentTask: data.currentTask,
      workload: data.workload || 0,
      createdAt: data.createdAt || new Date(),
      lastActive: data.lastActive || new Date()
    };

    // Validate the created agent
    ValidationUtils.validateOrThrow(this.agentValidator, agent, 'AgentFactory.fromData');

    return agent;
  }

  /**
   * Clone an existing agent with new ID
   */
  static cloneAgent(sourceAgent: Agent, newName?: string): Agent {
    const clonedAgent: Agent = {
      ...sourceAgent,
      id: uuidv4(),
      name: newName || `${sourceAgent.name} (Copy)`,
      status: AgentStatus.OFFLINE,
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
    ValidationUtils.validateOrThrow(this.agentValidator, clonedAgent, 'AgentFactory.cloneAgent');

    return clonedAgent;
  }

  /**
   * Update agent configuration
   */
  static updateAgentConfig(agent: Agent, configUpdates: Partial<AgentConfig>): Agent {
    const updatedConfig: AgentConfig = {
      ...agent.config,
      ...configUpdates
    };

    // Validate the updated configuration
    ValidationUtils.validateOrThrow(this.configValidator, updatedConfig, 'AgentFactory.updateAgentConfig');

    const updatedAgent: Agent = {
      ...agent,
      config: updatedConfig,
      capabilities: updatedConfig.capabilities,
      lastActive: new Date()
    };

    // Validate the updated agent
    ValidationUtils.validateOrThrow(this.agentValidator, updatedAgent, 'AgentFactory.updateAgentConfig');

    return updatedAgent;
  }

  /**
   * Create multiple agents of different types
   */
  static createAgentTeam(teamConfig: { [key in AgentType]?: CreateAgentOptions }): Agent[] {
    const agents: Agent[] = [];

    for (const [type, options] of Object.entries(teamConfig)) {
      if (options) {
        const agent = this.createAgent({
          ...options,
          type: type as AgentType
        });
        agents.push(agent);
      }
    }

    return agents;
  }

  /**
   * Create a default agent for a specific type
   */
  static createDefaultAgent(type: AgentType, name?: string): Agent {
    const defaultName = name || `${type.charAt(0).toUpperCase() + type.slice(1)} Agent`;
    
    return this.createAgent({
      name: defaultName,
      type,
      capabilities: DEFAULT_AGENT_CAPABILITIES[type] || []
    });
  }

  /**
   * Validate agent data without creating
   */
  static validateAgentData(data: Partial<Agent>): { isValid: boolean; errors: string[] } {
    try {
      // Validate the data directly without creating defaults
      const result = this.agentValidator.validate(data as Agent);
      return result;
    } catch (error) {
      if (error instanceof ValidationError) {
        return { isValid: false, errors: [error.message] };
      }
      return { isValid: false, errors: ['Unknown validation error'] };
    }
  }

  /**
   * Get default capabilities for agent type
   */
  static getDefaultCapabilities(type: AgentType): string[] {
    return [...(DEFAULT_AGENT_CAPABILITIES[type] || [])];
  }

  /**
   * Check if agent configuration is valid
   */
  static isValidConfig(config: AgentConfig): boolean {
    const result = this.configValidator.validate(config);
    return result.isValid;
  }
}
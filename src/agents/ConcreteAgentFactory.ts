/**
 * Concrete Agent Factory for creating specific agent implementations
 */

import { v4 as uuidv4 } from 'uuid';
import { AgentType, AgentConfig } from '../core';
import { BaseAgent } from './BaseAgent';
import { TestAgent } from './TestAgent';
import { AgentError, ValidationError } from '../core/errors/SystemError';
import { AgentConfigValidator, ValidationUtils } from '../core/validation';
import { DEFAULT_AGENT_CAPABILITIES } from '../core/constants';

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
export class ConcreteAgentFactory {
  private static _agentTypes: Map<AgentType, AgentConstructor> = new Map();
  private static _configValidator = new AgentConfigValidator();

  /**
   * Register an agent type with its constructor
   */
  static registerAgentType(type: AgentType, constructor: AgentConstructor): void {
    this._agentTypes.set(type, constructor);
  }

  /**
   * Get registered agent types
   */
  static getRegisteredTypes(): AgentType[] {
    return Array.from(this._agentTypes.keys());
  }

  /**
   * Check if agent type is registered
   */
  static isTypeRegistered(type: AgentType): boolean {
    return this._agentTypes.has(type);
  }

  /**
   * Create a new agent instance
   */
  static createAgentInstance(options: CreateAgentInstanceOptions): BaseAgent {
    const { type, name } = options;
    
    // Check if agent type is registered
    const AgentClass = this._agentTypes.get(type);
    if (!AgentClass) {
      throw new AgentError(`Agent type ${type} is not registered. Available types: ${this.getRegisteredTypes().join(', ')}`, 'factory');
    }

    // Create configuration
    const config = this.createAgentConfig(options);
    
    // Generate ID if not provided
    const agentId = options.id || uuidv4();

    // Create agent instance
    const agentInstance = new AgentClass(agentId, name, type, config);

    return agentInstance;
  }

  /**
   * Create agent configuration with defaults
   */
  static createAgentConfig(options: CreateAgentInstanceOptions): AgentConfig {
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
    ValidationUtils.validateOrThrow(this._configValidator, config, 'ConcreteAgentFactory.createAgentConfig');

    return config;
  }

  /**
   * Create multiple agents of different types
   */
  static createAgentTeam(teamConfig: { [key in AgentType]?: CreateAgentInstanceOptions }): BaseAgent[] {
    const agents: BaseAgent[] = [];

    for (const [type, options] of Object.entries(teamConfig)) {
      if (options) {
        const agent = this.createAgentInstance({
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
  static createDefaultAgent(type: AgentType, name?: string): BaseAgent {
    const defaultName = name || `${type.charAt(0).toUpperCase() + type.slice(1)} Agent`;
    
    return this.createAgentInstance({
      name: defaultName,
      type,
      capabilities: DEFAULT_AGENT_CAPABILITIES[type] || []
    });
  }

  /**
   * Clone an existing agent with new configuration
   */
  static cloneAgent(sourceAgent: BaseAgent, overrides: Partial<CreateAgentInstanceOptions> = {}): BaseAgent {
    const sourceConfig = sourceAgent.getConfig();
    
    const options: CreateAgentInstanceOptions = {
      name: overrides.name || `${sourceAgent.name} (Copy)`,
      type: overrides.type || sourceAgent.specialization,
      capabilities: overrides.capabilities || sourceConfig.capabilities,
      maxConcurrentTasks: overrides.maxConcurrentTasks || sourceConfig.maxConcurrentTasks,
      timeout: overrides.timeout || sourceConfig.timeout,
      retryAttempts: overrides.retryAttempts || sourceConfig.retryAttempts,
      customSettings: overrides.customSettings || sourceConfig.customSettings,
      ...overrides
    };

    return this.createAgentInstance(options);
  }

  /**
   * Create agent from template
   */
  static createFromTemplate(templateName: string, customizations: Partial<CreateAgentInstanceOptions> = {}): BaseAgent {
    const template = this.getAgentTemplate(templateName);
    
    const options: CreateAgentInstanceOptions = {
      ...template,
      ...customizations
    };

    return this.createAgentInstance(options);
  }

  /**
   * Get predefined agent templates
   */
  static getAgentTemplates(): Record<string, CreateAgentInstanceOptions> {
    return {
      'frontend-react': {
        name: 'React Frontend Agent',
        type: AgentType.FRONTEND,
        capabilities: ['react', 'typescript', 'css', 'html', 'javascript'],
        maxConcurrentTasks: 2,
        timeout: 600000 // 10 minutes for complex UI tasks
      },
      'frontend-vue': {
        name: 'Vue Frontend Agent',
        type: AgentType.FRONTEND,
        capabilities: ['vue', 'typescript', 'css', 'html', 'javascript'],
        maxConcurrentTasks: 2,
        timeout: 600000
      },
      'backend-node': {
        name: 'Node.js Backend Agent',
        type: AgentType.BACKEND,
        capabilities: ['nodejs', 'typescript', 'express', 'api_design', 'database_design'],
        maxConcurrentTasks: 3,
        timeout: 900000 // 15 minutes for complex backend tasks
      },
      'backend-python': {
        name: 'Python Backend Agent',
        type: AgentType.BACKEND,
        capabilities: ['python', 'fastapi', 'django', 'api_design', 'database_design'],
        maxConcurrentTasks: 3,
        timeout: 900000
      },
      'test-unit': {
        name: 'Unit Testing Agent',
        type: AgentType.TESTING,
        capabilities: ['unit_testing', 'jest', 'mocha', 'pytest'],
        maxConcurrentTasks: 4,
        timeout: 300000
      },
      'test-e2e': {
        name: 'E2E Testing Agent',
        type: AgentType.TESTING,
        capabilities: ['e2e_testing', 'playwright', 'cypress', 'selenium'],
        maxConcurrentTasks: 2,
        timeout: 1200000 // 20 minutes for E2E tests
      },
      'docs-technical': {
        name: 'Technical Documentation Agent',
        type: AgentType.DOCUMENTATION,
        capabilities: ['technical_writing', 'api_documentation', 'markdown'],
        maxConcurrentTasks: 2,
        timeout: 600000
      },
      'review-security': {
        name: 'Security Review Agent',
        type: AgentType.CODE_REVIEW,
        capabilities: ['security_review', 'code_analysis', 'vulnerability_scanning'],
        maxConcurrentTasks: 3,
        timeout: 900000
      },
      'devops-docker': {
        name: 'Docker DevOps Agent',
        type: AgentType.DEVOPS,
        capabilities: ['containerization', 'docker', 'ci_cd', 'deployment'],
        maxConcurrentTasks: 2,
        timeout: 1200000
      }
    };
  }

  /**
   * Get agent template by name
   */
  static getAgentTemplate(templateName: string): CreateAgentInstanceOptions {
    const templates = this.getAgentTemplates();
    const template = templates[templateName];
    
    if (!template) {
      throw new ValidationError(`Agent template '${templateName}' not found. Available templates: ${Object.keys(templates).join(', ')}`);
    }

    return { ...template }; // Return a copy
  }

  /**
   * Validate agent creation options
   */
  static validateCreationOptions(options: CreateAgentInstanceOptions): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validate name
    if (!options.name || options.name.trim().length === 0) {
      errors.push('Agent name is required');
    }

    // Validate type
    if (!Object.values(AgentType).includes(options.type)) {
      errors.push(`Invalid agent type: ${options.type}`);
    }

    // Check if type is registered
    if (!this.isTypeRegistered(options.type)) {
      errors.push(`Agent type ${options.type} is not registered`);
    }

    // Validate configuration
    try {
      const config = this.createAgentConfig(options);
      const configResult = this._configValidator.validate(config);
      errors.push(...configResult.errors);
    } catch (error) {
      errors.push(`Configuration validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Get default capabilities for agent type
   */
  static getDefaultCapabilities(type: AgentType): string[] {
    return [...(DEFAULT_AGENT_CAPABILITIES[type] || [])];
  }

  /**
   * Initialize factory with default agent types
   */
  static initializeDefaults(): void {
    // Register TestAgent for all types (for development/testing)
    Object.values(AgentType).forEach(type => {
      if (!this.isTypeRegistered(type)) {
        this.registerAgentType(type, TestAgent);
      }
    });
  }

  /**
   * Reset factory (mainly for testing)
   */
  static reset(): void {
    this._agentTypes.clear();
  }

  /**
   * Get factory statistics
   */
  static getStatistics() {
    return {
      registeredTypes: this.getRegisteredTypes().length,
      availableTypes: Object.values(AgentType).length,
      availableTemplates: Object.keys(this.getAgentTemplates()).length,
      registeredTypesList: this.getRegisteredTypes()
    };
  }
}
/**
 * Extension Registry
 * Manages custom agent type registration and third-party integrations
 */

import { EventEmitter } from 'eventemitter3';
import { v4 as uuidv4 } from 'uuid';
import { AgentType, AgentConfig } from '../../types/agent.types';
import { BaseAgent } from '../../agents/BaseAgent';
import { ConcreteAgentFactory, CreateAgentInstanceOptions } from '../../agents/ConcreteAgentFactory';
import { IThirdPartyIntegration, IAPIIntegration } from './IAgentPlugin';
import { SystemError, ValidationError } from '../errors/SystemError';
import { ErrorType, ErrorSeverity } from '../../types/error.types';

/**
 * Custom agent type definition
 */
export interface CustomAgentType {
  name: string;
  displayName: string;
  description: string;
  baseType: AgentType;
  capabilities: string[];
  defaultConfig: Partial<AgentConfig>;
  constructor: new (id: string, name: string, type: AgentType, config: AgentConfig) => BaseAgent;
  metadata: {
    version: string;
    author: string;
    category: string;
    tags: string[];
  };
}

/**
 * Integration registration entry
 */
export interface IntegrationRegistryEntry {
  integration: IThirdPartyIntegration;
  name: string;
  version: string;
  isInitialized: boolean;
  isConnected: boolean;
  registeredAt: Date;
  lastConnectionTest?: Date;
  connectionStatus?: { success: boolean; message: string };
  error?: Error;
}

/**
 * Extension registry events
 */
export interface ExtensionRegistryEvents {
  'agent-type-registered': (typeName: string, customType: CustomAgentType) => void;
  'agent-type-unregistered': (typeName: string) => void;
  'integration-registered': (name: string, integration: IThirdPartyIntegration) => void;
  'integration-unregistered': (name: string) => void;
  'integration-connected': (name: string) => void;
  'integration-disconnected': (name: string) => void;
  'integration-error': (name: string, error: Error) => void;
}

/**
 * Extension Registry class
 */
export class ExtensionRegistry extends EventEmitter<ExtensionRegistryEvents> {
  private _customAgentTypes: Map<string, CustomAgentType> = new Map();
  private _integrations: Map<string, IntegrationRegistryEntry> = new Map();
  private _apiIntegrations: Map<string, IAPIIntegration> = new Map();
  private _isInitialized: boolean = false;

  constructor() {
    super();
  }

  /**
   * Initialize the extension registry
   */
  public async initialize(): Promise<void> {
    if (this._isInitialized) {
      return;
    }

    try {
      // Initialize built-in integrations if any
      await this.initializeBuiltInIntegrations();
      
      this._isInitialized = true;
    } catch (error) {
      throw new SystemError(`Failed to initialize extension registry: ${error instanceof Error ? error.message : 'Unknown error'}`, ErrorType.SYSTEM_ERROR, ErrorSeverity.HIGH);
    }
  }

  /**
   * Register a custom agent type
   */
  public registerCustomAgentType(customType: CustomAgentType): void {
    if (this._customAgentTypes.has(customType.name)) {
      throw new ValidationError(`Custom agent type ${customType.name} is already registered`);
    }

    // Validate custom agent type
    this.validateCustomAgentType(customType);

    // Register with the concrete agent factory
    const agentTypeEnum = customType.name as AgentType;
    ConcreteAgentFactory.registerAgentType(agentTypeEnum, customType.constructor);

    // Store in registry
    this._customAgentTypes.set(customType.name, customType);

    this.emit('agent-type-registered', customType.name, customType);
  }

  /**
   * Unregister a custom agent type
   */
  public unregisterCustomAgentType(typeName: string): void {
    const customType = this._customAgentTypes.get(typeName);
    if (!customType) {
      throw new ValidationError(`Custom agent type ${typeName} is not registered`);
    }

    // Remove from registry
    this._customAgentTypes.delete(typeName);

    // Note: We don't remove from ConcreteAgentFactory as it might break existing agents
    // This is a design decision to maintain stability

    this.emit('agent-type-unregistered', typeName);
  }

  /**
   * Get all registered custom agent types
   */
  public getCustomAgentTypes(): CustomAgentType[] {
    return Array.from(this._customAgentTypes.values());
  }

  /**
   * Get custom agent type by name
   */
  public getCustomAgentType(typeName: string): CustomAgentType | null {
    return this._customAgentTypes.get(typeName) || null;
  }

  /**
   * Check if custom agent type is registered
   */
  public isCustomAgentTypeRegistered(typeName: string): boolean {
    return this._customAgentTypes.has(typeName);
  }

  /**
   * Create agent instance from custom type
   */
  public createCustomAgent(
    typeName: string,
    options: Omit<CreateAgentInstanceOptions, 'type'>
  ): BaseAgent {
    const customType = this._customAgentTypes.get(typeName);
    if (!customType) {
      throw new ValidationError(`Custom agent type ${typeName} is not registered`);
    }

    // Create agent configuration manually to avoid validation issues
    const config: AgentConfig = {
      name: options.name,
      type: typeName as AgentType,
      capabilities: options.capabilities || customType.capabilities,
      maxConcurrentTasks: options.maxConcurrentTasks || customType.defaultConfig.maxConcurrentTasks || 3,
      timeout: options.timeout || customType.defaultConfig.timeout || 300000,
      retryAttempts: options.retryAttempts || customType.defaultConfig.retryAttempts || 3,
      customSettings: options.customSettings || customType.defaultConfig.customSettings || {}
    };

    // Generate ID if not provided
    const agentId = options.id || uuidv4();

    // Create agent instance directly using the constructor
    return new customType.constructor(agentId, options.name, typeName as AgentType, config);
  }

  /**
   * Register a third-party integration
   */
  public async registerIntegration(
    name: string,
    integration: IThirdPartyIntegration,
    config?: Record<string, any>
  ): Promise<void> {
    if (this._integrations.has(name)) {
      throw new ValidationError(`Integration ${name} is already registered`);
    }

    try {
      // Initialize the integration if config is provided
      if (config) {
        await integration.initialize(config);
      }

      // Create registry entry
      const entry: IntegrationRegistryEntry = {
        integration,
        name,
        version: integration.version,
        isInitialized: !!config,
        isConnected: false,
        registeredAt: new Date()
      };

      // Store in registry
      this._integrations.set(name, entry);

      // Store API integrations separately for easier access
      if (this.isAPIIntegration(integration)) {
        this._apiIntegrations.set(name, integration);
      }

      this.emit('integration-registered', name, integration);

    } catch (error) {
      throw new SystemError(`Failed to register integration ${name}: ${error instanceof Error ? error.message : 'Unknown error'}`, ErrorType.SYSTEM_ERROR, ErrorSeverity.MEDIUM);
    }
  }

  /**
   * Unregister an integration
   */
  public async unregisterIntegration(name: string): Promise<void> {
    const entry = this._integrations.get(name);
    if (!entry) {
      throw new ValidationError(`Integration ${name} is not registered`);
    }

    try {
      // Cleanup integration resources
      await entry.integration.cleanup();

      // Remove from registries
      this._integrations.delete(name);
      this._apiIntegrations.delete(name);

      this.emit('integration-unregistered', name);

    } catch (error) {
      const integrationError = new SystemError(`Failed to unregister integration ${name}: ${error instanceof Error ? error.message : 'Unknown error'}`, ErrorType.SYSTEM_ERROR, ErrorSeverity.MEDIUM);
      entry.error = integrationError;
      this.emit('integration-error', name, integrationError);
      throw integrationError;
    }
  }

  /**
   * Initialize an integration
   */
  public async initializeIntegration(name: string, config: Record<string, any>): Promise<void> {
    const entry = this._integrations.get(name);
    if (!entry) {
      throw new ValidationError(`Integration ${name} is not registered`);
    }

    if (entry.isInitialized) {
      return; // Already initialized
    }

    try {
      await entry.integration.initialize(config);
      entry.isInitialized = true;
      entry.error = undefined;

    } catch (error) {
      const integrationError = new SystemError(`Failed to initialize integration ${name}: ${error instanceof Error ? error.message : 'Unknown error'}`, ErrorType.SYSTEM_ERROR, ErrorSeverity.MEDIUM);
      entry.error = integrationError;
      this.emit('integration-error', name, integrationError);
      throw integrationError;
    }
  }

  /**
   * Test integration connection
   */
  public async testIntegrationConnection(name: string): Promise<{ success: boolean; message: string }> {
    const entry = this._integrations.get(name);
    if (!entry) {
      throw new ValidationError(`Integration ${name} is not registered`);
    }

    if (!entry.isInitialized) {
      throw new ValidationError(`Integration ${name} is not initialized`);
    }

    try {
      const result = await entry.integration.testConnection();
      
      entry.lastConnectionTest = new Date();
      entry.connectionStatus = result;
      entry.isConnected = result.success;

      if (result.success) {
        this.emit('integration-connected', name);
      } else {
        this.emit('integration-disconnected', name);
      }

      return result;

    } catch (error) {
      const integrationError = new SystemError(`Failed to test integration connection ${name}: ${error instanceof Error ? error.message : 'Unknown error'}`, ErrorType.SYSTEM_ERROR, ErrorSeverity.MEDIUM);
      entry.error = integrationError;
      entry.isConnected = false;
      this.emit('integration-error', name, integrationError);
      throw integrationError;
    }
  }

  /**
   * Execute integration operation
   */
  public async executeIntegrationOperation(
    name: string,
    operation: string,
    params: Record<string, any>
  ): Promise<any> {
    const entry = this._integrations.get(name);
    if (!entry) {
      throw new ValidationError(`Integration ${name} is not registered`);
    }

    if (!entry.isInitialized) {
      throw new ValidationError(`Integration ${name} is not initialized`);
    }

    try {
      return await entry.integration.execute(operation, params);
    } catch (error) {
      const integrationError = new SystemError(`Failed to execute operation ${operation} on integration ${name}: ${error instanceof Error ? error.message : 'Unknown error'}`, ErrorType.SYSTEM_ERROR, ErrorSeverity.MEDIUM);
      entry.error = integrationError;
      this.emit('integration-error', name, integrationError);
      throw integrationError;
    }
  }

  /**
   * Get all registered integrations
   */
  public getIntegrations(): IntegrationRegistryEntry[] {
    return Array.from(this._integrations.values());
  }

  /**
   * Get integration by name
   */
  public getIntegration(name: string): IntegrationRegistryEntry | null {
    return this._integrations.get(name) || null;
  }

  /**
   * Get API integrations
   */
  public getAPIIntegrations(): Map<string, IAPIIntegration> {
    return new Map(this._apiIntegrations);
  }

  /**
   * Get API integration by name
   */
  public getAPIIntegration(name: string): IAPIIntegration | null {
    return this._apiIntegrations.get(name) || null;
  }

  /**
   * Make API request through integration
   */
  public async makeAPIRequest(
    integrationName: string,
    method: string,
    endpoint: string,
    data?: any,
    headers?: Record<string, string>
  ): Promise<any> {
    const apiIntegration = this._apiIntegrations.get(integrationName);
    if (!apiIntegration) {
      throw new ValidationError(`API integration ${integrationName} is not registered`);
    }

    try {
      return await apiIntegration.makeRequest(method, endpoint, data, headers);
    } catch (error) {
      throw new SystemError(`API request failed for integration ${integrationName}: ${error instanceof Error ? error.message : 'Unknown error'}`, ErrorType.SYSTEM_ERROR, ErrorSeverity.MEDIUM);
    }
  }

  /**
   * Get integration capabilities
   */
  public getIntegrationCapabilities(name: string): string[] {
    const entry = this._integrations.get(name);
    if (!entry) {
      throw new ValidationError(`Integration ${name} is not registered`);
    }

    return entry.integration.getCapabilities();
  }

  /**
   * Get extension registry statistics
   */
  public getStatistics() {
    const integrations = Array.from(this._integrations.values());
    const initializedIntegrations = integrations.filter(i => i.isInitialized).length;
    const connectedIntegrations = integrations.filter(i => i.isConnected).length;
    const integrationsWithErrors = integrations.filter(i => i.error).length;

    const customTypesByCategory = new Map<string, number>();
    for (const customType of this._customAgentTypes.values()) {
      const category = customType.metadata.category;
      customTypesByCategory.set(category, (customTypesByCategory.get(category) || 0) + 1);
    }

    return {
      customAgentTypes: this._customAgentTypes.size,
      totalIntegrations: integrations.length,
      initializedIntegrations,
      connectedIntegrations,
      apiIntegrations: this._apiIntegrations.size,
      integrationsWithErrors,
      customTypesByCategory: Object.fromEntries(customTypesByCategory),
      isInitialized: this._isInitialized
    };
  }

  /**
   * Shutdown extension registry
   */
  public async shutdown(): Promise<void> {
    // Cleanup all integrations
    const cleanupPromises = Array.from(this._integrations.values()).map(async entry => {
      try {
        await entry.integration.cleanup();
      } catch (error) {
        console.error(`Failed to cleanup integration ${entry.name}:`, error);
      }
    });

    await Promise.all(cleanupPromises);

    // Clear all data
    this._customAgentTypes.clear();
    this._integrations.clear();
    this._apiIntegrations.clear();
    this._isInitialized = false;

    // Remove all listeners
    this.removeAllListeners();
  }

  // Private helper methods

  /**
   * Validate custom agent type
   */
  private validateCustomAgentType(customType: CustomAgentType): void {
    const errors: string[] = [];

    if (!customType.name || customType.name.trim().length === 0) {
      errors.push('Custom agent type name is required');
    }

    if (!customType.displayName || customType.displayName.trim().length === 0) {
      errors.push('Custom agent type display name is required');
    }

    if (!customType.constructor || typeof customType.constructor !== 'function') {
      errors.push('Custom agent type constructor is required and must be a function');
    }

    if (!Array.isArray(customType.capabilities)) {
      errors.push('Custom agent type capabilities must be an array');
    }

    if (!Object.values(AgentType).includes(customType.baseType)) {
      errors.push('Custom agent type must have a valid base type');
    }

    if (errors.length > 0) {
      throw new ValidationError(`Invalid custom agent type: ${errors.join(', ')}`);
    }
  }

  /**
   * Check if integration is an API integration
   */
  private isAPIIntegration(integration: IThirdPartyIntegration): integration is IAPIIntegration {
    return (
      'baseUrl' in integration &&
      'makeRequest' in integration &&
      'getRateLimits' in integration &&
      'authenticate' in integration
    );
  }

  /**
   * Initialize built-in integrations
   */
  private async initializeBuiltInIntegrations(): Promise<void> {
    // This would initialize any built-in integrations
    // For now, this is a placeholder
    console.log('Initializing built-in integrations...');
  }
}
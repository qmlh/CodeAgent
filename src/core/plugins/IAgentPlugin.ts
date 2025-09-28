/**
 * Agent Plugin Interface
 * Defines the contract for agent plugins and extensions
 */

import { AgentType, AgentConfig } from '../../types/agent.types';
import { BaseAgent } from '../../agents/BaseAgent';

/**
 * Plugin metadata interface
 */
export interface PluginMetadata {
  name: string;
  version: string;
  description: string;
  author: string;
  homepage?: string;
  repository?: string;
  license?: string;
  keywords?: string[];
  dependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
}

/**
 * Plugin configuration interface
 */
export interface PluginConfig {
  enabled: boolean;
  settings?: Record<string, any>;
  permissions?: PluginPermissions;
}

/**
 * Plugin permissions interface
 */
export interface PluginPermissions {
  fileSystem?: {
    read?: string[];
    write?: string[];
    execute?: string[];
  };
  network?: {
    allowedHosts?: string[];
    allowedPorts?: number[];
  };
  system?: {
    allowShellCommands?: boolean;
    allowEnvironmentAccess?: boolean;
  };
  agents?: {
    canCreateAgents?: boolean;
    canModifyAgents?: boolean;
    canAccessAgentData?: boolean;
  };
}

/**
 * Plugin lifecycle hooks
 */
export interface PluginLifecycleHooks {
  onLoad?(): Promise<void>;
  onUnload?(): Promise<void>;
  onEnable?(): Promise<void>;
  onDisable?(): Promise<void>;
  onConfigUpdate?(newConfig: PluginConfig): Promise<void>;
}

/**
 * Agent plugin interface
 */
export interface IAgentPlugin extends PluginLifecycleHooks {
  readonly metadata: PluginMetadata;
  readonly config: PluginConfig;
  
  /**
   * Get supported agent types that this plugin provides
   */
  getSupportedAgentTypes(): AgentType[];
  
  /**
   * Create an agent instance of the specified type
   */
  createAgent(id: string, name: string, type: AgentType, config: AgentConfig): BaseAgent;
  
  /**
   * Validate if the plugin can create an agent of the specified type
   */
  canCreateAgent(type: AgentType): boolean;
  
  /**
   * Get default configuration for an agent type
   */
  getDefaultAgentConfig(type: AgentType): Partial<AgentConfig>;
  
  /**
   * Get available capabilities for an agent type
   */
  getAgentCapabilities(type: AgentType): string[];
  
  /**
   * Validate agent configuration for the specified type
   */
  validateAgentConfig(type: AgentType, config: AgentConfig): { isValid: boolean; errors: string[] };
}

/**
 * Plugin registry entry
 */
export interface PluginRegistryEntry {
  plugin: IAgentPlugin;
  metadata: PluginMetadata;
  config: PluginConfig;
  isLoaded: boolean;
  isEnabled: boolean;
  loadedAt?: Date;
  enabledAt?: Date;
  error?: Error;
}

/**
 * Plugin discovery result
 */
export interface PluginDiscoveryResult {
  path: string;
  metadata: PluginMetadata;
  isValid: boolean;
  errors: string[];
}

/**
 * Plugin installation result
 */
export interface PluginInstallationResult {
  success: boolean;
  pluginName: string;
  version: string;
  errors: string[];
  warnings: string[];
}

/**
 * Third-party integration interface
 */
export interface IThirdPartyIntegration {
  readonly name: string;
  readonly version: string;
  readonly apiEndpoint?: string;
  
  /**
   * Initialize the integration
   */
  initialize(config: Record<string, any>): Promise<void>;
  
  /**
   * Test the integration connection
   */
  testConnection(): Promise<{ success: boolean; message: string }>;
  
  /**
   * Get integration capabilities
   */
  getCapabilities(): string[];
  
  /**
   * Execute integration-specific operations
   */
  execute(operation: string, params: Record<string, any>): Promise<any>;
  
  /**
   * Cleanup integration resources
   */
  cleanup(): Promise<void>;
}

/**
 * API integration interface
 */
export interface IAPIIntegration extends IThirdPartyIntegration {
  readonly apiKey?: string;
  readonly baseUrl: string;
  
  /**
   * Make API request
   */
  makeRequest(method: string, endpoint: string, data?: any, headers?: Record<string, string>): Promise<any>;
  
  /**
   * Get API rate limits
   */
  getRateLimits(): Promise<{ remaining: number; resetTime: Date }>;
  
  /**
   * Handle API authentication
   */
  authenticate(): Promise<boolean>;
}

/**
 * Plugin event types
 */
export enum PluginEventType {
  PLUGIN_LOADED = 'plugin-loaded',
  PLUGIN_UNLOADED = 'plugin-unloaded',
  PLUGIN_ENABLED = 'plugin-enabled',
  PLUGIN_DISABLED = 'plugin-disabled',
  PLUGIN_ERROR = 'plugin-error',
  AGENT_TYPE_REGISTERED = 'agent-type-registered',
  AGENT_TYPE_UNREGISTERED = 'agent-type-unregistered',
  INTEGRATION_ADDED = 'integration-added',
  INTEGRATION_REMOVED = 'integration-removed'
}

/**
 * Plugin event data
 */
export interface PluginEventData {
  pluginName: string;
  eventType: PluginEventType;
  timestamp: Date;
  data?: any;
  error?: Error;
}
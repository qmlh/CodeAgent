/**
 * Plugin Manager
 * Manages loading, unloading, and lifecycle of agent plugins
 */

import { EventEmitter } from 'eventemitter3';
import * as path from 'path';
import * as fs from 'fs/promises';
import {
  IAgentPlugin,
  PluginMetadata,
  PluginConfig,
  PluginRegistryEntry,
  PluginDiscoveryResult,
  PluginInstallationResult,
  PluginEventType,
  PluginEventData,
  PluginPermissions
} from './IAgentPlugin';
import { AgentType, AgentConfig } from '../../types/agent.types';
import { ErrorType, ErrorSeverity } from '../../types/error.types';
import { BaseAgent } from '../../agents/BaseAgent';
import { SystemError, ValidationError } from '../errors/SystemError';

/**
 * Plugin manager events
 */
export interface PluginManagerEvents {
  'plugin-event': (eventData: PluginEventData) => void;
  'plugin-loaded': (pluginName: string, plugin: IAgentPlugin) => void;
  'plugin-unloaded': (pluginName: string) => void;
  'plugin-enabled': (pluginName: string) => void;
  'plugin-disabled': (pluginName: string) => void;
  'plugin-error': (pluginName: string, error: Error) => void;
}

/**
 * Plugin loading options
 */
export interface PluginLoadOptions {
  autoEnable?: boolean;
  validatePermissions?: boolean;
  allowUnsafe?: boolean;
}

/**
 * Plugin Manager class
 */
export class PluginManager extends EventEmitter<PluginManagerEvents> {
  private _plugins: Map<string, PluginRegistryEntry> = new Map();
  private _pluginPaths: Map<string, string> = new Map();
  private _agentTypeProviders: Map<AgentType, string[]> = new Map();
  private _isInitialized: boolean = false;

  // Default plugin directories
  private readonly _defaultPluginDirs = [
    './plugins',
    './node_modules/@multi-agent-ide',
    path.join(process.cwd(), 'plugins'),
    path.join(process.cwd(), 'extensions')
  ];

  constructor() {
    super();
    this.initializeAgentTypeProviders();
  }

  /**
   * Initialize the plugin manager
   */
  public async initialize(pluginDirs?: string[]): Promise<void> {
    if (this._isInitialized) {
      return;
    }

    const searchDirs = pluginDirs || this._defaultPluginDirs;

    try {
      // Discover plugins in all directories
      const discoveryResults = await this.discoverPlugins(searchDirs);

      // Load valid plugins
      for (const result of discoveryResults) {
        if (result.isValid) {
          try {
            await this.loadPlugin(result.path, { autoEnable: false });
          } catch (error) {
            console.warn(`Failed to load plugin at ${result.path}:`, error);
          }
        }
      }

      this._isInitialized = true;
    } catch (error) {
      throw new SystemError(`Failed to initialize plugin manager: ${error instanceof Error ? error.message : 'Unknown error'}`, ErrorType.SYSTEM_ERROR, ErrorSeverity.HIGH);
    }
  }

  /**
   * Discover plugins in specified directories
   */
  public async discoverPlugins(directories: string[]): Promise<PluginDiscoveryResult[]> {
    const results: PluginDiscoveryResult[] = [];

    for (const dir of directories) {
      try {
        const dirExists = await fs.access(dir).then(() => true).catch(() => false);
        if (!dirExists) {
          continue;
        }

        const entries = await fs.readdir(dir, { withFileTypes: true });

        for (const entry of entries) {
          if (entry.isDirectory()) {
            const pluginPath = path.join(dir, entry.name);
            const result = await this.validatePluginDirectory(pluginPath);
            results.push(result);
          }
        }
      } catch (error) {
        console.warn(`Failed to discover plugins in directory ${dir}:`, error);
      }
    }

    return results;
  }

  /**
   * Load a plugin from the specified path
   */
  public async loadPlugin(pluginPath: string, options: PluginLoadOptions = {}): Promise<void> {
    const { autoEnable = false, validatePermissions = true, allowUnsafe = false } = options;

    try {
      // Validate plugin directory
      const validation = await this.validatePluginDirectory(pluginPath);
      if (!validation.isValid) {
        throw new ValidationError(`Invalid plugin: ${validation.errors.join(', ')}`);
      }

      const { metadata } = validation;

      // Check if plugin is already loaded
      if (this._plugins.has(metadata.name)) {
        throw new ValidationError(`Plugin ${metadata.name} is already loaded`);
      }

      // Load plugin configuration
      const config = await this.loadPluginConfig(pluginPath);

      // Validate permissions if required
      if (validatePermissions && !allowUnsafe) {
        this.validatePluginPermissions(config.permissions);
      }

      // Load the plugin module
      const pluginModule = await this.loadPluginModule(pluginPath);

      // Create registry entry
      const registryEntry: PluginRegistryEntry = {
        plugin: pluginModule,
        metadata,
        config,
        isLoaded: true,
        isEnabled: false,
        loadedAt: new Date()
      };

      // Store plugin
      this._plugins.set(metadata.name, registryEntry);
      this._pluginPaths.set(metadata.name, pluginPath);

      // Call plugin lifecycle hook
      if (pluginModule.onLoad) {
        await pluginModule.onLoad();
      }

      // Register agent types provided by this plugin
      const supportedTypes = pluginModule.getSupportedAgentTypes();
      this.registerAgentTypes(metadata.name, supportedTypes);

      // Auto-enable if requested
      if (autoEnable && config.enabled) {
        await this.enablePlugin(metadata.name);
      }

      // Emit events
      this.emit('plugin-loaded', metadata.name, pluginModule);
      this.emitPluginEvent(metadata.name, PluginEventType.PLUGIN_LOADED);

    } catch (error) {
      const pluginError = new SystemError(`Failed to load plugin at ${pluginPath}: ${error instanceof Error ? error.message : 'Unknown error'}`, ErrorType.SYSTEM_ERROR, ErrorSeverity.MEDIUM);
      this.emit('plugin-error', path.basename(pluginPath), pluginError);
      throw pluginError;
    }
  }

  /**
   * Unload a plugin
   */
  public async unloadPlugin(pluginName: string): Promise<void> {
    const entry = this._plugins.get(pluginName);
    if (!entry) {
      throw new ValidationError(`Plugin ${pluginName} is not loaded`);
    }

    try {
      // Disable plugin if enabled
      if (entry.isEnabled) {
        await this.disablePlugin(pluginName);
      }

      // Call plugin lifecycle hook
      if (entry.plugin.onUnload) {
        await entry.plugin.onUnload();
      }

      // Unregister agent types
      const supportedTypes = entry.plugin.getSupportedAgentTypes();
      this.unregisterAgentTypes(pluginName, supportedTypes);

      // Remove from registry
      this._plugins.delete(pluginName);
      this._pluginPaths.delete(pluginName);

      // Emit events
      this.emit('plugin-unloaded', pluginName);
      this.emitPluginEvent(pluginName, PluginEventType.PLUGIN_UNLOADED);

    } catch (error) {
      const pluginError = new SystemError(`Failed to unload plugin ${pluginName}: ${error instanceof Error ? error.message : 'Unknown error'}`, ErrorType.SYSTEM_ERROR, ErrorSeverity.MEDIUM);
      entry.error = pluginError;
      this.emit('plugin-error', pluginName, pluginError);
      throw pluginError;
    }
  }

  /**
   * Enable a plugin
   */
  public async enablePlugin(pluginName: string): Promise<void> {
    const entry = this._plugins.get(pluginName);
    if (!entry) {
      throw new ValidationError(`Plugin ${pluginName} is not loaded`);
    }

    if (entry.isEnabled) {
      return; // Already enabled
    }

    try {
      // Call plugin lifecycle hook
      if (entry.plugin.onEnable) {
        await entry.plugin.onEnable();
      }

      // Update registry entry
      entry.isEnabled = true;
      entry.enabledAt = new Date();
      entry.error = undefined;

      // Emit events
      this.emit('plugin-enabled', pluginName);
      this.emitPluginEvent(pluginName, PluginEventType.PLUGIN_ENABLED);

    } catch (error) {
      const pluginError = new SystemError(`Failed to enable plugin ${pluginName}: ${error instanceof Error ? error.message : 'Unknown error'}`, ErrorType.SYSTEM_ERROR, ErrorSeverity.MEDIUM);
      entry.error = pluginError;
      this.emit('plugin-error', pluginName, pluginError);
      throw pluginError;
    }
  }

  /**
   * Disable a plugin
   */
  public async disablePlugin(pluginName: string): Promise<void> {
    const entry = this._plugins.get(pluginName);
    if (!entry) {
      throw new ValidationError(`Plugin ${pluginName} is not loaded`);
    }

    if (!entry.isEnabled) {
      return; // Already disabled
    }

    try {
      // Call plugin lifecycle hook
      if (entry.plugin.onDisable) {
        await entry.plugin.onDisable();
      }

      // Update registry entry
      entry.isEnabled = false;
      entry.enabledAt = undefined;

      // Emit events
      this.emit('plugin-disabled', pluginName);
      this.emitPluginEvent(pluginName, PluginEventType.PLUGIN_DISABLED);

    } catch (error) {
      const pluginError = new SystemError(`Failed to disable plugin ${pluginName}: ${error instanceof Error ? error.message : 'Unknown error'}`, ErrorType.SYSTEM_ERROR, ErrorSeverity.MEDIUM);
      entry.error = pluginError;
      this.emit('plugin-error', pluginName, pluginError);
      throw pluginError;
    }
  }

  /**
   * Get all loaded plugins
   */
  public getLoadedPlugins(): PluginRegistryEntry[] {
    return Array.from(this._plugins.values());
  }

  /**
   * Get enabled plugins
   */
  public getEnabledPlugins(): PluginRegistryEntry[] {
    return Array.from(this._plugins.values()).filter(entry => entry.isEnabled);
  }

  /**
   * Get plugin by name
   */
  public getPlugin(pluginName: string): PluginRegistryEntry | null {
    return this._plugins.get(pluginName) || null;
  }

  /**
   * Check if plugin is loaded
   */
  public isPluginLoaded(pluginName: string): boolean {
    return this._plugins.has(pluginName);
  }

  /**
   * Check if plugin is enabled
   */
  public isPluginEnabled(pluginName: string): boolean {
    const entry = this._plugins.get(pluginName);
    return entry ? entry.isEnabled : false;
  }

  /**
   * Get plugins that can create agents of the specified type
   */
  public getPluginsForAgentType(agentType: AgentType): PluginRegistryEntry[] {
    const providers = this._agentTypeProviders.get(agentType) || [];
    return providers
      .map(pluginName => this._plugins.get(pluginName))
      .filter((entry): entry is PluginRegistryEntry => entry !== undefined && entry.isEnabled);
  }

  /**
   * Create an agent using a plugin
   */
  public async createAgentWithPlugin(
    pluginName: string,
    id: string,
    name: string,
    type: AgentType,
    config: AgentConfig
  ): Promise<BaseAgent> {
    const entry = this._plugins.get(pluginName);
    if (!entry) {
      throw new ValidationError(`Plugin ${pluginName} is not loaded`);
    }

    if (!entry.isEnabled) {
      throw new ValidationError(`Plugin ${pluginName} is not enabled`);
    }

    if (!entry.plugin.canCreateAgent(type)) {
      throw new ValidationError(`Plugin ${pluginName} cannot create agents of type ${type}`);
    }

    try {
      return entry.plugin.createAgent(id, name, type, config);
    } catch (error) {
      throw new SystemError(`Failed to create agent with plugin ${pluginName}: ${error instanceof Error ? error.message : 'Unknown error'}`, ErrorType.AGENT_ERROR, ErrorSeverity.HIGH);
    }
  }

  /**
   * Update plugin configuration
   */
  public async updatePluginConfig(pluginName: string, newConfig: Partial<PluginConfig>): Promise<void> {
    const entry = this._plugins.get(pluginName);
    if (!entry) {
      throw new ValidationError(`Plugin ${pluginName} is not loaded`);
    }

    const updatedConfig: PluginConfig = {
      ...entry.config,
      ...newConfig
    };

    try {
      // Call plugin lifecycle hook
      if (entry.plugin.onConfigUpdate) {
        await entry.plugin.onConfigUpdate(updatedConfig);
      }

      // Update registry entry
      entry.config = updatedConfig;

      // Save configuration to disk
      const pluginPath = this._pluginPaths.get(pluginName);
      if (pluginPath) {
        await this.savePluginConfig(pluginPath, updatedConfig);
      }

    } catch (error) {
      throw new SystemError(`Failed to update plugin config for ${pluginName}: ${error instanceof Error ? error.message : 'Unknown error'}`, ErrorType.SYSTEM_ERROR, ErrorSeverity.MEDIUM);
    }
  }

  /**
   * Install a plugin from a package
   */
  public async installPlugin(packagePath: string): Promise<PluginInstallationResult> {
    // This would implement plugin installation from npm packages or local files
    // For now, return a placeholder implementation
    return {
      success: false,
      pluginName: '',
      version: '',
      errors: ['Plugin installation not yet implemented'],
      warnings: []
    };
  }

  /**
   * Uninstall a plugin
   */
  public async uninstallPlugin(pluginName: string): Promise<void> {
    // First unload the plugin
    if (this.isPluginLoaded(pluginName)) {
      await this.unloadPlugin(pluginName);
    }

    // Remove plugin files (implementation would depend on installation method)
    // For now, just log
    console.log(`Uninstalling plugin ${pluginName} (not yet implemented)`);
  }

  /**
   * Get plugin manager statistics
   */
  public getStatistics() {
    const plugins = Array.from(this._plugins.values());
    const enabledCount = plugins.filter(p => p.isEnabled).length;
    const errorCount = plugins.filter(p => p.error).length;

    const agentTypeProviders = new Map<AgentType, number>();
    for (const [type, providers] of this._agentTypeProviders) {
      agentTypeProviders.set(type, providers.length);
    }

    return {
      totalPlugins: plugins.length,
      enabledPlugins: enabledCount,
      disabledPlugins: plugins.length - enabledCount,
      pluginsWithErrors: errorCount,
      agentTypeProviders: Object.fromEntries(agentTypeProviders),
      isInitialized: this._isInitialized
    };
  }

  /**
   * Shutdown plugin manager
   */
  public async shutdown(): Promise<void> {
    const pluginNames = Array.from(this._plugins.keys());

    // Unload all plugins
    for (const pluginName of pluginNames) {
      try {
        await this.unloadPlugin(pluginName);
      } catch (error) {
        console.error(`Failed to unload plugin ${pluginName} during shutdown:`, error);
      }
    }

    // Clear all data
    this._plugins.clear();
    this._pluginPaths.clear();
    this._agentTypeProviders.clear();
    this._isInitialized = false;

    // Remove all listeners
    this.removeAllListeners();
  }

  // Private helper methods

  /**
   * Initialize agent type providers map
   */
  private initializeAgentTypeProviders(): void {
    Object.values(AgentType).forEach(type => {
      this._agentTypeProviders.set(type, []);
    });
  }

  /**
   * Validate plugin directory
   */
  private async validatePluginDirectory(pluginPath: string): Promise<PluginDiscoveryResult> {
    const errors: string[] = [];
    let metadata: PluginMetadata | null = null;

    try {
      // Check if directory exists
      const stat = await fs.stat(pluginPath);
      if (!stat.isDirectory()) {
        errors.push('Path is not a directory');
      }

      // Check for package.json
      const packageJsonPath = path.join(pluginPath, 'package.json');
      try {
        const packageJsonContent = await fs.readFile(packageJsonPath, 'utf-8');
        const packageJson = JSON.parse(packageJsonContent);

        // Extract metadata
        metadata = {
          name: packageJson.name || path.basename(pluginPath),
          version: packageJson.version || '0.0.0',
          description: packageJson.description || '',
          author: packageJson.author || 'Unknown',
          homepage: packageJson.homepage,
          repository: packageJson.repository?.url || packageJson.repository,
          license: packageJson.license,
          keywords: packageJson.keywords,
          dependencies: packageJson.dependencies,
          peerDependencies: packageJson.peerDependencies
        };

        // Validate required fields
        if (!metadata.name) {
          errors.push('Plugin name is required');
        }
        if (!metadata.version) {
          errors.push('Plugin version is required');
        }

      } catch (error) {
        errors.push('Invalid or missing package.json');
      }

      // Check for main entry point
      const mainFile = path.join(pluginPath, 'index.js');
      const mainFileExists = await fs.access(mainFile).then(() => true).catch(() => false);
      if (!mainFileExists) {
        errors.push('Main entry point (index.js) not found');
      }

    } catch (error) {
      errors.push(`Failed to validate plugin directory: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return {
      path: pluginPath,
      metadata: metadata || {
        name: path.basename(pluginPath),
        version: '0.0.0',
        description: '',
        author: 'Unknown'
      },
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Load plugin configuration
   */
  private async loadPluginConfig(pluginPath: string): Promise<PluginConfig> {
    const configPath = path.join(pluginPath, 'plugin.config.json');

    try {
      const configContent = await fs.readFile(configPath, 'utf-8');
      return JSON.parse(configContent);
    } catch (error) {
      // Return default configuration if config file doesn't exist
      return {
        enabled: true,
        settings: {},
        permissions: {}
      };
    }
  }

  /**
   * Save plugin configuration
   */
  private async savePluginConfig(pluginPath: string, config: PluginConfig): Promise<void> {
    const configPath = path.join(pluginPath, 'plugin.config.json');
    await fs.writeFile(configPath, JSON.stringify(config, null, 2));
  }

  /**
   * Load plugin module
   */
  private async loadPluginModule(pluginPath: string): Promise<IAgentPlugin> {
    const mainFile = path.join(pluginPath, 'index.js');

    try {
      // Clear require cache to allow reloading
      const resolvedPath = require.resolve(mainFile);
      delete require.cache[resolvedPath];

      // Load the module
      const pluginModule = require(mainFile);

      // Handle default exports
      const plugin = pluginModule.default || pluginModule;

      // Check if it's a valid plugin
      if (!this.isValidPlugin(plugin)) {
        throw new ValidationError('Module does not implement IAgentPlugin interface');
      }

      return plugin;
    } catch (error) {
      throw new SystemError(`Failed to load plugin module: ${error instanceof Error ? error.message : 'Unknown error'}`, ErrorType.SYSTEM_ERROR, ErrorSeverity.MEDIUM);
    }
  }

  /**
   * Validate if module implements IAgentPlugin interface
   */
  private isValidPlugin(module: any): module is IAgentPlugin {
    return (
      module &&
      typeof module.metadata === 'object' &&
      typeof module.config === 'object' &&
      typeof module.getSupportedAgentTypes === 'function' &&
      typeof module.createAgent === 'function' &&
      typeof module.canCreateAgent === 'function' &&
      typeof module.getDefaultAgentConfig === 'function' &&
      typeof module.getAgentCapabilities === 'function' &&
      typeof module.validateAgentConfig === 'function'
    );
  }

  /**
   * Validate plugin permissions
   */
  private validatePluginPermissions(permissions?: PluginPermissions): void {
    if (!permissions) {
      return;
    }

    // Add permission validation logic here
    // For now, just log warnings for potentially unsafe permissions
    if (permissions.system?.allowShellCommands) {
      console.warn('Plugin requests shell command execution permissions');
    }

    if (permissions.fileSystem?.write && permissions.fileSystem.write.includes('*')) {
      console.warn('Plugin requests write access to all files');
    }
  }

  /**
   * Register agent types for a plugin
   */
  private registerAgentTypes(pluginName: string, agentTypes: AgentType[]): void {
    for (const type of agentTypes) {
      const providers = this._agentTypeProviders.get(type) || [];
      if (!providers.includes(pluginName)) {
        providers.push(pluginName);
        this._agentTypeProviders.set(type, providers);
        this.emitPluginEvent(pluginName, PluginEventType.AGENT_TYPE_REGISTERED, { agentType: type });
      }
    }
  }

  /**
   * Unregister agent types for a plugin
   */
  private unregisterAgentTypes(pluginName: string, agentTypes: AgentType[]): void {
    for (const type of agentTypes) {
      const providers = this._agentTypeProviders.get(type) || [];
      const index = providers.indexOf(pluginName);
      if (index !== -1) {
        providers.splice(index, 1);
        this._agentTypeProviders.set(type, providers);
        this.emitPluginEvent(pluginName, PluginEventType.AGENT_TYPE_UNREGISTERED, { agentType: type });
      }
    }
  }

  /**
   * Emit plugin event
   */
  private emitPluginEvent(pluginName: string, eventType: PluginEventType, data?: any): void {
    const eventData: PluginEventData = {
      pluginName,
      eventType,
      timestamp: new Date(),
      data
    };

    this.emit('plugin-event', eventData);
  }
}
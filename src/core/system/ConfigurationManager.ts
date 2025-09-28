/**
 * Configuration Manager
 * Handles system and project configuration management
 */

import { EventEmitter } from 'eventemitter3';
import * as fs from 'fs/promises';
import * as path from 'path';
import { SystemConfig, ProjectConfig, WorkflowConfig } from '../../types/config.types';
import { SystemError } from '../errors/SystemError';
import { ErrorType, ErrorSeverity } from '../../types/error.types';

/**
 * Configuration source types
 */
export enum ConfigurationSource {
  FILE = 'file',
  ENVIRONMENT = 'environment',
  DEFAULT = 'default',
  RUNTIME = 'runtime'
}

/**
 * Configuration entry
 */
export interface ConfigurationEntry<T = any> {
  key: string;
  value: T;
  source: ConfigurationSource;
  timestamp: Date;
  version: number;
  encrypted: boolean;
}

/**
 * Configuration validation rule
 */
export interface ConfigurationValidationRule {
  key: string;
  required: boolean;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  validator?: (value: any) => boolean;
  defaultValue?: any;
  description?: string;
}

/**
 * Configuration schema
 */
export interface ConfigurationSchema {
  name: string;
  version: string;
  rules: ConfigurationValidationRule[];
}

/**
 * Configuration Manager
 */
export class ConfigurationManager extends EventEmitter {
  private systemConfig: SystemConfig;
  private projectConfig?: ProjectConfig;
  private workflowConfigs: Map<string, WorkflowConfig> = new Map();
  private configurations: Map<string, ConfigurationEntry> = new Map();
  private schemas: Map<string, ConfigurationSchema> = new Map();
  
  private configPaths: {
    system: string;
    project?: string;
    workflows: string;
  };
  
  private isInitialized: boolean = false;
  private watchHandles: Map<string, any> = new Map();

  constructor(configPaths?: Partial<typeof ConfigurationManager.prototype.configPaths>) {
    super();
    
    this.configPaths = {
      system: path.join(process.cwd(), 'config', 'system.json'),
      project: undefined,
      workflows: path.join(process.cwd(), 'config', 'workflows'),
      ...configPaths
    };

    this.systemConfig = this.getDefaultSystemConfig();
    this.setupConfigurationSchemas();
  }

  /**
   * Initialize configuration manager
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      // Load system configuration
      await this.loadSystemConfiguration();
      
      // Load project configuration if available
      if (this.configPaths.project) {
        await this.loadProjectConfiguration();
      }
      
      // Load workflow configurations
      await this.loadWorkflowConfigurations();
      
      // Start watching configuration files
      await this.startConfigurationWatching();
      
      this.isInitialized = true;
      this.emit('initialized');

    } catch (error) {
      throw new SystemError(
        `Failed to initialize configuration manager: ${error instanceof Error ? error.message : 'Unknown error'}`,
        ErrorType.CONFIGURATION_ERROR,
        ErrorSeverity.HIGH
      );
    }
  }

  /**
   * Shutdown configuration manager
   */
  async shutdown(): Promise<void> {
    if (!this.isInitialized) {
      return;
    }

    // Stop watching configuration files
    for (const [path, handle] of Array.from(this.watchHandles.entries())) {
      try {
        if (handle && typeof handle.close === 'function') {
          await handle.close();
        }
      } catch (error) {
        console.error(`Error closing file watcher for ${path}:`, error);
      }
    }
    this.watchHandles.clear();

    this.isInitialized = false;
    this.emit('shutdown');
  }

  /**
   * Get system configuration
   */
  getSystemConfig(): SystemConfig {
    return { ...this.systemConfig };
  }

  /**
   * Update system configuration
   */
  async updateSystemConfig(updates: Partial<SystemConfig>): Promise<void> {
    const newConfig = { ...this.systemConfig, ...updates };
    
    // Validate configuration
    await this.validateConfiguration('system', newConfig);
    
    this.systemConfig = newConfig;
    
    // Save to file
    await this.saveSystemConfiguration();
    
    this.emit('system_config_updated', newConfig);
  }

  /**
   * Get project configuration
   */
  getProjectConfig(): ProjectConfig | undefined {
    return this.projectConfig ? { ...this.projectConfig } : undefined;
  }

  /**
   * Set project configuration
   */
  async setProjectConfig(config: ProjectConfig): Promise<void> {
    // Validate configuration
    await this.validateConfiguration('project', config);
    
    this.projectConfig = config;
    
    // Save to file if path is set
    if (this.configPaths.project) {
      await this.saveProjectConfiguration();
    }
    
    this.emit('project_config_updated', config);
  }

  /**
   * Get workflow configuration
   */
  getWorkflowConfig(workflowId: string): WorkflowConfig | undefined {
    return this.workflowConfigs.get(workflowId);
  }

  /**
   * Get all workflow configurations
   */
  getAllWorkflowConfigs(): WorkflowConfig[] {
    return Array.from(this.workflowConfigs.values());
  }

  /**
   * Add or update workflow configuration
   */
  async setWorkflowConfig(config: WorkflowConfig): Promise<void> {
    // Validate configuration
    await this.validateConfiguration('workflow', config);
    
    this.workflowConfigs.set(config.id, config);
    
    // Save to file
    await this.saveWorkflowConfiguration(config);
    
    this.emit('workflow_config_updated', config);
  }

  /**
   * Remove workflow configuration
   */
  async removeWorkflowConfig(workflowId: string): Promise<boolean> {
    if (!this.workflowConfigs.has(workflowId)) {
      return false;
    }

    this.workflowConfigs.delete(workflowId);
    
    // Remove file
    const filePath = path.join(this.configPaths.workflows, `${workflowId}.json`);
    try {
      await fs.unlink(filePath);
    } catch (error) {
      // File might not exist, which is okay
    }
    
    this.emit('workflow_config_removed', workflowId);
    return true;
  }

  /**
   * Get configuration value
   */
  get<T = any>(key: string, defaultValue?: T): T | undefined {
    const entry = this.configurations.get(key);
    return entry ? entry.value : defaultValue;
  }

  /**
   * Set configuration value
   */
  async set<T = any>(key: string, value: T, source: ConfigurationSource = ConfigurationSource.RUNTIME): Promise<void> {
    const entry: ConfigurationEntry<T> = {
      key,
      value,
      source,
      timestamp: new Date(),
      version: (this.configurations.get(key)?.version || 0) + 1,
      encrypted: false
    };

    this.configurations.set(key, entry);
    this.emit('configuration_changed', entry);
  }

  /**
   * Get all configuration entries
   */
  getAllConfigurations(): ConfigurationEntry[] {
    return Array.from(this.configurations.values());
  }

  /**
   * Validate configuration against schema
   */
  async validateConfiguration(schemaName: string, config: any): Promise<boolean> {
    const schema = this.schemas.get(schemaName);
    if (!schema) {
      throw new SystemError(
        `Configuration schema not found: ${schemaName}`,
        ErrorType.CONFIGURATION_ERROR,
        ErrorSeverity.MEDIUM
      );
    }

    const errors: string[] = [];

    for (const rule of schema.rules) {
      const value = this.getNestedValue(config, rule.key);
      
      // Check required fields
      if (rule.required && (value === undefined || value === null)) {
        errors.push(`Required field missing: ${rule.key}`);
        continue;
      }

      // Skip validation if value is undefined and not required
      if (value === undefined || value === null) {
        continue;
      }

      // Check type
      if (!this.validateType(value, rule.type)) {
        errors.push(`Invalid type for ${rule.key}: expected ${rule.type}, got ${typeof value}`);
        continue;
      }

      // Custom validation
      if (rule.validator && !rule.validator(value)) {
        errors.push(`Custom validation failed for ${rule.key}`);
      }
    }

    if (errors.length > 0) {
      throw new SystemError(
        `Configuration validation failed: ${errors.join(', ')}`,
        ErrorType.CONFIGURATION_ERROR,
        ErrorSeverity.HIGH
      );
    }

    return true;
  }

  /**
   * Export configuration
   */
  async exportConfiguration(filePath: string): Promise<void> {
    const exportData = {
      systemConfig: this.systemConfig,
      projectConfig: this.projectConfig,
      workflowConfigs: Array.from(this.workflowConfigs.values()),
      configurations: Array.from(this.configurations.values()),
      exportedAt: new Date().toISOString()
    };

    await fs.writeFile(filePath, JSON.stringify(exportData, null, 2));
    this.emit('configuration_exported', filePath);
  }

  /**
   * Import configuration
   */
  async importConfiguration(filePath: string): Promise<void> {
    try {
      const data = await fs.readFile(filePath, 'utf-8');
      const importData = JSON.parse(data);

      if (importData.systemConfig) {
        await this.updateSystemConfig(importData.systemConfig);
      }

      if (importData.projectConfig) {
        await this.setProjectConfig(importData.projectConfig);
      }

      if (importData.workflowConfigs) {
        for (const workflowConfig of importData.workflowConfigs) {
          await this.setWorkflowConfig(workflowConfig);
        }
      }

      if (importData.configurations) {
        for (const entry of importData.configurations) {
          this.configurations.set(entry.key, entry);
        }
      }

      this.emit('configuration_imported', filePath);

    } catch (error) {
      throw new SystemError(
        `Failed to import configuration: ${error instanceof Error ? error.message : 'Unknown error'}`,
        ErrorType.CONFIGURATION_ERROR,
        ErrorSeverity.HIGH
      );
    }
  }

  // Private methods

  private getDefaultSystemConfig(): SystemConfig {
    return {
      maxAgents: parseInt(process.env.MAX_AGENTS || '10'),
      maxConcurrentTasks: parseInt(process.env.MAX_CONCURRENT_TASKS || '50'),
      taskTimeout: parseInt(process.env.TASK_TIMEOUT || '300000'),
      fileLockTimeout: parseInt(process.env.FILE_LOCK_TIMEOUT || '60000'),
      heartbeatInterval: parseInt(process.env.HEARTBEAT_INTERVAL || '30000'),
      retryAttempts: parseInt(process.env.RETRY_ATTEMPTS || '3'),
      logLevel: (process.env.LOG_LEVEL as SystemConfig['logLevel']) || 'info'
    };
  }

  private setupConfigurationSchemas(): void {
    // System configuration schema
    this.schemas.set('system', {
      name: 'system',
      version: '1.0.0',
      rules: [
        { key: 'maxAgents', required: true, type: 'number', validator: (v) => v > 0 && v <= 100 },
        { key: 'maxConcurrentTasks', required: true, type: 'number', validator: (v) => v > 0 },
        { key: 'taskTimeout', required: true, type: 'number', validator: (v) => v > 0 },
        { key: 'fileLockTimeout', required: true, type: 'number', validator: (v) => v > 0 },
        { key: 'heartbeatInterval', required: true, type: 'number', validator: (v) => v > 0 },
        { key: 'retryAttempts', required: true, type: 'number', validator: (v) => v >= 0 },
        { key: 'logLevel', required: true, type: 'string', validator: (v) => ['debug', 'info', 'warn', 'error'].includes(v) }
      ]
    });

    // Project configuration schema
    this.schemas.set('project', {
      name: 'project',
      version: '1.0.0',
      rules: [
        { key: 'name', required: true, type: 'string' },
        { key: 'rootPath', required: true, type: 'string' },
        { key: 'collaborationMode', required: true, type: 'string', validator: (v) => ['serial', 'parallel', 'hybrid'].includes(v) },
        { key: 'codeStandards', required: false, type: 'object' },
        { key: 'reviewProcess', required: false, type: 'object' },
        { key: 'qualityStandards', required: false, type: 'object' }
      ]
    });

    // Workflow configuration schema
    this.schemas.set('workflow', {
      name: 'workflow',
      version: '1.0.0',
      rules: [
        { key: 'id', required: true, type: 'string' },
        { key: 'name', required: true, type: 'string' },
        { key: 'steps', required: true, type: 'array' },
        { key: 'triggers', required: false, type: 'array' },
        { key: 'conditions', required: false, type: 'array' }
      ]
    });
  }

  private async loadSystemConfiguration(): Promise<void> {
    try {
      const data = await fs.readFile(this.configPaths.system, 'utf-8');
      const config = JSON.parse(data);
      
      // Validate and merge with defaults
      await this.validateConfiguration('system', config);
      this.systemConfig = { ...this.systemConfig, ...config };
      
    } catch (error) {
      if ((error as any).code === 'ENOENT') {
        // File doesn't exist, use defaults and create it
        await this.saveSystemConfiguration();
      } else {
        throw error;
      }
    }
  }

  private async saveSystemConfiguration(): Promise<void> {
    await this.ensureDirectoryExists(path.dirname(this.configPaths.system));
    await fs.writeFile(this.configPaths.system, JSON.stringify(this.systemConfig, null, 2));
  }

  private async loadProjectConfiguration(): Promise<void> {
    if (!this.configPaths.project) {
      return;
    }

    try {
      const data = await fs.readFile(this.configPaths.project, 'utf-8');
      const config = JSON.parse(data);
      
      await this.validateConfiguration('project', config);
      this.projectConfig = config;
      
    } catch (error) {
      if ((error as any).code !== 'ENOENT') {
        throw error;
      }
      // File doesn't exist, which is okay for project config
    }
  }

  private async saveProjectConfiguration(): Promise<void> {
    if (!this.configPaths.project || !this.projectConfig) {
      return;
    }

    await this.ensureDirectoryExists(path.dirname(this.configPaths.project));
    await fs.writeFile(this.configPaths.project, JSON.stringify(this.projectConfig, null, 2));
  }

  private async loadWorkflowConfigurations(): Promise<void> {
    try {
      await this.ensureDirectoryExists(this.configPaths.workflows);
      const files = await fs.readdir(this.configPaths.workflows);
      
      for (const file of files) {
        if (file.endsWith('.json')) {
          try {
            const filePath = path.join(this.configPaths.workflows, file);
            const data = await fs.readFile(filePath, 'utf-8');
            const config = JSON.parse(data);
            
            await this.validateConfiguration('workflow', config);
            this.workflowConfigs.set(config.id, config);
            
          } catch (error) {
            console.error(`Error loading workflow config ${file}:`, error);
          }
        }
      }
    } catch (error) {
      // Directory doesn't exist, which is okay
    }
  }

  private async saveWorkflowConfiguration(config: WorkflowConfig): Promise<void> {
    await this.ensureDirectoryExists(this.configPaths.workflows);
    const filePath = path.join(this.configPaths.workflows, `${config.id}.json`);
    await fs.writeFile(filePath, JSON.stringify(config, null, 2));
  }

  private async startConfigurationWatching(): Promise<void> {
    // Skip file watching in test environment
    if (process.env.NODE_ENV === 'test') {
      return;
    }

    // Watch system config file
    try {
      const systemWatcher = await this.watchFile(this.configPaths.system, async () => {
        await this.loadSystemConfiguration();
        this.emit('system_config_reloaded');
      });
      this.watchHandles.set(this.configPaths.system, systemWatcher);
    } catch (error) {
      console.error('Error watching system config file:', error);
    }

    // Watch project config file if it exists
    if (this.configPaths.project) {
      try {
        const projectWatcher = await this.watchFile(this.configPaths.project, async () => {
          await this.loadProjectConfiguration();
          this.emit('project_config_reloaded');
        });
        this.watchHandles.set(this.configPaths.project, projectWatcher);
      } catch (error) {
        console.error('Error watching project config file:', error);
      }
    }

    // Watch workflows directory
    try {
      const workflowsWatcher = await this.watchDirectory(this.configPaths.workflows, async () => {
        await this.loadWorkflowConfigurations();
        this.emit('workflow_configs_reloaded');
      });
      this.watchHandles.set(this.configPaths.workflows, workflowsWatcher);
    } catch (error) {
      console.error('Error watching workflows directory:', error);
    }
  }

  private async watchFile(filePath: string, callback: () => Promise<void>): Promise<any> {
    const fs = require('fs');
    return fs.watch(filePath, { persistent: false }, async (eventType: string) => {
      if (eventType === 'change') {
        try {
          await callback();
        } catch (error) {
          console.error(`Error reloading config file ${filePath}:`, error);
        }
      }
    });
  }

  private async watchDirectory(dirPath: string, callback: () => Promise<void>): Promise<any> {
    const fs = require('fs');
    return fs.watch(dirPath, { persistent: false }, async (eventType: string) => {
      if (eventType === 'change' || eventType === 'rename') {
        try {
          await callback();
        } catch (error) {
          console.error(`Error reloading configs from directory ${dirPath}:`, error);
        }
      }
    });
  }

  private async ensureDirectoryExists(dirPath: string): Promise<void> {
    try {
      await fs.mkdir(dirPath, { recursive: true });
    } catch (error) {
      // Directory might already exist
    }
  }

  private getNestedValue(obj: any, key: string): any {
    return key.split('.').reduce((current, prop) => current?.[prop], obj);
  }

  private validateType(value: any, expectedType: string): boolean {
    switch (expectedType) {
      case 'string':
        return typeof value === 'string';
      case 'number':
        return typeof value === 'number' && !isNaN(value);
      case 'boolean':
        return typeof value === 'boolean';
      case 'object':
        return typeof value === 'object' && value !== null && !Array.isArray(value);
      case 'array':
        return Array.isArray(value);
      default:
        return false;
    }
  }
}
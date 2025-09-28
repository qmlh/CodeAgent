/**
 * Sample Plugin Implementation
 * Demonstrates how to create a custom agent plugin
 */

import { 
  IAgentPlugin, 
  PluginMetadata, 
  PluginConfig,
  PluginPermissions
} from '../IAgentPlugin';
import { AgentType, AgentConfig } from '../../../types/agent.types';
import { BaseAgent } from '../../../agents/BaseAgent';
import { Task, TaskResult } from '../../../types/task.types';
import { AgentMessage } from '../../../types/message.types';

/**
 * Sample Custom Agent that extends BaseAgent
 */
class SampleCustomAgent extends BaseAgent {
  constructor(id: string, name: string, type: AgentType, config: AgentConfig) {
    super(id, name, type, config);
  }

  protected async onInitialize(): Promise<void> {
    this.log('info', 'Sample custom agent initialized');
  }

  protected async onExecuteTask(task: Task): Promise<TaskResult> {
    this.log('info', `Executing sample task: ${task.title}`);
    
    // Simulate some work
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return this.createTaskResult(
      task.id,
      true,
      { message: 'Sample task completed successfully', customData: 'sample-output' },
      undefined,
      []
    );
  }

  protected async onShutdown(): Promise<void> {
    this.log('info', 'Sample custom agent shutting down');
  }

  protected async onConfigUpdate(newConfig: AgentConfig): Promise<void> {
    this.log('info', 'Sample custom agent config updated');
  }

  protected async onMessageReceived(message: AgentMessage): Promise<void> {
    this.log('info', `Sample custom agent received message: ${message.type}`);
  }
}

/**
 * Sample Plugin Implementation
 */
export class SamplePlugin implements IAgentPlugin {
  public readonly metadata: PluginMetadata = {
    name: 'sample-plugin',
    version: '1.0.0',
    description: 'A sample plugin demonstrating custom agent types',
    author: 'Multi-Agent IDE Team',
    homepage: 'https://github.com/multi-agent-ide/sample-plugin',
    license: 'MIT',
    keywords: ['sample', 'demo', 'custom-agent'],
    dependencies: {},
    peerDependencies: {}
  };

  public readonly config: PluginConfig = {
    enabled: true,
    settings: {
      sampleSetting: 'default-value',
      enableLogging: true
    },
    permissions: {
      fileSystem: {
        read: ['./src/**/*'],
        write: ['./output/**/*']
      },
      network: {
        allowedHosts: ['api.example.com'],
        allowedPorts: [80, 443]
      },
      system: {
        allowShellCommands: false,
        allowEnvironmentAccess: false
      },
      agents: {
        canCreateAgents: true,
        canModifyAgents: false,
        canAccessAgentData: true
      }
    }
  };

  private _isLoaded: boolean = false;
  private _isEnabled: boolean = false;

  /**
   * Plugin lifecycle hooks
   */
  public async onLoad(): Promise<void> {
    console.log('Sample plugin loaded');
    this._isLoaded = true;
  }

  public async onUnload(): Promise<void> {
    console.log('Sample plugin unloaded');
    this._isLoaded = false;
    this._isEnabled = false;
  }

  public async onEnable(): Promise<void> {
    console.log('Sample plugin enabled');
    this._isEnabled = true;
  }

  public async onDisable(): Promise<void> {
    console.log('Sample plugin disabled');
    this._isEnabled = false;
  }

  public async onConfigUpdate(newConfig: PluginConfig): Promise<void> {
    console.log('Sample plugin config updated:', newConfig);
    // Update internal config
    Object.assign(this.config, newConfig);
  }

  /**
   * Agent type management
   */
  public getSupportedAgentTypes(): AgentType[] {
    return ['sample-agent' as AgentType];
  }

  public createAgent(id: string, name: string, type: AgentType, config: AgentConfig): BaseAgent {
    if (!this.canCreateAgent(type)) {
      throw new Error(`Cannot create agent of type ${type}`);
    }

    return new SampleCustomAgent(id, name, type, config);
  }

  public canCreateAgent(type: AgentType): boolean {
    return this.getSupportedAgentTypes().includes(type);
  }

  public getDefaultAgentConfig(type: AgentType): Partial<AgentConfig> {
    if (type === 'sample-agent' as AgentType) {
      return {
        capabilities: ['sample-capability', 'demo-feature'],
        maxConcurrentTasks: 2,
        timeout: 30000,
        retryAttempts: 2,
        customSettings: {
          sampleAgentSetting: 'default-value',
          enableVerboseLogging: false
        }
      };
    }

    return {};
  }

  public getAgentCapabilities(type: AgentType): string[] {
    if (type === 'sample-agent' as AgentType) {
      return ['sample-capability', 'demo-feature', 'custom-processing'];
    }

    return [];
  }

  public validateAgentConfig(type: AgentType, config: AgentConfig): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (type === 'sample-agent' as AgentType) {
      // Validate sample agent specific configuration
      if (config.maxConcurrentTasks && config.maxConcurrentTasks > 5) {
        errors.push('Sample agent cannot handle more than 5 concurrent tasks');
      }

      if (config.timeout && config.timeout < 10000) {
        errors.push('Sample agent requires at least 10 seconds timeout');
      }

      // Check for required capabilities
      const requiredCapabilities = ['sample-capability'];
      const missingCapabilities = requiredCapabilities.filter(cap => !config.capabilities.includes(cap));
      if (missingCapabilities.length > 0) {
        errors.push(`Missing required capabilities: ${missingCapabilities.join(', ')}`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Plugin status
   */
  public isLoaded(): boolean {
    return this._isLoaded;
  }

  public isEnabled(): boolean {
    return this._isEnabled;
  }
}

// Export the plugin instance
export default new SamplePlugin();
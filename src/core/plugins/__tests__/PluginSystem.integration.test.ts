/**
 * Plugin System Integration Tests
 * Tests the complete plugin and extension system working together
 */

import { PluginManager } from '../PluginManager';
import { ExtensionRegistry, CustomAgentType } from '../ExtensionRegistry';
import { IntegrationFactory } from '../ThirdPartyIntegrations';
import { ConcreteAgentFactory } from '../../../agents/ConcreteAgentFactory';
import { 
  IAgentPlugin, 
  PluginMetadata, 
  PluginConfig,
  IThirdPartyIntegration 
} from '../IAgentPlugin';
import { AgentType, AgentConfig } from '../../../types/agent.types';
import { BaseAgent } from '../../../agents/BaseAgent';
import { Task, TaskResult } from '../../../types/task.types';
import { AgentMessage } from '../../../types/message.types';
import * as fs from 'fs/promises';
import * as path from 'path';

// Mock fs module
jest.mock('fs/promises');
const mockFs = fs as jest.Mocked<typeof fs>;

// Mock fetch for API integrations
global.fetch = jest.fn();
const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

// Custom agent implementation for testing
class TestCustomAgent extends BaseAgent {
  constructor(id: string, name: string, type: AgentType, config: AgentConfig) {
    super(id, name, type, config);
  }

  protected async onInitialize(): Promise<void> {
    this.log('info', 'Test custom agent initialized');
  }

  protected async onExecuteTask(task: Task): Promise<TaskResult> {
    this.log('info', `Executing test task: ${task.title}`);
    
    // Simulate work
    await new Promise(resolve => setTimeout(resolve, 100));
    
    return this.createTaskResult(
      task.id,
      true,
      { message: 'Test task completed', customData: 'test-output' },
      undefined,
      ['test-file.js']
    );
  }

  protected async onShutdown(): Promise<void> {
    this.log('info', 'Test custom agent shutting down');
  }

  protected async onConfigUpdate(newConfig: AgentConfig): Promise<void> {
    this.log('info', 'Test custom agent config updated');
  }
}

// Test plugin implementation
class TestPlugin implements IAgentPlugin {
  public readonly metadata: PluginMetadata = {
    name: 'test-plugin',
    version: '1.0.0',
    description: 'Test plugin for integration testing',
    author: 'Test Suite',
    license: 'MIT'
  };

  public readonly config: PluginConfig = {
    enabled: true,
    settings: {
      testSetting: 'test-value'
    },
    permissions: {
      fileSystem: {
        read: ['./src/**/*'],
        write: ['./output/**/*']
      },
      agents: {
        canCreateAgents: true,
        canModifyAgents: false,
        canAccessAgentData: true
      }
    }
  };

  public lifecycleEvents: string[] = [];

  async onLoad(): Promise<void> {
    this.lifecycleEvents.push('onLoad');
  }

  async onUnload(): Promise<void> {
    this.lifecycleEvents.push('onUnload');
  }

  async onEnable(): Promise<void> {
    this.lifecycleEvents.push('onEnable');
  }

  async onDisable(): Promise<void> {
    this.lifecycleEvents.push('onDisable');
  }

  async onConfigUpdate(newConfig: PluginConfig): Promise<void> {
    this.lifecycleEvents.push('onConfigUpdate');
  }

  getSupportedAgentTypes(): AgentType[] {
    return ['test-agent' as AgentType];
  }

  createAgent(id: string, name: string, type: AgentType, config: AgentConfig): BaseAgent {
    return new TestCustomAgent(id, name, type, config);
  }

  canCreateAgent(type: AgentType): boolean {
    return type === 'test-agent' as AgentType;
  }

  getDefaultAgentConfig(type: AgentType): Partial<AgentConfig> {
    return {
      capabilities: ['test-capability', 'custom-processing'],
      maxConcurrentTasks: 3,
      timeout: 60000,
      retryAttempts: 2
    };
  }

  getAgentCapabilities(type: AgentType): string[] {
    return ['test-capability', 'custom-processing', 'integration-testing'];
  }

  validateAgentConfig(type: AgentType, config: AgentConfig): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (config.maxConcurrentTasks && config.maxConcurrentTasks > 10) {
      errors.push('Test agent cannot handle more than 10 concurrent tasks');
    }

    return { isValid: errors.length === 0, errors };
  }
}

// Test integration implementation
class TestIntegration implements IThirdPartyIntegration {
  public readonly name = 'test-integration';
  public readonly version = '1.0.0';

  public isInitialized = false;
  public operations: Array<{ operation: string; params: any }> = [];

  async initialize(config: Record<string, any>): Promise<void> {
    this.isInitialized = true;
  }

  async testConnection(): Promise<{ success: boolean; message: string }> {
    return { success: true, message: 'Test connection successful' };
  }

  getCapabilities(): string[] {
    return ['test-operation', 'data-processing', 'external-api'];
  }

  async execute(operation: string, params: Record<string, any>): Promise<any> {
    this.operations.push({ operation, params });
    return { operation, params, result: 'test-result', timestamp: new Date() };
  }

  async cleanup(): Promise<void> {
    this.isInitialized = false;
    this.operations = [];
  }
}

describe('Plugin System Integration', () => {
  let pluginManager: PluginManager;
  let extensionRegistry: ExtensionRegistry;
  let testPlugin: TestPlugin;
  let testIntegration: TestIntegration;

  beforeEach(async () => {
    // Initialize components
    pluginManager = new PluginManager();
    extensionRegistry = new ExtensionRegistry();
    testPlugin = new TestPlugin();
    testIntegration = new TestIntegration();

    // Setup mocks
    mockFs.access.mockResolvedValue(undefined);
    mockFs.readdir.mockResolvedValue([]);
    mockFs.stat.mockResolvedValue({ isDirectory: () => true } as any);
    mockFs.readFile.mockImplementation((filePath: string) => {
      if (filePath.includes('package.json')) {
        return Promise.resolve(JSON.stringify(testPlugin.metadata));
      }
      if (filePath.includes('plugin.config.json')) {
        return Promise.resolve(JSON.stringify(testPlugin.config));
      }
      return Promise.reject(new Error('File not found'));
    });
    mockFs.writeFile.mockResolvedValue(undefined);

    // Mock require to return test plugin
    jest.doMock(path.join('./test-plugin', 'index.js'), () => testPlugin, { virtual: true });

    // Initialize systems
    await pluginManager.initialize([]);
    await extensionRegistry.initialize();

    jest.clearAllMocks();
  });

  afterEach(async () => {
    await pluginManager.shutdown();
    await extensionRegistry.shutdown();
  });

  describe('complete plugin lifecycle', () => {
    it('should load, enable, and use a plugin end-to-end', async () => {
      // Load plugin
      await pluginManager.loadPlugin('./test-plugin');
      expect(testPlugin.lifecycleEvents).toContain('onLoad');
      expect(pluginManager.isPluginLoaded('test-plugin')).toBe(true);

      // Enable plugin
      await pluginManager.enablePlugin('test-plugin');
      expect(testPlugin.lifecycleEvents).toContain('onEnable');
      expect(pluginManager.isPluginEnabled('test-plugin')).toBe(true);

      // Create agent using plugin
      const agent = await pluginManager.createAgentWithPlugin(
        'test-plugin',
        'test-agent-1',
        'Test Agent',
        'test-agent' as AgentType,
        {
          name: 'Test Agent',
          type: 'test-agent' as AgentType,
          capabilities: ['test-capability'],
          maxConcurrentTasks: 2,
          timeout: 30000,
          retryAttempts: 3
        }
      );

      expect(agent).toBeInstanceOf(TestCustomAgent);
      expect(agent.id).toBe('test-agent-1');
      expect(agent.name).toBe('Test Agent');

      // Initialize and test agent
      await agent.initialize({
        name: 'Test Agent',
        type: 'test-agent' as AgentType,
        capabilities: ['test-capability'],
        maxConcurrentTasks: 2,
        timeout: 30000,
        retryAttempts: 3
      });

      expect(agent.getStatus()).toBe('idle');
      expect(agent.getCapabilities()).toContain('test-capability');

      // Execute task with agent
      const task: Task = {
        id: 'test-task-1',
        title: 'Test Task',
        description: 'A test task for integration testing',
        type: 'test',
        status: 'pending',
        priority: 2,
        dependencies: [],
        estimatedTime: 1000,
        files: [],
        requirements: ['test-capability'],
        createdAt: new Date()
      };

      const result = await agent.executeTask(task);

      expect(result.success).toBe(true);
      expect(result.taskId).toBe('test-task-1');
      expect(result.output?.message).toBe('Test task completed');
      expect(result.filesModified).toContain('test-file.js');

      // Shutdown agent
      await agent.shutdown();
      expect(agent.getStatus()).toBe('offline');

      // Disable and unload plugin
      await pluginManager.disablePlugin('test-plugin');
      expect(testPlugin.lifecycleEvents).toContain('onDisable');

      await pluginManager.unloadPlugin('test-plugin');
      expect(testPlugin.lifecycleEvents).toContain('onUnload');
      expect(pluginManager.isPluginLoaded('test-plugin')).toBe(false);
    });

    it('should handle plugin configuration updates', async () => {
      await pluginManager.loadPlugin('./test-plugin');
      await pluginManager.enablePlugin('test-plugin');

      const newConfig = {
        enabled: true,
        settings: {
          testSetting: 'updated-value',
          newSetting: 'new-value'
        }
      };

      await pluginManager.updatePluginConfig('test-plugin', newConfig);

      expect(testPlugin.lifecycleEvents).toContain('onConfigUpdate');
      
      const plugin = pluginManager.getPlugin('test-plugin');
      expect(plugin?.config.settings?.testSetting).toBe('updated-value');
      expect(plugin?.config.settings?.newSetting).toBe('new-value');
    });
  });

  describe('custom agent type registration', () => {
    it('should register and use custom agent types', async () => {
      const customAgentType: CustomAgentType = {
        name: 'integration-test-agent',
        displayName: 'Integration Test Agent',
        description: 'Custom agent type for integration testing',
        baseType: AgentType.FRONTEND,
        capabilities: ['integration-testing', 'custom-capability'],
        defaultConfig: {
          maxConcurrentTasks: 5,
          timeout: 120000
        },
        constructor: TestCustomAgent,
        metadata: {
          version: '1.0.0',
          author: 'Integration Test Suite',
          category: 'testing',
          tags: ['integration', 'test', 'custom']
        }
      };

      // Register custom agent type
      extensionRegistry.registerCustomAgentType(customAgentType);
      expect(extensionRegistry.isCustomAgentTypeRegistered('integration-test-agent')).toBe(true);

      // Create agent from custom type
      const agent = extensionRegistry.createCustomAgent('integration-test-agent', {
        name: 'Custom Test Agent',
        capabilities: ['integration-testing']
      });

      expect(agent).toBeInstanceOf(TestCustomAgent);
      expect(agent.specialization).toBe('integration-test-agent');

      // Test agent functionality
      await agent.initialize({
        name: 'Custom Test Agent',
        type: 'integration-test-agent' as AgentType,
        capabilities: ['integration-testing'],
        maxConcurrentTasks: 5,
        timeout: 120000,
        retryAttempts: 3
      });

      const task: Task = {
        id: 'custom-task-1',
        title: 'Custom Task',
        description: 'Task for custom agent type',
        type: 'custom',
        status: 'pending',
        priority: 1,
        dependencies: [],
        estimatedTime: 2000,
        files: [],
        requirements: ['integration-testing'],
        createdAt: new Date()
      };

      const result = await agent.executeTask(task);
      expect(result.success).toBe(true);
      expect(result.output?.customData).toBe('test-output');

      await agent.shutdown();
    });
  });

  describe('third-party integration system', () => {
    it('should register and use third-party integrations', async () => {
      // Register integration
      await extensionRegistry.registerIntegration('test-integration', testIntegration, {
        apiKey: 'test-key',
        baseUrl: 'https://api.test.com'
      });

      expect(testIntegration.isInitialized).toBe(true);

      // Test connection
      const connectionResult = await extensionRegistry.testIntegrationConnection('test-integration');
      expect(connectionResult.success).toBe(true);
      expect(connectionResult.message).toBe('Test connection successful');

      // Execute operations
      const operationResult = await extensionRegistry.executeIntegrationOperation(
        'test-integration',
        'test-operation',
        { input: 'test-data', options: { format: 'json' } }
      );

      expect(operationResult.operation).toBe('test-operation');
      expect(operationResult.params.input).toBe('test-data');
      expect(operationResult.result).toBe('test-result');

      // Verify operation was recorded
      expect(testIntegration.operations).toHaveLength(1);
      expect(testIntegration.operations[0].operation).toBe('test-operation');

      // Get capabilities
      const capabilities = extensionRegistry.getIntegrationCapabilities('test-integration');
      expect(capabilities).toContain('test-operation');
      expect(capabilities).toContain('data-processing');
      expect(capabilities).toContain('external-api');
    });

    it('should work with built-in API integrations', async () => {
      // Mock successful API responses
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: {
          get: (name: string) => {
            if (name === 'content-type') return 'application/json';
            return null;
          }
        },
        json: () => Promise.resolve({ data: 'api-response' }),
        text: () => Promise.resolve('{"data":"api-response"}')
      } as any);

      // Create and register OpenAI integration
      const openaiIntegration = IntegrationFactory.createIntegration('openai', 'test-api-key');
      await extensionRegistry.registerIntegration('openai', openaiIntegration, {
        apiKey: 'test-api-key'
      });

      // Test API request
      const result = await extensionRegistry.makeAPIRequest(
        'openai',
        'POST',
        '/completions',
        { prompt: 'Test prompt', max_tokens: 50 },
        { 'Custom-Header': 'test-value' }
      );

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.openai.com/v1/completions',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-api-key',
            'Content-Type': 'application/json',
            'Custom-Header': 'test-value'
          }),
          body: expect.stringContaining('Test prompt')
        })
      );

      expect(result.data).toBe('api-response');
    });
  });

  describe('plugin and extension system coordination', () => {
    it('should coordinate plugins with custom agent types and integrations', async () => {
      // Load and enable plugin
      await pluginManager.loadPlugin('./test-plugin');
      await pluginManager.enablePlugin('test-plugin');

      // Register custom agent type
      const customAgentType: CustomAgentType = {
        name: 'coordinated-agent',
        displayName: 'Coordinated Agent',
        description: 'Agent that uses both plugin and integration features',
        baseType: AgentType.BACKEND,
        capabilities: ['coordination', 'plugin-integration'],
        defaultConfig: {
          maxConcurrentTasks: 3,
          timeout: 90000
        },
        constructor: TestCustomAgent,
        metadata: {
          version: '1.0.0',
          author: 'Coordination Test',
          category: 'coordination',
          tags: ['coordination', 'integration']
        }
      };

      extensionRegistry.registerCustomAgentType(customAgentType);

      // Register integration
      await extensionRegistry.registerIntegration('coordination-integration', testIntegration, {
        mode: 'coordination'
      });

      // Create agent using plugin
      const pluginAgent = await pluginManager.createAgentWithPlugin(
        'test-plugin',
        'plugin-agent',
        'Plugin Agent',
        'test-agent' as AgentType,
        testPlugin.getDefaultAgentConfig('test-agent' as AgentType) as AgentConfig
      );

      // Create agent using custom type
      const customAgent = extensionRegistry.createCustomAgent('coordinated-agent', {
        name: 'Custom Agent'
      });

      // Initialize both agents
      await pluginAgent.initialize(testPlugin.getDefaultAgentConfig('test-agent' as AgentType) as AgentConfig);
      await customAgent.initialize({
        name: 'Custom Agent',
        type: 'coordinated-agent' as AgentType,
        capabilities: ['coordination', 'plugin-integration'],
        maxConcurrentTasks: 3,
        timeout: 90000,
        retryAttempts: 3
      });

      // Execute coordinated operations
      const pluginTask: Task = {
        id: 'plugin-task',
        title: 'Plugin Task',
        description: 'Task executed by plugin agent',
        type: 'plugin',
        status: 'pending',
        priority: 2,
        dependencies: [],
        estimatedTime: 1000,
        files: [],
        requirements: ['test-capability'],
        createdAt: new Date()
      };

      const customTask: Task = {
        id: 'custom-task',
        title: 'Custom Task',
        description: 'Task executed by custom agent',
        type: 'custom',
        status: 'pending',
        priority: 2,
        dependencies: [],
        estimatedTime: 1500,
        files: [],
        requirements: ['coordination'],
        createdAt: new Date()
      };

      // Execute tasks concurrently
      const [pluginResult, customResult] = await Promise.all([
        pluginAgent.executeTask(pluginTask),
        customAgent.executeTask(customTask)
      ]);

      expect(pluginResult.success).toBe(true);
      expect(customResult.success).toBe(true);

      // Use integration during task execution
      const integrationResult = await extensionRegistry.executeIntegrationOperation(
        'coordination-integration',
        'coordinate-agents',
        {
          pluginAgent: pluginResult,
          customAgent: customResult
        }
      );

      expect(integrationResult.operation).toBe('coordinate-agents');
      expect(integrationResult.params.pluginAgent).toEqual(pluginResult);
      expect(integrationResult.params.customAgent).toEqual(customResult);

      // Cleanup
      await pluginAgent.shutdown();
      await customAgent.shutdown();
    });
  });

  describe('system statistics and monitoring', () => {
    it('should provide comprehensive system statistics', async () => {
      // Setup complete system
      await pluginManager.loadPlugin('./test-plugin');
      await pluginManager.enablePlugin('test-plugin');

      const customAgentType: CustomAgentType = {
        name: 'stats-agent',
        displayName: 'Statistics Agent',
        description: 'Agent for statistics testing',
        baseType: AgentType.TESTING,
        capabilities: ['statistics'],
        defaultConfig: {},
        constructor: TestCustomAgent,
        metadata: {
          version: '1.0.0',
          author: 'Stats Test',
          category: 'statistics',
          tags: ['stats']
        }
      };

      extensionRegistry.registerCustomAgentType(customAgentType);
      await extensionRegistry.registerIntegration('stats-integration', testIntegration, {});

      // Get statistics
      const pluginStats = pluginManager.getStatistics();
      const extensionStats = extensionRegistry.getStatistics();

      // Verify plugin statistics
      expect(pluginStats.totalPlugins).toBe(1);
      expect(pluginStats.enabledPlugins).toBe(1);
      expect(pluginStats.disabledPlugins).toBe(0);
      expect(pluginStats.isInitialized).toBe(true);

      // Verify extension statistics
      expect(extensionStats.customAgentTypes).toBe(1);
      expect(extensionStats.totalIntegrations).toBe(1);
      expect(extensionStats.initializedIntegrations).toBe(1);
      expect(extensionStats.isInitialized).toBe(true);

      // Verify agent type providers
      const testAgentProviders = pluginManager.getPluginsForAgentType('test-agent' as AgentType);
      expect(testAgentProviders).toHaveLength(1);
      expect(testAgentProviders[0].metadata.name).toBe('test-plugin');
    });
  });

  describe('error handling and recovery', () => {
    it('should handle plugin errors gracefully', async () => {
      // Create a plugin that will fail
      const failingPlugin = new TestPlugin();
      failingPlugin.onEnable = async () => {
        throw new Error('Plugin enable failed');
      };

      jest.doMock(path.join('./failing-plugin', 'index.js'), () => failingPlugin, { virtual: true });

      mockFs.readFile.mockImplementation((filePath: string) => {
        if (filePath.includes('failing-plugin') && filePath.includes('package.json')) {
          return Promise.resolve(JSON.stringify({
            name: 'failing-plugin',
            version: '1.0.0',
            description: 'Plugin that fails'
          }));
        }
        return Promise.resolve('{}');
      });

      // Load plugin should succeed
      await pluginManager.loadPlugin('./failing-plugin');
      expect(pluginManager.isPluginLoaded('failing-plugin')).toBe(true);

      // Enable should fail but not crash the system
      await expect(pluginManager.enablePlugin('failing-plugin')).rejects.toThrow('Plugin enable failed');
      expect(pluginManager.isPluginEnabled('failing-plugin')).toBe(false);

      // System should still be functional
      const stats = pluginManager.getStatistics();
      expect(stats.pluginsWithErrors).toBe(1);
      expect(stats.isInitialized).toBe(true);
    });

    it('should handle integration errors gracefully', async () => {
      const failingIntegration = new TestIntegration();
      failingIntegration.testConnection = async () => {
        throw new Error('Connection failed');
      };

      await extensionRegistry.registerIntegration('failing-integration', failingIntegration, {});

      // Connection test should fail but not crash
      await expect(
        extensionRegistry.testIntegrationConnection('failing-integration')
      ).rejects.toThrow('Connection failed');

      // System should still be functional
      const stats = extensionRegistry.getStatistics();
      expect(stats.integrationsWithErrors).toBe(1);
      expect(stats.isInitialized).toBe(true);
    });
  });

  describe('system shutdown and cleanup', () => {
    it('should shutdown all components cleanly', async () => {
      // Setup complete system
      await pluginManager.loadPlugin('./test-plugin');
      await pluginManager.enablePlugin('test-plugin');

      const customAgentType: CustomAgentType = {
        name: 'shutdown-agent',
        displayName: 'Shutdown Agent',
        description: 'Agent for shutdown testing',
        baseType: AgentType.DEVOPS,
        capabilities: ['shutdown'],
        defaultConfig: {},
        constructor: TestCustomAgent,
        metadata: {
          version: '1.0.0',
          author: 'Shutdown Test',
          category: 'shutdown',
          tags: ['shutdown']
        }
      };

      extensionRegistry.registerCustomAgentType(customAgentType);
      await extensionRegistry.registerIntegration('shutdown-integration', testIntegration, {});

      // Verify system is running
      expect(pluginManager.getStatistics().isInitialized).toBe(true);
      expect(extensionRegistry.getStatistics().isInitialized).toBe(true);

      // Shutdown systems
      await pluginManager.shutdown();
      await extensionRegistry.shutdown();

      // Verify clean shutdown
      expect(pluginManager.getStatistics().isInitialized).toBe(false);
      expect(pluginManager.getLoadedPlugins()).toHaveLength(0);
      expect(extensionRegistry.getStatistics().isInitialized).toBe(false);
      expect(extensionRegistry.getCustomAgentTypes()).toHaveLength(0);
      expect(extensionRegistry.getIntegrations()).toHaveLength(0);

      // Verify plugin lifecycle was called
      expect(testPlugin.lifecycleEvents).toContain('onUnload');
      expect(testIntegration.isInitialized).toBe(false);
    });
  });
});
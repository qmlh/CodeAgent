/**
 * Extension Registry Tests
 */

import { ExtensionRegistry, CustomAgentType } from '../ExtensionRegistry';
import { IThirdPartyIntegration, IAPIIntegration } from '../IAgentPlugin';
import { AgentType, AgentConfig } from '../../../types/agent.types';
import { BaseAgent } from '../../../agents/BaseAgent';
import { Task, TaskResult } from '../../../types/task.types';

// Mock custom agent for testing
class MockCustomAgent extends BaseAgent {
  constructor(id: string, name: string, type: AgentType, config: AgentConfig) {
    super(id, name, type, config);
  }

  protected async onInitialize(): Promise<void> {
    // Mock implementation
  }

  protected async onExecuteTask(task: Task): Promise<TaskResult> {
    return this.createTaskResult(task.id, true, 'Mock task completed');
  }

  protected async onShutdown(): Promise<void> {
    // Mock implementation
  }

  protected async onConfigUpdate(newConfig: AgentConfig): Promise<void> {
    // Mock implementation
  }
}

// Mock integration for testing
class MockIntegration implements IThirdPartyIntegration {
  public readonly name = 'mock-integration';
  public readonly version = '1.0.0';

  public initializeCalled = false;
  public testConnectionCalled = false;
  public executeCalled = false;
  public cleanupCalled = false;

  async initialize(config: Record<string, any>): Promise<void> {
    this.initializeCalled = true;
  }

  async testConnection(): Promise<{ success: boolean; message: string }> {
    this.testConnectionCalled = true;
    return { success: true, message: 'Connection successful' };
  }

  getCapabilities(): string[] {
    return ['mock-capability'];
  }

  async execute(operation: string, params: Record<string, any>): Promise<any> {
    this.executeCalled = true;
    return { operation, params, result: 'mock-result' };
  }

  async cleanup(): Promise<void> {
    this.cleanupCalled = true;
  }
}

// Mock API integration for testing
class MockAPIIntegration implements IAPIIntegration {
  public readonly name = 'mock-api-integration';
  public readonly version = '1.0.0';
  public readonly baseUrl = 'https://api.mock.com';
  public readonly apiKey = 'mock-api-key';

  public initializeCalled = false;
  public testConnectionCalled = false;
  public makeRequestCalled = false;
  public authenticateCalled = false;

  async initialize(config: Record<string, any>): Promise<void> {
    this.initializeCalled = true;
  }

  async testConnection(): Promise<{ success: boolean; message: string }> {
    this.testConnectionCalled = true;
    return { success: true, message: 'API connection successful' };
  }

  getCapabilities(): string[] {
    return ['api-capability', 'http-requests'];
  }

  async execute(operation: string, params: Record<string, any>): Promise<any> {
    return { operation, params, result: 'api-result' };
  }

  async makeRequest(method: string, endpoint: string, data?: any, headers?: Record<string, string>): Promise<any> {
    this.makeRequestCalled = true;
    return { method, endpoint, data, headers, response: 'mock-response' };
  }

  async getRateLimits(): Promise<{ remaining: number; resetTime: Date }> {
    return { remaining: 100, resetTime: new Date(Date.now() + 3600000) };
  }

  async authenticate(): Promise<boolean> {
    this.authenticateCalled = true;
    return true;
  }

  async cleanup(): Promise<void> {
    // Mock cleanup
  }
}

describe('ExtensionRegistry', () => {
  let extensionRegistry: ExtensionRegistry;
  let mockCustomType: CustomAgentType;
  let mockIntegration: MockIntegration;
  let mockAPIIntegration: MockAPIIntegration;

  beforeEach(async () => {
    extensionRegistry = new ExtensionRegistry();
    await extensionRegistry.initialize();

    mockCustomType = {
      name: 'custom-test-agent',
      displayName: 'Custom Test Agent',
      description: 'A custom agent for testing',
      baseType: AgentType.FRONTEND,
      capabilities: ['custom-capability', 'test-feature'],
      defaultConfig: {
        maxConcurrentTasks: 2,
        timeout: 60000
      },
      constructor: MockCustomAgent,
      metadata: {
        version: '1.0.0',
        author: 'Test Author',
        category: 'testing',
        tags: ['test', 'custom']
      }
    };

    mockIntegration = new MockIntegration();
    mockAPIIntegration = new MockAPIIntegration();
  });

  afterEach(async () => {
    await extensionRegistry.shutdown();
  });

  describe('initialization', () => {
    it('should initialize successfully', async () => {
      const registry = new ExtensionRegistry();
      await registry.initialize();

      expect(registry.getStatistics().isInitialized).toBe(true);
      await registry.shutdown();
    });
  });

  describe('custom agent type management', () => {
    it('should register a custom agent type', () => {
      extensionRegistry.registerCustomAgentType(mockCustomType);

      expect(extensionRegistry.isCustomAgentTypeRegistered('custom-test-agent')).toBe(true);
      
      const retrievedType = extensionRegistry.getCustomAgentType('custom-test-agent');
      expect(retrievedType).toEqual(mockCustomType);
    });

    it('should not register duplicate custom agent types', () => {
      extensionRegistry.registerCustomAgentType(mockCustomType);

      expect(() => {
        extensionRegistry.registerCustomAgentType(mockCustomType);
      }).toThrow('already registered');
    });

    it('should unregister a custom agent type', () => {
      extensionRegistry.registerCustomAgentType(mockCustomType);
      extensionRegistry.unregisterCustomAgentType('custom-test-agent');

      expect(extensionRegistry.isCustomAgentTypeRegistered('custom-test-agent')).toBe(false);
    });

    it('should not unregister non-existent custom agent type', () => {
      expect(() => {
        extensionRegistry.unregisterCustomAgentType('nonexistent');
      }).toThrow('not registered');
    });

    it('should get all custom agent types', () => {
      extensionRegistry.registerCustomAgentType(mockCustomType);

      const customTypes = extensionRegistry.getCustomAgentTypes();
      expect(customTypes).toHaveLength(1);
      expect(customTypes[0]).toEqual(mockCustomType);
    });

    it('should create custom agent instance', () => {
      extensionRegistry.registerCustomAgentType(mockCustomType);

      const agent = extensionRegistry.createCustomAgent('custom-test-agent', {
        name: 'Test Custom Agent',
        capabilities: ['custom-capability']
      });

      expect(agent).toBeInstanceOf(MockCustomAgent);
    });

    it('should not create agent from unregistered type', () => {
      expect(() => {
        extensionRegistry.createCustomAgent('nonexistent', {
          name: 'Test Agent'
        });
      }).toThrow('not registered');
    });
  });

  describe('integration management', () => {
    it('should register an integration', async () => {
      await extensionRegistry.registerIntegration('mock-integration', mockIntegration);

      const integration = extensionRegistry.getIntegration('mock-integration');
      expect(integration).toBeDefined();
      expect(integration?.name).toBe('mock-integration');
    });

    it('should register an integration with initialization', async () => {
      await extensionRegistry.registerIntegration('mock-integration', mockIntegration, { setting: 'value' });

      expect(mockIntegration.initializeCalled).toBe(true);
      
      const integration = extensionRegistry.getIntegration('mock-integration');
      expect(integration?.isInitialized).toBe(true);
    });

    it('should not register duplicate integrations', async () => {
      await extensionRegistry.registerIntegration('mock-integration', mockIntegration);

      await expect(
        extensionRegistry.registerIntegration('mock-integration', new MockIntegration())
      ).rejects.toThrow('already registered');
    });

    it('should unregister an integration', async () => {
      await extensionRegistry.registerIntegration('mock-integration', mockIntegration);
      await extensionRegistry.unregisterIntegration('mock-integration');

      expect(mockIntegration.cleanupCalled).toBe(true);
      expect(extensionRegistry.getIntegration('mock-integration')).toBeNull();
    });

    it('should initialize an integration', async () => {
      await extensionRegistry.registerIntegration('mock-integration', mockIntegration);
      await extensionRegistry.initializeIntegration('mock-integration', { setting: 'value' });

      expect(mockIntegration.initializeCalled).toBe(true);
      
      const integration = extensionRegistry.getIntegration('mock-integration');
      expect(integration?.isInitialized).toBe(true);
    });

    it('should test integration connection', async () => {
      await extensionRegistry.registerIntegration('mock-integration', mockIntegration, { setting: 'value' });
      
      const result = await extensionRegistry.testIntegrationConnection('mock-integration');

      expect(mockIntegration.testConnectionCalled).toBe(true);
      expect(result.success).toBe(true);
      expect(result.message).toBe('Connection successful');
    });

    it('should execute integration operation', async () => {
      await extensionRegistry.registerIntegration('mock-integration', mockIntegration, { setting: 'value' });
      
      const result = await extensionRegistry.executeIntegrationOperation(
        'mock-integration',
        'test-operation',
        { param: 'value' }
      );

      expect(mockIntegration.executeCalled).toBe(true);
      expect(result.operation).toBe('test-operation');
      expect(result.params).toEqual({ param: 'value' });
    });

    it('should get integration capabilities', async () => {
      await extensionRegistry.registerIntegration('mock-integration', mockIntegration);

      const capabilities = extensionRegistry.getIntegrationCapabilities('mock-integration');
      expect(capabilities).toEqual(['mock-capability']);
    });
  });

  describe('API integration management', () => {
    it('should register API integration', async () => {
      await extensionRegistry.registerIntegration('mock-api', mockAPIIntegration);

      const apiIntegrations = extensionRegistry.getAPIIntegrations();
      expect(apiIntegrations.has('mock-api')).toBe(true);
    });

    it('should make API request through integration', async () => {
      await extensionRegistry.registerIntegration('mock-api', mockAPIIntegration, { setting: 'value' });

      const result = await extensionRegistry.makeAPIRequest(
        'mock-api',
        'GET',
        '/test',
        { data: 'test' },
        { 'Custom-Header': 'value' }
      );

      expect(mockAPIIntegration.makeRequestCalled).toBe(true);
      expect(result.method).toBe('GET');
      expect(result.endpoint).toBe('/test');
    });

    it('should get API integration by name', async () => {
      await extensionRegistry.registerIntegration('mock-api', mockAPIIntegration);

      const apiIntegration = extensionRegistry.getAPIIntegration('mock-api');
      expect(apiIntegration).toBe(mockAPIIntegration);
    });
  });

  describe('statistics and management', () => {
    it('should provide accurate statistics', async () => {
      extensionRegistry.registerCustomAgentType(mockCustomType);
      await extensionRegistry.registerIntegration('mock-integration', mockIntegration, { setting: 'value' });
      await extensionRegistry.registerIntegration('mock-api', mockAPIIntegration, { setting: 'value' });

      const stats = extensionRegistry.getStatistics();

      expect(stats.customAgentTypes).toBe(1);
      expect(stats.totalIntegrations).toBe(2);
      expect(stats.initializedIntegrations).toBe(2);
      expect(stats.apiIntegrations).toBe(1);
      expect(stats.isInitialized).toBe(true);
    });

    it('should get all integrations', async () => {
      await extensionRegistry.registerIntegration('mock-integration', mockIntegration);
      await extensionRegistry.registerIntegration('mock-api', mockAPIIntegration);

      const integrations = extensionRegistry.getIntegrations();
      expect(integrations).toHaveLength(2);
    });
  });

  describe('error handling', () => {
    it('should handle invalid custom agent type', () => {
      const invalidType = {
        ...mockCustomType,
        name: '', // Invalid empty name
      };

      expect(() => {
        extensionRegistry.registerCustomAgentType(invalidType);
      }).toThrow('Invalid custom agent type');
    });

    it('should handle integration not found errors', async () => {
      await expect(
        extensionRegistry.initializeIntegration('nonexistent', {})
      ).rejects.toThrow('not registered');

      await expect(
        extensionRegistry.testIntegrationConnection('nonexistent')
      ).rejects.toThrow('not registered');

      await expect(
        extensionRegistry.executeIntegrationOperation('nonexistent', 'test', {})
      ).rejects.toThrow('not registered');
    });

    it('should handle uninitialized integration errors', async () => {
      await extensionRegistry.registerIntegration('mock-integration', mockIntegration);

      await expect(
        extensionRegistry.testIntegrationConnection('mock-integration')
      ).rejects.toThrow('not initialized');

      await expect(
        extensionRegistry.executeIntegrationOperation('mock-integration', 'test', {})
      ).rejects.toThrow('not initialized');
    });
  });

  describe('shutdown', () => {
    it('should shutdown cleanly', async () => {
      extensionRegistry.registerCustomAgentType(mockCustomType);
      await extensionRegistry.registerIntegration('mock-integration', mockIntegration);

      await extensionRegistry.shutdown();

      expect(mockIntegration.cleanupCalled).toBe(true);
      expect(extensionRegistry.getStatistics().isInitialized).toBe(false);
      expect(extensionRegistry.getCustomAgentTypes()).toHaveLength(0);
      expect(extensionRegistry.getIntegrations()).toHaveLength(0);
    });
  });
});
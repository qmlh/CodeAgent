/**
 * Plugin Manager Tests
 */

import { PluginManager } from '../PluginManager';
import { IAgentPlugin, PluginMetadata, PluginConfig } from '../IAgentPlugin';
import { AgentType, AgentConfig } from '../../../types/agent.types';
import { BaseAgent } from '../../../agents/BaseAgent';
import * as fs from 'fs/promises';
import * as path from 'path';

// Mock fs module
jest.mock('fs/promises');
const mockFs = fs as jest.Mocked<typeof fs>;

// Mock plugin for testing
class MockPlugin implements IAgentPlugin {
  public readonly metadata: PluginMetadata = {
    name: 'mock-plugin',
    version: '1.0.0',
    description: 'Mock plugin for testing',
    author: 'Test Author'
  };

  public readonly config: PluginConfig = {
    enabled: true,
    settings: {},
    permissions: {}
  };

  public onLoadCalled = false;
  public onUnloadCalled = false;
  public onEnableCalled = false;
  public onDisableCalled = false;

  async onLoad(): Promise<void> {
    this.onLoadCalled = true;
  }

  async onUnload(): Promise<void> {
    this.onUnloadCalled = true;
  }

  async onEnable(): Promise<void> {
    this.onEnableCalled = true;
  }

  async onDisable(): Promise<void> {
    this.onDisableCalled = true;
  }

  getSupportedAgentTypes(): AgentType[] {
    return [AgentType.FRONTEND];
  }

  createAgent(id: string, name: string, type: AgentType, config: AgentConfig): BaseAgent {
    // Return a mock agent for testing
    return {} as BaseAgent;
  }

  canCreateAgent(type: AgentType): boolean {
    return type === AgentType.FRONTEND;
  }

  getDefaultAgentConfig(type: AgentType): Partial<AgentConfig> {
    return {
      capabilities: ['mock-capability'],
      maxConcurrentTasks: 1
    };
  }

  getAgentCapabilities(type: AgentType): string[] {
    return ['mock-capability'];
  }

  validateAgentConfig(type: AgentType, config: AgentConfig): { isValid: boolean; errors: string[] } {
    return { isValid: true, errors: [] };
  }
}

describe('PluginManager', () => {
  let pluginManager: PluginManager;
  let mockPlugin: MockPlugin;

  beforeEach(() => {
    pluginManager = new PluginManager();
    mockPlugin = new MockPlugin();
    jest.clearAllMocks();
  });

  afterEach(async () => {
    await pluginManager.shutdown();
  });

  describe('initialization', () => {
    it('should initialize successfully', async () => {
      mockFs.access.mockResolvedValue(undefined);
      mockFs.readdir.mockResolvedValue([]);

      await pluginManager.initialize([]);

      expect(pluginManager.getStatistics().isInitialized).toBe(true);
    });

    it('should handle missing plugin directories gracefully', async () => {
      mockFs.access.mockRejectedValue(new Error('Directory not found'));

      await expect(pluginManager.initialize(['./nonexistent'])).resolves.not.toThrow();
    });
  });

  describe('plugin discovery', () => {
    it('should discover valid plugins', async () => {
      const mockDirEntries = [
        { name: 'plugin1', isDirectory: () => true },
        { name: 'plugin2', isDirectory: () => true },
        { name: 'file.txt', isDirectory: () => false }
      ] as any[];

      mockFs.access.mockResolvedValue(undefined);
      mockFs.readdir.mockResolvedValue(mockDirEntries);
      mockFs.stat.mockResolvedValue({ isDirectory: () => true } as any);
      mockFs.readFile.mockImplementation((filePath: string) => {
        if (filePath.includes('package.json')) {
          return Promise.resolve(JSON.stringify({
            name: 'test-plugin',
            version: '1.0.0',
            description: 'Test plugin'
          }));
        }
        return Promise.reject(new Error('File not found'));
      });

      const results = await pluginManager.discoverPlugins(['./plugins']);

      expect(results).toHaveLength(2);
      expect(results[0].metadata.name).toBe('test-plugin');
    });

    it('should handle invalid plugin directories', async () => {
      const mockDirEntries = [
        { name: 'invalid-plugin', isDirectory: () => true }
      ] as any[];

      mockFs.access.mockResolvedValue(undefined);
      mockFs.readdir.mockResolvedValue(mockDirEntries);
      mockFs.stat.mockResolvedValue({ isDirectory: () => true } as any);
      mockFs.readFile.mockRejectedValue(new Error('package.json not found'));

      const results = await pluginManager.discoverPlugins(['./plugins']);

      expect(results).toHaveLength(1);
      expect(results[0].isValid).toBe(false);
      expect(results[0].errors).toContain('Invalid or missing package.json');
    });
  });

  describe('plugin loading', () => {
    beforeEach(() => {
      // Mock require to return our mock plugin
      jest.doMock(path.join('./test-plugin', 'index.js'), () => mockPlugin, { virtual: true });
    });

    it('should load a valid plugin', async () => {
      mockFs.stat.mockResolvedValue({ isDirectory: () => true } as any);
      mockFs.readFile.mockImplementation((filePath: string) => {
        if (filePath.includes('package.json')) {
          return Promise.resolve(JSON.stringify({
            name: 'mock-plugin',
            version: '1.0.0',
            description: 'Mock plugin'
          }));
        }
        if (filePath.includes('plugin.config.json')) {
          return Promise.resolve(JSON.stringify({
            enabled: true,
            settings: {}
          }));
        }
        return Promise.reject(new Error('File not found'));
      });
      mockFs.access.mockResolvedValue(undefined);

      await pluginManager.loadPlugin('./test-plugin');

      expect(mockPlugin.onLoadCalled).toBe(true);
      expect(pluginManager.isPluginLoaded('mock-plugin')).toBe(true);
    });

    it('should not load duplicate plugins', async () => {
      mockFs.stat.mockResolvedValue({ isDirectory: () => true } as any);
      mockFs.readFile.mockImplementation((filePath: string) => {
        if (filePath.includes('package.json')) {
          return Promise.resolve(JSON.stringify({
            name: 'mock-plugin',
            version: '1.0.0',
            description: 'Mock plugin'
          }));
        }
        return Promise.resolve('{}');
      });
      mockFs.access.mockResolvedValue(undefined);

      await pluginManager.loadPlugin('./test-plugin');

      await expect(pluginManager.loadPlugin('./test-plugin')).rejects.toThrow('already loaded');
    });
  });

  describe('plugin lifecycle', () => {
    beforeEach(async () => {
      // Setup a loaded plugin
      mockFs.stat.mockResolvedValue({ isDirectory: () => true } as any);
      mockFs.readFile.mockImplementation((filePath: string) => {
        if (filePath.includes('package.json')) {
          return Promise.resolve(JSON.stringify({
            name: 'mock-plugin',
            version: '1.0.0',
            description: 'Mock plugin'
          }));
        }
        return Promise.resolve('{}');
      });
      mockFs.access.mockResolvedValue(undefined);
      mockFs.writeFile.mockResolvedValue(undefined);

      jest.doMock(path.join('./test-plugin', 'index.js'), () => mockPlugin, { virtual: true });
      await pluginManager.loadPlugin('./test-plugin');
    });

    it('should enable a plugin', async () => {
      await pluginManager.enablePlugin('mock-plugin');

      expect(mockPlugin.onEnableCalled).toBe(true);
      expect(pluginManager.isPluginEnabled('mock-plugin')).toBe(true);
    });

    it('should disable a plugin', async () => {
      await pluginManager.enablePlugin('mock-plugin');
      await pluginManager.disablePlugin('mock-plugin');

      expect(mockPlugin.onDisableCalled).toBe(true);
      expect(pluginManager.isPluginEnabled('mock-plugin')).toBe(false);
    });

    it('should unload a plugin', async () => {
      await pluginManager.enablePlugin('mock-plugin');
      await pluginManager.unloadPlugin('mock-plugin');

      expect(mockPlugin.onUnloadCalled).toBe(true);
      expect(pluginManager.isPluginLoaded('mock-plugin')).toBe(false);
    });

    it('should update plugin configuration', async () => {
      const newConfig = {
        enabled: false,
        settings: { newSetting: 'value' }
      };

      await pluginManager.updatePluginConfig('mock-plugin', newConfig);

      const plugin = pluginManager.getPlugin('mock-plugin');
      expect(plugin?.config.enabled).toBe(false);
      expect(plugin?.config.settings?.newSetting).toBe('value');
    });
  });

  describe('agent type management', () => {
    beforeEach(async () => {
      mockFs.stat.mockResolvedValue({ isDirectory: () => true } as any);
      mockFs.readFile.mockImplementation((filePath: string) => {
        if (filePath.includes('package.json')) {
          return Promise.resolve(JSON.stringify({
            name: 'mock-plugin',
            version: '1.0.0',
            description: 'Mock plugin'
          }));
        }
        return Promise.resolve('{}');
      });
      mockFs.access.mockResolvedValue(undefined);

      jest.doMock(path.join('./test-plugin', 'index.js'), () => mockPlugin, { virtual: true });
      await pluginManager.loadPlugin('./test-plugin');
      await pluginManager.enablePlugin('mock-plugin');
    });

    it('should get plugins for agent type', () => {
      const plugins = pluginManager.getPluginsForAgentType(AgentType.FRONTEND);

      expect(plugins).toHaveLength(1);
      expect(plugins[0].metadata.name).toBe('mock-plugin');
    });

    it('should create agent with plugin', async () => {
      const agent = await pluginManager.createAgentWithPlugin(
        'mock-plugin',
        'test-id',
        'Test Agent',
        AgentType.FRONTEND,
        {
          name: 'Test Agent',
          type: AgentType.FRONTEND,
          capabilities: ['mock-capability'],
          maxConcurrentTasks: 1,
          timeout: 30000,
          retryAttempts: 3
        }
      );

      expect(agent).toBeDefined();
    });

    it('should not create agent with disabled plugin', async () => {
      await pluginManager.disablePlugin('mock-plugin');

      await expect(pluginManager.createAgentWithPlugin(
        'mock-plugin',
        'test-id',
        'Test Agent',
        AgentType.FRONTEND,
        {
          name: 'Test Agent',
          type: AgentType.FRONTEND,
          capabilities: ['mock-capability'],
          maxConcurrentTasks: 1,
          timeout: 30000,
          retryAttempts: 3
        }
      )).rejects.toThrow('not enabled');
    });
  });

  describe('statistics and management', () => {
    it('should provide accurate statistics', () => {
      const stats = pluginManager.getStatistics();

      expect(stats).toHaveProperty('totalPlugins');
      expect(stats).toHaveProperty('enabledPlugins');
      expect(stats).toHaveProperty('disabledPlugins');
      expect(stats).toHaveProperty('pluginsWithErrors');
      expect(stats).toHaveProperty('agentTypeProviders');
      expect(stats).toHaveProperty('isInitialized');
    });

    it('should get loaded plugins', () => {
      const plugins = pluginManager.getLoadedPlugins();
      expect(Array.isArray(plugins)).toBe(true);
    });

    it('should get enabled plugins', () => {
      const plugins = pluginManager.getEnabledPlugins();
      expect(Array.isArray(plugins)).toBe(true);
    });
  });

  describe('error handling', () => {
    it('should handle plugin loading errors', async () => {
      mockFs.stat.mockRejectedValue(new Error('Directory not found'));

      await expect(pluginManager.loadPlugin('./nonexistent')).rejects.toThrow();
    });

    it('should handle plugin not found errors', async () => {
      await expect(pluginManager.enablePlugin('nonexistent')).rejects.toThrow('not loaded');
      await expect(pluginManager.disablePlugin('nonexistent')).rejects.toThrow('not loaded');
      await expect(pluginManager.unloadPlugin('nonexistent')).rejects.toThrow('not loaded');
    });
  });

  describe('shutdown', () => {
    it('should shutdown cleanly', async () => {
      await pluginManager.shutdown();

      expect(pluginManager.getStatistics().isInitialized).toBe(false);
      expect(pluginManager.getLoadedPlugins()).toHaveLength(0);
    });
  });
});
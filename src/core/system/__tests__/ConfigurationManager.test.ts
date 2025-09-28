/**
 * Configuration Manager Tests
 */

import { ConfigurationManager, ConfigurationSource } from '../ConfigurationManager';
import { SystemConfig, ProjectConfig, WorkflowConfig } from '../../../types/config.types';
import { SystemError } from '../../errors/SystemError';
import * as fs from 'fs/promises';
import * as path from 'path';

// Mock fs module
jest.mock('fs/promises');
const mockFs = fs as jest.Mocked<typeof fs>;

describe('ConfigurationManager', () => {
  let configManager: ConfigurationManager;
  let tempDir: string;

  beforeEach(() => {
    jest.clearAllMocks();
    tempDir = '/tmp/test-config';
    
    configManager = new ConfigurationManager({
      system: path.join(tempDir, 'system.json'),
      project: path.join(tempDir, 'project.json'),
      workflows: path.join(tempDir, 'workflows')
    });

    // Mock fs operations
    mockFs.readFile.mockImplementation(async (filePath: any) => {
      if (filePath.includes('system.json')) {
        return JSON.stringify({
          maxAgents: 15,
          maxConcurrentTasks: 75,
          taskTimeout: 400000,
          fileLockTimeout: 60000,
          heartbeatInterval: 30000,
          retryAttempts: 3,
          logLevel: 'debug'
        });
      }
      if (filePath.includes('project.json')) {
        return JSON.stringify({
          name: 'Test Project',
          rootPath: '/test/project',
          collaborationMode: 'parallel'
        });
      }
      throw { code: 'ENOENT' };
    });

    mockFs.writeFile.mockResolvedValue(undefined);
    mockFs.mkdir.mockResolvedValue(undefined);
    mockFs.readdir.mockResolvedValue([]);
    mockFs.unlink.mockResolvedValue(undefined);
  });

  afterEach(async () => {
    if (configManager) {
      try {
        await configManager.shutdown();
      } catch (error) {
        // Ignore shutdown errors in tests
      }
    }
  });

  describe('initialization', () => {
    it('should initialize successfully', async () => {
      await expect(configManager.initialize()).resolves.not.toThrow();
    });

    it('should load system configuration from file', async () => {
      await configManager.initialize();
      
      const systemConfig = configManager.getSystemConfig();
      expect(systemConfig.maxAgents).toBe(15);
      expect(systemConfig.maxConcurrentTasks).toBe(75);
      expect(systemConfig.taskTimeout).toBe(400000);
      expect(systemConfig.logLevel).toBe('debug');
    });

    it('should load project configuration from file', async () => {
      await configManager.initialize();
      
      const projectConfig = configManager.getProjectConfig();
      expect(projectConfig).toBeDefined();
      expect(projectConfig!.name).toBe('Test Project');
      expect(projectConfig!.rootPath).toBe('/test/project');
      expect(projectConfig!.collaborationMode).toBe('parallel');
    });

    it('should create default system config when file does not exist', async () => {
      mockFs.readFile.mockRejectedValue({ code: 'ENOENT' });
      
      await configManager.initialize();
      
      const systemConfig = configManager.getSystemConfig();
      expect(systemConfig).toBeDefined();
      expect(systemConfig.maxAgents).toBe(10); // Default value
      expect(mockFs.writeFile).toHaveBeenCalled();
    });

    it('should handle missing project config gracefully', async () => {
      mockFs.readFile.mockImplementation(async (filePath: any) => {
        if (filePath.includes('system.json')) {
          return JSON.stringify({ maxAgents: 10 });
        }
        throw { code: 'ENOENT' };
      });

      await configManager.initialize();
      
      const projectConfig = configManager.getProjectConfig();
      expect(projectConfig).toBeUndefined();
    });

    it('should emit initialized event', async () => {
      const initializedSpy = jest.fn();
      configManager.on('initialized', initializedSpy);

      await configManager.initialize();

      expect(initializedSpy).toHaveBeenCalled();
    });

    it('should not initialize twice', async () => {
      await configManager.initialize();
      
      // Second initialization should not throw but should return immediately
      await expect(configManager.initialize()).resolves.not.toThrow();
    });
  });

  describe('system configuration', () => {
    beforeEach(async () => {
      await configManager.initialize();
    });

    it('should get system configuration', () => {
      const config = configManager.getSystemConfig();
      
      expect(config).toBeDefined();
      expect(config.maxAgents).toBeDefined();
      expect(config.maxConcurrentTasks).toBeDefined();
      expect(config.taskTimeout).toBeDefined();
    });

    it('should update system configuration', async () => {
      const updates: Partial<SystemConfig> = {
        maxAgents: 20,
        logLevel: 'warn'
      };

      await configManager.updateSystemConfig(updates);

      const config = configManager.getSystemConfig();
      expect(config.maxAgents).toBe(20);
      expect(config.logLevel).toBe('warn');
      expect(mockFs.writeFile).toHaveBeenCalled();
    });

    it('should emit system config updated event', async () => {
      const updatedSpy = jest.fn();
      configManager.on('system_config_updated', updatedSpy);

      const updates = { maxAgents: 25 };
      await configManager.updateSystemConfig(updates);

      expect(updatedSpy).toHaveBeenCalledWith(expect.objectContaining(updates));
    });

    it('should validate system configuration updates', async () => {
      const invalidUpdates = {
        maxAgents: -5, // Invalid value
        logLevel: 'invalid' as any
      };

      await expect(
        configManager.updateSystemConfig(invalidUpdates)
      ).rejects.toThrow(SystemError);
    });
  });

  describe('project configuration', () => {
    beforeEach(async () => {
      await configManager.initialize();
    });

    it('should set project configuration', async () => {
      const projectConfig: ProjectConfig = {
        name: 'New Project',
        rootPath: '/new/project',
        collaborationMode: 'hybrid',
        codeStandards: { eslint: true },
        reviewProcess: {
          required: true,
          reviewers: ['reviewer1'],
          autoApprove: false
        },
        qualityStandards: {
          testCoverage: 80,
          codeComplexity: 10,
          documentation: true
        }
      };

      await configManager.setProjectConfig(projectConfig);

      const config = configManager.getProjectConfig();
      expect(config).toEqual(projectConfig);
    });

    it('should emit project config updated event', async () => {
      const updatedSpy = jest.fn();
      configManager.on('project_config_updated', updatedSpy);

      const projectConfig: ProjectConfig = {
        name: 'Test Project',
        rootPath: '/test',
        collaborationMode: 'serial',
        codeStandards: {},
        reviewProcess: { required: false, reviewers: [], autoApprove: true },
        qualityStandards: { testCoverage: 70, codeComplexity: 15, documentation: false }
      };

      await configManager.setProjectConfig(projectConfig);

      expect(updatedSpy).toHaveBeenCalledWith(projectConfig);
    });

    it('should validate project configuration', async () => {
      const invalidConfig = {
        name: '', // Invalid empty name
        rootPath: '/test',
        collaborationMode: 'invalid' as any
      };

      await expect(
        configManager.setProjectConfig(invalidConfig as ProjectConfig)
      ).rejects.toThrow(SystemError);
    });
  });

  describe('workflow configuration', () => {
    beforeEach(async () => {
      await configManager.initialize();
    });

    it('should set workflow configuration', async () => {
      const workflowConfig: WorkflowConfig = {
        id: 'test-workflow',
        name: 'Test Workflow',
        steps: [
          {
            id: 'step1',
            name: 'Step 1',
            action: 'test-action',
            parameters: {},
            dependencies: []
          }
        ],
        triggers: [],
        conditions: []
      };

      await configManager.setWorkflowConfig(workflowConfig);

      const config = configManager.getWorkflowConfig('test-workflow');
      expect(config).toEqual(workflowConfig);
    });

    it('should get all workflow configurations', async () => {
      const workflow1: WorkflowConfig = {
        id: 'workflow1',
        name: 'Workflow 1',
        steps: [],
        triggers: [],
        conditions: []
      };

      const workflow2: WorkflowConfig = {
        id: 'workflow2',
        name: 'Workflow 2',
        steps: [],
        triggers: [],
        conditions: []
      };

      await configManager.setWorkflowConfig(workflow1);
      await configManager.setWorkflowConfig(workflow2);

      const allConfigs = configManager.getAllWorkflowConfigs();
      expect(allConfigs).toHaveLength(2);
      expect(allConfigs.find(c => c.id === 'workflow1')).toEqual(workflow1);
      expect(allConfigs.find(c => c.id === 'workflow2')).toEqual(workflow2);
    });

    it('should remove workflow configuration', async () => {
      const workflowConfig: WorkflowConfig = {
        id: 'removable-workflow',
        name: 'Removable Workflow',
        steps: [],
        triggers: [],
        conditions: []
      };

      await configManager.setWorkflowConfig(workflowConfig);
      expect(configManager.getWorkflowConfig('removable-workflow')).toBeDefined();

      const removed = await configManager.removeWorkflowConfig('removable-workflow');
      expect(removed).toBe(true);
      expect(configManager.getWorkflowConfig('removable-workflow')).toBeUndefined();
    });

    it('should return false when removing non-existent workflow', async () => {
      const removed = await configManager.removeWorkflowConfig('non-existent');
      expect(removed).toBe(false);
    });

    it('should emit workflow config events', async () => {
      const updatedSpy = jest.fn();
      const removedSpy = jest.fn();
      
      configManager.on('workflow_config_updated', updatedSpy);
      configManager.on('workflow_config_removed', removedSpy);

      const workflowConfig: WorkflowConfig = {
        id: 'event-workflow',
        name: 'Event Workflow',
        steps: [],
        triggers: [],
        conditions: []
      };

      await configManager.setWorkflowConfig(workflowConfig);
      expect(updatedSpy).toHaveBeenCalledWith(workflowConfig);

      await configManager.removeWorkflowConfig('event-workflow');
      expect(removedSpy).toHaveBeenCalledWith('event-workflow');
    });
  });

  describe('generic configuration', () => {
    beforeEach(async () => {
      await configManager.initialize();
    });

    it('should set and get configuration values', async () => {
      await configManager.set('test.key', 'test-value');
      
      const value = configManager.get('test.key');
      expect(value).toBe('test-value');
    });

    it('should return default value when key not found', () => {
      const value = configManager.get('non.existent.key', 'default');
      expect(value).toBe('default');
    });

    it('should emit configuration changed event', async () => {
      const changedSpy = jest.fn();
      configManager.on('configuration_changed', changedSpy);

      await configManager.set('test.key', 'test-value');

      expect(changedSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          key: 'test.key',
          value: 'test-value',
          source: ConfigurationSource.RUNTIME
        })
      );
    });

    it('should get all configurations', async () => {
      await configManager.set('key1', 'value1');
      await configManager.set('key2', 'value2');

      const allConfigs = configManager.getAllConfigurations();
      expect(allConfigs).toHaveLength(2);
      expect(allConfigs.find(c => c.key === 'key1')?.value).toBe('value1');
      expect(allConfigs.find(c => c.key === 'key2')?.value).toBe('value2');
    });
  });

  describe('validation', () => {
    beforeEach(async () => {
      await configManager.initialize();
    });

    it('should validate configuration against schema', async () => {
      const validConfig = {
        maxAgents: 10,
        maxConcurrentTasks: 50,
        taskTimeout: 300000,
        fileLockTimeout: 60000,
        heartbeatInterval: 30000,
        retryAttempts: 3,
        logLevel: 'info'
      };

      await expect(
        configManager.validateConfiguration('system', validConfig)
      ).resolves.toBe(true);
    });

    it('should reject invalid configuration', async () => {
      const invalidConfig = {
        maxAgents: -1, // Invalid negative value
        logLevel: 'invalid' // Invalid log level
      };

      await expect(
        configManager.validateConfiguration('system', invalidConfig)
      ).rejects.toThrow(SystemError);
    });

    it('should reject configuration with missing required fields', async () => {
      const incompleteConfig = {
        maxAgents: 10
        // Missing other required fields
      };

      await expect(
        configManager.validateConfiguration('system', incompleteConfig)
      ).rejects.toThrow(SystemError);
    });

    it('should throw error for unknown schema', async () => {
      await expect(
        configManager.validateConfiguration('unknown-schema', {})
      ).rejects.toThrow(SystemError);
    });
  });

  describe('import/export', () => {
    beforeEach(async () => {
      await configManager.initialize();
    });

    it('should export configuration', async () => {
      const exportPath = '/tmp/export.json';
      
      await configManager.exportConfiguration(exportPath);

      expect(mockFs.writeFile).toHaveBeenCalledWith(
        exportPath,
        expect.stringContaining('systemConfig')
      );
    });

    it('should import configuration', async () => {
      const importData = {
        systemConfig: { maxAgents: 30 },
        projectConfig: { name: 'Imported Project', rootPath: '/imported', collaborationMode: 'serial' as const },
        workflowConfigs: [],
        configurations: [],
        exportedAt: new Date().toISOString()
      };

      mockFs.readFile.mockResolvedValueOnce(JSON.stringify(importData));

      await configManager.importConfiguration('/tmp/import.json');

      const systemConfig = configManager.getSystemConfig();
      expect(systemConfig.maxAgents).toBe(30);

      const projectConfig = configManager.getProjectConfig();
      expect(projectConfig?.name).toBe('Imported Project');
    });

    it('should emit import/export events', async () => {
      const exportedSpy = jest.fn();
      const importedSpy = jest.fn();
      
      configManager.on('configuration_exported', exportedSpy);
      configManager.on('configuration_imported', importedSpy);

      await configManager.exportConfiguration('/tmp/export.json');
      expect(exportedSpy).toHaveBeenCalledWith('/tmp/export.json');

      mockFs.readFile.mockResolvedValueOnce(JSON.stringify({
        systemConfig: {},
        exportedAt: new Date().toISOString()
      }));

      await configManager.importConfiguration('/tmp/import.json');
      expect(importedSpy).toHaveBeenCalledWith('/tmp/import.json');
    });

    it('should handle import errors', async () => {
      mockFs.readFile.mockRejectedValueOnce(new Error('File not found'));

      await expect(
        configManager.importConfiguration('/tmp/nonexistent.json')
      ).rejects.toThrow(SystemError);
    });
  });

  describe('shutdown', () => {
    beforeEach(async () => {
      await configManager.initialize();
    });

    it('should shutdown successfully', async () => {
      const shutdownSpy = jest.fn();
      configManager.on('shutdown', shutdownSpy);

      await configManager.shutdown();

      expect(shutdownSpy).toHaveBeenCalled();
    });

    it('should not fail when shutting down non-initialized manager', async () => {
      const uninitializedManager = new ConfigurationManager();
      
      await expect(uninitializedManager.shutdown()).resolves.not.toThrow();
    });
  });
});
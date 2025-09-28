/**
 * Environment Manager Tests
 */

import { EnvironmentManager, EnvironmentInfo, EnvironmentRequirement } from '../EnvironmentManager';
import { SystemError } from '../../errors/SystemError';
import * as os from 'os';
import * as fs from 'fs/promises';

// Mock os and fs modules
jest.mock('os');
jest.mock('fs/promises');

const mockOs = os as jest.Mocked<typeof os>;
const mockFs = fs as jest.Mocked<typeof fs>;

describe('EnvironmentManager', () => {
  let environmentManager: EnvironmentManager;

  beforeEach(() => {
    jest.clearAllMocks();
    environmentManager = new EnvironmentManager();

    // Setup default mocks
    mockOs.platform.mockReturnValue('linux');
    mockOs.arch.mockReturnValue('x64');
    mockOs.type.mockReturnValue('Linux');
    mockOs.release.mockReturnValue('5.4.0');
    mockOs.version.mockReturnValue('#1 SMP Ubuntu 20.04');
    mockOs.totalmem.mockReturnValue(8 * 1024 * 1024 * 1024); // 8GB
    mockOs.freemem.mockReturnValue(4 * 1024 * 1024 * 1024); // 4GB
    mockOs.cpus.mockReturnValue(Array(4).fill({ model: 'Test CPU' }) as any);
    mockOs.homedir.mockReturnValue('/home/test');
    mockOs.tmpdir.mockReturnValue('/tmp');
    mockOs.hostname.mockReturnValue('test-host');
    mockOs.networkInterfaces.mockReturnValue({
      eth0: [{
        address: '192.168.1.100',
        netmask: '255.255.255.0',
        family: 'IPv4',
        mac: '00:00:00:00:00:00',
        internal: false,
        cidr: '192.168.1.100/24'
      }]
    });
    mockOs.loadavg.mockReturnValue([1.0, 1.5, 2.0]);

    // Mock fs operations
    mockFs.mkdir.mockResolvedValue(undefined);
    mockFs.writeFile.mockResolvedValue(undefined);
    mockFs.readFile.mockResolvedValue('test content');
    mockFs.chmod.mockResolvedValue(undefined);
    mockFs.rm.mockResolvedValue(undefined);
    mockFs.stat.mockResolvedValue({ isDirectory: () => true } as any);

    // Mock process properties
    Object.defineProperty(process, 'version', { value: 'v18.0.0', configurable: true });
    Object.defineProperty(process, 'cwd', { value: jest.fn().mockReturnValue('/test/project'), configurable: true });
    Object.defineProperty(process, 'memoryUsage', {
      value: jest.fn().mockReturnValue({
        rss: 100 * 1024 * 1024,
        heapTotal: 50 * 1024 * 1024,
        heapUsed: 30 * 1024 * 1024,
        external: 5 * 1024 * 1024,
        arrayBuffers: 2 * 1024 * 1024
      }),
      configurable: true
    });
    Object.defineProperty(process, 'cpuUsage', {
      value: jest.fn().mockReturnValue({ user: 1000000, system: 500000 }),
      configurable: true
    });
    Object.defineProperty(process, 'hrtime', {
      value: jest.fn().mockReturnValue([1, 0]),
      configurable: true
    });
  });

  afterEach(async () => {
    if (environmentManager) {
      try {
        await environmentManager.shutdown();
      } catch (error) {
        // Ignore shutdown errors in tests
      }
    }
  });

  describe('initialization', () => {
    it('should initialize successfully', async () => {
      await expect(environmentManager.initialize()).resolves.not.toThrow();
    });

    it('should gather environment information', async () => {
      await environmentManager.initialize();
      
      const envInfo = environmentManager.getEnvironmentInfo();
      expect(envInfo).toBeDefined();
      expect(envInfo!.platform).toBe('linux');
      expect(envInfo!.architecture).toBe('x64');
      expect(envInfo!.nodeVersion).toBe('v18.0.0');
      expect(envInfo!.operatingSystem.totalMemory).toBe(8 * 1024 * 1024 * 1024);
    });

    it('should emit initialized event', async () => {
      const initializedSpy = jest.fn();
      environmentManager.on('initialized', initializedSpy);

      await environmentManager.initialize();

      expect(initializedSpy).toHaveBeenCalledWith(expect.any(Object));
    });

    it('should not initialize twice', async () => {
      await environmentManager.initialize();
      
      // Second initialization should not throw
      await expect(environmentManager.initialize()).resolves.not.toThrow();
    });

    it('should handle initialization errors', async () => {
      // Mock an error in environment gathering
      mockOs.platform.mockImplementation(() => {
        throw new Error('OS error');
      });

      await expect(environmentManager.initialize()).rejects.toThrow(SystemError);
    });
  });

  describe('environment validation', () => {
    beforeEach(async () => {
      await environmentManager.initialize();
    });

    it('should validate environment successfully with default requirements', async () => {
      const results = await environmentManager.validateEnvironment();
      
      expect(results.size).toBeGreaterThan(0);
      
      // Check that Node.js version requirement passes
      const nodeVersionResult = results.get('node_version');
      expect(nodeVersionResult).toBeDefined();
      expect(nodeVersionResult!.passed).toBe(true);
    });

    it('should fail validation for insufficient Node.js version', async () => {
      // Mock old Node.js version
      Object.defineProperty(process, 'version', { value: 'v14.0.0', configurable: true });
      
      // Re-initialize to pick up the new version
      await environmentManager.shutdown();
      environmentManager = new EnvironmentManager();
      await environmentManager.initialize();

      await expect(environmentManager.validateEnvironment()).rejects.toThrow(SystemError);
    });

    it('should fail validation for insufficient memory', async () => {
      // Mock low memory
      mockOs.freemem.mockReturnValue(1 * 1024 * 1024 * 1024); // 1GB
      
      await environmentManager.shutdown();
      environmentManager = new EnvironmentManager();
      await environmentManager.initialize();

      await expect(environmentManager.validateEnvironment()).rejects.toThrow(SystemError);
    });

    it('should handle permission check failures', async () => {
      // Mock permission failures
      mockFs.mkdir.mockRejectedValue(new Error('Permission denied'));
      
      await environmentManager.shutdown();
      environmentManager = new EnvironmentManager();
      await environmentManager.initialize();

      await expect(environmentManager.validateEnvironment()).rejects.toThrow(SystemError);
    });

    it('should emit validation events', async () => {
      const requirementValidatedSpy = jest.fn();
      const environmentValidatedSpy = jest.fn();
      
      environmentManager.on('requirement_validated', requirementValidatedSpy);
      environmentManager.on('environment_validated', environmentValidatedSpy);

      await environmentManager.validateEnvironment();

      expect(requirementValidatedSpy).toHaveBeenCalled();
      expect(environmentValidatedSpy).toHaveBeenCalled();
    });

    it('should handle warnings for optional requirements', async () => {
      // Add an optional requirement that will fail
      const optionalRequirement: EnvironmentRequirement = {
        name: 'optional_test',
        type: 'custom',
        required: false,
        description: 'Optional test requirement',
        validator: async () => false,
        warningMessage: 'Optional requirement not met'
      };

      environmentManager.addRequirement(optionalRequirement);

      const warningsSpy = jest.fn();
      environmentManager.on('validation_warnings', warningsSpy);

      const results = await environmentManager.validateEnvironment();
      
      expect(results.get('optional_test')?.passed).toBe(false);
      expect(results.get('optional_test')?.warning).toBeDefined();
      expect(warningsSpy).toHaveBeenCalled();
    });
  });

  describe('requirements management', () => {
    it('should add custom requirements', () => {
      const customRequirement: EnvironmentRequirement = {
        name: 'custom_test',
        type: 'custom',
        required: true,
        description: 'Custom test requirement',
        validator: async () => true
      };

      environmentManager.addRequirement(customRequirement);
      
      const requirements = environmentManager.getRequirements();
      expect(requirements.find(r => r.name === 'custom_test')).toEqual(customRequirement);
    });

    it('should remove requirements', () => {
      const customRequirement: EnvironmentRequirement = {
        name: 'removable_test',
        type: 'custom',
        required: false,
        description: 'Removable test requirement',
        validator: async () => true
      };

      environmentManager.addRequirement(customRequirement);
      expect(environmentManager.getRequirements().find(r => r.name === 'removable_test')).toBeDefined();

      const removed = environmentManager.removeRequirement('removable_test');
      expect(removed).toBe(true);
      expect(environmentManager.getRequirements().find(r => r.name === 'removable_test')).toBeUndefined();
    });

    it('should return false when removing non-existent requirement', () => {
      const removed = environmentManager.removeRequirement('non_existent');
      expect(removed).toBe(false);
    });
  });

  describe('setup tasks', () => {
    beforeEach(async () => {
      await environmentManager.initialize();
    });

    it('should add custom setup tasks', () => {
      const customTask = {
        id: 'custom_task',
        name: 'Custom Task',
        description: 'Custom setup task',
        required: true,
        executor: jest.fn().mockResolvedValue(undefined),
        dependencies: [],
        status: 'pending' as const
      };

      environmentManager.addSetupTask(customTask);
      
      const tasks = environmentManager.getSetupTasks();
      expect(tasks.find(t => t.id === 'custom_task')).toEqual(customTask);
    });

    it('should remove setup tasks', () => {
      const customTask = {
        id: 'removable_task',
        name: 'Removable Task',
        description: 'Removable setup task',
        required: false,
        executor: jest.fn().mockResolvedValue(undefined),
        dependencies: [],
        status: 'pending' as const
      };

      environmentManager.addSetupTask(customTask);
      expect(environmentManager.getSetupTasks().find(t => t.id === 'removable_task')).toBeDefined();

      const removed = environmentManager.removeSetupTask('removable_task');
      expect(removed).toBe(true);
      expect(environmentManager.getSetupTasks().find(t => t.id === 'removable_task')).toBeUndefined();
    });
  });

  describe('resource monitoring', () => {
    beforeEach(async () => {
      await environmentManager.initialize();
    });

    it('should get resource usage', async () => {
      const resourceUsage = await environmentManager.getResourceUsage();
      
      expect(resourceUsage).toBeDefined();
      expect(resourceUsage.cpu).toBeDefined();
      expect(resourceUsage.memory).toBeDefined();
      expect(resourceUsage.disk).toBeDefined();
      
      expect(resourceUsage.memory.total).toBe(8 * 1024 * 1024 * 1024);
      expect(resourceUsage.cpu.loadAverage).toEqual([1.0, 1.5, 2.0]);
    });

    it('should calculate memory usage percentage', async () => {
      const resourceUsage = await environmentManager.getResourceUsage();
      
      expect(resourceUsage.memory.usage).toBeGreaterThan(0);
      expect(resourceUsage.memory.usage).toBeLessThanOrEqual(100);
    });

    it('should get CPU usage', async () => {
      const resourceUsage = await environmentManager.getResourceUsage();
      
      expect(resourceUsage.cpu.usage).toBeGreaterThanOrEqual(0);
      expect(resourceUsage.cpu.usage).toBeLessThanOrEqual(100);
    });
  });

  describe('directory management', () => {
    beforeEach(async () => {
      await environmentManager.initialize();
    });

    it('should create required directories', async () => {
      await environmentManager.createRequiredDirectories();
      
      expect(mockFs.mkdir).toHaveBeenCalledWith(
        expect.stringContaining('.config/multi-agent-ide'),
        { recursive: true }
      );
      expect(mockFs.mkdir).toHaveBeenCalledWith(
        expect.stringContaining('.local/share/multi-agent-ide'),
        { recursive: true }
      );
      expect(mockFs.mkdir).toHaveBeenCalledWith(
        expect.stringContaining('.local/share/multi-agent-ide/logs'),
        { recursive: true }
      );
    });

    it('should handle directory creation errors', async () => {
      mockFs.mkdir.mockRejectedValue(new Error('Permission denied'));
      
      await expect(environmentManager.createRequiredDirectories()).rejects.toThrow(SystemError);
    });

    it('should clean up temporary files', async () => {
      await environmentManager.cleanupTemporaryFiles();
      
      expect(mockFs.rm).toHaveBeenCalledWith(
        expect.stringContaining('/tmp/multi-agent-ide'),
        { recursive: true, force: true }
      );
    });

    it('should handle cleanup errors gracefully', async () => {
      mockFs.rm.mockRejectedValue(new Error('File not found'));
      
      // Should not throw
      await expect(environmentManager.cleanupTemporaryFiles()).resolves.not.toThrow();
    });
  });

  describe('environment health', () => {
    beforeEach(async () => {
      await environmentManager.initialize();
    });

    it('should report healthy environment when all requirements pass', async () => {
      await environmentManager.validateEnvironment();
      
      expect(environmentManager.isEnvironmentHealthy()).toBe(true);
    });

    it('should report unhealthy environment when required requirements fail', async () => {
      // Add a failing required requirement
      const failingRequirement: EnvironmentRequirement = {
        name: 'failing_test',
        type: 'custom',
        required: true,
        description: 'Failing test requirement',
        validator: async () => false
      };

      environmentManager.addRequirement(failingRequirement);

      try {
        await environmentManager.validateEnvironment();
      } catch (error) {
        // Expected to fail
      }

      expect(environmentManager.isEnvironmentHealthy()).toBe(false);
    });

    it('should report healthy environment when only optional requirements fail', async () => {
      // Add a failing optional requirement
      const failingOptionalRequirement: EnvironmentRequirement = {
        name: 'failing_optional',
        type: 'custom',
        required: false,
        description: 'Failing optional requirement',
        validator: async () => false,
        warningMessage: 'Optional requirement failed'
      };

      environmentManager.addRequirement(failingOptionalRequirement);

      await environmentManager.validateEnvironment();
      
      expect(environmentManager.isEnvironmentHealthy()).toBe(true);
    });
  });

  describe('shutdown', () => {
    beforeEach(async () => {
      await environmentManager.initialize();
    });

    it('should shutdown successfully', async () => {
      const shutdownSpy = jest.fn();
      environmentManager.on('shutdown', shutdownSpy);

      await environmentManager.shutdown();

      expect(shutdownSpy).toHaveBeenCalled();
    });

    it('should run cleanup tasks during shutdown', async () => {
      const cleanupSpy = jest.fn();
      const cleanupCompletedSpy = jest.fn();
      
      environmentManager.on('cleanup_task_completed', cleanupCompletedSpy);

      // Add a task with rollback
      environmentManager.addSetupTask({
        id: 'task_with_rollback',
        name: 'Task with Rollback',
        description: 'Task that has rollback',
        required: true,
        executor: jest.fn().mockResolvedValue(undefined),
        rollback: cleanupSpy,
        dependencies: [],
        status: 'completed'
      });

      await environmentManager.shutdown();

      expect(cleanupSpy).toHaveBeenCalled();
    });

    it('should not fail when shutting down non-initialized manager', async () => {
      const uninitializedManager = new EnvironmentManager();
      
      await expect(uninitializedManager.shutdown()).resolves.not.toThrow();
    });
  });

  describe('validation results', () => {
    beforeEach(async () => {
      await environmentManager.initialize();
    });

    it('should provide validation results', async () => {
      await environmentManager.validateEnvironment();
      
      const results = environmentManager.getValidationResults();
      expect(results.size).toBeGreaterThan(0);
      
      for (const result of results.values()) {
        expect(result.requirement).toBeDefined();
        expect(typeof result.passed).toBe('boolean');
      }
    });

    it('should return empty results before validation', () => {
      const uninitializedManager = new EnvironmentManager();
      const results = uninitializedManager.getValidationResults();
      expect(results.size).toBe(0);
    });
  });
});
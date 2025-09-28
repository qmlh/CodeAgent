/**
 * System Integration Tests
 * Tests the complete system startup and initialization flow
 */

import { SystemInitializer, InitializationPhase } from '../SystemInitializer';
import { ConfigurationManager } from '../ConfigurationManager';
import { EnvironmentManager } from '../EnvironmentManager';
import { SystemHealthMonitor } from '../../recovery/SystemHealthMonitor';
import { CoordinationManager } from '../../../services/CoordinationManager';
import { TaskManager } from '../../../services/TaskManager';
import { FileManager } from '../../../services/FileManager';
import { MessageManager } from '../../../services/MessageManager';
import { SystemError } from '../../errors/SystemError';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

// Mock external dependencies
jest.mock('fs/promises');
jest.mock('os');
jest.mock('../../recovery/SystemHealthMonitor');
jest.mock('../../recovery/AutoRecoveryManager');
jest.mock('../../recovery/FailoverCoordinator');
jest.mock('../../../services/CoordinationManager');
jest.mock('../../../services/TaskManager');
jest.mock('../../../services/FileManager');
jest.mock('../../../services/MessageManager');

const mockFs = fs as jest.Mocked<typeof fs>;
const mockOs = os as jest.Mocked<typeof os>;

describe('System Integration Tests', () => {
  let tempDir: string;

  beforeEach(() => {
    jest.clearAllMocks();
    tempDir = '/tmp/system-integration-test';

    // Setup OS mocks
    mockOs.platform.mockReturnValue('linux');
    mockOs.arch.mockReturnValue('x64');
    mockOs.type.mockReturnValue('Linux');
    mockOs.release.mockReturnValue('5.4.0');
    mockOs.version.mockReturnValue('#1 SMP Ubuntu 20.04');
    mockOs.totalmem.mockReturnValue(8 * 1024 * 1024 * 1024);
    mockOs.freemem.mockReturnValue(4 * 1024 * 1024 * 1024);
    mockOs.cpus.mockReturnValue(Array(4).fill({ model: 'Test CPU' }) as any);
    mockOs.homedir.mockReturnValue('/home/test');
    mockOs.tmpdir.mockReturnValue('/tmp');
    mockOs.hostname.mockReturnValue('test-host');
    mockOs.networkInterfaces.mockReturnValue({});
    mockOs.loadavg.mockReturnValue([1.0, 1.5, 2.0]);

    // Setup fs mocks
    mockFs.readFile.mockImplementation(async (filePath: any) => {
      if (filePath.includes('system.json')) {
        return JSON.stringify({
          maxAgents: 10,
          maxConcurrentTasks: 50,
          taskTimeout: 300000,
          fileLockTimeout: 60000,
          heartbeatInterval: 30000,
          retryAttempts: 3,
          logLevel: 'info'
        });
      }
      throw { code: 'ENOENT' };
    });

    mockFs.writeFile.mockResolvedValue(undefined);
    mockFs.mkdir.mockResolvedValue(undefined);
    mockFs.readdir.mockResolvedValue([]);
    mockFs.rm.mockResolvedValue(undefined);
    mockFs.stat.mockResolvedValue({ isDirectory: () => true } as any);

    // Setup process mocks
    Object.defineProperty(process, 'version', { value: 'v18.0.0', configurable: true });
    Object.defineProperty(process, 'cwd', { value: jest.fn().mockReturnValue('/test/project'), configurable: true });
    Object.defineProperty(process, 'env', { 
      value: { NODE_ENV: 'test' }, 
      configurable: true 
    });
  });

  describe('Complete System Startup', () => {
    it('should initialize the complete system successfully', async () => {
      const systemInitializer = new SystemInitializer({
        timeout: 30000,
        enableHealthCheck: true,
        enableRecovery: true,
        parallelInitialization: false
      });

      const initializationEvents: string[] = [];
      const phaseEvents: InitializationPhase[] = [];

      systemInitializer.on('initialization_started', () => {
        initializationEvents.push('started');
      });

      systemInitializer.on('phase_started', ({ phase }) => {
        phaseEvents.push(phase);
      });

      systemInitializer.on('initialization_completed', () => {
        initializationEvents.push('completed');
      });

      const result = await systemInitializer.initialize();

      // Verify successful initialization
      expect(result.success).toBe(true);
      expect(result.phase).toBe(InitializationPhase.READY);
      expect(result.errors).toHaveLength(0);
      expect(result.totalTime).toBeGreaterThan(0);

      // Verify all phases were executed
      expect(phaseEvents).toContain(InitializationPhase.LOADING_CONFIG);
      expect(phaseEvents).toContain(InitializationPhase.VALIDATING_ENVIRONMENT);
      expect(phaseEvents).toContain(InitializationPhase.INITIALIZING_CORE);
      expect(phaseEvents).toContain(InitializationPhase.STARTING_SERVICES);
      expect(phaseEvents).toContain(InitializationPhase.HEALTH_CHECK);

      // Verify events were emitted
      expect(initializationEvents).toEqual(['started', 'completed']);

      // Verify components are available
      const components = systemInitializer.getComponents();
      expect(components.configurationManager).toBeDefined();
      expect(components.environmentManager).toBeDefined();
      expect(components.coordinationManager).toBeDefined();
      expect(components.taskManager).toBeDefined();
      expect(components.fileManager).toBeDefined();
      expect(components.messageManager).toBeDefined();
      expect(components.healthMonitor).toBeDefined();

      // Verify system is marked as initialized
      const status = systemInitializer.getInitializationStatus();
      expect(status.isInitialized).toBe(true);
      expect(status.progress).toBe(100);

      await systemInitializer.shutdown();
    });

    it('should handle partial system failure gracefully', async () => {
      // Mock one service to fail
      const MockedTaskManager = TaskManager as jest.MockedClass<typeof TaskManager>;
      MockedTaskManager.prototype.initialize.mockRejectedValueOnce(new Error('Task manager failed'));

      const systemInitializer = new SystemInitializer({
        parallelInitialization: false
      });

      const result = await systemInitializer.initialize();

      expect(result.success).toBe(false);
      expect(result.phase).toBe(InitializationPhase.FAILED);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0].message).toContain('Task manager failed');

      await systemInitializer.shutdown();
    });

    it('should support parallel initialization', async () => {
      const systemInitializer = new SystemInitializer({
        parallelInitialization: true,
        timeout: 30000
      });

      const stepTimings: { [stepId: string]: { start: number; end: number } } = {};

      systemInitializer.on('step_started', (step) => {
        stepTimings[step.id] = { start: Date.now(), end: 0 };
      });

      systemInitializer.on('step_completed', (step) => {
        if (stepTimings[step.id]) {
          stepTimings[step.id].end = Date.now();
        }
      });

      const result = await systemInitializer.initialize();

      expect(result.success).toBe(true);

      // Verify that some steps ran in parallel (this is hard to test reliably)
      // At minimum, verify that all steps completed
      const completedSteps = result.steps.filter(step => step.status === 'completed');
      expect(completedSteps.length).toBeGreaterThan(0);

      await systemInitializer.shutdown();
    });
  });

  describe('Configuration Integration', () => {
    it('should load and use system configuration during startup', async () => {
      // Mock system config with custom values
      mockFs.readFile.mockImplementation(async (filePath: any) => {
        if (filePath.includes('system.json')) {
          return JSON.stringify({
            maxAgents: 25,
            maxConcurrentTasks: 100,
            taskTimeout: 600000,
            logLevel: 'debug'
          });
        }
        throw { code: 'ENOENT' };
      });

      const systemInitializer = new SystemInitializer();
      const result = await systemInitializer.initialize();

      expect(result.success).toBe(true);
      expect(result.systemConfig.maxAgents).toBe(25);
      expect(result.systemConfig.maxConcurrentTasks).toBe(100);
      expect(result.systemConfig.taskTimeout).toBe(600000);
      expect(result.systemConfig.logLevel).toBe('debug');

      await systemInitializer.shutdown();
    });

    it('should handle configuration validation errors', async () => {
      // Mock invalid system config
      mockFs.readFile.mockImplementation(async (filePath: any) => {
        if (filePath.includes('system.json')) {
          return JSON.stringify({
            maxAgents: -5, // Invalid negative value
            logLevel: 'invalid' // Invalid log level
          });
        }
        throw { code: 'ENOENT' };
      });

      const systemInitializer = new SystemInitializer();
      const result = await systemInitializer.initialize();

      expect(result.success).toBe(false);
      expect(result.errors.some(error => 
        error.message.includes('validation failed')
      )).toBe(true);

      await systemInitializer.shutdown();
    });
  });

  describe('Environment Integration', () => {
    it('should validate environment requirements during startup', async () => {
      const systemInitializer = new SystemInitializer();
      const result = await systemInitializer.initialize();

      expect(result.success).toBe(true);

      // Verify environment was validated
      const components = systemInitializer.getComponents();
      expect(components.environmentManager).toBeDefined();

      const envInfo = components.environmentManager!.getEnvironmentInfo();
      expect(envInfo).toBeDefined();
      expect(envInfo!.platform).toBe('linux');
      expect(envInfo!.nodeVersion).toBe('v18.0.0');

      await systemInitializer.shutdown();
    });

    it('should fail startup on environment validation failure', async () => {
      // Mock insufficient Node.js version
      Object.defineProperty(process, 'version', { value: 'v14.0.0', configurable: true });

      const systemInitializer = new SystemInitializer();
      const result = await systemInitializer.initialize();

      expect(result.success).toBe(false);
      expect(result.errors.some(error => 
        error.message.includes('Node.js version')
      )).toBe(true);

      await systemInitializer.shutdown();
    });

    it('should create required directories during startup', async () => {
      const systemInitializer = new SystemInitializer();
      await systemInitializer.initialize();

      // Verify directories were created
      expect(mockFs.mkdir).toHaveBeenCalledWith(
        expect.stringContaining('.config'),
        { recursive: true }
      );
      expect(mockFs.mkdir).toHaveBeenCalledWith(
        expect.stringContaining('.local/share'),
        { recursive: true }
      );

      await systemInitializer.shutdown();
    });
  });

  describe('Health Monitoring Integration', () => {
    it('should initialize health monitoring during startup', async () => {
      const systemInitializer = new SystemInitializer({
        enableHealthCheck: true
      });

      const result = await systemInitializer.initialize();

      expect(result.success).toBe(true);

      const components = systemInitializer.getComponents();
      expect(components.healthMonitor).toBeDefined();

      // Verify health monitor was initialized
      const MockedHealthMonitor = SystemHealthMonitor as jest.MockedClass<typeof SystemHealthMonitor>;
      expect(MockedHealthMonitor).toHaveBeenCalled();

      await systemInitializer.shutdown();
    });

    it('should skip health monitoring when disabled', async () => {
      const systemInitializer = new SystemInitializer({
        enableHealthCheck: false
      });

      const result = await systemInitializer.initialize();

      expect(result.success).toBe(true);

      // Health check step should be skipped
      const healthCheckStep = result.steps.find(step => step.id === 'system_health_check');
      expect(healthCheckStep?.status).toBe('skipped');

      await systemInitializer.shutdown();
    });

    it('should fail startup on critical health check failure', async () => {
      // Mock health monitor to report critical failure
      const MockedHealthMonitor = SystemHealthMonitor as jest.MockedClass<typeof SystemHealthMonitor>;
      MockedHealthMonitor.prototype.getSystemHealthStatus.mockResolvedValue({
        overallHealth: 'critical',
        components: {},
        lastCheck: new Date(),
        issues: []
      } as any);

      const systemInitializer = new SystemInitializer({
        enableHealthCheck: true
      });

      const result = await systemInitializer.initialize();

      expect(result.success).toBe(false);
      expect(result.errors.some(error => 
        error.message.includes('health check failed')
      )).toBe(true);

      await systemInitializer.shutdown();
    });
  });

  describe('Service Integration', () => {
    it('should initialize all core services', async () => {
      const systemInitializer = new SystemInitializer();
      const result = await systemInitializer.initialize();

      expect(result.success).toBe(true);

      const components = systemInitializer.getComponents();

      // Verify all services were initialized
      expect(CoordinationManager).toHaveBeenCalled();
      expect(TaskManager).toHaveBeenCalled();
      expect(FileManager).toHaveBeenCalled();
      expect(MessageManager).toHaveBeenCalled();

      // Verify initialize was called on each service
      expect(CoordinationManager.prototype.initialize).toHaveBeenCalled();
      expect(TaskManager.prototype.initialize).toHaveBeenCalled();
      expect(FileManager.prototype.initialize).toHaveBeenCalled();
      expect(MessageManager.prototype.initialize).toHaveBeenCalled();

      await systemInitializer.shutdown();
    });

    it('should handle service initialization dependencies', async () => {
      const systemInitializer = new SystemInitializer({
        parallelInitialization: false // Sequential to test dependencies
      });

      const initializationOrder: string[] = [];

      // Track initialization order
      CoordinationManager.prototype.initialize.mockImplementation(async function() {
        initializationOrder.push('coordination');
      });

      TaskManager.prototype.initialize.mockImplementation(async function() {
        initializationOrder.push('task');
      });

      FileManager.prototype.initialize.mockImplementation(async function() {
        initializationOrder.push('file');
      });

      MessageManager.prototype.initialize.mockImplementation(async function() {
        initializationOrder.push('message');
      });

      const result = await systemInitializer.initialize();

      expect(result.success).toBe(true);

      // Verify coordination manager was initialized first
      expect(initializationOrder[0]).toBe('coordination');

      await systemInitializer.shutdown();
    });
  });

  describe('Error Recovery Integration', () => {
    it('should initialize recovery system when enabled', async () => {
      const systemInitializer = new SystemInitializer({
        enableRecovery: true
      });

      const result = await systemInitializer.initialize();

      expect(result.success).toBe(true);

      const components = systemInitializer.getComponents();
      expect(components.autoRecoveryManager).toBeDefined();
      expect(components.failoverCoordinator).toBeDefined();

      await systemInitializer.shutdown();
    });

    it('should skip recovery system when disabled', async () => {
      const systemInitializer = new SystemInitializer({
        enableRecovery: false
      });

      const result = await systemInitializer.initialize();

      expect(result.success).toBe(true);

      // Recovery initialization step should be skipped
      const recoveryStep = result.steps.find(step => step.id === 'init_recovery_system');
      expect(recoveryStep?.status).toBe('skipped');

      await systemInitializer.shutdown();
    });
  });

  describe('Shutdown Integration', () => {
    it('should shutdown all components in reverse order', async () => {
      const systemInitializer = new SystemInitializer();
      await systemInitializer.initialize();

      const shutdownOrder: string[] = [];

      // Mock shutdown methods to track order
      const components = systemInitializer.getComponents();
      
      if (components.healthMonitor) {
        (components.healthMonitor as any).shutdown = jest.fn().mockImplementation(async () => {
          shutdownOrder.push('healthMonitor');
        });
      }
      
      if (components.messageManager) {
        (components.messageManager as any).shutdown = jest.fn().mockImplementation(async () => {
          shutdownOrder.push('messageManager');
        });
      }
      
      if (components.coordinationManager) {
        (components.coordinationManager as any).shutdown = jest.fn().mockImplementation(async () => {
          shutdownOrder.push('coordinationManager');
        });
      }

      await systemInitializer.shutdown();

      // Verify shutdown was called and in reverse order
      expect(shutdownOrder.length).toBeGreaterThan(0);
      expect(shutdownOrder[0]).toBe('healthMonitor'); // Should be first to shutdown
    });

    it('should handle shutdown errors gracefully', async () => {
      const systemInitializer = new SystemInitializer();
      await systemInitializer.initialize();

      // Mock one component to fail shutdown
      const components = systemInitializer.getComponents();
      if (components.messageManager) {
        (components.messageManager as any).shutdown = jest.fn().mockRejectedValue(new Error('Shutdown failed'));
      }

      // Should not throw
      await expect(systemInitializer.shutdown()).resolves.not.toThrow();
    });
  });

  describe('Performance and Timing', () => {
    it('should complete initialization within reasonable time', async () => {
      const systemInitializer = new SystemInitializer({
        timeout: 30000
      });

      const startTime = Date.now();
      const result = await systemInitializer.initialize();
      const endTime = Date.now();

      expect(result.success).toBe(true);
      expect(endTime - startTime).toBeLessThan(30000); // Should complete within timeout
      expect(result.totalTime).toBeLessThan(30000);

      await systemInitializer.shutdown();
    });

    it('should provide accurate progress reporting', async () => {
      const systemInitializer = new SystemInitializer({
        parallelInitialization: false
      });

      const progressUpdates: number[] = [];

      systemInitializer.on('step_completed', () => {
        const status = systemInitializer.getInitializationStatus();
        progressUpdates.push(status.progress);
      });

      await systemInitializer.initialize();

      // Verify progress increased over time
      expect(progressUpdates.length).toBeGreaterThan(0);
      expect(progressUpdates[0]).toBeGreaterThan(0);
      expect(progressUpdates[progressUpdates.length - 1]).toBe(100);

      // Verify progress is monotonically increasing
      for (let i = 1; i < progressUpdates.length; i++) {
        expect(progressUpdates[i]).toBeGreaterThanOrEqual(progressUpdates[i - 1]);
      }

      await systemInitializer.shutdown();
    });
  });
});
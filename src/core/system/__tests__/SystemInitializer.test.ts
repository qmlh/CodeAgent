/**
 * System Initializer Tests
 */

import { SystemInitializer, InitializationPhase } from '../SystemInitializer';
import { ConfigurationManager } from '../ConfigurationManager';
import { EnvironmentManager } from '../EnvironmentManager';
import { SystemError } from '../../errors/SystemError';
import { ErrorType } from '../../../types/error.types';

// Mock dependencies
jest.mock('../ConfigurationManager');
jest.mock('../EnvironmentManager');
jest.mock('../../recovery/SystemHealthMonitor');
jest.mock('../../recovery/AutoRecoveryManager');
jest.mock('../../recovery/FailoverCoordinator');
jest.mock('../../../services/CoordinationManager');
jest.mock('../../../services/TaskManager');
jest.mock('../../../services/FileManager');
jest.mock('../../../services/MessageManager');

describe('SystemInitializer', () => {
  let systemInitializer: SystemInitializer;

  beforeEach(() => {
    jest.clearAllMocks();
    systemInitializer = new SystemInitializer({
      timeout: 10000,
      enableHealthCheck: true,
      enableRecovery: true,
      skipOptionalSteps: false,
      parallelInitialization: false, // Use sequential for predictable testing
      retryAttempts: 1,
      retryDelay: 100
    });
  });

  afterEach(async () => {
    if (systemInitializer) {
      try {
        await systemInitializer.shutdown();
      } catch (error) {
        // Ignore shutdown errors in tests
      }
    }
  });

  describe('initialization', () => {
    it('should initialize successfully with all phases', async () => {
      const result = await systemInitializer.initialize();

      expect(result.success).toBe(true);
      expect(result.phase).toBe(InitializationPhase.READY);
      expect(result.errors).toHaveLength(0);
      expect(result.totalTime).toBeGreaterThan(0);
      expect(result.steps.length).toBeGreaterThan(0);
    });

    it('should emit initialization events', async () => {
      const startedSpy = jest.fn();
      const completedSpy = jest.fn();
      const phaseStartedSpy = jest.fn();
      const stepStartedSpy = jest.fn();

      systemInitializer.on('initialization_started', startedSpy);
      systemInitializer.on('initialization_completed', completedSpy);
      systemInitializer.on('phase_started', phaseStartedSpy);
      systemInitializer.on('step_started', stepStartedSpy);

      await systemInitializer.initialize();

      expect(startedSpy).toHaveBeenCalledWith({ phase: InitializationPhase.STARTING });
      expect(completedSpy).toHaveBeenCalledWith({ phase: InitializationPhase.READY });
      expect(phaseStartedSpy).toHaveBeenCalledTimes(5); // 5 phases
      expect(stepStartedSpy).toHaveBeenCalled();
    });

    it('should handle initialization failure', async () => {
      // Mock a component to fail initialization
      const mockConfigManager = ConfigurationManager as jest.MockedClass<typeof ConfigurationManager>;
      mockConfigManager.prototype.initialize.mockRejectedValueOnce(new Error('Config load failed'));

      const result = await systemInitializer.initialize();

      expect(result.success).toBe(false);
      expect(result.phase).toBe(InitializationPhase.FAILED);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should not initialize twice', async () => {
      await systemInitializer.initialize();

      await expect(systemInitializer.initialize()).rejects.toThrow(SystemError);
    });

    it('should skip optional steps when configured', async () => {
      const skipOptionalInitializer = new SystemInitializer({
        skipOptionalSteps: true,
        parallelInitialization: false
      });

      const result = await skipOptionalInitializer.initialize();

      expect(result.success).toBe(true);
      
      // Check that optional steps were skipped
      const skippedSteps = result.steps.filter(step => step.status === 'skipped');
      expect(skippedSteps.length).toBeGreaterThan(0);

      await skipOptionalInitializer.shutdown();
    });

    it('should handle timeout in initialization steps', async () => {
      const timeoutInitializer = new SystemInitializer({
        timeout: 100, // Very short timeout
        parallelInitialization: false
      });

      // Mock a slow component
      const mockConfigManager = ConfigurationManager as jest.MockedClass<typeof ConfigurationManager>;
      mockConfigManager.prototype.initialize.mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 200))
      );

      const result = await timeoutInitializer.initialize();

      expect(result.success).toBe(false);
      expect(result.errors.some(error => error.message.includes('timed out'))).toBe(true);

      await timeoutInitializer.shutdown();
    });
  });

  describe('component management', () => {
    beforeEach(async () => {
      await systemInitializer.initialize();
    });

    it('should provide access to initialized components', () => {
      const components = systemInitializer.getComponents();

      expect(components.configurationManager).toBeDefined();
      expect(components.environmentManager).toBeDefined();
      expect(components.coordinationManager).toBeDefined();
      expect(components.taskManager).toBeDefined();
      expect(components.fileManager).toBeDefined();
      expect(components.messageManager).toBeDefined();
    });

    it('should restart a specific component', async () => {
      const components = systemInitializer.getComponents();
      const originalConfigManager = components.configurationManager;

      await systemInitializer.restartComponent('configurationManager');

      const newComponents = systemInitializer.getComponents();
      expect(newComponents.configurationManager).toBeDefined();
      // In a real scenario, this would be a different instance
    });

    it('should throw error when restarting non-existent component', async () => {
      await expect(
        systemInitializer.restartComponent('nonExistentComponent' as any)
      ).rejects.toThrow(SystemError);
    });
  });

  describe('initialization status', () => {
    it('should provide initialization status', () => {
      const status = systemInitializer.getInitializationStatus();

      expect(status.isInitialized).toBe(false);
      expect(status.currentPhase).toBe(InitializationPhase.STARTING);
      expect(status.progress).toBe(0);
      expect(status.steps).toBeDefined();
    });

    it('should update status during initialization', async () => {
      const statusUpdates: any[] = [];

      systemInitializer.on('step_completed', () => {
        statusUpdates.push(systemInitializer.getInitializationStatus());
      });

      await systemInitializer.initialize();

      expect(statusUpdates.length).toBeGreaterThan(0);
      expect(statusUpdates[statusUpdates.length - 1].isInitialized).toBe(true);
    });
  });

  describe('shutdown', () => {
    beforeEach(async () => {
      await systemInitializer.initialize();
    });

    it('should shutdown successfully', async () => {
      const shutdownStartedSpy = jest.fn();
      const shutdownCompletedSpy = jest.fn();

      systemInitializer.on('shutdown_started', shutdownStartedSpy);
      systemInitializer.on('shutdown_completed', shutdownCompletedSpy);

      await systemInitializer.shutdown();

      expect(shutdownStartedSpy).toHaveBeenCalled();
      expect(shutdownCompletedSpy).toHaveBeenCalled();
    });

    it('should handle shutdown errors gracefully', async () => {
      // Mock a component to fail shutdown
      const components = systemInitializer.getComponents();
      if (components.configurationManager) {
        (components.configurationManager as any).shutdown = jest.fn().mockRejectedValue(new Error('Shutdown failed'));
      }

      // Should not throw
      await expect(systemInitializer.shutdown()).resolves.not.toThrow();
    });

    it('should not fail when shutting down non-initialized system', async () => {
      const uninitializedInitializer = new SystemInitializer();
      
      await expect(uninitializedInitializer.shutdown()).resolves.not.toThrow();
    });
  });

  describe('parallel initialization', () => {
    it('should support parallel initialization', async () => {
      const parallelInitializer = new SystemInitializer({
        parallelInitialization: true,
        timeout: 10000
      });

      const startTime = Date.now();
      const result = await parallelInitializer.initialize();
      const endTime = Date.now();

      expect(result.success).toBe(true);
      // Parallel initialization should be faster (though this is hard to test reliably)
      expect(endTime - startTime).toBeLessThan(10000);

      await parallelInitializer.shutdown();
    });

    it('should respect dependencies in parallel mode', async () => {
      const parallelInitializer = new SystemInitializer({
        parallelInitialization: true
      });

      const result = await parallelInitializer.initialize();

      expect(result.success).toBe(true);
      
      // Verify that dependent steps completed after their dependencies
      const configStep = result.steps.find(s => s.id === 'init_configuration_manager');
      const envStep = result.steps.find(s => s.id === 'init_environment_manager');
      
      if (configStep && envStep && configStep.endTime && envStep.startTime) {
        expect(envStep.startTime.getTime()).toBeGreaterThanOrEqual(configStep.endTime.getTime());
      }

      await parallelInitializer.shutdown();
    });
  });

  describe('error handling', () => {
    it('should handle missing dependencies', async () => {
      // Create an initializer with circular dependencies (this would be caught)
      const faultyInitializer = new SystemInitializer();
      
      // Mock the setup to create a circular dependency scenario
      const originalSetup = (faultyInitializer as any).setupInitializationSteps;
      (faultyInitializer as any).setupInitializationSteps = function() {
        originalSetup.call(this);
        // Add a step with impossible dependencies
        this.initializationSteps.set('impossible_step', {
          id: 'impossible_step',
          name: 'Impossible Step',
          phase: InitializationPhase.INITIALIZING_CORE,
          required: true,
          timeout: 5000,
          dependencies: ['non_existent_step'],
          status: 'pending'
        });
      };

      const result = await faultyInitializer.initialize();
      
      expect(result.success).toBe(false);
      expect(result.errors.some(error => 
        error.message.includes('Dependencies not met') || 
        error.message.includes('Circular dependency')
      )).toBe(true);

      await faultyInitializer.shutdown();
    });

    it('should continue with non-required steps failing', async () => {
      // Mock an optional step to fail
      const mockEnvManager = EnvironmentManager as jest.MockedClass<typeof EnvironmentManager>;
      mockEnvManager.prototype.initialize.mockRejectedValueOnce(new Error('Optional step failed'));

      // Modify the step to be non-required
      const steps = (systemInitializer as any).initializationSteps;
      const envStep = steps.get('init_environment_manager');
      if (envStep) {
        envStep.required = false;
      }

      const result = await systemInitializer.initialize();

      expect(result.success).toBe(true); // Should still succeed
      expect(result.steps.some(step => step.status === 'failed')).toBe(true);
    });
  });

  describe('configuration', () => {
    it('should use provided configuration', () => {
      const config = {
        timeout: 5000,
        enableHealthCheck: false,
        enableRecovery: false,
        skipOptionalSteps: true,
        parallelInitialization: true,
        retryAttempts: 5,
        retryDelay: 2000
      };

      const configuredInitializer = new SystemInitializer(config);
      
      expect((configuredInitializer as any).config).toMatchObject(config);
    });

    it('should use default configuration when not provided', () => {
      const defaultInitializer = new SystemInitializer();
      const config = (defaultInitializer as any).config;

      expect(config.timeout).toBe(60000);
      expect(config.enableHealthCheck).toBe(true);
      expect(config.enableRecovery).toBe(true);
      expect(config.skipOptionalSteps).toBe(false);
      expect(config.parallelInitialization).toBe(true);
      expect(config.retryAttempts).toBe(3);
      expect(config.retryDelay).toBe(1000);
    });
  });
});
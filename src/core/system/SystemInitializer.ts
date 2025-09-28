/**
 * System Initializer
 * Handles system startup flow and component initialization
 */

import { EventEmitter } from 'eventemitter3';
import { ConfigurationManager } from './ConfigurationManager';
import { EnvironmentManager } from './EnvironmentManager';
import { SystemHealthMonitor } from '../recovery/SystemHealthMonitor';
import { AutoRecoveryManager } from '../recovery/AutoRecoveryManager';
import { FailoverCoordinator } from '../recovery/FailoverCoordinator';
import { CoordinationManager } from '../../services/CoordinationManager';
import { TaskManager } from '../../services/TaskManager';
import { FileManager } from '../../services/FileManager';
import { MessageManager } from '../../services/MessageManager';
import { SystemConfig, ProjectConfig } from '../../types/config.types';
import { SystemError } from '../errors/SystemError';
import { ErrorType, ErrorSeverity } from '../../types/error.types';

/**
 * System initialization phases
 */
export enum InitializationPhase {
  STARTING = 'starting',
  LOADING_CONFIG = 'loading_config',
  VALIDATING_ENVIRONMENT = 'validating_environment',
  INITIALIZING_CORE = 'initializing_core',
  STARTING_SERVICES = 'starting_services',
  HEALTH_CHECK = 'health_check',
  READY = 'ready',
  FAILED = 'failed'
}

/**
 * Initialization step
 */
export interface InitializationStep {
  id: string;
  name: string;
  phase: InitializationPhase;
  required: boolean;
  timeout: number;
  dependencies: string[];
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  startTime?: Date;
  endTime?: Date;
  error?: Error;
  result?: any;
}

/**
 * System initialization configuration
 */
export interface SystemInitializationConfig {
  timeout: number;
  enableHealthCheck: boolean;
  enableRecovery: boolean;
  skipOptionalSteps: boolean;
  parallelInitialization: boolean;
  retryAttempts: number;
  retryDelay: number;
}

/**
 * System initialization result
 */
export interface SystemInitializationResult {
  success: boolean;
  phase: InitializationPhase;
  totalTime: number;
  steps: InitializationStep[];
  errors: Error[];
  warnings: string[];
  systemConfig: SystemConfig;
  projectConfig?: ProjectConfig;
}

/**
 * System component registry
 */
export interface SystemComponents {
  configurationManager: ConfigurationManager;
  environmentManager: EnvironmentManager;
  coordinationManager: CoordinationManager;
  taskManager: TaskManager;
  fileManager: FileManager;
  messageManager: MessageManager;
  healthMonitor: SystemHealthMonitor;
  autoRecoveryManager: AutoRecoveryManager;
  failoverCoordinator: FailoverCoordinator;
}

/**
 * System Initializer
 */
export class SystemInitializer extends EventEmitter {
  private config: SystemInitializationConfig;
  private currentPhase: InitializationPhase = InitializationPhase.STARTING;
  private initializationSteps: Map<string, InitializationStep> = new Map();
  private components: Partial<SystemComponents> = {};
  private startTime: Date = new Date();
  private isInitialized: boolean = false;
  private isShuttingDown: boolean = false;

  constructor(config: Partial<SystemInitializationConfig> = {}) {
    super();

    this.config = {
      timeout: 60000, // 60 seconds
      enableHealthCheck: true,
      enableRecovery: true,
      skipOptionalSteps: false,
      parallelInitialization: true,
      retryAttempts: 3,
      retryDelay: 1000,
      ...config
    };

    this.setupInitializationSteps();
  }

  /**
   * Initialize the system
   */
  async initialize(): Promise<SystemInitializationResult> {
    if (this.isInitialized) {
      throw new SystemError(
        'System is already initialized',
        ErrorType.SYSTEM_ERROR,
        ErrorSeverity.HIGH
      );
    }

    this.startTime = new Date();
    this.currentPhase = InitializationPhase.STARTING;
    this.emit('initialization_started', { phase: this.currentPhase });

    const errors: Error[] = [];
    const warnings: string[] = [];

    try {
      // Phase 1: Load Configuration
      await this.executePhase(InitializationPhase.LOADING_CONFIG);

      // Phase 2: Validate Environment
      await this.executePhase(InitializationPhase.VALIDATING_ENVIRONMENT);

      // Phase 3: Initialize Core Components
      await this.executePhase(InitializationPhase.INITIALIZING_CORE);

      // Phase 4: Start Services
      await this.executePhase(InitializationPhase.STARTING_SERVICES);

      // Phase 5: Health Check
      if (this.config.enableHealthCheck) {
        await this.executePhase(InitializationPhase.HEALTH_CHECK);
      }

      // Mark as ready
      this.currentPhase = InitializationPhase.READY;
      this.isInitialized = true;
      this.emit('initialization_completed', { phase: this.currentPhase });

    } catch (error) {
      this.currentPhase = InitializationPhase.FAILED;
      errors.push(error as Error);
      this.emit('initialization_failed', { phase: this.currentPhase, error });

      // Attempt cleanup
      await this.cleanup();
    }

    const totalTime = Date.now() - this.startTime.getTime();
    const steps = Array.from(this.initializationSteps.values());

    const result: SystemInitializationResult = {
      success: this.currentPhase === InitializationPhase.READY,
      phase: this.currentPhase,
      totalTime,
      steps,
      errors,
      warnings,
      systemConfig: this.components.configurationManager?.getSystemConfig() || {} as SystemConfig,
      projectConfig: this.components.configurationManager?.getProjectConfig()
    };

    return result;
  }

  /**
   * Shutdown the system
   */
  async shutdown(): Promise<void> {
    if (this.isShuttingDown) {
      return;
    }

    this.isShuttingDown = true;
    this.emit('shutdown_started');

    try {
      // Shutdown components in reverse order
      const shutdownOrder = [
        'healthMonitor',
        'messageManager',
        'fileManager',
        'taskManager',
        'coordinationManager',
        'autoRecoveryManager',
        'failoverCoordinator',
        'environmentManager',
        'configurationManager'
      ];

      for (const componentName of shutdownOrder) {
        const component = this.components[componentName as keyof SystemComponents];
        if (component && typeof (component as any).shutdown === 'function') {
          try {
            await (component as any).shutdown();
          } catch (error) {
            console.error(`Error shutting down ${componentName}:`, error);
          }
        }
      }

      this.isInitialized = false;
      this.emit('shutdown_completed');

    } catch (error) {
      this.emit('shutdown_failed', error);
      throw error;
    } finally {
      this.isShuttingDown = false;
    }
  }

  /**
   * Get system components
   */
  getComponents(): Partial<SystemComponents> {
    return { ...this.components };
  }

  /**
   * Get initialization status
   */
  getInitializationStatus(): {
    isInitialized: boolean;
    currentPhase: InitializationPhase;
    progress: number;
    steps: InitializationStep[];
  } {
    const completedSteps = Array.from(this.initializationSteps.values())
      .filter(step => step.status === 'completed').length;
    const totalSteps = this.initializationSteps.size;
    const progress = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;

    return {
      isInitialized: this.isInitialized,
      currentPhase: this.currentPhase,
      progress,
      steps: Array.from(this.initializationSteps.values())
    };
  }

  /**
   * Restart a specific component
   */
  async restartComponent(componentName: keyof SystemComponents): Promise<void> {
    const component = this.components[componentName];
    if (!component) {
      throw new SystemError(
        `Component ${componentName} not found`,
        ErrorType.SYSTEM_ERROR,
        ErrorSeverity.MEDIUM
      );
    }

    // Shutdown component
    if (typeof (component as any).shutdown === 'function') {
      await (component as any).shutdown();
    }

    // Reinitialize component
    await this.initializeComponent(componentName);
  }

  // Private methods

  private setupInitializationSteps(): void {
    const steps: Omit<InitializationStep, 'status' | 'startTime' | 'endTime' | 'error' | 'result'>[] = [
      {
        id: 'load_system_config',
        name: 'Load System Configuration',
        phase: InitializationPhase.LOADING_CONFIG,
        required: true,
        timeout: 5000,
        dependencies: []
      },
      {
        id: 'load_project_config',
        name: 'Load Project Configuration',
        phase: InitializationPhase.LOADING_CONFIG,
        required: false,
        timeout: 3000,
        dependencies: ['load_system_config']
      },
      {
        id: 'validate_environment',
        name: 'Validate Environment',
        phase: InitializationPhase.VALIDATING_ENVIRONMENT,
        required: true,
        timeout: 5000,
        dependencies: ['load_system_config']
      },
      {
        id: 'check_dependencies',
        name: 'Check System Dependencies',
        phase: InitializationPhase.VALIDATING_ENVIRONMENT,
        required: true,
        timeout: 10000,
        dependencies: ['validate_environment']
      },
      {
        id: 'init_configuration_manager',
        name: 'Initialize Configuration Manager',
        phase: InitializationPhase.INITIALIZING_CORE,
        required: true,
        timeout: 3000,
        dependencies: ['validate_environment']
      },
      {
        id: 'init_environment_manager',
        name: 'Initialize Environment Manager',
        phase: InitializationPhase.INITIALIZING_CORE,
        required: true,
        timeout: 3000,
        dependencies: ['init_configuration_manager']
      },
      {
        id: 'init_recovery_system',
        name: 'Initialize Recovery System',
        phase: InitializationPhase.INITIALIZING_CORE,
        required: this.config.enableRecovery,
        timeout: 5000,
        dependencies: ['init_environment_manager']
      },
      {
        id: 'init_coordination_manager',
        name: 'Initialize Coordination Manager',
        phase: InitializationPhase.STARTING_SERVICES,
        required: true,
        timeout: 5000,
        dependencies: ['init_recovery_system']
      },
      {
        id: 'init_task_manager',
        name: 'Initialize Task Manager',
        phase: InitializationPhase.STARTING_SERVICES,
        required: true,
        timeout: 5000,
        dependencies: ['init_coordination_manager']
      },
      {
        id: 'init_file_manager',
        name: 'Initialize File Manager',
        phase: InitializationPhase.STARTING_SERVICES,
        required: true,
        timeout: 5000,
        dependencies: ['init_coordination_manager']
      },
      {
        id: 'init_message_manager',
        name: 'Initialize Message Manager',
        phase: InitializationPhase.STARTING_SERVICES,
        required: true,
        timeout: 5000,
        dependencies: ['init_coordination_manager']
      },
      {
        id: 'init_health_monitor',
        name: 'Initialize Health Monitor',
        phase: InitializationPhase.STARTING_SERVICES,
        required: this.config.enableHealthCheck,
        timeout: 3000,
        dependencies: ['init_recovery_system', 'init_coordination_manager']
      },
      {
        id: 'system_health_check',
        name: 'Perform System Health Check',
        phase: InitializationPhase.HEALTH_CHECK,
        required: this.config.enableHealthCheck,
        timeout: 10000,
        dependencies: ['init_health_monitor']
      }
    ];

    for (const step of steps) {
      this.initializationSteps.set(step.id, {
        ...step,
        status: 'pending'
      });
    }
  }

  private async executePhase(phase: InitializationPhase): Promise<void> {
    this.currentPhase = phase;
    this.emit('phase_started', { phase });

    const phaseSteps = Array.from(this.initializationSteps.values())
      .filter(step => step.phase === phase);

    if (this.config.parallelInitialization) {
      await this.executeStepsInParallel(phaseSteps);
    } else {
      await this.executeStepsSequentially(phaseSteps);
    }

    this.emit('phase_completed', { phase });
  }

  private async executeStepsSequentially(steps: InitializationStep[]): Promise<void> {
    for (const step of steps) {
      if (!step.required && this.config.skipOptionalSteps) {
        step.status = 'skipped';
        continue;
      }

      await this.executeStep(step);
    }
  }

  private async executeStepsInParallel(steps: InitializationStep[]): Promise<void> {
    const stepPromises = steps.map(async (step) => {
      if (!step.required && this.config.skipOptionalSteps) {
        step.status = 'skipped';
        return;
      }

      // Wait for dependencies
      await this.waitForDependencies(step);

      // Execute step
      return this.executeStep(step);
    });

    await Promise.all(stepPromises);
  }

  private async waitForDependencies(step: InitializationStep): Promise<void> {
    if (step.dependencies.length === 0) {
      return;
    }

    const checkDependencies = () => {
      return step.dependencies.every(depId => {
        const depStep = this.initializationSteps.get(depId);
        return depStep && (depStep.status === 'completed' || depStep.status === 'skipped');
      });
    };

    // Wait for dependencies with timeout
    const timeout = 30000; // 30 seconds
    const startTime = Date.now();

    while (!checkDependencies() && (Date.now() - startTime) < timeout) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    if (!checkDependencies()) {
      throw new SystemError(
        `Dependencies not met for step ${step.id}`,
        ErrorType.SYSTEM_ERROR,
        ErrorSeverity.HIGH
      );
    }
  }

  private async executeStep(step: InitializationStep): Promise<void> {
    step.status = 'running';
    step.startTime = new Date();
    this.emit('step_started', step);

    try {
      const result = await this.executeStepWithTimeout(step);
      step.status = 'completed';
      step.result = result;
      step.endTime = new Date();
      this.emit('step_completed', step);

    } catch (error) {
      step.status = 'failed';
      step.error = error as Error;
      step.endTime = new Date();
      this.emit('step_failed', step);

      if (step.required) {
        throw error;
      }
    }
  }

  private async executeStepWithTimeout(step: InitializationStep): Promise<any> {
    return new Promise(async (resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new SystemError(
          `Step ${step.id} timed out after ${step.timeout}ms`,
          ErrorType.TIMEOUT_ERROR,
          ErrorSeverity.HIGH
        ));
      }, step.timeout);

      try {
        const result = await this.executeStepLogic(step);
        clearTimeout(timeout);
        resolve(result);
      } catch (error) {
        clearTimeout(timeout);
        reject(error);
      }
    });
  }

  private async executeStepLogic(step: InitializationStep): Promise<any> {
    switch (step.id) {
      case 'load_system_config':
        return await this.loadSystemConfig();
      case 'load_project_config':
        return await this.loadProjectConfig();
      case 'validate_environment':
        return await this.validateEnvironment();
      case 'check_dependencies':
        return await this.checkDependencies();
      case 'init_configuration_manager':
        return await this.initializeComponent('configurationManager');
      case 'init_environment_manager':
        return await this.initializeComponent('environmentManager');
      case 'init_recovery_system':
        return await this.initializeRecoverySystem();
      case 'init_coordination_manager':
        return await this.initializeComponent('coordinationManager');
      case 'init_task_manager':
        return await this.initializeComponent('taskManager');
      case 'init_file_manager':
        return await this.initializeComponent('fileManager');
      case 'init_message_manager':
        return await this.initializeComponent('messageManager');
      case 'init_health_monitor':
        return await this.initializeComponent('healthMonitor');
      case 'system_health_check':
        return await this.performSystemHealthCheck();
      default:
        throw new SystemError(
          `Unknown initialization step: ${step.id}`,
          ErrorType.SYSTEM_ERROR,
          ErrorSeverity.MEDIUM
        );
    }
  }

  private async loadSystemConfig(): Promise<SystemConfig> {
    // This would load system configuration from files or environment
    const defaultConfig: SystemConfig = {
      maxAgents: 10,
      maxConcurrentTasks: 50,
      taskTimeout: 300000, // 5 minutes
      fileLockTimeout: 60000, // 1 minute
      heartbeatInterval: 30000, // 30 seconds
      retryAttempts: 3,
      logLevel: 'info'
    };

    return defaultConfig;
  }

  private async loadProjectConfig(): Promise<ProjectConfig | undefined> {
    // This would load project-specific configuration
    return undefined;
  }

  private async validateEnvironment(): Promise<boolean> {
    // Validate system environment
    const requiredEnvVars = ['NODE_ENV'];
    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

    if (missingVars.length > 0) {
      throw new SystemError(
        `Missing required environment variables: ${missingVars.join(', ')}`,
        ErrorType.CONFIGURATION_ERROR,
        ErrorSeverity.HIGH
      );
    }

    return true;
  }

  private async checkDependencies(): Promise<boolean> {
    // Check system dependencies
    const requiredModules = ['fs', 'path', 'events'];

    for (const moduleName of requiredModules) {
      try {
        require(moduleName);
      } catch (error) {
        throw new SystemError(
          `Required module not available: ${moduleName}`,
          ErrorType.DEPENDENCY_ERROR,
          ErrorSeverity.HIGH
        );
      }
    }

    return true;
  }

  private async initializeComponent(componentName: keyof SystemComponents): Promise<any> {
    switch (componentName) {
      case 'configurationManager':
        this.components.configurationManager = new ConfigurationManager();
        await this.components.configurationManager.initialize();
        return this.components.configurationManager;

      case 'environmentManager':
        this.components.environmentManager = new EnvironmentManager();
        await this.components.environmentManager.initialize();
        return this.components.environmentManager;

      case 'coordinationManager':
        this.components.coordinationManager = new CoordinationManager({
          maxAgents: 100,
          healthCheckInterval: 30000,
          sessionTimeout: 300000,
          maxConcurrentSessions: 10
        });
        await this.components.coordinationManager.initialize();
        return this.components.coordinationManager;

      case 'taskManager':
        this.components.taskManager = new TaskManager();
        await this.components.taskManager.initialize();
        return this.components.taskManager;

      case 'fileManager':
        this.components.fileManager = new FileManager();
        await this.components.fileManager.initialize();
        return this.components.fileManager;

      case 'messageManager':
        this.components.messageManager = new MessageManager();
        await this.components.messageManager.initialize();
        return this.components.messageManager;

      case 'healthMonitor':
        if (!this.components.autoRecoveryManager || !this.components.failoverCoordinator) {
          throw new SystemError(
            'Recovery system must be initialized before health monitor',
            ErrorType.DEPENDENCY_ERROR,
            ErrorSeverity.HIGH
          );
        }

        this.components.healthMonitor = new SystemHealthMonitor({}, {
          autoRecoveryManager: this.components.autoRecoveryManager,
          failoverCoordinator: this.components.failoverCoordinator,
          systemResourceMonitor: null, // Would be actual implementation
          agentManager: this.components.coordinationManager,
          taskManager: this.components.taskManager
        });
        return this.components.healthMonitor;

      default:
        throw new SystemError(
          `Unknown component: ${componentName}`,
          ErrorType.SYSTEM_ERROR,
          ErrorSeverity.MEDIUM
        );
    }
  }

  private async initializeRecoverySystem(): Promise<void> {
    // Initialize recovery components
    this.components.autoRecoveryManager = new AutoRecoveryManager({}, {
      agentManager: this.components.coordinationManager,
      taskManager: this.components.taskManager,
      coordinationManager: this.components.coordinationManager
    });
    this.components.failoverCoordinator = new FailoverCoordinator({}, {
      taskManager: this.components.taskManager,
      agentManager: this.components.coordinationManager,
      coordinationManager: this.components.coordinationManager
    });

    await this.components.autoRecoveryManager.initialize();
    await this.components.failoverCoordinator.initialize();
  }

  private async performSystemHealthCheck(): Promise<boolean> {
    if (!this.components.healthMonitor) {
      throw new SystemError(
        'Health monitor not initialized',
        ErrorType.SYSTEM_ERROR,
        ErrorSeverity.HIGH
      );
    }

    const healthStatus = await this.components.healthMonitor.getSystemHealthStatus();

    if (healthStatus.overallHealth < 0.3) { // Assuming overallHealth is a number between 0-1
      throw new SystemError(
        'System health check failed',
        ErrorType.SYSTEM_ERROR,
        ErrorSeverity.HIGH
      );
    }

    return true;
  }

  private async cleanup(): Promise<void> {
    // Cleanup any partially initialized components
    for (const [componentName, component] of Object.entries(this.components)) {
      if (component && typeof (component as any).shutdown === 'function') {
        try {
          await (component as any).shutdown();
        } catch (error) {
          console.error(`Error cleaning up ${componentName}:`, error);
        }
      }
    }
  }
}
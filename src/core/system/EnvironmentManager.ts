/**
 * Environment Manager
 * Handles environment setup, validation, and management
 */

import { EventEmitter } from 'eventemitter3';
import * as os from 'os';
import * as fs from 'fs/promises';
import * as path from 'path';
import { SystemError } from '../errors/SystemError';
import { ErrorType, ErrorSeverity } from '../../types/error.types';

/**
 * Environment information
 */
export interface EnvironmentInfo {
  platform: NodeJS.Platform;
  architecture: string;
  nodeVersion: string;
  npmVersion?: string;
  electronVersion?: string;
  operatingSystem: {
    type: string;
    release: string;
    version: string;
    totalMemory: number;
    freeMemory: number;
    cpuCount: number;
  };
  directories: {
    home: string;
    temp: string;
    current: string;
    config: string;
    data: string;
    logs: string;
  };
  network: {
    hostname: string;
    interfaces: NetworkInterface[];
  };
  permissions: {
    canReadFiles: boolean;
    canWriteFiles: boolean;
    canExecuteFiles: boolean;
    canCreateDirectories: boolean;
  };
}

/**
 * Network interface information
 */
export interface NetworkInterface {
  name: string;
  family: 'IPv4' | 'IPv6';
  address: string;
  internal: boolean;
  mac: string;
}

/**
 * Environment requirement
 */
export interface EnvironmentRequirement {
  name: string;
  type: 'node_version' | 'memory' | 'disk_space' | 'permission' | 'module' | 'command' | 'custom';
  required: boolean;
  description: string;
  validator: (env: EnvironmentInfo) => Promise<boolean>;
  errorMessage?: string;
  warningMessage?: string;
}

/**
 * Environment validation result
 */
export interface EnvironmentValidationResult {
  requirement: EnvironmentRequirement;
  passed: boolean;
  error?: Error;
  warning?: string;
  details?: any;
}

/**
 * Environment setup task
 */
export interface EnvironmentSetupTask {
  id: string;
  name: string;
  description: string;
  required: boolean;
  executor: () => Promise<void>;
  rollback?: () => Promise<void>;
  dependencies: string[];
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  error?: Error;
  result?: any;
}

/**
 * Environment Manager
 */
export class EnvironmentManager extends EventEmitter {
  private environmentInfo: EnvironmentInfo | null = null;
  private requirements: Map<string, EnvironmentRequirement> = new Map();
  private setupTasks: Map<string, EnvironmentSetupTask> = new Map();
  private validationResults: Map<string, EnvironmentValidationResult> = new Map();
  private isInitialized: boolean = false;

  constructor() {
    super();
    this.setupDefaultRequirements();
    this.setupDefaultTasks();
  }

  /**
   * Initialize environment manager
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      // Gather environment information
      this.environmentInfo = await this.gatherEnvironmentInfo();
      
      // Validate environment
      await this.validateEnvironment();
      
      // Run setup tasks
      await this.runSetupTasks();
      
      this.isInitialized = true;
      this.emit('initialized', this.environmentInfo);

    } catch (error) {
      throw new SystemError(
        `Failed to initialize environment manager: ${error instanceof Error ? error.message : 'Unknown error'}`,
        ErrorType.ENVIRONMENT_ERROR,
        ErrorSeverity.HIGH
      );
    }
  }

  /**
   * Shutdown environment manager
   */
  async shutdown(): Promise<void> {
    if (!this.isInitialized) {
      return;
    }

    // Run cleanup tasks
    await this.runCleanupTasks();
    
    this.isInitialized = false;
    this.emit('shutdown');
  }

  /**
   * Get environment information
   */
  getEnvironmentInfo(): EnvironmentInfo | null {
    return this.environmentInfo ? { ...this.environmentInfo } : null;
  }

  /**
   * Add environment requirement
   */
  addRequirement(requirement: EnvironmentRequirement): void {
    this.requirements.set(requirement.name, requirement);
  }

  /**
   * Remove environment requirement
   */
  removeRequirement(name: string): boolean {
    return this.requirements.delete(name);
  }

  /**
   * Get all requirements
   */
  getRequirements(): EnvironmentRequirement[] {
    return Array.from(this.requirements.values());
  }

  /**
   * Add setup task
   */
  addSetupTask(task: EnvironmentSetupTask): void {
    this.setupTasks.set(task.id, task);
  }

  /**
   * Remove setup task
   */
  removeSetupTask(id: string): boolean {
    return this.setupTasks.delete(id);
  }

  /**
   * Get all setup tasks
   */
  getSetupTasks(): EnvironmentSetupTask[] {
    return Array.from(this.setupTasks.values());
  }

  /**
   * Validate environment against requirements
   */
  async validateEnvironment(): Promise<Map<string, EnvironmentValidationResult>> {
    if (!this.environmentInfo) {
      throw new SystemError(
        'Environment information not available',
        ErrorType.ENVIRONMENT_ERROR,
        ErrorSeverity.HIGH
      );
    }

    this.validationResults.clear();
    const errors: string[] = [];
    const warnings: string[] = [];

    for (const requirement of Array.from(this.requirements.values())) {
      try {
        const passed = await requirement.validator(this.environmentInfo);
        const result: EnvironmentValidationResult = {
          requirement,
          passed
        };

        if (!passed) {
          if (requirement.required) {
            const errorMessage = requirement.errorMessage || `Requirement failed: ${requirement.name}`;
            result.error = new SystemError(errorMessage, ErrorType.ENVIRONMENT_ERROR, ErrorSeverity.HIGH);
            errors.push(errorMessage);
          } else {
            const warningMessage = requirement.warningMessage || `Optional requirement not met: ${requirement.name}`;
            result.warning = warningMessage;
            warnings.push(warningMessage);
          }
        }

        this.validationResults.set(requirement.name, result);
        this.emit('requirement_validated', result);

      } catch (error) {
        const result: EnvironmentValidationResult = {
          requirement,
          passed: false,
          error: error as Error
        };

        this.validationResults.set(requirement.name, result);
        
        if (requirement.required) {
          errors.push(`Requirement validation error: ${requirement.name} - ${(error as Error).message}`);
        } else {
          warnings.push(`Optional requirement validation warning: ${requirement.name} - ${(error as Error).message}`);
        }
      }
    }

    if (errors.length > 0) {
      throw new SystemError(
        `Environment validation failed: ${errors.join('; ')}`,
        ErrorType.ENVIRONMENT_ERROR,
        ErrorSeverity.HIGH
      );
    }

    if (warnings.length > 0) {
      this.emit('validation_warnings', warnings);
    }

    this.emit('environment_validated', this.validationResults);
    return new Map(this.validationResults);
  }

  /**
   * Get validation results
   */
  getValidationResults(): Map<string, EnvironmentValidationResult> {
    return new Map(this.validationResults);
  }

  /**
   * Check if environment is healthy
   */
  isEnvironmentHealthy(): boolean {
    if (!this.isInitialized || this.validationResults.size === 0) {
      return false;
    }

    // Check if all required requirements pass
    for (const result of Array.from(this.validationResults.values())) {
      if (result.requirement.required && !result.passed) {
        return false;
      }
    }

    return true;
  }

  /**
   * Get system resource usage
   */
  async getResourceUsage(): Promise<{
    cpu: { usage: number; loadAverage: number[] };
    memory: { used: number; total: number; usage: number };
    disk: { used: number; total: number; usage: number };
  }> {
    const memoryUsage = process.memoryUsage();
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;

    // Get disk usage for current directory
    const diskUsage = await this.getDiskUsage(process.cwd());

    return {
      cpu: {
        usage: await this.getCpuUsage(),
        loadAverage: os.loadavg()
      },
      memory: {
        used: usedMemory,
        total: totalMemory,
        usage: (usedMemory / totalMemory) * 100
      },
      disk: diskUsage
    };
  }

  /**
   * Create required directories
   */
  async createRequiredDirectories(): Promise<void> {
    if (!this.environmentInfo) {
      throw new SystemError(
        'Environment information not available',
        ErrorType.ENVIRONMENT_ERROR,
        ErrorSeverity.HIGH
      );
    }

    const directories = [
      this.environmentInfo.directories.config,
      this.environmentInfo.directories.data,
      this.environmentInfo.directories.logs
    ];

    for (const dir of directories) {
      try {
        await fs.mkdir(dir, { recursive: true });
      } catch (error) {
        throw new SystemError(
          `Failed to create directory ${dir}: ${(error as Error).message}`,
          ErrorType.ENVIRONMENT_ERROR,
          ErrorSeverity.HIGH
        );
      }
    }
  }

  /**
   * Clean up temporary files
   */
  async cleanupTemporaryFiles(): Promise<void> {
    if (!this.environmentInfo) {
      return;
    }

    const tempDir = path.join(this.environmentInfo.directories.temp, 'multi-agent-ide');
    
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore errors - temp cleanup is not critical
      console.warn(`Warning: Could not clean up temporary directory ${tempDir}:`, error);
    }
  }

  // Private methods

  private async gatherEnvironmentInfo(): Promise<EnvironmentInfo> {
    const networkInterfaces = os.networkInterfaces();
    const interfaces: NetworkInterface[] = [];

    for (const [name, addresses] of Object.entries(networkInterfaces)) {
      if (addresses) {
        for (const addr of addresses) {
          interfaces.push({
            name,
            family: addr.family as 'IPv4' | 'IPv6',
            address: addr.address,
            internal: addr.internal,
            mac: addr.mac
          });
        }
      }
    }

    // Get application directories
    const homeDir = os.homedir();
    const appName = 'multi-agent-ide';
    
    const directories = {
      home: homeDir,
      temp: os.tmpdir(),
      current: process.cwd(),
      config: path.join(homeDir, '.config', appName),
      data: path.join(homeDir, '.local', 'share', appName),
      logs: path.join(homeDir, '.local', 'share', appName, 'logs')
    };

    // Check permissions
    const permissions = await this.checkPermissions();

    return {
      platform: os.platform(),
      architecture: os.arch(),
      nodeVersion: process.version,
      npmVersion: await this.getNpmVersion(),
      electronVersion: await this.getElectronVersion(),
      operatingSystem: {
        type: os.type(),
        release: os.release(),
        version: os.version(),
        totalMemory: os.totalmem(),
        freeMemory: os.freemem(),
        cpuCount: os.cpus().length
      },
      directories,
      network: {
        hostname: os.hostname(),
        interfaces
      },
      permissions
    };
  }

  private async checkPermissions(): Promise<EnvironmentInfo['permissions']> {
    const testDir = path.join(os.tmpdir(), 'multi-agent-ide-permission-test');
    const testFile = path.join(testDir, 'test.txt');

    let canReadFiles = false;
    let canWriteFiles = false;
    let canExecuteFiles = false;
    let canCreateDirectories = false;

    try {
      // Test directory creation
      await fs.mkdir(testDir, { recursive: true });
      canCreateDirectories = true;

      // Test file writing
      await fs.writeFile(testFile, 'test');
      canWriteFiles = true;

      // Test file reading
      await fs.readFile(testFile, 'utf-8');
      canReadFiles = true;

      // Test file execution (on Unix-like systems)
      if (os.platform() !== 'win32') {
        try {
          await fs.chmod(testFile, 0o755);
          canExecuteFiles = true;
        } catch (error) {
          // Execution permission test failed
        }
      } else {
        // On Windows, assume execution is possible if we can write
        canExecuteFiles = canWriteFiles;
      }

      // Cleanup
      await fs.rm(testDir, { recursive: true, force: true });

    } catch (error) {
      // Permission tests failed
    }

    return {
      canReadFiles,
      canWriteFiles,
      canExecuteFiles,
      canCreateDirectories
    };
  }

  private async getNpmVersion(): Promise<string | undefined> {
    try {
      const { execSync } = require('child_process');
      const version = execSync('npm --version', { encoding: 'utf-8' }).trim();
      return version;
    } catch (error) {
      return undefined;
    }
  }

  private async getElectronVersion(): Promise<string | undefined> {
    try {
      // Try to get Electron version from process
      if (process.versions.electron) {
        return process.versions.electron;
      }

      // Try to get from package.json
      const packagePath = path.join(process.cwd(), 'package.json');
      const packageData = await fs.readFile(packagePath, 'utf-8');
      const packageJson = JSON.parse(packageData);
      
      return packageJson.devDependencies?.electron || packageJson.dependencies?.electron;
    } catch (error) {
      return undefined;
    }
  }

  private async getCpuUsage(): Promise<number> {
    return new Promise((resolve) => {
      const startUsage = process.cpuUsage();
      const startTime = process.hrtime();

      setTimeout(() => {
        const endUsage = process.cpuUsage(startUsage);
        const endTime = process.hrtime(startTime);
        
        const totalTime = endTime[0] * 1000000 + endTime[1] / 1000; // microseconds
        const totalCpuTime = endUsage.user + endUsage.system; // microseconds
        
        const usage = (totalCpuTime / totalTime) * 100;
        resolve(Math.min(100, Math.max(0, usage)));
      }, 100);
    });
  }

  private async getDiskUsage(dirPath: string): Promise<{ used: number; total: number; usage: number }> {
    try {
      const stats = await fs.stat(dirPath);
      // This is a simplified implementation
      // In a real implementation, you'd use platform-specific APIs to get actual disk usage
      return {
        used: 0,
        total: 1000000000, // 1GB placeholder
        usage: 0
      };
    } catch (error) {
      return {
        used: 0,
        total: 0,
        usage: 0
      };
    }
  }

  private setupDefaultRequirements(): void {
    // Node.js version requirement
    this.addRequirement({
      name: 'node_version',
      type: 'node_version',
      required: true,
      description: 'Node.js version 16 or higher',
      validator: async (env) => {
        const version = env.nodeVersion.replace('v', '');
        const major = parseInt(version.split('.')[0]);
        return major >= 16;
      },
      errorMessage: 'Node.js version 16 or higher is required'
    });

    // Memory requirement
    this.addRequirement({
      name: 'memory',
      type: 'memory',
      required: true,
      description: 'At least 2GB of available memory',
      validator: async (env) => {
        const availableGB = env.operatingSystem.freeMemory / (1024 * 1024 * 1024);
        return availableGB >= 2;
      },
      errorMessage: 'At least 2GB of available memory is required',
      warningMessage: 'Low memory detected - performance may be affected'
    });

    // File permissions requirement
    this.addRequirement({
      name: 'file_permissions',
      type: 'permission',
      required: true,
      description: 'Read and write file permissions',
      validator: async (env) => {
        return env.permissions.canReadFiles && env.permissions.canWriteFiles;
      },
      errorMessage: 'Read and write file permissions are required'
    });

    // Directory creation permission
    this.addRequirement({
      name: 'directory_permissions',
      type: 'permission',
      required: true,
      description: 'Directory creation permissions',
      validator: async (env) => {
        return env.permissions.canCreateDirectories;
      },
      errorMessage: 'Directory creation permissions are required'
    });
  }

  private setupDefaultTasks(): void {
    // Create required directories
    this.addSetupTask({
      id: 'create_directories',
      name: 'Create Required Directories',
      description: 'Create application configuration and data directories',
      required: true,
      executor: async () => {
        await this.createRequiredDirectories();
      },
      dependencies: [],
      status: 'pending'
    });

    // Clean up temporary files
    this.addSetupTask({
      id: 'cleanup_temp',
      name: 'Clean Temporary Files',
      description: 'Clean up temporary files from previous sessions',
      required: false,
      executor: async () => {
        await this.cleanupTemporaryFiles();
      },
      dependencies: [],
      status: 'pending'
    });
  }

  private async runSetupTasks(): Promise<void> {
    const tasks = Array.from(this.setupTasks.values());
    const completedTasks = new Set<string>();

    // Execute tasks respecting dependencies
    while (completedTasks.size < tasks.length) {
      const readyTasks = tasks.filter(task => 
        task.status === 'pending' &&
        task.dependencies.every(dep => completedTasks.has(dep))
      );

      if (readyTasks.length === 0) {
        // Check for circular dependencies or missing dependencies
        const pendingTasks = tasks.filter(task => task.status === 'pending');
        if (pendingTasks.length > 0) {
          throw new SystemError(
            'Circular dependency or missing dependency in setup tasks',
            ErrorType.ENVIRONMENT_ERROR,
            ErrorSeverity.HIGH
          );
        }
        break;
      }

      // Execute ready tasks in parallel
      await Promise.all(readyTasks.map(async (task) => {
        task.status = 'running';
        this.emit('setup_task_started', task);

        try {
          task.result = await task.executor();
          task.status = 'completed';
          completedTasks.add(task.id);
          this.emit('setup_task_completed', task);

        } catch (error) {
          task.status = 'failed';
          task.error = error as Error;
          this.emit('setup_task_failed', task);

          if (task.required) {
            throw new SystemError(
              `Required setup task failed: ${task.name} - ${(error as Error).message}`,
              ErrorType.ENVIRONMENT_ERROR,
              ErrorSeverity.HIGH
            );
          }
        }
      }));
    }
  }

  private async runCleanupTasks(): Promise<void> {
    const tasks = Array.from(this.setupTasks.values())
      .filter(task => task.rollback && task.status === 'completed')
      .reverse(); // Run cleanup in reverse order

    for (const task of tasks) {
      try {
        await task.rollback!();
        this.emit('cleanup_task_completed', task);
      } catch (error) {
        this.emit('cleanup_task_failed', { task, error });
        // Continue with other cleanup tasks even if one fails
      }
    }
  }
}
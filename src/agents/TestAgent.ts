/**
 * Test Agent implementation for testing BaseAgent functionality
 */

import { BaseAgent } from './BaseAgent';
import { AgentConfig, AgentType, Task, TaskResult } from '../core';

/**
 * Simple test agent implementation
 */
export class TestAgent extends BaseAgent {
  private _initializationData: any = null;

  constructor(id: string, name: string, config: AgentConfig) {
    super(id, name, AgentType.TESTING, config);
  }

  /**
   * Initialize the test agent
   */
  protected async onInitialize(): Promise<void> {
    this.log('info', 'Initializing test agent');
    this._initializationData = {
      initializedAt: new Date(),
      capabilities: this.getCapabilities()
    };
    
    // Simulate some initialization work
    await new Promise(resolve => setTimeout(resolve, 100));
    
    this.log('info', 'Test agent initialized successfully');
  }

  /**
   * Execute a task
   */
  protected async onExecuteTask(task: Task): Promise<TaskResult> {
    this.log('info', `Executing task: ${task.title}`, { taskId: task.id });
    
    // Validate task
    this.validateTask(task);
    
    // Simulate task execution based on task type
    const result = await this.simulateTaskExecution(task);
    
    this.log('info', `Task completed successfully: ${task.title}`);
    return this.createTaskResult(task.id, true, result);
  }

  /**
   * Shutdown the test agent
   */
  protected async onShutdown(): Promise<void> {
    this.log('info', 'Shutting down test agent');
    
    // Clean up any resources
    this._initializationData = null;
    
    // Simulate cleanup work
    await new Promise(resolve => setTimeout(resolve, 50));
    
    this.log('info', 'Test agent shutdown complete');
  }

  /**
   * Handle configuration updates
   */
  protected async onConfigUpdate(newConfig: AgentConfig): Promise<void> {
    this.log('info', 'Updating test agent configuration', { 
      oldConfig: this.getConfig(),
      newConfig 
    });
    
    // Validate new configuration
    if (newConfig.maxConcurrentTasks <= 0) {
      throw new Error('Max concurrent tasks must be greater than 0');
    }
    
    // Simulate config update work
    await new Promise(resolve => setTimeout(resolve, 50));
    
    this.log('info', 'Test agent configuration updated successfully');
  }

  /**
   * Simulate task execution based on task type
   */
  private async simulateTaskExecution(task: Task): Promise<any> {
    const executionTime = Math.random() * 1000 + 500; // 500-1500ms
    
    // Simulate different types of work
    switch (task.type) {
      case 'test':
        return this.simulateTestExecution(task, executionTime);
      case 'analysis':
        return this.simulateAnalysis(task, executionTime);
      case 'validation':
        return this.simulateValidation(task, executionTime);
      default:
        return this.simulateGenericWork(task, executionTime);
    }
  }

  /**
   * Simulate test execution
   */
  private async simulateTestExecution(task: Task, duration: number): Promise<any> {
    await new Promise(resolve => setTimeout(resolve, duration));
    
    const testResults = {
      testsRun: Math.floor(Math.random() * 50) + 10,
      testsPassed: 0,
      testsFailed: 0,
      coverage: Math.random() * 30 + 70 // 70-100%
    };
    
    testResults.testsPassed = Math.floor(testResults.testsRun * 0.9);
    testResults.testsFailed = testResults.testsRun - testResults.testsPassed;
    
    return {
      type: 'test-results',
      results: testResults,
      duration: duration,
      status: testResults.testsFailed === 0 ? 'passed' : 'failed'
    };
  }

  /**
   * Simulate analysis work
   */
  private async simulateAnalysis(task: Task, duration: number): Promise<any> {
    await new Promise(resolve => setTimeout(resolve, duration));
    
    return {
      type: 'analysis-results',
      findings: [
        'Code complexity is within acceptable limits',
        'No security vulnerabilities detected',
        'Performance optimizations available'
      ],
      metrics: {
        complexity: Math.random() * 10 + 1,
        maintainability: Math.random() * 40 + 60,
        reliability: Math.random() * 20 + 80
      },
      duration: duration
    };
  }

  /**
   * Simulate validation work
   */
  private async simulateValidation(task: Task, duration: number): Promise<any> {
    await new Promise(resolve => setTimeout(resolve, duration));
    
    const issues = Math.random() < 0.3 ? [] : [
      'Missing documentation for public methods',
      'Inconsistent naming conventions',
      'Unused imports detected'
    ];
    
    return {
      type: 'validation-results',
      isValid: issues.length === 0,
      issues: issues,
      checkedItems: Math.floor(Math.random() * 100) + 50,
      duration: duration
    };
  }

  /**
   * Simulate generic work
   */
  private async simulateGenericWork(task: Task, duration: number): Promise<any> {
    await new Promise(resolve => setTimeout(resolve, duration));
    
    return {
      type: 'generic-results',
      message: `Completed task: ${task.title}`,
      duration: duration,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Get initialization data (for testing)
   */
  public getInitializationData(): any {
    return this._initializationData;
  }

  /**
   * Force an error (for testing error handling)
   */
  public async forceError(errorMessage: string = 'Forced error for testing'): Promise<void> {
    throw new Error(errorMessage);
  }

  /**
   * Simulate heavy workload (for testing concurrency)
   */
  public async simulateHeavyWork(duration: number = 2000): Promise<string> {
    const startTime = Date.now();
    await new Promise(resolve => setTimeout(resolve, duration));
    const actualDuration = Date.now() - startTime;
    
    return `Heavy work completed in ${actualDuration}ms`;
  }
}
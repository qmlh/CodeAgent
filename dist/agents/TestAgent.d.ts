/**
 * Test Agent implementation for testing BaseAgent functionality
 */
import { BaseAgent } from './BaseAgent';
import { AgentConfig, AgentType, Task, TaskResult } from '../core';
/**
 * Simple test agent implementation
 */
export declare class TestAgent extends BaseAgent {
    private _initializationData;
    constructor(id: string, name: string, type: AgentType, config: AgentConfig);
    /**
     * Initialize the test agent
     */
    protected onInitialize(): Promise<void>;
    /**
     * Execute a task
     */
    protected onExecuteTask(task: Task): Promise<TaskResult>;
    /**
     * Shutdown the test agent
     */
    protected onShutdown(): Promise<void>;
    /**
     * Handle configuration updates
     */
    protected onConfigUpdate(newConfig: AgentConfig): Promise<void>;
    /**
     * Simulate task execution based on task type
     */
    private simulateTaskExecution;
    /**
     * Simulate test execution
     */
    private simulateTestExecution;
    /**
     * Simulate analysis work
     */
    private simulateAnalysis;
    /**
     * Simulate validation work
     */
    private simulateValidation;
    /**
     * Simulate generic work
     */
    private simulateGenericWork;
    /**
     * Get initialization data (for testing)
     */
    getInitializationData(): any;
    /**
     * Force an error (for testing error handling)
     */
    forceError(errorMessage?: string): Promise<void>;
    /**
     * Simulate heavy workload (for testing concurrency)
     */
    simulateHeavyWork(duration?: number): Promise<string>;
}

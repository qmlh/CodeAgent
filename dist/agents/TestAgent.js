"use strict";
/**
 * Test Agent implementation for testing BaseAgent functionality
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.TestAgent = void 0;
const BaseAgent_1 = require("./BaseAgent");
const core_1 = require("../core");
/**
 * Simple test agent implementation
 */
class TestAgent extends BaseAgent_1.BaseAgent {
    constructor(id, name, config) {
        super(id, name, core_1.AgentType.TESTING, config);
        this._initializationData = null;
    }
    /**
     * Initialize the test agent
     */
    async onInitialize() {
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
    async onExecuteTask(task) {
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
    async onShutdown() {
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
    async onConfigUpdate(newConfig) {
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
    async simulateTaskExecution(task) {
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
    async simulateTestExecution(task, duration) {
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
    async simulateAnalysis(task, duration) {
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
    async simulateValidation(task, duration) {
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
    async simulateGenericWork(task, duration) {
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
    getInitializationData() {
        return this._initializationData;
    }
    /**
     * Force an error (for testing error handling)
     */
    async forceError(errorMessage = 'Forced error for testing') {
        throw new Error(errorMessage);
    }
    /**
     * Simulate heavy workload (for testing concurrency)
     */
    async simulateHeavyWork(duration = 2000) {
        const startTime = Date.now();
        await new Promise(resolve => setTimeout(resolve, duration));
        const actualDuration = Date.now() - startTime;
        return `Heavy work completed in ${actualDuration}ms`;
    }
}
exports.TestAgent = TestAgent;
//# sourceMappingURL=TestAgent.js.map
"use strict";
/**
 * Base Agent abstract class
 * Provides common functionality for all agent types
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseAgent = void 0;
const eventemitter3_1 = require("eventemitter3");
const uuid_1 = require("uuid");
const core_1 = require("../core");
const SystemError_1 = require("../core/errors/SystemError");
/**
 * Base Agent abstract class
 */
class BaseAgent extends eventemitter3_1.EventEmitter {
    get status() {
        return this._status;
    }
    constructor(id, name, specialization, config) {
        super();
        this._status = core_1.AgentStatus.OFFLINE;
        this._currentTask = null;
        this._workload = 0;
        this._isInitialized = false;
        this._shutdownRequested = false;
        // Task execution tracking
        this._activeTasks = new Map();
        this._taskHistory = [];
        // File access tracking
        this._fileTokens = new Map();
        // Message handling
        this._messageHandlers = new Map();
        this.id = id;
        this.name = name;
        this.specialization = specialization;
        this._config = { ...config };
        this.setupDefaultMessageHandlers();
    }
    /**
     * Initialize the agent
     */
    async initialize(config) {
        if (this._isInitialized) {
            throw new SystemError_1.AgentError('Agent is already initialized', this.id);
        }
        try {
            this.updateStatus(core_1.AgentStatus.OFFLINE);
            this._config = { ...config };
            await this.onInitialize();
            this._isInitialized = true;
            this.updateStatus(core_1.AgentStatus.IDLE);
            this.emit('config-updated', this._config);
        }
        catch (error) {
            const agentError = new SystemError_1.AgentError(`Failed to initialize agent: ${error instanceof Error ? error.message : 'Unknown error'}`, this.id);
            this.emit('error', agentError);
            throw agentError;
        }
    }
    /**
     * Execute a task
     */
    async executeTask(task) {
        if (!this._isInitialized) {
            throw new SystemError_1.AgentError('Agent must be initialized before executing tasks', this.id);
        }
        if (this._status !== core_1.AgentStatus.IDLE && this._status !== core_1.AgentStatus.WORKING) {
            throw new SystemError_1.AgentError(`Agent cannot execute tasks in status: ${this._status}`, this.id);
        }
        if (this._activeTasks.size >= this._config.maxConcurrentTasks) {
            throw new SystemError_1.AgentError('Agent has reached maximum concurrent task limit', this.id);
        }
        const startTime = Date.now();
        this._activeTasks.set(task.id, task);
        this._currentTask = task;
        this.updateWorkload();
        this.updateStatus(core_1.AgentStatus.WORKING);
        this.emit('task-started', task);
        try {
            // Set up task timeout
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => {
                    reject(new SystemError_1.AgentError(`Task execution timeout after ${this._config.timeout}ms`, this.id));
                }, this._config.timeout);
            });
            // Execute task with timeout
            const result = await Promise.race([
                this.onExecuteTask(task),
                timeoutPromise
            ]);
            // Calculate execution time
            const executionTime = Date.now() - startTime;
            const finalResult = {
                ...result,
                executionTime,
                completedAt: new Date()
            };
            // Clean up
            this._activeTasks.delete(task.id);
            this._taskHistory.push(finalResult);
            // Update current task if this was the current one
            if (this._currentTask?.id === task.id) {
                this._currentTask = this._activeTasks.size > 0 ?
                    Array.from(this._activeTasks.values())[0] : null;
            }
            this.updateWorkload();
            // Update status
            if (this._activeTasks.size === 0) {
                this.updateStatus(core_1.AgentStatus.IDLE);
            }
            this.emit('task-completed', task, finalResult);
            return finalResult;
        }
        catch (error) {
            // Clean up on error
            this._activeTasks.delete(task.id);
            if (this._currentTask?.id === task.id) {
                this._currentTask = this._activeTasks.size > 0 ?
                    Array.from(this._activeTasks.values())[0] : null;
            }
            this.updateWorkload();
            if (this._activeTasks.size === 0) {
                this.updateStatus(core_1.AgentStatus.IDLE);
            }
            const agentError = error instanceof SystemError_1.AgentError ? error :
                new SystemError_1.AgentError(`Task execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`, this.id);
            const failedResult = {
                taskId: task.id,
                success: false,
                error: agentError.message,
                filesModified: [],
                executionTime: Date.now() - startTime,
                completedAt: new Date()
            };
            this._taskHistory.push(failedResult);
            this.emit('task-failed', task, agentError);
            throw agentError;
        }
    }
    /**
     * Handle incoming message
     */
    async handleMessage(message) {
        if (!this._isInitialized) {
            throw new SystemError_1.AgentError('Agent must be initialized before handling messages', this.id);
        }
        try {
            this.emit('message-received', message);
            const handler = this._messageHandlers.get(message.type);
            if (handler) {
                await handler(message);
            }
            else {
                await this.onMessageReceived(message);
            }
        }
        catch (error) {
            const agentError = new SystemError_1.AgentError(`Failed to handle message: ${error instanceof Error ? error.message : 'Unknown error'}`, this.id);
            this.emit('error', agentError);
            throw agentError;
        }
    }
    /**
     * Shutdown the agent
     */
    async shutdown() {
        if (!this._isInitialized) {
            return; // Already shut down
        }
        this._shutdownRequested = true;
        this.updateStatus(core_1.AgentStatus.OFFLINE);
        try {
            // Wait for active tasks to complete or force stop them
            if (this._activeTasks.size > 0) {
                // Give tasks a chance to complete gracefully
                await new Promise(resolve => setTimeout(resolve, 1000));
                // Force clear remaining tasks
                this._activeTasks.clear();
                this._currentTask = null;
            }
            // Release all file tokens
            for (const token of this._fileTokens.values()) {
                try {
                    await this.releaseFileAccess(token);
                }
                catch (error) {
                    // Log but don't throw during shutdown
                    console.warn(`Failed to release file token during shutdown: ${error}`);
                }
            }
            await this.onShutdown();
            this._isInitialized = false;
            this.removeAllListeners();
        }
        catch (error) {
            const agentError = new SystemError_1.AgentError(`Failed to shutdown agent: ${error instanceof Error ? error.message : 'Unknown error'}`, this.id);
            this.emit('error', agentError);
            throw agentError;
        }
    }
    /**
     * Request file access (to be implemented by coordination system)
     */
    async requestFileAccess(filePath) {
        // This will be implemented when we have the coordination system
        // For now, create a mock token
        const token = {
            id: (0, uuid_1.v4)(),
            filePath,
            agentId: this.id,
            accessType: 'write',
            expiresAt: new Date(Date.now() + 300000), // 5 minutes
            createdAt: new Date()
        };
        this._fileTokens.set(token.id, token);
        return token;
    }
    /**
     * Release file access
     */
    async releaseFileAccess(token) {
        this._fileTokens.delete(token.id);
        // Implementation will be completed with coordination system
    }
    /**
     * Send message to another agent (to be implemented by coordination system)
     */
    async sendMessage(targetAgent, message) {
        // This will be implemented when we have the message system
        console.log(`Agent ${this.id} sending message to ${targetAgent}:`, message);
    }
    /**
     * Subscribe to events (to be implemented by coordination system)
     */
    subscribeToEvents(eventTypes) {
        // This will be implemented when we have the event system
        console.log(`Agent ${this.id} subscribing to events:`, eventTypes);
    }
    /**
     * Get current status
     */
    getStatus() {
        return this._status;
    }
    /**
     * Get current workload (0-100)
     */
    getWorkload() {
        return this._workload;
    }
    /**
     * Get current task
     */
    getCurrentTask() {
        return this._currentTask;
    }
    /**
     * Get agent capabilities
     */
    getCapabilities() {
        return [...this._config.capabilities];
    }
    /**
     * Update agent configuration
     */
    async updateConfig(config) {
        if (!this._isInitialized) {
            throw new SystemError_1.AgentError('Agent must be initialized before updating config', this.id);
        }
        const newConfig = {
            ...this._config,
            ...config
        };
        try {
            await this.onConfigUpdate(newConfig);
            this._config = newConfig;
            this.emit('config-updated', this._config);
        }
        catch (error) {
            const agentError = new SystemError_1.AgentError(`Failed to update config: ${error instanceof Error ? error.message : 'Unknown error'}`, this.id);
            this.emit('error', agentError);
            throw agentError;
        }
    }
    /**
     * Get agent configuration
     */
    getConfig() {
        return { ...this._config };
    }
    /**
     * Get task history
     */
    getTaskHistory() {
        return [...this._taskHistory];
    }
    /**
     * Get active tasks
     */
    getActiveTasks() {
        return Array.from(this._activeTasks.values());
    }
    /**
     * Check if agent is healthy
     */
    isHealthy() {
        return this._isInitialized &&
            this._status !== core_1.AgentStatus.ERROR &&
            !this._shutdownRequested;
    }
    /**
     * Get agent statistics
     */
    getStatistics() {
        const completedTasks = this._taskHistory.filter(r => r.success).length;
        const failedTasks = this._taskHistory.filter(r => !r.success).length;
        const averageExecutionTime = this._taskHistory.length > 0 ?
            this._taskHistory.reduce((sum, r) => sum + r.executionTime, 0) / this._taskHistory.length : 0;
        return {
            totalTasks: this._taskHistory.length,
            completedTasks,
            failedTasks,
            activeTasks: this._activeTasks.size,
            successRate: this._taskHistory.length > 0 ? completedTasks / this._taskHistory.length : 0,
            averageExecutionTime,
            currentWorkload: this._workload,
            status: this._status,
            uptime: this._isInitialized ? Date.now() - (this._taskHistory[0]?.completedAt.getTime() || Date.now()) : 0
        };
    }
    // Protected helper methods
    /**
     * Update agent status
     */
    updateStatus(newStatus) {
        if (this._status !== newStatus) {
            const oldStatus = this._status;
            this._status = newStatus;
            this.emit('status-changed', oldStatus, newStatus);
        }
    }
    /**
     * Update workload based on active tasks
     */
    updateWorkload() {
        const maxTasks = this._config.maxConcurrentTasks;
        this._workload = Math.round((this._activeTasks.size / maxTasks) * 100);
    }
    /**
     * Setup default message handlers
     */
    setupDefaultMessageHandlers() {
        this._messageHandlers.set(core_1.MessageType.SYSTEM, this.handleSystemMessage.bind(this));
        this._messageHandlers.set(core_1.MessageType.REQUEST, this.handleRequestMessage.bind(this));
    }
    /**
     * Handle system messages
     */
    async handleSystemMessage(message) {
        const { content } = message;
        switch (content.type) {
            case 'shutdown':
                await this.shutdown();
                break;
            case 'status':
                // Respond with current status
                break;
            case 'health-check':
                // Respond with health status
                break;
            default:
                console.log(`Unhandled system message type: ${content.type}`);
        }
    }
    /**
     * Handle request messages
     */
    async handleRequestMessage(message) {
        // Default implementation - can be overridden by concrete agents
        console.log(`Agent ${this.id} received request:`, message);
    }
    /**
     * Handle general message (can be overridden)
     */
    async onMessageReceived(message) {
        // Default implementation - log the message
        console.log(`Agent ${this.id} received message:`, message);
    }
    /**
     * Validate task before execution
     */
    validateTask(task) {
        if (!task.id || !task.title || !task.description) {
            throw new SystemError_1.ValidationError('Task must have id, title, and description');
        }
    }
    /**
     * Create task result
     */
    createTaskResult(taskId, success, output, error, filesModified = []) {
        return {
            taskId,
            success,
            output,
            error,
            filesModified,
            executionTime: 0, // Will be set by executeTask
            completedAt: new Date()
        };
    }
    /**
     * Log agent activity
     */
    log(level, message, data) {
        const timestamp = new Date().toISOString();
        const logMessage = `[${timestamp}] [${this.id}] [${level.toUpperCase()}] ${message}`;
        if (data) {
            console.log(logMessage, data);
        }
        else {
            console.log(logMessage);
        }
    }
}
exports.BaseAgent = BaseAgent;
//# sourceMappingURL=BaseAgent.js.map
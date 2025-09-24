/**
 * Base Agent abstract class
 * Provides common functionality for all agent types
 */
import { EventEmitter } from 'eventemitter3';
import { IAgent, AgentConfig, AgentType, AgentStatus, FileAccessToken, Task, TaskResult, AgentMessage, EventType, MessageType } from '../core';
/**
 * Agent lifecycle events
 */
export interface AgentEvents {
    'status-changed': (oldStatus: AgentStatus, newStatus: AgentStatus) => void;
    'task-started': (task: Task) => void;
    'task-completed': (task: Task, result: TaskResult) => void;
    'task-failed': (task: Task, error: Error) => void;
    'message-received': (message: AgentMessage) => void;
    'error': (error: Error) => void;
    'config-updated': (config: AgentConfig) => void;
}
/**
 * Base Agent abstract class
 */
export declare abstract class BaseAgent extends EventEmitter<AgentEvents> implements IAgent {
    readonly id: string;
    readonly name: string;
    readonly specialization: AgentType;
    get status(): AgentStatus;
    protected _status: AgentStatus;
    protected _config: AgentConfig;
    protected _currentTask: Task | null;
    protected _workload: number;
    protected _isInitialized: boolean;
    protected _shutdownRequested: boolean;
    protected _activeTasks: Map<string, Task>;
    protected _taskHistory: TaskResult[];
    protected _fileTokens: Map<string, FileAccessToken>;
    protected _messageHandlers: Map<MessageType, (message: AgentMessage) => Promise<void>>;
    constructor(id: string, name: string, specialization: AgentType, config: AgentConfig);
    protected abstract onInitialize(): Promise<void>;
    protected abstract onExecuteTask(task: Task): Promise<TaskResult>;
    protected abstract onShutdown(): Promise<void>;
    protected abstract onConfigUpdate(newConfig: AgentConfig): Promise<void>;
    /**
     * Initialize the agent
     */
    initialize(config: AgentConfig): Promise<void>;
    /**
     * Execute a task
     */
    executeTask(task: Task): Promise<TaskResult>;
    /**
     * Handle incoming message
     */
    handleMessage(message: AgentMessage): Promise<void>;
    /**
     * Shutdown the agent
     */
    shutdown(): Promise<void>;
    /**
     * Request file access (to be implemented by coordination system)
     */
    requestFileAccess(filePath: string): Promise<FileAccessToken>;
    /**
     * Release file access
     */
    releaseFileAccess(token: FileAccessToken): Promise<void>;
    /**
     * Send message to another agent (to be implemented by coordination system)
     */
    sendMessage(targetAgent: string, message: AgentMessage): Promise<void>;
    /**
     * Subscribe to events (to be implemented by coordination system)
     */
    subscribeToEvents(eventTypes: EventType[]): void;
    /**
     * Get current status
     */
    getStatus(): AgentStatus;
    /**
     * Get current workload (0-100)
     */
    getWorkload(): number;
    /**
     * Get current task
     */
    getCurrentTask(): Task | null;
    /**
     * Get agent capabilities
     */
    getCapabilities(): string[];
    /**
     * Update agent configuration
     */
    updateConfig(config: Partial<AgentConfig>): Promise<void>;
    /**
     * Get agent configuration
     */
    getConfig(): AgentConfig;
    /**
     * Get task history
     */
    getTaskHistory(): TaskResult[];
    /**
     * Get active tasks
     */
    getActiveTasks(): Task[];
    /**
     * Check if agent is healthy
     */
    isHealthy(): boolean;
    /**
     * Get agent statistics
     */
    getStatistics(): {
        totalTasks: number;
        completedTasks: number;
        failedTasks: number;
        activeTasks: number;
        successRate: number;
        averageExecutionTime: number;
        currentWorkload: number;
        status: AgentStatus;
        uptime: number;
    };
    /**
     * Update agent status
     */
    protected updateStatus(newStatus: AgentStatus): void;
    /**
     * Update workload based on active tasks
     */
    protected updateWorkload(): void;
    /**
     * Setup default message handlers
     */
    protected setupDefaultMessageHandlers(): void;
    /**
     * Handle system messages
     */
    protected handleSystemMessage(message: AgentMessage): Promise<void>;
    /**
     * Handle request messages
     */
    protected handleRequestMessage(message: AgentMessage): Promise<void>;
    /**
     * Handle general message (can be overridden)
     */
    protected onMessageReceived(message: AgentMessage): Promise<void>;
    /**
     * Validate task before execution
     */
    protected validateTask(task: Task): void;
    /**
     * Create task result
     */
    protected createTaskResult(taskId: string, success: boolean, output?: any, error?: string, filesModified?: string[]): TaskResult;
    /**
     * Log agent activity
     */
    protected log(level: 'info' | 'warn' | 'error', message: string, data?: any): void;
}

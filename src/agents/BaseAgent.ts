/**
 * Base Agent abstract class
 * Provides common functionality for all agent types
 */

import { EventEmitter } from 'eventemitter3';
import { v4 as uuidv4 } from 'uuid';
import { 
  IAgent,
  AgentConfig, 
  AgentType, 
  AgentStatus, 
  FileAccessToken,
  Task,
  TaskResult,
  AgentMessage,
  EventType,
  MessageType
} from '../core';
import { AgentError, SystemError, ValidationError } from '../core/errors/SystemError';

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
export abstract class BaseAgent extends EventEmitter<AgentEvents> implements IAgent {
  public readonly id: string;
  public readonly name: string;
  public readonly specialization: AgentType;
  
  public get status(): AgentStatus {
    return this._status;
  }
  
  protected _status: AgentStatus = AgentStatus.OFFLINE;
  protected _config: AgentConfig;
  protected _currentTask: Task | null = null;
  protected _workload: number = 0;
  protected _isInitialized: boolean = false;
  protected _shutdownRequested: boolean = false;
  
  // Task execution tracking
  protected _activeTasks: Map<string, Task> = new Map();
  protected _taskHistory: TaskResult[] = [];
  
  // File access tracking
  protected _fileTokens: Map<string, FileAccessToken> = new Map();
  
  // Message handling
  protected _messageHandlers: Map<MessageType, (message: AgentMessage) => Promise<void>> = new Map();
  
  constructor(id: string, name: string, specialization: AgentType, config: AgentConfig) {
    super();
    this.id = id;
    this.name = name;
    this.specialization = specialization;
    this._config = { ...config };
    
    this.setupDefaultMessageHandlers();
  }

  // Abstract methods that must be implemented by concrete agents
  protected abstract onInitialize(): Promise<void>;
  protected abstract onExecuteTask(task: Task): Promise<TaskResult>;
  protected abstract onShutdown(): Promise<void>;
  protected abstract onConfigUpdate(newConfig: AgentConfig): Promise<void>;

  /**
   * Initialize the agent
   */
  public async initialize(config: AgentConfig): Promise<void> {
    if (this._isInitialized) {
      throw new AgentError('Agent is already initialized', this.id);
    }

    try {
      this.updateStatus(AgentStatus.OFFLINE);
      this._config = { ...config };
      
      await this.onInitialize();
      
      this._isInitialized = true;
      this.updateStatus(AgentStatus.IDLE);
      
      this.emit('config-updated', this._config);
    } catch (error) {
      const agentError = new AgentError(
        `Failed to initialize agent: ${error instanceof Error ? error.message : 'Unknown error'}`,
        this.id
      );
      this.emit('error', agentError);
      throw agentError;
    }
  }

  /**
   * Execute a task
   */
  public async executeTask(task: Task): Promise<TaskResult> {
    if (!this._isInitialized) {
      throw new AgentError('Agent must be initialized before executing tasks', this.id);
    }

    if (this._status !== AgentStatus.IDLE && this._status !== AgentStatus.WORKING) {
      throw new AgentError(`Agent cannot execute tasks in status: ${this._status}`, this.id);
    }

    if (this._activeTasks.size >= this._config.maxConcurrentTasks) {
      throw new AgentError('Agent has reached maximum concurrent task limit', this.id);
    }

    const startTime = Date.now();
    this._activeTasks.set(task.id, task);
    this._currentTask = task;
    this.updateWorkload();
    this.updateStatus(AgentStatus.WORKING);
    
    this.emit('task-started', task);

    try {
      // Set up task timeout
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new AgentError(`Task execution timeout after ${this._config.timeout}ms`, this.id));
        }, this._config.timeout);
      });

      // Execute task with timeout
      const result = await Promise.race([
        this.onExecuteTask(task),
        timeoutPromise
      ]);

      // Calculate execution time
      const executionTime = Date.now() - startTime;
      const finalResult: TaskResult = {
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
        this.updateStatus(AgentStatus.IDLE);
      }

      this.emit('task-completed', task, finalResult);
      return finalResult;

    } catch (error) {
      // Clean up on error
      this._activeTasks.delete(task.id);
      if (this._currentTask?.id === task.id) {
        this._currentTask = this._activeTasks.size > 0 ? 
          Array.from(this._activeTasks.values())[0] : null;
      }
      
      this.updateWorkload();
      
      if (this._activeTasks.size === 0) {
        this.updateStatus(AgentStatus.IDLE);
      }

      const agentError = error instanceof AgentError ? error : 
        new AgentError(`Task execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`, this.id);
      
      const failedResult: TaskResult = {
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
  public async handleMessage(message: AgentMessage): Promise<void> {
    if (!this._isInitialized) {
      throw new AgentError('Agent must be initialized before handling messages', this.id);
    }

    try {
      this.emit('message-received', message);
      
      const handler = this._messageHandlers.get(message.type);
      if (handler) {
        await handler(message);
      } else {
        await this.onMessageReceived(message);
      }
    } catch (error) {
      const agentError = new AgentError(
        `Failed to handle message: ${error instanceof Error ? error.message : 'Unknown error'}`,
        this.id
      );
      this.emit('error', agentError);
      throw agentError;
    }
  }

  /**
   * Shutdown the agent
   */
  public async shutdown(): Promise<void> {
    if (!this._isInitialized) {
      return; // Already shut down
    }

    this._shutdownRequested = true;
    this.updateStatus(AgentStatus.OFFLINE);

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
        } catch (error) {
          // Log but don't throw during shutdown
          console.warn(`Failed to release file token during shutdown: ${error}`);
        }
      }

      await this.onShutdown();
      
      this._isInitialized = false;
      this.removeAllListeners();
      
    } catch (error) {
      const agentError = new AgentError(
        `Failed to shutdown agent: ${error instanceof Error ? error.message : 'Unknown error'}`,
        this.id
      );
      this.emit('error', agentError);
      throw agentError;
    }
  }

  /**
   * Request file access (to be implemented by coordination system)
   */
  public async requestFileAccess(filePath: string): Promise<FileAccessToken> {
    // This will be implemented when we have the coordination system
    // For now, create a mock token
    const token: FileAccessToken = {
      id: uuidv4(),
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
  public async releaseFileAccess(token: FileAccessToken): Promise<void> {
    this._fileTokens.delete(token.id);
    // Implementation will be completed with coordination system
  }

  /**
   * Send message to another agent (to be implemented by coordination system)
   */
  public async sendMessage(targetAgent: string, message: AgentMessage): Promise<void> {
    // This will be implemented when we have the message system
    console.log(`Agent ${this.id} sending message to ${targetAgent}:`, message);
  }

  /**
   * Subscribe to events (to be implemented by coordination system)
   */
  public subscribeToEvents(eventTypes: EventType[]): void {
    // This will be implemented when we have the event system
    console.log(`Agent ${this.id} subscribing to events:`, eventTypes);
  }

  /**
   * Get current status
   */
  public getStatus(): AgentStatus {
    return this._status;
  }

  /**
   * Get current workload (0-100)
   */
  public getWorkload(): number {
    return this._workload;
  }

  /**
   * Get current task
   */
  public getCurrentTask(): Task | null {
    return this._currentTask;
  }

  /**
   * Get agent capabilities
   */
  public getCapabilities(): string[] {
    return [...this._config.capabilities];
  }

  /**
   * Update agent configuration
   */
  public async updateConfig(config: Partial<AgentConfig>): Promise<void> {
    if (!this._isInitialized) {
      throw new AgentError('Agent must be initialized before updating config', this.id);
    }

    const newConfig: AgentConfig = {
      ...this._config,
      ...config
    };

    try {
      await this.onConfigUpdate(newConfig);
      this._config = newConfig;
      this.emit('config-updated', this._config);
    } catch (error) {
      const agentError = new AgentError(
        `Failed to update config: ${error instanceof Error ? error.message : 'Unknown error'}`,
        this.id
      );
      this.emit('error', agentError);
      throw agentError;
    }
  }

  /**
   * Get agent configuration
   */
  public getConfig(): AgentConfig {
    return { ...this._config };
  }

  /**
   * Get task history
   */
  public getTaskHistory(): TaskResult[] {
    return [...this._taskHistory];
  }

  /**
   * Get active tasks
   */
  public getActiveTasks(): Task[] {
    return Array.from(this._activeTasks.values());
  }

  /**
   * Check if agent is healthy
   */
  public isHealthy(): boolean {
    return this._isInitialized && 
           this._status !== AgentStatus.ERROR && 
           !this._shutdownRequested;
  }

  /**
   * Get agent statistics
   */
  public getStatistics() {
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
  protected updateStatus(newStatus: AgentStatus): void {
    if (this._status !== newStatus) {
      const oldStatus = this._status;
      this._status = newStatus;
      this.emit('status-changed', oldStatus, newStatus);
    }
  }

  /**
   * Update workload based on active tasks
   */
  protected updateWorkload(): void {
    const maxTasks = this._config.maxConcurrentTasks;
    this._workload = Math.round((this._activeTasks.size / maxTasks) * 100);
  }

  /**
   * Setup default message handlers
   */
  protected setupDefaultMessageHandlers(): void {
    this._messageHandlers.set(MessageType.SYSTEM, this.handleSystemMessage.bind(this));
    this._messageHandlers.set(MessageType.REQUEST, this.handleRequestMessage.bind(this));
  }

  /**
   * Handle system messages
   */
  protected async handleSystemMessage(message: AgentMessage): Promise<void> {
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
  protected async handleRequestMessage(message: AgentMessage): Promise<void> {
    // Default implementation - can be overridden by concrete agents
    console.log(`Agent ${this.id} received request:`, message);
  }

  /**
   * Handle general message (can be overridden)
   */
  protected async onMessageReceived(message: AgentMessage): Promise<void> {
    // Default implementation - log the message
    console.log(`Agent ${this.id} received message:`, message);
  }

  /**
   * Validate task before execution
   */
  protected validateTask(task: Task): void {
    if (!task.id || !task.title || !task.description) {
      throw new ValidationError('Task must have id, title, and description');
    }
  }

  /**
   * Create task result
   */
  protected createTaskResult(
    taskId: string, 
    success: boolean, 
    output?: any, 
    error?: string,
    filesModified: string[] = []
  ): TaskResult {
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
  protected log(level: 'info' | 'warn' | 'error', message: string, data?: any): void {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${this.id}] [${level.toUpperCase()}] ${message}`;
    
    if (data) {
      console.log(logMessage, data);
    } else {
      console.log(logMessage);
    }
  }
}
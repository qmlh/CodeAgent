/**
 * Service Integration Manager
 * Simplified version for UI demonstration and testing
 */

import { EventEmitter } from 'eventemitter3';
import { store } from '../store/store';
import { updateAgentStatus, addAgentLog } from '../store/slices/agentSlice';
import { updateTaskStatus, updateTaskProgress } from '../store/slices/taskSlice';
import { handleFileSystemEvent } from '../store/slices/fileSlice';
import { addNotification } from '../store/slices/uiSlice';

export interface ServiceIntegrationConfig {
  enableRealTimeUpdates: boolean;
  enableNotifications: boolean;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
}

// Mock service interfaces for UI demonstration
interface MockService {
  initialize(): Promise<void>;
  shutdown(): Promise<void>;
}

class MockTaskManager extends EventEmitter implements MockService {
  async initialize(): Promise<void> {
    console.log('MockTaskManager initialized');
  }

  async shutdown(): Promise<void> {
    console.log('MockTaskManager shutdown');
  }

  async createTask(taskData: any): Promise<{ id: string }> {
    const taskId = `task-${Date.now()}`;
    console.log('Mock task created:', taskId);
    return { id: taskId };
  }

  async assignTask(taskId: string, agentId: string): Promise<void> {
    console.log('Mock task assigned:', taskId, 'to', agentId);
  }

  getTasks(): any[] {
    return [];
  }
}

class MockAgentManager extends EventEmitter implements MockService {
  async initialize(): Promise<void> {
    console.log('MockAgentManager initialized');
  }

  async shutdown(): Promise<void> {
    console.log('MockAgentManager shutdown');
  }

  async createAgent(type: string, config: any): Promise<{ getId(): string }> {
    const agentId = `agent-${Date.now()}`;
    console.log('Mock agent created:', agentId);
    return {
      getId: () => agentId
    };
  }

  getAgent(agentId: string): { start(): Promise<void>; stop(): Promise<void> } | null {
    return {
      start: async () => console.log('Mock agent started:', agentId),
      stop: async () => console.log('Mock agent stopped:', agentId)
    };
  }

  getAllAgents(): any[] {
    return [];
  }
}

class MockFileManager extends EventEmitter implements MockService {
  async initialize(): Promise<void> {
    console.log('MockFileManager initialized');
  }

  async shutdown(): Promise<void> {
    console.log('MockFileManager shutdown');
  }
}

class MockCoordinationManager extends EventEmitter implements MockService {
  async initialize(): Promise<void> {
    console.log('MockCoordinationManager initialized');
  }

  async shutdown(): Promise<void> {
    console.log('MockCoordinationManager shutdown');
  }

  async executeTask(taskId: string): Promise<void> {
    console.log('Mock task execution:', taskId);
  }
}

class MockMessageManager extends EventEmitter implements MockService {
  async initialize(): Promise<void> {
    console.log('MockMessageManager initialized');
  }

  async shutdown(): Promise<void> {
    console.log('MockMessageManager shutdown');
  }
}

export class ServiceIntegrationManager extends EventEmitter {
  private coordinationManager: MockCoordinationManager;
  private taskManager: MockTaskManager;
  private fileManager: MockFileManager;
  private messageManager: MockMessageManager;
  private agentManager: MockAgentManager;
  private isInitialized = false;
  private config: ServiceIntegrationConfig;

  constructor(config: Partial<ServiceIntegrationConfig> = {}) {
    super();
    
    this.config = {
      enableRealTimeUpdates: true,
      enableNotifications: true,
      logLevel: 'info',
      ...config
    };

    // Initialize mock services
    this.taskManager = new MockTaskManager();
    this.fileManager = new MockFileManager();
    this.messageManager = new MockMessageManager();
    this.agentManager = new MockAgentManager();
    this.coordinationManager = new MockCoordinationManager();
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      console.log('Initializing Service Integration Manager...');

      // Initialize core services
      await this.initializeCoreServices();

      // Set up event listeners
      this.setupEventListeners();

      // Set up real-time updates
      if (this.config.enableRealTimeUpdates) {
        this.setupRealTimeUpdates();
      }

      this.isInitialized = true;
      this.emit('initialized');
      
      console.log('Service Integration Manager initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Service Integration Manager:', error);
      // Don't throw error in mock mode, just log it
      this.isInitialized = true;
      this.emit('initialized');
    }
  }

  private async initializeCoreServices(): Promise<void> {
    // Initialize services in dependency order
    await this.messageManager.initialize();
    await this.fileManager.initialize();
    await this.taskManager.initialize();
    await this.agentManager.initialize();
    await this.coordinationManager.initialize();

    console.log('All mock services initialized successfully');
  }

  private setupEventListeners(): void {
    console.log('Setting up mock event listeners...');
    
    // Mock event listeners - these will be triggered by our mock operations
    // In a real implementation, these would listen to actual service events
  }

  private setupRealTimeUpdates(): void {
    console.log('Setting up mock real-time updates...');
    // Mock real-time updates - in development mode we use mock data
    // Real implementation would set up actual service polling/websockets
  }

  // Public API methods for UI components
  async createAgent(config: {
    name: string;
    type: string;
    capabilities: string[];
    specializations: string[];
  }): Promise<string> {
    try {
      const agent = await this.agentManager.createAgent(config.type, config);
      const agentId = agent.getId();

      // Dispatch to Redux store for UI update
      store.dispatch({
        type: 'agent/createAgent/fulfilled',
        payload: {
          id: agentId,
          name: config.name,
          type: config.type,
          status: 'idle',
          capabilities: config.capabilities,
          workload: 0,
          lastActive: new Date(),
          performance: {
            tasksCompleted: 0,
            averageTaskTime: 0,
            successRate: 0
          },
          config: {
            maxConcurrentTasks: 3,
            specializations: config.specializations,
            preferences: {}
          },
          createdAt: new Date()
        }
      });

      if (this.config.enableNotifications) {
        store.dispatch(addNotification({
          type: 'success',
          title: 'Agent Created',
          message: `Agent "${config.name}" created successfully`
        }));
      }

      return agentId;
    } catch (error) {
      console.error('Failed to create agent:', error);
      throw error;
    }
  }

  async startAgent(agentId: string): Promise<void> {
    try {
      const agent = this.agentManager.getAgent(agentId);
      if (agent) {
        await agent.start();
        
        // Update Redux store
        store.dispatch(updateAgentStatus({ agentId, status: 'idle' }));
        
        if (this.config.enableNotifications) {
          store.dispatch(addNotification({
            type: 'success',
            title: 'Agent Started',
            message: `Agent ${agentId} started successfully`
          }));
        }
      } else {
        throw new Error(`Agent ${agentId} not found`);
      }
    } catch (error) {
      console.error('Failed to start agent:', error);
      throw error;
    }
  }

  async stopAgent(agentId: string): Promise<void> {
    try {
      const agent = this.agentManager.getAgent(agentId);
      if (agent) {
        await agent.stop();
        
        // Update Redux store
        store.dispatch(updateAgentStatus({ agentId, status: 'offline' }));
        
        if (this.config.enableNotifications) {
          store.dispatch(addNotification({
            type: 'info',
            title: 'Agent Stopped',
            message: `Agent ${agentId} stopped`
          }));
        }
      } else {
        throw new Error(`Agent ${agentId} not found`);
      }
    } catch (error) {
      console.error('Failed to stop agent:', error);
      throw error;
    }
  }

  async createTask(taskData: {
    title: string;
    description: string;
    type: string;
    priority: string;
    requirements: string[];
    files: string[];
  }): Promise<string> {
    try {
      const task = await this.taskManager.createTask(taskData);
      const taskId = task.id;

      // Dispatch to Redux store for UI update
      store.dispatch({
        type: 'task/createTask/fulfilled',
        payload: {
          id: taskId,
          title: taskData.title,
          description: taskData.description,
          type: taskData.type,
          status: 'pending',
          priority: taskData.priority,
          dependencies: [],
          estimatedTime: 3600000, // 1 hour default
          files: taskData.files,
          requirements: taskData.requirements,
          tags: [],
          progress: 0,
          createdAt: new Date(),
          createdBy: 'user'
        }
      });

      if (this.config.enableNotifications) {
        store.dispatch(addNotification({
          type: 'success',
          title: 'Task Created',
          message: `Task "${taskData.title}" created successfully`
        }));
      }

      return taskId;
    } catch (error) {
      console.error('Failed to create task:', error);
      throw error;
    }
  }

  async assignTask(taskId: string, agentId: string): Promise<void> {
    try {
      await this.taskManager.assignTask(taskId, agentId);
      
      // Update Redux store
      store.dispatch({
        type: 'task/assignTask/fulfilled',
        payload: { taskId, agentId }
      });
      
      if (this.config.enableNotifications) {
        store.dispatch(addNotification({
          type: 'success',
          title: 'Task Assigned',
          message: `Task ${taskId} assigned to agent ${agentId}`
        }));
      }
    } catch (error) {
      console.error('Failed to assign task:', error);
      throw error;
    }
  }

  async executeTask(taskId: string): Promise<void> {
    try {
      await this.coordinationManager.executeTask(taskId);
      
      // Update Redux store
      store.dispatch(updateTaskStatus({ taskId, status: 'in_progress' }));
      
      if (this.config.enableNotifications) {
        store.dispatch(addNotification({
          type: 'info',
          title: 'Task Started',
          message: `Task ${taskId} execution started`
        }));
      }
    } catch (error) {
      console.error('Failed to execute task:', error);
      throw error;
    }
  }

  // Service getters for direct access when needed
  getCoordinationManager(): MockCoordinationManager {
    return this.coordinationManager;
  }

  getTaskManager(): MockTaskManager {
    return this.taskManager;
  }

  getFileManager(): MockFileManager {
    return this.fileManager;
  }

  getMessageManager(): MockMessageManager {
    return this.messageManager;
  }

  getAgentManager(): MockAgentManager {
    return this.agentManager;
  }

  // Cleanup
  async cleanup(): Promise<void> {
    if (!this.isInitialized) {
      return;
    }

    try {
      await this.coordinationManager.shutdown();
      await this.agentManager.shutdown();
      await this.taskManager.shutdown();
      await this.fileManager.shutdown();
      await this.messageManager.shutdown();

      this.removeAllListeners();
      this.isInitialized = false;
      
      console.log('Service Integration Manager cleaned up');
    } catch (error) {
      console.error('Error during cleanup:', error);
    }
  }

  isReady(): boolean {
    return this.isInitialized;
  }
}

// Create singleton instance
export const serviceIntegrationManager = new ServiceIntegrationManager();
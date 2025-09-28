// Mock implementations for E2E testing
import { Task, TaskStatus, TaskPriority } from '../../../types/task.types';
import { Agent, AgentStatus, AgentType } from '../../../types/agent.types';

interface MockAgent {
  id: string;
  name: string;
  type: AgentType;
  status: AgentStatus;
  capabilities: string[];
  config: any;
  currentTask?: string;
  workload: number;
  createdAt: Date;
  lastActive: Date;
}

interface CollaborationSession {
  id: string;
  participants: string[];
  sharedFiles: string[];
  communicationChannel: string;
  startTime: Date;
  endTime?: Date;
  status: 'active' | 'paused' | 'completed';
}

// Mock manager classes for testing
class MockCoordinationManager {
  private agents: Map<string, Agent> = new Map();
  private sessions: Map<string, CollaborationSession> = new Map();
  private taskManager?: MockTaskManager;

  async initialize(): Promise<void> {
    // Mock initialization
  }

  async shutdown(): Promise<void> {
    // Mock shutdown
  }

  async createAgent(config: any): Promise<MockAgent> {
    const now = new Date();
    const agent: MockAgent = {
      id: `agent-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: config.name,
      type: config.type as AgentType,
      status: AgentStatus.IDLE,
      capabilities: config.capabilities || [],
      config: config.config || {},
      currentTask: config.currentTask,
      workload: config.workload || 0,
      createdAt: config.createdAt || now,
      lastActive: config.lastActive || now
    };
    this.agents.set(agent.id, agent);
    return agent;
  }

  async removeAgent(agentId: string): Promise<void> {
    this.agents.delete(agentId);
  }

  setTaskManager(taskManager: MockTaskManager): void {
    this.taskManager = taskManager;
  }

  async assignTask(taskId: string): Promise<void> {
    // Mock task assignment - find an available agent and assign the task
    const availableAgents = Array.from(this.agents.values()).filter(a => a.status === AgentStatus.IDLE);
    if (availableAgents.length > 0 && this.taskManager) {
      const agent = availableAgents[0];
      agent.status = AgentStatus.WORKING;
      
      // Assign task to agent
      await this.taskManager.assignTaskToAgent(taskId, agent.id);
      
      // Agent will become idle when task completes
      setTimeout(() => {
        agent.status = AgentStatus.IDLE;
      }, Math.random() * 1000 + 1500); // 1.5-2.5 seconds
    }
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  async createCollaborationSession(config: any): Promise<CollaborationSession> {
    const session: CollaborationSession = {
      id: `session-${Date.now()}`,
      participants: config.participants,
      sharedFiles: config.sharedFiles,
      communicationChannel: config.communicationChannel,
      startTime: new Date(),
      status: 'active'
    };
    this.sessions.set(session.id, session);
    return session;
  }

  async endCollaborationSession(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.status = 'completed';
      session.endTime = new Date();
    }
  }

  async getCollaborationSession(sessionId: string): Promise<CollaborationSession | undefined> {
    return this.sessions.get(sessionId);
  }

  async simulateAgentFailure(agentId: string): Promise<void> {
    const agent = this.agents.get(agentId);
    if (agent) {
      agent.status = AgentStatus.ERROR;
    }
  }

  async recoverAgent(agentId: string): Promise<void> {
    const agent = this.agents.get(agentId);
    if (agent) {
      agent.status = AgentStatus.IDLE;
    }
  }
}

class MockTaskManager {
  private tasks: Map<string, Task> = new Map();

  constructor(private messageManager: MockMessageManager) {}

  async createTask(taskData: Partial<Task>): Promise<Task> {
    const task: Task = {
      id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title: taskData.title || 'Untitled Task',
      description: taskData.description || '',
      type: taskData.type || 'development',
      status: TaskStatus.PENDING,
      priority: taskData.priority || TaskPriority.LOW,
      dependencies: taskData.dependencies || [],
      estimatedTime: taskData.estimatedTime || 3600000, // Default 1 hour
      files: taskData.files || [],
      requirements: taskData.requirements || [],
      createdAt: new Date(),
      ...taskData
    };
    this.tasks.set(task.id, task);
    return task;
  }

  async getTask(taskId: string): Promise<Task> {
    const task = this.tasks.get(taskId);
    if (!task) {
      throw new Error(`Task not found: ${taskId}`);
    }
    return task;
  }

  async assignTaskToAgent(taskId: string, agentId: string): Promise<void> {
    const task = this.tasks.get(taskId);
    if (task) {
      task.assignedAgent = agentId;
      task.status = TaskStatus.IN_PROGRESS;
      task.startedAt = new Date();
      
      // Simulate task completion after a delay
      setTimeout(() => {
        task.status = TaskStatus.COMPLETED;
        task.completedAt = new Date();
      }, Math.random() * 2000 + 1000); // 1-3 seconds
    }
  }

  async getTaskQueue(agentId: string): Promise<Task[]> {
    return Array.from(this.tasks.values()).filter(
      task => task.assignedAgent === agentId && task.status === TaskStatus.PENDING
    );
  }

  async getTaskHistory(taskId: string): Promise<any[]> {
    // Mock task history
    return [
      { timestamp: new Date(), action: 'created', agentId: null },
      { timestamp: new Date(), action: 'assigned', agentId: 'mock-agent' },
      { timestamp: new Date(), action: 'completed', agentId: 'mock-agent' }
    ];
  }
}

class MockFileManager {
  private locks: Map<string, any> = new Map();
  private fileHistory: Map<string, any[]> = new Map();

  async requestLock(filePath: string, agentId: string): Promise<any> {
    const lock = { id: `lock-${Date.now()}`, filePath, agentId };
    this.locks.set(lock.id, lock);
    return lock;
  }

  async releaseLock(lockId: string): Promise<void> {
    this.locks.delete(lockId);
  }

  async detectConflicts(filePath: string): Promise<any[]> {
    // Mock conflict detection - return empty array (no conflicts)
    return [];
  }

  async getFileHistory(filePath: string): Promise<any[]> {
    return this.fileHistory.get(filePath) || [
      { timestamp: new Date(), action: 'created', agentId: 'mock-agent' },
      { timestamp: new Date(), action: 'modified', agentId: 'mock-agent' }
    ];
  }
}

class MockMessageManager {
  private subscribers: Map<string, Function[]> = new Map();

  subscribe(eventType: string, callback: Function): void {
    if (!this.subscribers.has(eventType)) {
      this.subscribers.set(eventType, []);
    }
    this.subscribers.get(eventType)!.push(callback);
  }

  publish(eventType: string, data: any): void {
    const callbacks = this.subscribers.get(eventType) || [];
    callbacks.forEach(callback => callback(data));
  }
}

export interface TestEnvironmentConfig {
  agentCount: number;
  testDataPath: string;
  timeoutMs: number;
  enableLogging: boolean;
  performanceTracking: boolean;
}

export class TestEnvironment {
  private coordinationManager!: MockCoordinationManager;
  private taskManager!: MockTaskManager;
  private fileManager!: MockFileManager;
  private messageManager!: MockMessageManager;
  private agents: Map<string, MockAgent> = new Map();
  private testSessions: Map<string, CollaborationSession> = new Map();
  private config: TestEnvironmentConfig;

  constructor(config: TestEnvironmentConfig) {
    this.config = config;
    this.initializeManagers();
  }

  private initializeManagers(): void {
    this.messageManager = new MockMessageManager();
    this.fileManager = new MockFileManager();
    this.taskManager = new MockTaskManager(this.messageManager);
    this.coordinationManager = new MockCoordinationManager();
    this.coordinationManager.setTaskManager(this.taskManager);
  }

  async setup(): Promise<void> {
    // Initialize all managers
    await this.coordinationManager.initialize();
    
    // Create test workspace
    await this.createTestWorkspace();
    
    // Setup test agents
    await this.createTestAgents();
    
    if (this.config.enableLogging) {
      this.enableTestLogging();
    }
  }

  async teardown(): Promise<void> {
    // Stop all agents
    for (const agent of Array.from(this.agents.values())) {
      await this.coordinationManager.removeAgent(agent.id);
    }
    
    // Clean up test sessions
    for (const session of Array.from(this.testSessions.values())) {
      await this.coordinationManager.endCollaborationSession(session.id);
    }
    
    // Cleanup test workspace
    await this.cleanupTestWorkspace();
    
    // Shutdown managers
    await this.coordinationManager.shutdown();
  }

  async createTestAgents(): Promise<MockAgent[]> {
    const agentTypes = ['frontend', 'backend', 'testing', 'code_review'];
    const createdAgents: MockAgent[] = [];

    for (let i = 0; i < this.config.agentCount; i++) {
      const agentType = agentTypes[i % agentTypes.length];
      const agent = await this.coordinationManager.createAgent({
        name: `TestAgent_${agentType}_${i}`,
        type: agentType as any,
        capabilities: this.getCapabilitiesForType(agentType),
        config: {
          maxConcurrentTasks: 3,
          timeoutMs: 30000,
          retryAttempts: 2
        }
      });
      
      this.agents.set(agent.id, agent);
      createdAgents.push(agent);
    }

    return createdAgents;
  }

  async createTestTask(taskData: Partial<Task>): Promise<Task> {
    const task = await this.taskManager.createTask({
      title: taskData.title || 'Test Task',
      description: taskData.description || 'Test task description',
      type: taskData.type || 'development',
      priority: taskData.priority || 2,
      requirements: taskData.requirements || [],
      files: taskData.files || [],
      ...taskData
    });

    return task;
  }

  async createCollaborationSession(agentIds: string[]): Promise<CollaborationSession> {
    const session = await this.coordinationManager.createCollaborationSession({
      participants: agentIds,
      sharedFiles: [`${this.config.testDataPath}/shared/test-file.ts`],
      communicationChannel: 'test-channel'
    });

    this.testSessions.set(session.id, session);
    return session;
  }

  async waitForTaskCompletion(taskId: string, timeoutMs?: number): Promise<Task> {
    const timeout = timeoutMs || this.config.timeoutMs;
    const startTime = Date.now();

    return new Promise((resolve, reject) => {
      const checkInterval = setInterval(async () => {
        try {
          const task = await this.taskManager.getTask(taskId);
          
          if (task.status === TaskStatus.COMPLETED) {
            clearInterval(checkInterval);
            resolve(task);
          } else if (task.status === TaskStatus.FAILED) {
            clearInterval(checkInterval);
            reject(new Error(`Task ${taskId} failed`));
          } else if (Date.now() - startTime > timeout) {
            clearInterval(checkInterval);
            reject(new Error(`Task ${taskId} timed out after ${timeout}ms`));
          }
        } catch (error) {
          clearInterval(checkInterval);
          reject(error);
        }
      }, 100); // Check more frequently for mock implementation
    });
  }

  async waitForAllAgentsIdle(timeoutMs?: number): Promise<void> {
    const timeout = timeoutMs || this.config.timeoutMs;
    const startTime = Date.now();

    return new Promise((resolve, reject) => {
      const checkInterval = setInterval(async () => {
        try {
          const allIdle = Array.from(this.agents.values()).every(
            agent => agent.status === AgentStatus.IDLE
          );

          if (allIdle) {
            clearInterval(checkInterval);
            resolve();
          } else if (Date.now() - startTime > timeout) {
            clearInterval(checkInterval);
            reject(new Error(`Agents did not become idle within ${timeout}ms`));
          }
        } catch (error) {
          clearInterval(checkInterval);
          reject(error);
        }
      }, 1000);
    });
  }

  getAgent(agentId: string): MockAgent | undefined {
    return this.agents.get(agentId);
  }

  getAllAgents(): MockAgent[] {
    return Array.from(this.agents.values());
  }

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

  private async createTestWorkspace(): Promise<void> {
    // Create test directory structure
    const testPaths = [
      `${this.config.testDataPath}/src`,
      `${this.config.testDataPath}/tests`,
      `${this.config.testDataPath}/shared`,
      `${this.config.testDataPath}/output`
    ];

    // In a real implementation, create these directories
    // For now, we'll simulate the workspace creation
  }

  private async cleanupTestWorkspace(): Promise<void> {
    // Clean up test files and directories
    // In a real implementation, remove test directories
  }

  private getCapabilitiesForType(type: string): string[] {
    const capabilityMap: Record<string, string[]> = {
      frontend: ['react', 'typescript', 'css', 'html'],
      backend: ['node.js', 'express', 'database', 'api'],
      testing: ['jest', 'playwright', 'unit-testing', 'integration-testing'],
      code_review: ['static-analysis', 'code-quality', 'security-review']
    };

    return capabilityMap[type] || [];
  }

  private enableTestLogging(): void {
    // Enable detailed logging for test environment
    console.log('Test logging enabled');
  }
}
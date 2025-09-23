/**
 * RealtimeSync - Real-time communication and state synchronization
 * Handles event-driven real-time communication, state sync, and heartbeat management
 */

import { EventEmitter } from 'events';
import { IMessageManager } from '../core/interfaces/IMessageManager';
import { AgentStatus, Agent } from '../types/agent.types';
import { Task, TaskStatus } from '../types/task.types';
import { EventType, CollaborationSession } from '../types/message.types';

interface HeartbeatConfig {
  interval: number; // milliseconds
  timeout: number; // milliseconds
  maxMissed: number; // number of missed heartbeats before considering disconnected
}

interface AgentState {
  id: string;
  status: AgentStatus;
  lastHeartbeat: Date;
  missedHeartbeats: number;
  isConnected: boolean;
  currentTask?: string;
  workload: number;
}

interface TaskState {
  id: string;
  status: TaskStatus;
  assignedAgent?: string;
  progress: number;
  lastUpdate: Date;
}

interface FileLockState {
  filePath: string;
  lockedBy: string;
  lockTime: Date;
  isLocked: boolean;
}

interface SyncEvent {
  type: 'agent' | 'task' | 'file' | 'collaboration';
  action: 'create' | 'update' | 'delete';
  data: any;
  timestamp: Date;
  source: string;
}

export class RealtimeSync extends EventEmitter {
  private messageManager: IMessageManager;
  private agentStates: Map<string, AgentState>;
  private taskStates: Map<string, TaskState>;
  private fileLockStates: Map<string, FileLockState>;
  private collaborationSessions: Map<string, CollaborationSession>;
  private heartbeatConfig: HeartbeatConfig;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private syncEventQueue: SyncEvent[] = [];
  private isProcessingSyncQueue = false;

  constructor(
    messageManager: IMessageManager,
    heartbeatConfig: HeartbeatConfig = {
      interval: 5000, // 5 seconds
      timeout: 15000, // 15 seconds
      maxMissed: 3
    }
  ) {
    super();
    this.messageManager = messageManager;
    this.agentStates = new Map();
    this.taskStates = new Map();
    this.fileLockStates = new Map();
    this.collaborationSessions = new Map();
    this.heartbeatConfig = heartbeatConfig;

    this.setupEventListeners();
    this.startHeartbeatMonitoring();
  }

  /**
   * Sync agent status across all connected agents
   */
  syncAgentStatus(agentId: string, status: AgentStatus, additionalData?: Partial<AgentState>): void {
    const currentState = this.agentStates.get(agentId);
    const baseState: AgentState = {
      id: agentId,
      status: AgentStatus.IDLE,
      lastHeartbeat: new Date(),
      missedHeartbeats: 0,
      isConnected: true,
      workload: 0
    };

    const newState: AgentState = {
      ...baseState,
      ...currentState,
      ...additionalData,
      status // Apply the new status last to override any previous value
    };

    this.agentStates.set(agentId, newState);

    const syncEvent: SyncEvent = {
      type: 'agent',
      action: currentState ? 'update' : 'create',
      data: newState,
      timestamp: new Date(),
      source: agentId
    };

    this.queueSyncEvent(syncEvent);
    this.emit('agentStatusChanged', agentId, status, newState);
  }

  /**
   * Sync task progress across all agents
   */
  syncTaskProgress(taskId: string, progress: number, status?: TaskStatus, assignedAgent?: string): void {
    const currentState = this.taskStates.get(taskId);
    const baseState: TaskState = {
      id: taskId,
      status: TaskStatus.PENDING,
      progress: 0,
      lastUpdate: new Date()
    };

    const newState: TaskState = {
      ...baseState,
      ...currentState,
      ...(assignedAgent && { assignedAgent }),
      ...(status && { status }),
      progress,
      lastUpdate: new Date()
    };

    this.taskStates.set(taskId, newState);

    const syncEvent: SyncEvent = {
      type: 'task',
      action: currentState ? 'update' : 'create',
      data: newState,
      timestamp: new Date(),
      source: assignedAgent || 'system'
    };

    this.queueSyncEvent(syncEvent);
    this.emit('taskProgressChanged', taskId, progress, newState);
  }

  /**
   * Sync file lock status across all agents
   */
  syncFileStatus(filePath: string, lockStatus: { isLocked: boolean; lockedBy?: string }): void {
    const currentState = this.fileLockStates.get(filePath);
    const newState: FileLockState = {
      filePath,
      isLocked: lockStatus.isLocked,
      lockedBy: lockStatus.lockedBy || '',
      lockTime: lockStatus.isLocked ? new Date() : (currentState?.lockTime || new Date()),
      ...currentState
    };

    if (lockStatus.isLocked) {
      this.fileLockStates.set(filePath, newState);
    } else {
      this.fileLockStates.delete(filePath);
    }

    const syncEvent: SyncEvent = {
      type: 'file',
      action: lockStatus.isLocked ? 'create' : 'delete',
      data: newState,
      timestamp: new Date(),
      source: lockStatus.lockedBy || 'system'
    };

    this.queueSyncEvent(syncEvent);
    this.emit('fileStatusChanged', filePath, lockStatus, newState);
  }

  /**
   * Sync collaboration session across participants
   */
  syncCollaborationSession(sessionId: string, session: CollaborationSession): void {
    const currentSession = this.collaborationSessions.get(sessionId);
    this.collaborationSessions.set(sessionId, session);

    const syncEvent: SyncEvent = {
      type: 'collaboration',
      action: currentSession ? 'update' : 'create',
      data: session,
      timestamp: new Date(),
      source: 'system'
    };

    this.queueSyncEvent(syncEvent);
    this.emit('collaborationSessionChanged', sessionId, session);
  }

  /**
   * Register agent for real-time sync
   */
  async registerAgent(agentId: string, initialState?: Partial<AgentState>): Promise<void> {
    const agentState: AgentState = {
      id: agentId,
      status: AgentStatus.IDLE,
      lastHeartbeat: new Date(),
      missedHeartbeats: 0,
      isConnected: true,
      workload: 0,
      ...initialState
    };

    this.agentStates.set(agentId, agentState);

    // Subscribe to agent-specific events
    await this.messageManager.subscribeToEvent(
      EventType.AGENT_STATUS_CHANGED,
      agentId,
      (data) => this.handleAgentStatusChange(data)
    );

    await this.messageManager.subscribeToEvent(
      EventType.TASK_ASSIGNED,
      agentId,
      (data) => this.handleTaskAssignment(data)
    );

    await this.messageManager.subscribeToEvent(
      EventType.TASK_COMPLETED,
      agentId,
      (data) => this.handleTaskCompletion(data)
    );

    // Establish connection in message manager
    await this.messageManager.establishConnection(agentId);

    this.emit('agentRegistered', agentId, agentState);
  }

  /**
   * Unregister agent from real-time sync
   */
  async unregisterAgent(agentId: string): Promise<void> {
    const agentState = this.agentStates.get(agentId);
    if (agentState) {
      agentState.isConnected = false;
      agentState.status = AgentStatus.OFFLINE;
    }

    // Unsubscribe from events
    await this.messageManager.unsubscribeFromEvent(EventType.AGENT_STATUS_CHANGED, agentId);
    await this.messageManager.unsubscribeFromEvent(EventType.TASK_ASSIGNED, agentId);
    await this.messageManager.unsubscribeFromEvent(EventType.TASK_COMPLETED, agentId);

    // Close connection in message manager
    await this.messageManager.closeConnection(agentId);

    this.agentStates.delete(agentId);
    this.emit('agentUnregistered', agentId);
  }

  /**
   * Send heartbeat for agent
   */
  sendHeartbeat(agentId: string): void {
    const agentState = this.agentStates.get(agentId);
    if (agentState) {
      agentState.lastHeartbeat = new Date();
      agentState.missedHeartbeats = 0;
      agentState.isConnected = true;

      // Update heartbeat in message manager
      this.messageManager.updateHeartbeat(agentId);

      this.emit('heartbeatReceived', agentId, agentState.lastHeartbeat);
    }
  }

  /**
   * Get current state of all agents
   */
  getAgentStates(): Map<string, AgentState> {
    return new Map(this.agentStates);
  }

  /**
   * Get current state of all tasks
   */
  getTaskStates(): Map<string, TaskState> {
    return new Map(this.taskStates);
  }

  /**
   * Get current file lock states
   */
  getFileLockStates(): Map<string, FileLockState> {
    return new Map(this.fileLockStates);
  }

  /**
   * Get active collaboration sessions
   */
  getCollaborationSessions(): Map<string, CollaborationSession> {
    return new Map(this.collaborationSessions);
  }

  /**
   * Get connected agents
   */
  getConnectedAgents(): string[] {
    const connectedAgents: string[] = [];
    this.agentStates.forEach((state, agentId) => {
      if (state.isConnected) {
        connectedAgents.push(agentId);
      }
    });
    return connectedAgents;
  }

  /**
   * Check if agent is connected
   */
  isAgentConnected(agentId: string): boolean {
    const state = this.agentStates.get(agentId);
    return state ? state.isConnected : false;
  }

  /**
   * Force sync all states to specific agent
   */
  async forceSyncToAgent(agentId: string): Promise<void> {
    if (!this.isAgentConnected(agentId)) {
      throw new Error(`Agent ${agentId} is not connected`);
    }

    // Send all current states
    const syncData = {
      agents: Array.from(this.agentStates.values()),
      tasks: Array.from(this.taskStates.values()),
      files: Array.from(this.fileLockStates.values()),
      collaborations: Array.from(this.collaborationSessions.values())
    };

    await this.messageManager.sendMessage({
      id: `sync-${Date.now()}`,
      from: 'system',
      to: agentId,
      type: 'system' as any,
      content: {
        type: 'full-sync',
        data: syncData
      },
      timestamp: new Date(),
      requiresResponse: false
    });
  }

  /**
   * Shutdown real-time sync
   */
  shutdown(): void {
    // Stop heartbeat monitoring
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }

    // Clear all states
    this.agentStates.clear();
    this.taskStates.clear();
    this.fileLockStates.clear();
    this.collaborationSessions.clear();
    this.syncEventQueue = [];

    // Remove all listeners
    this.removeAllListeners();
  }

  // Private methods

  private setupEventListeners(): void {
    // Listen to message manager events
    const eventEmitter = this.messageManager.getEventEmitter();
    
    eventEmitter.on(EventType.AGENT_CREATED, (data: any) => {
      this.handleAgentCreated(data);
    });

    eventEmitter.on(EventType.AGENT_DESTROYED, (data: any) => {
      this.handleAgentDestroyed(data);
    });

    eventEmitter.on(EventType.FILE_LOCKED, (data: any) => {
      this.handleFileLocked(data);
    });

    eventEmitter.on(EventType.FILE_UNLOCKED, (data: any) => {
      this.handleFileUnlocked(data);
    });
  }

  private startHeartbeatMonitoring(): void {
    this.heartbeatInterval = setInterval(() => {
      this.checkHeartbeats();
    }, this.heartbeatConfig.interval);
  }

  private checkHeartbeats(): void {
    const now = new Date();
    const timeoutThreshold = now.getTime() - this.heartbeatConfig.timeout;

    this.agentStates.forEach((state, agentId) => {
      if (state.isConnected && state.lastHeartbeat.getTime() < timeoutThreshold) {
        state.missedHeartbeats++;

        if (state.missedHeartbeats >= this.heartbeatConfig.maxMissed) {
          // Mark agent as disconnected
          state.isConnected = false;
          state.status = AgentStatus.OFFLINE;

          this.emit('agentDisconnected', agentId, state);
          
          // Notify other agents
          this.syncAgentStatus(agentId, AgentStatus.OFFLINE, { isConnected: false });
        } else {
          this.emit('heartbeatMissed', agentId, state.missedHeartbeats);
        }
      }
    });
  }

  private queueSyncEvent(event: SyncEvent): void {
    this.syncEventQueue.push(event);
    this.processSyncQueue();
  }

  private async processSyncQueue(): Promise<void> {
    if (this.isProcessingSyncQueue || this.syncEventQueue.length === 0) {
      return;
    }

    this.isProcessingSyncQueue = true;

    try {
      while (this.syncEventQueue.length > 0) {
        const event = this.syncEventQueue.shift()!;
        await this.broadcastSyncEvent(event);
      }
    } catch (error) {
      console.error('Error processing sync queue:', error);
    } finally {
      this.isProcessingSyncQueue = false;
    }
  }

  private async broadcastSyncEvent(event: SyncEvent): Promise<void> {
    const connectedAgents = this.getConnectedAgents();
    
    if (connectedAgents.length === 0) {
      return;
    }

    await this.messageManager.broadcastMessage({
      id: `sync-${event.type}-${Date.now()}`,
      from: 'system',
      type: 'system' as any,
      content: {
        type: 'sync-event',
        event
      },
      timestamp: new Date(),
      requiresResponse: false
    });
  }

  private handleAgentStatusChange(data: any): void {
    if (data.agentId && data.status) {
      this.syncAgentStatus(data.agentId, data.status, data.additionalData);
    }
  }

  private handleTaskAssignment(data: any): void {
    if (data.taskId && data.agentId) {
      this.syncTaskProgress(data.taskId, 0, TaskStatus.IN_PROGRESS, data.agentId);
    }
  }

  private handleTaskCompletion(data: any): void {
    if (data.taskId) {
      this.syncTaskProgress(data.taskId, 100, TaskStatus.COMPLETED);
    }
  }

  private handleAgentCreated(data: any): void {
    if (data.agentId) {
      this.syncAgentStatus(data.agentId, AgentStatus.IDLE, { isConnected: true });
    }
  }

  private handleAgentDestroyed(data: any): void {
    if (data.agentId) {
      this.syncAgentStatus(data.agentId, AgentStatus.OFFLINE, { isConnected: false });
    }
  }

  private handleFileLocked(data: any): void {
    if (data.filePath && data.agentId) {
      this.syncFileStatus(data.filePath, { isLocked: true, lockedBy: data.agentId });
    }
  }

  private handleFileUnlocked(data: any): void {
    if (data.filePath) {
      this.syncFileStatus(data.filePath, { isLocked: false });
    }
  }
}
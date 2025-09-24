/**
 * RealtimeSync - Real-time communication and state synchronization
 * Handles event-driven real-time communication, state sync, and heartbeat management
 */
import { EventEmitter } from 'events';
import { IMessageManager } from '../core/interfaces/IMessageManager';
import { AgentStatus } from '../types/agent.types';
import { TaskStatus } from '../types/task.types';
import { CollaborationSession } from '../types/message.types';
interface HeartbeatConfig {
    interval: number;
    timeout: number;
    maxMissed: number;
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
export declare class RealtimeSync extends EventEmitter {
    private messageManager;
    private agentStates;
    private taskStates;
    private fileLockStates;
    private collaborationSessions;
    private heartbeatConfig;
    private heartbeatInterval;
    private syncEventQueue;
    private isProcessingSyncQueue;
    constructor(messageManager: IMessageManager, heartbeatConfig?: HeartbeatConfig);
    /**
     * Sync agent status across all connected agents
     */
    syncAgentStatus(agentId: string, status: AgentStatus, additionalData?: Partial<AgentState>): void;
    /**
     * Sync task progress across all agents
     */
    syncTaskProgress(taskId: string, progress: number, status?: TaskStatus, assignedAgent?: string): void;
    /**
     * Sync file lock status across all agents
     */
    syncFileStatus(filePath: string, lockStatus: {
        isLocked: boolean;
        lockedBy?: string;
    }): void;
    /**
     * Sync collaboration session across participants
     */
    syncCollaborationSession(sessionId: string, session: CollaborationSession): void;
    /**
     * Register agent for real-time sync
     */
    registerAgent(agentId: string, initialState?: Partial<AgentState>): Promise<void>;
    /**
     * Unregister agent from real-time sync
     */
    unregisterAgent(agentId: string): Promise<void>;
    /**
     * Send heartbeat for agent
     */
    sendHeartbeat(agentId: string): void;
    /**
     * Get current state of all agents
     */
    getAgentStates(): Map<string, AgentState>;
    /**
     * Get current state of all tasks
     */
    getTaskStates(): Map<string, TaskState>;
    /**
     * Get current file lock states
     */
    getFileLockStates(): Map<string, FileLockState>;
    /**
     * Get active collaboration sessions
     */
    getCollaborationSessions(): Map<string, CollaborationSession>;
    /**
     * Get connected agents
     */
    getConnectedAgents(): string[];
    /**
     * Check if agent is connected
     */
    isAgentConnected(agentId: string): boolean;
    /**
     * Force sync all states to specific agent
     */
    forceSyncToAgent(agentId: string): Promise<void>;
    /**
     * Shutdown real-time sync
     */
    shutdown(): void;
    private setupEventListeners;
    private startHeartbeatMonitoring;
    private checkHeartbeats;
    private queueSyncEvent;
    private processSyncQueue;
    private broadcastSyncEvent;
    private handleAgentStatusChange;
    private handleTaskAssignment;
    private handleTaskCompletion;
    private handleAgentCreated;
    private handleAgentDestroyed;
    private handleFileLocked;
    private handleFileUnlocked;
}
export {};

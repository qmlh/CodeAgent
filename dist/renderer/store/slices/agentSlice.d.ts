/**
 * Agent State Slice
 * Manages AI agent state and operations
 */
import { PayloadAction } from '@reduxjs/toolkit';
export interface Agent {
    id: string;
    name: string;
    type: 'frontend' | 'backend' | 'testing' | 'documentation' | 'code_review' | 'devops';
    status: 'idle' | 'working' | 'waiting' | 'error' | 'offline';
    capabilities: string[];
    currentTask?: string;
    workload: number;
    lastActive: Date;
    performance: {
        tasksCompleted: number;
        averageTaskTime: number;
        successRate: number;
    };
    config: {
        maxConcurrentTasks: number;
        specializations: string[];
        preferences: Record<string, any>;
    };
    createdAt: Date;
}
export interface AgentMessage {
    id: string;
    from: string;
    to: string | string[];
    type: 'info' | 'request' | 'response' | 'alert';
    content: any;
    timestamp: Date;
    requiresResponse: boolean;
}
export interface CollaborationSession {
    id: string;
    participants: string[];
    sharedFiles: string[];
    communicationChannel: string;
    startTime: Date;
    endTime?: Date;
    status: 'active' | 'paused' | 'completed';
}
export interface AgentState {
    agents: Agent[];
    messages: AgentMessage[];
    collaborationSessions: CollaborationSession[];
    selectedAgent: string | null;
    agentLogs: Record<string, Array<{
        timestamp: Date;
        level: 'info' | 'warn' | 'error';
        message: string;
    }>>;
    status: 'idle' | 'loading' | 'error';
    error: string | null;
}
export declare const loadAgents: import("@reduxjs/toolkit").AsyncThunk<any, void, import("@reduxjs/toolkit").AsyncThunkConfig>;
export declare const createAgent: import("@reduxjs/toolkit").AsyncThunk<Agent, {
    name: string;
    type: Agent["type"];
    capabilities: string[];
    specializations: string[];
    preferences: Record<string, any>;
}, import("@reduxjs/toolkit").AsyncThunkConfig>;
export declare const startAgent: import("@reduxjs/toolkit").AsyncThunk<string, string, import("@reduxjs/toolkit").AsyncThunkConfig>;
export declare const stopAgent: import("@reduxjs/toolkit").AsyncThunk<string, string, import("@reduxjs/toolkit").AsyncThunkConfig>;
export declare const getAgentStatus: import("@reduxjs/toolkit").AsyncThunk<{
    agentId: string;
    status: any;
}, string, import("@reduxjs/toolkit").AsyncThunkConfig>;
export declare const agentSlice: import("@reduxjs/toolkit").Slice<AgentState, {
    setSelectedAgent: (state: import("immer").WritableDraft<AgentState>, action: PayloadAction<string | null>) => void;
    updateAgentStatus: (state: import("immer").WritableDraft<AgentState>, action: PayloadAction<{
        agentId: string;
        status: Agent["status"];
    }>) => void;
    updateAgentWorkload: (state: import("immer").WritableDraft<AgentState>, action: PayloadAction<{
        agentId: string;
        workload: number;
    }>) => void;
    assignTaskToAgent: (state: import("immer").WritableDraft<AgentState>, action: PayloadAction<{
        agentId: string;
        taskId: string;
    }>) => void;
    completeAgentTask: (state: import("immer").WritableDraft<AgentState>, action: PayloadAction<{
        agentId: string;
        taskId: string;
        success: boolean;
        duration: number;
    }>) => void;
    addAgentMessage: (state: import("immer").WritableDraft<AgentState>, action: PayloadAction<Omit<AgentMessage, "id" | "timestamp">>) => void;
    removeAgentMessage: (state: import("immer").WritableDraft<AgentState>, action: PayloadAction<string>) => void;
    clearAgentMessages: (state: import("immer").WritableDraft<AgentState>) => void;
    startCollaborationSession: (state: import("immer").WritableDraft<AgentState>, action: PayloadAction<{
        participants: string[];
        sharedFiles: string[];
    }>) => void;
    endCollaborationSession: (state: import("immer").WritableDraft<AgentState>, action: PayloadAction<string>) => void;
    addAgentLog: (state: import("immer").WritableDraft<AgentState>, action: PayloadAction<{
        agentId: string;
        level: "info" | "warn" | "error";
        message: string;
    }>) => void;
    clearAgentLogs: (state: import("immer").WritableDraft<AgentState>, action: PayloadAction<string>) => void;
    clearError: (state: import("immer").WritableDraft<AgentState>) => void;
}, "agent", "agent", import("@reduxjs/toolkit").SliceSelectors<AgentState>>;
export declare const setSelectedAgent: import("@reduxjs/toolkit").ActionCreatorWithPayload<string | null, "agent/setSelectedAgent">, updateAgentStatus: import("@reduxjs/toolkit").ActionCreatorWithPayload<{
    agentId: string;
    status: Agent["status"];
}, "agent/updateAgentStatus">, updateAgentWorkload: import("@reduxjs/toolkit").ActionCreatorWithPayload<{
    agentId: string;
    workload: number;
}, "agent/updateAgentWorkload">, assignTaskToAgent: import("@reduxjs/toolkit").ActionCreatorWithPayload<{
    agentId: string;
    taskId: string;
}, "agent/assignTaskToAgent">, completeAgentTask: import("@reduxjs/toolkit").ActionCreatorWithPayload<{
    agentId: string;
    taskId: string;
    success: boolean;
    duration: number;
}, "agent/completeAgentTask">, addAgentMessage: import("@reduxjs/toolkit").ActionCreatorWithPayload<Omit<AgentMessage, "id" | "timestamp">, "agent/addAgentMessage">, removeAgentMessage: import("@reduxjs/toolkit").ActionCreatorWithPayload<string, "agent/removeAgentMessage">, clearAgentMessages: import("@reduxjs/toolkit").ActionCreatorWithoutPayload<"agent/clearAgentMessages">, startCollaborationSession: import("@reduxjs/toolkit").ActionCreatorWithPayload<{
    participants: string[];
    sharedFiles: string[];
}, "agent/startCollaborationSession">, endCollaborationSession: import("@reduxjs/toolkit").ActionCreatorWithPayload<string, "agent/endCollaborationSession">, addAgentLog: import("@reduxjs/toolkit").ActionCreatorWithPayload<{
    agentId: string;
    level: "info" | "warn" | "error";
    message: string;
}, "agent/addAgentLog">, clearAgentLogs: import("@reduxjs/toolkit").ActionCreatorWithPayload<string, "agent/clearAgentLogs">, clearError: import("@reduxjs/toolkit").ActionCreatorWithoutPayload<"agent/clearError">;

/**
 * Message and communication type definitions
 */
export declare enum MessageType {
    INFO = "info",
    REQUEST = "request",
    RESPONSE = "response",
    ALERT = "alert",
    SYSTEM = "system"
}
export declare enum EventType {
    AGENT_CREATED = "agent_created",
    AGENT_DESTROYED = "agent_destroyed",
    AGENT_STATUS_CHANGED = "agent_status_changed",
    TASK_ASSIGNED = "task_assigned",
    TASK_COMPLETED = "task_completed",
    TASK_FAILED = "task_failed",
    FILE_LOCKED = "file_locked",
    FILE_UNLOCKED = "file_unlocked",
    COLLABORATION_STARTED = "collaboration_started",
    COLLABORATION_ENDED = "collaboration_ended"
}
export interface AgentMessage {
    id: string;
    from: string;
    to: string | string[];
    type: MessageType;
    content: any;
    timestamp: Date;
    requiresResponse: boolean;
    correlationId?: string;
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

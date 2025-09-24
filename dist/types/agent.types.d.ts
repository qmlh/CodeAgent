/**
 * Agent type definitions based on the design document
 */
export declare enum AgentType {
    FRONTEND = "frontend",
    BACKEND = "backend",
    TESTING = "testing",
    DOCUMENTATION = "documentation",
    CODE_REVIEW = "code_review",
    DEVOPS = "devops"
}
export declare enum AgentStatus {
    IDLE = "idle",
    WORKING = "working",
    WAITING = "waiting",
    ERROR = "error",
    OFFLINE = "offline"
}
export interface AgentConfig {
    name: string;
    type: AgentType;
    capabilities: string[];
    maxConcurrentTasks: number;
    timeout: number;
    retryAttempts: number;
    customSettings?: Record<string, any>;
}
export interface Agent {
    id: string;
    name: string;
    type: AgentType;
    status: AgentStatus;
    config: AgentConfig;
    capabilities: string[];
    currentTask?: string;
    workload: number;
    createdAt: Date;
    lastActive: Date;
}
export interface FileAccessToken {
    id: string;
    filePath: string;
    agentId: string;
    accessType: 'read' | 'write' | 'exclusive';
    expiresAt: Date;
    createdAt: Date;
}

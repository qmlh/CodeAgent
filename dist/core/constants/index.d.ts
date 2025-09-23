/**
 * System constants and configuration defaults
 */
import { AgentType } from '../../types/agent.types';
export declare const SYSTEM_CONSTANTS: {
    readonly MAX_AGENTS: 10;
    readonly MAX_CONCURRENT_TASKS_PER_AGENT: 3;
    readonly AGENT_HEARTBEAT_INTERVAL: 30000;
    readonly AGENT_TIMEOUT: 300000;
    readonly DEFAULT_TASK_TIMEOUT: 600000;
    readonly MAX_TASK_RETRIES: 3;
    readonly TASK_PRIORITY_LEVELS: 4;
    readonly FILE_LOCK_TIMEOUT: 300000;
    readonly MAX_FILE_LOCKS_PER_AGENT: 5;
    readonly FILE_BACKUP_RETENTION: 7;
    readonly MESSAGE_QUEUE_SIZE: 1000;
    readonly MESSAGE_RETRY_ATTEMPTS: 3;
    readonly MESSAGE_TIMEOUT: 30000;
    readonly MAX_COLLABORATION_SESSIONS: 5;
    readonly MAX_WORKFLOW_STEPS: 50;
    readonly MAX_ERROR_HISTORY: 1000;
    readonly CACHE_TTL: 300000;
    readonly CLEANUP_INTERVAL: 3600000;
    readonly METRICS_COLLECTION_INTERVAL: 60000;
};
export declare const EVENT_NAMES: {
    readonly AGENT_CREATED: "agent:created";
    readonly AGENT_DESTROYED: "agent:destroyed";
    readonly AGENT_STATUS_CHANGED: "agent:status_changed";
    readonly AGENT_ERROR: "agent:error";
    readonly TASK_CREATED: "task:created";
    readonly TASK_ASSIGNED: "task:assigned";
    readonly TASK_STARTED: "task:started";
    readonly TASK_COMPLETED: "task:completed";
    readonly TASK_FAILED: "task:failed";
    readonly FILE_LOCKED: "file:locked";
    readonly FILE_UNLOCKED: "file:unlocked";
    readonly FILE_MODIFIED: "file:modified";
    readonly FILE_CONFLICT: "file:conflict";
    readonly COLLABORATION_STARTED: "collaboration:started";
    readonly COLLABORATION_ENDED: "collaboration:ended";
    readonly COLLABORATION_JOINED: "collaboration:joined";
    readonly COLLABORATION_LEFT: "collaboration:left";
    readonly SYSTEM_STARTUP: "system:startup";
    readonly SYSTEM_SHUTDOWN: "system:shutdown";
    readonly SYSTEM_ERROR: "system:error";
    readonly HEALTH_CHECK: "system:health_check";
};
export declare const DEFAULT_AGENT_CAPABILITIES: Record<AgentType, string[]>;
//# sourceMappingURL=index.d.ts.map
/**
 * Core Agent interface definition
 */
import { AgentConfig, AgentType, AgentStatus, FileAccessToken } from '../../types/agent.types';
import { Task, TaskResult } from '../../types/task.types';
import { AgentMessage, EventType } from '../../types/message.types';
export interface IAgent {
    readonly id: string;
    readonly name: string;
    readonly specialization: AgentType;
    readonly status: AgentStatus;
    initialize(config: AgentConfig): Promise<void>;
    executeTask(task: Task): Promise<TaskResult>;
    handleMessage(message: AgentMessage): Promise<void>;
    shutdown(): Promise<void>;
    requestFileAccess(filePath: string): Promise<FileAccessToken>;
    releaseFileAccess(token: FileAccessToken): Promise<void>;
    sendMessage(targetAgent: string, message: AgentMessage): Promise<void>;
    subscribeToEvents(eventTypes: EventType[]): void;
    getStatus(): AgentStatus;
    getWorkload(): number;
    getCurrentTask(): Task | null;
    getCapabilities(): string[];
    updateConfig(config: Partial<AgentConfig>): Promise<void>;
    getConfig(): AgentConfig;
}
//# sourceMappingURL=IAgent.d.ts.map
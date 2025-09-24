/**
 * Data serialization and transformation utilities
 */
import { Agent, AgentConfig } from '../../types/agent.types';
import { Task } from '../../types/task.types';
import { AgentMessage, CollaborationSession } from '../../types/message.types';
/**
 * Serializable data interface
 */
export interface SerializableData {
    [key: string]: any;
}
/**
 * Serialization options
 */
export interface SerializationOptions {
    includePrivateFields?: boolean;
    dateFormat?: 'iso' | 'timestamp';
    excludeFields?: string[];
    includeMetadata?: boolean;
}
/**
 * Serialization utility class
 */
export declare class SerializationUtils {
    /**
     * Serialize agent to JSON-safe object
     */
    static serializeAgent(agent: Agent, options?: SerializationOptions): SerializableData;
    /**
     * Deserialize agent from JSON object
     */
    static deserializeAgent(data: SerializableData): Agent;
    /**
     * Serialize agent configuration
     */
    static serializeAgentConfig(config: AgentConfig, options?: SerializationOptions): SerializableData;
    /**
     * Deserialize agent configuration
     */
    static deserializeAgentConfig(data: SerializableData): AgentConfig;
    /**
     * Serialize task to JSON-safe object
     */
    static serializeTask(task: Task, options?: SerializationOptions): SerializableData;
    /**
     * Deserialize task from JSON object
     */
    static deserializeTask(data: SerializableData): Task;
    /**
     * Serialize message to JSON-safe object
     */
    static serializeMessage(message: AgentMessage, options?: SerializationOptions): SerializableData;
    /**
     * Deserialize message from JSON object
     */
    static deserializeMessage(data: SerializableData): AgentMessage;
    /**
     * Serialize collaboration session
     */
    static serializeCollaborationSession(session: CollaborationSession, options?: SerializationOptions): SerializableData;
    /**
     * Deserialize collaboration session
     */
    static deserializeCollaborationSession(data: SerializableData): CollaborationSession;
    /**
     * Serialize date based on format
     */
    private static serializeDate;
    /**
     * Deserialize date from string or number
     */
    private static deserializeDate;
    /**
     * Serialize content (handle circular references and functions)
     */
    private static serializeContent;
    /**
     * Create a deep copy of serializable data
     */
    static deepClone<T>(data: T): T;
    /**
     * Convert object to JSON string with error handling
     */
    static toJSON(data: any, options?: SerializationOptions): string;
    /**
     * Parse JSON string with error handling
     */
    static fromJSON(jsonString: string): any;
    /**
     * Batch serialize multiple items
     */
    static serializeBatch<T>(items: T[], serializer: (item: T, options?: SerializationOptions) => SerializableData, options?: SerializationOptions): SerializableData[];
    /**
     * Batch deserialize multiple items
     */
    static deserializeBatch<T>(data: SerializableData[], deserializer: (data: SerializableData) => T): T[];
}

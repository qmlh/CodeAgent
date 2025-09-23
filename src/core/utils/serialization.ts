/**
 * Data serialization and transformation utilities
 */

import { Agent, AgentConfig } from '../../types/agent.types';
import { Task, TaskResult } from '../../types/task.types';
import { AgentMessage, CollaborationSession } from '../../types/message.types';
import { ValidationError } from '../errors/SystemError';

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
export class SerializationUtils {
  /**
   * Serialize agent to JSON-safe object
   */
  static serializeAgent(agent: Agent, options: SerializationOptions = {}): SerializableData {
    const {
      includePrivateFields = false,
      dateFormat = 'iso',
      excludeFields = [],
      includeMetadata = true
    } = options;

    const serialized: SerializableData = {
      id: agent.id,
      name: agent.name,
      type: agent.type,
      status: agent.status,
      config: this.serializeAgentConfig(agent.config, options),
      capabilities: [...agent.capabilities],
      workload: agent.workload,
      createdAt: this.serializeDate(agent.createdAt, dateFormat),
      lastActive: this.serializeDate(agent.lastActive, dateFormat)
    };

    // Include optional fields
    if (agent.currentTask) {
      serialized.currentTask = agent.currentTask;
    }

    // Include metadata if requested
    if (includeMetadata) {
      serialized._metadata = {
        serializedAt: this.serializeDate(new Date(), dateFormat),
        version: '1.0'
      };
    }

    // Exclude specified fields
    excludeFields.forEach(field => {
      delete serialized[field];
    });

    return serialized;
  }

  /**
   * Deserialize agent from JSON object
   */
  static deserializeAgent(data: SerializableData): Agent {
    if (!data.id || !data.name || !data.type) {
      throw new ValidationError('Invalid agent data: missing required fields');
    }

    return {
      id: data.id,
      name: data.name,
      type: data.type,
      status: data.status,
      config: this.deserializeAgentConfig(data.config),
      capabilities: Array.isArray(data.capabilities) ? data.capabilities : [],
      currentTask: data.currentTask,
      workload: typeof data.workload === 'number' ? data.workload : 0,
      createdAt: this.deserializeDate(data.createdAt),
      lastActive: this.deserializeDate(data.lastActive)
    };
  }

  /**
   * Serialize agent configuration
   */
  static serializeAgentConfig(config: AgentConfig, options: SerializationOptions = {}): SerializableData {
    const { excludeFields = [] } = options;

    const serialized: SerializableData = {
      name: config.name,
      type: config.type,
      capabilities: [...config.capabilities],
      maxConcurrentTasks: config.maxConcurrentTasks,
      timeout: config.timeout,
      retryAttempts: config.retryAttempts,
      customSettings: config.customSettings ? { ...config.customSettings } : {}
    };

    // Exclude specified fields
    excludeFields.forEach(field => {
      delete serialized[field];
    });

    return serialized;
  }

  /**
   * Deserialize agent configuration
   */
  static deserializeAgentConfig(data: SerializableData): AgentConfig {
    if (!data.name || !data.type) {
      throw new ValidationError('Invalid agent config data: missing required fields');
    }

    return {
      name: data.name,
      type: data.type,
      capabilities: Array.isArray(data.capabilities) ? data.capabilities : [],
      maxConcurrentTasks: typeof data.maxConcurrentTasks === 'number' ? data.maxConcurrentTasks : 3,
      timeout: typeof data.timeout === 'number' ? data.timeout : 300000,
      retryAttempts: typeof data.retryAttempts === 'number' ? data.retryAttempts : 3,
      customSettings: data.customSettings || {}
    };
  }

  /**
   * Serialize task to JSON-safe object
   */
  static serializeTask(task: Task, options: SerializationOptions = {}): SerializableData {
    const {
      dateFormat = 'iso',
      excludeFields = [],
      includeMetadata = true
    } = options;

    const serialized: SerializableData = {
      id: task.id,
      title: task.title,
      description: task.description,
      type: task.type,
      status: task.status,
      priority: task.priority,
      dependencies: [...task.dependencies],
      estimatedTime: task.estimatedTime,
      files: [...task.files],
      requirements: [...task.requirements],
      createdAt: this.serializeDate(task.createdAt, dateFormat)
    };

    // Include optional fields
    if (task.assignedAgent) {
      serialized.assignedAgent = task.assignedAgent;
    }
    if (task.startedAt) {
      serialized.startedAt = this.serializeDate(task.startedAt, dateFormat);
    }
    if (task.completedAt) {
      serialized.completedAt = this.serializeDate(task.completedAt, dateFormat);
    }

    // Include metadata if requested
    if (includeMetadata) {
      serialized._metadata = {
        serializedAt: this.serializeDate(new Date(), dateFormat),
        version: '1.0'
      };
    }

    // Exclude specified fields
    excludeFields.forEach(field => {
      delete serialized[field];
    });

    return serialized;
  }

  /**
   * Deserialize task from JSON object
   */
  static deserializeTask(data: SerializableData): Task {
    if (!data.id || !data.title || !data.description) {
      throw new ValidationError('Invalid task data: missing required fields');
    }

    return {
      id: data.id,
      title: data.title,
      description: data.description,
      type: data.type || 'general',
      status: data.status,
      priority: data.priority,
      assignedAgent: data.assignedAgent,
      dependencies: Array.isArray(data.dependencies) ? data.dependencies : [],
      estimatedTime: typeof data.estimatedTime === 'number' ? data.estimatedTime : 3600000,
      files: Array.isArray(data.files) ? data.files : [],
      requirements: Array.isArray(data.requirements) ? data.requirements : [],
      createdAt: this.deserializeDate(data.createdAt),
      startedAt: data.startedAt ? this.deserializeDate(data.startedAt) : undefined,
      completedAt: data.completedAt ? this.deserializeDate(data.completedAt) : undefined
    };
  }

  /**
   * Serialize message to JSON-safe object
   */
  static serializeMessage(message: AgentMessage, options: SerializationOptions = {}): SerializableData {
    const {
      dateFormat = 'iso',
      excludeFields = [],
      includeMetadata = true
    } = options;

    const serialized: SerializableData = {
      id: message.id,
      from: message.from,
      to: message.to,
      type: message.type,
      content: this.serializeContent(message.content),
      timestamp: this.serializeDate(message.timestamp, dateFormat),
      requiresResponse: message.requiresResponse
    };

    // Include optional fields
    if (message.correlationId) {
      serialized.correlationId = message.correlationId;
    }

    // Include metadata if requested
    if (includeMetadata) {
      serialized._metadata = {
        serializedAt: this.serializeDate(new Date(), dateFormat),
        version: '1.0'
      };
    }

    // Exclude specified fields
    excludeFields.forEach(field => {
      delete serialized[field];
    });

    return serialized;
  }

  /**
   * Deserialize message from JSON object
   */
  static deserializeMessage(data: SerializableData): AgentMessage {
    if (!data.id || !data.from || !data.to) {
      throw new ValidationError('Invalid message data: missing required fields');
    }

    return {
      id: data.id,
      from: data.from,
      to: data.to,
      type: data.type,
      content: data.content,
      timestamp: this.deserializeDate(data.timestamp),
      requiresResponse: Boolean(data.requiresResponse),
      correlationId: data.correlationId
    };
  }

  /**
   * Serialize collaboration session
   */
  static serializeCollaborationSession(session: CollaborationSession, options: SerializationOptions = {}): SerializableData {
    const {
      dateFormat = 'iso',
      excludeFields = [],
      includeMetadata = true
    } = options;

    const serialized: SerializableData = {
      id: session.id,
      participants: [...session.participants],
      sharedFiles: [...session.sharedFiles],
      communicationChannel: session.communicationChannel,
      startTime: this.serializeDate(session.startTime, dateFormat),
      status: session.status
    };

    // Include optional fields
    if (session.endTime) {
      serialized.endTime = this.serializeDate(session.endTime, dateFormat);
    }

    // Include metadata if requested
    if (includeMetadata) {
      serialized._metadata = {
        serializedAt: this.serializeDate(new Date(), dateFormat),
        version: '1.0'
      };
    }

    // Exclude specified fields
    excludeFields.forEach(field => {
      delete serialized[field];
    });

    return serialized;
  }

  /**
   * Deserialize collaboration session
   */
  static deserializeCollaborationSession(data: SerializableData): CollaborationSession {
    if (!data.id || !Array.isArray(data.participants)) {
      throw new ValidationError('Invalid collaboration session data: missing required fields');
    }

    return {
      id: data.id,
      participants: data.participants,
      sharedFiles: Array.isArray(data.sharedFiles) ? data.sharedFiles : [],
      communicationChannel: data.communicationChannel || `channel-${data.id}`,
      startTime: this.deserializeDate(data.startTime),
      endTime: data.endTime ? this.deserializeDate(data.endTime) : undefined,
      status: data.status || 'active'
    };
  }

  /**
   * Serialize date based on format
   */
  private static serializeDate(date: Date, format: 'iso' | 'timestamp'): string | number {
    if (!(date instanceof Date) || isNaN(date.getTime())) {
      throw new ValidationError('Invalid date for serialization');
    }

    return format === 'iso' ? date.toISOString() : date.getTime();
  }

  /**
   * Deserialize date from string or number
   */
  private static deserializeDate(value: any): Date {
    if (value instanceof Date) {
      return value;
    }

    if (typeof value === 'string') {
      const date = new Date(value);
      if (isNaN(date.getTime())) {
        throw new ValidationError(`Invalid date string: ${value}`);
      }
      return date;
    }

    if (typeof value === 'number') {
      const date = new Date(value);
      if (isNaN(date.getTime())) {
        throw new ValidationError(`Invalid timestamp: ${value}`);
      }
      return date;
    }

    throw new ValidationError(`Cannot deserialize date from: ${typeof value}`);
  }

  /**
   * Serialize content (handle circular references and functions)
   */
  private static serializeContent(content: any): any {
    if (content === null || content === undefined) {
      return content;
    }

    if (typeof content === 'function') {
      return '[Function]';
    }

    if (content instanceof Date) {
      return content.toISOString();
    }

    if (content instanceof Error) {
      return {
        _type: 'Error',
        name: content.name,
        message: content.message,
        stack: content.stack
      };
    }

    if (Array.isArray(content)) {
      return content.map(item => this.serializeContent(item));
    }

    if (typeof content === 'object') {
      const serialized: any = {};
      for (const [key, value] of Object.entries(content)) {
        try {
          serialized[key] = this.serializeContent(value);
        } catch (error) {
          // Skip circular references or other serialization errors
          serialized[key] = '[Unserializable]';
        }
      }
      return serialized;
    }

    return content;
  }

  /**
   * Create a deep copy of serializable data
   */
  static deepClone<T>(data: T): T {
    if (data === null || typeof data !== 'object') {
      return data;
    }

    if (data instanceof Date) {
      return new Date(data.getTime()) as unknown as T;
    }

    if (Array.isArray(data)) {
      return data.map(item => this.deepClone(item)) as unknown as T;
    }

    const cloned: any = {};
    for (const [key, value] of Object.entries(data)) {
      cloned[key] = this.deepClone(value);
    }

    return cloned;
  }

  /**
   * Convert object to JSON string with error handling
   */
  static toJSON(data: any, options: SerializationOptions = {}): string {
    try {
      return JSON.stringify(data, null, 2);
    } catch (error) {
      throw new ValidationError(`Failed to serialize to JSON: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Parse JSON string with error handling
   */
  static fromJSON(jsonString: string): any {
    try {
      return JSON.parse(jsonString);
    } catch (error) {
      throw new ValidationError(`Failed to parse JSON: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Batch serialize multiple items
   */
  static serializeBatch<T>(
    items: T[],
    serializer: (item: T, options?: SerializationOptions) => SerializableData,
    options: SerializationOptions = {}
  ): SerializableData[] {
    return items.map(item => serializer(item, options));
  }

  /**
   * Batch deserialize multiple items
   */
  static deserializeBatch<T>(
    data: SerializableData[],
    deserializer: (data: SerializableData) => T
  ): T[] {
    return data.map(item => deserializer(item));
  }
}
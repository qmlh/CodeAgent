/**
 * System error classes and utilities
 */

import { ErrorType, ErrorSeverity, SystemError as ISystemError, ErrorContext } from '../../types/error.types';

export class SystemError extends Error implements ISystemError {
  public readonly type: ErrorType;
  public readonly severity: ErrorSeverity;
  public readonly agentId?: string;
  public readonly taskId?: string;
  public readonly context?: Record<string, any>;
  public readonly timestamp: Date;
  public readonly recoverable: boolean;

  constructor(
    message: string,
    type: ErrorType,
    severity: ErrorSeverity = ErrorSeverity.MEDIUM,
    recoverable: boolean = true,
    context?: ErrorContext
  ) {
    super(message);
    this.name = 'SystemError';
    this.type = type;
    this.severity = severity;
    this.recoverable = recoverable;
    this.timestamp = new Date();
    
    if (context) {
      this.agentId = context.agentId;
      this.taskId = context.taskId;
      this.context = context.metadata;
    }
  }

  public toJSON() {
    return {
      name: this.name,
      message: this.message,
      type: this.type,
      severity: this.severity,
      agentId: this.agentId,
      taskId: this.taskId,
      context: this.context,
      timestamp: this.timestamp,
      recoverable: this.recoverable,
      stack: this.stack
    };
  }
}

export class AgentError extends SystemError {
  constructor(message: string, agentId: string, severity: ErrorSeverity = ErrorSeverity.MEDIUM) {
    super(message, ErrorType.AGENT_ERROR, severity, true, { agentId });
  }
}

export class TaskError extends SystemError {
  constructor(message: string, taskId: string, agentId?: string, severity: ErrorSeverity = ErrorSeverity.MEDIUM) {
    super(message, ErrorType.TASK_ERROR, severity, true, { taskId, agentId });
  }
}

export class FileError extends SystemError {
  constructor(message: string, filePath: string, agentId?: string, severity: ErrorSeverity = ErrorSeverity.MEDIUM) {
    super(message, ErrorType.FILE_ERROR, severity, true, { agentId, metadata: { filePath } });
  }
}

export class CommunicationError extends SystemError {
  constructor(message: string, agentId?: string, severity: ErrorSeverity = ErrorSeverity.HIGH) {
    super(message, ErrorType.COMMUNICATION_ERROR, severity, true, { agentId });
  }
}

export class ValidationError extends SystemError {
  constructor(message: string, context?: ErrorContext, severity: ErrorSeverity = ErrorSeverity.LOW) {
    super(message, ErrorType.VALIDATION_ERROR, severity, false, context);
  }
}
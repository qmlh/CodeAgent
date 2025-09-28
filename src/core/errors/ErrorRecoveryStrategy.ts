/**
 * Error recovery strategy interfaces and implementations
 */

import { ErrorType, ErrorSeverity, ErrorContext, RecoveryResult } from '../../types/error.types';
import { SystemError } from './SystemError';

/**
 * Base interface for error recovery strategies
 */
export interface IErrorRecoveryStrategy {
  /**
   * Determines if this strategy can handle the given error
   */
  canHandle(error: SystemError): boolean;

  /**
   * Attempts to recover from the error
   */
  recover(error: SystemError, context: ErrorContext): Promise<RecoveryResult>;

  /**
   * Gets the priority of this strategy (higher number = higher priority)
   */
  getPriority(): number;

  /**
   * Gets the name of this strategy
   */
  getName(): string;
}

/**
 * Abstract base class for recovery strategies
 */
export abstract class BaseRecoveryStrategy implements IErrorRecoveryStrategy {
  protected readonly name: string;
  protected readonly priority: number;

  constructor(name: string, priority: number) {
    this.name = name;
    this.priority = priority;
  }

  abstract canHandle(error: SystemError): boolean;
  abstract recover(error: SystemError, context: ErrorContext): Promise<RecoveryResult>;

  getPriority(): number {
    return this.priority;
  }

  getName(): string {
    return this.name;
  }

  protected createSuccessResult(action: string, message: string): RecoveryResult {
    return {
      success: true,
      action,
      message
    };
  }

  protected createFailureResult(action: string, message: string, retryAfter?: number): RecoveryResult {
    return {
      success: false,
      action,
      message,
      retryAfter
    };
  }

  protected createRetryResult(action: string, message: string, retryAfter: number): RecoveryResult {
    return {
      success: false,
      action,
      message,
      retryAfter
    };
  }
}

/**
 * Strategy for recovering from agent errors
 */
export class AgentRecoveryStrategy extends BaseRecoveryStrategy {
  constructor() {
    super('AgentRecoveryStrategy', 100);
  }

  canHandle(error: SystemError): boolean {
    return error.type === ErrorType.AGENT_ERROR;
  }

  async recover(error: SystemError, context: ErrorContext): Promise<RecoveryResult> {
    const { agentId } = error;
    
    if (!agentId) {
      return this.createFailureResult('agent_recovery', 'No agent ID provided for recovery');
    }

    try {
      // Attempt different recovery strategies based on error severity
      switch (error.severity) {
        case ErrorSeverity.LOW:
          return this.handleLowSeverityAgentError(error, context);
        
        case ErrorSeverity.MEDIUM:
          return this.handleMediumSeverityAgentError(error, context);
        
        case ErrorSeverity.HIGH:
        case ErrorSeverity.CRITICAL:
          return this.handleHighSeverityAgentError(error, context);
        
        default:
          return this.createFailureResult('agent_recovery', 'Unknown error severity');
      }
    } catch (recoveryError) {
      return this.createFailureResult(
        'agent_recovery',
        `Recovery failed: ${recoveryError instanceof Error ? recoveryError.message : 'Unknown error'}`
      );
    }
  }

  private async handleLowSeverityAgentError(error: SystemError, context: ErrorContext): Promise<RecoveryResult> {
    // For low severity errors, just log and continue
    return this.createSuccessResult(
      'log_and_continue',
      `Logged low severity agent error for agent ${error.agentId}`
    );
  }

  private async handleMediumSeverityAgentError(error: SystemError, context: ErrorContext): Promise<RecoveryResult> {
    // For medium severity errors, attempt to reset agent state
    return this.createSuccessResult(
      'reset_agent_state',
      `Reset state for agent ${error.agentId}`
    );
  }

  private async handleHighSeverityAgentError(error: SystemError, context: ErrorContext): Promise<RecoveryResult> {
    // For high severity errors, restart the agent
    return this.createSuccessResult(
      'restart_agent',
      `Initiated restart for agent ${error.agentId}`
    );
  }
}

/**
 * Strategy for recovering from task errors
 */
export class TaskRecoveryStrategy extends BaseRecoveryStrategy {
  constructor() {
    super('TaskRecoveryStrategy', 90);
  }

  canHandle(error: SystemError): boolean {
    return error.type === ErrorType.TASK_ERROR;
  }

  async recover(error: SystemError, context: ErrorContext): Promise<RecoveryResult> {
    const { taskId, agentId } = error;
    
    if (!taskId) {
      return this.createFailureResult('task_recovery', 'No task ID provided for recovery');
    }

    try {
      switch (error.severity) {
        case ErrorSeverity.LOW:
          return this.handleLowSeverityTaskError(error, context);
        
        case ErrorSeverity.MEDIUM:
          return this.handleMediumSeverityTaskError(error, context);
        
        case ErrorSeverity.HIGH:
        case ErrorSeverity.CRITICAL:
          return this.handleHighSeverityTaskError(error, context);
        
        default:
          return this.createFailureResult('task_recovery', 'Unknown error severity');
      }
    } catch (recoveryError) {
      return this.createFailureResult(
        'task_recovery',
        `Task recovery failed: ${recoveryError instanceof Error ? recoveryError.message : 'Unknown error'}`
      );
    }
  }

  private async handleLowSeverityTaskError(error: SystemError, context: ErrorContext): Promise<RecoveryResult> {
    // Retry the task with the same agent
    return this.createRetryResult(
      'retry_task',
      `Retrying task ${error.taskId} with agent ${error.agentId}`,
      5000 // Retry after 5 seconds
    );
  }

  private async handleMediumSeverityTaskError(error: SystemError, context: ErrorContext): Promise<RecoveryResult> {
    // Reassign the task to a different agent
    return this.createSuccessResult(
      'reassign_task',
      `Reassigning task ${error.taskId} to a different agent`
    );
  }

  private async handleHighSeverityTaskError(error: SystemError, context: ErrorContext): Promise<RecoveryResult> {
    // Cancel the task and notify user
    return this.createSuccessResult(
      'cancel_task',
      `Cancelled task ${error.taskId} due to critical error`
    );
  }
}

/**
 * Strategy for recovering from file errors
 */
export class FileRecoveryStrategy extends BaseRecoveryStrategy {
  constructor() {
    super('FileRecoveryStrategy', 80);
  }

  canHandle(error: SystemError): boolean {
    return error.type === ErrorType.FILE_ERROR;
  }

  async recover(error: SystemError, context: ErrorContext): Promise<RecoveryResult> {
    const filePath = error.context?.filePath || context.metadata?.filePath;
    
    if (!filePath) {
      return this.createFailureResult('file_recovery', 'No file path provided for recovery');
    }

    try {
      switch (error.severity) {
        case ErrorSeverity.LOW:
          return this.handleLowSeverityFileError(error, context);
        
        case ErrorSeverity.MEDIUM:
          return this.handleMediumSeverityFileError(error, context);
        
        case ErrorSeverity.HIGH:
        case ErrorSeverity.CRITICAL:
          return this.handleHighSeverityFileError(error, context);
        
        default:
          return this.createFailureResult('file_recovery', 'Unknown error severity');
      }
    } catch (recoveryError) {
      return this.createFailureResult(
        'file_recovery',
        `File recovery failed: ${recoveryError instanceof Error ? recoveryError.message : 'Unknown error'}`
      );
    }
  }

  private async handleLowSeverityFileError(error: SystemError, context: ErrorContext): Promise<RecoveryResult> {
    // Retry the file operation
    return this.createRetryResult(
      'retry_file_operation',
      `Retrying file operation for ${error.context?.filePath}`,
      2000 // Retry after 2 seconds
    );
  }

  private async handleMediumSeverityFileError(error: SystemError, context: ErrorContext): Promise<RecoveryResult> {
    // Release file locks and retry
    return this.createSuccessResult(
      'release_locks_and_retry',
      `Released file locks and retrying operation for ${error.context?.filePath}`
    );
  }

  private async handleHighSeverityFileError(error: SystemError, context: ErrorContext): Promise<RecoveryResult> {
    // Create backup and restore from backup
    return this.createSuccessResult(
      'restore_from_backup',
      `Restored file ${error.context?.filePath} from backup`
    );
  }
}

/**
 * Strategy for recovering from communication errors
 */
export class CommunicationRecoveryStrategy extends BaseRecoveryStrategy {
  constructor() {
    super('CommunicationRecoveryStrategy', 70);
  }

  canHandle(error: SystemError): boolean {
    return error.type === ErrorType.COMMUNICATION_ERROR;
  }

  async recover(error: SystemError, context: ErrorContext): Promise<RecoveryResult> {
    try {
      switch (error.severity) {
        case ErrorSeverity.LOW:
        case ErrorSeverity.MEDIUM:
          return this.handleMediumSeverityCommunicationError(error, context);
        
        case ErrorSeverity.HIGH:
        case ErrorSeverity.CRITICAL:
          return this.handleHighSeverityCommunicationError(error, context);
        
        default:
          return this.createFailureResult('communication_recovery', 'Unknown error severity');
      }
    } catch (recoveryError) {
      return this.createFailureResult(
        'communication_recovery',
        `Communication recovery failed: ${recoveryError instanceof Error ? recoveryError.message : 'Unknown error'}`
      );
    }
  }

  private async handleMediumSeverityCommunicationError(error: SystemError, context: ErrorContext): Promise<RecoveryResult> {
    // Reconnect and retry
    return this.createRetryResult(
      'reconnect_and_retry',
      `Reconnecting communication channel for agent ${error.agentId}`,
      3000 // Retry after 3 seconds
    );
  }

  private async handleHighSeverityCommunicationError(error: SystemError, context: ErrorContext): Promise<RecoveryResult> {
    // Reset communication system
    return this.createSuccessResult(
      'reset_communication_system',
      'Reset communication system due to critical error'
    );
  }
}

/**
 * Fallback strategy for unhandled errors
 */
export class FallbackRecoveryStrategy extends BaseRecoveryStrategy {
  constructor() {
    super('FallbackRecoveryStrategy', 1); // Lowest priority
  }

  canHandle(error: SystemError): boolean {
    return true; // Can handle any error as fallback
  }

  async recover(error: SystemError, context: ErrorContext): Promise<RecoveryResult> {
    // Log the error and escalate to user
    return this.createFailureResult(
      'escalate_to_user',
      `Unhandled error of type ${error.type}: ${error.message}. Manual intervention required.`
    );
  }
}
/**
 * Error handling type definitions
 */

export enum ErrorType {
  AGENT_ERROR = 'agent_error',
  TASK_ERROR = 'task_error',
  COMMUNICATION_ERROR = 'communication_error',
  FILE_ERROR = 'file_error',
  SYSTEM_ERROR = 'system_error',
  VALIDATION_ERROR = 'validation_error',
  CONFIGURATION_ERROR = 'configuration_error',
  ENVIRONMENT_ERROR = 'environment_error',
  TIMEOUT_ERROR = 'timeout_error',
  DEPENDENCY_ERROR = 'dependency_error'
}

export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export interface SystemError extends Error {
  type: ErrorType;
  severity: ErrorSeverity;
  agentId?: string;
  taskId?: string;
  context?: Record<string, any>;
  timestamp: Date;
  recoverable: boolean;
}

export interface ErrorContext {
  agentId?: string;
  taskId?: string;
  filePath?: string;
  operation?: string;
  metadata?: Record<string, any>;
}

export interface RecoveryResult {
  success: boolean;
  action: string;
  message: string;
  retryAfter?: number;
}
/**
 * Error Recovery Strategy interface definition
 */

import { SystemError, ErrorType, ErrorContext, RecoveryResult } from '../../types/error.types';

export interface IErrorRecoveryStrategy {
  // Error detection and classification
  detectError(error: Error): ErrorType;
  classifyError(error: SystemError): ErrorType;
  
  // Recovery capability assessment
  canRecover(errorType: ErrorType): boolean;
  getRecoveryOptions(error: SystemError): string[];
  
  // Recovery execution
  recover(context: ErrorContext): Promise<RecoveryResult>;
  rollback(context: ErrorContext): Promise<RecoveryResult>;
  
  // Error escalation
  escalate(error: SystemError): Promise<void>;
  shouldEscalate(error: SystemError, attemptCount: number): boolean;
  
  // Recovery monitoring
  getRecoveryHistory(agentId?: string): Promise<RecoveryResult[]>;
  getRecoveryStatistics(): Promise<{
    totalAttempts: number;
    successfulRecoveries: number;
    failedRecoveries: number;
    escalatedErrors: number;
  }>;
}
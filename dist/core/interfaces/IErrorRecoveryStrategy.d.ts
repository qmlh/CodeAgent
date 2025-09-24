/**
 * Error Recovery Strategy interface definition
 */
import { SystemError, ErrorType, ErrorContext, RecoveryResult } from '../../types/error.types';
export interface IErrorRecoveryStrategy {
    detectError(error: Error): ErrorType;
    classifyError(error: SystemError): ErrorType;
    canRecover(errorType: ErrorType): boolean;
    getRecoveryOptions(error: SystemError): string[];
    recover(context: ErrorContext): Promise<RecoveryResult>;
    rollback(context: ErrorContext): Promise<RecoveryResult>;
    escalate(error: SystemError): Promise<void>;
    shouldEscalate(error: SystemError, attemptCount: number): boolean;
    getRecoveryHistory(agentId?: string): Promise<RecoveryResult[]>;
    getRecoveryStatistics(): Promise<{
        totalAttempts: number;
        successfulRecoveries: number;
        failedRecoveries: number;
        escalatedErrors: number;
    }>;
}

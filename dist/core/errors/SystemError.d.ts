/**
 * System error classes and utilities
 */
import { ErrorType, ErrorSeverity, SystemError as ISystemError, ErrorContext } from '../../types/error.types';
export declare class SystemError extends Error implements ISystemError {
    readonly type: ErrorType;
    readonly severity: ErrorSeverity;
    readonly agentId?: string;
    readonly taskId?: string;
    readonly context?: Record<string, any>;
    readonly timestamp: Date;
    readonly recoverable: boolean;
    constructor(message: string, type: ErrorType, severity?: ErrorSeverity, recoverable?: boolean, context?: ErrorContext);
    toJSON(): {
        name: string;
        message: string;
        type: ErrorType;
        severity: ErrorSeverity;
        agentId: string | undefined;
        taskId: string | undefined;
        context: Record<string, any> | undefined;
        timestamp: Date;
        recoverable: boolean;
        stack: string | undefined;
    };
}
export declare class AgentError extends SystemError {
    constructor(message: string, agentId: string, severity?: ErrorSeverity);
}
export declare class TaskError extends SystemError {
    constructor(message: string, taskId: string, agentId?: string, severity?: ErrorSeverity);
}
export declare class FileError extends SystemError {
    constructor(message: string, filePath: string, agentId?: string, severity?: ErrorSeverity);
}
export declare class CommunicationError extends SystemError {
    constructor(message: string, agentId?: string, severity?: ErrorSeverity);
}
export declare class ValidationError extends SystemError {
    constructor(message: string, context?: ErrorContext, severity?: ErrorSeverity);
}
//# sourceMappingURL=SystemError.d.ts.map
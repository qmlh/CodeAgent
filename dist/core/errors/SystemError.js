"use strict";
/**
 * System error classes and utilities
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValidationError = exports.CommunicationError = exports.FileError = exports.TaskError = exports.AgentError = exports.SystemError = void 0;
const error_types_1 = require("../../types/error.types");
class SystemError extends Error {
    constructor(message, type, severity = error_types_1.ErrorSeverity.MEDIUM, recoverable = true, context) {
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
    toJSON() {
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
exports.SystemError = SystemError;
class AgentError extends SystemError {
    constructor(message, agentId, severity = error_types_1.ErrorSeverity.MEDIUM) {
        super(message, error_types_1.ErrorType.AGENT_ERROR, severity, true, { agentId });
    }
}
exports.AgentError = AgentError;
class TaskError extends SystemError {
    constructor(message, taskId, agentId, severity = error_types_1.ErrorSeverity.MEDIUM) {
        super(message, error_types_1.ErrorType.TASK_ERROR, severity, true, { taskId, agentId });
    }
}
exports.TaskError = TaskError;
class FileError extends SystemError {
    constructor(message, filePath, agentId, severity = error_types_1.ErrorSeverity.MEDIUM) {
        super(message, error_types_1.ErrorType.FILE_ERROR, severity, true, { agentId, metadata: { filePath } });
    }
}
exports.FileError = FileError;
class CommunicationError extends SystemError {
    constructor(message, agentId, severity = error_types_1.ErrorSeverity.HIGH) {
        super(message, error_types_1.ErrorType.COMMUNICATION_ERROR, severity, true, { agentId });
    }
}
exports.CommunicationError = CommunicationError;
class ValidationError extends SystemError {
    constructor(message, context, severity = error_types_1.ErrorSeverity.LOW) {
        super(message, error_types_1.ErrorType.VALIDATION_ERROR, severity, false, context);
    }
}
exports.ValidationError = ValidationError;
//# sourceMappingURL=SystemError.js.map
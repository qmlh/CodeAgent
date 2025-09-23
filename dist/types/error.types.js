"use strict";
/**
 * Error handling type definitions
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ErrorSeverity = exports.ErrorType = void 0;
var ErrorType;
(function (ErrorType) {
    ErrorType["AGENT_ERROR"] = "agent_error";
    ErrorType["TASK_ERROR"] = "task_error";
    ErrorType["COMMUNICATION_ERROR"] = "communication_error";
    ErrorType["FILE_ERROR"] = "file_error";
    ErrorType["SYSTEM_ERROR"] = "system_error";
    ErrorType["VALIDATION_ERROR"] = "validation_error";
})(ErrorType || (exports.ErrorType = ErrorType = {}));
var ErrorSeverity;
(function (ErrorSeverity) {
    ErrorSeverity["LOW"] = "low";
    ErrorSeverity["MEDIUM"] = "medium";
    ErrorSeverity["HIGH"] = "high";
    ErrorSeverity["CRITICAL"] = "critical";
})(ErrorSeverity || (exports.ErrorSeverity = ErrorSeverity = {}));
//# sourceMappingURL=error.types.js.map
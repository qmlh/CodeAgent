"use strict";
/**
 * Task system type definitions
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskPriority = exports.TaskStatus = void 0;
var TaskStatus;
(function (TaskStatus) {
    TaskStatus["PENDING"] = "pending";
    TaskStatus["IN_PROGRESS"] = "in_progress";
    TaskStatus["COMPLETED"] = "completed";
    TaskStatus["FAILED"] = "failed";
    TaskStatus["BLOCKED"] = "blocked";
})(TaskStatus || (exports.TaskStatus = TaskStatus = {}));
var TaskPriority;
(function (TaskPriority) {
    TaskPriority[TaskPriority["LOW"] = 1] = "LOW";
    TaskPriority[TaskPriority["MEDIUM"] = 2] = "MEDIUM";
    TaskPriority[TaskPriority["HIGH"] = 3] = "HIGH";
    TaskPriority[TaskPriority["CRITICAL"] = 4] = "CRITICAL";
})(TaskPriority || (exports.TaskPriority = TaskPriority = {}));
//# sourceMappingURL=task.types.js.map
"use strict";
/**
 * Message and communication type definitions
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventType = exports.MessageType = void 0;
var MessageType;
(function (MessageType) {
    MessageType["INFO"] = "info";
    MessageType["REQUEST"] = "request";
    MessageType["RESPONSE"] = "response";
    MessageType["ALERT"] = "alert";
    MessageType["SYSTEM"] = "system";
})(MessageType || (exports.MessageType = MessageType = {}));
var EventType;
(function (EventType) {
    EventType["AGENT_CREATED"] = "agent_created";
    EventType["AGENT_DESTROYED"] = "agent_destroyed";
    EventType["AGENT_STATUS_CHANGED"] = "agent_status_changed";
    EventType["TASK_ASSIGNED"] = "task_assigned";
    EventType["TASK_COMPLETED"] = "task_completed";
    EventType["TASK_FAILED"] = "task_failed";
    EventType["FILE_LOCKED"] = "file_locked";
    EventType["FILE_UNLOCKED"] = "file_unlocked";
    EventType["COLLABORATION_STARTED"] = "collaboration_started";
    EventType["COLLABORATION_ENDED"] = "collaboration_ended";
})(EventType || (exports.EventType = EventType = {}));
//# sourceMappingURL=message.types.js.map
"use strict";
/**
 * Agent type definitions based on the design document
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentStatus = exports.AgentType = void 0;
var AgentType;
(function (AgentType) {
    AgentType["FRONTEND"] = "frontend";
    AgentType["BACKEND"] = "backend";
    AgentType["TESTING"] = "testing";
    AgentType["DOCUMENTATION"] = "documentation";
    AgentType["CODE_REVIEW"] = "code_review";
    AgentType["DEVOPS"] = "devops";
})(AgentType || (exports.AgentType = AgentType = {}));
var AgentStatus;
(function (AgentStatus) {
    AgentStatus["IDLE"] = "idle";
    AgentStatus["WORKING"] = "working";
    AgentStatus["WAITING"] = "waiting";
    AgentStatus["ERROR"] = "error";
    AgentStatus["OFFLINE"] = "offline";
})(AgentStatus || (exports.AgentStatus = AgentStatus = {}));
//# sourceMappingURL=agent.types.js.map
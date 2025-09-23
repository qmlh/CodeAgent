"use strict";
/**
 * Data validation utilities
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValidationUtils = exports.CollaborationSessionValidator = exports.AgentMessageValidator = exports.TaskValidator = exports.AgentValidator = exports.AgentConfigValidator = exports.BaseValidator = void 0;
const agent_types_1 = require("../../types/agent.types");
const task_types_1 = require("../../types/task.types");
const message_types_1 = require("../../types/message.types");
const SystemError_1 = require("../errors/SystemError");
/**
 * Base validator class
 */
class BaseValidator {
    createError(message) {
        return {
            isValid: false,
            errors: [message]
        };
    }
    createSuccess() {
        return {
            isValid: true,
            errors: []
        };
    }
    combineResults(...results) {
        const allErrors = results.flatMap(r => r.errors);
        return {
            isValid: allErrors.length === 0,
            errors: allErrors
        };
    }
}
exports.BaseValidator = BaseValidator;
/**
 * Agent configuration validator
 */
class AgentConfigValidator extends BaseValidator {
    validate(config) {
        const errors = [];
        // Validate name
        if (!config.name || config.name.trim().length === 0) {
            errors.push('Agent name is required');
        }
        else if (config.name.length > 100) {
            errors.push('Agent name must be less than 100 characters');
        }
        // Validate type
        if (!Object.values(agent_types_1.AgentType).includes(config.type)) {
            errors.push(`Invalid agent type: ${config.type}`);
        }
        // Validate capabilities
        if (!Array.isArray(config.capabilities)) {
            errors.push('Capabilities must be an array');
        }
        else if (config.capabilities.length === 0) {
            errors.push('Agent must have at least one capability');
        }
        // Validate numeric values
        if (config.maxConcurrentTasks <= 0) {
            errors.push('Max concurrent tasks must be greater than 0');
        }
        if (config.timeout <= 0) {
            errors.push('Timeout must be greater than 0');
        }
        if (config.retryAttempts < 0) {
            errors.push('Retry attempts cannot be negative');
        }
        return {
            isValid: errors.length === 0,
            errors
        };
    }
}
exports.AgentConfigValidator = AgentConfigValidator;
/**
 * Agent validator
 */
class AgentValidator extends BaseValidator {
    constructor() {
        super(...arguments);
        this.configValidator = new AgentConfigValidator();
    }
    validate(agent) {
        const errors = [];
        // Validate ID
        if (!agent.id || agent.id.trim().length === 0) {
            errors.push('Agent ID is required');
        }
        // Validate name
        if (!agent.name || agent.name.trim().length === 0) {
            errors.push('Agent name is required');
        }
        // Validate type
        if (!Object.values(agent_types_1.AgentType).includes(agent.type)) {
            errors.push(`Invalid agent type: ${agent.type}`);
        }
        // Validate status
        if (!Object.values(agent_types_1.AgentStatus).includes(agent.status)) {
            errors.push(`Invalid agent status: ${agent.status}`);
        }
        // Validate config
        const configResult = this.configValidator.validate(agent.config);
        errors.push(...configResult.errors);
        // Validate capabilities
        if (!Array.isArray(agent.capabilities)) {
            errors.push('Capabilities must be an array');
        }
        // Validate workload
        if (agent.workload < 0 || agent.workload > 100) {
            errors.push('Workload must be between 0 and 100');
        }
        // Validate dates
        if (!(agent.createdAt instanceof Date) || isNaN(agent.createdAt.getTime())) {
            errors.push('Created date must be a valid Date');
        }
        if (!(agent.lastActive instanceof Date) || isNaN(agent.lastActive.getTime())) {
            errors.push('Last active date must be a valid Date');
        }
        return {
            isValid: errors.length === 0,
            errors
        };
    }
}
exports.AgentValidator = AgentValidator;
/**
 * Task validator
 */
class TaskValidator extends BaseValidator {
    validate(task) {
        const errors = [];
        // Validate ID
        if (!task.id || task.id.trim().length === 0) {
            errors.push('Task ID is required');
        }
        // Validate title
        if (!task.title || task.title.trim().length === 0) {
            errors.push('Task title is required');
        }
        else if (task.title.length > 200) {
            errors.push('Task title must be less than 200 characters');
        }
        // Validate description
        if (!task.description || task.description.trim().length === 0) {
            errors.push('Task description is required');
        }
        // Validate type
        if (!task.type || task.type.trim().length === 0) {
            errors.push('Task type is required');
        }
        // Validate status
        if (!Object.values(task_types_1.TaskStatus).includes(task.status)) {
            errors.push(`Invalid task status: ${task.status}`);
        }
        // Validate priority
        if (!Object.values(task_types_1.TaskPriority).includes(task.priority)) {
            errors.push(`Invalid task priority: ${task.priority}`);
        }
        // Validate dependencies
        if (!Array.isArray(task.dependencies)) {
            errors.push('Dependencies must be an array');
        }
        // Validate estimated time
        if (task.estimatedTime <= 0) {
            errors.push('Estimated time must be greater than 0');
        }
        // Validate files array
        if (!Array.isArray(task.files)) {
            errors.push('Files must be an array');
        }
        // Validate requirements array
        if (!Array.isArray(task.requirements)) {
            errors.push('Requirements must be an array');
        }
        // Validate dates
        if (!(task.createdAt instanceof Date) || isNaN(task.createdAt.getTime())) {
            errors.push('Created date must be a valid Date');
        }
        if (task.startedAt && (!(task.startedAt instanceof Date) || isNaN(task.startedAt.getTime()))) {
            errors.push('Started date must be a valid Date');
        }
        if (task.completedAt && (!(task.completedAt instanceof Date) || isNaN(task.completedAt.getTime()))) {
            errors.push('Completed date must be a valid Date');
        }
        // Validate date logic
        if (task.startedAt && task.createdAt && task.startedAt < task.createdAt) {
            errors.push('Started date cannot be before created date');
        }
        if (task.completedAt && task.startedAt && task.completedAt < task.startedAt) {
            errors.push('Completed date cannot be before started date');
        }
        return {
            isValid: errors.length === 0,
            errors
        };
    }
}
exports.TaskValidator = TaskValidator;
/**
 * Agent message validator
 */
class AgentMessageValidator extends BaseValidator {
    validate(message) {
        const errors = [];
        // Validate ID
        if (!message.id || message.id.trim().length === 0) {
            errors.push('Message ID is required');
        }
        // Validate from
        if (!message.from || message.from.trim().length === 0) {
            errors.push('Message sender is required');
        }
        // Validate to
        if (!message.to) {
            errors.push('Message recipient is required');
        }
        else if (Array.isArray(message.to)) {
            if (message.to.length === 0) {
                errors.push('Message must have at least one recipient');
            }
            if (message.to.some(recipient => !recipient || recipient.trim().length === 0)) {
                errors.push('All recipients must be valid');
            }
        }
        else if (typeof message.to === 'string' && message.to.trim().length === 0) {
            errors.push('Message recipient cannot be empty');
        }
        // Validate type
        if (!Object.values(message_types_1.MessageType).includes(message.type)) {
            errors.push(`Invalid message type: ${message.type}`);
        }
        // Validate timestamp
        if (!(message.timestamp instanceof Date) || isNaN(message.timestamp.getTime())) {
            errors.push('Timestamp must be a valid Date');
        }
        // Validate requiresResponse
        if (typeof message.requiresResponse !== 'boolean') {
            errors.push('RequiresResponse must be a boolean');
        }
        return {
            isValid: errors.length === 0,
            errors
        };
    }
}
exports.AgentMessageValidator = AgentMessageValidator;
/**
 * Collaboration session validator
 */
class CollaborationSessionValidator extends BaseValidator {
    validate(session) {
        const errors = [];
        // Validate ID
        if (!session.id || session.id.trim().length === 0) {
            errors.push('Session ID is required');
        }
        // Validate participants
        if (!Array.isArray(session.participants)) {
            errors.push('Participants must be an array');
        }
        else if (session.participants.length < 2) {
            errors.push('Session must have at least 2 participants');
        }
        else if (session.participants.some(p => !p || p.trim().length === 0)) {
            errors.push('All participants must be valid');
        }
        // Validate shared files
        if (!Array.isArray(session.sharedFiles)) {
            errors.push('Shared files must be an array');
        }
        // Validate communication channel
        if (!session.communicationChannel || session.communicationChannel.trim().length === 0) {
            errors.push('Communication channel is required');
        }
        // Validate status
        const validStatuses = ['active', 'paused', 'completed'];
        if (!validStatuses.includes(session.status)) {
            errors.push(`Invalid session status: ${session.status}`);
        }
        // Validate dates
        if (!(session.startTime instanceof Date) || isNaN(session.startTime.getTime())) {
            errors.push('Start time must be a valid Date');
        }
        if (session.endTime && (!(session.endTime instanceof Date) || isNaN(session.endTime.getTime()))) {
            errors.push('End time must be a valid Date');
        }
        // Validate date logic
        if (session.endTime && session.endTime < session.startTime) {
            errors.push('End time must be after start time');
        }
        return {
            isValid: errors.length === 0,
            errors
        };
    }
}
exports.CollaborationSessionValidator = CollaborationSessionValidator;
/**
 * Validation utility functions
 */
class ValidationUtils {
    /**
     * Validate data and throw error if invalid
     */
    static validateOrThrow(validator, data, context) {
        const result = validator.validate(data);
        if (!result.isValid) {
            const contextMsg = context ? ` in ${context}` : '';
            throw new SystemError_1.ValidationError(`Validation failed${contextMsg}: ${result.errors.join(', ')}`, { metadata: { validationErrors: result.errors } });
        }
    }
    /**
     * Validate multiple items
     */
    static validateMany(validator, items) {
        const results = items.map(item => validator.validate(item));
        const allErrors = results.flatMap((result, index) => result.errors.map(error => `Item ${index}: ${error}`));
        return {
            isValid: allErrors.length === 0,
            errors: allErrors
        };
    }
    /**
     * Check if string is valid UUID format
     */
    static isValidUUID(uuid) {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        return uuidRegex.test(uuid);
    }
    /**
     * Sanitize string input
     */
    static sanitizeString(input) {
        return input.trim().replace(/[<>]/g, '');
    }
    /**
     * Validate email format
     */
    static isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
}
exports.ValidationUtils = ValidationUtils;
//# sourceMappingURL=validators.js.map
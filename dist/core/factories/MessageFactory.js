"use strict";
/**
 * Message factory for creating and initializing messages and collaboration sessions
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageFactory = void 0;
const uuid_1 = require("uuid");
const message_types_1 = require("../../types/message.types");
const validators_1 = require("../validation/validators");
const SystemError_1 = require("../errors/SystemError");
/**
 * Message factory class
 */
class MessageFactory {
    /**
     * Create a new agent message
     */
    static createMessage(options) {
        const message = {
            id: (0, uuid_1.v4)(),
            from: options.from,
            to: options.to,
            type: options.type,
            content: options.content,
            timestamp: new Date(),
            requiresResponse: options.requiresResponse || false,
            correlationId: options.correlationId
        };
        // Validate the created message
        validators_1.ValidationUtils.validateOrThrow(this.messageValidator, message, 'MessageFactory.createMessage');
        return message;
    }
    /**
     * Create message from existing data with validation
     */
    static fromData(data) {
        if (!data.id) {
            throw new SystemError_1.ValidationError('Message ID is required when creating from data');
        }
        const message = {
            id: data.id,
            from: data.from || 'unknown',
            to: data.to || 'unknown',
            type: data.type || message_types_1.MessageType.INFO,
            content: data.content,
            timestamp: data.timestamp || new Date(),
            requiresResponse: data.requiresResponse || false,
            correlationId: data.correlationId
        };
        // Validate the created message
        validators_1.ValidationUtils.validateOrThrow(this.messageValidator, message, 'MessageFactory.fromData');
        return message;
    }
    /**
     * Create an info message
     */
    static createInfoMessage(from, to, content) {
        return this.createMessage({
            from,
            to,
            type: message_types_1.MessageType.INFO,
            content,
            requiresResponse: false
        });
    }
    /**
     * Create a request message
     */
    static createRequestMessage(from, to, content, requiresResponse = true) {
        return this.createMessage({
            from,
            to,
            type: message_types_1.MessageType.REQUEST,
            content,
            requiresResponse
        });
    }
    /**
     * Create a response message
     */
    static createResponseMessage(from, to, content, correlationId) {
        return this.createMessage({
            from,
            to,
            type: message_types_1.MessageType.RESPONSE,
            content,
            requiresResponse: false,
            correlationId
        });
    }
    /**
     * Create an alert message
     */
    static createAlertMessage(from, to, content) {
        return this.createMessage({
            from,
            to,
            type: message_types_1.MessageType.ALERT,
            content,
            requiresResponse: false
        });
    }
    /**
     * Create a system message
     */
    static createSystemMessage(to, content) {
        return this.createMessage({
            from: 'system',
            to,
            type: message_types_1.MessageType.SYSTEM,
            content,
            requiresResponse: false
        });
    }
    /**
     * Create a broadcast message (to all agents)
     */
    static createBroadcastMessage(from, content, type = message_types_1.MessageType.INFO) {
        return this.createMessage({
            from,
            to: ['*'], // Special broadcast recipient
            type,
            content,
            requiresResponse: false
        });
    }
    /**
     * Create a collaboration session
     */
    static createCollaborationSession(options) {
        const session = {
            id: (0, uuid_1.v4)(),
            participants: options.participants,
            sharedFiles: options.sharedFiles || [],
            communicationChannel: options.communicationChannel || `channel-${(0, uuid_1.v4)()}`,
            startTime: new Date(),
            status: 'active'
        };
        // Validate the created session
        validators_1.ValidationUtils.validateOrThrow(this.sessionValidator, session, 'MessageFactory.createCollaborationSession');
        return session;
    }
    /**
     * Create collaboration session from existing data
     */
    static createSessionFromData(data) {
        if (!data.id) {
            throw new SystemError_1.ValidationError('Session ID is required when creating from data');
        }
        const session = {
            id: data.id,
            participants: data.participants || [],
            sharedFiles: data.sharedFiles || [],
            communicationChannel: data.communicationChannel || `channel-${data.id}`,
            startTime: data.startTime || new Date(),
            endTime: data.endTime,
            status: data.status || 'active'
        };
        // Validate the created session
        validators_1.ValidationUtils.validateOrThrow(this.sessionValidator, session, 'MessageFactory.createSessionFromData');
        return session;
    }
    /**
     * Add participant to collaboration session
     */
    static addParticipant(session, participantId) {
        if (session.participants.includes(participantId)) {
            return session; // Participant already exists
        }
        const updatedSession = {
            ...session,
            participants: [...session.participants, participantId]
        };
        // Validate the updated session
        validators_1.ValidationUtils.validateOrThrow(this.sessionValidator, updatedSession, 'MessageFactory.addParticipant');
        return updatedSession;
    }
    /**
     * Remove participant from collaboration session
     */
    static removeParticipant(session, participantId) {
        const updatedSession = {
            ...session,
            participants: session.participants.filter(id => id !== participantId)
        };
        // Validate the updated session (must have at least 2 participants)
        validators_1.ValidationUtils.validateOrThrow(this.sessionValidator, updatedSession, 'MessageFactory.removeParticipant');
        return updatedSession;
    }
    /**
     * Add shared file to collaboration session
     */
    static addSharedFile(session, filePath) {
        if (session.sharedFiles.includes(filePath)) {
            return session; // File already shared
        }
        const updatedSession = {
            ...session,
            sharedFiles: [...session.sharedFiles, filePath]
        };
        // Validate the updated session
        validators_1.ValidationUtils.validateOrThrow(this.sessionValidator, updatedSession, 'MessageFactory.addSharedFile');
        return updatedSession;
    }
    /**
     * Remove shared file from collaboration session
     */
    static removeSharedFile(session, filePath) {
        const updatedSession = {
            ...session,
            sharedFiles: session.sharedFiles.filter(file => file !== filePath)
        };
        // Validate the updated session
        validators_1.ValidationUtils.validateOrThrow(this.sessionValidator, updatedSession, 'MessageFactory.removeSharedFile');
        return updatedSession;
    }
    /**
     * End collaboration session
     */
    static endCollaborationSession(session) {
        const now = new Date();
        // Ensure endTime is at least 1ms after startTime
        const endTime = now.getTime() <= session.startTime.getTime()
            ? new Date(session.startTime.getTime() + 1)
            : now;
        const updatedSession = {
            ...session,
            status: 'completed',
            endTime
        };
        // Validate the updated session
        validators_1.ValidationUtils.validateOrThrow(this.sessionValidator, updatedSession, 'MessageFactory.endCollaborationSession');
        return updatedSession;
    }
    /**
     * Pause collaboration session
     */
    static pauseCollaborationSession(session) {
        const updatedSession = {
            ...session,
            status: 'paused'
        };
        // Validate the updated session
        validators_1.ValidationUtils.validateOrThrow(this.sessionValidator, updatedSession, 'MessageFactory.pauseCollaborationSession');
        return updatedSession;
    }
    /**
     * Resume collaboration session
     */
    static resumeCollaborationSession(session) {
        const updatedSession = {
            ...session,
            status: 'active'
        };
        // Validate the updated session
        validators_1.ValidationUtils.validateOrThrow(this.sessionValidator, updatedSession, 'MessageFactory.resumeCollaborationSession');
        return updatedSession;
    }
    /**
     * Create a message thread (request-response pair)
     */
    static createMessageThread(requestFrom, requestTo, requestContent, responseContent) {
        const request = this.createRequestMessage(requestFrom, requestTo, requestContent);
        let response;
        if (responseContent !== undefined) {
            response = this.createResponseMessage(requestTo, requestFrom, responseContent, request.id);
        }
        return { request, response };
    }
    /**
     * Validate message data without creating
     */
    static validateMessageData(data) {
        try {
            // Create a temporary message for validation
            const tempMessage = this.fromData({
                id: data.id || (0, uuid_1.v4)(),
                ...data
            });
            return { isValid: true, errors: [] };
        }
        catch (error) {
            if (error instanceof SystemError_1.ValidationError) {
                return { isValid: false, errors: [error.message] };
            }
            return { isValid: false, errors: ['Unknown validation error'] };
        }
    }
    /**
     * Validate session data without creating
     */
    static validateSessionData(data) {
        try {
            // Create a temporary session for validation
            const tempSession = this.createSessionFromData({
                id: data.id || (0, uuid_1.v4)(),
                ...data
            });
            return { isValid: true, errors: [] };
        }
        catch (error) {
            if (error instanceof SystemError_1.ValidationError) {
                return { isValid: false, errors: [error.message] };
            }
            return { isValid: false, errors: ['Unknown validation error'] };
        }
    }
    /**
     * Check if message requires response
     */
    static requiresResponse(message) {
        return message.requiresResponse && message.type === message_types_1.MessageType.REQUEST;
    }
    /**
     * Check if message is a response to another message
     */
    static isResponse(message) {
        return message.type === message_types_1.MessageType.RESPONSE && !!message.correlationId;
    }
    /**
     * Get session duration in milliseconds
     */
    static getSessionDuration(session) {
        const endTime = session.endTime || (session.status === 'active' ? new Date() : null);
        if (!endTime)
            return null;
        return endTime.getTime() - session.startTime.getTime();
    }
    /**
     * Check if session is active
     */
    static isSessionActive(session) {
        return session.status === 'active';
    }
}
exports.MessageFactory = MessageFactory;
MessageFactory.messageValidator = new validators_1.AgentMessageValidator();
MessageFactory.sessionValidator = new validators_1.CollaborationSessionValidator();
//# sourceMappingURL=MessageFactory.js.map
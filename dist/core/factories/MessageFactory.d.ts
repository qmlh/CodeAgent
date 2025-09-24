/**
 * Message factory for creating and initializing messages and collaboration sessions
 */
import { AgentMessage, MessageType, CollaborationSession } from '../../types/message.types';
/**
 * Message creation options
 */
export interface CreateMessageOptions {
    from: string;
    to: string | string[];
    type: MessageType;
    content: any;
    requiresResponse?: boolean;
    correlationId?: string;
}
/**
 * Collaboration session creation options
 */
export interface CreateCollaborationSessionOptions {
    participants: string[];
    sharedFiles?: string[];
    communicationChannel?: string;
}
/**
 * Message factory class
 */
export declare class MessageFactory {
    private static messageValidator;
    private static sessionValidator;
    /**
     * Create a new agent message
     */
    static createMessage(options: CreateMessageOptions): AgentMessage;
    /**
     * Create message from existing data with validation
     */
    static fromData(data: Partial<AgentMessage>): AgentMessage;
    /**
     * Create an info message
     */
    static createInfoMessage(from: string, to: string | string[], content: any): AgentMessage;
    /**
     * Create a request message
     */
    static createRequestMessage(from: string, to: string, content: any, requiresResponse?: boolean): AgentMessage;
    /**
     * Create a response message
     */
    static createResponseMessage(from: string, to: string, content: any, correlationId: string): AgentMessage;
    /**
     * Create an alert message
     */
    static createAlertMessage(from: string, to: string | string[], content: any): AgentMessage;
    /**
     * Create a system message
     */
    static createSystemMessage(to: string | string[], content: any): AgentMessage;
    /**
     * Create a broadcast message (to all agents)
     */
    static createBroadcastMessage(from: string, content: any, type?: MessageType): AgentMessage;
    /**
     * Create a collaboration session
     */
    static createCollaborationSession(options: CreateCollaborationSessionOptions): CollaborationSession;
    /**
     * Create collaboration session from existing data
     */
    static createSessionFromData(data: Partial<CollaborationSession>): CollaborationSession;
    /**
     * Add participant to collaboration session
     */
    static addParticipant(session: CollaborationSession, participantId: string): CollaborationSession;
    /**
     * Remove participant from collaboration session
     */
    static removeParticipant(session: CollaborationSession, participantId: string): CollaborationSession;
    /**
     * Add shared file to collaboration session
     */
    static addSharedFile(session: CollaborationSession, filePath: string): CollaborationSession;
    /**
     * Remove shared file from collaboration session
     */
    static removeSharedFile(session: CollaborationSession, filePath: string): CollaborationSession;
    /**
     * End collaboration session
     */
    static endCollaborationSession(session: CollaborationSession): CollaborationSession;
    /**
     * Pause collaboration session
     */
    static pauseCollaborationSession(session: CollaborationSession): CollaborationSession;
    /**
     * Resume collaboration session
     */
    static resumeCollaborationSession(session: CollaborationSession): CollaborationSession;
    /**
     * Create a message thread (request-response pair)
     */
    static createMessageThread(requestFrom: string, requestTo: string, requestContent: any, responseContent?: any): {
        request: AgentMessage;
        response?: AgentMessage;
    };
    /**
     * Validate message data without creating
     */
    static validateMessageData(data: Partial<AgentMessage>): {
        isValid: boolean;
        errors: string[];
    };
    /**
     * Validate session data without creating
     */
    static validateSessionData(data: Partial<CollaborationSession>): {
        isValid: boolean;
        errors: string[];
    };
    /**
     * Check if message requires response
     */
    static requiresResponse(message: AgentMessage): boolean;
    /**
     * Check if message is a response to another message
     */
    static isResponse(message: AgentMessage): boolean;
    /**
     * Get session duration in milliseconds
     */
    static getSessionDuration(session: CollaborationSession): number | null;
    /**
     * Check if session is active
     */
    static isSessionActive(session: CollaborationSession): boolean;
}

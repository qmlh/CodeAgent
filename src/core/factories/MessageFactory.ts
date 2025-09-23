/**
 * Message factory for creating and initializing messages and collaboration sessions
 */

import { v4 as uuidv4 } from 'uuid';
import { AgentMessage, MessageType, CollaborationSession } from '../../types/message.types';
import { AgentMessageValidator, CollaborationSessionValidator, ValidationUtils } from '../validation/validators';
import { ValidationError } from '../errors/SystemError';

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
export class MessageFactory {
  private static messageValidator = new AgentMessageValidator();
  private static sessionValidator = new CollaborationSessionValidator();

  /**
   * Create a new agent message
   */
  static createMessage(options: CreateMessageOptions): AgentMessage {
    const message: AgentMessage = {
      id: uuidv4(),
      from: options.from,
      to: options.to,
      type: options.type,
      content: options.content,
      timestamp: new Date(),
      requiresResponse: options.requiresResponse || false,
      correlationId: options.correlationId
    };

    // Validate the created message
    ValidationUtils.validateOrThrow(this.messageValidator, message, 'MessageFactory.createMessage');

    return message;
  }

  /**
   * Create message from existing data with validation
   */
  static fromData(data: Partial<AgentMessage>): AgentMessage {
    if (!data.id) {
      throw new ValidationError('Message ID is required when creating from data');
    }

    const message: AgentMessage = {
      id: data.id,
      from: data.from || 'unknown',
      to: data.to || 'unknown',
      type: data.type || MessageType.INFO,
      content: data.content,
      timestamp: data.timestamp || new Date(),
      requiresResponse: data.requiresResponse || false,
      correlationId: data.correlationId
    };

    // Validate the created message
    ValidationUtils.validateOrThrow(this.messageValidator, message, 'MessageFactory.fromData');

    return message;
  }

  /**
   * Create an info message
   */
  static createInfoMessage(from: string, to: string | string[], content: any): AgentMessage {
    return this.createMessage({
      from,
      to,
      type: MessageType.INFO,
      content,
      requiresResponse: false
    });
  }

  /**
   * Create a request message
   */
  static createRequestMessage(
    from: string,
    to: string,
    content: any,
    requiresResponse: boolean = true
  ): AgentMessage {
    return this.createMessage({
      from,
      to,
      type: MessageType.REQUEST,
      content,
      requiresResponse
    });
  }

  /**
   * Create a response message
   */
  static createResponseMessage(
    from: string,
    to: string,
    content: any,
    correlationId: string
  ): AgentMessage {
    return this.createMessage({
      from,
      to,
      type: MessageType.RESPONSE,
      content,
      requiresResponse: false,
      correlationId
    });
  }

  /**
   * Create an alert message
   */
  static createAlertMessage(from: string, to: string | string[], content: any): AgentMessage {
    return this.createMessage({
      from,
      to,
      type: MessageType.ALERT,
      content,
      requiresResponse: false
    });
  }

  /**
   * Create a system message
   */
  static createSystemMessage(to: string | string[], content: any): AgentMessage {
    return this.createMessage({
      from: 'system',
      to,
      type: MessageType.SYSTEM,
      content,
      requiresResponse: false
    });
  }

  /**
   * Create a broadcast message (to all agents)
   */
  static createBroadcastMessage(from: string, content: any, type: MessageType = MessageType.INFO): AgentMessage {
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
  static createCollaborationSession(options: CreateCollaborationSessionOptions): CollaborationSession {
    const session: CollaborationSession = {
      id: uuidv4(),
      participants: options.participants,
      sharedFiles: options.sharedFiles || [],
      communicationChannel: options.communicationChannel || `channel-${uuidv4()}`,
      startTime: new Date(),
      status: 'active'
    };

    // Validate the created session
    ValidationUtils.validateOrThrow(this.sessionValidator, session, 'MessageFactory.createCollaborationSession');

    return session;
  }

  /**
   * Create collaboration session from existing data
   */
  static createSessionFromData(data: Partial<CollaborationSession>): CollaborationSession {
    if (!data.id) {
      throw new ValidationError('Session ID is required when creating from data');
    }

    const session: CollaborationSession = {
      id: data.id,
      participants: data.participants || [],
      sharedFiles: data.sharedFiles || [],
      communicationChannel: data.communicationChannel || `channel-${data.id}`,
      startTime: data.startTime || new Date(),
      endTime: data.endTime,
      status: data.status || 'active'
    };

    // Validate the created session
    ValidationUtils.validateOrThrow(this.sessionValidator, session, 'MessageFactory.createSessionFromData');

    return session;
  }

  /**
   * Add participant to collaboration session
   */
  static addParticipant(session: CollaborationSession, participantId: string): CollaborationSession {
    if (session.participants.includes(participantId)) {
      return session; // Participant already exists
    }

    const updatedSession: CollaborationSession = {
      ...session,
      participants: [...session.participants, participantId]
    };

    // Validate the updated session
    ValidationUtils.validateOrThrow(this.sessionValidator, updatedSession, 'MessageFactory.addParticipant');

    return updatedSession;
  }

  /**
   * Remove participant from collaboration session
   */
  static removeParticipant(session: CollaborationSession, participantId: string): CollaborationSession {
    const updatedSession: CollaborationSession = {
      ...session,
      participants: session.participants.filter(id => id !== participantId)
    };

    // Validate the updated session (must have at least 2 participants)
    ValidationUtils.validateOrThrow(this.sessionValidator, updatedSession, 'MessageFactory.removeParticipant');

    return updatedSession;
  }

  /**
   * Add shared file to collaboration session
   */
  static addSharedFile(session: CollaborationSession, filePath: string): CollaborationSession {
    if (session.sharedFiles.includes(filePath)) {
      return session; // File already shared
    }

    const updatedSession: CollaborationSession = {
      ...session,
      sharedFiles: [...session.sharedFiles, filePath]
    };

    // Validate the updated session
    ValidationUtils.validateOrThrow(this.sessionValidator, updatedSession, 'MessageFactory.addSharedFile');

    return updatedSession;
  }

  /**
   * Remove shared file from collaboration session
   */
  static removeSharedFile(session: CollaborationSession, filePath: string): CollaborationSession {
    const updatedSession: CollaborationSession = {
      ...session,
      sharedFiles: session.sharedFiles.filter(file => file !== filePath)
    };

    // Validate the updated session
    ValidationUtils.validateOrThrow(this.sessionValidator, updatedSession, 'MessageFactory.removeSharedFile');

    return updatedSession;
  }

  /**
   * End collaboration session
   */
  static endCollaborationSession(session: CollaborationSession): CollaborationSession {
    const now = new Date();
    // Ensure endTime is at least 1ms after startTime
    const endTime = now.getTime() <= session.startTime.getTime() 
      ? new Date(session.startTime.getTime() + 1)
      : now;

    const updatedSession: CollaborationSession = {
      ...session,
      status: 'completed',
      endTime
    };

    // Validate the updated session
    ValidationUtils.validateOrThrow(this.sessionValidator, updatedSession, 'MessageFactory.endCollaborationSession');

    return updatedSession;
  }

  /**
   * Pause collaboration session
   */
  static pauseCollaborationSession(session: CollaborationSession): CollaborationSession {
    const updatedSession: CollaborationSession = {
      ...session,
      status: 'paused'
    };

    // Validate the updated session
    ValidationUtils.validateOrThrow(this.sessionValidator, updatedSession, 'MessageFactory.pauseCollaborationSession');

    return updatedSession;
  }

  /**
   * Resume collaboration session
   */
  static resumeCollaborationSession(session: CollaborationSession): CollaborationSession {
    const updatedSession: CollaborationSession = {
      ...session,
      status: 'active'
    };

    // Validate the updated session
    ValidationUtils.validateOrThrow(this.sessionValidator, updatedSession, 'MessageFactory.resumeCollaborationSession');

    return updatedSession;
  }

  /**
   * Create a message thread (request-response pair)
   */
  static createMessageThread(
    requestFrom: string,
    requestTo: string,
    requestContent: any,
    responseContent?: any
  ): { request: AgentMessage; response?: AgentMessage } {
    const request = this.createRequestMessage(requestFrom, requestTo, requestContent);
    
    let response: AgentMessage | undefined;
    if (responseContent !== undefined) {
      response = this.createResponseMessage(requestTo, requestFrom, responseContent, request.id);
    }

    return { request, response };
  }

  /**
   * Validate message data without creating
   */
  static validateMessageData(data: Partial<AgentMessage>): { isValid: boolean; errors: string[] } {
    try {
      // Create a temporary message for validation
      const tempMessage = this.fromData({
        id: data.id || uuidv4(),
        ...data
      });
      return { isValid: true, errors: [] };
    } catch (error) {
      if (error instanceof ValidationError) {
        return { isValid: false, errors: [error.message] };
      }
      return { isValid: false, errors: ['Unknown validation error'] };
    }
  }

  /**
   * Validate session data without creating
   */
  static validateSessionData(data: Partial<CollaborationSession>): { isValid: boolean; errors: string[] } {
    try {
      // Create a temporary session for validation
      const tempSession = this.createSessionFromData({
        id: data.id || uuidv4(),
        ...data
      });
      return { isValid: true, errors: [] };
    } catch (error) {
      if (error instanceof ValidationError) {
        return { isValid: false, errors: [error.message] };
      }
      return { isValid: false, errors: ['Unknown validation error'] };
    }
  }

  /**
   * Check if message requires response
   */
  static requiresResponse(message: AgentMessage): boolean {
    return message.requiresResponse && message.type === MessageType.REQUEST;
  }

  /**
   * Check if message is a response to another message
   */
  static isResponse(message: AgentMessage): boolean {
    return message.type === MessageType.RESPONSE && !!message.correlationId;
  }

  /**
   * Get session duration in milliseconds
   */
  static getSessionDuration(session: CollaborationSession): number | null {
    const endTime = session.endTime || (session.status === 'active' ? new Date() : null);
    if (!endTime) return null;
    
    return endTime.getTime() - session.startTime.getTime();
  }

  /**
   * Check if session is active
   */
  static isSessionActive(session: CollaborationSession): boolean {
    return session.status === 'active';
  }
}
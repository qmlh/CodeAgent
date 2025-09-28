/**
 * MessageManager - Core message system implementation
 * Handles agent-to-agent communication, event publishing/subscribing, and message routing
 */
import { EventEmitter } from 'events';
import { IMessageManager } from '../core/interfaces/IMessageManager';
import { AgentMessage, EventType, MessageType } from '../types/message.types';
interface ConnectionStatus {
    [agentId: string]: {
        connected: boolean;
        lastHeartbeat: Date;
        connectionId: string;
    };
}
export declare class MessageManager implements IMessageManager {
    private eventEmitter;
    private eventSubscriptions;
    private messageQueue;
    private messageHistory;
    private connections;
    private notifications;
    private readonly maxHistorySize;
    private readonly maxQueueSize;
    private queueProcessorInterval;
    constructor();
    initialize(): Promise<void>;
    /**
     * Send a message to specific agent(s)
     */
    sendMessage(message: AgentMessage): Promise<void>;
    /**
     * Broadcast message to all connected agents
     */
    broadcastMessage(message: Omit<AgentMessage, 'to'>): Promise<void>;
    /**
     * Get messages for a specific agent
     */
    getMessages(agentId: string, limit?: number): Promise<AgentMessage[]>;
    /**
     * Publish an event to subscribed agents
     */
    publishEvent(eventType: EventType, data: any, sourceAgent?: string): Promise<void>;
    /**
     * Subscribe to events
     */
    subscribeToEvent(eventType: EventType, agentId: string, callback: (data: any) => void): Promise<void>;
    /**
     * Unsubscribe from events
     */
    unsubscribeFromEvent(eventType: EventType, agentId: string): Promise<void>;
    /**
     * Route message to appropriate destination(s)
     */
    routeMessage(message: AgentMessage): Promise<void>;
    /**
     * Deliver message to specific agent
     */
    deliverMessage(agentId: string, message: AgentMessage): Promise<boolean>;
    /**
     * Get message history between two agents
     */
    getMessageHistory(agentId1: string, agentId2: string, limit?: number): Promise<AgentMessage[]>;
    /**
     * Search messages by content
     */
    searchMessages(query: string, agentId?: string): Promise<AgentMessage[]>;
    /**
     * Establish connection for an agent
     */
    establishConnection(agentId: string): Promise<void>;
    /**
     * Close connection for an agent
     */
    closeConnection(agentId: string): Promise<void>;
    /**
     * Check if agent is connected
     */
    isConnected(agentId: string): Promise<boolean>;
    /**
     * Queue message for later delivery
     */
    queueMessage(message: AgentMessage): Promise<void>;
    /**
     * Process message queue for all agents
     */
    processMessageQueue(): Promise<void>;
    /**
     * Get queue size for specific agent or total
     */
    getQueueSize(agentId?: string): Promise<number>;
    /**
     * Create notification for agent
     */
    createNotification(agentId: string, title: string, message: string, type?: MessageType): Promise<void>;
    /**
     * Get notifications for agent
     */
    getNotifications(agentId: string, unreadOnly?: boolean): Promise<AgentMessage[]>;
    /**
     * Mark notification as read
     */
    markNotificationAsRead(messageId: string): Promise<void>;
    private validateMessage;
    private isAgentConnected;
    private storeMessageInHistory;
    private processQueuedMessages;
    private startQueueProcessor;
    /**
     * Get event emitter for external listeners
     */
    getEventEmitter(): EventEmitter;
    /**
     * Get connection status for all agents
     */
    getConnectionStatus(): ConnectionStatus;
    /**
     * Update heartbeat for agent
     */
    updateHeartbeat(agentId: string): void;
    /**
     * Clean up disconnected agents
     */
    cleanupDisconnectedAgents(timeoutMs?: number): Promise<void>;
    /**
     * Shutdown the message manager and clean up resources
     */
    shutdown(): void;
}
export {};

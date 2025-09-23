/**
 * MessageManager - Core message system implementation
 * Handles agent-to-agent communication, event publishing/subscribing, and message routing
 */

import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import { IMessageManager } from '../core/interfaces/IMessageManager';
import { AgentMessage, EventType, MessageType } from '../types/message.types';

interface EventSubscription {
  agentId: string;
  callback: (data: any) => void;
}

interface MessageQueue {
  [agentId: string]: AgentMessage[];
}

interface ConnectionStatus {
  [agentId: string]: {
    connected: boolean;
    lastHeartbeat: Date;
    connectionId: string;
  };
}

export class MessageManager implements IMessageManager {
  private eventEmitter: EventEmitter;
  private eventSubscriptions: Map<EventType, EventSubscription[]>;
  private messageQueue: MessageQueue;
  private messageHistory: Map<string, AgentMessage[]>;
  private connections: ConnectionStatus;
  private notifications: Map<string, AgentMessage[]>;
  private readonly maxHistorySize: number = 1000;
  private readonly maxQueueSize: number = 100;
  private queueProcessorInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.eventEmitter = new EventEmitter();
    this.eventSubscriptions = new Map();
    this.messageQueue = {};
    this.messageHistory = new Map();
    this.connections = {};
    this.notifications = new Map();
    
    // Set max listeners to prevent memory leak warnings
    this.eventEmitter.setMaxListeners(1000);
    
    // Start message queue processing
    this.startQueueProcessor();
  }

  /**
   * Send a message to specific agent(s)
   */
  async sendMessage(message: AgentMessage): Promise<void> {
    try {
      // Validate message
      this.validateMessage(message);
      
      // Add timestamp if not present
      if (!message.timestamp) {
        message.timestamp = new Date();
      }
      
      // Store in history first
      this.storeMessageInHistory(message);
      
      // Route the message
      await this.routeMessage(message);
      
    } catch (error) {
      throw new Error(`Failed to send message: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Broadcast message to all connected agents
   */
  async broadcastMessage(message: Omit<AgentMessage, 'to'>): Promise<void> {
    const connectedAgents = Object.keys(this.connections).filter(
      agentId => this.connections[agentId].connected
    );
    
    const broadcastMessage: AgentMessage = {
      ...message,
      to: connectedAgents,
      id: message.id || uuidv4(),
      timestamp: message.timestamp || new Date()
    };
    
    await this.sendMessage(broadcastMessage);
  }

  /**
   * Get messages for a specific agent
   */
  async getMessages(agentId: string, limit: number = 50): Promise<AgentMessage[]> {
    const messages = this.messageHistory.get(agentId) || [];
    return messages.slice(-limit);
  }

  /**
   * Publish an event to subscribed agents
   */
  async publishEvent(eventType: EventType, data: any, sourceAgent?: string): Promise<void> {
    const subscriptions = this.eventSubscriptions.get(eventType) || [];
    
    // Create event message
    const eventMessage: AgentMessage = {
      id: uuidv4(),
      from: sourceAgent || 'system',
      to: subscriptions.map(sub => sub.agentId),
      type: MessageType.SYSTEM,
      content: {
        eventType,
        data,
        timestamp: new Date()
      },
      timestamp: new Date(),
      requiresResponse: false
    };
    
    // Notify subscribers
    for (const subscription of subscriptions) {
      try {
        subscription.callback(data);
      } catch (error) {
        console.error(`Error in event callback for agent ${subscription.agentId}:`, error);
      }
    }
    
    // Also send as message if there are subscribers
    if (subscriptions.length > 0) {
      await this.sendMessage(eventMessage);
    }
    
    // Emit internal event
    this.eventEmitter.emit(eventType, data);
  }

  /**
   * Subscribe to events
   */
  async subscribeToEvent(eventType: EventType, agentId: string, callback: (data: any) => void): Promise<void> {
    if (!this.eventSubscriptions.has(eventType)) {
      this.eventSubscriptions.set(eventType, []);
    }
    
    const subscriptions = this.eventSubscriptions.get(eventType)!;
    
    // Remove existing subscription for this agent
    const existingIndex = subscriptions.findIndex(sub => sub.agentId === agentId);
    if (existingIndex !== -1) {
      subscriptions.splice(existingIndex, 1);
    }
    
    // Add new subscription
    subscriptions.push({ agentId, callback });
  }

  /**
   * Unsubscribe from events
   */
  async unsubscribeFromEvent(eventType: EventType, agentId: string): Promise<void> {
    const subscriptions = this.eventSubscriptions.get(eventType);
    if (!subscriptions) return;
    
    const index = subscriptions.findIndex(sub => sub.agentId === agentId);
    if (index !== -1) {
      subscriptions.splice(index, 1);
    }
  }

  /**
   * Route message to appropriate destination(s)
   */
  async routeMessage(message: AgentMessage): Promise<void> {
    const recipients = Array.isArray(message.to) ? message.to : [message.to];
    
    for (const recipient of recipients) {
      const delivered = await this.deliverMessage(recipient, message);
      
      if (!delivered) {
        // Queue message if delivery failed
        await this.queueMessage({
          ...message,
          to: recipient
        });
      }
    }
  }

  /**
   * Deliver message to specific agent
   */
  async deliverMessage(agentId: string, message: AgentMessage): Promise<boolean> {
    try {
      // Check if agent is connected
      if (!this.isAgentConnected(agentId)) {
        return false;
      }
      
      // Emit message event for the specific agent
      this.eventEmitter.emit(`message:${agentId}`, message);
      
      return true;
    } catch (error) {
      console.error(`Failed to deliver message to agent ${agentId}:`, error);
      return false;
    }
  }

  /**
   * Get message history between two agents
   */
  async getMessageHistory(agentId1: string, agentId2: string, limit: number = 50): Promise<AgentMessage[]> {
    const messages1 = this.messageHistory.get(agentId1) || [];
    const messages2 = this.messageHistory.get(agentId2) || [];
    
    // Combine and filter messages between the two agents, removing duplicates by ID
    const messageMap = new Map<string, AgentMessage>();
    
    [...messages1, ...messages2]
      .filter(msg => 
        (msg.from === agentId1 && (msg.to === agentId2 || (Array.isArray(msg.to) && msg.to.includes(agentId2)))) ||
        (msg.from === agentId2 && (msg.to === agentId1 || (Array.isArray(msg.to) && msg.to.includes(agentId1))))
      )
      .forEach(msg => messageMap.set(msg.id, msg));
    
    const uniqueMessages = Array.from(messageMap.values())
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
      .slice(-limit);
    
    return uniqueMessages;
  }

  /**
   * Search messages by content
   */
  async searchMessages(query: string, agentId?: string): Promise<AgentMessage[]> {
    const searchResults = new Map<string, AgentMessage>();
    const searchTerm = query.toLowerCase();
    
    const messagesToSearch = agentId 
      ? [this.messageHistory.get(agentId) || []]
      : Array.from(this.messageHistory.values());
    
    for (const messages of messagesToSearch) {
      for (const message of messages) {
        const contentStr = typeof message.content === 'string' 
          ? message.content 
          : JSON.stringify(message.content);
        
        if (contentStr.toLowerCase().includes(searchTerm)) {
          searchResults.set(message.id, message);
        }
      }
    }
    
    return Array.from(searchResults.values())
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Establish connection for an agent
   */
  async establishConnection(agentId: string): Promise<void> {
    this.connections[agentId] = {
      connected: true,
      lastHeartbeat: new Date(),
      connectionId: uuidv4()
    };
    
    // Process any queued messages for this agent
    await this.processQueuedMessages(agentId);
    
    // Publish connection event
    await this.publishEvent(EventType.AGENT_CREATED, { agentId });
  }

  /**
   * Close connection for an agent
   */
  async closeConnection(agentId: string): Promise<void> {
    if (this.connections[agentId]) {
      this.connections[agentId].connected = false;
    }
    
    // Unsubscribe from all events
    for (const [eventType] of this.eventSubscriptions) {
      await this.unsubscribeFromEvent(eventType, agentId);
    }
    
    // Publish disconnection event
    await this.publishEvent(EventType.AGENT_DESTROYED, { agentId });
  }

  /**
   * Check if agent is connected
   */
  async isConnected(agentId: string): Promise<boolean> {
    return this.isAgentConnected(agentId);
  }

  /**
   * Queue message for later delivery
   */
  async queueMessage(message: AgentMessage): Promise<void> {
    const recipient = Array.isArray(message.to) ? message.to[0] : message.to;
    
    if (!this.messageQueue[recipient]) {
      this.messageQueue[recipient] = [];
    }
    
    const queue = this.messageQueue[recipient];
    
    // Check queue size limit
    if (queue.length >= this.maxQueueSize) {
      // Remove oldest message
      queue.shift();
    }
    
    queue.push(message);
  }

  /**
   * Process message queue for all agents
   */
  async processMessageQueue(): Promise<void> {
    for (const agentId of Object.keys(this.messageQueue)) {
      await this.processQueuedMessages(agentId);
    }
  }

  /**
   * Get queue size for specific agent or total
   */
  async getQueueSize(agentId?: string): Promise<number> {
    if (agentId) {
      return (this.messageQueue[agentId] || []).length;
    }
    
    return Object.values(this.messageQueue)
      .reduce((total, queue) => total + queue.length, 0);
  }

  /**
   * Create notification for agent
   */
  async createNotification(agentId: string, title: string, message: string, type: MessageType = MessageType.INFO): Promise<void> {
    const notification: AgentMessage = {
      id: uuidv4(),
      from: 'system',
      to: agentId,
      type,
      content: {
        title,
        message,
        isNotification: true
      },
      timestamp: new Date(),
      requiresResponse: false
    };
    
    if (!this.notifications.has(agentId)) {
      this.notifications.set(agentId, []);
    }
    
    this.notifications.get(agentId)!.push(notification);
    
    // Also send as regular message
    await this.sendMessage(notification);
  }

  /**
   * Get notifications for agent
   */
  async getNotifications(agentId: string, unreadOnly: boolean = false): Promise<AgentMessage[]> {
    const notifications = this.notifications.get(agentId) || [];
    
    if (unreadOnly) {
      return notifications.filter(notif => 
        !notif.content.read
      );
    }
    
    return notifications;
  }

  /**
   * Mark notification as read
   */
  async markNotificationAsRead(messageId: string): Promise<void> {
    for (const notifications of this.notifications.values()) {
      const notification = notifications.find(notif => notif.id === messageId);
      if (notification && notification.content) {
        notification.content.read = true;
        break;
      }
    }
  }

  // Private helper methods

  private validateMessage(message: AgentMessage): void {
    if (!message.id) {
      throw new Error('Message ID is required');
    }
    if (!message.from) {
      throw new Error('Message sender is required');
    }
    if (!message.to) {
      throw new Error('Message recipient is required');
    }
    if (!Object.values(MessageType).includes(message.type)) {
      throw new Error('Invalid message type');
    }
  }

  private isAgentConnected(agentId: string): boolean {
    const connection = this.connections[agentId];
    return connection && connection.connected;
  }

  private storeMessageInHistory(message: AgentMessage): void {
    // Store in sender's history (only if not already stored)
    if (!this.messageHistory.has(message.from)) {
      this.messageHistory.set(message.from, []);
    }
    const senderHistory = this.messageHistory.get(message.from)!;
    if (!senderHistory.some(msg => msg.id === message.id)) {
      senderHistory.push(message);
    }
    
    // Store in recipients' history (only if not already stored)
    const recipients = Array.isArray(message.to) ? message.to : [message.to];
    for (const recipient of recipients) {
      if (!this.messageHistory.has(recipient)) {
        this.messageHistory.set(recipient, []);
      }
      const recipientHistory = this.messageHistory.get(recipient)!;
      if (!recipientHistory.some(msg => msg.id === message.id)) {
        recipientHistory.push(message);
      }
    }
  }

  private async processQueuedMessages(agentId: string): Promise<void> {
    const queue = this.messageQueue[agentId];
    if (!queue || queue.length === 0) return;
    
    const messagesToProcess = [...queue];
    this.messageQueue[agentId] = [];
    
    for (const message of messagesToProcess) {
      const delivered = await this.deliverMessage(agentId, message);
      if (!delivered) {
        // Re-queue if still can't deliver
        await this.queueMessage(message);
      } else {
        // Store in history when successfully delivered from queue
        this.storeMessageInHistory(message);
      }
    }
  }

  private startQueueProcessor(): void {
    // Process queue every 5 seconds
    this.queueProcessorInterval = setInterval(async () => {
      try {
        await this.processMessageQueue();
      } catch (error) {
        console.error('Error processing message queue:', error);
      }
    }, 5000);
  }

  /**
   * Get event emitter for external listeners
   */
  getEventEmitter(): EventEmitter {
    return this.eventEmitter;
  }

  /**
   * Get connection status for all agents
   */
  getConnectionStatus(): ConnectionStatus {
    return { ...this.connections };
  }

  /**
   * Update heartbeat for agent
   */
  updateHeartbeat(agentId: string): void {
    if (this.connections[agentId]) {
      this.connections[agentId].lastHeartbeat = new Date();
    }
  }

  /**
   * Clean up disconnected agents
   */
  async cleanupDisconnectedAgents(timeoutMs: number = 30000): Promise<void> {
    const now = new Date();
    const agentsToCleanup: string[] = [];
    
    for (const [agentId, connection] of Object.entries(this.connections)) {
      if (connection.connected && 
          now.getTime() - connection.lastHeartbeat.getTime() > timeoutMs) {
        agentsToCleanup.push(agentId);
      }
    }
    
    for (const agentId of agentsToCleanup) {
      await this.closeConnection(agentId);
    }
  }

  /**
   * Shutdown the message manager and clean up resources
   */
  shutdown(): void {
    // Clear the queue processor interval
    if (this.queueProcessorInterval) {
      clearInterval(this.queueProcessorInterval);
      this.queueProcessorInterval = null;
    }

    // Clear all event listeners
    this.eventEmitter.removeAllListeners();

    // Clear all subscriptions
    this.eventSubscriptions.clear();

    // Clear all data structures
    this.messageQueue = {};
    this.messageHistory.clear();
    this.connections = {};
    this.notifications.clear();
  }
}
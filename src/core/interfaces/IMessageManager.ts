/**
 * Message Manager interface definition
 */

import { AgentMessage, EventType, MessageType } from '../../types/message.types';

export interface IMessageManager {
  // Message sending and receiving
  sendMessage(message: AgentMessage): Promise<void>;
  broadcastMessage(message: Omit<AgentMessage, 'to'>): Promise<void>;
  getMessages(agentId: string, limit?: number): Promise<AgentMessage[]>;
  
  // Event system
  publishEvent(eventType: EventType, data: any, sourceAgent?: string): Promise<void>;
  subscribeToEvent(eventType: EventType, agentId: string, callback: (data: any) => void): Promise<void>;
  unsubscribeFromEvent(eventType: EventType, agentId: string): Promise<void>;
  
  // Message routing and delivery
  routeMessage(message: AgentMessage): Promise<void>;
  deliverMessage(agentId: string, message: AgentMessage): Promise<boolean>;
  
  // Message history and search
  getMessageHistory(agentId1: string, agentId2: string, limit?: number): Promise<AgentMessage[]>;
  searchMessages(query: string, agentId?: string): Promise<AgentMessage[]>;
  
  // Real-time communication
  establishConnection(agentId: string): Promise<void>;
  closeConnection(agentId: string): Promise<void>;
  isConnected(agentId: string): Promise<boolean>;
  
  // Message queuing and reliability
  queueMessage(message: AgentMessage): Promise<void>;
  processMessageQueue(): Promise<void>;
  getQueueSize(agentId?: string): Promise<number>;
  
  // Notification system
  createNotification(agentId: string, title: string, message: string, type?: MessageType): Promise<void>;
  getNotifications(agentId: string, unreadOnly?: boolean): Promise<AgentMessage[]>;
  markNotificationAsRead(messageId: string): Promise<void>;
  
  // Additional methods for real-time sync
  updateHeartbeat(agentId: string): void;
  getEventEmitter(): any; // EventEmitter type
}
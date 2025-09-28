/**
 * Real-time Event Service
 * Handles real-time status synchronization and event notifications
 */

import { EventEmitter } from 'eventemitter3';
import { Agent, AgentStatus } from '../../types/agent.types';
import { AgentMessage, CollaborationSession, EventType } from '../../types/message.types';

export interface SystemEvent {
  id: string;
  type: EventType;
  timestamp: Date;
  source: string;
  data: any;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

export interface RealtimeMetrics {
  agentCount: number;
  activeAgents: number;
  messagesPerSecond: number;
  activeSessions: number;
  systemLoad: number;
  lastUpdate: Date;
}

class RealtimeEventService extends EventEmitter {
  private isConnected: boolean = false;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectInterval: number = 5000; // 5 seconds
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private metricsInterval: NodeJS.Timeout | null = null;
  private eventQueue: SystemEvent[] = [];
  private subscribers: Map<string, Set<(event: SystemEvent) => void>> = new Map();

  constructor() {
    super();
    this.setupEventHandlers();
  }

  /**
   * Initialize the real-time service
   */
  public async initialize(): Promise<void> {
    try {
      await this.connect();
      this.startHeartbeat();
      this.startMetricsCollection();
      console.log('RealtimeEventService initialized successfully');
    } catch (error) {
      console.error('Failed to initialize RealtimeEventService:', error);
      throw error;
    }
  }

  /**
   * Connect to the real-time event system
   */
  private async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        // In a real implementation, this would establish WebSocket connection
        // For now, we simulate the connection
        setTimeout(() => {
          this.isConnected = true;
          this.reconnectAttempts = 0;
          this.emit('connected');
          resolve();
        }, 100);
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Disconnect from the real-time event system
   */
  public async disconnect(): Promise<void> {
    this.isConnected = false;
    
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
    
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
      this.metricsInterval = null;
    }
    
    this.emit('disconnected');
  }

  /**
   * Subscribe to specific event types
   */
  public subscribe(eventType: EventType, callback: (event: SystemEvent) => void): () => void {
    if (!this.subscribers.has(eventType)) {
      this.subscribers.set(eventType, new Set());
    }
    
    this.subscribers.get(eventType)!.add(callback);
    
    // Return unsubscribe function
    return () => {
      const callbacks = this.subscribers.get(eventType);
      if (callbacks) {
        callbacks.delete(callback);
        if (callbacks.size === 0) {
          this.subscribers.delete(eventType);
        }
      }
    };
  }

  /**
   * Publish an event to subscribers
   */
  public publishEvent(event: Omit<SystemEvent, 'id' | 'timestamp'>): void {
    const fullEvent: SystemEvent = {
      id: `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      ...event
    };

    // Add to event queue
    this.eventQueue.push(fullEvent);
    
    // Keep only last 1000 events
    if (this.eventQueue.length > 1000) {
      this.eventQueue = this.eventQueue.slice(-1000);
    }

    // Notify subscribers
    const subscribers = this.subscribers.get(event.type);
    if (subscribers) {
      subscribers.forEach(callback => {
        try {
          callback(fullEvent);
        } catch (error) {
          console.error('Error in event subscriber:', error);
        }
      });
    }

    // Emit general event
    this.emit('event', fullEvent);
  }

  /**
   * Sync agent status changes
   */
  public syncAgentStatus(agentId: string, status: AgentStatus, metadata?: any): void {
    this.publishEvent({
      type: EventType.AGENT_STATUS_CHANGED,
      source: agentId,
      data: { agentId, status, metadata },
      priority: status === AgentStatus.ERROR ? 'high' : 'medium'
    });
  }

  /**
   * Sync task assignment
   */
  public syncTaskAssignment(agentId: string, taskId: string, taskData?: any): void {
    this.publishEvent({
      type: EventType.TASK_ASSIGNED,
      source: agentId,
      data: { agentId, taskId, taskData },
      priority: 'medium'
    });
  }

  /**
   * Sync task completion
   */
  public syncTaskCompletion(agentId: string, taskId: string, success: boolean, result?: any): void {
    this.publishEvent({
      type: EventType.TASK_COMPLETED,
      source: agentId,
      data: { agentId, taskId, success, result },
      priority: success ? 'low' : 'high'
    });
  }

  /**
   * Sync file lock status
   */
  public syncFileLock(filePath: string, agentId: string, locked: boolean): void {
    this.publishEvent({
      type: locked ? EventType.FILE_LOCKED : EventType.FILE_UNLOCKED,
      source: agentId,
      data: { filePath, agentId, locked },
      priority: 'medium'
    });
  }

  /**
   * Sync collaboration session changes
   */
  public syncCollaborationSession(session: CollaborationSession, action: 'started' | 'ended'): void {
    this.publishEvent({
      type: action === 'started' ? EventType.COLLABORATION_STARTED : EventType.COLLABORATION_ENDED,
      source: 'system',
      data: { session, action },
      priority: 'medium'
    });
  }

  /**
   * Get recent events
   */
  public getRecentEvents(limit: number = 50, eventType?: EventType): SystemEvent[] {
    let events = [...this.eventQueue];
    
    if (eventType) {
      events = events.filter(e => e.type === eventType);
    }
    
    return events
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  }

  /**
   * Get current system metrics
   */
  public getCurrentMetrics(): RealtimeMetrics {
    // In a real implementation, this would collect actual system metrics
    return {
      agentCount: 0, // Would be populated from actual agent data
      activeAgents: 0,
      messagesPerSecond: 0,
      activeSessions: 0,
      systemLoad: 0,
      lastUpdate: new Date()
    };
  }

  /**
   * Check if service is connected
   */
  public isServiceConnected(): boolean {
    return this.isConnected;
  }

  /**
   * Get connection status
   */
  public getConnectionStatus(): {
    connected: boolean;
    reconnectAttempts: number;
    lastHeartbeat?: Date;
  } {
    return {
      connected: this.isConnected,
      reconnectAttempts: this.reconnectAttempts,
      lastHeartbeat: new Date() // Would track actual heartbeat
    };
  }

  /**
   * Setup internal event handlers
   */
  private setupEventHandlers(): void {
    this.on('connected', () => {
      console.log('RealtimeEventService connected');
    });

    this.on('disconnected', () => {
      console.log('RealtimeEventService disconnected');
      this.attemptReconnect();
    });

    this.on('error', (error) => {
      console.error('RealtimeEventService error:', error);
      this.isConnected = false;
      this.attemptReconnect();
    });
  }

  /**
   * Start heartbeat to maintain connection
   */
  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      if (this.isConnected) {
        // Send heartbeat ping
        this.emit('heartbeat', new Date());
      }
    }, 30000); // Every 30 seconds
  }

  /**
   * Start metrics collection
   */
  private startMetricsCollection(): void {
    this.metricsInterval = setInterval(() => {
      if (this.isConnected) {
        const metrics = this.getCurrentMetrics();
        this.emit('metrics', metrics);
      }
    }, 5000); // Every 5 seconds
  }

  /**
   * Attempt to reconnect after disconnection
   */
  private async attemptReconnect(): Promise<void> {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

    setTimeout(async () => {
      try {
        await this.connect();
      } catch (error) {
        console.error('Reconnection failed:', error);
        this.attemptReconnect();
      }
    }, this.reconnectInterval * this.reconnectAttempts);
  }
}

// Create singleton instance
export const realtimeEventService = new RealtimeEventService();

// Export types and service
export { RealtimeEventService };
export default realtimeEventService;
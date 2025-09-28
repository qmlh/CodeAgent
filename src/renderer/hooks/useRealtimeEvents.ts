/**
 * React Hook for Real-time Events
 * Provides easy integration with the RealtimeEventService
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { useAppDispatch } from './redux';
import { 
  updateAgentStatus, 
  addAgentMessage, 
  startCollaborationSession,
  endCollaborationSession,
  addAgentLog
} from '../store/slices/agentSlice';
import realtimeEventService, { SystemEvent, RealtimeMetrics } from '../services/RealtimeEventService';
import { EventType } from '../../types/message.types';
import { AgentStatus } from '../../types/agent.types';

export interface UseRealtimeEventsOptions {
  autoConnect?: boolean;
  subscribeToAll?: boolean;
  eventTypes?: EventType[];
}

export interface RealtimeEventHook {
  isConnected: boolean;
  metrics: RealtimeMetrics | null;
  recentEvents: SystemEvent[];
  connectionStatus: {
    connected: boolean;
    reconnectAttempts: number;
    lastHeartbeat?: Date;
  };
  subscribe: (eventType: EventType, callback: (event: SystemEvent) => void) => () => void;
  publishEvent: (event: Omit<SystemEvent, 'id' | 'timestamp'>) => void;
  syncAgentStatus: (agentId: string, status: AgentStatus, metadata?: any) => void;
  syncTaskAssignment: (agentId: string, taskId: string, taskData?: any) => void;
  syncTaskCompletion: (agentId: string, taskId: string, success: boolean, result?: any) => void;
  syncFileLock: (filePath: string, agentId: string, locked: boolean) => void;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
}

export const useRealtimeEvents = (options: UseRealtimeEventsOptions = {}): RealtimeEventHook => {
  const {
    autoConnect = true,
    subscribeToAll = false,
    eventTypes = []
  } = options;

  const dispatch = useAppDispatch();
  const [isConnected, setIsConnected] = useState(false);
  const [metrics, setMetrics] = useState<RealtimeMetrics | null>(null);
  const [recentEvents, setRecentEvents] = useState<SystemEvent[]>([]);
  const [connectionStatus, setConnectionStatus] = useState({
    connected: false,
    reconnectAttempts: 0
  });

  const subscriptionsRef = useRef<(() => void)[]>([]);

  // Handle connection status changes
  useEffect(() => {
    const handleConnected = () => {
      setIsConnected(true);
      setConnectionStatus(realtimeEventService.getConnectionStatus());
    };

    const handleDisconnected = () => {
      setIsConnected(false);
      setConnectionStatus(realtimeEventService.getConnectionStatus());
    };

    const handleMetrics = (newMetrics: RealtimeMetrics) => {
      setMetrics(newMetrics);
    };

    const handleEvent = (event: SystemEvent) => {
      setRecentEvents(prev => [event, ...prev.slice(0, 49)]); // Keep last 50 events
    };

    realtimeEventService.on('connected', handleConnected);
    realtimeEventService.on('disconnected', handleDisconnected);
    realtimeEventService.on('metrics', handleMetrics);
    realtimeEventService.on('event', handleEvent);

    return () => {
      realtimeEventService.off('connected', handleConnected);
      realtimeEventService.off('disconnected', handleDisconnected);
      realtimeEventService.off('metrics', handleMetrics);
      realtimeEventService.off('event', handleEvent);
    };
  }, []);

  // Auto-connect on mount
  useEffect(() => {
    if (autoConnect && !realtimeEventService.isServiceConnected()) {
      realtimeEventService.initialize().catch(console.error);
    }

    return () => {
      // Cleanup subscriptions
      subscriptionsRef.current.forEach(unsubscribe => unsubscribe());
      subscriptionsRef.current = [];
    };
  }, [autoConnect]);

  // Subscribe to specific event types
  useEffect(() => {
    if (subscribeToAll || eventTypes.length > 0) {
      const targetEventTypes = subscribeToAll ? 
        Object.values(EventType) : 
        eventTypes;

      targetEventTypes.forEach(eventType => {
        const unsubscribe = realtimeEventService.subscribe(eventType, (event) => {
          handleSystemEvent(event);
        });
        subscriptionsRef.current.push(unsubscribe);
      });
    }
  }, [subscribeToAll, eventTypes]);

  // Handle system events and update Redux store
  const handleSystemEvent = useCallback((event: SystemEvent) => {
    switch (event.type) {
      case EventType.AGENT_STATUS_CHANGED:
        const { agentId, status, metadata } = event.data;
        dispatch(updateAgentStatus({ agentId, status }));
        
        // Add log entry
        dispatch(addAgentLog({
          agentId,
          level: status === AgentStatus.ERROR ? 'error' : 'info',
          message: `Status changed to ${status}${metadata ? `: ${JSON.stringify(metadata)}` : ''}`
        }));
        break;

      case EventType.TASK_ASSIGNED:
        const { agentId: taskAgentId, taskId } = event.data;
        dispatch(addAgentLog({
          agentId: taskAgentId,
          level: 'info',
          message: `Task assigned: ${taskId}`
        }));
        break;

      case EventType.TASK_COMPLETED:
        const { agentId: completedAgentId, taskId: completedTaskId, success } = event.data;
        dispatch(addAgentLog({
          agentId: completedAgentId,
          level: success ? 'info' : 'warn',
          message: `Task ${success ? 'completed' : 'failed'}: ${completedTaskId}`
        }));
        break;

      case EventType.FILE_LOCKED:
      case EventType.FILE_UNLOCKED:
        const { filePath, agentId: fileAgentId, locked } = event.data;
        dispatch(addAgentLog({
          agentId: fileAgentId,
          level: 'info',
          message: `File ${locked ? 'locked' : 'unlocked'}: ${filePath}`
        }));
        break;

      case EventType.COLLABORATION_STARTED:
        const { session: startedSession } = event.data;
        dispatch(startCollaborationSession({
          participants: startedSession.participants,
          sharedFiles: startedSession.sharedFiles
        }));
        break;

      case EventType.COLLABORATION_ENDED:
        const { session: endedSession } = event.data;
        dispatch(endCollaborationSession(endedSession.id));
        break;

      default:
        console.log('Unhandled event type:', event.type, event);
    }
  }, [dispatch]);

  // Wrapper functions for service methods
  const subscribe = useCallback((eventType: EventType, callback: (event: SystemEvent) => void) => {
    const unsubscribe = realtimeEventService.subscribe(eventType, callback);
    subscriptionsRef.current.push(unsubscribe);
    return unsubscribe;
  }, []);

  const publishEvent = useCallback((event: Omit<SystemEvent, 'id' | 'timestamp'>) => {
    realtimeEventService.publishEvent(event);
  }, []);

  const syncAgentStatus = useCallback((agentId: string, status: AgentStatus, metadata?: any) => {
    realtimeEventService.syncAgentStatus(agentId, status, metadata);
  }, []);

  const syncTaskAssignment = useCallback((agentId: string, taskId: string, taskData?: any) => {
    realtimeEventService.syncTaskAssignment(agentId, taskId, taskData);
  }, []);

  const syncTaskCompletion = useCallback((agentId: string, taskId: string, success: boolean, result?: any) => {
    realtimeEventService.syncTaskCompletion(agentId, taskId, success, result);
  }, []);

  const syncFileLock = useCallback((filePath: string, agentId: string, locked: boolean) => {
    realtimeEventService.syncFileLock(filePath, agentId, locked);
  }, []);

  const connect = useCallback(async () => {
    await realtimeEventService.initialize();
  }, []);

  const disconnect = useCallback(async () => {
    await realtimeEventService.disconnect();
  }, []);

  return {
    isConnected,
    metrics,
    recentEvents,
    connectionStatus,
    subscribe,
    publishEvent,
    syncAgentStatus,
    syncTaskAssignment,
    syncTaskCompletion,
    syncFileLock,
    connect,
    disconnect
  };
};

export default useRealtimeEvents;
/**
 * MessageManager unit tests
 */

import { MessageManager } from '../MessageManager';
import { AgentMessage, MessageType, EventType } from '../../types/message.types';

describe('MessageManager', () => {
  let messageManager: MessageManager;
  let mockCallback: jest.Mock;

  beforeEach(() => {
    messageManager = new MessageManager();
    mockCallback = jest.fn();
  });

  afterEach(() => {
    // Shutdown the message manager to clean up timers and resources
    messageManager.shutdown();
    // Clean up any remaining timers
    jest.clearAllTimers();
  });

  describe('Message Sending and Receiving', () => {
    it('should send message successfully', async () => {
      const agentId = 'agent1';
      await messageManager.establishConnection(agentId);

      const message: AgentMessage = {
        id: 'msg1',
        from: 'sender',
        to: agentId,
        type: MessageType.INFO,
        content: 'Hello',
        timestamp: new Date(),
        requiresResponse: false
      };

      await expect(messageManager.sendMessage(message)).resolves.not.toThrow();
    });

    it('should validate message before sending', async () => {
      const invalidMessage = {
        from: 'sender',
        to: 'agent1',
        type: MessageType.INFO,
        content: 'Hello',
        timestamp: new Date(),
        requiresResponse: false
      } as AgentMessage;

      await expect(messageManager.sendMessage(invalidMessage))
        .rejects.toThrow('Message ID is required');
    });

    it('should broadcast message to all connected agents', async () => {
      const agent1 = 'agent1';
      const agent2 = 'agent2';
      
      await messageManager.establishConnection(agent1);
      await messageManager.establishConnection(agent2);

      const broadcastMessage = {
        id: 'broadcast1',
        from: 'system',
        type: MessageType.INFO,
        content: 'Broadcast message',
        timestamp: new Date(),
        requiresResponse: false
      };

      await expect(messageManager.broadcastMessage(broadcastMessage))
        .resolves.not.toThrow();
    });

    it('should retrieve messages for an agent', async () => {
      const agentId = 'agent1';
      await messageManager.establishConnection(agentId);

      const message: AgentMessage = {
        id: 'msg1',
        from: 'sender',
        to: agentId,
        type: MessageType.INFO,
        content: 'Test message',
        timestamp: new Date(),
        requiresResponse: false
      };

      await messageManager.sendMessage(message);
      const messages = await messageManager.getMessages(agentId);
      
      expect(messages).toHaveLength(1);
      expect(messages[0].content).toBe('Test message');
    });

    it('should limit message history size', async () => {
      const agentId = 'agent1';
      await messageManager.establishConnection(agentId);

      const messages = await messageManager.getMessages(agentId, 10);
      expect(messages.length).toBeLessThanOrEqual(10);
    });
  });

  describe('Event System', () => {
    it('should publish and subscribe to events', async () => {
      const agentId = 'agent1';
      const eventData = { test: 'data' };

      await messageManager.subscribeToEvent(EventType.TASK_ASSIGNED, agentId, mockCallback);
      await messageManager.publishEvent(EventType.TASK_ASSIGNED, eventData);

      expect(mockCallback).toHaveBeenCalledWith(eventData);
    });

    it('should unsubscribe from events', async () => {
      const agentId = 'agent1';
      const eventData = { test: 'data' };

      await messageManager.subscribeToEvent(EventType.TASK_ASSIGNED, agentId, mockCallback);
      await messageManager.unsubscribeFromEvent(EventType.TASK_ASSIGNED, agentId);
      await messageManager.publishEvent(EventType.TASK_ASSIGNED, eventData);

      expect(mockCallback).not.toHaveBeenCalled();
    });

    it('should handle multiple subscribers for same event', async () => {
      const agent1 = 'agent1';
      const agent2 = 'agent2';
      const mockCallback2 = jest.fn();
      const eventData = { test: 'data' };

      await messageManager.subscribeToEvent(EventType.TASK_ASSIGNED, agent1, mockCallback);
      await messageManager.subscribeToEvent(EventType.TASK_ASSIGNED, agent2, mockCallback2);
      await messageManager.publishEvent(EventType.TASK_ASSIGNED, eventData);

      expect(mockCallback).toHaveBeenCalledWith(eventData);
      expect(mockCallback2).toHaveBeenCalledWith(eventData);
    });

    it('should replace existing subscription for same agent and event', async () => {
      const agentId = 'agent1';
      const mockCallback2 = jest.fn();
      const eventData = { test: 'data' };

      await messageManager.subscribeToEvent(EventType.TASK_ASSIGNED, agentId, mockCallback);
      await messageManager.subscribeToEvent(EventType.TASK_ASSIGNED, agentId, mockCallback2);
      await messageManager.publishEvent(EventType.TASK_ASSIGNED, eventData);

      expect(mockCallback).not.toHaveBeenCalled();
      expect(mockCallback2).toHaveBeenCalledWith(eventData);
    });
  });

  describe('Message Routing and Delivery', () => {
    it('should route message to single recipient', async () => {
      const agentId = 'agent1';
      await messageManager.establishConnection(agentId);

      const message: AgentMessage = {
        id: 'msg1',
        from: 'sender',
        to: agentId,
        type: MessageType.INFO,
        content: 'Test',
        timestamp: new Date(),
        requiresResponse: false
      };

      await messageManager.sendMessage(message);
      const messages = await messageManager.getMessages(agentId);
      expect(messages).toHaveLength(1);
    });

    it('should route message to multiple recipients', async () => {
      const agent1 = 'agent1';
      const agent2 = 'agent2';
      
      await messageManager.establishConnection(agent1);
      await messageManager.establishConnection(agent2);

      const message: AgentMessage = {
        id: 'msg1',
        from: 'sender',
        to: [agent1, agent2],
        type: MessageType.INFO,
        content: 'Test',
        timestamp: new Date(),
        requiresResponse: false
      };

      await messageManager.sendMessage(message);
      
      const messages1 = await messageManager.getMessages(agent1);
      const messages2 = await messageManager.getMessages(agent2);
      
      expect(messages1).toHaveLength(1);
      expect(messages2).toHaveLength(1);
    });

    it('should return true when delivering to connected agent', async () => {
      const agentId = 'agent1';
      await messageManager.establishConnection(agentId);

      const message: AgentMessage = {
        id: 'msg1',
        from: 'sender',
        to: agentId,
        type: MessageType.INFO,
        content: 'Test',
        timestamp: new Date(),
        requiresResponse: false
      };

      const delivered = await messageManager.deliverMessage(agentId, message);
      expect(delivered).toBe(true);
    });

    it('should return false when delivering to disconnected agent', async () => {
      const agentId = 'agent1';

      const message: AgentMessage = {
        id: 'msg1',
        from: 'sender',
        to: agentId,
        type: MessageType.INFO,
        content: 'Test',
        timestamp: new Date(),
        requiresResponse: false
      };

      const delivered = await messageManager.deliverMessage(agentId, message);
      expect(delivered).toBe(false);
    });
  });

  describe('Message History and Search', () => {
    it('should get message history between two agents', async () => {
      const agent1 = 'agent1';
      const agent2 = 'agent2';
      
      await messageManager.establishConnection(agent1);
      await messageManager.establishConnection(agent2);

      const message1: AgentMessage = {
        id: 'msg1',
        from: agent1,
        to: agent2,
        type: MessageType.INFO,
        content: 'Hello from agent1',
        timestamp: new Date(),
        requiresResponse: false
      };

      const message2: AgentMessage = {
        id: 'msg2',
        from: agent2,
        to: agent1,
        type: MessageType.RESPONSE,
        content: 'Hello from agent2',
        timestamp: new Date(),
        requiresResponse: false
      };

      await messageManager.sendMessage(message1);
      await messageManager.sendMessage(message2);

      const history = await messageManager.getMessageHistory(agent1, agent2);
      expect(history).toHaveLength(2);
      expect(history[0].from).toBe(agent1);
      expect(history[1].from).toBe(agent2);
    });

    it('should search messages by content', async () => {
      const agentId = 'agent1';
      await messageManager.establishConnection(agentId);

      const message: AgentMessage = {
        id: 'msg1',
        from: 'sender',
        to: agentId,
        type: MessageType.INFO,
        content: 'This is a searchable message',
        timestamp: new Date(),
        requiresResponse: false
      };

      await messageManager.sendMessage(message);

      const results = await messageManager.searchMessages('searchable');
      expect(results).toHaveLength(1);
      expect(results[0].content).toContain('searchable');
    });

    it('should search messages for specific agent', async () => {
      const agent1 = 'agent1';
      const agent2 = 'agent2';
      
      await messageManager.establishConnection(agent1);
      await messageManager.establishConnection(agent2);

      const message1: AgentMessage = {
        id: 'msg1',
        from: 'sender',
        to: agent1,
        type: MessageType.INFO,
        content: 'searchable content',
        timestamp: new Date(),
        requiresResponse: false
      };

      const message2: AgentMessage = {
        id: 'msg2',
        from: 'sender',
        to: agent2,
        type: MessageType.INFO,
        content: 'different content',
        timestamp: new Date(),
        requiresResponse: false
      };

      await messageManager.sendMessage(message1);
      await messageManager.sendMessage(message2);

      const results = await messageManager.searchMessages('searchable', agent1);
      expect(results).toHaveLength(1);
      expect(results[0].to).toBe(agent1);
    });
  });

  describe('Connection Management', () => {
    it('should establish connection for agent', async () => {
      const agentId = 'agent1';
      
      await messageManager.establishConnection(agentId);
      const isConnected = await messageManager.isConnected(agentId);
      
      expect(isConnected).toBe(true);
    });

    it('should close connection for agent', async () => {
      const agentId = 'agent1';
      
      await messageManager.establishConnection(agentId);
      await messageManager.closeConnection(agentId);
      const isConnected = await messageManager.isConnected(agentId);
      
      expect(isConnected).toBe(false);
    });

    it('should process queued messages when connection established', async () => {
      const agentId = 'agent1';

      const message: AgentMessage = {
        id: 'msg1',
        from: 'sender',
        to: agentId,
        type: MessageType.INFO,
        content: 'Queued message',
        timestamp: new Date(),
        requiresResponse: false
      };

      // Send message to disconnected agent (should be queued)
      await messageManager.sendMessage(message);
      
      // Establish connection (should process queue)
      await messageManager.establishConnection(agentId);
      
      const messages = await messageManager.getMessages(agentId);
      expect(messages.length).toBeGreaterThan(0);
    });
  });

  describe('Message Queuing', () => {
    it('should queue message for disconnected agent', async () => {
      const agentId = 'agent1';

      const message: AgentMessage = {
        id: 'msg1',
        from: 'sender',
        to: agentId,
        type: MessageType.INFO,
        content: 'Test',
        timestamp: new Date(),
        requiresResponse: false
      };

      await messageManager.queueMessage(message);
      const queueSize = await messageManager.getQueueSize(agentId);
      
      expect(queueSize).toBe(1);
    });

    it('should get total queue size', async () => {
      const agent1 = 'agent1';
      const agent2 = 'agent2';

      const message1: AgentMessage = {
        id: 'msg1',
        from: 'sender',
        to: agent1,
        type: MessageType.INFO,
        content: 'Test1',
        timestamp: new Date(),
        requiresResponse: false
      };

      const message2: AgentMessage = {
        id: 'msg2',
        from: 'sender',
        to: agent2,
        type: MessageType.INFO,
        content: 'Test2',
        timestamp: new Date(),
        requiresResponse: false
      };

      await messageManager.queueMessage(message1);
      await messageManager.queueMessage(message2);
      
      const totalQueueSize = await messageManager.getQueueSize();
      expect(totalQueueSize).toBe(2);
    });

    it('should process message queue', async () => {
      const agentId = 'agent1';

      const message: AgentMessage = {
        id: 'msg1',
        from: 'sender',
        to: agentId,
        type: MessageType.INFO,
        content: 'Test',
        timestamp: new Date(),
        requiresResponse: false
      };

      await messageManager.queueMessage(message);
      await messageManager.establishConnection(agentId);
      await messageManager.processMessageQueue();
      
      const messages = await messageManager.getMessages(agentId);
      expect(messages.length).toBeGreaterThan(0);
    });
  });

  describe('Notification System', () => {
    it('should create notification for agent', async () => {
      const agentId = 'agent1';
      await messageManager.establishConnection(agentId);

      await messageManager.createNotification(
        agentId,
        'Test Title',
        'Test Message',
        MessageType.INFO
      );

      const notifications = await messageManager.getNotifications(agentId);
      expect(notifications).toHaveLength(1);
      expect(notifications[0].content.title).toBe('Test Title');
    });

    it('should get unread notifications only', async () => {
      const agentId = 'agent1';
      await messageManager.establishConnection(agentId);

      await messageManager.createNotification(agentId, 'Title1', 'Message1');
      await messageManager.createNotification(agentId, 'Title2', 'Message2');

      const notifications = await messageManager.getNotifications(agentId);
      const notificationId = notifications[0].id;
      
      await messageManager.markNotificationAsRead(notificationId);
      
      const unreadNotifications = await messageManager.getNotifications(agentId, true);
      expect(unreadNotifications).toHaveLength(1);
      expect(unreadNotifications[0].content.title).toBe('Title2');
    });

    it('should mark notification as read', async () => {
      const agentId = 'agent1';
      await messageManager.establishConnection(agentId);

      await messageManager.createNotification(agentId, 'Title', 'Message');
      
      const notifications = await messageManager.getNotifications(agentId);
      const notificationId = notifications[0].id;
      
      await messageManager.markNotificationAsRead(notificationId);
      
      const updatedNotifications = await messageManager.getNotifications(agentId);
      expect(updatedNotifications[0].content.read).toBe(true);
    });
  });

  describe('Helper Methods', () => {
    it('should get event emitter', () => {
      const eventEmitter = messageManager.getEventEmitter();
      expect(eventEmitter).toBeDefined();
      expect(typeof eventEmitter.on).toBe('function');
    });

    it('should get connection status', async () => {
      const agentId = 'agent1';
      await messageManager.establishConnection(agentId);
      
      const connectionStatus = messageManager.getConnectionStatus();
      expect(connectionStatus[agentId]).toBeDefined();
      expect(connectionStatus[agentId].connected).toBe(true);
    });

    it('should update heartbeat', async () => {
      const agentId = 'agent1';
      await messageManager.establishConnection(agentId);
      
      const initialStatus = messageManager.getConnectionStatus();
      const initialHeartbeat = initialStatus[agentId].lastHeartbeat;
      
      // Wait a bit and update heartbeat
      await new Promise(resolve => setTimeout(resolve, 10));
      messageManager.updateHeartbeat(agentId);
      
      const updatedStatus = messageManager.getConnectionStatus();
      const updatedHeartbeat = updatedStatus[agentId].lastHeartbeat;
      
      expect(updatedHeartbeat.getTime()).toBeGreaterThan(initialHeartbeat.getTime());
    });

    it('should cleanup disconnected agents', async () => {
      const agentId = 'agent1';
      await messageManager.establishConnection(agentId);
      
      // Simulate old heartbeat
      const connectionStatus = messageManager.getConnectionStatus();
      connectionStatus[agentId].lastHeartbeat = new Date(Date.now() - 60000); // 1 minute ago
      
      await messageManager.cleanupDisconnectedAgents(30000); // 30 second timeout
      
      const isConnected = await messageManager.isConnected(agentId);
      expect(isConnected).toBe(false);
    });

    it('should shutdown properly and clean up resources', () => {
      const eventEmitter = messageManager.getEventEmitter();
      
      // Add some data to verify cleanup
      messageManager.establishConnection('test-agent');
      
      // Shutdown should clean up everything
      messageManager.shutdown();
      
      // Verify cleanup
      const connectionStatus = messageManager.getConnectionStatus();
      expect(Object.keys(connectionStatus)).toHaveLength(0);
      
      // Event emitter should have no listeners
      expect(eventEmitter.listenerCount('test-event')).toBe(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid message type', async () => {
      const message = {
        id: 'msg1',
        from: 'sender',
        to: 'agent1',
        type: 'invalid_type' as MessageType,
        content: 'Test',
        timestamp: new Date(),
        requiresResponse: false
      };

      await expect(messageManager.sendMessage(message))
        .rejects.toThrow('Invalid message type');
    });

    it('should handle missing message fields', async () => {
      const message = {
        from: 'sender',
        to: 'agent1',
        type: MessageType.INFO,
        content: 'Test',
        timestamp: new Date(),
        requiresResponse: false
      } as AgentMessage;

      await expect(messageManager.sendMessage(message))
        .rejects.toThrow('Message ID is required');
    });

    it('should handle callback errors in event subscriptions', async () => {
      const agentId = 'agent1';
      const errorCallback = jest.fn(() => {
        throw new Error('Callback error');
      });

      // Mock console.error to verify error handling
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      await messageManager.subscribeToEvent(EventType.TASK_ASSIGNED, agentId, errorCallback);
      await messageManager.publishEvent(EventType.TASK_ASSIGNED, { test: 'data' });

      expect(errorCallback).toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Error in event callback'),
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });
  });
});
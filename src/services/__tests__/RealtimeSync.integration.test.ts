/**
 * RealtimeSync integration tests
 */

import { RealtimeSync } from '../RealtimeSync';
import { MessageManager } from '../MessageManager';
import { AgentStatus } from '../../types/agent.types';
import { TaskStatus } from '../../types/task.types';
import { EventType, CollaborationSession } from '../../types/message.types';

describe('RealtimeSync Integration Tests', () => {
  let realtimeSync: RealtimeSync;
  let messageManager: MessageManager;

  beforeEach(() => {
    messageManager = new MessageManager();
    realtimeSync = new RealtimeSync(messageManager, {
      interval: 100, // Fast interval for testing
      timeout: 300,
      maxMissed: 2
    });
  });

  afterEach(() => {
    realtimeSync.shutdown();
    messageManager.shutdown();
  });

  describe('Agent Registration and Status Sync', () => {
    it('should register agent and sync status', async () => {
      const agentId = 'test-agent-1';
      
      await realtimeSync.registerAgent(agentId, {
        status: AgentStatus.IDLE,
        workload: 0
      });

      const agentStates = realtimeSync.getAgentStates();
      expect(agentStates.has(agentId)).toBe(true);
      
      const agentState = agentStates.get(agentId)!;
      expect(agentState.status).toBe(AgentStatus.IDLE);
      expect(agentState.isConnected).toBe(true);
      expect(agentState.workload).toBe(0);
    });

    it('should sync agent status changes across agents', async () => {
      const agent1 = 'agent-1';
      const agent2 = 'agent-2';
      
      await realtimeSync.registerAgent(agent1);
      await realtimeSync.registerAgent(agent2);

      const statusChangePromise = new Promise<void>((resolve) => {
        realtimeSync.once('agentStatusChanged', (agentId, status) => {
          expect(agentId).toBe(agent1);
          expect(status).toBe(AgentStatus.WORKING);
          resolve();
        });
      });

      realtimeSync.syncAgentStatus(agent1, AgentStatus.WORKING, { workload: 5 });

      await statusChangePromise;

      const agentState = realtimeSync.getAgentStates().get(agent1)!;
      expect(agentState.status).toBe(AgentStatus.WORKING);
      expect(agentState.workload).toBe(5);
    });

    it('should unregister agent and clean up', async () => {
      const agentId = 'test-agent';
      
      await realtimeSync.registerAgent(agentId);
      expect(realtimeSync.isAgentConnected(agentId)).toBe(true);

      await realtimeSync.unregisterAgent(agentId);
      expect(realtimeSync.isAgentConnected(agentId)).toBe(false);
      expect(realtimeSync.getAgentStates().has(agentId)).toBe(false);
    });
  });

  describe('Task Progress Sync', () => {
    it('should sync task progress updates', async () => {
      const taskId = 'task-1';
      const agentId = 'agent-1';

      await realtimeSync.registerAgent(agentId);

      const progressChangePromise = new Promise<void>((resolve) => {
        realtimeSync.once('taskProgressChanged', (id, progress, state) => {
          expect(id).toBe(taskId);
          expect(progress).toBe(50);
          expect(state.status).toBe(TaskStatus.IN_PROGRESS);
          expect(state.assignedAgent).toBe(agentId);
          resolve();
        });
      });

      realtimeSync.syncTaskProgress(taskId, 50, TaskStatus.IN_PROGRESS, agentId);

      await progressChangePromise;

      const taskStates = realtimeSync.getTaskStates();
      expect(taskStates.has(taskId)).toBe(true);
      
      const taskState = taskStates.get(taskId)!;
      expect(taskState.progress).toBe(50);
      expect(taskState.status).toBe(TaskStatus.IN_PROGRESS);
      expect(taskState.assignedAgent).toBe(agentId);
    });

    it('should handle task completion sync', async () => {
      const taskId = 'task-complete';
      
      // Start with in-progress task
      realtimeSync.syncTaskProgress(taskId, 0, TaskStatus.IN_PROGRESS, 'agent-1');
      
      const completionPromise = new Promise<void>((resolve) => {
        realtimeSync.once('taskProgressChanged', (id, progress, state) => {
          if (progress === 100) {
            expect(id).toBe(taskId);
            expect(state.status).toBe(TaskStatus.COMPLETED);
            resolve();
          }
        });
      });

      realtimeSync.syncTaskProgress(taskId, 100, TaskStatus.COMPLETED);

      await completionPromise;

      const taskState = realtimeSync.getTaskStates().get(taskId)!;
      expect(taskState.progress).toBe(100);
      expect(taskState.status).toBe(TaskStatus.COMPLETED);
    });
  });

  describe('File Lock Status Sync', () => {
    it('should sync file lock status', async () => {
      const filePath = '/test/file.ts';
      const agentId = 'agent-1';

      await realtimeSync.registerAgent(agentId);

      const lockChangePromise = new Promise<void>((resolve) => {
        realtimeSync.once('fileStatusChanged', (path, lockStatus, state) => {
          expect(path).toBe(filePath);
          expect(lockStatus.isLocked).toBe(true);
          expect(lockStatus.lockedBy).toBe(agentId);
          expect(state.lockedBy).toBe(agentId);
          resolve();
        });
      });

      realtimeSync.syncFileStatus(filePath, { isLocked: true, lockedBy: agentId });

      await lockChangePromise;

      const fileLockStates = realtimeSync.getFileLockStates();
      expect(fileLockStates.has(filePath)).toBe(true);
      
      const lockState = fileLockStates.get(filePath)!;
      expect(lockState.isLocked).toBe(true);
      expect(lockState.lockedBy).toBe(agentId);
    });

    it('should sync file unlock status', async () => {
      const filePath = '/test/file.ts';
      const agentId = 'agent-1';

      // First lock the file
      realtimeSync.syncFileStatus(filePath, { isLocked: true, lockedBy: agentId });
      expect(realtimeSync.getFileLockStates().has(filePath)).toBe(true);

      const unlockPromise = new Promise<void>((resolve) => {
        realtimeSync.once('fileStatusChanged', (path, lockStatus) => {
          if (!lockStatus.isLocked) {
            expect(path).toBe(filePath);
            expect(lockStatus.isLocked).toBe(false);
            resolve();
          }
        });
      });

      realtimeSync.syncFileStatus(filePath, { isLocked: false });

      await unlockPromise;

      // File should be removed from lock states when unlocked
      expect(realtimeSync.getFileLockStates().has(filePath)).toBe(false);
    });
  });

  describe('Collaboration Session Sync', () => {
    it('should sync collaboration session updates', async () => {
      const sessionId = 'collab-1';
      const session: CollaborationSession = {
        id: sessionId,
        participants: ['agent-1', 'agent-2'],
        sharedFiles: ['/test/file1.ts', '/test/file2.ts'],
        communicationChannel: 'channel-1',
        startTime: new Date(),
        status: 'active'
      };

      const sessionChangePromise = new Promise<void>((resolve) => {
        realtimeSync.once('collaborationSessionChanged', (id, sessionData) => {
          expect(id).toBe(sessionId);
          expect(sessionData.participants).toEqual(['agent-1', 'agent-2']);
          expect(sessionData.status).toBe('active');
          resolve();
        });
      });

      realtimeSync.syncCollaborationSession(sessionId, session);

      await sessionChangePromise;

      const sessions = realtimeSync.getCollaborationSessions();
      expect(sessions.has(sessionId)).toBe(true);
      
      const storedSession = sessions.get(sessionId)!;
      expect(storedSession.participants).toEqual(['agent-1', 'agent-2']);
      expect(storedSession.status).toBe('active');
    });
  });

  describe('Heartbeat Management', () => {
    it('should handle heartbeat updates', async () => {
      const agentId = 'heartbeat-agent';
      
      await realtimeSync.registerAgent(agentId);
      
      const initialState = realtimeSync.getAgentStates().get(agentId)!;
      const initialHeartbeat = initialState.lastHeartbeat;

      // Wait a bit and send heartbeat
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const heartbeatPromise = new Promise<void>((resolve) => {
        realtimeSync.once('heartbeatReceived', (id, timestamp) => {
          expect(id).toBe(agentId);
          expect(timestamp.getTime()).toBeGreaterThan(initialHeartbeat.getTime());
          resolve();
        });
      });

      realtimeSync.sendHeartbeat(agentId);

      await heartbeatPromise;

      const updatedState = realtimeSync.getAgentStates().get(agentId)!;
      expect(updatedState.lastHeartbeat.getTime()).toBeGreaterThan(initialHeartbeat.getTime());
      expect(updatedState.missedHeartbeats).toBe(0);
    });

    it('should detect missed heartbeats and disconnect agents', async () => {
      const agentId = 'timeout-agent';
      
      await realtimeSync.registerAgent(agentId);
      expect(realtimeSync.isAgentConnected(agentId)).toBe(true);

      // Wait for heartbeat timeout
      const disconnectPromise = new Promise<void>((resolve) => {
        realtimeSync.once('agentDisconnected', (id, state) => {
          expect(id).toBe(agentId);
          expect(state.isConnected).toBe(false);
          expect(state.status).toBe(AgentStatus.OFFLINE);
          resolve();
        });
      });

      // Wait longer than timeout period
      await new Promise(resolve => setTimeout(resolve, 400));

      await disconnectPromise;

      expect(realtimeSync.isAgentConnected(agentId)).toBe(false);
    });
  });

  describe('Event Integration', () => {
    it('should handle message manager events', async () => {
      const agentId = 'event-agent';
      
      await realtimeSync.registerAgent(agentId);

      // Simulate agent created event
      await messageManager.publishEvent(EventType.AGENT_CREATED, { agentId });

      // Simulate task assignment event
      const taskId = 'event-task';
      await messageManager.publishEvent(EventType.TASK_ASSIGNED, { taskId, agentId });

      // Wait for events to be processed
      await new Promise(resolve => setTimeout(resolve, 50));

      const taskStates = realtimeSync.getTaskStates();
      expect(taskStates.has(taskId)).toBe(true);
      
      const taskState = taskStates.get(taskId)!;
      expect(taskState.assignedAgent).toBe(agentId);
      expect(taskState.status).toBe(TaskStatus.IN_PROGRESS);
    });

    it('should handle file lock events', async () => {
      const filePath = '/event/file.ts';
      const agentId = 'file-agent';

      await realtimeSync.registerAgent(agentId);

      // Simulate file locked event
      await messageManager.publishEvent(EventType.FILE_LOCKED, { filePath, agentId });

      // Wait for event to be processed
      await new Promise(resolve => setTimeout(resolve, 50));

      const fileLockStates = realtimeSync.getFileLockStates();
      expect(fileLockStates.has(filePath)).toBe(true);
      
      const lockState = fileLockStates.get(filePath)!;
      expect(lockState.isLocked).toBe(true);
      expect(lockState.lockedBy).toBe(agentId);
    });
  });

  describe('Force Sync', () => {
    it('should force sync all states to specific agent', async () => {
      const agent1 = 'sync-agent-1';
      const agent2 = 'sync-agent-2';
      
      await realtimeSync.registerAgent(agent1);
      await realtimeSync.registerAgent(agent2);

      // Add some state data
      realtimeSync.syncTaskProgress('task-1', 50, TaskStatus.IN_PROGRESS, agent1);
      realtimeSync.syncFileStatus('/test/file.ts', { isLocked: true, lockedBy: agent1 });

      // Mock message sending to verify sync message
      const sendMessageSpy = jest.spyOn(messageManager, 'sendMessage');

      await realtimeSync.forceSyncToAgent(agent2);

      expect(sendMessageSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          to: agent2,
          content: expect.objectContaining({
            type: 'full-sync',
            data: expect.objectContaining({
              agents: expect.any(Array),
              tasks: expect.any(Array),
              files: expect.any(Array),
              collaborations: expect.any(Array)
            })
          })
        })
      );

      sendMessageSpy.mockRestore();
    });

    it('should throw error when force syncing to disconnected agent', async () => {
      const agentId = 'disconnected-agent';
      
      await expect(realtimeSync.forceSyncToAgent(agentId))
        .rejects.toThrow(`Agent ${agentId} is not connected`);
    });
  });

  describe('State Retrieval', () => {
    it('should get connected agents list', async () => {
      const agent1 = 'connected-1';
      const agent2 = 'connected-2';
      const agent3 = 'disconnected-3';

      await realtimeSync.registerAgent(agent1);
      await realtimeSync.registerAgent(agent2);
      await realtimeSync.registerAgent(agent3);

      // Disconnect one agent
      await realtimeSync.unregisterAgent(agent3);

      const connectedAgents = realtimeSync.getConnectedAgents();
      expect(connectedAgents).toHaveLength(2);
      expect(connectedAgents).toContain(agent1);
      expect(connectedAgents).toContain(agent2);
      expect(connectedAgents).not.toContain(agent3);
    });

    it('should provide immutable state copies', () => {
      const agentId = 'test-agent';
      realtimeSync.syncAgentStatus(agentId, AgentStatus.WORKING);

      const agentStates1 = realtimeSync.getAgentStates();
      const agentStates2 = realtimeSync.getAgentStates();

      // Should be different instances (copies)
      expect(agentStates1).not.toBe(agentStates2);
      
      // But with same content
      expect(agentStates1.get(agentId)?.status).toBe(AgentStatus.WORKING);
      expect(agentStates2.get(agentId)?.status).toBe(AgentStatus.WORKING);
    });
  });

  describe('Cleanup and Shutdown', () => {
    it('should clean up all resources on shutdown', () => {
      const agentId = 'cleanup-agent';
      realtimeSync.syncAgentStatus(agentId, AgentStatus.WORKING);
      realtimeSync.syncTaskProgress('task-1', 50);
      realtimeSync.syncFileStatus('/file.ts', { isLocked: true, lockedBy: agentId });

      expect(realtimeSync.getAgentStates().size).toBeGreaterThan(0);
      expect(realtimeSync.getTaskStates().size).toBeGreaterThan(0);
      expect(realtimeSync.getFileLockStates().size).toBeGreaterThan(0);

      realtimeSync.shutdown();

      expect(realtimeSync.getAgentStates().size).toBe(0);
      expect(realtimeSync.getTaskStates().size).toBe(0);
      expect(realtimeSync.getFileLockStates().size).toBe(0);
      expect(realtimeSync.getCollaborationSessions().size).toBe(0);
    });
  });
});
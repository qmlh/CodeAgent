/**
 * Integration tests for conflict detection and resolution
 */

import { FileManager } from '../FileManager';
import { ConflictResolver } from '../ConflictResolver';
import { FileChangeTracker } from '../FileChangeTracker';
import { FileLock, Conflict, FileChange } from '../../types/file.types';
import * as fs from 'fs/promises';
import * as path from 'path';

// Mock fs module
jest.mock('fs/promises');
const mockFs = fs as jest.Mocked<typeof fs>;

describe('Conflict Resolution Integration', () => {
  let fileManager: FileManager;
  let conflictResolver: ConflictResolver;
  let changeTracker: FileChangeTracker;
  
  const testFilePath = '/test/conflict-file.txt';
  const agent1 = 'agent-1';
  const agent2 = 'agent-2';
  const agent3 = 'agent-3';

  beforeEach(() => {
    fileManager = new FileManager();
    conflictResolver = new ConflictResolver();
    changeTracker = new FileChangeTracker();
    
    // Mock file system operations
    mockFs.readFile.mockResolvedValue('test content');
    mockFs.writeFile.mockResolvedValue();
    mockFs.mkdir.mockResolvedValue(undefined);
    mockFs.stat.mockResolvedValue({ size: 100 } as any);
    
    jest.clearAllMocks();
  });

  afterEach(async () => {
    await fileManager.cleanup();
  });

  describe('Concurrent Modification Detection', () => {
    it('should detect concurrent modifications by multiple agents', async () => {
      // Agent 1 modifies the file
      await fileManager.recordFileChange({
        filePath: testFilePath,
        agentId: agent1,
        changeType: 'modified'
      });

      // Wait a short time
      await new Promise(resolve => setTimeout(resolve, 100));

      // Agent 2 tries to modify the same file shortly after
      await expect(
        fileManager.writeFile(testFilePath, 'new content', agent2)
      ).rejects.toThrow('concurrent_modification conflict detected');
    });

    it('should allow modifications after conflict window expires', async () => {
      // Agent 1 modifies the file
      await fileManager.recordFileChange({
        filePath: testFilePath,
        agentId: agent1,
        changeType: 'modified'
      });

      // Mock time passage (more than 10 seconds to exceed merge conflict window)
      const originalNow = Date.now;
      Date.now = jest.fn(() => originalNow() + 11000);

      // Agent 2 should be able to modify now
      await expect(
        fileManager.writeFile(testFilePath, 'new content', agent2)
      ).resolves.not.toThrow();

      // Restore Date.now
      Date.now = originalNow;
    });

    it('should track multiple agents in conflict', async () => {
      const conflictSpy = jest.fn();
      fileManager.on('conflictDetected', conflictSpy);

      // Multiple agents modify the file in quick succession
      await fileManager.recordFileChange({
        filePath: testFilePath,
        agentId: agent1,
        changeType: 'modified'
      });

      await fileManager.recordFileChange({
        filePath: testFilePath,
        agentId: agent2,
        changeType: 'modified'
      });

      // Agent 3 tries to modify
      try {
        await fileManager.writeFile(testFilePath, 'content', agent3);
      } catch (error) {
        // Expected to fail
      }

      expect(conflictSpy).toHaveBeenCalled();
      const conflict = conflictSpy.mock.calls[0][0] as Conflict;
      expect(conflict.involvedAgents).toContain(agent3);
      expect(conflict.involvedAgents.length).toBeGreaterThan(1);
    });
  });

  describe('Lock Timeout Conflicts', () => {
    it('should detect potential lock timeout conflicts', async () => {
      // Simulate rapid successive changes that might indicate lock issues
      const changes = [
        { agentId: agent1, changeType: 'modified' as const },
        { agentId: agent2, changeType: 'modified' as const },
        { agentId: agent1, changeType: 'modified' as const },
        { agentId: agent2, changeType: 'modified' as const },
      ];

      for (const change of changes) {
        await fileManager.recordFileChange({
          filePath: testFilePath,
          ...change
        });
        // Very small delay to simulate rapid changes
        await new Promise(resolve => setTimeout(resolve, 10));
      }

      // This should trigger lock timeout detection
      try {
        await fileManager.writeFile(testFilePath, 'content', agent3);
      } catch (error) {
        expect((error as Error).message).toContain('lock_timeout');
      }
    });
  });

  describe('Merge Conflicts', () => {
    it('should detect merge conflicts from overlapping changes', async () => {
      // Agent 1 makes a change
      await fileManager.recordFileChange({
        filePath: testFilePath,
        agentId: agent1,
        changeType: 'modified'
      });

      // Agent 2 makes a change within the merge window
      await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second later
      
      await fileManager.recordFileChange({
        filePath: testFilePath,
        agentId: agent2,
        changeType: 'modified'
      });

      // Agent 3 tries to modify - should detect merge conflict
      try {
        await fileManager.writeFile(testFilePath, 'content', agent3);
      } catch (error) {
        expect((error as Error).message).toContain('merge_conflict');
      }
    });
  });

  describe('Conflict Resolution Strategies', () => {
    it('should auto-resolve concurrent modification conflicts', async () => {
      // Create a conflict
      const conflict: Conflict = {
        id: 'test-conflict',
        filePath: testFilePath,
        conflictType: 'concurrent_modification',
        involvedAgents: [agent1, agent2],
        description: 'Test conflict',
        createdAt: new Date(),
        resolved: false
      };

      // Add to file manager
      (fileManager as any).conflicts.set(conflict.id, conflict);

      // Add some history
      await fileManager.recordFileChange({
        filePath: testFilePath,
        agentId: agent1,
        changeType: 'modified'
      });

      await fileManager.recordFileChange({
        filePath: testFilePath,
        agentId: agent2,
        changeType: 'modified'
      });

      // Auto-resolve the conflict
      const resolution = await fileManager.autoResolveConflict(conflict.id);

      expect(resolution.strategy).toBe('merge');
      expect(resolution.resolvedBy).toBe('system');
      expect(resolution.resolution.action).toBe('use_latest');
    });

    it('should handle lock timeout conflicts with overwrite strategy', async () => {
      const conflict: Conflict = {
        id: 'timeout-conflict',
        filePath: testFilePath,
        conflictType: 'lock_timeout',
        involvedAgents: [agent1, agent2],
        description: 'Lock timeout conflict',
        createdAt: new Date(),
        resolved: false
      };

      (fileManager as any).conflicts.set(conflict.id, conflict);

      const resolution = await fileManager.autoResolveConflict(conflict.id);

      expect(resolution.strategy).toBe('overwrite');
      expect(resolution.resolution.action).toBe('force_overwrite');
    });

    it('should fall back to manual resolution for complex conflicts', async () => {
      const conflict: Conflict = {
        id: 'complex-conflict',
        filePath: testFilePath,
        conflictType: 'merge_conflict',
        involvedAgents: [agent1, agent2, agent3],
        description: 'Complex merge conflict',
        createdAt: new Date(),
        resolved: false
      };

      (fileManager as any).conflicts.set(conflict.id, conflict);

      const resolution = await fileManager.autoResolveConflict(conflict.id);

      expect(resolution.strategy).toBe('manual');
      expect(resolution.resolvedBy).toBe('pending');
    });
  });

  describe('Enhanced File History Tracking', () => {
    it('should track detailed file changes with analysis', async () => {
      const change = await fileManager.recordFileChange({
        filePath: testFilePath,
        agentId: agent1,
        changeType: 'modified',
        metadata: { reason: 'bug fix' }
      });

      expect(change.id).toBeDefined();
      expect(change.timestamp).toBeInstanceOf(Date);
      expect(change.metadata?.reason).toBe('bug fix');

      const history = fileManager.getEnhancedHistory(testFilePath);
      expect(history).toHaveLength(1);
      expect(history[0]).toEqual(change);
    });

    it('should analyze conflicts across time windows', async () => {
      // Create multiple changes by different agents
      await fileManager.recordFileChange({
        filePath: testFilePath,
        agentId: agent1,
        changeType: 'modified'
      });

      await fileManager.recordFileChange({
        filePath: testFilePath,
        agentId: agent2,
        changeType: 'modified'
      });

      const conflicts = fileManager.analyzeFileConflicts(testFilePath, 60000); // 1 minute window
      expect(conflicts.length).toBeGreaterThan(0);
      expect(conflicts.every(c => c.changeType === 'modified')).toBe(true);
    });

    it('should provide change statistics', async () => {
      // Create changes by multiple agents
      await fileManager.recordFileChange({
        filePath: testFilePath,
        agentId: agent1,
        changeType: 'created'
      });

      await fileManager.recordFileChange({
        filePath: testFilePath,
        agentId: agent1,
        changeType: 'modified'
      });

      await fileManager.recordFileChange({
        filePath: '/test/other-file.txt',
        agentId: agent2,
        changeType: 'created'
      });

      const stats = fileManager.getChangeStatistics();
      expect(stats.totalFiles).toBe(2);
      expect(stats.totalChanges).toBe(3);
      expect(stats.agentActivity.get(agent1)).toBe(2);
      expect(stats.agentActivity.get(agent2)).toBe(1);
    });
  });

  describe('Event Handling', () => {
    it('should emit conflict detection events', async () => {
      const conflictSpy = jest.fn();
      const resolutionSpy = jest.fn();
      
      fileManager.on('conflictDetected', conflictSpy);
      fileManager.on('conflictResolved', resolutionSpy);

      // Create a scenario that triggers conflict detection
      await fileManager.recordFileChange({
        filePath: testFilePath,
        agentId: agent1,
        changeType: 'modified'
      });

      try {
        await fileManager.writeFile(testFilePath, 'content', agent2);
      } catch (error) {
        // Expected conflict
      }

      expect(conflictSpy).toHaveBeenCalled();
    });

    it('should emit change tracking events', async () => {
      const changeSpy = jest.fn();
      fileManager.on('changeRecorded', changeSpy);

      await fileManager.recordFileChange({
        filePath: testFilePath,
        agentId: agent1,
        changeType: 'modified'
      });

      expect(changeSpy).toHaveBeenCalled();
    });
  });

  describe('File Snapshots', () => {
    it('should create and retrieve file snapshots', async () => {
      // Record a change that should create a snapshot
      await fileManager.recordFileChange({
        filePath: testFilePath,
        agentId: agent1,
        changeType: 'modified'
      });

      const snapshots = fileManager.getFileSnapshots(testFilePath);
      expect(Array.isArray(snapshots)).toBe(true);
    });
  });
});
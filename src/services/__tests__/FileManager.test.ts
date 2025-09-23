/**
 * Unit tests for FileManager
 */

import { FileManager } from '../FileManager';
import { FileLock, Conflict, FileChange } from '../../types/file.types';
import * as fs from 'fs/promises';
import * as path from 'path';

// Mock fs module
jest.mock('fs/promises');
const mockFs = fs as jest.Mocked<typeof fs>;

describe('FileManager', () => {
  let fileManager: FileManager;
  const testFilePath = '/test/file.txt';
  const testAgentId = 'agent-123';

  beforeEach(() => {
    fileManager = new FileManager();
    jest.clearAllMocks();
  });

  afterEach(async () => {
    await fileManager.cleanup();
  });

  describe('File Locking', () => {
    it('should successfully acquire a file lock', async () => {
      const lock = await fileManager.requestLock(testFilePath, testAgentId, 'write');

      expect(lock).toBeDefined();
      expect(lock.filePath).toBe(path.normalize(testFilePath));
      expect(lock.agentId).toBe(testAgentId);
      expect(lock.lockType).toBe('write');
      expect(lock.acquiredAt).toBeInstanceOf(Date);
      expect(lock.expiresAt).toBeInstanceOf(Date);
    });

    it('should prevent acquiring lock on already locked file', async () => {
      await fileManager.requestLock(testFilePath, testAgentId, 'write');

      await expect(
        fileManager.requestLock(testFilePath, 'agent-456', 'write')
      ).rejects.toThrow('already locked');
    });

    it('should allow multiple read locks on same file', async () => {
      const lock1 = await fileManager.requestLock(testFilePath, testAgentId, 'read');
      const lock2 = await fileManager.requestLock(testFilePath, 'agent-456', 'read');

      expect(lock1).toBeDefined();
      expect(lock2).toBeDefined();
    });

    it('should successfully release a file lock', async () => {
      const lock = await fileManager.requestLock(testFilePath, testAgentId, 'write');
      
      await expect(fileManager.releaseLock(lock.id)).resolves.not.toThrow();
      
      const isLocked = await fileManager.isLocked(testFilePath);
      expect(isLocked).toBe(false);
    });

    it('should throw error when releasing non-existent lock', async () => {
      await expect(
        fileManager.releaseLock('non-existent-lock')
      ).rejects.toThrow('Lock non-existent-lock not found');
    });

    it('should check if file is locked', async () => {
      expect(await fileManager.isLocked(testFilePath)).toBe(false);
      
      await fileManager.requestLock(testFilePath, testAgentId, 'write');
      expect(await fileManager.isLocked(testFilePath)).toBe(true);
    });

    it('should get lock information', async () => {
      const lock = await fileManager.requestLock(testFilePath, testAgentId, 'write');
      const lockInfo = await fileManager.getLockInfo(testFilePath);

      expect(lockInfo).toEqual(lock);
    });

    it('should return null for lock info on unlocked file', async () => {
      const lockInfo = await fileManager.getLockInfo(testFilePath);
      expect(lockInfo).toBeNull();
    });
  });

  describe('Conflict Detection and Resolution', () => {
    it('should detect conflicts for a file', async () => {
      // Create a mock conflict
      const conflictId = 'conflict-123';
      const conflict: Conflict = {
        id: conflictId,
        filePath: path.normalize(testFilePath), // Use normalized path
        conflictType: 'concurrent_modification',
        involvedAgents: [testAgentId, 'agent-456'],
        description: 'Test conflict',
        createdAt: new Date(),
        resolved: false
      };

      // Manually add conflict to test detection
      (fileManager as any).conflicts.set(conflictId, conflict);

      const conflicts = await fileManager.detectConflicts(testFilePath);
      expect(conflicts).toHaveLength(1);
      expect(conflicts[0]).toEqual(conflict);
    });

    it('should resolve conflicts', async () => {
      const conflictId = 'conflict-123';
      const conflict: Conflict = {
        id: conflictId,
        filePath: testFilePath,
        conflictType: 'concurrent_modification',
        involvedAgents: [testAgentId, 'agent-456'],
        description: 'Test conflict',
        createdAt: new Date(),
        resolved: false
      };

      (fileManager as any).conflicts.set(conflictId, conflict);

      const resolution = {
        conflictId,
        strategy: 'merge' as const,
        resolvedBy: testAgentId,
        resolution: {},
        timestamp: new Date()
      };

      await fileManager.resolveConflict(conflictId, resolution);

      const updatedConflict = (fileManager as any).conflicts.get(conflictId);
      expect(updatedConflict.resolved).toBe(true);
    });

    it('should get all conflicts', async () => {
      const conflicts = await fileManager.getConflicts();
      expect(Array.isArray(conflicts)).toBe(true);
    });

    it('should filter conflicts by resolved status', async () => {
      const resolvedConflicts = await fileManager.getConflicts(true);
      const unresolvedConflicts = await fileManager.getConflicts(false);
      
      expect(Array.isArray(resolvedConflicts)).toBe(true);
      expect(Array.isArray(unresolvedConflicts)).toBe(true);
    });
  });  describe
('File History Tracking', () => {
    it('should record file changes', async () => {
      const change = {
        filePath: testFilePath,
        agentId: testAgentId,
        changeType: 'modified' as const
      };

      const recordedChange = await fileManager.recordFileChange(change);

      expect(recordedChange.id).toBeDefined();
      expect(recordedChange.timestamp).toBeInstanceOf(Date);
      expect(recordedChange.filePath).toBe(path.normalize(testFilePath));
      expect(recordedChange.agentId).toBe(testAgentId);
      expect(recordedChange.changeType).toBe('modified');
    });

    it('should get file history', async () => {
      const change1 = {
        filePath: testFilePath,
        agentId: testAgentId,
        changeType: 'created' as const
      };

      const change2 = {
        filePath: testFilePath,
        agentId: testAgentId,
        changeType: 'modified' as const
      };

      await fileManager.recordFileChange(change1);
      await fileManager.recordFileChange(change2);

      const history = await fileManager.getFileHistory(testFilePath);
      expect(history).toHaveLength(2);
      expect(history[0].changeType).toBe('created');
      expect(history[1].changeType).toBe('modified');
    });

    it('should return empty history for new file', async () => {
      const history = await fileManager.getFileHistory('/new/file.txt');
      expect(history).toHaveLength(0);
    });
  });

  describe('File Operations', () => {
    beforeEach(() => {
      mockFs.readFile.mockResolvedValue('file content');
      mockFs.writeFile.mockResolvedValue();
      mockFs.mkdir.mockResolvedValue(undefined);
      mockFs.unlink.mockResolvedValue();
      mockFs.rename.mockResolvedValue();
      mockFs.readdir.mockResolvedValue(['file1.txt', 'file2.txt'] as any);
      mockFs.copyFile.mockResolvedValue();
      mockFs.stat.mockResolvedValue({ size: 100 } as any);
    });

    it('should read file when agent has access', async () => {
      const content = await fileManager.readFile(testFilePath, testAgentId);
      
      expect(content).toBe('file content');
      expect(mockFs.readFile).toHaveBeenCalledWith(path.normalize(testFilePath), 'utf-8');
    });

    it('should prevent reading exclusively locked file', async () => {
      await fileManager.requestLock(testFilePath, 'other-agent', 'exclusive');

      await expect(
        fileManager.readFile(testFilePath, testAgentId)
      ).rejects.toThrow('exclusively locked');
    });

    it('should write file when agent has access', async () => {
      const content = 'new content';
      
      await fileManager.writeFile(testFilePath, content, testAgentId);
      
      expect(mockFs.mkdir).toHaveBeenCalled();
      expect(mockFs.writeFile).toHaveBeenCalledWith(
        path.normalize(testFilePath), 
        content, 
        'utf-8'
      );
    });

    it('should prevent writing to locked file', async () => {
      await fileManager.requestLock(testFilePath, 'other-agent', 'write');

      await expect(
        fileManager.writeFile(testFilePath, 'content', testAgentId)
      ).rejects.toThrow('locked by another agent');
    });

    it('should detect concurrent modifications', async () => {
      // First, record a recent change by another agent
      await fileManager.recordFileChange({
        filePath: testFilePath,
        agentId: 'other-agent',
        changeType: 'modified'
      });

      // Try to write immediately after - should detect conflict
      await expect(
        fileManager.writeFile(testFilePath, 'content', testAgentId)
      ).rejects.toThrow('concurrent_modification conflict detected');
    });

    it('should delete file when agent has access', async () => {
      await fileManager.deleteFile(testFilePath, testAgentId);
      
      expect(mockFs.unlink).toHaveBeenCalledWith(path.normalize(testFilePath));
    });

    it('should prevent deleting locked file', async () => {
      await fileManager.requestLock(testFilePath, 'other-agent', 'write');

      await expect(
        fileManager.deleteFile(testFilePath, testAgentId)
      ).rejects.toThrow('locked by another agent');
    });

    it('should move file when agent has access', async () => {
      const targetPath = '/test/moved-file.txt';
      
      await fileManager.moveFile(testFilePath, targetPath, testAgentId);
      
      expect(mockFs.mkdir).toHaveBeenCalled();
      expect(mockFs.rename).toHaveBeenCalledWith(
        path.normalize(testFilePath),
        path.normalize(targetPath)
      );
    });

    it('should create directory', async () => {
      const dirPath = '/test/new-dir';
      
      await fileManager.createDirectory(dirPath, testAgentId);
      
      expect(mockFs.mkdir).toHaveBeenCalledWith(
        path.normalize(dirPath),
        { recursive: true }
      );
    });

    it('should list directory contents', async () => {
      const dirPath = '/test/dir';
      
      const contents = await fileManager.listDirectory(dirPath);
      
      expect(mockFs.readdir).toHaveBeenCalledWith(path.normalize(dirPath));
      expect(contents).toHaveLength(2);
      expect(contents[0]).toContain('file1.txt');
      expect(contents[1]).toContain('file2.txt');
    });
  });

  describe('Backup and Recovery', () => {
    beforeEach(() => {
      mockFs.copyFile.mockResolvedValue();
      mockFs.unlink.mockResolvedValue();
    });

    it('should create backup', async () => {
      const backupId = await fileManager.createBackup(testFilePath);
      
      expect(backupId).toBeDefined();
      expect(typeof backupId).toBe('string');
      expect(mockFs.copyFile).toHaveBeenCalled();
    });

    it('should restore from backup', async () => {
      const backupId = 'backup-123';
      
      await fileManager.restoreBackup(backupId, testFilePath);
      
      expect(mockFs.copyFile).toHaveBeenCalled();
      expect(mockFs.unlink).toHaveBeenCalled();
    });
  });

  describe('Lock Timeout and Cleanup', () => {
    it('should have lock timeout mechanism', async () => {
      const lock = await fileManager.requestLock(testFilePath, testAgentId, 'write');
      
      // Check that lock has expiration time
      expect(lock.expiresAt).toBeDefined();
      expect(lock.expiresAt!.getTime()).toBeGreaterThan(Date.now());
      
      // Manually release the lock to clean up
      await fileManager.releaseLock(lock.id);
    });

    it('should cleanup all resources', async () => {
      const lock = await fileManager.requestLock(testFilePath, testAgentId, 'write');
      
      await fileManager.cleanup();
      
      const isLocked = await fileManager.isLocked(testFilePath);
      expect(isLocked).toBe(false);
    });
  });

  describe('Event Emission', () => {
    it('should emit lockAcquired event', async () => {
      const eventSpy = jest.fn();
      fileManager.on('lockAcquired', eventSpy);
      
      const lock = await fileManager.requestLock(testFilePath, testAgentId, 'write');
      
      expect(eventSpy).toHaveBeenCalledWith(lock);
    });

    it('should emit lockReleased event', async () => {
      const eventSpy = jest.fn();
      fileManager.on('lockReleased', eventSpy);
      
      const lock = await fileManager.requestLock(testFilePath, testAgentId, 'write');
      await fileManager.releaseLock(lock.id);
      
      expect(eventSpy).toHaveBeenCalledWith(lock);
    });

    it('should emit fileChanged event', async () => {
      const eventSpy = jest.fn();
      fileManager.on('fileChanged', eventSpy);
      
      const change = {
        filePath: testFilePath,
        agentId: testAgentId,
        changeType: 'modified' as const
      };
      
      await fileManager.recordFileChange(change);
      
      expect(eventSpy).toHaveBeenCalled();
    });
  });
});
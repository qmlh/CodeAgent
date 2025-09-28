/**
 * FileManager implementation for handling file access control, locking, and conflict resolution
 */

import * as fs from 'fs/promises';
import * as fsSync from 'fs';
import * as path from 'path';
import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import { IFileManager } from '../core/interfaces/IFileManager';
import { FileLock, Conflict, ConflictResolution, FileChange } from '../types/file.types';
import { ConflictResolver } from './ConflictResolver';
import { FileChangeTracker } from './FileChangeTracker';

export class FileManager extends EventEmitter implements IFileManager {
  private locks: Map<string, FileLock> = new Map();
  private conflicts: Map<string, Conflict> = new Map();
  private fileHistory: Map<string, FileChange[]> = new Map();
  private watchers: Map<string, fsSync.FSWatcher> = new Map();
  private lockTimeouts: Map<string, NodeJS.Timeout> = new Map();
  private cleanupInterval?: NodeJS.Timeout;
  
  private conflictResolver: ConflictResolver;
  private changeTracker: FileChangeTracker;
  
  private readonly DEFAULT_LOCK_TIMEOUT = 30000; // 30 seconds
  private readonly MAX_LOCK_DURATION = 300000; // 5 minutes

  constructor() {
    super();
    this.conflictResolver = new ConflictResolver();
    this.changeTracker = new FileChangeTracker();
    this.setupCleanupInterval();
    this.setupEventHandlers();
  }

  async initialize(): Promise<void> {
    // Initialize file manager components
    this.locks.clear();
    this.conflicts.clear();
    this.fileHistory.clear();
    
    // Initialize sub-components
    await this.conflictResolver.initialize();
    await this.changeTracker.initialize();
  }

  /**
   * Request a file lock for an agent
   */
  async requestLock(
    filePath: string, 
    agentId: string, 
    lockType: 'read' | 'write' | 'exclusive' = 'write'
  ): Promise<FileLock> {
    const normalizedPath = path.normalize(filePath);
    
    // Check if file is already locked
    const existingLock = await this.getLockInfo(normalizedPath);
    if (existingLock) {
      // Allow multiple read locks
      if (lockType === 'read' && existingLock.lockType === 'read') {
        // Create a new read lock
      } else {
        throw new Error(`File ${normalizedPath} is already locked by agent ${existingLock.agentId}`);
      }
    }

    const lockId = uuidv4();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + this.DEFAULT_LOCK_TIMEOUT);

    const lock: FileLock = {
      id: lockId,
      filePath: normalizedPath,
      agentId,
      lockType,
      acquiredAt: now,
      expiresAt
    };

    this.locks.set(lockId, lock);
    
    // Set up automatic release timeout
    const timeout = setTimeout(() => {
      this.releaseLock(lockId).catch(console.error);
    }, this.DEFAULT_LOCK_TIMEOUT);
    
    this.lockTimeouts.set(lockId, timeout);

    this.emit('lockAcquired', lock);
    return lock;
  }

  /**
   * Release a file lock
   */
  async releaseLock(lockId: string): Promise<void> {
    const lock = this.locks.get(lockId);
    if (!lock) {
      throw new Error(`Lock ${lockId} not found`);
    }

    this.locks.delete(lockId);
    
    // Clear timeout
    const timeout = this.lockTimeouts.get(lockId);
    if (timeout) {
      clearTimeout(timeout);
      this.lockTimeouts.delete(lockId);
    }

    this.emit('lockReleased', lock);
  }

  /**
   * Check if a file is locked
   */
  async isLocked(filePath: string): Promise<boolean> {
    const normalizedPath = path.normalize(filePath);
    return Array.from(this.locks.values()).some(lock => lock.filePath === normalizedPath);
  }

  /**
   * Get lock information for a file
   */
  async getLockInfo(filePath: string): Promise<FileLock | null> {
    const normalizedPath = path.normalize(filePath);
    return Array.from(this.locks.values()).find(lock => lock.filePath === normalizedPath) || null;
  }  /**
   *
 Detect conflicts for a specific file
   */
  async detectConflicts(filePath: string): Promise<Conflict[]> {
    const normalizedPath = path.normalize(filePath);
    return Array.from(this.conflicts.values()).filter(
      conflict => conflict.filePath === normalizedPath && !conflict.resolved
    );
  }

  /**
   * Resolve a conflict
   */
  async resolveConflict(conflictId: string, resolution: ConflictResolution): Promise<void> {
    const conflict = this.conflicts.get(conflictId);
    if (!conflict) {
      throw new Error(`Conflict ${conflictId} not found`);
    }

    conflict.resolved = true;
    this.emit('conflictResolved', { conflict, resolution });
  }

  /**
   * Auto-resolve a conflict using available strategies
   */
  async autoResolveConflict(conflictId: string): Promise<ConflictResolution> {
    const conflict = this.conflicts.get(conflictId);
    if (!conflict) {
      throw new Error(`Conflict ${conflictId} not found`);
    }

    const history = await this.getFileHistory(conflict.filePath);
    const conflictingChanges = history.filter(
      change => conflict.involvedAgents.includes(change.agentId)
    );

    const context = {
      filePath: conflict.filePath,
      conflictingChanges,
      fileContent: await this.safeReadFile(conflict.filePath),
    };

    const resolution = await this.conflictResolver.resolveConflict(conflict, context);
    
    // Apply the resolution
    await this.resolveConflict(conflictId, resolution);
    
    return resolution;
  }

  /**
   * Get enhanced file history with analysis
   */
  getEnhancedHistory(filePath: string): FileChange[] {
    return this.changeTracker.getHistory(filePath);
  }

  /**
   * Get file snapshots
   */
  getFileSnapshots(filePath: string) {
    return this.changeTracker.getSnapshots(filePath);
  }

  /**
   * Analyze potential conflicts for a file
   */
  analyzeFileConflicts(filePath: string, timeWindowMs?: number): FileChange[] {
    return this.changeTracker.analyzeConflicts(filePath, timeWindowMs);
  }

  /**
   * Get change statistics
   */
  getChangeStatistics() {
    return this.changeTracker.getStatistics();
  }

  /**
   * Get all conflicts
   */
  async getConflicts(resolved?: boolean): Promise<Conflict[]> {
    const allConflicts = Array.from(this.conflicts.values());
    if (resolved === undefined) {
      return allConflicts;
    }
    return allConflicts.filter(conflict => conflict.resolved === resolved);
  }

  /**
   * Get file change history
   */
  async getFileHistory(filePath: string): Promise<FileChange[]> {
    const normalizedPath = path.normalize(filePath);
    return this.fileHistory.get(normalizedPath) || [];
  }

  /**
   * Record a file change
   */
  async recordFileChange(change: Omit<FileChange, 'id' | 'timestamp'>): Promise<FileChange> {
    const normalizedPath = path.normalize(change.filePath);
    
    // Use the enhanced change tracker
    const fileChange = await this.changeTracker.recordChange(
      normalizedPath,
      change.agentId,
      change.changeType,
      change.metadata
    );

    // Also maintain the simple history for backward compatibility
    const history = this.fileHistory.get(normalizedPath) || [];
    history.push(fileChange);
    this.fileHistory.set(normalizedPath, history);

    this.emit('fileChanged', fileChange);
    return fileChange;
  }

  /**
   * Read file with lock checking
   */
  async readFile(filePath: string, agentId: string): Promise<string> {
    const normalizedPath = path.normalize(filePath);
    
    // Check if agent has read access
    const lock = await this.getLockInfo(normalizedPath);
    if (lock && lock.agentId !== agentId && lock.lockType === 'exclusive') {
      throw new Error(`File ${normalizedPath} is exclusively locked by another agent`);
    }

    try {
      const content = await fs.readFile(normalizedPath, 'utf-8');
      
      // Record the read operation
      await this.recordFileChange({
        filePath: normalizedPath,
        agentId,
        changeType: 'modified' // Using modified as a read access indicator
      });

      return content;
    } catch (error) {
      throw new Error(`Failed to read file ${normalizedPath}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Write file with lock checking
   */
  async writeFile(filePath: string, content: string, agentId: string): Promise<void> {
    const normalizedPath = path.normalize(filePath);
    
    // Check if agent has write access
    const lock = await this.getLockInfo(normalizedPath);
    if (lock && lock.agentId !== agentId) {
      throw new Error(`File ${normalizedPath} is locked by another agent`);
    }

    try {
      // Ensure directory exists
      const dir = path.dirname(normalizedPath);
      await fs.mkdir(dir, { recursive: true });

      // Check for concurrent modifications
      await this.checkForConcurrentModifications(normalizedPath, agentId);

      await fs.writeFile(normalizedPath, content, 'utf-8');
      
      // Record the write operation
      await this.recordFileChange({
        filePath: normalizedPath,
        agentId,
        changeType: 'modified'
      });

    } catch (error) {
      throw new Error(`Failed to write file ${normalizedPath}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }  /**

   * Delete file with lock checking
   */
  async deleteFile(filePath: string, agentId: string): Promise<void> {
    const normalizedPath = path.normalize(filePath);
    
    // Check if agent has delete access
    const lock = await this.getLockInfo(normalizedPath);
    if (lock && lock.agentId !== agentId) {
      throw new Error(`File ${normalizedPath} is locked by another agent`);
    }

    try {
      await fs.unlink(normalizedPath);
      
      // Record the delete operation
      await this.recordFileChange({
        filePath: normalizedPath,
        agentId,
        changeType: 'deleted'
      });

      // Clean up file history and locks
      this.fileHistory.delete(normalizedPath);
      
    } catch (error) {
      throw new Error(`Failed to delete file ${normalizedPath}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Move file with lock checking
   */
  async moveFile(sourcePath: string, targetPath: string, agentId: string): Promise<void> {
    const normalizedSource = path.normalize(sourcePath);
    const normalizedTarget = path.normalize(targetPath);
    
    // Check if source file is locked
    const sourceLock = await this.getLockInfo(normalizedSource);
    if (sourceLock && sourceLock.agentId !== agentId) {
      throw new Error(`Source file ${normalizedSource} is locked by another agent`);
    }

    // Check if target file is locked
    const targetLock = await this.getLockInfo(normalizedTarget);
    if (targetLock && targetLock.agentId !== agentId) {
      throw new Error(`Target file ${normalizedTarget} is locked by another agent`);
    }

    try {
      // Ensure target directory exists
      const targetDir = path.dirname(normalizedTarget);
      await fs.mkdir(targetDir, { recursive: true });

      await fs.rename(normalizedSource, normalizedTarget);
      
      // Record the move operation
      await this.recordFileChange({
        filePath: normalizedSource,
        agentId,
        changeType: 'moved',
        metadata: { targetPath: normalizedTarget }
      });

      // Update file history mapping
      const history = this.fileHistory.get(normalizedSource);
      if (history) {
        this.fileHistory.set(normalizedTarget, history);
        this.fileHistory.delete(normalizedSource);
      }

    } catch (error) {
      throw new Error(`Failed to move file from ${normalizedSource} to ${normalizedTarget}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Create directory
   */
  async createDirectory(dirPath: string, agentId: string): Promise<void> {
    const normalizedPath = path.normalize(dirPath);
    
    try {
      await fs.mkdir(normalizedPath, { recursive: true });
      
      // Record the directory creation
      await this.recordFileChange({
        filePath: normalizedPath,
        agentId,
        changeType: 'created'
      });

    } catch (error) {
      throw new Error(`Failed to create directory ${normalizedPath}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * List directory contents
   */
  async listDirectory(dirPath: string): Promise<string[]> {
    const normalizedPath = path.normalize(dirPath);
    
    try {
      const entries = await fs.readdir(normalizedPath);
      return entries.map(entry => path.join(normalizedPath, entry));
    } catch (error) {
      throw new Error(`Failed to list directory ${normalizedPath}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Watch file for changes
   */
  async watchFile(filePath: string, callback: (change: FileChange) => void): Promise<void> {
    const normalizedPath = path.normalize(filePath);
    
    if (this.watchers.has(normalizedPath)) {
      return; // Already watching
    }

    try {
      const watcher = fsSync.watch(normalizedPath, (eventType, filename) => {
        const change: FileChange = {
          id: uuidv4(),
          filePath: normalizedPath,
          agentId: 'system',
          changeType: 'modified',
          timestamp: new Date()
        };
        callback(change);
      });
      
      this.watchers.set(normalizedPath, watcher);
    } catch (error) {
      throw new Error(`Failed to watch file ${normalizedPath}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Stop watching file
   */
  async unwatchFile(filePath: string): Promise<void> {
    const normalizedPath = path.normalize(filePath);
    const watcher = this.watchers.get(normalizedPath);
    
    if (watcher) {
      watcher.close();
      this.watchers.delete(normalizedPath);
    }
  } 
 /**
   * Create backup of a file
   */
  async createBackup(filePath: string): Promise<string> {
    const normalizedPath = path.normalize(filePath);
    const backupId = uuidv4();
    const backupPath = `${normalizedPath}.backup.${backupId}`;
    
    try {
      await fs.copyFile(normalizedPath, backupPath);
      return backupId;
    } catch (error) {
      throw new Error(`Failed to create backup for ${normalizedPath}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Restore file from backup
   */
  async restoreBackup(backupId: string, targetPath: string): Promise<void> {
    const normalizedTarget = path.normalize(targetPath);
    const backupPath = `${normalizedTarget}.backup.${backupId}`;
    
    try {
      await fs.copyFile(backupPath, normalizedTarget);
      // Optionally remove backup file
      await fs.unlink(backupPath);
    } catch (error) {
      throw new Error(`Failed to restore backup ${backupId} to ${normalizedTarget}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Check for concurrent modifications that could cause conflicts
   */
  private async checkForConcurrentModifications(filePath: string, agentId: string): Promise<void> {
    const normalizedPath = path.normalize(filePath);
    const history = await this.getFileHistory(normalizedPath);
    
    // Create a mock current change for conflict detection
    const currentChange: FileChange = {
      id: 'temp',
      filePath: normalizedPath,
      agentId,
      changeType: 'modified',
      timestamp: new Date()
    };

    // Use the advanced conflict resolver
    const detectedConflicts = this.conflictResolver.detectConflicts(history, currentChange);
    
    if (detectedConflicts.length > 0) {
      // Store the conflicts
      for (const conflict of detectedConflicts) {
        this.conflicts.set(conflict.id, conflict);
      }
      
      // Throw error for the first conflict
      const primaryConflict = detectedConflicts[0];
      throw new Error(`${primaryConflict.conflictType} conflict detected on ${filePath}: ${primaryConflict.description}`);
    }
  }

  /**
   * Setup cleanup interval for expired locks
   */
  private setupCleanupInterval(): void {
    this.cleanupInterval = setInterval(() => {
      const now = new Date();
      const expiredLocks: string[] = [];

      for (const [lockId, lock] of this.locks.entries()) {
        if (lock.expiresAt && now > lock.expiresAt) {
          expiredLocks.push(lockId);
        }
      }

      // Clean up expired locks
      expiredLocks.forEach(lockId => {
        this.releaseLock(lockId).catch(console.error);
      });

    }, 10000); // Check every 10 seconds
  }

  /**
   * Setup event handlers for conflict resolver and change tracker
   */
  private setupEventHandlers(): void {
    // Forward conflict resolver events
    this.conflictResolver.on('conflictDetected', (conflict) => {
      this.emit('conflictDetected', conflict);
    });

    this.conflictResolver.on('conflictResolved', (data) => {
      this.emit('conflictResolved', data);
    });

    this.conflictResolver.on('resolutionFailed', (data) => {
      this.emit('resolutionFailed', data);
    });

    // Forward change tracker events
    this.changeTracker.on('changeRecorded', (change) => {
      this.emit('changeRecorded', change);
    });
  }

  /**
   * Safely read file content, returning undefined if file doesn't exist
   */
  private async safeReadFile(filePath: string): Promise<string | undefined> {
    try {
      return await fs.readFile(filePath, 'utf-8');
    } catch (error) {
      return undefined;
    }
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    // Clear cleanup interval
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = undefined;
    }

    // Close all file watchers
    for (const watcher of this.watchers.values()) {
      watcher.close();
    }
    this.watchers.clear();

    // Clear all timeouts
    for (const timeout of this.lockTimeouts.values()) {
      clearTimeout(timeout);
    }
    this.lockTimeouts.clear();

    // Release all locks
    const lockIds = Array.from(this.locks.keys());
    for (const lockId of lockIds) {
      await this.releaseLock(lockId);
    }

    // Remove all listeners
    this.removeAllListeners();
  }
}
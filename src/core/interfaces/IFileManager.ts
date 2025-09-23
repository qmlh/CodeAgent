/**
 * File Manager interface definition
 */

import { FileLock, Conflict, ConflictResolution, FileChange } from '../../types/file.types';

export interface IFileManager {
  // File locking mechanism
  requestLock(filePath: string, agentId: string, lockType?: 'read' | 'write' | 'exclusive'): Promise<FileLock>;
  releaseLock(lockId: string): Promise<void>;
  isLocked(filePath: string): Promise<boolean>;
  getLockInfo(filePath: string): Promise<FileLock | null>;
  
  // Conflict detection and resolution
  detectConflicts(filePath: string): Promise<Conflict[]>;
  resolveConflict(conflictId: string, resolution: ConflictResolution): Promise<void>;
  getConflicts(resolved?: boolean): Promise<Conflict[]>;
  
  // File history and tracking
  getFileHistory(filePath: string): Promise<FileChange[]>;
  recordFileChange(change: Omit<FileChange, 'id' | 'timestamp'>): Promise<FileChange>;
  
  // File operations
  readFile(filePath: string, agentId: string): Promise<string>;
  writeFile(filePath: string, content: string, agentId: string): Promise<void>;
  deleteFile(filePath: string, agentId: string): Promise<void>;
  moveFile(sourcePath: string, targetPath: string, agentId: string): Promise<void>;
  
  // Directory operations
  createDirectory(dirPath: string, agentId: string): Promise<void>;
  listDirectory(dirPath: string): Promise<string[]>;
  
  // File watching and notifications
  watchFile(filePath: string, callback: (change: FileChange) => void): Promise<void>;
  unwatchFile(filePath: string): Promise<void>;
  
  // Backup and recovery
  createBackup(filePath: string): Promise<string>;
  restoreBackup(backupId: string, targetPath: string): Promise<void>;
}
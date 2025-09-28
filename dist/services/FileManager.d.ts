/**
 * FileManager implementation for handling file access control, locking, and conflict resolution
 */
import { EventEmitter } from 'events';
import { IFileManager } from '../core/interfaces/IFileManager';
import { FileLock, Conflict, ConflictResolution, FileChange } from '../types/file.types';
export declare class FileManager extends EventEmitter implements IFileManager {
    private locks;
    private conflicts;
    private fileHistory;
    private watchers;
    private lockTimeouts;
    private cleanupInterval?;
    private conflictResolver;
    private changeTracker;
    private readonly DEFAULT_LOCK_TIMEOUT;
    private readonly MAX_LOCK_DURATION;
    constructor();
    initialize(): Promise<void>;
    /**
     * Request a file lock for an agent
     */
    requestLock(filePath: string, agentId: string, lockType?: 'read' | 'write' | 'exclusive'): Promise<FileLock>;
    /**
     * Release a file lock
     */
    releaseLock(lockId: string): Promise<void>;
    /**
     * Check if a file is locked
     */
    isLocked(filePath: string): Promise<boolean>;
    /**
     * Get lock information for a file
     */
    getLockInfo(filePath: string): Promise<FileLock | null>; /**
     *
   Detect conflicts for a specific file
     */
    detectConflicts(filePath: string): Promise<Conflict[]>;
    /**
     * Resolve a conflict
     */
    resolveConflict(conflictId: string, resolution: ConflictResolution): Promise<void>;
    /**
     * Auto-resolve a conflict using available strategies
     */
    autoResolveConflict(conflictId: string): Promise<ConflictResolution>;
    /**
     * Get enhanced file history with analysis
     */
    getEnhancedHistory(filePath: string): FileChange[];
    /**
     * Get file snapshots
     */
    getFileSnapshots(filePath: string): import("./FileChangeTracker").FileSnapshot[];
    /**
     * Analyze potential conflicts for a file
     */
    analyzeFileConflicts(filePath: string, timeWindowMs?: number): FileChange[];
    /**
     * Get change statistics
     */
    getChangeStatistics(): {
        totalFiles: number;
        totalChanges: number;
        totalSnapshots: number;
        agentActivity: Map<string, number>;
    };
    /**
     * Get all conflicts
     */
    getConflicts(resolved?: boolean): Promise<Conflict[]>;
    /**
     * Get file change history
     */
    getFileHistory(filePath: string): Promise<FileChange[]>;
    /**
     * Record a file change
     */
    recordFileChange(change: Omit<FileChange, 'id' | 'timestamp'>): Promise<FileChange>;
    /**
     * Read file with lock checking
     */
    readFile(filePath: string, agentId: string): Promise<string>;
    /**
     * Write file with lock checking
     */
    writeFile(filePath: string, content: string, agentId: string): Promise<void>; /**
  
     * Delete file with lock checking
     */
    deleteFile(filePath: string, agentId: string): Promise<void>;
    /**
     * Move file with lock checking
     */
    moveFile(sourcePath: string, targetPath: string, agentId: string): Promise<void>;
    /**
     * Create directory
     */
    createDirectory(dirPath: string, agentId: string): Promise<void>;
    /**
     * List directory contents
     */
    listDirectory(dirPath: string): Promise<string[]>;
    /**
     * Watch file for changes
     */
    watchFile(filePath: string, callback: (change: FileChange) => void): Promise<void>;
    /**
     * Stop watching file
     */
    unwatchFile(filePath: string): Promise<void>;
    /**
      * Create backup of a file
      */
    createBackup(filePath: string): Promise<string>;
    /**
     * Restore file from backup
     */
    restoreBackup(backupId: string, targetPath: string): Promise<void>;
    /**
     * Check for concurrent modifications that could cause conflicts
     */
    private checkForConcurrentModifications;
    /**
     * Setup cleanup interval for expired locks
     */
    private setupCleanupInterval;
    /**
     * Setup event handlers for conflict resolver and change tracker
     */
    private setupEventHandlers;
    /**
     * Safely read file content, returning undefined if file doesn't exist
     */
    private safeReadFile;
    /**
     * Cleanup resources
     */
    cleanup(): Promise<void>;
}

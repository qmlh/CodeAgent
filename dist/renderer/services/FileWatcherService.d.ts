/**
 * File Watcher Service
 * Provides real-time file system monitoring and notifications
 */
import { EventEmitter } from 'eventemitter3';
export interface FileWatchEvent {
    type: 'add' | 'change' | 'unlink' | 'addDir' | 'unlinkDir' | 'error';
    path: string;
    filename?: string;
    stats?: {
        size: number;
        mtime: Date;
        isDirectory: boolean;
        isFile: boolean;
    };
    error?: string;
}
export interface WatcherOptions {
    ignored?: RegExp | string | ((path: string) => boolean);
    persistent?: boolean;
    ignoreInitial?: boolean;
    followSymlinks?: boolean;
    depth?: number;
    awaitWriteFinish?: boolean | {
        stabilityThreshold?: number;
        pollInterval?: number;
    };
}
export declare class FileWatcherService extends EventEmitter {
    private watchers;
    private watcherCallbacks;
    private isInitialized;
    constructor();
    private initialize;
    private handleFileSystemEvent;
    private getWatcherPath;
    /**
     * Watch a directory for changes
     */
    watchDirectory(dirPath: string, callback: (event: FileWatchEvent) => void, options?: WatcherOptions): Promise<string>;
    /**
     * Stop watching a directory
     */
    unwatchDirectory(watcherId: string): Promise<void>;
    /**
     * Watch multiple directories
     */
    watchMultipleDirectories(dirPaths: string[], callback: (event: FileWatchEvent) => void, options?: WatcherOptions): Promise<string[]>;
    /**
     * Get all active watchers
     */
    getActiveWatchers(): Array<{
        watcherId: string;
        path: string;
    }>;
    /**
     * Check if a path is being watched
     */
    isWatching(path: string): boolean;
    /**
     * Get watcher statistics
     */
    getWatcherStats(): {
        totalWatchers: number;
        watchedPaths: string[];
        memoryUsage?: number;
    };
    /**
     * Pause all watchers
     */
    pauseAllWatchers(): void;
    /**
     * Resume all watchers
     */
    resumeAllWatchers(): void;
    /**
     * Clean up all watchers
     */
    cleanup(): Promise<void>;
    /**
     * Create a debounced callback for file events
     */
    createDebouncedCallback(callback: (event: FileWatchEvent) => void, delay?: number): (event: FileWatchEvent) => void;
    /**
     * Create a throttled callback for file events
     */
    createThrottledCallback(callback: (event: FileWatchEvent) => void, interval?: number): (event: FileWatchEvent) => void;
    /**
     * Filter events by type
     */
    createEventFilter(callback: (event: FileWatchEvent) => void, allowedTypes: FileWatchEvent['type'][]): (event: FileWatchEvent) => void;
    /**
     * Filter events by path pattern
     */
    createPathFilter(callback: (event: FileWatchEvent) => void, pathPattern: RegExp | string): (event: FileWatchEvent) => void;
}
export declare const fileWatcherService: FileWatcherService;

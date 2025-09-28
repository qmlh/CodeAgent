/**
 * File Watcher Service
 * Handles file system monitoring for hot reload functionality
 */
import { EventEmitter } from 'eventemitter3';
export interface FileChangeEvent {
    type: 'change' | 'add' | 'unlink' | 'addDir' | 'unlinkDir' | 'error';
    path: string;
    filename?: string;
    stats?: any;
    error?: string;
}
export declare class FileWatcherService extends EventEmitter {
    private watchers;
    private isWatching;
    constructor();
    /**
     * Start watching a directory for changes
     */
    watchDirectory(dirPath: string): Promise<void>;
    /**
     * Stop watching a directory
     */
    unwatchDirectory(dirPath: string): Promise<void>;
    /**
     * Stop watching all directories
     */
    unwatchAll(): Promise<void>;
    /**
     * Check if currently watching any directories
     */
    isActive(): boolean;
    /**
     * Get list of watched directories
     */
    getWatchedDirectories(): string[];
    /**
     * Handle file change events from the main process
     */
    private handleFileChange;
    /**
     * Simulate file watching for development mode
     */
    private simulateFileWatching;
    /**
     * Get file extension from path
     */
    private getFileExtension;
    /**
     * Check if file is a web file that should trigger browser refresh
     */
    private isWebFile;
    /**
     * Check if file is a style file
     */
    private isStyleFile;
    /**
     * Check if file is a script file
     */
    private isScriptFile;
    /**
     * Cleanup resources
     */
    destroy(): void;
}
export declare const fileWatcherService: FileWatcherService;

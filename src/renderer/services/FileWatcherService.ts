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

export class FileWatcherService extends EventEmitter {
  private watchers: Map<string, string> = new Map();
  private watcherCallbacks: Map<string, (event: FileWatchEvent) => void> = new Map();
  private isInitialized = false;

  constructor() {
    super();
    this.initialize();
  }

  private async initialize(): Promise<void> {
    if (this.isInitialized) return;

    // Set up global file system event listener
    window.electronAPI?.fs.onDirectoryChanged((data: any) => {
      this.handleFileSystemEvent(data);
    });

    this.isInitialized = true;
  }

  private handleFileSystemEvent(data: any): void {
    const event: FileWatchEvent = {
      type: data.eventType,
      path: data.path || data.filename,
      filename: data.filename
    };

    // Emit to specific watcher callbacks
    for (const [watcherId, callback] of this.watcherCallbacks.entries()) {
      const watcherPath = this.getWatcherPath(watcherId);
      if (watcherPath && (data.path?.startsWith(watcherPath) || data.filename?.startsWith(watcherPath))) {
        callback(event);
      }
    }

    // Emit global event
    this.emit('fileChange', event);
    this.emit(event.type, event);
  }

  private getWatcherPath(watcherId: string): string | undefined {
    return this.watchers.get(watcherId);
  }

  /**
   * Watch a directory for changes
   */
  async watchDirectory(
    dirPath: string, 
    callback: (event: FileWatchEvent) => void,
    options: WatcherOptions = {}
  ): Promise<string> {
    try {
      const result = await window.electronAPI?.fs.watchDirectory(dirPath);
      
      if (result?.success && result.watcherId) {
        this.watchers.set(result.watcherId, dirPath);
        this.watcherCallbacks.set(result.watcherId, callback);
        
        this.emit('watcherAdded', { watcherId: result.watcherId, path: dirPath });
        
        return result.watcherId;
      } else {
        throw new Error(result?.error || 'Failed to create watcher');
      }
    } catch (error) {
      throw new Error(`Failed to watch directory ${dirPath}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Stop watching a directory
   */
  async unwatchDirectory(watcherId: string): Promise<void> {
    try {
      const result = await window.electronAPI?.fs.unwatchDirectory(watcherId);
      
      if (result?.success) {
        const path = this.watchers.get(watcherId);
        this.watchers.delete(watcherId);
        this.watcherCallbacks.delete(watcherId);
        
        this.emit('watcherRemoved', { watcherId, path });
      } else {
        throw new Error(result?.error || 'Failed to remove watcher');
      }
    } catch (error) {
      throw new Error(`Failed to unwatch directory: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Watch multiple directories
   */
  async watchMultipleDirectories(
    dirPaths: string[],
    callback: (event: FileWatchEvent) => void,
    options: WatcherOptions = {}
  ): Promise<string[]> {
    const watcherIds: string[] = [];
    
    for (const dirPath of dirPaths) {
      try {
        const watcherId = await this.watchDirectory(dirPath, callback, options);
        watcherIds.push(watcherId);
      } catch (error) {
        console.error(`Failed to watch directory ${dirPath}:`, error);
      }
    }
    
    return watcherIds;
  }

  /**
   * Get all active watchers
   */
  getActiveWatchers(): Array<{ watcherId: string; path: string }> {
    return Array.from(this.watchers.entries()).map(([watcherId, path]) => ({
      watcherId,
      path
    }));
  }

  /**
   * Check if a path is being watched
   */
  isWatching(path: string): boolean {
    return Array.from(this.watchers.values()).some(watcherPath => 
      path.startsWith(watcherPath) || watcherPath.startsWith(path)
    );
  }

  /**
   * Get watcher statistics
   */
  getWatcherStats(): {
    totalWatchers: number;
    watchedPaths: string[];
    memoryUsage?: number;
  } {
    return {
      totalWatchers: this.watchers.size,
      watchedPaths: Array.from(this.watchers.values())
    };
  }

  /**
   * Pause all watchers
   */
  pauseAllWatchers(): void {
    this.emit('watchersPaused');
  }

  /**
   * Resume all watchers
   */
  resumeAllWatchers(): void {
    this.emit('watchersResumed');
  }

  /**
   * Clean up all watchers
   */
  async cleanup(): Promise<void> {
    const watcherIds = Array.from(this.watchers.keys());
    
    for (const watcherId of watcherIds) {
      try {
        await this.unwatchDirectory(watcherId);
      } catch (error) {
        console.error(`Failed to cleanup watcher ${watcherId}:`, error);
      }
    }
    
    this.watchers.clear();
    this.watcherCallbacks.clear();
    this.removeAllListeners();
  }

  /**
   * Create a debounced callback for file events
   */
  createDebouncedCallback(
    callback: (event: FileWatchEvent) => void,
    delay: number = 300
  ): (event: FileWatchEvent) => void {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let lastEvent: FileWatchEvent | null = null;

    return (event: FileWatchEvent) => {
      lastEvent = event;
      
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      
      timeoutId = setTimeout(() => {
        if (lastEvent) {
          callback(lastEvent);
          lastEvent = null;
        }
        timeoutId = null;
      }, delay);
    };
  }

  /**
   * Create a throttled callback for file events
   */
  createThrottledCallback(
    callback: (event: FileWatchEvent) => void,
    interval: number = 1000
  ): (event: FileWatchEvent) => void {
    let lastCallTime = 0;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    return (event: FileWatchEvent) => {
      const now = Date.now();
      
      if (now - lastCallTime >= interval) {
        callback(event);
        lastCallTime = now;
      } else {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        
        timeoutId = setTimeout(() => {
          callback(event);
          lastCallTime = Date.now();
          timeoutId = null;
        }, interval - (now - lastCallTime));
      }
    };
  }

  /**
   * Filter events by type
   */
  createEventFilter(
    callback: (event: FileWatchEvent) => void,
    allowedTypes: FileWatchEvent['type'][]
  ): (event: FileWatchEvent) => void {
    return (event: FileWatchEvent) => {
      if (allowedTypes.includes(event.type)) {
        callback(event);
      }
    };
  }

  /**
   * Filter events by path pattern
   */
  createPathFilter(
    callback: (event: FileWatchEvent) => void,
    pathPattern: RegExp | string
  ): (event: FileWatchEvent) => void {
    const pattern = typeof pathPattern === 'string' 
      ? new RegExp(pathPattern) 
      : pathPattern;

    return (event: FileWatchEvent) => {
      if (pattern.test(event.path)) {
        callback(event);
      }
    };
  }
}

// Create singleton instance
export const fileWatcherService = new FileWatcherService();
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

export class FileWatcherService extends EventEmitter {
  private watchers: Map<string, any> = new Map();
  private isWatching = false;

  constructor() {
    super();
  }

  /**
   * Start watching a directory for changes
   */
  async watchDirectory(dirPath: string): Promise<void> {
    if (this.watchers.has(dirPath)) {
      return; // Already watching this directory
    }

    try {
      // In a real Electron app, you would use chokidar or fs.watch
      // For now, we'll simulate file watching
      if (window.electronAPI?.fs?.watchDirectory) {
        const result = await window.electronAPI.fs.watchDirectory(dirPath);
        if (result.success && result.watcherId) {
          this.watchers.set(dirPath, result.watcherId);
          
          // Listen for file changes from the main process
          if (window.electronAPI.fs.onDirectoryChanged) {
            window.electronAPI.fs.onDirectoryChanged((data: any) => {
              this.handleFileChange(data);
            });
          }
        }
      } else {
        // Fallback for development mode
        this.simulateFileWatching(dirPath);
      }

      this.isWatching = true;
      this.emit('watching-started', dirPath);
    } catch (error) {
      console.error('Failed to watch directory:', error);
      this.emit('error', error);
    }
  }

  /**
   * Stop watching a directory
   */
  async unwatchDirectory(dirPath: string): Promise<void> {
    const watcherId = this.watchers.get(dirPath);
    if (!watcherId) {
      return;
    }

    try {
      if (window.electronAPI?.fs?.unwatchDirectory) {
        await window.electronAPI.fs.unwatchDirectory(watcherId);
      }
      
      this.watchers.delete(dirPath);
      this.emit('watching-stopped', dirPath);
    } catch (error) {
      console.error('Failed to unwatch directory:', error);
      this.emit('error', error);
    }
  }

  /**
   * Stop watching all directories
   */
  async unwatchAll(): Promise<void> {
    const promises = Array.from(this.watchers.keys()).map(dirPath => 
      this.unwatchDirectory(dirPath)
    );
    
    await Promise.all(promises);
    this.isWatching = false;
  }

  /**
   * Check if currently watching any directories
   */
  isActive(): boolean {
    return this.isWatching && this.watchers.size > 0;
  }

  /**
   * Get list of watched directories
   */
  getWatchedDirectories(): string[] {
    return Array.from(this.watchers.keys());
  }

  /**
   * Handle file change events from the main process
   */
  private handleFileChange(data: any): void {
    const event: FileChangeEvent = {
      type: data.type || 'change',
      path: data.path,
      stats: data.stats,
    };

    this.emit('file-changed', event);

    // Emit specific events for different file types
    const extension = this.getFileExtension(event.path);
    if (this.isWebFile(extension)) {
      this.emit('web-file-changed', event);
    }
    
    if (this.isStyleFile(extension)) {
      this.emit('style-file-changed', event);
    }
    
    if (this.isScriptFile(extension)) {
      this.emit('script-file-changed', event);
    }
  }

  /**
   * Simulate file watching for development mode
   */
  private simulateFileWatching(dirPath: string): void {
    // Create a mock watcher ID
    const watcherId = `mock-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    this.watchers.set(dirPath, watcherId);

    // Simulate periodic file checks (for development only)
    const interval = setInterval(() => {
      // In a real implementation, this would check actual file timestamps
      // For now, we'll just emit a mock event occasionally
      if (Math.random() < 0.1) { // 10% chance every interval
        const mockEvent: FileChangeEvent = {
          type: 'change',
          path: `${dirPath}/mock-file.html`,
        };
        this.handleFileChange(mockEvent);
      }
    }, 2000);

    // Store the interval so we can clear it later
    (this.watchers.get(dirPath) as any).interval = interval;
  }

  /**
   * Get file extension from path
   */
  private getFileExtension(filePath: string): string {
    return filePath.split('.').pop()?.toLowerCase() || '';
  }

  /**
   * Check if file is a web file that should trigger browser refresh
   */
  private isWebFile(extension: string): boolean {
    return ['html', 'htm', 'css', 'js', 'jsx', 'ts', 'tsx', 'vue', 'svelte'].includes(extension);
  }

  /**
   * Check if file is a style file
   */
  private isStyleFile(extension: string): boolean {
    return ['css', 'scss', 'sass', 'less', 'styl'].includes(extension);
  }

  /**
   * Check if file is a script file
   */
  private isScriptFile(extension: string): boolean {
    return ['js', 'jsx', 'ts', 'tsx', 'vue', 'svelte'].includes(extension);
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    this.unwatchAll();
    this.removeAllListeners();
  }
}

// Singleton instance
export const fileWatcherService = new FileWatcherService();
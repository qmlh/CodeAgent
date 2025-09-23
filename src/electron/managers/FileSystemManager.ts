/**
 * File System Manager
 * Handles file system operations and monitoring
 */

import * as fs from 'fs-extra';
import * as path from 'path';
import * as chokidar from 'chokidar';
import { v4 as uuidv4 } from 'uuid';

export interface FileWatcher {
  id: string;
  watcher: chokidar.FSWatcher;
  path: string;
  callback: (eventType: string, filename: string) => void;
}

export class FileSystemManager {
  private watchers: Map<string, FileWatcher> = new Map();

  async initialize(): Promise<void> {
    console.log('FileSystemManager initialized');
  }

  async readFile(filePath: string): Promise<string> {
    try {
      return await fs.readFile(filePath, 'utf-8');
    } catch (error) {
      throw new Error(`Failed to read file ${filePath}: ${(error as Error).message}`);
    }
  }

  async writeFile(filePath: string, content: string): Promise<void> {
    try {
      await fs.ensureDir(path.dirname(filePath));
      await fs.writeFile(filePath, content, 'utf-8');
    } catch (error) {
      throw new Error(`Failed to write file ${filePath}: ${(error as Error).message}`);
    }
  }

  async deleteFile(filePath: string): Promise<void> {
    try {
      await fs.remove(filePath);
    } catch (error) {
      throw new Error(`Failed to delete file ${filePath}: ${(error as Error).message}`);
    }
  }

  async createDirectory(dirPath: string): Promise<void> {
    try {
      await fs.ensureDir(dirPath);
    } catch (error) {
      throw new Error(`Failed to create directory ${dirPath}: ${(error as Error).message}`);
    }
  }

  async listDirectory(dirPath: string): Promise<Array<{
    name: string;
    isDirectory: boolean;
    isFile: boolean;
    path: string;
    size?: number;
    mtime?: Date;
  }>> {
    try {
      const items = await fs.readdir(dirPath, { withFileTypes: true });
      const result = await Promise.all(
        items.map(async (item) => {
          const itemPath = path.join(dirPath, item.name);
          let stats;
          
          try {
            stats = await fs.stat(itemPath);
          } catch (error) {
            // Handle broken symlinks or permission issues
            stats = null;
          }

          return {
            name: item.name,
            isDirectory: item.isDirectory(),
            isFile: item.isFile(),
            path: itemPath,
            size: stats?.size,
            mtime: stats?.mtime
          };
        })
      );

      return result;
    } catch (error) {
      throw new Error(`Failed to list directory ${dirPath}: ${(error as Error).message}`);
    }
  }

  async copyFile(sourcePath: string, destinationPath: string): Promise<void> {
    try {
      await fs.ensureDir(path.dirname(destinationPath));
      await fs.copy(sourcePath, destinationPath);
    } catch (error) {
      throw new Error(`Failed to copy file from ${sourcePath} to ${destinationPath}: ${(error as Error).message}`);
    }
  }

  async moveFile(sourcePath: string, destinationPath: string): Promise<void> {
    try {
      await fs.ensureDir(path.dirname(destinationPath));
      await fs.move(sourcePath, destinationPath);
    } catch (error) {
      throw new Error(`Failed to move file from ${sourcePath} to ${destinationPath}: ${(error as Error).message}`);
    }
  }

  async renameFile(oldPath: string, newPath: string): Promise<void> {
    try {
      await fs.rename(oldPath, newPath);
    } catch (error) {
      throw new Error(`Failed to rename file from ${oldPath} to ${newPath}: ${(error as Error).message}`);
    }
  }

  async getFileStats(filePath: string): Promise<{
    size: number;
    isDirectory: boolean;
    isFile: boolean;
    mtime: Date;
    ctime: Date;
    atime: Date;
  }> {
    try {
      const stats = await fs.stat(filePath);
      return {
        size: stats.size,
        isDirectory: stats.isDirectory(),
        isFile: stats.isFile(),
        mtime: stats.mtime,
        ctime: stats.ctime,
        atime: stats.atime
      };
    } catch (error) {
      throw new Error(`Failed to get stats for ${filePath}: ${(error as Error).message}`);
    }
  }

  async exists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  async watchDirectory(
    dirPath: string,
    callback: (eventType: string, filename: string) => void
  ): Promise<string> {
    const watcherId = uuidv4();
    
    try {
      const watcher = chokidar.watch(dirPath, {
        ignored: /(^|[\/\\])\../, // ignore dotfiles
        persistent: true,
        ignoreInitial: true,
        followSymlinks: false,
        depth: 10 // limit depth to prevent performance issues
      });

      watcher
        .on('add', (filePath) => callback('add', filePath))
        .on('change', (filePath) => callback('change', filePath))
        .on('unlink', (filePath) => callback('unlink', filePath))
        .on('addDir', (dirPath) => callback('addDir', dirPath))
        .on('unlinkDir', (dirPath) => callback('unlinkDir', dirPath))
        .on('error', (error) => {
          console.error('File watcher error:', error);
          callback('error', error.message);
        });

      const fileWatcher: FileWatcher = {
        id: watcherId,
        watcher,
        path: dirPath,
        callback
      };

      this.watchers.set(watcherId, fileWatcher);
      
      return watcherId;
    } catch (error) {
      throw new Error(`Failed to watch directory ${dirPath}: ${(error as Error).message}`);
    }
  }

  unwatchDirectory(watcherId: string): void {
    const fileWatcher = this.watchers.get(watcherId);
    
    if (fileWatcher) {
      fileWatcher.watcher.close();
      this.watchers.delete(watcherId);
    }
  }

  async searchFiles(
    dirPath: string,
    pattern: string,
    options: {
      includeContent?: boolean;
      fileExtensions?: string[];
      maxResults?: number;
    } = {}
  ): Promise<Array<{
    path: string;
    name: string;
    matches?: Array<{ line: number; content: string }>;
  }>> {
    const results: Array<{
      path: string;
      name: string;
      matches?: Array<{ line: number; content: string }>;
    }> = [];

    const { includeContent = false, fileExtensions = [], maxResults = 100 } = options;

    try {
      const searchInDirectory = async (currentDir: string): Promise<void> => {
        if (results.length >= maxResults) return;

        const items = await this.listDirectory(currentDir);
        
        for (const item of items) {
          if (results.length >= maxResults) break;

          if (item.isDirectory && !item.name.startsWith('.')) {
            await searchInDirectory(item.path);
          } else if (item.isFile) {
            // Check file extension filter
            if (fileExtensions.length > 0) {
              const ext = path.extname(item.name).toLowerCase();
              if (!fileExtensions.includes(ext)) continue;
            }

            // Check filename match
            const nameMatches = item.name.toLowerCase().includes(pattern.toLowerCase());
            
            if (nameMatches || includeContent) {
              const result = {
                path: item.path,
                name: item.name,
                matches: [] as Array<{ line: number; content: string }>
              };

              // Search file content if requested
              if (includeContent) {
                try {
                  const content = await this.readFile(item.path);
                  const lines = content.split('\n');
                  
                  lines.forEach((line, index) => {
                    if (line.toLowerCase().includes(pattern.toLowerCase())) {
                      result.matches!.push({
                        line: index + 1,
                        content: line.trim()
                      });
                    }
                  });
                } catch (error) {
                  // Skip files that can't be read as text
                }
              }

              if (nameMatches || (result.matches && result.matches.length > 0)) {
                results.push(result);
              }
            }
          }
        }
      };

      await searchInDirectory(dirPath);
      return results;
    } catch (error) {
      throw new Error(`Failed to search files in ${dirPath}: ${(error as Error).message}`);
    }
  }

  cleanup(): void {
    // Close all watchers
    this.watchers.forEach((watcher) => {
      watcher.watcher.close();
    });
    this.watchers.clear();
  }
}
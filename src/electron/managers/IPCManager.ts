/**
 * IPC Manager
 * Handles Inter-Process Communication between main and renderer processes
 */

import { ipcMain, dialog, shell, app, BrowserWindow } from 'electron';
import * as fs from 'fs-extra';
import * as path from 'path';
import { WindowManager } from './WindowManager';
import { FileSystemManager } from './FileSystemManager';

export class IPCManager {
  private windowManager: WindowManager;
  private fileSystemManager: FileSystemManager;

  constructor() {
    this.windowManager = new WindowManager();
    this.fileSystemManager = new FileSystemManager();
  }

  async initialize(): Promise<void> {
    console.log('IPCManager initialized');
  }

  setupHandlers(): void {
    // Window management
    this.setupWindowHandlers();
    
    // File system operations
    this.setupFileSystemHandlers();
    
    // Application operations
    this.setupApplicationHandlers();
    
    // Agent operations
    this.setupAgentHandlers();
    
    // Task operations
    this.setupTaskHandlers();
    
    // System operations
    this.setupSystemHandlers();
  }

  private setupWindowHandlers(): void {
    // Create new window
    ipcMain.handle('window:create', async (event, config) => {
      try {
        const window = await this.windowManager.createChildWindow('main', config);
        return { success: true, windowId: window.id };
      } catch (error) {
        return { success: false, error: (error as Error).message };
      }
    });

    // Close window
    ipcMain.handle('window:close', async (event, windowId) => {
      try {
        this.windowManager.closeWindow(windowId);
        return { success: true };
      } catch (error) {
        return { success: false, error: (error as Error).message };
      }
    });

    // Minimize window
    ipcMain.handle('window:minimize', async (event) => {
      const window = BrowserWindow.fromWebContents(event.sender);
      if (window) {
        window.minimize();
        return { success: true };
      }
      return { success: false, error: 'Window not found' };
    });

    // Maximize/restore window
    ipcMain.handle('window:maximize', async (event) => {
      const window = BrowserWindow.fromWebContents(event.sender);
      if (window) {
        if (window.isMaximized()) {
          window.restore();
        } else {
          window.maximize();
        }
        return { success: true, maximized: window.isMaximized() };
      }
      return { success: false, error: 'Window not found' };
    });

    // Close current window
    ipcMain.handle('window:close-current', async (event) => {
      const window = BrowserWindow.fromWebContents(event.sender);
      if (window) {
        window.close();
        return { success: true };
      }
      return { success: false, error: 'Window not found' };
    });
  }

  private setupFileSystemHandlers(): void {
    // Read file
    ipcMain.handle('fs:read-file', async (event, filePath: string) => {
      try {
        const content = await fs.readFile(filePath, 'utf-8');
        return { success: true, content };
      } catch (error) {
        return { success: false, error: (error as Error).message };
      }
    });

    // Write file
    ipcMain.handle('fs:write-file', async (event, filePath: string, content: string) => {
      try {
        await fs.ensureDir(path.dirname(filePath));
        await fs.writeFile(filePath, content, 'utf-8');
        return { success: true };
      } catch (error) {
        return { success: false, error: (error as Error).message };
      }
    });

    // Delete file
    ipcMain.handle('fs:delete-file', async (event, filePath: string) => {
      try {
        await fs.remove(filePath);
        return { success: true };
      } catch (error) {
        return { success: false, error: (error as Error).message };
      }
    });

    // Create directory
    ipcMain.handle('fs:create-directory', async (event, dirPath: string) => {
      try {
        await fs.ensureDir(dirPath);
        return { success: true };
      } catch (error) {
        return { success: false, error: (error as Error).message };
      }
    });

    // List directory
    ipcMain.handle('fs:list-directory', async (event, dirPath: string) => {
      try {
        const items = await fs.readdir(dirPath, { withFileTypes: true });
        const result = items.map(item => ({
          name: item.name,
          isDirectory: item.isDirectory(),
          isFile: item.isFile(),
          path: path.join(dirPath, item.name)
        }));
        return { success: true, items: result };
      } catch (error) {
        return { success: false, error: (error as Error).message };
      }
    });

    // Watch directory
    ipcMain.handle('fs:watch-directory', async (event, dirPath: string) => {
      try {
        const watcherId = await this.fileSystemManager.watchDirectory(dirPath, (eventType, filename) => {
          event.sender.send('fs:directory-changed', {
            path: dirPath,
            eventType,
            filename
          });
        });
        return { success: true, watcherId };
      } catch (error) {
        return { success: false, error: (error as Error).message };
      }
    });

    // Unwatch directory
    ipcMain.handle('fs:unwatch-directory', async (event, watcherId: string) => {
      try {
        this.fileSystemManager.unwatchDirectory(watcherId);
        return { success: true };
      } catch (error) {
        return { success: false, error: (error as Error).message };
      }
    });

    // Get file stats
    ipcMain.handle('fs:get-stats', async (event, filePath: string) => {
      try {
        const stats = await fs.stat(filePath);
        return {
          success: true,
          stats: {
            size: stats.size,
            isDirectory: stats.isDirectory(),
            isFile: stats.isFile(),
            mtime: stats.mtime,
            ctime: stats.ctime
          }
        };
      } catch (error) {
        return { success: false, error: (error as Error).message };
      }
    });
  }

  private setupApplicationHandlers(): void {
    // Show open dialog
    ipcMain.handle('app:show-open-dialog', async (event, options) => {
      try {
        const result = await dialog.showOpenDialog(options);
        return { success: true, ...result };
      } catch (error) {
        return { success: false, error: (error as Error).message };
      }
    });

    // Show save dialog
    ipcMain.handle('app:show-save-dialog', async (event, options) => {
      try {
        const result = await dialog.showSaveDialog(options);
        return { success: true, ...result };
      } catch (error) {
        return { success: false, error: (error as Error).message };
      }
    });

    // Show message box
    ipcMain.handle('app:show-message-box', async (event, options) => {
      try {
        const result = await dialog.showMessageBox(options);
        return { success: true, ...result };
      } catch (error) {
        return { success: false, error: (error as Error).message };
      }
    });

    // Open external URL
    ipcMain.handle('app:open-external', async (event, url: string) => {
      try {
        await shell.openExternal(url);
        return { success: true };
      } catch (error) {
        return { success: false, error: (error as Error).message };
      }
    });

    // Show item in folder
    ipcMain.handle('app:show-item-in-folder', async (event, filePath: string) => {
      try {
        shell.showItemInFolder(filePath);
        return { success: true };
      } catch (error) {
        return { success: false, error: (error as Error).message };
      }
    });

    // Get app version
    ipcMain.handle('app:get-version', async () => {
      return { success: true, version: app.getVersion() };
    });

    // Get app path
    ipcMain.handle('app:get-path', async (event, name: string) => {
      try {
        const appPath = app.getPath(name as any);
        return { success: true, path: appPath };
      } catch (error) {
        return { success: false, error: (error as Error).message };
      }
    });
  }

  private setupAgentHandlers(): void {
    // Create agent
    ipcMain.handle('agent:create', async (event, config) => {
      try {
        // TODO: Integrate with agent system
        console.log('Creating agent:', config);
        return { success: true, agentId: 'temp-id' };
      } catch (error) {
        return { success: false, error: (error as Error).message };
      }
    });

    // Start agent
    ipcMain.handle('agent:start', async (event, agentId: string) => {
      try {
        // TODO: Integrate with agent system
        console.log('Starting agent:', agentId);
        return { success: true };
      } catch (error) {
        return { success: false, error: (error as Error).message };
      }
    });

    // Stop agent
    ipcMain.handle('agent:stop', async (event, agentId: string) => {
      try {
        // TODO: Integrate with agent system
        console.log('Stopping agent:', agentId);
        return { success: true };
      } catch (error) {
        return { success: false, error: (error as Error).message };
      }
    });

    // Get agent status
    ipcMain.handle('agent:get-status', async (event, agentId: string) => {
      try {
        // TODO: Integrate with agent system
        return { success: true, status: 'idle' };
      } catch (error) {
        return { success: false, error: (error as Error).message };
      }
    });

    // List agents
    ipcMain.handle('agent:list', async () => {
      try {
        // TODO: Integrate with agent system
        return { success: true, agents: [] };
      } catch (error) {
        return { success: false, error: (error as Error).message };
      }
    });
  }

  private setupTaskHandlers(): void {
    // Create task
    ipcMain.handle('task:create', async (event, taskData) => {
      try {
        // TODO: Integrate with task system
        console.log('Creating task:', taskData);
        return { success: true, taskId: 'temp-task-id' };
      } catch (error) {
        return { success: false, error: (error as Error).message };
      }
    });

    // Assign task
    ipcMain.handle('task:assign', async (event, taskId: string, agentId: string) => {
      try {
        // TODO: Integrate with task system
        console.log('Assigning task:', taskId, 'to agent:', agentId);
        return { success: true };
      } catch (error) {
        return { success: false, error: (error as Error).message };
      }
    });

    // Get task status
    ipcMain.handle('task:get-status', async (event, taskId: string) => {
      try {
        // TODO: Integrate with task system
        return { success: true, status: 'pending' };
      } catch (error) {
        return { success: false, error: (error as Error).message };
      }
    });

    // List tasks
    ipcMain.handle('task:list', async () => {
      try {
        // TODO: Integrate with task system
        return { success: true, tasks: [] };
      } catch (error) {
        return { success: false, error: (error as Error).message };
      }
    });
  }

  private setupSystemHandlers(): void {
    // Get system info
    ipcMain.handle('system:get-info', async () => {
      try {
        return {
          success: true,
          info: {
            platform: process.platform,
            arch: process.arch,
            version: process.version,
            nodeVersion: process.versions.node,
            electronVersion: process.versions.electron
          }
        };
      } catch (error) {
        return { success: false, error: (error as Error).message };
      }
    });

    // Execute command
    ipcMain.handle('system:execute-command', async (event, command: string, options?: any) => {
      try {
        // TODO: Implement secure command execution
        console.log('Executing command:', command);
        return { success: true, output: 'Command executed' };
      } catch (error) {
        return { success: false, error: (error as Error).message };
      }
    });

    // Get environment variables
    ipcMain.handle('system:get-env', async (event, key?: string) => {
      try {
        if (key) {
          return { success: true, value: process.env[key] };
        } else {
          return { success: true, env: process.env };
        }
      } catch (error) {
        return { success: false, error: (error as Error).message };
      }
    });
  }
}
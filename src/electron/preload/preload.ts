/**
 * Preload script for Electron
 * Provides secure API bridge between main and renderer processes
 */

import { contextBridge, ipcRenderer } from 'electron';

// Define the API that will be exposed to the renderer process
const electronAPI = {
  // Window operations
  window: {
    minimize: () => ipcRenderer.invoke('window:minimize'),
    maximize: () => ipcRenderer.invoke('window:maximize'),
    close: () => ipcRenderer.invoke('window:close-current'),
    create: (config: any) => ipcRenderer.invoke('window:create', config),
    
    // Window events
    onStateChanged: (callback: (state: any) => void) => {
      ipcRenderer.on('window-state-changed', (event, state) => callback(state));
    },
    onFocusChanged: (callback: (focused: boolean) => void) => {
      ipcRenderer.on('window-focus-changed', (event, data) => callback(data.focused));
    }
  },

  // File system operations
  fs: {
    readFile: (filePath: string) => ipcRenderer.invoke('fs:read-file', filePath),
    writeFile: (filePath: string, content: string) => ipcRenderer.invoke('fs:write-file', filePath, content),
    deleteFile: (filePath: string) => ipcRenderer.invoke('fs:delete-file', filePath),
    createDirectory: (dirPath: string) => ipcRenderer.invoke('fs:create-directory', dirPath),
    listDirectory: (dirPath: string) => ipcRenderer.invoke('fs:list-directory', dirPath),
    getStats: (filePath: string) => ipcRenderer.invoke('fs:get-stats', filePath),
    watchDirectory: (dirPath: string) => ipcRenderer.invoke('fs:watch-directory', dirPath),
    unwatchDirectory: (watcherId: string) => ipcRenderer.invoke('fs:unwatch-directory', watcherId),
    
    // Extended file operations
    copy: (sourcePath: string, destinationPath: string) => ipcRenderer.invoke('fs:copy', sourcePath, destinationPath),
    move: (sourcePath: string, destinationPath: string) => ipcRenderer.invoke('fs:move', sourcePath, destinationPath),
    rename: (oldPath: string, newPath: string) => ipcRenderer.invoke('fs:rename', oldPath, newPath),
    exists: (filePath: string) => ipcRenderer.invoke('fs:exists', filePath),
    getPreview: (filePath: string) => ipcRenderer.invoke('fs:get-preview', filePath),
    search: (dirPath: string, pattern: string, options?: any) => ipcRenderer.invoke('fs:search', dirPath, pattern, options),
    validateName: (fileName: string) => ipcRenderer.invoke('fs:validate-name', fileName),
    createUniqueName: (dirPath: string, baseName: string, extension?: string) => ipcRenderer.invoke('fs:create-unique-name', dirPath, baseName, extension),
    
    // Path utilities
    joinPath: (...paths: string[]) => ipcRenderer.invoke('fs:join-path', ...paths),
    getFileName: (filePath: string) => ipcRenderer.invoke('fs:get-file-name', filePath),
    getDirectoryName: (filePath: string) => ipcRenderer.invoke('fs:get-directory-name', filePath),
    getExtension: (filePath: string) => ipcRenderer.invoke('fs:get-extension', filePath),
    
    // File system events
    onDirectoryChanged: (callback: (data: any) => void) => {
      ipcRenderer.on('fs:directory-changed', (event, data) => callback(data));
    }
  },

  // Application operations
  app: {
    showOpenDialog: (options: any) => ipcRenderer.invoke('app:show-open-dialog', options),
    showSaveDialog: (options: any) => ipcRenderer.invoke('app:show-save-dialog', options),
    showMessageBox: (options: any) => ipcRenderer.invoke('app:show-message-box', options),
    openExternal: (url: string) => ipcRenderer.invoke('app:open-external', url),
    showItemInFolder: (filePath: string) => ipcRenderer.invoke('app:show-item-in-folder', filePath),
    getVersion: () => ipcRenderer.invoke('app:get-version'),
    getPath: (name: string) => ipcRenderer.invoke('app:get-path', name)
  },

  // Agent operations
  agent: {
    create: (config: any) => ipcRenderer.invoke('agent:create', config),
    start: (agentId: string) => ipcRenderer.invoke('agent:start', agentId),
    stop: (agentId: string) => ipcRenderer.invoke('agent:stop', agentId),
    getStatus: (agentId: string) => ipcRenderer.invoke('agent:get-status', agentId),
    list: () => ipcRenderer.invoke('agent:list')
  },

  // Task operations
  task: {
    create: (taskData: any) => ipcRenderer.invoke('task:create', taskData),
    assign: (taskId: string, agentId: string) => ipcRenderer.invoke('task:assign', taskId, agentId),
    getStatus: (taskId: string) => ipcRenderer.invoke('task:get-status', taskId),
    list: () => ipcRenderer.invoke('task:list')
  },

  // System operations
  system: {
    getInfo: () => ipcRenderer.invoke('system:get-info'),
    executeCommand: (command: string, options?: any) => ipcRenderer.invoke('system:execute-command', command, options),
    getEnv: (key?: string) => ipcRenderer.invoke('system:get-env', key)
  },

  // Settings operations
  settings: {
    load: () => ipcRenderer.invoke('settings:load'),
    save: (settings: any) => ipcRenderer.invoke('settings:save', settings),
    export: (filePath: string, settings: any) => ipcRenderer.invoke('settings:export', filePath, settings),
    import: (filePath: string) => ipcRenderer.invoke('settings:import', filePath),
    createBackup: (name: string) => ipcRenderer.invoke('settings:create-backup', name),
    restoreBackup: (backupId: string) => ipcRenderer.invoke('settings:restore-backup', backupId),
    listBackups: () => ipcRenderer.invoke('settings:list-backups'),
    deleteBackup: (backupId: string) => ipcRenderer.invoke('settings:delete-backup', backupId)
  },

  // Update operations
  updates: {
    check: () => ipcRenderer.invoke('updates:check'),
    download: (updateInfo: any) => ipcRenderer.invoke('updates:download', updateInfo),
    install: (updateInfo: any) => ipcRenderer.invoke('updates:install', updateInfo)
  },

  // Dialog operations
  dialog: {
    showOpenDialog: (options: any) => ipcRenderer.invoke('dialog:show-open-dialog', options),
    showSaveDialog: (options: any) => ipcRenderer.invoke('dialog:show-save-dialog', options),
    showMessageBox: (options: any) => ipcRenderer.invoke('dialog:show-message-box', options)
  },

  // Menu and tray events
  onMenuAction: (callback: (action: any) => void) => {
    ipcRenderer.on('menu-action', (event, action) => callback(action));
  },

  onTrayAction: (callback: (action: any) => void) => {
    ipcRenderer.on('tray-action', (event, action) => callback(action));
  },

  // Utility functions
  removeAllListeners: (channel: string) => {
    ipcRenderer.removeAllListeners(channel);
  },

  // Development helpers
  isDevelopment: process.env.NODE_ENV === 'development'
};

// Expose the API to the renderer process
contextBridge.exposeInMainWorld('electronAPI', electronAPI);

// Type definitions for TypeScript
export type ElectronAPI = typeof electronAPI;
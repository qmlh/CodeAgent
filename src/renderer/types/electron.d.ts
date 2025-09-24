/**
 * Electron API Type Definitions
 */

export interface ElectronAPI {
  fs: {
    // File operations
    readFile: (filePath: string) => Promise<{ success: boolean; content?: string; error?: string }>;
    writeFile: (filePath: string, content: string) => Promise<{ success: boolean; error?: string }>;
    deleteFile: (filePath: string) => Promise<{ success: boolean; error?: string }>;
    copy: (sourcePath: string, targetPath: string) => Promise<{ success: boolean; error?: string }>;
    move: (sourcePath: string, targetPath: string) => Promise<{ success: boolean; error?: string }>;
    rename: (oldPath: string, newPath: string) => Promise<{ success: boolean; error?: string }>;
    
    // Directory operations
    listDirectory: (dirPath: string) => Promise<{ success: boolean; items?: any[]; error?: string }>;
    createDirectory: (dirPath: string) => Promise<{ success: boolean; error?: string }>;
    
    // File info
    exists: (filePath: string) => Promise<{ success: boolean; exists?: boolean; error?: string }>;
    getStats: (filePath: string) => Promise<{ success: boolean; stats?: any; error?: string }>;
    getFileName: (filePath: string) => Promise<{ success: boolean; fileName?: string; error?: string }>;
    getDirectoryName: (filePath: string) => Promise<{ success: boolean; dirName?: string; error?: string }>;
    joinPath: (basePath: string, ...paths: string[]) => Promise<{ success: boolean; path?: string; error?: string }>;
    
    // File validation
    validateName: (fileName: string) => Promise<{ success: boolean; validation?: { valid: boolean; error?: string }; error?: string }>;
    
    // File preview
    getPreview: (filePath: string) => Promise<{ success: boolean; preview?: any; error?: string }>;
    
    // File watching
    watchDirectory: (dirPath: string) => Promise<{ success: boolean; watcherId?: string; error?: string }>;
    unwatchDirectory: (watcherId: string) => Promise<{ success: boolean; error?: string }>;
    onDirectoryChanged: (callback: (data: any) => void) => void;
    
    // Search
    search: (workspacePath: string, query: string, options?: any) => Promise<{ success: boolean; results?: any[]; error?: string }>;
  };
  
  app: {
    // Dialog operations
    showOpenDialog: (options: any) => Promise<{ success: boolean; canceled?: boolean; filePaths?: string[]; error?: string }>;
    showSaveDialog: (options: any) => Promise<{ success: boolean; canceled?: boolean; filePath?: string; error?: string }>;
    showMessageBox: (options: any) => Promise<{ success: boolean; response?: number; error?: string }>;
    
    // System operations
    showItemInFolder: (filePath: string) => Promise<{ success: boolean; error?: string }>;
  };
  
  // Event listeners
  removeAllListeners: (event: string) => void;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}

export {};
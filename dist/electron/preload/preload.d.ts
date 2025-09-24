/**
 * Preload script for Electron
 * Provides secure API bridge between main and renderer processes
 */
declare const electronAPI: {
    window: {
        minimize: () => Promise<any>;
        maximize: () => Promise<any>;
        close: () => Promise<any>;
        create: (config: any) => Promise<any>;
        onStateChanged: (callback: (state: any) => void) => void;
        onFocusChanged: (callback: (focused: boolean) => void) => void;
    };
    fs: {
        readFile: (filePath: string) => Promise<any>;
        writeFile: (filePath: string, content: string) => Promise<any>;
        deleteFile: (filePath: string) => Promise<any>;
        createDirectory: (dirPath: string) => Promise<any>;
        listDirectory: (dirPath: string) => Promise<any>;
        getStats: (filePath: string) => Promise<any>;
        watchDirectory: (dirPath: string) => Promise<any>;
        unwatchDirectory: (watcherId: string) => Promise<any>;
        copy: (sourcePath: string, destinationPath: string) => Promise<any>;
        move: (sourcePath: string, destinationPath: string) => Promise<any>;
        rename: (oldPath: string, newPath: string) => Promise<any>;
        exists: (filePath: string) => Promise<any>;
        getPreview: (filePath: string) => Promise<any>;
        search: (dirPath: string, pattern: string, options?: any) => Promise<any>;
        validateName: (fileName: string) => Promise<any>;
        createUniqueName: (dirPath: string, baseName: string, extension?: string) => Promise<any>;
        joinPath: (...paths: string[]) => Promise<any>;
        getFileName: (filePath: string) => Promise<any>;
        getDirectoryName: (filePath: string) => Promise<any>;
        getExtension: (filePath: string) => Promise<any>;
        onDirectoryChanged: (callback: (data: any) => void) => void;
    };
    app: {
        showOpenDialog: (options: any) => Promise<any>;
        showSaveDialog: (options: any) => Promise<any>;
        showMessageBox: (options: any) => Promise<any>;
        openExternal: (url: string) => Promise<any>;
        showItemInFolder: (filePath: string) => Promise<any>;
        getVersion: () => Promise<any>;
        getPath: (name: string) => Promise<any>;
    };
    agent: {
        create: (config: any) => Promise<any>;
        start: (agentId: string) => Promise<any>;
        stop: (agentId: string) => Promise<any>;
        getStatus: (agentId: string) => Promise<any>;
        list: () => Promise<any>;
    };
    task: {
        create: (taskData: any) => Promise<any>;
        assign: (taskId: string, agentId: string) => Promise<any>;
        getStatus: (taskId: string) => Promise<any>;
        list: () => Promise<any>;
    };
    system: {
        getInfo: () => Promise<any>;
        executeCommand: (command: string, options?: any) => Promise<any>;
        getEnv: (key?: string) => Promise<any>;
    };
    onMenuAction: (callback: (action: any) => void) => void;
    onTrayAction: (callback: (action: any) => void) => void;
    removeAllListeners: (channel: string) => void;
    isDevelopment: boolean;
};
export type ElectronAPI = typeof electronAPI;
export {};

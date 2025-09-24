/**
 * IPC Manager
 * Handles Inter-Process Communication between main and renderer processes
 */
export declare class IPCManager {
    private windowManager;
    private fileSystemManager;
    constructor();
    initialize(): Promise<void>;
    setupHandlers(): void;
    private setupWindowHandlers;
    private setupFileSystemHandlers;
    private setupApplicationHandlers;
    private setupAgentHandlers;
    private setupTaskHandlers;
    private setupSystemHandlers;
}

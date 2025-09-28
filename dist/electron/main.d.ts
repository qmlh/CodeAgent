/**
 * Enhanced Electron Main Process
 * Handles application lifecycle with optimized startup and advanced features
 */
declare class ElectronApp {
    private startupManager;
    private isDevelopment;
    constructor();
    initialize(): Promise<void>;
    private configureApp;
    private setupAppEvents;
    private onWindowAllClosed;
    private onActivate;
    private onBeforeQuit;
    private onWebContentsCreated;
}
export { ElectronApp };

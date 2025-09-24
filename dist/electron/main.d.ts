/**
 * Electron Main Process
 * Handles application lifecycle, window management, and system integration
 */
declare class ElectronApp {
    private windowManager;
    private menuManager;
    private trayManager;
    private ipcManager;
    private fileSystemManager;
    private isDevelopment;
    constructor();
    initialize(): Promise<void>;
    private configureApp;
    private setupAppEvents;
    private onAppReady;
    private onWindowAllClosed;
    private onActivate;
    private onBeforeQuit;
    private onWebContentsCreated;
    private initializeManagers;
    private setupAutoUpdater;
}
export { ElectronApp };

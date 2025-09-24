/**
 * Tray Manager
 * Handles system tray icon and menu
 */
export declare class TrayManager {
    private tray;
    private windowManager;
    constructor();
    initialize(): Promise<void>;
    createTray(): void;
    updateTrayIcon(status: 'idle' | 'working' | 'error'): void;
    updateTrayTooltip(tooltip: string): void;
    showNotification(title: string, body: string): void;
    cleanup(): void;
    private setupTrayMenu;
    private setupTrayEvents;
    private toggleMainWindow;
    private showMainWindow;
    private getTrayIconPath;
    private handleStartAllAgents;
    private handleStopAllAgents;
    private handleNewProject;
    private handleOpenProjet;
    private handleOpenProject;
    private handleCreateAgent;
    private handleCreateTask;
    private handleSettings;
    private handleAbout;
}

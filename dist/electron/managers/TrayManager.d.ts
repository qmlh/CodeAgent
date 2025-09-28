/**
 * Tray Manager
 * Handles system tray icon and menu
 */
export interface TrayNotificationCount {
    agents: number;
    tasks: number;
    errors: number;
    total: number;
}
export declare class TrayManager {
    private tray;
    private windowManager;
    private notificationCount;
    private statusIndicator;
    private quickActions;
    constructor();
    initialize(): Promise<void>;
    createTray(): void;
    updateTrayIcon(status: 'idle' | 'working' | 'error' | 'offline'): void;
    updateTrayTooltip(tooltip: string): void;
    showNotification(title: string, body: string): void;
    cleanup(): void;
    updateNotificationCount(counts: Partial<TrayNotificationCount>): void;
    updateStatusIndicator(status: 'idle' | 'working' | 'error' | 'offline'): void;
    updateQuickActions(actions: Array<{
        label: string;
        action: string;
        enabled: boolean;
    }>): void;
    private updateTrayDisplay;
    private getStatusTooltip;
    private setupTrayMenu;
    private getStatusLabel;
    private getNotificationLabel;
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
    private handleQuickAction;
    private handleAgentDashboard;
    private handleViewNotifications;
    private handleClearNotifications;
}

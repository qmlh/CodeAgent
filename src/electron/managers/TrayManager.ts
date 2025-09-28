/**
 * Tray Manager
 * Handles system tray icon and menu
 */

import { Tray, Menu, nativeImage, app, BrowserWindow } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { WindowManager } from './WindowManager';
import { getAssetPath, assetExists } from '../utils/assetPaths';

export interface TrayNotificationCount {
  agents: number;
  tasks: number;
  errors: number;
  total: number;
}

export class TrayManager {
  private tray: Tray | null = null;
  private windowManager: WindowManager;
  private notificationCount: TrayNotificationCount;
  private statusIndicator: 'idle' | 'working' | 'error' | 'offline';
  private quickActions: Array<{ label: string; action: string; enabled: boolean }>;

  constructor() {
    this.windowManager = new WindowManager();
    this.notificationCount = { agents: 0, tasks: 0, errors: 0, total: 0 };
    this.statusIndicator = 'idle';
    this.quickActions = [
      { label: 'New Project', action: 'new-project', enabled: true },
      { label: 'Open Project', action: 'open-project', enabled: true },
      { label: 'Create Agent', action: 'create-agent', enabled: true },
      { label: 'Create Task', action: 'create-task', enabled: true }
    ];
  }

  async initialize(): Promise<void> {
    try {
      console.log('TrayManager initialized');
    } catch (error) {
      console.error('Failed to initialize TrayManager:', error);
      throw error;
    }
  }

  createTray(): void {
    const iconPath = this.getTrayIconPath();
    if (!iconPath) {
      console.warn('Cannot create system tray: No tray icon found. Please ensure tray icon assets are available in the assets/icons directory.');
      console.warn('Expected tray icon locations:');
      console.warn(`  - Windows: assets/icons/tray-icon.ico`);
      console.warn(`  - macOS/Linux: assets/icons/tray-icon.png`);
      return;
    }

    try {
      this.tray = new Tray(iconPath);
      this.setupTrayMenu();
      this.setupTrayEvents();
      console.log('System tray created successfully');
    } catch (error) {
      console.warn('Failed to create system tray:', error);
      this.tray = null;
    }
  }

  updateTrayIcon(status: 'idle' | 'working' | 'error' | 'offline'): void {
    if (!this.tray) return;

    const iconPath = this.getTrayIconPath(status);
    if (iconPath) {
      try {
        this.tray.setImage(iconPath);
      } catch (error) {
        console.warn(`Failed to update tray icon to status '${status}':`, error);
      }
    } else {
      console.warn(`Status-specific tray icon for '${status}' not found, keeping current icon`);
    }
  }

  updateTrayTooltip(tooltip: string): void {
    if (this.tray) {
      this.tray.setToolTip(tooltip);
    }
  }

  showNotification(title: string, body: string): void {
    if (!this.tray) return;

    try {
      this.tray.displayBalloon({
        title,
        content: body,
        icon: this.getTrayIconPath() || undefined
      });
    } catch (error) {
      console.warn('Failed to show tray notification:', error);
    }
  }

  cleanup(): void {
    if (this.tray) {
      this.tray.destroy();
      this.tray = null;
    }
  }

  updateNotificationCount(counts: Partial<TrayNotificationCount>): void {
    this.notificationCount = { ...this.notificationCount, ...counts };
    this.notificationCount.total = 
      this.notificationCount.agents + 
      this.notificationCount.tasks + 
      this.notificationCount.errors;
    
    this.updateTrayDisplay();
  }

  updateStatusIndicator(status: 'idle' | 'working' | 'error' | 'offline'): void {
    this.statusIndicator = status;
    this.updateTrayIcon(status);
    this.updateTrayTooltip(this.getStatusTooltip());
    this.setupTrayMenu(); // Refresh menu with new status
  }

  updateQuickActions(actions: Array<{ label: string; action: string; enabled: boolean }>): void {
    this.quickActions = actions;
    this.setupTrayMenu(); // Refresh menu with new actions
  }

  private updateTrayDisplay(): void {
    if (!this.tray) return;

    // Update tooltip with notification count
    const tooltip = this.getStatusTooltip();
    this.tray.setToolTip(tooltip);

    // Update context menu to show notification counts
    this.setupTrayMenu();
  }

  private getStatusTooltip(): string {
    let tooltip = `Multi-Agent IDE - ${this.statusIndicator.charAt(0).toUpperCase() + this.statusIndicator.slice(1)}`;
    
    if (this.notificationCount.total > 0) {
      const parts = [];
      if (this.notificationCount.agents > 0) parts.push(`${this.notificationCount.agents} agent alerts`);
      if (this.notificationCount.tasks > 0) parts.push(`${this.notificationCount.tasks} task updates`);
      if (this.notificationCount.errors > 0) parts.push(`${this.notificationCount.errors} errors`);
      
      tooltip += `\n${parts.join(', ')}`;
    }
    
    return tooltip;
  }

  private setupTrayMenu(): void {
    if (!this.tray) return;

    const statusLabel = this.getStatusLabel();
    const notificationLabel = this.getNotificationLabel();

    const contextMenu = Menu.buildFromTemplate([
      {
        label: 'Multi-Agent IDE',
        type: 'normal',
        enabled: false
      },
      {
        label: statusLabel,
        type: 'normal',
        enabled: false
      },
      ...(notificationLabel ? [{
        label: notificationLabel,
        type: 'normal' as const,
        enabled: false
      }] : []),
      {
        type: 'separator'
      },
      {
        label: 'Show/Hide Window',
        type: 'normal',
        click: () => this.toggleMainWindow()
      },
      {
        type: 'separator'
      },
      {
        label: 'Agent Status',
        type: 'submenu',
        submenu: [
          {
            label: `Status: ${this.statusIndicator}`,
            type: 'normal',
            enabled: false
          },
          {
            type: 'separator'
          },
          {
            label: 'Start All Agents',
            type: 'normal',
            enabled: this.statusIndicator !== 'working',
            click: () => this.handleStartAllAgents()
          },
          {
            label: 'Stop All Agents',
            type: 'normal',
            enabled: this.statusIndicator === 'working',
            click: () => this.handleStopAllAgents()
          },
          {
            type: 'separator'
          },
          {
            label: 'Agent Dashboard',
            type: 'normal',
            click: () => this.handleAgentDashboard()
          }
        ]
      },
      {
        label: 'Quick Actions',
        type: 'submenu',
        submenu: this.quickActions.map(action => ({
          label: action.label,
          type: 'normal' as const,
          enabled: action.enabled,
          click: () => this.handleQuickAction(action.action)
        }))
      },
      {
        label: 'Notifications',
        type: 'submenu',
        submenu: [
          {
            label: `Total: ${this.notificationCount.total}`,
            type: 'normal',
            enabled: false
          },
          {
            type: 'separator'
          },
          {
            label: `Agent Alerts: ${this.notificationCount.agents}`,
            type: 'normal',
            enabled: this.notificationCount.agents > 0,
            click: () => this.handleViewNotifications('agents')
          },
          {
            label: `Task Updates: ${this.notificationCount.tasks}`,
            type: 'normal',
            enabled: this.notificationCount.tasks > 0,
            click: () => this.handleViewNotifications('tasks')
          },
          {
            label: `Errors: ${this.notificationCount.errors}`,
            type: 'normal',
            enabled: this.notificationCount.errors > 0,
            click: () => this.handleViewNotifications('errors')
          },
          {
            type: 'separator'
          },
          {
            label: 'Clear All Notifications',
            type: 'normal',
            enabled: this.notificationCount.total > 0,
            click: () => this.handleClearNotifications()
          }
        ]
      },
      {
        type: 'separator'
      },
      {
        label: 'Settings',
        type: 'normal',
        click: () => this.handleSettings()
      },
      {
        label: 'About',
        type: 'normal',
        click: () => this.handleAbout()
      },
      {
        type: 'separator'
      },
      {
        label: 'Quit',
        type: 'normal',
        click: () => app.quit()
      }
    ]);

    this.tray.setContextMenu(contextMenu);
  }

  private getStatusLabel(): string {
    const statusEmojis = {
      idle: '⚪',
      working: '🟢',
      error: '🔴',
      offline: '⚫'
    };
    
    return `${statusEmojis[this.statusIndicator]} Status: ${this.statusIndicator.charAt(0).toUpperCase() + this.statusIndicator.slice(1)}`;
  }

  private getNotificationLabel(): string | null {
    if (this.notificationCount.total === 0) return null;
    
    return `🔔 ${this.notificationCount.total} notification${this.notificationCount.total === 1 ? '' : 's'}`;
  }

  private setupTrayEvents(): void {
    if (!this.tray) return;

    try {
      // Double-click to show/hide main window
      this.tray.on('double-click', () => {
        try {
          this.toggleMainWindow();
        } catch (error) {
          console.error('Error handling tray double-click:', error);
        }
      });

      // Right-click shows context menu (handled automatically)
      this.tray.on('right-click', () => {
        try {
          // Context menu is shown automatically
        } catch (error) {
          console.error('Error handling tray right-click:', error);
        }
      });

      // Balloon clicked
      this.tray.on('balloon-click', () => {
        try {
          this.showMainWindow();
        } catch (error) {
          console.error('Error handling tray balloon-click:', error);
        }
      });
    } catch (error) {
      console.error('Failed to setup tray events:', error);
    }
  }

  private toggleMainWindow(): void {
    try {
      const mainWindow = this.windowManager.getMainWindow();
      
      if (!mainWindow) {
        this.windowManager.createMainWindow().catch(error => {
          console.error('Failed to create main window from tray:', error);
        });
        return;
      }

      if (mainWindow.isVisible()) {
        if (mainWindow.isFocused()) {
          mainWindow.hide();
        } else {
          mainWindow.focus();
        }
      } else {
        mainWindow.show();
        mainWindow.focus();
      }
    } catch (error) {
      console.error('Failed to toggle main window:', error);
    }
  }

  private showMainWindow(): void {
    try {
      const mainWindow = this.windowManager.getMainWindow();
      
      if (!mainWindow) {
        this.windowManager.createMainWindow().catch(error => {
          console.error('Failed to create main window from tray:', error);
        });
        return;
      }

      if (!mainWindow.isVisible()) {
        mainWindow.show();
      }
      
      mainWindow.focus();
    } catch (error) {
      console.error('Failed to show main window:', error);
    }
  }

  private getTrayIconPath(status?: 'idle' | 'working' | 'error' | 'offline'): string | null {
    try {
      let iconName = 'tray-icon';
      
      if (status) {
        iconName += `-${status}`;
      }

      // Platform-specific icon extensions
      const extension = process.platform === 'win32' ? '.ico' : '.png';
      const iconAssetPath = `icons/${iconName}${extension}`;
      
      // Check if file exists before returning path
      if (assetExists(iconAssetPath)) {
        return getAssetPath(iconAssetPath);
      } else {
        const iconPath = getAssetPath(iconAssetPath);
        console.warn(`Tray icon not found at path: ${iconPath}`);
        
        // Try fallback to base tray icon if status-specific icon is missing
        if (status) {
          const fallbackAssetPath = `icons/tray-icon${extension}`;
          if (assetExists(fallbackAssetPath)) {
            const fallbackIconPath = getAssetPath(fallbackAssetPath);
            console.warn(`Using fallback tray icon: ${fallbackIconPath}`);
            return fallbackIconPath;
          }
        }
        
        return null;
      }
    } catch (error) {
      console.warn('Error accessing tray icon:', error);
      return null;
    }
  }

  // Action handlers
  private handleStartAllAgents(): void {
    const mainWindow = this.windowManager.getMainWindow();
    if (mainWindow) {
      mainWindow.webContents.send('tray-action', { action: 'start-all-agents' });
    }
  }

  private handleStopAllAgents(): void {
    const mainWindow = this.windowManager.getMainWindow();
    if (mainWindow) {
      mainWindow.webContents.send('tray-action', { action: 'stop-all-agents' });
    }
  }

  private handleNewProject(): void {
    const mainWindow = this.windowManager.getMainWindow();
    if (mainWindow) {
      mainWindow.webContents.send('tray-action', { action: 'new-project' });
      this.showMainWindow();
    }
  }

  private handleOpenProjet(): void {
    try {
      const mainWindow = this.windowManager.getMainWindow();
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('tray-action', { action: 'new-project' });
        this.showMainWindow();
      }
    } catch (error) {
      console.error('Failed to handle new project action:', error);
    }
  }

  private handleOpenProject(): void {
    try {
      const mainWindow = this.windowManager.getMainWindow();
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('tray-action', { action: 'open-project' });
        this.showMainWindow();
      }
    } catch (error) {
      console.error('Failed to handle open project action:', error);
    }
  }

  private handleCreateAgent(): void {
    try {
      const mainWindow = this.windowManager.getMainWindow();
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('tray-action', { action: 'create-agent' });
        this.showMainWindow();
      }
    } catch (error) {
      console.error('Failed to handle create agent action:', error);
    }
  }

  private handleCreateTask(): void {
    try {
      const mainWindow = this.windowManager.getMainWindow();
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('tray-action', { action: 'create-task' });
        this.showMainWindow();
      }
    } catch (error) {
      console.error('Failed to handle create task action:', error);
    }
  }

  private handleSettings(): void {
    try {
      const mainWindow = this.windowManager.getMainWindow();
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('tray-action', { action: 'settings' });
        this.showMainWindow();
      }
    } catch (error) {
      console.error('Failed to handle settings action:', error);
    }
  }

  private handleAbout(): void {
    try {
      const mainWindow = this.windowManager.getMainWindow();
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('tray-action', { action: 'about' });
        this.showMainWindow();
      }
    } catch (error) {
      console.error('Failed to handle about action:', error);
    }
  }

  private handleQuickAction(action: string): void {
    try {
      const mainWindow = this.windowManager.getMainWindow();
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('tray-action', { action });
        this.showMainWindow();
      }
    } catch (error) {
      console.error(`Failed to handle quick action ${action}:`, error);
    }
  }

  private handleAgentDashboard(): void {
    try {
      const mainWindow = this.windowManager.getMainWindow();
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('tray-action', { action: 'agent-dashboard' });
        this.showMainWindow();
      }
    } catch (error) {
      console.error('Failed to handle agent dashboard action:', error);
    }
  }

  private handleViewNotifications(type: 'agents' | 'tasks' | 'errors'): void {
    try {
      const mainWindow = this.windowManager.getMainWindow();
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('tray-action', { action: 'view-notifications', type });
        this.showMainWindow();
      }
    } catch (error) {
      console.error(`Failed to handle view notifications action for ${type}:`, error);
    }
  }

  private handleClearNotifications(): void {
    try {
      this.updateNotificationCount({ agents: 0, tasks: 0, errors: 0, total: 0 });
      
      const mainWindow = this.windowManager.getMainWindow();
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('tray-action', { action: 'clear-notifications' });
      }
    } catch (error) {
      console.error('Failed to handle clear notifications action:', error);
    }
  }
}
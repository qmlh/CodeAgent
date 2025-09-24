/**
 * Tray Manager
 * Handles system tray icon and menu
 */

import { Tray, Menu, nativeImage, app, BrowserWindow } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { WindowManager } from './WindowManager';
import { getAssetPath, assetExists } from '../utils/assetPaths';

export class TrayManager {
  private tray: Tray | null = null;
  private windowManager: WindowManager;

  constructor() {
    this.windowManager = new WindowManager();
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

  updateTrayIcon(status: 'idle' | 'working' | 'error'): void {
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

  private setupTrayMenu(): void {
    if (!this.tray) return;

    const contextMenu = Menu.buildFromTemplate([
      {
        label: 'Multi-Agent IDE',
        type: 'normal',
        enabled: false
      },
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
            label: 'All Agents Idle',
            type: 'normal',
            enabled: false
          },
          {
            type: 'separator'
          },
          {
            label: 'Start All Agents',
            type: 'normal',
            click: () => this.handleStartAllAgents()
          },
          {
            label: 'Stop All Agents',
            type: 'normal',
            click: () => this.handleStopAllAgents()
          }
        ]
      },
      {
        label: 'Quick Actions',
        type: 'submenu',
        submenu: [
          {
            label: 'New Project',
            type: 'normal',
            click: () => this.handleNewProject()
          },
          {
            label: 'Open Project',
            type: 'normal',
            click: () => this.handleOpenProject()
          },
          {
            type: 'separator'
          },
          {
            label: 'Create Agent',
            type: 'normal',
            click: () => this.handleCreateAgent()
          },
          {
            label: 'Create Task',
            type: 'normal',
            click: () => this.handleCreateTask()
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

  private getTrayIconPath(status?: 'idle' | 'working' | 'error'): string | null {
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
}
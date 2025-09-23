/**
 * Tray Manager
 * Handles system tray icon and menu
 */

import { Tray, Menu, nativeImage, app, BrowserWindow } from 'electron';
import * as path from 'path';
import { WindowManager } from './WindowManager';

export class TrayManager {
  private tray: Tray | null = null;
  private windowManager: WindowManager;

  constructor() {
    this.windowManager = new WindowManager();
  }

  async initialize(): Promise<void> {
    console.log('TrayManager initialized');
  }

  createTray(): void {
    const iconPath = this.getTrayIconPath();
    if (!iconPath) {
      console.warn('Tray icon not found, skipping tray creation');
      return;
    }

    this.tray = new Tray(iconPath);
    this.setupTrayMenu();
    this.setupTrayEvents();
  }

  updateTrayIcon(status: 'idle' | 'working' | 'error'): void {
    if (!this.tray) return;

    const iconPath = this.getTrayIconPath(status);
    if (iconPath) {
      this.tray.setImage(iconPath);
    }
  }

  updateTrayTooltip(tooltip: string): void {
    if (this.tray) {
      this.tray.setToolTip(tooltip);
    }
  }

  showNotification(title: string, body: string): void {
    if (this.tray) {
      this.tray.displayBalloon({
        title,
        content: body,
        icon: this.getTrayIconPath() || undefined
      });
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

    // Double-click to show/hide main window
    this.tray.on('double-click', () => {
      this.toggleMainWindow();
    });

    // Right-click shows context menu (handled automatically)
    this.tray.on('right-click', () => {
      // Context menu is shown automatically
    });

    // Balloon clicked
    this.tray.on('balloon-click', () => {
      this.showMainWindow();
    });
  }

  private toggleMainWindow(): void {
    const mainWindow = this.windowManager.getMainWindow();
    
    if (!mainWindow) {
      this.windowManager.createMainWindow();
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
  }

  private showMainWindow(): void {
    const mainWindow = this.windowManager.getMainWindow();
    
    if (!mainWindow) {
      this.windowManager.createMainWindow();
      return;
    }

    if (!mainWindow.isVisible()) {
      mainWindow.show();
    }
    
    mainWindow.focus();
  }

  private getTrayIconPath(status?: 'idle' | 'working' | 'error'): string | null {
    try {
      let iconName = 'tray-icon';
      
      if (status) {
        iconName += `-${status}`;
      }

      // Platform-specific icon extensions
      const extension = process.platform === 'win32' ? '.ico' : '.png';
      const iconPath = path.join(__dirname, `../../assets/icons/${iconName}${extension}`);
      
      return iconPath;
    } catch (error) {
      console.warn('Tray icon not found:', error);
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

  private handleOpenProject(): void {
    const mainWindow = this.windowManager.getMainWindow();
    if (mainWindow) {
      mainWindow.webContents.send('tray-action', { action: 'open-project' });
      this.showMainWindow();
    }
  }

  private handleCreateAgent(): void {
    const mainWindow = this.windowManager.getMainWindow();
    if (mainWindow) {
      mainWindow.webContents.send('tray-action', { action: 'create-agent' });
      this.showMainWindow();
    }
  }

  private handleCreateTask(): void {
    const mainWindow = this.windowManager.getMainWindow();
    if (mainWindow) {
      mainWindow.webContents.send('tray-action', { action: 'create-task' });
      this.showMainWindow();
    }
  }

  private handleSettings(): void {
    const mainWindow = this.windowManager.getMainWindow();
    if (mainWindow) {
      mainWindow.webContents.send('tray-action', { action: 'settings' });
      this.showMainWindow();
    }
  }

  private handleAbout(): void {
    const mainWindow = this.windowManager.getMainWindow();
    if (mainWindow) {
      mainWindow.webContents.send('tray-action', { action: 'about' });
      this.showMainWindow();
    }
  }
}
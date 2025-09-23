/**
 * Window Manager
 * Handles creation and management of application windows
 */

import { BrowserWindow, screen, nativeImage } from 'electron';
import * as path from 'path';
import { WindowConfig, WindowState } from '../types/window.types';

export class WindowManager {
  private mainWindow: BrowserWindow | null = null;
  private windows: Map<string, BrowserWindow> = new Map();
  private isDevelopment: boolean;

  constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development';
  }

  async initialize(): Promise<void> {
    console.log('WindowManager initialized');
  }

  async createMainWindow(): Promise<BrowserWindow> {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.focus();
      return this.mainWindow;
    }

    const { width, height } = screen.getPrimaryDisplay().workAreaSize;
    
    const windowConfig: WindowConfig = {
      width: Math.min(1400, width * 0.9),
      height: Math.min(900, height * 0.9),
      minWidth: 1000,
      minHeight: 700,
      show: false,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        enableRemoteModule: false,
        preload: path.join(__dirname, './preload.js'),
        webSecurity: !this.isDevelopment,
        allowRunningInsecureContent: this.isDevelopment
      },
      titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
      icon: this.getAppIcon()
    };

    this.mainWindow = new BrowserWindow(windowConfig);
    this.windows.set('main', this.mainWindow);

    // Load the application
    await this.loadApplication(this.mainWindow);

    // Set up window events
    this.setupWindowEvents(this.mainWindow);

    // Show window when ready
    this.mainWindow.once('ready-to-show', () => {
      if (this.mainWindow) {
        this.mainWindow.show();
        
        if (this.isDevelopment) {
          this.mainWindow.webContents.openDevTools();
        }
      }
    });

    return this.mainWindow;
  }

  async createChildWindow(
    parentId: string,
    config: Partial<WindowConfig>
  ): Promise<BrowserWindow> {
    const parent = this.windows.get(parentId);
    
    const childWindow = new BrowserWindow({
      width: 800,
      height: 600,
      parent: parent || undefined,
      modal: config.modal || false,
      show: false,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(__dirname, './preload.js')
      },
      ...config
    });

    const windowId = `child-${Date.now()}`;
    this.windows.set(windowId, childWindow);

    // Set up window events
    this.setupWindowEvents(childWindow, windowId);

    return childWindow;
  }

  getMainWindow(): BrowserWindow | null {
    return this.mainWindow;
  }

  getWindow(id: string): BrowserWindow | undefined {
    return this.windows.get(id);
  }

  getAllWindows(): BrowserWindow[] {
    return Array.from(this.windows.values());
  }

  closeWindow(id: string): void {
    const window = this.windows.get(id);
    if (window && !window.isDestroyed()) {
      window.close();
    }
  }

  closeAllWindows(): void {
    this.windows.forEach((window, id) => {
      if (!window.isDestroyed()) {
        window.close();
      }
    });
  }

  saveWindowState(window: BrowserWindow): WindowState {
    const bounds = window.getBounds();
    const isMaximized = window.isMaximized();
    const isFullScreen = window.isFullScreen();

    return {
      x: bounds.x,
      y: bounds.y,
      width: bounds.width,
      height: bounds.height,
      isMaximized,
      isFullScreen
    };
  }

  restoreWindowState(window: BrowserWindow, state: WindowState): void {
    if (state.isMaximized) {
      window.maximize();
    } else if (state.isFullScreen) {
      window.setFullScreen(true);
    } else {
      window.setBounds({
        x: state.x,
        y: state.y,
        width: state.width,
        height: state.height
      });
    }
  }

  private async loadApplication(window: BrowserWindow): Promise<void> {
    if (this.isDevelopment) {
      // Development: Load from dev server
      await window.loadURL('http://localhost:3000');
    } else {
      // Production: Load from built files
      await window.loadFile(path.join(__dirname, '../renderer/index.html'));
    }
  }

  private setupWindowEvents(window: BrowserWindow, windowId?: string): void {
    // Window closed event
    window.on('closed', () => {
      if (windowId) {
        this.windows.delete(windowId);
      } else if (window === this.mainWindow) {
        this.mainWindow = null;
      }
    });

    // Window state events
    window.on('maximize', () => {
      window.webContents.send('window-state-changed', { maximized: true });
    });

    window.on('unmaximize', () => {
      window.webContents.send('window-state-changed', { maximized: false });
    });

    window.on('enter-full-screen', () => {
      window.webContents.send('window-state-changed', { fullscreen: true });
    });

    window.on('leave-full-screen', () => {
      window.webContents.send('window-state-changed', { fullscreen: false });
    });

    // Focus events
    window.on('focus', () => {
      window.webContents.send('window-focus-changed', { focused: true });
    });

    window.on('blur', () => {
      window.webContents.send('window-focus-changed', { focused: false });
    });
  }

  private getAppIcon(): nativeImage | undefined {
    try {
      const iconPath = path.join(__dirname, '../../assets/icons/app-icon.png');
      return nativeImage.createFromPath(iconPath);
    } catch (error) {
      console.warn('App icon not found:', error);
      return undefined;
    }
  }
}
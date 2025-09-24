/**
 * Window Manager
 * Handles creation and management of application windows
 */

import { BrowserWindow, screen, nativeImage } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { WindowConfig, WindowState } from '../types/window.types';
import { getAssetPath, assetExists } from '../utils/assetPaths';

export class WindowManager {
  private mainWindow: BrowserWindow | null = null;
  private windows: Map<string, BrowserWindow> = new Map();
  private isDevelopment: boolean;

  constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development';
  }

  async initialize(): Promise<void> {
    try {
      console.log('WindowManager initialized');
    } catch (error) {
      console.error('Failed to initialize WindowManager:', error);
      throw error;
    }
  }

  async createMainWindow(): Promise<BrowserWindow> {
    try {
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

          preload: path.join(__dirname, './preload.js'),
          webSecurity: !this.isDevelopment,
          allowRunningInsecureContent: this.isDevelopment
        },
        titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
        icon: this.getAppIcon()
      };

      this.mainWindow = new BrowserWindow(windowConfig);
      this.windows.set('main', this.mainWindow);

      // Load the application with error handling
      try {
        await this.loadApplication(this.mainWindow);
      } catch (loadError) {
        console.error('Failed to load application in main window:', loadError);
        // Don't throw here - window can still be useful even if loading fails
      }

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
    } catch (error) {
      console.error('Failed to create main window:', error);
      // Clean up if window creation failed
      if (this.mainWindow && !this.mainWindow.isDestroyed()) {
        this.mainWindow.destroy();
        this.mainWindow = null;
      }
      throw error;
    }
  }

  async createChildWindow(
    parentId: string,
    config: Partial<WindowConfig>
  ): Promise<BrowserWindow> {
    try {
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
    } catch (error) {
      console.error('Failed to create child window:', error);
      throw error;
    }
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
    try {
      if (this.isDevelopment) {
        // Development: Load from dev server
        await window.loadURL('http://localhost:3000');
      } else {
        // Production: Load from built files
        await window.loadFile(path.join(__dirname, '../dist/renderer/index.html'));
      }
    } catch (error) {
      console.error('Failed to load application content:', error);
      throw error;
    }
  }

  private setupWindowEvents(window: BrowserWindow, windowId?: string): void {
    try {
      // Window closed event
      window.on('closed', () => {
        try {
          if (windowId) {
            this.windows.delete(windowId);
          } else if (window === this.mainWindow) {
            this.mainWindow = null;
          }
        } catch (error) {
          console.error('Error handling window closed event:', error);
        }
      });

      // Window state events
      window.on('maximize', () => {
        try {
          if (!window.isDestroyed()) {
            window.webContents.send('window-state-changed', { maximized: true });
          }
        } catch (error) {
          console.error('Error handling window maximize event:', error);
        }
      });

      window.on('unmaximize', () => {
        try {
          if (!window.isDestroyed()) {
            window.webContents.send('window-state-changed', { maximized: false });
          }
        } catch (error) {
          console.error('Error handling window unmaximize event:', error);
        }
      });

      window.on('enter-full-screen', () => {
        try {
          if (!window.isDestroyed()) {
            window.webContents.send('window-state-changed', { fullscreen: true });
          }
        } catch (error) {
          console.error('Error handling window enter-full-screen event:', error);
        }
      });

      window.on('leave-full-screen', () => {
        try {
          if (!window.isDestroyed()) {
            window.webContents.send('window-state-changed', { fullscreen: false });
          }
        } catch (error) {
          console.error('Error handling window leave-full-screen event:', error);
        }
      });

      // Focus events
      window.on('focus', () => {
        try {
          if (!window.isDestroyed()) {
            window.webContents.send('window-focus-changed', { focused: true });
          }
        } catch (error) {
          console.error('Error handling window focus event:', error);
        }
      });

      window.on('blur', () => {
        try {
          if (!window.isDestroyed()) {
            window.webContents.send('window-focus-changed', { focused: false });
          }
        } catch (error) {
          console.error('Error handling window blur event:', error);
        }
      });
    } catch (error) {
      console.error('Failed to setup window events:', error);
    }
  }

  private getAppIcon(): Electron.NativeImage | undefined {
    try {
      const iconAssetPath = 'icons/app-icon.png';
      
      // Check if the icon file exists before attempting to load it
      if (!assetExists(iconAssetPath)) {
        const iconPath = getAssetPath(iconAssetPath);
        console.warn(`App icon not found at path: ${iconPath}. Using system default icon.`);
        return undefined;
      }
      
      const iconPath = getAssetPath(iconAssetPath);
      const icon = nativeImage.createFromPath(iconPath);
      
      // Verify the icon was loaded successfully
      if (icon.isEmpty()) {
        console.warn(`Failed to load app icon from path: ${iconPath}. Using system default icon.`);
        return undefined;
      }
      
      return icon;
    } catch (error) {
      console.warn(`Error loading app icon: ${error instanceof Error ? error.message : 'Unknown error'}. Using system default icon.`);
      return undefined;
    }
  }
}
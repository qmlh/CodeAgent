/**
 * Electron Main Process
 * Handles application lifecycle, window management, and system integration
 */

import { app, BrowserWindow, Menu, Tray, ipcMain, dialog, shell } from 'electron';
import { autoUpdater } from 'electron-updater';
import * as path from 'path';
import * as fs from 'fs-extra';
import { WindowManager } from './managers/WindowManager';
import { MenuManager } from './managers/MenuManager';
import { TrayManager } from './managers/TrayManager';
import { IPCManager } from './managers/IPCManager';
import { FileSystemManager } from './managers/FileSystemManager';

class ElectronApp {
  private windowManager: WindowManager;
  private menuManager: MenuManager;
  private trayManager: TrayManager;
  private ipcManager: IPCManager;
  private fileSystemManager: FileSystemManager;
  private isDevelopment: boolean;

  constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development';
    this.windowManager = new WindowManager();
    this.menuManager = new MenuManager();
    this.trayManager = new TrayManager();
    this.ipcManager = new IPCManager();
    this.fileSystemManager = new FileSystemManager();
  }

  async initialize(): Promise<void> {
    // Configure app settings
    this.configureApp();

    // Set up event listeners
    this.setupAppEvents();
    this.setupAutoUpdater();

    // Initialize managers
    await this.initializeManagers();
  }

  private configureApp(): void {
    // Set app user model ID for Windows
    if (process.platform === 'win32') {
      app.setAppUserModelId('com.multiagent.ide');
    }

    // Configure security
    app.commandLine.appendSwitch('disable-web-security');
    app.commandLine.appendSwitch('disable-features', 'OutOfBlinkCors');
  }

  private setupAppEvents(): void {
    // App ready event
    app.whenReady().then(async () => {
      await this.onAppReady();
    });

    // Window events
    app.on('window-all-closed', this.onWindowAllClosed.bind(this));
    app.on('activate', this.onActivate.bind(this));
    app.on('before-quit', this.onBeforeQuit.bind(this));

    // Security events
    app.on('web-contents-created', this.onWebContentsCreated.bind(this));
  }

  private async onAppReady(): Promise<void> {
    // Create main window
    await this.windowManager.createMainWindow();

    // Set up application menu
    this.menuManager.createApplicationMenu();

    // Create system tray
    this.trayManager.createTray();

    // Set up IPC handlers
    this.ipcManager.setupHandlers();

    // Initialize file system watchers
    this.fileSystemManager.initialize();

    console.log('Multi-Agent IDE Desktop Application Ready');
  }

  private onWindowAllClosed(): void {
    // On macOS, keep app running even when all windows are closed
    if (process.platform !== 'darwin') {
      app.quit();
    }
  }

  private async onActivate(): Promise<void> {
    // On macOS, re-create window when dock icon is clicked
    if (BrowserWindow.getAllWindows().length === 0) {
      await this.windowManager.createMainWindow();
    }
  }

  private onBeforeQuit(): void {
    // Cleanup before quitting
    this.fileSystemManager.cleanup();
    this.trayManager.cleanup();
  }

  private onWebContentsCreated(event: Electron.Event, contents: Electron.WebContents): void {
    // Security: Prevent new window creation
    contents.setWindowOpenHandler(({ url }) => {
      shell.openExternal(url);
      return { action: 'deny' };
    });

    // Security: Prevent navigation to external URLs
    contents.on('will-navigate', (event, navigationUrl) => {
      const parsedUrl = new URL(navigationUrl);
      
      if (parsedUrl.origin !== 'http://localhost:3000' && !this.isDevelopment) {
        event.preventDefault();
      }
    });
  }

  private async initializeManagers(): Promise<void> {
    // Initialize all managers
    await Promise.all([
      this.windowManager.initialize(),
      this.menuManager.initialize(),
      this.trayManager.initialize(),
      this.ipcManager.initialize(),
      this.fileSystemManager.initialize()
    ]);
  }

  private setupAutoUpdater(): void {
    if (!this.isDevelopment) {
      autoUpdater.checkForUpdatesAndNotify();
      
      autoUpdater.on('update-available', () => {
        console.log('Update available');
      });

      autoUpdater.on('update-downloaded', () => {
        console.log('Update downloaded');
        autoUpdater.quitAndInstall();
      });
    }
  }
}

// Initialize and start the application
const electronApp = new ElectronApp();

// Handle app initialization
electronApp.initialize().catch((error) => {
  console.error('Failed to initialize Electron app:', error);
  app.quit();
});

// Export for testing
export { ElectronApp };
/**
 * Enhanced Electron Main Process
 * Handles application lifecycle with optimized startup and advanced features
 */

import { app, BrowserWindow, shell } from 'electron';
import { StartupManager } from './managers/StartupManager';

class ElectronApp {
  private startupManager: StartupManager;
  private isDevelopment: boolean;

  constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development';
    this.startupManager = new StartupManager();
  }

  async initialize(): Promise<void> {
    // Configure app settings
    this.configureApp();

    // Set up event listeners
    this.setupAppEvents();
  }

  private configureApp(): void {
    // Set app user model ID for Windows
    if (process.platform === 'win32') {
      app.setAppUserModelId('com.multiagent.ide');
    }

    // Configure security
    app.commandLine.appendSwitch('disable-web-security');
    app.commandLine.appendSwitch('disable-features', 'OutOfBlinkCors');
    
    // GPU crash prevention
    app.commandLine.appendSwitch('disable-gpu-sandbox');
    app.commandLine.appendSwitch('disable-software-rasterizer');
    app.commandLine.appendSwitch('disable-gpu-process-crash-limit');
    
    // Additional stability switches for Windows
    if (process.platform === 'win32') {
      app.commandLine.appendSwitch('disable-gpu');
      app.commandLine.appendSwitch('disable-gpu-compositing');
      app.commandLine.appendSwitch('disable-hardware-acceleration');
    }
  }

  private setupAppEvents(): void {
    // Handle child process crashes
    app.on('child-process-gone', (event, details) => {
      console.log('Child process gone:', details);
      if (details.type === 'GPU') {
        console.log('GPU process crashed, continuing with software rendering');
        // Don't quit the app, just log the GPU crash
      }
    });

    // Handle renderer process crashes
    app.on('render-process-gone', (event, webContents, details) => {
      console.log('Renderer process gone:', details);
      // Optionally reload the window or show an error dialog
    });

    // App ready event
    app.whenReady().then(async () => {
      try {
        await this.startupManager.startApplication({
          showSplash: false, // Disable splash for now to test main window
          enableCrashRecovery: true,
          enableAutoUpdater: !this.isDevelopment
        });
      } catch (error) {
        console.error('Failed to start application:', error);
        app.quit();
      }
    });

    // Window events
    app.on('window-all-closed', this.onWindowAllClosed.bind(this));
    app.on('activate', this.onActivate.bind(this));
    app.on('before-quit', this.onBeforeQuit.bind(this));

    // Security events
    app.on('web-contents-created', this.onWebContentsCreated.bind(this));
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
      // Use startup manager to recreate window
      await this.startupManager.startApplication({
        showSplash: false,
        enableCrashRecovery: false,
        enableAutoUpdater: false
      });
    }
  }

  private async onBeforeQuit(): Promise<void> {
    console.log('Application shutting down...');
    
    try {
      // Ensure proper cleanup of all managers
      await this.startupManager.cleanup();
      console.log('Application cleanup completed');
    } catch (error) {
      console.error('Error during application cleanup:', error);
    }
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
}

// Initialize and start the application
const electronApp = new ElectronApp();

// Handle app initialization
try {
  electronApp.initialize();
} catch (error) {
  console.error('Failed to initialize Electron app:', error);
  app.quit();
}

// Export for testing
export { ElectronApp };
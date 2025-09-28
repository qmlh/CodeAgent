/**
 * Startup Manager
 * Handles application startup performance optimization and initialization
 */

import { app, BrowserWindow } from 'electron';
import { SplashScreenManager, LoadingProgress } from './SplashScreenManager';
import { WindowManager } from './WindowManager';
import { TrayManager } from './TrayManager';
import { IPCManager } from './IPCManager';
import { FileSystemManager } from './FileSystemManager';
import { MenuManager } from './MenuManager';
import { UpdateManager } from './UpdateManager';
import { CrashRecoveryManager } from './CrashRecoveryManager';

export interface StartupOptions {
  showSplash?: boolean;
  enableCrashRecovery?: boolean;
  enableAutoUpdater?: boolean;
  skipInitialChecks?: boolean;
}

export class StartupManager {
  private splashScreenManager: SplashScreenManager;
  private windowManager: WindowManager;
  private trayManager: TrayManager;
  private ipcManager: IPCManager;
  private fileSystemManager: FileSystemManager;
  private menuManager: MenuManager;
  private updateManager: UpdateManager;
  private crashRecoveryManager: CrashRecoveryManager;
  
  private startupTime: number = 0;
  private initializationSteps: string[] = [];
  private currentStep: number = 0;

  constructor() {
    this.splashScreenManager = new SplashScreenManager();
    this.windowManager = new WindowManager();
    this.trayManager = new TrayManager();
    this.ipcManager = new IPCManager();
    this.fileSystemManager = new FileSystemManager();
    this.menuManager = new MenuManager();
    this.updateManager = new UpdateManager();
    this.crashRecoveryManager = new CrashRecoveryManager();
    
    this.initializationSteps = [
      'Initializing crash recovery system',
      'Loading application configuration',
      'Setting up security policies',
      'Initializing file system manager',
      'Setting up IPC communication',
      'Creating application menu',
      'Initializing system tray',
      'Setting up window manager',
      'Checking for updates',
      'Finalizing startup'
    ];
  }

  async startApplication(options: StartupOptions = {}): Promise<void> {
    this.startupTime = Date.now();
    
    try {
      // Show splash screen if enabled
      if (options.showSplash !== false) {
        await this.showSplashScreen();
      }

      // Initialize crash recovery first
      if (options.enableCrashRecovery !== false) {
        await this.initializeStep('Initializing crash recovery system', async () => {
          await this.crashRecoveryManager.initialize();
        });
      }

      // Load configuration
      await this.initializeStep('Loading application configuration', async () => {
        await this.loadConfiguration();
      });

      // Set up security
      await this.initializeStep('Setting up security policies', async () => {
        this.setupSecurity();
      });

      // Initialize core managers
      await this.initializeStep('Initializing file system manager', async () => {
        await this.fileSystemManager.initialize();
      });

      await this.initializeStep('Setting up IPC communication', async () => {
        await this.ipcManager.initialize();
        this.ipcManager.setupHandlers();
      });

      await this.initializeStep('Creating application menu', async () => {
        await this.menuManager.initialize();
        this.menuManager.createApplicationMenu();
      });

      await this.initializeStep('Initializing system tray', async () => {
        await this.trayManager.initialize();
        this.trayManager.createTray();
      });

      await this.initializeStep('Setting up window manager', async () => {
        await this.windowManager.initialize();
      });

      // Check for updates
      if (options.enableAutoUpdater !== false) {
        await this.initializeStep('Checking for updates', async () => {
          await this.updateManager.initialize();
        });
      }

      // Create main window
      await this.initializeStep('Finalizing startup', async () => {
        await this.windowManager.createMainWindow();
      });

      // Close splash screen
      if (options.showSplash !== false) {
        await this.closeSplashScreen();
      }

      const totalTime = Date.now() - this.startupTime;
      console.log(`Application startup completed in ${totalTime}ms`);

    } catch (error) {
      console.error('Application startup failed:', error);
      
      // Close splash screen on error
      if (options.showSplash !== false) {
        this.splashScreenManager.closeSplashScreen();
      }
      
      throw error;
    }
  }

  private async showSplashScreen(): Promise<void> {
    await this.splashScreenManager.createSplashScreen({
      width: 450,
      height: 300,
      showProgressBar: true,
      showLoadingText: true,
      backgroundColor: '#1e1e1e',
      textColor: '#ffffff'
    });
  }

  private async closeSplashScreen(): Promise<void> {
    // Wait a bit to ensure main window is ready
    await new Promise(resolve => setTimeout(resolve, 500));
    this.splashScreenManager.closeSplashScreen();
  }

  private async initializeStep(stepName: string, initFunction: () => Promise<void>): Promise<void> {
    const progress = (this.currentStep / this.initializationSteps.length) * 100;
    
    this.splashScreenManager.updateProgress({
      stage: stepName,
      progress,
      message: stepName
    });

    try {
      await initFunction();
      this.currentStep++;
    } catch (error) {
      console.error(`Failed to initialize step: ${stepName}`, error);
      throw error;
    }
  }

  private async loadConfiguration(): Promise<void> {
    // Load application configuration
    // This could include user preferences, window states, etc.
    await new Promise(resolve => setTimeout(resolve, 100)); // Simulate loading
  }

  private setupSecurity(): void {
    // Configure app security settings
    if (process.platform === 'win32') {
      app.setAppUserModelId('com.multiagent.ide');
    }

    // Security policies
    app.commandLine.appendSwitch('disable-web-security');
    app.commandLine.appendSwitch('disable-features', 'OutOfBlinkCors');
    
    // Content Security Policy
    app.on('web-contents-created', (event: Electron.Event, contents: Electron.WebContents) => {
      contents.setWindowOpenHandler(({ url }) => {
        return { action: 'deny' };
      });
    });
  }

  getStartupTime(): number {
    return this.startupTime;
  }

  getInitializationProgress(): { current: number; total: number; currentStep: string } {
    return {
      current: this.currentStep,
      total: this.initializationSteps.length,
      currentStep: this.initializationSteps[this.currentStep] || 'Complete'
    };
  }

  async cleanup(): Promise<void> {
    console.log('Starting application cleanup...');
    
    try {
      // Cleanup crash recovery manager (clear session data)
      if (this.crashRecoveryManager) {
        await this.crashRecoveryManager.cleanup();
      }

      // Cleanup file system manager
      if (this.fileSystemManager) {
        await this.fileSystemManager.cleanup();
      }

      // Cleanup IPC manager
      if (this.ipcManager && typeof (this.ipcManager as any).cleanup === 'function') {
        (this.ipcManager as any).cleanup();
      }

      // Cleanup tray manager
      if (this.trayManager && typeof (this.trayManager as any).cleanup === 'function') {
        (this.trayManager as any).cleanup();
      }

      // Cleanup window manager
      if (this.windowManager && typeof (this.windowManager as any).cleanup === 'function') {
        (this.windowManager as any).cleanup();
      }

      console.log('Application cleanup completed successfully');
    } catch (error) {
      console.error('Error during cleanup:', error);
      throw error;
    }
  }
}
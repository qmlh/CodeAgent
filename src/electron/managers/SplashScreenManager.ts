/**
 * Splash Screen Manager
 * Handles application startup splash screen with progress indication
 */

import { BrowserWindow, screen, nativeImage } from 'electron';
import * as path from 'path';
import { getAssetPath, assetExists } from '../utils/assetPaths';

export interface SplashScreenOptions {
  width?: number;
  height?: number;
  showProgressBar?: boolean;
  showLoadingText?: boolean;
  backgroundColor?: string;
  textColor?: string;
}

export interface LoadingProgress {
  stage: string;
  progress: number;
  message: string;
}

export class SplashScreenManager {
  private splashWindow: BrowserWindow | null = null;
  private isDevelopment: boolean;
  private currentProgress: number = 0;

  constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development';
  }

  async createSplashScreen(options: SplashScreenOptions = {}): Promise<BrowserWindow> {
    try {
      // Import app here to avoid circular dependency
      const { app } = await import('electron');
      
      if (!app.isReady()) {
        throw new Error('SplashScreenManager.createSplashScreen() called before app is ready.');
      }

      const { width, height } = screen.getPrimaryDisplay().workAreaSize;
      
      const splashConfig = {
        width: options.width || 400,
        height: options.height || 300,
        frame: false,
        alwaysOnTop: true,
        transparent: true,
        resizable: false,
        webPreferences: {
          nodeIntegration: false,
          contextIsolation: true,
          preload: path.join(__dirname, '../preload/splash.js')
        },
        show: false,
        center: true,
        icon: this.getSplashIcon()
      };

      this.splashWindow = new BrowserWindow(splashConfig);

      // Load splash screen content
      await this.loadSplashContent(options);

      // Show splash screen when ready
      this.splashWindow.once('ready-to-show', () => {
        if (this.splashWindow) {
          this.splashWindow.show();
        }
      });

      return this.splashWindow;
    } catch (error) {
      console.error('Failed to create splash screen:', error);
      throw error;
    }
  }

  updateProgress(progress: LoadingProgress): void {
    if (!this.splashWindow || this.splashWindow.isDestroyed()) {
      return;
    }

    try {
      this.currentProgress = progress.progress;
      this.splashWindow.webContents.send('splash-progress', progress);
    } catch (error) {
      console.error('Failed to update splash progress:', error);
    }
  }

  updateMessage(message: string): void {
    if (!this.splashWindow || this.splashWindow.isDestroyed()) {
      return;
    }

    try {
      this.splashWindow.webContents.send('splash-message', { message });
    } catch (error) {
      console.error('Failed to update splash message:', error);
    }
  }

  closeSplashScreen(): void {
    if (this.splashWindow && !this.splashWindow.isDestroyed()) {
      try {
        // Fade out animation before closing
        this.splashWindow.webContents.send('splash-close');
        
        // Close after animation
        setTimeout(() => {
          if (this.splashWindow && !this.splashWindow.isDestroyed()) {
            this.splashWindow.close();
            this.splashWindow = null;
          }
        }, 500);
      } catch (error) {
        console.error('Failed to close splash screen:', error);
        // Force close if animation fails
        this.splashWindow.destroy();
        this.splashWindow = null;
      }
    }
  }

  getSplashWindow(): BrowserWindow | null {
    return this.splashWindow;
  }

  private async loadSplashContent(options: SplashScreenOptions): Promise<void> {
    if (!this.splashWindow) return;

    try {
      // Load the splash HTML file
      const splashPath = path.join(__dirname, '../preload/splash.html');
      await this.splashWindow.loadFile(splashPath);

      // Send configuration to splash screen
      this.splashWindow.webContents.once('dom-ready', () => {
        if (this.splashWindow) {
          this.splashWindow.webContents.send('splash-config', options);
        }
      });
    } catch (error) {
      console.error('Failed to load splash content:', error);
      throw error;
    }
  }

  private getSplashIcon(): Electron.NativeImage | undefined {
    try {
      const iconAssetPath = 'icons/splash-icon.png';
      
      if (!assetExists(iconAssetPath)) {
        // Fallback to app icon
        const fallbackIconPath = 'icons/app-icon.png';
        if (assetExists(fallbackIconPath)) {
          return nativeImage.createFromPath(getAssetPath(fallbackIconPath));
        }
        return undefined;
      }
      
      const iconPath = getAssetPath(iconAssetPath);
      const icon = nativeImage.createFromPath(iconPath);
      
      if (icon.isEmpty()) {
        return undefined;
      }
      
      return icon;
    } catch (error) {
      console.warn('Error loading splash icon:', error);
      return undefined;
    }
  }
}
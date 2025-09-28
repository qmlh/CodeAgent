/**
 * Enhanced Window Manager
 * Handles creation and management of application windows with advanced features
 */

import { BrowserWindow, screen, nativeImage, app } from 'electron';
import * as path from 'path';
import * as fs from 'fs-extra';
import { WindowConfig, WindowState } from '../types/window.types';
import { getAssetPath, assetExists } from '../utils/assetPaths';

export interface WindowMemoryState {
  bounds: Electron.Rectangle;
  isMaximized: boolean;
  isFullScreen: boolean;
  display: number;
  lastUsed: Date;
}

export interface WindowSnapZone {
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'left' | 'right' | 'top' | 'bottom' | 'corner';
}

export class WindowManager {
  private mainWindow: BrowserWindow | null = null;
  private windows: Map<string, BrowserWindow> = new Map();
  private windowStates: Map<string, WindowMemoryState> = new Map();
  private isDevelopment: boolean;
  private stateFilePath: string;
  private snapThreshold: number = 20;
  private snapZones: WindowSnapZone[] = [];
  private isInitialized: boolean = false;

  constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development';
    this.stateFilePath = path.join(app.getPath('userData'), 'window-states.json');
    // Remove direct call to initializeSnapZones() - will be called in initialize()
  }

  async initialize(): Promise<void> {
    try {
      // Ensure app is ready before using screen API
      if (!app.isReady()) {
        throw new Error('WindowManager.initialize() called before app is ready. Call this after app.whenReady().');
      }

      // Initialize snap zones now that screen API is available
      this.initializeSnapZones();
      
      // Load saved window states
      await this.loadWindowStates();
      
      // Set up display change handlers
      this.setupDisplayHandlers();
      
      this.isInitialized = true;
      console.log('WindowManager initialized');
    } catch (error) {
      console.error('Failed to initialize WindowManager:', error);
      throw error;
    }
  }

  async createMainWindow(): Promise<BrowserWindow> {
    try {
      if (!this.isInitialized) {
        throw new Error('WindowManager must be initialized before creating windows. Call initialize() first.');
      }

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
        show: true,
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

      // Show window when ready and open dev tools in development
      this.mainWindow.once('ready-to-show', () => {
        if (this.mainWindow) {
          this.mainWindow.focus(); // 确保窗口获得焦点
          
          if (this.isDevelopment) {
            this.mainWindow.webContents.openDevTools();
          }
        }
      });

      // 强制显示窗口（备用方案）
      setTimeout(() => {
        if (this.mainWindow && !this.mainWindow.isDestroyed()) {
          this.mainWindow.show();
          this.mainWindow.focus();
          console.log('Window force shown after timeout');
        }
      }, 2000);

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

  // Enhanced window management methods
  async saveWindowStates(): Promise<void> {
    try {
      const states: Record<string, WindowMemoryState> = {};
      
      this.windowStates.forEach((state, windowId) => {
        states[windowId] = state;
      });
      
      await fs.writeJson(this.stateFilePath, states, { spaces: 2 });
    } catch (error) {
      console.error('Failed to save window states:', error);
    }
  }

  async loadWindowStates(): Promise<void> {
    try {
      if (await fs.pathExists(this.stateFilePath)) {
        const states = await fs.readJson(this.stateFilePath);
        
        Object.entries(states).forEach(([windowId, state]) => {
          this.windowStates.set(windowId, state as WindowMemoryState);
        });
      }
    } catch (error) {
      console.error('Failed to load window states:', error);
    }
  }

  getOptimalDisplay(): Electron.Display {
    if (!this.isInitialized) {
      throw new Error('WindowManager must be initialized before using display methods.');
    }

    const displays = screen.getAllDisplays();
    const cursor = screen.getCursorScreenPoint();
    
    // Find display containing cursor
    const currentDisplay = displays.find(display => {
      const { x, y, width, height } = display.bounds;
      return cursor.x >= x && cursor.x < x + width && 
             cursor.y >= y && cursor.y < y + height;
    });
    
    return currentDisplay || screen.getPrimaryDisplay();
  }

  snapWindowToEdge(window: BrowserWindow, edge: 'left' | 'right' | 'top' | 'bottom'): void {
    if (!this.isInitialized) {
      throw new Error('WindowManager must be initialized before using snap methods.');
    }

    const display = screen.getDisplayMatching(window.getBounds());
    const { x, y, width, height } = display.workArea;
    
    let newBounds: Electron.Rectangle;
    
    switch (edge) {
      case 'left':
        newBounds = { x, y, width: Math.floor(width / 2), height };
        break;
      case 'right':
        newBounds = { x: x + Math.floor(width / 2), y, width: Math.ceil(width / 2), height };
        break;
      case 'top':
        newBounds = { x, y, width, height: Math.floor(height / 2) };
        break;
      case 'bottom':
        newBounds = { x, y: y + Math.floor(height / 2), width, height: Math.ceil(height / 2) };
        break;
    }
    
    window.setBounds(newBounds);
  }

  centerWindowOnDisplay(window: BrowserWindow, displayId?: number): void {
    if (!this.isInitialized) {
      throw new Error('WindowManager must be initialized before using display methods.');
    }

    const displays = screen.getAllDisplays();
    const targetDisplay = displayId !== undefined 
      ? displays.find(d => d.id === displayId) || screen.getPrimaryDisplay()
      : screen.getPrimaryDisplay();
    
    const { x, y, width, height } = targetDisplay.workArea;
    const windowBounds = window.getBounds();
    
    const newX = x + Math.floor((width - windowBounds.width) / 2);
    const newY = y + Math.floor((height - windowBounds.height) / 2);
    
    window.setPosition(newX, newY);
  }

  moveWindowToDisplay(window: BrowserWindow, displayId: number): void {
    if (!this.isInitialized) {
      throw new Error('WindowManager must be initialized before using display methods.');
    }

    const displays = screen.getAllDisplays();
    const targetDisplay = displays.find(d => d.id === displayId);
    
    if (!targetDisplay) {
      console.warn(`Display ${displayId} not found`);
      return;
    }
    
    const currentBounds = window.getBounds();
    const { x: displayX, y: displayY, width: displayWidth, height: displayHeight } = targetDisplay.workArea;
    
    // Calculate relative position on new display
    const newX = displayX + Math.min(currentBounds.x - displayX, displayWidth - currentBounds.width);
    const newY = displayY + Math.min(currentBounds.y - displayY, displayHeight - currentBounds.height);
    
    window.setPosition(Math.max(displayX, newX), Math.max(displayY, newY));
  }

  getAllDisplays(): Electron.Display[] {
    if (!this.isInitialized) {
      throw new Error('WindowManager must be initialized before using display methods.');
    }
    return screen.getAllDisplays();
  }

  getWindowDisplay(window: BrowserWindow): Electron.Display {
    if (!this.isInitialized) {
      throw new Error('WindowManager must be initialized before using display methods.');
    }
    return screen.getDisplayMatching(window.getBounds());
  }

  private initializeSnapZones(): void {
    // Clear existing snap zones
    this.snapZones = [];
    
    const displays = screen.getAllDisplays();
    
    displays.forEach(display => {
      const { x, y, width, height } = display.bounds;
      
      // Create snap zones for each edge
      this.snapZones.push(
        { x, y, width: this.snapThreshold, height, type: 'left' },
        { x: x + width - this.snapThreshold, y, width: this.snapThreshold, height, type: 'right' },
        { x, y, width, height: this.snapThreshold, type: 'top' },
        { x, y: y + height - this.snapThreshold, width, height: this.snapThreshold, type: 'bottom' }
      );
    });
  }

  private setupDisplayHandlers(): void {
    // Handle display changes
    screen.on('display-added', () => {
      if (this.isInitialized) {
        this.initializeSnapZones();
        console.log('Display added, snap zones updated');
      }
    });
    
    screen.on('display-removed', () => {
      if (this.isInitialized) {
        this.initializeSnapZones();
        console.log('Display removed, snap zones updated');
      }
    });
    
    screen.on('display-metrics-changed', () => {
      if (this.isInitialized) {
        this.initializeSnapZones();
        console.log('Display metrics changed, snap zones updated');
      }
    });
  }

  private updateWindowState(windowId: string, window: BrowserWindow): void {
    if (!this.isInitialized) {
      console.warn('WindowManager not initialized, skipping window state update');
      return;
    }

    const state: WindowMemoryState = {
      bounds: window.getBounds(),
      isMaximized: window.isMaximized(),
      isFullScreen: window.isFullScreen(),
      display: this.getWindowDisplay(window).id,
      lastUsed: new Date()
    };
    
    this.windowStates.set(windowId, state);
    
    // Save states periodically
    this.saveWindowStates();
  }

  isWindowManagerInitialized(): boolean {
    return this.isInitialized;
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
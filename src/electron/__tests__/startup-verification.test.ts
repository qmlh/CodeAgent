/**
 * Application Startup Verification Tests
 * Verifies application starts without errors and handles missing assets gracefully
 */

import { ElectronApp } from '../main';
import * as fs from 'fs';

// Mock all Electron modules comprehensively
jest.mock('electron', () => ({
  app: {
    whenReady: jest.fn().mockImplementation(() => Promise.resolve()),
    on: jest.fn(),
    setAppUserModelId: jest.fn(),
    commandLine: {
      appendSwitch: jest.fn()
    },
    quit: jest.fn()
  },
  BrowserWindow: jest.fn().mockImplementation(() => ({
    isDestroyed: jest.fn().mockReturnValue(false),
    focus: jest.fn(),
    getBounds: jest.fn().mockReturnValue({ x: 0, y: 0, width: 800, height: 600 }),
    isMaximized: jest.fn().mockReturnValue(false),
    isFullScreen: jest.fn().mockReturnValue(false),
    loadURL: jest.fn().mockResolvedValue(undefined),
    loadFile: jest.fn().mockResolvedValue(undefined),
    on: jest.fn(),
    once: jest.fn((event, callback) => {
      if (event === 'ready-to-show') {
        // Simulate async ready event
        setTimeout(callback, 10);
      }
    }),
    show: jest.fn(),
    webContents: {
      openDevTools: jest.fn(),
      send: jest.fn()
    },
    getAllWindows: jest.fn().mockReturnValue([])
  })),
  Menu: {
    buildFromTemplate: jest.fn().mockReturnValue({}),
    setApplicationMenu: jest.fn()
  },
  Tray: jest.fn().mockImplementation(() => ({
    setImage: jest.fn(),
    setToolTip: jest.fn(),
    setContextMenu: jest.fn(),
    displayBalloon: jest.fn(),
    destroy: jest.fn(),
    on: jest.fn()
  })),
  ipcMain: {
    handle: jest.fn(),
    on: jest.fn()
  },
  dialog: {},
  shell: {
    openExternal: jest.fn()
  },
  screen: {
    getPrimaryDisplay: jest.fn().mockReturnValue({
      workAreaSize: { width: 1920, height: 1080 }
    })
  },
  nativeImage: {
    createFromPath: jest.fn().mockReturnValue({
      isEmpty: jest.fn().mockReturnValue(false)
    })
  }
}));

// Mock electron-updater
jest.mock('electron-updater', () => ({
  autoUpdater: {
    checkForUpdatesAndNotify: jest.fn(),
    on: jest.fn(),
    quitAndInstall: jest.fn()
  }
}));

// Mock fs-extra
jest.mock('fs-extra');

// Mock fs module
jest.mock('fs');
const mockFs = fs as jest.Mocked<typeof fs>;

// Mock chokidar
jest.mock('chokidar', () => ({
  watch: jest.fn().mockReturnValue({
    on: jest.fn(),
    close: jest.fn()
  })
}));

// Mock uuid
jest.mock('uuid', () => ({
  v4: jest.fn().mockReturnValue('mock-uuid')
}));

describe('Application Startup Verification', () => {
  let consoleSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;
  let consoleLogSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    jest.clearAllMocks();
    
    // Reset environment
    process.env.NODE_ENV = 'test';
  });

  afterEach(() => {
    consoleSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    consoleLogSpy.mockRestore();
  });

  describe('Complete application startup flow', () => {
    it('should start successfully with no assets present', async () => {
      // Mock all assets as missing
      mockFs.existsSync.mockReturnValue(false);

      const electronApp = new ElectronApp();
      
      // Should initialize without throwing
      await expect(electronApp.initialize()).resolves.not.toThrow();
      
      // Should log appropriate warnings for missing assets
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Cannot create system tray: No tray icon found')
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('App icon not found at path:')
      );
      
      // Should not have any unhandled errors
      expect(consoleErrorSpy).not.toHaveBeenCalledWith(
        expect.stringContaining('Failed to initialize Electron app:')
      );
    });

    it('should start successfully with all assets present', async () => {
      // Mock all assets as existing
      mockFs.existsSync.mockReturnValue(true);

      const electronApp = new ElectronApp();
      
      // Should initialize without throwing
      await expect(electronApp.initialize()).resolves.not.toThrow();
      
      // Should log successful initialization
      expect(consoleLogSpy).toHaveBeenCalledWith('System tray created successfully');
      
      // Should not warn about missing assets
      expect(consoleSpy).not.toHaveBeenCalledWith(
        expect.stringContaining('Cannot create system tray: No tray icon found')
      );
      expect(consoleSpy).not.toHaveBeenCalledWith(
        expect.stringContaining('App icon not found at path:')
      );
    });

    it('should handle mixed asset availability gracefully', async () => {
      // Mock partial asset availability
      mockFs.existsSync.mockImplementation((filePath: string) => {
        // Only app icon exists
        return filePath.includes('app-icon.png');
      });

      const electronApp = new ElectronApp();
      
      await expect(electronApp.initialize()).resolves.not.toThrow();
      
      // Should warn about missing tray icons but not app icon
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Cannot create system tray: No tray icon found')
      );
      expect(consoleSpy).not.toHaveBeenCalledWith(
        expect.stringContaining('App icon not found at path:')
      );
    });

    it('should recover from file system errors during startup', async () => {
      // Mock file system errors
      mockFs.existsSync.mockImplementation(() => {
        throw new Error('File system unavailable');
      });

      const electronApp = new ElectronApp();
      
      await expect(electronApp.initialize()).resolves.not.toThrow();
      
      // Should log file system errors but continue
      expect(consoleSpy).toHaveBeenCalledWith(
        'Error checking development asset path:',
        expect.any(Error)
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        'Error checking production asset path:',
        expect.any(Error)
      );
    });
  });

  describe('Manager initialization resilience', () => {
    it('should handle individual manager failures gracefully', async () => {
      // Mock all assets as existing
      mockFs.existsSync.mockReturnValue(true);
      
      // Mock one manager to fail
      const originalTrayManager = require('../managers/TrayManager').TrayManager;
      require('../managers/TrayManager').TrayManager = jest.fn().mockImplementation(() => ({
        initialize: jest.fn().mockRejectedValue(new Error('TrayManager init failed')),
        createTray: jest.fn(),
        cleanup: jest.fn()
      }));

      const electronApp = new ElectronApp();
      
      // Should fail due to manager initialization failure
      await expect(electronApp.initialize()).rejects.toThrow();
      
      // Restore original
      require('../managers/TrayManager').TrayManager = originalTrayManager;
    });

    it('should handle Electron API failures during startup', async () => {
      // Mock all assets as existing
      mockFs.existsSync.mockReturnValue(true);
      
      // Mock Tray constructor to fail
      const { Tray } = require('electron');
      Tray.mockImplementation(() => {
        throw new Error('Tray API unavailable');
      });

      const electronApp = new ElectronApp();
      
      await expect(electronApp.initialize()).resolves.not.toThrow();
      
      // Should log tray creation failure but continue
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to create system tray:',
        expect.any(Error)
      );
    });
  });

  describe('Asset loading edge cases', () => {
    it('should handle asset path resolution failures', async () => {
      // Mock path.join to fail
      const mockPath = require('path');
      mockPath.join.mockImplementation(() => {
        throw new Error('Path resolution failed');
      });

      const electronApp = new ElectronApp();
      
      await expect(electronApp.initialize()).resolves.not.toThrow();
      
      // Should log path resolution errors
      expect(consoleSpy).toHaveBeenCalledWith(
        'Error resolving asset path:',
        expect.any(Error)
      );
    });

    it('should handle corrupted asset files', async () => {
      // Mock files existing but image loading failing
      mockFs.existsSync.mockReturnValue(true);
      
      const { nativeImage } = require('electron');
      nativeImage.createFromPath.mockReturnValue({
        isEmpty: jest.fn().mockReturnValue(true) // Corrupted image
      });

      const electronApp = new ElectronApp();
      
      await expect(electronApp.initialize()).resolves.not.toThrow();
      
      // Should warn about failed image loading
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to load app icon from path:')
      );
    });

    it('should handle platform-specific asset issues', async () => {
      const originalPlatform = process.platform;
      
      try {
        // Test Windows with missing ICO files
        Object.defineProperty(process, 'platform', { value: 'win32' });
        mockFs.existsSync.mockImplementation((filePath: string) => {
          return !filePath.includes('.ico'); // No ICO files
        });

        const electronApp = new ElectronApp();
        
        await expect(electronApp.initialize()).resolves.not.toThrow();
        
        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining('Cannot create system tray: No tray icon found')
        );
      } finally {
        Object.defineProperty(process, 'platform', { value: originalPlatform });
      }
    });
  });

  describe('Error boundary verification', () => {
    it('should not have unhandled promise rejections', async () => {
      // Track unhandled rejections
      const unhandledRejections: any[] = [];
      const originalHandler = process.listeners('unhandledRejection');
      
      process.removeAllListeners('unhandledRejection');
      process.on('unhandledRejection', (reason) => {
        unhandledRejections.push(reason);
      });

      try {
        // Mock various failure scenarios
        mockFs.existsSync.mockImplementation(() => {
          throw new Error('File system error');
        });

        const { Tray } = require('electron');
        Tray.mockImplementation(() => {
          throw new Error('Tray creation failed');
        });

        const electronApp = new ElectronApp();
        await electronApp.initialize();

        // Wait a bit for any async operations
        await new Promise(resolve => setTimeout(resolve, 100));

        // Should not have any unhandled rejections
        expect(unhandledRejections).toHaveLength(0);
      } finally {
        // Restore original handlers
        process.removeAllListeners('unhandledRejection');
        originalHandler.forEach(handler => {
          process.on('unhandledRejection', handler);
        });
      }
    });

    it('should provide clear error messages for debugging', async () => {
      // Mock various error scenarios
      mockFs.existsSync.mockReturnValue(false);

      const electronApp = new ElectronApp();
      await electronApp.initialize();

      // Should provide helpful error messages
      expect(consoleSpy).toHaveBeenCalledWith(
        'Cannot create system tray: No tray icon found. Please ensure tray icon assets are available in the assets/icons directory.'
      );
      expect(consoleSpy).toHaveBeenCalledWith('Expected tray icon locations:');
      expect(consoleSpy).toHaveBeenCalledWith('  - Windows: assets/icons/tray-icon.ico');
      expect(consoleSpy).toHaveBeenCalledWith('  - macOS/Linux: assets/icons/tray-icon.png');
    });
  });
});
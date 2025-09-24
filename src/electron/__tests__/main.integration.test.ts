/**
 * Application Startup Integration Tests
 * Tests for application startup with missing assets
 */

import { ElectronApp } from '../main';
import * as fs from 'fs';

// Mock Electron modules
jest.mock('electron', () => ({
  app: {
    whenReady: jest.fn().mockResolvedValue(undefined),
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
        setTimeout(callback, 0);
      }
    }),
    show: jest.fn(),
    webContents: {
      openDevTools: jest.fn(),
      send: jest.fn()
    }
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

// Mock managers
jest.mock('../managers/WindowManager');
jest.mock('../managers/MenuManager');
jest.mock('../managers/TrayManager');
jest.mock('../managers/IPCManager');
jest.mock('../managers/FileSystemManager');

describe('Application Startup Integration Tests', () => {
  let electronApp: ElectronApp;
  let consoleSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
    jest.clearAllMocks();
    
    // Mock process.env
    process.env.NODE_ENV = 'test';
    
    electronApp = new ElectronApp();
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  describe('Application initialization with missing assets', () => {
    it('should initialize successfully when all assets are missing', async () => {
      // Mock all assets as missing
      mockFs.existsSync.mockReturnValue(false);

      await expect(electronApp.initialize()).resolves.not.toThrow();
      
      // Verify that warnings were logged for missing assets
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Cannot create system tray: No tray icon found')
      );
    });

    it('should initialize successfully when some assets are missing', async () => {
      // Mock only some assets as existing
      mockFs.existsSync.mockImplementation((filePath: string) => {
        // Only app icon exists, tray icons are missing
        return filePath.includes('app-icon.png');
      });

      await expect(electronApp.initialize()).resolves.not.toThrow();
      
      // Should still warn about missing tray icons
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Cannot create system tray: No tray icon found')
      );
    });

    it('should initialize successfully when all assets are present', async () => {
      // Mock all assets as existing
      mockFs.existsSync.mockReturnValue(true);

      await expect(electronApp.initialize()).resolves.not.toThrow();
      
      // Should not warn about missing assets
      expect(consoleSpy).not.toHaveBeenCalledWith(
        expect.stringContaining('Cannot create system tray: No tray icon found')
      );
    });

    it('should handle file system errors during asset checking', async () => {
      // Mock fs.existsSync to throw errors
      mockFs.existsSync.mockImplementation(() => {
        throw new Error('File system error');
      });

      await expect(electronApp.initialize()).resolves.not.toThrow();
      
      // Should log file system errors but continue initialization
      expect(consoleSpy).toHaveBeenCalledWith(
        'Error checking development asset path:',
        expect.any(Error)
      );
    });
  });

  describe('Manager initialization with asset errors', () => {
    it('should continue initialization even if tray creation fails', async () => {
      // Mock tray creation to fail
      const { TrayManager } = require('../managers/TrayManager');
      const mockTrayManager = {
        initialize: jest.fn().mockResolvedValue(undefined),
        createTray: jest.fn().mockImplementation(() => {
          throw new Error('Tray creation failed');
        }),
        cleanup: jest.fn()
      };
      TrayManager.mockImplementation(() => mockTrayManager);

      electronApp = new ElectronApp();
      
      await expect(electronApp.initialize()).resolves.not.toThrow();
    });

    it('should continue initialization even if window icon loading fails', async () => {
      // Mock window manager to handle icon loading failure
      const { WindowManager } = require('../managers/WindowManager');
      const mockWindowManager = {
        initialize: jest.fn().mockResolvedValue(undefined),
        createMainWindow: jest.fn().mockResolvedValue({
          isDestroyed: jest.fn().mockReturnValue(false),
          focus: jest.fn()
        })
      };
      WindowManager.mockImplementation(() => mockWindowManager);

      electronApp = new ElectronApp();
      
      await expect(electronApp.initialize()).resolves.not.toThrow();
    });
  });

  describe('Error handling during startup', () => {
    it('should handle manager initialization failures gracefully', async () => {
      // Mock one manager to fail initialization
      const { WindowManager } = require('../managers/WindowManager');
      const mockWindowManager = {
        initialize: jest.fn().mockRejectedValue(new Error('WindowManager init failed')),
        createMainWindow: jest.fn().mockResolvedValue({})
      };
      WindowManager.mockImplementation(() => mockWindowManager);

      electronApp = new ElectronApp();
      
      await expect(electronApp.initialize()).rejects.toThrow('WindowManager init failed');
    });

    it('should handle window creation failures', async () => {
      // Mock window creation to fail
      const { WindowManager } = require('../managers/WindowManager');
      const mockWindowManager = {
        initialize: jest.fn().mockResolvedValue(undefined),
        createMainWindow: jest.fn().mockRejectedValue(new Error('Window creation failed'))
      };
      WindowManager.mockImplementation(() => mockWindowManager);

      electronApp = new ElectronApp();
      
      // Should handle the error during app ready event
      await expect(electronApp.initialize()).resolves.not.toThrow();
    });
  });
});
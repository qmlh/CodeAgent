/**
 * Asset Availability Scenarios Integration Tests
 * Tests for tray creation and window creation with various asset availability scenarios
 */

import { TrayManager } from '../managers/TrayManager';
import { WindowManager } from '../managers/WindowManager';
import * as fs from 'fs';

// Mock Electron modules
jest.mock('electron', () => ({
  Tray: jest.fn().mockImplementation(() => ({
    setImage: jest.fn(),
    setToolTip: jest.fn(),
    setContextMenu: jest.fn(),
    displayBalloon: jest.fn(),
    destroy: jest.fn(),
    on: jest.fn()
  })),
  Menu: {
    buildFromTemplate: jest.fn().mockReturnValue({})
  },
  nativeImage: {
    createFromPath: jest.fn().mockReturnValue({
      isEmpty: jest.fn().mockReturnValue(false)
    })
  },
  app: {
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
  screen: {
    getPrimaryDisplay: jest.fn().mockReturnValue({
      workAreaSize: { width: 1920, height: 1080 }
    })
  }
}));

// Mock WindowManager for TrayManager
jest.mock('../managers/WindowManager', () => ({
  WindowManager: jest.fn().mockImplementation(() => ({
    getMainWindow: jest.fn().mockReturnValue({
      isVisible: jest.fn().mockReturnValue(true),
      isFocused: jest.fn().mockReturnValue(true),
      hide: jest.fn(),
      show: jest.fn(),
      focus: jest.fn(),
      webContents: {
        send: jest.fn()
      }
    }),
    createMainWindow: jest.fn()
  }))
}));

// Mock fs module
jest.mock('fs');
const mockFs = fs as jest.Mocked<typeof fs>;

describe('Asset Availability Scenarios', () => {
  let consoleSpy: jest.SpyInstance;
  let consoleLogSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    jest.clearAllMocks();
  });

  afterEach(() => {
    consoleSpy.mockRestore();
    consoleLogSpy.mockRestore();
  });

  describe('Scenario 1: All assets missing', () => {
    beforeEach(() => {
      // Mock all assets as missing
      mockFs.existsSync.mockReturnValue(false);
    });

    it('should handle tray creation gracefully when all icons are missing', () => {
      const trayManager = new TrayManager();
      
      expect(() => trayManager.createTray()).not.toThrow();
      
      expect(consoleSpy).toHaveBeenCalledWith(
        'Cannot create system tray: No tray icon found. Please ensure tray icon assets are available in the assets/icons directory.'
      );
      expect(consoleSpy).toHaveBeenCalledWith('Expected tray icon locations:');
      expect(consoleSpy).toHaveBeenCalledWith('  - Windows: assets/icons/tray-icon.ico');
      expect(consoleSpy).toHaveBeenCalledWith('  - macOS/Linux: assets/icons/tray-icon.png');
    });

    it('should handle window creation gracefully when app icon is missing', async () => {
      // Create a real WindowManager instance (not mocked for this test)
      jest.unmock('../managers/WindowManager');
      const { WindowManager: RealWindowManager } = require('../managers/WindowManager');
      const windowManager = new RealWindowManager();
      
      const window = await windowManager.createMainWindow();
      
      expect(window).toBeDefined();
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('App icon not found at path:')
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Using system default icon.')
      );
    });

    it('should handle tray icon updates when status icons are missing', () => {
      const trayManager = new TrayManager();
      
      // First create tray (will fail due to missing base icon)
      trayManager.createTray();
      
      // Try to update icon status (should handle gracefully)
      expect(() => trayManager.updateTrayIcon('working')).not.toThrow();
      expect(() => trayManager.updateTrayIcon('error')).not.toThrow();
      expect(() => trayManager.updateTrayIcon('idle')).not.toThrow();
    });
  });

  describe('Scenario 2: Partial assets available', () => {
    it('should use app icon when available but skip tray when tray icons missing', async () => {
      // Mock only app icon as existing
      mockFs.existsSync.mockImplementation((filePath: string) => {
        return filePath.includes('app-icon.png');
      });

      const trayManager = new TrayManager();
      
      // Tray creation should fail gracefully
      trayManager.createTray();
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Cannot create system tray: No tray icon found')
      );

      // Window creation should succeed with icon
      jest.unmock('../managers/WindowManager');
      const { WindowManager: RealWindowManager } = require('../managers/WindowManager');
      const windowManager = new RealWindowManager();
      
      const window = await windowManager.createMainWindow();
      expect(window).toBeDefined();
      
      // Should not warn about missing app icon
      expect(consoleSpy).not.toHaveBeenCalledWith(
        expect.stringContaining('App icon not found')
      );
    });

    it('should use base tray icon when status-specific icons are missing', () => {
      // Mock only base tray icon as existing
      mockFs.existsSync.mockImplementation((filePath: string) => {
        return filePath.includes('tray-icon.') && !filePath.includes('tray-icon-');
      });

      const trayManager = new TrayManager();
      
      // Tray creation should succeed
      trayManager.createTray();
      expect(consoleLogSpy).toHaveBeenCalledWith('System tray created successfully');
      
      // Status updates should fall back to base icon
      trayManager.updateTrayIcon('working');
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Using fallback tray icon:')
      );
    });

    it('should handle mixed platform icon availability', () => {
      const originalPlatform = process.platform;
      
      try {
        // Test Windows with only PNG available (should fail)
        Object.defineProperty(process, 'platform', { value: 'win32' });
        mockFs.existsSync.mockImplementation((filePath: string) => {
          return filePath.includes('.png') && !filePath.includes('.ico');
        });

        const trayManager1 = new TrayManager();
        trayManager1.createTray();
        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining('Cannot create system tray: No tray icon found')
        );

        jest.clearAllMocks();

        // Test macOS with only ICO available (should fail)
        Object.defineProperty(process, 'platform', { value: 'darwin' });
        mockFs.existsSync.mockImplementation((filePath: string) => {
          return filePath.includes('.ico') && !filePath.includes('.png');
        });

        const trayManager2 = new TrayManager();
        trayManager2.createTray();
        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining('Cannot create system tray: No tray icon found')
        );
      } finally {
        Object.defineProperty(process, 'platform', { value: originalPlatform });
      }
    });
  });

  describe('Scenario 3: All assets available', () => {
    beforeEach(() => {
      // Mock all assets as existing
      mockFs.existsSync.mockReturnValue(true);
    });

    it('should create tray and window successfully when all assets are available', async () => {
      const trayManager = new TrayManager();
      
      // Tray creation should succeed
      trayManager.createTray();
      expect(consoleLogSpy).toHaveBeenCalledWith('System tray created successfully');
      expect(consoleSpy).not.toHaveBeenCalledWith(
        expect.stringContaining('Cannot create system tray')
      );

      // Window creation should succeed
      jest.unmock('../managers/WindowManager');
      const { WindowManager: RealWindowManager } = require('../managers/WindowManager');
      const windowManager = new RealWindowManager();
      
      const window = await windowManager.createMainWindow();
      expect(window).toBeDefined();
      expect(consoleSpy).not.toHaveBeenCalledWith(
        expect.stringContaining('App icon not found')
      );
    });

    it('should handle status icon updates successfully', () => {
      const trayManager = new TrayManager();
      
      // Create tray
      trayManager.createTray();
      expect(consoleLogSpy).toHaveBeenCalledWith('System tray created successfully');
      
      // Status updates should work without warnings
      trayManager.updateTrayIcon('working');
      trayManager.updateTrayIcon('error');
      trayManager.updateTrayIcon('idle');
      
      expect(consoleSpy).not.toHaveBeenCalledWith(
        expect.stringContaining('Tray icon not found')
      );
      expect(consoleSpy).not.toHaveBeenCalledWith(
        expect.stringContaining('Status-specific tray icon')
      );
    });
  });

  describe('Scenario 4: File system errors', () => {
    it('should handle file system access errors gracefully', () => {
      // Mock fs.existsSync to throw errors
      mockFs.existsSync.mockImplementation(() => {
        throw new Error('File system access denied');
      });

      const trayManager = new TrayManager();
      
      expect(() => trayManager.createTray()).not.toThrow();
      
      // Should log file system errors
      expect(consoleSpy).toHaveBeenCalledWith(
        'Error checking development asset path:',
        expect.any(Error)
      );
    });

    it('should handle intermittent file system errors', () => {
      let callCount = 0;
      mockFs.existsSync.mockImplementation(() => {
        callCount++;
        if (callCount <= 2) {
          throw new Error('Intermittent error');
        }
        return true;
      });

      const trayManager = new TrayManager();
      
      expect(() => trayManager.createTray()).not.toThrow();
      
      // Should eventually succeed or fail gracefully
      expect(consoleSpy).toHaveBeenCalledWith(
        'Error checking development asset path:',
        expect.any(Error)
      );
    });
  });

  describe('Scenario 5: Asset corruption', () => {
    it('should handle corrupted app icon gracefully', async () => {
      // Mock file existing but image creation failing
      mockFs.existsSync.mockReturnValue(true);
      
      const { nativeImage } = require('electron');
      nativeImage.createFromPath.mockReturnValue({
        isEmpty: jest.fn().mockReturnValue(true) // Corrupted/empty image
      });

      jest.unmock('../managers/WindowManager');
      const { WindowManager: RealWindowManager } = require('../managers/WindowManager');
      const windowManager = new RealWindowManager();
      
      const window = await windowManager.createMainWindow();
      
      expect(window).toBeDefined();
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to load app icon from path:')
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Using system default icon.')
      );
    });

    it('should handle tray icon loading errors during creation', () => {
      // Mock file existing
      mockFs.existsSync.mockReturnValue(true);
      
      // Mock Tray constructor to fail
      const { Tray } = require('electron');
      Tray.mockImplementation(() => {
        throw new Error('Invalid icon format');
      });

      const trayManager = new TrayManager();
      
      expect(() => trayManager.createTray()).not.toThrow();
      
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to create system tray:',
        expect.any(Error)
      );
    });
  });
});
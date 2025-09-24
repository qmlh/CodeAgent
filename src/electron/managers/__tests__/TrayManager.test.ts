/**
 * TrayManager Tests
 * Tests for graceful handling of missing assets
 */

import { TrayManager } from '../TrayManager';
import * as fs from 'fs';
import * as path from 'path';

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
  nativeImage: {},
  app: {
    quit: jest.fn()
  },
  BrowserWindow: jest.fn()
}));

// Mock WindowManager
jest.mock('../WindowManager', () => ({
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

describe('TrayManager', () => {
  let trayManager: TrayManager;
  let consoleSpy: jest.SpyInstance;
  let consoleLogSpy: jest.SpyInstance;

  beforeEach(() => {
    trayManager = new TrayManager();
    consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    jest.clearAllMocks();
  });

  afterEach(() => {
    consoleSpy.mockRestore();
    consoleLogSpy.mockRestore();
  });

  describe('createTray', () => {
    it('should skip tray creation when icon is missing', () => {
      // Mock file not existing
      mockFs.existsSync.mockReturnValue(false);

      trayManager.createTray();

      expect(consoleSpy).toHaveBeenCalledWith(
        'Cannot create system tray: No tray icon found. Please ensure tray icon assets are available in the assets/icons directory.'
      );
      expect(consoleSpy).toHaveBeenCalledWith('Expected tray icon locations:');
    });

    it('should create tray when icon exists', () => {
      // Mock file existing
      mockFs.existsSync.mockReturnValue(true);

      trayManager.createTray();

      expect(consoleSpy).not.toHaveBeenCalledWith(
        expect.stringContaining('Cannot create system tray')
      );
    });
  });

  describe('updateTrayIcon', () => {
    beforeEach(() => {
      // Setup tray first
      mockFs.existsSync.mockReturnValue(true);
      trayManager.createTray();
      jest.clearAllMocks();
    });

    it('should warn when status-specific icon is missing but fallback exists', () => {
      // Mock status icon not existing, but base icon exists
      mockFs.existsSync.mockImplementation((filePath: string) => {
        return filePath.includes('tray-icon.') && !filePath.includes('tray-icon-working');
      });

      trayManager.updateTrayIcon('working');

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Tray icon not found at path:')
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Using fallback tray icon:')
      );
    });

    it('should warn when no icons are available', () => {
      // Mock no icons existing
      mockFs.existsSync.mockReturnValue(false);

      trayManager.updateTrayIcon('error');

      expect(consoleSpy).toHaveBeenCalledWith(
        "Status-specific tray icon for 'error' not found, keeping current icon"
      );
    });
  });

  describe('showNotification', () => {
    it('should handle notification errors gracefully', () => {
      // Setup tray first
      mockFs.existsSync.mockReturnValue(true);
      
      // Mock Tray constructor to return a mock with failing displayBalloon
      const { Tray } = require('electron');
      const mockTrayInstance = {
        setImage: jest.fn(),
        setToolTip: jest.fn(),
        setContextMenu: jest.fn(),
        displayBalloon: jest.fn().mockImplementation(() => {
          throw new Error('Notification failed');
        }),
        destroy: jest.fn(),
        on: jest.fn()
      };
      
      Tray.mockImplementation(() => mockTrayInstance);
      
      trayManager.createTray();
      trayManager.showNotification('Test', 'Test message');

      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to show tray notification:',
        expect.any(Error)
      );
    });

    it('should not attempt notification when tray is not created', () => {
      // Don't create tray
      trayManager.showNotification('Test', 'Test message');

      // Should not throw or log errors
      expect(consoleSpy).not.toHaveBeenCalledWith(
        expect.stringContaining('Failed to show tray notification')
      );
    });
  });

  describe('Asset loading scenarios', () => {
    it('should handle tray creation with platform-specific icons', () => {
      // Mock different platforms
      const originalPlatform = process.platform;
      
      // Test Windows
      Object.defineProperty(process, 'platform', { value: 'win32' });
      mockFs.existsSync.mockImplementation((filePath: string) => {
        return filePath.includes('.ico');
      });
      
      trayManager.createTray();
      expect(consoleLogSpy).toHaveBeenCalledWith('System tray created successfully');
      
      // Test macOS/Linux
      Object.defineProperty(process, 'platform', { value: 'darwin' });
      mockFs.existsSync.mockImplementation((filePath: string) => {
        return filePath.includes('.png');
      });
      
      const trayManager2 = new TrayManager();
      trayManager2.createTray();
      expect(consoleLogSpy).toHaveBeenCalledWith('System tray created successfully');
      
      // Restore platform
      Object.defineProperty(process, 'platform', { value: originalPlatform });
    });

    it('should handle tray creation failure due to Electron errors', () => {
      // Mock file existing but Tray constructor failing
      mockFs.existsSync.mockReturnValue(true);
      
      const { Tray } = require('electron');
      Tray.mockImplementation(() => {
        throw new Error('Tray creation failed');
      });
      
      trayManager.createTray();
      
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to create system tray:',
        expect.any(Error)
      );
    });

    it('should handle updateTrayIcon with various error scenarios', () => {
      // Setup tray first
      mockFs.existsSync.mockReturnValue(true);
      const mockTrayInstance = {
        setImage: jest.fn().mockImplementation(() => {
          throw new Error('Image update failed');
        }),
        setToolTip: jest.fn(),
        setContextMenu: jest.fn(),
        displayBalloon: jest.fn(),
        destroy: jest.fn(),
        on: jest.fn()
      };
      
      const { Tray } = require('electron');
      Tray.mockImplementation(() => mockTrayInstance);
      
      trayManager.createTray();
      jest.clearAllMocks();
      
      // Mock status icon existing but setImage failing
      mockFs.existsSync.mockReturnValue(true);
      trayManager.updateTrayIcon('working');
      
      expect(consoleSpy).toHaveBeenCalledWith(
        "Failed to update tray icon to status 'working':",
        expect.any(Error)
      );
    });
  });

  describe('Cleanup and error recovery', () => {
    it('should cleanup tray safely when tray exists', () => {
      // Setup tray first
      mockFs.existsSync.mockReturnValue(true);
      trayManager.createTray();
      
      // Should not throw during cleanup
      expect(() => trayManager.cleanup()).not.toThrow();
    });

    it('should cleanup safely when tray does not exist', () => {
      // Don't create tray
      expect(() => trayManager.cleanup()).not.toThrow();
    });

    it('should handle tray event setup errors gracefully', () => {
      // Mock file existing
      mockFs.existsSync.mockReturnValue(true);
      
      // Mock Tray with failing event setup
      const mockTrayInstance = {
        setImage: jest.fn(),
        setToolTip: jest.fn(),
        setContextMenu: jest.fn(),
        displayBalloon: jest.fn(),
        destroy: jest.fn(),
        on: jest.fn().mockImplementation(() => {
          throw new Error('Event setup failed');
        })
      };
      
      const { Tray } = require('electron');
      Tray.mockImplementation(() => mockTrayInstance);
      
      // Add console.error spy since that's what's actually being used
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      
      trayManager.createTray();
      
      // Should log the error but not crash
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to setup tray events:',
        expect.any(Error)
      );
      
      consoleErrorSpy.mockRestore();
    });
  });
});
/**
 * WindowManager Tests
 * Tests for window management functionality
 */

import { WindowManager } from '../WindowManager';
import * as fs from 'fs';
import * as path from 'path';

// Mock Electron modules
jest.mock('electron', () => ({
  BrowserWindow: jest.fn().mockImplementation(() => ({
    isDestroyed: jest.fn().mockReturnValue(false),
    focus: jest.fn(),
    getBounds: jest.fn().mockReturnValue({ x: 0, y: 0, width: 800, height: 600 }),
    isMaximized: jest.fn().mockReturnValue(false),
    isFullScreen: jest.fn().mockReturnValue(false),
    maximize: jest.fn(),
    setFullScreen: jest.fn(),
    setBounds: jest.fn(),
    loadURL: jest.fn().mockResolvedValue(undefined),
    loadFile: jest.fn().mockResolvedValue(undefined),
    on: jest.fn(),
    once: jest.fn(),
    show: jest.fn(),
    close: jest.fn(),
    webContents: {
      openDevTools: jest.fn(),
      send: jest.fn()
    }
  })),
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

// Mock fs module
jest.mock('fs');
const mockFs = fs as jest.Mocked<typeof fs>;

describe('WindowManager', () => {
  let windowManager: WindowManager;
  let consoleSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    windowManager = new WindowManager();
    consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    jest.clearAllMocks();
  });

  afterEach(() => {
    consoleSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  describe('getAppIcon', () => {
    it('should return undefined when icon file does not exist', async () => {
      // Mock fs.existsSync to return false
      mockFs.existsSync.mockReturnValue(false);
      
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      // Access the private method through reflection for testing
      const getAppIcon = (windowManager as any).getAppIcon.bind(windowManager);
      const result = getAppIcon();
      
      expect(result).toBeUndefined();
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('App icon not found at path:')
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Using system default icon.')
      );
      
      consoleSpy.mockRestore();
    });

    it('should return undefined when icon loading fails', async () => {
      // Mock fs.existsSync to return true
      mockFs.existsSync.mockReturnValue(true);
      
      // Mock nativeImage.createFromPath to return empty image
      const { nativeImage } = require('electron');
      nativeImage.createFromPath.mockReturnValue({
        isEmpty: jest.fn().mockReturnValue(true)
      });
      
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      // Access the private method through reflection for testing
      const getAppIcon = (windowManager as any).getAppIcon.bind(windowManager);
      const result = getAppIcon();
      
      expect(result).toBeUndefined();
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to load app icon from path:')
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Using system default icon.')
      );
      
      consoleSpy.mockRestore();
    });

    it('should return icon when file exists and loads successfully', async () => {
      // Mock fs.existsSync to return true
      mockFs.existsSync.mockReturnValue(true);
      
      // Mock nativeImage.createFromPath to return valid image
      const mockIcon = {
        isEmpty: jest.fn().mockReturnValue(false)
      };
      const { nativeImage } = require('electron');
      nativeImage.createFromPath.mockReturnValue(mockIcon);
      
      // Access the private method through reflection for testing
      const getAppIcon = (windowManager as any).getAppIcon.bind(windowManager);
      const result = getAppIcon();
      
      expect(result).toBe(mockIcon);
      expect(mockFs.existsSync).toHaveBeenCalled();
      expect(nativeImage.createFromPath).toHaveBeenCalled();
    });

    it('should handle exceptions gracefully', async () => {
      // Mock fs.existsSync to throw an error
      mockFs.existsSync.mockImplementation(() => {
        throw new Error('File system error');
      });
      
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      // Access the private method through reflection for testing
      const getAppIcon = (windowManager as any).getAppIcon.bind(windowManager);
      const result = getAppIcon();
      
      expect(result).toBeUndefined();
      // The error is now caught in the assetExists function, so we expect different log messages
      expect(consoleSpy).toHaveBeenCalledWith(
        'Error checking development asset path:',
        expect.any(Error)
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('App icon not found at path:')
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Using system default icon.')
      );
      
      consoleSpy.mockRestore();
    });
  });

  describe('createMainWindow with asset scenarios', () => {
    it('should create window successfully with missing app icon', async () => {
      // Mock fs.existsSync to return false (no app icon)
      mockFs.existsSync.mockReturnValue(false);
      
      const window = await windowManager.createMainWindow();
      
      expect(window).toBeDefined();
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('App icon not found at path:')
      );
    });

    it('should create window successfully with valid app icon', async () => {
      // Mock fs.existsSync to return true
      mockFs.existsSync.mockReturnValue(true);
      
      // Mock nativeImage.createFromPath to return valid image
      const { nativeImage } = require('electron');
      nativeImage.createFromPath.mockReturnValue({
        isEmpty: jest.fn().mockReturnValue(false)
      });
      
      const window = await windowManager.createMainWindow();
      
      expect(window).toBeDefined();
      expect(consoleSpy).not.toHaveBeenCalledWith(
        expect.stringContaining('App icon not found')
      );
    });

    it('should handle window creation failure and cleanup properly', async () => {
      // Mock BrowserWindow constructor to fail
      const { BrowserWindow } = require('electron');
      BrowserWindow.mockImplementation(() => {
        throw new Error('Window creation failed');
      });
      
      await expect(windowManager.createMainWindow()).rejects.toThrow('Window creation failed');
      
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to create main window:',
        expect.any(Error)
      );
    });

    it('should handle application loading failure gracefully', async () => {
      // Mock loadURL to fail
      const mockWindow = {
        isDestroyed: jest.fn().mockReturnValue(false),
        focus: jest.fn(),
        getBounds: jest.fn().mockReturnValue({ x: 0, y: 0, width: 800, height: 600 }),
        isMaximized: jest.fn().mockReturnValue(false),
        isFullScreen: jest.fn().mockReturnValue(false),
        loadURL: jest.fn().mockRejectedValue(new Error('Load failed')),
        loadFile: jest.fn().mockRejectedValue(new Error('Load failed')),
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
      };
      
      const { BrowserWindow } = require('electron');
      BrowserWindow.mockImplementation(() => mockWindow);
      
      // Should not throw even if loading fails
      const window = await windowManager.createMainWindow();
      expect(window).toBeDefined();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to load application in main window:',
        expect.any(Error)
      );
    });

    it('should focus existing window instead of creating new one', async () => {
      // Create first window
      const firstWindow = await windowManager.createMainWindow();
      
      // Try to create second window
      const secondWindow = await windowManager.createMainWindow();
      
      // Should return the same window
      expect(secondWindow).toBe(firstWindow);
      expect(firstWindow.focus).toHaveBeenCalled();
    });
  });

  describe('Window event handling with errors', () => {
    it('should handle window event setup errors gracefully', async () => {
      // Mock window.on to throw error
      const mockWindow = {
        isDestroyed: jest.fn().mockReturnValue(false),
        focus: jest.fn(),
        getBounds: jest.fn().mockReturnValue({ x: 0, y: 0, width: 800, height: 600 }),
        isMaximized: jest.fn().mockReturnValue(false),
        isFullScreen: jest.fn().mockReturnValue(false),
        loadURL: jest.fn().mockResolvedValue(undefined),
        loadFile: jest.fn().mockResolvedValue(undefined),
        on: jest.fn().mockImplementation(() => {
          throw new Error('Event setup failed');
        }),
        once: jest.fn(),
        show: jest.fn(),
        webContents: {
          openDevTools: jest.fn(),
          send: jest.fn()
        }
      };
      
      const { BrowserWindow } = require('electron');
      BrowserWindow.mockImplementation(() => mockWindow);
      
      const window = await windowManager.createMainWindow();
      
      expect(window).toBeDefined();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to setup window events:',
        expect.any(Error)
      );
    });

    it('should handle window state change event errors', async () => {
      let windowEventHandlers: { [key: string]: Function } = {};
      
      const mockWindow = {
        isDestroyed: jest.fn().mockReturnValue(false),
        focus: jest.fn(),
        getBounds: jest.fn().mockReturnValue({ x: 0, y: 0, width: 800, height: 600 }),
        isMaximized: jest.fn().mockReturnValue(false),
        isFullScreen: jest.fn().mockReturnValue(false),
        loadURL: jest.fn().mockResolvedValue(undefined),
        loadFile: jest.fn().mockResolvedValue(undefined),
        on: jest.fn().mockImplementation((event, handler) => {
          windowEventHandlers[event] = handler;
        }),
        once: jest.fn((event, callback) => {
          if (event === 'ready-to-show') {
            setTimeout(callback, 0);
          }
        }),
        show: jest.fn(),
        webContents: {
          openDevTools: jest.fn(),
          send: jest.fn().mockImplementation(() => {
            throw new Error('Send failed');
          })
        }
      };
      
      const { BrowserWindow } = require('electron');
      BrowserWindow.mockImplementation(() => mockWindow);
      
      await windowManager.createMainWindow();
      
      // Trigger maximize event
      windowEventHandlers['maximize']();
      
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error handling window maximize event:',
        expect.any(Error)
      );
    });
  });

  describe('Asset path resolution edge cases', () => {
    it('should handle nativeImage creation errors', async () => {
      // Mock fs.existsSync to return true
      mockFs.existsSync.mockReturnValue(true);
      
      // Mock nativeImage.createFromPath to throw error
      const { nativeImage } = require('electron');
      nativeImage.createFromPath.mockImplementation(() => {
        throw new Error('Image creation failed');
      });
      
      // Access the private method through reflection for testing
      const getAppIcon = (windowManager as any).getAppIcon.bind(windowManager);
      const result = getAppIcon();
      
      expect(result).toBeUndefined();
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Error loading app icon: Image creation failed. Using system default icon.')
      );
    });

    it('should handle non-Error exceptions in getAppIcon', async () => {
      // Mock fs.existsSync to return true
      mockFs.existsSync.mockReturnValue(true);
      
      // Mock nativeImage.createFromPath to throw non-Error
      const { nativeImage } = require('electron');
      nativeImage.createFromPath.mockImplementation(() => {
        throw 'String error';
      });
      
      // Access the private method through reflection for testing
      const getAppIcon = (windowManager as any).getAppIcon.bind(windowManager);
      const result = getAppIcon();
      
      expect(result).toBeUndefined();
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Error loading app icon: Unknown error. Using system default icon.')
      );
    });
  });
});
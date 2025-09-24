/**
 * Application Startup Test
 * Simple test to verify application starts without errors and handles missing assets gracefully
 */

import * as fs from 'fs';

// Mock all required modules
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

jest.mock('electron-updater', () => ({
  autoUpdater: {
    checkForUpdatesAndNotify: jest.fn(),
    on: jest.fn(),
    quitAndInstall: jest.fn()
  }
}));

jest.mock('fs-extra');
jest.mock('fs');
jest.mock('chokidar', () => ({
  watch: jest.fn().mockReturnValue({
    on: jest.fn(),
    close: jest.fn()
  })
}));
jest.mock('uuid', () => ({
  v4: jest.fn().mockReturnValue('mock-uuid')
}));

const mockFs = fs as jest.Mocked<typeof fs>;

describe('Application Startup', () => {
  let consoleSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    jest.clearAllMocks();
    process.env.NODE_ENV = 'test';
  });

  afterEach(() => {
    consoleSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  it('should start application without errors when assets are missing', async () => {
    // Mock all assets as missing
    mockFs.existsSync.mockReturnValue(false);

    // Import and initialize the application
    const { ElectronApp } = await import('../main');
    const electronApp = new ElectronApp();
    
    // Should initialize without throwing
    await expect(electronApp.initialize()).resolves.not.toThrow();
    
    // Should log warnings for missing assets but not errors
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('Cannot create system tray: No tray icon found')
    );
    
    // Should not have initialization errors
    expect(consoleErrorSpy).not.toHaveBeenCalledWith(
      expect.stringContaining('Failed to initialize Electron app:')
    );
  });

  it('should start application successfully when assets are present', async () => {
    // Mock all assets as existing
    mockFs.existsSync.mockReturnValue(true);

    // Import and initialize the application
    const { ElectronApp } = await import('../main');
    const electronApp = new ElectronApp();
    
    // Should initialize without throwing
    await expect(electronApp.initialize()).resolves.not.toThrow();
    
    // Should not warn about missing assets
    expect(consoleSpy).not.toHaveBeenCalledWith(
      expect.stringContaining('Cannot create system tray: No tray icon found')
    );
    expect(consoleSpy).not.toHaveBeenCalledWith(
      expect.stringContaining('App icon not found at path:')
    );
  });

  it('should handle file system errors gracefully during startup', async () => {
    // Mock file system to throw errors
    mockFs.existsSync.mockImplementation(() => {
      throw new Error('File system error');
    });

    // Import and initialize the application
    const { ElectronApp } = await import('../main');
    const electronApp = new ElectronApp();
    
    // Should still initialize without throwing
    await expect(electronApp.initialize()).resolves.not.toThrow();
    
    // Should log file system errors
    expect(consoleSpy).toHaveBeenCalledWith(
      'Error checking development asset path:',
      expect.any(Error)
    );
  });

  it('should provide clear error messages for missing assets', async () => {
    // Mock assets as missing
    mockFs.existsSync.mockReturnValue(false);

    // Import and initialize the application
    const { ElectronApp } = await import('../main');
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
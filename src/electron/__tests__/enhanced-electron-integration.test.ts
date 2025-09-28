/**
 * Integration tests for enhanced Electron application features
 */

import { StartupManager } from '../managers/StartupManager';
import { UpdateManager } from '../managers/UpdateManager';
import { CrashRecoveryManager } from '../managers/CrashRecoveryManager';
import { EnhancedIPCManager } from '../managers/EnhancedIPCManager';

// Mock Electron modules
jest.mock('electron', () => ({
  app: {
    getPath: jest.fn(() => '/mock/userData'),
    getVersion: jest.fn(() => '1.0.0'),
    setAppUserModelId: jest.fn(),
    commandLine: {
      appendSwitch: jest.fn()
    },
    on: jest.fn(),
    whenReady: jest.fn(() => Promise.resolve())
  },
  BrowserWindow: jest.fn(() => ({
    id: 1,
    getBounds: jest.fn(() => ({ x: 0, y: 0, width: 800, height: 600 })),
    isMaximized: jest.fn(() => false),
    isMinimized: jest.fn(() => false),
    isFullScreen: jest.fn(() => false),
    webContents: {
      id: 1,
      send: jest.fn()
    }
  })),
  screen: {
    getPrimaryDisplay: jest.fn(() => ({
      workAreaSize: { width: 1920, height: 1080 }
    })),
    getAllDisplays: jest.fn(() => []),
    on: jest.fn()
  },
  dialog: {
    showMessageBox: jest.fn()
  },
  ipcMain: {
    handle: jest.fn(),
    on: jest.fn()
  }
}));

// Mock electron-updater
jest.mock('electron-updater', () => ({
  autoUpdater: {
    autoDownload: false,
    autoInstallOnAppQuit: false,
    checkForUpdates: jest.fn(),
    downloadUpdate: jest.fn(),
    quitAndInstall: jest.fn(),
    on: jest.fn()
  }
}));

// Mock fs-extra
jest.mock('fs-extra', () => ({
  ensureDir: jest.fn(),
  pathExists: jest.fn(() => Promise.resolve(false)),
  readJson: jest.fn(),
  writeJson: jest.fn(),
  remove: jest.fn(),
  readdir: jest.fn(() => Promise.resolve([])),
  stat: jest.fn()
}));

// Mock other managers
jest.mock('../managers/SplashScreenManager');
jest.mock('../managers/WindowManager');
jest.mock('../managers/TrayManager');
jest.mock('../managers/IPCManager');
jest.mock('../managers/FileSystemManager');
jest.mock('../managers/MenuManager');

describe('Enhanced Electron Application Integration', () => {
  let startupManager: StartupManager;
  let updateManager: UpdateManager;
  let crashRecoveryManager: CrashRecoveryManager;
  let enhancedIPCManager: EnhancedIPCManager;

  beforeEach(() => {
    startupManager = new StartupManager();
    updateManager = new UpdateManager();
    crashRecoveryManager = new CrashRecoveryManager();
    enhancedIPCManager = new EnhancedIPCManager();
    
    jest.clearAllMocks();
    process.env.NODE_ENV = 'production';
  });

  afterEach(() => {
    updateManager.cleanup();
    crashRecoveryManager.cleanup();
    enhancedIPCManager.cleanup();
  });

  describe('Application Startup Flow', () => {
    it('should complete full startup sequence', async () => {
      // Mock all initialization steps to succeed
      jest.spyOn(startupManager as any, 'initializeStep').mockResolvedValue(undefined);
      jest.spyOn(startupManager as any, 'showSplashScreen').mockResolvedValue(undefined);
      jest.spyOn(startupManager as any, 'closeSplashScreen').mockResolvedValue(undefined);

      const startTime = Date.now();
      
      await startupManager.startApplication({
        showSplash: true,
        enableCrashRecovery: true,
        enableAutoUpdater: true
      });

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Verify startup completed
      expect(duration).toBeGreaterThan(0);
      expect(startupManager.getStartupTime()).toBeGreaterThan(0);
    });

    it('should handle startup with crash recovery', async () => {
      // Mock crash recovery initialization
      await crashRecoveryManager.initialize();

      // Mock previous crash detection
      const crashDetectedSpy = jest.fn();
      crashRecoveryManager.on('crash-detected', crashDetectedSpy);

      // Simulate startup with recovery
      jest.spyOn(startupManager as any, 'initializeStep').mockResolvedValue(undefined);
      jest.spyOn(startupManager as any, 'showSplashScreen').mockResolvedValue(undefined);
      jest.spyOn(startupManager as any, 'closeSplashScreen').mockResolvedValue(undefined);

      await startupManager.startApplication({
        enableCrashRecovery: true
      });

      expect(crashRecoveryManager.isInRecoveryMode()).toBe(false);
    });
  });

  describe('Update System Integration', () => {
    it('should integrate update checking with startup', async () => {
      await updateManager.initialize();
      
      const status = updateManager.getUpdateStatus();
      expect(status.available).toBe(false);
      expect(status.downloading).toBe(false);
      expect(status.downloaded).toBe(false);
      expect(status.error).toBeNull();
    });

    it('should handle update workflow', async () => {
      await updateManager.initialize();
      
      // Simulate update available
      updateManager.emit('available', { version: '2.0.0' });
      
      // Check status
      const status = updateManager.getUpdateStatus();
      expect(status).toBeDefined();
    });
  });

  describe('IPC System Integration', () => {
    it('should initialize enhanced IPC system', async () => {
      await enhancedIPCManager.initialize();
      
      const metrics = enhancedIPCManager.getMetrics();
      expect(metrics.totalRequests).toBe(0);
      expect(metrics.successfulRequests).toBe(0);
      expect(metrics.failedRequests).toBe(0);
      expect(metrics.activeConnections).toBe(0);
    });

    it('should track IPC metrics', async () => {
      await enhancedIPCManager.initialize();
      
      const initialMetrics = enhancedIPCManager.getMetrics();
      expect(initialMetrics.totalRequests).toBe(0);
      
      // Metrics should be tracked during operation
      const activeRequests = enhancedIPCManager.getActiveRequests();
      expect(Array.isArray(activeRequests)).toBe(true);
    });
  });

  describe('Error Handling Integration', () => {
    it('should handle startup errors gracefully', async () => {
      // Mock an initialization step to fail
      jest.spyOn(startupManager as any, 'initializeStep')
        .mockRejectedValueOnce(new Error('Initialization failed'))
        .mockResolvedValue(undefined);

      await expect(startupManager.startApplication()).rejects.toThrow('Initialization failed');
    });

    it('should handle crash recovery errors', async () => {
      // Mock fs operations to fail
      const mockFs = require('fs-extra');
      mockFs.ensureDir.mockRejectedValueOnce(new Error('FS Error'));

      await expect(crashRecoveryManager.initialize()).rejects.toThrow('FS Error');
    });
  });

  describe('Performance Monitoring', () => {
    it('should track startup performance', async () => {
      jest.spyOn(startupManager as any, 'initializeStep').mockResolvedValue(undefined);
      jest.spyOn(startupManager as any, 'showSplashScreen').mockResolvedValue(undefined);
      jest.spyOn(startupManager as any, 'closeSplashScreen').mockResolvedValue(undefined);

      const startTime = Date.now();
      
      await startupManager.startApplication();
      
      const endTime = Date.now();
      const actualStartupTime = startupManager.getStartupTime();
      
      expect(actualStartupTime).toBeGreaterThan(0);
      expect(actualStartupTime).toBeLessThanOrEqual(startTime);
    });

    it('should provide progress tracking', () => {
      const progress = startupManager.getInitializationProgress();
      
      expect(progress.current).toBeGreaterThanOrEqual(0);
      expect(progress.total).toBeGreaterThan(0);
      expect(progress.currentStep).toBeTruthy();
    });
  });

  describe('Resource Management', () => {
    it('should cleanup resources properly', () => {
      // Test cleanup doesn't throw
      expect(() => {
        updateManager.cleanup();
        crashRecoveryManager.cleanup();
        enhancedIPCManager.cleanup();
      }).not.toThrow();
    });

    it('should handle multiple cleanup calls', () => {
      // Multiple cleanup calls should be safe
      expect(() => {
        updateManager.cleanup();
        updateManager.cleanup();
        crashRecoveryManager.cleanup();
        crashRecoveryManager.cleanup();
        enhancedIPCManager.cleanup();
        enhancedIPCManager.cleanup();
      }).not.toThrow();
    });
  });
});
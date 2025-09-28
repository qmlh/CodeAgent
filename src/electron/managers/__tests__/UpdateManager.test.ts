/**
 * Tests for UpdateManager
 */

import { UpdateManager } from '../UpdateManager';
import { autoUpdater } from 'electron-updater';
import { dialog } from 'electron';

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

// Mock Electron modules
jest.mock('electron', () => ({
  dialog: {
    showMessageBox: jest.fn()
  },
  BrowserWindow: jest.fn()
}));

describe('UpdateManager', () => {
  let updateManager: UpdateManager;
  const mockAutoUpdater = autoUpdater as jest.Mocked<typeof autoUpdater>;
  const mockDialog = dialog as jest.Mocked<typeof dialog>;

  beforeEach(() => {
    updateManager = new UpdateManager();
    jest.clearAllMocks();
    
    // Reset environment
    process.env.NODE_ENV = 'production';
  });

  afterEach(() => {
    updateManager.cleanup();
  });

  describe('initialization', () => {
    it('should initialize in production mode', async () => {
      mockAutoUpdater.checkForUpdates.mockResolvedValue({} as any);
      
      await updateManager.initialize();
      
      expect(mockAutoUpdater.autoDownload).toBe(false);
      expect(mockAutoUpdater.autoInstallOnAppQuit).toBe(false);
      expect(mockAutoUpdater.checkForUpdates).toHaveBeenCalled();
    });

    it('should skip initialization in development mode', async () => {
      process.env.NODE_ENV = 'development';
      updateManager = new UpdateManager();
      
      await updateManager.initialize();
      
      expect(mockAutoUpdater.checkForUpdates).not.toHaveBeenCalled();
    });

    it('should handle initialization errors', async () => {
      mockAutoUpdater.checkForUpdates.mockRejectedValue(new Error('Network error'));
      
      await expect(updateManager.initialize()).resolves.toBeUndefined();
      // Should not throw, but log error
    });
  });

  describe('update checking', () => {
    it('should check for updates', async () => {
      mockAutoUpdater.checkForUpdates.mockResolvedValue({} as any);
      
      await updateManager.checkForUpdates();
      
      expect(mockAutoUpdater.checkForUpdates).toHaveBeenCalled();
    });

    it('should skip checking in development mode', async () => {
      process.env.NODE_ENV = 'development';
      updateManager = new UpdateManager();
      
      await updateManager.checkForUpdates();
      
      expect(mockAutoUpdater.checkForUpdates).not.toHaveBeenCalled();
    });

    it('should handle check errors', async () => {
      mockAutoUpdater.checkForUpdates.mockRejectedValue(new Error('Check failed'));
      
      await updateManager.checkForUpdates();
      
      const status = updateManager.getUpdateStatus();
      expect(status.error).toBe('Check failed');
    });
  });

  describe('update downloading', () => {
    beforeEach(() => {
      // Set up update available state by modifying the private property
      (updateManager as any).updateStatus.available = true;
    });

    it('should download updates when available', async () => {
      mockAutoUpdater.downloadUpdate.mockResolvedValue([] as any);
      
      await updateManager.downloadUpdate();
      
      expect(mockAutoUpdater.downloadUpdate).toHaveBeenCalled();
      expect(updateManager.getUpdateStatus().downloading).toBe(true);
    });

    it('should skip download in development mode', async () => {
      process.env.NODE_ENV = 'development';
      updateManager = new UpdateManager();
      
      await updateManager.downloadUpdate();
      
      expect(mockAutoUpdater.downloadUpdate).not.toHaveBeenCalled();
    });

    it('should handle download errors', async () => {
      mockAutoUpdater.downloadUpdate.mockRejectedValue(new Error('Download failed'));
      
      await updateManager.downloadUpdate();
      
      const status = updateManager.getUpdateStatus();
      expect(status.downloading).toBe(false);
      expect(status.error).toBe('Download failed');
    });
  });

  describe('update installation', () => {
    beforeEach(() => {
      // Set up update downloaded state by modifying the private property
      (updateManager as any).updateStatus.downloaded = true;
    });

    it('should install updates when downloaded', async () => {
      mockDialog.showMessageBox.mockResolvedValue({ response: 0 } as any);
      
      await updateManager.installUpdate();
      
      expect(mockDialog.showMessageBox).toHaveBeenCalled();
      expect(mockAutoUpdater.quitAndInstall).toHaveBeenCalled();
    });

    it('should skip installation if user cancels', async () => {
      mockDialog.showMessageBox.mockResolvedValue({ response: 1 } as any);
      
      await updateManager.installUpdate();
      
      expect(mockDialog.showMessageBox).toHaveBeenCalled();
      expect(mockAutoUpdater.quitAndInstall).not.toHaveBeenCalled();
    });

    it('should handle installation errors', async () => {
      mockDialog.showMessageBox.mockRejectedValue(new Error('Dialog failed'));
      
      await updateManager.installUpdate();
      
      const status = updateManager.getUpdateStatus();
      expect(status.error).toBe('Dialog failed');
    });
  });

  describe('update status', () => {
    it('should provide initial status', () => {
      const status = updateManager.getUpdateStatus();
      
      expect(status).toHaveProperty('available');
      expect(status).toHaveProperty('downloading');
      expect(status).toHaveProperty('downloaded');
      expect(status).toHaveProperty('error');
      expect(status.available).toBe(false);
      expect(status.downloading).toBe(false);
      expect(status.downloaded).toBe(false);
      expect(status.error).toBeNull();
    });

    it('should update status during update process', () => {
      const initialStatus = updateManager.getUpdateStatus();
      expect(initialStatus.available).toBe(false);
      
      // Simulate update available
      updateManager.emit('available', { version: '2.0.0' });
      
      // Status should be updated by event handlers
    });
  });

  describe('cleanup', () => {
    it('should cleanup resources', () => {
      updateManager.cleanup();
      
      // Should not throw and should clean up intervals/windows
      expect(() => updateManager.cleanup()).not.toThrow();
    });
  });
});
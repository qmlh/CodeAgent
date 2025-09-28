/**
 * Tests for CrashRecoveryManager
 */

import { CrashRecoveryManager } from '../CrashRecoveryManager';
import { app, dialog } from 'electron';
import * as fs from 'fs-extra';

// Mock Electron modules
jest.mock('electron', () => ({
  app: {
    getPath: jest.fn(() => '/mock/userData'),
    getVersion: jest.fn(() => '1.0.0'),
    on: jest.fn()
  },
  dialog: {
    showMessageBox: jest.fn()
  },
  BrowserWindow: {
    getAllWindows: jest.fn(() => [])
  }
}));

// Mock fs-extra
jest.mock('fs-extra', () => ({
  ensureDir: jest.fn(),
  pathExists: jest.fn(),
  readJson: jest.fn(),
  writeJson: jest.fn(),
  remove: jest.fn(),
  readdir: jest.fn(),
  stat: jest.fn()
}));

describe('CrashRecoveryManager', () => {
  let crashRecoveryManager: CrashRecoveryManager;
  const mockApp = app as jest.Mocked<typeof app>;
  const mockDialog = dialog as jest.Mocked<typeof dialog>;
  const mockFs = fs as jest.Mocked<typeof fs>;

  beforeEach(() => {
    crashRecoveryManager = new CrashRecoveryManager();
    jest.clearAllMocks();
  });

  afterEach(() => {
    crashRecoveryManager.cleanup();
  });

  describe('initialization', () => {
    it('should initialize crash recovery system', async () => {
      mockFs.ensureDir.mockResolvedValue(undefined);
      mockFs.pathExists.mockResolvedValue(false);
      
      await crashRecoveryManager.initialize();
      
      expect(mockFs.ensureDir).toHaveBeenCalled();
    });

    it('should detect previous crash', async () => {
      const oldRecoveryData = {
        windowStates: [],
        openFiles: [],
        userPreferences: {},
        lastSaveTime: new Date(Date.now() - 10 * 60 * 1000) // 10 minutes ago
      };
      
      mockFs.ensureDir.mockResolvedValue(undefined);
      mockFs.pathExists.mockResolvedValue(true);
      mockFs.readJson.mockResolvedValue(oldRecoveryData);
      mockDialog.showMessageBox.mockResolvedValue({ response: 0 } as any);
      
      const crashDetectedSpy = jest.fn();
      crashRecoveryManager.on('crash-detected', crashDetectedSpy);
      
      await crashRecoveryManager.initialize();
      
      expect(crashDetectedSpy).toHaveBeenCalledWith(oldRecoveryData);
    });

    it('should not detect crash for recent saves', async () => {
      const recentRecoveryData = {
        windowStates: [],
        openFiles: [],
        userPreferences: {},
        lastSaveTime: new Date(Date.now() - 1000) // 1 second ago
      };
      
      mockFs.ensureDir.mockResolvedValue(undefined);
      mockFs.pathExists.mockResolvedValue(true);
      mockFs.readJson.mockResolvedValue(recentRecoveryData);
      
      const crashDetectedSpy = jest.fn();
      crashRecoveryManager.on('crash-detected', crashDetectedSpy);
      
      await crashRecoveryManager.initialize();
      
      expect(crashDetectedSpy).not.toHaveBeenCalled();
      expect(mockFs.remove).toHaveBeenCalled(); // Should clear recovery data
    });
  });

  describe('recovery data management', () => {
    it('should save recovery data', async () => {
      const recoveryData = {
        windowStates: [{ id: 1, bounds: { x: 0, y: 0, width: 800, height: 600 } }],
        openFiles: ['test.js'],
        userPreferences: { theme: 'dark' }
      };
      
      mockFs.readJson.mockResolvedValue({});
      mockFs.writeJson.mockResolvedValue(undefined);
      
      await crashRecoveryManager.saveRecoveryData(recoveryData);
      
      expect(mockFs.writeJson).toHaveBeenCalled();
    });

    it('should load recovery data', async () => {
      const expectedData = {
        windowStates: [],
        openFiles: [],
        userPreferences: {},
        lastSaveTime: new Date()
      };
      
      mockFs.pathExists.mockResolvedValue(true);
      mockFs.readJson.mockResolvedValue(expectedData);
      
      const result = await crashRecoveryManager.loadRecoveryData();
      
      expect(result).toEqual(expectedData);
    });

    it('should return null when no recovery data exists', async () => {
      mockFs.pathExists.mockResolvedValue(false);
      
      const result = await crashRecoveryManager.loadRecoveryData();
      
      expect(result).toBeNull();
    });

    it('should clear recovery data', async () => {
      mockFs.pathExists.mockResolvedValue(true);
      mockFs.remove.mockResolvedValue(undefined);
      
      await crashRecoveryManager.clearRecoveryData();
      
      expect(mockFs.remove).toHaveBeenCalled();
    });
  });

  describe('crash reporting', () => {
    it('should report crashes', async () => {
      const error = new Error('Test crash');
      const additionalData = { context: 'test' };
      
      mockFs.writeJson.mockResolvedValue(undefined);
      mockDialog.showMessageBox.mockResolvedValue({ response: 1 } as any);
      
      const crashReportedSpy = jest.fn();
      crashRecoveryManager.on('crash-reported', crashReportedSpy);
      
      await crashRecoveryManager.reportCrash(error, additionalData);
      
      expect(mockFs.writeJson).toHaveBeenCalled();
      expect(crashReportedSpy).toHaveBeenCalled();
      expect(mockDialog.showMessageBox).toHaveBeenCalled();
    });

    it('should get crash reports', async () => {
      const mockFiles = ['crash-123.json', 'crash-456.json', 'other.txt'];
      const mockReport1 = { timestamp: new Date('2023-01-01'), error: 'Error 1' };
      const mockReport2 = { timestamp: new Date('2023-01-02'), error: 'Error 2' };
      
      mockFs.readdir.mockResolvedValue(mockFiles as any);
      mockFs.readJson
        .mockResolvedValueOnce(mockReport1)
        .mockResolvedValueOnce(mockReport2);
      
      const reports = await crashRecoveryManager.getCrashReports();
      
      expect(reports).toHaveLength(2);
      expect(reports[0].timestamp).toEqual(new Date('2023-01-02')); // Should be sorted by date desc
      expect(reports[1].timestamp).toEqual(new Date('2023-01-01'));
    });

    it('should cleanup old crash reports', async () => {
      const oldDate = new Date(Date.now() - 40 * 24 * 60 * 60 * 1000); // 40 days ago
      const recentDate = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000); // 10 days ago
      
      mockFs.readdir.mockResolvedValue(['old-report.json', 'recent-report.json'] as any);
      mockFs.stat
        .mockResolvedValueOnce({ mtime: oldDate } as any)
        .mockResolvedValueOnce({ mtime: recentDate } as any);
      mockFs.remove.mockResolvedValue(undefined);
      
      await crashRecoveryManager.cleanupOldCrashReports(30 * 24 * 60 * 60 * 1000); // 30 days
      
      expect(mockFs.remove).toHaveBeenCalledTimes(1); // Only old report should be removed
    });
  });

  describe('recovery dialog', () => {
    it('should show recovery dialog and return user choice', async () => {
      mockDialog.showMessageBox.mockResolvedValue({ response: 0 } as any);
      
      const result = await crashRecoveryManager.showRecoveryDialog();
      
      expect(result).toBe(true);
      expect(mockDialog.showMessageBox).toHaveBeenCalled();
    });

    it('should handle user declining recovery', async () => {
      mockDialog.showMessageBox.mockResolvedValue({ response: 1 } as any);
      
      const result = await crashRecoveryManager.showRecoveryDialog();
      
      expect(result).toBe(false);
    });
  });

  describe('recovery mode', () => {
    it('should track recovery mode state', () => {
      expect(crashRecoveryManager.isInRecoveryMode()).toBe(false);
      
      // Recovery mode would be set during initialization if crash detected
    });
  });

  describe('cleanup', () => {
    it('should cleanup resources', () => {
      crashRecoveryManager.cleanup();
      
      // Should not throw and should clean up intervals
      expect(() => crashRecoveryManager.cleanup()).not.toThrow();
    });
  });
});
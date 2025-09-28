/**
 * Tests for StartupManager
 */

import { StartupManager } from '../StartupManager';
import { app } from 'electron';

// Mock Electron modules
jest.mock('electron', () => ({
  app: {
    getPath: jest.fn(() => '/mock/path'),
    setAppUserModelId: jest.fn(),
    commandLine: {
      appendSwitch: jest.fn()
    },
    on: jest.fn()
  },
  BrowserWindow: jest.fn(),
  screen: {
    getPrimaryDisplay: jest.fn(() => ({
      workAreaSize: { width: 1920, height: 1080 }
    }))
  }
}));

// Mock managers
jest.mock('../SplashScreenManager');
jest.mock('../WindowManager');
jest.mock('../TrayManager');
jest.mock('../IPCManager');
jest.mock('../FileSystemManager');
jest.mock('../MenuManager');
jest.mock('../UpdateManager');
jest.mock('../CrashRecoveryManager');

describe('StartupManager', () => {
  let startupManager: StartupManager;

  beforeEach(() => {
    startupManager = new StartupManager();
    jest.clearAllMocks();
  });

  describe('initialization', () => {
    it('should create startup manager with default configuration', () => {
      expect(startupManager).toBeInstanceOf(StartupManager);
    });

    it('should track startup time', () => {
      const startTime = startupManager.getStartupTime();
      expect(typeof startTime).toBe('number');
    });

    it('should provide initialization progress', () => {
      const progress = startupManager.getInitializationProgress();
      expect(progress).toHaveProperty('current');
      expect(progress).toHaveProperty('total');
      expect(progress).toHaveProperty('currentStep');
      expect(typeof progress.current).toBe('number');
      expect(typeof progress.total).toBe('number');
      expect(typeof progress.currentStep).toBe('string');
    });
  });

  describe('startApplication', () => {
    it('should start application with default options', async () => {
      const mockOptions = {};
      
      // Mock the initialization steps to resolve quickly
      jest.spyOn(startupManager as any, 'initializeStep').mockResolvedValue(undefined);
      jest.spyOn(startupManager as any, 'showSplashScreen').mockResolvedValue(undefined);
      jest.spyOn(startupManager as any, 'closeSplashScreen').mockResolvedValue(undefined);

      await expect(startupManager.startApplication(mockOptions)).resolves.toBeUndefined();
    });

    it('should handle startup errors gracefully', async () => {
      const mockOptions = { showSplash: false };
      
      // Mock an initialization step to fail
      jest.spyOn(startupManager as any, 'initializeStep').mockRejectedValue(new Error('Test error'));

      await expect(startupManager.startApplication(mockOptions)).rejects.toThrow('Test error');
    });

    it('should skip splash screen when disabled', async () => {
      const mockOptions = { showSplash: false };
      
      const showSplashSpy = jest.spyOn(startupManager as any, 'showSplashScreen').mockResolvedValue(undefined);
      const closeSplashSpy = jest.spyOn(startupManager as any, 'closeSplashScreen').mockResolvedValue(undefined);
      jest.spyOn(startupManager as any, 'initializeStep').mockResolvedValue(undefined);

      await startupManager.startApplication(mockOptions);

      expect(showSplashSpy).not.toHaveBeenCalled();
      expect(closeSplashSpy).not.toHaveBeenCalled();
    });

    it('should skip crash recovery when disabled', async () => {
      const mockOptions = { enableCrashRecovery: false };
      
      jest.spyOn(startupManager as any, 'initializeStep').mockImplementation((stepName, initFunction) => {
        if (stepName === 'Initializing crash recovery system') {
          throw new Error('Crash recovery should be skipped');
        }
        return Promise.resolve();
      });

      await expect(startupManager.startApplication(mockOptions)).resolves.toBeUndefined();
    });
  });

  describe('progress tracking', () => {
    it('should update progress during initialization', () => {
      const initialProgress = startupManager.getInitializationProgress();
      expect(initialProgress.current).toBe(0);
      
      // Progress should be tracked as steps complete
      expect(initialProgress.total).toBeGreaterThan(0);
    });

    it('should provide meaningful step names', () => {
      const progress = startupManager.getInitializationProgress();
      expect(progress.currentStep).toBeTruthy();
      expect(typeof progress.currentStep).toBe('string');
    });
  });
});
/**
 * Asset Path Resolution Tests
 * Tests for asset path resolution and error handling
 */

import { getAssetPath, assetExists } from '../assetPaths';
import * as fs from 'fs';

// Mock fs module
jest.mock('fs');
const mockFs = fs as jest.Mocked<typeof fs>;

describe('Asset Path Resolution', () => {
  let consoleSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    jest.clearAllMocks();
  });

  afterEach(() => {
    consoleSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  describe('getAssetPath', () => {
    it('should return a valid path when assets exist', () => {
      // Mock fs.existsSync to return true
      mockFs.existsSync.mockReturnValue(true);

      const result = getAssetPath('icons/app-icon.png');
      
      expect(result).toBeDefined();
      expect(result).toMatch(/app-icon\.png$/);
      expect(mockFs.existsSync).toHaveBeenCalled();
    });

    it('should return fallback path when assets do not exist', () => {
      // Mock fs.existsSync to return false for both paths
      mockFs.existsSync.mockReturnValue(false);

      const result = getAssetPath('icons/missing-icon.png');
      
      expect(result).toBeDefined();
      expect(result).toMatch(/missing-icon\.png$/);
    });

    it('should handle file system errors gracefully', () => {
      // Mock fs.existsSync to throw an error
      mockFs.existsSync.mockImplementation(() => {
        throw new Error('File system error');
      });

      const result = getAssetPath('icons/error-icon.png');
      
      expect(result).toBeDefined();
      expect(result).toMatch(/error-icon\.png$/);
      expect(consoleSpy).toHaveBeenCalledWith('Error checking development asset path:', expect.any(Error));
      expect(consoleSpy).toHaveBeenCalledWith('Error checking production asset path:', expect.any(Error));
    });

    it('should prefer development path over production path', () => {
      // Mock fs.existsSync to return true for dev path first
      let callCount = 0;
      mockFs.existsSync.mockImplementation((filePath: string) => {
        callCount++;
        // First call (dev path) returns true
        return callCount === 1;
      });

      const result = getAssetPath('icons/dev-icon.png');
      
      expect(result).toBeDefined();
      expect(result).toMatch(/dev-icon\.png$/);
      expect(mockFs.existsSync).toHaveBeenCalledTimes(1); // Should stop after finding dev path
    });

    it('should use production path when dev path fails', () => {
      // Mock fs.existsSync to return false for dev, true for prod
      let callCount = 0;
      mockFs.existsSync.mockImplementation((filePath: string) => {
        callCount++;
        // First call (dev path) returns false, second call (prod path) returns true
        return callCount === 2;
      });

      const result = getAssetPath('icons/prod-icon.png');
      
      expect(result).toBeDefined();
      expect(result).toMatch(/prod-icon\.png$/);
      expect(mockFs.existsSync).toHaveBeenCalledTimes(2);
    });
  });

  describe('assetExists', () => {
    it('should return true when asset exists', () => {
      // Mock fs.existsSync to return true
      mockFs.existsSync.mockReturnValue(true);

      const result = assetExists('icons/existing-icon.png');
      
      expect(result).toBe(true);
      expect(mockFs.existsSync).toHaveBeenCalled();
    });

    it('should return false when asset does not exist', () => {
      // Mock fs.existsSync to return false
      mockFs.existsSync.mockReturnValue(false);

      const result = assetExists('icons/missing-icon.png');
      
      expect(result).toBe(false);
    });

    it('should return false and log warning when error occurs', () => {
      // Mock getAssetPath to throw an error by making fs.existsSync throw
      mockFs.existsSync.mockImplementation(() => {
        throw new Error('File system access error');
      });

      const result = assetExists('icons/error-icon.png');
      
      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith('Error checking if asset exists:', expect.any(Error));
    });
  });
});
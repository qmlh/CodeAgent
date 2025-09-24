import * as path from 'path';
import * as fs from 'fs';

/**
 * Resolves the correct path to assets directory for both development and production environments
 * @param assetPath - Relative path within the assets directory (e.g., 'icons/app-icon.png')
 * @returns Absolute path to the asset file
 */
export function getAssetPath(assetPath: string): string {
  try {
    // In development, assets are in the project root
    const devPath = path.join(__dirname, '../../../assets', assetPath);
    
    // In production (built app), assets are copied to dist/assets
    const prodPath = path.join(__dirname, '../assets', assetPath);
    
    // Check if we're in development or production by testing which path exists
    try {
      if (fs.existsSync(devPath)) {
        return devPath;
      }
    } catch (devError) {
      console.warn('Error checking development asset path:', devError);
    }
    
    try {
      if (fs.existsSync(prodPath)) {
        return prodPath;
      }
    } catch (prodError) {
      console.warn('Error checking production asset path:', prodError);
    }
    
    // If neither exists, return the production path (for error handling)
    return prodPath;
  } catch (error) {
    console.error('Error resolving asset path:', error);
    // Return a fallback path
    return path.join(__dirname, '../assets', assetPath);
  }
}

/**
 * Checks if an asset file exists
 * @param assetPath - Relative path within the assets directory
 * @returns True if the asset exists, false otherwise
 */
export function assetExists(assetPath: string): boolean {
  try {
    const fullPath = getAssetPath(assetPath);
    return fs.existsSync(fullPath);
  } catch (error) {
    console.warn('Error checking if asset exists:', error);
    return false;
  }
}
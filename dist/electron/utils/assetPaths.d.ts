/**
 * Resolves the correct path to assets directory for both development and production environments
 * @param assetPath - Relative path within the assets directory (e.g., 'icons/app-icon.png')
 * @returns Absolute path to the asset file
 */
export declare function getAssetPath(assetPath: string): string;
/**
 * Checks if an asset file exists
 * @param assetPath - Relative path within the assets directory
 * @returns True if the asset exists, false otherwise
 */
export declare function assetExists(assetPath: string): boolean;

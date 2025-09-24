/**
 * File System Events Hook
 * Custom hook for managing file system events and real-time updates
 */
import { FileWatchEvent } from '../services/FileWatcherService';
export interface UseFileSystemEventsOptions {
    enableNotifications?: boolean;
    debounceDelay?: number;
    ignoredPatterns?: RegExp[];
    onFileAdded?: (event: FileWatchEvent) => void;
    onFileChanged?: (event: FileWatchEvent) => void;
    onFileDeleted?: (event: FileWatchEvent) => void;
    onDirectoryAdded?: (event: FileWatchEvent) => void;
    onDirectoryDeleted?: (event: FileWatchEvent) => void;
    onError?: (event: FileWatchEvent) => void;
}
export declare const useFileSystemEvents: (workspacePath: string | null, options?: UseFileSystemEventsOptions) => {
    isWatching: boolean;
    watcherId: string | null;
    refreshWatcher: () => Promise<void>;
    pauseWatcher: () => void;
    resumeWatcher: () => void;
    getWatcherStats: () => {
        totalWatchers: number;
        watchedPaths: string[];
        memoryUsage?: number;
    };
};
export declare const useFileOperations: () => {
    operations: any[];
    activeOperations: string[];
    getOperation: (id: string) => any;
    clearCompleted: () => void;
};
export declare const useFileValidation: () => {
    validateFileName: (fileName: string) => Promise<import("../services/FileOperationsService").FileValidationResult>;
    validateFilePath: (filePath: string) => Promise<{
        valid: boolean;
        exists: any;
        errors: never[];
        warnings: string[];
    } | {
        valid: boolean;
        exists: boolean;
        errors: string[];
        warnings: never[];
    }>;
};

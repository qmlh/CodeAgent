/**
 * File System Events Hook
 * Custom hook for managing file system events and real-time updates
 */
import { FileChangeEvent } from '../services/FileWatcherService';
export interface UseFileSystemEventsOptions {
    enableNotifications?: boolean;
    debounceDelay?: number;
    ignoredPatterns?: RegExp[];
    onFileAdded?: (event: FileChangeEvent) => void;
    onFileChanged?: (event: FileChangeEvent) => void;
    onFileDeleted?: (event: FileChangeEvent) => void;
    onDirectoryAdded?: (event: FileChangeEvent) => void;
    onDirectoryDeleted?: (event: FileChangeEvent) => void;
    onError?: (event: FileChangeEvent) => void;
}
export declare const useFileSystemEvents: (workspacePath: string | null, options?: UseFileSystemEventsOptions) => {
    isWatching: boolean;
    watcherId: string | null;
    refreshWatcher: () => Promise<void>;
    pauseWatcher: () => void;
    resumeWatcher: () => void;
    getWatcherStats: () => {
        watchedDirectories: string[];
        isActive: boolean;
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

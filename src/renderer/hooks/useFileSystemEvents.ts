/**
 * File System Events Hook
 * Custom hook for managing file system events and real-time updates
 */

import { useEffect, useCallback, useRef, useState } from 'react';
import { useAppDispatch } from './redux';
import { handleFileSystemEvent } from '../store/slices/fileSlice';
import { fileWatcherService, FileWatchEvent } from '../services/FileWatcherService';
import { fileOperationsService } from '../services/FileOperationsService';

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

export const useFileSystemEvents = (
  workspacePath: string | null,
  options: UseFileSystemEventsOptions = {}
) => {
  const dispatch = useAppDispatch();
  const watcherIdRef = useRef<string | null>(null);
  const {
    enableNotifications = true,
    debounceDelay = 300,
    ignoredPatterns = [/\/\./], // Ignore hidden files by default
    onFileAdded,
    onFileChanged,
    onFileDeleted,
    onDirectoryAdded,
    onDirectoryDeleted,
    onError
  } = options;

  // Check if file should be ignored
  const shouldIgnoreFile = useCallback((filePath: string): boolean => {
    return ignoredPatterns.some(pattern => pattern.test(filePath));
  }, [ignoredPatterns]);

  // Handle file system events
  const handleEvent = useCallback((event: FileWatchEvent) => {
    // Skip ignored files
    if (event.path && shouldIgnoreFile(event.path)) {
      return;
    }

    // Dispatch to Redux store
    dispatch(handleFileSystemEvent({
      eventType: event.type,
      filename: event.filename || event.path,
      path: event.path
    }));

    // Call specific event handlers
    switch (event.type) {
      case 'add':
        onFileAdded?.(event);
        break;
      case 'change':
        onFileChanged?.(event);
        break;
      case 'unlink':
        onFileDeleted?.(event);
        break;
      case 'addDir':
        onDirectoryAdded?.(event);
        break;
      case 'unlinkDir':
        onDirectoryDeleted?.(event);
        break;
      case 'error':
        onError?.(event);
        break;
    }
  }, [
    dispatch,
    shouldIgnoreFile,
    onFileAdded,
    onFileChanged,
    onFileDeleted,
    onDirectoryAdded,
    onDirectoryDeleted,
    onError
  ]);

  // Create debounced event handler if needed
  const debouncedHandler = useCallback(
    debounceDelay > 0
      ? fileWatcherService.createDebouncedCallback(handleEvent, debounceDelay)
      : handleEvent,
    [handleEvent, debounceDelay]
  );

  // Set up file watcher when workspace changes
  useEffect(() => {
    if (!workspacePath) {
      // Clean up existing watcher
      if (watcherIdRef.current) {
        fileWatcherService.unwatchDirectory(watcherIdRef.current).catch(console.error);
        watcherIdRef.current = null;
      }
      return;
    }

    // Set up new watcher
    const setupWatcher = async () => {
      try {
        const watcherId = await fileWatcherService.watchDirectory(
          workspacePath,
          debouncedHandler
        );
        watcherIdRef.current = watcherId;
      } catch (error) {
        console.error('Failed to set up file watcher:', error);
      }
    };

    setupWatcher();

    // Cleanup function
    return () => {
      if (watcherIdRef.current) {
        fileWatcherService.unwatchDirectory(watcherIdRef.current).catch(console.error);
        watcherIdRef.current = null;
      }
    };
  }, [workspacePath, debouncedHandler]);

  // Return utility functions
  return {
    isWatching: workspacePath ? fileWatcherService.isWatching(workspacePath) : false,
    watcherId: watcherIdRef.current,

    // Manual event handlers
    refreshWatcher: useCallback(async () => {
      if (workspacePath && watcherIdRef.current) {
        await fileWatcherService.unwatchDirectory(watcherIdRef.current);
        const newWatcherId = await fileWatcherService.watchDirectory(
          workspacePath,
          debouncedHandler
        );
        watcherIdRef.current = newWatcherId;
      }
    }, [workspacePath, debouncedHandler]),

    pauseWatcher: useCallback(() => {
      fileWatcherService.pauseAllWatchers();
    }, []),

    resumeWatcher: useCallback(() => {
      fileWatcherService.resumeAllWatchers();
    }, []),

    getWatcherStats: useCallback(() => {
      return fileWatcherService.getWatcherStats();
    }, [])
  };
};

// Hook for file operations with progress tracking
export const useFileOperations = () => {
  const [operations, setOperations] = useState<Map<string, any>>(new Map());
  const [activeOperations, setActiveOperations] = useState<string[]>([]);

  useEffect(() => {
    const handleOperationCreated = (operation: any) => {
      setOperations(prev => new Map(prev.set(operation.id, operation)));
      setActiveOperations(prev => [...prev, operation.id]);
    };

    const handleOperationUpdated = (operation: any) => {
      setOperations(prev => new Map(prev.set(operation.id, operation)));
    };

    const handleOperationCompleted = (operation: any) => {
      setOperations(prev => new Map(prev.set(operation.id, operation)));
      setActiveOperations(prev => prev.filter(id => id !== operation.id));
    };

    // Register event listeners
    fileOperationsService.on('operationCreated', handleOperationCreated);
    fileOperationsService.on('operationUpdated', handleOperationUpdated);
    fileOperationsService.on('operationCompleted', handleOperationCompleted);

    return () => {
      fileOperationsService.off('operationCreated', handleOperationCreated);
      fileOperationsService.off('operationUpdated', handleOperationUpdated);
      fileOperationsService.off('operationCompleted', handleOperationCompleted);
    };
  }, []);

  return {
    operations: Array.from(operations.values()),
    activeOperations,
    getOperation: (id: string) => operations.get(id),
    clearCompleted: () => {
      fileOperationsService.clearCompletedOperations();
      setOperations(prev => {
        const newMap = new Map();
        for (const [id, op] of prev.entries()) {
          if (op.status === 'running' || op.status === 'pending') {
            newMap.set(id, op);
          }
        }
        return newMap;
      });
    }
  };
};

// Hook for file validation
export const useFileValidation = () => {
  const validateFileName = useCallback(async (fileName: string) => {
    try {
      return await fileOperationsService.validateFileName(fileName);
    } catch (error) {
      return {
        valid: false,
        errors: [error instanceof Error ? error.message : 'Validation failed'],
        warnings: []
      };
    }
  }, []);

  const validateFilePath = useCallback(async (filePath: string) => {
    try {
      const exists = await window.electronAPI?.fs.exists(filePath);
      return {
        valid: true,
        exists: exists?.success ? exists.exists : false,
        errors: [],
        warnings: exists?.exists ? ['File already exists'] : []
      };
    } catch (error) {
      return {
        valid: false,
        exists: false,
        errors: [error instanceof Error ? error.message : 'Path validation failed'],
        warnings: []
      };
    }
  }, []);

  return {
    validateFileName,
    validateFilePath
  };
};
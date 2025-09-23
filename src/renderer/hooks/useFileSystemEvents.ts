/**
 * File System Events Hook
 * Handles file system change events from the main process
 */

import { useEffect } from 'react';
import { useAppDispatch } from './redux';
import { handleFileSystemEvent, loadWorkspace } from '../store/slices/fileSlice';

export const useFileSystemEvents = (workspacePath: string | null) => {
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (!workspacePath) return;

    const handleDirectoryChanged = (data: {
      path: string;
      eventType: string;
      filename: string;
    }) => {
      // Dispatch the file system event to update the store
      dispatch(handleFileSystemEvent({
        eventType: data.eventType,
        filename: data.filename,
        path: data.filename
      }));

      // For major changes, refresh the workspace
      if (['addDir', 'unlinkDir'].includes(data.eventType)) {
        // Debounce workspace refresh to avoid too many updates
        setTimeout(() => {
          dispatch(loadWorkspace(workspacePath));
        }, 500);
      }
    };

    // Set up the event listener
    window.electronAPI?.fs.onDirectoryChanged(handleDirectoryChanged);

    // Cleanup function
    return () => {
      // Remove event listeners if needed
      window.electronAPI?.removeAllListeners('fs:directory-changed');
    };
  }, [workspacePath, dispatch]);
};
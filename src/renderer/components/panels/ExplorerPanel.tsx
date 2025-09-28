/**
 * Explorer Panel Component
 * File system explorer with enhanced file management
 */

import React, { useState, useEffect } from 'react';
import { Button, message, Divider, notification } from 'antd';
import { FolderOpenOutlined } from '@ant-design/icons';
import { useAppSelector, useAppDispatch } from '../../hooks/redux';
import { useFileSystemEvents } from '../../hooks/useFileSystemEvents';
import { 
  loadWorkspace, 
  loadDirectory,
  openFile, 
  expandDirectory, 
  collapseDirectory,
  createFile,
  createDirectory,
  deleteFile
} from '../../store/slices/fileSlice';
import { FileManager } from '../file-tree/FileManager';
import { FileItem } from '../../store/slices/fileSlice';
import { fileWatcherService, FileChangeEvent } from '../../services/FileWatcherService';
import { fileOperationsService, FileOperation } from '../../services/FileOperationsService';

export const ExplorerPanel: React.FC = () => {
  const dispatch = useAppDispatch();
  const { currentWorkspace, fileTree, activeFile } = useAppSelector(state => state.file);
  const [expandedDirectories, setExpandedDirectories] = useState<Set<string>>(new Set());
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);

  // Set up file system event listening
  useFileSystemEvents(currentWorkspace);

  // Set up enhanced file operations and monitoring
  useEffect(() => {
    // Set up file operation event listeners
    const handleOperationCompleted = (operation: FileOperation) => {
      if (operation.status === 'completed') {
        message.success(`${operation.type} operation completed successfully`);
      } else if (operation.status === 'failed') {
        message.error(`${operation.type} operation failed: ${operation.error}`);
      }
    };

    const handleOperationUpdated = (operation: FileOperation) => {
      if (operation.status === 'running' && operation.progress > 0) {
        // Show progress notification for long-running operations
        if (operation.totalSize && operation.totalSize > 1024 * 1024) { // > 1MB
          notification.info({
            key: operation.id,
            message: `${operation.type} in progress`,
            description: `${operation.progress}% complete`,
            duration: 0
          });
        }
      } else if (operation.status === 'completed' || operation.status === 'failed') {
        notification.destroy(operation.id);
      }
    };

    // Set up file watcher event listeners for real-time notifications
    const handleFileChange = (event: FileChangeEvent) => {
      const fileName = event.filename || event.path.split('/').pop() || '';
      
      switch (event.type) {
        case 'add':
          if (fileName && !fileName.startsWith('.')) {
            notification.success({
              message: 'File Added',
              description: `${fileName} was added to the workspace`,
              duration: 3,
              placement: 'bottomRight'
            });
          }
          break;
        case 'unlink':
          if (fileName && !fileName.startsWith('.')) {
            notification.info({
              message: 'File Deleted',
              description: `${fileName} was removed from the workspace`,
              duration: 3,
              placement: 'bottomRight'
            });
          }
          break;
        case 'addDir':
          if (fileName && !fileName.startsWith('.')) {
            notification.success({
              message: 'Folder Added',
              description: `${fileName} folder was created`,
              duration: 3,
              placement: 'bottomRight'
            });
          }
          break;
        case 'unlinkDir':
          if (fileName && !fileName.startsWith('.')) {
            notification.info({
              message: 'Folder Deleted',
              description: `${fileName} folder was removed`,
              duration: 3,
              placement: 'bottomRight'
            });
          }
          break;
        case 'error':
          notification.error({
            message: 'File System Error',
            description: event.error || 'An error occurred while monitoring files',
            duration: 5,
            placement: 'bottomRight'
          });
          break;
      }
    };

    // Register event listeners
    fileOperationsService.on('operationCompleted', handleOperationCompleted);
    fileOperationsService.on('operationUpdated', handleOperationUpdated);
    fileWatcherService.on('fileChange', handleFileChange);

    return () => {
      // Cleanup event listeners
      fileOperationsService.off('operationCompleted', handleOperationCompleted);
      fileOperationsService.off('operationUpdated', handleOperationUpdated);
      fileWatcherService.off('fileChange', handleFileChange);
    };
  }, []);

  // Update expanded directories from Redux state
  useEffect(() => {
    const updateExpanded = (items: FileItem[], expanded: Set<string>) => {
      items.forEach(item => {
        if (item.isDirectory && item.expanded) {
          expanded.add(item.path);
        }
        if (item.children) {
          updateExpanded(item.children, expanded);
        }
      });
    };

    const newExpanded = new Set<string>();
    updateExpanded(fileTree, newExpanded);
    setExpandedDirectories(newExpanded);
  }, [fileTree]);

  const handleOpenProject = async () => {
    try {
      const result = await window.electronAPI?.app.showOpenDialog({
        properties: ['openDirectory'],
        title: 'Open Project Folder'
      });

      if (result?.success && !result.canceled && result.filePaths?.length > 0) {
        const projectPath = result.filePaths[0];
        await dispatch(loadWorkspace(projectPath)).unwrap();
        message.success('Project opened successfully');
      }
    } catch (error) {
      message.error('Failed to open project');
      console.error('Error opening project:', error);
    }
  };

  const handleFileSelect = async (file: FileItem) => {
    setSelectedFile(file);
    
    if (file.isFile) {
      try {
        await dispatch(openFile(file.path)).unwrap();
      } catch (error) {
        message.error('Failed to open file');
        console.error('Error opening file:', error);
      }
    }
  };

  const handleDirectoryExpand = async (path: string) => {
    try {
      // First load the directory contents
      await dispatch(loadDirectory(path));
      // Then expand it in the UI
      await dispatch(expandDirectory(path));
      setExpandedDirectories(prev => new Set([...prev, path]));
    } catch (error) {
      message.error('Failed to expand directory');
    }
  };

  const handleDirectoryCollapse = (path: string) => {
    dispatch(collapseDirectory(path));
    setExpandedDirectories(prev => {
      const newSet = new Set(prev);
      newSet.delete(path);
      return newSet;
    });
  };

  const handleFileCreate = async (parentPath: string, fileName: string) => {
    try {
      const filePath = await window.electronAPI?.fs.joinPath(parentPath, fileName);
      if (filePath?.success) {
        // Use enhanced file operations service
        await fileOperationsService.createFile(filePath.path);
        await dispatch(createFile({ filePath: filePath.path })).unwrap();
        
        // Refresh workspace to reflect changes
        if (currentWorkspace) {
          dispatch(loadWorkspace(currentWorkspace));
        }
      }
    } catch (error) {
      // Error handling is done by the service
      console.error('File creation error:', error);
    }
  };

  const handleDirectoryCreate = async (parentPath: string, dirName: string) => {
    try {
      const dirPath = await window.electronAPI?.fs.joinPath(parentPath, dirName);
      if (dirPath?.success) {
        await dispatch(createDirectory(dirPath.path)).unwrap();
        message.success('Folder created successfully');
        
        // Refresh workspace to reflect changes
        if (currentWorkspace) {
          dispatch(loadWorkspace(currentWorkspace));
        }
      }
    } catch (error) {
      message.error('Failed to create folder');
    }
  };

  const handleFileRename = async (oldPath: string, newPath: string) => {
    try {
      // Use enhanced file operations service with validation
      await fileOperationsService.renameFile(oldPath, newPath);
      
      // Refresh workspace to reflect changes
      if (currentWorkspace) {
        dispatch(loadWorkspace(currentWorkspace));
      }
    } catch (error) {
      // Error handling is done by the service
      console.error('File rename error:', error);
    }
  };

  const handleFileDelete = async (path: string) => {
    try {
      // Use enhanced file operations service with confirmation
      await fileOperationsService.deleteFile(path);
      await dispatch(deleteFile(path)).unwrap();
      
      // Refresh workspace to reflect changes
      if (currentWorkspace) {
        dispatch(loadWorkspace(currentWorkspace));
      }
    } catch (error) {
      // Error handling is done by the service
      console.error('File deletion error:', error);
    }
  };

  const handleFileCopy = async (sourcePath: string, targetPath: string) => {
    try {
      // Use enhanced file operations service with progress tracking
      await fileOperationsService.copyFile(sourcePath, targetPath);
      
      // Refresh workspace to reflect changes
      if (currentWorkspace) {
        dispatch(loadWorkspace(currentWorkspace));
      }
    } catch (error) {
      // Error handling is done by the service
      console.error('File copy error:', error);
    }
  };

  const handleFileMove = async (sourcePath: string, targetPath: string) => {
    try {
      // Use enhanced file operations service with progress tracking
      await fileOperationsService.moveFile(sourcePath, targetPath);
      
      // Refresh workspace to reflect changes
      if (currentWorkspace) {
        dispatch(loadWorkspace(currentWorkspace));
      }
    } catch (error) {
      // Error handling is done by the service
      console.error('File move error:', error);
    }
  };

  const handleRefresh = () => {
    if (currentWorkspace) {
      dispatch(loadWorkspace(currentWorkspace));
    }
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ padding: '8px', borderBottom: '1px solid #333' }}>
        <Button 
           
          icon={<FolderOpenOutlined />}
          onClick={handleOpenProject}
          block
        >
          Open Folder
        </Button>
      </div>

      {/* Enhanced File Manager */}
      <div style={{ flex: 1, minHeight: 0 }}>
        <FileManager />
      </div>

      {/* File info at bottom */}
      {selectedFile && (
        <div style={{ 
          padding: '8px 12px', 
          borderTop: '1px solid #333',
          background: '#2d2d30',
          fontSize: '11px',
          color: '#888'
        }}>
          <div>Selected: {selectedFile.name}</div>
          <div>Path: {selectedFile.path}</div>
        </div>
      )}
    </div>
  );
};
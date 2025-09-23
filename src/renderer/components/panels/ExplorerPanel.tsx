/**
 * Explorer Panel Component
 * File system explorer with enhanced file management
 */

import React, { useState, useEffect } from 'react';
import { Button, message, Divider } from 'antd';
import { FolderOpenOutlined } from '@ant-design/icons';
import { useAppSelector, useAppDispatch } from '../../hooks/redux';
import { useFileSystemEvents } from '../../hooks/useFileSystemEvents';
import { 
  loadWorkspace, 
  openFile, 
  expandDirectory, 
  collapseDirectory,
  createFile,
  createDirectory,
  deleteFile
} from '../../store/slices/fileSlice';
import { FileTree } from '../file-tree/FileTree';
import { FilePreview } from '../file-tree/FilePreview';
import { FileItem } from '../../store/slices/fileSlice';

export const ExplorerPanel: React.FC = () => {
  const dispatch = useAppDispatch();
  const { currentWorkspace, fileTree, activeFile } = useAppSelector(state => state.file);
  const [expandedDirectories, setExpandedDirectories] = useState<Set<string>>(new Set());
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);

  // Set up file system event listening
  useFileSystemEvents(currentWorkspace);

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
        await dispatch(createFile({ filePath: filePath.path })).unwrap();
        message.success('File created successfully');
      }
    } catch (error) {
      message.error('Failed to create file');
    }
  };

  const handleDirectoryCreate = async (parentPath: string, dirName: string) => {
    try {
      const dirPath = await window.electronAPI?.fs.joinPath(parentPath, dirName);
      if (dirPath?.success) {
        await dispatch(createDirectory(dirPath.path)).unwrap();
        message.success('Folder created successfully');
      }
    } catch (error) {
      message.error('Failed to create folder');
    }
  };

  const handleFileRename = async (oldPath: string, newPath: string) => {
    try {
      const result = await window.electronAPI?.fs.rename(oldPath, newPath);
      if (result?.success) {
        message.success('File renamed successfully');
        // Refresh workspace to reflect changes
        if (currentWorkspace) {
          dispatch(loadWorkspace(currentWorkspace));
        }
      } else {
        message.error(result?.error || 'Failed to rename file');
      }
    } catch (error) {
      message.error('Failed to rename file');
    }
  };

  const handleFileDelete = async (path: string) => {
    try {
      await dispatch(deleteFile(path)).unwrap();
      message.success('File deleted successfully');
    } catch (error) {
      message.error('Failed to delete file');
    }
  };

  const handleFileCopy = async (sourcePath: string, targetPath: string) => {
    try {
      const result = await window.electronAPI?.fs.copy(sourcePath, targetPath);
      if (result?.success) {
        message.success('File copied successfully');
        // Refresh workspace to reflect changes
        if (currentWorkspace) {
          dispatch(loadWorkspace(currentWorkspace));
        }
      } else {
        message.error(result?.error || 'Failed to copy file');
      }
    } catch (error) {
      message.error('Failed to copy file');
    }
  };

  const handleFileMove = async (sourcePath: string, targetPath: string) => {
    try {
      const result = await window.electronAPI?.fs.move(sourcePath, targetPath);
      if (result?.success) {
        message.success('File moved successfully');
        // Refresh workspace to reflect changes
        if (currentWorkspace) {
          dispatch(loadWorkspace(currentWorkspace));
        }
      } else {
        message.error(result?.error || 'Failed to move file');
      }
    } catch (error) {
      message.error('Failed to move file');
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
          size="small" 
          icon={<FolderOpenOutlined />}
          onClick={handleOpenProject}
          block
        >
          Open Folder
        </Button>
      </div>

      {/* File Tree */}
      <div style={{ flex: 1, minHeight: 0 }}>
        <FileTree
          files={fileTree}
          selectedFile={selectedFile?.path || null}
          expandedDirectories={expandedDirectories}
          onFileSelect={handleFileSelect}
          onDirectoryExpand={handleDirectoryExpand}
          onDirectoryCollapse={handleDirectoryCollapse}
          onFileCreate={handleFileCreate}
          onDirectoryCreate={handleDirectoryCreate}
          onFileRename={handleFileRename}
          onFileDelete={handleFileDelete}
          onFileCopy={handleFileCopy}
          onFileMove={handleFileMove}
          onRefresh={handleRefresh}
          workspacePath={currentWorkspace}
        />
      </div>

      {/* File Preview */}
      {selectedFile && (
        <>
          <Divider style={{ margin: '8px 0' }} />
          <div style={{ height: '200px', minHeight: '200px' }}>
            <FilePreview file={selectedFile} />
          </div>
        </>
      )}
    </div>
  );
};
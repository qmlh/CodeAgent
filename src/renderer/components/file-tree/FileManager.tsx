/**
 * Enhanced File Manager Component
 * Comprehensive file management with advanced features
 */

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Layout, 
  Tabs, 
  Button, 
  message, 
  Modal, 
  Progress,
  Tooltip,
  Badge,
  Space
} from 'antd';
import { 
  FolderOutlined, 
  SearchOutlined, 
  EyeOutlined,
  SettingOutlined,
  SyncOutlined,
  CloudUploadOutlined,
  DownloadOutlined
} from '@ant-design/icons';
import { FileTree } from './FileTree';
import { FileSearch } from './FileSearch';
import { FilePreview } from './FilePreview';
import { useAppSelector, useAppDispatch } from '../../hooks/redux';
import { 
  loadWorkspace, 
  loadDirectory,
  openFile,
  createFile,
  createDirectory,
  deleteFile,
  copyFile,
  moveFile,
  renameFile,
  expandDirectory,
  collapseDirectory,
  setActiveFile,
  handleFileSystemEvent
} from '../../store/slices/fileSlice';

const { Sider, Content } = Layout;
const { TabPane } = Tabs;

interface FileManagerProps {
  style?: React.CSSProperties;
}

export const FileManager: React.FC<FileManagerProps> = ({ style }) => {
  const dispatch = useAppDispatch();
  const { 
    currentWorkspace, 
    fileTree, 
    activeFile,
    status,
    error 
  } = useAppSelector(state => state.file);

  const [activeTab, setActiveTab] = useState('explorer');
  const [selectedFile, setSelectedFile] = useState<any>(null);
  const [expandedDirectories, setExpandedDirectories] = useState<Set<string>>(new Set());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});

  useEffect(() => {
    // Set up file system event listeners
    const handleFileSystemChange = (data: any) => {
      dispatch(handleFileSystemEvent(data));
      
      // Auto-refresh if needed
      if (data.eventType === 'add' || data.eventType === 'unlink' || data.eventType === 'addDir' || data.eventType === 'unlinkDir') {
        handleRefresh();
      }
    };

    window.electronAPI?.fs.onDirectoryChanged(handleFileSystemChange);

    return () => {
      // Cleanup listeners
      window.electronAPI?.removeAllListeners('fs:directory-changed');
    };
  }, [dispatch]);

  const handleWorkspaceOpen = async () => {
    try {
      const result = await window.electronAPI?.app.showOpenDialog({
        title: 'Open Workspace',
        properties: ['openDirectory'],
        buttonLabel: 'Open Workspace'
      });

      if (result?.success && !result.canceled && result.filePaths && result.filePaths[0]) {
        await dispatch(loadWorkspace(result.filePaths[0])).unwrap();
        message.success('Workspace opened successfully');
      }
    } catch (error) {
      message.error('Failed to open workspace');
    }
  };

  const handleRefresh = useCallback(async () => {
    if (!currentWorkspace) return;

    setIsRefreshing(true);
    try {
      await dispatch(loadWorkspace(currentWorkspace)).unwrap();
    } catch (error) {
      message.error('Failed to refresh workspace');
    } finally {
      setIsRefreshing(false);
    }
  }, [currentWorkspace, dispatch]);

  const handleFileSelect = async (file: any) => {
    setSelectedFile(file);
    
    if (!file.isDirectory) {
      try {
        await dispatch(openFile(file.path)).unwrap();
        dispatch(setActiveFile(file.path));
      } catch (error) {
        message.error('Failed to open file');
      }
    }
  };

  const handleDirectoryExpand = async (path: string) => {
    const newExpanded = new Set(expandedDirectories);
    newExpanded.add(path);
    setExpandedDirectories(newExpanded);
    
    try {
      await dispatch(loadDirectory(path)).unwrap();
      dispatch(expandDirectory(path));
    } catch (error) {
      message.error('Failed to load directory');
    }
  };

  const handleDirectoryCollapse = (path: string) => {
    const newExpanded = new Set(expandedDirectories);
    newExpanded.delete(path);
    setExpandedDirectories(newExpanded);
    dispatch(collapseDirectory(path));
  };

  const handleFileCreate = async (parentPath: string, fileName: string) => {
    try {
      const filePath = await window.electronAPI?.fs.joinPath(parentPath, fileName);
      if (filePath?.success) {
        await dispatch(createFile({ filePath: filePath.path })).unwrap();
        message.success('File created successfully');
        handleRefresh();
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
        message.success('Directory created successfully');
        handleRefresh();
      }
    } catch (error) {
      message.error('Failed to create directory');
    }
  };

  const handleFileRename = async (oldPath: string, newPath: string) => {
    try {
      await dispatch(renameFile({ oldPath, newPath })).unwrap();
      message.success('File renamed successfully');
      handleRefresh();
    } catch (error) {
      message.error('Failed to rename file');
    }
  };

  const handleFileDelete = async (path: string) => {
    try {
      await dispatch(deleteFile(path)).unwrap();
      message.success('File deleted successfully');
      handleRefresh();
    } catch (error) {
      message.error('Failed to delete file');
    }
  };

  const handleFileCopy = async (sourcePath: string, targetPath: string) => {
    try {
      await dispatch(copyFile({ sourcePath, targetPath })).unwrap();
      message.success('File copied successfully');
      handleRefresh();
    } catch (error) {
      message.error('Failed to copy file');
    }
  };

  const handleFileMove = async (sourcePath: string, targetPath: string) => {
    try {
      await dispatch(moveFile({ sourcePath, targetPath })).unwrap();
      message.success('File moved successfully');
      handleRefresh();
    } catch (error) {
      message.error('Failed to move file');
    }
  };

  const handleBulkUpload = async () => {
    try {
      const result = await window.electronAPI?.app.showOpenDialog({
        title: 'Upload Files',
        properties: ['openFile', 'multiSelections'],
        filters: [
          { name: 'All Files', extensions: ['*'] }
        ]
      });

      if (result?.success && !result.canceled && result.filePaths && currentWorkspace) {
        const totalFiles = result.filePaths.length;
        let completedFiles = 0;

        for (const filePath of result.filePaths) {
          const fileName = await window.electronAPI?.fs.getFileName(filePath);
          if (fileName?.success) {
            const targetPath = await window.electronAPI?.fs.joinPath(currentWorkspace, fileName.fileName);
            if (targetPath?.success) {
              await window.electronAPI?.fs.copy(filePath, targetPath.path);
              completedFiles++;
              
              // Update progress
              const progress = Math.round((completedFiles / totalFiles) * 100);
              setUploadProgress(prev => ({ ...prev, bulk: progress }));
            }
          }
        }

        setUploadProgress(prev => ({ ...prev, bulk: 0 }));
        message.success(`Uploaded ${totalFiles} files successfully`);
        handleRefresh();
      }
    } catch (error) {
      message.error('Failed to upload files');
      setUploadProgress(prev => ({ ...prev, bulk: 0 }));
    }
  };

  const handleExportWorkspace = async () => {
    if (!currentWorkspace) return;

    try {
      const result = await window.electronAPI?.app.showSaveDialog({
        title: 'Export Workspace',
        defaultPath: 'workspace-export.zip',
        filters: [
          { name: 'ZIP Archive', extensions: ['zip'] }
        ]
      });

      if (result?.success && !result.canceled && result.filePath) {
        // TODO: Implement workspace export functionality
        message.info('Export functionality will be implemented in a future update');
      }
    } catch (error) {
      message.error('Failed to export workspace');
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'explorer':
        return (
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
        );
      case 'search':
        return <FileSearch />;
      case 'preview':
        return <FilePreview file={selectedFile} />;
      default:
        return null;
    }
  };

  return (
    <Layout style={{ height: '100%', ...style }}>
      <Sider 
        width={300} 
        style={{ 
          backgroundColor: '#252526',
          borderRight: '1px solid #333'
        }}
      >
        <div style={{ 
          padding: '8px', 
          borderBottom: '1px solid #333',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <Space>
            <Button
              size="small"
              icon={<FolderOutlined />}
              onClick={handleWorkspaceOpen}
              title="Open Workspace"
            >
              Open
            </Button>
            <Tooltip title="Refresh">
              <Button
                size="small"
                icon={<SyncOutlined spin={isRefreshing} />}
                onClick={handleRefresh}
                disabled={!currentWorkspace || isRefreshing}
              />
            </Tooltip>
          </Space>
          
          <Space>
            <Tooltip title="Bulk Upload">
              <Button
                size="small"
                icon={<CloudUploadOutlined />}
                onClick={handleBulkUpload}
                disabled={!currentWorkspace}
              />
            </Tooltip>
            <Tooltip title="Export Workspace">
              <Button
                size="small"
                icon={<DownloadOutlined />}
                onClick={handleExportWorkspace}
                disabled={!currentWorkspace}
              />
            </Tooltip>
          </Space>
        </div>

        {uploadProgress.bulk > 0 && (
          <div style={{ padding: '8px' }}>
            <Progress 
              percent={uploadProgress.bulk} 
              size="small" 
              status="active"
              format={(percent) => `Uploading... ${percent}%`}
            />
          </div>
        )}

        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          size="small"
          style={{ height: 'calc(100% - 48px)' }}
          items={[
            {
              key: 'explorer',
              label: (
                <span>
                  <FolderOutlined />
                  Explorer
                </span>
              ),
              children: renderTabContent()
            },
            {
              key: 'search',
              label: (
                <span>
                  <SearchOutlined />
                  Search
                </span>
              ),
              children: renderTabContent()
            },
            {
              key: 'preview',
              label: (
                <Badge dot={!!selectedFile}>
                  <span>
                    <EyeOutlined />
                    Preview
                  </span>
                </Badge>
              ),
              children: renderTabContent()
            }
          ]}
        />
      </Sider>
    </Layout>
  );
};
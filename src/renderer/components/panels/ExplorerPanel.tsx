/**
 * Explorer Panel Component
 * File system explorer
 */

import React, { useState, useEffect } from 'react';
import { Tree, Button, Input, message } from 'antd';
import { 
  FolderOutlined, 
  FolderOpenOutlined, 
  FileOutlined,
  SearchOutlined,
  PlusOutlined,
  FolderAddOutlined
} from '@ant-design/icons';
import { useAppSelector, useAppDispatch } from '../../hooks/redux';
import { loadWorkspace, openFile, expandDirectory, collapseDirectory } from '../../store/slices/fileSlice';

const { Search } = Input;
const { DirectoryTree } = Tree;

export const ExplorerPanel: React.FC = () => {
  const dispatch = useAppDispatch();
  const { currentWorkspace, fileTree } = useAppSelector(state => state.file);
  const [searchValue, setSearchValue] = useState('');

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

  const handleFileSelect = async (selectedKeys: React.Key[], info: any) => {
    const { node } = info;
    
    if (node.isFile) {
      try {
        await dispatch(openFile(node.path)).unwrap();
      } catch (error) {
        message.error('Failed to open file');
        console.error('Error opening file:', error);
      }
    }
  };

  const handleDirectoryExpand = (expandedKeys: React.Key[], info: any) => {
    const { node, expanded } = info;
    
    if (node.isDirectory) {
      if (expanded) {
        dispatch(expandDirectory(node.path));
      } else {
        dispatch(collapseDirectory(node.path));
      }
    }
  };

  const convertFileTreeToTreeData = (files: any[]): any[] => {
    return files.map(file => ({
      title: file.name,
      key: file.path,
      path: file.path,
      isFile: file.isFile,
      isDirectory: file.isDirectory,
      icon: file.isDirectory ? 
        (file.expanded ? <FolderOpenOutlined /> : <FolderOutlined />) : 
        <FileOutlined />,
      children: file.children ? convertFileTreeToTreeData(file.children) : undefined
    }));
  };

  const filteredTreeData = React.useMemo(() => {
    const treeData = convertFileTreeToTreeData(fileTree);
    
    if (!searchValue) {
      return treeData;
    }

    // Simple search filter - in a real app, you'd want more sophisticated filtering
    const filterTree = (nodes: any[]): any[] => {
      return nodes.filter(node => {
        const matchesSearch = node.title.toLowerCase().includes(searchValue.toLowerCase());
        const hasMatchingChildren = node.children ? filterTree(node.children).length > 0 : false;
        
        if (hasMatchingChildren) {
          node.children = filterTree(node.children);
        }
        
        return matchesSearch || hasMatchingChildren;
      });
    };

    return filterTree(treeData);
  }, [fileTree, searchValue]);

  return (
    <div style={{ padding: '8px' }}>
      <div style={{ marginBottom: '8px', display: 'flex', gap: '4px' }}>
        <Button 
          size="small" 
          icon={<FolderOpenOutlined />}
          onClick={handleOpenProject}
          style={{ flex: 1 }}
        >
          Open Folder
        </Button>
        <Button 
          size="small" 
          icon={<PlusOutlined />}
          disabled={!currentWorkspace}
          title="New File"
        />
        <Button 
          size="small" 
          icon={<FolderAddOutlined />}
          disabled={!currentWorkspace}
          title="New Folder"
        />
      </div>

      {currentWorkspace && (
        <>
          <Search
            placeholder="Search files..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            style={{ marginBottom: '8px' }}
            size="small"
          />

          <DirectoryTree
            multiple={false}
            onSelect={handleFileSelect}
            onExpand={handleDirectoryExpand}
            treeData={filteredTreeData}
            showIcon
            style={{ 
              background: 'transparent',
              color: '#cccccc'
            }}
          />
        </>
      )}

      {!currentWorkspace && (
        <div style={{ 
          textAlign: 'center', 
          padding: '20px', 
          color: '#888',
          fontSize: '12px'
        }}>
          <p>No folder opened</p>
          <p>Open a folder to start working with files</p>
        </div>
      )}
    </div>
  );
};
/**
 * Virtualized File Tree Node Component
 * Optimized individual node for virtual scrolling
 */

import React, { useState, useCallback, memo } from 'react';
import { 
  FolderOutlined, 
  FolderOpenOutlined, 
  FileOutlined,
  FileTextOutlined,
  FileImageOutlined,
  FileZipOutlined,
  CodeOutlined,
  MoreOutlined
} from '@ant-design/icons';
import { Dropdown, Menu, message } from 'antd';
import { FileItem } from '../../store/slices/fileSlice';

interface VirtualizedFileTreeNodeProps {
  file: FileItem;
  level: number;
  isSelected: boolean;
  isExpanded: boolean;
  onSelect: (file: FileItem) => void;
  onToggle: (file: FileItem) => void;
  onRename: (oldPath: string, newPath: string) => void;
  onDelete: (path: string) => void;
  onCopy: (sourcePath: string, targetPath: string) => void;
  onMove: (sourcePath: string, targetPath: string) => void;
  onCreateFile: (parentPath: string, fileName: string) => void;
  onCreateFolder: (parentPath: string, dirName: string) => void;
}

export const VirtualizedFileTreeNode: React.FC<VirtualizedFileTreeNodeProps> = memo(({
  file,
  level,
  isSelected,
  isExpanded,
  onSelect,
  onToggle,
  onRename,
  onDelete,
  onCopy,
  onMove,
  onCreateFile,
  onCreateFolder
}) => {
  // Guard against invalid file data
  if (!file || typeof file !== 'object' || !file.name || !file.path) {
    return null;
  }

  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(file.name || '');

  const getFileIcon = useCallback((file: FileItem) => {
    if (file.isDirectory) {
      return isExpanded ? <FolderOpenOutlined /> : <FolderOutlined />;
    }

    const extension = file.name.split('.').pop()?.toLowerCase();
    
    // Image files
    if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp', 'ico'].includes(extension || '')) {
      return <FileImageOutlined />;
    }
    
    // Code files
    if (['js', 'jsx', 'ts', 'tsx', 'py', 'java', 'cpp', 'c', 'cs', 'php', 'rb', 'go', 'rs'].includes(extension || '')) {
      return <CodeOutlined />;
    }
    
    // Text files
    if (['txt', 'md', 'json', 'xml', 'html', 'css', 'yaml', 'yml'].includes(extension || '')) {
      return <FileTextOutlined />;
    }
    
    // Archive files
    if (['zip', 'rar', '7z', 'tar', 'gz'].includes(extension || '')) {
      return <FileZipOutlined />;
    }
    
    return <FileOutlined />;
  }, [file, isExpanded]);

  const handleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (file.isDirectory) {
      onToggle(file);
    } else {
      onSelect(file);
    }
  }, [file, onToggle, onSelect]);

  const handleRename = useCallback(async () => {
    if (renameValue.trim() && renameValue !== file.name) {
      try {
        const validation = await window.electronAPI?.fs.validateName(renameValue);
        if (validation?.success && validation.validation.valid) {
          const parentPath = await window.electronAPI?.fs.getDirectoryName(file.path);
          if (parentPath?.success) {
            const newPath = await window.electronAPI?.fs.joinPath(parentPath.dirName, renameValue.trim());
            if (newPath?.success) {
              onRename(file.path, newPath.path);
            }
          }
        } else {
          message.error(validation?.validation.error || 'Invalid file name');
          setRenameValue(file.name);
        }
      } catch (error) {
        message.error('Failed to validate file name');
        setRenameValue(file.name);
      }
    }
    setIsRenaming(false);
  }, [file, renameValue, onRename]);

  const handleRenameKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleRename();
    } else if (e.key === 'Escape') {
      setRenameValue(file.name);
      setIsRenaming(false);
    }
  }, [file.name, handleRename]);

  const contextMenu = (
    <Menu>
      {file.isDirectory && (
        <>
          <Menu.Item key="new-file" onClick={() => onCreateFile(file.path, '')}>
            New File
          </Menu.Item>
          <Menu.Item key="new-folder" onClick={() => onCreateFolder(file.path, '')}>
            New Folder
          </Menu.Item>
          <Menu.Divider />
        </>
      )}
      <Menu.Item key="rename" onClick={() => setIsRenaming(true)}>
        Rename
      </Menu.Item>
      <Menu.Item key="copy" onClick={() => onCopy(file.path, '')}>
        Copy
      </Menu.Item>
      <Menu.Divider />
      <Menu.Item key="delete" onClick={() => onDelete(file.path)} danger>
        Delete
      </Menu.Item>
    </Menu>
  );

  const nodeStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    padding: '2px 8px',
    paddingLeft: `${8 + level * 16}px`,
    cursor: 'pointer',
    userSelect: 'none',
    backgroundColor: isSelected ? 'rgba(0, 122, 255, 0.15)' : 'transparent',
    borderRadius: '3px',
    margin: '1px 4px',
    height: '22px',
  };

  const iconStyle: React.CSSProperties = {
    marginRight: '6px',
    fontSize: '14px',
    color: file.isDirectory ? '#dcb67a' : '#cccccc',
    flexShrink: 0,
  };

  const nameStyle: React.CSSProperties = {
    flex: 1,
    fontSize: '13px',
    color: '#cccccc',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    minWidth: 0,
  };

  return (
    <div
      style={nodeStyle}
      onClick={handleClick}
      title={file.path}
    >
      <span style={iconStyle}>
        {getFileIcon(file)}
      </span>
      
      {isRenaming ? (
        <input
          type="text"
          value={renameValue}
          onChange={(e) => setRenameValue(e.target.value)}
          onBlur={handleRename}
          onKeyDown={handleRenameKeyDown}
          style={{
            flex: 1,
            fontSize: '13px',
            backgroundColor: '#3c3c3c',
            border: '1px solid #0078d4',
            borderRadius: '2px',
            padding: '1px 4px',
            color: '#cccccc',
            outline: 'none',
          }}
          autoFocus
          onFocus={(e) => {
            const name = file.name;
            const lastDotIndex = name.lastIndexOf('.');
            if (lastDotIndex > 0) {
              e.target.setSelectionRange(0, lastDotIndex);
            } else {
              e.target.select();
            }
          }}
        />
      ) : (
        <span style={nameStyle}>{file.name}</span>
      )}
      
      <Dropdown overlay={contextMenu} trigger={['contextMenu']} placement="bottomLeft">
        <span
          style={{
            padding: '2px',
            borderRadius: '2px',
            opacity: 0.6,
            fontSize: '12px',
            flexShrink: 0,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <MoreOutlined />
        </span>
      </Dropdown>
    </div>
  );
});

VirtualizedFileTreeNode.displayName = 'VirtualizedFileTreeNode';
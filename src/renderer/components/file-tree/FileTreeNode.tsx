/**
 * File Tree Node Component
 * Individual node in the file tree with drag and drop support
 */

import React, { useState, useRef, useCallback } from 'react';
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
import { useDrag, useDrop } from 'react-dnd';
import { FileItem } from '../../store/slices/fileSlice';

interface FileTreeNodeProps {
  file: FileItem;
  level: number;
  isSelected: boolean;
  isExpanded: boolean;
  onSelect: (file: FileItem) => void;
  onExpand: (file: FileItem) => void;
  onCollapse: (file: FileItem) => void;
  onRename: (file: FileItem, newName: string) => void;
  onDelete: (file: FileItem) => void;
  onCopy: (file: FileItem) => void;
  onCut: (file: FileItem) => void;
  onPaste: (targetFile: FileItem) => void;
  onCreateFile: (parentFile: FileItem) => void;
  onCreateFolder: (parentFile: FileItem) => void;
  onShowInExplorer: (file: FileItem) => void;
}

interface DragItem {
  type: string;
  file: FileItem;
}

export const FileTreeNode: React.FC<FileTreeNodeProps> = ({
  file,
  level,
  isSelected,
  isExpanded,
  onSelect,
  onExpand,
  onCollapse,
  onRename,
  onDelete,
  onCopy,
  onCut,
  onPaste,
  onCreateFile,
  onCreateFolder,
  onShowInExplorer
}) => {
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(file.name);
  const nodeRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Drag and drop setup
  const [{ isDragging }, drag] = useDrag({
    type: 'FILE_TREE_NODE',
    item: { type: 'FILE_TREE_NODE', file },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [{ isOver, canDrop }, drop] = useDrop({
    accept: 'FILE_TREE_NODE',
    drop: (item: DragItem) => {
      if (item.file.path !== file.path && file.isDirectory) {
        handleMove(item.file, file);
      }
    },
    canDrop: (item: DragItem) => {
      return file.isDirectory && item.file.path !== file.path;
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  });

  // Combine drag and drop refs
  const dragDropRef = useCallback((node: HTMLDivElement) => {
    drag(drop(node));
    nodeRef.current = node;
  }, [drag, drop]);

  const getFileIcon = (file: FileItem) => {
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
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (file.isDirectory) {
      if (isExpanded) {
        onCollapse(file);
      } else {
        onExpand(file);
      }
    } else {
      onSelect(file);
    }
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!file.isDirectory) {
      onSelect(file);
    }
  };

  const handleRename = async () => {
    if (renameValue.trim() && renameValue !== file.name) {
      try {
        const validation = await window.electronAPI?.fs.validateName(renameValue);
        if (validation?.success && validation.validation.valid) {
          onRename(file, renameValue.trim());
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
  };

  const handleRenameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleRename();
    } else if (e.key === 'Escape') {
      setRenameValue(file.name);
      setIsRenaming(false);
    }
  };

  const handleMove = async (sourceFile: FileItem, targetFile: FileItem) => {
    try {
      const targetPath = await window.electronAPI?.fs.joinPath(targetFile.path, sourceFile.name);
      if (targetPath?.success) {
        const result = await window.electronAPI?.fs.move(sourceFile.path, targetPath.path);
        if (result?.success) {
          message.success(`Moved ${sourceFile.name} to ${targetFile.name}`);
        } else {
          message.error(result?.error || 'Failed to move file');
        }
      }
    } catch (error) {
      message.error('Failed to move file');
    }
  };

  const contextMenu = (
    <Menu>
      {file.isDirectory && (
        <>
          <Menu.Item key="new-file" onClick={() => onCreateFile(file)}>
            New File
          </Menu.Item>
          <Menu.Item key="new-folder" onClick={() => onCreateFolder(file)}>
            New Folder
          </Menu.Item>
          <Menu.Divider />
        </>
      )}
      <Menu.Item key="rename" onClick={() => setIsRenaming(true)}>
        Rename
      </Menu.Item>
      <Menu.Item key="copy" onClick={() => onCopy(file)}>
        Copy
      </Menu.Item>
      <Menu.Item key="cut" onClick={() => onCut(file)}>
        Cut
      </Menu.Item>
      {file.isDirectory && (
        <Menu.Item key="paste" onClick={() => onPaste(file)}>
          Paste
        </Menu.Item>
      )}
      <Menu.Divider />
      <Menu.Item key="delete" onClick={() => onDelete(file)} danger>
        Delete
      </Menu.Item>
      <Menu.Divider />
      <Menu.Item key="show-in-explorer" onClick={() => onShowInExplorer(file)}>
        Show in File Explorer
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
    opacity: isDragging ? 0.5 : 1,
    border: isOver && canDrop ? '1px dashed #0078d4' : 'none',
  };

  const iconStyle: React.CSSProperties = {
    marginRight: '6px',
    fontSize: '14px',
    color: file.isDirectory ? '#dcb67a' : '#cccccc',
  };

  const nameStyle: React.CSSProperties = {
    flex: 1,
    fontSize: '13px',
    color: '#cccccc',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  };

  return (
    <div
      ref={dragDropRef}
      style={nodeStyle}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      title={file.path}
    >
      <span style={iconStyle}>
        {getFileIcon(file)}
      </span>
      
      {isRenaming ? (
        <input
          ref={inputRef}
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
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <MoreOutlined />
        </span>
      </Dropdown>
    </div>
  );
};
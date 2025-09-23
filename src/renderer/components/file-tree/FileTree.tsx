/**
 * File Tree Component
 * Main file tree with drag and drop, search, and context menu support
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Input, Button, message, Modal, Form } from 'antd';
import { 
  SearchOutlined, 
  PlusOutlined, 
  FolderAddOutlined,
  ReloadOutlined,
  FilterOutlined
} from '@ant-design/icons';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { FileTreeNode } from './FileTreeNode';
import { FileItem } from '../../store/slices/fileSlice';

const { Search } = Input;

interface FileTreeProps {
  files: FileItem[];
  selectedFile: string | null;
  expandedDirectories: Set<string>;
  onFileSelect: (file: FileItem) => void;
  onDirectoryExpand: (path: string) => void;
  onDirectoryCollapse: (path: string) => void;
  onFileCreate: (parentPath: string, fileName: string) => void;
  onDirectoryCreate: (parentPath: string, dirName: string) => void;
  onFileRename: (oldPath: string, newPath: string) => void;
  onFileDelete: (path: string) => void;
  onFileCopy: (sourcePath: string, targetPath: string) => void;
  onFileMove: (sourcePath: string, targetPath: string) => void;
  onRefresh: () => void;
  workspacePath: string | null;
}

interface ClipboardItem {
  file: FileItem;
  operation: 'copy' | 'cut';
}

export const FileTree: React.FC<FileTreeProps> = ({
  files,
  selectedFile,
  expandedDirectories,
  onFileSelect,
  onDirectoryExpand,
  onDirectoryCollapse,
  onFileCreate,
  onDirectoryCreate,
  onFileRename,
  onFileDelete,
  onFileCopy,
  onFileMove,
  onRefresh,
  workspacePath
}) => {
  const [searchValue, setSearchValue] = useState('');
  const [filteredFiles, setFilteredFiles] = useState<FileItem[]>(files);
  const [clipboard, setClipboard] = useState<ClipboardItem | null>(null);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [createType, setCreateType] = useState<'file' | 'folder'>('file');
  const [createParent, setCreateParent] = useState<FileItem | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    filterFiles();
  }, [files, searchValue]);

  const filterFiles = useCallback(() => {
    if (!searchValue.trim()) {
      setFilteredFiles(files);
      return;
    }

    const filterTree = (items: FileItem[]): FileItem[] => {
      return items.reduce((acc: FileItem[], item) => {
        const matchesSearch = item.name.toLowerCase().includes(searchValue.toLowerCase());
        let filteredChildren: FileItem[] = [];

        if (item.children) {
          filteredChildren = filterTree(item.children);
        }

        if (matchesSearch || filteredChildren.length > 0) {
          acc.push({
            ...item,
            children: filteredChildren.length > 0 ? filteredChildren : item.children
          });
        }

        return acc;
      }, []);
    };

    setFilteredFiles(filterTree(files));
  }, [files, searchValue]);

  const handleFileSelect = (file: FileItem) => {
    onFileSelect(file);
  };

  const handleDirectoryToggle = (file: FileItem) => {
    if (expandedDirectories.has(file.path)) {
      onDirectoryCollapse(file.path);
    } else {
      onDirectoryExpand(file.path);
    }
  };

  const handleRename = async (file: FileItem, newName: string) => {
    try {
      const parentPath = await window.electronAPI?.fs.getDirectoryName(file.path);
      if (parentPath?.success) {
        const newPath = await window.electronAPI?.fs.joinPath(parentPath.dirName, newName);
        if (newPath?.success) {
          onFileRename(file.path, newPath.path);
        }
      }
    } catch (error) {
      message.error('Failed to rename file');
    }
  };

  const handleDelete = (file: FileItem) => {
    Modal.confirm({
      title: `Delete ${file.isDirectory ? 'folder' : 'file'}`,
      content: `Are you sure you want to delete "${file.name}"? This action cannot be undone.`,
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: () => {
        onFileDelete(file.path);
      },
    });
  };

  const handleCopy = (file: FileItem) => {
    setClipboard({ file, operation: 'copy' });
    message.success(`Copied ${file.name}`);
  };

  const handleCut = (file: FileItem) => {
    setClipboard({ file, operation: 'cut' });
    message.success(`Cut ${file.name}`);
  };

  const handlePaste = async (targetFile: FileItem) => {
    if (!clipboard) {
      message.warning('Nothing to paste');
      return;
    }

    try {
      const targetPath = await window.electronAPI?.fs.joinPath(targetFile.path, clipboard.file.name);
      if (targetPath?.success) {
        if (clipboard.operation === 'copy') {
          onFileCopy(clipboard.file.path, targetPath.path);
        } else {
          onFileMove(clipboard.file.path, targetPath.path);
          setClipboard(null); // Clear clipboard after cut operation
        }
      }
    } catch (error) {
      message.error(`Failed to ${clipboard.operation} file`);
    }
  };

  const handleCreateFile = (parentFile: FileItem) => {
    setCreateType('file');
    setCreateParent(parentFile);
    setCreateModalVisible(true);
    form.resetFields();
  };

  const handleCreateFolder = (parentFile: FileItem) => {
    setCreateType('folder');
    setCreateParent(parentFile);
    setCreateModalVisible(true);
    form.resetFields();
  };

  const handleCreateSubmit = async (values: { name: string }) => {
    if (!createParent) return;

    try {
      const validation = await window.electronAPI?.fs.validateName(values.name);
      if (!validation?.success || !validation.validation.valid) {
        message.error(validation?.validation.error || 'Invalid name');
        return;
      }

      if (createType === 'file') {
        onFileCreate(createParent.path, values.name);
      } else {
        onDirectoryCreate(createParent.path, values.name);
      }

      setCreateModalVisible(false);
      message.success(`${createType === 'file' ? 'File' : 'Folder'} created successfully`);
    } catch (error) {
      message.error(`Failed to create ${createType}`);
    }
  };

  const handleShowInExplorer = async (file: FileItem) => {
    try {
      await window.electronAPI?.app.showItemInFolder(file.path);
    } catch (error) {
      message.error('Failed to show in file explorer');
    }
  };

  const renderFileTree = (items: FileItem[], level: number = 0): React.ReactNode[] => {
    return items.map((file) => (
      <div key={file.path}>
        <FileTreeNode
          file={file}
          level={level}
          isSelected={selectedFile === file.path}
          isExpanded={expandedDirectories.has(file.path)}
          onSelect={handleFileSelect}
          onExpand={handleDirectoryToggle}
          onCollapse={handleDirectoryToggle}
          onRename={handleRename}
          onDelete={handleDelete}
          onCopy={handleCopy}
          onCut={handleCut}
          onPaste={handlePaste}
          onCreateFile={handleCreateFile}
          onCreateFolder={handleCreateFolder}
          onShowInExplorer={handleShowInExplorer}
        />
        {file.children && expandedDirectories.has(file.path) && (
          <div>
            {renderFileTree(file.children, level + 1)}
          </div>
        )}
      </div>
    ));
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* Toolbar */}
        <div style={{ padding: '8px', borderBottom: '1px solid #333' }}>
          <div style={{ display: 'flex', gap: '4px', marginBottom: '8px' }}>
            <Button
              size="small"
              icon={<PlusOutlined />}
              onClick={() => workspacePath && handleCreateFile({ path: workspacePath, name: '', isDirectory: true, isFile: false })}
              disabled={!workspacePath}
              title="New File"
            />
            <Button
              size="small"
              icon={<FolderAddOutlined />}
              onClick={() => workspacePath && handleCreateFolder({ path: workspacePath, name: '', isDirectory: true, isFile: false })}
              disabled={!workspacePath}
              title="New Folder"
            />
            <Button
              size="small"
              icon={<ReloadOutlined />}
              onClick={onRefresh}
              disabled={!workspacePath}
              title="Refresh"
            />
          </div>

          <Search
            placeholder="Search files..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            size="small"
            allowClear
          />
        </div>

        {/* File Tree */}
        <div style={{ flex: 1, overflow: 'auto', padding: '4px 0' }}>
          {workspacePath ? (
            filteredFiles.length > 0 ? (
              renderFileTree(filteredFiles)
            ) : (
              <div style={{ padding: '20px', textAlign: 'center', color: '#888' }}>
                {searchValue ? 'No files match your search' : 'No files in workspace'}
              </div>
            )
          ) : (
            <div style={{ padding: '20px', textAlign: 'center', color: '#888' }}>
              <p>No workspace opened</p>
              <p style={{ fontSize: '12px' }}>Open a folder to start working with files</p>
            </div>
          )}
        </div>

        {/* Create File/Folder Modal */}
        <Modal
          title={`Create ${createType === 'file' ? 'File' : 'Folder'}`}
          open={createModalVisible}
          onCancel={() => setCreateModalVisible(false)}
          onOk={() => form.submit()}
          okText="Create"
        >
          <Form
            form={form}
            onFinish={handleCreateSubmit}
            layout="vertical"
          >
            <Form.Item
              name="name"
              label={`${createType === 'file' ? 'File' : 'Folder'} Name`}
              rules={[
                { required: true, message: 'Please enter a name' },
                { max: 255, message: 'Name is too long' }
              ]}
            >
              <Input
                placeholder={`Enter ${createType} name`}
                autoFocus
              />
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </DndProvider>
  );
};
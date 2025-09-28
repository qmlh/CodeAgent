/**
 * Virtualized File Tree Component
 * High-performance file tree with virtual scrolling for large directories
 */

import React, { useState, useMemo, useCallback } from 'react';
import { List as FixedSizeList } from 'react-window';
import { Input, Button, Spin, Empty } from 'antd';
import {
  PlusOutlined,
  FolderAddOutlined,
  ReloadOutlined,
  FilterOutlined
} from '@ant-design/icons';
import { FileItem } from '../../store/slices/fileSlice';
import { VirtualizedFileTreeNode } from './VirtualizedFileTreeNode';

const { Search } = Input;

interface VirtualizedFileTreeProps {
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
  loading?: boolean;
}

interface FlattenedNode {
  file: FileItem;
  level: number;
  index: number;
}

interface ListChildProps {
  index: number;
  style: React.CSSProperties;
  data: FlattenedNode[];
}

export const VirtualizedFileTree: React.FC<VirtualizedFileTreeProps> = ({
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
  workspacePath,
  loading = false
}) => {
  const [searchValue, setSearchValue] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Flatten the tree structure for virtualization
  const flattenedNodes = useMemo(() => {
    console.log('Flattening files:', files?.length || 0, 'files');
    
    const flatten = (items: FileItem[], level: number = 0): FlattenedNode[] => {
      if (!items || !Array.isArray(items)) {
        console.log('Invalid items in flatten:', items);
        return [];
      }

      const result: FlattenedNode[] = [];
      let index = 0;

      for (const item of items) {
        if (!item || typeof item !== 'object') {
          console.warn('Invalid item in flatten:', item);
          continue;
        }

        // Apply search filter
        const matchesSearch = !searchValue ||
          (item.name && item.name.toLowerCase().includes(searchValue.toLowerCase()));

        if (matchesSearch) {
          const node = { file: item, level, index: index++ };
          result.push(node);
        }

        // Include children if directory is expanded and has children
        if (item.isDirectory &&
          item.path &&
          expandedDirectories.has(item.path) &&
          item.children &&
          Array.isArray(item.children) &&
          item.children.length > 0) {
          const childNodes = flatten(item.children, level + 1);
          result.push(...childNodes);
        }
      }

      return result;
    };

    const result = flatten(files || []);
    console.log('Flattened nodes:', result.length);
    return result;
  }, [files, expandedDirectories, searchValue]);

  const handleDirectoryToggle = useCallback((file: FileItem) => {
    if (expandedDirectories.has(file.path)) {
      onDirectoryCollapse(file.path);
    } else {
      onDirectoryExpand(file.path);
    }
  }, [expandedDirectories, onDirectoryExpand, onDirectoryCollapse]);

  // Row component for react-window
  const RowRenderer = ({ index, style, data }: ListChildProps) => {
    console.log('RowRenderer called with index:', index, 'data length:', data?.length);
    
    if (!data || !Array.isArray(data)) {
      console.warn('RowRenderer: Invalid data:', data);
      return null;
    }
    
    if (index < 0 || index >= data.length) {
      console.warn('RowRenderer: Invalid index:', index, 'data length:', data.length);
      return null;
    }

    const node = data[index];
    if (!node || !node.file) {
      console.warn('RowRenderer: Invalid node at index:', index, node);
      return null;
    }

    return (
      <div style={style}>
        <VirtualizedFileTreeNode
          file={node.file || {}}
          level={node.level || 0}
          isSelected={selectedFile === (node.file?.path || '')}
          isExpanded={node.file?.path ? expandedDirectories.has(node.file.path) : false}
          onSelect={onFileSelect || (() => {})}
          onToggle={handleDirectoryToggle || (() => {})}
          onRename={onFileRename || (() => {})}
          onDelete={onFileDelete || (() => {})}
          onCopy={onFileCopy || (() => {})}
          onMove={onFileMove || (() => {})}
          onCreateFile={onFileCreate || (() => {})}
          onCreateFolder={onDirectoryCreate || (() => {})}
        />
      </div>
    );
  };

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchValue(e.target.value);
  }, []);

  const handleSearchClear = useCallback(() => {
    setSearchValue('');
  }, []);

  if (loading) {
    return (
      <div style={{
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!workspacePath) {
    return (
      <div style={{
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}>
        <Empty
          description="No workspace opened"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      </div>
    );
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Toolbar */}
      <div style={{
        padding: '8px',
        borderBottom: '1px solid #333',
        backgroundColor: '#252526'
      }}>
        <div style={{
          display: 'flex',
          gap: '4px',
          marginBottom: '8px',
          flexWrap: 'wrap'
        }}>
          <Button

            icon={<PlusOutlined />}
            onClick={() => workspacePath && onFileCreate(workspacePath, '')}
            disabled={!workspacePath}
            title="New File"
          />
          <Button

            icon={<FolderAddOutlined />}
            onClick={() => workspacePath && onDirectoryCreate(workspacePath, '')}
            disabled={!workspacePath}
            title="New Folder"
          />
          <Button

            icon={<ReloadOutlined />}
            onClick={onRefresh}
            disabled={!workspacePath}
            title="Refresh"
          />
          <Button

            icon={<FilterOutlined />}
            onClick={() => setShowFilters(!showFilters)}
            type={showFilters ? 'primary' : 'default'}
            title="Toggle Filters"
          />
        </div>

        <Search
          placeholder="Search files..."
          value={searchValue}
          onChange={handleSearchChange}
          onSearch={() => { }} // Search is handled by onChange

          allowClear
          onClear={handleSearchClear}
        />
      </div>

      {/* File Tree with Virtual Scrolling */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        {flattenedNodes.length === 0 ? (
          <div style={{
            padding: '20px',
            textAlign: 'center',
            color: '#888'
          }}>
            {searchValue ?
              'No files match your search' :
              'No files in workspace'
            }
          </div>
        ) : (
          <div style={{ height: '100%', backgroundColor: '#252526' }}>
            {flattenedNodes.map((node, index) => (
              <div key={`${node.file.path}-${index}`} style={{ height: '24px' }}>
                <VirtualizedFileTreeNode
                  file={node.file || {}}
                  level={node.level || 0}
                  isSelected={selectedFile === (node.file?.path || '')}
                  isExpanded={node.file?.path ? expandedDirectories.has(node.file.path) : false}
                  onSelect={onFileSelect || (() => {})}
                  onToggle={handleDirectoryToggle || (() => {})}
                  onRename={onFileRename || (() => {})}
                  onDelete={onFileDelete || (() => {})}
                  onCopy={onFileCopy || (() => {})}
                  onMove={onFileMove || (() => {})}
                  onCreateFile={onFileCreate || (() => {})}
                  onCreateFolder={onDirectoryCreate || (() => {})}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
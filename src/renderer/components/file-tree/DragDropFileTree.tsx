/**
 * Drag and Drop File Tree Component
 * Enhanced file tree with advanced drag and drop capabilities
 */

import React, { useState, useCallback, useRef } from 'react';
import { message, Modal } from 'antd';
import { FileItem } from '../../store/slices/fileSlice';
import { VirtualizedFileTree } from './VirtualizedFileTree';

interface DragDropFileTreeProps {
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

interface DragState {
  isDragging: boolean;
  draggedFiles: FileItem[];
  dragPreview?: string;
  dropTarget?: string;
  dropPosition?: 'before' | 'after' | 'inside';
}

interface DropZone {
  element: HTMLElement;
  path: string;
  isDirectory: boolean;
}

export const DragDropFileTree: React.FC<DragDropFileTreeProps> = ({
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
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    draggedFiles: []
  });
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const dragPreviewRef = useRef<HTMLDivElement>(null);
  const dropZones = useRef<Map<string, DropZone>>(new Map());

  // Handle file selection with multi-select support
  const handleFileSelect = useCallback((file: FileItem, event?: React.MouseEvent) => {
    if (event?.ctrlKey || event?.metaKey) {
      // Multi-select with Ctrl/Cmd
      setSelectedFiles(prev => {
        const newSet = new Set(prev);
        if (newSet.has(file.path)) {
          newSet.delete(file.path);
        } else {
          newSet.add(file.path);
        }
        return newSet;
      });
    } else if (event?.shiftKey && selectedFiles.size > 0) {
      // Range select with Shift
      // TODO: Implement range selection logic
      setSelectedFiles(new Set([file.path]));
    } else {
      // Single select
      setSelectedFiles(new Set([file.path]));
      onFileSelect(file);
    }
  }, [selectedFiles, onFileSelect]);

  // Start drag operation
  const handleDragStart = useCallback((file: FileItem, event: React.DragEvent) => {
    const filesToDrag = selectedFiles.has(file.path) 
      ? Array.from(selectedFiles).map(path => ({ path, name: path.split('/').pop() || '', isDirectory: false, isFile: true }))
      : [file];

    setDragState({
      isDragging: true,
      draggedFiles: filesToDrag,
      dragPreview: filesToDrag.length === 1 
        ? filesToDrag[0].name 
        : `${filesToDrag.length} items`
    });

    // Set drag data
    event.dataTransfer.setData('text/plain', JSON.stringify(filesToDrag.map(f => f.path)));
    event.dataTransfer.effectAllowed = 'copyMove';

    // Create custom drag preview
    if (dragPreviewRef.current) {
      const preview = dragPreviewRef.current.cloneNode(true) as HTMLElement;
      preview.style.position = 'absolute';
      preview.style.top = '-1000px';
      preview.style.left = '-1000px';
      preview.style.backgroundColor = '#2d2d30';
      preview.style.border = '1px solid #0078d4';
      preview.style.borderRadius = '4px';
      preview.style.padding = '4px 8px';
      preview.style.color = '#cccccc';
      preview.style.fontSize = '12px';
      preview.textContent = dragState.dragPreview || '';
      
      document.body.appendChild(preview);
      event.dataTransfer.setDragImage(preview, 10, 10);
      
      // Clean up preview after drag
      setTimeout(() => {
        document.body.removeChild(preview);
      }, 0);
    }
  }, [selectedFiles, dragState.dragPreview]);

  // Handle drag over
  const handleDragOver = useCallback((event: React.DragEvent, targetFile?: FileItem) => {
    event.preventDefault();
    event.stopPropagation();

    if (!targetFile || !dragState.isDragging) return;

    // Determine drop effect
    const isValidTarget = targetFile.isDirectory && 
      !dragState.draggedFiles.some(f => f.path === targetFile.path);

    if (isValidTarget) {
      event.dataTransfer.dropEffect = event.ctrlKey ? 'copy' : 'move';
      setDragState(prev => ({
        ...prev,
        dropTarget: targetFile.path
      }));
    } else {
      event.dataTransfer.dropEffect = 'none';
    }
  }, [dragState]);

  // Handle drop
  const handleDrop = useCallback(async (event: React.DragEvent, targetFile?: FileItem) => {
    event.preventDefault();
    event.stopPropagation();

    if (!targetFile || !targetFile.isDirectory || !dragState.isDragging) {
      setDragState({ isDragging: false, draggedFiles: [] });
      return;
    }

    const isCopy = event.ctrlKey;
    const draggedPaths = dragState.draggedFiles.map(f => f.path);

    try {
      // Confirm the operation
      const operation = isCopy ? 'copy' : 'move';
      const fileCount = draggedPaths.length;
      const confirmed = await new Promise<boolean>((resolve) => {
        Modal.confirm({
          title: `${operation.charAt(0).toUpperCase() + operation.slice(1)} Files`,
          content: `Are you sure you want to ${operation} ${fileCount} file${fileCount > 1 ? 's' : ''} to "${targetFile.name}"?`,
          onOk: () => resolve(true),
          onCancel: () => resolve(false),
        });
      });

      if (!confirmed) {
        setDragState({ isDragging: false, draggedFiles: [] });
        return;
      }

      // Perform the operation for each file
      for (const sourcePath of draggedPaths) {
        const fileName = sourcePath.split('/').pop() || '';
        const targetPath = await window.electronAPI?.fs.joinPath(targetFile.path, fileName);
        
        if (targetPath?.success) {
          if (isCopy) {
            await onFileCopy(sourcePath, targetPath.path);
          } else {
            await onFileMove(sourcePath, targetPath.path);
          }
        }
      }

      message.success(`${fileCount} file${fileCount > 1 ? 's' : ''} ${operation}d successfully`);
      onRefresh();
    } catch (error) {
      message.error(`Failed to ${isCopy ? 'copy' : 'move'} files`);
    } finally {
      setDragState({ isDragging: false, draggedFiles: [] });
      setSelectedFiles(new Set());
    }
  }, [dragState, onFileCopy, onFileMove, onRefresh]);

  // Handle external file drop (from OS)
  const handleExternalDrop = useCallback(async (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();

    if (!workspacePath) return;

    const files = Array.from(event.dataTransfer.files);
    if (files.length === 0) return;

    try {
      let importedCount = 0;
      
      for (const file of files) {
        const content = await readFileContent(file);
        const targetPath = await window.electronAPI?.fs.joinPath(workspacePath, file.name);
        
        if (targetPath?.success) {
          const result = await window.electronAPI?.fs.writeFile(targetPath.path, content);
          if (result?.success) {
            importedCount++;
          }
        }
      }
      
      if (importedCount > 0) {
        message.success(`Imported ${importedCount} file${importedCount > 1 ? 's' : ''}`);
        onRefresh();
      }
    } catch (error) {
      message.error('Failed to import files');
    }
  }, [workspacePath, onRefresh]);

  // Handle drag end
  const handleDragEnd = useCallback(() => {
    setDragState({ isDragging: false, draggedFiles: [] });
  }, []);

  // Read file content for external drops
  const readFileContent = useCallback((file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = (e) => reject(e);
      reader.readAsText(file);
    });
  }, []);

  // Batch operations for selected files
  const handleBatchDelete = useCallback(async () => {
    if (selectedFiles.size === 0) return;

    const confirmed = await new Promise<boolean>((resolve) => {
      Modal.confirm({
        title: 'Delete Files',
        content: `Are you sure you want to delete ${selectedFiles.size} selected file${selectedFiles.size > 1 ? 's' : ''}?`,
        okText: 'Delete',
        okType: 'danger',
        onOk: () => resolve(true),
        onCancel: () => resolve(false),
      });
    });

    if (!confirmed) return;

    try {
      for (const filePath of selectedFiles) {
        await onFileDelete(filePath);
      }
      message.success(`Deleted ${selectedFiles.size} file${selectedFiles.size > 1 ? 's' : ''}`);
      setSelectedFiles(new Set());
    } catch (error) {
      message.error('Failed to delete some files');
    }
  }, [selectedFiles, onFileDelete]);

  const handleBatchCopy = useCallback(async (targetPath: string) => {
    if (selectedFiles.size === 0) return;

    try {
      for (const sourcePath of selectedFiles) {
        const fileName = sourcePath.split('/').pop() || '';
        const destPath = await window.electronAPI?.fs.joinPath(targetPath, fileName);
        
        if (destPath?.success) {
          await onFileCopy(sourcePath, destPath.path);
        }
      }
      message.success(`Copied ${selectedFiles.size} file${selectedFiles.size > 1 ? 's' : ''}`);
    } catch (error) {
      message.error('Failed to copy some files');
    }
  }, [selectedFiles, onFileCopy]);

  return (
    <div
      style={{ height: '100%', position: 'relative' }}
      onDragOver={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
      onDrop={handleExternalDrop}
      onDragEnd={handleDragEnd}
    >
      {/* Drag preview element */}
      <div
        ref={dragPreviewRef}
        style={{
          position: 'absolute',
          top: '-1000px',
          left: '-1000px',
          pointerEvents: 'none',
          backgroundColor: '#2d2d30',
          border: '1px solid #0078d4',
          borderRadius: '4px',
          padding: '4px 8px',
          color: '#cccccc',
          fontSize: '12px',
          zIndex: 1000
        }}
      >
        {dragState.dragPreview}
      </div>

      {/* Drop overlay */}
      {dragState.isDragging && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 120, 212, 0.1)',
            border: '2px dashed #0078d4',
            borderRadius: '4px',
            zIndex: 100,
            pointerEvents: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <div style={{
            backgroundColor: '#2d2d30',
            padding: '12px 20px',
            borderRadius: '8px',
            border: '1px solid #0078d4',
            color: '#cccccc',
            fontSize: '14px'
          }}>
            Drop files here to move/copy
          </div>
        </div>
      )}

      <VirtualizedFileTree
        files={files}
        selectedFile={selectedFile}
        expandedDirectories={expandedDirectories}
        onFileSelect={handleFileSelect}
        onDirectoryExpand={onDirectoryExpand}
        onDirectoryCollapse={onDirectoryCollapse}
        onFileCreate={onFileCreate}
        onDirectoryCreate={onDirectoryCreate}
        onFileRename={onFileRename}
        onFileDelete={onFileDelete}
        onFileCopy={onFileCopy}
        onFileMove={onFileMove}
        onRefresh={onRefresh}
        workspacePath={workspacePath}
        loading={loading}
      />

      {/* Selection info */}
      {selectedFiles.size > 1 && (
        <div style={{
          position: 'absolute',
          bottom: '8px',
          left: '8px',
          right: '8px',
          backgroundColor: '#2d2d30',
          border: '1px solid #0078d4',
          borderRadius: '4px',
          padding: '8px',
          fontSize: '12px',
          color: '#cccccc',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span>{selectedFiles.size} files selected</span>
          <div style={{ display: 'flex', gap: '4px' }}>
            <button
              style={{
                background: 'none',
                border: '1px solid #666',
                borderRadius: '2px',
                color: '#cccccc',
                padding: '2px 6px',
                fontSize: '11px',
                cursor: 'pointer'
              }}
              onClick={handleBatchDelete}
            >
              Delete
            </button>
            <button
              style={{
                background: 'none',
                border: '1px solid #666',
                borderRadius: '2px',
                color: '#cccccc',
                padding: '2px 6px',
                fontSize: '11px',
                cursor: 'pointer'
              }}
              onClick={() => setSelectedFiles(new Set())}
            >
              Clear
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
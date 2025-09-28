/**
 * File Operation History Component
 * Undo/Redo functionality for file operations
 */

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Button, 
  List, 
  Typography, 
  Card, 
  Space, 
  Tag, 
  Tooltip,
  message,
  Modal,
  Empty
} from 'antd';
import { 
  UndoOutlined, 
  RedoOutlined, 
  HistoryOutlined,
  DeleteOutlined,
  CopyOutlined,
  ScissorOutlined,
  EditOutlined,
  FolderAddOutlined,
  FileAddOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';

const { Text } = Typography;

interface FileOperation {
  id: string;
  type: 'create' | 'delete' | 'rename' | 'move' | 'copy';
  timestamp: Date;
  description: string;
  originalPath?: string;
  newPath?: string;
  content?: string;
  isDirectory?: boolean;
  canUndo: boolean;
  undoData?: any;
}

interface FileOperationHistoryProps {
  onUndo?: (operation: FileOperation) => Promise<void>;
  onRedo?: (operation: FileOperation) => Promise<void>;
  maxHistorySize?: number;
}

export const FileOperationHistory: React.FC<FileOperationHistoryProps> = ({
  onUndo,
  onRedo,
  maxHistorySize = 50
}) => {
  const [operations, setOperations] = useState<FileOperation[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [showHistory, setShowHistory] = useState(false);

  // Load history from localStorage on mount
  useEffect(() => {
    const savedHistory = localStorage.getItem('fileOperationHistory');
    if (savedHistory) {
      try {
        const parsed = JSON.parse(savedHistory);
        setOperations(parsed.operations || []);
        setCurrentIndex(parsed.currentIndex || -1);
      } catch (error) {
        console.error('Failed to load operation history:', error);
      }
    }
  }, []);

  // Save history to localStorage
  const saveHistory = useCallback((ops: FileOperation[], index: number) => {
    try {
      localStorage.setItem('fileOperationHistory', JSON.stringify({
        operations: ops,
        currentIndex: index
      }));
    } catch (error) {
      console.error('Failed to save operation history:', error);
    }
  }, []);

  // Add new operation to history
  const addOperation = useCallback((operation: Omit<FileOperation, 'id' | 'timestamp'>) => {
    const newOperation: FileOperation = {
      ...operation,
      id: `op_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
      timestamp: new Date()
    };

    setOperations(prev => {
      // Remove any operations after current index (when adding new operation after undo)
      const newOps = prev.slice(0, currentIndex + 1);
      newOps.push(newOperation);
      
      // Limit history size
      const limitedOps = newOps.slice(-maxHistorySize);
      
      const newIndex = limitedOps.length - 1;
      setCurrentIndex(newIndex);
      saveHistory(limitedOps, newIndex);
      
      return limitedOps;
    });
  }, [currentIndex, maxHistorySize, saveHistory]);

  // Undo operation
  const handleUndo = useCallback(async () => {
    if (currentIndex < 0 || currentIndex >= operations.length) return;

    const operation = operations[currentIndex];
    if (!operation.canUndo) {
      message.warning('This operation cannot be undone');
      return;
    }

    try {
      if (onUndo) {
        await onUndo(operation);
      } else {
        // Default undo logic
        await performDefaultUndo(operation);
      }

      setCurrentIndex(prev => prev - 1);
      message.success(`Undid: ${operation.description}`);
    } catch (error) {
      message.error(`Failed to undo operation: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, [currentIndex, operations, onUndo]);

  // Redo operation
  const handleRedo = useCallback(async () => {
    if (currentIndex >= operations.length - 1) return;

    const operation = operations[currentIndex + 1];
    
    try {
      if (onRedo) {
        await onRedo(operation);
      } else {
        // Default redo logic
        await performDefaultRedo(operation);
      }

      setCurrentIndex(prev => prev + 1);
      message.success(`Redid: ${operation.description}`);
    } catch (error) {
      message.error(`Failed to redo operation: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, [currentIndex, operations, onRedo]);

  // Default undo implementation
  const performDefaultUndo = useCallback(async (operation: FileOperation) => {
    switch (operation.type) {
      case 'create':
        // Delete the created file/directory
        if (operation.newPath) {
          await window.electronAPI?.fs.deleteFile(operation.newPath);
        }
        break;

      case 'delete':
        // Restore the deleted file/directory
        if (operation.originalPath && operation.undoData) {
          if (operation.isDirectory) {
            await window.electronAPI?.fs.createDirectory(operation.originalPath);
          } else {
            await window.electronAPI?.fs.writeFile(operation.originalPath, operation.undoData.content || '');
          }
        }
        break;

      case 'rename':
        // Rename back to original name
        if (operation.newPath && operation.originalPath) {
          await window.electronAPI?.fs.rename(operation.newPath, operation.originalPath);
        }
        break;

      case 'move':
        // Move back to original location
        if (operation.newPath && operation.originalPath) {
          await window.electronAPI?.fs.move(operation.newPath, operation.originalPath);
        }
        break;

      case 'copy':
        // Delete the copied file
        if (operation.newPath) {
          await window.electronAPI?.fs.deleteFile(operation.newPath);
        }
        break;

      default:
        throw new Error(`Unsupported operation type: ${operation.type}`);
    }
  }, []);

  // Default redo implementation
  const performDefaultRedo = useCallback(async (operation: FileOperation) => {
    switch (operation.type) {
      case 'create':
        // Recreate the file/directory
        if (operation.newPath) {
          if (operation.isDirectory) {
            await window.electronAPI?.fs.createDirectory(operation.newPath);
          } else {
            await window.electronAPI?.fs.writeFile(operation.newPath, operation.content || '');
          }
        }
        break;

      case 'delete':
        // Delete again
        if (operation.originalPath) {
          await window.electronAPI?.fs.deleteFile(operation.originalPath);
        }
        break;

      case 'rename':
        // Rename to new name
        if (operation.originalPath && operation.newPath) {
          await window.electronAPI?.fs.rename(operation.originalPath, operation.newPath);
        }
        break;

      case 'move':
        // Move to new location
        if (operation.originalPath && operation.newPath) {
          await window.electronAPI?.fs.move(operation.originalPath, operation.newPath);
        }
        break;

      case 'copy':
        // Copy again
        if (operation.originalPath && operation.newPath) {
          await window.electronAPI?.fs.copy(operation.originalPath, operation.newPath);
        }
        break;

      default:
        throw new Error(`Unsupported operation type: ${operation.type}`);
    }
  }, []);

  // Clear history
  const handleClearHistory = useCallback(() => {
    Modal.confirm({
      title: 'Clear Operation History',
      content: 'Are you sure you want to clear all operation history? This action cannot be undone.',
      onOk: () => {
        setOperations([]);
        setCurrentIndex(-1);
        saveHistory([], -1);
        message.success('Operation history cleared');
      }
    });
  }, [saveHistory]);

  // Get operation icon
  const getOperationIcon = useCallback((type: FileOperation['type']) => {
    switch (type) {
      case 'create':
        return <FileAddOutlined style={{ color: '#52c41a' }} />;
      case 'delete':
        return <DeleteOutlined style={{ color: '#ff4d4f' }} />;
      case 'rename':
        return <EditOutlined style={{ color: '#1890ff' }} />;
      case 'move':
        return <ScissorOutlined style={{ color: '#fa8c16' }} />;
      case 'copy':
        return <CopyOutlined style={{ color: '#722ed1' }} />;
      default:
        return <HistoryOutlined />;
    }
  }, []);

  // Format timestamp
  const formatTimestamp = useCallback((timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return timestamp.toLocaleDateString();
  }, []);

  const canUndo = currentIndex >= 0;
  const canRedo = currentIndex < operations.length - 1;

  // Expose addOperation method globally for other components to use
  useEffect(() => {
    (window as any).fileOperationHistory = { addOperation };
  }, [addOperation]);

  return (
    <div>
      {/* Control buttons */}
      <Space>
        <Tooltip title="Undo (Ctrl+Z)">
          <Button
            
            icon={<UndoOutlined />}
            onClick={handleUndo}
            disabled={!canUndo}
            title="Undo (Ctrl+Z)"
          />
        </Tooltip>
        
        <Tooltip title="Redo (Ctrl+Y)">
          <Button
            
            icon={<RedoOutlined />}
            onClick={handleRedo}
            disabled={!canRedo}
            title="Redo (Ctrl+Y)"
          />
        </Tooltip>
        
        <Tooltip title="Show History">
          <Button
            
            icon={<HistoryOutlined />}
            onClick={() => setShowHistory(!showHistory)}
            type={showHistory ? 'primary' : 'default'}
            title="Show History"
          />
        </Tooltip>
      </Space>

      {/* History panel */}
      {showHistory && (
        <Card
          title={
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Operation History</span>
              <Space>
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  {operations.length} operations
                </Text>
                <Button
                  
                  icon={<DeleteOutlined />}
                  onClick={handleClearHistory}
                  disabled={operations.length === 0}
                  danger
                >
                  Clear
                </Button>
              </Space>
            </div>
          }
          
          style={{ 
            marginTop: '8px',
            maxHeight: '300px',
            overflow: 'auto'
          }}
        >
          {operations.length === 0 ? (
            <Empty 
              description="No operations in history"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          ) : (
            <List
              
              dataSource={operations.slice().reverse()}
              renderItem={(operation, index) => {
                const actualIndex = operations.length - 1 - index;
                const isCurrentOperation = actualIndex === currentIndex;
                const isUndone = actualIndex > currentIndex;

                return (
                  <List.Item
                    style={{
                      opacity: isUndone ? 0.5 : 1,
                      backgroundColor: isCurrentOperation ? 'rgba(24, 144, 255, 0.1)' : 'transparent',
                      borderRadius: '4px',
                      padding: '8px'
                    }}
                  >
                    <List.Item.Meta
                      avatar={getOperationIcon(operation.type)}
                      title={
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Text style={{ fontSize: '13px' }}>
                            {operation.description}
                          </Text>
                          <Tag 
                             
                            color={isUndone ? 'default' : 'blue'}
                          >
                            {operation.type}
                          </Tag>
                          {!operation.canUndo && (
                            <Tag  color="orange">
                              No Undo
                            </Tag>
                          )}
                        </div>
                      }
                      description={
                        <div style={{ fontSize: '11px', color: '#888' }}>
                          <ClockCircleOutlined style={{ marginRight: '4px' }} />
                          {formatTimestamp(operation.timestamp)}
                          {isCurrentOperation && (
                            <Tag  color="green" style={{ marginLeft: '8px' }}>
                              Current
                            </Tag>
                          )}
                          {isUndone && (
                            <Tag  color="default" style={{ marginLeft: '8px' }}>
                              Undone
                            </Tag>
                          )}
                        </div>
                      }
                    />
                  </List.Item>
                );
              }}
            />
          )}
        </Card>
      )}
    </div>
  );
};
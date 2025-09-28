/**
 * Enhanced File Preview Component
 * Advanced file preview with caching, history, and multiple file type support
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Card, 
  Spin, 
  Typography, 
  Image, 
  Alert, 
  Button, 
  Tabs, 
  List,
  Tag,
  Space,
  Tooltip
} from 'antd';
import { 
  HistoryOutlined, 
  ReloadOutlined, 
  FullscreenOutlined,
  DownloadOutlined,
  EyeOutlined
} from '@ant-design/icons';
import { FileItem } from '../../store/slices/fileSlice';

const { Text, Paragraph } = Typography;
const { TabPane } = Tabs;

interface FilePreview {
  type: 'text' | 'image' | 'binary' | 'code' | 'json' | 'markdown' | 'pdf' | 'video' | 'audio';
  content?: string;
  size: number;
  mtime: Date;
  language?: string;
  encoding?: string;
  lineCount?: number;
  metadata?: Record<string, any>;
}

interface PreviewHistoryItem {
  file: FileItem;
  timestamp: Date;
  preview: FilePreview;
}

interface EnhancedFilePreviewProps {
  file: FileItem | null;
  style?: React.CSSProperties;
}

// Preview cache to avoid re-loading same files
const previewCache = new Map<string, { preview: FilePreview; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const EnhancedFilePreview: React.FC<EnhancedFilePreviewProps> = ({ 
  file, 
  style 
}) => {
  const [preview, setPreview] = useState<FilePreview | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewHistory, setPreviewHistory] = useState<PreviewHistoryItem[]>([]);
  const [activeTab, setActiveTab] = useState('preview');

  // Load preview with caching
  const loadPreview = useCallback(async (file: FileItem) => {
    setLoading(true);
    setError(null);

    try {
      // Check cache first
      const cached = previewCache.get(file.path);
      const now = Date.now();
      
      if (cached && (now - cached.timestamp) < CACHE_DURATION) {
        setPreview(cached.preview);
        setLoading(false);
        return;
      }

      const result = await window.electronAPI?.fs.getPreview(file.path);
      
      if (result?.success) {
        const enhancedPreview = await enhancePreview(result.preview, file);
        setPreview(enhancedPreview);
        
        // Cache the result
        previewCache.set(file.path, {
          preview: enhancedPreview,
          timestamp: now
        });

        // Add to history
        setPreviewHistory(prev => {
          const newHistory = prev.filter(item => item.file.path !== file.path);
          newHistory.unshift({
            file,
            timestamp: new Date(),
            preview: enhancedPreview
          });
          return newHistory.slice(0, 10); // Keep last 10 items
        });
      } else {
        setError(result?.error || 'Failed to load preview');
      }
    } catch (err) {
      setError('Failed to load file preview');
    } finally {
      setLoading(false);
    }
  }, []);

  // Enhance preview with additional metadata and processing
  const enhancePreview = useCallback(async (preview: FilePreview, file: FileItem): Promise<FilePreview> => {
    const enhanced = { ...preview };

    // Add file-specific enhancements
    if (preview.type === 'code' && preview.content) {
      // Count lines
      enhanced.lineCount = preview.content.split('\n').length;
      
      // Detect language from extension
      const extension = file.name.split('.').pop()?.toLowerCase();
      const languageMap: Record<string, string> = {
        'js': 'javascript',
        'jsx': 'javascript',
        'ts': 'typescript',
        'tsx': 'typescript',
        'py': 'python',
        'java': 'java',
        'cpp': 'cpp',
        'c': 'c',
        'cs': 'csharp',
        'php': 'php',
        'rb': 'ruby',
        'go': 'go',
        'rs': 'rust',
        'html': 'html',
        'css': 'css',
        'scss': 'scss',
        'json': 'json',
        'xml': 'xml',
        'yaml': 'yaml',
        'yml': 'yaml',
        'md': 'markdown'
      };
      enhanced.language = languageMap[extension || ''] || 'text';
    }

    if (preview.type === 'json' && preview.content) {
      try {
        const parsed = JSON.parse(preview.content);
        enhanced.metadata = {
          keys: Object.keys(parsed).length,
          isArray: Array.isArray(parsed),
          depth: getObjectDepth(parsed)
        };
      } catch (e) {
        // Invalid JSON
      }
    }

    if (preview.type === 'image') {
      try {
        // Get image dimensions if possible
        const stats = await window.electronAPI?.fs.getStats(file.path);
        if (stats?.success) {
          enhanced.metadata = {
            ...enhanced.metadata,
            fileSize: stats.stats.size
          };
        }
      } catch (e) {
        // Ignore errors
      }
    }

    return enhanced;
  }, []);

  const getObjectDepth = (obj: any): number => {
    if (typeof obj !== 'object' || obj === null || obj === undefined) return 0;
    
    try {
      const values = Object.values(obj);
      if (!values || values.length === 0) return 1;
      return 1 + Math.max(0, ...values.map(getObjectDepth));
    } catch (error) {
      console.warn('Error in getObjectDepth:', error);
      return 0;
    }
  };

  useEffect(() => {
    if (!file || file.isDirectory) {
      setPreview(null);
      setError(null);
      return;
    }

    loadPreview(file);
  }, [file, loadPreview]);

  const formatFileSize = useCallback((bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }, []);

  const formatDate = useCallback((date: Date): string => {
    return new Date(date).toLocaleString();
  }, []);

  const handleRefresh = useCallback(() => {
    if (file) {
      // Clear cache for this file
      previewCache.delete(file.path);
      loadPreview(file);
    }
  }, [file, loadPreview]);

  const handleHistorySelect = useCallback((historyItem: PreviewHistoryItem) => {
    // This would typically trigger a file selection in the parent component
    // For now, we'll just switch to that preview
    setPreview(historyItem.preview);
    setActiveTab('preview');
  }, []);

  const renderPreviewContent = useMemo(() => {
    if (!preview) return null;

    switch (preview.type) {
      case 'text':
      case 'code':
        return (
          <div style={{ padding: '12px' }}>
            {preview.type === 'code' && (
              <div style={{ 
                fontSize: '11px', 
                color: '#888', 
                marginBottom: '8px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <Space>
                  <Tag color="blue">{preview.language || 'text'}</Tag>
                  {preview.lineCount && <span>Lines: {preview.lineCount}</span>}
                </Space>
              </div>
            )}
            <pre
              style={{
                fontSize: '12px',
                fontFamily: 'Consolas, Monaco, "Courier New", monospace',
                backgroundColor: '#1e1e1e',
                color: '#d4d4d4',
                padding: '12px',
                borderRadius: '4px',
                overflow: 'auto',
                maxHeight: '400px',
                margin: 0,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                border: '1px solid #333',
              }}
            >
              {preview.content}
            </pre>
          </div>
        );

      case 'json':
        return (
          <div style={{ padding: '12px' }}>
            <div style={{ 
              fontSize: '11px', 
              color: '#888', 
              marginBottom: '8px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <Space>
                <Tag color="green">JSON</Tag>
                {preview.metadata?.keys && <span>Keys: {preview.metadata.keys}</span>}
                {preview.metadata?.isArray && <Tag color="orange">Array</Tag>}
                {preview.metadata?.depth && <span>Depth: {preview.metadata.depth}</span>}
              </Space>
            </div>
            <pre
              style={{
                fontSize: '12px',
                fontFamily: 'Consolas, Monaco, "Courier New", monospace',
                backgroundColor: '#1e1e1e',
                color: '#d4d4d4',
                padding: '12px',
                borderRadius: '4px',
                overflow: 'auto',
                maxHeight: '400px',
                margin: 0,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                border: '1px solid #333',
              }}
            >
              {JSON.stringify(JSON.parse(preview.content || '{}'), null, 2)}
            </pre>
          </div>
        );

      case 'markdown':
        return (
          <div style={{ padding: '12px' }}>
            <div style={{ 
              fontSize: '11px', 
              color: '#888', 
              marginBottom: '8px'
            }}>
              <Tag color="purple">Markdown</Tag>
            </div>
            <div
              style={{
                backgroundColor: '#1e1e1e',
                color: '#d4d4d4',
                padding: '12px',
                borderRadius: '4px',
                overflow: 'auto',
                maxHeight: '400px',
                border: '1px solid #333',
              }}
            >
              {/* For now, show raw markdown. In a real implementation, you'd use a markdown renderer */}
              <pre style={{ 
                fontSize: '12px',
                fontFamily: 'Consolas, Monaco, "Courier New", monospace',
                margin: 0,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
              }}>
                {preview.content}
              </pre>
            </div>
          </div>
        );

      case 'image':
        return (
          <div style={{ padding: '12px', textAlign: 'center' }}>
            <div style={{ 
              fontSize: '11px', 
              color: '#888', 
              marginBottom: '8px'
            }}>
              <Tag color="cyan">Image</Tag>
              {preview.metadata?.fileSize && (
                <span>Size: {formatFileSize(preview.metadata.fileSize)}</span>
              )}
            </div>
            <Image
              src={`file://${file?.path}`}
              alt={file?.name}
              style={{ maxWidth: '100%', maxHeight: '400px' }}
              fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMIAAADDCAYAAADQvc6UAAABRWlDQ1BJQ0MgUHJvZmlsZQAAKJFjYGASSSwoyGFhYGDIzSspCnJ3UoiIjFJgf8LAwSDCIMogwMCcmFxc4BgQ4ANUwgCjUcG3awyMIPqyLsis7PPOq3QdDFcvjV3jOD1boQVTPQrgSkktTgbSf4A4LbmgqISBgTEFyFYuLykAsTuAbJEioKOA7DkgdjqEvQHEToKwj4DVhAQ5A9k3gGyB5IxEoBmML4BsnSQk8XQkNtReEOBxcfXxUQg1Mjc0dyHgXNJBSWpFCYh2zi+oLMpMzyhRcASGUqqCZ16yno6CkYGRAQMDKMwhqj/fAIcloxgHQqxAjIHBEugw5sUIsSQpBobtQPdLciLEVJYzMPBHMDBsayhILEqEO4DxG0txmrERhM29nYGBddr//5/DGRjYNRkY/l7////39v///y4Dmn+LgeHANwDrkl1AuO+pmgAAADhlWElmTU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAAqACAAQAAAABAAAAwqADAAQAAAABAAAAwwAAAAD9b/HnAAAHlklEQVR4Ae3dP3Ik1RnG4W+FgYxN"
            />
          </div>
        );

      case 'binary':
        return (
          <div style={{ 
            padding: '16px',
            textAlign: 'center',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: '#1e1e1e'
          }}>
            <div style={{
              padding: '20px',
              borderRadius: '8px',
              backgroundColor: '#2d2d30',
              border: '1px solid #3e3e42',
              maxWidth: '280px'
            }}>
              <div style={{ 
                fontSize: '16px', 
                marginBottom: '8px',
                color: '#cccccc'
              }}>
                📄 Binary File
              </div>
              <div style={{ 
                fontSize: '13px', 
                color: '#888',
                lineHeight: '1.4'
              }}>
                This file cannot be previewed as it contains binary data.
              </div>
              <div style={{ marginTop: '12px' }}>
                <Button 
                   
                  icon={<DownloadOutlined />}
                  onClick={() => {
                    if (file) {
                      window.electronAPI?.app.showItemInFolder(file.path);
                    }
                  }}
                >
                  Show in Explorer
                </Button>
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div style={{ 
            padding: '16px',
            textAlign: 'center',
            color: '#888'
          }}>
            <Text type="secondary">Unsupported file type</Text>
          </div>
        );
    }
  }, [preview, file, formatFileSize]);

  if (!file) {
    return (
      <Card
        title="File Preview"
        
        style={{ ...style, height: '100%' }}
        styles={{ 
          body: { 
            padding: '12px', 
            textAlign: 'center', 
            color: '#888' 
          }
        }}
      >
        <Text type="secondary">Select a file to preview</Text>
      </Card>
    );
  }

  if (file.isDirectory) {
    return (
      <Card
        title="File Preview"
        
        style={{ ...style, height: '100%' }}
        styles={{ 
          body: { 
            padding: '12px' 
          }
        }}
      >
        <div style={{ textAlign: 'center', color: '#888' }}>
          <Text type="secondary">Directory selected</Text>
          <br />
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {file.name}
          </Text>
        </div>
      </Card>
    );
  }

  return (
    <Card
      title={
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>File Preview</span>
          <Space>
            <Tooltip title="Refresh">
              <Button 
                 
                icon={<ReloadOutlined />} 
                onClick={handleRefresh}
                loading={loading}
                title="Refresh"
              />
            </Tooltip>
          </Space>
        </div>
      }
      
      style={{ 
        ...style, 
        height: '100%',
        position: 'relative',
        zIndex: 'auto',
        overflow: 'hidden'
      }}
      styles={{ 
        body: { 
          padding: 0,
          height: 'calc(100% - 40px)',
          overflow: 'hidden'
        }
      }}
    >
      <Tabs 
        activeKey={activeTab} 
        onChange={setActiveTab}
        
        style={{ height: '100%' }}
        items={[
          {
            key: 'preview',
            label: (
              <span>
                <EyeOutlined />
                Preview
              </span>
            ),
            children: (
              <div style={{ height: 'calc(100vh - 200px)', overflow: 'auto' }}>
                {loading && (
                  <div style={{ padding: '24px', textAlign: 'center' }}>
                    <Spin />
                  </div>
                )}

                {error && (
                  <div style={{ padding: '12px' }}>
                    <Alert
                      message="Preview Error"
                      description={error}
                      type="error"
                      showIcon
                    />
                  </div>
                )}

                {!loading && !error && preview && (
                  <>
                    <div style={{ 
                      padding: '12px', 
                      borderBottom: '1px solid #333',
                      backgroundColor: '#1e1e1e'
                    }}>
                      <Text strong style={{ fontSize: '13px' }}>{file.name}</Text>
                      <br />
                      <Text type="secondary" style={{ fontSize: '11px' }}>
                        Size: {formatFileSize(preview.size)}
                      </Text>
                      <br />
                      <Text type="secondary" style={{ fontSize: '11px' }}>
                        Modified: {formatDate(preview.mtime)}
                      </Text>
                      {preview.encoding && (
                        <>
                          <br />
                          <Text type="secondary" style={{ fontSize: '11px' }}>
                            Encoding: {preview.encoding}
                          </Text>
                        </>
                      )}
                    </div>
                    
                    {renderPreviewContent}
                  </>
                )}
              </div>
            )
          },
          {
            key: 'history',
            label: (
              <span>
                <HistoryOutlined />
                History ({previewHistory.length})
              </span>
            ),
            children: (
              <div style={{ height: 'calc(100vh - 200px)', overflow: 'auto', padding: '8px' }}>
                {previewHistory.length === 0 ? (
                  <div style={{ textAlign: 'center', color: '#888', padding: '20px' }}>
                    <Text type="secondary">No preview history</Text>
                  </div>
                ) : (
                  <List
                    
                    dataSource={previewHistory}
                    renderItem={(item) => (
                      <List.Item
                        style={{ cursor: 'pointer', padding: '8px' }}
                        onClick={() => handleHistorySelect(item)}
                      >
                        <List.Item.Meta
                          title={
                            <Text style={{ fontSize: '13px' }}>
                              {item.file.name}
                            </Text>
                          }
                          description={
                            <div>
                              <Text type="secondary" style={{ fontSize: '11px' }}>
                                {formatDate(item.timestamp)}
                              </Text>
                              <br />
                              <Tag  color="blue">
                                {item.preview.type}
                              </Tag>
                            </div>
                          }
                        />
                      </List.Item>
                    )}
                  />
                )}
              </div>
            )
          }
        ]}
      />
    </Card>
  );
};
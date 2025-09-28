/**
 * File Preview Component
 * Shows preview of selected files (text, images, etc.)
 */

import React, { useState, useEffect } from 'react';
import { Card, Spin, Typography, Image, Alert } from 'antd';
import { FileItem } from '../../store/slices/fileSlice';

const { Text, Paragraph } = Typography;

interface FilePreviewProps {
  file: FileItem | null;
  style?: React.CSSProperties;
}

interface FilePreview {
  type: 'text' | 'image' | 'binary' | 'code';
  content?: string;
  size: number;
  mtime: Date;
  language?: string;
  encoding?: string;
  lineCount?: number;
}

export const FilePreview: React.FC<FilePreviewProps> = ({ file, style }) => {
  const [preview, setPreview] = useState<FilePreview | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!file || file.isDirectory) {
      setPreview(null);
      setError(null);
      return;
    }

    loadPreview(file);
  }, [file]);

  const loadPreview = async (file: FileItem) => {
    setLoading(true);
    setError(null);

    try {
      const result = await window.electronAPI?.fs.getPreview(file.path);
      
      if (result?.success) {
        setPreview(result.preview);
      } else {
        setError(result?.error || 'Failed to load preview');
      }
    } catch (err) {
      setError('Failed to load file preview');
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (date: Date): string => {
    return new Date(date).toLocaleString();
  };

  const renderPreviewContent = () => {
    if (!preview) return null;

    switch (preview.type) {
      case 'text':
        return (
          <div style={{ padding: '12px' }}>
            <pre
              style={{
                fontSize: '12px',
                fontFamily: 'Consolas, Monaco, "Courier New", monospace',
                backgroundColor: '#1e1e1e',
                color: '#d4d4d4',
                padding: '12px',
                borderRadius: '4px',
                overflow: 'auto',
                maxHeight: '300px',
                margin: 0,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
              }}
            >
              {preview.content}
            </pre>
          </div>
        );

      case 'code':
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
              <span>Language: {preview.language || 'Unknown'}</span>
              {preview.lineCount && <span>Lines: {preview.lineCount}</span>}
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
                maxHeight: '300px',
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

      case 'image':
        return (
          <div style={{ padding: '12px', textAlign: 'center' }}>
            <Image
              src={`file://${file?.path}`}
              alt={file?.name}
              style={{ maxWidth: '100%', maxHeight: '300px' }}
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
            </div>
          </div>
        );

      default:
        return null;
    }
  };

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
      title="File Preview"
      
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
          overflow: 'auto'
        }
      }}
    >
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
          
          <div style={{ 
            height: 'calc(100% - 80px)',
            overflow: 'auto',
            position: 'relative'
          }}>
            {renderPreviewContent()}
          </div>
        </>
      )}
    </Card>
  );
};
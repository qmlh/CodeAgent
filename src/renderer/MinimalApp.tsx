/**
 * Minimal App Component for testing
 */

import React, { useState } from 'react';
import { ConfigProvider, theme, Button, message } from 'antd';
import { Provider } from 'react-redux';
import { store } from './store/store';
import { useAppDispatch, useAppSelector } from './hooks/redux';
import { loadWorkspace } from './store/slices/fileSlice';

const FileExplorer: React.FC = () => {
  const dispatch = useAppDispatch();
  const { fileTree, currentWorkspace, status } = useAppSelector(state => state.file);
  const [selectedPath, setSelectedPath] = useState<string>('');

  const handleOpenFolder = async () => {
    try {
      const result = await window.electronAPI?.app.showOpenDialog({
        title: 'Open Folder',
        properties: ['openDirectory'],
        buttonLabel: 'Open Folder'
      });

      if (result?.success && !result.canceled && result.filePaths && result.filePaths[0]) {
        console.log('Selected folder:', result.filePaths[0]);
        setSelectedPath(result.filePaths[0]);
        await dispatch(loadWorkspace(result.filePaths[0])).unwrap();
        message.success('Folder opened successfully');
      }
    } catch (error) {
      console.error('Failed to open folder:', error);
      message.error('Failed to open folder');
    }
  };

  return (
    <div style={{ 
      height: '100vh', 
      padding: '20px',
      backgroundColor: '#1f1f1f',
      color: '#cccccc'
    }}>
      <h1>Multi-Agent IDE - File Explorer Test</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <Button type="primary" onClick={handleOpenFolder} loading={status === 'loading'}>
          Open Folder
        </Button>
      </div>

      {selectedPath && (
        <div style={{ marginBottom: '20px' }}>
          <strong>Selected Path:</strong> {selectedPath}
        </div>
      )}

      {currentWorkspace && (
        <div style={{ marginBottom: '20px' }}>
          <strong>Current Workspace:</strong> {currentWorkspace}
        </div>
      )}

      <div>
        <strong>Files Found:</strong> {fileTree?.length || 0}
      </div>

      {fileTree && fileTree.length > 0 && (
        <div style={{ marginTop: '20px' }}>
          <h3>Files:</h3>
          <div style={{ maxHeight: '400px', overflow: 'auto' }}>
            {fileTree.map((file, index) => (
              <div key={file.path || index} style={{ 
                padding: '4px 8px',
                borderBottom: '1px solid #333',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <span>{file.isDirectory ? '📁' : '📄'}</span>
                <span>{file.name}</span>
                <span style={{ fontSize: '12px', color: '#888' }}>
                  {file.path}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export const MinimalApp: React.FC = () => {
  return (
    <Provider store={store}>
      <ConfigProvider
        theme={{
          algorithm: theme.darkAlgorithm,
          token: {
            colorPrimary: '#1890ff',
            colorBgBase: '#1f1f1f',
            colorTextBase: '#cccccc'
          }
        }}
      >
        <FileExplorer />
      </ConfigProvider>
    </Provider>
  );
};
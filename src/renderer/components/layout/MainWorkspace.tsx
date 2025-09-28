/**
 * Main Workspace Component
 * Central area containing editor, preview, and other main content
 */

import React, { useState } from 'react';
import { Layout, Tabs, Empty, Button, Dropdown } from 'antd';
import { CloseOutlined, PlusOutlined, GlobalOutlined, SplitCellsOutlined } from '@ant-design/icons';
import { CodeEditor } from '../editor/CodeEditor';
import { WelcomeScreen } from '../welcome/WelcomeScreen';
import { BrowserPanel } from '../browser/BrowserPanel';
import { useAppSelector, useAppDispatch } from '../../hooks/redux';
import { closeFile, setActiveFile } from '../../store/slices/fileSlice';
import { setBrowserVisible, createTab } from '../../store/slices/browserSlice';

const { Content } = Layout;
const { TabPane } = Tabs;

export const MainWorkspace: React.FC = () => {
  const dispatch = useAppDispatch();
  const { openFiles, activeFile } = useAppSelector(state => state.file);
  const { isVisible: isBrowserVisible } = useAppSelector(state => state.browser);
  const [splitView, setSplitView] = useState(false);

  const handleTabChange = (activeKey: string) => {
    dispatch(setActiveFile(activeKey));
  };

  const handleTabClose = (targetKey: string | React.MouseEvent | React.KeyboardEvent, action: 'add' | 'remove') => {
    if (action === 'remove' && typeof targetKey === 'string') {
      dispatch(closeFile(targetKey));
    }
  };

  const handleNewFile = () => {
    // TODO: Implement new file creation
    console.log('New file action');
  };

  const handleToggleBrowser = () => {
    dispatch(setBrowserVisible(!isBrowserVisible));
    if (!isBrowserVisible) {
      // Create a default tab when opening browser
      dispatch(createTab({ url: 'http://localhost:3000', title: 'Preview' }));
    }
  };

  const handleOpenPreview = () => {
    dispatch(setBrowserVisible(true));
    dispatch(createTab({ url: 'http://localhost:3000', title: 'Live Preview' }));
  };

  const renderTabBar = (props: any, DefaultTabBar: any) => (
    <div className="editor-tab-bar">
      <DefaultTabBar {...props} />
      <div className="tab-actions">
        <Button 
          
          icon={<PlusOutlined />}
          onClick={handleNewFile}
          title="New File"
        />
        <Button 
          
          icon={<GlobalOutlined />}
          onClick={handleToggleBrowser}
          title="Toggle Browser"
          type={isBrowserVisible ? 'primary' : 'default'}
        />
        <Dropdown
          menu={{
            items: [
              {
                key: 'preview',
                label: 'Open Preview',
                icon: <GlobalOutlined />,
                onClick: handleOpenPreview,
              },
              {
                key: 'split',
                label: 'Split View',
                icon: <SplitCellsOutlined />,
                onClick: () => setSplitView(!splitView),
              },
            ],
          }}
        >
          <Button  icon={<SplitCellsOutlined />} title="View Options" />
        </Dropdown>
      </div>
    </div>
  );

  const renderTabContent = (file: any) => {
    const fileExtension = file.path.split('.').pop()?.toLowerCase();
    
    // Check if file is binary
    if (file.isBinary) {
      return (
        <div style={{ 
          height: '100%', 
          width: '100%', 
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          background: '#1e1e1e',
          color: '#cccccc'
        }}>
          <div style={{ textAlign: 'center' }}>
            <h3>Binary File</h3>
            <p>This file cannot be previewed as it contains binary data.</p>
            <p style={{ fontSize: '12px', color: '#888' }}>
              File: {file.name}
            </p>
          </div>
        </div>
      );
    }
    
    // Try to render with CodeEditor for text files
    try {
      return (
        <div style={{ height: '100%', width: '100%' }}>
          <CodeEditor file={file} />
        </div>
      );
    } catch (error) {
      console.error('Failed to render CodeEditor:', error);
      // Fallback to simple text display
      return (
        <div style={{ 
          height: '100%', 
          width: '100%', 
          padding: '16px',
          fontFamily: 'monospace',
          fontSize: '14px',
          lineHeight: '1.5',
          whiteSpace: 'pre-wrap',
          overflow: 'auto',
          background: '#1e1e1e',
          color: '#cccccc'
        }}>
          {file.content || 'Empty file'}
        </div>
      );
    }
  };

  // Show empty editor if no files are open and browser is not visible
  if (openFiles.length === 0 && !isBrowserVisible) {
    return (
      <div className="main-workspace" style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', color: '#888' }}>
          <h3>Multi-Agent IDE</h3>
          <p>Open a file from the Explorer to start editing</p>
          <div style={{ marginTop: '16px' }}>
            <Button icon={<GlobalOutlined />} onClick={handleOpenPreview}>
              Open Preview
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const workspaceStyle: React.CSSProperties = {
    height: '100%',
    display: 'flex',
    flexDirection: isBrowserVisible && openFiles.length > 0 ? 'row' : 'column'
  };

  const editorStyle: React.CSSProperties = {
    flex: isBrowserVisible && openFiles.length > 0 ? '1' : '1',
    overflow: 'hidden',
    minWidth: isBrowserVisible && openFiles.length > 0 ? '400px' : 'auto'
  };

  const browserStyle: React.CSSProperties = {
    flex: '1',
    overflow: 'hidden',
    minWidth: '400px',
    borderLeft: openFiles.length > 0 ? '1px solid #d9d9d9' : 'none'
  };

  return (
    <div className="main-workspace" style={workspaceStyle}>
      {/* Editor Section */}
      {openFiles.length > 0 && (
        <div className="workspace-editor" style={editorStyle}>
          <Tabs
            type="editable-card"
            activeKey={activeFile || undefined}
            onChange={handleTabChange}
            onEdit={handleTabClose}
            hideAdd
            className="editor-tabs"
            renderTabBar={renderTabBar}
            style={{ height: '100%' }}
          >
            {openFiles.map(file => (
              <TabPane
                key={file.path}
                tab={
                  <div className="editor-tab-title">
                    <span className="tab-name">{file.name}</span>
                    {file.isDirty && <span className="tab-dirty-indicator">●</span>}
                  </div>
                }
                closable={true}
                style={{ height: '100%' }}
              >
                {renderTabContent(file)}
              </TabPane>
            ))}
          </Tabs>
        </div>
      )}

      {/* Browser Section */}
      {isBrowserVisible && (
        <div className="workspace-browser" style={browserStyle}>
          <BrowserPanel />
        </div>
      )}
    </div>
  );
};
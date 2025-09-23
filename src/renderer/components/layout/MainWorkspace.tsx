/**
 * Main Workspace Component
 * Central area containing editor, preview, and other main content
 */

import React, { useState } from 'react';
import { Layout, Tabs, Empty } from 'antd';
import { CloseOutlined, PlusOutlined } from '@ant-design/icons';
import { CodeEditor } from '../editor/CodeEditor';
import { WelcomeScreen } from '../welcome/WelcomeScreen';
import { useAppSelector, useAppDispatch } from '../../hooks/redux';
import { closeFile, setActiveFile } from '../../store/slices/fileSlice';

const { Content } = Layout;
const { TabPane } = Tabs;

export const MainWorkspace: React.FC = () => {
  const dispatch = useAppDispatch();
  const { openFiles, activeFile } = useAppSelector(state => state.file);
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

  const renderTabBar = (props: any, DefaultTabBar: any) => (
    <div className="editor-tab-bar">
      <DefaultTabBar {...props} />
      <div className="tab-actions">
        <button 
          className="tab-action-button"
          onClick={handleNewFile}
          title="New File"
        >
          <PlusOutlined />
        </button>
      </div>
    </div>
  );

  const renderTabContent = (file: any) => {
    const fileExtension = file.path.split('.').pop()?.toLowerCase();
    
    // Determine content type based on file extension
    if (['js', 'ts', 'jsx', 'tsx', 'css', 'scss', 'html', 'json', 'md'].includes(fileExtension || '')) {
      return <CodeEditor file={file} />;
    }
    
    // For other file types, show a placeholder
    return (
      <div className="file-preview">
        <Empty 
          description={`Preview not available for .${fileExtension} files`}
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      </div>
    );
  };

  // Show welcome screen if no files are open
  if (openFiles.length === 0) {
    return (
      <div className="main-workspace">
        <WelcomeScreen />
      </div>
    );
  }

  return (
    <div className="main-workspace">
      <div className="workspace-content">
        <Tabs
          type="editable-card"
          activeKey={activeFile || undefined}
          onChange={handleTabChange}
          onEdit={handleTabClose}
          hideAdd
          className="editor-tabs"
          renderTabBar={renderTabBar}
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
            >
              {renderTabContent(file)}
            </TabPane>
          ))}
        </Tabs>
      </div>
    </div>
  );
};
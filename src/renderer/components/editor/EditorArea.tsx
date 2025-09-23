/**
 * Editor Area Component
 * Main code editing area with tabs
 */

import React from 'react';
import { Tabs, Button } from 'antd';
import { CloseOutlined } from '@ant-design/icons';
import { useAppSelector, useAppDispatch } from '../../hooks/redux';
import { setActiveFile, closeFile } from '../../store/slices/fileSlice';
import { CodeEditor } from './CodeEditor';

export const EditorArea: React.FC = () => {
  const dispatch = useAppDispatch();
  const { openFiles, activeFile } = useAppSelector(state => state.file);

  const handleTabChange = (key: string) => {
    dispatch(setActiveFile(key));
  };

  const handleTabClose = (targetKey: string) => {
    dispatch(closeFile(targetKey));
  };

  const tabItems = openFiles.map(file => ({
    key: file.path,
    label: (
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span>{file.name}</span>
        {file.isDirty && <span style={{ color: '#faad14' }}>●</span>}
        <Button
          type="text"
          size="small"
          icon={<CloseOutlined />}
          onClick={(e) => {
            e.stopPropagation();
            handleTabClose(file.path);
          }}
          style={{ 
            width: '16px', 
            height: '16px', 
            minWidth: '16px',
            padding: 0,
            color: '#888'
          }}
        />
      </div>
    ),
    children: <CodeEditor file={file} />
  }));

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Tabs
        type="editable-card"
        activeKey={activeFile || undefined}
        onChange={handleTabChange}
        hideAdd
        items={tabItems}
        style={{ 
          flex: 1,
          display: 'flex',
          flexDirection: 'column'
        }}
        tabBarStyle={{
          margin: 0,
          background: '#2d2d30',
          borderBottom: '1px solid #3e3e42'
        }}
      />
    </div>
  );
};
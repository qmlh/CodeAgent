/**
 * Title Bar Component
 * Custom title bar for the Electron application
 */

import React from 'react';
import { MinusOutlined, BorderOutlined, CloseOutlined, BulbOutlined } from '@ant-design/icons';
import { Button, Tooltip } from 'antd';
import { useAppSelector } from '../../hooks/redux';
import { useTheme } from '../theme/ThemeProvider';

export const TitleBar: React.FC = () => {
  const { currentProject } = useAppSelector(state => state.app);
  const { currentTheme, toggleTheme } = useTheme();

  const handleMinimize = () => {
    window.electronAPI?.window.minimize();
  };

  const handleMaximize = () => {
    window.electronAPI?.window.maximize();
  };

  const handleClose = () => {
    window.electronAPI?.window.close();
  };

  const getTitle = () => {
    if (currentProject) {
      const projectName = currentProject.split('/').pop() || 'Untitled';
      return `${projectName} - Multi-Agent IDE`;
    }
    return 'Multi-Agent IDE';
  };

  return (
    <div className="title-bar">
      <div className="title-bar-title">
        {getTitle()}
      </div>
      
      <div className="title-bar-center">
        <Tooltip title={`Switch to ${currentTheme === 'dark' ? 'light' : 'dark'} theme`}>
          <button 
            className="title-bar-button theme-toggle"
            onClick={toggleTheme}
          >
            <BulbOutlined />
          </button>
        </Tooltip>
      </div>
      
      <div className="title-bar-controls">
        <button 
          className="title-bar-button minimize"
          onClick={handleMinimize}
          title="Minimize"
        >
          <MinusOutlined />
        </button>
        
        <button 
          className="title-bar-button maximize"
          onClick={handleMaximize}
          title="Maximize"
        >
          <BorderOutlined />
        </button>
        
        <button 
          className="title-bar-button close"
          onClick={handleClose}
          title="Close"
        >
          <CloseOutlined />
        </button>
      </div>
    </div>
  );
};
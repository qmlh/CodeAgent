/**
 * Bottom Panel Component
 * Bottom panel with terminal, output, problems, and other tools
 */

import React from 'react';
import { Tabs, Button, Tooltip } from 'antd';
import {
  CodeOutlined,
  FileTextOutlined,
  BugOutlined,
  ConsoleSqlOutlined,
  BranchesOutlined,
  CloseOutlined,
  ExpandOutlined,
  CompressOutlined
} from '@ant-design/icons';
import { useAppSelector, useAppDispatch } from '../../hooks/redux';
import { 
  togglePanel, 
  setPanelActivePanel, 
  setPanelHeight 
} from '../../store/slices/uiSlice';
import { TerminalPanel, GitPanel } from '../system';
import './BottomPanel.css';

const { TabPane } = Tabs;

export const BottomPanel: React.FC = () => {
  const dispatch = useAppDispatch();
  const { layout } = useAppSelector(state => state.ui);
  const { panel } = layout;

  if (!panel.visible) {
    return null;
  }

  const handleTabChange = (activeKey: string) => {
    dispatch(setPanelActivePanel(activeKey));
  };

  const handleClose = () => {
    dispatch(togglePanel());
  };

  const handleMaximize = () => {
    const newHeight = panel.height === 200 ? 400 : 200;
    dispatch(setPanelHeight(newHeight));
  };

  const renderPanelContent = (panelId: string) => {
    switch (panelId) {
      case 'terminal':
        return <TerminalPanel />;
      case 'output':
        return (
          <div style={{ padding: '16px', color: '#cccccc' }}>
            <div>Output panel - Coming soon</div>
          </div>
        );
      case 'problems':
        return (
          <div style={{ padding: '16px', color: '#cccccc' }}>
            <div>Problems panel - Coming soon</div>
          </div>
        );
      case 'debug':
        return (
          <div style={{ padding: '16px', color: '#cccccc' }}>
            <div>Debug console - Coming soon</div>
          </div>
        );
      case 'git':
        return <GitPanel />;
      default:
        return <TerminalPanel />;
    }
  };

  const getTabIcon = (panelId: string) => {
    switch (panelId) {
      case 'terminal':
        return <CodeOutlined />;
      case 'output':
        return <FileTextOutlined />;
      case 'problems':
        return <BugOutlined />;
      case 'debug':
        return <ConsoleSqlOutlined />;
      case 'git':
        return <BranchesOutlined />;
      default:
        return <CodeOutlined />;
    }
  };

  const tabBarExtraContent = (
    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
      <Tooltip title={panel.height === 200 ? 'Maximize' : 'Restore'}>
        <Button
          type="text"
          
          icon={panel.height === 200 ? <ExpandOutlined /> : <CompressOutlined />}
          onClick={handleMaximize}
        />
      </Tooltip>
      <Tooltip title="Close Panel">
        <Button
          type="text"
          
          icon={<CloseOutlined />}
          onClick={handleClose}
        />
      </Tooltip>
    </div>
  );

  return (
    <div 
      className="bottom-panel"
      style={{
        height: panel.height,
        background: '#1e1e1e',
        borderTop: '1px solid #3e3e42',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <Tabs
        activeKey={panel.activePanel}
        onChange={handleTabChange}
        
        tabBarExtraContent={tabBarExtraContent}
        className="bottom-panel-tabs"
        style={{ height: '100%' }}
      >
        {panel.panels
          .filter(p => p.visible)
          .map(panelConfig => (
            <TabPane
              key={panelConfig.id}
              tab={
                <span>
                  {getTabIcon(panelConfig.id)}
                  {panelConfig.title}
                </span>
              }
              style={{ height: '100%' }}
            >
              {renderPanelContent(panelConfig.id)}
            </TabPane>
          ))}
      </Tabs>
    </div>
  );
};
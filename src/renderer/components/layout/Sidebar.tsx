/**
 * Enhanced Sidebar Component
 * Optimized left sidebar with icon-only navigation and resizable detail panel
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Tooltip, Button } from 'antd';
import { 
  FolderOutlined,
  RobotOutlined,
  CheckSquareOutlined,
  TeamOutlined,
  SettingOutlined,
  SearchOutlined,
  BranchesOutlined,
  AppstoreOutlined,
  DoubleLeftOutlined,
  DoubleRightOutlined
} from '@ant-design/icons';
import { ExplorerPanel } from '../panels/ExplorerPanel';
import { AgentPanel } from '../panels/AgentPanel';
import { TaskPanel } from '../panels/TaskPanel';
import { CollaborationPanel } from '../panels/CollaborationPanel';
import { SearchPanel } from '../panels/SearchPanel';
import { GitPanel, PluginManager } from '../system';
import { useAppSelector, useAppDispatch } from '../../hooks/redux';
import { setActiveSidebarPanel, setSidebarWidth } from '../../store/slices/uiSlice';
import { ResizablePanel } from './ResizablePanel';

type SidebarPanel = 'explorer' | 'agents' | 'tasks' | 'collaboration' | 'search' | 'git' | 'plugins' | 'settings';

interface SidebarItem {
  key: SidebarPanel;
  icon: React.ReactNode;
  title: string;
  shortcut?: string;
}

const sidebarItems: SidebarItem[] = [
  { key: 'explorer', icon: <FolderOutlined />, title: '资源管理器', shortcut: 'Ctrl+Shift+E' },
  { key: 'search', icon: <SearchOutlined />, title: '搜索', shortcut: 'Ctrl+Shift+F' },
  { key: 'agents', icon: <RobotOutlined />, title: 'Agent', shortcut: 'Ctrl+Shift+A' },
  { key: 'tasks', icon: <CheckSquareOutlined />, title: '任务', shortcut: 'Ctrl+Shift+T' },
  { key: 'collaboration', icon: <TeamOutlined />, title: '协作', shortcut: 'Ctrl+Shift+C' },
  { key: 'git', icon: <BranchesOutlined />, title: 'Git', shortcut: 'Ctrl+Shift+G' },
  { key: 'plugins', icon: <AppstoreOutlined />, title: '插件', shortcut: 'Ctrl+Shift+P' },
  { key: 'settings', icon: <SettingOutlined />, title: '设置', shortcut: 'Ctrl+,' }
];

export const Sidebar: React.FC = () => {
  const dispatch = useAppDispatch();
  const { activeSidebarPanel, sidebarWidth } = useAppSelector(state => state.ui);
  const [collapsed, setCollapsed] = useState(false);
  const [detailPanelWidth, setDetailPanelWidth] = useState(250);
  const [isResizing, setIsResizing] = useState(false);
  const resizeRef = useRef<HTMLDivElement>(null);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey) {
        const item = sidebarItems.find(item => 
          item.shortcut === `Ctrl+Shift+${e.key.toUpperCase()}`
        );
        if (item) {
          e.preventDefault();
          handlePanelChange(item.key);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handlePanelChange = (panel: SidebarPanel) => {
    if (activeSidebarPanel === panel && !collapsed) {
      setCollapsed(true);
    } else {
      dispatch(setActiveSidebarPanel(panel));
      setCollapsed(false);
    }
  };

  const handleToggleCollapse = () => {
    setCollapsed(!collapsed);
  };

  const handleDetailPanelResize = useCallback((width: number) => {
    setDetailPanelWidth(Math.max(200, Math.min(600, width)));
  }, []);

  const renderPanelContent = () => {
    if (collapsed) return null;

    switch (activeSidebarPanel) {
      case 'explorer':
        return <ExplorerPanel />;
      case 'agents':
        return <AgentPanel />;
      case 'tasks':
        return <TaskPanel />;
      case 'collaboration':
        return <CollaborationPanel />;
      case 'search':
        return <SearchPanel />;
      case 'git':
        return <GitPanel />;
      case 'plugins':
        return <PluginManager />;
      case 'settings':
        return <div className="p-4 text-center text-secondary">Settings Panel (Coming Soon)</div>;
      default:
        return <ExplorerPanel />;
    }
  };

  const getPanelTitle = () => {
    const item = sidebarItems.find(item => item.key === activeSidebarPanel);
    return item?.title || '资源管理器';
  };

  const iconBarWidth = 48;
  const totalWidth = collapsed ? iconBarWidth : iconBarWidth + detailPanelWidth;

  return (
    <div 
      className="enhanced-sidebar-container" 
      style={{ 
        width: totalWidth,
        height: '100%',
        display: 'flex',
        flexDirection: 'row',
        background: 'var(--bg-secondary)',
        borderRight: '1px solid var(--border-color)',
        transition: 'width 0.2s ease-in-out'
      }}
    >
      {/* Icon Bar */}
      <div 
        className="sidebar-icon-bar"
        style={{
          width: iconBarWidth,
          height: '100%',
          background: 'var(--bg-tertiary)',
          borderRight: collapsed ? 'none' : '1px solid var(--border-color)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '8px 0',
          flexShrink: 0
        }}
      >
        {sidebarItems.map((item) => (
          <Tooltip 
            key={item.key}
            title={
              <div>
                <div>{item.title}</div>
                {item.shortcut && (
                  <div style={{ fontSize: '11px', opacity: 0.7 }}>
                    {item.shortcut}
                  </div>
                )}
              </div>
            }
            placement="right"
          >
            <Button
              type={activeSidebarPanel === item.key ? 'primary' : 'text'}
              icon={item.icon}
              size="large"
              onClick={() => handlePanelChange(item.key)}
              style={{
                width: 32,
                height: 32,
                margin: '4px 0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: 'none',
                background: activeSidebarPanel === item.key 
                  ? 'var(--accent-color)' 
                  : 'transparent',
                color: activeSidebarPanel === item.key 
                  ? '#ffffff' 
                  : 'var(--text-secondary)',
                transition: 'all 0.2s ease-in-out'
              }}
              onMouseEnter={(e) => {
                if (activeSidebarPanel !== item.key) {
                  e.currentTarget.style.background = 'var(--bg-primary)';
                  e.currentTarget.style.color = 'var(--text-primary)';
                }
              }}
              onMouseLeave={(e) => {
                if (activeSidebarPanel !== item.key) {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = 'var(--text-secondary)';
                }
              }}
            />
          </Tooltip>
        ))}

        {/* Collapse Toggle */}
        <div style={{ marginTop: 'auto', paddingTop: '8px' }}>
          <Tooltip title={collapsed ? '展开面板' : '折叠面板'} placement="right">
            <Button
              type="text"
              icon={collapsed ? <DoubleRightOutlined /> : <DoubleLeftOutlined />}
              
              onClick={handleToggleCollapse}
              style={{
                width: 24,
                height: 24,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-secondary)',
                border: 'none'
              }}
            />
          </Tooltip>
        </div>
      </div>

      {/* Detail Panel */}
      {!collapsed && (
        <ResizablePanel
          width={detailPanelWidth}
          onResize={handleDetailPanelResize}
          minWidth={200}
          maxWidth={600}
          resizeHandle="right"
          className="sidebar-detail-panel"
          style={{
            height: '100%',
            background: 'var(--bg-secondary)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}
        >
          {/* Panel Header */}
          <div 
            className="sidebar-panel-header"
            style={{
              padding: '8px 16px',
              background: 'var(--bg-tertiary)',
              borderBottom: '1px solid var(--border-color)',
              color: 'var(--text-primary)',
              fontSize: '12px',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexShrink: 0
            }}
          >
            <span>{getPanelTitle()}</span>
            <Button
              type="text"
              
              icon={<DoubleLeftOutlined />}
              onClick={handleToggleCollapse}
              style={{
                width: 20,
                height: 20,
                color: 'var(--text-secondary)',
                border: 'none'
              }}
            />
          </div>

          {/* Panel Content */}
          <div 
            className="sidebar-panel-content"
            style={{
              flex: 1,
              overflow: 'hidden',
              background: 'var(--bg-secondary)'
            }}
          >
            {renderPanelContent()}
          </div>
        </ResizablePanel>
      )}
    </div>
  );
};
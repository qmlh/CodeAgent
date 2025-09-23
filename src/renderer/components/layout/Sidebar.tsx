/**
 * Sidebar Component
 * Left sidebar with navigation and panels
 */

import React, { useState } from 'react';
import { Layout, Menu, Tooltip } from 'antd';
import { 
  FolderOutlined,
  RobotOutlined,
  CheckSquareOutlined,
  TeamOutlined,
  SettingOutlined,
  SearchOutlined
} from '@ant-design/icons';
import { ResizablePanel } from './ResizablePanel';
import { ExplorerPanel } from '../panels/ExplorerPanel';
import { AgentPanel } from '../panels/AgentPanel';
import { TaskPanel } from '../panels/TaskPanel';
import { CollaborationPanel } from '../panels/CollaborationPanel';
import { SearchPanel } from '../panels/SearchPanel';
import { useAppSelector, useAppDispatch } from '../../hooks/redux';
import { setActiveSidebarPanel } from '../../store/slices/uiSlice';

const { Sider } = Layout;

type SidebarPanel = 'explorer' | 'agents' | 'tasks' | 'collaboration' | 'search' | 'settings';

export const Sidebar: React.FC = () => {
  const dispatch = useAppDispatch();
  const { activeSidebarPanel, sidebarWidth } = useAppSelector(state => state.ui);
  const [collapsed, setCollapsed] = useState(false);

  const handlePanelChange = (panel: SidebarPanel) => {
    if (activeSidebarPanel === panel) {
      // Toggle collapse if same panel is clicked
      setCollapsed(!collapsed);
    } else {
      dispatch(setActiveSidebarPanel(panel));
      setCollapsed(false);
    }
  };

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
      case 'settings':
        return <div>Settings Panel (Coming Soon)</div>;
      default:
        return <ExplorerPanel />;
    }
  };

  const getPanelTitle = () => {
    switch (activeSidebarPanel) {
      case 'explorer':
        return 'Explorer';
      case 'agents':
        return 'Agents';
      case 'tasks':
        return 'Tasks';
      case 'collaboration':
        return 'Collaboration';
      case 'search':
        return 'Search';
      case 'settings':
        return 'Settings';
      default:
        return 'Explorer';
    }
  };

  return (
    <ResizablePanel
      direction="horizontal"
      initialSize={sidebarWidth}
      minSize={200}
      maxSize={600}
      disabled={collapsed}
      className="sidebar-container"
    >
      <Sider 
        className="sidebar"
        width={collapsed ? 48 : '100%'}
        collapsedWidth={48}
        collapsed={collapsed}
        theme="dark"
      >
        {/* Sidebar Navigation */}
        <div className="sidebar-nav">
          <Menu
            mode="vertical"
            theme="dark"
            selectedKeys={[activeSidebarPanel]}
            className="sidebar-menu"
          >
            <Menu.Item 
              key="explorer" 
              icon={<FolderOutlined />}
              onClick={() => handlePanelChange('explorer')}
            >
              {!collapsed && 'Explorer'}
            </Menu.Item>
            
            <Menu.Item 
              key="search"
              icon={<SearchOutlined />}
              onClick={() => handlePanelChange('search')}
            >
              {!collapsed && 'Search'}
            </Menu.Item>
            
            <Menu.Item 
              key="agents"
              icon={<RobotOutlined />}
              onClick={() => handlePanelChange('agents')}
            >
              {!collapsed && 'Agents'}
            </Menu.Item>
            
            <Menu.Item 
              key="tasks"
              icon={<CheckSquareOutlined />}
              onClick={() => handlePanelChange('tasks')}
            >
              {!collapsed && 'Tasks'}
            </Menu.Item>
            
            <Menu.Item 
              key="collaboration"
              icon={<TeamOutlined />}
              onClick={() => handlePanelChange('collaboration')}
            >
              {!collapsed && 'Collaboration'}
            </Menu.Item>
            
            <Menu.Item 
              key="settings"
              icon={<SettingOutlined />}
              onClick={() => handlePanelChange('settings')}
            >
              {!collapsed && 'Settings'}
            </Menu.Item>
          </Menu>
        </div>

        {/* Panel Content */}
        {!collapsed && (
          <div className="sidebar-panel">
            <div className="sidebar-header">
              {getPanelTitle()}
            </div>
            <div className="sidebar-content">
              {renderPanelContent()}
            </div>
          </div>
        )}
      </Sider>
    </ResizablePanel>
  );
};
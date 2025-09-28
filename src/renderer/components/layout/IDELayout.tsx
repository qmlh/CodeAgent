/**
 * IDE Layout Component
 * Main layout for the Multi-Agent IDE application
 */

import React from 'react';
import { Layout } from 'antd';
import { Sidebar } from './Sidebar';
import { MainWorkspace } from './MainWorkspace';
import { StatusBar } from './StatusBar';
import { BottomPanel } from './BottomPanel';
import { 
  ConflictResolutionDialog, 
  ConflictPreventionAlerts, 
  ConflictResolutionWizard 
} from '../conflict-resolution';

const { Content } = Layout;

export const IDELayout: React.FC = () => {
  return (
    <Layout className="ide-layout" style={{ height: '100vh', overflow: 'hidden', background: '#1e1e1e' }}>
      {/* 主要水平布局 */}
      <Layout style={{ height: '100%', flexDirection: 'row' }}>
        {/* Enhanced Sidebar */}
        <Sidebar />
        
        {/* 右侧内容区域 */}
        <Layout style={{ 
          background: '#1e1e1e', 
          flex: 1,
          display: 'flex',
          flexDirection: 'column'
        }}>
          {/* 主工作区 */}
          <Content style={{ 
            margin: 0, 
            padding: 0, 
            background: '#1e1e1e',
            overflow: 'hidden',
            flex: 1,
            display: 'flex',
            flexDirection: 'column'
          }}>
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <MainWorkspace />
            </div>
            <BottomPanel />
          </Content>
          
          {/* 状态栏 */}
          <StatusBar />
        </Layout>
      </Layout>
      
      {/* Conflict Resolution Components */}
      <ConflictPreventionAlerts />
      <ConflictResolutionDialog />
      <ConflictResolutionWizard />
    </Layout>
  );
};
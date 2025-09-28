/**
 * Enhanced Status Bar Component
 * Bottom status bar with system resources, Git info, and agent status
 */

import React, { useState, useEffect } from 'react';
import { Layout, Badge, Progress, Tooltip, Dropdown } from 'antd';
import { 
  BranchesOutlined, 
  BugOutlined, 
  WarningOutlined,
  CheckCircleOutlined,
  SyncOutlined,
  DatabaseOutlined,
  DashboardOutlined,
  WifiOutlined,
  HddOutlined
} from '@ant-design/icons';
import { useAppSelector, useAppDispatch } from '../../hooks/redux';
import { ServiceStatusIndicator } from '../common/ServiceStatusIndicator';
import { setSystemResources } from '../../store/slices/systemSlice';
import { SystemResources } from '../../types/system';

const { Footer } = Layout;

export const StatusBar: React.FC = () => {
  const dispatch = useAppDispatch();
  const { currentProject } = useAppSelector(state => state.app);
  const { agents } = useAppSelector(state => state.agent);
  const { tasks } = useAppSelector(state => state.task);
  const { activeFile } = useAppSelector(state => state.file);
  const { gitStatus, systemResources } = useAppSelector(state => state.system);

  // Calculate agent statistics
  const activeAgents = agents.filter(agent => agent.status !== 'offline').length;
  const workingAgents = agents.filter(agent => agent.status === 'working').length;

  // Calculate task statistics
  const activeTasks = tasks.filter(task => task.status === 'in_progress').length;
  const completedTasks = tasks.filter(task => task.status === 'completed').length;

  // Mock system resources data
  useEffect(() => {
    const updateSystemResources = () => {
      const mockResources: SystemResources = {
        cpu: {
          usage: Math.random() * 100,
          cores: 8,
          model: 'Intel Core i7'
        },
        memory: {
          total: 16 * 1024 * 1024 * 1024, // 16GB
          used: Math.random() * 8 * 1024 * 1024 * 1024, // Random usage up to 8GB
          free: 0,
          usage: 0
        },
        disk: {
          total: 512 * 1024 * 1024 * 1024, // 512GB
          used: Math.random() * 256 * 1024 * 1024 * 1024, // Random usage up to 256GB
          free: 0,
          usage: 0
        },
        network: {
          upload: Math.random() * 1000, // KB/s
          download: Math.random() * 5000 // KB/s
        }
      };

      // Calculate derived values
      mockResources.memory.free = mockResources.memory.total - mockResources.memory.used;
      mockResources.memory.usage = (mockResources.memory.used / mockResources.memory.total) * 100;
      
      mockResources.disk.free = mockResources.disk.total - mockResources.disk.used;
      mockResources.disk.usage = (mockResources.disk.used / mockResources.disk.total) * 100;

      dispatch(setSystemResources(mockResources));
    };

    updateSystemResources();
    const interval = setInterval(updateSystemResources, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, [dispatch]);

  const formatBytes = (bytes: number) => {
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatSpeed = (bytesPerSecond: number) => {
    return formatBytes(bytesPerSecond) + '/s';
  };

  const getResourceColor = (usage: number) => {
    if (usage < 50) return '#52c41a';
    if (usage < 80) return '#faad14';
    return '#ff4d4f';
  };

  return (
    <Footer className="status-bar">
      <div className="status-bar-left">
        {/* Git branch and status */}
        <Dropdown
          menu={{
            items: [
              {
                key: 'branch',
                label: `Current: ${gitStatus?.branch || 'main'}`,
                disabled: true
              },
              { type: 'divider' },
              {
                key: 'pull',
                label: 'Pull',
                onClick: () => console.log('Git pull')
              },
              {
                key: 'push',
                label: 'Push',
                onClick: () => console.log('Git push')
              }
            ]
          }}
          trigger={['click']}
        >
          <div className="status-bar-item clickable" title="Git branch">
            <BranchesOutlined />
            <span>{gitStatus?.branch || 'main'}</span>
            {gitStatus && (gitStatus.ahead > 0 || gitStatus.behind > 0) && (
              <Badge 
                count={`${gitStatus.ahead > 0 ? '↑' + gitStatus.ahead : ''}${gitStatus.behind > 0 ? '↓' + gitStatus.behind : ''}`}
                
                style={{ backgroundColor: '#1890ff' }}
              />
            )}
          </div>
        </Dropdown>

        {/* Problems and warnings */}
        <div className="status-bar-item" title="Problems">
          <BugOutlined />
          <Badge count={0}  />
        </div>

        <div className="status-bar-item" title="Warnings">
          <WarningOutlined />
          <Badge count={0}  />
        </div>

        {/* Active file info */}
        {activeFile && (
          <div className="status-bar-item" title={`Active file: ${activeFile}`}>
            <span>{activeFile.split('/').pop()}</span>
          </div>
        )}
      </div>

      <div className="status-bar-right">
        {/* System resources */}
        {systemResources && (
          <>
            {/* CPU usage */}
            <Tooltip title={`CPU: ${systemResources.cpu.usage.toFixed(1)}% (${systemResources.cpu.cores} cores)`}>
              <div className="status-bar-item resource-item">
                <DashboardOutlined />
                <Progress
                  percent={systemResources.cpu.usage}
                  
                  showInfo={false}
                  strokeColor={getResourceColor(systemResources.cpu.usage)}
                  style={{ width: 40 }}
                />
                <span>{systemResources.cpu.usage.toFixed(0)}%</span>
              </div>
            </Tooltip>

            {/* Memory usage */}
            <Tooltip title={`Memory: ${formatBytes(systemResources.memory.used)} / ${formatBytes(systemResources.memory.total)} (${systemResources.memory.usage.toFixed(1)}%)`}>
              <div className="status-bar-item resource-item">
                <DatabaseOutlined />
                <Progress
                  percent={systemResources.memory.usage}
                  
                  showInfo={false}
                  strokeColor={getResourceColor(systemResources.memory.usage)}
                  style={{ width: 40 }}
                />
                <span>{systemResources.memory.usage.toFixed(0)}%</span>
              </div>
            </Tooltip>

            {/* Network activity */}
            <Tooltip title={`Network: �?{formatSpeed(systemResources.network.download)} �?{formatSpeed(systemResources.network.upload)}`}>
              <div className="status-bar-item resource-item">
                <WifiOutlined />
                <span>↓{formatSpeed(systemResources.network.download)}</span>
              </div>
            </Tooltip>
          </>
        )}

        {/* Service status */}
        <div className="status-bar-item">
          <ServiceStatusIndicator showLabel  />
        </div>

        {/* Agent status */}
        <Tooltip title={`${activeAgents} agents active, ${workingAgents} working`}>
          <div className="status-bar-item">
            <SyncOutlined spin={workingAgents > 0} />
            <span>{activeAgents} agents</span>
          </div>
        </Tooltip>

        {/* Task status */}
        <Tooltip title={`${activeTasks} active tasks, ${completedTasks} completed`}>
          <div className="status-bar-item">
            <CheckCircleOutlined />
            <span>{activeTasks}/{tasks.length} tasks</span>
          </div>
        </Tooltip>

        {/* Project info */}
        {currentProject && (
          <Tooltip title={`Current project: ${currentProject}`}>
            <div className="status-bar-item">
              <span>{currentProject.split('/').pop()}</span>
            </div>
          </Tooltip>
        )}
      </div>
    </Footer>
  );
};
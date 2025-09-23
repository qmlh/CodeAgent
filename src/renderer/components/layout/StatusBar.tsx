/**
 * Status Bar Component
 * Bottom status bar with information and controls
 */

import React from 'react';
import { Layout, Badge } from 'antd';
import { 
  BranchesOutlined, 
  BugOutlined, 
  WarningOutlined,
  CheckCircleOutlined,
  SyncOutlined
} from '@ant-design/icons';
import { useAppSelector } from '../../hooks/redux';

const { Footer } = Layout;

export const StatusBar: React.FC = () => {
  const { currentProject } = useAppSelector(state => state.app);
  const { agents } = useAppSelector(state => state.agent);
  const { tasks } = useAppSelector(state => state.task);
  const { activeFile } = useAppSelector(state => state.file);

  // Calculate agent statistics
  const activeAgents = agents.filter(agent => agent.status !== 'offline').length;
  const workingAgents = agents.filter(agent => agent.status === 'working').length;

  // Calculate task statistics
  const activeTasks = tasks.filter(task => task.status === 'in_progress').length;
  const completedTasks = tasks.filter(task => task.status === 'completed').length;

  // Mock data for demonstration
  const gitBranch = 'main';
  const problems = 0;
  const warnings = 0;

  return (
    <Footer className="status-bar">
      <div className="status-bar-left">
        {/* Git branch */}
        <div className="status-bar-item" title="Git branch">
          <BranchesOutlined />
          <span>{gitBranch}</span>
        </div>

        {/* Problems */}
        <div className="status-bar-item" title="Problems">
          <BugOutlined />
          <Badge count={problems} size="small" />
        </div>

        {/* Warnings */}
        <div className="status-bar-item" title="Warnings">
          <WarningOutlined />
          <Badge count={warnings} size="small" />
        </div>

        {/* Active file info */}
        {activeFile && (
          <div className="status-bar-item" title="Active file">
            <span>{activeFile.split('/').pop()}</span>
          </div>
        )}
      </div>

      <div className="status-bar-right">
        {/* Agent status */}
        <div className="status-bar-item" title={`${activeAgents} agents active, ${workingAgents} working`}>
          <SyncOutlined spin={workingAgents > 0} />
          <span>{activeAgents} agents</span>
        </div>

        {/* Task status */}
        <div className="status-bar-item" title={`${activeTasks} active tasks, ${completedTasks} completed`}>
          <CheckCircleOutlined />
          <span>{activeTasks}/{tasks.length} tasks</span>
        </div>

        {/* Project info */}
        {currentProject && (
          <div className="status-bar-item" title="Current project">
            <span>{currentProject.split('/').pop()}</span>
          </div>
        )}
      </div>
    </Footer>
  );
};
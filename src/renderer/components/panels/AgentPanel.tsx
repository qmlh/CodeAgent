/**
 * Agent Panel Component
 * Displays and manages AI agents
 */

import React, { useEffect } from 'react';
import { List, Button, Badge, Avatar, Tooltip, message } from 'antd';
import { 
  RobotOutlined, 
  PlayCircleOutlined, 
  PauseCircleOutlined,
  PlusOutlined,
  SettingOutlined,
  DeleteOutlined
} from '@ant-design/icons';
import { useAppSelector, useAppDispatch } from '../../hooks/redux';
import { loadAgents, startAgent, stopAgent, setSelectedAgent } from '../../store/slices/agentSlice';

const getAgentTypeIcon = (type: string) => {
  const icons: Record<string, string> = {
    frontend: '🎨',
    backend: '⚙️',
    testing: '🧪',
    documentation: '📝',
    code_review: '👀',
    devops: '🚀'
  };
  return icons[type] || '🤖';
};

const getStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    idle: 'default',
    working: 'processing',
    waiting: 'warning',
    error: 'error',
    offline: 'default'
  };
  return colors[status] || 'default';
};

export const AgentPanel: React.FC = () => {
  const dispatch = useAppDispatch();
  const { agents, selectedAgent, status } = useAppSelector(state => state.agent);

  useEffect(() => {
    dispatch(loadAgents());
  }, [dispatch]);

  const handleStartAgent = async (agentId: string) => {
    try {
      await dispatch(startAgent(agentId)).unwrap();
      message.success('Agent started successfully');
    } catch (error) {
      message.error('Failed to start agent');
    }
  };

  const handleStopAgent = async (agentId: string) => {
    try {
      await dispatch(stopAgent(agentId)).unwrap();
      message.success('Agent stopped successfully');
    } catch (error) {
      message.error('Failed to stop agent');
    }
  };

  const handleCreateAgent = () => {
    // TODO: Open create agent modal
    message.info('Create agent functionality coming soon');
  };

  const handleAgentSettings = (agentId: string) => {
    // TODO: Open agent settings
    message.info('Agent settings functionality coming soon');
  };

  const handleDeleteAgent = (agentId: string) => {
    // TODO: Implement agent deletion
    message.info('Delete agent functionality coming soon');
  };

  return (
    <div style={{ padding: '8px' }}>
      <div style={{ marginBottom: '8px' }}>
        <Button 
          type="primary" 
          icon={<PlusOutlined />}
          onClick={handleCreateAgent}
          style={{ width: '100%' }}
          size="small"
        >
          Create Agent
        </Button>
      </div>

      <List
        size="small"
        dataSource={agents}
        loading={status === 'loading'}
        renderItem={(agent) => (
          <List.Item
            style={{ 
              padding: '8px',
              background: selectedAgent === agent.id ? '#37373d' : 'transparent',
              borderRadius: '4px',
              marginBottom: '4px',
              cursor: 'pointer'
            }}
            onClick={() => dispatch(setSelectedAgent(agent.id))}
            actions={[
              <Tooltip title={agent.status === 'offline' ? 'Start Agent' : 'Stop Agent'}>
                <Button
                  type="text"
                  size="small"
                  icon={agent.status === 'offline' ? <PlayCircleOutlined /> : <PauseCircleOutlined />}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (agent.status === 'offline') {
                      handleStartAgent(agent.id);
                    } else {
                      handleStopAgent(agent.id);
                    }
                  }}
                />
              </Tooltip>,
              <Tooltip title="Settings">
                <Button
                  type="text"
                  size="small"
                  icon={<SettingOutlined />}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAgentSettings(agent.id);
                  }}
                />
              </Tooltip>,
              <Tooltip title="Delete">
                <Button
                  type="text"
                  size="small"
                  icon={<DeleteOutlined />}
                  danger
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteAgent(agent.id);
                  }}
                />
              </Tooltip>
            ]}
          >
            <List.Item.Meta
              avatar={
                <Badge 
                  status={getStatusColor(agent.status) as any}
                  dot
                >
                  <Avatar 
                    size="small" 
                    style={{ backgroundColor: '#1890ff' }}
                  >
                    {getAgentTypeIcon(agent.type)}
                  </Avatar>
                </Badge>
              }
              title={
                <div style={{ fontSize: '12px', color: '#cccccc' }}>
                  {agent.name}
                </div>
              }
              description={
                <div style={{ fontSize: '11px', color: '#888' }}>
                  <div>{agent.type}</div>
                  <div>
                    {agent.status} • {agent.workload} tasks
                  </div>
                  {agent.currentTask && (
                    <div style={{ color: '#1890ff' }}>
                      Working on task
                    </div>
                  )}
                </div>
              }
            />
          </List.Item>
        )}
      />

      {agents.length === 0 && status !== 'loading' && (
        <div style={{ 
          textAlign: 'center', 
          padding: '20px', 
          color: '#888',
          fontSize: '12px'
        }}>
          <RobotOutlined style={{ fontSize: '24px', marginBottom: '8px' }} />
          <p>No agents created</p>
          <p>Create your first agent to get started</p>
        </div>
      )}
    </div>
  );
};
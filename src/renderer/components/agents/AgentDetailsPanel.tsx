/**
 * Agent Details Panel Component
 * Displays detailed information about a selected agent including real-time status, current tasks, and work history
 */

import React, { useEffect, useState } from 'react';
import {
  Card,
  Descriptions,
  Badge,
  Progress,
  Timeline,
  Statistic,
  Row,
  Col,
  Button,
  Space,
  Typography,
  Divider,
  Tag,
  Avatar,
  Tooltip,
  Empty
} from 'antd';
import {
  PlayCircleOutlined,
  PauseCircleOutlined,
  ReloadOutlined,
  DeleteOutlined,
  SettingOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  RobotOutlined
} from '@ant-design/icons';
import { useAppSelector, useAppDispatch } from '../../hooks/redux';
import { startAgent, stopAgent, getAgentStatus } from '../../store/slices/agentSlice';
import { AgentPerformanceChart } from './AgentPerformanceChart';
import { AgentLogViewer } from './AgentLogViewer';

const { Title, Text, Paragraph } = Typography;

interface AgentDetailsPanelProps {
  agentId: string | null;
}

const getStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    idle: 'success',
    working: 'processing',
    waiting: 'warning',
    error: 'error',
    offline: 'default'
  };
  return colors[status] || 'default';
};

const getStatusText = (status: string) => {
  const texts: Record<string, string> = {
    idle: 'Ready for tasks',
    working: 'Currently working',
    waiting: 'Waiting for resources',
    error: 'Error occurred',
    offline: 'Offline'
  };
  return texts[status] || status;
};

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

export const AgentDetailsPanel: React.FC<AgentDetailsPanelProps> = ({ agentId }) => {
  const dispatch = useAppDispatch();
  const { agents } = useAppSelector(state => state.agent);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  const agent = agents.find(a => a.id === agentId);

  useEffect(() => {
    if (agentId) {
      handleRefreshStatus();
    }
  }, [agentId]);

  const handleRefreshStatus = async () => {
    if (!agentId) return;
    
    setRefreshing(true);
    try {
      await dispatch(getAgentStatus(agentId));
    } catch (error) {
      console.error('Failed to refresh agent status:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleStartAgent = async () => {
    if (!agentId) return;
    try {
      await dispatch(startAgent(agentId));
    } catch (error) {
      console.error('Failed to start agent:', error);
    }
  };

  const handleStopAgent = async () => {
    if (!agentId) return;
    try {
      await dispatch(stopAgent(agentId));
    } catch (error) {
      console.error('Failed to stop agent:', error);
    }
  };

  if (!agent) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <Empty
          image={<RobotOutlined style={{ fontSize: '48px', color: '#d9d9d9' }} />}
          description="Select an agent to view details"
        />
      </div>
    );
  }

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  };

  const getWorkHistory = () => {
    // Mock work history - in real implementation, this would come from the agent's task history
    return [
      {
        time: '2 minutes ago',
        status: 'completed',
        task: 'Implemented user authentication component',
        duration: '15m 30s'
      },
      {
        time: '1 hour ago',
        status: 'completed',
        task: 'Fixed responsive design issues',
        duration: '25m 12s'
      },
      {
        time: '3 hours ago',
        status: 'completed',
        task: 'Added form validation logic',
        duration: '18m 45s'
      },
      {
        time: '1 day ago',
        status: 'failed',
        task: 'Optimize bundle size',
        duration: '45m 20s'
      }
    ];
  };

  return (
    <div style={{ padding: '16px', height: '100%', overflow: 'auto' }}>
      {/* Agent Header */}
      <Card  style={{ marginBottom: '16px' }}>
        <Row align="middle" justify="space-between">
          <Col>
            <Space size="middle">
              <Avatar size="large" style={{ backgroundColor: '#1890ff' }}>
                {getAgentTypeIcon(agent.type)}
              </Avatar>
              <div>
                <Title level={4} style={{ margin: 0 }}>
                  {agent.name}
                </Title>
                <Space>
                  <Badge 
                    status={getStatusColor(agent.status) as any} 
                    text={getStatusText(agent.status)}
                  />
                  <Tag color="blue">{agent.type}</Tag>
                </Space>
              </div>
            </Space>
          </Col>
          <Col>
            <Space>
              <Tooltip title="Refresh Status">
                <Button
                  icon={<ReloadOutlined />}
                  onClick={handleRefreshStatus}
                  loading={refreshing}
                  
                />
              </Tooltip>
              <Tooltip title={agent.status === 'offline' ? 'Start Agent' : 'Stop Agent'}>
                <Button
                  type="primary"
                  icon={agent.status === 'offline' ? <PlayCircleOutlined /> : <PauseCircleOutlined />}
                  onClick={agent.status === 'offline' ? handleStartAgent : handleStopAgent}
                  
                >
                  {agent.status === 'offline' ? 'Start' : 'Stop'}
                </Button>
              </Tooltip>
              <Button
                icon={<SettingOutlined />}
                
              >
                Settings
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Performance Overview */}
      <Row gutter={16} style={{ marginBottom: '16px' }}>
        <Col span={6}>
          <Card >
            <Statistic
              title="Tasks Completed"
              value={agent.performance.tasksCompleted}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card >
            <Statistic
              title="Success Rate"
              value={agent.performance.successRate * 100}
              precision={1}
              suffix="%"
              valueStyle={{ color: agent.performance.successRate > 0.8 ? '#3f8600' : '#cf1322' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card >
            <Statistic
              title="Avg Task Time"
              value={formatDuration(agent.performance.averageTaskTime)}
              prefix={<ClockCircleOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card >
            <Statistic
              title="Current Load"
              value={agent.workload}
              suffix={`/ ${agent.config.maxConcurrentTasks}`}
            />
          </Card>
        </Col>
      </Row>

      {/* Current Task */}
      {agent.currentTask && (
        <Card 
          title="Current Task" 
           
          style={{ marginBottom: '16px' }}
          extra={<Badge status="processing" text="In Progress" />}
        >
          <Paragraph>
            Working on: <Text strong>{agent.currentTask}</Text>
          </Paragraph>
          <Progress 
            percent={65} 
            status="active" 
            strokeColor={{
              '0%': '#108ee9',
              '100%': '#87d068',
            }}
          />
        </Card>
      )}

      {/* Agent Information */}
      <Card title="Agent Information"  style={{ marginBottom: '16px' }}>
        <Descriptions column={2} >
          <Descriptions.Item label="Agent ID">
            <Text code>{agent.id}</Text>
          </Descriptions.Item>
          <Descriptions.Item label="Created">
            {new Date(agent.createdAt).toLocaleDateString()}
          </Descriptions.Item>
          <Descriptions.Item label="Last Active">
            {new Date(agent.lastActive).toLocaleString()}
          </Descriptions.Item>
          <Descriptions.Item label="Max Concurrent Tasks">
            {agent.config.maxConcurrentTasks}
          </Descriptions.Item>
        </Descriptions>

        <Divider />

        <div>
          <Text strong>Capabilities:</Text>
          <div style={{ marginTop: '8px' }}>
            <Space wrap>
              {agent.capabilities.map(capability => (
                <Tag key={capability} color="blue">
                  {capability}
                </Tag>
              ))}
            </Space>
          </div>
        </div>

        {agent.config.specializations.length > 0 && (
          <>
            <Divider />
            <div>
              <Text strong>Specializations:</Text>
              <div style={{ marginTop: '8px' }}>
                <Space wrap>
                  {agent.config.specializations.map(spec => (
                    <Tag key={spec} color="green">
                      {spec}
                    </Tag>
                  ))}
                </Space>
              </div>
            </div>
          </>
        )}
      </Card>

      {/* Work History */}
      <Card title="Recent Work History"  style={{ marginBottom: '16px' }}>
        <Timeline
          items={getWorkHistory().map(item => ({
            color: item.status === 'completed' ? 'green' : 'red',
            children: (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text strong>{item.task}</Text>
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    {item.duration}
                  </Text>
                </div>
                <div style={{ marginTop: '4px' }}>
                  <Space>
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      {item.time}
                    </Text>
                    <Tag 
                      color={item.status === 'completed' ? 'success' : 'error'}
                      style={{ fontSize: '10px' }}
                    >
                      {item.status}
                    </Tag>
                  </Space>
                </div>
              </div>
            )
          }))}
        />
      </Card>

      {/* Performance Chart */}
      <Card title="Performance Metrics"  style={{ marginBottom: '16px' }}>
        <AgentPerformanceChart agentId={agent.id} />
      </Card>

      {/* Agent Logs */}
      <Card title="Agent Logs" >
        <AgentLogViewer agentId={agent.id} />
      </Card>
    </div>
  );
};
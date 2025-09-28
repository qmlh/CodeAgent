/**
 * Agent Status Visualization Component
 * Enhanced visual representation of agent states with animations and health indicators
 */

import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Progress,
  Badge,
  Typography,
  Space,
  Tooltip,
  Avatar,
  Button,
  Select,
  Statistic
} from 'antd';
import {
  RobotOutlined,
  HeartOutlined,
  ThunderboltOutlined,
  ClockCircleOutlined,
  WarningOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';
import { useAppSelector } from '../../hooks/redux';
import { Agent } from '../../store/slices/agentSlice';
import './AgentStatusVisualization.css';

const { Title, Text } = Typography;
const { Option } = Select;

interface AgentHealthMetrics {
  overall: number;
  performance: number;
  reliability: number;
  responsiveness: number;
}

export const AgentStatusVisualization: React.FC = () => {
  const { agents } = useAppSelector(state => state.agent);
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'chart'>('grid');
  const [sortBy, setSortBy] = useState<'name' | 'status' | 'performance' | 'health'>('health');

  const getAgentHealth = (agent: Agent): AgentHealthMetrics => {
    const performance = agent.performance.successRate * 100;
    const reliability = agent.status === 'error' ? 0 : 
                       agent.status === 'offline' ? 20 :
                       agent.status === 'waiting' ? 60 : 100;
    const responsiveness = Math.max(0, 100 - (agent.performance.averageTaskTime / 1000));
    const overall = (performance + reliability + responsiveness) / 3;

    return {
      overall: Math.round(overall),
      performance: Math.round(performance),
      reliability: Math.round(reliability),
      responsiveness: Math.round(responsiveness)
    };
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      idle: '#52c41a',
      working: '#1890ff',
      waiting: '#faad14',
      error: '#ff4d4f',
      offline: '#8c8c8c'
    };
    return colors[status] || '#8c8c8c';
  };

  const getStatusIcon = (status: string) => {
    const icons: Record<string, React.ReactNode> = {
      idle: <CheckCircleOutlined />,
      working: <ThunderboltOutlined className="working-animation" />,
      waiting: <ClockCircleOutlined className="waiting-animation" />,
      error: <WarningOutlined className="error-animation" />,
      offline: <RobotOutlined />
    };
    return icons[status] || <RobotOutlined />;
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

  const sortedAgents = [...agents].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.name.localeCompare(b.name);
      case 'status':
        return a.status.localeCompare(b.status);
      case 'performance':
        return b.performance.successRate - a.performance.successRate;
      case 'health':
        return getAgentHealth(b).overall - getAgentHealth(a).overall;
      default:
        return 0;
    }
  });

  const renderAgentCard = (agent: Agent) => {
    const health = getAgentHealth(agent);
    const statusColor = getStatusColor(agent.status);

    return (
      <Card
        key={agent.id}
        
        className={`agent-status-card ${agent.status}`}
        style={{ 
          marginBottom: '8px',
          borderColor: statusColor,
          transition: 'all 0.3s ease'
        }}
        hoverable
      >
        <Row align="middle" gutter={12}>
          <Col flex="none">
            <div className="agent-avatar-container">
              <Avatar 
                size="large" 
                style={{ 
                  backgroundColor: statusColor,
                  position: 'relative'
                }}
              >
                {getAgentTypeIcon(agent.type)}
              </Avatar>
              <div 
                className={`status-indicator ${agent.status}`}
                style={{ backgroundColor: statusColor }}
              >
                {getStatusIcon(agent.status)}
              </div>
            </div>
          </Col>
          
          <Col flex="auto">
            <div>
              <Text strong style={{ fontSize: '14px' }}>
                {agent.name}
              </Text>
              <br />
              <Text type="secondary" style={{ fontSize: '12px' }}>
                {agent.type.replace('_', ' ').toUpperCase()}
              </Text>
            </div>
          </Col>

          <Col flex="none" style={{ textAlign: 'right' }}>
            <Space direction="vertical"  align="end">
              <Tooltip title={`Overall Health: ${health.overall}%`}>
                <Progress
                  type="circle"
                  size={40}
                  percent={health.overall}
                  strokeColor={
                    health.overall >= 80 ? '#52c41a' :
                    health.overall >= 60 ? '#faad14' : '#ff4d4f'
                  }
                  format={() => (
                    <HeartOutlined 
                      style={{ 
                        fontSize: '12px',
                        color: health.overall >= 80 ? '#52c41a' :
                               health.overall >= 60 ? '#faad14' : '#ff4d4f'
                      }} 
                    />
                  )}
                />
              </Tooltip>
              <Text style={{ fontSize: '10px' }}>
                {health.overall}%
              </Text>
            </Space>
          </Col>
        </Row>

        {/* Health Metrics */}
        <Row gutter={8} style={{ marginTop: '12px' }}>
          <Col span={8}>
            <Tooltip title="Performance">
              <div style={{ textAlign: 'center' }}>
                <Progress
                  percent={health.performance}
                  
                  showInfo={false}
                  strokeColor="#1890ff"
                />
                <Text style={{ fontSize: '10px' }}>Perf</Text>
              </div>
            </Tooltip>
          </Col>
          <Col span={8}>
            <Tooltip title="Reliability">
              <div style={{ textAlign: 'center' }}>
                <Progress
                  percent={health.reliability}
                  
                  showInfo={false}
                  strokeColor="#52c41a"
                />
                <Text style={{ fontSize: '10px' }}>Rel</Text>
              </div>
            </Tooltip>
          </Col>
          <Col span={8}>
            <Tooltip title="Responsiveness">
              <div style={{ textAlign: 'center' }}>
                <Progress
                  percent={health.responsiveness}
                  
                  showInfo={false}
                  strokeColor="#faad14"
                />
                <Text style={{ fontSize: '10px' }}>Resp</Text>
              </div>
            </Tooltip>
          </Col>
        </Row>

        {/* Current Task */}
        {agent.currentTask && (
          <div style={{ marginTop: '8px' }}>
            <Text 
              ellipsis 
              style={{ 
                fontSize: '11px', 
                color: '#666',
                display: 'block'
              }}
            >
              🔄 {agent.currentTask}
            </Text>
          </div>
        )}

        {/* Workload Indicator */}
        <div style={{ marginTop: '8px' }}>
          <Row align="middle" justify="space-between">
            <Col>
              <Text style={{ fontSize: '11px' }}>
                Load: {agent.workload}/{agent.config.maxConcurrentTasks}
              </Text>
            </Col>
            <Col>
              <Progress
                percent={(agent.workload / agent.config.maxConcurrentTasks) * 100}
                
                showInfo={false}
                strokeColor={
                  agent.workload >= agent.config.maxConcurrentTasks ? '#ff4d4f' : '#1890ff'
                }
                style={{ width: '60px' }}
              />
            </Col>
          </Row>
        </div>
      </Card>
    );
  };

  const getOverallStats = () => {
    const totalHealth = agents.reduce((sum, agent) => sum + getAgentHealth(agent).overall, 0);
    const avgHealth = agents.length > 0 ? totalHealth / agents.length : 0;
    
    const statusCounts = agents.reduce((counts, agent) => {
      counts[agent.status] = (counts[agent.status] || 0) + 1;
      return counts;
    }, {} as Record<string, number>);

    return { avgHealth, statusCounts };
  };

  const stats = getOverallStats();

  return (
    <div>
      {/* Header Controls */}
      <Row align="middle" justify="space-between" style={{ marginBottom: '16px' }}>
        <Col>
          <Title level={5} style={{ margin: 0 }}>
            Agent Status
          </Title>
        </Col>
        <Col>
          <Space >
            <Select
              
              value={sortBy}
              onChange={setSortBy}
              style={{ width: 100 }}
            >
              <Option value="health">Health</Option>
              <Option value="name">Name</Option>
              <Option value="status">Status</Option>
              <Option value="performance">Performance</Option>
            </Select>
          </Space>
        </Col>
      </Row>

      {/* Overall Health */}
      <Card  style={{ marginBottom: '16px' }}>
        <Row gutter={16} align="middle">
          <Col span={8}>
            <Statistic
              title="System Health"
              value={stats.avgHealth}
              precision={0}
              suffix="%"
              valueStyle={{
                color: stats.avgHealth >= 80 ? '#3f8600' :
                       stats.avgHealth >= 60 ? '#faad14' : '#cf1322'
              }}
              prefix={<HeartOutlined />}
            />
          </Col>
          <Col span={16}>
            <Space wrap>
              {Object.entries(stats.statusCounts).map(([status, count]) => (
                <Badge
                  key={status}
                  count={count}
                  style={{ backgroundColor: getStatusColor(status) }}
                  title={`${status}: ${count}`}
                >
                  <div style={{ padding: '4px 8px' }}>
                    {getStatusIcon(status)}
                  </div>
                </Badge>
              ))}
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Agent Cards */}
      <div 
        style={{ 
          maxHeight: '600px', 
          overflowY: 'auto',
          paddingRight: '8px'
        }}
      >
        {sortedAgents.length === 0 ? (
          <Card >
            <div style={{ textAlign: 'center', padding: '20px' }}>
              <RobotOutlined style={{ fontSize: '48px', color: '#d9d9d9' }} />
              <br />
              <Text type="secondary">No agents available</Text>
            </div>
          </Card>
        ) : (
          sortedAgents.map(renderAgentCard)
        )}
      </div>
    </div>
  );
};
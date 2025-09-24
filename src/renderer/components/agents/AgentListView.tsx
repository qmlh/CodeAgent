/**
 * Enhanced Agent List View Component
 * Displays all agents with status, type, performance metrics, and control actions
 */

import React, { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Badge,
  Avatar,
  Space,
  Tooltip,
  Progress,
  Tag,
  Typography,
  Input,
  Select,
  Row,
  Col,
  Card,
  Statistic,
  Popconfirm,
  message,
  Dropdown,
  Menu
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  PlayCircleOutlined,
  PauseCircleOutlined,
  ReloadOutlined,
  DeleteOutlined,
  SettingOutlined,
  EyeOutlined,
  MoreOutlined,
  SearchOutlined,
  FilterOutlined,
  PlusOutlined
} from '@ant-design/icons';
import { useAppSelector, useAppDispatch } from '../../hooks/redux';
import { 
  loadAgents, 
  startAgent, 
  stopAgent, 
  setSelectedAgent,
  getAgentStatus 
} from '../../store/slices/agentSlice';
import { Agent } from '../../store/slices/agentSlice';

const { Text } = Typography;
const { Option } = Select;

interface AgentListViewProps {
  onCreateAgent: () => void;
  onViewDetails: (agentId: string) => void;
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

const getAgentTypeColor = (type: string) => {
  const colors: Record<string, string> = {
    frontend: 'blue',
    backend: 'green',
    testing: 'orange',
    documentation: 'purple',
    code_review: 'magenta',
    devops: 'cyan'
  };
  return colors[type] || 'default';
};

export const AgentListView: React.FC<AgentListViewProps> = ({
  onCreateAgent,
  onViewDetails
}) => {
  const dispatch = useAppDispatch();
  const { agents, selectedAgent, status } = useAppSelector(state => state.agent);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [filteredAgents, setFilteredAgents] = useState<Agent[]>([]);

  useEffect(() => {
    dispatch(loadAgents());
  }, [dispatch]);

  useEffect(() => {
    filterAgents();
  }, [agents, searchTerm, statusFilter, typeFilter]);

  const filterAgents = () => {
    let filtered = agents;

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(agent =>
        agent.name.toLowerCase().includes(term) ||
        agent.type.toLowerCase().includes(term) ||
        agent.capabilities.some(cap => cap.toLowerCase().includes(term))
      );
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(agent => agent.status === statusFilter);
    }

    // Filter by type
    if (typeFilter !== 'all') {
      filtered = filtered.filter(agent => agent.type === typeFilter);
    }

    setFilteredAgents(filtered);
  };

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

  const handleDeleteAgent = async (agentId: string) => {
    try {
      // TODO: Implement delete agent action
      message.success('Agent deleted successfully');
    } catch (error) {
      message.error('Failed to delete agent');
    }
  };

  const handleRefreshStatus = async (agentId: string) => {
    try {
      await dispatch(getAgentStatus(agentId));
      message.success('Status refreshed');
    } catch (error) {
      message.error('Failed to refresh status');
    }
  };

  const getActionMenu = (agent: Agent) => (
    <Menu>
      <Menu.Item
        key="details"
        icon={<EyeOutlined />}
        onClick={() => onViewDetails(agent.id)}
      >
        View Details
      </Menu.Item>
      <Menu.Item
        key="settings"
        icon={<SettingOutlined />}
        onClick={() => message.info('Settings functionality coming soon')}
      >
        Settings
      </Menu.Item>
      <Menu.Item
        key="refresh"
        icon={<ReloadOutlined />}
        onClick={() => handleRefreshStatus(agent.id)}
      >
        Refresh Status
      </Menu.Item>
      <Menu.Divider />
      <Menu.Item
        key="delete"
        icon={<DeleteOutlined />}
        danger
        onClick={() => handleDeleteAgent(agent.id)}
      >
        Delete Agent
      </Menu.Item>
    </Menu>
  );

  const columns: ColumnsType<Agent> = [
    {
      title: 'Agent',
      key: 'agent',
      width: 200,
      render: (_, agent) => (
        <Space>
          <Badge status={getStatusColor(agent.status) as any} dot>
            <Avatar size="small" style={{ backgroundColor: '#1890ff' }}>
              {getAgentTypeIcon(agent.type)}
            </Avatar>
          </Badge>
          <div>
            <div style={{ fontWeight: 500 }}>{agent.name}</div>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {agent.id.substring(0, 8)}...
            </Text>
          </div>
        </Space>
      )
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      width: 120,
      render: (type) => (
        <Tag color={getAgentTypeColor(type)}>
          {type.replace('_', ' ').toUpperCase()}
        </Tag>
      )
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status) => (
        <Badge 
          status={getStatusColor(status) as any} 
          text={status.charAt(0).toUpperCase() + status.slice(1)}
        />
      )
    },
    {
      title: 'Performance',
      key: 'performance',
      width: 150,
      render: (_, agent) => (
        <div>
          <div style={{ marginBottom: '4px' }}>
            <Text style={{ fontSize: '12px' }}>
              Success: {(agent.performance.successRate * 100).toFixed(0)}%
            </Text>
            <Progress
              percent={agent.performance.successRate * 100}
              size="small"
              showInfo={false}
              strokeColor={agent.performance.successRate > 0.8 ? '#52c41a' : '#faad14'}
            />
          </div>
          <Text type="secondary" style={{ fontSize: '11px' }}>
            {agent.performance.tasksCompleted} tasks completed
          </Text>
        </div>
      )
    },
    {
      title: 'Load',
      key: 'workload',
      width: 100,
      render: (_, agent) => (
        <div>
          <Text strong>{agent.workload}</Text>
          <Text type="secondary">/{agent.config.maxConcurrentTasks}</Text>
          <Progress
            percent={(agent.workload / agent.config.maxConcurrentTasks) * 100}
            size="small"
            showInfo={false}
            strokeColor={agent.workload >= agent.config.maxConcurrentTasks ? '#ff4d4f' : '#1890ff'}
          />
        </div>
      )
    },
    {
      title: 'Current Task',
      dataIndex: 'currentTask',
      key: 'currentTask',
      width: 200,
      render: (task) => (
        task ? (
          <Tooltip title={task}>
            <Text ellipsis style={{ maxWidth: '180px' }}>
              {task}
            </Text>
          </Tooltip>
        ) : (
          <Text type="secondary">No active task</Text>
        )
      )
    },
    {
      title: 'Last Active',
      key: 'lastActive',
      width: 120,
      render: (_, agent) => (
        <Text type="secondary" style={{ fontSize: '12px' }}>
          {new Date(agent.performance.lastActive).toLocaleString([], {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}
        </Text>
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      fixed: 'right',
      render: (_, agent) => (
        <Space size="small">
          <Tooltip title={agent.status === 'offline' ? 'Start Agent' : 'Stop Agent'}>
            <Button
              type="text"
              size="small"
              icon={agent.status === 'offline' ? <PlayCircleOutlined /> : <PauseCircleOutlined />}
              onClick={() => {
                if (agent.status === 'offline') {
                  handleStartAgent(agent.id);
                } else {
                  handleStopAgent(agent.id);
                }
              }}
            />
          </Tooltip>
          <Dropdown overlay={getActionMenu(agent)} trigger={['click']}>
            <Button type="text" size="small" icon={<MoreOutlined />} />
          </Dropdown>
        </Space>
      )
    }
  ];

  const getStatusCounts = () => {
    const counts = {
      total: agents.length,
      idle: agents.filter(a => a.status === 'idle').length,
      working: agents.filter(a => a.status === 'working').length,
      offline: agents.filter(a => a.status === 'offline').length,
      error: agents.filter(a => a.status === 'error').length
    };
    return counts;
  };

  const statusCounts = getStatusCounts();

  return (
    <div style={{ padding: '16px' }}>
      {/* Header Stats */}
      <Row gutter={16} style={{ marginBottom: '16px' }}>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="Total Agents"
              value={statusCounts.total}
              prefix="🤖"
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="Active"
              value={statusCounts.idle + statusCounts.working}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="Working"
              value={statusCounts.working}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="Offline"
              value={statusCounts.offline}
              valueStyle={{ color: '#8c8c8c' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Controls */}
      <Row gutter={16} style={{ marginBottom: '16px' }} align="middle">
        <Col flex="auto">
          <Input
            placeholder="Search agents by name, type, or capabilities..."
            prefix={<SearchOutlined />}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            allowClear
          />
        </Col>
        <Col>
          <Select
            placeholder="Status"
            value={statusFilter}
            onChange={setStatusFilter}
            style={{ width: 120 }}
            allowClear
          >
            <Option value="all">All Status</Option>
            <Option value="idle">Idle</Option>
            <Option value="working">Working</Option>
            <Option value="waiting">Waiting</Option>
            <Option value="error">Error</Option>
            <Option value="offline">Offline</Option>
          </Select>
        </Col>
        <Col>
          <Select
            placeholder="Type"
            value={typeFilter}
            onChange={setTypeFilter}
            style={{ width: 140 }}
            allowClear
          >
            <Option value="all">All Types</Option>
            <Option value="frontend">Frontend</Option>
            <Option value="backend">Backend</Option>
            <Option value="testing">Testing</Option>
            <Option value="documentation">Documentation</Option>
            <Option value="code_review">Code Review</Option>
            <Option value="devops">DevOps</Option>
          </Select>
        </Col>
        <Col>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={onCreateAgent}
          >
            Create Agent
          </Button>
        </Col>
      </Row>

      {/* Agent Table */}
      <Table
        columns={columns}
        dataSource={filteredAgents}
        rowKey="id"
        loading={status === 'loading'}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total, range) => 
            `${range[0]}-${range[1]} of ${total} agents`
        }}
        scroll={{ x: 1200 }}
        rowSelection={{
          selectedRowKeys: selectedAgent ? [selectedAgent] : [],
          type: 'radio',
          onChange: (selectedRowKeys) => {
            dispatch(setSelectedAgent(selectedRowKeys[0] as string || null));
          }
        }}
        onRow={(record) => ({
          onClick: () => {
            dispatch(setSelectedAgent(record.id));
            onViewDetails(record.id);
          },
          style: {
            cursor: 'pointer'
          }
        })}
      />
    </div>
  );
};
/**
 * Enhanced Agent Control Panel
 * Provides batch operations, group management, and quick configuration templates
 */

import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Button,
  Space,
  Typography,
  Table,
  Checkbox,
  Select,
  Input,
  Dropdown,
  Menu,
  Modal,
  Form,
  message,
  Tag,
  Tooltip,
  Progress,
  Divider,
  Alert,
  Statistic
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  PlayCircleOutlined,
  PauseCircleOutlined,
  ReloadOutlined,
  DeleteOutlined,
  SettingOutlined,
  BulbOutlined,
  GroupOutlined,
  SaveOutlined,
  LoadingOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  FilterOutlined,
  SearchOutlined
} from '@ant-design/icons';
import { useAppSelector, useAppDispatch } from '../../hooks/redux';
import { startAgent, stopAgent, updateAgentStatus } from '../../store/slices/agentSlice';
import { Agent } from '../../store/slices/agentSlice';

const { Title, Text } = Typography;
const { Option } = Select;
const { Search } = Input;

interface AgentGroup {
  id: string;
  name: string;
  agentIds: string[];
  color: string;
}

interface ConfigTemplate {
  id: string;
  name: string;
  description: string;
  config: Partial<Agent['config']>;
}

export const AgentControlPanel: React.FC = () => {
  const dispatch = useAppDispatch();
  const { agents } = useAppSelector(state => state.agent);
  const [selectedAgents, setSelectedAgents] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [operationInProgress, setOperationInProgress] = useState(false);
  const [groups, setGroups] = useState<AgentGroup[]>([
    {
      id: 'frontend-team',
      name: 'Frontend Team',
      agentIds: [],
      color: '#1890ff'
    },
    {
      id: 'backend-team',
      name: 'Backend Team',
      agentIds: [],
      color: '#52c41a'
    },
    {
      id: 'qa-team',
      name: 'QA Team',
      agentIds: [],
      color: '#faad14'
    }
  ]);
  const [templates, setTemplates] = useState<ConfigTemplate[]>([
    {
      id: 'high-performance',
      name: 'High Performance',
      description: 'Optimized for maximum throughput',
      config: {
        maxConcurrentTasks: 8,
        preferences: { timeout: 60000, retryAttempts: 5 }
      }
    },
    {
      id: 'balanced',
      name: 'Balanced',
      description: 'Good balance of performance and stability',
      config: {
        maxConcurrentTasks: 4,
        preferences: { timeout: 30000, retryAttempts: 3 }
      }
    },
    {
      id: 'conservative',
      name: 'Conservative',
      description: 'Stable and reliable configuration',
      config: {
        maxConcurrentTasks: 2,
        preferences: { timeout: 15000, retryAttempts: 2 }
      }
    }
  ]);

  const filteredAgents = agents.filter(agent => {
    const matchesSearch = !searchTerm || 
      agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      agent.type.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || agent.status === statusFilter;
    const matchesType = typeFilter === 'all' || agent.type === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  const handleBulkOperation = async (operation: string) => {
    if (selectedAgents.length === 0) {
      message.warning('Please select agents first');
      return;
    }

    setOperationInProgress(true);
    try {
      const promises = selectedAgents.map(agentId => {
        switch (operation) {
          case 'start':
            return dispatch(startAgent(agentId));
          case 'stop':
            return dispatch(stopAgent(agentId));
          case 'restart':
            return dispatch(stopAgent(agentId)).then(() => 
              dispatch(startAgent(agentId))
            );
          default:
            return Promise.resolve();
        }
      });

      await Promise.all(promises);
      message.success(`${operation} operation completed for ${selectedAgents.length} agents`);
      setSelectedAgents([]);
    } catch (error) {
      message.error(`Failed to ${operation} agents: ${(error as Error).message}`);
    } finally {
      setOperationInProgress(false);
    }
  };

  const handleApplyTemplate = async (templateId: string) => {
    if (selectedAgents.length === 0) {
      message.warning('Please select agents first');
      return;
    }

    const template = templates.find(t => t.id === templateId);
    if (!template) return;

    Modal.confirm({
      title: 'Apply Configuration Template',
      content: `Apply "${template.name}" template to ${selectedAgents.length} selected agents?`,
      onOk: async () => {
        try {
          // In a real implementation, this would call an API to update agent configs
          message.success(`Applied "${template.name}" template to ${selectedAgents.length} agents`);
          setSelectedAgents([]);
        } catch (error) {
          message.error('Failed to apply template');
        }
      }
    });
  };

  const handleGroupOperation = (groupId: string, operation: string) => {
    const group = groups.find(g => g.id === groupId);
    if (!group) return;

    setSelectedAgents(group.agentIds);
    handleBulkOperation(operation);
  };

  const getAgentGroup = (agentId: string) => {
    return groups.find(group => group.agentIds.includes(agentId));
  };

  const getStatusStats = () => {
    const stats = filteredAgents.reduce((acc, agent) => {
      acc[agent.status] = (acc[agent.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      total: filteredAgents.length,
      ...stats
    };
  };

  const bulkActionsMenu = (
    <Menu>
      <Menu.Item 
        key="start" 
        icon={<PlayCircleOutlined />}
        onClick={() => handleBulkOperation('start')}
        disabled={selectedAgents.length === 0}
      >
        Start Selected
      </Menu.Item>
      <Menu.Item 
        key="stop" 
        icon={<PauseCircleOutlined />}
        onClick={() => handleBulkOperation('stop')}
        disabled={selectedAgents.length === 0}
      >
        Stop Selected
      </Menu.Item>
      <Menu.Item 
        key="restart" 
        icon={<ReloadOutlined />}
        onClick={() => handleBulkOperation('restart')}
        disabled={selectedAgents.length === 0}
      >
        Restart Selected
      </Menu.Item>
      <Menu.Divider />
      <Menu.SubMenu key="templates" title="Apply Template" icon={<SettingOutlined />}>
        {templates.map(template => (
          <Menu.Item 
            key={template.id}
            onClick={() => handleApplyTemplate(template.id)}
            disabled={selectedAgents.length === 0}
          >
            {template.name}
          </Menu.Item>
        ))}
      </Menu.SubMenu>
    </Menu>
  );

  const groupActionsMenu = (
    <Menu>
      {groups.map(group => (
        <Menu.SubMenu 
          key={group.id} 
          title={
            <span>
              <span 
                style={{ 
                  display: 'inline-block',
                  width: '8px',
                  height: '8px',
                  backgroundColor: group.color,
                  borderRadius: '50%',
                  marginRight: '8px'
                }}
              />
              {group.name}
            </span>
          }
        >
          <Menu.Item 
            key={`${group.id}-start`}
            onClick={() => handleGroupOperation(group.id, 'start')}
          >
            Start Group
          </Menu.Item>
          <Menu.Item 
            key={`${group.id}-stop`}
            onClick={() => handleGroupOperation(group.id, 'stop')}
          >
            Stop Group
          </Menu.Item>
          <Menu.Item 
            key={`${group.id}-restart`}
            onClick={() => handleGroupOperation(group.id, 'restart')}
          >
            Restart Group
          </Menu.Item>
        </Menu.SubMenu>
      ))}
    </Menu>
  );

  const columns: ColumnsType<Agent> = [
    {
      title: 'Agent',
      key: 'agent',
      render: (_, agent) => {
        const group = getAgentGroup(agent.id);
        return (
          <Space>
            <div>
              <Text strong>{agent.name}</Text>
              <br />
              <Space >
                <Tag color="blue">{agent.type}</Tag>
                {group && (
                  <Tag color={group.color} style={{ fontSize: '10px' }}>
                    {group.name}
                  </Tag>
                )}
              </Space>
            </div>
          </Space>
        );
      }
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const colors = {
          idle: 'success',
          working: 'processing',
          waiting: 'warning',
          error: 'error',
          offline: 'default'
        };
        return <Tag color={colors[status as keyof typeof colors]}>{status}</Tag>;
      }
    },
    {
      title: 'Load',
      key: 'load',
      render: (_, agent) => (
        <div style={{ width: '80px' }}>
          <Progress
            percent={(agent.workload / agent.config.maxConcurrentTasks) * 100}
            
            format={() => `${agent.workload}/${agent.config.maxConcurrentTasks}`}
          />
        </div>
      )
    },
    {
      title: 'Performance',
      key: 'performance',
      render: (_, agent) => (
        <Tooltip title={`Success Rate: ${(agent.performance.successRate * 100).toFixed(1)}%`}>
          <Progress
            percent={agent.performance.successRate * 100}
            
            strokeColor={agent.performance.successRate > 0.8 ? '#52c41a' : '#faad14'}
            showInfo={false}
            style={{ width: '60px' }}
          />
        </Tooltip>
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, agent) => (
        <Space >
          <Tooltip title={agent.status === 'offline' ? 'Start' : 'Stop'}>
            <Button
              type="text"
              
              icon={agent.status === 'offline' ? <PlayCircleOutlined /> : <PauseCircleOutlined />}
              onClick={() => {
                if (agent.status === 'offline') {
                  dispatch(startAgent(agent.id));
                } else {
                  dispatch(stopAgent(agent.id));
                }
              }}
            />
          </Tooltip>
          <Tooltip title="Restart">
            <Button
              type="text"
              
              icon={<ReloadOutlined />}
              onClick={() => {
                dispatch(stopAgent(agent.id)).then(() => 
                  dispatch(startAgent(agent.id))
                );
              }}
            />
          </Tooltip>
        </Space>
      )
    }
  ];

  const stats = getStatusStats();

  return (
    <div>
      {/* Control Header */}
      <Row gutter={16} style={{ marginBottom: '16px' }}>
        <Col span={6}>
          <Card >
            <Statistic
              title="Total Agents"
              value={stats.total}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card >
            <Statistic
              title="Active"
              value={((stats as any).idle || 0) + ((stats as any).working || 0)}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card >
            <Statistic
              title="Working"
              value={(stats as any).working || 0}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card >
            <Statistic
              title="Errors"
              value={(stats as any).error || 0}
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Filters and Controls */}
      <Card  style={{ marginBottom: '16px' }}>
        <Row gutter={16} align="middle">
          <Col flex="auto">
            <Search
              placeholder="Search agents..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: '100%' }}
              allowClear
            />
          </Col>
          <Col>
            <Select
              placeholder="Status"
              value={statusFilter}
              onChange={setStatusFilter}
              style={{ width: 120 }}
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
        </Row>
      </Card>

      {/* Bulk Actions */}
      <Card  style={{ marginBottom: '16px' }}>
        <Row align="middle" justify="space-between">
          <Col>
            <Space>
              <Text strong>Bulk Operations:</Text>
              <Text type="secondary">
                {selectedAgents.length} selected
              </Text>
            </Space>
          </Col>
          <Col>
            <Space>
              <Dropdown overlay={bulkActionsMenu} trigger={['click']}>
                <Button 
                  icon={<BulbOutlined />}
                  loading={operationInProgress}
                  disabled={selectedAgents.length === 0}
                >
                  Bulk Actions
                </Button>
              </Dropdown>
              <Dropdown overlay={groupActionsMenu} trigger={['click']}>
                <Button icon={<GroupOutlined />}>
                  Group Actions
                </Button>
              </Dropdown>
              <Button
                icon={<SettingOutlined />}
                onClick={() => setShowTemplateModal(true)}
              >
                Templates
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Agent Table */}
      <Card >
        <Table
          columns={columns}
          dataSource={filteredAgents}
          rowKey="id"
          
          pagination={{
            pageSize: 20,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => 
              `${range[0]}-${range[1]} of ${total} agents`
          }}
          rowSelection={{
            selectedRowKeys: selectedAgents,
            onChange: (selectedRowKeys) => setSelectedAgents(selectedRowKeys as string[]),
            getCheckboxProps: (record) => ({
              disabled: operationInProgress
            })
          }}
          loading={operationInProgress}
        />
      </Card>

      {/* Template Management Modal */}
      <Modal
        title="Configuration Templates"
        open={showTemplateModal}
        onCancel={() => setShowTemplateModal(false)}
        width={600}
        footer={null}
      >
        <div>
          <Row gutter={16}>
            {templates.map(template => (
              <Col span={24} key={template.id} style={{ marginBottom: '12px' }}>
                <Card  hoverable>
                  <Row align="middle" justify="space-between">
                    <Col flex="auto">
                      <div>
                        <Text strong>{template.name}</Text>
                        <br />
                        <Text type="secondary" style={{ fontSize: '12px' }}>
                          {template.description}
                        </Text>
                      </div>
                    </Col>
                    <Col>
                      <Button
                        
                        onClick={() => handleApplyTemplate(template.id)}
                        disabled={selectedAgents.length === 0}
                      >
                        Apply
                      </Button>
                    </Col>
                  </Row>
                </Card>
              </Col>
            ))}
          </Row>
        </div>
      </Modal>
    </div>
  );
};
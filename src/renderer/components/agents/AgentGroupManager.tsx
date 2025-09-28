/**
 * Agent Group Manager Component
 * Manages agent groups for batch operations and organization
 */

import React, { useState } from 'react';
import {
  Card,
  Row,
  Col,
  Button,
  Space,
  Typography,
  Form,
  Input,
  Select,
  Transfer,
  Modal,
  List,
  Tag,
  Tooltip,
  message,
  Popconfirm,
  Badge,
  Avatar
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  TeamOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
  ReloadOutlined,
  SettingOutlined
} from '@ant-design/icons';
import { useAppSelector } from '../../hooks/redux';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { TextArea } = Input;

interface AgentGroup {
  id: string;
  name: string;
  description: string;
  color: string;
  agentIds: string[];
  createdAt: Date;
  lastModified: Date;
}

interface TransferItem {
  key: string;
  title: string;
  description: string;
  status: string;
}

const groupColors = [
  '#1890ff', '#52c41a', '#faad14', '#f5222d', '#722ed1', 
  '#13c2c2', '#eb2f96', '#fa8c16', '#a0d911', '#2f54eb'
];

export const AgentGroupManager: React.FC = () => {
  const { agents } = useAppSelector(state => state.agent);
  const [groups, setGroups] = useState<AgentGroup[]>([
    {
      id: 'group-1',
      name: 'Frontend Team',
      description: 'All frontend development agents',
      color: '#1890ff',
      agentIds: agents.filter(a => a.type === 'frontend').map(a => a.id),
      createdAt: new Date('2024-01-15'),
      lastModified: new Date('2024-01-15')
    },
    {
      id: 'group-2',
      name: 'Backend Team',
      description: 'Backend and API development agents',
      color: '#52c41a',
      agentIds: agents.filter(a => a.type === 'backend').map(a => a.id),
      createdAt: new Date('2024-01-12'),
      lastModified: new Date('2024-01-18')
    },
    {
      id: 'group-3',
      name: 'QA Team',
      description: 'Testing and quality assurance agents',
      color: '#faad14',
      agentIds: agents.filter(a => a.type === 'testing').map(a => a.id),
      createdAt: new Date('2024-01-10'),
      lastModified: new Date('2024-01-16')
    }
  ]);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingGroup, setEditingGroup] = useState<AgentGroup | null>(null);
  const [form] = Form.useForm();
  const [selectedAgents, setSelectedAgents] = useState<string[]>([]);

  const getAgentTransferData = (): TransferItem[] => {
    return agents.map(agent => ({
      key: agent.id,
      title: agent.name,
      description: `${agent.type} - ${agent.status}`,
      status: agent.status
    }));
  };

  const getGroupAgents = (group: AgentGroup) => {
    return agents.filter(agent => group.agentIds.includes(agent.id));
  };

  const getAgentStatusColor = (status: string) => {
    const colors = {
      idle: '#52c41a',
      working: '#1890ff',
      waiting: '#faad14',
      error: '#ff4d4f',
      offline: '#8c8c8c'
    };
    return colors[status as keyof typeof colors] || '#8c8c8c';
  };

  const handleCreateGroup = async (values: any) => {
    const newGroup: AgentGroup = {
      id: `group-${Date.now()}`,
      name: values.name,
      description: values.description,
      color: values.color,
      agentIds: selectedAgents,
      createdAt: new Date(),
      lastModified: new Date()
    };

    setGroups(prev => [...prev, newGroup]);
    setShowCreateModal(false);
    setSelectedAgents([]);
    form.resetFields();
    message.success('Group created successfully');
  };

  const handleEditGroup = async (values: any) => {
    if (!editingGroup) return;

    const updatedGroup: AgentGroup = {
      ...editingGroup,
      name: values.name,
      description: values.description,
      color: values.color,
      agentIds: selectedAgents,
      lastModified: new Date()
    };

    setGroups(prev => prev.map(g => g.id === editingGroup.id ? updatedGroup : g));
    setShowEditModal(false);
    setEditingGroup(null);
    setSelectedAgents([]);
    form.resetFields();
    message.success('Group updated successfully');
  };

  const handleDeleteGroup = (groupId: string) => {
    setGroups(prev => prev.filter(g => g.id !== groupId));
    message.success('Group deleted successfully');
  };

  const openEditModal = (group: AgentGroup) => {
    setEditingGroup(group);
    setSelectedAgents(group.agentIds);
    form.setFieldsValue({
      name: group.name,
      description: group.description,
      color: group.color
    });
    setShowEditModal(true);
  };

  const handleGroupAction = (group: AgentGroup, action: string) => {
    const agentCount = group.agentIds.length;
    message.info(`${action} operation initiated for ${agentCount} agents in "${group.name}"`);
  };

  const renderGroupForm = () => (
    <Form
      form={form}
      layout="vertical"
      onFinish={editingGroup ? handleEditGroup : handleCreateGroup}
    >
      <Row gutter={16}>
        <Col span={16}>
          <Form.Item
            name="name"
            label="Group Name"
            rules={[{ required: true, message: 'Please enter group name' }]}
          >
            <Input placeholder="Enter group name" />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item
            name="color"
            label="Group Color"
            initialValue={groupColors[0]}
          >
            <Select>
              {groupColors.map(color => (
                <Option key={color} value={color}>
                  <Space>
                    <div
                      style={{
                        width: '16px',
                        height: '16px',
                        backgroundColor: color,
                        borderRadius: '50%',
                        display: 'inline-block'
                      }}
                    />
                    {color}
                  </Space>
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Col>
      </Row>

      <Form.Item
        name="description"
        label="Description"
      >
        <TextArea rows={3} placeholder="Describe this group..." />
      </Form.Item>

      <Form.Item label="Select Agents">
        <Transfer
          dataSource={getAgentTransferData()}
          targetKeys={selectedAgents}
          onChange={(targetKeys) => setSelectedAgents(targetKeys as string[])}
          render={item => (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Badge
                status={
                  item.status === 'idle' ? 'success' :
                  item.status === 'working' ? 'processing' :
                  item.status === 'waiting' ? 'warning' :
                  item.status === 'error' ? 'error' : 'default'
                }
              />
              <div>
                <div>{item.title}</div>
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  {item.description}
                </Text>
              </div>
            </div>
          )}
          titles={['Available Agents', 'Group Members']}
          showSearch
          filterOption={(inputValue, option) =>
            option.title.toLowerCase().includes(inputValue.toLowerCase()) ||
            option.description.toLowerCase().includes(inputValue.toLowerCase())
          }
          style={{ width: '100%' }}
        />
      </Form.Item>
    </Form>
  );

  return (
    <div>
      {/* Header */}
      <Row align="middle" justify="space-between" style={{ marginBottom: '16px' }}>
        <Col>
          <Title level={5} style={{ margin: 0 }}>
            <TeamOutlined /> Agent Groups
          </Title>
          <Text type="secondary">
            Organize agents into groups for batch operations
          </Text>
        </Col>
        <Col>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setShowCreateModal(true)}
          >
            Create Group
          </Button>
        </Col>
      </Row>

      {/* Group List */}
      <List
        grid={{ gutter: 16, column: 1 }}
        dataSource={groups}
        renderItem={(group) => {
          const groupAgents = getGroupAgents(group);
          const activeAgents = groupAgents.filter(a => a.status !== 'offline').length;
          const workingAgents = groupAgents.filter(a => a.status === 'working').length;

          return (
            <List.Item>
              <Card
                
                title={
                  <Space>
                    <div
                      style={{
                        width: '12px',
                        height: '12px',
                        backgroundColor: group.color,
                        borderRadius: '50%'
                      }}
                    />
                    <Text strong>{group.name}</Text>
                    <Badge count={group.agentIds.length} style={{ backgroundColor: group.color }} />
                  </Space>
                }
                extra={
                  <Space>
                    <Tooltip title="Start All">
                      <Button
                        type="text"
                        
                        icon={<PlayCircleOutlined />}
                        onClick={() => handleGroupAction(group, 'Start')}
                      />
                    </Tooltip>
                    <Tooltip title="Stop All">
                      <Button
                        type="text"
                        
                        icon={<PauseCircleOutlined />}
                        onClick={() => handleGroupAction(group, 'Stop')}
                      />
                    </Tooltip>
                    <Tooltip title="Restart All">
                      <Button
                        type="text"
                        
                        icon={<ReloadOutlined />}
                        onClick={() => handleGroupAction(group, 'Restart')}
                      />
                    </Tooltip>
                    <Tooltip title="Edit Group">
                      <Button
                        type="text"
                        
                        icon={<EditOutlined />}
                        onClick={() => openEditModal(group)}
                      />
                    </Tooltip>
                    <Popconfirm
                      title="Delete Group"
                      description="Are you sure you want to delete this group?"
                      onConfirm={() => handleDeleteGroup(group.id)}
                      okText="Yes"
                      cancelText="No"
                    >
                      <Tooltip title="Delete Group">
                        <Button
                          type="text"
                          
                          icon={<DeleteOutlined />}
                          danger
                        />
                      </Tooltip>
                    </Popconfirm>
                  </Space>
                }
              >
                {group.description && (
                  <Paragraph style={{ marginBottom: '12px' }}>
                    {group.description}
                  </Paragraph>
                )}

                {/* Group Statistics */}
                <Row gutter={16} style={{ marginBottom: '12px' }}>
                  <Col span={8}>
                    <Text strong>Total Agents:</Text>
                    <div>{group.agentIds.length}</div>
                  </Col>
                  <Col span={8}>
                    <Text strong>Active:</Text>
                    <div style={{ color: '#52c41a' }}>{activeAgents}</div>
                  </Col>
                  <Col span={8}>
                    <Text strong>Working:</Text>
                    <div style={{ color: '#1890ff' }}>{workingAgents}</div>
                  </Col>
                </Row>

                {/* Agent Avatars */}
                <div style={{ marginBottom: '12px' }}>
                  <Text strong>Members:</Text>
                  <div style={{ marginTop: '8px' }}>
                    <Avatar.Group maxCount={6} >
                      {groupAgents.map(agent => (
                        <Tooltip key={agent.id} title={`${agent.name} (${agent.status})`}>
                          <Avatar
                            style={{ 
                              backgroundColor: getAgentStatusColor(agent.status),
                              cursor: 'pointer'
                            }}
                          >
                            {agent.name.charAt(0).toUpperCase()}
                          </Avatar>
                        </Tooltip>
                      ))}
                    </Avatar.Group>
                  </div>
                </div>

                {/* Agent Types */}
                <div style={{ marginBottom: '12px' }}>
                  <Text strong>Types:</Text>
                  <div style={{ marginTop: '4px' }}>
                    <Space wrap>
                      {[...new Set(groupAgents.map(a => a.type))].map(type => (
                        <Tag key={type} >
                          {type.replace('_', ' ').toUpperCase()}
                        </Tag>
                      ))}
                    </Space>
                  </div>
                </div>

                <div>
                  <Text type="secondary" style={{ fontSize: '11px' }}>
                    Created: {group.createdAt.toLocaleDateString()} | 
                    Modified: {group.lastModified.toLocaleDateString()}
                  </Text>
                </div>
              </Card>
            </List.Item>
          );
        }}
      />

      {/* Create Group Modal */}
      <Modal
        title="Create Agent Group"
        open={showCreateModal}
        onCancel={() => {
          setShowCreateModal(false);
          setSelectedAgents([]);
          form.resetFields();
        }}
        width={800}
        footer={[
          <Button key="cancel" onClick={() => {
            setShowCreateModal(false);
            setSelectedAgents([]);
            form.resetFields();
          }}>
            Cancel
          </Button>,
          <Button
            key="create"
            type="primary"
            onClick={() => form.submit()}
          >
            Create Group
          </Button>
        ]}
      >
        {renderGroupForm()}
      </Modal>

      {/* Edit Group Modal */}
      <Modal
        title="Edit Agent Group"
        open={showEditModal}
        onCancel={() => {
          setShowEditModal(false);
          setEditingGroup(null);
          setSelectedAgents([]);
          form.resetFields();
        }}
        width={800}
        footer={[
          <Button key="cancel" onClick={() => {
            setShowEditModal(false);
            setEditingGroup(null);
            setSelectedAgents([]);
            form.resetFields();
          }}>
            Cancel
          </Button>,
          <Button
            key="save"
            type="primary"
            onClick={() => form.submit()}
          >
            Save Changes
          </Button>
        ]}
      >
        {renderGroupForm()}
      </Modal>
    </div>
  );
};
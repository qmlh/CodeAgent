/**
 * Agent Template Manager Component
 * Manages configuration templates for quick agent setup
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
  InputNumber,
  Checkbox,
  Modal,
  List,
  Tag,
  Tooltip,
  message,
  Popconfirm
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  CopyOutlined,
  SaveOutlined,
  SettingOutlined
} from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { TextArea } = Input;

interface AgentTemplate {
  id: string;
  name: string;
  description: string;
  agentType: string;
  capabilities: string[];
  config: {
    maxConcurrentTasks: number;
    timeout: number;
    retryAttempts: number;
    specializations: string[];
    preferences: Record<string, any>;
  };
  createdAt: Date;
  usageCount: number;
}

export const AgentTemplateManager: React.FC = () => {
  const [templates, setTemplates] = useState<AgentTemplate[]>([
    {
      id: 'template-1',
      name: 'High Performance Frontend',
      description: 'Optimized for high-throughput frontend development tasks',
      agentType: 'frontend',
      capabilities: ['react', 'typescript', 'css', 'webpack', 'testing'],
      config: {
        maxConcurrentTasks: 8,
        timeout: 60000,
        retryAttempts: 5,
        specializations: ['react-optimization', 'performance-tuning'],
        preferences: {
          codeStyle: 'modern',
          testingFramework: 'jest',
          bundler: 'webpack'
        }
      },
      createdAt: new Date('2024-01-15'),
      usageCount: 12
    },
    {
      id: 'template-2',
      name: 'Balanced Backend',
      description: 'Well-rounded backend agent for general development',
      agentType: 'backend',
      capabilities: ['nodejs', 'python', 'database', 'api-design', 'microservices'],
      config: {
        maxConcurrentTasks: 4,
        timeout: 30000,
        retryAttempts: 3,
        specializations: ['rest-api', 'database-optimization'],
        preferences: {
          runtime: 'nodejs',
          database: 'postgresql',
          architecture: 'microservices'
        }
      },
      createdAt: new Date('2024-01-10'),
      usageCount: 8
    },
    {
      id: 'template-3',
      name: 'Testing Specialist',
      description: 'Focused on comprehensive testing and quality assurance',
      agentType: 'testing',
      capabilities: ['unit-testing', 'integration-testing', 'e2e-testing', 'performance-testing'],
      config: {
        maxConcurrentTasks: 3,
        timeout: 45000,
        retryAttempts: 2,
        specializations: ['test-automation', 'quality-metrics'],
        preferences: {
          testRunner: 'jest',
          e2eFramework: 'playwright',
          coverage: 'comprehensive'
        }
      },
      createdAt: new Date('2024-01-08'),
      usageCount: 15
    }
  ]);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<AgentTemplate | null>(null);
  const [form] = Form.useForm();

  const allCapabilities = [
    'react', 'vue', 'angular', 'typescript', 'javascript', 'css', 'html',
    'nodejs', 'python', 'java', 'csharp', 'go', 'rust', 'php',
    'database', 'sql', 'nosql', 'api-design', 'rest-api', 'graphql',
    'microservices', 'docker', 'kubernetes', 'ci-cd', 'testing',
    'unit-testing', 'integration-testing', 'e2e-testing', 'performance-testing',
    'documentation', 'technical-writing', 'code-review', 'security'
  ];

  const agentTypes = [
    { value: 'frontend', label: 'Frontend Developer' },
    { value: 'backend', label: 'Backend Developer' },
    { value: 'testing', label: 'Testing Specialist' },
    { value: 'documentation', label: 'Documentation Writer' },
    { value: 'code_review', label: 'Code Reviewer' },
    { value: 'devops', label: 'DevOps Engineer' }
  ];

  const handleCreateTemplate = async (values: any) => {
    const newTemplate: AgentTemplate = {
      id: `template-${Date.now()}`,
      name: values.name,
      description: values.description,
      agentType: values.agentType,
      capabilities: values.capabilities || [],
      config: {
        maxConcurrentTasks: values.maxConcurrentTasks || 3,
        timeout: values.timeout || 30000,
        retryAttempts: values.retryAttempts || 3,
        specializations: values.specializations || [],
        preferences: values.preferences || {}
      },
      createdAt: new Date(),
      usageCount: 0
    };

    setTemplates(prev => [...prev, newTemplate]);
    setShowCreateModal(false);
    form.resetFields();
    message.success('Template created successfully');
  };

  const handleEditTemplate = async (values: any) => {
    if (!editingTemplate) return;

    const updatedTemplate: AgentTemplate = {
      ...editingTemplate,
      name: values.name,
      description: values.description,
      agentType: values.agentType,
      capabilities: values.capabilities || [],
      config: {
        maxConcurrentTasks: values.maxConcurrentTasks || 3,
        timeout: values.timeout || 30000,
        retryAttempts: values.retryAttempts || 3,
        specializations: values.specializations || [],
        preferences: values.preferences || {}
      }
    };

    setTemplates(prev => prev.map(t => t.id === editingTemplate.id ? updatedTemplate : t));
    setShowEditModal(false);
    setEditingTemplate(null);
    form.resetFields();
    message.success('Template updated successfully');
  };

  const handleDeleteTemplate = (templateId: string) => {
    setTemplates(prev => prev.filter(t => t.id !== templateId));
    message.success('Template deleted successfully');
  };

  const handleDuplicateTemplate = (template: AgentTemplate) => {
    const duplicatedTemplate: AgentTemplate = {
      ...template,
      id: `template-${Date.now()}`,
      name: `${template.name} (Copy)`,
      createdAt: new Date(),
      usageCount: 0
    };

    setTemplates(prev => [...prev, duplicatedTemplate]);
    message.success('Template duplicated successfully');
  };

  const openEditModal = (template: AgentTemplate) => {
    setEditingTemplate(template);
    form.setFieldsValue({
      name: template.name,
      description: template.description,
      agentType: template.agentType,
      capabilities: template.capabilities,
      maxConcurrentTasks: template.config.maxConcurrentTasks,
      timeout: template.config.timeout,
      retryAttempts: template.config.retryAttempts,
      specializations: template.config.specializations
    });
    setShowEditModal(true);
  };

  const renderTemplateForm = () => (
    <Form
      form={form}
      layout="vertical"
      onFinish={editingTemplate ? handleEditTemplate : handleCreateTemplate}
    >
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            name="name"
            label="Template Name"
            rules={[{ required: true, message: 'Please enter template name' }]}
          >
            <Input placeholder="Enter template name" />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            name="agentType"
            label="Agent Type"
            rules={[{ required: true, message: 'Please select agent type' }]}
          >
            <Select placeholder="Select agent type">
              {agentTypes.map(type => (
                <Option key={type.value} value={type.value}>
                  {type.label}
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Col>
      </Row>

      <Form.Item
        name="description"
        label="Description"
        rules={[{ required: true, message: 'Please enter description' }]}
      >
        <TextArea rows={3} placeholder="Describe this template..." />
      </Form.Item>

      <Form.Item
        name="capabilities"
        label="Capabilities"
      >
        <Checkbox.Group>
          <Row gutter={[8, 8]}>
            {allCapabilities.map(capability => (
              <Col span={8} key={capability}>
                <Checkbox value={capability}>
                  {capability}
                </Checkbox>
              </Col>
            ))}
          </Row>
        </Checkbox.Group>
      </Form.Item>

      <Title level={5}>Performance Configuration</Title>
      
      <Row gutter={16}>
        <Col span={8}>
          <Form.Item
            name="maxConcurrentTasks"
            label="Max Concurrent Tasks"
            initialValue={3}
          >
            <InputNumber min={1} max={20} style={{ width: '100%' }} />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item
            name="timeout"
            label="Timeout (ms)"
            initialValue={30000}
          >
            <InputNumber min={5000} max={300000} style={{ width: '100%' }} />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item
            name="retryAttempts"
            label="Retry Attempts"
            initialValue={3}
          >
            <InputNumber min={0} max={10} style={{ width: '100%' }} />
          </Form.Item>
        </Col>
      </Row>

      <Form.Item
        name="specializations"
        label="Specializations"
      >
        <Select
          mode="tags"
          placeholder="Add specializations..."
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
            <SettingOutlined /> Agent Templates
          </Title>
          <Text type="secondary">
            Manage configuration templates for quick agent creation
          </Text>
        </Col>
        <Col>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setShowCreateModal(true)}
          >
            Create Template
          </Button>
        </Col>
      </Row>

      {/* Template List */}
      <List
        grid={{ gutter: 16, column: 1 }}
        dataSource={templates}
        renderItem={(template) => (
          <List.Item>
            <Card
              
              title={
                <Space>
                  <Text strong>{template.name}</Text>
                  <Tag color="blue">{template.agentType}</Tag>
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    Used {template.usageCount} times
                  </Text>
                </Space>
              }
              extra={
                <Space>
                  <Tooltip title="Edit Template">
                    <Button
                      type="text"
                      
                      icon={<EditOutlined />}
                      onClick={() => openEditModal(template)}
                    />
                  </Tooltip>
                  <Tooltip title="Duplicate Template">
                    <Button
                      type="text"
                      
                      icon={<CopyOutlined />}
                      onClick={() => handleDuplicateTemplate(template)}
                    />
                  </Tooltip>
                  <Popconfirm
                    title="Delete Template"
                    description="Are you sure you want to delete this template?"
                    onConfirm={() => handleDeleteTemplate(template.id)}
                    okText="Yes"
                    cancelText="No"
                  >
                    <Tooltip title="Delete Template">
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
              <Paragraph style={{ marginBottom: '12px' }}>
                {template.description}
              </Paragraph>

              <Row gutter={16}>
                <Col span={12}>
                  <Text strong>Capabilities:</Text>
                  <div style={{ marginTop: '4px' }}>
                    <Space wrap>
                      {template.capabilities.slice(0, 3).map(cap => (
                        <Tag key={cap} >{cap}</Tag>
                      ))}
                      {template.capabilities.length > 3 && (
                        <Tag >+{template.capabilities.length - 3} more</Tag>
                      )}
                    </Space>
                  </div>
                </Col>
                <Col span={12}>
                  <Text strong>Configuration:</Text>
                  <div style={{ marginTop: '4px' }}>
                    <Text style={{ fontSize: '12px' }}>
                      Max Tasks: {template.config.maxConcurrentTasks} | 
                      Timeout: {template.config.timeout / 1000}s | 
                      Retries: {template.config.retryAttempts}
                    </Text>
                  </div>
                </Col>
              </Row>

              <div style={{ marginTop: '12px' }}>
                <Text type="secondary" style={{ fontSize: '11px' }}>
                  Created: {template.createdAt.toLocaleDateString()}
                </Text>
              </div>
            </Card>
          </List.Item>
        )}
      />

      {/* Create Template Modal */}
      <Modal
        title="Create Agent Template"
        open={showCreateModal}
        onCancel={() => {
          setShowCreateModal(false);
          form.resetFields();
        }}
        width={800}
        footer={[
          <Button key="cancel" onClick={() => {
            setShowCreateModal(false);
            form.resetFields();
          }}>
            Cancel
          </Button>,
          <Button
            key="create"
            type="primary"
            icon={<SaveOutlined />}
            onClick={() => form.submit()}
          >
            Create Template
          </Button>
        ]}
      >
        {renderTemplateForm()}
      </Modal>

      {/* Edit Template Modal */}
      <Modal
        title="Edit Agent Template"
        open={showEditModal}
        onCancel={() => {
          setShowEditModal(false);
          setEditingTemplate(null);
          form.resetFields();
        }}
        width={800}
        footer={[
          <Button key="cancel" onClick={() => {
            setShowEditModal(false);
            setEditingTemplate(null);
            form.resetFields();
          }}>
            Cancel
          </Button>,
          <Button
            key="save"
            type="primary"
            icon={<SaveOutlined />}
            onClick={() => form.submit()}
          >
            Save Changes
          </Button>
        ]}
      >
        {renderTemplateForm()}
      </Modal>
    </div>
  );
};
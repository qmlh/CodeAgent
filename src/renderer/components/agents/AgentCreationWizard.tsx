/**
 * Agent Creation Wizard Component
 * Multi-step wizard for creating new agents with type selection, configuration, and capability customization
 */

import React, { useState } from 'react';
import {
  Modal,
  Steps,
  Form,
  Input,
  Select,
  Checkbox,
  Slider,
  Card,
  Row,
  Col,
  Button,
  Typography,
  Space,
  Divider,
  message
} from 'antd';
import {
  RobotOutlined,
  SettingOutlined,
  CheckCircleOutlined,
  CodeOutlined,
  DatabaseOutlined,
  BugOutlined,
  FileTextOutlined,
  EyeOutlined,
  CloudOutlined
} from '@ant-design/icons';
import { AgentType } from '../../../types/agent.types';
import { useAppDispatch } from '../../hooks/redux';
import { createAgent } from '../../store/slices/agentSlice';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { TextArea } = Input;

interface AgentCreationWizardProps {
  visible: boolean;
  onClose: () => void;
}

interface AgentFormData {
  name: string;
  type: AgentType;
  description: string;
  capabilities: string[];
  specializations: string[];
  maxConcurrentTasks: number;
  timeout: number;
  retryAttempts: number;
  preferences: Record<string, any>;
}

const agentTypeInfo = {
  [AgentType.FRONTEND]: {
    icon: <CodeOutlined />,
    title: 'Frontend Developer',
    description: 'Specializes in UI/UX development, React, Vue, Angular, and modern frontend technologies',
    defaultCapabilities: ['react', 'typescript', 'css', 'html', 'javascript', 'ui-design'],
    color: '#1890ff'
  },
  [AgentType.BACKEND]: {
    icon: <DatabaseOutlined />,
    title: 'Backend Developer', 
    description: 'Handles server-side logic, APIs, databases, and backend architecture',
    defaultCapabilities: ['nodejs', 'python', 'java', 'api-design', 'database', 'microservices'],
    color: '#52c41a'
  },
  [AgentType.TESTING]: {
    icon: <BugOutlined />,
    title: 'Testing Specialist',
    description: 'Focuses on automated testing, quality assurance, and test strategy',
    defaultCapabilities: ['unit-testing', 'integration-testing', 'e2e-testing', 'test-automation', 'quality-assurance'],
    color: '#faad14'
  },
  [AgentType.DOCUMENTATION]: {
    icon: <FileTextOutlined />,
    title: 'Documentation Writer',
    description: 'Creates and maintains technical documentation, API docs, and user guides',
    defaultCapabilities: ['technical-writing', 'api-documentation', 'user-guides', 'markdown', 'documentation-tools'],
    color: '#722ed1'
  },
  [AgentType.CODE_REVIEW]: {
    icon: <EyeOutlined />,
    title: 'Code Reviewer',
    description: 'Performs code reviews, ensures code quality, and maintains coding standards',
    defaultCapabilities: ['code-review', 'static-analysis', 'security-review', 'performance-optimization', 'best-practices'],
    color: '#eb2f96'
  },
  [AgentType.DEVOPS]: {
    icon: <CloudOutlined />,
    title: 'DevOps Engineer',
    description: 'Manages CI/CD, infrastructure, deployment, and operational concerns',
    defaultCapabilities: ['ci-cd', 'docker', 'kubernetes', 'cloud-platforms', 'monitoring', 'infrastructure'],
    color: '#13c2c2'
  }
};

const allCapabilities = [
  // Frontend
  'react', 'vue', 'angular', 'typescript', 'javascript', 'css', 'html', 'sass', 'less', 'webpack', 'vite', 'ui-design', 'responsive-design',
  // Backend
  'nodejs', 'python', 'java', 'csharp', 'go', 'rust', 'php', 'api-design', 'rest-api', 'graphql', 'database', 'sql', 'nosql', 'microservices',
  // Testing
  'unit-testing', 'integration-testing', 'e2e-testing', 'test-automation', 'quality-assurance', 'performance-testing', 'security-testing',
  // Documentation
  'technical-writing', 'api-documentation', 'user-guides', 'markdown', 'documentation-tools', 'content-strategy',
  // Code Review
  'code-review', 'static-analysis', 'security-review', 'performance-optimization', 'best-practices', 'refactoring',
  // DevOps
  'ci-cd', 'docker', 'kubernetes', 'cloud-platforms', 'aws', 'azure', 'gcp', 'monitoring', 'infrastructure', 'automation'
];

export const AgentCreationWizard: React.FC<AgentCreationWizardProps> = ({
  visible,
  onClose
}) => {
  const dispatch = useAppDispatch();
  const [form] = Form.useForm();
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<Partial<AgentFormData>>({});
  const [loading, setLoading] = useState(false);

  const steps = [
    {
      title: 'Agent Type',
      icon: <RobotOutlined />,
      description: 'Choose agent specialization'
    },
    {
      title: 'Configuration',
      icon: <SettingOutlined />,
      description: 'Configure agent settings'
    },
    {
      title: 'Review',
      icon: <CheckCircleOutlined />,
      description: 'Review and create'
    }
  ];

  const handleNext = async () => {
    try {
      const values = await form.validateFields();
      setFormData({ ...formData, ...values });
      setCurrentStep(currentStep + 1);
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };

  const handlePrevious = () => {
    setCurrentStep(currentStep - 1);
  };

  const handleCreate = async () => {
    try {
      setLoading(true);
      const finalData = { ...formData, ...form.getFieldsValue() };
      
      await dispatch(createAgent({
        name: finalData.name!,
        type: finalData.type!,
        capabilities: finalData.capabilities || [],
        specializations: finalData.specializations || [],
        preferences: {
          maxConcurrentTasks: finalData.maxConcurrentTasks || 3,
          timeout: finalData.timeout || 30000,
          retryAttempts: finalData.retryAttempts || 3,
          ...finalData.preferences
        }
      })).unwrap();

      message.success('Agent created successfully!');
      handleClose();
    } catch (error) {
      message.error('Failed to create agent: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    form.resetFields();
    setCurrentStep(0);
    setFormData({});
    onClose();
  };

  const renderTypeSelection = () => (
    <div>
      <Title level={4}>Select Agent Type</Title>
      <Paragraph type="secondary">
        Choose the type of agent based on your project needs. Each type comes with specialized capabilities.
      </Paragraph>
      
      <Form.Item
        name="type"
        rules={[{ required: true, message: 'Please select an agent type' }]}
      >
        <Row gutter={[16, 16]}>
          {Object.entries(agentTypeInfo).map(([type, info]) => (
            <Col span={12} key={type}>
              <Card
                hoverable
                className={`agent-type-card ${formData.type === type ? 'selected' : ''}`}
                onClick={() => {
                  form.setFieldsValue({ type });
                  setFormData({ ...formData, type: type as AgentType });
                }}
                style={{
                  borderColor: formData.type === type ? info.color : undefined,
                  backgroundColor: formData.type === type ? `${info.color}10` : undefined
                }}
              >
                <Space direction="vertical"  style={{ width: '100%' }}>
                  <div style={{ fontSize: '24px', color: info.color }}>
                    {info.icon}
                  </div>
                  <Title level={5} style={{ margin: 0 }}>
                    {info.title}
                  </Title>
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    {info.description}
                  </Text>
                </Space>
              </Card>
            </Col>
          ))}
        </Row>
      </Form.Item>
    </div>
  );

  const renderConfiguration = () => {
    const selectedTypeInfo = formData.type ? agentTypeInfo[formData.type as AgentType] : null;
    
    return (
      <div>
        <Title level={4}>Configure Agent</Title>
        <Paragraph type="secondary">
          Customize your agent's capabilities and behavior settings.
        </Paragraph>

        <Form.Item
          name="name"
          label="Agent Name"
          rules={[
            { required: true, message: 'Please enter agent name' },
            { min: 2, message: 'Name must be at least 2 characters' },
            { max: 50, message: 'Name must be less than 50 characters' }
          ]}
        >
          <Input placeholder="Enter a unique name for your agent" />
        </Form.Item>

        <Form.Item
          name="description"
          label="Description"
        >
          <TextArea 
            rows={3} 
            placeholder="Describe what this agent will be responsible for..."
          />
        </Form.Item>

        <Divider />

        <Title level={5}>Capabilities</Title>
        <Form.Item
          name="capabilities"
          initialValue={selectedTypeInfo?.defaultCapabilities || []}
        >
          <Checkbox.Group>
            <Row gutter={[8, 8]}>
              {allCapabilities.map((capability: string) => (
                <Col span={8} key={capability}>
                  <Checkbox value={capability}>
                    {capability}
                  </Checkbox>
                </Col>
              ))}
            </Row>
          </Checkbox.Group>
        </Form.Item>

        <Divider />

        <Title level={5}>Performance Settings</Title>
        
        <Form.Item
          name="maxConcurrentTasks"
          label="Max Concurrent Tasks"
          initialValue={3}
        >
          <Slider
            min={1}
            max={10}
            marks={{
              1: '1',
              3: '3',
              5: '5',
              10: '10'
            }}
          />
        </Form.Item>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="timeout"
              label="Task Timeout (seconds)"
              initialValue={30}
            >
              <Input type="number" min={10} max={300} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="retryAttempts"
              label="Retry Attempts"
              initialValue={3}
            >
              <Input type="number" min={0} max={10} />
            </Form.Item>
          </Col>
        </Row>
      </div>
    );
  };

  const renderReview = () => {
    const finalData = { ...formData, ...form.getFieldsValue() };
    const typeInfo = finalData.type ? agentTypeInfo[finalData.type as AgentType] : null;

    return (
      <div>
        <Title level={4}>Review Agent Configuration</Title>
        <Paragraph type="secondary">
          Please review the agent configuration before creating.
        </Paragraph>

        <Card>
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <div>
              <Text strong>Agent Type:</Text>
              <div style={{ marginTop: 8 }}>
                <Space>
                  {typeInfo?.icon}
                  <Text>{typeInfo?.title}</Text>
                </Space>
              </div>
            </div>

            <div>
              <Text strong>Name:</Text>
              <div style={{ marginTop: 4 }}>
                <Text>{finalData.name}</Text>
              </div>
            </div>

            {finalData.description && (
              <div>
                <Text strong>Description:</Text>
                <div style={{ marginTop: 4 }}>
                  <Text>{finalData.description}</Text>
                </div>
              </div>
            )}

            <div>
              <Text strong>Capabilities:</Text>
              <div style={{ marginTop: 8 }}>
                <Space wrap>
                  {(finalData.capabilities || []).map((cap: string) => (
                    <span
                      key={cap}
                      style={{
                        background: '#f0f0f0',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '12px'
                      }}
                    >
                      {cap}
                    </span>
                  ))}
                </Space>
              </div>
            </div>

            <div>
              <Text strong>Performance Settings:</Text>
              <div style={{ marginTop: 8 }}>
                <Text>Max Concurrent Tasks: {finalData.maxConcurrentTasks || 3}</Text><br />
                <Text>Timeout: {finalData.timeout || 30} seconds</Text><br />
                <Text>Retry Attempts: {finalData.retryAttempts || 3}</Text>
              </div>
            </div>
          </Space>
        </Card>
      </div>
    );
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return renderTypeSelection();
      case 1:
        return renderConfiguration();
      case 2:
        return renderReview();
      default:
        return null;
    }
  };

  return (
    <Modal
      title="Create New Agent"
      open={visible}
      onCancel={handleClose}
      width={800}
      footer={null}
      destroyOnClose
    >
      <Steps current={currentStep} items={steps} style={{ marginBottom: 24 }} />
      
      <Form
        form={form}
        layout="vertical"
        preserve={false}
      >
        {renderStepContent()}
      </Form>

      <div style={{ marginTop: 24, textAlign: 'right' }}>
        <Space>
          {currentStep > 0 && (
            <Button onClick={handlePrevious}>
              Previous
            </Button>
          )}
          {currentStep < steps.length - 1 && (
            <Button type="primary" onClick={handleNext}>
              Next
            </Button>
          )}
          {currentStep === steps.length - 1 && (
            <Button 
              type="primary" 
              onClick={handleCreate}
              loading={loading}
            >
              Create Agent
            </Button>
          )}
        </Space>
      </div>
    </Modal>
  );
};
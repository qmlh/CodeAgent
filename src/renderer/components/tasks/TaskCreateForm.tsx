/**
 * Task Create Form Component
 * Form for creating new tasks with all necessary fields
 */

import React, { useState } from 'react';
import {
  Form,
  Input,
  Select,
  DatePicker,
  InputNumber,
  Button,
  Space,
  Divider,
  Tag,
  Upload,
  Card,
  Row,
  Col,
  Switch,
  Tooltip,
  message
} from 'antd';
import {
  PlusOutlined,
  DeleteOutlined,
  InfoCircleOutlined,
  FileOutlined,
  LinkOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';
import { useAppSelector } from '../../hooks/redux';
import { Task } from '../../store/slices/taskSlice';
import dayjs from 'dayjs';

const { TextArea } = Input;
const { Option } = Select;

export interface TaskCreateFormProps {
  onSubmit: (taskData: any) => void;
  onCancel: () => void;
  initialData?: Partial<Task>;
}

interface FormData {
  title: string;
  description: string;
  type: string;
  priority: Task['priority'];
  estimatedTime: number;
  timeUnit: 'minutes' | 'hours' | 'days';
  dueDate?: dayjs.Dayjs;
  dependencies: string[];
  files: string[];
  requirements: string[];
  tags: string[];
  assignedAgent?: string;
  autoAssign: boolean;
}

const TASK_TYPES = [
  { value: 'frontend', label: 'Frontend Development', color: '#1890ff' },
  { value: 'backend', label: 'Backend Development', color: '#52c41a' },
  { value: 'api', label: 'API Development', color: '#722ed1' },
  { value: 'database', label: 'Database', color: '#fa8c16' },
  { value: 'ui', label: 'UI/UX Design', color: '#eb2f96' },
  { value: 'testing', label: 'Testing', color: '#faad14' },
  { value: 'documentation', label: 'Documentation', color: '#13c2c2' },
  { value: 'review', label: 'Code Review', color: '#f5222d' },
  { value: 'deployment', label: 'Deployment', color: '#a0d911' },
  { value: 'bug-fix', label: 'Bug Fix', color: '#ff4d4f' },
  { value: 'feature', label: 'Feature Development', color: '#1890ff' },
  { value: 'refactor', label: 'Refactoring', color: '#722ed1' },
  { value: 'research', label: 'Research', color: '#fa541c' },
  { value: 'general', label: 'General Task', color: '#595959' }
];

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low', color: '#52c41a', description: 'Can be done when time permits' },
  { value: 'medium', label: 'Medium', color: '#faad14', description: 'Normal priority task' },
  { value: 'high', label: 'High', color: '#fa8c16', description: 'Important task, should be done soon' },
  { value: 'critical', label: 'Critical', color: '#ff4d4f', description: 'Urgent task, needs immediate attention' }
];

export const TaskCreateForm: React.FC<TaskCreateFormProps> = ({ 
  onSubmit, 
  onCancel, 
  initialData 
}) => {
  const [form] = Form.useForm<FormData>();
  const { tasks } = useAppSelector(state => state.task);
  const { agents } = useAppSelector(state => state.agent);
  
  const [customTags, setCustomTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [requirements, setRequirements] = useState<string[]>(['']);

  // Get existing tags from all tasks
  const existingTags = Array.from(new Set(tasks.flatMap(task => task.tags)));
  
  // Get available tasks for dependencies
  const availableTasks = tasks.filter(task => 
    !initialData?.id || task.id !== initialData.id
  );

  const handleSubmit = async (values: FormData) => {
    try {
      // Convert time to milliseconds
      let estimatedTimeMs = values.estimatedTime;
      switch (values.timeUnit) {
        case 'minutes':
          estimatedTimeMs *= 60 * 1000;
          break;
        case 'hours':
          estimatedTimeMs *= 60 * 60 * 1000;
          break;
        case 'days':
          estimatedTimeMs *= 24 * 60 * 60 * 1000;
          break;
      }

      const taskData = {
        title: values.title,
        description: values.description,
        type: values.type,
        priority: values.priority,
        estimatedTime: estimatedTimeMs,
        dueDate: values.dueDate?.toDate(),
        dependencies: values.dependencies || [],
        files: selectedFiles,
        requirements: requirements.filter(req => req.trim() !== ''),
        tags: [...(values.tags || []), ...customTags],
        assignedAgent: values.autoAssign ? undefined : values.assignedAgent
      };

      await onSubmit(taskData);
    } catch (error) {
      message.error('Failed to create task');
    }
  };

  const handleAddTag = () => {
    if (newTag && !customTags.includes(newTag) && !existingTags.includes(newTag)) {
      setCustomTags([...customTags, newTag]);
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setCustomTags(customTags.filter(tag => tag !== tagToRemove));
  };

  const handleAddRequirement = () => {
    setRequirements([...requirements, '']);
  };

  const handleRemoveRequirement = (index: number) => {
    setRequirements(requirements.filter((_, i) => i !== index));
  };

  const handleRequirementChange = (index: number, value: string) => {
    const newRequirements = [...requirements];
    newRequirements[index] = value;
    setRequirements(newRequirements);
  };

  const handleFileSelect = (filePath: string) => {
    if (!selectedFiles.includes(filePath)) {
      setSelectedFiles([...selectedFiles, filePath]);
    }
  };

  const handleFileRemove = (filePath: string) => {
    setSelectedFiles(selectedFiles.filter(f => f !== filePath));
  };

  return (
    <div className="task-create-form">
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{
          priority: 'medium',
          timeUnit: 'hours',
          estimatedTime: 2,
          autoAssign: true,
          ...initialData
        }}
      >
        <Row gutter={16}>
          <Col span={24}>
            <Form.Item
              name="title"
              label="Task Title"
              rules={[
                { required: true, message: 'Please enter task title' },
                { min: 3, message: 'Title must be at least 3 characters' },
                { max: 100, message: 'Title must be less than 100 characters' }
              ]}
            >
              <Input 
                placeholder="Enter a clear, descriptive task title"
                size="large"
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="type"
              label="Task Type"
              rules={[{ required: true, message: 'Please select task type' }]}
            >
              <Select 
                placeholder="Select task type"
                size="large"
                showSearch
                optionFilterProp="children"
              >
                {TASK_TYPES.map(type => (
                  <Option key={type.value} value={type.value}>
                    <Space>
                      <Tag color={type.color}>{type.label}</Tag>
                    </Space>
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          
          <Col span={12}>
            <Form.Item
              name="priority"
              label={
                <Space>
                  Priority
                  <Tooltip title="Task priority affects assignment and scheduling">
                    <InfoCircleOutlined />
                  </Tooltip>
                </Space>
              }
              rules={[{ required: true, message: 'Please select priority' }]}
            >
              <Select size="large">
                {PRIORITY_OPTIONS.map(priority => (
                  <Option key={priority.value} value={priority.value}>
                    <Space>
                      <Tag color={priority.color}>{priority.label}</Tag>
                      <span className="priority-description">{priority.description}</span>
                    </Space>
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={24}>
            <Form.Item
              name="description"
              label="Description"
              rules={[
                { required: true, message: 'Please enter task description' },
                { min: 10, message: 'Description must be at least 10 characters' }
              ]}
            >
              <TextArea
                rows={4}
                placeholder="Provide a detailed description of what needs to be done, including acceptance criteria and any specific requirements..."
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label={
                <Space>
                  <ClockCircleOutlined />
                  Estimated Time
                </Space>
              }
            >
              <Input.Group compact>
                <Form.Item
                  name="estimatedTime"
                  noStyle
                  rules={[{ required: true, message: 'Please enter estimated time' }]}
                >
                  <InputNumber
                    min={1}
                    max={1000}
                    style={{ width: '60%' }}
                    placeholder="Time"
                  />
                </Form.Item>
                <Form.Item name="timeUnit" noStyle>
                  <Select style={{ width: '40%' }}>
                    <Option value="minutes">Minutes</Option>
                    <Option value="hours">Hours</Option>
                    <Option value="days">Days</Option>
                  </Select>
                </Form.Item>
              </Input.Group>
            </Form.Item>
          </Col>
          
          <Col span={12}>
            <Form.Item
              name="dueDate"
              label="Due Date (Optional)"
            >
              <DatePicker
                style={{ width: '100%' }}
                size="large"
                disabledDate={(current) => current && current < dayjs().startOf('day')}
              />
            </Form.Item>
          </Col>
        </Row>

        <Divider>Dependencies & Relationships</Divider>

        <Row gutter={16}>
          <Col span={24}>
            <Form.Item
              name="dependencies"
              label={
                <Space>
                  <LinkOutlined />
                  Task Dependencies
                  <Tooltip title="Tasks that must be completed before this task can start">
                    <InfoCircleOutlined />
                  </Tooltip>
                </Space>
              }
            >
              <Select
                mode="multiple"
                placeholder="Select tasks that this task depends on"
                optionFilterProp="children"
                showSearch
              >
                {availableTasks.map(task => (
                  <Option key={task.id} value={task.id}>
                    <Space>
                      <Tag color={TASK_TYPES.find(t => t.value === task.type)?.color}>
                        {task.type}
                      </Tag>
                      {task.title}
                    </Space>
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Divider>Requirements & Files</Divider>

        <Row gutter={16}>
          <Col span={24}>
            <Form.Item
              label={
                <Space>
                  Requirements
                  <Button 
                    type="dashed" 
                    size="small" 
                    icon={<PlusOutlined />}
                    onClick={handleAddRequirement}
                  >
                    Add Requirement
                  </Button>
                </Space>
              }
            >
              {requirements.map((requirement, index) => (
                <div key={index} className="requirement-item">
                  <Input.Group compact>
                    <Input
                      style={{ width: 'calc(100% - 32px)' }}
                      placeholder={`Requirement ${index + 1}`}
                      value={requirement}
                      onChange={(e) => handleRequirementChange(index, e.target.value)}
                    />
                    <Button
                      type="text"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={() => handleRemoveRequirement(index)}
                      disabled={requirements.length === 1}
                    />
                  </Input.Group>
                </div>
              ))}
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={24}>
            <Form.Item
              label={
                <Space>
                  <FileOutlined />
                  Related Files
                </Space>
              }
            >
              <div className="file-selection">
                {selectedFiles.map(file => (
                  <Tag
                    key={file}
                    closable
                    onClose={() => handleFileRemove(file)}
                    className="file-tag"
                  >
                    {file}
                  </Tag>
                ))}
                <Button 
                  type="dashed" 
                  size="small"
                  onClick={() => {
                    // TODO: Open file picker
                    message.info('File picker not implemented yet');
                  }}
                >
                  <PlusOutlined /> Add Files
                </Button>
              </div>
            </Form.Item>
          </Col>
        </Row>

        <Divider>Tags & Assignment</Divider>

        <Row gutter={16}>
          <Col span={24}>
            <Form.Item
              name="tags"
              label="Tags"
            >
              <Select
                mode="multiple"
                placeholder="Select or create tags"
                optionFilterProp="children"
              >
                {existingTags.map(tag => (
                  <Option key={tag} value={tag}>{tag}</Option>
                ))}
              </Select>
            </Form.Item>
            
            {/* Custom Tags */}
            <div className="custom-tags">
              <Input.Group compact>
                <Input
                  style={{ width: 'calc(100% - 80px)' }}
                  placeholder="Add custom tag"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onPressEnter={handleAddTag}
                />
                <Button onClick={handleAddTag}>Add</Button>
              </Input.Group>
              
              <div className="tag-list">
                {customTags.map(tag => (
                  <Tag
                    key={tag}
                    closable
                    onClose={() => handleRemoveTag(tag)}
                    color="blue"
                  >
                    {tag}
                  </Tag>
                ))}
              </div>
            </div>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="autoAssign"
              valuePropName="checked"
            >
              <Space>
                <Switch />
                <span>Auto-assign to best available agent</span>
                <Tooltip title="System will automatically assign this task to the most suitable agent">
                  <InfoCircleOutlined />
                </Tooltip>
              </Space>
            </Form.Item>
          </Col>
          
          <Col span={12}>
            <Form.Item
              noStyle
              shouldUpdate={(prevValues, currentValues) => 
                prevValues.autoAssign !== currentValues.autoAssign
              }
            >
              {({ getFieldValue }) => 
                !getFieldValue('autoAssign') && (
                  <Form.Item
                    name="assignedAgent"
                    label="Assign to Agent"
                  >
                    <Select
                      placeholder="Select agent"
                      allowClear
                    >
                      {agents.map(agent => (
                        <Option key={agent.id} value={agent.id}>
                          <Space>
                            <Tag color="blue">{agent.type}</Tag>
                            {agent.name}
                          </Space>
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                )
              }
            </Form.Item>
          </Col>
        </Row>

        <Divider />

        <Row gutter={16}>
          <Col span={24} style={{ textAlign: 'right' }}>
            <Space>
              <Button onClick={onCancel}>
                Cancel
              </Button>
              <Button type="primary" htmlType="submit" size="large">
                Create Task
              </Button>
            </Space>
          </Col>
        </Row>
      </Form>
    </div>
  );
};
/**
 * Task Filter Panel Component
 * Advanced filtering options for task management
 */

import React, { useState } from 'react';
import {
  Form,
  Input,
  Select,
  DatePicker,
  Slider,
  Switch,
  Button,
  Space,
  Divider,
  Card,
  Tag,
  Row,
  Col,
  Checkbox,
  InputNumber
} from 'antd';
import {
  SearchOutlined,
  FilterOutlined,
  ClearOutlined,
  SaveOutlined,
  SettingOutlined
} from '@ant-design/icons';
import { useAppSelector, useAppDispatch } from '../../hooks/redux';
import {
  setFilterStatus,
  setFilterPriority,
  setFilterAssignee,
  setSearchQuery,
  clearFilters
} from '../../store/slices/taskSlice';
import dayjs from 'dayjs';

const { Search } = Input;
const { Option } = Select;
const { RangePicker } = DatePicker;
const CheckboxGroup = Checkbox.Group;

export interface TaskFilterPanelProps {
  onClose: () => void;
}

interface AdvancedFilters {
  search: string;
  status: string[];
  priority: string[];
  assignee: string[];
  dateRange: [dayjs.Dayjs, dayjs.Dayjs] | null;
  tags: string[];
  estimatedTimeRange: [number, number];
  progressRange: [number, number];
  hasFiles: boolean | null;
  hasDependencies: boolean | null;
  isOverdue: boolean;
  createdBy: string[];
  taskTypes: string[];
}

const TASK_STATUSES = [
  { label: 'Pending', value: 'pending', color: 'orange' },
  { label: 'In Progress', value: 'in_progress', color: 'blue' },
  { label: 'Completed', value: 'completed', color: 'green' },
  { label: 'Failed', value: 'failed', color: 'red' },
  { label: 'Blocked', value: 'blocked', color: 'default' }
];

const TASK_PRIORITIES = [
  { label: 'Low', value: 'low', color: '#52c41a' },
  { label: 'Medium', value: 'medium', color: '#faad14' },
  { label: 'High', value: 'high', color: '#fa8c16' },
  { label: 'Critical', value: 'critical', color: '#ff4d4f' }
];

const TASK_TYPES = [
  'frontend', 'backend', 'api', 'database', 'ui', 'testing',
  'documentation', 'review', 'deployment', 'bug-fix', 'feature',
  'refactor', 'research', 'general'
];

export const TaskFilterPanel: React.FC<TaskFilterPanelProps> = ({ onClose }) => {
  const dispatch = useAppDispatch();
  const { tasks, filterStatus, filterPriority, filterAssignee, searchQuery } = useAppSelector(state => state.task);
  const { agents } = useAppSelector(state => state.agent);
  
  const [form] = Form.useForm();
  const [activeFilters, setActiveFilters] = useState<AdvancedFilters>({
    search: searchQuery,
    status: filterStatus === 'all' ? [] : [filterStatus],
    priority: filterPriority === 'all' ? [] : [filterPriority],
    assignee: filterAssignee === 'all' ? [] : [filterAssignee],
    dateRange: null,
    tags: [],
    estimatedTimeRange: [0, 24], // hours
    progressRange: [0, 100],
    hasFiles: null,
    hasDependencies: null,
    isOverdue: false,
    createdBy: [],
    taskTypes: []
  });

  // Get unique values from tasks for filter options
  const uniqueTags = Array.from(new Set(tasks.flatMap(task => task.tags)));
  const uniqueCreators = Array.from(new Set(tasks.map(task => task.createdBy).filter(Boolean)));
  const uniqueAssignees = Array.from(new Set(tasks.map(task => task.assignedAgent).filter(Boolean)));

  const handleApplyFilters = () => {
    // Apply filters to Redux store
    dispatch(setSearchQuery(activeFilters.search));
    dispatch(setFilterStatus(activeFilters.status.length === 1 ? activeFilters.status[0] as any : 'all'));
    dispatch(setFilterPriority(activeFilters.priority.length === 1 ? activeFilters.priority[0] as any : 'all'));
    dispatch(setFilterAssignee(activeFilters.assignee.length === 1 ? activeFilters.assignee[0] : 'all'));
    
    // TODO: Apply other advanced filters
    onClose();
  };

  const handleClearFilters = () => {
    setActiveFilters({
      search: '',
      status: [],
      priority: [],
      assignee: [],
      dateRange: null,
      tags: [],
      estimatedTimeRange: [0, 24],
      progressRange: [0, 100],
      hasFiles: null,
      hasDependencies: null,
      isOverdue: false,
      createdBy: [],
      taskTypes: []
    });
    
    dispatch(clearFilters());
    form.resetFields();
  };

  const handleSaveFilterPreset = () => {
    // TODO: Implement filter preset saving
    console.log('Save filter preset:', activeFilters);
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (activeFilters.search) count++;
    if (activeFilters.status.length > 0) count++;
    if (activeFilters.priority.length > 0) count++;
    if (activeFilters.assignee.length > 0) count++;
    if (activeFilters.dateRange) count++;
    if (activeFilters.tags.length > 0) count++;
    if (activeFilters.estimatedTimeRange[0] > 0 || activeFilters.estimatedTimeRange[1] < 24) count++;
    if (activeFilters.progressRange[0] > 0 || activeFilters.progressRange[1] < 100) count++;
    if (activeFilters.hasFiles !== null) count++;
    if (activeFilters.hasDependencies !== null) count++;
    if (activeFilters.isOverdue) count++;
    if (activeFilters.createdBy.length > 0) count++;
    if (activeFilters.taskTypes.length > 0) count++;
    return count;
  };

  return (
    <div className="task-filter-panel">
      <div className="filter-header">
        <div className="header-title">
          <FilterOutlined />
          <span>Advanced Filters</span>
          {getActiveFilterCount() > 0 && (
            <Tag color="blue">{getActiveFilterCount()} active</Tag>
          )}
        </div>
      </div>

      <Form
        form={form}
        layout="vertical"
        initialValues={activeFilters}
        onValuesChange={(changedValues, allValues) => {
          setActiveFilters({ ...activeFilters, ...changedValues });
        }}
      >
        {/* Search */}
        <Card size="small" title="Search & Text" className="filter-section">
          <Form.Item name="search" label="Search Tasks">
            <Search
              placeholder="Search in title, description, tags..."
              allowClear
              value={activeFilters.search}
              onChange={(e) => setActiveFilters(prev => ({ ...prev, search: e.target.value }))}
            />
          </Form.Item>
        </Card>

        {/* Status & Priority */}
        <Card size="small" title="Status & Priority" className="filter-section">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="status" label="Status">
                <CheckboxGroup
                  options={TASK_STATUSES.map(status => ({
                    label: <Tag color={status.color}>{status.label}</Tag>,
                    value: status.value
                  }))}
                  value={activeFilters.status}
                  onChange={(values: string[]) => setActiveFilters(prev => ({ ...prev, status: values }))}
                />
              </Form.Item>
            </Col>
            
            <Col span={12}>
              <Form.Item name="priority" label="Priority">
                <CheckboxGroup
                  options={TASK_PRIORITIES.map(priority => ({
                    label: <Tag color={priority.color}>{priority.label}</Tag>,
                    value: priority.value
                  }))}
                  value={activeFilters.priority}
                  onChange={(values: string[]) => setActiveFilters(prev => ({ ...prev, priority: values }))}
                />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* Assignment */}
        <Card size="small" title="Assignment" className="filter-section">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="assignee" label="Assigned Agent">
                <Select
                  mode="multiple"
                  placeholder="Select agents"
                  allowClear
                  value={activeFilters.assignee}
                  onChange={(values) => setActiveFilters(prev => ({ ...prev, assignee: values }))}
                >
                  <Option value="unassigned">
                    <Tag color="default">Unassigned</Tag>
                  </Option>
                  {uniqueAssignees.map(agent => (
                    <Option key={agent} value={agent}>
                      <Tag color="blue">{agent}</Tag>
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            
            <Col span={12}>
              <Form.Item name="createdBy" label="Created By">
                <Select
                  mode="multiple"
                  placeholder="Select creators"
                  allowClear
                  value={activeFilters.createdBy}
                  onChange={(values) => setActiveFilters(prev => ({ ...prev, createdBy: values }))}
                >
                  {uniqueCreators.map(creator => (
                    <Option key={creator} value={creator}>
                      {creator}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* Dates */}
        <Card size="small" title="Dates" className="filter-section">
          <Form.Item name="dateRange" label="Created Date Range">
            <RangePicker
              style={{ width: '100%' }}
              value={activeFilters.dateRange}
              onChange={(dates) => setActiveFilters(prev => ({ ...prev, dateRange: dates as [dayjs.Dayjs, dayjs.Dayjs] | null }))}
            />
          </Form.Item>
          
          <Form.Item name="isOverdue" valuePropName="checked">
            <Checkbox
              checked={activeFilters.isOverdue}
              onChange={(e) => setActiveFilters(prev => ({ ...prev, isOverdue: e.target.checked }))}
            >
              Show only overdue tasks
            </Checkbox>
          </Form.Item>
        </Card>

        {/* Task Properties */}
        <Card size="small" title="Task Properties" className="filter-section">
          <Form.Item name="taskTypes" label="Task Types">
            <Select
              mode="multiple"
              placeholder="Select task types"
              allowClear
              value={activeFilters.taskTypes}
              onChange={(values) => setActiveFilters(prev => ({ ...prev, taskTypes: values }))}
            >
              {TASK_TYPES.map(type => (
                <Option key={type} value={type}>
                  <Tag>{type}</Tag>
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item name="tags" label="Tags">
            <Select
              mode="multiple"
              placeholder="Select tags"
              allowClear
              value={activeFilters.tags}
              onChange={(values) => setActiveFilters(prev => ({ ...prev, tags: values }))}
            >
              {uniqueTags.map(tag => (
                <Option key={tag} value={tag}>
                  <Tag color="blue">{tag}</Tag>
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Card>

        {/* Time & Progress */}
        <Card size="small" title="Time & Progress" className="filter-section">
          <Form.Item label="Estimated Time (hours)">
            <Slider
              range
              min={0}
              max={48}
              value={activeFilters.estimatedTimeRange}
              onChange={(values) => setActiveFilters(prev => ({ ...prev, estimatedTimeRange: values as [number, number] }))}
              marks={{
                0: '0h',
                8: '8h',
                16: '16h',
                24: '1d',
                48: '2d'
              }}
            />
          </Form.Item>

          <Form.Item label="Progress (%)">
            <Slider
              range
              min={0}
              max={100}
              value={activeFilters.progressRange}
              onChange={(values) => setActiveFilters(prev => ({ ...prev, progressRange: values as [number, number] }))}
              marks={{
                0: '0%',
                25: '25%',
                50: '50%',
                75: '75%',
                100: '100%'
              }}
            />
          </Form.Item>
        </Card>

        {/* File & Dependencies */}
        <Card size="small" title="Relationships" className="filter-section">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Has Files">
                <Select
                  placeholder="Any"
                  allowClear
                  value={activeFilters.hasFiles}
                  onChange={(value) => setActiveFilters(prev => ({ ...prev, hasFiles: value }))}
                >
                  <Option value={true}>Yes</Option>
                  <Option value={false}>No</Option>
                </Select>
              </Form.Item>
            </Col>
            
            <Col span={12}>
              <Form.Item label="Has Dependencies">
                <Select
                  placeholder="Any"
                  allowClear
                  value={activeFilters.hasDependencies}
                  onChange={(value) => setActiveFilters(prev => ({ ...prev, hasDependencies: value }))}
                >
                  <Option value={true}>Yes</Option>
                  <Option value={false}>No</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
        </Card>
      </Form>

      {/* Actions */}
      <div className="filter-actions">
        <Space>
          <Button 
            icon={<ClearOutlined />}
            onClick={handleClearFilters}
          >
            Clear All
          </Button>
          
          <Button 
            icon={<SaveOutlined />}
            onClick={handleSaveFilterPreset}
          >
            Save Preset
          </Button>
          
          <Button onClick={onClose}>
            Cancel
          </Button>
          
          <Button 
            type="primary" 
            icon={<FilterOutlined />}
            onClick={handleApplyFilters}
          >
            Apply Filters ({getActiveFilterCount()})
          </Button>
        </Space>
      </div>
    </div>
  );
};
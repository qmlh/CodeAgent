/**
 * Task List View Component
 * Displays tasks in a detailed list format with sorting and filtering
 */

import React, { useState, useMemo } from 'react';
import { 
  Table, 
  Tag, 
  Progress, 
  Avatar, 
  Button, 
  Dropdown, 
  Menu,
  Space,
  Tooltip,
  Badge,
  Input,
  Select,
  DatePicker
} from 'antd';
import type { ColumnsType, TableProps } from 'antd/es/table';
import {
  UserOutlined,
  MoreOutlined,
  FlagOutlined,
  ClockCircleOutlined,
  CalendarOutlined,
  FileOutlined,
  LinkOutlined,
  SearchOutlined,
  FilterOutlined,
  SortAscendingOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';

dayjs.extend(isBetween);
import { Task } from '../../store/slices/taskSlice';
import { useAppDispatch } from '../../hooks/redux';
import { updateTaskStatus } from '../../store/slices/taskSlice';

const { Search } = Input;
const { Option } = Select;
const { RangePicker } = DatePicker;

export interface TaskListViewProps {
  tasks: Task[];
  onAssignTask: (taskId: string) => void;
}

interface FilterState {
  search: string;
  status: Task['status'] | 'all';
  priority: Task['priority'] | 'all';
  assignee: string | 'all';
  dateRange: [dayjs.Dayjs, dayjs.Dayjs] | null;
  tags: string[];
}

export const TaskListView: React.FC<TaskListViewProps> = ({ tasks, onAssignTask }) => {
  const dispatch = useAppDispatch();
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    status: 'all',
    priority: 'all',
    assignee: 'all',
    dateRange: null,
    tags: []
  });

  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesSearch = 
          task.title.toLowerCase().includes(searchLower) ||
          task.description.toLowerCase().includes(searchLower) ||
          task.type.toLowerCase().includes(searchLower) ||
          task.tags.some(tag => tag.toLowerCase().includes(searchLower));
        
        if (!matchesSearch) return false;
      }

      // Status filter
      if (filters.status !== 'all' && task.status !== filters.status) {
        return false;
      }

      // Priority filter
      if (filters.priority !== 'all' && task.priority !== filters.priority) {
        return false;
      }

      // Assignee filter
      if (filters.assignee !== 'all') {
        if (filters.assignee === 'unassigned' && task.assignedAgent) {
          return false;
        }
        if (filters.assignee !== 'unassigned' && task.assignedAgent !== filters.assignee) {
          return false;
        }
      }

      // Date range filter
      if (filters.dateRange) {
        const [start, end] = filters.dateRange;
        const taskDate = dayjs(task.createdAt);
        if (!taskDate.isBetween(start, end, 'day', '[]')) {
          return false;
        }
      }

      // Tags filter
      if (filters.tags.length > 0) {
        const hasMatchingTag = filters.tags.some(tag => task.tags.includes(tag));
        if (!hasMatchingTag) return false;
      }

      return true;
    });
  }, [tasks, filters]);

  const getPriorityColor = (priority: Task['priority']) => {
    switch (priority) {
      case 'critical': return '#ff4d4f';
      case 'high': return '#fa8c16';
      case 'medium': return '#faad14';
      case 'low': return '#52c41a';
      default: return '#d9d9d9';
    }
  };

  const getStatusColor = (status: Task['status']) => {
    switch (status) {
      case 'pending': return 'orange';
      case 'in_progress': return 'blue';
      case 'completed': return 'green';
      case 'failed': return 'red';
      case 'blocked': return 'default';
      default: return 'default';
    }
  };

  const formatDuration = (milliseconds: number) => {
    const hours = Math.floor(milliseconds / (1000 * 60 * 60));
    const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const getTaskMenu = (task: Task) => (
    <Menu>
      <Menu.Item key="assign" onClick={() => onAssignTask(task.id)}>
        {task.assignedAgent ? 'Reassign Task' : 'Assign Task'}
      </Menu.Item>
      <Menu.Item key="edit">
        Edit Task
      </Menu.Item>
      <Menu.Item key="duplicate">
        Duplicate Task
      </Menu.Item>
      <Menu.Divider />
      <Menu.Item key="start" disabled={task.status !== 'pending'}>
        Start Task
      </Menu.Item>
      <Menu.Item key="complete" disabled={task.status !== 'in_progress'}>
        Mark Complete
      </Menu.Item>
      <Menu.Item key="block">
        Block Task
      </Menu.Item>
      <Menu.Divider />
      <Menu.Item key="delete" danger>
        Delete Task
      </Menu.Item>
    </Menu>
  );

  const handleStatusChange = (taskId: string, newStatus: Task['status']) => {
    dispatch(updateTaskStatus({ taskId, status: newStatus }));
  };

  const columns: ColumnsType<Task> = [
    {
      title: 'Task',
      dataIndex: 'title',
      key: 'title',
      width: 300,
      render: (title: string, record: Task) => (
        <div className="task-cell">
          <div className="task-title">
            <Tooltip title={record.description}>
              <strong>{title}</strong>
            </Tooltip>
          </div>
          <div className="task-meta">
            <Space size="small">
              <Tag>{record.type}</Tag>
              {record.tags.slice(0, 2).map(tag => (
                <Tag key={tag} color="blue">{tag}</Tag>
              ))}
              {record.tags.length > 2 && (
                <Tag>+{record.tags.length - 2}</Tag>
              )}
            </Space>
          </div>
        </div>
      ),
      sorter: (a, b) => a.title.localeCompare(b.title),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: Task['status']) => (
        <Tag color={getStatusColor(status)}>
          {status.replace('_', ' ').toUpperCase()}
        </Tag>
      ),
      filters: [
        { text: 'Pending', value: 'pending' },
        { text: 'In Progress', value: 'in_progress' },
        { text: 'Completed', value: 'completed' },
        { text: 'Failed', value: 'failed' },
        { text: 'Blocked', value: 'blocked' },
      ],
      onFilter: (value, record) => record.status === value,
      sorter: (a, b) => a.status.localeCompare(b.status),
    },
    {
      title: 'Priority',
      dataIndex: 'priority',
      key: 'priority',
      width: 100,
      render: (priority: Task['priority']) => (
        <Tag 
          color={getPriorityColor(priority)}
          icon={<FlagOutlined />}
        >
          {priority.toUpperCase()}
        </Tag>
      ),
      filters: [
        { text: 'Critical', value: 'critical' },
        { text: 'High', value: 'high' },
        { text: 'Medium', value: 'medium' },
        { text: 'Low', value: 'low' },
      ],
      onFilter: (value, record) => record.priority === value,
      sorter: (a, b) => {
        const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      },
    },
    {
      title: 'Assignee',
      dataIndex: 'assignedAgent',
      key: 'assignedAgent',
      width: 150,
      render: (assignedAgent: string | undefined, record: Task) => (
        assignedAgent ? (
          <Tooltip title={assignedAgent}>
            <Space>
              <Avatar size="small" icon={<UserOutlined />}>
                {assignedAgent.charAt(0).toUpperCase()}
              </Avatar>
              <span>{assignedAgent.length > 10 ? `${assignedAgent.substring(0, 10)}...` : assignedAgent}</span>
            </Space>
          </Tooltip>
        ) : (
          <Button 
            size="small" 
            type="dashed"
            onClick={() => onAssignTask(record.id)}
          >
            Assign
          </Button>
        )
      ),
      sorter: (a, b) => (a.assignedAgent || '').localeCompare(b.assignedAgent || ''),
    },
    {
      title: 'Progress',
      dataIndex: 'progress',
      key: 'progress',
      width: 120,
      render: (progress: number, record: Task) => (
        <div className="progress-cell">
          <Progress 
            percent={progress} 
            size="small"
            strokeColor={getPriorityColor(record.priority)}
          />
        </div>
      ),
      sorter: (a, b) => a.progress - b.progress,
    },
    {
      title: 'Time',
      key: 'time',
      width: 120,
      render: (_, record: Task) => (
        <div className="time-cell">
          <Tooltip title="Estimated Time">
            <div className="time-item">
              <ClockCircleOutlined />
              <span>{formatDuration(record.estimatedTime)}</span>
            </div>
          </Tooltip>
          {record.actualTime && (
            <Tooltip title="Actual Time">
              <div className="time-item actual">
                <span>{formatDuration(record.actualTime)}</span>
              </div>
            </Tooltip>
          )}
        </div>
      ),
      sorter: (a, b) => a.estimatedTime - b.estimatedTime,
    },
    {
      title: 'Created',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 120,
      render: (createdAt: Date) => (
        <Tooltip title={dayjs(createdAt).format('YYYY-MM-DD HH:mm:ss')}>
          <div className="date-cell">
            <CalendarOutlined />
            <span>{dayjs(createdAt).format('MMM DD')}</span>
          </div>
        </Tooltip>
      ),
      sorter: (a, b) => dayjs(a.createdAt).unix() - dayjs(b.createdAt).unix(),
    },
    {
      title: 'Dependencies',
      dataIndex: 'dependencies',
      key: 'dependencies',
      width: 100,
      render: (dependencies: string[]) => (
        dependencies.length > 0 ? (
          <Tooltip title={`${dependencies.length} dependencies`}>
            <Badge count={dependencies.length} size="small">
              <LinkOutlined />
            </Badge>
          </Tooltip>
        ) : null
      ),
    },
    {
      title: 'Files',
      dataIndex: 'files',
      key: 'files',
      width: 80,
      render: (files: string[]) => (
        files.length > 0 ? (
          <Tooltip title={`${files.length} files`}>
            <Badge count={files.length} size="small">
              <FileOutlined />
            </Badge>
          </Tooltip>
        ) : null
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 80,
      fixed: 'right',
      render: (_, record: Task) => (
        <Dropdown overlay={getTaskMenu(record)} trigger={['click']}>
          <Button type="text" size="small" icon={<MoreOutlined />} />
        </Dropdown>
      ),
    },
  ];

  const rowSelection: TableProps<Task>['rowSelection'] = {
    selectedRowKeys,
    onChange: (keys) => setSelectedRowKeys(keys as string[]),
    selections: [
      Table.SELECTION_ALL,
      Table.SELECTION_INVERT,
      Table.SELECTION_NONE,
    ],
  };

  const handleBulkAction = (action: string) => {
    selectedRowKeys.forEach(taskId => {
      switch (action) {
        case 'start':
          handleStatusChange(taskId, 'in_progress');
          break;
        case 'complete':
          handleStatusChange(taskId, 'completed');
          break;
        case 'block':
          handleStatusChange(taskId, 'blocked');
          break;
      }
    });
    setSelectedRowKeys([]);
  };

  const bulkActionMenu = (
    <Menu>
      <Menu.Item key="start" onClick={() => handleBulkAction('start')}>
        Start Selected
      </Menu.Item>
      <Menu.Item key="complete" onClick={() => handleBulkAction('complete')}>
        Complete Selected
      </Menu.Item>
      <Menu.Item key="block" onClick={() => handleBulkAction('block')}>
        Block Selected
      </Menu.Item>
      <Menu.Divider />
      <Menu.Item key="delete" danger>
        Delete Selected
      </Menu.Item>
    </Menu>
  );

  return (
    <div className="task-list-view">
      {/* Filters */}
      <div className="list-filters">
        <Space wrap>
          <Search
            placeholder="Search tasks..."
            value={filters.search}
            onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
            style={{ width: 250 }}
            allowClear
          />
          
          <Select
            value={filters.status}
            onChange={(status) => setFilters(prev => ({ ...prev, status }))}
            style={{ width: 120 }}
            placeholder="Status"
          >
            <Option value="all">All Status</Option>
            <Option value="pending">Pending</Option>
            <Option value="in_progress">In Progress</Option>
            <Option value="completed">Completed</Option>
            <Option value="failed">Failed</Option>
            <Option value="blocked">Blocked</Option>
          </Select>
          
          <Select
            value={filters.priority}
            onChange={(priority) => setFilters(prev => ({ ...prev, priority }))}
            style={{ width: 120 }}
            placeholder="Priority"
          >
            <Option value="all">All Priority</Option>
            <Option value="critical">Critical</Option>
            <Option value="high">High</Option>
            <Option value="medium">Medium</Option>
            <Option value="low">Low</Option>
          </Select>
          
          <Select
            value={filters.assignee}
            onChange={(assignee) => setFilters(prev => ({ ...prev, assignee }))}
            style={{ width: 150 }}
            placeholder="Assignee"
          >
            <Option value="all">All Assignees</Option>
            <Option value="unassigned">Unassigned</Option>
            {/* Add dynamic assignee options */}
          </Select>
          
          <RangePicker
            value={filters.dateRange}
            onChange={(dateRange) => setFilters(prev => ({ ...prev, dateRange: dateRange ? [dateRange[0]!, dateRange[1]!] : null }))}
            placeholder={['Start Date', 'End Date']}
          />
          
          <Button 
            icon={<FilterOutlined />}
            onClick={() => setFilters({
              search: '',
              status: 'all',
              priority: 'all',
              assignee: 'all',
              dateRange: null,
              tags: []
            })}
          >
            Clear Filters
          </Button>
        </Space>
      </div>

      {/* Bulk Actions */}
      {selectedRowKeys.length > 0 && (
        <div className="bulk-actions">
          <Space>
            <span>{selectedRowKeys.length} tasks selected</span>
            <Dropdown overlay={bulkActionMenu}>
              <Button>Bulk Actions</Button>
            </Dropdown>
          </Space>
        </div>
      )}

      {/* Table */}
      <Table<Task>
        columns={columns}
        dataSource={filteredTasks}
        rowKey="id"
        rowSelection={rowSelection}
        pagination={{
          total: filteredTasks.length,
          pageSize: 50,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} tasks`,
        }}
        scroll={{ x: 1200 }}
        size="small"
        className="task-table"
      />
    </div>
  );
};
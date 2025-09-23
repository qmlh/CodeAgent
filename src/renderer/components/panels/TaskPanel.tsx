/**
 * Task Panel Component
 * Displays and manages tasks in the sidebar
 */

import React, { useState } from 'react';
import { 
  List, 
  Button, 
  Badge, 
  Dropdown, 
  Menu, 
  Progress, 
  Tag, 
  Input,
  Select,
  Space
} from 'antd';
import { 
  PlusOutlined, 
  MoreOutlined, 
  PlayCircleOutlined,
  PauseCircleOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import { useAppSelector, useAppDispatch } from '../../hooks/redux';
import { updateTaskStatus, Task } from '../../store/slices/taskSlice';

type TaskStatus = Task['status'];
type TaskPriority = Task['priority'];

const { Search } = Input;
const { Option } = Select;

export const TaskPanel: React.FC = () => {
  const dispatch = useAppDispatch();
  const { tasks } = useAppSelector(state => state.task);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<TaskStatus | 'all'>('all');
  const [filterPriority, setFilterPriority] = useState<TaskPriority | 'all'>('all');

  // Filter tasks based on search and filters
  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || task.status === filterStatus;
    const matchesPriority = filterPriority === 'all' || task.priority === filterPriority;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const getStatusIcon = (status: TaskStatus) => {
    switch (status) {
      case 'pending':
        return <ClockCircleOutlined style={{ color: '#faad14' }} />;
      case 'in_progress':
        return <PlayCircleOutlined style={{ color: '#1890ff' }} />;
      case 'completed':
        return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
      case 'failed':
        return <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />;
      case 'blocked':
        return <PauseCircleOutlined style={{ color: '#d9d9d9' }} />;
      default:
        return <ClockCircleOutlined />;
    }
  };

  const getPriorityColor = (priority: TaskPriority) => {
    switch (priority) {
      case 'critical': return '#ff4d4f';
      case 'high': return '#fa8c16';
      case 'medium': return '#faad14';
      case 'low': return '#52c41a';
      default: return '#d9d9d9';
    }
  };

  const getPriorityText = (priority: TaskPriority) => {
    switch (priority) {
      case 'critical': return 'Critical';
      case 'high': return 'High';
      case 'medium': return 'Medium';
      case 'low': return 'Low';
      default: return 'Unknown';
    }
  };

  const handleTaskAction = (taskId: string, action: string) => {
    switch (action) {
      case 'start':
        dispatch(updateTaskStatus({ taskId, status: 'in_progress' }));
        break;
      case 'complete':
        dispatch(updateTaskStatus({ taskId, status: 'completed' }));
        break;
      case 'pause':
        dispatch(updateTaskStatus({ taskId, status: 'blocked' }));
        break;
      case 'reset':
        dispatch(updateTaskStatus({ taskId, status: 'pending' }));
        break;
    }
  };

  const getTaskMenu = (task: any) => (
    <Menu>
      {task.status === 'pending' && (
        <Menu.Item 
          key="start" 
          icon={<PlayCircleOutlined />}
          onClick={() => handleTaskAction(task.id, 'start')}
        >
          Start Task
        </Menu.Item>
      )}
      {task.status === 'in_progress' && (
        <>
          <Menu.Item 
            key="complete" 
            icon={<CheckCircleOutlined />}
            onClick={() => handleTaskAction(task.id, 'complete')}
          >
            Mark Complete
          </Menu.Item>
          <Menu.Item 
            key="pause" 
            icon={<PauseCircleOutlined />}
            onClick={() => handleTaskAction(task.id, 'pause')}
          >
            Pause Task
          </Menu.Item>
        </>
      )}
      {(task.status === 'completed' || task.status === 'failed' || task.status === 'blocked') && (
        <Menu.Item 
          key="reset" 
          icon={<ClockCircleOutlined />}
          onClick={() => handleTaskAction(task.id, 'reset')}
        >
          Reset Task
        </Menu.Item>
      )}
      <Menu.Divider />
      <Menu.Item key="edit">Edit Task</Menu.Item>
      <Menu.Item key="delete" danger>Delete Task</Menu.Item>
    </Menu>
  );

  const handleCreateTask = () => {
    // TODO: Open task creation modal
    console.log('Create new task');
  };

  return (
    <div className="task-panel">
      {/* Panel Header */}
      <div className="panel-header">
        <div className="panel-title">
          Tasks
          <Badge count={tasks.length} style={{ marginLeft: 8 }} />
        </div>
        <Button 
          type="text" 
          size="small" 
          icon={<PlusOutlined />}
          onClick={handleCreateTask}
          title="Create Task"
        />
      </div>

      {/* Filters */}
      <div className="panel-filters">
        <Search
          placeholder="Search tasks..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ marginBottom: 8 }}
          size="small"
        />
        
        <Space style={{ width: '100%', marginBottom: 8 }}>
          <Select
            size="small"
            value={filterStatus}
            onChange={setFilterStatus}
            style={{ flex: 1 }}
          >
            <Option value="all">All Status</Option>
            <Option value="pending">Pending</Option>
            <Option value="in_progress">In Progress</Option>
            <Option value="completed">Completed</Option>
            <Option value="failed">Failed</Option>
            <Option value="blocked">Blocked</Option>
          </Select>
          
          <Select
            size="small"
            value={filterPriority}
            onChange={setFilterPriority}
            style={{ flex: 1 }}
          >
            <Option value="all">All Priority</Option>
            <Option value="critical">Critical</Option>
            <Option value="high">High</Option>
            <Option value="medium">Medium</Option>
            <Option value="low">Low</Option>
          </Select>
        </Space>
      </div>

      {/* Task List */}
      <div className="panel-content">
        <List
          size="small"
          dataSource={filteredTasks}
          renderItem={(task) => (
            <List.Item
              className="task-item"
              actions={[
                <Dropdown overlay={getTaskMenu(task)} trigger={['click']}>
                  <Button type="text" size="small" icon={<MoreOutlined />} />
                </Dropdown>
              ]}
            >
              <List.Item.Meta
                avatar={getStatusIcon(task.status)}
                title={
                  <div className="task-title">
                    <span>{task.title}</span>
                    <Tag 
                      color={getPriorityColor(task.priority)}
                    >
                      {getPriorityText(task.priority)}
                    </Tag>
                  </div>
                }
                description={
                  <div className="task-description">
                    <div className="task-desc-text">{task.description}</div>
                    {task.assignedAgent && (
                      <div className="task-agent">
                        Assigned to: {task.assignedAgent}
                      </div>
                    )}
                    {task.estimatedTime > 0 && (
                      <div className="task-progress">
                        <Progress 
                          percent={task.status === 'completed' ? 100 : 
                                  task.status === 'in_progress' ? 50 : 0}
                          size="small"
                          showInfo={false}
                        />
                      </div>
                    )}
                  </div>
                }
              />
            </List.Item>
          )}
        />
      </div>
    </div>
  );
};
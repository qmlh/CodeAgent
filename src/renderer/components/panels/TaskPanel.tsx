/**
 * Task Panel Component
 * Displays and manages tasks in the sidebar
 */

import React, { useState, useEffect } from 'react';
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
  Space,
  Modal,
  message
} from 'antd';
import { 
  PlusOutlined, 
  MoreOutlined, 
  PlayCircleOutlined,
  PauseCircleOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  AppstoreOutlined
} from '@ant-design/icons';
import { useAppSelector, useAppDispatch } from '../../hooks/redux';
import { updateTaskStatus, loadTasks, Task } from '../../store/slices/taskSlice';
import { TaskManagementView } from '../tasks/TaskManagementView';
import { serviceIntegrationManager } from '../../services/ServiceIntegrationManager';

type TaskStatus = Task['status'];
type TaskPriority = Task['priority'];

const { Search } = Input;
const { Option } = Select;

export const TaskPanel: React.FC = () => {
  const dispatch = useAppDispatch();
  const { tasks, status } = useAppSelector(state => state.task);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<TaskStatus | 'all'>('all');
  const [filterPriority, setFilterPriority] = useState<TaskPriority | 'all'>('all');
  const [showTaskManagement, setShowTaskManagement] = useState(false);

  // Load tasks on component mount
  useEffect(() => {
    if (serviceIntegrationManager.isReady()) {
      dispatch(loadTasks());
    }
  }, [dispatch]);

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

  const handleTaskAction = async (taskId: string, action: string) => {
    if (!serviceIntegrationManager.isReady()) {
      message.warning('Service integration not ready. Please wait...');
      return;
    }

    try {
      switch (action) {
        case 'start':
          dispatch(updateTaskStatus({ taskId, status: 'in_progress' }));
          await serviceIntegrationManager.executeTask(taskId);
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
    } catch (error) {
      message.error(`Failed to ${action} task: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
    if (!serviceIntegrationManager.isReady()) {
      message.warning('Service integration not ready. Please wait...');
      return;
    }
    setShowTaskManagement(true);
  };

  const handleOpenTaskManagement = () => {
    setShowTaskManagement(true);
  };

  return (
    <div className="task-panel">
      {/* Panel Header */}
      <div className="panel-header">
        <div className="panel-title">
          任务
          <Badge count={tasks.length} style={{ marginLeft: 8 }} />
        </div>
        <Space>
          <Button 
            type="text" 
            size="small"
            icon={<PlusOutlined />}
            onClick={handleCreateTask}
            title="创建任务"
          />
          <Button 
            type="text" 
            size="small"
            icon={<AppstoreOutlined />}
            onClick={handleOpenTaskManagement}
            title="打开任务管理"
          />
        </Space>
      </div>

      {/* Filters */}
      <div className="panel-filters">
        <Search
          placeholder="搜索任务..."
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
            <Option value="all">全部状态</Option>
            <Option value="pending">待办</Option>
            <Option value="in_progress">进行中</Option>
            <Option value="completed">已完成</Option>
            <Option value="failed">失败</Option>
            <Option value="blocked">阻塞</Option>
          </Select>
          
          <Select
            size="small"
            value={filterPriority}
            onChange={setFilterPriority}
            style={{ flex: 1 }}
          >
            <Option value="all">全部优先级</Option>
            <Option value="critical">关键</Option>
            <Option value="high">高</Option>
            <Option value="medium">中</Option>
            <Option value="low">低</Option>
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
                <Dropdown menu={{ items: getTaskMenu(task).props.children.filter((item: any) => item.type !== Menu.Divider).map((item: any) => ({
                  key: item.key,
                  icon: item.props.icon,
                  label: item.props.children,
                  onClick: item.props.onClick,
                  danger: item.props.danger
                })) }} trigger={['click']}>
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

      {/* Task Management Modal */}
      <Modal
        title="任务管理"
        open={showTaskManagement}
        onCancel={() => setShowTaskManagement(false)}
        footer={null}
        width="95vw"
        style={{ top: 20 }}
        styles={{ body: { height: '80vh', padding: 0 } }}
      >
        <TaskManagementView />
      </Modal>
    </div>
  );
};
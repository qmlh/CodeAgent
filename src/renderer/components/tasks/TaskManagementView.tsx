/**
 * Task Management View Component
 * Main container for task management interface with multiple views
 */

import React, { useState, useEffect } from 'react';
import { 
  Tabs, 
  Button, 
  Space, 
  Modal, 
  message,
  Dropdown,
  Menu
} from 'antd';
import {
  AppstoreOutlined,
  BarsOutlined,
  PlusOutlined,
  SettingOutlined,
  FilterOutlined,
  SortAscendingOutlined
} from '@ant-design/icons';
import { useAppSelector, useAppDispatch } from '../../hooks/redux';
import { loadTasks, createTask } from '../../store/slices/taskSlice';
import { TaskKanbanView } from './TaskKanbanView';
import { TaskGanttView } from './TaskGanttView';
import { TaskListView } from './TaskListView';
import { TaskCreateForm } from './TaskCreateForm';
import { TaskAssignmentModal } from './TaskAssignmentModal';
import { TaskFilterPanel } from './TaskFilterPanel';
import './task-management.css';

const { TabPane } = Tabs;

export interface TaskManagementViewProps {
  className?: string;
}

export const TaskManagementView: React.FC<TaskManagementViewProps> = ({ className }) => {
  const dispatch = useAppDispatch();
  const { tasks, status, error } = useAppSelector(state => state.task);
  
  const [activeTab, setActiveTab] = useState<string>('kanban');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [selectedTaskForAssignment, setSelectedTaskForAssignment] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'idle') {
      dispatch(loadTasks());
    }
  }, [dispatch, status]);

  useEffect(() => {
    if (error) {
      message.error(error);
    }
  }, [error]);

  const handleCreateTask = async (taskData: any) => {
    try {
      await dispatch(createTask(taskData)).unwrap();
      message.success('Task created successfully');
      setShowCreateModal(false);
    } catch (error) {
      message.error('Failed to create task');
    }
  };

  const handleAssignTask = (taskId: string) => {
    setSelectedTaskForAssignment(taskId);
    setShowAssignmentModal(true);
  };

  const handleAssignmentComplete = () => {
    setShowAssignmentModal(false);
    setSelectedTaskForAssignment(null);
    message.success('Task assigned successfully');
  };

  const viewMenu = (
    <Menu>
      <Menu.Item key="kanban" icon={<AppstoreOutlined />} onClick={() => setActiveTab('kanban')}>
        看板视图
      </Menu.Item>
      <Menu.Item key="gantt" icon={<BarsOutlined />} onClick={() => setActiveTab('gantt')}>
        甘特图
      </Menu.Item>
      <Menu.Item key="list" icon={<BarsOutlined />} onClick={() => setActiveTab('list')}>
        列表视图
      </Menu.Item>
    </Menu>
  );

  const actionMenu = (
    <Menu>
      <Menu.Item key="filter" icon={<FilterOutlined />} onClick={() => setShowFilterPanel(true)}>
        高级筛选
      </Menu.Item>
      <Menu.Item key="sort" icon={<SortAscendingOutlined />}>
        排序选项
      </Menu.Item>
      <Menu.Divider />
      <Menu.Item key="settings" icon={<SettingOutlined />}>
        视图设置
      </Menu.Item>
    </Menu>
  );

  return (
    <div className={`task-management-view ${className || ''}`}>
      {/* Header */}
      <div className="task-management-header">
        <div className="header-left">
          <h2>任务管理</h2>
          <span className="task-count">{tasks.length} 个任务</span>
        </div>
        
        <div className="header-right">
          <Space>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setShowCreateModal(true)}
            >
              创建任务
            </Button>
            
            <Dropdown menu={{ items: viewMenu.props.children.map((item: any) => ({
              key: item.key,
              icon: item.props.icon,
              label: item.props.children,
              onClick: item.props.onClick
            })) }} placement="bottomRight">
              <Button icon={<AppstoreOutlined />}>
                视图
              </Button>
            </Dropdown>
            
            <Dropdown menu={{ items: actionMenu.props.children.filter((item: any) => item.type !== Menu.Divider).map((item: any) => ({
              key: item.key,
              icon: item.props.icon,
              label: item.props.children,
              onClick: item.props.onClick
            })) }} placement="bottomRight">
              <Button icon={<SettingOutlined />}>
                操作
              </Button>
            </Dropdown>
          </Space>
        </div>
      </div>

      {/* Main Content */}
      <div className="task-management-content">
        <Tabs
          activeKey={activeTab} 
          onChange={setActiveTab}
          className="task-management-tabs"
          tabBarStyle={{ marginBottom: 0 }}
        >
          <TabPane
            tab={
              <span>
                <AppstoreOutlined />
                看板视图
              </span>
            } 
            key="kanban"
          >
            <TaskKanbanView
              tasks={tasks}
              onAssignTask={handleAssignTask}
            />
          </TabPane>
          
          <TabPane
            tab={
              <span>
                <BarsOutlined />
                甘特图
              </span>
            } 
            key="gantt"
          >
            <TaskGanttView
              tasks={tasks}
              onAssignTask={handleAssignTask}
            />
          </TabPane>
          
          <TabPane
            tab={
              <span>
                <BarsOutlined />
                列表视图
              </span>
            } 
            key="list"
          >
            <TaskListView
              tasks={tasks}
              onAssignTask={handleAssignTask}
            />
          </TabPane>
        </Tabs>
      </div>

      {/* Modals */}
      <Modal
        title="创建新任务"
        open={showCreateModal}
        onCancel={() => setShowCreateModal(false)}
        footer={null}
        width={800}

      >
        <TaskCreateForm
          onSubmit={handleCreateTask}
          onCancel={() => setShowCreateModal(false)}
        />
      </Modal>

      <TaskAssignmentModal
        open={showAssignmentModal}
        taskId={selectedTaskForAssignment}
        onClose={() => setShowAssignmentModal(false)}
        onAssign={handleAssignmentComplete}
      />

      <Modal
        title="高级筛选"
        open={showFilterPanel}
        onCancel={() => setShowFilterPanel(false)}
        footer={null}
        width={600}
      >
        <TaskFilterPanel
          onClose={() => setShowFilterPanel(false)}
        />
      </Modal>
    </div>
  );
};
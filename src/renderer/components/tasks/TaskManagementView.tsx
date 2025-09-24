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
        Kanban Board
      </Menu.Item>
      <Menu.Item key="gantt" icon={<BarsOutlined />} onClick={() => setActiveTab('gantt')}>
        Gantt Chart
      </Menu.Item>
      <Menu.Item key="list" icon={<BarsOutlined />} onClick={() => setActiveTab('list')}>
        List View
      </Menu.Item>
    </Menu>
  );

  const actionMenu = (
    <Menu>
      <Menu.Item key="filter" icon={<FilterOutlined />} onClick={() => setShowFilterPanel(true)}>
        Advanced Filters
      </Menu.Item>
      <Menu.Item key="sort" icon={<SortAscendingOutlined />}>
        Sort Options
      </Menu.Item>
      <Menu.Divider />
      <Menu.Item key="settings" icon={<SettingOutlined />}>
        View Settings
      </Menu.Item>
    </Menu>
  );

  return (
    <div className={`task-management-view ${className || ''}`}>
      {/* Header */}
      <div className="task-management-header">
        <div className="header-left">
          <h2>Task Management</h2>
          <span className="task-count">{tasks.length} tasks</span>
        </div>
        
        <div className="header-right">
          <Space>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setShowCreateModal(true)}
            >
              Create Task
            </Button>
            
            <Dropdown overlay={viewMenu} placement="bottomRight">
              <Button icon={<AppstoreOutlined />}>
                View
              </Button>
            </Dropdown>
            
            <Dropdown overlay={actionMenu} placement="bottomRight">
              <Button icon={<SettingOutlined />}>
                Actions
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
                Kanban Board
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
                Gantt Chart
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
                List View
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
        title="Create New Task"
        open={showCreateModal}
        onCancel={() => setShowCreateModal(false)}
        footer={null}
        width={800}
        destroyOnClose
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
        title="Advanced Filters"
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
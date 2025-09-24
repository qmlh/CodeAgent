/**
 * Task Kanban View Component
 * Displays tasks in a Kanban board with drag and drop support
 */

import React, { useState, useCallback } from 'react';
import { 
  Card, 
  Avatar, 
  Tag, 
  Progress, 
  Tooltip, 
  Button,
  Dropdown,
  Menu,
  Badge,
  Space
} from 'antd';
import {
  UserOutlined,
  ClockCircleOutlined,
  FlagOutlined,
  MoreOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { useAppDispatch } from '../../hooks/redux';
import { updateTaskStatus, Task } from '../../store/slices/taskSlice';

export interface TaskKanbanViewProps {
  tasks: Task[];
  onAssignTask: (taskId: string) => void;
}

interface KanbanColumn {
  id: string;
  title: string;
  status: Task['status'];
  color: string;
  icon: React.ReactNode;
}

const columns: KanbanColumn[] = [
  {
    id: 'pending',
    title: 'To Do',
    status: 'pending',
    color: '#faad14',
    icon: <ClockCircleOutlined />
  },
  {
    id: 'in_progress',
    title: 'In Progress',
    status: 'in_progress',
    color: '#1890ff',
    icon: <PlayCircleOutlined />
  },
  {
    id: 'blocked',
    title: 'Blocked',
    status: 'blocked',
    color: '#d9d9d9',
    icon: <PauseCircleOutlined />
  },
  {
    id: 'completed',
    title: 'Completed',
    status: 'completed',
    color: '#52c41a',
    icon: <CheckCircleOutlined />
  },
  {
    id: 'failed',
    title: 'Failed',
    status: 'failed',
    color: '#ff4d4f',
    icon: <ClockCircleOutlined />
  }
];

export const TaskKanbanView: React.FC<TaskKanbanViewProps> = ({ tasks, onAssignTask }) => {
  const dispatch = useAppDispatch();
  const [draggedTask, setDraggedTask] = useState<string | null>(null);

  const getTasksByStatus = useCallback((status: Task['status']) => {
    return tasks.filter(task => task.status === status);
  }, [tasks]);

  const getPriorityColor = (priority: Task['priority']) => {
    switch (priority) {
      case 'critical': return '#ff4d4f';
      case 'high': return '#fa8c16';
      case 'medium': return '#faad14';
      case 'low': return '#52c41a';
      default: return '#d9d9d9';
    }
  };

  const getPriorityText = (priority: Task['priority']) => {
    switch (priority) {
      case 'critical': return 'Critical';
      case 'high': return 'High';
      case 'medium': return 'Medium';
      case 'low': return 'Low';
      default: return 'Unknown';
    }
  };

  const formatEstimatedTime = (milliseconds: number) => {
    const hours = Math.floor(milliseconds / (1000 * 60 * 60));
    const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const handleDragStart = (start: any) => {
    setDraggedTask(start.draggableId);
  };

  const handleDragEnd = (result: DropResult) => {
    setDraggedTask(null);
    
    if (!result.destination) {
      return;
    }

    const taskId = result.draggableId;
    const newStatus = result.destination.droppableId as Task['status'];
    
    // Find the column for the new status
    const targetColumn = columns.find(col => col.id === newStatus);
    if (targetColumn) {
      dispatch(updateTaskStatus({ taskId, status: targetColumn.status }));
    }
  };

  const getTaskMenu = (task: Task) => (
    <Menu>
      <Menu.Item key="assign" onClick={() => onAssignTask(task.id)}>
        Assign Task
      </Menu.Item>
      <Menu.Item key="edit">
        Edit Task
      </Menu.Item>
      <Menu.Item key="duplicate">
        Duplicate Task
      </Menu.Item>
      <Menu.Divider />
      <Menu.Item key="delete" danger>
        Delete Task
      </Menu.Item>
    </Menu>
  );

  const renderTaskCard = (task: Task, index: number) => (
    <Draggable key={task.id} draggableId={task.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`kanban-task-card ${snapshot.isDragging ? 'dragging' : ''}`}
        >
          <Card
            size="small"
            className="task-card"
            actions={[
              <Dropdown overlay={getTaskMenu(task)} trigger={['click']}>
                <Button type="text" size="small" icon={<MoreOutlined />} />
              </Dropdown>
            ]}
          >
            {/* Task Header */}
            <div className="task-card-header">
              <div className="task-title">
                <Tooltip title={task.title}>
                  <span className="title-text">{task.title}</span>
                </Tooltip>
              </div>
              
              <Tag 
                color={getPriorityColor(task.priority)}
                icon={<FlagOutlined />}
                className="priority-tag"
              >
                {getPriorityText(task.priority)}
              </Tag>
            </div>

            {/* Task Description */}
            {task.description && (
              <div className="task-description">
                <Tooltip title={task.description}>
                  <p>{task.description.length > 80 ? `${task.description.substring(0, 80)}...` : task.description}</p>
                </Tooltip>
              </div>
            )}

            {/* Task Tags */}
            {task.tags && task.tags.length > 0 && (
              <div className="task-tags">
                {task.tags.slice(0, 3).map(tag => (
                  <Tag key={tag}>{tag}</Tag>
                ))}
                {task.tags.length > 3 && (
                  <Tag>+{task.tags.length - 3}</Tag>
                )}
              </div>
            )}

            {/* Progress Bar */}
            {task.progress > 0 && (
              <div className="task-progress">
                <Progress 
                  percent={task.progress} 
                  size="small" 
                  showInfo={false}
                  strokeColor={getPriorityColor(task.priority)}
                />
              </div>
            )}

            {/* Task Footer */}
            <div className="task-card-footer">
              <div className="task-meta">
                {/* Estimated Time */}
                {task.estimatedTime > 0 && (
                  <Tooltip title="Estimated Time">
                    <span className="meta-item">
                      <ClockCircleOutlined />
                      {formatEstimatedTime(task.estimatedTime)}
                    </span>
                  </Tooltip>
                )}

                {/* Dependencies */}
                {task.dependencies.length > 0 && (
                  <Tooltip title={`${task.dependencies.length} dependencies`}>
                    <Badge count={task.dependencies.length} size="small">
                      <span className="meta-item">Deps</span>
                    </Badge>
                  </Tooltip>
                )}

                {/* Files */}
                {task.files.length > 0 && (
                  <Tooltip title={`${task.files.length} files`}>
                    <Badge count={task.files.length} size="small">
                      <span className="meta-item">Files</span>
                    </Badge>
                  </Tooltip>
                )}
              </div>

              {/* Assigned Agent */}
              {task.assignedAgent && (
                <Tooltip title={`Assigned to: ${task.assignedAgent}`}>
                  <Avatar 
                    size="small" 
                    icon={<UserOutlined />}
                    className="assigned-avatar"
                  >
                    {task.assignedAgent.charAt(0).toUpperCase()}
                  </Avatar>
                </Tooltip>
              )}
            </div>
          </Card>
        </div>
      )}
    </Draggable>
  );

  const renderColumn = (column: KanbanColumn) => {
    const columnTasks = getTasksByStatus(column.status);
    
    return (
      <div key={column.id} className="kanban-column">
        <div className="column-header">
          <div className="column-title">
            <Space>
              <span style={{ color: column.color }}>{column.icon}</span>
              <span>{column.title}</span>
              <Badge count={columnTasks.length} />
            </Space>
          </div>
        </div>

        <Droppable droppableId={column.id}>
          {(provided, snapshot) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className={`column-content ${snapshot.isDraggingOver ? 'drag-over' : ''}`}
            >
              {columnTasks.map((task, index) => renderTaskCard(task, index))}
              {provided.placeholder}
              
              {columnTasks.length === 0 && (
                <div className="empty-column">
                  <p>No tasks</p>
                </div>
              )}
            </div>
          )}
        </Droppable>
      </div>
    );
  };

  return (
    <div className="task-kanban-view">
      <DragDropContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="kanban-board">
          {columns.map(column => renderColumn(column))}
        </div>
      </DragDropContext>
    </div>
  );
};
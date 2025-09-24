/**
 * Task Gantt View Component
 * Displays tasks in a Gantt chart with timeline and dependencies
 */

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  Card, 
  Button, 
  Select, 
  DatePicker, 
  Space, 
  Tooltip, 
  Tag,
  Progress,
  Dropdown,
  Menu
} from 'antd';
import {
  ZoomInOutlined,
  ZoomOutOutlined,
  FullscreenOutlined,
  MoreOutlined,
  UserOutlined,
  FlagOutlined
} from '@ant-design/icons';
import dayjs, { Dayjs } from 'dayjs';
import { Task } from '../../store/slices/taskSlice';

const { RangePicker } = DatePicker;
const { Option } = Select;

export interface TaskGanttViewProps {
  tasks: Task[];
  onAssignTask: (taskId: string) => void;
}

interface GanttTask extends Task {
  startDate: Dayjs;
  endDate: Dayjs;
  duration: number;
  x: number;
  width: number;
  y: number;
}

type TimeScale = 'day' | 'week' | 'month';

const TIME_SCALES: { value: TimeScale; label: string; format: string }[] = [
  { value: 'day', label: 'Days', format: 'MMM DD' },
  { value: 'week', label: 'Weeks', format: 'MMM DD' },
  { value: 'month', label: 'Months', format: 'MMM YYYY' }
];

export const TaskGanttView: React.FC<TaskGanttViewProps> = ({ tasks, onAssignTask }) => {
  const [timeScale, setTimeScale] = useState<TimeScale>('week');
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs]>([
    dayjs().subtract(1, 'month'),
    dayjs().add(2, 'months')
  ]);
  const [zoom, setZoom] = useState(1);
  const [selectedTask, setSelectedTask] = useState<string | null>(null);
  
  const ganttRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(800);

  useEffect(() => {
    const updateWidth = () => {
      if (ganttRef.current) {
        setContainerWidth(ganttRef.current.clientWidth - 300); // Subtract task list width
      }
    };

    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  const ganttTasks = useMemo(() => {
    const [startDate, endDate] = dateRange;
    const totalDays = endDate.diff(startDate, 'day');
    const dayWidth = (containerWidth * zoom) / totalDays;
    
    return tasks.map((task, index) => {
      // Calculate task dates
      const taskStartDate = task.startedAt ? dayjs(task.startedAt) : dayjs(task.createdAt);
      const estimatedDurationDays = Math.max(1, Math.ceil(task.estimatedTime / (1000 * 60 * 60 * 24)));
      const taskEndDate = task.completedAt 
        ? dayjs(task.completedAt)
        : taskStartDate.add(estimatedDurationDays, 'day');

      // Calculate position and size
      const x = Math.max(0, taskStartDate.diff(startDate, 'day') * dayWidth);
      const width = Math.max(dayWidth * 0.5, taskEndDate.diff(taskStartDate, 'day') * dayWidth);
      const y = index * 60 + 10; // 60px per row, 10px padding

      return {
        ...task,
        startDate: taskStartDate,
        endDate: taskEndDate,
        duration: estimatedDurationDays,
        x,
        width,
        y
      } as GanttTask;
    });
  }, [tasks, dateRange, containerWidth, zoom]);

  const timelineHeaders = useMemo(() => {
    const [startDate, endDate] = dateRange;
    const headers: { date: Dayjs; label: string; x: number }[] = [];
    const totalDays = endDate.diff(startDate, 'day');
    const dayWidth = (containerWidth * zoom) / totalDays;

    let current = startDate;
    let dayIndex = 0;

    while (current.isBefore(endDate)) {
      const x = dayIndex * dayWidth;
      
      let label: string;
      let increment: dayjs.ManipulateType;
      
      switch (timeScale) {
        case 'day':
          label = current.format('MMM DD');
          increment = 'day';
          break;
        case 'week':
          label = current.format('MMM DD');
          increment = 'week';
          break;
        case 'month':
          label = current.format('MMM YYYY');
          increment = 'month';
          break;
      }

      headers.push({ date: current, label, x });
      
      if (timeScale === 'day') {
        current = current.add(1, 'day');
        dayIndex += 1;
      } else if (timeScale === 'week') {
        current = current.add(1, 'week');
        dayIndex += 7;
      } else {
        const nextMonth = current.add(1, 'month');
        dayIndex += nextMonth.diff(current, 'day');
        current = nextMonth;
      }
    }

    return headers;
  }, [dateRange, timeScale, containerWidth, zoom]);

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
      case 'pending': return '#faad14';
      case 'in_progress': return '#1890ff';
      case 'completed': return '#52c41a';
      case 'failed': return '#ff4d4f';
      case 'blocked': return '#d9d9d9';
      default: return '#d9d9d9';
    }
  };

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev * 1.5, 5));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev / 1.5, 0.2));
  };

  const handleTaskClick = (taskId: string) => {
    setSelectedTask(selectedTask === taskId ? null : taskId);
  };

  const getTaskMenu = (task: Task) => (
    <Menu>
      <Menu.Item key="assign" onClick={() => onAssignTask(task.id)}>
        Assign Task
      </Menu.Item>
      <Menu.Item key="edit">
        Edit Task
      </Menu.Item>
      <Menu.Item key="dependencies">
        Manage Dependencies
      </Menu.Item>
      <Menu.Divider />
      <Menu.Item key="delete" danger>
        Delete Task
      </Menu.Item>
    </Menu>
  );

  const renderDependencyLines = () => {
    const lines: JSX.Element[] = [];
    
    ganttTasks.forEach(task => {
      task.dependencies.forEach(depId => {
        const depTask = ganttTasks.find(t => t.id === depId);
        if (depTask) {
          // Draw line from dependency end to task start
          const x1 = depTask.x + depTask.width;
          const y1 = depTask.y + 30; // Middle of task bar
          const x2 = task.x;
          const y2 = task.y + 30;

          lines.push(
            <svg
              key={`${depId}-${task.id}`}
              className="dependency-line"
              style={{
                position: 'absolute',
                left: Math.min(x1, x2),
                top: Math.min(y1, y2),
                width: Math.abs(x2 - x1),
                height: Math.abs(y2 - y1) + 2,
                pointerEvents: 'none',
                zIndex: 1
              }}
            >
              <line
                x1={x1 > x2 ? Math.abs(x2 - x1) : 0}
                y1={y1 > y2 ? Math.abs(y2 - y1) : 0}
                x2={x1 > x2 ? 0 : Math.abs(x2 - x1)}
                y2={y1 > y2 ? 0 : Math.abs(y2 - y1)}
                stroke="#1890ff"
                strokeWidth="2"
                strokeDasharray="5,5"
                markerEnd="url(#arrowhead)"
              />
              <defs>
                <marker
                  id="arrowhead"
                  markerWidth="10"
                  markerHeight="7"
                  refX="9"
                  refY="3.5"
                  orient="auto"
                >
                  <polygon
                    points="0 0, 10 3.5, 0 7"
                    fill="#1890ff"
                  />
                </marker>
              </defs>
            </svg>
          );
        }
      });
    });

    return lines;
  };

  return (
    <div className="task-gantt-view" ref={ganttRef}>
      {/* Controls */}
      <div className="gantt-controls">
        <Space>
          <Select
            value={timeScale}
            onChange={setTimeScale}
            style={{ width: 120 }}
          >
            {TIME_SCALES.map(scale => (
              <Option key={scale.value} value={scale.value}>
                {scale.label}
              </Option>
            ))}
          </Select>

          <RangePicker
            value={dateRange}
            onChange={(dates) => dates && setDateRange(dates as [Dayjs, Dayjs])}
            format="YYYY-MM-DD"
          />

          <Button icon={<ZoomInOutlined />} onClick={handleZoomIn} />
          <Button icon={<ZoomOutOutlined />} onClick={handleZoomOut} />
          <Button icon={<FullscreenOutlined />} />
        </Space>
      </div>

      {/* Gantt Chart */}
      <div className="gantt-container">
        {/* Task List */}
        <div className="gantt-task-list">
          <div className="task-list-header">
            <div className="header-cell">Task</div>
            <div className="header-cell">Assignee</div>
            <div className="header-cell">Priority</div>
            <div className="header-cell">Progress</div>
          </div>
          
          <div className="task-list-body">
            {ganttTasks.map(task => (
              <div
                key={task.id}
                className={`task-list-row ${selectedTask === task.id ? 'selected' : ''}`}
                onClick={() => handleTaskClick(task.id)}
              >
                <div className="task-info">
                  <div className="task-name">
                    <Tooltip title={task.description}>
                      {task.title}
                    </Tooltip>
                  </div>
                  <div className="task-meta">
                    {task.type} • {task.duration}d
                  </div>
                </div>
                
                <div className="task-assignee">
                  {task.assignedAgent ? (
                    <Tooltip title={task.assignedAgent}>
                      <Tag icon={<UserOutlined />} color="blue">
                        {task.assignedAgent.substring(0, 8)}
                      </Tag>
                    </Tooltip>
                  ) : (
                    <Button 
                      size="small" 
                      type="dashed"
                      onClick={(e) => {
                        e.stopPropagation();
                        onAssignTask(task.id);
                      }}
                    >
                      Assign
                    </Button>
                  )}
                </div>
                
                <div className="task-priority">
                  <Tag 
                    color={getPriorityColor(task.priority)}
                    icon={<FlagOutlined />}
                  >
                    {task.priority}
                  </Tag>
                </div>
                
                <div className="task-progress">
                  <Progress 
                    percent={task.progress} 
                    size="small"
                    strokeColor={getStatusColor(task.status)}
                  />
                </div>
                
                <div className="task-actions">
                  <Dropdown overlay={getTaskMenu(task)} trigger={['click']}>
                    <Button 
                      type="text" 
                      size="small" 
                      icon={<MoreOutlined />}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </Dropdown>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Timeline */}
        <div className="gantt-timeline">
          {/* Timeline Header */}
          <div className="timeline-header">
            {timelineHeaders.map((header, index) => (
              <div
                key={index}
                className="timeline-header-cell"
                style={{ left: header.x }}
              >
                {header.label}
              </div>
            ))}
          </div>

          {/* Timeline Body */}
          <div className="timeline-body">
            {/* Grid Lines */}
            {timelineHeaders.map((header, index) => (
              <div
                key={index}
                className="timeline-grid-line"
                style={{ left: header.x }}
              />
            ))}

            {/* Dependency Lines */}
            {renderDependencyLines()}

            {/* Task Bars */}
            {ganttTasks.map(task => (
              <div
                key={task.id}
                className={`gantt-task-bar ${selectedTask === task.id ? 'selected' : ''}`}
                style={{
                  left: task.x,
                  top: task.y,
                  width: task.width,
                  backgroundColor: getStatusColor(task.status),
                  borderLeft: `4px solid ${getPriorityColor(task.priority)}`
                }}
                onClick={() => handleTaskClick(task.id)}
              >
                <div className="task-bar-content">
                  <div className="task-bar-title">{task.title}</div>
                  <div className="task-bar-progress">
                    <div 
                      className="progress-fill"
                      style={{ 
                        width: `${task.progress}%`,
                        backgroundColor: 'rgba(255, 255, 255, 0.3)'
                      }}
                    />
                  </div>
                </div>
                
                {/* Resize Handles */}
                <div className="resize-handle left" />
                <div className="resize-handle right" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
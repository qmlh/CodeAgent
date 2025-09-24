/**
 * Agent Activity Timeline Component
 * Displays real-time collaboration status and agent activities
 */

import React, { useState, useEffect } from 'react';
import { Timeline, Avatar, Badge, Tag, Tooltip, Empty, Button } from 'antd';
import { 
  UserOutlined, 
  PlayCircleOutlined, 
  PauseCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  ClockCircleOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import { useAppSelector } from '../../hooks/redux';
import { Agent, AgentStatus } from '../../../types/agent.types';
import { MessageType } from '../../../types/message.types';

interface ActivityEvent {
  id: string;
  agentId: string;
  agentName: string;
  type: 'task_start' | 'task_complete' | 'task_fail' | 'status_change' | 'message_sent' | 'file_access';
  description: string;
  timestamp: Date;
  status?: AgentStatus;
  taskId?: string;
  filePath?: string;
  messageType?: MessageType;
}

export const AgentActivityTimeline: React.FC = () => {
  const { agents, messages } = useAppSelector(state => state.agent);
  const [activities, setActivities] = useState<ActivityEvent[]>([]);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Generate activity events from agents and messages
  useEffect(() => {
    const generateActivities = () => {
      const newActivities: ActivityEvent[] = [];

      // Add agent status changes
      agents.forEach(agent => {
        newActivities.push({
          id: `agent-${agent.id}-status`,
          agentId: agent.id,
          agentName: agent.name,
          type: 'status_change',
          description: `Status changed to ${agent.status}`,
          timestamp: agent.lastActive,
          status: agent.status
        });

        // Add current task activity if working
        if (agent.status === AgentStatus.WORKING && agent.currentTask) {
          newActivities.push({
            id: `agent-${agent.id}-task`,
            agentId: agent.id,
            agentName: agent.name,
            type: 'task_start',
            description: `Started working on task`,
            timestamp: agent.lastActive,
            taskId: agent.currentTask
          });
        }
      });

      // Add message activities
      messages.slice(-20).forEach(message => {
        const fromAgent = agents.find(a => a.id === message.from);
        if (fromAgent) {
          newActivities.push({
            id: `message-${message.id}`,
            agentId: message.from,
            agentName: fromAgent.name,
            type: 'message_sent',
            description: `Sent ${message.type} message`,
            timestamp: message.timestamp,
            messageType: message.type
          });
        }
      });

      // Sort by timestamp (newest first)
      newActivities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      
      setActivities(newActivities.slice(0, 50)); // Keep last 50 activities
    };

    generateActivities();
    
    if (autoRefresh) {
      const interval = setInterval(generateActivities, 2000); // Refresh every 2 seconds
      return () => clearInterval(interval);
    }
  }, [agents, messages, autoRefresh]);

  const getActivityIcon = (activity: ActivityEvent) => {
    const iconStyle = { fontSize: '14px' };
    
    switch (activity.type) {
      case 'task_start':
        return <PlayCircleOutlined style={{ ...iconStyle, color: '#1890ff' }} />;
      case 'task_complete':
        return <CheckCircleOutlined style={{ ...iconStyle, color: '#52c41a' }} />;
      case 'task_fail':
        return <ExclamationCircleOutlined style={{ ...iconStyle, color: '#ff4d4f' }} />;
      case 'status_change':
        return getStatusIcon(activity.status);
      case 'message_sent':
        return getMessageIcon(activity.messageType);
      case 'file_access':
        return <ClockCircleOutlined style={{ ...iconStyle, color: '#faad14' }} />;
      default:
        return <UserOutlined style={iconStyle} />;
    }
  };

  const getStatusIcon = (status?: AgentStatus) => {
    const iconStyle = { fontSize: '14px' };
    switch (status) {
      case AgentStatus.WORKING:
        return <PlayCircleOutlined style={{ ...iconStyle, color: '#1890ff' }} />;
      case AgentStatus.IDLE:
        return <PauseCircleOutlined style={{ ...iconStyle, color: '#52c41a' }} />;
      case AgentStatus.ERROR:
        return <ExclamationCircleOutlined style={{ ...iconStyle, color: '#ff4d4f' }} />;
      case AgentStatus.WAITING:
        return <ClockCircleOutlined style={{ ...iconStyle, color: '#faad14' }} />;
      default:
        return <UserOutlined style={iconStyle} />;
    }
  };

  const getMessageIcon = (messageType?: MessageType) => {
    const iconStyle = { fontSize: '14px' };
    switch (messageType) {
      case MessageType.INFO:
        return <UserOutlined style={{ ...iconStyle, color: '#1890ff' }} />;
      case MessageType.REQUEST:
        return <ExclamationCircleOutlined style={{ ...iconStyle, color: '#faad14' }} />;
      case MessageType.RESPONSE:
        return <CheckCircleOutlined style={{ ...iconStyle, color: '#52c41a' }} />;
      case MessageType.ALERT:
        return <ExclamationCircleOutlined style={{ ...iconStyle, color: '#ff4d4f' }} />;
      default:
        return <UserOutlined style={iconStyle} />;
    }
  };

  const getActivityColor = (activity: ActivityEvent) => {
    switch (activity.type) {
      case 'task_start':
        return '#1890ff';
      case 'task_complete':
        return '#52c41a';
      case 'task_fail':
        return '#ff4d4f';
      case 'status_change':
        return activity.status === AgentStatus.ERROR ? '#ff4d4f' : '#1890ff';
      case 'message_sent':
        return '#722ed1';
      default:
        return '#d9d9d9';
    }
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return new Date(date).toLocaleDateString();
  };

  const getAgentAvatar = (agentId: string) => {
    const agent = agents.find(a => a.id === agentId);
    if (!agent) return null;

    const statusColor = {
      [AgentStatus.WORKING]: '#1890ff',
      [AgentStatus.IDLE]: '#52c41a',
      [AgentStatus.ERROR]: '#ff4d4f',
      [AgentStatus.WAITING]: '#faad14',
      [AgentStatus.OFFLINE]: '#d9d9d9'
    }[agent.status];

    return (
      <Badge dot color={statusColor}>
        <Avatar size="small" style={{ backgroundColor: '#1890ff', fontSize: '10px' }}>
          {agent.name.charAt(0).toUpperCase()}
        </Avatar>
      </Badge>
    );
  };

  return (
    <div style={{ padding: '12px', height: '100%', overflow: 'auto' }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '16px'
      }}>
        <div style={{ 
          fontSize: '14px', 
          fontWeight: 'bold', 
          color: '#cccccc'
        }}>
          Agent Activity Timeline
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button
            size="small"
            type={autoRefresh ? 'primary' : 'default'}
            icon={<ReloadOutlined spin={autoRefresh} />}
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            Auto Refresh
          </Button>
        </div>
      </div>

      {activities.length > 0 ? (
        <Timeline
          items={activities.map(activity => ({
            dot: getActivityIcon(activity),
            color: getActivityColor(activity),
            children: (
              <div style={{ marginBottom: '8px' }}>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px',
                  marginBottom: '4px'
                }}>
                  {getAgentAvatar(activity.agentId)}
                  <span style={{ 
                    fontSize: '12px', 
                    fontWeight: 'bold',
                    color: '#cccccc'
                  }}>
                    {activity.agentName}
                  </span>
                  <Tag size="small" color={getActivityColor(activity)}>
                    {activity.type.replace('_', ' ')}
                  </Tag>
                </div>
                
                <div style={{ 
                  fontSize: '11px', 
                  color: '#888',
                  marginBottom: '4px',
                  marginLeft: '32px'
                }}>
                  {activity.description}
                </div>
                
                <div style={{ 
                  fontSize: '10px', 
                  color: '#666',
                  marginLeft: '32px'
                }}>
                  {formatTime(activity.timestamp)}
                </div>
              </div>
            )
          }))}
        />
      ) : (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={
            <span style={{ color: '#888', fontSize: '12px' }}>
              No recent agent activities
            </span>
          }
        />
      )}
    </div>
  );
};
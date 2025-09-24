/**
 * Notification Manager Component
 * Handles desktop notifications and in-app alerts
 */

import React, { useState, useEffect } from 'react';
import { 
  List, 
  Badge, 
  Button, 
  Card, 
  Tag, 
  Switch, 
  Divider,
  Empty,
  Tooltip,
  Modal,
  Form,
  Select,
  InputNumber
} from 'antd';
import { 
  BellOutlined,
  SettingOutlined,
  ClearOutlined,
  DeleteOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
  NotificationOutlined,
  SoundOutlined,
  MobileOutlined
} from '@ant-design/icons';
import { useAppSelector } from '../../hooks/redux';
import { AgentStatus } from '../../../types/agent.types';
import { MessageType } from '../../../types/message.types';

interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  source: 'agent' | 'system' | 'task' | 'file';
  sourceId?: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  actions?: NotificationAction[];
}

interface NotificationAction {
  label: string;
  action: string;
  type?: 'primary' | 'default' | 'danger';
}

interface NotificationSettings {
  enabled: boolean;
  desktop: boolean;
  sound: boolean;
  types: {
    agent: boolean;
    system: boolean;
    task: boolean;
    file: boolean;
  };
  priority: {
    low: boolean;
    medium: boolean;
    high: boolean;
    critical: boolean;
  };
  autoMarkRead: number; // seconds, 0 = disabled
  maxNotifications: number;
}

export const NotificationManager: React.FC = () => {
  const { agents, messages } = useAppSelector(state => state.agent);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [settings, setSettings] = useState<NotificationSettings>({
    enabled: true,
    desktop: true,
    sound: false,
    types: { agent: true, system: true, task: true, file: true },
    priority: { low: true, medium: true, high: true, critical: true },
    autoMarkRead: 30,
    maxNotifications: 50
  });
  const [showSettings, setShowSettings] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread' | 'high'>('all');

  // Generate notifications from system events
  useEffect(() => {
    const generateNotifications = () => {
      const newNotifications: Notification[] = [];

      // Agent status notifications
      agents.forEach(agent => {
        if (agent.status === AgentStatus.ERROR) {
          newNotifications.push({
            id: `agent-error-${agent.id}-${Date.now()}`,
            type: 'error',
            title: 'Agent Error',
            message: `Agent ${agent.name} encountered an error and stopped working`,
            timestamp: agent.lastActive,
            read: false,
            source: 'agent',
            sourceId: agent.id,
            priority: 'high',
            actions: [
              { label: 'Restart Agent', action: 'restart_agent', type: 'primary' },
              { label: 'View Logs', action: 'view_logs', type: 'default' }
            ]
          });
        }

        if (agent.status === AgentStatus.WORKING && agent.currentTask) {
          newNotifications.push({
            id: `agent-task-${agent.id}-${Date.now()}`,
            type: 'info',
            title: 'Task Started',
            message: `Agent ${agent.name} started working on a new task`,
            timestamp: agent.lastActive,
            read: false,
            source: 'agent',
            sourceId: agent.id,
            priority: 'low'
          });
        }
      });

      // Message notifications
      messages.slice(-10).forEach(message => {
        if (message.type === MessageType.ALERT) {
          newNotifications.push({
            id: `message-alert-${message.id}`,
            type: 'warning',
            title: 'Agent Alert',
            message: `${getAgentName(message.from)}: ${message.content}`,
            timestamp: message.timestamp,
            read: false,
            source: 'agent',
            sourceId: message.from,
            priority: 'medium'
          });
        }

        if (message.requiresResponse) {
          newNotifications.push({
            id: `message-response-${message.id}`,
            type: 'info',
            title: 'Response Required',
            message: `${getAgentName(message.from)} is waiting for a response`,
            timestamp: message.timestamp,
            read: false,
            source: 'agent',
            sourceId: message.from,
            priority: 'medium',
            actions: [
              { label: 'Respond', action: 'respond_message', type: 'primary' }
            ]
          });
        }
      });

      // System notifications
      const activeAgents = agents.filter(a => a.status !== AgentStatus.OFFLINE);
      if (activeAgents.length === 0) {
        newNotifications.push({
          id: `system-no-agents-${Date.now()}`,
          type: 'warning',
          title: 'No Active Agents',
          message: 'All agents are offline. Consider starting some agents to begin collaboration.',
          timestamp: new Date(),
          read: false,
          source: 'system',
          priority: 'medium',
          actions: [
            { label: 'Create Agent', action: 'create_agent', type: 'primary' }
          ]
        });
      }

      // Sort by timestamp and priority
      newNotifications.sort((a, b) => {
        const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
        const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
        if (priorityDiff !== 0) return priorityDiff;
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      });

      // Merge with existing notifications, avoiding duplicates
      setNotifications(prev => {
        const existingIds = new Set(prev.map(n => n.id));
        const uniqueNew = newNotifications.filter(n => !existingIds.has(n.id));
        const merged = [...uniqueNew, ...prev];
        return merged.slice(0, settings.maxNotifications);
      });
    };

    if (settings.enabled) {
      generateNotifications();
    }
  }, [agents, messages, settings.enabled, settings.maxNotifications]);

  // Auto-mark notifications as read
  useEffect(() => {
    if (settings.autoMarkRead > 0) {
      const interval = setInterval(() => {
        const cutoffTime = Date.now() - (settings.autoMarkRead * 1000);
        setNotifications(prev => 
          prev.map(n => 
            !n.read && new Date(n.timestamp).getTime() < cutoffTime 
              ? { ...n, read: true }
              : n
          )
        );
      }, 5000); // Check every 5 seconds

      return () => clearInterval(interval);
    }
  }, [settings.autoMarkRead]);

  // Send desktop notifications
  useEffect(() => {
    if (!settings.desktop || !settings.enabled) return;

    const unreadHighPriority = notifications.filter(n => 
      !n.read && 
      (n.priority === 'high' || n.priority === 'critical') &&
      settings.types[n.source] &&
      settings.priority[n.priority]
    );

    unreadHighPriority.forEach(notification => {
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(notification.title, {
          body: notification.message,
          icon: '/assets/icons/notification.png',
          tag: notification.id
        });
      }
    });
  }, [notifications, settings]);

  const getAgentName = (agentId: string) => {
    const agent = agents.find(a => a.id === agentId);
    return agent ? agent.name : agentId;
  };

  const getNotificationIcon = (type: Notification['type']) => {
    const iconStyle = { fontSize: '14px' };
    switch (type) {
      case 'info':
        return <BellOutlined style={{ ...iconStyle, color: '#1890ff' }} />;
      case 'success':
        return <BellOutlined style={{ ...iconStyle, color: '#52c41a' }} />;
      case 'warning':
        return <BellOutlined style={{ ...iconStyle, color: '#faad14' }} />;
      case 'error':
        return <BellOutlined style={{ ...iconStyle, color: '#ff4d4f' }} />;
      default:
        return <BellOutlined style={iconStyle} />;
    }
  };

  const getPriorityColor = (priority: Notification['priority']) => {
    switch (priority) {
      case 'critical':
        return '#ff4d4f';
      case 'high':
        return '#fa8c16';
      case 'medium':
        return '#1890ff';
      case 'low':
        return '#52c41a';
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

  const handleNotificationAction = (notification: Notification, actionType: string) => {
    console.log(`Action ${actionType} for notification ${notification.id}`);
    // This would dispatch appropriate actions based on the action type
    markAsRead(notification.id);
  };

  const markAsRead = (notificationId: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  const deleteNotification = (notificationId: string) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  };

  const requestNotificationPermission = async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission();
    }
  };

  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'unread') return !notification.read;
    if (filter === 'high') return notification.priority === 'high' || notification.priority === 'critical';
    return true;
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div style={{ padding: '12px', height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '16px'
      }}>
        <div style={{ 
          fontSize: '14px', 
          fontWeight: 'bold', 
          color: '#cccccc',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <BellOutlined />
          Notifications
          {unreadCount > 0 && (
            <Badge count={unreadCount} size="small" />
          )}
        </div>
        <div style={{ display: 'flex', gap: '4px' }}>
          <Tooltip title="Notification Settings">
            <Button
              size="small"
              icon={<SettingOutlined />}
              onClick={() => setShowSettings(true)}
            />
          </Tooltip>
          <Tooltip title="Mark All Read">
            <Button
              size="small"
              icon={<EyeOutlined />}
              onClick={markAllAsRead}
              disabled={unreadCount === 0}
            />
          </Tooltip>
          <Tooltip title="Clear All">
            <Button
              size="small"
              icon={<ClearOutlined />}
              onClick={clearNotifications}
              disabled={notifications.length === 0}
            />
          </Tooltip>
        </div>
      </div>

      {/* Filter Buttons */}
      <div style={{ 
        display: 'flex', 
        gap: '8px', 
        marginBottom: '12px'
      }}>
        <Button
          size="small"
          type={filter === 'all' ? 'primary' : 'default'}
          onClick={() => setFilter('all')}
        >
          All ({notifications.length})
        </Button>
        <Button
          size="small"
          type={filter === 'unread' ? 'primary' : 'default'}
          onClick={() => setFilter('unread')}
        >
          Unread ({unreadCount})
        </Button>
        <Button
          size="small"
          type={filter === 'high' ? 'primary' : 'default'}
          onClick={() => setFilter('high')}
        >
          High Priority
        </Button>
      </div>

      {/* Notifications List */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        {filteredNotifications.length > 0 ? (
          <List
            size="small"
            dataSource={filteredNotifications}
            renderItem={(notification) => (
              <List.Item 
                style={{ 
                  padding: '8px 0',
                  opacity: notification.read ? 0.6 : 1,
                  borderLeft: `3px solid ${getPriorityColor(notification.priority)}`,
                  paddingLeft: '8px',
                  marginBottom: '4px'
                }}
                actions={[
                  !notification.read && (
                    <Button
                      size="small"
                      type="text"
                      icon={<EyeOutlined />}
                      onClick={() => markAsRead(notification.id)}
                    />
                  ),
                  <Button
                    size="small"
                    type="text"
                    icon={<DeleteOutlined />}
                    onClick={() => deleteNotification(notification.id)}
                  />
                ].filter(Boolean)}
              >
                <List.Item.Meta
                  avatar={getNotificationIcon(notification.type)}
                  title={
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '8px',
                      fontSize: '11px'
                    }}>
                      <span style={{ 
                        color: '#cccccc', 
                        fontWeight: notification.read ? 'normal' : 'bold'
                      }}>
                        {notification.title}
                      </span>
                      <Tag size="small" color={getPriorityColor(notification.priority)}>
                        {notification.priority}
                      </Tag>
                      <Tag size="small" color="blue">
                        {notification.source}
                      </Tag>
                    </div>
                  }
                  description={
                    <div>
                      <div style={{ 
                        fontSize: '10px', 
                        color: '#888',
                        marginBottom: '4px'
                      }}>
                        {notification.message}
                      </div>
                      <div style={{ 
                        fontSize: '9px', 
                        color: '#666',
                        marginBottom: '4px'
                      }}>
                        {formatTime(notification.timestamp)}
                      </div>
                      {notification.actions && (
                        <div style={{ display: 'flex', gap: '4px' }}>
                          {notification.actions.map((action, index) => (
                            <Button
                              key={index}
                              size="small"
                              type={action.type || 'default'}
                              onClick={() => handleNotificationAction(notification, action.action)}
                            >
                              {action.label}
                            </Button>
                          ))}
                        </div>
                      )}
                    </div>
                  }
                />
              </List.Item>
            )}
          />
        ) : (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <span style={{ color: '#888', fontSize: '12px' }}>
                {filter === 'all' ? 'No notifications' : `No ${filter} notifications`}
              </span>
            }
          />
        )}
      </div>

      {/* Settings Modal */}
      <Modal
        title="Notification Settings"
        open={showSettings}
        onCancel={() => setShowSettings(false)}
        footer={null}
        width={500}
      >
        <Form layout="vertical">
          <Form.Item label="General Settings">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Enable Notifications</span>
                <Switch
                  checked={settings.enabled}
                  onChange={(enabled) => setSettings(prev => ({ ...prev, enabled }))}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Desktop Notifications</span>
                <Switch
                  checked={settings.desktop}
                  onChange={(desktop) => {
                    setSettings(prev => ({ ...prev, desktop }));
                    if (desktop) requestNotificationPermission();
                  }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Sound Alerts</span>
                <Switch
                  checked={settings.sound}
                  onChange={(sound) => setSettings(prev => ({ ...prev, sound }))}
                />
              </div>
            </div>
          </Form.Item>

          <Divider />

          <Form.Item label="Notification Types">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {Object.entries(settings.types).map(([type, enabled]) => (
                <div key={type} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ textTransform: 'capitalize' }}>{type} Notifications</span>
                  <Switch
                    checked={enabled}
                    onChange={(checked) => 
                      setSettings(prev => ({ 
                        ...prev, 
                        types: { ...prev.types, [type]: checked }
                      }))
                    }
                  />
                </div>
              ))}
            </div>
          </Form.Item>

          <Divider />

          <Form.Item label="Priority Levels">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {Object.entries(settings.priority).map(([priority, enabled]) => (
                <div key={priority} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ textTransform: 'capitalize' }}>{priority} Priority</span>
                  <Switch
                    checked={enabled}
                    onChange={(checked) => 
                      setSettings(prev => ({ 
                        ...prev, 
                        priority: { ...prev.priority, [priority]: checked }
                      }))
                    }
                  />
                </div>
              ))}
            </div>
          </Form.Item>

          <Divider />

          <Form.Item label="Auto Mark as Read (seconds)">
            <InputNumber
              value={settings.autoMarkRead}
              onChange={(value) => setSettings(prev => ({ ...prev, autoMarkRead: value || 0 }))}
              min={0}
              max={300}
              placeholder="0 = disabled"
              style={{ width: '100%' }}
            />
          </Form.Item>

          <Form.Item label="Maximum Notifications">
            <InputNumber
              value={settings.maxNotifications}
              onChange={(value) => setSettings(prev => ({ ...prev, maxNotifications: value || 50 }))}
              min={10}
              max={200}
              style={{ width: '100%' }}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};
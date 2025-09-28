/**
 * Message Center Component
 * Displays agent communication records and system notifications
 */

import React, { useState, useEffect } from 'react';
import { 
  List, 
  Avatar, 
  Badge, 
  Tag, 
  Input, 
  Select, 
  Button, 
  Tooltip,
  Empty,
  Divider,
  Card
} from 'antd';
import { 
  MessageOutlined,
  SearchOutlined,
  FilterOutlined,
  SendOutlined,
  InfoCircleOutlined,
  ExclamationCircleOutlined,
  CheckCircleOutlined,
  BellOutlined,
  ClearOutlined
} from '@ant-design/icons';
import { useAppSelector } from '../../hooks/redux';
import { MessageType } from '../../../types/message.types';
import { Agent } from '../../../types/agent.types';
import { AgentMessage } from '../../store/slices/agentSlice';

const { Search } = Input;
const { Option } = Select;

interface SystemNotification {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
}

export const MessageCenter: React.FC = () => {
  const { agents, messages } = useAppSelector(state => state.agent);
  const [filteredMessages, setFilteredMessages] = useState<AgentMessage[]>([]);
  const [notifications, setNotifications] = useState<SystemNotification[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [messageTypeFilter, setMessageTypeFilter] = useState<MessageType | 'all'>('all');
  const [agentFilter, setAgentFilter] = useState<string>('all');
  const [showNotifications, setShowNotifications] = useState(true);

  // Generate system notifications based on agent activities
  useEffect(() => {
    const generateNotifications = () => {
      const newNotifications: SystemNotification[] = [];

      // Agent status notifications
      agents.forEach(agent => {
        if (agent.status === 'error') {
          newNotifications.push({
            id: `agent-error-${agent.id}`,
            type: 'error',
            title: 'Agent Error',
            message: `Agent ${agent.name} encountered an error`,
            timestamp: agent.lastActive,
            read: false
          });
        }
        
        if (agent.status === 'working' && agent.currentTask) {
          newNotifications.push({
            id: `agent-working-${agent.id}`,
            type: 'info',
            title: 'Task Started',
            message: `Agent ${agent.name} started working on a new task`,
            timestamp: agent.lastActive,
            read: false
          });
        }
      });

      // Message-based notifications
      messages.slice(-10).forEach(message => {
        if (message.type === MessageType.ALERT) {
          newNotifications.push({
            id: `message-alert-${message.id}`,
            type: 'warning',
            title: 'Agent Alert',
            message: `Alert from ${getAgentName(message.from)}: ${message.content}`,
            timestamp: message.timestamp,
            read: false
          });
        }
      });

      // Sort by timestamp (newest first)
      newNotifications.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setNotifications(newNotifications.slice(0, 20));
    };

    generateNotifications();
  }, [agents, messages]);

  // Filter messages based on search and filters
  useEffect(() => {
    let filtered = [...messages];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(message => 
        getAgentName(message.from).toLowerCase().includes(searchTerm.toLowerCase()) ||
        (typeof message.content === 'string' && 
         message.content.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Apply message type filter
    if (messageTypeFilter !== 'all') {
      filtered = filtered.filter(message => message.type === messageTypeFilter);
    }

    // Apply agent filter
    if (agentFilter !== 'all') {
      filtered = filtered.filter(message => 
        message.from === agentFilter || 
        (Array.isArray(message.to) ? message.to.includes(agentFilter) : message.to === agentFilter)
      );
    }

    // Sort by timestamp (newest first)
    filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    
    setFilteredMessages(filtered);
  }, [messages, searchTerm, messageTypeFilter, agentFilter]);

  const getAgentName = (agentId: string) => {
    const agent = agents.find(a => a.id === agentId);
    return agent ? agent.name : agentId;
  };

  const getMessageIcon = (type: AgentMessage['type']) => {
    const iconStyle = { fontSize: '14px' };
    switch (type) {
      case 'info':
        return <InfoCircleOutlined style={{ ...iconStyle, color: '#1890ff' }} />;
      case 'request':
        return <ExclamationCircleOutlined style={{ ...iconStyle, color: '#faad14' }} />;
      case 'response':
        return <CheckCircleOutlined style={{ ...iconStyle, color: '#52c41a' }} />;
      case 'alert':
        return <ExclamationCircleOutlined style={{ ...iconStyle, color: '#ff4d4f' }} />;
      default:
        return <MessageOutlined style={iconStyle} />;
    }
  };

  const getNotificationIcon = (type: SystemNotification['type']) => {
    const iconStyle = { fontSize: '14px' };
    switch (type) {
      case 'info':
        return <InfoCircleOutlined style={{ ...iconStyle, color: '#1890ff' }} />;
      case 'warning':
        return <ExclamationCircleOutlined style={{ ...iconStyle, color: '#faad14' }} />;
      case 'error':
        return <ExclamationCircleOutlined style={{ ...iconStyle, color: '#ff4d4f' }} />;
      case 'success':
        return <CheckCircleOutlined style={{ ...iconStyle, color: '#52c41a' }} />;
      default:
        return <BellOutlined style={iconStyle} />;
    }
  };

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatContent = (content: any) => {
    if (typeof content === 'string') {
      return content.length > 100 ? content.substring(0, 100) + '...' : content;
    }
    return JSON.stringify(content).substring(0, 100) + '...';
  };

  const clearFilters = () => {
    setSearchTerm('');
    setMessageTypeFilter('all');
    setAgentFilter('all');
  };

  const markNotificationAsRead = (notificationId: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
    );
  };

  const unreadNotifications = notifications.filter(n => !n.read);

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
          <MessageOutlined />
          Message Center
          {unreadNotifications.length > 0 && (
            <Badge count={unreadNotifications.length}  />
          )}
        </div>
        <Button
          
          icon={<BellOutlined />}
          type={showNotifications ? 'primary' : 'default'}
          onClick={() => setShowNotifications(!showNotifications)}
        >
          Notifications
        </Button>
      </div>

      {/* System Notifications */}
      {showNotifications && notifications.length > 0 && (
        <Card 
           
          title={
            <div style={{ fontSize: '12px', color: '#cccccc' }}>
              System Notifications ({unreadNotifications.length} unread)
            </div>
          }
          style={{ marginBottom: '16px' }}
          bodyStyle={{ padding: '8px' }}
        >
          <List
            
            dataSource={notifications.slice(0, 5)}
            renderItem={(notification) => (
              <List.Item 
                style={{ 
                  padding: '4px 0',
                  opacity: notification.read ? 0.6 : 1,
                  cursor: 'pointer'
                }}
                onClick={() => markNotificationAsRead(notification.id)}
              >
                <List.Item.Meta
                  avatar={getNotificationIcon(notification.type)}
                  title={
                    <div style={{ fontSize: '11px', color: '#cccccc' }}>
                      {notification.title}
                    </div>
                  }
                  description={
                    <div>
                      <div style={{ fontSize: '10px', color: '#888' }}>
                        {notification.message}
                      </div>
                      <div style={{ fontSize: '9px', color: '#666' }}>
                        {formatTime(notification.timestamp)}
                      </div>
                    </div>
                  }
                />
                {!notification.read && (
                  <Badge dot color="#1890ff" />
                )}
              </List.Item>
            )}
          />
        </Card>
      )}

      {/* Filters */}
      <div style={{ 
        display: 'flex', 
        gap: '8px', 
        marginBottom: '12px',
        flexWrap: 'wrap'
      }}>
        <Search
          placeholder="Search messages..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ flex: 1, minWidth: '150px' }}
          
          prefix={<SearchOutlined />}
        />
        
        <Select
          value={messageTypeFilter}
          onChange={setMessageTypeFilter}
          
          style={{ width: '100px' }}
        >
          <Option value="all">All Types</Option>
          <Option value={MessageType.INFO}>Info</Option>
          <Option value={MessageType.REQUEST}>Request</Option>
          <Option value={MessageType.RESPONSE}>Response</Option>
          <Option value={MessageType.ALERT}>Alert</Option>
          <Option value={MessageType.SYSTEM}>System</Option>
        </Select>

        <Select
          value={agentFilter}
          onChange={setAgentFilter}
          
          style={{ width: '120px' }}
        >
          <Option value="all">All Agents</Option>
          {agents.map(agent => (
            <Option key={agent.id} value={agent.id}>
              {agent.name}
            </Option>
          ))}
        </Select>

        <Button
          
          icon={<ClearOutlined />}
          onClick={clearFilters}
          disabled={searchTerm === '' && messageTypeFilter === 'all' && agentFilter === 'all'}
        >
          Clear
        </Button>
      </div>

      {/* Messages List */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        {filteredMessages.length > 0 ? (
          <List
            
            dataSource={filteredMessages}
            renderItem={(message) => (
              <List.Item style={{ padding: '8px 0' }}>
                <List.Item.Meta
                  avatar={
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      {getMessageIcon(message.type)}
                      <Avatar  style={{ backgroundColor: '#1890ff', fontSize: '10px' }}>
                        {getAgentName(message.from).charAt(0).toUpperCase()}
                      </Avatar>
                    </div>
                  }
                  title={
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '8px',
                      fontSize: '11px'
                    }}>
                      <span style={{ color: '#cccccc', fontWeight: 'bold' }}>
                        {getAgentName(message.from)}
                      </span>
                      <SendOutlined style={{ fontSize: '10px', color: '#666' }} />
                      <span style={{ color: '#888' }}>
                        {Array.isArray(message.to) 
                          ? message.to.map(getAgentName).join(', ')
                          : getAgentName(message.to)
                        }
                      </span>
                      <Tag color={message.type === 'alert' ? 'red' : 'blue'} style={{ fontSize: '10px', padding: '0 4px', lineHeight: '16px' }}>
                        {message.type}
                      </Tag>
                    </div>
                  }
                  description={
                    <div>
                      <div style={{ 
                        fontSize: '10px', 
                        color: '#888',
                        marginBottom: '2px'
                      }}>
                        {formatContent(message.content)}
                      </div>
                      <div style={{ 
                        fontSize: '9px', 
                        color: '#666',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}>
                        <span>{formatTime(message.timestamp)}</span>
                        {message.requiresResponse && (
                          <Tag color="orange" style={{ fontSize: '10px', padding: '0 4px', lineHeight: '16px' }}>Response Required</Tag>
                        )}
                      </div>
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
                {searchTerm || messageTypeFilter !== 'all' || agentFilter !== 'all'
                  ? 'No messages match your filters'
                  : 'No messages yet'
                }
              </span>
            }
          />
        )}
      </div>
    </div>
  );
};
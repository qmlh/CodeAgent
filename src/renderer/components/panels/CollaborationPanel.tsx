/**
 * Collaboration Panel Component
 * Displays collaboration status and agent communication
 */

import React from 'react';
import { List, Badge, Avatar, Timeline, Empty } from 'antd';
import { 
  TeamOutlined, 
  MessageOutlined,
  SyncOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import { useAppSelector } from '../../hooks/redux';

export const CollaborationPanel: React.FC = () => {
  const { agents, messages, collaborationSessions } = useAppSelector(state => state.agent);

  const activeAgents = agents.filter(agent => agent.status !== 'offline');
  const workingAgents = agents.filter(agent => agent.status === 'working');
  const recentMessages = messages.slice(-10).reverse(); // Show last 10 messages

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getAgentName = (agentId: string) => {
    const agent = agents.find(a => a.id === agentId);
    return agent ? agent.name : agentId;
  };

  const getMessageIcon = (type: string) => {
    const icons: Record<string, React.ReactNode> = {
      info: <MessageOutlined style={{ color: '#1890ff' }} />,
      request: <ExclamationCircleOutlined style={{ color: '#faad14' }} />,
      response: <CheckCircleOutlined style={{ color: '#52c41a' }} />,
      alert: <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />
    };
    return icons[type] || <MessageOutlined />;
  };

  return (
    <div style={{ padding: '8px' }}>
      {/* Active Agents Status */}
      <div style={{ marginBottom: '16px' }}>
        <div style={{ 
          fontSize: '12px', 
          fontWeight: 'bold', 
          color: '#cccccc',
          marginBottom: '8px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <TeamOutlined />
          Active Agents ({activeAgents.length})
        </div>
        
        <List
          
          dataSource={activeAgents}
          renderItem={(agent) => (
            <List.Item style={{ padding: '4px 0' }}>
              <List.Item.Meta
                avatar={
                  <Badge 
                    status={agent.status === 'working' ? 'processing' : 'success'}
                    dot
                  >
                    <Avatar  style={{ backgroundColor: '#1890ff' }}>
                      {agent.name.charAt(0).toUpperCase()}
                    </Avatar>
                  </Badge>
                }
                title={
                  <div style={{ fontSize: '11px', color: '#cccccc' }}>
                    {agent.name}
                  </div>
                }
                description={
                  <div style={{ fontSize: '10px', color: '#888' }}>
                    {agent.status === 'working' ? (
                      <span style={{ color: '#1890ff' }}>
                        <SyncOutlined spin /> Working
                      </span>
                    ) : (
                      <span>Idle</span>
                    )}
                  </div>
                }
              />
            </List.Item>
          )}
        />
      </div>

      {/* Recent Messages */}
      <div style={{ marginBottom: '16px' }}>
        <div style={{ 
          fontSize: '12px', 
          fontWeight: 'bold', 
          color: '#cccccc',
          marginBottom: '8px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <MessageOutlined />
          Recent Messages
        </div>

        {recentMessages.length > 0 ? (
          <Timeline
            items={recentMessages.map(message => ({
              dot: getMessageIcon(message.type),
              children: (
                <div style={{ fontSize: '11px' }}>
                  <div style={{ color: '#cccccc', marginBottom: '2px' }}>
                    <strong>{getAgentName(message.from)}</strong>
                    {Array.isArray(message.to) ? 
                      ` â†?${message.to.map(getAgentName).join(', ')}` :
                      ` â†?${getAgentName(message.to)}`
                    }
                  </div>
                  <div style={{ color: '#888', marginBottom: '2px' }}>
                    {typeof message.content === 'string' 
                      ? message.content 
                      : JSON.stringify(message.content)
                    }
                  </div>
                  <div style={{ color: '#666', fontSize: '10px' }}>
                    {formatTime(message.timestamp)}
                  </div>
                </div>
              )
            }))}
          />
        ) : (
          <div style={{ 
            textAlign: 'center', 
            padding: '16px', 
            color: '#888',
            fontSize: '11px'
          }}>
            No recent messages
          </div>
        )}
      </div>

      {/* Collaboration Sessions */}
      <div>
        <div style={{ 
          fontSize: '12px', 
          fontWeight: 'bold', 
          color: '#cccccc',
          marginBottom: '8px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <SyncOutlined />
          Active Sessions ({collaborationSessions.filter(s => s.status === 'active').length})
        </div>

        {collaborationSessions.filter(s => s.status === 'active').length > 0 ? (
          <List
            
            dataSource={collaborationSessions.filter(s => s.status === 'active')}
            renderItem={(session) => (
              <List.Item style={{ padding: '4px 0' }}>
                <div style={{ width: '100%' }}>
                  <div style={{ fontSize: '11px', color: '#cccccc', marginBottom: '2px' }}>
                    Session {session.id.slice(-8)}
                  </div>
                  <div style={{ fontSize: '10px', color: '#888' }}>
                    {session.participants.map(getAgentName).join(', ')}
                  </div>
                  <div style={{ fontSize: '10px', color: '#666' }}>
                    {session.sharedFiles.length} shared files
                  </div>
                </div>
              </List.Item>
            )}
          />
        ) : (
          <div style={{ 
            textAlign: 'center', 
            padding: '16px', 
            color: '#888',
            fontSize: '11px'
          }}>
            No active collaboration sessions
          </div>
        )}
      </div>

      {/* Empty state when no agents */}
      {activeAgents.length === 0 && (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={
            <span style={{ color: '#888', fontSize: '12px' }}>
              No active agents for collaboration
            </span>
          }
        />
      )}
    </div>
  );
};
/**
 * Main Collaboration View Component
 * Integrates all collaboration monitoring and communication interfaces
 */

import React, { useState, useEffect } from 'react';
import { Layout, Tabs, Card, Row, Col, Button, Tooltip, Badge, Alert } from 'antd';
import { 
  TeamOutlined,
  MessageOutlined,
  DashboardOutlined,
  BellOutlined,
  HistoryOutlined,
  FullscreenOutlined,
  FullscreenExitOutlined,
  WifiOutlined,
  DisconnectOutlined
} from '@ant-design/icons';
import { AgentActivityTimeline } from './AgentActivityTimeline';
import { MessageCenter } from './MessageCenter';
import { CollaborationSessionPanel } from './CollaborationSessionPanel';
import { SystemPerformanceMonitor } from './SystemPerformanceMonitor';
import { NotificationManager } from './NotificationManager';
import { useAppSelector } from '../../hooks/redux';
import useRealtimeEvents from '../../hooks/useRealtimeEvents';
import './collaboration.css';

const { Content } = Layout;

interface CollaborationViewProps {
  className?: string;
  style?: React.CSSProperties;
}

export const CollaborationView: React.FC<CollaborationViewProps> = ({ 
  className, 
  style 
}) => {
  const { agents, messages, collaborationSessions } = useAppSelector(state => state.agent);
  const [activeTab, setActiveTab] = useState('timeline');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showConnectionAlert, setShowConnectionAlert] = useState(false);

  // Initialize real-time events
  const {
    isConnected,
    metrics,
    connectionStatus,
    connect
  } = useRealtimeEvents({
    autoConnect: true,
    subscribeToAll: true
  });

  // Show connection alert when disconnected
  useEffect(() => {
    if (!isConnected && connectionStatus.reconnectAttempts > 0) {
      setShowConnectionAlert(true);
    } else {
      setShowConnectionAlert(false);
    }
  }, [isConnected, connectionStatus.reconnectAttempts]);

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const getTabBadgeCount = (tabKey: string) => {
    switch (tabKey) {
      case 'messages':
        return messages.filter(m => m.requiresResponse).length;
      case 'sessions':
        return collaborationSessions.filter(s => s.status === 'active').length;
      case 'notifications':
        // This would come from the notification manager's unread count
        return 0;
      default:
        return 0;
    }
  };

  const containerStyle: React.CSSProperties = {
    height: isFullscreen ? '100vh' : '100%',
    position: isFullscreen ? 'fixed' : 'relative',
    top: isFullscreen ? 0 : 'auto',
    left: isFullscreen ? 0 : 'auto',
    right: isFullscreen ? 0 : 'auto',
    bottom: isFullscreen ? 0 : 'auto',
    zIndex: isFullscreen ? 1000 : 'auto',
    backgroundColor: '#1f1f1f',
    ...style
  };

  return (
    <div className={`collaboration-view ${className || ''}`} style={containerStyle}>
      <Layout style={{ height: '100%', backgroundColor: '#1f1f1f' }}>
        <Content style={{ padding: '12px', height: '100%' }}>
          {/* Header */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '16px',
            padding: '8px 0'
          }}>
            <div style={{ 
              fontSize: '16px', 
              fontWeight: 'bold', 
              color: '#cccccc',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <TeamOutlined />
              Collaboration Monitor
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Tooltip title={isConnected ? 'Real-time sync active' : 'Real-time sync disconnected'}>
                  <Badge 
                    dot 
                    color={isConnected ? '#52c41a' : '#ff4d4f'}
                    style={{ marginRight: '4px' }}
                  >
                    {isConnected ? <WifiOutlined /> : <DisconnectOutlined />}
                  </Badge>
                </Tooltip>
                <div style={{ fontSize: '12px', color: '#888' }}>
                  {agents.filter(a => a.status !== 'offline').length} active agents
                </div>
                {metrics && (
                  <div style={{ fontSize: '12px', color: '#888' }}>
                    â€?{metrics.activeSessions} sessions
                  </div>
                )}
              </div>
              <Tooltip title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}>
                <Button
                  
                  type="text"
                  icon={isFullscreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />}
                  onClick={toggleFullscreen}
                />
              </Tooltip>
            </div>
          </div>

          {/* Connection Alert */}
          {showConnectionAlert && (
            <Alert
              message="Real-time sync disconnected"
              description={`Attempting to reconnect... (${connectionStatus.reconnectAttempts} attempts)`}
              type="warning"
              showIcon
              closable
              onClose={() => setShowConnectionAlert(false)}
              style={{ marginBottom: '12px' }}
              action={
                <Button  onClick={connect}>
                  Retry Connection
                </Button>
              }
            />
          )}

          {/* Main Content */}
          <div style={{ height: showConnectionAlert ? 'calc(100% - 120px)' : 'calc(100% - 60px)' }}>
            {isFullscreen ? (
              // Fullscreen layout with grid
              <Row gutter={[12, 12]} style={{ height: '100%' }}>
                <Col span={8} style={{ height: '100%' }}>
                  <Card 
                    title="Agent Activity Timeline" 
                     
                    style={{ height: '100%' }}
                    styles={{ body: { height: 'calc(100% - 40px)', padding: 0 } }}
                  >
                    <AgentActivityTimeline />
                  </Card>
                </Col>
                <Col span={8} style={{ height: '100%' }}>
                  <Card 
                    title="Message Center" 
                     
                    style={{ height: '50%', marginBottom: '12px' }}
                    styles={{ body: { height: 'calc(100% - 40px)', padding: 0 } }}
                  >
                    <MessageCenter />
                  </Card>
                  <Card 
                    title="Collaboration Sessions" 
                     
                    style={{ height: 'calc(50% - 12px)' }}
                    styles={{ body: { height: 'calc(100% - 40px)', padding: 0 } }}
                  >
                    <CollaborationSessionPanel />
                  </Card>
                </Col>
                <Col span={8} style={{ height: '100%' }}>
                  <Card 
                    title="System Performance" 
                     
                    style={{ height: '60%', marginBottom: '12px' }}
                    styles={{ body: { height: 'calc(100% - 40px)', padding: 0 } }}
                  >
                    <SystemPerformanceMonitor />
                  </Card>
                  <Card 
                    title="Notifications" 
                     
                    style={{ height: 'calc(40% - 12px)' }}
                    styles={{ body: { height: 'calc(100% - 40px)', padding: 0 } }}
                  >
                    <NotificationManager />
                  </Card>
                </Col>
              </Row>
            ) : (
              // Tabbed layout for normal view
              <Tabs
                activeKey={activeTab}
                onChange={setActiveTab}
                type="card"
                
                style={{ height: '100%' }}
                tabBarStyle={{ marginBottom: '12px' }}
                items={[
                  {
                    key: 'timeline',
                    label: (
                      <span>
                        <HistoryOutlined />
                        Activity Timeline
                      </span>
                    ),
                    children: <AgentActivityTimeline />,
                    style: { height: 'calc(100% - 40px)' }
                  },
                  {
                    key: 'messages',
                    label: (
                      <span>
                        <MessageOutlined />
                        Messages
                        {getTabBadgeCount('messages') > 0 && (
                          <span style={{ 
                            marginLeft: '4px',
                            backgroundColor: '#ff4d4f',
                            color: 'white',
                            borderRadius: '8px',
                            padding: '0 4px',
                            fontSize: '10px'
                          }}>
                            {getTabBadgeCount('messages')}
                          </span>
                        )}
                      </span>
                    ),
                    children: <MessageCenter />,
                    style: { height: 'calc(100% - 40px)' }
                  },
                  {
                    key: 'sessions',
                    label: (
                      <span>
                        <TeamOutlined />
                        Sessions
                        {getTabBadgeCount('sessions') > 0 && (
                          <span style={{ 
                            marginLeft: '4px',
                            backgroundColor: '#52c41a',
                            color: 'white',
                            borderRadius: '8px',
                            padding: '0 4px',
                            fontSize: '10px'
                          }}>
                            {getTabBadgeCount('sessions')}
                          </span>
                        )}
                      </span>
                    ),
                    children: <CollaborationSessionPanel />,
                    style: { height: 'calc(100% - 40px)' }
                  },
                  {
                    key: 'performance',
                    label: (
                      <span>
                        <DashboardOutlined />
                        Performance
                      </span>
                    ),
                    children: <SystemPerformanceMonitor />,
                    style: { height: 'calc(100% - 40px)' }
                  },
                  {
                    key: 'notifications',
                    label: (
                      <span>
                        <BellOutlined />
                        Notifications
                      </span>
                    ),
                    children: <NotificationManager />,
                    style: { height: 'calc(100% - 40px)' }
                  }
                ]}
              />
            )}
          </div>
        </Content>
      </Layout>
    </div>
  );
};
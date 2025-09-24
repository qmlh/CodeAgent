/**
 * Collaboration Session Panel Component
 * Displays current active collaboration sessions
 */

import React, { useState, useEffect } from 'react';
import { 
  Card, 
  List, 
  Avatar, 
  Badge, 
  Tag, 
  Button, 
  Tooltip, 
  Progress,
  Empty,
  Divider,
  Space,
  Modal,
  Descriptions
} from 'antd';
import { 
  TeamOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
  StopOutlined,
  FileOutlined,
  ClockCircleOutlined,
  UserOutlined,
  EyeOutlined,
  SettingOutlined
} from '@ant-design/icons';
import { useAppSelector } from '../../hooks/redux';
import { CollaborationSession } from '../../../types/message.types';
import { Agent, AgentStatus } from '../../../types/agent.types';

interface SessionMetrics {
  sessionId: string;
  duration: number;
  messagesExchanged: number;
  filesModified: number;
  tasksCompleted: number;
}

export const CollaborationSessionPanel: React.FC = () => {
  const { agents, messages, collaborationSessions } = useAppSelector(state => state.agent);
  const [selectedSession, setSelectedSession] = useState<CollaborationSession | null>(null);
  const [sessionMetrics, setSessionMetrics] = useState<SessionMetrics[]>([]);
  const [showSessionDetails, setShowSessionDetails] = useState(false);

  // Calculate session metrics
  useEffect(() => {
    const calculateMetrics = () => {
      const metrics: SessionMetrics[] = collaborationSessions.map(session => {
        const sessionMessages = messages.filter(msg => 
          session.participants.includes(msg.from) || 
          (Array.isArray(msg.to) ? 
            msg.to.some(to => session.participants.includes(to)) :
            session.participants.includes(msg.to))
        );

        const duration = session.endTime 
          ? new Date(session.endTime).getTime() - new Date(session.startTime).getTime()
          : Date.now() - new Date(session.startTime).getTime();

        return {
          sessionId: session.id,
          duration: Math.floor(duration / 1000 / 60), // in minutes
          messagesExchanged: sessionMessages.length,
          filesModified: session.sharedFiles.length,
          tasksCompleted: 0 // This would come from task completion events
        };
      });

      setSessionMetrics(metrics);
    };

    calculateMetrics();
  }, [collaborationSessions, messages]);

  const getAgentName = (agentId: string) => {
    const agent = agents.find(a => a.id === agentId);
    return agent ? agent.name : agentId;
  };

  const getAgentStatus = (agentId: string) => {
    const agent = agents.find(a => a.id === agentId);
    return agent ? agent.status : AgentStatus.OFFLINE;
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

  const getSessionStatusColor = (status: CollaborationSession['status']) => {
    switch (status) {
      case 'active':
        return '#52c41a';
      case 'paused':
        return '#faad14';
      case 'completed':
        return '#d9d9d9';
      default:
        return '#d9d9d9';
    }
  };

  const getSessionIcon = (status: CollaborationSession['status']) => {
    switch (status) {
      case 'active':
        return <PlayCircleOutlined style={{ color: '#52c41a' }} />;
      case 'paused':
        return <PauseCircleOutlined style={{ color: '#faad14' }} />;
      case 'completed':
        return <StopOutlined style={{ color: '#d9d9d9' }} />;
      default:
        return <TeamOutlined />;
    }
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  };

  const getSessionProgress = (session: CollaborationSession) => {
    // Calculate progress based on active participants
    const activeParticipants = session.participants.filter(
      participantId => getAgentStatus(participantId) === AgentStatus.WORKING
    );
    return Math.round((activeParticipants.length / session.participants.length) * 100);
  };

  const handleSessionAction = (sessionId: string, action: 'pause' | 'resume' | 'stop') => {
    // This would dispatch actions to control the session
    console.log(`${action} session ${sessionId}`);
  };

  const activeSessions = collaborationSessions.filter(s => s.status === 'active');
  const pausedSessions = collaborationSessions.filter(s => s.status === 'paused');
  const completedSessions = collaborationSessions.filter(s => s.status === 'completed').slice(0, 5);

  return (
    <div style={{ padding: '12px', height: '100%', overflow: 'auto' }}>
      <div style={{ 
        fontSize: '14px', 
        fontWeight: 'bold', 
        color: '#cccccc',
        marginBottom: '16px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
        <TeamOutlined />
        Collaboration Sessions
        <Badge count={activeSessions.length} showZero color="#52c41a" />
      </div>

      {/* Active Sessions */}
      {activeSessions.length > 0 && (
        <Card 
          size="small" 
          title={
            <div style={{ fontSize: '12px', color: '#cccccc' }}>
              Active Sessions ({activeSessions.length})
            </div>
          }
          style={{ marginBottom: '16px' }}
          bodyStyle={{ padding: '8px' }}
        >
          <List
            size="small"
            dataSource={activeSessions}
            renderItem={(session) => {
              const metrics = sessionMetrics.find(m => m.sessionId === session.id);
              const progress = getSessionProgress(session);
              
              return (
                <List.Item 
                  style={{ padding: '8px 0' }}
                  actions={[
                    <Tooltip title="View Details">
                      <Button 
                        size="small" 
                        type="text" 
                        icon={<EyeOutlined />}
                        onClick={() => {
                          setSelectedSession(session);
                          setShowSessionDetails(true);
                        }}
                      />
                    </Tooltip>,
                    <Tooltip title="Pause Session">
                      <Button 
                        size="small" 
                        type="text" 
                        icon={<PauseCircleOutlined />}
                        onClick={() => handleSessionAction(session.id, 'pause')}
                      />
                    </Tooltip>
                  ]}
                >
                  <List.Item.Meta
                    avatar={getSessionIcon(session.status)}
                    title={
                      <div style={{ fontSize: '11px', color: '#cccccc' }}>
                        Session {session.id.slice(-8)}
                        <Tag size="small" color={getSessionStatusColor(session.status)} style={{ marginLeft: '8px' }}>
                          {session.status}
                        </Tag>
                      </div>
                    }
                    description={
                      <div>
                        <div style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '4px',
                          marginBottom: '4px'
                        }}>
                          <Avatar.Group size="small" maxCount={3}>
                            {session.participants.map(participantId => (
                              <Tooltip key={participantId} title={getAgentName(participantId)}>
                                {getAgentAvatar(participantId)}
                              </Tooltip>
                            ))}
                          </Avatar.Group>
                          <span style={{ fontSize: '10px', color: '#888', marginLeft: '4px' }}>
                            {session.participants.length} participants
                          </span>
                        </div>
                        
                        <div style={{ 
                          display: 'flex', 
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          fontSize: '10px',
                          color: '#666',
                          marginBottom: '4px'
                        }}>
                          <span>
                            <FileOutlined /> {session.sharedFiles.length} files
                          </span>
                          <span>
                            <ClockCircleOutlined /> {metrics ? formatDuration(metrics.duration) : '0m'}
                          </span>
                        </div>

                        <Progress 
                          percent={progress} 
                          size="small" 
                          showInfo={false}
                          strokeColor="#52c41a"
                        />
                        <div style={{ fontSize: '9px', color: '#666', textAlign: 'right' }}>
                          {progress}% active
                        </div>
                      </div>
                    }
                  />
                </List.Item>
              );
            }}
          />
        </Card>
      )}

      {/* Paused Sessions */}
      {pausedSessions.length > 0 && (
        <Card 
          size="small" 
          title={
            <div style={{ fontSize: '12px', color: '#cccccc' }}>
              Paused Sessions ({pausedSessions.length})
            </div>
          }
          style={{ marginBottom: '16px' }}
          bodyStyle={{ padding: '8px' }}
        >
          <List
            size="small"
            dataSource={pausedSessions}
            renderItem={(session) => (
              <List.Item 
                style={{ padding: '4px 0', opacity: 0.7 }}
                actions={[
                  <Button 
                    size="small" 
                    type="text" 
                    icon={<PlayCircleOutlined />}
                    onClick={() => handleSessionAction(session.id, 'resume')}
                  >
                    Resume
                  </Button>
                ]}
              >
                <List.Item.Meta
                  avatar={getSessionIcon(session.status)}
                  title={
                    <div style={{ fontSize: '11px', color: '#cccccc' }}>
                      Session {session.id.slice(-8)}
                    </div>
                  }
                  description={
                    <div style={{ fontSize: '10px', color: '#888' }}>
                      {session.participants.map(getAgentName).join(', ')}
                    </div>
                  }
                />
              </List.Item>
            )}
          />
        </Card>
      )}

      {/* Recent Completed Sessions */}
      {completedSessions.length > 0 && (
        <Card 
          size="small" 
          title={
            <div style={{ fontSize: '12px', color: '#cccccc' }}>
              Recent Completed Sessions
            </div>
          }
          bodyStyle={{ padding: '8px' }}
        >
          <List
            size="small"
            dataSource={completedSessions}
            renderItem={(session) => {
              const metrics = sessionMetrics.find(m => m.sessionId === session.id);
              return (
                <List.Item style={{ padding: '4px 0', opacity: 0.6 }}>
                  <List.Item.Meta
                    avatar={getSessionIcon(session.status)}
                    title={
                      <div style={{ fontSize: '11px', color: '#cccccc' }}>
                        Session {session.id.slice(-8)}
                      </div>
                    }
                    description={
                      <div style={{ fontSize: '10px', color: '#888' }}>
                        {metrics ? formatDuration(metrics.duration) : '0m'} • {session.participants.length} agents
                      </div>
                    }
                  />
                </List.Item>
              );
            }}
          />
        </Card>
      )}

      {/* Empty State */}
      {activeSessions.length === 0 && pausedSessions.length === 0 && completedSessions.length === 0 && (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={
            <span style={{ color: '#888', fontSize: '12px' }}>
              No collaboration sessions yet
            </span>
          }
        />
      )}

      {/* Session Details Modal */}
      <Modal
        title={`Session Details - ${selectedSession?.id.slice(-8)}`}
        open={showSessionDetails}
        onCancel={() => setShowSessionDetails(false)}
        footer={null}
        width={600}
      >
        {selectedSession && (
          <div>
            <Descriptions size="small" column={2}>
              <Descriptions.Item label="Status">
                <Tag color={getSessionStatusColor(selectedSession.status)}>
                  {selectedSession.status}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Participants">
                {selectedSession.participants.length}
              </Descriptions.Item>
              <Descriptions.Item label="Shared Files">
                {selectedSession.sharedFiles.length}
              </Descriptions.Item>
              <Descriptions.Item label="Duration">
                {sessionMetrics.find(m => m.sessionId === selectedSession.id)?.duration || 0} minutes
              </Descriptions.Item>
              <Descriptions.Item label="Started">
                {new Date(selectedSession.startTime).toLocaleString()}
              </Descriptions.Item>
              {selectedSession.endTime && (
                <Descriptions.Item label="Ended">
                  {new Date(selectedSession.endTime).toLocaleString()}
                </Descriptions.Item>
              )}
            </Descriptions>

            <Divider />

            <div style={{ marginBottom: '16px' }}>
              <h4>Participants</h4>
              <Space wrap>
                {selectedSession.participants.map(participantId => (
                  <div key={participantId} style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '8px',
                    padding: '4px 8px',
                    border: '1px solid #d9d9d9',
                    borderRadius: '4px'
                  }}>
                    {getAgentAvatar(participantId)}
                    <span style={{ fontSize: '12px' }}>
                      {getAgentName(participantId)}
                    </span>
                  </div>
                ))}
              </Space>
            </div>

            <div>
              <h4>Shared Files</h4>
              <List
                size="small"
                dataSource={selectedSession.sharedFiles}
                renderItem={(filePath) => (
                  <List.Item>
                    <FileOutlined style={{ marginRight: '8px' }} />
                    <span style={{ fontSize: '12px' }}>{filePath}</span>
                  </List.Item>
                )}
              />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
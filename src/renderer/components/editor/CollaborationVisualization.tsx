/**
 * Collaboration Visualization Component
 * Shows real-time editing, conflict warnings, and collaboration history
 */

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { 
  Card, 
  Avatar, 
  Badge, 
  Timeline, 
  Tooltip, 
  Button, 
  Modal, 
  List, 
  Tag, 
  Alert,
  Space,
  Popover,
  Progress
} from 'antd';
import { 
  UserOutlined, 
  EditOutlined, 
  WarningOutlined, 
  ClockCircleOutlined,
  EyeOutlined,
  MessageOutlined,
  ContactsOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  CloseCircleOutlined
} from '@ant-design/icons';
import { useAppSelector } from '../../hooks/redux';
import * as monaco from 'monaco-editor';

interface CollaborationUser {
  id: string;
  name: string;
  avatar?: string;
  color: string;
  isOnline: boolean;
  lastSeen: Date;
  currentFile?: string;
  role: 'user' | 'agent';
  agentType?: string;
}

interface EditingActivity {
  id: string;
  userId: string;
  userName: string;
  filePath: string;
  fileName: string;
  action: 'edit' | 'save' | 'open' | 'close' | 'create' | 'delete';
  timestamp: Date;
  position?: monaco.IPosition;
  selection?: monaco.ISelection;
  content?: string;
  conflictResolved?: boolean;
}

interface ConflictWarning {
  id: string;
  filePath: string;
  fileName: string;
  users: string[];
  severity: 'low' | 'medium' | 'high';
  type: 'concurrent_edit' | 'file_lock' | 'merge_conflict';
  timestamp: Date;
  resolved: boolean;
  description: string;
}

interface CollaborationVisualizationProps {
  currentFile?: string;
  onUserClick?: (userId: string) => void;
  onConflictResolve?: (conflictId: string) => void;
  onJumpToEdit?: (activity: EditingActivity) => void;
  showHistory?: boolean;
  showConflicts?: boolean;
  maxHistoryItems?: number;
}

export const CollaborationVisualization: React.FC<CollaborationVisualizationProps> = ({
  currentFile,
  onUserClick,
  onConflictResolve,
  onJumpToEdit,
  showHistory = true,
  showConflicts = true,
  maxHistoryItems = 50
}) => {
  // Mock data - in real implementation, this would come from collaboration service
  const [collaborationUsers] = useState<CollaborationUser[]>([
    {
      id: 'user-1',
      name: 'You',
      color: '#1890ff',
      isOnline: true,
      lastSeen: new Date(),
      currentFile: currentFile,
      role: 'user'
    },
    {
      id: 'agent-frontend',
      name: 'Frontend Agent',
      color: '#52c41a',
      isOnline: true,
      lastSeen: new Date(Date.now() - 30000),
      currentFile: '/src/components/App.tsx',
      role: 'agent',
      agentType: 'frontend'
    },
    {
      id: 'agent-backend',
      name: 'Backend Agent',
      color: '#fa8c16',
      isOnline: true,
      lastSeen: new Date(Date.now() - 60000),
      currentFile: '/src/api/routes.ts',
      role: 'agent',
      agentType: 'backend'
    },
    {
      id: 'agent-testing',
      name: 'Testing Agent',
      color: '#722ed1',
      isOnline: false,
      lastSeen: new Date(Date.now() - 300000),
      role: 'agent',
      agentType: 'testing'
    }
  ]);

  const [editingHistory, setEditingHistory] = useState<EditingActivity[]>([
    {
      id: '1',
      userId: 'agent-frontend',
      userName: 'Frontend Agent',
      filePath: '/src/components/App.tsx',
      fileName: 'App.tsx',
      action: 'edit',
      timestamp: new Date(Date.now() - 120000),
      position: { lineNumber: 45, column: 12 },
      content: 'Added new component import'
    },
    {
      id: '2',
      userId: 'user-1',
      userName: 'You',
      filePath: '/src/styles/main.css',
      fileName: 'main.css',
      action: 'save',
      timestamp: new Date(Date.now() - 180000),
      content: 'Updated button styles'
    },
    {
      id: '3',
      userId: 'agent-backend',
      userName: 'Backend Agent',
      filePath: '/src/api/routes.ts',
      fileName: 'routes.ts',
      action: 'create',
      timestamp: new Date(Date.now() - 240000),
      content: 'Created new API endpoint'
    }
  ]);

  const [conflicts, setConflicts] = useState<ConflictWarning[]>([
    {
      id: 'conflict-1',
      filePath: '/src/components/Header.tsx',
      fileName: 'Header.tsx',
      users: ['user-1', 'agent-frontend'],
      severity: 'medium',
      type: 'concurrent_edit',
      timestamp: new Date(Date.now() - 60000),
      resolved: false,
      description: 'Both you and Frontend Agent are editing the same section'
    }
  ]);

  // Modal states
  const [isHistoryModalVisible, setIsHistoryModalVisible] = useState(false);
  const [isConflictModalVisible, setIsConflictModalVisible] = useState(false);

  // Get users currently editing the same file
  const currentFileCollaborators = useMemo(() => {
    if (!currentFile) return [];
    return collaborationUsers.filter(user => 
      user.currentFile === currentFile && user.isOnline && user.id !== 'user-1'
    );
  }, [currentFile, collaborationUsers]);

  // Get active conflicts for current file
  const currentFileConflicts = useMemo(() => {
    if (!currentFile) return [];
    return conflicts.filter(conflict => 
      conflict.filePath === currentFile && !conflict.resolved
    );
  }, [currentFile, conflicts]);

  // Handle conflict resolution
  const handleConflictResolve = useCallback((conflictId: string) => {
    setConflicts(prev => prev.map(conflict =>
      conflict.id === conflictId ? { ...conflict, resolved: true } : conflict
    ));
    onConflictResolve?.(conflictId);
  }, [onConflictResolve]);

  // Get user avatar
  const getUserAvatar = useCallback((user: CollaborationUser) => {
    if (user.avatar) {
      return <Avatar src={user.avatar}  />;
    }
    
    if (user.role === 'agent') {
      const agentIcons = {
        frontend: '🎨',
        backend: '⚙️',
        testing: '🧪',
        documentation: '📝',
        code_review: '👁️'
      };
      return (
        <Avatar 
           
          style={{ backgroundColor: user.color }}
        >
          {agentIcons[user.agentType as keyof typeof agentIcons] || '🤖'}
        </Avatar>
      );
    }
    
    return <Avatar icon={<UserOutlined />}  style={{ backgroundColor: user.color }} />;
  }, []);

  // Get activity icon
  const getActivityIcon = useCallback((action: EditingActivity['action']) => {
    const icons = {
      edit: <EditOutlined style={{ color: '#1890ff' }} />,
      save: <CheckCircleOutlined style={{ color: '#52c41a' }} />,
      open: <EyeOutlined style={{ color: '#722ed1' }} />,
      close: <CloseCircleOutlined style={{ color: '#8c8c8c' }} />,
      create: <CheckCircleOutlined style={{ color: '#52c41a' }} />,
      delete: <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />
    };
    return icons[action] || <EditOutlined />;
  }, []);

  // Get conflict severity color
  const getConflictSeverityColor = useCallback((severity: ConflictWarning['severity']) => {
    const colors = {
      low: '#faad14',
      medium: '#fa8c16',
      high: '#ff4d4f'
    };
    return colors[severity];
  }, []);

  // Render user presence indicator
  const renderUserPresence = () => {
    if (!currentFile || currentFileCollaborators.length === 0) {
      return null;
    }

    return (
      <Card 
         
        title="Currently Editing" 
        style={{ marginBottom: '16px' }}
        extra={
          <Badge count={currentFileCollaborators.length} showZero={false} />
        }
      >
        <Space wrap>
          {currentFileCollaborators.map(user => (
            <Tooltip 
              key={user.id}
              title={
                <div>
                  <div>{user.name}</div>
                  <div style={{ fontSize: '12px', opacity: 0.8 }}>
                    {user.role === 'agent' ? `${user.agentType} agent` : 'User'}
                  </div>
                  <div style={{ fontSize: '12px', opacity: 0.8 }}>
                    Last seen: {user.lastSeen.toLocaleTimeString()}
                  </div>
                </div>
              }
            >
              <div 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '4px',
                  cursor: 'pointer',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  border: `1px solid ${user.color}`,
                  background: `${user.color}10`
                }}
                onClick={() => onUserClick?.(user.id)}
              >
                <Badge dot status={user.isOnline ? 'success' : 'default'}>
                  {getUserAvatar(user)}
                </Badge>
                <span style={{ fontSize: '12px' }}>{user.name}</span>
              </div>
            </Tooltip>
          ))}
        </Space>
      </Card>
    );
  };

  // Render conflict warnings
  const renderConflictWarnings = () => {
    if (!showConflicts || currentFileConflicts.length === 0) {
      return null;
    }

    return (
      <Card 
         
        title="Conflict Warnings" 
        style={{ marginBottom: '16px' }}
        extra={
          <Badge count={currentFileConflicts.length} status="error" />
        }
      >
        {currentFileConflicts.map(conflict => (
          <Alert
            key={conflict.id}
            type="warning"
            showIcon
            icon={<ContactsOutlined />}
            message={
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 'bold' }}>{conflict.description}</div>
                  <div style={{ fontSize: '12px', opacity: 0.8 }}>
                    {conflict.timestamp.toLocaleTimeString()}
                  </div>
                </div>
                <Button 
                   
                  type="primary"
                  onClick={() => handleConflictResolve(conflict.id)}
                >
                  Resolve
                </Button>
              </div>
            }
            style={{ 
              marginBottom: '8px',
              borderColor: getConflictSeverityColor(conflict.severity)
            }}
          />
        ))}
      </Card>
    );
  };

  // Render recent activity
  const renderRecentActivity = () => {
    if (!showHistory) return null;

    const recentActivities = editingHistory
      .slice(0, 5)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    return (
      <Card 
         
        title="Recent Activity" 
        style={{ marginBottom: '16px' }}
        extra={
          <Button 
            type="link" 
            
            onClick={() => setIsHistoryModalVisible(true)}
          >
            View All
          </Button>
        }
      >
        <Timeline >
          {recentActivities.map(activity => {
            const user = collaborationUsers.find(u => u.id === activity.userId);
            return (
              <Timeline.Item
                key={activity.id}
                dot={getActivityIcon(activity.action)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      {user && getUserAvatar(user)}
                      <span style={{ fontWeight: 'bold', fontSize: '12px' }}>
                        {activity.userName}
                      </span>
                      <Tag  color={user?.color}>
                        {activity.action}
                      </Tag>
                    </div>
                    <div style={{ fontSize: '12px', marginBottom: '2px' }}>
                      {activity.fileName}
                    </div>
                    {activity.content && (
                      <div style={{ fontSize: '11px', opacity: 0.8, fontStyle: 'italic' }}>
                        {activity.content}
                      </div>
                    )}
                    <div style={{ fontSize: '11px', opacity: 0.6 }}>
                      {activity.timestamp.toLocaleTimeString()}
                    </div>
                  </div>
                  {activity.position && (
                    <Button 
                      type="link" 
                      
                      onClick={() => onJumpToEdit?.(activity)}
                    >
                      Jump
                    </Button>
                  )}
                </div>
              </Timeline.Item>
            );
          })}
        </Timeline>
      </Card>
    );
  };

  // Render collaboration stats
  const renderCollaborationStats = () => {
    const onlineUsers = collaborationUsers.filter(u => u.isOnline);
    const activeAgents = onlineUsers.filter(u => u.role === 'agent');
    const totalConflicts = conflicts.filter(c => !c.resolved).length;

    return (
      <Card  title="Collaboration Stats">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Online Users:</span>
            <Badge count={onlineUsers.length} showZero />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Active Agents:</span>
            <Badge count={activeAgents.length} showZero />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Open Conflicts:</span>
            <Badge count={totalConflicts} status={totalConflicts > 0 ? 'error' : 'success'} />
          </div>
          <div>
            <div style={{ marginBottom: '4px' }}>Collaboration Health:</div>
            <Progress 
              percent={totalConflicts === 0 ? 100 : Math.max(20, 100 - (totalConflicts * 20))}
              
              status={totalConflicts === 0 ? 'success' : totalConflicts > 2 ? 'exception' : 'active'}
            />
          </div>
        </div>
      </Card>
    );
  };

  return (
    <div style={{ padding: '16px' }}>
      {renderUserPresence()}
      {renderConflictWarnings()}
      {renderRecentActivity()}
      {renderCollaborationStats()}

      {/* Full History Modal */}
      <Modal
        title="Collaboration History"
        open={isHistoryModalVisible}
        onCancel={() => setIsHistoryModalVisible(false)}
        footer={null}
        width={700}
      >
        <List
          dataSource={editingHistory}
          renderItem={(activity) => {
            const user = collaborationUsers.find(u => u.id === activity.userId);
            return (
              <List.Item
                actions={[
                  activity.position && (
                    <Button
                      type="link"
                      
                      onClick={() => {
                        onJumpToEdit?.(activity);
                        setIsHistoryModalVisible(false);
                      }}
                    >
                      Jump to Edit
                    </Button>
                  )
                ].filter(Boolean)}
              >
                <List.Item.Meta
                  avatar={user && getUserAvatar(user)}
                  title={
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span>{activity.userName}</span>
                      <Tag  color={user?.color}>
                        {activity.action}
                      </Tag>
                      {getActivityIcon(activity.action)}
                    </div>
                  }
                  description={
                    <div>
                      <div>{activity.fileName}</div>
                      {activity.content && (
                        <div style={{ fontStyle: 'italic', opacity: 0.8 }}>
                          {activity.content}
                        </div>
                      )}
                      <div style={{ fontSize: '12px', opacity: 0.6 }}>
                        {activity.timestamp.toLocaleString()}
                        {activity.position && (
                          <span> - Line {activity.position.lineNumber}, Column {activity.position.column}</span>
                        )}
                      </div>
                    </div>
                  }
                />
              </List.Item>
            );
          }}
        />
      </Modal>
    </div>
  );
};

export default CollaborationVisualization;
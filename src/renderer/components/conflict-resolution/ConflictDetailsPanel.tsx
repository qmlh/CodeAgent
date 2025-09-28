/**
 * Conflict Details Panel
 * Displays detailed information about the conflict and involved agents
 */

import React from 'react';
import { Card, Descriptions, Tag, Avatar, Space, Typography, Timeline, Divider } from 'antd';
import { 
  FileTextOutlined, 
  UserOutlined, 
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  TeamOutlined,
  BranchesOutlined
} from '@ant-design/icons';
import { ConflictUIState } from '../../types/conflict';
import { formatDistanceToNow } from 'date-fns';
import './ConflictDetailsPanel.css';

const { Text, Title } = Typography;

interface ConflictDetailsPanelProps {
  conflict: ConflictUIState;
}

export const ConflictDetailsPanel: React.FC<ConflictDetailsPanelProps> = ({
  conflict
}) => {
  const getConflictTypeColor = (type: string) => {
    switch (type) {
      case 'concurrent_modification':
        return 'orange';
      case 'lock_timeout':
        return 'red';
      case 'merge_conflict':
        return 'volcano';
      default:
        return 'default';
    }
  };

  const getConflictTypeLabel = (type: string) => {
    switch (type) {
      case 'concurrent_modification':
        return 'Concurrent Modification';
      case 'lock_timeout':
        return 'Lock Timeout';
      case 'merge_conflict':
        return 'Merge Conflict';
      default:
        return type.replace('_', ' ');
    }
  };

  const getAgentTypeColor = (type: string) => {
    switch (type) {
      case 'frontend':
        return 'blue';
      case 'backend':
        return 'green';
      case 'testing':
        return 'purple';
      case 'documentation':
        return 'cyan';
      case 'code_review':
        return 'gold';
      case 'devops':
        return 'red';
      default:
        return 'default';
    }
  };

  return (
    <div className="conflict-details-panel">
      <div className="details-section">
        <Title level={5}>
          <FileTextOutlined /> Conflict Information
        </Title>
        
        <Descriptions column={1} >
          <Descriptions.Item label="File">
            <Text code>{conflict.conflict.filePath}</Text>
          </Descriptions.Item>
          
          <Descriptions.Item label="Type">
            <Tag color={getConflictTypeColor(conflict.conflict.conflictType)}>
              {getConflictTypeLabel(conflict.conflict.conflictType)}
            </Tag>
          </Descriptions.Item>
          
          <Descriptions.Item label="Created">
            <Space>
              <ClockCircleOutlined />
              <Text>{formatDistanceToNow(conflict.conflict.createdAt)} ago</Text>
            </Space>
          </Descriptions.Item>
          
          <Descriptions.Item label="Status">
            <Tag color={conflict.conflict.resolved ? 'green' : 'red'}>
              {conflict.conflict.resolved ? 'Resolved' : 'Active'}
            </Tag>
          </Descriptions.Item>
        </Descriptions>
      </div>

      <Divider />

      <div className="details-section">
        <Title level={5}>
          <TeamOutlined /> Involved Agents
        </Title>
        
        <div className="agents-list">
          {conflict.involvedAgents.map((agent) => (
            <Card key={agent.id}  className="agent-card">
              <div className="agent-info">
                <Avatar 
                   
                  icon={<UserOutlined />}
                  style={{ backgroundColor: getAgentTypeColor(agent.type) }}
                />
                <div className="agent-details">
                  <Text strong>{agent.name}</Text>
                  <div>
                    <Tag color={getAgentTypeColor(agent.type)}>
                      {agent.type}
                    </Tag>
                    <Tag color={agent.status === 'working' ? 'green' : 'default'}>
                      {agent.status}
                    </Tag>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      <Divider />

      <div className="details-section">
        <Title level={5}>
          <ExclamationCircleOutlined /> Description
        </Title>
        
        <Text>{conflict.conflict.description}</Text>
      </div>

      <Divider />

      <div className="details-section">
        <Title level={5}>
          <BranchesOutlined /> Resolution Timeline
        </Title>
        
        <Timeline>
          <Timeline.Item color="red">
            <Text strong>Conflict Detected</Text>
            <br />
            <Text type="secondary">
              {formatDistanceToNow(conflict.conflict.createdAt)} ago
            </Text>
          </Timeline.Item>
          
          {conflict.isResolving && (
            <Timeline.Item color="blue">
              <Text strong>Resolution in Progress</Text>
              <br />
              <Text type="secondary">Currently being resolved</Text>
            </Timeline.Item>
          )}
          
          {conflict.hasUnsavedChanges && (
            <Timeline.Item color="orange">
              <Text strong>Changes Made</Text>
              <br />
              <Text type="secondary">Unsaved changes in merged content</Text>
            </Timeline.Item>
          )}
        </Timeline>
      </div>

      <Divider />

      <div className="details-section">
        <Title level={5}>Statistics</Title>
        
        <Descriptions column={1} >
          <Descriptions.Item label="Local Lines">
            {conflict.localContent.split('\n').length}
          </Descriptions.Item>
          
          <Descriptions.Item label="Remote Lines">
            {conflict.remoteContent.split('\n').length}
          </Descriptions.Item>
          
          <Descriptions.Item label="Merged Lines">
            {conflict.mergedContent.split('\n').length}
          </Descriptions.Item>
          
          <Descriptions.Item label="Suggestions">
            {conflict.resolutionSuggestions.length}
          </Descriptions.Item>
        </Descriptions>
      </div>
    </div>
  );
};
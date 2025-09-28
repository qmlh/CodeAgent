/**
 * Conflict Resolution Demo Component
 * Demo component to test conflict resolution functionality
 */

import React from 'react';
import { Card, Button, Space, Typography, Divider, Alert } from 'antd';
import { 
  ExclamationCircleOutlined, 
  PlayCircleOutlined,
  HistoryOutlined,
  SettingOutlined,
  BugOutlined
} from '@ant-design/icons';
import { useConflictResolution } from '../../hooks/useConflictResolution';

const { Title, Text, Paragraph } = Typography;

export const ConflictResolutionDemo: React.FC = () => {
  const {
    activeConflicts,
    conflictHistory,
    preventionAlerts,
    hasActiveConflicts,
    hasUnresolvedAlerts,
    totalConflictsResolved,
    openConflictResolution,
    openConflictWizard,
    simulateConflictDetection
  } = useConflictResolution();

  const handleOpenFirstConflict = () => {
    if (activeConflicts.length > 0) {
      openConflictResolution(activeConflicts[0].id);
    }
  };

  const handleOpenWizardForFirstConflict = () => {
    if (activeConflicts.length > 0) {
      openConflictWizard(activeConflicts[0].id);
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
      <Title level={2}>
        <ExclamationCircleOutlined /> Conflict Resolution System Demo
      </Title>
      
      <Paragraph>
        This demo showcases the file conflict resolution interface and workflow. 
        The system helps resolve conflicts when multiple AI agents work on the same files.
      </Paragraph>

      <Alert
        message="Demo Mode"
        description="This is a demonstration of the conflict resolution system. In a real environment, conflicts would be detected automatically when agents modify files."
        type="info"
        showIcon
        style={{ marginBottom: '24px' }}
      />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
        <Card title="System Status" >
          <Space direction="vertical" style={{ width: '100%' }}>
            <div>
              <Text strong>Active Conflicts: </Text>
              <Text type={hasActiveConflicts ? 'danger' : 'success'}>
                {activeConflicts.length}
              </Text>
            </div>
            <div>
              <Text strong>Unresolved Alerts: </Text>
              <Text type={hasUnresolvedAlerts ? 'warning' : 'success'}>
                {preventionAlerts.filter((a: any) => !a.dismissed).length}
              </Text>
            </div>
            <div>
              <Text strong>Total Resolved: </Text>
              <Text>{totalConflictsResolved}</Text>
            </div>
          </Space>
        </Card>

        <Card title="Quick Actions" >
          <Space direction="vertical" style={{ width: '100%' }}>
            <Button 
              type="primary" 
              icon={<BugOutlined />}
              onClick={simulateConflictDetection}
              block
            >
              Simulate Conflict Detection
            </Button>
            <Button 
              icon={<PlayCircleOutlined />}
              onClick={handleOpenFirstConflict}
              disabled={!hasActiveConflicts}
              block
            >
              Open Conflict Resolution
            </Button>
            <Button 
              icon={<SettingOutlined />}
              onClick={handleOpenWizardForFirstConflict}
              disabled={!hasActiveConflicts}
              block
            >
              Open Resolution Wizard
            </Button>
          </Space>
        </Card>
      </div>

      <Divider />

      <Title level={3}>Features Implemented</Title>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <Card title="Conflict Resolution Dialog" >
          <ul>
            <li>�?Three-way diff view (Local, Remote, Merged)</li>
            <li>�?Syntax highlighting and line numbers</li>
            <li>�?Accept local/remote buttons</li>
            <li>�?Manual merge editing</li>
            <li>�?Undo/Redo functionality</li>
            <li>�?View mode switching</li>
          </ul>
        </Card>

        <Card title="Resolution Suggestions" >
          <ul>
            <li>�?AI-generated resolution suggestions</li>
            <li>�?Confidence scoring</li>
            <li>�?Reasoning explanations</li>
            <li>�?One-click suggestion application</li>
            <li>�?Preview functionality</li>
          </ul>
        </Card>

        <Card title="File Lock Indicators" >
          <ul>
            <li>�?File tree lock indicators</li>
            <li>�?Editor tab lock status</li>
            <li>�?Lock type visualization</li>
            <li>�?Agent information display</li>
            <li>�?Expiration warnings</li>
          </ul>
        </Card>

        <Card title="Prevention Alerts" >
          <ul>
            <li>�?Real-time conflict warnings</li>
            <li>�?Agent involvement tracking</li>
            <li>�?Severity levels</li>
            <li>�?Auto-dismissal for info alerts</li>
            <li>�?Alert history management</li>
          </ul>
        </Card>

        <Card title="Conflict History" >
          <ul>
            <li>�?Historical conflict data</li>
            <li>�?Search and filtering</li>
            <li>�?Resolution statistics</li>
            <li>�?Performance metrics</li>
            <li>�?Detailed conflict information</li>
          </ul>
        </Card>

        <Card title="Resolution Wizard" >
          <ul>
            <li>�?Step-by-step guidance</li>
            <li>�?Conflict analysis</li>
            <li>�?Strategy selection</li>
            <li>�?Result validation</li>
            <li>�?Best practices recommendations</li>
          </ul>
        </Card>
      </div>

      <Divider />

      <Title level={3}>Usage Instructions</Title>
      
      <Card>
        <ol>
          <li>
            <strong>Simulate a Conflict:</strong> Click "Simulate Conflict Detection" to create a mock conflict scenario.
          </li>
          <li>
            <strong>View Prevention Alerts:</strong> Watch for real-time alerts that appear in the top-right corner.
          </li>
          <li>
            <strong>Open Resolution Dialog:</strong> Click "Open Conflict Resolution" to see the three-way diff interface.
          </li>
          <li>
            <strong>Try Resolution Options:</strong> Use "Accept Local", "Accept Remote", or manually edit the merged content.
          </li>
          <li>
            <strong>Use the Wizard:</strong> Click "Open Resolution Wizard" for guided conflict resolution.
          </li>
          <li>
            <strong>Check File Locks:</strong> Look for lock indicators in the file tree (when files are locked by agents).
          </li>
        </ol>
      </Card>

      <Alert
        message="Integration Points"
        description={
          <div>
            <p>This conflict resolution system integrates with:</p>
            <ul>
              <li>File tree components (lock indicators)</li>
              <li>Editor tabs (lock status)</li>
              <li>Agent management system</li>
              <li>File management services</li>
              <li>Real-time communication system</li>
            </ul>
          </div>
        }
        type="info"
        showIcon
        style={{ marginTop: '24px' }}
      />
    </div>
  );
};
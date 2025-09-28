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
            <li>âœ?Three-way diff view (Local, Remote, Merged)</li>
            <li>âœ?Syntax highlighting and line numbers</li>
            <li>âœ?Accept local/remote buttons</li>
            <li>âœ?Manual merge editing</li>
            <li>âœ?Undo/Redo functionality</li>
            <li>âœ?View mode switching</li>
          </ul>
        </Card>

        <Card title="Resolution Suggestions" >
          <ul>
            <li>âœ?AI-generated resolution suggestions</li>
            <li>âœ?Confidence scoring</li>
            <li>âœ?Reasoning explanations</li>
            <li>âœ?One-click suggestion application</li>
            <li>âœ?Preview functionality</li>
          </ul>
        </Card>

        <Card title="File Lock Indicators" >
          <ul>
            <li>âœ?File tree lock indicators</li>
            <li>âœ?Editor tab lock status</li>
            <li>âœ?Lock type visualization</li>
            <li>âœ?Agent information display</li>
            <li>âœ?Expiration warnings</li>
          </ul>
        </Card>

        <Card title="Prevention Alerts" >
          <ul>
            <li>âœ?Real-time conflict warnings</li>
            <li>âœ?Agent involvement tracking</li>
            <li>âœ?Severity levels</li>
            <li>âœ?Auto-dismissal for info alerts</li>
            <li>âœ?Alert history management</li>
          </ul>
        </Card>

        <Card title="Conflict History" >
          <ul>
            <li>âœ?Historical conflict data</li>
            <li>âœ?Search and filtering</li>
            <li>âœ?Resolution statistics</li>
            <li>âœ?Performance metrics</li>
            <li>âœ?Detailed conflict information</li>
          </ul>
        </Card>

        <Card title="Resolution Wizard" >
          <ul>
            <li>âœ?Step-by-step guidance</li>
            <li>âœ?Conflict analysis</li>
            <li>âœ?Strategy selection</li>
            <li>âœ?Result validation</li>
            <li>âœ?Best practices recommendations</li>
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
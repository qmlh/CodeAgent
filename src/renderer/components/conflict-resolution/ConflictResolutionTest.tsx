/**
 * Conflict Resolution Test Component
 * Simple test component to verify the conflict resolution system works
 */

import React from 'react';
import { Button, Space, Typography, Card } from 'antd';
import { useConflictResolution } from '../../hooks/useConflictResolution';

const { Title, Text } = Typography;

export const ConflictResolutionTest: React.FC = () => {
  const {
    activeConflicts,
    hasActiveConflicts,
    openConflictResolution,
    simulateConflictDetection
  } = useConflictResolution();

  return (
    <Card title="Conflict Resolution System Test" style={{ margin: '20px' }}>
      <Space direction="vertical" style={{ width: '100%' }}>
        <div>
          <Text strong>Status: </Text>
          <Text type={hasActiveConflicts ? 'danger' : 'success'}>
            {hasActiveConflicts ? `${activeConflicts.length} active conflicts` : 'No conflicts'}
          </Text>
        </div>
        
        <Space>
          <Button 
            type="primary" 
            onClick={simulateConflictDetection}
          >
            Simulate Conflict
          </Button>
          
          {hasActiveConflicts && (
            <Button 
              onClick={() => openConflictResolution(activeConflicts[0].id)}
            >
              Open Resolution Dialog
            </Button>
          )}
        </Space>
        
        <Text type="secondary">
          Click "Simulate Conflict" to create a test conflict, then "Open Resolution Dialog" to see the interface.
        </Text>
      </Space>
    </Card>
  );
};
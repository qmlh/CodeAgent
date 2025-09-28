import React, { useState } from 'react';
import { Card, Tabs, Button, Space, Typography, Badge } from 'antd';
import { BugOutlined, RocketOutlined, MessageOutlined, ToolOutlined, QuestionCircleOutlined } from '@ant-design/icons';
import { TestingSuite } from './TestingSuite';
import { E2ETestingTool } from './E2ETestingTool';
import { PerformanceMonitor } from '../performance/PerformanceMonitor';
import { OptimizationTools } from '../optimization/OptimizationTools';
import { FeedbackSystem } from '../feedback/FeedbackSystem';
import { DiagnosticsPanel } from '../diagnostics/DiagnosticsPanel';
import { UserGuidanceSystem } from '../guidance/UserGuidanceSystem';
import { ErrorBoundary } from '../error/ErrorBoundary';
import { CrashRecoveryDialog } from '../error/CrashRecoveryDialog';
import './TestingAndUXHub.css';

const { Title } = Typography;
const { TabPane } = Tabs;

export const TestingAndUXHub: React.FC = () => {
  const [activeTab, setActiveTab] = useState('testing');
  const [showFeedback, setShowFeedback] = useState(false);
  const [showCrashRecovery, setShowCrashRecovery] = useState(false);

  const handleCrashRecovery = (selectedItems: string[]) => {
    console.log('Recovering items:', selectedItems);
    setShowCrashRecovery(false);
    // In a real app, this would restore the selected items
  };

  const tabItems = [
    {
      key: 'testing',
      label: (
        <Space>
          <BugOutlined />
          Testing Suite
        </Space>
      ),
      children: <TestingSuite />
    },
    {
      key: 'e2e',
      label: (
        <Space>
          <RocketOutlined />
          E2E Testing
        </Space>
      ),
      children: <E2ETestingTool />
    },
    {
      key: 'performance',
      label: (
        <Space>
          <RocketOutlined />
          Performance
          <Badge count={3}  />
        </Space>
      ),
      children: <PerformanceMonitor />
    },
    {
      key: 'optimization',
      label: (
        <Space>
          <RocketOutlined />
          Optimization
          <Badge count={5}  />
        </Space>
      ),
      children: <OptimizationTools />
    },
    {
      key: 'diagnostics',
      label: (
        <Space>
          <ToolOutlined />
          Diagnostics
          <Badge count={2}  status="warning" />
        </Space>
      ),
      children: <DiagnosticsPanel />
    },
    {
      key: 'guidance',
      label: (
        <Space>
          <QuestionCircleOutlined />
          Help & Tutorials
        </Space>
      ),
      children: <UserGuidanceSystem />
    }
  ];

  return (
    <ErrorBoundary>
      <div className="testing-ux-hub">
        <Card
          title={
            <Space>
              <BugOutlined />
              <Title level={3} style={{ margin: 0 }}>Testing & User Experience Hub</Title>
            </Space>
          }
          extra={
            <Space>
              <Button
                icon={<MessageOutlined />}
                onClick={() => setShowFeedback(true)}
              >
                Send Feedback
              </Button>
              <Button
                type="dashed"
                onClick={() => setShowCrashRecovery(true)}
              >
                Test Crash Recovery
              </Button>
            </Space>
          }
          className="hub-card"
        >
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            type="card"
            size="large"
            items={tabItems}
          />
        </Card>

        {/* Feedback System */}
        <FeedbackSystem
          visible={showFeedback}
          onClose={() => setShowFeedback(false)}
        />

        {/* Crash Recovery Dialog */}
        <CrashRecoveryDialog
          visible={showCrashRecovery}
          onClose={() => setShowCrashRecovery(false)}
          onRecover={handleCrashRecovery}
        />
      </div>
    </ErrorBoundary>
  );
};
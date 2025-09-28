import React, { useState } from 'react';
import { Button, Space, Typography, Alert, Card } from 'antd';
import { BugOutlined, RocketOutlined, ExperimentOutlined } from '@ant-design/icons';
import { TestingAndUXHub } from './TestingAndUXHub';
import { ErrorBoundary } from '../error/ErrorBoundary';
import './TestingAndUXDemo.css';

const { Title, Paragraph } = Typography;

export const TestingAndUXDemo: React.FC = () => {
  const [showHub, setShowHub] = useState(false);
  const [triggerError, setTriggerError] = useState(false);

  // Component that will throw an error for testing ErrorBoundary
  const ErrorComponent: React.FC = () => {
    if (triggerError) {
      throw new Error('This is a test error to demonstrate the ErrorBoundary component');
    }
    return null;
  };

  const handleTriggerError = () => {
    setTriggerError(true);
  };

  if (showHub) {
    return <TestingAndUXHub />;
  }

  return (
    <div className="testing-ux-demo">
      <Card className="demo-card">
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div className="demo-header">
            <Title level={2}>
              <Space>
                <ExperimentOutlined />
                Testing & User Experience Features Demo
              </Space>
            </Title>
            <Paragraph>
              This demo showcases the comprehensive testing, optimization, and user experience 
              features implemented for the Multi-Agent IDE. Click the button below to explore 
              all the features in an integrated interface.
            </Paragraph>
          </div>

          <Alert
            message="Features Implemented"
            description={
              <ul style={{ margin: 0, paddingLeft: 20 }}>
                <li><strong>UI Component Testing Suite:</strong> Unit tests, snapshot tests, and interaction tests with automated test runner</li>
                <li><strong>End-to-End Testing Tool:</strong> User operation recording, test scenario playback, and visual test reports</li>
                <li><strong>Performance Monitoring Panel:</strong> Real-time CPU, memory, and rendering performance metrics with charts</li>
                <li><strong>Error Handling Interface:</strong> Error boundaries, crash recovery dialogs, and error reporting system</li>
                <li><strong>Application Optimization Tools:</strong> Startup analysis, resource optimization suggestions, and bottleneck detection</li>
                <li><strong>User Feedback System:</strong> Feedback forms, screenshot capture, system info collection, and log gathering</li>
                <li><strong>Diagnostic Tools Panel:</strong> System information, configuration checks, compatibility tests, and auto-fix capabilities</li>
                <li><strong>User Guidance System:</strong> Interactive tutorials, help documentation, and interface tours</li>
              </ul>
            }
            type="info"
            style={{ textAlign: 'left' }}
          />

          <div className="demo-actions">
            <Space size="large">
              <Button
                type="primary"
                size="large"
                icon={<RocketOutlined />}
                onClick={() => setShowHub(true)}
              >
                Launch Testing & UX Hub
              </Button>
              
              <Button
                danger
                size="large"
                icon={<BugOutlined />}
                onClick={handleTriggerError}
              >
                Test Error Boundary
              </Button>
            </Space>
          </div>

          <Alert
            message="Requirements Fulfilled"
            description="This implementation addresses Requirements 7.1 (desktop IDE interface) and 10.1 (user experience) by providing comprehensive testing tools, performance monitoring, error handling, optimization features, user feedback systems, diagnostics, and user guidance - all integrated into a professional desktop application interface."
            type="success"
          />
        </Space>
      </Card>

      <ErrorBoundary>
        <ErrorComponent />
      </ErrorBoundary>
    </div>
  );
};
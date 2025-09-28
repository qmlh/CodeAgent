import React, { useState, useEffect } from 'react';
import { Card, Tabs, Button, Progress, List, Tag, Space, Typography, Alert } from 'antd';
import { PlayCircleOutlined, PauseCircleOutlined, ReloadOutlined, FileTextOutlined } from '@ant-design/icons';
import './TestingSuite.css';

const { Title, Text } = Typography;
const { TabPane } = Tabs;

interface TestResult {
  id: string;
  name: string;
  type: 'unit' | 'snapshot' | 'interaction';
  status: 'pending' | 'running' | 'passed' | 'failed';
  duration?: number;
  error?: string;
  coverage?: number;
}

interface TestSuite {
  name: string;
  tests: TestResult[];
  totalTests: number;
  passedTests: number;
  failedTests: number;
  coverage: number;
}

export const TestingSuite: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [testSuites, setTestSuites] = useState<TestSuite[]>([]);
  const [selectedSuite, setSelectedSuite] = useState<string>('unit');
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Initialize test suites
    setTestSuites([
      {
        name: 'Unit Tests',
        tests: [
          { id: '1', name: 'Agent Component Rendering', type: 'unit', status: 'passed', duration: 120, coverage: 95 },
          { id: '2', name: 'Task Manager Logic', type: 'unit', status: 'passed', duration: 85, coverage: 88 },
          { id: '3', name: 'File Manager Operations', type: 'unit', status: 'failed', error: 'Mock file system error', coverage: 72 },
        ],
        totalTests: 3,
        passedTests: 2,
        failedTests: 1,
        coverage: 85
      },
      {
        name: 'Snapshot Tests',
        tests: [
          { id: '4', name: 'Settings Dialog Snapshot', type: 'snapshot', status: 'passed', duration: 45 },
          { id: '5', name: 'Agent Panel Snapshot', type: 'snapshot', status: 'passed', duration: 38 },
          { id: '6', name: 'Task Board Snapshot', type: 'snapshot', status: 'pending' },
        ],
        totalTests: 3,
        passedTests: 2,
        failedTests: 0,
        coverage: 92
      },
      {
        name: 'Interaction Tests',
        tests: [
          { id: '7', name: 'Drag and Drop Tasks', type: 'interaction', status: 'passed', duration: 340 },
          { id: '8', name: 'File Tree Navigation', type: 'interaction', status: 'running' },
          { id: '9', name: 'Agent Creation Workflow', type: 'interaction', status: 'pending' },
        ],
        totalTests: 3,
        passedTests: 1,
        failedTests: 0,
        coverage: 78
      }
    ]);
  }, []);

  const runTests = async (suiteType?: string) => {
    setIsRunning(true);
    setProgress(0);

    // Simulate test execution
    for (let i = 0; i <= 100; i += 10) {
      await new Promise(resolve => setTimeout(resolve, 200));
      setProgress(i);
    }

    setIsRunning(false);
    setProgress(100);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'passed': return 'success';
      case 'failed': return 'error';
      case 'running': return 'processing';
      default: return 'default';
    }
  };

  const renderTestList = (tests: TestResult[]) => (
    <List
      dataSource={tests}
      renderItem={(test) => (
        <List.Item
          actions={[
            test.duration && <Text type="secondary">{test.duration}ms</Text>,
            test.coverage && <Text type="secondary">{test.coverage}% coverage</Text>
          ]}
        >
          <List.Item.Meta
            title={
              <Space>
                <Tag color={getStatusColor(test.status)}>{test.status.toUpperCase()}</Tag>
                {test.name}
              </Space>
            }
            description={test.error && <Text type="danger">{test.error}</Text>}
          />
        </List.Item>
      )}
    />
  );

  const currentSuite = testSuites.find(suite => 
    suite.name.toLowerCase().includes(selectedSuite)
  );

  return (
    <div className="testing-suite">
      <Card
        title={
          <Space>
            <FileTextOutlined />
            <Title level={4} style={{ margin: 0 }}>UI Component Testing Suite</Title>
          </Space>
        }
        extra={
          <Space>
            <Button
              type="primary"
              icon={isRunning ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
              onClick={() => runTests()}
              loading={isRunning}
            >
              {isRunning ? 'Running...' : 'Run All Tests'}
            </Button>
            <Button icon={<ReloadOutlined />} onClick={() => runTests()}>
              Refresh
            </Button>
          </Space>
        }
      >
        {isRunning && (
          <Alert
            message="Running Tests"
            description={<Progress percent={progress} status="active" />}
            type="info"
            style={{ marginBottom: 16 }}
          />
        )}

        <Tabs activeKey={selectedSuite} onChange={setSelectedSuite}>
          <TabPane tab="Unit Tests" key="unit">
            {currentSuite && (
              <>
                <div className="test-summary">
                  <Space size="large">
                    <Text>Total: <strong>{currentSuite.totalTests}</strong></Text>
                    <Text type="success">Passed: <strong>{currentSuite.passedTests}</strong></Text>
                    <Text type="danger">Failed: <strong>{currentSuite.failedTests}</strong></Text>
                    <Text>Coverage: <strong>{currentSuite.coverage}%</strong></Text>
                  </Space>
                </div>
                {renderTestList(currentSuite.tests)}
              </>
            )}
          </TabPane>
          
          <TabPane tab="Snapshot Tests" key="snapshot">
            {testSuites[1] && (
              <>
                <div className="test-summary">
                  <Space size="large">
                    <Text>Total: <strong>{testSuites[1].totalTests}</strong></Text>
                    <Text type="success">Passed: <strong>{testSuites[1].passedTests}</strong></Text>
                    <Text type="danger">Failed: <strong>{testSuites[1].failedTests}</strong></Text>
                    <Text>Coverage: <strong>{testSuites[1].coverage}%</strong></Text>
                  </Space>
                </div>
                {renderTestList(testSuites[1].tests)}
              </>
            )}
          </TabPane>
          
          <TabPane tab="Interaction Tests" key="interaction">
            {testSuites[2] && (
              <>
                <div className="test-summary">
                  <Space size="large">
                    <Text>Total: <strong>{testSuites[2].totalTests}</strong></Text>
                    <Text type="success">Passed: <strong>{testSuites[2].passedTests}</strong></Text>
                    <Text type="danger">Failed: <strong>{testSuites[2].failedTests}</strong></Text>
                    <Text>Coverage: <strong>{testSuites[2].coverage}%</strong></Text>
                  </Space>
                </div>
                {renderTestList(testSuites[2].tests)}
              </>
            )}
          </TabPane>
        </Tabs>
      </Card>
    </div>
  );
};
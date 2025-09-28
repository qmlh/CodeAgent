import React, { useState, useEffect } from 'react';
import { Card, Button, List, Modal, Form, Input, Select, Space, Typography, Tag, Progress, Divider } from 'antd';
import { PlayCircleOutlined, VideoCameraOutlined, StopOutlined, EyeOutlined, DownloadOutlined } from '@ant-design/icons';
import './E2ETestingTool.css';

const { Title, Text } = Typography;
const { Option } = Select;

interface TestScenario {
  id: string;
  name: string;
  description: string;
  steps: TestStep[];
  status: 'idle' | 'recording' | 'running' | 'completed' | 'failed';
  duration?: number;
  lastRun?: Date;
}

interface TestStep {
  id: string;
  action: string;
  target: string;
  value?: string;
  screenshot?: string;
}

interface TestReport {
  id: string;
  scenarioId: string;
  scenarioName: string;
  status: 'passed' | 'failed';
  duration: number;
  timestamp: Date;
  screenshots: string[];
  errors?: string[];
}

export const E2ETestingTool: React.FC = () => {
  const [scenarios, setScenarios] = useState<TestScenario[]>([]);
  const [reports, setReports] = useState<TestReport[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [selectedScenario, setSelectedScenario] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState<TestReport | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    // Initialize with sample scenarios
    setScenarios([
      {
        id: '1',
        name: 'Agent Creation Workflow',
        description: 'Test complete agent creation process',
        steps: [
          { id: '1', action: 'click', target: 'create-agent-button' },
          { id: '2', action: 'type', target: 'agent-name-input', value: 'Test Agent' },
          { id: '3', action: 'select', target: 'agent-type-select', value: 'frontend' },
          { id: '4', action: 'click', target: 'create-button' }
        ],
        status: 'completed',
        duration: 2340,
        lastRun: new Date('2024-01-15T10:30:00')
      },
      {
        id: '2',
        name: 'File Management Operations',
        description: 'Test file creation, editing, and deletion',
        steps: [
          { id: '1', action: 'click', target: 'file-tree' },
          { id: '2', action: 'rightclick', target: 'project-folder' },
          { id: '3', action: 'click', target: 'new-file-menu' },
          { id: '4', action: 'type', target: 'filename-input', value: 'test.js' }
        ],
        status: 'idle',
        lastRun: new Date('2024-01-14T15:20:00')
      }
    ]);

    setReports([
      {
        id: '1',
        scenarioId: '1',
        scenarioName: 'Agent Creation Workflow',
        status: 'passed',
        duration: 2340,
        timestamp: new Date('2024-01-15T10:30:00'),
        screenshots: ['screenshot1.png', 'screenshot2.png']
      },
      {
        id: '2',
        scenarioId: '2',
        scenarioName: 'File Management Operations',
        status: 'failed',
        duration: 1890,
        timestamp: new Date('2024-01-14T15:20:00'),
        screenshots: ['screenshot3.png'],
        errors: ['Element not found: filename-input']
      }
    ]);
  }, []);

  const startRecording = () => {
    setIsRecording(true);
    // In a real implementation, this would start recording user interactions
    console.log('Started recording user interactions...');
  };

  const stopRecording = () => {
    setIsRecording(false);
    console.log('Stopped recording');
  };

  const runScenario = async (scenarioId: string) => {
    setIsRunning(true);
    setSelectedScenario(scenarioId);

    // Simulate test execution
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Update scenario status
    setScenarios(prev => prev.map(scenario => 
      scenario.id === scenarioId 
        ? { ...scenario, status: 'completed', lastRun: new Date() }
        : scenario
    ));

    setIsRunning(false);
    setSelectedScenario(null);
  };

  const createScenario = async (values: any) => {
    const newScenario: TestScenario = {
      id: Date.now().toString(),
      name: values.name,
      description: values.description,
      steps: [],
      status: 'idle'
    };

    setScenarios(prev => [...prev, newScenario]);
    setShowCreateModal(false);
    form.resetFields();
  };

  const viewReport = (report: TestReport) => {
    setSelectedReport(report);
    setShowReportModal(true);
  };

  const exportReport = (report: TestReport) => {
    const reportData = {
      scenario: report.scenarioName,
      status: report.status,
      duration: report.duration,
      timestamp: report.timestamp,
      errors: report.errors || []
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `test-report-${report.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
      case 'passed': return 'success';
      case 'failed': return 'error';
      case 'running':
      case 'recording': return 'processing';
      default: return 'default';
    }
  };

  return (
    <div className="e2e-testing-tool">
      <Card
        title={<Title level={4}>End-to-End Testing Tool</Title>}
        extra={
          <Space>
            <Button
              type="default"
              danger={isRecording}
              icon={isRecording ? <StopOutlined /> : <VideoCameraOutlined />}
              onClick={isRecording ? stopRecording : startRecording}
            >
              {isRecording ? 'Stop Recording' : 'Start Recording'}
            </Button>
            <Button type="primary" onClick={() => setShowCreateModal(true)}>
              Create Scenario
            </Button>
          </Space>
        }
      >
        <div className="scenarios-section">
          <Title level={5}>Test Scenarios</Title>
          <List
            dataSource={scenarios}
            renderItem={(scenario) => (
              <List.Item
                actions={[
                  <Button
                    type="primary"
                    icon={<PlayCircleOutlined />}
                    onClick={() => runScenario(scenario.id)}
                    loading={isRunning && selectedScenario === scenario.id}
                    disabled={isRunning}
                  >
                    Run
                  </Button>
                ]}
              >
                <List.Item.Meta
                  title={
                    <Space>
                      <Tag color={getStatusColor(scenario.status)}>
                        {scenario.status.toUpperCase()}
                      </Tag>
                      {scenario.name}
                    </Space>
                  }
                  description={
                    <div>
                      <Text>{scenario.description}</Text>
                      <br />
                      <Text type="secondary">
                        Steps: {scenario.steps.length} | 
                        {scenario.lastRun && ` Last run: ${scenario.lastRun.toLocaleString()}`}
                        {scenario.duration && ` | Duration: ${scenario.duration}ms`}
                      </Text>
                    </div>
                  }
                />
              </List.Item>
            )}
          />
        </div>

        <Divider />

        <div className="reports-section">
          <Title level={5}>Test Reports</Title>
          <List
            dataSource={reports}
            renderItem={(report) => (
              <List.Item
                actions={[
                  <Button
                    icon={<EyeOutlined />}
                    onClick={() => viewReport(report)}
                  >
                    View
                  </Button>,
                  <Button
                    icon={<DownloadOutlined />}
                    onClick={() => exportReport(report)}
                  >
                    Export
                  </Button>
                ]}
              >
                <List.Item.Meta
                  title={
                    <Space>
                      <Tag color={getStatusColor(report.status)}>
                        {report.status.toUpperCase()}
                      </Tag>
                      {report.scenarioName}
                    </Space>
                  }
                  description={
                    <div>
                      <Text type="secondary">
                        Duration: {report.duration}ms | 
                        Run at: {report.timestamp.toLocaleString()}
                      </Text>
                      {report.errors && report.errors.length > 0 && (
                        <div>
                          <Text type="danger">Errors: {report.errors.length}</Text>
                        </div>
                      )}
                    </div>
                  }
                />
              </List.Item>
            )}
          />
        </div>
      </Card>

      {/* Create Scenario Modal */}
      <Modal
        title="Create Test Scenario"
        open={showCreateModal}
        onCancel={() => setShowCreateModal(false)}
        onOk={() => form.submit()}
      >
        <Form form={form} onFinish={createScenario} layout="vertical">
          <Form.Item
            name="name"
            label="Scenario Name"
            rules={[{ required: true, message: 'Please enter scenario name' }]}
          >
            <Input placeholder="Enter scenario name" />
          </Form.Item>
          <Form.Item
            name="description"
            label="Description"
            rules={[{ required: true, message: 'Please enter description' }]}
          >
            <Input.TextArea placeholder="Describe what this scenario tests" />
          </Form.Item>
        </Form>
      </Modal>

      {/* Report Details Modal */}
      <Modal
        title={`Test Report: ${selectedReport?.scenarioName}`}
        open={showReportModal}
        onCancel={() => setShowReportModal(false)}
        footer={[
          <Button key="close" onClick={() => setShowReportModal(false)}>
            Close
          </Button>
        ]}
        width={800}
      >
        {selectedReport && (
          <div>
            <Space direction="vertical" style={{ width: '100%' }}>
              <div>
                <Text strong>Status: </Text>
                <Tag color={getStatusColor(selectedReport.status)}>
                  {selectedReport.status.toUpperCase()}
                </Tag>
              </div>
              <div>
                <Text strong>Duration: </Text>
                <Text>{selectedReport.duration}ms</Text>
              </div>
              <div>
                <Text strong>Timestamp: </Text>
                <Text>{selectedReport.timestamp.toLocaleString()}</Text>
              </div>
              {selectedReport.errors && selectedReport.errors.length > 0 && (
                <div>
                  <Text strong>Errors:</Text>
                  <List
                    
                    dataSource={selectedReport.errors}
                    renderItem={(error) => (
                      <List.Item>
                        <Text type="danger">{error}</Text>
                      </List.Item>
                    )}
                  />
                </div>
              )}
              <div>
                <Text strong>Screenshots: </Text>
                <Text>{selectedReport.screenshots.length} captured</Text>
              </div>
            </Space>
          </div>
        )}
      </Modal>
    </div>
  );
};
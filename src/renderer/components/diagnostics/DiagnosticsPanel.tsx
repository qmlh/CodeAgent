import React, { useState, useEffect } from 'react';
import { Card, Tabs, Button, List, Typography, Space, Alert, Progress, Tag, Collapse, Row, Col } from 'antd';
import { ToolOutlined, CheckCircleOutlined, ExclamationCircleOutlined, CloseCircleOutlined, ReloadOutlined } from '@ant-design/icons';
import './DiagnosticsPanel.css';

const { Title, Text } = Typography;
const { TabPane } = Tabs;
const { Panel } = Collapse;

interface SystemInfo {
  category: string;
  items: {
    name: string;
    value: string;
    status: 'good' | 'warning' | 'error';
  }[];
}

interface ConfigCheck {
  id: string;
  name: string;
  description: string;
  status: 'pass' | 'warning' | 'fail';
  details?: string;
  canAutoFix: boolean;
  fixed: boolean;
}

interface CompatibilityTest {
  id: string;
  feature: string;
  supported: boolean;
  version?: string;
  recommendation?: string;
}

interface AutoFixResult {
  id: string;
  name: string;
  status: 'success' | 'failed' | 'skipped';
  message: string;
}

export const DiagnosticsPanel: React.FC = () => {
  const [systemInfo, setSystemInfo] = useState<SystemInfo[]>([]);
  const [configChecks, setConfigChecks] = useState<ConfigCheck[]>([]);
  const [compatibilityTests, setCompatibilityTests] = useState<CompatibilityTest[]>([]);
  const [isRunningDiagnostics, setIsRunningDiagnostics] = useState(false);
  const [diagnosticsProgress, setDiagnosticsProgress] = useState(0);
  const [autoFixResults, setAutoFixResults] = useState<AutoFixResult[]>([]);
  const [isAutoFixing, setIsAutoFixing] = useState(false);

  useEffect(() => {
    loadSystemInfo();
    loadConfigChecks();
    loadCompatibilityTests();
  }, []);

  const loadSystemInfo = () => {
    setSystemInfo([
      {
        category: 'System',
        items: [
          { name: 'Operating System', value: 'Windows 11 Pro', status: 'good' },
          { name: 'Architecture', value: 'x64', status: 'good' },
          { name: 'Total Memory', value: '16 GB', status: 'good' },
          { name: 'Available Memory', value: '8.2 GB', status: 'good' },
          { name: 'CPU Cores', value: '8', status: 'good' }
        ]
      },
      {
        category: 'Application',
        items: [
          { name: 'Electron Version', value: '25.3.1', status: 'good' },
          { name: 'Node.js Version', value: '18.17.0', status: 'good' },
          { name: 'Chrome Version', value: '114.0.5735.289', status: 'good' },
          { name: 'App Version', value: '1.0.0', status: 'good' },
          { name: 'Build Type', value: 'Development', status: 'warning' }
        ]
      },
      {
        category: 'Storage',
        items: [
          { name: 'App Data Size', value: '245 MB', status: 'good' },
          { name: 'Cache Size', value: '89 MB', status: 'good' },
          { name: 'Logs Size', value: '12 MB', status: 'good' },
          { name: 'Free Disk Space', value: '156 GB', status: 'good' },
          { name: 'Temp Files', value: '2.3 MB', status: 'warning' }
        ]
      }
    ]);
  };

  const loadConfigChecks = () => {
    setConfigChecks([
      {
        id: '1',
        name: 'Agent Configuration',
        description: 'Verify agent configuration files are valid',
        status: 'pass',
        details: 'All agent configurations are valid and properly formatted',
        canAutoFix: false,
        fixed: false
      },
      {
        id: '2',
        name: 'File Permissions',
        description: 'Check read/write permissions for application directories',
        status: 'warning',
        details: 'Some temporary files have restricted permissions',
        canAutoFix: true,
        fixed: false
      },
      {
        id: '3',
        name: 'Network Connectivity',
        description: 'Test network connectivity for external services',
        status: 'pass',
        details: 'All external services are reachable',
        canAutoFix: false,
        fixed: false
      },
      {
        id: '4',
        name: 'Database Integrity',
        description: 'Verify database files are not corrupted',
        status: 'fail',
        details: 'Database index corruption detected in agent_tasks table',
        canAutoFix: true,
        fixed: false
      },
      {
        id: '5',
        name: 'Plugin Dependencies',
        description: 'Check if all required plugins are installed',
        status: 'warning',
        details: 'Optional plugin "advanced-git-tools" is missing',
        canAutoFix: true,
        fixed: false
      }
    ]);
  };

  const loadCompatibilityTests = () => {
    setCompatibilityTests([
      {
        id: '1',
        feature: 'WebGL',
        supported: true,
        version: '2.0'
      },
      {
        id: '2',
        feature: 'Web Workers',
        supported: true
      },
      {
        id: '3',
        feature: 'IndexedDB',
        supported: true,
        version: '3.0'
      },
      {
        id: '4',
        feature: 'File System Access API',
        supported: false,
        recommendation: 'Use Electron file system APIs instead'
      },
      {
        id: '5',
        feature: 'WebAssembly',
        supported: true,
        version: '1.0'
      },
      {
        id: '6',
        feature: 'Shared Array Buffer',
        supported: false,
        recommendation: 'Feature disabled for security reasons'
      }
    ]);
  };

  const runDiagnostics = async () => {
    setIsRunningDiagnostics(true);
    setDiagnosticsProgress(0);

    const steps = [
      'Collecting system information...',
      'Checking configuration files...',
      'Testing network connectivity...',
      'Verifying database integrity...',
      'Running compatibility tests...',
      'Generating report...'
    ];

    for (let i = 0; i < steps.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setDiagnosticsProgress(((i + 1) / steps.length) * 100);
    }

    // Refresh data
    loadSystemInfo();
    loadConfigChecks();
    loadCompatibilityTests();

    setIsRunningDiagnostics(false);
  };

  const runAutoFix = async () => {
    setIsAutoFixing(true);
    setAutoFixResults([]);

    const fixableIssues = configChecks.filter(check => check.canAutoFix && !check.fixed);
    
    for (const issue of fixableIssues) {
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Simulate fix attempt
      const success = Math.random() > 0.2; // 80% success rate
      
      const result: AutoFixResult = {
        id: issue.id,
        name: issue.name,
        status: success ? 'success' : 'failed',
        message: success 
          ? `Successfully fixed: ${issue.description}`
          : `Failed to fix: ${issue.description}. Manual intervention required.`
      };

      setAutoFixResults(prev => [...prev, result]);

      if (success) {
        setConfigChecks(prev => prev.map(check => 
          check.id === issue.id 
            ? { ...check, status: 'pass', fixed: true }
            : check
        ));
      }
    }

    setIsAutoFixing(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pass':
      case 'good':
      case 'success':
        return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
      case 'warning':
        return <ExclamationCircleOutlined style={{ color: '#faad14' }} />;
      case 'fail':
      case 'error':
      case 'failed':
        return <CloseCircleOutlined style={{ color: '#ff4d4f' }} />;
      default:
        return <CheckCircleOutlined style={{ color: '#d9d9d9' }} />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pass':
      case 'good':
      case 'success':
        return 'success';
      case 'warning':
        return 'warning';
      case 'fail':
      case 'error':
      case 'failed':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <div className="diagnostics-panel">
      <Card
        title={
          <Space>
            <ToolOutlined />
            <Title level={4} style={{ margin: 0 }}>System Diagnostics</Title>
          </Space>
        }
        extra={
          <Space>
            <Button
              type="primary"
              onClick={runDiagnostics}
              loading={isRunningDiagnostics}
              icon={<ReloadOutlined />}
            >
              {isRunningDiagnostics ? 'Running...' : 'Run Diagnostics'}
            </Button>
            <Button
              onClick={runAutoFix}
              loading={isAutoFixing}
              disabled={!configChecks.some(check => check.canAutoFix && !check.fixed)}
            >
              Auto-Fix Issues
            </Button>
          </Space>
        }
      >
        {isRunningDiagnostics && (
          <Alert
            message="Running System Diagnostics"
            description={<Progress percent={diagnosticsProgress} status="active" />}
            type="info"
            style={{ marginBottom: 16 }}
          />
        )}

        {isAutoFixing && (
          <Alert
            message="Auto-fixing Issues"
            description="Attempting to automatically resolve detected issues..."
            type="info"
            style={{ marginBottom: 16 }}
          />
        )}

        {autoFixResults.length > 0 && (
          <Alert
            message="Auto-fix Results"
            description={
              <List
                
                dataSource={autoFixResults}
                renderItem={(result) => (
                  <List.Item>
                    <Space>
                      {getStatusIcon(result.status)}
                      <Text>{result.message}</Text>
                    </Space>
                  </List.Item>
                )}
              />
            }
            type="info"
            style={{ marginBottom: 16 }}
          />
        )}

        <Tabs defaultActiveKey="system">
          <TabPane tab="System Information" key="system">
            <Collapse defaultActiveKey={['0', '1', '2']}>
              {systemInfo.map((category, index) => (
                <Panel header={category.category} key={index}>
                  <List
                    dataSource={category.items}
                    renderItem={(item) => (
                      <List.Item>
                        <List.Item.Meta
                          avatar={getStatusIcon(item.status)}
                          title={item.name}
                          description={item.value}
                        />
                      </List.Item>
                    )}
                  />
                </Panel>
              ))}
            </Collapse>
          </TabPane>

          <TabPane tab="Configuration Checks" key="config">
            <List
              dataSource={configChecks}
              renderItem={(check) => (
                <List.Item
                  actions={[
                    check.canAutoFix && !check.fixed && (
                      <Button
                        
                        type="primary"
                        onClick={() => runAutoFix()}
                        loading={isAutoFixing}
                      >
                        Fix
                      </Button>
                    )
                  ]}
                >
                  <List.Item.Meta
                    avatar={getStatusIcon(check.status)}
                    title={
                      <Space>
                        {check.name}
                        <Tag color={getStatusColor(check.status)}>
                          {check.status.toUpperCase()}
                        </Tag>
                        {check.fixed && <Tag color="success">FIXED</Tag>}
                      </Space>
                    }
                    description={
                      <div>
                        <Text>{check.description}</Text>
                        {check.details && (
                          <div style={{ marginTop: 4 }}>
                            <Text type="secondary">{check.details}</Text>
                          </div>
                        )}
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          </TabPane>

          <TabPane tab="Compatibility Tests" key="compatibility">
            <Row gutter={[16, 16]}>
              {compatibilityTests.map((test) => (
                <Col span={12} key={test.id}>
                  <Card  className={`compatibility-card ${test.supported ? 'supported' : 'not-supported'}`}>
                    <Space direction="vertical" style={{ width: '100%' }}>
                      <Space>
                        {getStatusIcon(test.supported ? 'good' : 'error')}
                        <Text strong>{test.feature}</Text>
                      </Space>
                      <div>
                        <Tag color={test.supported ? 'success' : 'error'}>
                          {test.supported ? 'Supported' : 'Not Supported'}
                        </Tag>
                        {test.version && (
                          <Tag color="blue">v{test.version}</Tag>
                        )}
                      </div>
                      {test.recommendation && (
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {test.recommendation}
                        </Text>
                      )}
                    </Space>
                  </Card>
                </Col>
              ))}
            </Row>
          </TabPane>
        </Tabs>
      </Card>
    </div>
  );
};
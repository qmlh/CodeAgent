/**
 * Agent Diagnostic Tools Component
 * Health checks, performance analysis, and automated problem resolution
 */

import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Button,
  Space,
  Typography,
  Table,
  Tag,
  Progress,
  Alert,
  Statistic,
  Modal,
  Form,
  Select,
  Input,
  Checkbox,
  Divider,
  Timeline,
  Badge,
  Tooltip,
  message,
  Spin,
  Result
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  BugOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  CloseCircleOutlined,
  ToolOutlined,
  PlayCircleOutlined,
  ReloadOutlined,
  SettingOutlined,
  BarChartOutlined,
  HeartOutlined,
  ThunderboltOutlined,
  SafetyCertificateOutlined,
  WarningOutlined
} from '@ant-design/icons';
import { useAppSelector, useAppDispatch } from '../../hooks/redux';
import { startAgent, stopAgent } from '../../store/slices/agentSlice';
import { Agent } from '../../store/slices/agentSlice';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

interface DiagnosticResult {
  id: string;
  agentId: string;
  agentName: string;
  category: 'health' | 'performance' | 'connectivity' | 'configuration' | 'security';
  severity: 'info' | 'warning' | 'error' | 'critical';
  title: string;
  description: string;
  recommendation: string;
  autoFixAvailable: boolean;
  timestamp: Date;
  resolved: boolean;
}

interface HealthCheck {
  id: string;
  name: string;
  description: string;
  category: string;
  enabled: boolean;
  critical: boolean;
}

interface AutoFixAction {
  id: string;
  name: string;
  description: string;
  riskLevel: 'low' | 'medium' | 'high';
  estimatedTime: string;
}

export const AgentDiagnosticTools: React.FC = () => {
  const dispatch = useAppDispatch();
  const { agents } = useAppSelector(state => state.agent);
  const [diagnosticResults, setDiagnosticResults] = useState<DiagnosticResult[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<string>('all');
  const [runningDiagnostics, setRunningDiagnostics] = useState(false);
  const [showHealthCheckConfig, setShowHealthCheckConfig] = useState(false);
  const [showAutoFixModal, setShowAutoFixModal] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState<DiagnosticResult | null>(null);
  const [healthChecks, setHealthChecks] = useState<HealthCheck[]>([
    {
      id: 'cpu-usage',
      name: 'CPU Usage Check',
      description: 'Monitor CPU usage and detect high consumption',
      category: 'performance',
      enabled: true,
      critical: true
    },
    {
      id: 'memory-usage',
      name: 'Memory Usage Check',
      description: 'Monitor memory consumption and detect leaks',
      category: 'performance',
      enabled: true,
      critical: true
    },
    {
      id: 'response-time',
      name: 'Response Time Check',
      description: 'Monitor agent response times',
      category: 'performance',
      enabled: true,
      critical: false
    },
    {
      id: 'connectivity',
      name: 'Connectivity Check',
      description: 'Verify network connectivity and communication',
      category: 'connectivity',
      enabled: true,
      critical: true
    },
    {
      id: 'task-queue',
      name: 'Task Queue Health',
      description: 'Check task queue status and processing',
      category: 'health',
      enabled: true,
      critical: false
    },
    {
      id: 'configuration',
      name: 'Configuration Validation',
      description: 'Validate agent configuration settings',
      category: 'configuration',
      enabled: true,
      critical: false
    },
    {
      id: 'security',
      name: 'Security Check',
      description: 'Verify security settings and permissions',
      category: 'security',
      enabled: true,
      critical: true
    }
  ]);

  useEffect(() => {
    generateMockDiagnosticResults();
  }, [agents]);

  const generateMockDiagnosticResults = () => {
    const results: DiagnosticResult[] = [];
    const categories: DiagnosticResult['category'][] = ['health', 'performance', 'connectivity', 'configuration', 'security'];
    const severities: DiagnosticResult['severity'][] = ['info', 'warning', 'error', 'critical'];

    const issues = [
      {
        category: 'performance' as const,
        severity: 'warning' as const,
        title: 'High CPU Usage',
        description: 'Agent is consuming 85% CPU for extended periods',
        recommendation: 'Consider reducing concurrent tasks or optimizing task processing'
      },
      {
        category: 'health' as const,
        severity: 'error' as const,
        title: 'Task Queue Backlog',
        description: 'Task queue has 15+ pending tasks',
        recommendation: 'Increase agent capacity or redistribute tasks'
      },
      {
        category: 'connectivity' as const,
        severity: 'critical' as const,
        title: 'Communication Timeout',
        description: 'Agent failed to respond to health checks',
        recommendation: 'Restart agent or check network connectivity'
      },
      {
        category: 'configuration' as const,
        severity: 'warning' as const,
        title: 'Deprecated Configuration',
        description: 'Agent is using deprecated configuration options',
        recommendation: 'Update configuration to use latest settings'
      },
      {
        category: 'security' as const,
        severity: 'error' as const,
        title: 'Insecure Permissions',
        description: 'Agent has excessive file system permissions',
        recommendation: 'Review and restrict agent permissions'
      }
    ];

    agents.forEach(agent => {
      // Generate 1-3 issues per agent
      const issueCount = Math.floor(Math.random() * 3) + 1;
      for (let i = 0; i < issueCount; i++) {
        const issue = issues[Math.floor(Math.random() * issues.length)];
        results.push({
          id: `diag-${agent.id}-${i}`,
          agentId: agent.id,
          agentName: agent.name,
          category: issue.category,
          severity: issue.severity,
          title: issue.title,
          description: issue.description,
          recommendation: issue.recommendation,
          autoFixAvailable: Math.random() > 0.5,
          timestamp: new Date(Date.now() - Math.random() * 3600000),
          resolved: Math.random() > 0.7
        });
      }
    });

    setDiagnosticResults(results);
  };

  const runDiagnostics = async () => {
    setRunningDiagnostics(true);
    
    try {
      // Simulate diagnostic run
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Generate new results
      generateMockDiagnosticResults();
      
      message.success('Diagnostic scan completed');
    } catch (error) {
      message.error('Diagnostic scan failed');
    } finally {
      setRunningDiagnostics(false);
    }
  };

  const runAutoFix = async (issueId: string) => {
    const issue = diagnosticResults.find(r => r.id === issueId);
    if (!issue) return;

    Modal.confirm({
      title: 'Auto-Fix Confirmation',
      content: (
        <div>
          <Paragraph>
            Are you sure you want to automatically fix this issue?
          </Paragraph>
          <Alert
            message="Auto-fix will attempt to resolve the issue automatically"
            description={issue.recommendation}
            type="info"
            showIcon
          />
        </div>
      ),
      onOk: async () => {
        try {
          // Simulate auto-fix
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          // Mark issue as resolved
          setDiagnosticResults(prev => 
            prev.map(result => 
              result.id === issueId 
                ? { ...result, resolved: true }
                : result
            )
          );
          
          message.success('Issue resolved automatically');
        } catch (error) {
          message.error('Auto-fix failed');
        }
      }
    });
  };

  const getSeverityColor = (severity: DiagnosticResult['severity']) => {
    const colors = {
      info: 'blue',
      warning: 'orange',
      error: 'red',
      critical: 'red'
    };
    return colors[severity];
  };

  const getSeverityIcon = (severity: DiagnosticResult['severity']) => {
    const icons = {
      info: <CheckCircleOutlined />,
      warning: <ExclamationCircleOutlined />,
      error: <CloseCircleOutlined />,
      critical: <WarningOutlined />
    };
    return icons[severity];
  };

  const getCategoryIcon = (category: DiagnosticResult['category']) => {
    const icons = {
      health: <HeartOutlined />,
      performance: <ThunderboltOutlined />,
      connectivity: <BugOutlined />,
      configuration: <SettingOutlined />,
      security: <SafetyCertificateOutlined />
    };
    return icons[category];
  };

  const filteredResults = selectedAgent === 'all' 
    ? diagnosticResults 
    : diagnosticResults.filter(r => r.agentId === selectedAgent);

  const getStatistics = () => {
    const total = filteredResults.length;
    const resolved = filteredResults.filter(r => r.resolved).length;
    const critical = filteredResults.filter(r => r.severity === 'critical' && !r.resolved).length;
    const errors = filteredResults.filter(r => r.severity === 'error' && !r.resolved).length;
    const warnings = filteredResults.filter(r => r.severity === 'warning' && !r.resolved).length;

    return { total, resolved, critical, errors, warnings };
  };

  const stats = getStatistics();

  const columns: ColumnsType<DiagnosticResult> = [
    {
      title: 'Agent',
      dataIndex: 'agentName',
      key: 'agentName',
      width: 120
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      width: 120,
      render: (category: DiagnosticResult['category']) => (
        <Space>
          {getCategoryIcon(category)}
          <Text>{category}</Text>
        </Space>
      )
    },
    {
      title: 'Severity',
      dataIndex: 'severity',
      key: 'severity',
      width: 100,
      render: (severity: DiagnosticResult['severity']) => (
        <Tag 
          color={getSeverityColor(severity)}
          icon={getSeverityIcon(severity)}
        >
          {severity.toUpperCase()}
        </Tag>
      )
    },
    {
      title: 'Issue',
      dataIndex: 'title',
      key: 'title',
      render: (title: string, record: DiagnosticResult) => (
        <div>
          <Text strong>{title}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {record.description}
          </Text>
        </div>
      )
    },
    {
      title: 'Status',
      key: 'status',
      width: 100,
      render: (_, record: DiagnosticResult) => (
        record.resolved ? (
          <Badge status="success" text="Resolved" />
        ) : (
          <Badge status="error" text="Active" />
        )
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 150,
      render: (_, record: DiagnosticResult) => (
        <Space >
          {record.autoFixAvailable && !record.resolved && (
            <Tooltip title="Auto-fix available">
              <Button
                type="primary"
                
                icon={<ToolOutlined />}
                onClick={() => runAutoFix(record.id)}
              >
                Fix
              </Button>
            </Tooltip>
          )}
          <Button
            
            onClick={() => {
              setSelectedIssue(record);
              setShowAutoFixModal(true);
            }}
          >
            Details
          </Button>
        </Space>
      )
    }
  ];

  return (
    <div>
      {/* Header */}
      <Row gutter={16} style={{ marginBottom: '16px' }} align="middle">
        <Col flex="auto">
          <Space>
            <Title level={5} style={{ margin: 0 }}>
              <BugOutlined /> Agent Diagnostics
            </Title>
            {stats.critical > 0 && (
              <Badge count={stats.critical} style={{ backgroundColor: '#ff4d4f' }} />
            )}
          </Space>
        </Col>
        <Col>
          <Space>
            <Select
              value={selectedAgent}
              onChange={setSelectedAgent}
              style={{ width: 150 }}
              
            >
              <Option value="all">All Agents</Option>
              {agents.map(agent => (
                <Option key={agent.id} value={agent.id}>
                  {agent.name}
                </Option>
              ))}
            </Select>
            <Button
              type="primary"
              icon={<PlayCircleOutlined />}
              onClick={runDiagnostics}
              loading={runningDiagnostics}
              
            >
              Run Diagnostics
            </Button>
            <Button
              icon={<SettingOutlined />}
              onClick={() => setShowHealthCheckConfig(true)}
              
            >
              Configure
            </Button>
          </Space>
        </Col>
      </Row>

      {/* Statistics */}
      <Row gutter={16} style={{ marginBottom: '16px' }}>
        <Col span={6}>
          <Card >
            <Statistic
              title="Total Issues"
              value={stats.total}
              prefix={<BugOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card >
            <Statistic
              title="Critical"
              value={stats.critical}
              valueStyle={{ color: '#cf1322' }}
              prefix={<WarningOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card >
            <Statistic
              title="Resolved"
              value={stats.resolved}
              valueStyle={{ color: '#3f8600' }}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card >
            <Statistic
              title="Resolution Rate"
              value={stats.total > 0 ? (stats.resolved / stats.total) * 100 : 0}
              precision={1}
              suffix="%"
              valueStyle={{ 
                color: stats.total > 0 && (stats.resolved / stats.total) > 0.8 ? '#3f8600' : '#faad14' 
              }}
            />
          </Card>
        </Col>
      </Row>

      {/* Active Alerts */}
      {stats.critical > 0 && (
        <Alert
          message={`${stats.critical} critical issues require immediate attention`}
          type="error"
          showIcon
          style={{ marginBottom: '16px' }}
          action={
            <Button  danger onClick={runDiagnostics}>
              Re-scan
            </Button>
          }
        />
      )}

      {/* Diagnostic Results */}
      <Card title="Diagnostic Results" >
        {runningDiagnostics ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <Spin size="large" />
            <div style={{ marginTop: '16px' }}>
              <Text>Running diagnostic checks...</Text>
            </div>
          </div>
        ) : (
          <Table
            columns={columns}
            dataSource={filteredResults}
            rowKey="id"
            
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (total, range) => 
                `${range[0]}-${range[1]} of ${total} issues`
            }}
            rowClassName={(record) => 
              record.severity === 'critical' ? 'diagnostic-critical' :
              record.severity === 'error' ? 'diagnostic-error' :
              record.resolved ? 'diagnostic-resolved' : ''
            }
          />
        )}
      </Card>

      {/* Health Check Configuration Modal */}
      <Modal
        title="Health Check Configuration"
        open={showHealthCheckConfig}
        onCancel={() => setShowHealthCheckConfig(false)}
        width={700}
        footer={[
          <Button key="cancel" onClick={() => setShowHealthCheckConfig(false)}>
            Cancel
          </Button>,
          <Button 
            key="save" 
            type="primary" 
            onClick={() => {
              setShowHealthCheckConfig(false);
              message.success('Health check configuration saved');
            }}
          >
            Save Configuration
          </Button>
        ]}
      >
        <div>
          <Paragraph>
            Configure which health checks to run during diagnostic scans.
          </Paragraph>
          
          {Object.entries(
            healthChecks.reduce((acc, check) => {
              if (!acc[check.category]) acc[check.category] = [];
              acc[check.category].push(check);
              return acc;
            }, {} as Record<string, HealthCheck[]>)
          ).map(([category, checks]) => (
            <div key={category} style={{ marginBottom: '24px' }}>
              <Title level={5}>{category.charAt(0).toUpperCase() + category.slice(1)}</Title>
              {checks.map(check => (
                <div key={check.id} style={{ marginBottom: '12px' }}>
                  <Row align="middle">
                    <Col span={2}>
                      <Checkbox
                        checked={check.enabled}
                        onChange={(e) => {
                          setHealthChecks(prev => 
                            prev.map(c => 
                              c.id === check.id 
                                ? { ...c, enabled: e.target.checked }
                                : c
                            )
                          );
                        }}
                      />
                    </Col>
                    <Col span={18}>
                      <div>
                        <Text strong>{check.name}</Text>
                        {check.critical && (
                          <Tag color="red"  style={{ marginLeft: '8px' }}>
                            Critical
                          </Tag>
                        )}
                        <br />
                        <Text type="secondary" style={{ fontSize: '12px' }}>
                          {check.description}
                        </Text>
                      </div>
                    </Col>
                    <Col span={4}>
                      <Checkbox
                        checked={check.critical}
                        onChange={(e) => {
                          setHealthChecks(prev => 
                            prev.map(c => 
                              c.id === check.id 
                                ? { ...c, critical: e.target.checked }
                                : c
                            )
                          );
                        }}
                      >
                        Critical
                      </Checkbox>
                    </Col>
                  </Row>
                </div>
              ))}
            </div>
          ))}
        </div>
      </Modal>

      {/* Issue Details Modal */}
      <Modal
        title="Issue Details"
        open={showAutoFixModal}
        onCancel={() => setShowAutoFixModal(false)}
        width={600}
        footer={[
          <Button key="cancel" onClick={() => setShowAutoFixModal(false)}>
            Close
          </Button>,
          selectedIssue?.autoFixAvailable && !selectedIssue?.resolved && (
            <Button 
              key="autofix" 
              type="primary" 
              icon={<ToolOutlined />}
              onClick={() => {
                if (selectedIssue) {
                  runAutoFix(selectedIssue.id);
                  setShowAutoFixModal(false);
                }
              }}
            >
              Auto-Fix
            </Button>
          )
        ]}
      >
        {selectedIssue && (
          <div>
            <Row gutter={16}>
              <Col span={12}>
                <Text strong>Agent:</Text>
                <div>{selectedIssue.agentName}</div>
              </Col>
              <Col span={12}>
                <Text strong>Category:</Text>
                <div>
                  <Space>
                    {getCategoryIcon(selectedIssue.category)}
                    {selectedIssue.category}
                  </Space>
                </div>
              </Col>
            </Row>
            
            <Row gutter={16} style={{ marginTop: '16px' }}>
              <Col span={12}>
                <Text strong>Severity:</Text>
                <div>
                  <Tag 
                    color={getSeverityColor(selectedIssue.severity)}
                    icon={getSeverityIcon(selectedIssue.severity)}
                  >
                    {selectedIssue.severity.toUpperCase()}
                  </Tag>
                </div>
              </Col>
              <Col span={12}>
                <Text strong>Detected:</Text>
                <div>{selectedIssue.timestamp.toLocaleString()}</div>
              </Col>
            </Row>

            <Divider />

            <div>
              <Text strong>Description:</Text>
              <div style={{ marginTop: '8px' }}>
                {selectedIssue.description}
              </div>
            </div>

            <div style={{ marginTop: '16px' }}>
              <Text strong>Recommendation:</Text>
              <div style={{ marginTop: '8px', padding: '12px', backgroundColor: '#f0f2f5', borderRadius: '4px' }}>
                {selectedIssue.recommendation}
              </div>
            </div>

            {selectedIssue.autoFixAvailable && (
              <Alert
                message="Auto-fix Available"
                description="This issue can be automatically resolved. Click the Auto-Fix button to proceed."
                type="info"
                showIcon
                style={{ marginTop: '16px' }}
              />
            )}

            {selectedIssue.resolved && (
              <Alert
                message="Issue Resolved"
                description="This issue has been successfully resolved."
                type="success"
                showIcon
                style={{ marginTop: '16px' }}
              />
            )}
          </div>
        )}
      </Modal>

      <style>{`
        .diagnostic-critical {
          background-color: rgba(255, 77, 79, 0.05);
          border-left: 3px solid #ff4d4f;
        }
        
        .diagnostic-error {
          background-color: rgba(255, 77, 79, 0.03);
          border-left: 3px solid #ff7875;
        }
        
        .diagnostic-resolved {
          opacity: 0.6;
          background-color: rgba(82, 196, 26, 0.05);
        }
      `}</style>
    </div>
  );
};
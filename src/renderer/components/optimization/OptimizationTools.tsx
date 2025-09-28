import React, { useState, useEffect } from 'react';
import { Card, Tabs, Button, Progress, List, Typography, Space, Alert, Statistic, Row, Col } from 'antd';
import { RocketOutlined, ClockCircleOutlined, DatabaseOutlined, BugOutlined, CheckCircleOutlined } from '@ant-design/icons';
import './OptimizationTools.css';

const { Title, Text } = Typography;
const { TabPane } = Tabs;

interface StartupAnalysis {
  totalTime: number;
  phases: {
    name: string;
    duration: number;
    percentage: number;
    status: 'good' | 'warning' | 'error';
  }[];
}

interface ResourceOptimization {
  id: string;
  category: 'memory' | 'cpu' | 'disk' | 'network';
  issue: string;
  impact: 'low' | 'medium' | 'high';
  suggestion: string;
  canAutoFix: boolean;
  fixed: boolean;
}

interface PerformanceBottleneck {
  id: string;
  component: string;
  type: 'render' | 'memory' | 'computation';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  solution: string;
  detected: Date;
}

export const OptimizationTools: React.FC = () => {
  const [startupAnalysis, setStartupAnalysis] = useState<StartupAnalysis | null>(null);
  const [optimizations, setOptimizations] = useState<ResourceOptimization[]>([]);
  const [bottlenecks, setBottlenecks] = useState<PerformanceBottleneck[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);

  useEffect(() => {
    // Initialize with sample data
    setStartupAnalysis({
      totalTime: 3240,
      phases: [
        { name: 'Electron Initialization', duration: 450, percentage: 13.9, status: 'good' },
        { name: 'Main Process Setup', duration: 680, percentage: 21.0, status: 'good' },
        { name: 'Renderer Process', duration: 1200, percentage: 37.0, status: 'warning' },
        { name: 'React App Mount', duration: 560, percentage: 17.3, status: 'good' },
        { name: 'Initial Data Load', duration: 350, percentage: 10.8, status: 'good' }
      ]
    });

    setOptimizations([
      {
        id: '1',
        category: 'memory',
        issue: 'Large bundle size in renderer process',
        impact: 'high',
        suggestion: 'Enable code splitting for React components',
        canAutoFix: true,
        fixed: false
      },
      {
        id: '2',
        category: 'cpu',
        issue: 'Excessive re-renders in Agent list component',
        impact: 'medium',
        suggestion: 'Implement React.memo and useMemo optimizations',
        canAutoFix: true,
        fixed: false
      },
      {
        id: '3',
        category: 'disk',
        issue: 'Frequent file system polling',
        impact: 'medium',
        suggestion: 'Use file watchers instead of polling',
        canAutoFix: false,
        fixed: false
      },
      {
        id: '4',
        category: 'network',
        issue: 'Redundant API calls in task manager',
        impact: 'low',
        suggestion: 'Implement request deduplication',
        canAutoFix: true,
        fixed: true
      }
    ]);

    setBottlenecks([
      {
        id: '1',
        component: 'Monaco Editor',
        type: 'render',
        severity: 'medium',
        description: 'Large files cause rendering delays',
        solution: 'Enable virtual scrolling for large files',
        detected: new Date(Date.now() - 3600000)
      },
      {
        id: '2',
        component: 'File Tree',
        type: 'memory',
        severity: 'high',
        description: 'Memory leak in file watcher subscriptions',
        solution: 'Properly cleanup event listeners on unmount',
        detected: new Date(Date.now() - 7200000)
      },
      {
        id: '3',
        component: 'Agent Communication',
        type: 'computation',
        severity: 'low',
        description: 'Inefficient message serialization',
        solution: 'Use binary serialization for large messages',
        detected: new Date(Date.now() - 1800000)
      }
    ]);
  }, []);

  const runAnalysis = async () => {
    setIsAnalyzing(true);
    setAnalysisProgress(0);

    // Simulate analysis process
    const steps = [
      'Analyzing startup performance...',
      'Checking memory usage patterns...',
      'Identifying CPU bottlenecks...',
      'Scanning for resource leaks...',
      'Generating optimization suggestions...'
    ];

    for (let i = 0; i < steps.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setAnalysisProgress(((i + 1) / steps.length) * 100);
    }

    setIsAnalyzing(false);
  };

  const applyOptimization = async (optimizationId: string) => {
    setOptimizations(prev => prev.map(opt => 
      opt.id === optimizationId 
        ? { ...opt, fixed: true }
        : opt
    ));
  };

  const applyAllOptimizations = async () => {
    const autoFixable = optimizations.filter(opt => opt.canAutoFix && !opt.fixed);
    
    for (const opt of autoFixable) {
      await new Promise(resolve => setTimeout(resolve, 500));
      await applyOptimization(opt.id);
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return '#ff4d4f';
      case 'medium': return '#faad14';
      case 'low': return '#52c41a';
      default: return '#d9d9d9';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return '#ff4d4f';
      case 'high': return '#ff7875';
      case 'medium': return '#faad14';
      case 'low': return '#52c41a';
      default: return '#d9d9d9';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good': return '#52c41a';
      case 'warning': return '#faad14';
      case 'error': return '#ff4d4f';
      default: return '#d9d9d9';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'memory': return <DatabaseOutlined />;
      case 'cpu': return <RocketOutlined />;
      case 'disk': return <ClockCircleOutlined />;
      case 'network': return <BugOutlined />;
      default: return <CheckCircleOutlined />;
    }
  };

  return (
    <div className="optimization-tools">
      <Card
        title={
          <Space>
            <RocketOutlined />
            <Title level={4} style={{ margin: 0 }}>Application Optimization Tools</Title>
          </Space>
        }
        extra={
          <Space>
            <Button
              type="primary"
              onClick={runAnalysis}
              loading={isAnalyzing}
            >
              {isAnalyzing ? 'Analyzing...' : 'Run Analysis'}
            </Button>
            <Button
              onClick={applyAllOptimizations}
              disabled={!optimizations.some(opt => opt.canAutoFix && !opt.fixed)}
            >
              Apply All Auto-fixes
            </Button>
          </Space>
        }
      >
        {isAnalyzing && (
          <Alert
            message="Running Performance Analysis"
            description={<Progress percent={analysisProgress} status="active" />}
            type="info"
            style={{ marginBottom: 16 }}
          />
        )}

        <Tabs defaultActiveKey="startup">
          <TabPane tab="Startup Analysis" key="startup">
            {startupAnalysis && (
              <div>
                <Row gutter={16} style={{ marginBottom: 24 }}>
                  <Col span={8}>
                    <Statistic
                      title="Total Startup Time"
                      value={startupAnalysis.totalTime}
                      suffix="ms"
                      valueStyle={{ 
                        color: startupAnalysis.totalTime > 5000 ? '#ff4d4f' : 
                               startupAnalysis.totalTime > 3000 ? '#faad14' : '#52c41a'
                      }}
                    />
                  </Col>
                  <Col span={8}>
                    <Statistic
                      title="Phases Analyzed"
                      value={startupAnalysis.phases.length}
                      valueStyle={{ color: '#1890ff' }}
                    />
                  </Col>
                  <Col span={8}>
                    <Statistic
                      title="Issues Found"
                      value={startupAnalysis.phases.filter(p => p.status !== 'good').length}
                      valueStyle={{ color: '#faad14' }}
                    />
                  </Col>
                </Row>

                <List
                  header={<Text strong>Startup Phases</Text>}
                  dataSource={startupAnalysis.phases}
                  renderItem={(phase) => (
                    <List.Item>
                      <List.Item.Meta
                        title={
                          <Space>
                            <div 
                              className="status-indicator"
                              style={{ backgroundColor: getStatusColor(phase.status) }}
                            />
                            {phase.name}
                          </Space>
                        }
                        description={
                          <div>
                            <Progress 
                              percent={phase.percentage} 
                               
                              status={phase.status === 'error' ? 'exception' : 'normal'}
                              format={() => `${phase.duration}ms (${phase.percentage.toFixed(1)}%)`}
                            />
                          </div>
                        }
                      />
                    </List.Item>
                  )}
                />
              </div>
            )}
          </TabPane>

          <TabPane tab="Resource Optimization" key="optimization">
            <List
              header={
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text strong>Optimization Suggestions</Text>
                  <Text type="secondary">
                    {optimizations.filter(opt => opt.fixed).length} of {optimizations.length} applied
                  </Text>
                </div>
              }
              dataSource={optimizations}
              renderItem={(optimization) => (
                <List.Item
                  actions={[
                    optimization.fixed ? (
                      <CheckCircleOutlined style={{ color: '#52c41a' }} />
                    ) : optimization.canAutoFix ? (
                      <Button
                        type="primary"
                        
                        onClick={() => applyOptimization(optimization.id)}
                      >
                        Apply Fix
                      </Button>
                    ) : (
                      <Text type="secondary">Manual fix required</Text>
                    )
                  ]}
                  className={optimization.fixed ? 'optimization-fixed' : ''}
                >
                  <List.Item.Meta
                    avatar={getCategoryIcon(optimization.category)}
                    title={
                      <Space>
                        <span 
                          className="impact-badge"
                          style={{ 
                            backgroundColor: getImpactColor(optimization.impact),
                            color: 'white',
                            padding: '2px 8px',
                            borderRadius: '4px',
                            fontSize: '12px',
                            textTransform: 'uppercase'
                          }}
                        >
                          {optimization.impact}
                        </span>
                        {optimization.issue}
                      </Space>
                    }
                    description={
                      <div>
                        <Text>{optimization.suggestion}</Text>
                        {optimization.fixed && (
                          <div style={{ marginTop: 4 }}>
                            <Text type="success">âœ?Applied successfully</Text>
                          </div>
                        )}
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          </TabPane>

          <TabPane tab="Performance Bottlenecks" key="bottlenecks">
            <List
              header={<Text strong>Detected Performance Issues</Text>}
              dataSource={bottlenecks}
              renderItem={(bottleneck) => (
                <List.Item>
                  <List.Item.Meta
                    title={
                      <Space>
                        <span 
                          className="severity-badge"
                          style={{ 
                            backgroundColor: getSeverityColor(bottleneck.severity),
                            color: 'white',
                            padding: '2px 8px',
                            borderRadius: '4px',
                            fontSize: '12px',
                            textTransform: 'uppercase'
                          }}
                        >
                          {bottleneck.severity}
                        </span>
                        {bottleneck.component} - {bottleneck.type}
                      </Space>
                    }
                    description={
                      <div>
                        <Text>{bottleneck.description}</Text>
                        <br />
                        <Text strong>Solution: </Text>
                        <Text type="secondary">{bottleneck.solution}</Text>
                        <br />
                        <Text type="secondary">
                          Detected: {bottleneck.detected.toLocaleString()}
                        </Text>
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          </TabPane>
        </Tabs>
      </Card>
    </div>
  );
};
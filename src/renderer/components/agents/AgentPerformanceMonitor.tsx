/**
 * Enhanced Agent Performance Monitor
 * Real-time charts, historical data analysis, and performance alerting system
 */

import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Select,
  Button,
  Space,
  Typography,
  Alert,
  Statistic,
  Progress,
  Table,
  Tag,
  Tooltip,
  Switch,
  InputNumber,
  Modal,
  Form,
  message
} from 'antd';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  ScatterChart,
  Scatter
} from 'recharts';
import {
  BarChartOutlined,
  AlertOutlined,
  SettingOutlined,
  DownloadOutlined,
  ReloadOutlined,
  BellOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined
} from '@ant-design/icons';
import { useAppSelector } from '../../hooks/redux';
import { Agent } from '../../store/slices/agentSlice';

const { Title, Text } = Typography;
const { Option } = Select;

interface PerformanceMetric {
  timestamp: string;
  agentId: string;
  agentName: string;
  cpuUsage: number;
  memoryUsage: number;
  tasksCompleted: number;
  tasksActive: number;
  responseTime: number;
  successRate: number;
  errorCount: number;
}

interface PerformanceAlert {
  id: string;
  agentId: string;
  agentName: string;
  type: 'cpu' | 'memory' | 'response_time' | 'error_rate';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: Date;
  acknowledged: boolean;
}

interface AlertThreshold {
  cpu: number;
  memory: number;
  responseTime: number;
  errorRate: number;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

export const AgentPerformanceMonitor: React.FC = () => {
  const { agents } = useAppSelector(state => state.agent);
  const [timeRange, setTimeRange] = useState<'1h' | '6h' | '24h' | '7d'>('1h');
  const [selectedAgents, setSelectedAgents] = useState<string[]>([]);
  const [performanceData, setPerformanceData] = useState<PerformanceMetric[]>([]);
  const [alerts, setAlerts] = useState<PerformanceAlert[]>([]);
  const [alertsEnabled, setAlertsEnabled] = useState(true);
  const [showAlertSettings, setShowAlertSettings] = useState(false);
  const [alertThresholds, setAlertThresholds] = useState<AlertThreshold>({
    cpu: 80,
    memory: 85,
    responseTime: 5000,
    errorRate: 10
  });
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    generateMockData();
    generateMockAlerts();
    
    if (autoRefresh) {
      const interval = setInterval(() => {
        generateMockData();
        checkAlerts();
      }, 30000); // Refresh every 30 seconds
      
      return () => clearInterval(interval);
    }
  }, [agents, timeRange, selectedAgents, autoRefresh]);

  const generateMockData = () => {
    const now = new Date();
    const dataPoints = timeRange === '1h' ? 12 : timeRange === '6h' ? 24 : timeRange === '24h' ? 48 : 168;
    const intervalMs = timeRange === '1h' ? 5 * 60 * 1000 : 
                     timeRange === '6h' ? 15 * 60 * 1000 : 
                     timeRange === '24h' ? 30 * 60 * 1000 : 
                     60 * 60 * 1000;

    const data: PerformanceMetric[] = [];
    const agentsToTrack = selectedAgents.length > 0 ? 
      agents.filter(a => selectedAgents.includes(a.id)) : 
      agents.slice(0, 5); // Limit to 5 agents for performance

    for (let i = dataPoints - 1; i >= 0; i--) {
      const timestamp = new Date(now.getTime() - i * intervalMs);
      
      agentsToTrack.forEach(agent => {
        data.push({
          timestamp: timestamp.toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit',
            ...(timeRange === '7d' && { month: 'short', day: 'numeric' })
          }),
          agentId: agent.id,
          agentName: agent.name,
          cpuUsage: Math.random() * 100,
          memoryUsage: Math.random() * 100,
          tasksCompleted: Math.floor(Math.random() * 10),
          tasksActive: Math.floor(Math.random() * 5),
          responseTime: Math.random() * 8000 + 500,
          successRate: Math.random() * 40 + 60, // 60-100%
          errorCount: Math.floor(Math.random() * 5)
        });
      });
    }

    setPerformanceData(data);
  };

  const generateMockAlerts = () => {
    const mockAlerts: PerformanceAlert[] = [
      {
        id: 'alert-1',
        agentId: 'agent-1',
        agentName: 'Frontend Agent',
        type: 'cpu',
        severity: 'high',
        message: 'CPU usage exceeded 85% for 5 minutes',
        timestamp: new Date(Date.now() - 10 * 60 * 1000),
        acknowledged: false
      },
      {
        id: 'alert-2',
        agentId: 'agent-2',
        agentName: 'Backend Agent',
        type: 'response_time',
        severity: 'medium',
        message: 'Average response time increased to 6.2 seconds',
        timestamp: new Date(Date.now() - 25 * 60 * 1000),
        acknowledged: false
      },
      {
        id: 'alert-3',
        agentId: 'agent-3',
        agentName: 'Testing Agent',
        type: 'error_rate',
        severity: 'critical',
        message: 'Error rate reached 15% in the last hour',
        timestamp: new Date(Date.now() - 45 * 60 * 1000),
        acknowledged: true
      }
    ];

    setAlerts(mockAlerts);
  };

  const checkAlerts = () => {
    if (!alertsEnabled) return;

    const latestData = performanceData.slice(-agents.length);
    const newAlerts: PerformanceAlert[] = [];

    latestData.forEach(metric => {
      if (metric.cpuUsage > alertThresholds.cpu) {
        newAlerts.push({
          id: `cpu-${metric.agentId}-${Date.now()}`,
          agentId: metric.agentId,
          agentName: metric.agentName,
          type: 'cpu',
          severity: metric.cpuUsage > 95 ? 'critical' : 'high',
          message: `CPU usage at ${metric.cpuUsage.toFixed(1)}%`,
          timestamp: new Date(),
          acknowledged: false
        });
      }

      if (metric.memoryUsage > alertThresholds.memory) {
        newAlerts.push({
          id: `memory-${metric.agentId}-${Date.now()}`,
          agentId: metric.agentId,
          agentName: metric.agentName,
          type: 'memory',
          severity: metric.memoryUsage > 95 ? 'critical' : 'high',
          message: `Memory usage at ${metric.memoryUsage.toFixed(1)}%`,
          timestamp: new Date(),
          acknowledged: false
        });
      }

      if (metric.responseTime > alertThresholds.responseTime) {
        newAlerts.push({
          id: `response-${metric.agentId}-${Date.now()}`,
          agentId: metric.agentId,
          agentName: metric.agentName,
          type: 'response_time',
          severity: metric.responseTime > 10000 ? 'critical' : 'medium',
          message: `Response time at ${(metric.responseTime / 1000).toFixed(1)}s`,
          timestamp: new Date(),
          acknowledged: false
        });
      }
    });

    if (newAlerts.length > 0) {
      setAlerts(prev => [...newAlerts, ...prev].slice(0, 50)); // Keep last 50 alerts
    }
  };

  const acknowledgeAlert = (alertId: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId ? { ...alert, acknowledged: true } : alert
    ));
  };

  const getAggregatedData = () => {
    const aggregated = performanceData.reduce((acc, metric) => {
      const existing = acc.find(item => item.timestamp === metric.timestamp);
      if (existing) {
        existing.avgCpuUsage = (existing.avgCpuUsage + metric.cpuUsage) / 2;
        existing.avgMemoryUsage = (existing.avgMemoryUsage + metric.memoryUsage) / 2;
        existing.totalTasksCompleted += metric.tasksCompleted;
        existing.avgResponseTime = (existing.avgResponseTime + metric.responseTime) / 2;
      } else {
        acc.push({
          timestamp: metric.timestamp,
          avgCpuUsage: metric.cpuUsage,
          avgMemoryUsage: metric.memoryUsage,
          totalTasksCompleted: metric.tasksCompleted,
          avgResponseTime: metric.responseTime
        });
      }
      return acc;
    }, [] as any[]);

    return aggregated.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  };

  const getPerformanceStats = () => {
    if (performanceData.length === 0) return null;

    const latest = performanceData.slice(-agents.length);
    const avgCpu = latest.reduce((sum, d) => sum + d.cpuUsage, 0) / latest.length;
    const avgMemory = latest.reduce((sum, d) => sum + d.memoryUsage, 0) / latest.length;
    const avgResponseTime = latest.reduce((sum, d) => sum + d.responseTime, 0) / latest.length;
    const totalTasks = latest.reduce((sum, d) => sum + d.tasksCompleted, 0);

    return { avgCpu, avgMemory, avgResponseTime, totalTasks };
  };

  const exportData = () => {
    const csvContent = [
      ['Timestamp', 'Agent', 'CPU %', 'Memory %', 'Response Time (ms)', 'Tasks Completed', 'Success Rate %'],
      ...performanceData.map(d => [
        d.timestamp,
        d.agentName,
        d.cpuUsage.toFixed(2),
        d.memoryUsage.toFixed(2),
        d.responseTime.toFixed(0),
        d.tasksCompleted,
        d.successRate.toFixed(2)
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `agent-performance-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    message.success('Performance data exported successfully');
  };

  const aggregatedData = getAggregatedData();
  const stats = getPerformanceStats();
  const unacknowledgedAlerts = alerts.filter(a => !a.acknowledged);

  const alertColumns = [
    {
      title: 'Agent',
      dataIndex: 'agentName',
      key: 'agentName'
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => (
        <Tag color={
          type === 'cpu' ? 'red' :
          type === 'memory' ? 'orange' :
          type === 'response_time' ? 'blue' : 'purple'
        }>
          {type.replace('_', ' ').toUpperCase()}
        </Tag>
      )
    },
    {
      title: 'Severity',
      dataIndex: 'severity',
      key: 'severity',
      render: (severity: string) => (
        <Tag color={
          severity === 'critical' ? 'red' :
          severity === 'high' ? 'orange' :
          severity === 'medium' ? 'yellow' : 'blue'
        }>
          {severity.toUpperCase()}
        </Tag>
      )
    },
    {
      title: 'Message',
      dataIndex: 'message',
      key: 'message'
    },
    {
      title: 'Time',
      dataIndex: 'timestamp',
      key: 'timestamp',
      render: (timestamp: Date) => (
        <Text style={{ fontSize: '12px' }}>
          {timestamp.toLocaleTimeString()}
        </Text>
      )
    },
    {
      title: 'Action',
      key: 'action',
      render: (_: any, alert: PerformanceAlert) => (
        !alert.acknowledged && (
          <Button
            
            onClick={() => acknowledgeAlert(alert.id)}
          >
            Acknowledge
          </Button>
        )
      )
    }
  ];

  return (
    <div>
      {/* Header Controls */}
      <Row gutter={16} style={{ marginBottom: '16px' }} align="middle">
        <Col flex="auto">
          <Space>
            <Title level={5} style={{ margin: 0 }}>
              Performance Monitor
            </Title>
            {unacknowledgedAlerts.length > 0 && (
              <Alert
                message={`${unacknowledgedAlerts.length} active alerts`}
                type="warning"
                showIcon
                style={{ padding: '4px 8px', fontSize: '12px' }}
              />
            )}
          </Space>
        </Col>
        <Col>
          <Space>
            <Select
              value={timeRange}
              onChange={setTimeRange}
              style={{ width: 100 }}
              
            >
              <Option value="1h">1 Hour</Option>
              <Option value="6h">6 Hours</Option>
              <Option value="24h">24 Hours</Option>
              <Option value="7d">7 Days</Option>
            </Select>
            <Select
              mode="multiple"
              placeholder="Select agents"
              value={selectedAgents}
              onChange={setSelectedAgents}
              style={{ width: 200 }}
              
            >
              {agents.map(agent => (
                <Option key={agent.id} value={agent.id}>
                  {agent.name}
                </Option>
              ))}
            </Select>
            <Switch
              
              checked={autoRefresh}
              onChange={setAutoRefresh}
              checkedChildren="Auto"
              unCheckedChildren="Manual"
            />
            <Button
              
              icon={<ReloadOutlined />}
              onClick={() => generateMockData()}
            />
            <Button
              
              icon={<DownloadOutlined />}
              onClick={exportData}
            />
            <Button
              
              icon={<SettingOutlined />}
              onClick={() => setShowAlertSettings(true)}
            />
          </Space>
        </Col>
      </Row>

      {/* Performance Stats */}
      {stats && (
        <Row gutter={16} style={{ marginBottom: '16px' }}>
          <Col span={6}>
            <Card >
              <Statistic
                title="Avg CPU Usage"
                value={stats.avgCpu}
                precision={1}
                suffix="%"
                valueStyle={{ 
                  color: stats.avgCpu > 80 ? '#cf1322' : stats.avgCpu > 60 ? '#faad14' : '#3f8600' 
                }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card >
              <Statistic
                title="Avg Memory Usage"
                value={stats.avgMemory}
                precision={1}
                suffix="%"
                valueStyle={{ 
                  color: stats.avgMemory > 80 ? '#cf1322' : stats.avgMemory > 60 ? '#faad14' : '#3f8600' 
                }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card >
              <Statistic
                title="Avg Response Time"
                value={stats.avgResponseTime}
                precision={0}
                suffix="ms"
                valueStyle={{ 
                  color: stats.avgResponseTime > 5000 ? '#cf1322' : stats.avgResponseTime > 2000 ? '#faad14' : '#3f8600' 
                }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card >
              <Statistic
                title="Tasks Completed"
                value={stats.totalTasks}
                prefix={<ArrowUpOutlined />}
              />
            </Card>
          </Col>
        </Row>
      )}

      {/* Charts */}
      <Row gutter={16} style={{ marginBottom: '16px' }}>
        <Col span={12}>
          <Card title="Resource Usage" >
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={aggregatedData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="timestamp" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <RechartsTooltip />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="avgCpuUsage"
                  stackId="1"
                  stroke="#8884d8"
                  fill="#8884d8"
                  name="CPU %"
                />
                <Area
                  type="monotone"
                  dataKey="avgMemoryUsage"
                  stackId="2"
                  stroke="#82ca9d"
                  fill="#82ca9d"
                  name="Memory %"
                />
              </AreaChart>
            </ResponsiveContainer>
          </Card>
        </Col>
        <Col span={12}>
          <Card title="Response Time Trend" >
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={aggregatedData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="timestamp" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <RechartsTooltip />
                <Line
                  type="monotone"
                  dataKey="avgResponseTime"
                  stroke="#ff7300"
                  strokeWidth={2}
                  name="Response Time (ms)"
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          <Card title="Task Completion" >
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={aggregatedData.slice(-10)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="timestamp" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <RechartsTooltip />
                <Bar dataKey="totalTasksCompleted" fill="#8884d8" name="Tasks" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>
        <Col span={12}>
          <Card 
            title={
              <Space>
                <BellOutlined />
                Performance Alerts
                {unacknowledgedAlerts.length > 0 && (
                  <Tag color="red">{unacknowledgedAlerts.length}</Tag>
                )}
              </Space>
            } 
            
          >
            <Table
              columns={alertColumns}
              dataSource={alerts.slice(0, 5)}
              rowKey="id"
              
              pagination={false}
              scroll={{ y: 150 }}
            />
          </Card>
        </Col>
      </Row>

      {/* Alert Settings Modal */}
      <Modal
        title="Alert Settings"
        open={showAlertSettings}
        onCancel={() => setShowAlertSettings(false)}
        onOk={() => {
          setShowAlertSettings(false);
          message.success('Alert settings updated');
        }}
      >
        <Form layout="vertical">
          <Form.Item label="Enable Alerts">
            <Switch
              checked={alertsEnabled}
              onChange={setAlertsEnabled}
            />
          </Form.Item>
          <Form.Item label="CPU Usage Threshold (%)">
            <InputNumber
              value={alertThresholds.cpu}
              onChange={(value) => setAlertThresholds(prev => ({ ...prev, cpu: value || 80 }))}
              min={0}
              max={100}
              style={{ width: '100%' }}
            />
          </Form.Item>
          <Form.Item label="Memory Usage Threshold (%)">
            <InputNumber
              value={alertThresholds.memory}
              onChange={(value) => setAlertThresholds(prev => ({ ...prev, memory: value || 85 }))}
              min={0}
              max={100}
              style={{ width: '100%' }}
            />
          </Form.Item>
          <Form.Item label="Response Time Threshold (ms)">
            <InputNumber
              value={alertThresholds.responseTime}
              onChange={(value) => setAlertThresholds(prev => ({ ...prev, responseTime: value || 5000 }))}
              min={0}
              style={{ width: '100%' }}
            />
          </Form.Item>
          <Form.Item label="Error Rate Threshold (%)">
            <InputNumber
              value={alertThresholds.errorRate}
              onChange={(value) => setAlertThresholds(prev => ({ ...prev, errorRate: value || 10 }))}
              min={0}
              max={100}
              style={{ width: '100%' }}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};
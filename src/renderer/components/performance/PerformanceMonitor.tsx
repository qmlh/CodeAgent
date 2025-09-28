import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Progress, Typography, Space, Button, Select, DatePicker } from 'antd';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { MonitorOutlined, DownloadOutlined, ReloadOutlined } from '@ant-design/icons';
import './PerformanceMonitor.css';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

interface PerformanceMetrics {
  timestamp: number;
  cpuUsage: number;
  memoryUsage: number;
  memoryTotal: number;
  renderTime: number;
  fps: number;
  diskIO: number;
  networkIO: number;
}

interface SystemInfo {
  platform: string;
  arch: string;
  nodeVersion: string;
  electronVersion: string;
  chromeVersion: string;
  totalMemory: number;
  availableMemory: number;
}

export const PerformanceMonitor: React.FC = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics[]>([]);
  const [currentMetrics, setCurrentMetrics] = useState<PerformanceMetrics | null>(null);
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
  const [isMonitoring, setIsMonitoring] = useState(true);
  const [timeRange, setTimeRange] = useState<string>('1h');

  useEffect(() => {
    // Initialize system info
    setSystemInfo({
      platform: 'Windows',
      arch: 'x64',
      nodeVersion: '18.17.0',
      electronVersion: '25.3.1',
      chromeVersion: '114.0.5735.289',
      totalMemory: 16384, // MB
      availableMemory: 8192 // MB
    });

    // Generate initial metrics data
    const initialMetrics: PerformanceMetrics[] = [];
    const now = Date.now();
    
    for (let i = 60; i >= 0; i--) {
      initialMetrics.push({
        timestamp: now - (i * 60000), // Every minute
        cpuUsage: Math.random() * 50 + 10,
        memoryUsage: Math.random() * 2048 + 1024,
        memoryTotal: 16384,
        renderTime: Math.random() * 20 + 5,
        fps: Math.random() * 10 + 50,
        diskIO: Math.random() * 100 + 20,
        networkIO: Math.random() * 50 + 10
      });
    }
    
    setMetrics(initialMetrics);
    setCurrentMetrics(initialMetrics[initialMetrics.length - 1]);
  }, []);

  useEffect(() => {
    if (!isMonitoring) return;

    const interval = setInterval(() => {
      const newMetric: PerformanceMetrics = {
        timestamp: Date.now(),
        cpuUsage: Math.random() * 50 + 10,
        memoryUsage: Math.random() * 2048 + 1024,
        memoryTotal: 16384,
        renderTime: Math.random() * 20 + 5,
        fps: Math.random() * 10 + 50,
        diskIO: Math.random() * 100 + 20,
        networkIO: Math.random() * 50 + 10
      };

      setMetrics(prev => [...prev.slice(-59), newMetric]);
      setCurrentMetrics(newMetric);
    }, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, [isMonitoring]);

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const getMemoryUsagePercent = () => {
    if (!currentMetrics || !systemInfo) return 0;
    return (currentMetrics.memoryUsage / systemInfo.totalMemory) * 100;
  };

  const exportMetrics = () => {
    const data = {
      systemInfo,
      metrics,
      exportTime: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `performance-metrics-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const toggleMonitoring = () => {
    setIsMonitoring(!isMonitoring);
  };

  return (
    <div className="performance-monitor">
      <Card
        title={
          <Space>
            <MonitorOutlined />
            <Title level={4} style={{ margin: 0 }}>Performance Monitor</Title>
          </Space>
        }
        extra={
          <Space>
            <Select value={timeRange} onChange={setTimeRange} style={{ width: 100 }}>
              <Option value="1h">1 Hour</Option>
              <Option value="6h">6 Hours</Option>
              <Option value="24h">24 Hours</Option>
            </Select>
            <Button
              type="primary"
              danger={isMonitoring}
              onClick={toggleMonitoring}
            >
              {isMonitoring ? 'Stop' : 'Start'} Monitoring
            </Button>
            <Button icon={<ReloadOutlined />} onClick={() => window.location.reload()}>
              Refresh
            </Button>
            <Button icon={<DownloadOutlined />} onClick={exportMetrics}>
              Export
            </Button>
          </Space>
        }
      >
        {/* Real-time Metrics */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col span={6}>
            <Card >
              <Statistic
                title="CPU Usage"
                value={currentMetrics?.cpuUsage || 0}
                precision={1}
                suffix="%"
                valueStyle={{ color: (currentMetrics?.cpuUsage || 0) > 80 ? '#cf1322' : '#3f8600' }}
              />
              <Progress
                percent={currentMetrics?.cpuUsage || 0}
                
                status={(currentMetrics?.cpuUsage || 0) > 80 ? 'exception' : 'normal'}
                showInfo={false}
              />
            </Card>
          </Col>
          
          <Col span={6}>
            <Card >
              <Statistic
                title="Memory Usage"
                value={currentMetrics?.memoryUsage || 0}
                precision={0}
                suffix="MB"
                valueStyle={{ color: getMemoryUsagePercent() > 80 ? '#cf1322' : '#3f8600' }}
              />
              <Progress
                percent={getMemoryUsagePercent()}
                
                status={getMemoryUsagePercent() > 80 ? 'exception' : 'normal'}
                showInfo={false}
              />
            </Card>
          </Col>
          
          <Col span={6}>
            <Card >
              <Statistic
                title="Render Time"
                value={currentMetrics?.renderTime || 0}
                precision={1}
                suffix="ms"
                valueStyle={{ color: (currentMetrics?.renderTime || 0) > 16 ? '#cf1322' : '#3f8600' }}
              />
              <Progress
                percent={Math.min((currentMetrics?.renderTime || 0) / 30 * 100, 100)}
                
                status={(currentMetrics?.renderTime || 0) > 16 ? 'exception' : 'normal'}
                showInfo={false}
              />
            </Card>
          </Col>
          
          <Col span={6}>
            <Card >
              <Statistic
                title="FPS"
                value={currentMetrics?.fps || 0}
                precision={0}
                valueStyle={{ color: (currentMetrics?.fps || 0) < 30 ? '#cf1322' : '#3f8600' }}
              />
              <Progress
                percent={Math.min((currentMetrics?.fps || 0) / 60 * 100, 100)}
                
                status={(currentMetrics?.fps || 0) < 30 ? 'exception' : 'normal'}
                showInfo={false}
              />
            </Card>
          </Col>
        </Row>

        {/* Charts */}
        <Row gutter={[16, 16]}>
          <Col span={12}>
            <Card title="CPU & Memory Usage" >
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={metrics}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="timestamp" 
                    tickFormatter={formatTimestamp}
                    type="number"
                    scale="time"
                    domain={['dataMin', 'dataMax']}
                  />
                  <YAxis />
                  <Tooltip 
                    labelFormatter={(value) => formatTimestamp(value as number)}
                    formatter={(value: number, name: string) => [
                      `${value.toFixed(1)}${name === 'cpuUsage' ? '%' : 'MB'}`,
                      name === 'cpuUsage' ? 'CPU Usage' : 'Memory Usage'
                    ]}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="cpuUsage" 
                    stroke="#1890ff" 
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="memoryUsage" 
                    stroke="#52c41a" 
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </Card>
          </Col>
          
          <Col span={12}>
            <Card title="Render Performance" >
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={metrics}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="timestamp" 
                    tickFormatter={formatTimestamp}
                    type="number"
                    scale="time"
                    domain={['dataMin', 'dataMax']}
                  />
                  <YAxis />
                  <Tooltip 
                    labelFormatter={(value) => formatTimestamp(value as number)}
                    formatter={(value: number, name: string) => [
                      `${value.toFixed(1)}${name === 'renderTime' ? 'ms' : ' FPS'}`,
                      name === 'renderTime' ? 'Render Time' : 'FPS'
                    ]}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="renderTime" 
                    stackId="1"
                    stroke="#ff7875" 
                    fill="#ff7875"
                    fillOpacity={0.6}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="fps" 
                    stackId="2"
                    stroke="#40a9ff" 
                    fill="#40a9ff"
                    fillOpacity={0.6}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </Card>
          </Col>
        </Row>

        {/* System Information */}
        {systemInfo && (
          <Card title="System Information"  style={{ marginTop: 16 }}>
            <Row gutter={[16, 8]}>
              <Col span={8}>
                <Text strong>Platform: </Text>
                <Text>{systemInfo.platform} ({systemInfo.arch})</Text>
              </Col>
              <Col span={8}>
                <Text strong>Node.js: </Text>
                <Text>{systemInfo.nodeVersion}</Text>
              </Col>
              <Col span={8}>
                <Text strong>Electron: </Text>
                <Text>{systemInfo.electronVersion}</Text>
              </Col>
              <Col span={8}>
                <Text strong>Chrome: </Text>
                <Text>{systemInfo.chromeVersion}</Text>
              </Col>
              <Col span={8}>
                <Text strong>Total Memory: </Text>
                <Text>{systemInfo.totalMemory} MB</Text>
              </Col>
              <Col span={8}>
                <Text strong>Available Memory: </Text>
                <Text>{systemInfo.availableMemory} MB</Text>
              </Col>
            </Row>
          </Card>
        )}
      </Card>
    </div>
  );
};
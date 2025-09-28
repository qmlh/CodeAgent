/**
 * System Performance Monitor Component
 * Displays resource usage and system performance metrics
 */

import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Progress, 
  Statistic, 
  Row, 
  Col, 
  Alert,
  Button,
  Tooltip,
  Tag
} from 'antd';
import { 
  DashboardOutlined,
  DatabaseOutlined,
  HddOutlined,
  WifiOutlined,
  ThunderboltOutlined,
  ReloadOutlined,
  WarningOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';
import { useAppSelector } from '../../hooks/redux';

interface SystemMetrics {
  cpu: {
    usage: number;
    cores: number;
    temperature?: number;
  };
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
  disk: {
    used: number;
    total: number;
    percentage: number;
  };
  network: {
    upload: number;
    download: number;
    latency: number;
  };
  agents: {
    active: number;
    total: number;
    avgResponseTime: number;
    errorRate: number;
  };
}

interface PerformanceAlert {
  id: string;
  type: 'warning' | 'error' | 'info';
  message: string;
  timestamp: Date;
  metric: string;
  value: number;
  threshold: number;
}

export const SystemPerformanceMonitor: React.FC = () => {
  const { agents } = useAppSelector(state => state.agent);
  const [metrics, setMetrics] = useState<SystemMetrics>({
    cpu: { usage: 0, cores: 4 },
    memory: { used: 0, total: 8192, percentage: 0 },
    disk: { used: 0, total: 512000, percentage: 0 },
    network: { upload: 0, download: 0, latency: 0 },
    agents: { active: 0, total: 0, avgResponseTime: 0, errorRate: 0 }
  });
  const [alerts, setAlerts] = useState<PerformanceAlert[]>([]);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // Simulate system metrics (in a real app, this would come from system APIs)
  useEffect(() => {
    const updateMetrics = () => {
      // Simulate CPU usage
      const cpuUsage = Math.random() * 100;
      
      // Simulate memory usage
      const memoryUsed = Math.random() * 6144 + 1024; // 1-7GB used
      const memoryPercentage = (memoryUsed / 8192) * 100;
      
      // Simulate disk usage
      const diskUsed = Math.random() * 256000 + 128000; // 128-384GB used
      const diskPercentage = (diskUsed / 512000) * 100;
      
      // Calculate agent metrics
      const activeAgents = agents.filter(a => a.status !== 'offline').length;
      const workingAgents = agents.filter(a => a.status === 'working').length;
      const errorAgents = agents.filter(a => a.status === 'error').length;
      const errorRate = agents.length > 0 ? (errorAgents / agents.length) * 100 : 0;
      
      // Simulate network metrics
      const networkUpload = Math.random() * 10; // MB/s
      const networkDownload = Math.random() * 50; // MB/s
      const networkLatency = Math.random() * 100 + 10; // 10-110ms
      
      const newMetrics: SystemMetrics = {
        cpu: { 
          usage: cpuUsage, 
          cores: 4,
          temperature: Math.random() * 30 + 40 // 40-70°C
        },
        memory: { 
          used: memoryUsed, 
          total: 8192, 
          percentage: memoryPercentage 
        },
        disk: { 
          used: diskUsed, 
          total: 512000, 
          percentage: diskPercentage 
        },
        network: { 
          upload: networkUpload, 
          download: networkDownload, 
          latency: networkLatency 
        },
        agents: { 
          active: activeAgents, 
          total: agents.length,
          avgResponseTime: Math.random() * 2000 + 500, // 500-2500ms
          errorRate: errorRate
        }
      };

      setMetrics(newMetrics);
      setLastUpdate(new Date());

      // Generate alerts based on thresholds
      const newAlerts: PerformanceAlert[] = [];
      
      if (cpuUsage > 80) {
        newAlerts.push({
          id: `cpu-${Date.now()}`,
          type: 'warning',
          message: 'High CPU usage detected',
          timestamp: new Date(),
          metric: 'CPU',
          value: cpuUsage,
          threshold: 80
        });
      }
      
      if (memoryPercentage > 85) {
        newAlerts.push({
          id: `memory-${Date.now()}`,
          type: 'error',
          message: 'Memory usage critical',
          timestamp: new Date(),
          metric: 'Memory',
          value: memoryPercentage,
          threshold: 85
        });
      }
      
      if (errorRate > 20) {
        newAlerts.push({
          id: `agents-${Date.now()}`,
          type: 'error',
          message: 'High agent error rate',
          timestamp: new Date(),
          metric: 'Agent Errors',
          value: errorRate,
          threshold: 20
        });
      }

      if (newAlerts.length > 0) {
        setAlerts(prev => [...newAlerts, ...prev].slice(0, 10)); // Keep last 10 alerts
      }
    };

    updateMetrics();
    
    if (autoRefresh) {
      const interval = setInterval(updateMetrics, 3000); // Update every 3 seconds
      return () => clearInterval(interval);
    }
  }, [agents, autoRefresh]);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const formatSpeed = (mbps: number) => {
    if (mbps < 1) return `${(mbps * 1024).toFixed(0)} KB/s`;
    return `${mbps.toFixed(1)} MB/s`;
  };

  const getProgressColor = (percentage: number) => {
    if (percentage < 50) return '#52c41a';
    if (percentage < 80) return '#faad14';
    return '#ff4d4f';
  };

  const getSystemHealth = () => {
    const criticalIssues = alerts.filter(a => a.type === 'error').length;
    const warnings = alerts.filter(a => a.type === 'warning').length;
    
    if (criticalIssues > 0) return { status: 'error', text: 'Critical Issues' };
    if (warnings > 0) return { status: 'warning', text: 'Warnings' };
    return { status: 'success', text: 'Healthy' };
  };

  const systemHealth = getSystemHealth();

  return (
    <div style={{ padding: '12px', height: '100%', overflow: 'auto' }}>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '16px'
      }}>
        <div style={{ 
          fontSize: '14px', 
          fontWeight: 'bold', 
          color: '#cccccc',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <DashboardOutlined />
          System Performance
          <Tag 
            color={systemHealth.status === 'success' ? 'green' : 
                   systemHealth.status === 'warning' ? 'orange' : 'red'}
            icon={systemHealth.status === 'success' ? <CheckCircleOutlined /> : <WarningOutlined />}
          >
            {systemHealth.text}
          </Tag>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span style={{ fontSize: '10px', color: '#666' }}>
            Last update: {lastUpdate.toLocaleTimeString()}
          </span>
          <Button
            
            type={autoRefresh ? 'primary' : 'default'}
            icon={<ReloadOutlined spin={autoRefresh} />}
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            Auto Refresh
          </Button>
        </div>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div style={{ marginBottom: '16px' }}>
          {alerts.slice(0, 3).map(alert => (
            <Alert
              key={alert.id}
              type={alert.type}
              message={alert.message}
              description={`${alert.metric}: ${alert.value.toFixed(1)}% (threshold: ${alert.threshold}%)`}
              showIcon
              closable
              style={{ marginBottom: '8px', fontSize: '11px' }}
              onClose={() => setAlerts(prev => prev.filter(a => a.id !== alert.id))}
            />
          ))}
        </div>
      )}

      {/* System Metrics */}
      <Row gutter={[12, 12]}>
        {/* CPU Usage */}
        <Col span={12}>
          <Card  bodyStyle={{ padding: '12px' }}>
            <Statistic
              title={
                <div style={{ fontSize: '11px', color: '#cccccc' }}>
                  <ThunderboltOutlined /> CPU Usage
                </div>
              }
              value={metrics.cpu.usage}
              precision={1}
              suffix="%"
              valueStyle={{ fontSize: '16px', color: getProgressColor(metrics.cpu.usage) }}
            />
            <Progress 
              percent={metrics.cpu.usage} 
               
              showInfo={false}
              strokeColor={getProgressColor(metrics.cpu.usage)}
            />
            <div style={{ fontSize: '9px', color: '#666', marginTop: '4px' }}>
              {metrics.cpu.cores} cores �?{metrics.cpu.temperature?.toFixed(1)}°C
            </div>
          </Card>
        </Col>

        {/* Memory Usage */}
        <Col span={12}>
          <Card  bodyStyle={{ padding: '12px' }}>
            <Statistic
              title={
                <div style={{ fontSize: '11px', color: '#cccccc' }}>
                  <DatabaseOutlined /> Memory Usage
                </div>
              }
              value={metrics.memory.percentage}
              precision={1}
              suffix="%"
              valueStyle={{ fontSize: '16px', color: getProgressColor(metrics.memory.percentage) }}
            />
            <Progress 
              percent={metrics.memory.percentage} 
               
              showInfo={false}
              strokeColor={getProgressColor(metrics.memory.percentage)}
            />
            <div style={{ fontSize: '9px', color: '#666', marginTop: '4px' }}>
              {formatBytes(metrics.memory.used * 1024 * 1024)} / {formatBytes(metrics.memory.total * 1024 * 1024)}
            </div>
          </Card>
        </Col>

        {/* Disk Usage */}
        <Col span={12}>
          <Card  bodyStyle={{ padding: '12px' }}>
            <Statistic
              title={
                <div style={{ fontSize: '11px', color: '#cccccc' }}>
                  <HddOutlined /> Disk Usage
                </div>
              }
              value={metrics.disk.percentage}
              precision={1}
              suffix="%"
              valueStyle={{ fontSize: '16px', color: getProgressColor(metrics.disk.percentage) }}
            />
            <Progress 
              percent={metrics.disk.percentage} 
               
              showInfo={false}
              strokeColor={getProgressColor(metrics.disk.percentage)}
            />
            <div style={{ fontSize: '9px', color: '#666', marginTop: '4px' }}>
              {formatBytes(metrics.disk.used * 1024 * 1024)} / {formatBytes(metrics.disk.total * 1024 * 1024)}
            </div>
          </Card>
        </Col>

        {/* Network Activity */}
        <Col span={12}>
          <Card  bodyStyle={{ padding: '12px' }}>
            <div style={{ fontSize: '11px', color: '#cccccc', marginBottom: '8px' }}>
              <WifiOutlined /> Network Activity
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span style={{ fontSize: '10px', color: '#888' }}>Upload:</span>
              <span style={{ fontSize: '10px', color: '#1890ff' }}>
                {formatSpeed(metrics.network.upload)}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span style={{ fontSize: '10px', color: '#888' }}>Download:</span>
              <span style={{ fontSize: '10px', color: '#52c41a' }}>
                {formatSpeed(metrics.network.download)}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '10px', color: '#888' }}>Latency:</span>
              <span style={{ fontSize: '10px', color: '#faad14' }}>
                {metrics.network.latency.toFixed(0)}ms
              </span>
            </div>
          </Card>
        </Col>

        {/* Agent Performance */}
        <Col span={24}>
          <Card  bodyStyle={{ padding: '12px' }}>
            <div style={{ fontSize: '11px', color: '#cccccc', marginBottom: '12px' }}>
              Agent Performance Metrics
            </div>
            <Row gutter={16}>
              <Col span={6}>
                <Statistic
                  title={<span style={{ fontSize: '10px' }}>Active Agents</span>}
                  value={metrics.agents.active}
                  suffix={`/ ${metrics.agents.total}`}
                  valueStyle={{ fontSize: '14px', color: '#1890ff' }}
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title={<span style={{ fontSize: '10px' }}>Avg Response</span>}
                  value={metrics.agents.avgResponseTime}
                  suffix="ms"
                  precision={0}
                  valueStyle={{ fontSize: '14px', color: '#52c41a' }}
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title={<span style={{ fontSize: '10px' }}>Error Rate</span>}
                  value={metrics.agents.errorRate}
                  suffix="%"
                  precision={1}
                  valueStyle={{ 
                    fontSize: '14px', 
                    color: metrics.agents.errorRate > 10 ? '#ff4d4f' : '#52c41a' 
                  }}
                />
              </Col>
              <Col span={6}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '10px', color: '#888', marginBottom: '4px' }}>
                    System Load
                  </div>
                  <Progress
                    type="circle"
                    size={40}
                    percent={Math.round((metrics.cpu.usage + metrics.memory.percentage) / 2)}
                    strokeColor={getProgressColor((metrics.cpu.usage + metrics.memory.percentage) / 2)}
                    format={(percent) => `${percent}%`}
                  />
                </div>
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>
    </div>
  );
};
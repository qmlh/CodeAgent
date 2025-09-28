/**
 * Agent Performance Chart Component
 * Displays performance metrics including CPU, memory usage, and task completion rates
 */

import React, { useState, useEffect } from 'react';
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
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { Card, Select, Row, Col, Statistic, Typography } from 'antd';

const { Option } = Select;
const { Text } = Typography;

interface AgentPerformanceChartProps {
  agentId: string;
}

interface PerformanceData {
  timestamp: string;
  cpuUsage: number;
  memoryUsage: number;
  tasksCompleted: number;
  tasksActive: number;
  responseTime: number;
}

interface TaskTypeData {
  name: string;
  value: number;
  color: string;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export const AgentPerformanceChart: React.FC<AgentPerformanceChartProps> = ({ agentId }) => {
  const [timeRange, setTimeRange] = useState<'1h' | '6h' | '24h' | '7d'>('1h');
  const [performanceData, setPerformanceData] = useState<PerformanceData[]>([]);
  const [taskTypeData, setTaskTypeData] = useState<TaskTypeData[]>([]);

  useEffect(() => {
    // Generate mock performance data
    generateMockData();
  }, [agentId, timeRange]);

  const generateMockData = () => {
    const now = new Date();
    const dataPoints = timeRange === '1h' ? 12 : timeRange === '6h' ? 24 : timeRange === '24h' ? 48 : 168;
    const intervalMs = timeRange === '1h' ? 5 * 60 * 1000 : 
                     timeRange === '6h' ? 15 * 60 * 1000 : 
                     timeRange === '24h' ? 30 * 60 * 1000 : 
                     60 * 60 * 1000;

    const data: PerformanceData[] = [];
    
    for (let i = dataPoints - 1; i >= 0; i--) {
      const timestamp = new Date(now.getTime() - i * intervalMs);
      data.push({
        timestamp: timestamp.toLocaleTimeString([], { 
          hour: '2-digit', 
          minute: '2-digit',
          ...(timeRange === '7d' && { month: 'short', day: 'numeric' })
        }),
        cpuUsage: Math.random() * 80 + 10, // 10-90%
        memoryUsage: Math.random() * 60 + 20, // 20-80%
        tasksCompleted: Math.floor(Math.random() * 5),
        tasksActive: Math.floor(Math.random() * 3),
        responseTime: Math.random() * 2000 + 500 // 500-2500ms
      });
    }

    setPerformanceData(data);

    // Generate task type distribution data
    setTaskTypeData([
      { name: 'Code Generation', value: 35, color: COLORS[0] },
      { name: 'Code Review', value: 25, color: COLORS[1] },
      { name: 'Testing', value: 20, color: COLORS[2] },
      { name: 'Documentation', value: 15, color: COLORS[3] },
      { name: 'Refactoring', value: 5, color: COLORS[4] }
    ]);
  };

  const formatTooltip = (value: any, name: string) => {
    if (name === 'cpuUsage' || name === 'memoryUsage') {
      return [`${value.toFixed(1)}%`, name === 'cpuUsage' ? 'CPU Usage' : 'Memory Usage'];
    }
    if (name === 'responseTime') {
      return [`${value.toFixed(0)}ms`, 'Response Time'];
    }
    return [value, name];
  };

  const getCurrentStats = () => {
    if (performanceData.length === 0) return { cpu: 0, memory: 0, avgResponse: 0 };
    
    const latest = performanceData[performanceData.length - 1];
    const avgResponse = performanceData.reduce((sum, d) => sum + d.responseTime, 0) / performanceData.length;
    
    return {
      cpu: latest.cpuUsage,
      memory: latest.memoryUsage,
      avgResponse
    };
  };

  const stats = getCurrentStats();

  return (
    <div>
      {/* Controls */}
      <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text strong>Performance Overview</Text>
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
      </div>

      {/* Current Stats */}
      <Row gutter={16} style={{ marginBottom: '16px' }}>
        <Col span={8}>
          <Card >
            <Statistic
              title="CPU Usage"
              value={stats.cpu}
              precision={1}
              suffix="%"
              valueStyle={{ 
                color: stats.cpu > 80 ? '#cf1322' : stats.cpu > 60 ? '#faad14' : '#3f8600',
                fontSize: '16px'
              }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card >
            <Statistic
              title="Memory Usage"
              value={stats.memory}
              precision={1}
              suffix="%"
              valueStyle={{ 
                color: stats.memory > 80 ? '#cf1322' : stats.memory > 60 ? '#faad14' : '#3f8600',
                fontSize: '16px'
              }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card >
            <Statistic
              title="Avg Response"
              value={stats.avgResponse}
              precision={0}
              suffix="ms"
              valueStyle={{ fontSize: '16px' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Resource Usage Chart */}
      <Card  title="Resource Usage" style={{ marginBottom: '16px' }}>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={performanceData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="timestamp" 
              tick={{ fontSize: 10 }}
              interval="preserveStartEnd"
            />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip formatter={formatTooltip} />
            <Legend />
            <Area
              type="monotone"
              dataKey="cpuUsage"
              stackId="1"
              stroke="#8884d8"
              fill="#8884d8"
              fillOpacity={0.6}
              name="CPU Usage (%)"
            />
            <Area
              type="monotone"
              dataKey="memoryUsage"
              stackId="2"
              stroke="#82ca9d"
              fill="#82ca9d"
              fillOpacity={0.6}
              name="Memory Usage (%)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </Card>

      <Row gutter={16}>
        {/* Task Activity */}
        <Col span={12}>
          <Card  title="Task Activity">
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={performanceData.slice(-10)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="timestamp" 
                  tick={{ fontSize: 10 }}
                />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="tasksCompleted" fill="#8884d8" name="Completed" />
                <Bar dataKey="tasksActive" fill="#82ca9d" name="Active" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>

        {/* Task Type Distribution */}
        <Col span={12}>
          <Card  title="Task Distribution">
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie
                  data={taskTypeData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {taskTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value}%`, 'Percentage']} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ marginTop: '8px' }}>
              {taskTypeData.map((item, index) => (
                <div key={index} style={{ display: 'flex', alignItems: 'center', marginBottom: '4px' }}>
                  <div
                    style={{
                      width: '12px',
                      height: '12px',
                      backgroundColor: item.color,
                      marginRight: '8px',
                      borderRadius: '2px'
                    }}
                  />
                  <Text style={{ fontSize: '12px' }}>
                    {item.name}: {item.value}%
                  </Text>
                </div>
              ))}
            </div>
          </Card>
        </Col>
      </Row>

      {/* Response Time Trend */}
      <Card  title="Response Time Trend" style={{ marginTop: '16px' }}>
        <ResponsiveContainer width="100%" height={150}>
          <LineChart data={performanceData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="timestamp" 
              tick={{ fontSize: 10 }}
              interval="preserveStartEnd"
            />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip formatter={formatTooltip} />
            <Line
              type="monotone"
              dataKey="responseTime"
              stroke="#ff7300"
              strokeWidth={2}
              dot={false}
              name="Response Time (ms)"
            />
          </LineChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
};
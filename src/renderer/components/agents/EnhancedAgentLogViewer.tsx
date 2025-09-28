/**
 * Enhanced Agent Log Viewer Component
 * Advanced log viewing with highlighting, filtering, analysis tools, and real-time updates
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Card,
  Input,
  Select,
  Button,
  Space,
  Typography,
  Badge,
  Tooltip,
  Switch,
  Row,
  Col,
  Empty,
  Dropdown,
  Menu,
  Modal,
  Statistic,
  Progress,
  Tag,
  Divider,
  message
} from 'antd';
import {
  SearchOutlined,
  ClearOutlined,
  DownloadOutlined,
  ReloadOutlined,
  PauseCircleOutlined,
  PlayCircleOutlined,
  FilterOutlined,
  BarChartOutlined,
  SettingOutlined,
  FullscreenOutlined,
  HighlightOutlined,
  BugOutlined
} from '@ant-design/icons';
import { useAppSelector } from '../../hooks/redux';

const { Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

interface LogEntry {
  id: string;
  timestamp: Date;
  level: 'info' | 'warn' | 'error' | 'debug' | 'trace';
  message: string;
  source?: string;
  details?: any;
  agentId: string;
  agentName: string;
  category?: string;
  tags?: string[];
}

interface LogFilter {
  levels: string[];
  sources: string[];
  categories: string[];
  timeRange: string;
  searchTerm: string;
  agentIds: string[];
}

interface LogAnalytics {
  totalLogs: number;
  errorCount: number;
  warningCount: number;
  topSources: Array<{ source: string; count: number }>;
  logRate: number;
  errorRate: number;
}

interface EnhancedAgentLogViewerProps {
  agentId: string;
  compact?: boolean;
}

const logLevelColors = {
  trace: '#8c8c8c',
  debug: '#52c41a',
  info: '#1890ff',
  warn: '#faad14',
  error: '#ff4d4f'
};

const logLevelBadges = {
  trace: 'default',
  debug: 'success',
  info: 'processing',
  warn: 'warning',
  error: 'error'
} as const;

export const EnhancedAgentLogViewer: React.FC<EnhancedAgentLogViewerProps> = ({ 
  agentId, 
  compact = false 
}) => {
  const { agentLogs, agents } = useAppSelector(state => state.agent);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<LogEntry[]>([]);
  const [filter, setFilter] = useState<LogFilter>({
    levels: ['info', 'warn', 'error', 'debug'],
    sources: [],
    categories: [],
    timeRange: '1h',
    searchTerm: '',
    agentIds: agentId === 'system' ? [] : [agentId]
  });
  const [autoScroll, setAutoScroll] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [highlightTerms, setHighlightTerms] = useState<string[]>([]);
  const [showFullscreen, setShowFullscreen] = useState(false);
  const [logAnalytics, setLogAnalytics] = useState<LogAnalytics | null>(null);
  const logContainerRef = useRef<HTMLDivElement>(null);

  // Generate enhanced mock logs
  useEffect(() => {
    generateEnhancedMockLogs();
    const interval = setInterval(() => {
      if (!isPaused && autoScroll) {
        addNewLogEntries();
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [agentId, isPaused, autoScroll]);

  // Filter logs when filter changes
  useEffect(() => {
    applyFilters();
    calculateAnalytics();
  }, [logs, filter]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (autoScroll && !isPaused && logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [filteredLogs, autoScroll, isPaused]);

  const generateEnhancedMockLogs = () => {
    const mockLogs: LogEntry[] = [];
    const sources = ['system', 'network', 'task-manager', 'task-executor', 'monitor', 'file-manager', 'collaboration'];
    const categories = ['startup', 'task', 'error', 'performance', 'communication', 'file-operation'];
    const agentsToInclude = agentId === 'system' ? agents : agents.filter(a => a.id === agentId);

    for (let i = 0; i < 100; i++) {
      const timestamp = new Date(Date.now() - i * 30000); // 30 seconds apart
      const agent = agentsToInclude[Math.floor(Math.random() * agentsToInclude.length)];
      const level = ['trace', 'debug', 'info', 'warn', 'error'][Math.floor(Math.random() * 5)] as LogEntry['level'];
      const source = sources[Math.floor(Math.random() * sources.length)];
      const category = categories[Math.floor(Math.random() * categories.length)];

      const messages = {
        trace: [
          'Entering function processTask()',
          'Variable taskId set to: task-123',
          'Checking agent availability',
          'Memory allocation: 2.4MB'
        ],
        debug: [
          'Processing task queue: 3 tasks pending',
          'Agent heartbeat received',
          'Cache hit for configuration data',
          'WebSocket connection established'
        ],
        info: [
          'Agent initialized successfully',
          'Task completed in 15.3 seconds',
          'Connected to collaboration server',
          'File saved: /project/src/component.tsx',
          'Started working on task: Implement user authentication'
        ],
        warn: [
          'High memory usage detected: 78%',
          'Task execution time exceeded threshold',
          'Network latency increased to 250ms',
          'Deprecated API endpoint used'
        ],
        error: [
          'Failed to connect to database',
          'Task execution failed: Timeout error',
          'File not found: /config/settings.json',
          'Authentication failed for user session'
        ]
      };

      const message = messages[level][Math.floor(Math.random() * messages[level].length)];

      mockLogs.push({
        id: `log-${i}`,
        timestamp,
        level,
        message,
        source,
        agentId: agent?.id || 'system',
        agentName: agent?.name || 'System',
        category,
        tags: [category, source],
        details: level === 'error' ? { 
          stack: 'Error stack trace would be here...',
          code: 'ERR_CONNECTION_FAILED' 
        } : undefined
      });
    }

    setLogs(mockLogs.reverse()); // Most recent first
  };

  const addNewLogEntries = () => {
    const newEntries: LogEntry[] = [];
    const count = Math.floor(Math.random() * 3) + 1; // 1-3 new entries
    
    for (let i = 0; i < count; i++) {
      const agent = agents[Math.floor(Math.random() * agents.length)];
      const level = ['info', 'debug', 'warn'][Math.floor(Math.random() * 3)] as LogEntry['level'];
      const messages = [
        'Task progress update: 45% complete',
        'Received new task assignment',
        'Performance metrics updated',
        'Collaboration session joined'
      ];

      newEntries.push({
        id: `log-${Date.now()}-${i}`,
        timestamp: new Date(),
        level,
        message: messages[Math.floor(Math.random() * messages.length)],
        source: 'real-time',
        agentId: agent?.id || 'system',
        agentName: agent?.name || 'System',
        category: 'runtime',
        tags: ['runtime', 'real-time']
      });
    }

    setLogs(prev => [...newEntries, ...prev].slice(0, 1000)); // Keep last 1000 logs
  };

  const applyFilters = () => {
    let filtered = logs;

    // Filter by levels
    if (filter.levels.length > 0) {
      filtered = filtered.filter(log => filter.levels.includes(log.level));
    }

    // Filter by sources
    if (filter.sources.length > 0) {
      filtered = filtered.filter(log => filter.sources.includes(log.source || ''));
    }

    // Filter by agents
    if (filter.agentIds.length > 0) {
      filtered = filtered.filter(log => filter.agentIds.includes(log.agentId));
    }

    // Filter by search term
    if (filter.searchTerm) {
      const term = filter.searchTerm.toLowerCase();
      filtered = filtered.filter(log => 
        log.message.toLowerCase().includes(term) ||
        log.source?.toLowerCase().includes(term) ||
        log.agentName.toLowerCase().includes(term) ||
        log.category?.toLowerCase().includes(term)
      );
    }

    // Filter by time range
    const now = new Date();
    const timeRangeMs = {
      '15m': 15 * 60 * 1000,
      '1h': 60 * 60 * 1000,
      '6h': 6 * 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000
    }[filter.timeRange] || 60 * 60 * 1000;

    filtered = filtered.filter(log => 
      now.getTime() - log.timestamp.getTime() <= timeRangeMs
    );

    setFilteredLogs(filtered);
  };

  const calculateAnalytics = () => {
    const analytics: LogAnalytics = {
      totalLogs: filteredLogs.length,
      errorCount: filteredLogs.filter(l => l.level === 'error').length,
      warningCount: filteredLogs.filter(l => l.level === 'warn').length,
      topSources: [],
      logRate: 0,
      errorRate: 0
    };

    // Calculate top sources
    const sourceCounts = filteredLogs.reduce((acc, log) => {
      const source = log.source || 'unknown';
      acc[source] = (acc[source] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    analytics.topSources = Object.entries(sourceCounts)
      .map(([source, count]) => ({ source, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Calculate rates (logs per minute)
    const timeSpan = Math.max(1, (Date.now() - (filteredLogs[filteredLogs.length - 1]?.timestamp.getTime() || Date.now())) / 60000);
    analytics.logRate = filteredLogs.length / timeSpan;
    analytics.errorRate = analytics.errorCount / Math.max(1, analytics.totalLogs) * 100;

    setLogAnalytics(analytics);
  };

  const highlightText = (text: string, terms: string[]) => {
    if (terms.length === 0) return text;

    let highlightedText = text;
    terms.forEach(term => {
      const regex = new RegExp(`(${term})`, 'gi');
      highlightedText = highlightedText.replace(regex, '<mark>$1</mark>');
    });

    return <span dangerouslySetInnerHTML={{ __html: highlightedText }} />;
  };

  const exportLogs = () => {
    const logText = filteredLogs.map(log => 
      `[${log.timestamp.toISOString()}] ${log.level.toUpperCase()} [${log.agentName}] [${log.source}] ${log.message}`
    ).join('\n');

    const blob = new Blob([logText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `agent-logs-${agentId}-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    message.success('Logs exported successfully');
  };

  const clearLogs = () => {
    Modal.confirm({
      title: 'Clear Logs',
      content: 'Are you sure you want to clear all logs? This action cannot be undone.',
      onOk: () => {
        setLogs([]);
        setFilteredLogs([]);
        message.success('Logs cleared');
      }
    });
  };

  const formatTimestamp = (timestamp: Date) => {
    return timestamp.toLocaleTimeString([], { 
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getLogLevelCount = (level: string) => {
    return filteredLogs.filter(log => log.level === level).length;
  };

  const uniqueSources = [...new Set(logs.map(log => log.source).filter(Boolean))];
  const uniqueAgents = [...new Set(logs.map(log => ({ id: log.agentId, name: log.agentName })))];

  const filterMenu = (
    <Menu>
      <Menu.SubMenu key="levels" title="Log Levels">
        {Object.keys(logLevelColors).map(level => (
          <Menu.Item key={level}>
            <Badge status={logLevelBadges[level as keyof typeof logLevelBadges]} />
            {level.toUpperCase()} ({getLogLevelCount(level)})
          </Menu.Item>
        ))}
      </Menu.SubMenu>
      <Menu.SubMenu key="sources" title="Sources">
        {uniqueSources.map(source => (
          <Menu.Item key={source}>
            {source}
          </Menu.Item>
        ))}
      </Menu.SubMenu>
    </Menu>
  );

  if (compact) {
    return (
      <div style={{ height: '300px' }}>
        <div style={{ marginBottom: '8px' }}>
          <Row gutter={8} align="middle">
            <Col flex="auto">
              <Input
                
                placeholder="Search..."
                prefix={<SearchOutlined />}
                value={filter.searchTerm}
                onChange={(e) => setFilter(prev => ({ ...prev, searchTerm: e.target.value }))}
                allowClear
              />
            </Col>
            <Col>
              <Button
                
                icon={isPaused ? <PlayCircleOutlined /> : <PauseCircleOutlined />}
                onClick={() => setIsPaused(!isPaused)}
              />
            </Col>
          </Row>
        </div>
        
        <div
          ref={logContainerRef}
          style={{
            height: '250px',
            overflow: 'auto',
            backgroundColor: '#1e1e1e',
            border: '1px solid #d9d9d9',
            borderRadius: '4px',
            padding: '4px',
            fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
            fontSize: '11px',
            lineHeight: '1.3'
          }}
        >
          {filteredLogs.slice(0, 50).map((log) => (
            <div
              key={log.id}
              style={{
                marginBottom: '2px',
                padding: '2px 4px',
                borderRadius: '2px',
                backgroundColor: log.level === 'error' ? '#2a1215' : 
                                log.level === 'warn' ? '#2b2111' : 
                                'transparent',
                borderLeft: `2px solid ${logLevelColors[log.level]}`,
                display: 'flex',
                alignItems: 'flex-start',
                gap: '4px'
              }}
            >
              <Text style={{ color: '#8c8c8c', fontSize: '10px', minWidth: '50px' }}>
                {formatTimestamp(log.timestamp).slice(-8)}
              </Text>
              <Text style={{ color: logLevelColors[log.level], fontSize: '10px', minWidth: '30px' }}>
                {log.level.toUpperCase()}
              </Text>
              <Text style={{ color: '#f0f0f0', fontSize: '11px', flex: 1, wordBreak: 'break-word' }}>
                {highlightText(log.message, highlightTerms)}
              </Text>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Enhanced Controls */}
      <Row gutter={8} style={{ marginBottom: '12px' }} align="middle">
        <Col flex="auto">
          <Input
            placeholder="Search logs..."
            prefix={<SearchOutlined />}
            value={filter.searchTerm}
            onChange={(e) => setFilter(prev => ({ ...prev, searchTerm: e.target.value }))}
            
            allowClear
          />
        </Col>
        <Col>
          <Select
            mode="multiple"
            placeholder="Levels"
            value={filter.levels}
            onChange={(levels) => setFilter(prev => ({ ...prev, levels }))}
            
            style={{ width: 120 }}
          >
            {Object.keys(logLevelColors).map(level => (
              <Option key={level} value={level}>
                <Badge status={logLevelBadges[level as keyof typeof logLevelBadges]} />
                {level.toUpperCase()}
              </Option>
            ))}
          </Select>
        </Col>
        <Col>
          <Select
            value={filter.timeRange}
            onChange={(timeRange) => setFilter(prev => ({ ...prev, timeRange }))}
            
            style={{ width: 80 }}
          >
            <Option value="15m">15m</Option>
            <Option value="1h">1h</Option>
            <Option value="6h">6h</Option>
            <Option value="24h">24h</Option>
            <Option value="7d">7d</Option>
          </Select>
        </Col>
      </Row>

      <Row gutter={8} style={{ marginBottom: '12px' }} align="middle">
        <Col>
          <Space >
            <Tooltip title={isPaused ? 'Resume' : 'Pause'}>
              <Button
                
                icon={isPaused ? <PlayCircleOutlined /> : <PauseCircleOutlined />}
                onClick={() => setIsPaused(!isPaused)}
              />
            </Tooltip>
            <Tooltip title="Auto-scroll">
              <Switch
                
                checked={autoScroll}
                onChange={setAutoScroll}
                checkedChildren="Auto"
                unCheckedChildren="Manual"
              />
            </Tooltip>
            <Tooltip title="Highlight terms">
              <Button
                
                icon={<HighlightOutlined />}
                onClick={() => {
                  const terms = filter.searchTerm.split(' ').filter(t => t.length > 0);
                  setHighlightTerms(terms);
                }}
              />
            </Tooltip>
          </Space>
        </Col>
        <Col flex="auto" />
        <Col>
          <Space >
            <Button
              
              icon={<BarChartOutlined />}
              onClick={() => setShowAnalytics(true)}
            >
              Analytics
            </Button>
            <Button
              
              icon={<DownloadOutlined />}
              onClick={exportLogs}
            />
            <Button
              
              icon={<ClearOutlined />}
              onClick={clearLogs}
            />
            <Button
              
              icon={<FullscreenOutlined />}
              onClick={() => setShowFullscreen(true)}
            />
          </Space>
        </Col>
      </Row>

      {/* Log Display */}
      <div
        ref={logContainerRef}
        style={{
          height: '400px',
          overflow: 'auto',
          backgroundColor: '#1e1e1e',
          border: '1px solid #d9d9d9',
          borderRadius: '6px',
          padding: '8px',
          fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
          fontSize: '12px',
          lineHeight: '1.4'
        }}
      >
        {filteredLogs.length === 0 ? (
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            height: '100%',
            color: '#8c8c8c'
          }}>
            <Empty 
              description="No logs match the current filters"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          </div>
        ) : (
          filteredLogs.map((log) => (
            <div
              key={log.id}
              style={{
                marginBottom: '4px',
                padding: '4px 8px',
                borderRadius: '3px',
                backgroundColor: log.level === 'error' ? '#2a1215' : 
                                log.level === 'warn' ? '#2b2111' : 
                                'transparent',
                borderLeft: `3px solid ${logLevelColors[log.level]}`,
                display: 'flex',
                alignItems: 'flex-start',
                gap: '8px'
              }}
            >
              <Text style={{ color: '#8c8c8c', fontSize: '11px', minWidth: '80px' }}>
                {formatTimestamp(log.timestamp)}
              </Text>
              <Badge status={logLevelBadges[log.level]} style={{ minWidth: '12px' }} />
              <Text style={{ color: logLevelColors[log.level], fontSize: '11px', minWidth: '40px', textTransform: 'uppercase', fontWeight: 'bold' }}>
                {log.level}
              </Text>
              <Text style={{ color: '#595959', fontSize: '11px', minWidth: '60px' }}>
                [{log.source}]
              </Text>
              <Text style={{ color: '#999', fontSize: '10px', minWidth: '80px' }}>
                {log.agentName}
              </Text>
              <Text style={{ color: '#f0f0f0', fontSize: '12px', flex: 1, wordBreak: 'break-word' }}>
                {highlightText(log.message, highlightTerms)}
              </Text>
              {log.category && (
                <Tag  color="blue" style={{ fontSize: '10px' }}>
                  {log.category}
                </Tag>
              )}
            </div>
          ))
        )}
      </div>

      {/* Log Statistics */}
      <Row gutter={16} style={{ marginTop: '12px' }}>
        <Col span={6}>
          <Text type="secondary" style={{ fontSize: '11px' }}>
            Total: {filteredLogs.length}
          </Text>
        </Col>
        <Col span={6}>
          <Text type="secondary" style={{ fontSize: '11px' }}>
            Errors: {getLogLevelCount('error')}
          </Text>
        </Col>
        <Col span={6}>
          <Text type="secondary" style={{ fontSize: '11px' }}>
            Warnings: {getLogLevelCount('warn')}
          </Text>
        </Col>
        <Col span={6}>
          <Text type="secondary" style={{ fontSize: '11px' }}>
            Rate: {logAnalytics?.logRate.toFixed(1)}/min
          </Text>
        </Col>
      </Row>

      {/* Analytics Modal */}
      <Modal
        title="Log Analytics"
        open={showAnalytics}
        onCancel={() => setShowAnalytics(false)}
        width={800}
        footer={null}
      >
        {logAnalytics && (
          <Row gutter={16}>
            <Col span={12}>
              <Card  title="Overview">
                <Row gutter={16}>
                  <Col span={12}>
                    <Statistic title="Total Logs" value={logAnalytics.totalLogs} />
                  </Col>
                  <Col span={12}>
                    <Statistic title="Error Rate" value={logAnalytics.errorRate} precision={1} suffix="%" />
                  </Col>
                </Row>
                <Divider />
                <Row gutter={16}>
                  <Col span={12}>
                    <Statistic title="Errors" value={logAnalytics.errorCount} valueStyle={{ color: '#cf1322' }} />
                  </Col>
                  <Col span={12}>
                    <Statistic title="Warnings" value={logAnalytics.warningCount} valueStyle={{ color: '#faad14' }} />
                  </Col>
                </Row>
              </Card>
            </Col>
            <Col span={12}>
              <Card  title="Top Sources">
                {logAnalytics.topSources.map(({ source, count }) => (
                  <div key={source} style={{ marginBottom: '8px' }}>
                    <Row align="middle">
                      <Col flex="auto">
                        <Text>{source}</Text>
                      </Col>
                      <Col>
                        <Text strong>{count}</Text>
                      </Col>
                    </Row>
                    <Progress 
                      percent={(count / logAnalytics.totalLogs) * 100} 
                       
                      showInfo={false}
                    />
                  </div>
                ))}
              </Card>
            </Col>
          </Row>
        )}
      </Modal>

      {/* Fullscreen Modal */}
      <Modal
        title="Log Viewer - Fullscreen"
        open={showFullscreen}
        onCancel={() => setShowFullscreen(false)}
        width="90vw"
        style={{ top: 20 }}
        footer={null}
      >
        <EnhancedAgentLogViewer agentId={agentId} />
      </Modal>
    </div>
  );
};
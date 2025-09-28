/**
 * Agent Log Viewer Component
 * Displays real-time and historical logs for agents with filtering and search capabilities
 */

import React, { useState, useEffect, useRef } from 'react';
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
  Empty
} from 'antd';
import {
  SearchOutlined,
  ClearOutlined,
  DownloadOutlined,
  ReloadOutlined,
  PauseCircleOutlined,
  PlayCircleOutlined
} from '@ant-design/icons';
import { useAppSelector } from '../../hooks/redux';

const { Text } = Typography;
const { Option } = Select;

interface AgentLogViewerProps {
  agentId: string;
}

interface LogEntry {
  id: string;
  timestamp: Date;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  source?: string;
  details?: any;
}

const logLevelColors = {
  info: '#1890ff',
  warn: '#faad14',
  error: '#ff4d4f',
  debug: '#52c41a'
};

const logLevelBadges = {
  info: 'processing',
  warn: 'warning',
  error: 'error',
  debug: 'success'
} as const;

export const AgentLogViewer: React.FC<AgentLogViewerProps> = ({ agentId }) => {
  const { agentLogs } = useAppSelector(state => state.agent);
  const [filteredLogs, setFilteredLogs] = useState<LogEntry[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const [autoScroll, setAutoScroll] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const logContainerRef = useRef<HTMLDivElement>(null);

  // Convert agent logs to LogEntry format
  const agentLogEntries = agentLogs[agentId] || [];
  const logs: LogEntry[] = agentLogEntries.map((log, index) => ({
    id: `${agentId}-${index}`,
    timestamp: log.timestamp,
    level: log.level,
    message: log.message,
    source: 'agent'
  }));

  // Add some mock logs for demonstration
  useEffect(() => {
    const mockLogs: LogEntry[] = [
      {
        id: 'mock-1',
        timestamp: new Date(Date.now() - 5000),
        level: 'info',
        message: 'Agent initialized successfully',
        source: 'system'
      },
      {
        id: 'mock-2',
        timestamp: new Date(Date.now() - 4000),
        level: 'info',
        message: 'Connected to task manager',
        source: 'network'
      },
      {
        id: 'mock-3',
        timestamp: new Date(Date.now() - 3000),
        level: 'debug',
        message: 'Processing task queue: 3 tasks pending',
        source: 'task-manager'
      },
      {
        id: 'mock-4',
        timestamp: new Date(Date.now() - 2000),
        level: 'info',
        message: 'Started working on task: Implement user authentication',
        source: 'task-executor'
      },
      {
        id: 'mock-5',
        timestamp: new Date(Date.now() - 1000),
        level: 'warn',
        message: 'High memory usage detected: 78%',
        source: 'monitor'
      },
      {
        id: 'mock-6',
        timestamp: new Date(),
        level: 'info',
        message: 'Task completed successfully in 15.3 seconds',
        source: 'task-executor'
      }
    ];

    const allLogs = [...logs, ...mockLogs].sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    filterLogs(allLogs);
  }, [logs, searchTerm, levelFilter]);

  const filterLogs = (allLogs: LogEntry[]) => {
    let filtered = allLogs;

    // Filter by level
    if (levelFilter !== 'all') {
      filtered = filtered.filter(log => log.level === levelFilter);
    }

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(log => 
        log.message.toLowerCase().includes(term) ||
        log.source?.toLowerCase().includes(term)
      );
    }

    setFilteredLogs(filtered);
  };

  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    if (autoScroll && !isPaused && logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [filteredLogs, autoScroll, isPaused]);

  const handleClearLogs = () => {
    setFilteredLogs([]);
  };

  const handleExportLogs = () => {
    const logText = filteredLogs.map(log => 
      `[${log.timestamp.toISOString()}] ${log.level.toUpperCase()}: ${log.message}`
    ).join('\n');

    const blob = new Blob([logText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `agent-${agentId}-logs-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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

  return (
    <div>
      {/* Controls */}
      <Row gutter={8} style={{ marginBottom: '12px' }} align="middle">
        <Col flex="auto">
          <Input
            placeholder="Search logs..."
            prefix={<SearchOutlined />}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            
            allowClear
          />
        </Col>
        <Col>
          <Select
            value={levelFilter}
            onChange={setLevelFilter}
            
            style={{ width: 100 }}
          >
            <Option value="all">All ({filteredLogs.length})</Option>
            <Option value="info">
              <Badge status={logLevelBadges.info} />
              Info ({getLogLevelCount('info')})
            </Option>
            <Option value="warn">
              <Badge status={logLevelBadges.warn} />
              Warn ({getLogLevelCount('warn')})
            </Option>
            <Option value="error">
              <Badge status={logLevelBadges.error} />
              Error ({getLogLevelCount('error')})
            </Option>
            <Option value="debug">
              <Badge status={logLevelBadges.debug} />
              Debug ({getLogLevelCount('debug')})
            </Option>
          </Select>
        </Col>
      </Row>

      <Row gutter={8} style={{ marginBottom: '12px' }} align="middle">
        <Col>
          <Space >
            <Tooltip title={isPaused ? 'Resume auto-scroll' : 'Pause auto-scroll'}>
              <Button
                
                icon={isPaused ? <PlayCircleOutlined /> : <PauseCircleOutlined />}
                onClick={() => setIsPaused(!isPaused)}
              />
            </Tooltip>
            <Tooltip title="Auto-scroll to bottom">
              <Switch
                
                checked={autoScroll}
                onChange={setAutoScroll}
                checkedChildren="Auto"
                unCheckedChildren="Manual"
              />
            </Tooltip>
          </Space>
        </Col>
        <Col flex="auto" />
        <Col>
          <Space >
            <Tooltip title="Clear logs">
              <Button
                
                icon={<ClearOutlined />}
                onClick={handleClearLogs}
              />
            </Tooltip>
            <Tooltip title="Export logs">
              <Button
                
                icon={<DownloadOutlined />}
                onClick={handleExportLogs}
              />
            </Tooltip>
          </Space>
        </Col>
      </Row>

      {/* Log Display */}
      <div
        ref={logContainerRef}
        style={{
          height: '300px',
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
              description="No logs available"
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
              <Text
                style={{
                  color: '#8c8c8c',
                  fontSize: '11px',
                  minWidth: '60px',
                  fontFamily: 'inherit'
                }}
              >
                {formatTimestamp(log.timestamp)}
              </Text>
              <Badge
                status={logLevelBadges[log.level]}
                style={{ minWidth: '12px' }}
              />
              <Text
                style={{
                  color: logLevelColors[log.level],
                  fontSize: '11px',
                  minWidth: '40px',
                  textTransform: 'uppercase',
                  fontWeight: 'bold',
                  fontFamily: 'inherit'
                }}
              >
                {log.level}
              </Text>
              {log.source && (
                <Text
                  style={{
                    color: '#595959',
                    fontSize: '11px',
                    minWidth: '80px',
                    fontFamily: 'inherit'
                  }}
                >
                  [{log.source}]
                </Text>
              )}
              <Text
                style={{
                  color: '#f0f0f0',
                  fontSize: '12px',
                  flex: 1,
                  fontFamily: 'inherit',
                  wordBreak: 'break-word'
                }}
              >
                {log.message}
              </Text>
            </div>
          ))
        )}
      </div>

      {/* Log Statistics */}
      <Row gutter={16} style={{ marginTop: '12px' }}>
        <Col span={6}>
          <div style={{ textAlign: 'center' }}>
            <Text type="secondary" style={{ fontSize: '11px' }}>
              Total: {filteredLogs.length}
            </Text>
          </div>
        </Col>
        <Col span={6}>
          <div style={{ textAlign: 'center' }}>
            <Text type="secondary" style={{ fontSize: '11px' }}>
              Errors: {getLogLevelCount('error')}
            </Text>
          </div>
        </Col>
        <Col span={6}>
          <div style={{ textAlign: 'center' }}>
            <Text type="secondary" style={{ fontSize: '11px' }}>
              Warnings: {getLogLevelCount('warn')}
            </Text>
          </div>
        </Col>
        <Col span={6}>
          <div style={{ textAlign: 'center' }}>
            <Text type="secondary" style={{ fontSize: '11px' }}>
              Auto-scroll: {autoScroll ? 'On' : 'Off'}
            </Text>
          </div>
        </Col>
      </Row>
    </div>
  );
};
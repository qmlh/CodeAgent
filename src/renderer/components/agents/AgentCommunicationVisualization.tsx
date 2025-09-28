/**
 * Agent Communication Visualization Component
 * Displays message flow diagrams, communication statistics, and network topology
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
  Table,
  Tag,
  Tooltip,
  Statistic,
  Progress,
  Timeline,
  Badge,
  Switch,
  Modal,
  List,
  Avatar
} from 'antd';
import {
  MessageOutlined,
  SendOutlined,
  NodeIndexOutlined,
  BarChartOutlined,
  ReloadOutlined,
  FullscreenOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import { useAppSelector } from '../../hooks/redux';
import { Agent, AgentMessage } from '../../store/slices/agentSlice';
import './AgentCommunicationVisualization.css';

const { Title, Text } = Typography;
const { Option } = Select;

interface CommunicationStats {
  totalMessages: number;
  messagesPerAgent: Record<string, number>;
  messageTypes: Record<string, number>;
  averageResponseTime: number;
  activeConnections: number;
}

interface NetworkNode {
  id: string;
  name: string;
  type: string;
  status: string;
  messageCount: number;
  x: number;
  y: number;
}

interface NetworkEdge {
  from: string;
  to: string;
  messageCount: number;
  lastMessage: Date;
  messageType: string;
}

export const AgentCommunicationVisualization: React.FC = () => {
  const { agents, messages } = useAppSelector(state => state.agent);
  const [viewMode, setViewMode] = useState<'topology' | 'timeline' | 'stats'>('topology');
  const [timeRange, setTimeRange] = useState<'1h' | '6h' | '24h'>('1h');
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [showMessageDetails, setShowMessageDetails] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<AgentMessage | null>(null);
  const [communicationStats, setCommunicationStats] = useState<CommunicationStats | null>(null);
  const [networkNodes, setNetworkNodes] = useState<NetworkNode[]>([]);
  const [networkEdges, setNetworkEdges] = useState<NetworkEdge[]>([]);
  const [mockMessages, setMockMessages] = useState<AgentMessage[]>([]);

  useEffect(() => {
    generateMockCommunicationData();
    calculateCommunicationStats();
    generateNetworkTopology();
    
    if (autoRefresh) {
      const interval = setInterval(() => {
        generateMockCommunicationData();
        calculateCommunicationStats();
        generateNetworkTopology();
      }, 10000);
      
      return () => clearInterval(interval);
    }
  }, [agents, timeRange, autoRefresh]);

  const generateMockCommunicationData = () => {
    const messageTypes = ['info', 'request', 'response', 'alert'] as const;
    const mockData: AgentMessage[] = [];

    // Generate messages between agents
    for (let i = 0; i < 50; i++) {
      const fromAgent = agents[Math.floor(Math.random() * agents.length)];
      const toAgent = agents[Math.floor(Math.random() * agents.length)];
      
      if (fromAgent && toAgent && fromAgent.id !== toAgent.id) {
        const messageType = messageTypes[Math.floor(Math.random() * messageTypes.length)];
        const timestamp = new Date(Date.now() - Math.random() * 3600000); // Last hour
        
        const messageContent = {
          info: [
            'Task status update',
            'Performance metrics report',
            'Configuration change notification'
          ],
          request: [
            'File access request',
            'Task assignment request',
            'Resource allocation request'
          ],
          response: [
            'Task completion confirmation',
            'Resource availability response',
            'Status query response'
          ],
          alert: [
            'High CPU usage warning',
            'Task failure notification',
            'Connection timeout alert'
          ]
        };

        const content = messageContent[messageType][Math.floor(Math.random() * messageContent[messageType].length)];

        mockData.push({
          id: `msg-${i}`,
          from: fromAgent.id,
          to: toAgent.id,
          type: messageType,
          content: { message: content, priority: Math.random() > 0.7 ? 'high' : 'normal' },
          timestamp,
          requiresResponse: messageType === 'request'
        });
      }
    }

    setMockMessages(mockData);
  };

  const calculateCommunicationStats = () => {
    const allMessages = [...messages, ...mockMessages];
    const now = new Date();
    const timeRangeMs = {
      '1h': 60 * 60 * 1000,
      '6h': 6 * 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000
    }[timeRange];

    const recentMessages = allMessages.filter(msg => 
      now.getTime() - msg.timestamp.getTime() <= timeRangeMs
    );

    const stats: CommunicationStats = {
      totalMessages: recentMessages.length,
      messagesPerAgent: {},
      messageTypes: {},
      averageResponseTime: 0,
      activeConnections: 0
    };

    // Calculate messages per agent
    recentMessages.forEach(msg => {
      stats.messagesPerAgent[msg.from] = (stats.messagesPerAgent[msg.from] || 0) + 1;
      stats.messageTypes[msg.type] = (stats.messageTypes[msg.type] || 0) + 1;
    });

    // Calculate active connections (unique agent pairs)
    const connections = new Set();
    recentMessages.forEach(msg => {
      connections.add(`${msg.from}-${msg.to}`);
      connections.add(`${msg.to}-${msg.from}`);
    });
    stats.activeConnections = connections.size / 2;

    // Mock average response time
    stats.averageResponseTime = Math.random() * 2000 + 500; // 500-2500ms

    setCommunicationStats(stats);
  };

  const generateNetworkTopology = () => {
    const nodes: NetworkNode[] = agents.map((agent, index) => {
      const angle = (index / agents.length) * 2 * Math.PI;
      const radius = 150;
      const centerX = 200;
      const centerY = 200;

      return {
        id: agent.id,
        name: agent.name,
        type: agent.type,
        status: agent.status,
        messageCount: mockMessages.filter(m => m.from === agent.id || m.to === agent.id).length,
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle)
      };
    });

    const edges: NetworkEdge[] = [];
    const edgeMap = new Map<string, NetworkEdge>();

    mockMessages.forEach(msg => {
      const key = `${msg.from}-${msg.to}`;
      const reverseKey = `${msg.to}-${msg.from}`;
      
      if (edgeMap.has(key)) {
        const edge = edgeMap.get(key)!;
        edge.messageCount++;
        if (msg.timestamp > edge.lastMessage) {
          edge.lastMessage = msg.timestamp;
          edge.messageType = msg.type;
        }
      } else if (edgeMap.has(reverseKey)) {
        const edge = edgeMap.get(reverseKey)!;
        edge.messageCount++;
        if (msg.timestamp > edge.lastMessage) {
          edge.lastMessage = msg.timestamp;
          edge.messageType = msg.type;
        }
      } else {
        edgeMap.set(key, {
          from: msg.from,
          to: Array.isArray(msg.to) ? msg.to[0] : msg.to,
          messageCount: 1,
          lastMessage: msg.timestamp,
          messageType: msg.type
        });
      }
    });

    setNetworkNodes(nodes);
    setNetworkEdges(Array.from(edgeMap.values()));
  };

  const getAgentColor = (status: string) => {
    const colors = {
      idle: '#52c41a',
      working: '#1890ff',
      waiting: '#faad14',
      error: '#ff4d4f',
      offline: '#8c8c8c'
    };
    return colors[status as keyof typeof colors] || '#8c8c8c';
  };

  const getMessageTypeColor = (type: string) => {
    const colors = {
      info: '#1890ff',
      request: '#52c41a',
      response: '#faad14',
      alert: '#ff4d4f'
    };
    return colors[type as keyof typeof colors] || '#8c8c8c';
  };

  const renderNetworkTopology = () => (
    <div className="network-topology" style={{ position: 'relative', height: '400px', width: '100%' }}>
      <svg width="100%" height="100%" style={{ position: 'absolute', top: 0, left: 0 }}>
        {/* Render edges */}
        {networkEdges.map((edge, index) => {
          const fromNode = networkNodes.find(n => n.id === edge.from);
          const toNode = networkNodes.find(n => n.id === edge.to);
          
          if (!fromNode || !toNode) return null;

          const strokeWidth = Math.max(1, Math.min(5, edge.messageCount / 2));
          const opacity = Math.max(0.3, Math.min(1, edge.messageCount / 10));

          return (
            <line
              key={`edge-${index}`}
              x1={fromNode.x}
              y1={fromNode.y}
              x2={toNode.x}
              y2={toNode.y}
              stroke={getMessageTypeColor(edge.messageType)}
              strokeWidth={strokeWidth}
              opacity={opacity}
              className="network-edge"
            />
          );
        })}

        {/* Render nodes */}
        {networkNodes.map(node => (
          <g key={node.id}>
            <circle
              cx={node.x}
              cy={node.y}
              r={Math.max(15, Math.min(30, node.messageCount + 10))}
              fill={getAgentColor(node.status)}
              stroke="#fff"
              strokeWidth="2"
              className={`network-node ${node.status}`}
              onClick={() => setSelectedAgent(node.id)}
              style={{ cursor: 'pointer' }}
            />
            <text
              x={node.x}
              y={node.y + 35}
              textAnchor="middle"
              fontSize="12"
              fill="#333"
            >
              {node.name}
            </text>
            <text
              x={node.x}
              y={node.y + 5}
              textAnchor="middle"
              fontSize="10"
              fill="#fff"
              fontWeight="bold"
            >
              {node.messageCount}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );

  const renderMessageTimeline = () => {
    const recentMessages = [...messages, ...mockMessages]
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 20);

    return (
      <Timeline mode="left">
        {recentMessages.map(msg => {
          const fromAgent = agents.find(a => a.id === msg.from);
          const toAgent = agents.find(a => a.id === msg.to);
          
          return (
            <Timeline.Item
              key={msg.id}
              color={getMessageTypeColor(msg.type)}
              label={msg.timestamp.toLocaleTimeString()}
            >
              <div>
                <Space>
                  <Avatar  style={{ backgroundColor: getAgentColor(fromAgent?.status || 'offline') }}>
                    {fromAgent?.name.charAt(0) || '?'}
                  </Avatar>
                  <SendOutlined />
                  <Avatar  style={{ backgroundColor: getAgentColor(toAgent?.status || 'offline') }}>
                    {toAgent?.name.charAt(0) || '?'}
                  </Avatar>
                </Space>
                <div style={{ marginTop: '4px' }}>
                  <Tag color={getMessageTypeColor(msg.type)} >
                    {msg.type.toUpperCase()}
                  </Tag>
                  <Text style={{ fontSize: '12px', marginLeft: '8px' }}>
                    {typeof msg.content === 'object' ? msg.content.message : msg.content}
                  </Text>
                </div>
              </div>
            </Timeline.Item>
          );
        })}
      </Timeline>
    );
  };

  const renderCommunicationStats = () => (
    <Row gutter={16}>
      <Col span={12}>
        <Card  title="Message Statistics">
          <Row gutter={16}>
            <Col span={12}>
              <Statistic
                title="Total Messages"
                value={communicationStats?.totalMessages || 0}
                prefix={<MessageOutlined />}
              />
            </Col>
            <Col span={12}>
              <Statistic
                title="Active Connections"
                value={communicationStats?.activeConnections || 0}
                prefix={<NodeIndexOutlined />}
              />
            </Col>
          </Row>
          <div style={{ marginTop: '16px' }}>
            <Text strong>Message Types:</Text>
            {communicationStats && Object.entries(communicationStats.messageTypes).map(([type, count]) => (
              <div key={type} style={{ marginTop: '8px' }}>
                <Row align="middle">
                  <Col flex="auto">
                    <Tag color={getMessageTypeColor(type)} >
                      {type.toUpperCase()}
                    </Tag>
                  </Col>
                  <Col>
                    <Text strong>{count}</Text>
                  </Col>
                </Row>
                <Progress
                  percent={(count / (communicationStats.totalMessages || 1)) * 100}
                  
                  showInfo={false}
                  strokeColor={getMessageTypeColor(type)}
                />
              </div>
            ))}
          </div>
        </Card>
      </Col>
      <Col span={12}>
        <Card  title="Agent Activity">
          <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
            {communicationStats && Object.entries(communicationStats.messagesPerAgent)
              .sort(([,a], [,b]) => b - a)
              .map(([agentId, count]) => {
                const agent = agents.find(a => a.id === agentId);
                return (
                  <div key={agentId} style={{ marginBottom: '12px' }}>
                    <Row align="middle">
                      <Col flex="auto">
                        <Space>
                          <Avatar 
                             
                            style={{ backgroundColor: getAgentColor(agent?.status || 'offline') }}
                          >
                            {agent?.name.charAt(0) || '?'}
                          </Avatar>
                          <Text>{agent?.name || 'Unknown'}</Text>
                        </Space>
                      </Col>
                      <Col>
                        <Text strong>{count}</Text>
                      </Col>
                    </Row>
                    <Progress
                      percent={(count / (communicationStats.totalMessages || 1)) * 100}
                      
                      showInfo={false}
                    />
                  </div>
                );
              })}
          </div>
        </Card>
      </Col>
    </Row>
  );

  const messageColumns = [
    {
      title: 'Time',
      dataIndex: 'timestamp',
      key: 'timestamp',
      render: (timestamp: Date) => timestamp.toLocaleTimeString(),
      width: 100
    },
    {
      title: 'From',
      dataIndex: 'from',
      key: 'from',
      render: (agentId: string) => {
        const agent = agents.find(a => a.id === agentId);
        return agent?.name || 'Unknown';
      },
      width: 120
    },
    {
      title: 'To',
      dataIndex: 'to',
      key: 'to',
      render: (agentId: string) => {
        const agent = agents.find(a => a.id === agentId);
        return agent?.name || 'Unknown';
      },
      width: 120
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => (
        <Tag color={getMessageTypeColor(type)} >
          {type.toUpperCase()}
        </Tag>
      ),
      width: 80
    },
    {
      title: 'Content',
      dataIndex: 'content',
      key: 'content',
      render: (content: any) => (
        <Text ellipsis style={{ maxWidth: '200px' }}>
          {typeof content === 'object' ? content.message : content}
        </Text>
      )
    },
    {
      title: 'Status',
      key: 'status',
      render: (_: any, message: AgentMessage) => (
        message.requiresResponse ? (
          <Badge status="processing" text="Pending" />
        ) : (
          <Badge status="success" text="Delivered" />
        )
      ),
      width: 100
    }
  ];

  return (
    <div>
      {/* Header Controls */}
      <Row gutter={16} style={{ marginBottom: '16px' }} align="middle">
        <Col flex="auto">
          <Space>
            <Title level={5} style={{ margin: 0 }}>
              Agent Communication
            </Title>
            {communicationStats && (
              <Badge 
                count={communicationStats.totalMessages} 
                style={{ backgroundColor: '#52c41a' }}
                title="Total messages"
              />
            )}
          </Space>
        </Col>
        <Col>
          <Space>
            <Select
              value={viewMode}
              onChange={setViewMode}
              style={{ width: 120 }}
              
            >
              <Option value="topology">Topology</Option>
              <Option value="timeline">Timeline</Option>
              <Option value="stats">Statistics</Option>
            </Select>
            <Select
              value={timeRange}
              onChange={setTimeRange}
              style={{ width: 100 }}
              
            >
              <Option value="1h">1 Hour</Option>
              <Option value="6h">6 Hours</Option>
              <Option value="24h">24 Hours</Option>
            </Select>
            <Switch
              
              checked={autoRefresh}
              onChange={setAutoRefresh}
              checkedChildren="Auto"
              unCheckedChildren="Manual"
            />
            <Button
              
              icon={<ReloadOutlined />}
              onClick={() => {
                generateMockCommunicationData();
                calculateCommunicationStats();
                generateNetworkTopology();
              }}
            />
          </Space>
        </Col>
      </Row>

      {/* Main Content */}
      {viewMode === 'topology' && (
        <Card title="Network Topology" >
          {renderNetworkTopology()}
          <div style={{ marginTop: '16px', textAlign: 'center' }}>
            <Space>
              <Text type="secondary" style={{ fontSize: '12px' }}>
                Node size = message count | Line thickness = communication frequency
              </Text>
            </Space>
          </div>
        </Card>
      )}

      {viewMode === 'timeline' && (
        <Card title="Message Timeline" >
          <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
            {renderMessageTimeline()}
          </div>
        </Card>
      )}

      {viewMode === 'stats' && (
        <div>
          {renderCommunicationStats()}
          <Card title="Recent Messages"  style={{ marginTop: '16px' }}>
            <Table
              columns={messageColumns}
              dataSource={[...messages, ...mockMessages].slice(0, 50)}
              rowKey="id"
              
              pagination={{ pageSize: 10 }}
              onRow={(record) => ({
                onClick: () => {
                  setSelectedMessage(record);
                  setShowMessageDetails(true);
                }
              })}
            />
          </Card>
        </div>
      )}

      {/* Message Details Modal */}
      <Modal
        title="Message Details"
        open={showMessageDetails}
        onCancel={() => setShowMessageDetails(false)}
        footer={null}
        width={600}
      >
        {selectedMessage && (
          <div>
            <Row gutter={16}>
              <Col span={12}>
                <Text strong>From:</Text>
                <div>{agents.find(a => a.id === selectedMessage.from)?.name || 'Unknown'}</div>
              </Col>
              <Col span={12}>
                <Text strong>To:</Text>
                <div>{agents.find(a => a.id === selectedMessage.to)?.name || 'Unknown'}</div>
              </Col>
            </Row>
            <Row gutter={16} style={{ marginTop: '16px' }}>
              <Col span={12}>
                <Text strong>Type:</Text>
                <div>
                  <Tag color={getMessageTypeColor(selectedMessage.type)}>
                    {selectedMessage.type.toUpperCase()}
                  </Tag>
                </div>
              </Col>
              <Col span={12}>
                <Text strong>Timestamp:</Text>
                <div>{selectedMessage.timestamp.toLocaleString()}</div>
              </Col>
            </Row>
            <div style={{ marginTop: '16px' }}>
              <Text strong>Content:</Text>
              <div style={{ marginTop: '8px', padding: '12px', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
                <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
                  {JSON.stringify(selectedMessage.content, null, 2)}
                </pre>
              </div>
            </div>
            {selectedMessage.requiresResponse && (
              <div style={{ marginTop: '16px' }}>
                <Badge status="processing" text="Response Required" />
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};
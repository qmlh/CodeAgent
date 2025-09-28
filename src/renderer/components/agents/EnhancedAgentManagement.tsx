/**
 * Enhanced Agent Management Component
 * Main container for all agent management features with optimized interface and monitoring
 */

import React, { useState, useEffect } from 'react';
import {
  Layout,
  Tabs,
  Card,
  Row,
  Col,
  Button,
  Space,
  Typography,
  Badge,
  Statistic,
  Alert,
  Dropdown,
  Menu,
  message,
  Modal
} from 'antd';
import {
  RobotOutlined,
  BarChartOutlined,
  MessageOutlined,
  SettingOutlined,
  PlusOutlined,
  BulbOutlined,
  AlertOutlined,
  ToolOutlined,
  ExportOutlined,
  ImportOutlined
} from '@ant-design/icons';
import { useAppSelector, useAppDispatch } from '../../hooks/redux';
import { loadAgents } from '../../store/slices/agentSlice';

// Import existing components
import { AgentListView } from './AgentListView';
import { AgentDetailsPanel } from './AgentDetailsPanel';
import { AgentCreationWizard } from './AgentCreationWizard';

// Import new enhanced components
import { AgentStatusVisualization } from './AgentStatusVisualization';
import { AgentControlPanel } from './AgentControlPanel';
import { AgentPerformanceMonitor } from './AgentPerformanceMonitor';
import { EnhancedAgentLogViewer } from './EnhancedAgentLogViewer';
import { AgentCommunicationVisualization } from './AgentCommunicationVisualization';
import { AgentDiagnosticTools } from './AgentDiagnosticTools';
import { AgentTemplateManager } from './AgentTemplateManager';
import { AgentGroupManager } from './AgentGroupManager';

const { Content, Sider } = Layout;
const { Title, Text } = Typography;
const { TabPane } = Tabs;

export const EnhancedAgentManagement: React.FC = () => {
  const dispatch = useAppDispatch();
  const { agents, selectedAgent, status } = useAppSelector(state => state.agent);
  const [activeTab, setActiveTab] = useState('overview');
  const [showCreateWizard, setShowCreateWizard] = useState(false);
  const [showTemplateManager, setShowTemplateManager] = useState(false);
  const [showGroupManager, setShowGroupManager] = useState(false);
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [siderCollapsed, setSiderCollapsed] = useState(false);

  useEffect(() => {
    dispatch(loadAgents());
  }, [dispatch]);

  const getAgentStats = () => {
    const total = agents.length;
    const active = agents.filter(a => a.status !== 'offline').length;
    const working = agents.filter(a => a.status === 'working').length;
    const errors = agents.filter(a => a.status === 'error').length;
    const avgPerformance = agents.length > 0 
      ? agents.reduce((sum, a) => sum + a.performance.successRate, 0) / agents.length 
      : 0;

    return { total, active, working, errors, avgPerformance };
  };

  const handleViewAgentDetails = (agentId: string) => {
    setSelectedAgentId(agentId);
    setActiveTab('details');
  };

  const handleBulkAction = (action: string) => {
    message.info(`Bulk ${action} functionality coming soon`);
  };

  const handleExportConfig = () => {
    const config = {
      agents: agents.map(agent => ({
        name: agent.name,
        type: agent.type,
        capabilities: agent.capabilities,
        config: agent.config
      })),
      exportDate: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `agent-config-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    message.success('Agent configuration exported successfully');
  };

  const stats = getAgentStats();

  const bulkActionsMenu = (
    <Menu>
      <Menu.Item key="start-all" onClick={() => handleBulkAction('start')}>
        Start All Agents
      </Menu.Item>
      <Menu.Item key="stop-all" onClick={() => handleBulkAction('stop')}>
        Stop All Agents
      </Menu.Item>
      <Menu.Item key="restart-all" onClick={() => handleBulkAction('restart')}>
        Restart All Agents
      </Menu.Item>
      <Menu.Divider />
      <Menu.Item key="health-check" onClick={() => handleBulkAction('health check')}>
        Run Health Check
      </Menu.Item>
      <Menu.Item key="performance-analysis" onClick={() => handleBulkAction('performance analysis')}>
        Performance Analysis
      </Menu.Item>
    </Menu>
  );

  const toolsMenu = (
    <Menu>
      <Menu.Item key="templates" onClick={() => setShowTemplateManager(true)}>
        <SettingOutlined /> Template Manager
      </Menu.Item>
      <Menu.Item key="groups" onClick={() => setShowGroupManager(true)}>
        <BulbOutlined /> Group Manager
      </Menu.Item>
      <Menu.Divider />
      <Menu.Item key="export" onClick={handleExportConfig}>
        <ExportOutlined /> Export Configuration
      </Menu.Item>
      <Menu.Item key="import">
        <ImportOutlined /> Import Configuration
      </Menu.Item>
    </Menu>
  );

  return (
    <Layout style={{ height: '100%' }}>
      {/* Header with Stats and Controls */}
      <div style={{ padding: '16px', backgroundColor: '#fff', borderBottom: '1px solid #f0f0f0' }}>
        <Row align="middle" justify="space-between">
          <Col>
            <Space size="large">
              <div>
                <Title level={4} style={{ margin: 0 }}>
                  <RobotOutlined /> Agent Management
                </Title>
                <Text type="secondary">Manage and monitor AI agents</Text>
              </div>
            </Space>
          </Col>
          <Col>
            <Space>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => setShowCreateWizard(true)}
              >
                Create Agent
              </Button>
              <Dropdown overlay={bulkActionsMenu} trigger={['click']}>
                <Button icon={<BulbOutlined />}>
                  Bulk Actions
                </Button>
              </Dropdown>
              <Dropdown overlay={toolsMenu} trigger={['click']}>
                <Button icon={<ToolOutlined />}>
                  Tools
                </Button>
              </Dropdown>
            </Space>
          </Col>
        </Row>

        {/* Quick Stats */}
        <Row gutter={16} style={{ marginTop: '16px' }}>
          <Col span={6}>
            <Card >
              <Statistic
                title="Total Agents"
                value={stats.total}
                prefix={<RobotOutlined />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card >
              <Statistic
                title="Active"
                value={stats.active}
                valueStyle={{ color: '#3f8600' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card >
              <Statistic
                title="Working"
                value={stats.working}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card >
              <Statistic
                title="Avg Performance"
                value={stats.avgPerformance * 100}
                precision={1}
                suffix="%"
                valueStyle={{ 
                  color: stats.avgPerformance > 0.8 ? '#3f8600' : 
                         stats.avgPerformance > 0.6 ? '#faad14' : '#cf1322' 
                }}
              />
            </Card>
          </Col>
        </Row>

        {/* Alerts */}
        {stats.errors > 0 && (
          <Alert
            message={`${stats.errors} agent(s) have errors`}
            type="error"
            showIcon
            style={{ marginTop: '16px' }}
            action={
              <Button  onClick={() => setActiveTab('diagnostics')}>
                Diagnose
              </Button>
            }
          />
        )}
      </div>

      <Layout>
        {/* Main Content */}
        <Content style={{ padding: '16px' }}>
          <Tabs 
            activeKey={activeTab} 
            onChange={setActiveTab}
            type="card"
            
          >
            <TabPane 
              tab={
                <span>
                  <RobotOutlined />
                  Overview
                </span>
              } 
              key="overview"
            >
              <Row gutter={16}>
                <Col span={16}>
                  <AgentListView
                    onCreateAgent={() => setShowCreateWizard(true)}
                    onViewDetails={handleViewAgentDetails}
                  />
                </Col>
                <Col span={8}>
                  <AgentStatusVisualization />
                </Col>
              </Row>
            </TabPane>

            <TabPane 
              tab={
                <span>
                  <SettingOutlined />
                  Control Panel
                </span>
              } 
              key="control"
            >
              <AgentControlPanel />
            </TabPane>

            <TabPane 
              tab={
                <span>
                  <BarChartOutlined />
                  Performance
                </span>
              } 
              key="performance"
            >
              <AgentPerformanceMonitor />
            </TabPane>

            <TabPane 
              tab={
                <span>
                  <MessageOutlined />
                  Communication
                </span>
              } 
              key="communication"
            >
              <AgentCommunicationVisualization />
            </TabPane>

            <TabPane 
              tab={
                <span>
                  <AlertOutlined />
                  Diagnostics
                </span>
              } 
              key="diagnostics"
            >
              <AgentDiagnosticTools />
            </TabPane>

            {selectedAgentId && (
              <TabPane 
                tab={
                  <span>
                    <RobotOutlined />
                    Agent Details
                  </span>
                } 
                key="details"
                closable
              >
                <AgentDetailsPanel agentId={selectedAgentId} />
              </TabPane>
            )}
          </Tabs>
        </Content>

        {/* Side Panel for Logs */}
        <Sider 
          width={400} 
          theme="light" 
          collapsible
          collapsed={siderCollapsed}
          onCollapse={setSiderCollapsed}
          style={{ borderLeft: '1px solid #f0f0f0' }}
        >
          <div style={{ padding: '16px' }}>
            <Title level={5}>System Logs</Title>
            <EnhancedAgentLogViewer 
              agentId={selectedAgentId || 'system'} 
              compact={siderCollapsed}
            />
          </div>
        </Sider>
      </Layout>

      {/* Modals */}
      <AgentCreationWizard
        visible={showCreateWizard}
        onClose={() => setShowCreateWizard(false)}
      />

      <Modal
        title="Agent Template Manager"
        open={showTemplateManager}
        onCancel={() => setShowTemplateManager(false)}
        width={800}
        footer={null}
      >
        <AgentTemplateManager />
      </Modal>

      <Modal
        title="Agent Group Manager"
        open={showGroupManager}
        onCancel={() => setShowGroupManager(false)}
        width={600}
        footer={null}
      >
        <AgentGroupManager />
      </Modal>
    </Layout>
  );
};
/**
 * Agent Panel Component
 * Comprehensive agent management interface with creation wizard, details panel, and list view
 */

import React, { useState, useEffect } from 'react';
import { Tabs, Button, Space, message } from 'antd';
import { 
  RobotOutlined, 
  PlusOutlined,
  UnorderedListOutlined,
  EyeOutlined
} from '@ant-design/icons';
import { useAppSelector, useAppDispatch } from '../../hooks/redux';
import { setSelectedAgent, loadAgents } from '../../store/slices/agentSlice';
import { AgentCreationWizard } from '../agents/AgentCreationWizard';
import { AgentListView } from '../agents/AgentListView';
import { AgentDetailsPanel } from '../agents/AgentDetailsPanel';
import { serviceIntegrationManager } from '../../services/ServiceIntegrationManager';

const { TabPane } = Tabs;

export const AgentPanel: React.FC = () => {
  const dispatch = useAppDispatch();
  const { selectedAgent, agents, status } = useAppSelector(state => state.agent);
  const [showCreateWizard, setShowCreateWizard] = useState(false);
  const [activeTab, setActiveTab] = useState('list');

  // Load agents on component mount
  useEffect(() => {
    if (serviceIntegrationManager.isReady()) {
      dispatch(loadAgents());
    }
  }, [dispatch]);

  const handleCreateAgent = () => {
    if (!serviceIntegrationManager.isReady()) {
      message.warning('Service integration not ready. Please wait...');
      return;
    }
    setShowCreateWizard(true);
  };

  const handleViewDetails = (agentId: string) => {
    dispatch(setSelectedAgent(agentId));
    setActiveTab('details');
  };

  const handleCloseWizard = () => {
    setShowCreateWizard(false);
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ 
        padding: '12px 16px', 
        borderBottom: '1px solid #d9d9d9',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <Space>
          <RobotOutlined />
          <span style={{ fontWeight: 500 }}>Agent Management</span>
        </Space>
        <Button 
          type="primary" 
          
          icon={<PlusOutlined />}
          onClick={handleCreateAgent}
        >
          Create Agent
        </Button>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          
          style={{ height: '100%' }}
          tabBarStyle={{ 
            margin: 0, 
            paddingLeft: '16px',
            paddingRight: '16px'
          }}
        >
          <TabPane
            tab={
              <Space >
                <UnorderedListOutlined />
                Agent List
              </Space>
            }
            key="list"
            style={{ height: 'calc(100vh - 120px)', overflow: 'auto' }}
          >
            <AgentListView
              onCreateAgent={handleCreateAgent}
              onViewDetails={handleViewDetails}
            />
          </TabPane>

          <TabPane
            tab={
              <Space >
                <EyeOutlined />
                Agent Details
              </Space>
            }
            key="details"
            style={{ height: 'calc(100vh - 120px)', overflow: 'auto' }}
          >
            <AgentDetailsPanel agentId={selectedAgent} />
          </TabPane>
        </Tabs>
      </div>

      {/* Agent Creation Wizard */}
      <AgentCreationWizard
        visible={showCreateWizard}
        onClose={handleCloseWizard}
      />
    </div>
  );
};
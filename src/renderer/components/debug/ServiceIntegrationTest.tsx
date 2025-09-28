/**
 * Service Integration Test Component
 * Debug component to test service integration functionality
 */

import React, { useState } from 'react';
import { Card, Button, Space, message, Descriptions, Tag, Alert } from 'antd';
import { 
  PlayCircleOutlined, 
  PlusOutlined,
  ReloadOutlined,
  BugOutlined
} from '@ant-design/icons';
import { serviceIntegrationManager } from '../../services/ServiceIntegrationManager';
import { useAppSelector } from '../../hooks/redux';

export const ServiceIntegrationTest: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [testResults, setTestResults] = useState<string[]>([]);
  const { agents } = useAppSelector(state => state.agent);
  const { tasks } = useAppSelector(state => state.task);

  const addTestResult = (result: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${result}`]);
  };

  const clearResults = () => {
    setTestResults([]);
  };

  const testCreateAgent = async () => {
    setIsLoading(true);
    try {
      const agentId = await serviceIntegrationManager.createAgent({
        name: `Test Agent ${Date.now()}`,
        type: 'frontend',
        capabilities: ['react', 'typescript', 'testing'],
        specializations: ['ui-development', 'component-testing']
      });
      
      addTestResult(`✓ Agent created successfully: ${agentId}`);
      message.success('Agent created successfully');
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      addTestResult(`✗ Failed to create agent: ${errorMsg}`);
      message.error('Failed to create agent');
    } finally {
      setIsLoading(false);
    }
  };

  const testCreateTask = async () => {
    setIsLoading(true);
    try {
      const taskId = await serviceIntegrationManager.createTask({
        title: `Test Task ${Date.now()}`,
        description: 'This is a test task created for integration testing',
        type: 'development',
        priority: 'medium',
        requirements: ['Create a simple component', 'Add unit tests'],
        files: []
      });
      
      addTestResult(`✓ Task created successfully: ${taskId}`);
      message.success('Task created successfully');
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      addTestResult(`✗ Failed to create task: ${errorMsg}`);
      message.error('Failed to create task');
    } finally {
      setIsLoading(false);
    }
  };

  const testStartAgent = async () => {
    if (agents.length === 0) {
      message.warning('No agents available to start');
      return;
    }

    setIsLoading(true);
    try {
      const agentId = agents[0].id;
      await serviceIntegrationManager.startAgent(agentId);
      
      addTestResult(`✓ Agent started successfully: ${agentId}`);
      message.success('Agent started successfully');
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      addTestResult(`✗ Failed to start agent: ${errorMsg}`);
      message.error('Failed to start agent');
    } finally {
      setIsLoading(false);
    }
  };

  const testAssignTask = async () => {
    if (agents.length === 0 || tasks.length === 0) {
      message.warning('Need at least one agent and one task to test assignment');
      return;
    }

    setIsLoading(true);
    try {
      const agentId = agents[0].id;
      const taskId = tasks[0].id;
      
      await serviceIntegrationManager.assignTask(taskId, agentId);
      
      addTestResult(`✓ Task assigned successfully: ${taskId} -> ${agentId}`);
      message.success('Task assigned successfully');
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      addTestResult(`✗ Failed to assign task: ${errorMsg}`);
      message.error('Failed to assign task');
    } finally {
      setIsLoading(false);
    }
  };

  const testServiceStatus = () => {
    const isReady = serviceIntegrationManager.isReady();
    const coordinationManager = serviceIntegrationManager.getCoordinationManager();
    const taskManager = serviceIntegrationManager.getTaskManager();
    const fileManager = serviceIntegrationManager.getFileManager();
    const agentManager = serviceIntegrationManager.getAgentManager();

    addTestResult(`Service Integration Manager Ready: ${isReady ? '✓' : '✗'}`);
    addTestResult(`Coordination Manager: ${coordinationManager ? '✓' : '✗'}`);
    addTestResult(`Task Manager: ${taskManager ? '✓' : '✗'}`);
    addTestResult(`File Manager: ${fileManager ? '✓' : '✗'}`);
    addTestResult(`Agent Manager: ${agentManager ? '✓' : '✗'}`);
  };

  return (
    <div style={{ padding: '16px' }}>
      <Card
        title={
          <Space>
            <BugOutlined />
            Service Integration Test
          </Space>
        }
        extra={
          <Button
            icon={<ReloadOutlined />} 
            onClick={clearResults}
            size="small"
          >
            Clear Results
          </Button>
        }
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          {/* Service Status */}
          <Card size="small" title="Service Status">
            <Descriptions size="small" column={2}>
              <Descriptions.Item label="Integration Manager">
                <Tag color={serviceIntegrationManager.isReady() ? 'green' : 'red'}>
                  {serviceIntegrationManager.isReady() ? 'Ready' : 'Not Ready'}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Agents">
                <Tag color="blue">{agents.length} loaded</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Tasks">
                <Tag color="blue">{tasks.length} loaded</Tag>
              </Descriptions.Item>
            </Descriptions>
          </Card>

          {/* Test Actions */}
          <Card size="small" title="Test Actions">
            <Space wrap>
              <Button
                icon={<PlayCircleOutlined />}
                onClick={testServiceStatus}
                loading={isLoading}
              >
                Test Service Status
              </Button>
              
              <Button
                icon={<PlusOutlined />}
                onClick={testCreateAgent}
                loading={isLoading}
                disabled={!serviceIntegrationManager.isReady()}
              >
                Create Test Agent
              </Button>
              
              <Button
                icon={<PlusOutlined />}
                onClick={testCreateTask}
                loading={isLoading}
                disabled={!serviceIntegrationManager.isReady()}
              >
                Create Test Task
              </Button>
              
              <Button
                icon={<PlayCircleOutlined />}
                onClick={testStartAgent}
                loading={isLoading}
                disabled={!serviceIntegrationManager.isReady() || agents.length === 0}
              >
                Start Agent
              </Button>
              
              <Button
                icon={<PlayCircleOutlined />}
                onClick={testAssignTask}
                loading={isLoading}
                disabled={!serviceIntegrationManager.isReady() || agents.length === 0 || tasks.length === 0}
              >
                Assign Task
              </Button>
            </Space>
          </Card>

          {/* Test Results */}
          {testResults.length > 0 && (
            <Card size="small" title="Test Results">
              <div style={{
                maxHeight: '200px', 
                overflowY: 'auto',
                fontFamily: 'monospace',
                fontSize: '12px',
                background: '#1e1e1e',
                padding: '8px',
                borderRadius: '4px'
              }}>
                {testResults.map((result, index) => (
                  <div key={index} style={{ marginBottom: '4px', color: '#cccccc' }}>
                    {result}
                  </div>
                ))}
              </div>
            </Card>
          )}

          {!serviceIntegrationManager.isReady() && (
            <Alert
              message="Service Integration Not Ready"
              description="The service integration manager is not ready. Some tests may fail."
              type="warning"
              showIcon
            />
          )}
        </Space>
      </Card>
    </div>
  );
};
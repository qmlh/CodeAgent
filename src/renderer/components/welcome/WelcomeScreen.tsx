/**
 * Welcome Screen Component
 * Displayed when no files are open
 */

import React from 'react';
import { Button, Card, Row, Col } from 'antd';
import { 
  FolderOpenOutlined, 
  FileAddOutlined,
  RobotOutlined,
  CheckSquareOutlined,
  BookOutlined,
  GithubOutlined
} from '@ant-design/icons';
import { useAppDispatch } from '../../hooks/redux';
import { loadWorkspace } from '../../store/slices/fileSlice';

export const WelcomeScreen: React.FC = () => {
  const dispatch = useAppDispatch();

  const handleOpenFolder = async () => {
    try {
      const result = await window.electronAPI?.app.showOpenDialog({
        properties: ['openDirectory'],
        title: 'Open Project Folder'
      });

      if (result?.success && !result.canceled && result.filePaths?.length > 0) {
        const projectPath = result.filePaths[0];
        await dispatch(loadWorkspace(projectPath)).unwrap();
      }
    } catch (error) {
      console.error('Error opening folder:', error);
    }
  };

  const handleNewFile = async () => {
    // TODO: Implement new file creation
    console.log('New file');
  };

  const handleCreateAgent = () => {
    // TODO: Open create agent modal
    console.log('Create agent');
  };

  const handleCreateTask = () => {
    // TODO: Open create task modal
    console.log('Create task');
  };

  const handleOpenDocumentation = () => {
    window.electronAPI?.app.openExternal('https://github.com/multi-agent-ide/docs');
  };

  const handleOpenGitHub = () => {
    window.electronAPI?.app.openExternal('https://github.com/multi-agent-ide');
  };

  return (
    <div className="welcome-screen">
      <div className="welcome-content">
        <h1 className="welcome-title">Multi-Agent IDE</h1>
        <p className="welcome-subtitle">
          A collaborative development environment powered by AI agents
        </p>

        <Row gutter={[16, 16]} style={{ marginTop: '32px' }}>
          <Col xs={24} sm={12} md={8}>
            <Card 
              hoverable
              style={{ 
                background: '#252526', 
                border: '1px solid #3e3e42',
                height: '120px'
              }}
              bodyStyle={{ 
                padding: '16px', 
                display: 'flex', 
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%'
              }}
              onClick={handleOpenFolder}
            >
              <FolderOpenOutlined style={{ fontSize: '24px', color: '#1890ff', marginBottom: '8px' }} />
              <div style={{ color: '#cccccc', fontSize: '14px', textAlign: 'center' }}>
                Open Folder
              </div>
              <div style={{ color: '#888', fontSize: '12px', textAlign: 'center' }}>
                Start working with an existing project
              </div>
            </Card>
          </Col>

          <Col xs={24} sm={12} md={8}>
            <Card 
              hoverable
              style={{ 
                background: '#252526', 
                border: '1px solid #3e3e42',
                height: '120px'
              }}
              bodyStyle={{ 
                padding: '16px', 
                display: 'flex', 
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%'
              }}
              onClick={handleNewFile}
            >
              <FileAddOutlined style={{ fontSize: '24px', color: '#52c41a', marginBottom: '8px' }} />
              <div style={{ color: '#cccccc', fontSize: '14px', textAlign: 'center' }}>
                New File
              </div>
              <div style={{ color: '#888', fontSize: '12px', textAlign: 'center' }}>
                Create a new file to get started
              </div>
            </Card>
          </Col>

          <Col xs={24} sm={12} md={8}>
            <Card 
              hoverable
              style={{ 
                background: '#252526', 
                border: '1px solid #3e3e42',
                height: '120px'
              }}
              bodyStyle={{ 
                padding: '16px', 
                display: 'flex', 
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%'
              }}
              onClick={handleCreateAgent}
            >
              <RobotOutlined style={{ fontSize: '24px', color: '#faad14', marginBottom: '8px' }} />
              <div style={{ color: '#cccccc', fontSize: '14px', textAlign: 'center' }}>
                Create Agent
              </div>
              <div style={{ color: '#888', fontSize: '12px', textAlign: 'center' }}>
                Set up your first AI agent
              </div>
            </Card>
          </Col>

          <Col xs={24} sm={12} md={8}>
            <Card 
              hoverable
              style={{ 
                background: '#252526', 
                border: '1px solid #3e3e42',
                height: '120px'
              }}
              bodyStyle={{ 
                padding: '16px', 
                display: 'flex', 
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%'
              }}
              onClick={handleCreateTask}
            >
              <CheckSquareOutlined style={{ fontSize: '24px', color: '#722ed1', marginBottom: '8px' }} />
              <div style={{ color: '#cccccc', fontSize: '14px', textAlign: 'center' }}>
                Create Task
              </div>
              <div style={{ color: '#888', fontSize: '12px', textAlign: 'center' }}>
                Define your first development task
              </div>
            </Card>
          </Col>

          <Col xs={24} sm={12} md={8}>
            <Card 
              hoverable
              style={{ 
                background: '#252526', 
                border: '1px solid #3e3e42',
                height: '120px'
              }}
              bodyStyle={{ 
                padding: '16px', 
                display: 'flex', 
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%'
              }}
              onClick={handleOpenDocumentation}
            >
              <BookOutlined style={{ fontSize: '24px', color: '#13c2c2', marginBottom: '8px' }} />
              <div style={{ color: '#cccccc', fontSize: '14px', textAlign: 'center' }}>
                Documentation
              </div>
              <div style={{ color: '#888', fontSize: '12px', textAlign: 'center' }}>
                Learn how to use Multi-Agent IDE
              </div>
            </Card>
          </Col>

          <Col xs={24} sm={12} md={8}>
            <Card 
              hoverable
              style={{ 
                background: '#252526', 
                border: '1px solid #3e3e42',
                height: '120px'
              }}
              bodyStyle={{ 
                padding: '16px', 
                display: 'flex', 
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%'
              }}
              onClick={handleOpenGitHub}
            >
              <GithubOutlined style={{ fontSize: '24px', color: '#f5f5f5', marginBottom: '8px' }} />
              <div style={{ color: '#cccccc', fontSize: '14px', textAlign: 'center' }}>
                GitHub
              </div>
              <div style={{ color: '#888', fontSize: '12px', textAlign: 'center' }}>
                View source code and contribute
              </div>
            </Card>
          </Col>
        </Row>

        <div style={{ marginTop: '32px', textAlign: 'center' }}>
          <p style={{ color: '#666', fontSize: '12px' }}>
            Get started by opening a folder or creating your first agent
          </p>
        </div>
      </div>
    </div>
  );
};
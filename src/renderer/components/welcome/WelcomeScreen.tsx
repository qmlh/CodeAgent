/**
 * Welcome Screen Component
 * Displayed when no files are open
 */

import React, { useState } from 'react';
import { Row, Col, Button, Space } from 'antd';
import {
  FolderOpenOutlined,
  FileAddOutlined,
  RobotOutlined,
  CheckSquareOutlined,
  BookOutlined,
  GithubOutlined,
  BugOutlined
} from '@ant-design/icons';
import { useAppDispatch } from '../../hooks/redux';
import { loadWorkspace } from '../../store/slices/fileSlice';
import { ServiceIntegrationTest } from '../debug/ServiceIntegrationTest';

export const WelcomeScreen: React.FC = () => {
  console.log('🚀 WelcomeScreen component rendered!');

  const dispatch = useAppDispatch();
  const [showDebugPanel, setShowDebugPanel] = useState(false);



  const handleOpenFolder = async () => {
    try {
      if (!window.electronAPI?.app?.showOpenDialog) {
        // For development, create a mock workspace
        const mockWorkspace = '/mock/workspace';
        await dispatch(loadWorkspace(mockWorkspace)).unwrap();
        return;
      }

      const result = await window.electronAPI.app.showOpenDialog({
        properties: ['openDirectory'],
        title: 'Open Project Folder'
      });

      if (result?.success && !result.canceled && result.filePaths?.length > 0) {
        const projectPath = result.filePaths[0];
        await dispatch(loadWorkspace(projectPath)).unwrap();
      }
    } catch (error) {
      console.error('Error opening folder:', error);
      // For development, still create a mock workspace
      const mockWorkspace = '/mock/workspace';
      await dispatch(loadWorkspace(mockWorkspace)).unwrap();
    }
  };

  const handleNewFile = async () => {
    try {
      // Create a new untitled file
      const newFile = {
        path: `untitled-${Date.now()}.txt`,
        name: `untitled-${Date.now()}.txt`,
        content: '// Welcome to Multi-Agent IDE!\n// Start typing your code here...\n\n',
        isDirty: true,
        isReadonly: false,
        language: 'plaintext',
        encoding: 'utf-8',
        lineEnding: 'lf' as const,
        lastModified: new Date()
      };

      console.log('Creating new file:', newFile.name);
      alert(`New file "${newFile.name}" created!\n\nFull editor integration coming soon.`);
    } catch (error) {
      console.error('Error creating new file:', error);
      alert(`Error creating file: ${error}`);
    }
  };

  const handleCreateAgent = () => {
    console.log('Create agent clicked');
    alert('🤖 AI Agent Creation\n\nThis feature will allow you to create and configure AI agents to help with your development tasks.\n\nComing soon!');
  };

  const handleCreateTask = () => {
    console.log('Create task clicked');
    alert('📋 Task Creation\n\nThis feature will allow you to create and assign development tasks to AI agents.\n\nComing soon!');
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


        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{
            fontSize: '4rem',
            marginBottom: '16px',
            background: 'linear-gradient(135deg, #1890ff 0%, #52c41a 50%, #faad14 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            fontWeight: 'bold'
          }}>
            🤖 Multi-Agent IDE
          </div>
          <h1 className="welcome-title" style={{ fontSize: '2.5rem', margin: 0, color: '#ffffff' }}>
            Welcome to Your AI-Powered Development Environment
          </h1>
          <p className="welcome-subtitle" style={{ fontSize: '1.2rem', marginTop: '16px', color: '#888' }}>
            Collaborate with AI agents to build amazing software faster
          </p>
          <div style={{
            background: 'linear-gradient(90deg, #1890ff, #52c41a)',
            height: '3px',
            width: '200px',
            margin: '20px auto',
            borderRadius: '2px'
          }} />
        </div>

        <Row gutter={[24, 24]} style={{ marginTop: '40px' }}>
          <Col xs={24} sm={12} md={8}>
            <div
              style={{
                background: 'linear-gradient(135deg, #1890ff15 0%, #1890ff25 100%)',
                border: '2px solid #1890ff',
                height: '140px',
                borderRadius: '12px',
                transition: 'all 0.3s ease',
                cursor: 'pointer',
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              onClick={handleOpenFolder}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <FolderOpenOutlined style={{ fontSize: '32px', color: '#1890ff', marginBottom: '12px' }} />
              <div style={{ color: '#ffffff', fontSize: '16px', fontWeight: 'bold', textAlign: 'center' }}>
                📁 Open Project
              </div>
              <div style={{ color: '#aaa', fontSize: '12px', textAlign: 'center', marginTop: '4px' }}>
                Load an existing codebase
              </div>
            </div>
          </Col>

          <Col xs={24} sm={12} md={8}>
            <div
              style={{
                background: 'linear-gradient(135deg, #52c41a15 0%, #52c41a25 100%)',
                border: '2px solid #52c41a',
                height: '140px',
                borderRadius: '12px',
                transition: 'all 0.3s ease',
                cursor: 'pointer',
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              onClick={handleNewFile}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <FileAddOutlined style={{ fontSize: '32px', color: '#52c41a', marginBottom: '12px' }} />
              <div style={{ color: '#ffffff', fontSize: '16px', fontWeight: 'bold', textAlign: 'center' }}>
                �?New File
              </div>
              <div style={{ color: '#aaa', fontSize: '12px', textAlign: 'center', marginTop: '4px' }}>
                Start coding immediately
              </div>
            </div>
          </Col>

          <Col xs={24} sm={12} md={8}>
            <div
              style={{
                background: 'linear-gradient(135deg, #faad1415 0%, #faad1425 100%)',
                border: '2px solid #faad14',
                height: '140px',
                borderRadius: '12px',
                transition: 'all 0.3s ease',
                cursor: 'pointer',
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              onClick={handleCreateAgent}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <RobotOutlined style={{ fontSize: '32px', color: '#faad14', marginBottom: '12px' }} />
              <div style={{ color: '#ffffff', fontSize: '16px', fontWeight: 'bold', textAlign: 'center' }}>
                🤖 AI Agent
              </div>
              <div style={{ color: '#aaa', fontSize: '12px', textAlign: 'center', marginTop: '4px' }}>
                Create your coding assistant
              </div>
            </div>
          </Col>

          <Col xs={24} sm={12} md={8}>
            <div
              style={{
                background: 'linear-gradient(135deg, #722ed115 0%, #722ed125 100%)',
                border: '2px solid #722ed1',
                height: '140px',
                borderRadius: '12px',
                transition: 'all 0.3s ease',
                cursor: 'pointer',
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              onClick={handleCreateTask}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <CheckSquareOutlined style={{ fontSize: '32px', color: '#722ed1', marginBottom: '12px' }} />
              <div style={{ color: '#ffffff', fontSize: '16px', fontWeight: 'bold', textAlign: 'center' }}>
                📋 New Task
              </div>
              <div style={{ color: '#aaa', fontSize: '12px', textAlign: 'center', marginTop: '4px' }}>
                Plan your development work
              </div>
            </div>
          </Col>

          <Col xs={24} sm={12} md={8}>
            <div
              style={{
                background: 'linear-gradient(135deg, #13c2c215 0%, #13c2c225 100%)',
                border: '2px solid #13c2c2',
                height: '140px',
                borderRadius: '12px',
                transition: 'all 0.3s ease',
                cursor: 'pointer',
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              onClick={handleOpenDocumentation}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <BookOutlined style={{ fontSize: '32px', color: '#13c2c2', marginBottom: '12px' }} />
              <div style={{ color: '#ffffff', fontSize: '16px', fontWeight: 'bold', textAlign: 'center' }}>
                📚 Docs
              </div>
              <div style={{ color: '#aaa', fontSize: '12px', textAlign: 'center', marginTop: '4px' }}>
                Learn the platform
              </div>
            </div>
          </Col>

          <Col xs={24} sm={12} md={8}>
            <div
              style={{
                background: 'linear-gradient(135deg, #f5f5f515 0%, #f5f5f525 100%)',
                border: '2px solid #666',
                height: '140px',
                borderRadius: '12px',
                transition: 'all 0.3s ease',
                cursor: 'pointer',
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              onClick={handleOpenGitHub}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <GithubOutlined style={{ fontSize: '32px', color: '#f5f5f5', marginBottom: '12px' }} />
              <div style={{ color: '#ffffff', fontSize: '16px', fontWeight: 'bold', textAlign: 'center' }}>
                💻 GitHub
              </div>
              <div style={{ color: '#aaa', fontSize: '12px', textAlign: 'center', marginTop: '4px' }}>
                View source & contribute
              </div>
            </div>
          </Col>
        </Row>

        <div style={{ marginTop: '40px', textAlign: 'center' }}>
          <div style={{
            background: '#252526',
            padding: '24px',
            borderRadius: '12px',
            border: '1px solid #3e3e42',
            maxWidth: '600px',
            margin: '0 auto'
          }}>
            <h3 style={{ color: '#52c41a', marginBottom: '16px', fontSize: '18px' }}>
              🚀 Ready to Start Building?
            </h3>
            <p style={{ color: '#cccccc', fontSize: '14px', lineHeight: '1.6', marginBottom: '16px' }}>
              This is your <strong>Multi-Agent IDE</strong> - a revolutionary development environment where AI agents help you code, test, and deploy faster than ever before.
              Choose an action above to begin your journey!
            </p>

            <Space>
              <Button
                icon={<BugOutlined />}
                onClick={() => setShowDebugPanel(!showDebugPanel)}
                type={showDebugPanel ? 'primary' : 'default'}
                
              >
                {showDebugPanel ? 'Hide' : 'Show'} Debug Panel
              </Button>
            </Space>
          </div>
        </div>

        {/* Debug Panel */}
        {showDebugPanel && (
          <div style={{ marginTop: '24px' }}>
            <ServiceIntegrationTest />
          </div>
        )}
      </div>
    </div>
  );
};
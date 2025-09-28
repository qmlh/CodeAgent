/**
 * Mock Data for Development and Testing
 */

import { Agent } from '../store/slices/agentSlice';
import { Task } from '../store/slices/taskSlice';
import { OpenFile } from '../store/slices/fileSlice';

export const mockAgents: Agent[] = [
  {
    id: 'agent-1',
    name: 'Frontend Developer',
    type: 'frontend',
    status: 'working',
    capabilities: ['react', 'typescript', 'css', 'testing'],
    currentTask: 'task-1',
    workload: 2,
    lastActive: new Date(),
    performance: {
      tasksCompleted: 15,
      averageTaskTime: 45000,
      successRate: 0.93
    },
    config: {
      maxConcurrentTasks: 3,
      specializations: ['ui-development', 'component-testing'],
      preferences: {
        codeStyle: 'functional',
        testFramework: 'jest'
      }
    },
    createdAt: new Date(Date.now() - 86400000) // 1 day ago
  },
  {
    id: 'agent-2',
    name: 'Backend Developer',
    type: 'backend',
    status: 'idle',
    capabilities: ['node.js', 'express', 'database', 'api-design'],
    workload: 0,
    lastActive: new Date(Date.now() - 300000), // 5 minutes ago
    performance: {
      tasksCompleted: 8,
      averageTaskTime: 60000,
      successRate: 0.88
    },
    config: {
      maxConcurrentTasks: 2,
      specializations: ['api-development', 'database-design'],
      preferences: {
        database: 'postgresql',
        architecture: 'microservices'
      }
    },
    createdAt: new Date(Date.now() - 172800000) // 2 days ago
  },
  {
    id: 'agent-3',
    name: 'Test Engineer',
    type: 'testing',
    status: 'working',
    capabilities: ['unit-testing', 'integration-testing', 'e2e-testing'],
    currentTask: 'task-3',
    workload: 1,
    lastActive: new Date(),
    performance: {
      tasksCompleted: 22,
      averageTaskTime: 30000,
      successRate: 0.95
    },
    config: {
      maxConcurrentTasks: 4,
      specializations: ['automated-testing', 'test-strategy'],
      preferences: {
        testRunner: 'jest',
        e2eFramework: 'playwright'
      }
    },
    createdAt: new Date(Date.now() - 259200000) // 3 days ago
  },
  {
    id: 'agent-4',
    name: 'Code Reviewer',
    type: 'code_review',
    status: 'idle',
    capabilities: ['code-analysis', 'security-review', 'performance-optimization'],
    workload: 0,
    lastActive: new Date(Date.now() - 600000), // 10 minutes ago
    performance: {
      tasksCompleted: 35,
      averageTaskTime: 20000,
      successRate: 0.97
    },
    config: {
      maxConcurrentTasks: 5,
      specializations: ['security-analysis', 'performance-review'],
      preferences: {
        reviewStyle: 'thorough',
        focusAreas: ['security', 'performance', 'maintainability']
      }
    },
    createdAt: new Date(Date.now() - 345600000) // 4 days ago
  }
];

export const mockTasks: Task[] = [
  {
    id: 'task-1',
    title: 'Implement User Authentication UI',
    description: 'Create login and registration forms with validation and error handling',
    type: 'frontend',
    status: 'in_progress',
    priority: 'high',
    assignedAgent: 'agent-1',
    dependencies: [],
    estimatedTime: 7200000, // 2 hours
    actualTime: 3600000, // 1 hour so far
    files: ['src/components/auth/LoginForm.tsx', 'src/components/auth/RegisterForm.tsx'],
    requirements: ['Form validation', 'Error handling', 'Responsive design'],
    tags: ['ui', 'authentication', 'forms'],
    progress: 60,
    createdAt: new Date(Date.now() - 3600000), // 1 hour ago
    startedAt: new Date(Date.now() - 3600000),
    dueDate: new Date(Date.now() + 86400000), // 1 day from now
    createdBy: 'user'
  },
  {
    id: 'task-2',
    title: 'Design User Database Schema',
    description: 'Create database tables for user management with proper relationships',
    type: 'backend',
    status: 'pending',
    priority: 'high',
    dependencies: [],
    estimatedTime: 5400000, // 1.5 hours
    files: ['migrations/001_create_users.sql', 'models/User.js'],
    requirements: ['User table', 'Role-based permissions', 'Data validation'],
    tags: ['database', 'schema', 'users'],
    progress: 0,
    createdAt: new Date(Date.now() - 1800000), // 30 minutes ago
    dueDate: new Date(Date.now() + 172800000), // 2 days from now
    createdBy: 'user'
  },
  {
    id: 'task-3',
    title: 'Write Authentication Tests',
    description: 'Create comprehensive test suite for authentication functionality',
    type: 'testing',
    status: 'in_progress',
    priority: 'medium',
    assignedAgent: 'agent-3',
    dependencies: ['task-1'],
    estimatedTime: 3600000, // 1 hour
    files: ['tests/auth.test.js', 'tests/integration/auth.integration.test.js'],
    requirements: ['Unit tests', 'Integration tests', 'Edge case coverage'],
    tags: ['testing', 'authentication', 'quality-assurance'],
    progress: 30,
    createdAt: new Date(Date.now() - 900000), // 15 minutes ago
    startedAt: new Date(Date.now() - 600000), // 10 minutes ago
    dueDate: new Date(Date.now() + 259200000), // 3 days from now
    createdBy: 'user'
  },
  {
    id: 'task-4',
    title: 'API Documentation',
    description: 'Document all authentication API endpoints with examples',
    type: 'documentation',
    status: 'pending',
    priority: 'low',
    dependencies: ['task-2'],
    estimatedTime: 2700000, // 45 minutes
    files: ['docs/api/authentication.md', 'docs/examples/auth-examples.md'],
    requirements: ['API reference', 'Code examples', 'Error codes'],
    tags: ['documentation', 'api', 'reference'],
    progress: 0,
    createdAt: new Date(Date.now() - 600000), // 10 minutes ago
    dueDate: new Date(Date.now() + 432000000), // 5 days from now
    createdBy: 'user'
  },
  {
    id: 'task-5',
    title: 'Security Review',
    description: 'Review authentication implementation for security vulnerabilities',
    type: 'code_review',
    status: 'blocked',
    priority: 'critical',
    dependencies: ['task-1', 'task-2'],
    estimatedTime: 1800000, // 30 minutes
    files: ['src/components/auth/', 'models/User.js', 'middleware/auth.js'],
    requirements: ['Security analysis', 'Vulnerability assessment', 'Best practices review'],
    tags: ['security', 'review', 'authentication'],
    progress: 0,
    createdAt: new Date(Date.now() - 300000), // 5 minutes ago
    dueDate: new Date(Date.now() + 86400000), // 1 day from now
    createdBy: 'user'
  }
];

export const mockFiles: OpenFile[] = [
  {
    path: '/mock/workspace/src/components/auth/LoginForm.tsx',
    name: 'LoginForm.tsx',
    content: `import React, { useState } from 'react';
import { Form, Input, Button, Alert } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';

interface LoginFormProps {
  onSubmit: (values: { username: string; password: string }) => void;
  loading?: boolean;
  error?: string;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onSubmit, loading, error }) => {
  const [form] = Form.useForm();

  const handleSubmit = (values: { username: string; password: string }) => {
    onSubmit(values);
  };

  return (
    <Form
      form={form}
      name="login"
      onFinish={handleSubmit}
      autoComplete="off"
      layout="vertical"
    >
      {error && (
        <Alert
          message="Login Failed"
          description={error}
          type="error"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}
      
      <Form.Item
        name="username"
        rules={[{ required: true, message: 'Please input your username!' }]}
      >
        <Input
          prefix={<UserOutlined />}
          placeholder="Username"
          size="large"
        />
      </Form.Item>

      <Form.Item
        name="password"
        rules={[{ required: true, message: 'Please input your password!' }]}
      >
        <Input.Password
          prefix={<LockOutlined />}
          placeholder="Password"
          size="large"
        />
      </Form.Item>

      <Form.Item>
        <Button
          type="primary"
          htmlType="submit"
          loading={loading}
          size="large"
          block
        >
          Log In
        </Button>
      </Form.Item>
    </Form>
  );
};`,
    isDirty: true,
    isReadonly: false,
    language: 'typescript',
    encoding: 'utf-8',
    lineEnding: 'lf',
    lastModified: new Date()
  }
];

export const mockMessages = [
  {
    id: 'msg-1',
    from: 'agent-1',
    to: 'agent-3',
    type: 'request' as const,
    content: 'Please review the LoginForm component when ready',
    timestamp: new Date(Date.now() - 300000),
    requiresResponse: true
  },
  {
    id: 'msg-2',
    from: 'agent-3',
    to: 'agent-1',
    type: 'response' as const,
    content: 'Will start testing once the component is complete',
    timestamp: new Date(Date.now() - 240000),
    requiresResponse: false
  },
  {
    id: 'msg-3',
    from: 'agent-4',
    to: ['agent-1', 'agent-2'],
    type: 'alert' as const,
    content: 'Security review required before deployment',
    timestamp: new Date(Date.now() - 180000),
    requiresResponse: false
  }
];

export const mockCollaborationSessions = [
  {
    id: 'session-1',
    participants: ['agent-1', 'agent-3'],
    sharedFiles: ['/mock/workspace/src/components/auth/LoginForm.tsx'],
    communicationChannel: 'channel-auth-dev',
    startTime: new Date(Date.now() - 1800000),
    status: 'active' as const
  }
];
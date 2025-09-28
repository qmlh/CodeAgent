import React, { useState, useEffect } from 'react';
import { Modal, Steps, Button, Typography, Space, Card, List, Tooltip, Tour, TourProps } from 'antd';
import { QuestionCircleOutlined, PlayCircleOutlined, BookOutlined, BulbOutlined, CheckCircleOutlined } from '@ant-design/icons';
import './UserGuidanceSystem.css';

const { Title, Text, Paragraph } = Typography;
const { Step } = Steps;

interface TutorialStep {
  id: string;
  title: string;
  description: string;
  target?: string;
  content: React.ReactNode;
  action?: () => void;
}

interface Tutorial {
  id: string;
  title: string;
  description: string;
  category: 'getting-started' | 'agents' | 'tasks' | 'files' | 'advanced';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime: number;
  steps: TutorialStep[];
  completed: boolean;
}

interface HelpTopic {
  id: string;
  title: string;
  category: string;
  content: string;
  tags: string[];
}

export const UserGuidanceSystem: React.FC = () => {
  const [visible, setVisible] = useState(false);
  const [currentTutorial, setCurrentTutorial] = useState<Tutorial | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [tutorials, setTutorials] = useState<Tutorial[]>([]);
  const [helpTopics, setHelpTopics] = useState<HelpTopic[]>([]);
  const [tourOpen, setTourOpen] = useState(false);
  const [tourSteps, setTourSteps] = useState<TourProps['steps']>([]);

  useEffect(() => {
    loadTutorials();
    loadHelpTopics();
    setupTourSteps();
  }, []);

  const loadTutorials = () => {
    const tutorialData: Tutorial[] = [
      {
        id: '1',
        title: 'Getting Started with Multi-Agent IDE',
        description: 'Learn the basics of using the Multi-Agent IDE',
        category: 'getting-started',
        difficulty: 'beginner',
        estimatedTime: 10,
        completed: false,
        steps: [
          {
            id: '1-1',
            title: 'Welcome to Multi-Agent IDE',
            description: 'Overview of the application',
            content: (
              <div>
                <Paragraph>
                  Welcome to the Multi-Agent IDE! This powerful development environment allows multiple AI agents to collaborate on your projects.
                </Paragraph>
                <Paragraph>
                  In this tutorial, you'll learn how to:
                </Paragraph>
                <ul>
                  <li>Navigate the interface</li>
                  <li>Create and manage agents</li>
                  <li>Assign tasks to agents</li>
                  <li>Monitor collaboration</li>
                </ul>
              </div>
            )
          },
          {
            id: '1-2',
            title: 'Interface Overview',
            description: 'Understanding the main interface components',
            content: (
              <div>
                <Paragraph>
                  The IDE consists of several key areas:
                </Paragraph>
                <ul>
                  <li><strong>File Explorer:</strong> Browse and manage project files</li>
                  <li><strong>Agent Panel:</strong> View and control your agents</li>
                  <li><strong>Task Manager:</strong> Create and track tasks</li>
                  <li><strong>Code Editor:</strong> Edit files with syntax highlighting</li>
                  <li><strong>Collaboration Monitor:</strong> See real-time agent activity</li>
                </ul>
              </div>
            )
          },
          {
            id: '1-3',
            title: 'Creating Your First Agent',
            description: 'Step-by-step agent creation',
            content: (
              <div>
                <Paragraph>
                  Let's create your first agent:
                </Paragraph>
                <ol>
                  <li>Click the "Create Agent" button in the Agent Panel</li>
                  <li>Choose an agent type (Frontend, Backend, Testing, etc.)</li>
                  <li>Give your agent a name</li>
                  <li>Configure its capabilities</li>
                  <li>Click "Create" to activate the agent</li>
                </ol>
              </div>
            )
          }
        ]
      },
      {
        id: '2',
        title: 'Agent Management',
        description: 'Learn how to effectively manage your agents',
        category: 'agents',
        difficulty: 'intermediate',
        estimatedTime: 15,
        completed: false,
        steps: [
          {
            id: '2-1',
            title: 'Agent Types and Specializations',
            description: 'Understanding different agent types',
            content: (
              <div>
                <Paragraph>
                  Different agent types have different specializations:
                </Paragraph>
                <ul>
                  <li><strong>Frontend Agent:</strong> HTML, CSS, JavaScript, React</li>
                  <li><strong>Backend Agent:</strong> APIs, databases, server logic</li>
                  <li><strong>Testing Agent:</strong> Unit tests, integration tests</li>
                  <li><strong>Code Review Agent:</strong> Code quality, best practices</li>
                  <li><strong>Documentation Agent:</strong> Comments, README files</li>
                </ul>
              </div>
            )
          },
          {
            id: '2-2',
            title: 'Monitoring Agent Performance',
            description: 'Track agent activity and performance',
            content: (
              <div>
                <Paragraph>
                  Monitor your agents effectively:
                </Paragraph>
                <ul>
                  <li>Check agent status indicators</li>
                  <li>Review task completion rates</li>
                  <li>Monitor resource usage</li>
                  <li>View activity logs</li>
                  <li>Set up performance alerts</li>
                </ul>
              </div>
            )
          }
        ]
      },
      {
        id: '3',
        title: 'Task Management',
        description: 'Master task creation and assignment',
        category: 'tasks',
        difficulty: 'intermediate',
        estimatedTime: 12,
        completed: true,
        steps: [
          {
            id: '3-1',
            title: 'Creating Effective Tasks',
            description: 'How to write clear task descriptions',
            content: (
              <div>
                <Paragraph>
                  Create clear, actionable tasks:
                </Paragraph>
                <ul>
                  <li>Use specific, measurable objectives</li>
                  <li>Include acceptance criteria</li>
                  <li>Set appropriate priorities</li>
                  <li>Define dependencies</li>
                  <li>Estimate time requirements</li>
                </ul>
              </div>
            )
          }
        ]
      }
    ];

    setTutorials(tutorialData);
  };

  const loadHelpTopics = () => {
    const helpData: HelpTopic[] = [
      {
        id: '1',
        title: 'How to create a new agent?',
        category: 'Agents',
        content: 'To create a new agent, click the "Create Agent" button in the Agent Panel, select the agent type, configure its settings, and click "Create".',
        tags: ['agent', 'create', 'setup']
      },
      {
        id: '2',
        title: 'Why is my agent not responding?',
        category: 'Troubleshooting',
        content: 'Check the agent status in the Agent Panel. If it shows as "Error", try restarting the agent. Also verify that the agent has the necessary permissions and resources.',
        tags: ['agent', 'error', 'troubleshooting']
      },
      {
        id: '3',
        title: 'How to assign tasks to specific agents?',
        category: 'Tasks',
        content: 'In the Task Manager, create a new task and use the "Assign to Agent" dropdown to select a specific agent, or leave it unassigned for automatic assignment.',
        tags: ['task', 'assign', 'agent']
      },
      {
        id: '4',
        title: 'File conflict resolution',
        category: 'Files',
        content: 'When multiple agents modify the same file, the system will detect conflicts and show a resolution dialog. You can choose to accept changes from either agent or merge them manually.',
        tags: ['file', 'conflict', 'resolution']
      }
    ];

    setHelpTopics(helpData);
  };

  const setupTourSteps = () => {
    const steps: TourProps['steps'] = [
      {
        title: 'File Explorer',
        description: 'Browse and manage your project files here. You can create, delete, and organize files and folders.',
        target: () => document.querySelector('.file-explorer') as HTMLElement,
      },
      {
        title: 'Agent Panel',
        description: 'View and manage your AI agents. Create new agents, monitor their status, and control their activities.',
        target: () => document.querySelector('.agent-panel') as HTMLElement,
      },
      {
        title: 'Task Manager',
        description: 'Create, assign, and track tasks. Use the Kanban board to visualize task progress.',
        target: () => document.querySelector('.task-manager') as HTMLElement,
      },
      {
        title: 'Code Editor',
        description: 'Edit your code with syntax highlighting, auto-completion, and collaborative features.',
        target: () => document.querySelector('.code-editor') as HTMLElement,
      },
      {
        title: 'Collaboration Monitor',
        description: 'Monitor real-time agent activities and collaboration status.',
        target: () => document.querySelector('.collaboration-monitor') as HTMLElement,
      }
    ];

    setTourSteps(steps);
  };

  const startTutorial = (tutorial: Tutorial) => {
    setCurrentTutorial(tutorial);
    setCurrentStep(0);
    setVisible(true);
  };

  const nextStep = () => {
    if (currentTutorial && currentStep < currentTutorial.steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const completeTutorial = () => {
    if (currentTutorial) {
      setTutorials(prev => prev.map(tutorial => 
        tutorial.id === currentTutorial.id 
          ? { ...tutorial, completed: true }
          : tutorial
      ));
    }
    setVisible(false);
    setCurrentTutorial(null);
    setCurrentStep(0);
  };

  const startTour = () => {
    setTourOpen(true);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'green';
      case 'intermediate': return 'orange';
      case 'advanced': return 'red';
      default: return 'blue';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'getting-started': return <PlayCircleOutlined />;
      case 'agents': return <BulbOutlined />;
      case 'tasks': return <CheckCircleOutlined />;
      case 'files': return <BookOutlined />;
      default: return <QuestionCircleOutlined />;
    }
  };

  return (
    <div className="user-guidance-system">
      <Card
        title={
          <Space>
            <QuestionCircleOutlined />
            <Title level={4} style={{ margin: 0 }}>Help & Tutorials</Title>
          </Space>
        }
        extra={
          <Button type="primary" onClick={startTour}>
            Take Interface Tour
          </Button>
        }
      >
        <div className="guidance-content">
          <div className="tutorials-section">
            <Title level={5}>Interactive Tutorials</Title>
            <List
              dataSource={tutorials}
              renderItem={(tutorial) => (
                <List.Item
                  actions={[
                    <Button
                      type={tutorial.completed ? 'default' : 'primary'}
                      onClick={() => startTutorial(tutorial)}
                      icon={tutorial.completed ? <CheckCircleOutlined /> : <PlayCircleOutlined />}
                    >
                      {tutorial.completed ? 'Review' : 'Start'}
                    </Button>
                  ]}
                >
                  <List.Item.Meta
                    avatar={getCategoryIcon(tutorial.category)}
                    title={
                      <Space>
                        {tutorial.title}
                        {tutorial.completed && <CheckCircleOutlined style={{ color: '#52c41a' }} />}
                      </Space>
                    }
                    description={
                      <div>
                        <Text>{tutorial.description}</Text>
                        <div style={{ marginTop: 8 }}>
                          <Space>
                            <Tooltip title="Difficulty Level">
                              <Button  type="text" style={{ color: getDifficultyColor(tutorial.difficulty) }}>
                                {tutorial.difficulty}
                              </Button>
                            </Tooltip>
                            <Tooltip title="Estimated Time">
                              <Text type="secondary">{tutorial.estimatedTime} min</Text>
                            </Tooltip>
                            <Tooltip title="Number of Steps">
                              <Text type="secondary">{tutorial.steps.length} steps</Text>
                            </Tooltip>
                          </Space>
                        </div>
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          </div>

          <div className="help-topics-section">
            <Title level={5}>Frequently Asked Questions</Title>
            <List
              dataSource={helpTopics}
              renderItem={(topic) => (
                <List.Item>
                  <List.Item.Meta
                    title={topic.title}
                    description={
                      <div>
                        <Paragraph>{topic.content}</Paragraph>
                        <Space>
                          <Text type="secondary">Category: {topic.category}</Text>
                          <div>
                            {topic.tags.map(tag => (
                              <Button key={tag}  type="text" style={{ fontSize: 11 }}>
                                #{tag}
                              </Button>
                            ))}
                          </div>
                        </Space>
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          </div>
        </div>
      </Card>

      {/* Tutorial Modal */}
      <Modal
        title={currentTutorial?.title}
        open={visible}
        onCancel={() => setVisible(false)}
        width={800}
        footer={[
          <Button key="prev" onClick={prevStep} disabled={currentStep === 0}>
            Previous
          </Button>,
          <Button key="next" type="primary" onClick={nextStep} 
            disabled={!currentTutorial || currentStep >= currentTutorial.steps.length - 1}>
            Next
          </Button>,
          <Button key="complete" type="primary" onClick={completeTutorial}
            style={{ display: currentTutorial && currentStep >= currentTutorial.steps.length - 1 ? 'inline-block' : 'none' }}>
            Complete Tutorial
          </Button>
        ]}
      >
        {currentTutorial && (
          <div className="tutorial-content">
            <Steps current={currentStep}  style={{ marginBottom: 24 }}>
              {currentTutorial.steps.map((step, index) => (
                <Step key={step.id} title={step.title} description={step.description} />
              ))}
            </Steps>
            
            <div className="tutorial-step-content">
              <Title level={5}>{currentTutorial.steps[currentStep]?.title}</Title>
              {currentTutorial.steps[currentStep]?.content}
            </div>
          </div>
        )}
      </Modal>

      {/* Interface Tour */}
      <Tour
        open={tourOpen}
        onClose={() => setTourOpen(false)}
        steps={tourSteps}
      />
    </div>
  );
};
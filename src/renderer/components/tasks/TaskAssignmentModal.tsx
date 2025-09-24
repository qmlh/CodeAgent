/**
 * Task Assignment Modal Component
 * Modal for assigning tasks to agents with intelligent suggestions
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  Modal,
  Card,
  Avatar,
  Tag,
  Progress,
  Button,
  Space,
  Divider,
  Alert,
  Tooltip,
  Badge,
  Radio,
  List,
  Statistic,
  Row,
  Col
} from 'antd';
import {
  UserOutlined,
  RobotOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  ThunderboltOutlined,
  StarOutlined
} from '@ant-design/icons';
import { useAppSelector, useAppDispatch } from '../../hooks/redux';
import { assignTaskToAgent } from '../../store/slices/taskSlice';

export interface TaskAssignmentModalProps {
  open: boolean;
  taskId: string | null;
  onClose: () => void;
  onAssign: () => void;
}

interface AgentSuggestion {
  agentId: string;
  score: number;
  reasons: string[];
  workload: number;
  estimatedCompletionTime: number;
  compatibility: 'excellent' | 'good' | 'fair' | 'poor';
}

export const TaskAssignmentModal: React.FC<TaskAssignmentModalProps> = ({
  open,
  taskId,
  onClose,
  onAssign
}) => {
  const dispatch = useAppDispatch();
  const { tasks } = useAppSelector(state => state.task);
  const { agents } = useAppSelector(state => state.agent);
  
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [assignmentMode, setAssignmentMode] = useState<'auto' | 'manual'>('auto');
  const [loading, setLoading] = useState(false);

  const task = useMemo(() => {
    return taskId ? tasks.find(t => t.id === taskId) : null;
  }, [tasks, taskId]);

  const agentSuggestions = useMemo(() => {
    if (!task) return [];

    return agents.map(agent => {
      const suggestions = calculateAgentSuitability(task, agent);
      return suggestions;
    }).sort((a, b) => b.score - a.score);
  }, [task, agents]);

  const bestSuggestion = agentSuggestions[0];

  useEffect(() => {
    if (assignmentMode === 'auto' && bestSuggestion) {
      setSelectedAgent(bestSuggestion.agentId);
    }
  }, [assignmentMode, bestSuggestion]);

  const calculateAgentSuitability = (task: any, agent: any): AgentSuggestion => {
    let score = 0;
    const reasons: string[] = [];
    
    // Type matching
    const typeMatch = getTypeMatchScore(task.type, agent.type);
    score += typeMatch * 40;
    if (typeMatch > 0.8) {
      reasons.push(`Specialized in ${task.type} development`);
    } else if (typeMatch > 0.5) {
      reasons.push(`Has experience with ${task.type} tasks`);
    }

    // Current workload
    const currentTasks = tasks.filter(t => 
      t.assignedAgent === agent.id && 
      t.status === 'in_progress'
    ).length;
    
    const workloadPenalty = Math.min(currentTasks * 15, 60);
    score -= workloadPenalty;
    
    if (currentTasks === 0) {
      reasons.push('Currently available');
    } else if (currentTasks <= 2) {
      reasons.push('Light workload');
    } else {
      reasons.push(`Busy with ${currentTasks} tasks`);
    }

    // Priority handling
    if (task.priority === 'critical' && agent.capabilities?.includes('high-priority')) {
      score += 20;
      reasons.push('Experienced with critical tasks');
    }

    // Skill matching
    const skillMatch = calculateSkillMatch(task, agent);
    score += skillMatch * 20;
    if (skillMatch > 0.8) {
      reasons.push('Strong skill match');
    }

    // Recent performance
    const recentPerformance = getRecentPerformance(agent.id);
    score += recentPerformance * 10;
    if (recentPerformance > 0.8) {
      reasons.push('Excellent recent performance');
    }

    // Availability
    if (agent.status === 'idle') {
      score += 15;
      reasons.push('Currently idle');
    } else if (agent.status === 'working') {
      score -= 10;
    }

    const compatibility = getCompatibilityLevel(score);
    const estimatedTime = calculateEstimatedCompletionTime(task, agent, currentTasks);

    return {
      agentId: agent.id,
      score: Math.max(0, Math.min(100, score)),
      reasons,
      workload: currentTasks,
      estimatedCompletionTime: estimatedTime,
      compatibility
    };
  };

  const getTypeMatchScore = (taskType: string, agentType: string): number => {
    const typeMapping: Record<string, string[]> = {
      'frontend': ['frontend', 'ui'],
      'backend': ['backend', 'api', 'database'],
      'testing': ['testing'],
      'documentation': ['documentation'],
      'review': ['code_review'],
      'deployment': ['devops']
    };

    const taskTypes = typeMapping[taskType] || [taskType];
    return taskTypes.includes(agentType) ? 1 : 0.3;
  };

  const calculateSkillMatch = (task: any, agent: any): number => {
    // Simplified skill matching based on task requirements and agent capabilities
    const taskSkills = task.requirements || [];
    const agentSkills = agent.capabilities || [];
    
    if (taskSkills.length === 0) return 0.5;
    
    const matchingSkills = taskSkills.filter((skill: string) =>
      agentSkills.some((agentSkill: string) =>
        agentSkill.toLowerCase().includes(skill.toLowerCase())
      )
    );
    
    return matchingSkills.length / taskSkills.length;
  };

  const getRecentPerformance = (agentId: string): number => {
    const recentTasks = tasks.filter(t =>
      t.assignedAgent === agentId &&
      t.completedAt &&
      new Date(t.completedAt).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000 // Last 7 days
    );

    if (recentTasks.length === 0) return 0.5;

    const successfulTasks = recentTasks.filter(t => t.status === 'completed');
    return successfulTasks.length / recentTasks.length;
  };

  const getCompatibilityLevel = (score: number): 'excellent' | 'good' | 'fair' | 'poor' => {
    if (score >= 80) return 'excellent';
    if (score >= 60) return 'good';
    if (score >= 40) return 'fair';
    return 'poor';
  };

  const calculateEstimatedCompletionTime = (task: any, agent: any, currentWorkload: number): number => {
    const baseTime = task.estimatedTime;
    const workloadMultiplier = 1 + (currentWorkload * 0.2);
    const skillMultiplier = 1 - (calculateSkillMatch(task, agent) * 0.3);
    
    return baseTime * workloadMultiplier * skillMultiplier;
  };

  const getCompatibilityColor = (compatibility: string) => {
    switch (compatibility) {
      case 'excellent': return '#52c41a';
      case 'good': return '#1890ff';
      case 'fair': return '#faad14';
      case 'poor': return '#ff4d4f';
      default: return '#d9d9d9';
    }
  };

  const getCompatibilityIcon = (compatibility: string) => {
    switch (compatibility) {
      case 'excellent': return <StarOutlined />;
      case 'good': return <CheckCircleOutlined />;
      case 'fair': return <ClockCircleOutlined />;
      case 'poor': return <ExclamationCircleOutlined />;
      default: return <ClockCircleOutlined />;
    }
  };

  const formatTime = (milliseconds: number) => {
    const hours = Math.floor(milliseconds / (1000 * 60 * 60));
    const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const handleAssign = async () => {
    if (!selectedAgent || !taskId) return;

    setLoading(true);
    try {
      await dispatch(assignTaskToAgent({ taskId, agentId: selectedAgent }));
      onAssign();
    } catch (error) {
      console.error('Failed to assign task:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderAgentCard = (suggestion: AgentSuggestion) => {
    const agent = agents.find(a => a.id === suggestion.agentId);
    if (!agent) return null;

    const isSelected = selectedAgent === agent.id;
    const isRecommended = suggestion === bestSuggestion;

    return (
      <Card
        key={agent.id}
        className={`agent-suggestion-card ${isSelected ? 'selected' : ''} ${isRecommended ? 'recommended' : ''}`}
        onClick={() => setSelectedAgent(agent.id)}
        hoverable
        size="small"
      >
        {isRecommended && (
          <div className="recommendation-badge">
            <Tag color="gold" icon={<ThunderboltOutlined />}>
              Recommended
            </Tag>
          </div>
        )}

        <div className="agent-header">
          <Space>
            <Avatar icon={<RobotOutlined />} size="large">
              {agent.name.charAt(0).toUpperCase()}
            </Avatar>
            <div className="agent-info">
              <div className="agent-name">{agent.name}</div>
              <Tag color="blue">{agent.type}</Tag>
              <Tag color={agent.status === 'idle' ? 'green' : 'orange'}>
                {agent.status}
              </Tag>
            </div>
          </Space>
          
          <div className="compatibility-score">
            <Tooltip title={`Compatibility: ${suggestion.compatibility}`}>
              <Badge
                count={Math.round(suggestion.score)}
                style={{ backgroundColor: getCompatibilityColor(suggestion.compatibility) }}
              />
            </Tooltip>
          </div>
        </div>

        <Divider style={{ margin: '12px 0' }} />

        <Row gutter={16}>
          <Col span={8}>
            <Statistic
              title="Workload"
              value={suggestion.workload}
              suffix="tasks"
              valueStyle={{ fontSize: '14px' }}
            />
          </Col>
          <Col span={16}>
            <Statistic
              title="Est. Completion"
              value={formatTime(suggestion.estimatedCompletionTime)}
              valueStyle={{ fontSize: '14px' }}
            />
          </Col>
        </Row>

        <div className="compatibility-indicator">
          <Space>
            {getCompatibilityIcon(suggestion.compatibility)}
            <span style={{ color: getCompatibilityColor(suggestion.compatibility) }}>
              {suggestion.compatibility.toUpperCase()} MATCH
            </span>
          </Space>
          <Progress
            percent={suggestion.score}
            size="small"
            strokeColor={getCompatibilityColor(suggestion.compatibility)}
            showInfo={false}
          />
        </div>

        <div className="assignment-reasons">
          <div className="reasons-title">Why this agent:</div>
          <ul className="reasons-list">
            {suggestion.reasons.slice(0, 3).map((reason, index) => (
              <li key={index}>{reason}</li>
            ))}
          </ul>
        </div>
      </Card>
    );
  };

  if (!task) return null;

  return (
    <Modal
      title={`Assign Task: ${task.title}`}
      open={open}
      onCancel={onClose}
      width={800}
      footer={[
        <Button key="cancel" onClick={onClose}>
          Cancel
        </Button>,
        <Button
          key="assign"
          type="primary"
          loading={loading}
          disabled={!selectedAgent}
          onClick={handleAssign}
        >
          Assign Task
        </Button>
      ]}
    >
      <div className="task-assignment-modal">
        {/* Task Info */}
        <Card size="small" className="task-info-card">
          <Row gutter={16}>
            <Col span={12}>
              <div className="task-detail">
                <strong>Type:</strong> <Tag>{task.type}</Tag>
              </div>
              <div className="task-detail">
                <strong>Priority:</strong> <Tag color={task.priority === 'critical' ? 'red' : 'orange'}>{task.priority}</Tag>
              </div>
            </Col>
            <Col span={12}>
              <div className="task-detail">
                <strong>Estimated Time:</strong> {formatTime(task.estimatedTime)}
              </div>
              <div className="task-detail">
                <strong>Dependencies:</strong> {task.dependencies.length} tasks
              </div>
            </Col>
          </Row>
        </Card>

        {/* Assignment Mode */}
        <div className="assignment-mode">
          <Radio.Group
            value={assignmentMode}
            onChange={(e) => setAssignmentMode(e.target.value)}
            buttonStyle="solid"
          >
            <Radio.Button value="auto">
              <ThunderboltOutlined /> Smart Assignment
            </Radio.Button>
            <Radio.Button value="manual">
              <UserOutlined /> Manual Selection
            </Radio.Button>
          </Radio.Group>
        </div>

        {assignmentMode === 'auto' && bestSuggestion && (
          <Alert
            message="Smart Assignment Recommendation"
            description={`${agents.find(a => a.id === bestSuggestion.agentId)?.name} is the best match for this task with ${Math.round(bestSuggestion.score)}% compatibility.`}
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}

        {/* Agent Suggestions */}
        <div className="agent-suggestions">
          <div className="suggestions-header">
            <h4>Available Agents</h4>
            <span className="suggestions-count">
              {agentSuggestions.length} agents available
            </span>
          </div>

          <div className="suggestions-list">
            {agentSuggestions.map(suggestion => renderAgentCard(suggestion))}
          </div>
        </div>

        {agentSuggestions.length === 0 && (
          <Alert
            message="No Available Agents"
            description="All agents are currently busy or offline. You may need to wait or create a new agent."
            type="warning"
            showIcon
          />
        )}
      </div>
    </Modal>
  );
};
/**
 * System constants and configuration defaults
 */

// Import AgentType for the capabilities mapping
import { AgentType } from '../../types/agent.types';

export const SYSTEM_CONSTANTS = {
  // Agent configuration
  MAX_AGENTS: 10,
  MAX_CONCURRENT_TASKS_PER_AGENT: 3,
  AGENT_HEARTBEAT_INTERVAL: 30000, // 30 seconds
  AGENT_TIMEOUT: 300000, // 5 minutes
  
  // Task configuration
  DEFAULT_TASK_TIMEOUT: 600000, // 10 minutes
  MAX_TASK_RETRIES: 3,
  TASK_PRIORITY_LEVELS: 4,
  
  // File management
  FILE_LOCK_TIMEOUT: 300000, // 5 minutes
  MAX_FILE_LOCKS_PER_AGENT: 5,
  FILE_BACKUP_RETENTION: 7, // days
  
  // Communication
  MESSAGE_QUEUE_SIZE: 1000,
  MESSAGE_RETRY_ATTEMPTS: 3,
  MESSAGE_TIMEOUT: 30000, // 30 seconds
  
  // System limits
  MAX_COLLABORATION_SESSIONS: 5,
  MAX_WORKFLOW_STEPS: 50,
  MAX_ERROR_HISTORY: 1000,
  
  // Performance
  CACHE_TTL: 300000, // 5 minutes
  CLEANUP_INTERVAL: 3600000, // 1 hour
  METRICS_COLLECTION_INTERVAL: 60000, // 1 minute
} as const;

export const EVENT_NAMES = {
  // Agent events
  AGENT_CREATED: 'agent:created',
  AGENT_DESTROYED: 'agent:destroyed',
  AGENT_STATUS_CHANGED: 'agent:status_changed',
  AGENT_ERROR: 'agent:error',
  
  // Task events
  TASK_CREATED: 'task:created',
  TASK_ASSIGNED: 'task:assigned',
  TASK_STARTED: 'task:started',
  TASK_COMPLETED: 'task:completed',
  TASK_FAILED: 'task:failed',
  
  // File events
  FILE_LOCKED: 'file:locked',
  FILE_UNLOCKED: 'file:unlocked',
  FILE_MODIFIED: 'file:modified',
  FILE_CONFLICT: 'file:conflict',
  
  // Collaboration events
  COLLABORATION_STARTED: 'collaboration:started',
  COLLABORATION_ENDED: 'collaboration:ended',
  COLLABORATION_JOINED: 'collaboration:joined',
  COLLABORATION_LEFT: 'collaboration:left',
  
  // System events
  SYSTEM_STARTUP: 'system:startup',
  SYSTEM_SHUTDOWN: 'system:shutdown',
  SYSTEM_ERROR: 'system:error',
  HEALTH_CHECK: 'system:health_check'
} as const;

export const DEFAULT_AGENT_CAPABILITIES: Record<AgentType, string[]> = {
  [AgentType.FRONTEND]: [
    'html', 'css', 'javascript', 'typescript', 'react', 'vue', 'angular',
    'responsive_design', 'accessibility', 'performance_optimization'
  ],
  [AgentType.BACKEND]: [
    'nodejs', 'python', 'java', 'api_design', 'database_design',
    'microservices', 'authentication', 'caching', 'performance_tuning'
  ],
  [AgentType.TESTING]: [
    'unit_testing', 'integration_testing', 'e2e_testing', 'performance_testing',
    'test_automation', 'coverage_analysis', 'test_planning'
  ],
  [AgentType.DOCUMENTATION]: [
    'technical_writing', 'api_documentation', 'user_guides',
    'code_comments', 'architecture_docs', 'markdown'
  ],
  [AgentType.CODE_REVIEW]: [
    'code_analysis', 'security_review', 'performance_review',
    'best_practices', 'style_guide_enforcement', 'refactoring'
  ],
  [AgentType.DEVOPS]: [
    'ci_cd', 'containerization', 'deployment', 'monitoring',
    'infrastructure', 'automation', 'security'
  ]
};
/**
 * Collaboration types for multi-agent coordination
 */

import { Agent } from './agent.types';
import { Task } from './task.types';

export interface CollaborationSession {
  id: string;
  participants: string[];
  sharedFiles: string[];
  communicationChannel: string;
  startTime: Date;
  endTime?: Date;
  status: 'active' | 'paused' | 'completed' | 'cancelled';
}

export interface CollaborationEvent {
  id: string;
  sessionId: string;
  agentId: string;
  eventType: 'join' | 'leave' | 'message' | 'file_change' | 'task_update';
  timestamp: Date;
  data: any;
}

export interface SharedResource {
  id: string;
  type: 'file' | 'database' | 'api' | 'service';
  path: string;
  permissions: {
    read: string[];
    write: string[];
    execute: string[];
  };
  lockStatus?: {
    isLocked: boolean;
    lockedBy?: string;
    lockedAt?: Date;
  };
}

export interface CollaborationRule {
  id: string;
  name: string;
  description: string;
  condition: string;
  action: string;
  priority: number;
  enabled: boolean;
}

export interface WorkflowStep {
  id: string;
  name: string;
  description: string;
  agentType?: string;
  action: string;
  parameters?: Record<string, any>;
  dependencies: string[];
  timeout?: number;
}

export interface Workflow {
  id: string;
  name: string;
  description: string;
  steps: WorkflowStep[];
  triggers: string[];
  enabled: boolean;
}
/**
 * Conflict Resolution UI Types
 * Extended types for the conflict resolution interface
 */

import { Conflict, ConflictResolution } from '../../types/file.types';
import { Agent } from '../../types/agent.types';

export interface ConflictUIState {
  id: string;
  conflict: Conflict;
  localContent: string;
  remoteContent: string;
  mergedContent: string;
  baseContent?: string;
  involvedAgents: Agent[];
  resolutionSuggestions: ResolutionSuggestion[];
  isResolving: boolean;
  hasUnsavedChanges: boolean;
}

export interface ResolutionSuggestion {
  id: string;
  type: 'auto_merge' | 'accept_local' | 'accept_remote' | 'manual_edit';
  confidence: number;
  description: string;
  preview?: string;
  reasoning: string;
}

export interface ConflictHistoryEntry {
  id: string;
  conflict: Conflict;
  resolution: ConflictResolution;
  resolvedAt: Date;
  resolvedBy: string;
  timeTaken: number; // in milliseconds
  strategy: string;
}

export interface FileLockIndicator {
  filePath: string;
  isLocked: boolean;
  lockedBy?: Agent;
  lockType?: 'read' | 'write' | 'exclusive';
  lockedAt?: Date;
  expiresAt?: Date;
}

export interface ConflictPreventionAlert {
  id: string;
  filePath: string;
  message: string;
  severity: 'info' | 'warning' | 'error';
  involvedAgents: Agent[];
  timestamp: Date;
  dismissed: boolean;
}

export interface DiffLine {
  lineNumber: number;
  type: 'unchanged' | 'added' | 'removed' | 'modified';
  content: string;
  originalLineNumber?: number;
}

export interface DiffSection {
  id: string;
  type: 'conflict' | 'change' | 'unchanged';
  localLines: DiffLine[];
  remoteLines: DiffLine[];
  mergedLines: DiffLine[];
  isResolved: boolean;
  selectedResolution?: 'local' | 'remote' | 'manual';
}

export interface ConflictResolutionWizardStep {
  id: string;
  title: string;
  description: string;
  component: React.ComponentType<any>;
  isCompleted: boolean;
  isOptional: boolean;
  data?: any;
}

export interface ConflictMetrics {
  totalConflicts: number;
  resolvedConflicts: number;
  averageResolutionTime: number;
  mostCommonConflictType: string;
  agentConflictFrequency: Record<string, number>;
  fileConflictFrequency: Record<string, number>;
}
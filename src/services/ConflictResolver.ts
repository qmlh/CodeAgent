/**
 * Advanced conflict detection and resolution strategies
 */

import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import { Conflict, ConflictResolution, FileChange } from '../types/file.types';
import * as fs from 'fs/promises';
import * as path from 'path';

export interface ConflictDetectionRule {
  name: string;
  priority: number;
  detect(fileHistory: FileChange[], currentChange: FileChange): Conflict | null;
}

export interface ConflictResolutionStrategy {
  name: string;
  canResolve(conflict: Conflict): boolean;
  resolve(conflict: Conflict, context: ResolutionContext): Promise<ConflictResolution>;
}

export interface ResolutionContext {
  filePath: string;
  conflictingChanges: FileChange[];
  fileContent?: string;
  baseContent?: string;
}

export class ConflictResolver extends EventEmitter {
  private detectionRules: ConflictDetectionRule[] = [];
  private resolutionStrategies: ConflictResolutionStrategy[] = [];

  constructor() {
    super();
    this.initializeDefaultRules();
    this.initializeDefaultStrategies();
  }

  /**
   * Register a conflict detection rule
   */
  registerDetectionRule(rule: ConflictDetectionRule): void {
    this.detectionRules.push(rule);
    // Sort by priority (higher priority first)
    this.detectionRules.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Register a conflict resolution strategy
   */
  registerResolutionStrategy(strategy: ConflictResolutionStrategy): void {
    this.resolutionStrategies.push(strategy);
  }

  /**
   * Detect conflicts using all registered rules
   */
  detectConflicts(fileHistory: FileChange[], currentChange: FileChange): Conflict[] {
    const conflicts: Conflict[] = [];

    for (const rule of this.detectionRules) {
      const conflict = rule.detect(fileHistory, currentChange);
      if (conflict) {
        conflicts.push(conflict);
        this.emit('conflictDetected', conflict);
      }
    }

    return conflicts;
  }

  /**
   * Resolve a conflict using available strategies
   */
  async resolveConflict(conflict: Conflict, context: ResolutionContext): Promise<ConflictResolution> {
    for (const strategy of this.resolutionStrategies) {
      if (strategy.canResolve(conflict)) {
        try {
          const resolution = await strategy.resolve(conflict, context);
          this.emit('conflictResolved', { conflict, resolution });
          return resolution;
        } catch (error) {
          this.emit('resolutionFailed', { conflict, strategy: strategy.name, error });
        }
      }
    }

    throw new Error(`No suitable resolution strategy found for conflict ${conflict.id}`);
  }

  /**
   * Initialize default detection rules
   */
  private initializeDefaultRules(): void {
    // Concurrent modification rule
    this.registerDetectionRule({
      name: 'concurrent_modification',
      priority: 70,
      detect: (history: FileChange[], current: FileChange): Conflict | null => {
        const recentChanges = history.filter(
          change => 
            change.agentId !== current.agentId &&
            change.changeType === 'modified' &&
            Date.now() - change.timestamp.getTime() < 5000 // Last 5 seconds
        );

        // Only trigger if it's not a rapid succession (which would be lock timeout)
        if (recentChanges.length > 0 && recentChanges.length < 3) {
          return {
            id: uuidv4(),
            filePath: current.filePath,
            conflictType: 'concurrent_modification',
            involvedAgents: [current.agentId, ...recentChanges.map(c => c.agentId)],
            description: `Concurrent modifications detected on ${current.filePath}`,
            createdAt: new Date(),
            resolved: false
          };
        }

        return null;
      }
    });

    // Lock timeout rule
    this.registerDetectionRule({
      name: 'lock_timeout',
      priority: 100,
      detect: (history: FileChange[], current: FileChange): Conflict | null => {
        // This would be integrated with lock information
        // For now, we'll detect based on rapid successive changes
        const rapidChanges = history.filter(
          change => 
            change.agentId !== current.agentId &&
            Date.now() - change.timestamp.getTime() < 1000 // Last 1 second
        );

        if (rapidChanges.length >= 3) {
          return {
            id: uuidv4(),
            filePath: current.filePath,
            conflictType: 'lock_timeout',
            involvedAgents: [current.agentId, ...rapidChanges.map(c => c.agentId)],
            description: `Potential lock timeout conflict on ${current.filePath}`,
            createdAt: new Date(),
            resolved: false
          };
        }

        return null;
      }
    });

    // Merge conflict rule
    this.registerDetectionRule({
      name: 'merge_conflict',
      priority: 90,
      detect: (history: FileChange[], current: FileChange): Conflict | null => {
        // Detect when multiple agents modify the same file in overlapping regions
        const overlappingChanges = history.filter(
          change => 
            change.agentId !== current.agentId &&
            change.changeType === 'modified' &&
            Date.now() - change.timestamp.getTime() < 10000 && // Last 10 seconds
            Date.now() - change.timestamp.getTime() > 1000 // But not too recent (avoid lock timeout)
        );

        if (overlappingChanges.length > 0 && current.changeType === 'modified') {
          return {
            id: uuidv4(),
            filePath: current.filePath,
            conflictType: 'merge_conflict',
            involvedAgents: [current.agentId, ...overlappingChanges.map(c => c.agentId)],
            description: `Merge conflict detected on ${current.filePath}`,
            createdAt: new Date(),
            resolved: false
          };
        }

        return null;
      }
    });
  }

  /**
   * Initialize default resolution strategies
   */
  private initializeDefaultStrategies(): void {
    // Auto-merge strategy
    this.registerResolutionStrategy({
      name: 'auto_merge',
      canResolve: (conflict: Conflict): boolean => {
        return conflict.conflictType === 'concurrent_modification' ||
               conflict.conflictType === 'merge_conflict';
      },
      resolve: async (conflict: Conflict, context: ResolutionContext): Promise<ConflictResolution> => {
        // Simple auto-merge: use the latest change
        const latestChange = context.conflictingChanges
          .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())[0];

        return {
          conflictId: conflict.id,
          strategy: 'merge',
          resolvedBy: 'system',
          resolution: {
            action: 'use_latest',
            selectedAgent: latestChange.agentId,
            timestamp: latestChange.timestamp
          },
          timestamp: new Date()
        };
      }
    });

    // Overwrite strategy
    this.registerResolutionStrategy({
      name: 'overwrite',
      canResolve: (conflict: Conflict): boolean => {
        return conflict.conflictType === 'lock_timeout';
      },
      resolve: async (conflict: Conflict, context: ResolutionContext): Promise<ConflictResolution> => {
        // For lock timeouts, allow the current operation to proceed
        return {
          conflictId: conflict.id,
          strategy: 'overwrite',
          resolvedBy: 'system',
          resolution: {
            action: 'force_overwrite',
            reason: 'lock_timeout_recovery'
          },
          timestamp: new Date()
        };
      }
    });

    // Manual resolution strategy
    this.registerResolutionStrategy({
      name: 'manual',
      canResolve: (): boolean => true, // Can handle any conflict as fallback
      resolve: async (conflict: Conflict, context: ResolutionContext): Promise<ConflictResolution> => {
        // Mark for manual resolution
        return {
          conflictId: conflict.id,
          strategy: 'manual',
          resolvedBy: 'pending',
          resolution: {
            action: 'manual_review_required',
            conflictDetails: conflict,
            context: context
          },
          timestamp: new Date()
        };
      }
    });
  }
}
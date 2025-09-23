/**
 * Enhanced file change tracking with detailed history and analysis
 */

import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import { FileChange } from '../types/file.types';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as crypto from 'crypto';

export interface FileSnapshot {
  id: string;
  filePath: string;
  content: string;
  contentHash: string;
  timestamp: Date;
  agentId: string;
  size: number;
}

export interface ChangeAnalysis {
  linesAdded: number;
  linesRemoved: number;
  linesModified: number;
  changeRegions: ChangeRegion[];
  similarity: number; // 0-1, how similar to previous version
}

export interface ChangeRegion {
  startLine: number;
  endLine: number;
  changeType: 'added' | 'removed' | 'modified';
  content: string;
}

export class FileChangeTracker extends EventEmitter {
  private fileHistory: Map<string, FileChange[]> = new Map();
  private fileSnapshots: Map<string, FileSnapshot[]> = new Map();
  private maxHistorySize = 100; // Maximum number of changes to keep per file
  private maxSnapshotSize = 10; // Maximum number of snapshots to keep per file

  constructor() {
    super();
  }

  /**
   * Record a file change with detailed analysis
   */
  async recordChange(
    filePath: string,
    agentId: string,
    changeType: FileChange['changeType'],
    metadata?: Record<string, any>
  ): Promise<FileChange> {
    const normalizedPath = path.normalize(filePath);
    
    // Create the change record
    const change: FileChange = {
      id: uuidv4(),
      filePath: normalizedPath,
      agentId,
      changeType,
      timestamp: new Date(),
      metadata
    };

    // Add detailed analysis for modifications
    if (changeType === 'modified') {
      try {
        const analysis = await this.analyzeChange(normalizedPath, agentId);
        change.metadata = { ...metadata, analysis };
      } catch (error) {
        // Continue without analysis if file can't be read
        console.warn(`Could not analyze change for ${normalizedPath}:`, error);
      }
    }

    // Store the change
    const history = this.fileHistory.get(normalizedPath) || [];
    history.push(change);
    
    // Limit history size
    if (history.length > this.maxHistorySize) {
      history.splice(0, history.length - this.maxHistorySize);
    }
    
    this.fileHistory.set(normalizedPath, history);

    // Create snapshot for significant changes
    if (changeType === 'modified' || changeType === 'created') {
      await this.createSnapshot(normalizedPath, agentId);
    }

    this.emit('changeRecorded', change);
    return change;
  }

  /**
   * Get file change history
   */
  getHistory(filePath: string): FileChange[] {
    const normalizedPath = path.normalize(filePath);
    return this.fileHistory.get(normalizedPath) || [];
  }

  /**
   * Get file snapshots
   */
  getSnapshots(filePath: string): FileSnapshot[] {
    const normalizedPath = path.normalize(filePath);
    return this.fileSnapshots.get(normalizedPath) || [];
  }

  /**
   * Get changes by agent
   */
  getChangesByAgent(agentId: string): FileChange[] {
    const allChanges: FileChange[] = [];
    
    for (const history of this.fileHistory.values()) {
      allChanges.push(...history.filter(change => change.agentId === agentId));
    }
    
    return allChanges.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Get recent changes across all files
   */
  getRecentChanges(timeWindowMs: number = 300000): FileChange[] { // Default 5 minutes
    const cutoffTime = Date.now() - timeWindowMs;
    const recentChanges: FileChange[] = [];
    
    for (const history of this.fileHistory.values()) {
      recentChanges.push(
        ...history.filter(change => change.timestamp.getTime() > cutoffTime)
      );
    }
    
    return recentChanges.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Analyze conflicts between agents
   */
  analyzeConflicts(filePath: string, timeWindowMs: number = 30000): FileChange[] {
    const normalizedPath = path.normalize(filePath);
    const history = this.getHistory(normalizedPath);
    const cutoffTime = Date.now() - timeWindowMs;
    
    const recentChanges = history.filter(
      change => change.timestamp.getTime() > cutoffTime
    );

    // Group by agent and find overlapping modifications
    const agentChanges = new Map<string, FileChange[]>();
    
    for (const change of recentChanges) {
      const agentHistory = agentChanges.get(change.agentId) || [];
      agentHistory.push(change);
      agentChanges.set(change.agentId, agentHistory);
    }

    // Return changes where multiple agents modified the same file
    if (agentChanges.size > 1) {
      return recentChanges.filter(change => change.changeType === 'modified');
    }

    return [];
  }

  /**
   * Create a snapshot of the current file state
   */
  private async createSnapshot(filePath: string, agentId: string): Promise<FileSnapshot> {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const contentHash = crypto.createHash('sha256').update(content).digest('hex');
      const stats = await fs.stat(filePath);

      const snapshot: FileSnapshot = {
        id: uuidv4(),
        filePath,
        content,
        contentHash,
        timestamp: new Date(),
        agentId,
        size: stats.size
      };

      const snapshots = this.fileSnapshots.get(filePath) || [];
      snapshots.push(snapshot);
      
      // Limit snapshot size
      if (snapshots.length > this.maxSnapshotSize) {
        snapshots.splice(0, snapshots.length - this.maxSnapshotSize);
      }
      
      this.fileSnapshots.set(filePath, snapshots);
      
      return snapshot;
    } catch (error) {
      // If file doesn't exist or can't be read, create a minimal snapshot
      const snapshot: FileSnapshot = {
        id: uuidv4(),
        filePath,
        content: '',
        contentHash: crypto.createHash('sha256').update('').digest('hex'),
        timestamp: new Date(),
        agentId,
        size: 0
      };

      const snapshots = this.fileSnapshots.get(filePath) || [];
      snapshots.push(snapshot);
      
      if (snapshots.length > this.maxSnapshotSize) {
        snapshots.splice(0, snapshots.length - this.maxSnapshotSize);
      }
      
      this.fileSnapshots.set(filePath, snapshots);
      
      return snapshot;
    }
  }

  /**
   * Analyze the changes made to a file
   */
  private async analyzeChange(filePath: string, agentId: string): Promise<ChangeAnalysis> {
    const snapshots = this.getSnapshots(filePath);
    
    if (snapshots.length < 2) {
      // No previous version to compare against
      return {
        linesAdded: 0,
        linesRemoved: 0,
        linesModified: 0,
        changeRegions: [],
        similarity: 1.0
      };
    }

    const currentContent = await fs.readFile(filePath, 'utf-8');
    const previousSnapshot = snapshots[snapshots.length - 2]; // Second to last
    const previousContent = previousSnapshot.content;

    return this.compareContents(previousContent, currentContent);
  }

  /**
   * Compare two file contents and analyze differences
   */
  private compareContents(oldContent: string, newContent: string): ChangeAnalysis {
    const oldLines = oldContent.split('\n');
    const newLines = newContent.split('\n');

    let linesAdded = 0;
    let linesRemoved = 0;
    let linesModified = 0;
    const changeRegions: ChangeRegion[] = [];

    // Simple line-by-line comparison
    const maxLines = Math.max(oldLines.length, newLines.length);
    let currentRegion: ChangeRegion | null = null;

    for (let i = 0; i < maxLines; i++) {
      const oldLine = oldLines[i];
      const newLine = newLines[i];

      if (oldLine === undefined) {
        // Line added
        linesAdded++;
        if (!currentRegion || currentRegion.changeType !== 'added') {
          currentRegion = {
            startLine: i,
            endLine: i,
            changeType: 'added',
            content: newLine
          };
          changeRegions.push(currentRegion);
        } else {
          currentRegion.endLine = i;
          currentRegion.content += '\n' + newLine;
        }
      } else if (newLine === undefined) {
        // Line removed
        linesRemoved++;
        if (!currentRegion || currentRegion.changeType !== 'removed') {
          currentRegion = {
            startLine: i,
            endLine: i,
            changeType: 'removed',
            content: oldLine
          };
          changeRegions.push(currentRegion);
        } else {
          currentRegion.endLine = i;
          currentRegion.content += '\n' + oldLine;
        }
      } else if (oldLine !== newLine) {
        // Line modified
        linesModified++;
        if (!currentRegion || currentRegion.changeType !== 'modified') {
          currentRegion = {
            startLine: i,
            endLine: i,
            changeType: 'modified',
            content: `${oldLine} -> ${newLine}`
          };
          changeRegions.push(currentRegion);
        } else {
          currentRegion.endLine = i;
          currentRegion.content += `\n${oldLine} -> ${newLine}`;
        }
      } else {
        // Line unchanged, end current region
        currentRegion = null;
      }
    }

    // Calculate similarity (simple Jaccard similarity)
    const oldSet = new Set(oldLines);
    const newSet = new Set(newLines);
    const intersection = new Set([...oldSet].filter(x => newSet.has(x)));
    const union = new Set([...oldSet, ...newSet]);
    const similarity = union.size > 0 ? intersection.size / union.size : 1.0;

    return {
      linesAdded,
      linesRemoved,
      linesModified,
      changeRegions,
      similarity
    };
  }

  /**
   * Clear history for a file (e.g., when file is deleted)
   */
  clearHistory(filePath: string): void {
    const normalizedPath = path.normalize(filePath);
    this.fileHistory.delete(normalizedPath);
    this.fileSnapshots.delete(normalizedPath);
  }

  /**
   * Get statistics about file changes
   */
  getStatistics(): {
    totalFiles: number;
    totalChanges: number;
    totalSnapshots: number;
    agentActivity: Map<string, number>;
  } {
    let totalChanges = 0;
    let totalSnapshots = 0;
    const agentActivity = new Map<string, number>();

    for (const history of this.fileHistory.values()) {
      totalChanges += history.length;
      
      for (const change of history) {
        const count = agentActivity.get(change.agentId) || 0;
        agentActivity.set(change.agentId, count + 1);
      }
    }

    for (const snapshots of this.fileSnapshots.values()) {
      totalSnapshots += snapshots.length;
    }

    return {
      totalFiles: this.fileHistory.size,
      totalChanges,
      totalSnapshots,
      agentActivity
    };
  }
}
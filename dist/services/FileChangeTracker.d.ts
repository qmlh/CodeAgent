/**
 * Enhanced file change tracking with detailed history and analysis
 */
import { EventEmitter } from 'events';
import { FileChange } from '../types/file.types';
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
    similarity: number;
}
export interface ChangeRegion {
    startLine: number;
    endLine: number;
    changeType: 'added' | 'removed' | 'modified';
    content: string;
}
export declare class FileChangeTracker extends EventEmitter {
    private fileHistory;
    private fileSnapshots;
    private maxHistorySize;
    private maxSnapshotSize;
    constructor();
    /**
     * Record a file change with detailed analysis
     */
    recordChange(filePath: string, agentId: string, changeType: FileChange['changeType'], metadata?: Record<string, any>): Promise<FileChange>;
    /**
     * Get file change history
     */
    getHistory(filePath: string): FileChange[];
    /**
     * Get file snapshots
     */
    getSnapshots(filePath: string): FileSnapshot[];
    /**
     * Get changes by agent
     */
    getChangesByAgent(agentId: string): FileChange[];
    /**
     * Get recent changes across all files
     */
    getRecentChanges(timeWindowMs?: number): FileChange[];
    /**
     * Analyze conflicts between agents
     */
    analyzeConflicts(filePath: string, timeWindowMs?: number): FileChange[];
    /**
     * Create a snapshot of the current file state
     */
    private createSnapshot;
    /**
     * Analyze the changes made to a file
     */
    private analyzeChange;
    /**
     * Compare two file contents and analyze differences
     */
    private compareContents;
    /**
     * Clear history for a file (e.g., when file is deleted)
     */
    clearHistory(filePath: string): void;
    /**
     * Get statistics about file changes
     */
    getStatistics(): {
        totalFiles: number;
        totalChanges: number;
        totalSnapshots: number;
        agentActivity: Map<string, number>;
    };
}

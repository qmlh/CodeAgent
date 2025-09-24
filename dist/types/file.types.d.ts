/**
 * File management type definitions
 */
export interface FileLock {
    id: string;
    filePath: string;
    agentId: string;
    lockType: 'read' | 'write' | 'exclusive';
    acquiredAt: Date;
    expiresAt?: Date;
}
export interface Conflict {
    id: string;
    filePath: string;
    conflictType: 'concurrent_modification' | 'lock_timeout' | 'merge_conflict';
    involvedAgents: string[];
    description: string;
    createdAt: Date;
    resolved: boolean;
}
export interface ConflictResolution {
    conflictId: string;
    strategy: 'merge' | 'overwrite' | 'manual' | 'abort';
    resolvedBy: string;
    resolution: any;
    timestamp: Date;
}
export interface FileChange {
    id: string;
    filePath: string;
    agentId: string;
    changeType: 'created' | 'modified' | 'deleted' | 'moved';
    timestamp: Date;
    diff?: string;
    metadata?: Record<string, any>;
}

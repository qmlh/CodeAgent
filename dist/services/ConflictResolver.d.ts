/**
 * Advanced conflict detection and resolution strategies
 */
import { EventEmitter } from 'events';
import { Conflict, ConflictResolution, FileChange } from '../types/file.types';
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
export declare class ConflictResolver extends EventEmitter {
    private detectionRules;
    private resolutionStrategies;
    constructor();
    /**
     * Register a conflict detection rule
     */
    registerDetectionRule(rule: ConflictDetectionRule): void;
    /**
     * Register a conflict resolution strategy
     */
    registerResolutionStrategy(strategy: ConflictResolutionStrategy): void;
    /**
     * Detect conflicts using all registered rules
     */
    detectConflicts(fileHistory: FileChange[], currentChange: FileChange): Conflict[];
    /**
     * Resolve a conflict using available strategies
     */
    resolveConflict(conflict: Conflict, context: ResolutionContext): Promise<ConflictResolution>;
    /**
     * Initialize default detection rules
     */
    private initializeDefaultRules;
    /**
     * Initialize default resolution strategies
     */
    private initializeDefaultStrategies;
}

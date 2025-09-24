/**
 * Task Assignment Engine
 * Implements intelligent task assignment algorithms with dynamic reassignment and monitoring
 */
import { Task, TaskStatus } from '../types/task.types';
import { AgentInfo } from './TaskScheduler';
/**
 * Assignment criteria for intelligent task assignment
 */
export interface AssignmentCriteria {
    agentSpecialization: number;
    workloadBalance: number;
    capabilityMatch: number;
    taskPriority: number;
    estimatedTime: number;
    historicalPerformance: number;
}
/**
 * Agent performance metrics
 */
export interface AgentPerformance {
    agentId: string;
    tasksCompleted: number;
    tasksSuccessful: number;
    averageCompletionTime: number;
    averageQuality: number;
    specializations: Record<string, number>;
    lastUpdated: Date;
}
/**
 * Task assignment result
 */
export interface AssignmentResult {
    success: boolean;
    assignedAgent?: string;
    confidence: number;
    reasoning: string[];
    alternativeAgents?: string[];
}
/**
 * Task execution monitoring data
 */
export interface TaskExecution {
    taskId: string;
    agentId: string;
    startTime: Date;
    expectedEndTime: Date;
    actualEndTime?: Date;
    status: TaskStatus;
    progress: number;
    timeoutWarnings: number;
    lastHeartbeat: Date;
}
/**
 * Reassignment trigger
 */
export interface ReassignmentTrigger {
    type: 'timeout' | 'agent_failure' | 'priority_change' | 'load_balancing';
    taskId: string;
    agentId: string;
    reason: string;
    timestamp: Date;
}
/**
 * Default assignment criteria
 */
export declare const DEFAULT_ASSIGNMENT_CRITERIA: AssignmentCriteria;
/**
 * Intelligent Task Assignment Engine
 */
export declare class TaskAssignmentEngine {
    private agentInfo;
    private agentPerformance;
    private taskExecutions;
    private assignmentCriteria;
    private timeoutThreshold;
    private heartbeatInterval;
    /**
     * Update assignment criteria weights
     */
    updateAssignmentCriteria(criteria: Partial<AssignmentCriteria>): void;
    /**
     * Update agent information
     */
    updateAgentInfo(agentId: string, info: AgentInfo): void;
    /**
     * Remove agent information
     */
    removeAgentInfo(agentId: string): void;
    /**
     * Assign task using intelligent algorithm
     */
    assignTask(task: Task, availableAgents: string[]): AssignmentResult;
    /**
     * Start task execution monitoring
     */
    startTaskExecution(taskId: string, agentId: string, task: Task): void;
    /**
     * Update task execution progress
     */
    updateTaskProgress(taskId: string, progress: number): void;
    /**
     * Complete task execution
     */
    completeTaskExecution(taskId: string, success: boolean, quality?: number): void;
    /**
     * Check for tasks that need reassignment
     */
    checkForReassignment(): ReassignmentTrigger[];
    /**
     * Reassign task to a different agent
     */
    reassignTask(taskId: string, currentAgentId: string, availableAgents: string[], task: Task): AssignmentResult;
    /**
     * Get task execution status
     */
    getTaskExecution(taskId: string): TaskExecution | null;
    /**
     * Get all active task executions
     */
    getActiveExecutions(): TaskExecution[];
    /**
     * Get agent performance metrics
     */
    getAgentPerformance(agentId: string): AgentPerformance | null;
    /**
     * Get assignment engine statistics
     */
    getStatistics(): {
        totalAssignments: number;
        activeExecutions: number;
        averageAssignmentConfidence: number;
        timeoutRate: number;
        reassignmentRate: number;
        agentPerformanceSummary: Record<string, {
            successRate: number;
            avgCompletionTime: number;
        }>;
    };
    private calculateAgentScores;
    private calculateAgentScore;
    private getSpecializationScore;
    private getWorkloadScore;
    private getCapabilityScore;
    private getTimeScore;
    private getPerformanceScore;
    private updateAgentPerformance;
    private getTaskTypeFromExecution;
    private getTaskCountForType;
}

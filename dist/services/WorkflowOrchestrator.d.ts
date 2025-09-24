/**
 * Workflow Orchestration and State Machine implementation
 * Handles complex multi-agent workflows and coordination
 */
import { EventEmitter } from 'events';
import { WorkflowConfig } from '../types/config.types';
import { AgentType } from '../types/agent.types';
import { IAgent } from '../core/interfaces/IAgent';
export declare enum WorkflowState {
    PENDING = "pending",
    RUNNING = "running",
    PAUSED = "paused",
    COMPLETED = "completed",
    FAILED = "failed",
    CANCELLED = "cancelled"
}
export declare enum StepState {
    WAITING = "waiting",
    READY = "ready",
    RUNNING = "running",
    COMPLETED = "completed",
    FAILED = "failed",
    SKIPPED = "skipped"
}
export interface WorkflowExecution {
    id: string;
    workflowId: string;
    state: WorkflowState;
    currentStepIndex: number;
    stepStates: Map<string, StepState>;
    context: Record<string, any>;
    startTime: Date;
    endTime?: Date;
    error?: Error;
    executionLog: WorkflowLogEntry[];
}
export interface WorkflowLogEntry {
    timestamp: Date;
    stepId?: string;
    level: 'info' | 'warn' | 'error';
    message: string;
    data?: any;
}
export interface StepExecution {
    stepId: string;
    agentId?: string;
    state: StepState;
    startTime?: Date;
    endTime?: Date;
    result?: any;
    error?: Error;
    retryCount: number;
}
export interface WorkflowStateMachine {
    currentState: WorkflowState;
    allowedTransitions: Map<WorkflowState, WorkflowState[]>;
    transitionHandlers: Map<string, (execution: WorkflowExecution) => Promise<void>>;
}
export declare class WorkflowOrchestrator extends EventEmitter {
    private executions;
    private workflows;
    private stepExecutions;
    private stateMachine;
    private agentProvider;
    constructor(agentProvider: (type?: AgentType) => Promise<IAgent[]>);
    registerWorkflow(workflow: WorkflowConfig): void;
    unregisterWorkflow(workflowId: string): void;
    getWorkflow(workflowId: string): WorkflowConfig | undefined;
    getAllWorkflows(): WorkflowConfig[];
    executeWorkflow(workflowId: string, context?: Record<string, any>): Promise<WorkflowExecution>;
    pauseExecution(executionId: string): Promise<void>;
    resumeExecution(executionId: string): Promise<void>;
    cancelExecution(executionId: string): Promise<void>;
    getExecution(executionId: string): WorkflowExecution | undefined;
    getActiveExecutions(): WorkflowExecution[];
    private executeWorkflowSteps;
    private executeStep;
    private findAgentForStep;
    private executeStepAction;
    private areStepDependenciesSatisfied;
    private handleDependencyWait;
    private shouldRetryStep;
    private retryStep;
    private initializeStateMachine;
    private transitionState;
    private handleStartExecution;
    private handlePauseExecution;
    private handleResumeExecution;
    private handleCompleteExecution;
    private handleFailExecution;
    private handleCancelExecution;
    private validateWorkflow;
    private checkCircularDependencies;
    private logExecution;
    private generateExecutionId;
    shutdown(): Promise<void>;
}

/**
 * Service implementations
 */
export { TaskManager } from './TaskManager';
export { TaskScheduler, DefaultSchedulingStrategy } from './TaskScheduler';
export type { ITaskSchedulingStrategy, AgentInfo, TaskQueueEntry, SchedulingResult } from './TaskScheduler';
export { TaskAssignmentEngine, DEFAULT_ASSIGNMENT_CRITERIA } from './TaskAssignmentEngine';
export type { AssignmentCriteria, AgentPerformance, AssignmentResult, TaskExecution, ReassignmentTrigger } from './TaskAssignmentEngine';
export { FileManager } from './FileManager';
export { ConflictResolver } from './ConflictResolver';
export type { ConflictDetectionRule, ConflictResolutionStrategy, ResolutionContext } from './ConflictResolver';
export { FileChangeTracker } from './FileChangeTracker';
export type { FileSnapshot, ChangeAnalysis, ChangeRegion } from './FileChangeTracker';
export { CoordinationManager } from './CoordinationManager';
export type { CoordinationManagerConfig, AgentHealthStatus, WorkflowExecution } from './CoordinationManager';
export { WorkflowOrchestrator } from './WorkflowOrchestrator';
export type { WorkflowState, StepState, WorkflowExecution as WorkflowOrchestratorExecution, WorkflowLogEntry, StepExecution, WorkflowStateMachine } from './WorkflowOrchestrator';
export { CollaborationRulesEngine } from './CollaborationRulesEngine';
export type { CollaborationRule, RuleType, RuleCondition, ConditionOperator, LogicalOperator, RuleAction, ActionType, RuleEvaluationContext, RuleEvaluationResult, PolicySet } from './CollaborationRulesEngine';
export { AgentHealthMonitor } from './AgentHealthMonitor';
export type { HealthCheckConfig, AgentHealthMetrics, HealthCheckResult, RecoveryAction, RecoveryActionType, RecoveryResult, HealthAlert, AlertType } from './AgentHealthMonitor';

/**
 * Collaboration Rules Engine
 * Manages and enforces collaboration rules and policies
 */
import { EventEmitter } from 'events';
import { Agent } from '../types/agent.types';
import { Task } from '../types/task.types';
import { CollaborationSession } from '../types/message.types';
export interface CollaborationRule {
    id: string;
    name: string;
    description: string;
    type: RuleType;
    conditions: RuleCondition[];
    actions: RuleAction[];
    priority: number;
    enabled: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export declare enum RuleType {
    AGENT_ASSIGNMENT = "agent_assignment",
    RESOURCE_ACCESS = "resource_access",
    TASK_PRIORITY = "task_priority",
    COLLABORATION_LIMIT = "collaboration_limit",
    CONFLICT_RESOLUTION = "conflict_resolution",
    WORKFLOW_CONTROL = "workflow_control"
}
export interface RuleCondition {
    field: string;
    operator: ConditionOperator;
    value: any;
    logicalOperator?: LogicalOperator;
}
export declare enum ConditionOperator {
    EQUALS = "equals",
    NOT_EQUALS = "not_equals",
    GREATER_THAN = "greater_than",
    LESS_THAN = "less_than",
    GREATER_EQUAL = "greater_equal",
    LESS_EQUAL = "less_equal",
    CONTAINS = "contains",
    NOT_CONTAINS = "not_contains",
    IN = "in",
    NOT_IN = "not_in",
    MATCHES = "matches"
}
export declare enum LogicalOperator {
    AND = "and",
    OR = "or"
}
export interface RuleAction {
    type: ActionType;
    parameters: Record<string, any>;
}
export declare enum ActionType {
    ASSIGN_AGENT = "assign_agent",
    BLOCK_ACTION = "block_action",
    SET_PRIORITY = "set_priority",
    LIMIT_RESOURCES = "limit_resources",
    NOTIFY = "notify",
    LOG = "log",
    ESCALATE = "escalate",
    REDIRECT = "redirect"
}
export interface RuleEvaluationContext {
    agent?: Agent;
    task?: Task;
    session?: CollaborationSession;
    action?: string;
    resources?: string[];
    timestamp: Date;
    metadata?: Record<string, any>;
}
export interface RuleEvaluationResult {
    ruleId: string;
    matched: boolean;
    actions: RuleAction[];
    context: RuleEvaluationContext;
    evaluatedAt: Date;
}
export interface PolicySet {
    id: string;
    name: string;
    description: string;
    rules: string[];
    enabled: boolean;
    priority: number;
}
export declare class CollaborationRulesEngine extends EventEmitter {
    private rules;
    private policySets;
    private ruleEvaluationHistory;
    private maxHistorySize;
    constructor();
    addRule(rule: CollaborationRule): void;
    updateRule(ruleId: string, updates: Partial<CollaborationRule>): void;
    removeRule(ruleId: string): void;
    getRule(ruleId: string): CollaborationRule | undefined;
    getAllRules(): CollaborationRule[];
    getRulesByType(type: RuleType): CollaborationRule[];
    enableRule(ruleId: string): void;
    disableRule(ruleId: string): void;
    createPolicySet(policySet: PolicySet): void;
    updatePolicySet(policySetId: string, updates: Partial<PolicySet>): void;
    removePolicySet(policySetId: string): void;
    getPolicySet(policySetId: string): PolicySet | undefined;
    getAllPolicySets(): PolicySet[];
    evaluateRules(context: RuleEvaluationContext): Promise<RuleEvaluationResult[]>;
    evaluateRule(rule: CollaborationRule, context: RuleEvaluationContext): Promise<RuleEvaluationResult>;
    executeRuleActions(results: RuleEvaluationResult[]): Promise<void>;
    validateAgentAction(agent: Agent, action: string, context?: Record<string, any>): Promise<{
        allowed: boolean;
        reasons: string[];
    }>;
    validateTaskAssignment(task: Task, agent: Agent): Promise<{
        allowed: boolean;
        reasons: string[];
    }>;
    validateResourceAccess(agent: Agent, resources: string[]): Promise<{
        allowed: boolean;
        reasons: string[];
    }>;
    private getApplicableRules;
    private evaluateConditions;
    private evaluateCondition;
    private getFieldValue;
    private executeAction;
    private executeAssignAgentAction;
    private executeBlockAction;
    private executeSetPriorityAction;
    private executeLimitResourcesAction;
    private executeNotifyAction;
    private executeLogAction;
    private executeEscalateAction;
    private executeRedirectAction;
    private validateRule;
    private validatePolicySet;
    private addToHistory;
    private initializeDefaultRules;
    getRuleEvaluationHistory(): RuleEvaluationResult[];
    getRuleStatistics(): Record<string, any>;
    clearHistory(): void;
}

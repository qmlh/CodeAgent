/**
 * Collaboration Rules Engine
 * Manages and enforces collaboration rules and policies
 */

import { EventEmitter } from 'events';
import { Agent, AgentType, AgentStatus } from '../types/agent.types';
import { Task, TaskStatus, TaskPriority } from '../types/task.types';
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

export enum RuleType {
  AGENT_ASSIGNMENT = 'agent_assignment',
  RESOURCE_ACCESS = 'resource_access',
  TASK_PRIORITY = 'task_priority',
  COLLABORATION_LIMIT = 'collaboration_limit',
  CONFLICT_RESOLUTION = 'conflict_resolution',
  WORKFLOW_CONTROL = 'workflow_control'
}

export interface RuleCondition {
  field: string;
  operator: ConditionOperator;
  value: any;
  logicalOperator?: LogicalOperator;
}

export enum ConditionOperator {
  EQUALS = 'equals',
  NOT_EQUALS = 'not_equals',
  GREATER_THAN = 'greater_than',
  LESS_THAN = 'less_than',
  GREATER_EQUAL = 'greater_equal',
  LESS_EQUAL = 'less_equal',
  CONTAINS = 'contains',
  NOT_CONTAINS = 'not_contains',
  IN = 'in',
  NOT_IN = 'not_in',
  MATCHES = 'matches'
}

export enum LogicalOperator {
  AND = 'and',
  OR = 'or'
}

export interface RuleAction {
  type: ActionType;
  parameters: Record<string, any>;
}

export enum ActionType {
  ASSIGN_AGENT = 'assign_agent',
  BLOCK_ACTION = 'block_action',
  SET_PRIORITY = 'set_priority',
  LIMIT_RESOURCES = 'limit_resources',
  NOTIFY = 'notify',
  LOG = 'log',
  ESCALATE = 'escalate',
  REDIRECT = 'redirect'
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

export class CollaborationRulesEngine extends EventEmitter {
  private rules: Map<string, CollaborationRule> = new Map();
  private policySets: Map<string, PolicySet> = new Map();
  private ruleEvaluationHistory: RuleEvaluationResult[] = [];
  private maxHistorySize: number = 1000;

  constructor() {
    super();
    this.initializeDefaultRules();
  }

  async initialize(): Promise<void> {
    // Initialize collaboration rules engine
    // Any async initialization logic can be added here
    this.emit('initialized');
  }

  // Rule management
  addRule(rule: CollaborationRule): void {
    this.validateRule(rule);
    rule.updatedAt = new Date();
    this.rules.set(rule.id, rule);
    
    this.emit('ruleAdded', rule);
  }

  updateRule(ruleId: string, updates: Partial<CollaborationRule>): void {
    const rule = this.rules.get(ruleId);
    if (!rule) {
      throw new Error(`Rule ${ruleId} not found`);
    }

    const updatedRule = { ...rule, ...updates, updatedAt: new Date() };
    this.validateRule(updatedRule);
    this.rules.set(ruleId, updatedRule);
    
    this.emit('ruleUpdated', updatedRule);
  }

  removeRule(ruleId: string): void {
    const rule = this.rules.get(ruleId);
    if (!rule) {
      throw new Error(`Rule ${ruleId} not found`);
    }

    this.rules.delete(ruleId);
    this.emit('ruleRemoved', { ruleId, rule });
  }

  getRule(ruleId: string): CollaborationRule | undefined {
    return this.rules.get(ruleId);
  }

  getAllRules(): CollaborationRule[] {
    return Array.from(this.rules.values());
  }

  getRulesByType(type: RuleType): CollaborationRule[] {
    return Array.from(this.rules.values()).filter(rule => rule.type === type);
  }

  enableRule(ruleId: string): void {
    const rule = this.rules.get(ruleId);
    if (rule) {
      rule.enabled = true;
      rule.updatedAt = new Date();
      this.emit('ruleEnabled', rule);
    }
  }

  disableRule(ruleId: string): void {
    const rule = this.rules.get(ruleId);
    if (rule) {
      rule.enabled = false;
      rule.updatedAt = new Date();
      this.emit('ruleDisabled', rule);
    }
  }

  // Policy set management
  createPolicySet(policySet: PolicySet): void {
    this.validatePolicySet(policySet);
    this.policySets.set(policySet.id, policySet);
    
    this.emit('policySetCreated', policySet);
  }

  updatePolicySet(policySetId: string, updates: Partial<PolicySet>): void {
    const policySet = this.policySets.get(policySetId);
    if (!policySet) {
      throw new Error(`Policy set ${policySetId} not found`);
    }

    const updatedPolicySet = { ...policySet, ...updates };
    this.validatePolicySet(updatedPolicySet);
    this.policySets.set(policySetId, updatedPolicySet);
    
    this.emit('policySetUpdated', updatedPolicySet);
  }

  removePolicySet(policySetId: string): void {
    const policySet = this.policySets.get(policySetId);
    if (!policySet) {
      throw new Error(`Policy set ${policySetId} not found`);
    }

    this.policySets.delete(policySetId);
    this.emit('policySetRemoved', { policySetId, policySet });
  }

  getPolicySet(policySetId: string): PolicySet | undefined {
    return this.policySets.get(policySetId);
  }

  getAllPolicySets(): PolicySet[] {
    return Array.from(this.policySets.values());
  }

  // Rule evaluation
  async evaluateRules(context: RuleEvaluationContext): Promise<RuleEvaluationResult[]> {
    const results: RuleEvaluationResult[] = [];
    
    // Get applicable rules sorted by priority
    const applicableRules = this.getApplicableRules(context);
    
    for (const rule of applicableRules) {
      const result = await this.evaluateRule(rule, context);
      results.push(result);
      
      // Store in history
      this.addToHistory(result);
      
      // Emit evaluation event
      this.emit('ruleEvaluated', result);
    }

    return results;
  }

  async evaluateRule(
    rule: CollaborationRule, 
    context: RuleEvaluationContext
  ): Promise<RuleEvaluationResult> {
    const matched = await this.evaluateConditions(rule.conditions, context);
    
    const result: RuleEvaluationResult = {
      ruleId: rule.id,
      matched,
      actions: matched ? rule.actions : [],
      context,
      evaluatedAt: new Date()
    };

    return result;
  }

  async executeRuleActions(results: RuleEvaluationResult[]): Promise<void> {
    const matchedResults = results.filter(result => result.matched);
    
    for (const result of matchedResults) {
      for (const action of result.actions) {
        await this.executeAction(action, result.context);
      }
    }
  }

  // Validation methods
  async validateAgentAction(
    agent: Agent, 
    action: string, 
    context: Record<string, any> = {}
  ): Promise<{ allowed: boolean; reasons: string[] }> {
    const evaluationContext: RuleEvaluationContext = {
      agent,
      action,
      timestamp: new Date(),
      metadata: context
    };

    const results = await this.evaluateRules(evaluationContext);
    const blockingResults = results.filter(result => 
      result.matched && 
      result.actions.some(action => action.type === ActionType.BLOCK_ACTION)
    );

    const allowed = blockingResults.length === 0;
    const reasons = blockingResults.map(result => {
      const rule = this.rules.get(result.ruleId);
      return rule ? rule.description : `Rule ${result.ruleId}`;
    });

    return { allowed, reasons };
  }

  async validateTaskAssignment(
    task: Task, 
    agent: Agent
  ): Promise<{ allowed: boolean; reasons: string[] }> {
    const evaluationContext: RuleEvaluationContext = {
      agent,
      task,
      action: 'assign_task',
      timestamp: new Date()
    };

    const results = await this.evaluateRules(evaluationContext);
    const blockingResults = results.filter(result => 
      result.matched && 
      result.actions.some(action => action.type === ActionType.BLOCK_ACTION)
    );

    const allowed = blockingResults.length === 0;
    const reasons = blockingResults.map(result => {
      const rule = this.rules.get(result.ruleId);
      return rule ? rule.description : `Rule ${result.ruleId}`;
    });

    return { allowed, reasons };
  }

  async validateResourceAccess(
    agent: Agent, 
    resources: string[]
  ): Promise<{ allowed: boolean; reasons: string[] }> {
    const evaluationContext: RuleEvaluationContext = {
      agent,
      resources,
      action: 'access_resources',
      timestamp: new Date()
    };

    const results = await this.evaluateRules(evaluationContext);
    const blockingResults = results.filter(result => 
      result.matched && 
      result.actions.some(action => action.type === ActionType.BLOCK_ACTION)
    );

    const allowed = blockingResults.length === 0;
    const reasons = blockingResults.map(result => {
      const rule = this.rules.get(result.ruleId);
      return rule ? rule.description : `Rule ${result.ruleId}`;
    });

    return { allowed, reasons };
  }

  // Private helper methods
  private getApplicableRules(context: RuleEvaluationContext): CollaborationRule[] {
    return Array.from(this.rules.values())
      .filter(rule => rule.enabled)
      .sort((a, b) => b.priority - a.priority);
  }

  private async evaluateConditions(
    conditions: RuleCondition[], 
    context: RuleEvaluationContext
  ): Promise<boolean> {
    if (conditions.length === 0) {
      return true;
    }

    let result = true;
    let currentLogicalOp: LogicalOperator = LogicalOperator.AND;

    for (let i = 0; i < conditions.length; i++) {
      const condition = conditions[i];
      const conditionResult = this.evaluateCondition(condition, context);

      if (i === 0) {
        result = conditionResult;
      } else {
        if (currentLogicalOp === LogicalOperator.AND) {
          result = result && conditionResult;
        } else {
          result = result || conditionResult;
        }
      }

      // Set logical operator for next iteration
      if (condition.logicalOperator) {
        currentLogicalOp = condition.logicalOperator;
      }
    }

    return result;
  }

  private evaluateCondition(condition: RuleCondition, context: RuleEvaluationContext): boolean {
    const fieldValue = this.getFieldValue(condition.field, context);
    
    switch (condition.operator) {
      case ConditionOperator.EQUALS:
        return fieldValue === condition.value;
      case ConditionOperator.NOT_EQUALS:
        return fieldValue !== condition.value;
      case ConditionOperator.GREATER_THAN:
        return fieldValue > condition.value;
      case ConditionOperator.LESS_THAN:
        return fieldValue < condition.value;
      case ConditionOperator.GREATER_EQUAL:
        return fieldValue >= condition.value;
      case ConditionOperator.LESS_EQUAL:
        return fieldValue <= condition.value;
      case ConditionOperator.CONTAINS:
        return Array.isArray(fieldValue) 
          ? fieldValue.includes(condition.value)
          : String(fieldValue).includes(String(condition.value));
      case ConditionOperator.NOT_CONTAINS:
        return Array.isArray(fieldValue) 
          ? !fieldValue.includes(condition.value)
          : !String(fieldValue).includes(String(condition.value));
      case ConditionOperator.IN:
        return Array.isArray(condition.value) && condition.value.includes(fieldValue);
      case ConditionOperator.NOT_IN:
        return Array.isArray(condition.value) && !condition.value.includes(fieldValue);
      case ConditionOperator.MATCHES:
        const regex = new RegExp(condition.value);
        return regex.test(String(fieldValue));
      default:
        return false;
    }
  }

  private getFieldValue(field: string, context: RuleEvaluationContext): any {
    const parts = field.split('.');
    let value: any = context;

    for (const part of parts) {
      if (value && typeof value === 'object' && part in value) {
        value = value[part];
      } else {
        return undefined;
      }
    }

    return value;
  }

  private async executeAction(action: RuleAction, context: RuleEvaluationContext): Promise<void> {
    switch (action.type) {
      case ActionType.ASSIGN_AGENT:
        await this.executeAssignAgentAction(action, context);
        break;
      case ActionType.BLOCK_ACTION:
        await this.executeBlockAction(action, context);
        break;
      case ActionType.SET_PRIORITY:
        await this.executeSetPriorityAction(action, context);
        break;
      case ActionType.LIMIT_RESOURCES:
        await this.executeLimitResourcesAction(action, context);
        break;
      case ActionType.NOTIFY:
        await this.executeNotifyAction(action, context);
        break;
      case ActionType.LOG:
        await this.executeLogAction(action, context);
        break;
      case ActionType.ESCALATE:
        await this.executeEscalateAction(action, context);
        break;
      case ActionType.REDIRECT:
        await this.executeRedirectAction(action, context);
        break;
    }
  }

  private async executeAssignAgentAction(action: RuleAction, context: RuleEvaluationContext): Promise<void> {
    this.emit('actionExecuted', {
      type: ActionType.ASSIGN_AGENT,
      parameters: action.parameters,
      context
    });
  }

  private async executeBlockAction(action: RuleAction, context: RuleEvaluationContext): Promise<void> {
    this.emit('actionExecuted', {
      type: ActionType.BLOCK_ACTION,
      parameters: action.parameters,
      context
    });
  }

  private async executeSetPriorityAction(action: RuleAction, context: RuleEvaluationContext): Promise<void> {
    this.emit('actionExecuted', {
      type: ActionType.SET_PRIORITY,
      parameters: action.parameters,
      context
    });
  }

  private async executeLimitResourcesAction(action: RuleAction, context: RuleEvaluationContext): Promise<void> {
    this.emit('actionExecuted', {
      type: ActionType.LIMIT_RESOURCES,
      parameters: action.parameters,
      context
    });
  }

  private async executeNotifyAction(action: RuleAction, context: RuleEvaluationContext): Promise<void> {
    this.emit('actionExecuted', {
      type: ActionType.NOTIFY,
      parameters: action.parameters,
      context
    });
  }

  private async executeLogAction(action: RuleAction, context: RuleEvaluationContext): Promise<void> {
    console.log(`Rule action log: ${action.parameters.message}`, {
      context,
      timestamp: new Date()
    });
  }

  private async executeEscalateAction(action: RuleAction, context: RuleEvaluationContext): Promise<void> {
    this.emit('actionExecuted', {
      type: ActionType.ESCALATE,
      parameters: action.parameters,
      context
    });
  }

  private async executeRedirectAction(action: RuleAction, context: RuleEvaluationContext): Promise<void> {
    this.emit('actionExecuted', {
      type: ActionType.REDIRECT,
      parameters: action.parameters,
      context
    });
  }

  private validateRule(rule: CollaborationRule): void {
    if (!rule.id || !rule.name) {
      throw new Error('Rule must have id and name');
    }

    if (!Object.values(RuleType).includes(rule.type)) {
      throw new Error(`Invalid rule type: ${rule.type}`);
    }

    if (!Array.isArray(rule.conditions)) {
      throw new Error('Rule conditions must be an array');
    }

    if (!Array.isArray(rule.actions)) {
      throw new Error('Rule actions must be an array');
    }

    // Validate conditions
    for (const condition of rule.conditions) {
      if (!condition.field || !condition.operator) {
        throw new Error('Condition must have field and operator');
      }

      if (!Object.values(ConditionOperator).includes(condition.operator)) {
        throw new Error(`Invalid condition operator: ${condition.operator}`);
      }
    }

    // Validate actions
    for (const action of rule.actions) {
      if (!Object.values(ActionType).includes(action.type)) {
        throw new Error(`Invalid action type: ${action.type}`);
      }
    }
  }

  private validatePolicySet(policySet: PolicySet): void {
    if (!policySet.id || !policySet.name) {
      throw new Error('Policy set must have id and name');
    }

    if (!Array.isArray(policySet.rules)) {
      throw new Error('Policy set rules must be an array');
    }

    // Validate that all referenced rules exist
    for (const ruleId of policySet.rules) {
      if (!this.rules.has(ruleId)) {
        throw new Error(`Policy set references non-existent rule: ${ruleId}`);
      }
    }
  }

  private addToHistory(result: RuleEvaluationResult): void {
    this.ruleEvaluationHistory.push(result);
    
    // Maintain history size limit
    if (this.ruleEvaluationHistory.length > this.maxHistorySize) {
      this.ruleEvaluationHistory.shift();
    }
  }

  private initializeDefaultRules(): void {
    // Default rule: Prevent agent overload
    const agentOverloadRule: CollaborationRule = {
      id: 'agent-overload-prevention',
      name: 'Agent Overload Prevention',
      description: 'Prevent assigning tasks to agents that are already overloaded',
      type: RuleType.AGENT_ASSIGNMENT,
      conditions: [
        {
          field: 'agent.workload',
          operator: ConditionOperator.GREATER_THAN,
          value: 0.8
        }
      ],
      actions: [
        {
          type: ActionType.BLOCK_ACTION,
          parameters: { reason: 'Agent is overloaded' }
        }
      ],
      priority: 100,
      enabled: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Default rule: High priority task escalation
    const highPriorityRule: CollaborationRule = {
      id: 'high-priority-escalation',
      name: 'High Priority Task Escalation',
      description: 'Escalate high priority tasks that are not assigned within 5 minutes',
      type: RuleType.TASK_PRIORITY,
      conditions: [
        {
          field: 'task.priority',
          operator: ConditionOperator.EQUALS,
          value: TaskPriority.CRITICAL
        }
      ],
      actions: [
        {
          type: ActionType.ESCALATE,
          parameters: { escalationLevel: 'high' }
        }
      ],
      priority: 90,
      enabled: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Default rule: Resource access control
    const resourceAccessRule: CollaborationRule = {
      id: 'resource-access-control',
      name: 'Resource Access Control',
      description: 'Limit concurrent resource access per agent',
      type: RuleType.RESOURCE_ACCESS,
      conditions: [
        {
          field: 'resources.length',
          operator: ConditionOperator.GREATER_THAN,
          value: 5
        }
      ],
      actions: [
        {
          type: ActionType.LIMIT_RESOURCES,
          parameters: { maxResources: 5 }
        }
      ],
      priority: 80,
      enabled: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.rules.set(agentOverloadRule.id, agentOverloadRule);
    this.rules.set(highPriorityRule.id, highPriorityRule);
    this.rules.set(resourceAccessRule.id, resourceAccessRule);
  }

  // Statistics and monitoring
  getRuleEvaluationHistory(): RuleEvaluationResult[] {
    return [...this.ruleEvaluationHistory];
  }

  getRuleStatistics(): Record<string, any> {
    const stats = {
      totalRules: this.rules.size,
      enabledRules: Array.from(this.rules.values()).filter(rule => rule.enabled).length,
      rulesByType: {} as Record<string, number>,
      evaluationHistory: this.ruleEvaluationHistory.length,
      recentEvaluations: this.ruleEvaluationHistory.slice(-10)
    };

    // Count rules by type
    for (const rule of this.rules.values()) {
      stats.rulesByType[rule.type] = (stats.rulesByType[rule.type] || 0) + 1;
    }

    return stats;
  }

  clearHistory(): void {
    this.ruleEvaluationHistory = [];
  }
}
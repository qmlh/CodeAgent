/**
 * Workflow Orchestration and State Machine implementation
 * Handles complex multi-agent workflows and coordination
 */

import { EventEmitter } from 'events';
import { 
  WorkflowConfig, 
  WorkflowStep, 
  WorkflowTrigger, 
  WorkflowCondition 
} from '../types/config.types';
import { AgentType } from '../types/agent.types';
import { IAgent } from '../core/interfaces/IAgent';

export enum WorkflowState {
  PENDING = 'pending',
  RUNNING = 'running',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

export enum StepState {
  WAITING = 'waiting',
  READY = 'ready',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  SKIPPED = 'skipped'
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

export class WorkflowOrchestrator extends EventEmitter {
  private executions: Map<string, WorkflowExecution> = new Map();
  private workflows: Map<string, WorkflowConfig> = new Map();
  private stepExecutions: Map<string, Map<string, StepExecution>> = new Map();
  private stateMachine: WorkflowStateMachine;
  private agentProvider: (type?: AgentType) => Promise<IAgent[]>;

  constructor(agentProvider: (type?: AgentType) => Promise<IAgent[]>) {
    super();
    this.agentProvider = agentProvider;
    this.stateMachine = {
      currentState: WorkflowState.PENDING,
      allowedTransitions: new Map(),
      transitionHandlers: new Map()
    };
    this.initializeStateMachine();
  }

  // Workflow management
  registerWorkflow(workflow: WorkflowConfig): void {
    this.validateWorkflow(workflow);
    this.workflows.set(workflow.id, workflow);
  }

  unregisterWorkflow(workflowId: string): void {
    this.workflows.delete(workflowId);
  }

  getWorkflow(workflowId: string): WorkflowConfig | undefined {
    return this.workflows.get(workflowId);
  }

  getAllWorkflows(): WorkflowConfig[] {
    return Array.from(this.workflows.values());
  }

  // Workflow execution
  async executeWorkflow(
    workflowId: string, 
    context: Record<string, any> = {}
  ): Promise<WorkflowExecution> {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) {
      throw new Error(`Workflow ${workflowId} not found`);
    }

    const executionId = this.generateExecutionId();
    const execution: WorkflowExecution = {
      id: executionId,
      workflowId,
      state: WorkflowState.PENDING,
      currentStepIndex: 0,
      stepStates: new Map(),
      context: { ...context },
      startTime: new Date(),
      executionLog: []
    };

    // Initialize step states
    workflow.steps.forEach(step => {
      execution.stepStates.set(step.id, StepState.WAITING);
    });

    this.executions.set(executionId, execution);
    this.stepExecutions.set(executionId, new Map());

    this.logExecution(execution, 'info', `Workflow execution started`, { workflowId, context });

    try {
      await this.transitionState(execution, WorkflowState.RUNNING);
      await this.executeWorkflowSteps(execution, workflow);
      
      if (execution.state === WorkflowState.RUNNING) {
        await this.transitionState(execution, WorkflowState.COMPLETED);
      }
    } catch (error) {
      execution.error = error as Error;
      await this.transitionState(execution, WorkflowState.FAILED);
      throw error;
    }

    return execution;
  }

  async pauseExecution(executionId: string): Promise<void> {
    const execution = this.executions.get(executionId);
    if (!execution) {
      throw new Error(`Execution ${executionId} not found`);
    }

    if (execution.state === WorkflowState.RUNNING) {
      await this.transitionState(execution, WorkflowState.PAUSED);
    }
  }

  async resumeExecution(executionId: string): Promise<void> {
    const execution = this.executions.get(executionId);
    if (!execution) {
      throw new Error(`Execution ${executionId} not found`);
    }

    if (execution.state === WorkflowState.PAUSED) {
      await this.transitionState(execution, WorkflowState.RUNNING);
      
      const workflow = this.workflows.get(execution.workflowId);
      if (workflow) {
        await this.executeWorkflowSteps(execution, workflow);
      }
    }
  }

  async cancelExecution(executionId: string): Promise<void> {
    const execution = this.executions.get(executionId);
    if (!execution) {
      throw new Error(`Execution ${executionId} not found`);
    }

    await this.transitionState(execution, WorkflowState.CANCELLED);
  }

  getExecution(executionId: string): WorkflowExecution | undefined {
    return this.executions.get(executionId);
  }

  getActiveExecutions(): WorkflowExecution[] {
    return Array.from(this.executions.values())
      .filter(exec => exec.state === WorkflowState.RUNNING || exec.state === WorkflowState.PAUSED);
  }

  // Step execution
  private async executeWorkflowSteps(
    execution: WorkflowExecution, 
    workflow: WorkflowConfig
  ): Promise<void> {
    while (execution.currentStepIndex < workflow.steps.length && 
           execution.state === WorkflowState.RUNNING) {
      
      const step = workflow.steps[execution.currentStepIndex];
      
      // Check if step dependencies are satisfied
      if (!await this.areStepDependenciesSatisfied(step, execution)) {
        // Wait for dependencies or skip if they can't be satisfied
        await this.handleDependencyWait(step, execution);
        continue;
      }

      // Execute the step
      await this.executeStep(step, execution, workflow);
      
      // Move to next step if current step completed successfully
      const stepState = execution.stepStates.get(step.id);
      if (stepState === StepState.COMPLETED) {
        execution.currentStepIndex++;
      } else if (stepState === StepState.FAILED) {
        throw new Error(`Step ${step.id} failed`);
      }
    }
  }

  private async executeStep(
    step: WorkflowStep, 
    execution: WorkflowExecution,
    workflow: WorkflowConfig
  ): Promise<void> {
    const stepExecution: StepExecution = {
      stepId: step.id,
      state: StepState.READY,
      startTime: new Date(),
      retryCount: 0
    };

    const executionSteps = this.stepExecutions.get(execution.id)!;
    executionSteps.set(step.id, stepExecution);

    this.logExecution(execution, 'info', `Executing step: ${step.name}`, { stepId: step.id });

    try {
      // Update step state
      execution.stepStates.set(step.id, StepState.RUNNING);
      stepExecution.state = StepState.RUNNING;

      // Find appropriate agent for the step
      const agent = await this.findAgentForStep(step, execution);
      if (agent) {
        stepExecution.agentId = agent.id;
      }

      // Execute step action
      const result = await this.executeStepAction(step, agent, execution);
      
      // Update step completion
      stepExecution.result = result;
      stepExecution.endTime = new Date();
      stepExecution.state = StepState.COMPLETED;
      execution.stepStates.set(step.id, StepState.COMPLETED);

      this.logExecution(execution, 'info', `Step completed: ${step.name}`, { 
        stepId: step.id, 
        agentId: agent?.id,
        result 
      });

    } catch (error) {
      stepExecution.error = error as Error;
      stepExecution.endTime = new Date();
      stepExecution.state = StepState.FAILED;
      execution.stepStates.set(step.id, StepState.FAILED);

      this.logExecution(execution, 'error', `Step failed: ${step.name}`, { 
        stepId: step.id, 
        error: (error as Error).message 
      });

      // Check if step should be retried
      if (await this.shouldRetryStep(step, stepExecution, execution)) {
        await this.retryStep(step, execution);
      } else {
        throw error;
      }
    }
  }

  private async findAgentForStep(
    step: WorkflowStep, 
    execution: WorkflowExecution
  ): Promise<IAgent | null> {
    try {
      const agents = step.agentType 
        ? await this.agentProvider(step.agentType as AgentType)
        : await this.agentProvider();

      if (agents.length === 0) {
        this.logExecution(execution, 'warn', `No agents available for step: ${step.name}`, { 
          stepId: step.id, 
          requiredType: step.agentType 
        });
        return null;
      }

      // Select the best agent based on workload and capabilities
      const bestAgent = agents.reduce((best, current) => {
        const bestWorkload = best.getWorkload();
        const currentWorkload = current.getWorkload();
        return currentWorkload < bestWorkload ? current : best;
      });

      return bestAgent;
    } catch (error) {
      this.logExecution(execution, 'error', `Failed to find agent for step: ${step.name}`, { 
        stepId: step.id, 
        error: (error as Error).message 
      });
      return null;
    }
  }

  private async executeStepAction(
    step: WorkflowStep, 
    agent: IAgent | null, 
    execution: WorkflowExecution
  ): Promise<any> {
    // This is a simplified implementation
    // In a real system, this would dispatch to appropriate handlers based on action type
    
    const actionContext = {
      ...execution.context,
      stepId: step.id,
      stepName: step.name,
      parameters: step.parameters
    };

    if (agent) {
      // If we have an agent, delegate the action to it
      // This would typically involve creating a task and having the agent execute it
      this.logExecution(execution, 'info', `Delegating action to agent: ${agent.id}`, {
        stepId: step.id,
        action: step.action,
        agentId: agent.id
      });
      
      // Simulate action execution
      return { success: true, agentId: agent.id, action: step.action };
    } else {
      // Execute action directly (system actions)
      this.logExecution(execution, 'info', `Executing system action: ${step.action}`, {
        stepId: step.id,
        action: step.action
      });
      
      return { success: true, action: step.action, type: 'system' };
    }
  }

  private async areStepDependenciesSatisfied(
    step: WorkflowStep, 
    execution: WorkflowExecution
  ): Promise<boolean> {
    if (!step.dependencies || step.dependencies.length === 0) {
      return true;
    }

    for (const dependencyId of step.dependencies) {
      const dependencyState = execution.stepStates.get(dependencyId);
      if (dependencyState !== StepState.COMPLETED) {
        return false;
      }
    }

    return true;
  }

  private async handleDependencyWait(
    step: WorkflowStep, 
    execution: WorkflowExecution
  ): Promise<void> {
    this.logExecution(execution, 'info', `Waiting for dependencies: ${step.name}`, {
      stepId: step.id,
      dependencies: step.dependencies
    });

    // In a real implementation, this might involve waiting for events
    // or checking dependencies periodically
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  private async shouldRetryStep(
    step: WorkflowStep, 
    stepExecution: StepExecution, 
    execution: WorkflowExecution
  ): Promise<boolean> {
    const maxRetries = step.parameters?.maxRetries || 3;
    return stepExecution.retryCount < maxRetries;
  }

  private async retryStep(
    step: WorkflowStep, 
    execution: WorkflowExecution
  ): Promise<void> {
    const executionSteps = this.stepExecutions.get(execution.id)!;
    const stepExecution = executionSteps.get(step.id)!;
    
    stepExecution.retryCount++;
    stepExecution.state = StepState.READY;
    execution.stepStates.set(step.id, StepState.WAITING);

    this.logExecution(execution, 'info', `Retrying step: ${step.name}`, {
      stepId: step.id,
      retryCount: stepExecution.retryCount
    });

    // Wait before retry
    const retryDelay = step.parameters?.retryDelay || 5000;
    await new Promise(resolve => setTimeout(resolve, retryDelay));
  }

  // State machine
  private initializeStateMachine(): void {
    this.stateMachine = {
      currentState: WorkflowState.PENDING,
      allowedTransitions: new Map([
        [WorkflowState.PENDING, [WorkflowState.RUNNING, WorkflowState.CANCELLED]],
        [WorkflowState.RUNNING, [WorkflowState.PAUSED, WorkflowState.COMPLETED, WorkflowState.FAILED, WorkflowState.CANCELLED]],
        [WorkflowState.PAUSED, [WorkflowState.RUNNING, WorkflowState.CANCELLED]],
        [WorkflowState.COMPLETED, []],
        [WorkflowState.FAILED, []],
        [WorkflowState.CANCELLED, []]
      ]),
      transitionHandlers: new Map()
    };

    // Register transition handlers
    this.stateMachine.transitionHandlers.set('PENDING->RUNNING', this.handleStartExecution.bind(this));
    this.stateMachine.transitionHandlers.set('RUNNING->PAUSED', this.handlePauseExecution.bind(this));
    this.stateMachine.transitionHandlers.set('PAUSED->RUNNING', this.handleResumeExecution.bind(this));
    this.stateMachine.transitionHandlers.set('RUNNING->COMPLETED', this.handleCompleteExecution.bind(this));
    this.stateMachine.transitionHandlers.set('RUNNING->FAILED', this.handleFailExecution.bind(this));
    this.stateMachine.transitionHandlers.set('*->CANCELLED', this.handleCancelExecution.bind(this));
  }

  private async transitionState(
    execution: WorkflowExecution, 
    newState: WorkflowState
  ): Promise<void> {
    const currentState = execution.state;
    const allowedStates = this.stateMachine.allowedTransitions.get(currentState) || [];
    
    if (!allowedStates.includes(newState)) {
      throw new Error(`Invalid state transition from ${currentState} to ${newState}`);
    }

    const transitionKey = `${currentState}->${newState}`;
    const wildcardKey = `*->${newState}`;
    
    const handler = this.stateMachine.transitionHandlers.get(transitionKey) || 
                   this.stateMachine.transitionHandlers.get(wildcardKey);

    if (handler) {
      await handler(execution);
    }

    execution.state = newState;
    this.logExecution(execution, 'info', `State transition: ${currentState} -> ${newState}`);
    
    this.emit('stateChanged', {
      executionId: execution.id,
      oldState: currentState,
      newState,
      timestamp: new Date()
    });
  }

  // State transition handlers
  private async handleStartExecution(execution: WorkflowExecution): Promise<void> {
    this.logExecution(execution, 'info', 'Starting workflow execution');
  }

  private async handlePauseExecution(execution: WorkflowExecution): Promise<void> {
    this.logExecution(execution, 'info', 'Pausing workflow execution');
  }

  private async handleResumeExecution(execution: WorkflowExecution): Promise<void> {
    this.logExecution(execution, 'info', 'Resuming workflow execution');
  }

  private async handleCompleteExecution(execution: WorkflowExecution): Promise<void> {
    execution.endTime = new Date();
    this.logExecution(execution, 'info', 'Workflow execution completed successfully');
  }

  private async handleFailExecution(execution: WorkflowExecution): Promise<void> {
    execution.endTime = new Date();
    this.logExecution(execution, 'error', 'Workflow execution failed', { 
      error: execution.error?.message 
    });
  }

  private async handleCancelExecution(execution: WorkflowExecution): Promise<void> {
    execution.endTime = new Date();
    this.logExecution(execution, 'info', 'Workflow execution cancelled');
  }

  // Workflow validation
  private validateWorkflow(workflow: WorkflowConfig): void {
    if (!workflow.id || !workflow.name) {
      throw new Error('Workflow must have id and name');
    }

    if (!workflow.steps || workflow.steps.length === 0) {
      throw new Error('Workflow must have at least one step');
    }

    // Validate step dependencies
    const stepIds = new Set(workflow.steps.map(step => step.id));
    for (const step of workflow.steps) {
      if (step.dependencies) {
        for (const depId of step.dependencies) {
          if (!stepIds.has(depId)) {
            throw new Error(`Step ${step.id} has invalid dependency: ${depId}`);
          }
        }
      }
    }

    // Check for circular dependencies
    this.checkCircularDependencies(workflow.steps);
  }

  private checkCircularDependencies(steps: WorkflowStep[]): void {
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const hasCycle = (stepId: string, stepMap: Map<string, WorkflowStep>): boolean => {
      if (recursionStack.has(stepId)) {
        return true;
      }
      if (visited.has(stepId)) {
        return false;
      }

      visited.add(stepId);
      recursionStack.add(stepId);

      const step = stepMap.get(stepId);
      if (step && step.dependencies) {
        for (const depId of step.dependencies) {
          if (hasCycle(depId, stepMap)) {
            return true;
          }
        }
      }

      recursionStack.delete(stepId);
      return false;
    };

    const stepMap = new Map(steps.map(step => [step.id, step]));
    for (const step of steps) {
      if (hasCycle(step.id, stepMap)) {
        throw new Error(`Circular dependency detected involving step: ${step.id}`);
      }
    }
  }

  // Utility methods
  private logExecution(
    execution: WorkflowExecution, 
    level: 'info' | 'warn' | 'error', 
    message: string, 
    data?: any
  ): void {
    const logEntry: WorkflowLogEntry = {
      timestamp: new Date(),
      level,
      message,
      data
    };

    execution.executionLog.push(logEntry);
    
    // Emit log event for external listeners
    this.emit('log', {
      executionId: execution.id,
      ...logEntry
    });
  }

  private generateExecutionId(): string {
    return `exec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Cleanup
  async shutdown(): Promise<void> {
    // Cancel all active executions
    const activeExecutions = this.getActiveExecutions();
    await Promise.all(
      activeExecutions.map(exec => this.cancelExecution(exec.id))
    );

    // Clear all data
    this.executions.clear();
    this.workflows.clear();
    this.stepExecutions.clear();
  }
}
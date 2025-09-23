/**
 * Configuration type definitions
 */
export interface SystemConfig {
    maxAgents: number;
    maxConcurrentTasks: number;
    taskTimeout: number;
    fileLockTimeout: number;
    heartbeatInterval: number;
    retryAttempts: number;
    logLevel: 'debug' | 'info' | 'warn' | 'error';
}
export interface ProjectConfig {
    name: string;
    rootPath: string;
    collaborationMode: 'serial' | 'parallel' | 'hybrid';
    codeStandards: Record<string, any>;
    reviewProcess: {
        required: boolean;
        reviewers: string[];
        autoApprove: boolean;
    };
    qualityStandards: {
        testCoverage: number;
        codeComplexity: number;
        documentation: boolean;
    };
}
export interface WorkflowConfig {
    id: string;
    name: string;
    steps: WorkflowStep[];
    triggers: WorkflowTrigger[];
    conditions: WorkflowCondition[];
}
export interface WorkflowStep {
    id: string;
    name: string;
    agentType?: string;
    action: string;
    parameters: Record<string, any>;
    dependencies: string[];
}
export interface WorkflowTrigger {
    event: string;
    condition?: string;
    parameters?: Record<string, any>;
}
export interface WorkflowCondition {
    field: string;
    operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains';
    value: any;
}
//# sourceMappingURL=config.types.d.ts.map
/**
 * Coordination Manager interface definition
 */
import { Agent, AgentConfig, AgentType } from '../../types/agent.types';
import { CollaborationSession } from '../../types/message.types';
import { WorkflowConfig } from '../../types/config.types';
export interface ICoordinationManager {
    createAgent(config: AgentConfig): Promise<Agent>;
    destroyAgent(agentId: string): Promise<void>;
    getAgent(agentId: string): Promise<Agent | null>;
    getAllAgents(): Promise<Agent[]>;
    getAgentsByType(type: AgentType): Promise<Agent[]>;
    registerAgent(agent: Agent): Promise<void>;
    unregisterAgent(agentId: string): Promise<void>;
    discoverAgents(capabilities?: string[]): Promise<Agent[]>;
    checkAgentHealth(agentId: string): Promise<boolean>;
    restartAgent(agentId: string): Promise<void>;
    performHealthCheck(): Promise<{
        healthy: Agent[];
        unhealthy: Agent[];
    }>;
    startCollaboration(participants: string[], sharedFiles: string[]): Promise<CollaborationSession>;
    endCollaboration(sessionId: string): Promise<void>;
    getActiveCollaborations(): Promise<CollaborationSession[]>;
    joinCollaboration(sessionId: string, agentId: string): Promise<void>;
    leaveCollaboration(sessionId: string, agentId: string): Promise<void>;
    executeWorkflow(workflowConfig: WorkflowConfig, context: Record<string, any>): Promise<void>;
    pauseWorkflow(workflowId: string): Promise<void>;
    resumeWorkflow(workflowId: string): Promise<void>;
    getWorkflowStatus(workflowId: string): Promise<string>;
    allocateResources(agentId: string, resources: string[]): Promise<void>;
    deallocateResources(agentId: string, resources: string[]): Promise<void>;
    getResourceUsage(): Promise<Record<string, string[]>>;
    coordinateAgentActions(agentIds: string[], action: string, parameters?: any): Promise<void>;
    synchronizeAgentStates(): Promise<void>;
    updateCollaborationRules(rules: Record<string, any>): Promise<void>;
    getCollaborationRules(): Promise<Record<string, any>>;
    validateAgentAction(agentId: string, action: string, context: any): Promise<boolean>;
}
//# sourceMappingURL=ICoordinationManager.d.ts.map
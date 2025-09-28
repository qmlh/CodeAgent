/**
 * Agent Health Monitor
 * Monitors agent health, detects failures, and handles recovery
 */
import { EventEmitter } from 'events';
import { IAgent } from '../core/interfaces/IAgent';
import { AgentStatus } from '../types/agent.types';
import { ErrorSeverity } from '../types/error.types';
export interface HealthCheckConfig {
    interval: number;
    timeout: number;
    retryAttempts: number;
    retryDelay: number;
    failureThreshold: number;
    recoveryThreshold: number;
}
export interface AgentHealthMetrics {
    agentId: string;
    isHealthy: boolean;
    lastCheckTime: Date;
    responseTime: number;
    errorCount: number;
    consecutiveFailures: number;
    consecutiveSuccesses: number;
    uptime: number;
    lastError?: Error;
    healthScore: number;
    status: AgentStatus;
}
export interface HealthCheckResult {
    agentId: string;
    success: boolean;
    responseTime: number;
    timestamp: Date;
    error?: Error;
    details?: Record<string, any>;
}
export interface RecoveryAction {
    type: RecoveryActionType;
    agentId: string;
    timestamp: Date;
    parameters?: Record<string, any>;
    result?: RecoveryResult;
}
export declare enum RecoveryActionType {
    RESTART = "restart",
    RESET = "reset",
    ESCALATE = "escalate",
    ISOLATE = "isolate",
    REPLACE = "replace"
}
export interface RecoveryResult {
    success: boolean;
    message: string;
    newAgentId?: string;
    error?: Error;
}
export interface HealthAlert {
    id: string;
    agentId: string;
    severity: ErrorSeverity;
    type: AlertType;
    message: string;
    timestamp: Date;
    acknowledged: boolean;
    resolvedAt?: Date;
    metadata?: Record<string, any>;
}
export declare enum AlertType {
    HEALTH_DEGRADED = "health_degraded",
    AGENT_UNRESPONSIVE = "agent_unresponsive",
    HIGH_ERROR_RATE = "high_error_rate",
    PERFORMANCE_DEGRADED = "performance_degraded",
    RECOVERY_FAILED = "recovery_failed",
    AGENT_OFFLINE = "agent_offline"
}
export declare class AgentHealthMonitor extends EventEmitter {
    private agents;
    private healthMetrics;
    private healthCheckTimers;
    private alerts;
    private recoveryActions;
    private config;
    private isMonitoring;
    constructor(config?: Partial<HealthCheckConfig>);
    initialize(): Promise<void>;
    registerAgent(agent: IAgent): void;
    unregisterAgent(agentId: string): void;
    startMonitoring(): void;
    stopMonitoring(): void;
    private startMonitoringAgent;
    private stopMonitoringAgent;
    performHealthCheck(agentId: string): Promise<HealthCheckResult>;
    private checkAgentHealth;
    private updateHealthMetrics;
    private handleHealthCheckFailure;
    attemptRecovery(agentId: string): Promise<RecoveryResult>;
    private determineRecoveryStrategy;
    private restartAgent;
    private resetAgent;
    private isolateAgent;
    private escalateIssue;
    private replaceAgent;
    private createHealthAlert;
    private createRecoveryFailureAlert;
    private resolveAgentAlerts;
    getAgentHealth(agentId: string): AgentHealthMetrics | undefined;
    getAllAgentHealth(): AgentHealthMetrics[];
    getHealthyAgents(): AgentHealthMetrics[];
    getUnhealthyAgents(): AgentHealthMetrics[];
    getAlerts(agentId?: string): HealthAlert[];
    acknowledgeAlert(alertId: string): void;
    getRecoveryHistory(agentId?: string): RecoveryAction[];
    getHealthStatistics(): Record<string, any>;
    private generateAlertId;
    shutdown(): Promise<void>;
}

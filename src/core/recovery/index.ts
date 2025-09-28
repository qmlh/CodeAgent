/**
 * Recovery System Exports
 * Automatic recovery and failover system for multi-agent IDE
 */

// Core recovery components
export { AutoRecoveryManager, RecoveryAction } from './AutoRecoveryManager';
export type { 
  AgentHealthMetrics, 
  AutoRecoveryConfig, 
  RecoveryEvent, 
  SystemHealthStatus 
} from './AutoRecoveryManager';

export { FailoverCoordinator, FailoverStrategy } from './FailoverCoordinator';
export type { 
  FailoverConfig, 
  TaskReassignmentCriteria, 
  AgentStateSnapshot, 
  TaskCheckpoint, 
  FailoverEvent 
} from './FailoverCoordinator';

export { SystemHealthMonitor, HealthCheckType, HealthStatus } from './SystemHealthMonitor';
export type { 
  HealthCheckResult, 
  SystemMetrics, 
  HealthAlert, 
  SelfHealingAction, 
  HealthMonitorConfig 
} from './SystemHealthMonitor';

// Re-export error recovery components for convenience
export { ErrorRecoveryManager } from '../errors/ErrorRecoveryManager';
export type { ErrorRecoveryEvent } from '../errors/ErrorRecoveryManager';

export type { IErrorRecoveryStrategy } from '../errors/ErrorRecoveryStrategy';
export { 
  BaseRecoveryStrategy,
  AgentRecoveryStrategy,
  TaskRecoveryStrategy,
  FileRecoveryStrategy,
  CommunicationRecoveryStrategy,
  FallbackRecoveryStrategy
} from '../errors/ErrorRecoveryStrategy';
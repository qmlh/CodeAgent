# Automatic Recovery and Failover System

This module implements a comprehensive automatic recovery and failover system for the multi-agent IDE. It provides agent fault detection, automatic restart mechanisms, task reassignment, state recovery, and system self-healing capabilities.

## Components

### AutoRecoveryManager

The main recovery coordinator that handles:
- Agent health monitoring and failure detection
- Automatic agent restart mechanisms
- System-wide health assessment
- Recovery attempt tracking and escalation
- Integration with error recovery strategies

**Key Features:**
- Configurable failure thresholds and recovery attempts
- Health metrics tracking (response time, resource usage, success rates)
- Automatic and manual recovery triggers
- System health status reporting
- Event-driven recovery notifications

### FailoverCoordinator

Handles task reassignment and state recovery during agent failures:
- Multiple failover strategies (immediate, graceful, delayed, manual)
- Intelligent task reassignment based on agent capabilities
- Task checkpointing and state recovery
- Agent state snapshots for recovery
- Dependency-aware task reassignment

**Key Features:**
- Task checkpoint creation and restoration
- Agent state backup and recovery
- Configurable failover strategies
- Task reassignment with criteria matching
- Rollback capabilities for failed operations

### SystemHealthMonitor

Provides comprehensive system health monitoring and self-healing:
- Multi-dimensional health checks (agents, resources, tasks, communication, data)
- Alert management and notification system
- Self-healing action execution
- System metrics collection and analysis
- Health trend analysis and recommendations

**Key Features:**
- Real-time health monitoring across multiple dimensions
- Configurable alert thresholds and self-healing triggers
- Historical health data and trend analysis
- Automated self-healing actions (restart, scale, cleanup, rebalance)
- Integration with recovery and failover systems

## Usage

### Basic Setup

```typescript
import { 
  AutoRecoveryManager, 
  FailoverCoordinator, 
  SystemHealthMonitor 
} from './core/recovery';

// Initialize recovery components
const autoRecoveryManager = new AutoRecoveryManager({
  healthCheckInterval: 30000,
  maxConsecutiveFailures: 3,
  enableAutoRestart: true,
  enableTaskReassignment: true,
  enableSystemSelfHealing: true
}, dependencies);

const failoverCoordinator = new FailoverCoordinator({
  strategy: FailoverStrategy.GRACEFUL,
  enableStateRecovery: true,
  enableTaskCheckpointing: true
}, dependencies);

const systemHealthMonitor = new SystemHealthMonitor({
  checkInterval: 30000,
  enableSelfHealing: true,
  alertThresholds: {
    cpuUsage: 80,
    memoryUsage: 85,
    diskUsage: 90,
    agentResponseTime: 5000,
    taskFailureRate: 0.1
  }
}, {
  autoRecoveryManager,
  failoverCoordinator,
  ...otherDependencies
});
```

### Agent Health Monitoring

```typescript
// Register agents for monitoring
autoRecoveryManager.registerAgent('agent-1');
autoRecoveryManager.registerAgent('agent-2');

// Update health metrics
autoRecoveryManager.updateAgentHealth('agent-1', {
  responseTime: 1500,
  memoryUsage: 65,
  cpuUsage: 45,
  taskSuccessRate: 0.95
});

// Report agent failures
await autoRecoveryManager.reportAgentFailure('agent-1', new Error('Connection timeout'));

// Force recovery
const result = await autoRecoveryManager.forceAgentRecovery('agent-1');
```

### Task Checkpointing and Recovery

```typescript
// Create task checkpoints
await failoverCoordinator.createTaskCheckpoint(
  'task-123',
  'agent-1',
  0.75, // 75% complete
  { processedItems: 750, totalItems: 1000 },
  ['finalize', 'cleanup']
);

// Initiate failover
await failoverCoordinator.initiateFailover('failed-agent', 'Hardware failure');

// Reassign tasks with criteria
const reassignments = await failoverCoordinator.reassignTasks(
  failedTasks,
  'failed-agent',
  {
    agentType: AgentType.FRONTEND,
    maxWorkload: 70,
    prioritizeBy: 'workload'
  }
);
```

### Health Monitoring and Self-Healing

```typescript
// Perform health checks
const healthResults = await systemHealthMonitor.performHealthChecks();

// Get system health status
const healthStatus = await systemHealthMonitor.getSystemHealthStatus();

// Trigger self-healing actions
const actionId = await systemHealthMonitor.triggerSelfHealingAction(
  'restart_agent',
  'problematic-agent'
);

// Handle alerts
const activeAlerts = systemHealthMonitor.getActiveAlerts();
systemHealthMonitor.acknowledgeAlert(activeAlerts[0].id);
```

### Event Handling

```typescript
// Listen to recovery events
autoRecoveryManager.on('recovery', (event) => {
  console.log(`Recovery event: ${event.type} for agent ${event.agentId}`);
});

// Listen to failover events
failoverCoordinator.on('failover', (event) => {
  console.log(`Failover event: ${event.type} for agent ${event.agentId}`);
});

// Listen to health alerts
systemHealthMonitor.on('alert_created', (alert) => {
  console.log(`Health alert: ${alert.title} - ${alert.message}`);
});

// Listen to self-healing actions
systemHealthMonitor.on('self_healing_action_started', (action) => {
  console.log(`Self-healing action started: ${action.type}`);
});
```

## Configuration

### AutoRecoveryManager Configuration

```typescript
interface AutoRecoveryConfig {
  healthCheckInterval: number;        // Health check frequency (ms)
  maxConsecutiveFailures: number;     // Failure threshold before recovery
  agentRestartTimeout: number;        // Timeout for agent restart (ms)
  taskReassignmentDelay: number;      // Delay before task reassignment (ms)
  systemHealthThreshold: number;      // System health threshold (0-100)
  enableAutoRestart: boolean;         // Enable automatic agent restart
  enableTaskReassignment: boolean;    // Enable automatic task reassignment
  enableSystemSelfHealing: boolean;   // Enable system self-healing
  maxRecoveryAttempts: number;        // Maximum recovery attempts per agent
  recoveryBackoffMultiplier: number;  // Backoff multiplier for retries
}
```

### FailoverCoordinator Configuration

```typescript
interface FailoverConfig {
  strategy: FailoverStrategy;           // Failover strategy
  gracefulShutdownTimeout: number;      // Graceful shutdown timeout (ms)
  taskReassignmentTimeout: number;      // Task reassignment timeout (ms)
  stateBackupInterval: number;          // State backup frequency (ms)
  maxReassignmentAttempts: number;      // Maximum reassignment attempts
  enableStateRecovery: boolean;         // Enable state recovery
  enableTaskCheckpointing: boolean;     // Enable task checkpointing
}
```

### SystemHealthMonitor Configuration

```typescript
interface HealthMonitorConfig {
  checkInterval: number;                // Health check frequency (ms)
  alertThresholds: {                    // Alert thresholds
    cpuUsage: number;                   // CPU usage threshold (%)
    memoryUsage: number;                // Memory usage threshold (%)
    diskUsage: number;                  // Disk usage threshold (%)
    agentResponseTime: number;          // Agent response time threshold (ms)
    taskFailureRate: number;            // Task failure rate threshold (0-1)
  };
  enableSelfHealing: boolean;           // Enable self-healing actions
  selfHealingActions: string[];         // Enabled self-healing actions
  retentionPeriod: number;              // Data retention period (ms)
  maxAlerts: number;                    // Maximum active alerts
}
```

## Recovery Strategies

### Failover Strategies

1. **Immediate**: Immediately reassign all tasks and mark agent as offline
2. **Graceful**: Allow agent to complete current tasks before failover
3. **Delayed**: Wait for a configured delay before initiating failover
4. **Manual**: Flag for manual intervention without automatic actions

### Self-Healing Actions

1. **restart_agent**: Restart a failed or problematic agent
2. **scale_resources**: Scale system resources (CPU, memory)
3. **rebalance_load**: Rebalance workload across healthy agents
4. **cleanup_resources**: Clean up system resources and temporary files
5. **reset_connections**: Reset network connections and communication channels

## Integration

The recovery system integrates with:

- **Agent Management**: For agent lifecycle operations
- **Task Management**: For task reassignment and status updates
- **Coordination Manager**: For system-wide coordination
- **Error Recovery System**: For error handling and recovery strategies
- **Message System**: For inter-component communication
- **File Management**: For state persistence and recovery

## Testing

The system includes comprehensive integration tests covering:

- Agent failure detection and recovery
- Task reassignment and state recovery
- System health monitoring and self-healing
- Concurrent operations and performance
- Error handling and edge cases
- Resource cleanup and memory management

Run tests with:
```bash
npm test -- --testPathPattern="src/core/recovery/__tests__"
```

## Performance Considerations

- Health checks are performed asynchronously to avoid blocking operations
- State snapshots and checkpoints are created incrementally
- Recovery operations are throttled to prevent system overload
- Memory usage is monitored and cleaned up automatically
- Concurrent operations are handled safely with proper synchronization

## Error Handling

The system handles various error scenarios:

- Agent communication failures
- Task execution errors
- Resource exhaustion
- Network partitions
- Concurrent access conflicts
- Configuration errors

All errors are logged, classified, and handled according to their severity and recoverability.
# Core APIs

The Core APIs provide the fundamental functionality for the Multi-Agent IDE system. These APIs handle system initialization, configuration management, and core coordination services.

## System Initialization

### SystemInitializer

The `SystemInitializer` class manages the startup and shutdown of the entire system.

```typescript
import { SystemInitializer } from '@multi-agent-ide/core';

interface SystemConfig {
  projectPath: string;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  maxAgents: number;
  enableMetrics: boolean;
}

class SystemInitializer {
  async initialize(config: SystemConfig): Promise<void>;
  async shutdown(): Promise<void>;
  getStatus(): SystemStatus;
}
```

#### Example Usage

```typescript
const initializer = new SystemInitializer();

await initializer.initialize({
  projectPath: './my-project',
  logLevel: 'info',
  maxAgents: 10,
  enableMetrics: true
});

// System is now ready
console.log('System status:', initializer.getStatus());
```

### ConfigurationManager

Manages system-wide configuration and user preferences.

```typescript
interface Configuration {
  system: SystemConfig;
  agents: AgentConfig[];
  ui: UIConfig;
  collaboration: CollaborationConfig;
}

class ConfigurationManager {
  async loadConfiguration(path?: string): Promise<Configuration>;
  async saveConfiguration(config: Configuration): Promise<void>;
  async updateConfiguration(updates: Partial<Configuration>): Promise<void>;
  getConfiguration(): Configuration;
  watchConfiguration(callback: (config: Configuration) => void): void;
}
```

#### Example Usage

```typescript
import { ConfigurationManager } from '@multi-agent-ide/core';

const configManager = new ConfigurationManager();

// Load configuration
const config = await configManager.loadConfiguration('./config.json');

// Update specific settings
await configManager.updateConfiguration({
  system: {
    maxAgents: 15,
    logLevel: 'debug'
  }
});

// Watch for changes
configManager.watchConfiguration((newConfig) => {
  console.log('Configuration updated:', newConfig);
});
```

## Coordination Manager

The central coordinator that manages all agents and their interactions.

```typescript
interface CoordinationManager {
  // Agent Management
  registerAgent(agent: IAgent): Promise<void>;
  unregisterAgent(agentId: string): Promise<void>;
  getAgent(agentId: string): Promise<IAgent | null>;
  getAllAgents(): Promise<IAgent[]>;
  
  // Session Management
  createSession(config: SessionConfig): Promise<CollaborationSession>;
  joinSession(sessionId: string, agentId: string): Promise<void>;
  leaveSession(sessionId: string, agentId: string): Promise<void>;
  endSession(sessionId: string): Promise<void>;
  
  // Coordination
  coordinateTask(task: Task): Promise<TaskAssignment>;
  resolveConflict(conflict: Conflict): Promise<ConflictResolution>;
  broadcastEvent(event: SystemEvent): Promise<void>;
}
```

### Session Management

```typescript
interface SessionConfig {
  name: string;
  description?: string;
  participants: string[];
  sharedFiles: string[];
  rules: CollaborationRule[];
}

interface CollaborationSession {
  id: string;
  name: string;
  participants: string[];
  sharedFiles: string[];
  startTime: Date;
  endTime?: Date;
  status: 'active' | 'paused' | 'completed';
  
  // Methods
  addParticipant(agentId: string): Promise<void>;
  removeParticipant(agentId: string): Promise<void>;
  shareFile(filePath: string): Promise<void>;
  unshareFile(filePath: string): Promise<void>;
  pause(): Promise<void>;
  resume(): Promise<void>;
  end(): Promise<void>;
}
```

#### Example Usage

```typescript
import { CoordinationManager } from '@multi-agent-ide/core';

const coordinator = new CoordinationManager();

// Create a collaboration session
const session = await coordinator.createSession({
  name: 'Feature Development',
  description: 'Implementing user authentication feature',
  participants: ['frontend-agent', 'backend-agent', 'testing-agent'],
  sharedFiles: ['src/**/*.ts', 'tests/**/*.test.ts'],
  rules: [
    {
      type: 'file-access',
      rule: 'one-writer-multiple-readers'
    },
    {
      type: 'task-assignment',
      rule: 'capability-based'
    }
  ]
});

// Add more participants
await session.addParticipant('code-review-agent');

// Share additional files
await session.shareFile('docs/**/*.md');
```

## Event System

The event system enables real-time communication and coordination between components.

```typescript
interface EventManager {
  // Event Publishing
  publish(event: SystemEvent): Promise<void>;
  publishToAgent(agentId: string, event: AgentEvent): Promise<void>;
  
  // Event Subscription
  subscribe(eventType: string, handler: EventHandler): void;
  subscribeToAgent(agentId: string, handler: AgentEventHandler): void;
  unsubscribe(eventType: string, handler: EventHandler): void;
  
  // Event History
  getEventHistory(filter?: EventFilter): Promise<SystemEvent[]>;
  clearEventHistory(): Promise<void>;
}

interface SystemEvent {
  id: string;
  type: string;
  source: string;
  timestamp: Date;
  data: any;
  priority: 'low' | 'medium' | 'high' | 'critical';
}
```

### Event Types

```typescript
// System Events
type SystemEventType = 
  | 'system-started'
  | 'system-stopped'
  | 'agent-registered'
  | 'agent-unregistered'
  | 'session-created'
  | 'session-ended'
  | 'configuration-changed';

// Agent Events
type AgentEventType =
  | 'agent-status-changed'
  | 'task-assigned'
  | 'task-started'
  | 'task-completed'
  | 'task-failed'
  | 'file-locked'
  | 'file-unlocked'
  | 'message-sent'
  | 'message-received';
```

#### Example Usage

```typescript
import { EventManager } from '@multi-agent-ide/core';

const eventManager = new EventManager();

// Subscribe to system events
eventManager.subscribe('agent-registered', (event) => {
  console.log(`New agent registered: ${event.data.agentId}`);
});

// Subscribe to specific agent events
eventManager.subscribeToAgent('frontend-agent', (event) => {
  if (event.type === 'task-completed') {
    console.log(`Frontend agent completed task: ${event.data.taskId}`);
  }
});

// Publish custom events
await eventManager.publish({
  id: 'custom-event-1',
  type: 'custom-notification',
  source: 'user-interface',
  timestamp: new Date(),
  data: { message: 'User clicked refresh button' },
  priority: 'low'
});
```

## Health Monitoring

Monitor system health and performance metrics.

```typescript
interface HealthMonitor {
  // Health Checks
  checkSystemHealth(): Promise<HealthStatus>;
  checkAgentHealth(agentId: string): Promise<AgentHealthStatus>;
  checkComponentHealth(componentName: string): Promise<ComponentHealthStatus>;
  
  // Metrics Collection
  collectMetrics(): Promise<SystemMetrics>;
  getMetricsHistory(timeRange: TimeRange): Promise<MetricsHistory>;
  
  // Alerts
  setHealthAlert(condition: HealthCondition, callback: AlertCallback): void;
  removeHealthAlert(alertId: string): void;
}

interface HealthStatus {
  overall: 'healthy' | 'degraded' | 'unhealthy';
  components: ComponentHealthStatus[];
  agents: AgentHealthStatus[];
  lastCheck: Date;
  issues: HealthIssue[];
}

interface SystemMetrics {
  cpu: number;
  memory: number;
  disk: number;
  network: number;
  activeAgents: number;
  activeTasks: number;
  messageQueueSize: number;
  responseTime: number;
}
```

#### Example Usage

```typescript
import { HealthMonitor } from '@multi-agent-ide/core';

const healthMonitor = new HealthMonitor();

// Check overall system health
const health = await healthMonitor.checkSystemHealth();
console.log('System health:', health.overall);

// Set up health alerts
healthMonitor.setHealthAlert(
  {
    metric: 'memory',
    threshold: 80,
    operator: 'greater-than'
  },
  (alert) => {
    console.warn(`High memory usage: ${alert.value}%`);
  }
);

// Collect current metrics
const metrics = await healthMonitor.collectMetrics();
console.log('Current metrics:', metrics);
```

## Error Handling

Centralized error handling and recovery mechanisms.

```typescript
interface ErrorManager {
  // Error Handling
  handleError(error: Error, context: ErrorContext): Promise<void>;
  registerErrorHandler(errorType: string, handler: ErrorHandler): void;
  
  // Recovery
  attemptRecovery(error: Error): Promise<RecoveryResult>;
  registerRecoveryStrategy(errorType: string, strategy: RecoveryStrategy): void;
  
  // Logging
  logError(error: Error, context: ErrorContext): Promise<void>;
  getErrorHistory(filter?: ErrorFilter): Promise<ErrorRecord[]>;
}

interface ErrorContext {
  component: string;
  operation: string;
  agentId?: string;
  taskId?: string;
  sessionId?: string;
  additionalData?: any;
}

interface RecoveryResult {
  success: boolean;
  strategy: string;
  message: string;
  retryAfter?: number;
}
```

#### Example Usage

```typescript
import { ErrorManager } from '@multi-agent-ide/core';

const errorManager = new ErrorManager();

// Register custom error handler
errorManager.registerErrorHandler('agent-timeout', async (error, context) => {
  console.log(`Agent ${context.agentId} timed out, attempting restart...`);
  // Custom recovery logic
});

// Handle an error
try {
  // Some operation that might fail
  await riskyOperation();
} catch (error) {
  await errorManager.handleError(error, {
    component: 'task-manager',
    operation: 'assign-task',
    agentId: 'frontend-agent',
    taskId: 'task-123'
  });
}
```

## API Reference Summary

### Core Classes

| Class | Description | Key Methods |
|-------|-------------|-------------|
| `SystemInitializer` | System startup/shutdown | `initialize()`, `shutdown()`, `getStatus()` |
| `ConfigurationManager` | Configuration management | `loadConfiguration()`, `saveConfiguration()`, `updateConfiguration()` |
| `CoordinationManager` | Agent coordination | `registerAgent()`, `createSession()`, `coordinateTask()` |
| `EventManager` | Event system | `publish()`, `subscribe()`, `getEventHistory()` |
| `HealthMonitor` | System monitoring | `checkSystemHealth()`, `collectMetrics()`, `setHealthAlert()` |
| `ErrorManager` | Error handling | `handleError()`, `attemptRecovery()`, `logError()` |

### Key Interfaces

| Interface | Description |
|-----------|-------------|
| `SystemConfig` | System configuration options |
| `CollaborationSession` | Active collaboration session |
| `SystemEvent` | System-wide events |
| `HealthStatus` | System health information |
| `ErrorContext` | Error context information |

### Next Steps

- [Agent System APIs](./agent-apis.md)
- [Task Management APIs](./task-apis.md)
- [File Management APIs](./file-apis.md)
- [Examples and Tutorials](./examples/README.md)
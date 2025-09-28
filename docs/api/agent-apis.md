# Agent System APIs

The Agent System APIs provide comprehensive functionality for creating, managing, and coordinating AI agents within the Multi-Agent IDE. These APIs enable you to build specialized agents and integrate them into collaborative workflows.

## Agent Framework

### IAgent Interface

The core interface that all agents must implement.

```typescript
interface IAgent {
  // Basic Properties
  readonly id: string;
  readonly name: string;
  readonly type: AgentType;
  readonly capabilities: string[];
  readonly status: AgentStatus;
  readonly config: AgentConfig;

  // Lifecycle Methods
  initialize(config: AgentConfig): Promise<void>;
  start(): Promise<void>;
  stop(): Promise<void>;
  shutdown(): Promise<void>;

  // Task Execution
  canExecuteTask(task: Task): boolean;
  executeTask(task: Task): Promise<TaskResult>;
  cancelTask(taskId: string): Promise<void>;

  // Communication
  sendMessage(message: AgentMessage): Promise<void>;
  receiveMessage(message: AgentMessage): Promise<void>;
  subscribeToEvents(eventTypes: string[]): void;

  // File Operations
  requestFileAccess(filePath: string, mode: FileAccessMode): Promise<FileAccessToken>;
  releaseFileAccess(token: FileAccessToken): Promise<void>;

  // Health and Monitoring
  getHealthStatus(): Promise<AgentHealthStatus>;
  getMetrics(): Promise<AgentMetrics>;
}
```

### Agent Types and Specializations

```typescript
enum AgentType {
  FRONTEND = 'frontend',
  BACKEND = 'backend',
  TESTING = 'testing',
  CODE_REVIEW = 'code_review',
  DOCUMENTATION = 'documentation',
  DEVOPS = 'devops',
  CUSTOM = 'custom'
}

enum AgentStatus {
  INITIALIZING = 'initializing',
  IDLE = 'idle',
  WORKING = 'working',
  WAITING = 'waiting',
  ERROR = 'error',
  OFFLINE = 'offline'
}

interface AgentConfig {
  name: string;
  type: AgentType;
  capabilities: string[];
  maxConcurrentTasks: number;
  priority: number;
  timeout: number;
  retryAttempts: number;
  customSettings: Record<string, any>;
}
```

## BaseAgent Class

The `BaseAgent` class provides a foundation for implementing custom agents.

```typescript
abstract class BaseAgent implements IAgent {
  protected readonly logger: Logger;
  protected readonly eventEmitter: EventEmitter;
  protected currentTasks: Map<string, Task>;
  protected fileTokens: Map<string, FileAccessToken>;

  constructor(config: AgentConfig) {
    this.id = generateId();
    this.name = config.name;
    this.type = config.type;
    this.config = config;
    this.status = AgentStatus.INITIALIZING;
  }

  // Abstract methods that must be implemented
  abstract canExecuteTask(task: Task): boolean;
  abstract executeTaskImpl(task: Task): Promise<TaskResult>;

  // Implemented lifecycle methods
  async initialize(config: AgentConfig): Promise<void> {
    this.logger.info(`Initializing agent ${this.name}`);
    await this.setupCapabilities();
    await this.connectToServices();
    this.status = AgentStatus.IDLE;
  }

  async executeTask(task: Task): Promise<TaskResult> {
    if (!this.canExecuteTask(task)) {
      throw new Error(`Agent ${this.name} cannot execute task ${task.id}`);
    }

    this.status = AgentStatus.WORKING;
    this.currentTasks.set(task.id, task);

    try {
      const result = await this.executeTaskImpl(task);
      this.status = AgentStatus.IDLE;
      this.currentTasks.delete(task.id);
      return result;
    } catch (error) {
      this.status = AgentStatus.ERROR;
      this.logger.error(`Task execution failed: ${error.message}`);
      throw error;
    }
  }

  // Helper methods for subclasses
  protected async requestFile(filePath: string, mode: FileAccessMode = 'read'): Promise<string> {
    const token = await this.requestFileAccess(filePath, mode);
    try {
      return await this.fileManager.readFile(filePath);
    } finally {
      await this.releaseFileAccess(token);
    }
  }

  protected async writeFile(filePath: string, content: string): Promise<void> {
    const token = await this.requestFileAccess(filePath, 'write');
    try {
      await this.fileManager.writeFile(filePath, content);
    } finally {
      await this.releaseFileAccess(token);
    }
  }
}
```

## Specialized Agent Implementations

### Frontend Agent

```typescript
class FrontendAgent extends BaseAgent {
  constructor(config: AgentConfig) {
    super({
      ...config,
      type: AgentType.FRONTEND,
      capabilities: [
        'react',
        'vue',
        'angular',
        'typescript',
        'javascript',
        'css',
        'html',
        'webpack',
        'vite'
      ]
    });
  }

  canExecuteTask(task: Task): boolean {
    const frontendTasks = [
      'create-component',
      'update-styles',
      'implement-ui',
      'optimize-bundle',
      'setup-routing'
    ];
    return frontendTasks.includes(task.type);
  }

  async executeTaskImpl(task: Task): Promise<TaskResult> {
    switch (task.type) {
      case 'create-component':
        return await this.createComponent(task);
      case 'update-styles':
        return await this.updateStyles(task);
      case 'implement-ui':
        return await this.implementUI(task);
      default:
        throw new Error(`Unknown task type: ${task.type}`);
    }
  }

  private async createComponent(task: Task): Promise<TaskResult> {
    const { componentName, props, styling } = task.parameters;
    
    // Generate component code
    const componentCode = this.generateReactComponent(componentName, props);
    const styleCode = this.generateStyles(componentName, styling);
    
    // Write files
    await this.writeFile(`src/components/${componentName}.tsx`, componentCode);
    await this.writeFile(`src/components/${componentName}.css`, styleCode);
    
    // Generate tests
    const testCode = this.generateComponentTests(componentName, props);
    await this.writeFile(`src/components/__tests__/${componentName}.test.tsx`, testCode);

    return {
      success: true,
      message: `Created component ${componentName}`,
      files: [
        `src/components/${componentName}.tsx`,
        `src/components/${componentName}.css`,
        `src/components/__tests__/${componentName}.test.tsx`
      ]
    };
  }

  private generateReactComponent(name: string, props: any[]): string {
    return `import React from 'react';
import './${name}.css';

interface ${name}Props {
${props.map(prop => `  ${prop.name}: ${prop.type};`).join('\n')}
}

const ${name}: React.FC<${name}Props> = ({ ${props.map(p => p.name).join(', ')} }) => {
  return (
    <div className="${name.toLowerCase()}">
      {/* Component implementation */}
    </div>
  );
};

export default ${name};`;
  }
}
```

### Backend Agent

```typescript
class BackendAgent extends BaseAgent {
  constructor(config: AgentConfig) {
    super({
      ...config,
      type: AgentType.BACKEND,
      capabilities: [
        'nodejs',
        'express',
        'fastify',
        'database',
        'api-design',
        'authentication',
        'middleware'
      ]
    });
  }

  canExecuteTask(task: Task): boolean {
    const backendTasks = [
      'create-api-endpoint',
      'setup-database',
      'implement-auth',
      'create-middleware',
      'optimize-queries'
    ];
    return backendTasks.includes(task.type);
  }

  async executeTaskImpl(task: Task): Promise<TaskResult> {
    switch (task.type) {
      case 'create-api-endpoint':
        return await this.createAPIEndpoint(task);
      case 'setup-database':
        return await this.setupDatabase(task);
      case 'implement-auth':
        return await this.implementAuth(task);
      default:
        throw new Error(`Unknown task type: ${task.type}`);
    }
  }

  private async createAPIEndpoint(task: Task): Promise<TaskResult> {
    const { path, method, handler, middleware } = task.parameters;
    
    // Generate route handler
    const handlerCode = this.generateRouteHandler(path, method, handler);
    const testCode = this.generateAPITests(path, method);
    
    // Write files
    await this.writeFile(`src/routes/${path.replace('/', '')}.ts`, handlerCode);
    await this.writeFile(`src/routes/__tests__/${path.replace('/', '')}.test.ts`, testCode);

    return {
      success: true,
      message: `Created API endpoint ${method} ${path}`,
      files: [
        `src/routes/${path.replace('/', '')}.ts`,
        `src/routes/__tests__/${path.replace('/', '')}.test.ts`
      ]
    };
  }

  private generateRouteHandler(path: string, method: string, handler: any): string {
    return `import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/asyncHandler';

export const ${handler.name} = asyncHandler(async (req: Request, res: Response) => {
  // Implementation
  res.json({ message: 'Success' });
});`;
  }
}
```

### Testing Agent

```typescript
class TestingAgent extends BaseAgent {
  constructor(config: AgentConfig) {
    super({
      ...config,
      type: AgentType.TESTING,
      capabilities: [
        'jest',
        'vitest',
        'playwright',
        'cypress',
        'unit-testing',
        'integration-testing',
        'e2e-testing'
      ]
    });
  }

  canExecuteTask(task: Task): boolean {
    const testingTasks = [
      'create-unit-tests',
      'create-integration-tests',
      'create-e2e-tests',
      'run-test-suite',
      'analyze-coverage'
    ];
    return testingTasks.includes(task.type);
  }

  async executeTaskImpl(task: Task): Promise<TaskResult> {
    switch (task.type) {
      case 'create-unit-tests':
        return await this.createUnitTests(task);
      case 'run-test-suite':
        return await this.runTestSuite(task);
      case 'analyze-coverage':
        return await this.analyzeCoverage(task);
      default:
        throw new Error(`Unknown task type: ${task.type}`);
    }
  }

  private async createUnitTests(task: Task): Promise<TaskResult> {
    const { targetFile, functions } = task.parameters;
    
    const testCode = this.generateUnitTests(targetFile, functions);
    const testFilePath = this.getTestFilePath(targetFile);
    
    await this.writeFile(testFilePath, testCode);

    return {
      success: true,
      message: `Created unit tests for ${targetFile}`,
      files: [testFilePath]
    };
  }

  private generateUnitTests(targetFile: string, functions: any[]): string {
    const imports = `import { ${functions.map(f => f.name).join(', ')} } from '${targetFile}';`;
    
    const tests = functions.map(func => `
describe('${func.name}', () => {
  it('should ${func.description || 'work correctly'}', () => {
    // Test implementation
    expect(${func.name}).toBeDefined();
  });
});`).join('\n');

    return `${imports}\n\n${tests}`;
  }
}
```

## Agent Factory

The `AgentFactory` provides a centralized way to create and configure agents.

```typescript
class AgentFactory {
  private static registeredTypes = new Map<AgentType, typeof BaseAgent>();

  static registerAgentType(type: AgentType, agentClass: typeof BaseAgent): void {
    this.registeredTypes.set(type, agentClass);
  }

  static async create(config: AgentConfig): Promise<IAgent> {
    const AgentClass = this.registeredTypes.get(config.type);
    if (!AgentClass) {
      throw new Error(`Unknown agent type: ${config.type}`);
    }

    const agent = new AgentClass(config);
    await agent.initialize(config);
    return agent;
  }

  static async createFromTemplate(templateName: string, overrides?: Partial<AgentConfig>): Promise<IAgent> {
    const template = await this.loadTemplate(templateName);
    const config = { ...template, ...overrides };
    return this.create(config);
  }

  static getAvailableTypes(): AgentType[] {
    return Array.from(this.registeredTypes.keys());
  }

  private static async loadTemplate(templateName: string): Promise<AgentConfig> {
    // Load predefined agent templates
    const templates = {
      'react-developer': {
        name: 'React Developer',
        type: AgentType.FRONTEND,
        capabilities: ['react', 'typescript', 'css', 'testing'],
        maxConcurrentTasks: 3,
        priority: 1,
        timeout: 300000,
        retryAttempts: 3,
        customSettings: {
          framework: 'react',
          typescript: true
        }
      },
      'node-developer': {
        name: 'Node.js Developer',
        type: AgentType.BACKEND,
        capabilities: ['nodejs', 'express', 'database', 'api-design'],
        maxConcurrentTasks: 2,
        priority: 1,
        timeout: 600000,
        retryAttempts: 2,
        customSettings: {
          runtime: 'nodejs',
          framework: 'express'
        }
      }
    };

    return templates[templateName] || null;
  }
}

// Register built-in agent types
AgentFactory.registerAgentType(AgentType.FRONTEND, FrontendAgent);
AgentFactory.registerAgentType(AgentType.BACKEND, BackendAgent);
AgentFactory.registerAgentType(AgentType.TESTING, TestingAgent);
```

## Agent Communication

### Message System

```typescript
interface AgentMessage {
  id: string;
  from: string;
  to: string | string[];
  type: MessageType;
  content: any;
  timestamp: Date;
  requiresResponse: boolean;
  correlationId?: string;
}

enum MessageType {
  REQUEST = 'request',
  RESPONSE = 'response',
  NOTIFICATION = 'notification',
  BROADCAST = 'broadcast',
  ERROR = 'error'
}

interface MessageHandler {
  canHandle(message: AgentMessage): boolean;
  handle(message: AgentMessage): Promise<AgentMessage | void>;
}
```

### Communication Examples

```typescript
// Request-Response Pattern
class FrontendAgent extends BaseAgent {
  async requestAPIEndpoint(endpoint: string, method: string): Promise<void> {
    const message: AgentMessage = {
      id: generateId(),
      from: this.id,
      to: 'backend-agent',
      type: MessageType.REQUEST,
      content: {
        action: 'create-endpoint',
        endpoint,
        method,
        requirements: ['validation', 'error-handling']
      },
      timestamp: new Date(),
      requiresResponse: true
    };

    const response = await this.sendMessage(message);
    if (response.content.success) {
      console.log(`API endpoint ${endpoint} created successfully`);
    }
  }
}

// Broadcast Pattern
class CoordinatorAgent extends BaseAgent {
  async broadcastProjectUpdate(update: ProjectUpdate): Promise<void> {
    const message: AgentMessage = {
      id: generateId(),
      from: this.id,
      to: ['frontend-agent', 'backend-agent', 'testing-agent'],
      type: MessageType.BROADCAST,
      content: {
        type: 'project-update',
        update
      },
      timestamp: new Date(),
      requiresResponse: false
    };

    await this.sendMessage(message);
  }
}
```

## Agent Monitoring and Metrics

### Health Status

```typescript
interface AgentHealthStatus {
  agentId: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  lastHeartbeat: Date;
  uptime: number;
  currentLoad: number;
  errorRate: number;
  responseTime: number;
  issues: HealthIssue[];
}

interface AgentMetrics {
  tasksCompleted: number;
  tasksInProgress: number;
  tasksFailed: number;
  averageTaskTime: number;
  messagesProcessed: number;
  filesAccessed: number;
  memoryUsage: number;
  cpuUsage: number;
}
```

### Monitoring Example

```typescript
import { AgentMonitor } from '@multi-agent-ide/core';

const monitor = new AgentMonitor();

// Monitor all agents
const healthStatuses = await monitor.checkAllAgents();
healthStatuses.forEach(status => {
  if (status.status !== 'healthy') {
    console.warn(`Agent ${status.agentId} is ${status.status}`);
  }
});

// Get detailed metrics
const metrics = await monitor.getAgentMetrics('frontend-agent');
console.log(`Frontend agent completed ${metrics.tasksCompleted} tasks`);

// Set up alerts
monitor.setAlert('high-error-rate', {
  condition: (metrics) => metrics.errorRate > 0.1,
  callback: (agentId, metrics) => {
    console.error(`High error rate for agent ${agentId}: ${metrics.errorRate}`);
  }
});
```

## Custom Agent Development

### Creating a Custom Agent

```typescript
class DocumentationAgent extends BaseAgent {
  constructor(config: AgentConfig) {
    super({
      ...config,
      type: AgentType.DOCUMENTATION,
      capabilities: ['markdown', 'api-docs', 'user-guides', 'code-analysis']
    });
  }

  canExecuteTask(task: Task): boolean {
    return [
      'generate-api-docs',
      'create-user-guide',
      'update-readme',
      'analyze-code-comments'
    ].includes(task.type);
  }

  async executeTaskImpl(task: Task): Promise<TaskResult> {
    switch (task.type) {
      case 'generate-api-docs':
        return await this.generateAPIDocs(task);
      case 'create-user-guide':
        return await this.createUserGuide(task);
      default:
        throw new Error(`Unknown task type: ${task.type}`);
    }
  }

  private async generateAPIDocs(task: Task): Promise<TaskResult> {
    const { sourceFiles, outputPath } = task.parameters;
    
    // Analyze source files
    const apiInfo = await this.analyzeAPIFiles(sourceFiles);
    
    // Generate documentation
    const docs = this.generateMarkdownDocs(apiInfo);
    
    // Write documentation
    await this.writeFile(outputPath, docs);

    return {
      success: true,
      message: `Generated API documentation at ${outputPath}`,
      files: [outputPath]
    };
  }

  private async analyzeAPIFiles(files: string[]): Promise<APIInfo[]> {
    // Implementation for analyzing API files
    return [];
  }

  private generateMarkdownDocs(apiInfo: APIInfo[]): string {
    // Implementation for generating markdown documentation
    return '# API Documentation\n\n...';
  }
}

// Register the custom agent
AgentFactory.registerAgentType(AgentType.DOCUMENTATION, DocumentationAgent);
```

## Best Practices

### Agent Design Principles

1. **Single Responsibility**: Each agent should have a clear, focused purpose
2. **Capability-Based**: Define clear capabilities and task compatibility
3. **Stateless Operations**: Avoid maintaining state between tasks when possible
4. **Error Resilience**: Implement proper error handling and recovery
5. **Resource Management**: Properly manage file locks and system resources

### Performance Optimization

```typescript
class OptimizedAgent extends BaseAgent {
  private taskQueue: Queue<Task>;
  private fileCache: LRUCache<string, string>;

  constructor(config: AgentConfig) {
    super(config);
    this.taskQueue = new Queue({ concurrency: config.maxConcurrentTasks });
    this.fileCache = new LRUCache({ max: 100 });
  }

  async executeTask(task: Task): Promise<TaskResult> {
    // Use queue for task management
    return this.taskQueue.add(() => super.executeTask(task));
  }

  protected async requestFile(filePath: string): Promise<string> {
    // Use cache for frequently accessed files
    if (this.fileCache.has(filePath)) {
      return this.fileCache.get(filePath);
    }

    const content = await super.requestFile(filePath);
    this.fileCache.set(filePath, content);
    return content;
  }
}
```

## API Reference Summary

### Core Classes

| Class | Description |
|-------|-------------|
| `BaseAgent` | Abstract base class for all agents |
| `AgentFactory` | Factory for creating and managing agents |
| `AgentMonitor` | Monitoring and health checking for agents |

### Specialized Agents

| Agent | Capabilities |
|-------|-------------|
| `FrontendAgent` | React, Vue, Angular, CSS, TypeScript |
| `BackendAgent` | Node.js, Express, Database, API Design |
| `TestingAgent` | Jest, Playwright, Unit/Integration/E2E Testing |
| `CodeReviewAgent` | Code analysis, quality checks, best practices |

### Next Steps

- [Task Management APIs](./task-apis.md)
- [File Management APIs](./file-apis.md)
- [Communication APIs](./communication-apis.md)
- [Plugin Development Guide](./plugin-development.md)
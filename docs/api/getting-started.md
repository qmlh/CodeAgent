# Getting Started with Multi-Agent IDE

This guide will help you get up and running with the Multi-Agent IDE quickly.

## Installation

### Prerequisites

- Node.js 18 or higher
- npm or yarn package manager
- Git (for version control integration)

### Install from Release

Download the latest release for your platform:

- **Windows**: `multi-agent-ide-setup-x64.exe`
- **macOS**: `multi-agent-ide-x64.dmg`
- **Linux**: `multi-agent-ide-x64.AppImage`

### Build from Source

```bash
# Clone the repository
git clone https://github.com/multi-agent-ide/multi-agent-ide.git
cd multi-agent-ide

# Install dependencies
npm install

# Build the application
npm run build

# Start the application
npm start
```

## First Project Setup

### 1. Create a New Project

```typescript
import { ProjectManager } from '@multi-agent-ide/core';

const projectManager = new ProjectManager();
const project = await projectManager.createProject({
  name: 'my-web-app',
  type: 'web-application',
  template: 'react-typescript'
});
```

### 2. Configure Agents

```typescript
import { AgentFactory } from '@multi-agent-ide/agents';

// Create specialized agents
const frontendAgent = await AgentFactory.create({
  type: 'frontend',
  name: 'React Developer',
  capabilities: ['react', 'typescript', 'css', 'testing']
});

const backendAgent = await AgentFactory.create({
  type: 'backend',
  name: 'Node.js Developer',
  capabilities: ['nodejs', 'express', 'database', 'api-design']
});

const testingAgent = await AgentFactory.create({
  type: 'testing',
  name: 'QA Engineer',
  capabilities: ['unit-testing', 'integration-testing', 'e2e-testing']
});
```

### 3. Start Collaboration

```typescript
import { CoordinationManager } from '@multi-agent-ide/core';

const coordinator = new CoordinationManager();

// Register agents
await coordinator.registerAgent(frontendAgent);
await coordinator.registerAgent(backendAgent);
await coordinator.registerAgent(testingAgent);

// Create a collaboration session
const session = await coordinator.createSession({
  name: 'Feature Development',
  participants: ['frontend', 'backend', 'testing'],
  sharedFiles: ['src/**/*', 'tests/**/*']
});

// Start the session
await session.start();
```

## Basic Usage Examples

### Creating and Assigning Tasks

```typescript
import { TaskManager } from '@multi-agent-ide/core';

const taskManager = new TaskManager();

// Create a high-level task
const task = await taskManager.createTask({
  title: 'Implement user authentication',
  description: 'Add login/logout functionality with JWT tokens',
  priority: 'high',
  requirements: [
    'Create login form component',
    'Implement JWT authentication API',
    'Add authentication middleware',
    'Write comprehensive tests'
  ]
});

// Let the system decompose and assign subtasks
const subtasks = await taskManager.decomposeTask(task.id);
console.log(`Created ${subtasks.length} subtasks`);
```

### File Operations with Conflict Prevention

```typescript
import { FileManager } from '@multi-agent-ide/core';

const fileManager = new FileManager();

// Request file access
const lock = await fileManager.requestLock('src/components/Login.tsx', 'frontend-agent');

try {
  // Perform file operations
  const content = await fileManager.readFile('src/components/Login.tsx');
  const updatedContent = content + '\n// Added by frontend agent';
  await fileManager.writeFile('src/components/Login.tsx', updatedContent);
} finally {
  // Always release the lock
  await fileManager.releaseLock(lock.id);
}
```

### Real-time Communication

```typescript
import { MessageManager } from '@multi-agent-ide/core';

const messageManager = new MessageManager();

// Subscribe to messages
messageManager.subscribe('task-completed', (message) => {
  console.log(`Task ${message.taskId} completed by ${message.agentId}`);
});

// Send a message
await messageManager.sendMessage({
  from: 'frontend-agent',
  to: 'backend-agent',
  type: 'request',
  content: {
    action: 'create-api-endpoint',
    endpoint: '/api/auth/login',
    method: 'POST'
  }
});
```

## Desktop Application Usage

### Opening Projects

1. Launch the Multi-Agent IDE
2. Click "Open Project" or use `Ctrl+O`
3. Select your project directory
4. The IDE will automatically detect project type and suggest agent configurations

### Managing Agents

1. Open the Agent Management panel (left sidebar)
2. Click "Create Agent" to add new agents
3. Configure agent specializations and capabilities
4. Monitor agent status and performance in real-time

### Task Management

1. Open the Task Management panel
2. Create new tasks or import from project management tools
3. View tasks in Kanban board or Gantt chart format
4. Monitor task progress and agent assignments

### Collaboration Monitoring

1. Open the Collaboration panel (bottom status bar)
2. View real-time agent activities
3. Monitor file locks and potential conflicts
4. Access communication logs and session history

## Configuration

### Project Configuration

Create a `.multi-agent-ide.json` file in your project root:

```json
{
  "version": "1.0.0",
  "project": {
    "name": "My Web App",
    "type": "web-application",
    "language": "typescript"
  },
  "agents": {
    "frontend": {
      "enabled": true,
      "capabilities": ["react", "typescript", "css"],
      "maxConcurrentTasks": 3
    },
    "backend": {
      "enabled": true,
      "capabilities": ["nodejs", "express", "database"],
      "maxConcurrentTasks": 2
    },
    "testing": {
      "enabled": true,
      "capabilities": ["jest", "playwright", "cypress"],
      "maxConcurrentTasks": 5
    }
  },
  "collaboration": {
    "conflictResolution": "manual",
    "autoSave": true,
    "realTimeSync": true
  }
}
```

### User Preferences

Access preferences through `File > Preferences` or `Ctrl+,`:

- **Appearance**: Theme, font size, layout preferences
- **Editor**: Code formatting, IntelliSense settings
- **Agents**: Default agent configurations, performance limits
- **Collaboration**: Communication preferences, notification settings

## Next Steps

- [Explore Core APIs](./core-apis.md)
- [Learn Agent Development](./agent-apis.md)
- [Check out Examples](./examples/README.md)
- [Read Best Practices](./best-practices.md)

## Troubleshooting

If you encounter issues:

1. Check the [Troubleshooting Guide](./troubleshooting.md)
2. Review the application logs in `Help > Show Logs`
3. Visit our [GitHub Issues](https://github.com/multi-agent-ide/issues)
4. Join the [Community Forum](https://community.multi-agent-ide.dev)
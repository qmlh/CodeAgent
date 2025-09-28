import { TestEnvironment, TestEnvironmentConfig } from '../setup/TestEnvironment';
import { Agent } from '../../../types/agent.types';
import { Task } from '../../../types/task.types';
import { AgentMessage } from '../../../types/message.types';

describe('Complete Collaboration Workflow Tests', () => {
  let testEnv: TestEnvironment;
  let agents: Agent[];

  const testConfig: TestEnvironmentConfig = {
    agentCount: 4,
    testDataPath: './test-workspace',
    timeoutMs: 60000,
    enableLogging: true,
    performanceTracking: true
  };

  beforeAll(async () => {
    testEnv = new TestEnvironment(testConfig);
    await testEnv.setup();
    agents = await testEnv.createTestAgents();
  });

  afterAll(async () => {
    await testEnv.teardown();
  });

  describe('Full Development Workflow', () => {
    test('should complete a full feature development workflow', async () => {
      // Create a complex task that requires multiple agents
      const mainTask = await testEnv.createTestTask({
        title: 'Implement User Authentication Feature',
        description: 'Complete user authentication with frontend, backend, and tests',
        type: 'feature',
        priority: 3,
        requirements: [
          'Create login/register UI components',
          'Implement authentication API endpoints',
          'Add JWT token handling',
          'Write comprehensive tests',
          'Perform code review'
        ],
        files: [
          'src/components/auth/LoginForm.tsx',
          'src/components/auth/RegisterForm.tsx',
          'src/api/auth.ts',
          'src/middleware/auth.ts',
          'tests/auth.test.ts'
        ]
      });

      // Create collaboration session
      const session = await testEnv.createCollaborationSession(
        agents.map(a => a.id)
      );

      // Assign task to coordination manager for decomposition and distribution
      await testEnv.getCoordinationManager().assignTask(mainTask.id);

      // Wait for task completion
      const completedTask = await testEnv.waitForTaskCompletion(mainTask.id);

      // Verify task completion
      expect(completedTask.status).toBe('completed');
      expect(completedTask.completedAt).toBeDefined();

      // Verify all agents participated
      const taskHistory = await testEnv.getTaskManager().getTaskHistory(mainTask.id);
      expect(taskHistory.length).toBeGreaterThan(0);

      // Verify collaboration session was active
      const sessionData = await testEnv.getCoordinationManager()
        .getCollaborationSession(session.id);
      expect(sessionData).toBeDefined();
      expect(sessionData!.participants.length).toBe(agents.length);
    }, 120000);

    test('should handle task dependencies correctly', async () => {
      // Create dependent tasks
      const backendTask = await testEnv.createTestTask({
        title: 'Create API Endpoints',
        description: 'Implement REST API endpoints',
        type: 'backend',
        priority: 3,
        files: ['src/api/users.ts']
      });

      const frontendTask = await testEnv.createTestTask({
        title: 'Create UI Components',
        description: 'Implement user interface components',
        type: 'frontend',
        priority: 2,
        dependencies: [backendTask.id], // Frontend depends on backend
        files: ['src/components/UserList.tsx']
      });

      const testTask = await testEnv.createTestTask({
        title: 'Write Integration Tests',
        description: 'Test API and UI integration',
        type: 'testing',
        priority: 1,
        dependencies: [backendTask.id, frontendTask.id], // Tests depend on both
        files: ['tests/integration/user-flow.test.ts']
      });

      // Assign all tasks
      await testEnv.getCoordinationManager().assignTask(backendTask.id);
      await testEnv.getCoordinationManager().assignTask(frontendTask.id);
      await testEnv.getCoordinationManager().assignTask(testTask.id);

      // Wait for all tasks to complete
      await Promise.all([
        testEnv.waitForTaskCompletion(backendTask.id),
        testEnv.waitForTaskCompletion(frontendTask.id),
        testEnv.waitForTaskCompletion(testTask.id)
      ]);

      // Verify execution order (backend should complete before frontend and tests)
      const backendCompleted = await testEnv.getTaskManager().getTask(backendTask.id);
      const frontendCompleted = await testEnv.getTaskManager().getTask(frontendTask.id);
      const testCompleted = await testEnv.getTaskManager().getTask(testTask.id);

      expect(backendCompleted.completedAt!.getTime())
        .toBeLessThan(frontendCompleted.completedAt!.getTime());
      expect(frontendCompleted.completedAt!.getTime())
        .toBeLessThan(testCompleted.completedAt!.getTime());
    }, 90000);

    test('should handle file conflicts and resolution', async () => {
      // Create two tasks that modify the same file
      const task1 = await testEnv.createTestTask({
        title: 'Add User Model',
        description: 'Add user data model',
        type: 'backend',
        files: ['src/models/User.ts']
      });

      const task2 = await testEnv.createTestTask({
        title: 'Add User Validation',
        description: 'Add user input validation',
        type: 'backend',
        files: ['src/models/User.ts'] // Same file as task1
      });

      // Assign both tasks simultaneously
      await Promise.all([
        testEnv.getCoordinationManager().assignTask(task1.id),
        testEnv.getCoordinationManager().assignTask(task2.id)
      ]);

      // Wait for both tasks to complete
      await Promise.all([
        testEnv.waitForTaskCompletion(task1.id),
        testEnv.waitForTaskCompletion(task2.id)
      ]);

      // Verify file manager handled conflicts
      const fileHistory = await testEnv.getFileManager()
        .getFileHistory('src/models/User.ts');
      expect(fileHistory.length).toBeGreaterThan(1);

      // Verify no conflicts remain
      const conflicts = await testEnv.getFileManager()
        .detectConflicts('src/models/User.ts');
      expect(conflicts.length).toBe(0);
    }, 60000);
  });

  describe('Agent Communication and Coordination', () => {
    test('should facilitate effective agent communication', async () => {
      const messageManager = testEnv.getMessageManager();
      const messages: any[] = [];

      // Subscribe to messages
      messageManager.subscribe('agent-message', (message: AgentMessage) => {
        messages.push(message);
      });

      // Create a task that requires agent communication
      const task = await testEnv.createTestTask({
        title: 'Code Review Task',
        description: 'Review and improve code quality',
        type: 'code_review',
        files: ['src/utils/helpers.ts']
      });

      await testEnv.getCoordinationManager().assignTask(task.id);
      await testEnv.waitForTaskCompletion(task.id);

      // Verify agents communicated during the task
      expect(messages.length).toBeGreaterThan(0);
      
      // Verify message types
      const messageTypes = messages.map(m => m.type);
      expect(messageTypes).toContain('request');
      expect(messageTypes).toContain('response');
    }, 45000);

    test('should handle agent failures gracefully', async () => {
      // Create a task
      const task = await testEnv.createTestTask({
        title: 'Resilience Test Task',
        description: 'Test system resilience',
        type: 'development'
      });

      // Assign task to a specific agent
      const targetAgent = agents[0];
      await testEnv.getTaskManager().assignTaskToAgent(task.id, targetAgent.id);

      // Simulate agent failure
      await testEnv.getCoordinationManager().simulateAgentFailure(targetAgent.id);

      // Task should be reassigned to another agent
      await testEnv.waitForTaskCompletion(task.id);

      const completedTask = await testEnv.getTaskManager().getTask(task.id);
      expect(completedTask.status).toBe('completed');
      expect(completedTask.assignedAgent).not.toBe(targetAgent.id);
    }, 60000);
  });

  describe('Performance and Scalability', () => {
    test('should handle multiple concurrent tasks efficiently', async () => {
      const taskCount = 10;
      const tasks: Task[] = [];

      // Create multiple tasks
      for (let i = 0; i < taskCount; i++) {
        const task = await testEnv.createTestTask({
          title: `Concurrent Task ${i}`,
          description: `Task ${i} for concurrency testing`,
          type: 'development',
          files: [`src/test-file-${i}.ts`]
        });
        tasks.push(task);
      }

      const startTime = Date.now();

      // Assign all tasks simultaneously
      await Promise.all(
        tasks.map(task => testEnv.getCoordinationManager().assignTask(task.id))
      );

      // Wait for all tasks to complete
      await Promise.all(
        tasks.map(task => testEnv.waitForTaskCompletion(task.id))
      );

      const endTime = Date.now();
      const totalTime = endTime - startTime;

      // Verify all tasks completed
      for (const task of tasks) {
        const completedTask = await testEnv.getTaskManager().getTask(task.id);
        expect(completedTask.status).toBe('completed');
      }

      // Performance assertion (tasks should complete in reasonable time)
      expect(totalTime).toBeLessThan(120000); // 2 minutes max
      
      console.log(`Completed ${taskCount} concurrent tasks in ${totalTime}ms`);
    }, 150000);

    test('should maintain system stability under load', async () => {
      const initialMemory = process.memoryUsage();
      
      // Create and complete many small tasks
      for (let batch = 0; batch < 5; batch++) {
        const batchTasks: Task[] = [];
        
        for (let i = 0; i < 5; i++) {
          const task = await testEnv.createTestTask({
            title: `Load Test Task ${batch}-${i}`,
            description: 'Small task for load testing',
            type: 'development'
          });
          batchTasks.push(task);
        }

        await Promise.all(
          batchTasks.map(task => testEnv.getCoordinationManager().assignTask(task.id))
        );

        await Promise.all(
          batchTasks.map(task => testEnv.waitForTaskCompletion(task.id))
        );

        // Wait for agents to become idle between batches
        await testEnv.waitForAllAgentsIdle(10000);
      }

      const finalMemory = process.memoryUsage();
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;

      // Memory increase should be reasonable (less than 100MB)
      expect(memoryIncrease).toBeLessThan(100 * 1024 * 1024);
      
      console.log(`Memory increase: ${Math.round(memoryIncrease / 1024 / 1024)}MB`);
    }, 180000);
  });
});
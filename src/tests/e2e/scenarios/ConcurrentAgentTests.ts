import { TestEnvironment, TestEnvironmentConfig } from '../setup/TestEnvironment';
import { Agent } from '../../../types/agent.types';
import { Task } from '../../../types/task.types';
import { AgentMessage } from '../../../types/message.types';

describe('Multi-Agent Concurrent Scenario Tests', () => {
  let testEnv: TestEnvironment;
  let agents: Agent[];

  const testConfig: TestEnvironmentConfig = {
    agentCount: 8, // More agents for concurrency testing
    testDataPath: './concurrent-test-workspace',
    timeoutMs: 90000,
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

  describe('Concurrent File Access Scenarios', () => {
    test('should handle multiple agents accessing different files simultaneously', async () => {
      const tasks: Task[] = [];
      const fileCount = 6;

      // Create tasks that access different files
      for (let i = 0; i < fileCount; i++) {
        const task = await testEnv.createTestTask({
          title: `File Access Task ${i}`,
          description: `Access and modify file ${i}`,
          type: 'development',
          files: [`src/concurrent/file-${i}.ts`]
        });
        tasks.push(task);
      }

      const startTime = Date.now();

      // Assign all tasks simultaneously
      const assignPromises = tasks.map(task =>
        testEnv.getCoordinationManager().assignTask(task.id)
      );
      await Promise.all(assignPromises);

      // Wait for all tasks to complete
      const completionPromises = tasks.map(task =>
        testEnv.waitForTaskCompletion(task.id)
      );
      await Promise.all(completionPromises);

      const endTime = Date.now();
      const executionTime = endTime - startTime;

      // Verify all tasks completed successfully
      for (const task of tasks) {
        const completedTask = await testEnv.getTaskManager().getTask(task.id);
        expect(completedTask.status).toBe('completed');
      }

      // Performance check - concurrent execution should be faster than sequential
      const maxSequentialTime = fileCount * 10000; // 10s per file
      expect(executionTime).toBeLessThan(maxSequentialTime);

      console.log(`Concurrent file access completed in ${executionTime}ms`);
    }, 120000);

    test('should serialize access to the same file', async () => {
      const sharedFile = 'src/shared/common.ts';
      const taskCount = 4;
      const tasks: Task[] = [];

      // Create multiple tasks that modify the same file
      for (let i = 0; i < taskCount; i++) {
        const task = await testEnv.createTestTask({
          title: `Shared File Task ${i}`,
          description: `Modify shared file - operation ${i}`,
          type: 'development',
          files: [sharedFile]
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

      // Verify all tasks completed
      for (const task of tasks) {
        const completedTask = await testEnv.getTaskManager().getTask(task.id);
        expect(completedTask.status).toBe('completed');
      }

      // Verify file access was serialized (no conflicts)
      const conflicts = await testEnv.getFileManager().detectConflicts(sharedFile);
      expect(conflicts.length).toBe(0);

      // Check file history shows sequential modifications
      const fileHistory = await testEnv.getFileManager().getFileHistory(sharedFile);
      expect(fileHistory.length).toBe(taskCount);

      console.log(`Serialized file access completed in ${endTime - startTime}ms`);
    }, 90000);

    test('should handle mixed file access patterns', async () => {
      const tasks: Task[] = [];

      // Tasks with unique files
      for (let i = 0; i < 3; i++) {
        tasks.push(await testEnv.createTestTask({
          title: `Unique File Task ${i}`,
          description: `Work on unique file ${i}`,
          type: 'development',
          files: [`src/unique/file-${i}.ts`]
        }));
      }

      // Tasks with shared files
      const sharedFiles = ['src/shared/utils.ts', 'src/shared/types.ts'];
      for (let i = 0; i < 4; i++) {
        tasks.push(await testEnv.createTestTask({
          title: `Shared File Task ${i}`,
          description: `Work on shared files ${i}`,
          type: 'development',
          files: sharedFiles
        }));
      }

      // Tasks with overlapping files
      for (let i = 0; i < 2; i++) {
        tasks.push(await testEnv.createTestTask({
          title: `Overlap Task ${i}`,
          description: `Work on overlapping files ${i}`,
          type: 'development',
          files: ['src/shared/utils.ts', `src/overlap/file-${i}.ts`]
        }));
      }

      const startTime = Date.now();

      // Assign all tasks
      await Promise.all(
        tasks.map(task => testEnv.getCoordinationManager().assignTask(task.id))
      );

      // Wait for completion
      await Promise.all(
        tasks.map(task => testEnv.waitForTaskCompletion(task.id))
      );

      const endTime = Date.now();

      // Verify all completed successfully
      for (const task of tasks) {
        const completedTask = await testEnv.getTaskManager().getTask(task.id);
        expect(completedTask.status).toBe('completed');
      }

      // Verify no conflicts on shared files
      for (const sharedFile of sharedFiles) {
        const conflicts = await testEnv.getFileManager().detectConflicts(sharedFile);
        expect(conflicts.length).toBe(0);
      }

      console.log(`Mixed access pattern completed in ${endTime - startTime}ms`);
    }, 120000);
  });

  describe('Agent Load Balancing Scenarios', () => {
    test('should distribute tasks evenly across agents', async () => {
      const taskCount = 16; // 2 tasks per agent
      const tasks: Task[] = [];

      // Create many similar tasks
      for (let i = 0; i < taskCount; i++) {
        const task = await testEnv.createTestTask({
          title: `Load Balance Task ${i}`,
          description: `Task ${i} for load balancing test`,
          type: 'development',
          files: [`src/load-test/file-${i}.ts`]
        });
        tasks.push(task);
      }

      // Assign all tasks
      await Promise.all(
        tasks.map(task => testEnv.getCoordinationManager().assignTask(task.id))
      );

      // Wait for all to complete
      await Promise.all(
        tasks.map(task => testEnv.waitForTaskCompletion(task.id))
      );

      // Analyze task distribution
      const agentTaskCounts = new Map<string, number>();

      for (const task of tasks) {
        const completedTask = await testEnv.getTaskManager().getTask(task.id);
        const agentId = completedTask.assignedAgent!;
        agentTaskCounts.set(agentId, (agentTaskCounts.get(agentId) || 0) + 1);
      }

      // Verify reasonably even distribution
      const taskCounts = Array.from(agentTaskCounts.values());
      const minTasks = Math.min(...taskCounts);
      const maxTasks = Math.max(...taskCounts);
      const variance = maxTasks - minTasks;

      // Variance should be small (within 2 tasks)
      expect(variance).toBeLessThanOrEqual(2);

      console.log('Task distribution:', Object.fromEntries(agentTaskCounts));
    }, 150000);

    test('should handle agent capacity limits', async () => {
      // Create more tasks than agents can handle simultaneously
      const taskCount = 20;
      const tasks: Task[] = [];

      for (let i = 0; i < taskCount; i++) {
        const task = await testEnv.createTestTask({
          title: `Capacity Test Task ${i}`,
          description: `Task ${i} for capacity testing`,
          type: 'development',
          files: [`src/capacity/file-${i}.ts`]
        });
        tasks.push(task);
      }

      const startTime = Date.now();

      // Assign all tasks at once
      await Promise.all(
        tasks.map(task => testEnv.getCoordinationManager().assignTask(task.id))
      );

      // Monitor task queue sizes
      const queueSizes: number[] = [];
      const monitorInterval = setInterval(async () => {
        let totalQueued = 0;
        for (const agent of agents) {
          const queue = await testEnv.getTaskManager().getTaskQueue(agent.id);
          totalQueued += queue.length;
        }
        queueSizes.push(totalQueued);
      }, 2000);

      // Wait for all tasks to complete
      await Promise.all(
        tasks.map(task => testEnv.waitForTaskCompletion(task.id))
      );

      clearInterval(monitorInterval);
      const endTime = Date.now();

      // Verify all tasks completed
      for (const task of tasks) {
        const completedTask = await testEnv.getTaskManager().getTask(task.id);
        expect(completedTask.status).toBe('completed');
      }

      // Verify queuing occurred (some tasks had to wait)
      expect(Math.max(...queueSizes)).toBeGreaterThan(0);

      console.log(`Capacity test completed in ${endTime - startTime}ms`);
      console.log('Max queue size:', Math.max(...queueSizes));
    }, 180000);
  });

  describe('Concurrent Communication Scenarios', () => {
    test('should handle high-volume message passing', async () => {
      const messageManager = testEnv.getMessageManager();
      const receivedMessages: any[] = [];

      // Subscribe to all messages
      messageManager.subscribe('*', (message: AgentMessage) => {
        receivedMessages.push(message);
      });

      // Create tasks that require inter-agent communication
      const communicationTasks: Task[] = [];

      for (let i = 0; i < 6; i++) {
        const task = await testEnv.createTestTask({
          title: `Communication Task ${i}`,
          description: `Task requiring agent communication ${i}`,
          type: 'code_review', // This type typically requires communication
          files: [`src/review/file-${i}.ts`]
        });
        communicationTasks.push(task);
      }

      const startTime = Date.now();

      // Execute all communication tasks
      await Promise.all(
        communicationTasks.map(task =>
          testEnv.getCoordinationManager().assignTask(task.id)
        )
      );

      await Promise.all(
        communicationTasks.map(task =>
          testEnv.waitForTaskCompletion(task.id)
        )
      );

      const endTime = Date.now();

      // Verify high message volume
      expect(receivedMessages.length).toBeGreaterThan(10);

      // Verify message types
      const messageTypes = new Set(receivedMessages.map(m => m.type));
      expect(messageTypes.size).toBeGreaterThan(1);

      // Verify no message loss or corruption
      for (const message of receivedMessages) {
        expect(message).toHaveProperty('id');
        expect(message).toHaveProperty('from');
        expect(message).toHaveProperty('timestamp');
      }

      console.log(`High-volume communication test: ${receivedMessages.length} messages in ${endTime - startTime}ms`);
    }, 120000);

    test('should maintain message ordering in concurrent scenarios', async () => {
      const messageManager = testEnv.getMessageManager();
      const agentMessages = new Map<string, any[]>();

      // Track messages per agent
      messageManager.subscribe('agent-message', (message: AgentMessage) => {
        const agentId = message.from;
        if (!agentMessages.has(agentId)) {
          agentMessages.set(agentId, []);
        }
        agentMessages.get(agentId)!.push(message);
      });

      // Create sequential tasks for each agent
      const sequentialTasks: Task[] = [];

      for (const agent of agents.slice(0, 4)) { // Use first 4 agents
        for (let i = 0; i < 3; i++) {
          const task = await testEnv.createTestTask({
            title: `Sequential Task ${agent.id}-${i}`,
            description: `Sequential task ${i} for agent ${agent.id}`,
            type: 'development',
            files: [`src/sequential/${agent.id}-file-${i}.ts`]
          });

          // Assign to specific agent
          await testEnv.getTaskManager().assignTaskToAgent(task.id, agent.id);
          sequentialTasks.push(task);
        }
      }

      // Wait for all tasks to complete
      await Promise.all(
        sequentialTasks.map(task => testEnv.waitForTaskCompletion(task.id))
      );

      // Verify message ordering per agent
      agentMessages.forEach((messages, agentId) => {
        if (messages.length > 1) {
          for (let i = 1; i < messages.length; i++) {
            const prevTimestamp = new Date(messages[i - 1].timestamp).getTime();
            const currTimestamp = new Date(messages[i].timestamp).getTime();
            expect(currTimestamp).toBeGreaterThanOrEqual(prevTimestamp);
          }
        }
      });

      console.log('Message ordering verified for', agentMessages.size, 'agents');
    }, 90000);
  });

  describe('Failure and Recovery Scenarios', () => {
    test('should handle multiple agent failures gracefully', async () => {
      // Create tasks
      const tasks: Task[] = [];
      for (let i = 0; i < 6; i++) {
        const task = await testEnv.createTestTask({
          title: `Resilience Task ${i}`,
          description: `Task ${i} for resilience testing`,
          type: 'development',
          files: [`src/resilience/file-${i}.ts`]
        });
        tasks.push(task);
      }

      // Assign tasks
      await Promise.all(
        tasks.map(task => testEnv.getCoordinationManager().assignTask(task.id))
      );

      // Simulate multiple agent failures after a short delay
      setTimeout(async () => {
        const agentsToFail = agents.slice(0, 2); // Fail first 2 agents
        for (const agent of agentsToFail) {
          await testEnv.getCoordinationManager().simulateAgentFailure(agent.id);
        }
      }, 5000);

      // Wait for all tasks to complete (should be reassigned)
      await Promise.all(
        tasks.map(task => testEnv.waitForTaskCompletion(task.id))
      );

      // Verify all tasks completed despite failures
      for (const task of tasks) {
        const completedTask = await testEnv.getTaskManager().getTask(task.id);
        expect(completedTask.status).toBe('completed');
      }

      console.log('Multiple agent failure recovery test completed');
    }, 120000);

    test('should recover from system-wide stress', async () => {
      // Create a large number of tasks to stress the system
      const stressTasks: Task[] = [];
      const stressTaskCount = 25;

      for (let i = 0; i < stressTaskCount; i++) {
        const task = await testEnv.createTestTask({
          title: `Stress Task ${i}`,
          description: `High-load stress task ${i}`,
          type: 'development',
          files: [`src/stress/file-${i}.ts`]
        });
        stressTasks.push(task);
      }

      const startTime = Date.now();

      // Assign all tasks simultaneously to create stress
      await Promise.all(
        stressTasks.map(task =>
          testEnv.getCoordinationManager().assignTask(task.id)
        )
      );

      // Simulate additional stress by failing and recovering agents
      const stressInterval = setInterval(async () => {
        const randomAgent = agents[Math.floor(Math.random() * agents.length)];
        await testEnv.getCoordinationManager().simulateAgentFailure(randomAgent.id);

        // Recover after a short delay
        setTimeout(async () => {
          await testEnv.getCoordinationManager().recoverAgent(randomAgent.id);
        }, 2000);
      }, 10000);

      // Wait for all tasks to complete
      await Promise.all(
        stressTasks.map(task => testEnv.waitForTaskCompletion(task.id))
      );

      clearInterval(stressInterval);
      const endTime = Date.now();

      // Verify system recovered and completed all tasks
      for (const task of stressTasks) {
        const completedTask = await testEnv.getTaskManager().getTask(task.id);
        expect(completedTask.status).toBe('completed');
      }

      console.log(`System stress test completed in ${endTime - startTime}ms`);
    }, 300000); // 5 minutes timeout for stress test
  });
});
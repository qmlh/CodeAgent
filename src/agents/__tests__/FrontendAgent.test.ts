/**
 * Unit tests for FrontendAgent
 */

import { FrontendAgent, FrontendAgentConfig } from '../FrontendAgent';
import { AgentType, AgentStatus, TaskStatus, TaskPriority } from '../../types';
import { Task } from '../../types/task.types';

describe('FrontendAgent', () => {
  let frontendAgent: FrontendAgent;
  let mockConfig: FrontendAgentConfig;

  beforeEach(() => {
    mockConfig = {
      name: 'TestFrontendAgent',
      type: AgentType.FRONTEND,
      capabilities: [],
      maxConcurrentTasks: 3,
      timeout: 30000,
      retryAttempts: 3,
      frameworks: ['react', 'vue', 'angular'],
      buildTools: ['webpack', 'vite', 'rollup'],
      testingLibraries: ['jest', 'vitest', 'cypress'],
      codeStyle: {
        prettier: true,
        eslint: true,
        typescript: true
      },
      optimization: {
        bundleAnalysis: true,
        performanceMetrics: true,
        codesplitting: true
      }
    };

    frontendAgent = new FrontendAgent('frontend-1', 'Frontend Agent', mockConfig);
  });

  afterEach(async () => {
    if (frontendAgent.getStatus() !== AgentStatus.OFFLINE) {
      await frontendAgent.shutdown();
    }
  });

  describe('Initialization', () => {
    it('should initialize with correct specialization', () => {
      expect(frontendAgent.specialization).toBe(AgentType.FRONTEND);
      expect(frontendAgent.name).toBe('Frontend Agent');
      expect(frontendAgent.id).toBe('frontend-1');
    });

    it('should initialize successfully with valid config', async () => {
      await frontendAgent.initialize(mockConfig);
      
      expect(frontendAgent.getStatus()).toBe(AgentStatus.IDLE);
      expect(frontendAgent.getCapabilities()).toContain('component-creation');
      expect(frontendAgent.getCapabilities()).toContain('ui-implementation');
      expect(frontendAgent.getCapabilities()).toContain('react-development');
    });

    it('should throw error when initializing with invalid config', async () => {
      const invalidConfig = { ...mockConfig, frameworks: [] };
      
      await expect(frontendAgent.initialize(invalidConfig)).rejects.toThrow(
        'Frontend agent must have at least one framework configured'
      );
    });

    it('should setup frontend-specific capabilities', async () => {
      await frontendAgent.initialize(mockConfig);
      
      const capabilities = frontendAgent.getCapabilities();
      expect(capabilities).toContain('component-creation');
      expect(capabilities).toContain('ui-implementation');
      expect(capabilities).toContain('styling');
      expect(capabilities).toContain('state-management');
      expect(capabilities).toContain('routing');
      expect(capabilities).toContain('api-integration');
      expect(capabilities).toContain('performance-optimization');
      expect(capabilities).toContain('frontend-testing');
      expect(capabilities).toContain('build-optimization');
      expect(capabilities).toContain('react-development');
      expect(capabilities).toContain('webpack-configuration');
      expect(capabilities).toContain('jest-testing');
    });
  });

  describe('Task Execution', () => {
    beforeEach(async () => {
      await frontendAgent.initialize(mockConfig);
    });

    it('should execute component creation task successfully', async () => {
      const task: Task = {
        id: 'task-1',
        title: 'Create UserProfile Component',
        description: 'Create a reusable UserProfile component',
        type: 'component-creation',
        status: TaskStatus.PENDING,
        priority: TaskPriority.MEDIUM,
        dependencies: [],
        estimatedTime: 3600,
        files: ['src/components/UserProfile.tsx'],
        requirements: ['Create reusable component', 'Include TypeScript types'],
        createdAt: new Date()
      };

      const result = await frontendAgent.executeTask(task);

      expect(result.success).toBe(true);
      expect(result.taskId).toBe(task.id);
      expect(result.filesModified).toContain('src/components/UserProfile.tsx');
      expect(result.filesModified).toContain('src/components/__tests__/UserProfile.test.tsx');
      expect(result.filesModified).toContain('src/components/UserProfile.module.css');
      expect(result.output).toHaveProperty('componentPath');
      expect(result.output).toHaveProperty('testPath');
      expect(result.output).toHaveProperty('stylePath');
    });

    it('should execute UI implementation task successfully', async () => {
      const task: Task = {
        id: 'task-2',
        title: 'Implement Dashboard Layout',
        description: 'Create responsive dashboard layout',
        type: 'ui-implementation',
        status: TaskStatus.PENDING,
        priority: TaskPriority.HIGH,
        dependencies: [],
        estimatedTime: 7200,
        files: ['src/pages/Dashboard.tsx', 'src/layouts/DashboardLayout.tsx'],
        requirements: ['Responsive design', 'Accessibility compliance'],
        createdAt: new Date()
      };

      const result = await frontendAgent.executeTask(task);

      expect(result.success).toBe(true);
      expect(result.taskId).toBe(task.id);
      expect(result.output).toHaveProperty('layoutCode');
      expect(result.output).toHaveProperty('responsiveStyles');
      expect(result.output).toHaveProperty('a11yFeatures');
    });

    it('should execute styling task successfully', async () => {
      const task: Task = {
        id: 'task-3',
        title: 'Style Navigation Component',
        description: 'Apply styling to navigation component',
        type: 'styling',
        status: TaskStatus.PENDING,
        priority: TaskPriority.MEDIUM,
        dependencies: [],
        estimatedTime: 1800,
        files: ['src/components/Navigation.css'],
        requirements: ['Follow design system', 'Support dark theme'],
        createdAt: new Date()
      };

      const result = await frontendAgent.executeTask(task);

      expect(result.success).toBe(true);
      expect(result.taskId).toBe(task.id);
      expect(result.output).toHaveProperty('styleCode');
      expect(result.output).toHaveProperty('designTokens');
      expect(result.output).toHaveProperty('themeVariations');
    });

    it('should execute state management task successfully', async () => {
      const task: Task = {
        id: 'task-4',
        title: 'Implement User State Management',
        description: 'Create user state management with Redux',
        type: 'state-management',
        status: TaskStatus.PENDING,
        priority: TaskPriority.HIGH,
        dependencies: [],
        estimatedTime: 5400,
        files: ['src/store/userSlice.ts', 'src/store/userSelectors.ts'],
        requirements: ['Use Redux Toolkit', 'Include async actions'],
        createdAt: new Date()
      };

      const result = await frontendAgent.executeTask(task);

      expect(result.success).toBe(true);
      expect(result.taskId).toBe(task.id);
      expect(result.output).toHaveProperty('stateCode');
      expect(result.output).toHaveProperty('actionsCode');
      expect(result.output).toHaveProperty('selectorsCode');
    });

    it('should execute routing task successfully', async () => {
      const task: Task = {
        id: 'task-5',
        title: 'Setup Application Routing',
        description: 'Configure React Router for the application',
        type: 'routing',
        status: TaskStatus.PENDING,
        priority: TaskPriority.HIGH,
        dependencies: [],
        estimatedTime: 3600,
        files: ['src/router/index.ts', 'src/router/guards.ts'],
        requirements: ['Protected routes', 'Lazy loading'],
        createdAt: new Date()
      };

      const result = await frontendAgent.executeTask(task);

      expect(result.success).toBe(true);
      expect(result.taskId).toBe(task.id);
      expect(result.output).toHaveProperty('routeConfig');
      expect(result.output).toHaveProperty('routeGuards');
      expect(result.output).toHaveProperty('navigationComponents');
    });

    it('should execute API integration task successfully', async () => {
      const task: Task = {
        id: 'task-6',
        title: 'Integrate User API',
        description: 'Create API integration for user management',
        type: 'api-integration',
        status: TaskStatus.PENDING,
        priority: TaskPriority.MEDIUM,
        dependencies: [],
        estimatedTime: 4500,
        files: ['src/api/userApi.ts', 'src/hooks/useUser.ts'],
        requirements: ['REST API integration', 'Error handling'],
        createdAt: new Date()
      };

      const result = await frontendAgent.executeTask(task);

      expect(result.success).toBe(true);
      expect(result.taskId).toBe(task.id);
      expect(result.output).toHaveProperty('apiClient');
      expect(result.output).toHaveProperty('dataHooks');
      expect(result.output).toHaveProperty('errorHandling');
    });

    it('should execute performance optimization task successfully', async () => {
      const task: Task = {
        id: 'task-7',
        title: 'Optimize Application Performance',
        description: 'Improve application performance and bundle size',
        type: 'performance-optimization',
        status: TaskStatus.PENDING,
        priority: TaskPriority.HIGH,
        dependencies: [],
        estimatedTime: 7200,
        files: ['src/components/LazyComponents.tsx'],
        requirements: ['Code splitting', 'Bundle optimization'],
        createdAt: new Date()
      };

      const result = await frontendAgent.executeTask(task);

      expect(result.success).toBe(true);
      expect(result.taskId).toBe(task.id);
      expect(result.output).toHaveProperty('performanceAnalysis');
      expect(result.output).toHaveProperty('codeSplitting');
      expect(result.output).toHaveProperty('bundleOptimization');
      expect(result.output).toHaveProperty('lazyLoading');
    });

    it('should execute frontend testing task successfully', async () => {
      const task: Task = {
        id: 'task-8',
        title: 'Create Component Tests',
        description: 'Write comprehensive tests for components',
        type: 'testing',
        status: TaskStatus.PENDING,
        priority: TaskPriority.MEDIUM,
        dependencies: [],
        estimatedTime: 5400,
        files: ['src/components/Button.tsx'],
        requirements: ['Unit tests', 'Integration tests', 'E2E tests'],
        createdAt: new Date()
      };

      const result = await frontendAgent.executeTask(task);

      expect(result.success).toBe(true);
      expect(result.taskId).toBe(task.id);
      expect(result.output).toHaveProperty('unitTests');
      expect(result.output).toHaveProperty('integrationTests');
      expect(result.output).toHaveProperty('e2eTests');
      expect(result.output).toHaveProperty('visualTests');
    });

    it('should execute build optimization task successfully', async () => {
      const task: Task = {
        id: 'task-9',
        title: 'Optimize Build Configuration',
        description: 'Optimize webpack/vite build configuration',
        type: 'build-optimization',
        status: TaskStatus.PENDING,
        priority: TaskPriority.MEDIUM,
        dependencies: [],
        estimatedTime: 3600,
        files: ['webpack.config.js'],
        requirements: ['Tree shaking', 'Asset optimization'],
        createdAt: new Date()
      };

      const result = await frontendAgent.executeTask(task);

      expect(result.success).toBe(true);
      expect(result.taskId).toBe(task.id);
      expect(result.output).toHaveProperty('buildConfig');
      expect(result.output).toHaveProperty('treeShaking');
      expect(result.output).toHaveProperty('assetOptimization');
      expect(result.filesModified).toContain('webpack.config.js');
      expect(result.filesModified).toContain('vite.config.js');
      expect(result.filesModified).toContain('package.json');
    });

    it('should handle generic frontend task', async () => {
      const task: Task = {
        id: 'task-10',
        title: 'Custom Frontend Task',
        description: 'A custom frontend development task',
        type: 'custom-frontend',
        status: TaskStatus.PENDING,
        priority: TaskPriority.LOW,
        dependencies: [],
        estimatedTime: 1800,
        files: ['src/custom/feature.ts'],
        requirements: ['Custom implementation'],
        createdAt: new Date()
      };

      const result = await frontendAgent.executeTask(task);

      expect(result.success).toBe(true);
      expect(result.taskId).toBe(task.id);
      expect(result.output).toHaveProperty('analysis');
      expect(result.output).toHaveProperty('generatedCode');
    });

    it('should handle task execution failure gracefully', async () => {
      // Create a task that will cause an error
      const invalidTask: Task = {
        id: 'invalid-task',
        title: '',
        description: '',
        type: 'component-creation',
        status: TaskStatus.PENDING,
        priority: TaskPriority.MEDIUM,
        dependencies: [],
        estimatedTime: 3600,
        files: [],
        requirements: [],
        createdAt: new Date()
      };

      const result = await frontendAgent.executeTask(invalidTask);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.taskId).toBe(invalidTask.id);
    });

    it('should warn about non-frontend task types', async () => {
      const logSpy = jest.spyOn(console, 'log').mockImplementation();
      
      const task: Task = {
        id: 'task-backend',
        title: 'Database Migration',
        description: 'Run database migration',
        type: 'database-migration',
        status: TaskStatus.PENDING,
        priority: TaskPriority.MEDIUM,
        dependencies: [],
        estimatedTime: 1800,
        files: [],
        requirements: [],
        createdAt: new Date()
      };

      await frontendAgent.executeTask(task);

      expect(logSpy).toHaveBeenCalledWith(
        expect.stringContaining("Task type 'database-migration' may not be suitable for frontend agent")
      );

      logSpy.mockRestore();
    });
  });

  describe('Configuration Management', () => {
    beforeEach(async () => {
      await frontendAgent.initialize(mockConfig);
    });

    it('should update configuration successfully', async () => {
      const newConfig: Partial<FrontendAgentConfig> = {
        frameworks: ['react', 'svelte'],
        buildTools: ['vite'],
        maxConcurrentTasks: 5
      };

      await frontendAgent.updateConfig(newConfig);

      const updatedConfig = frontendAgent.getConfig() as FrontendAgentConfig;
      expect(updatedConfig.frameworks).toEqual(['react', 'svelte']);
      expect(updatedConfig.buildTools).toEqual(['vite']);
      expect(updatedConfig.maxConcurrentTasks).toBe(5);
    });

    it.skip('should update capabilities when configuration changes', async () => {
      const newConfig: Partial<FrontendAgentConfig> = {
        frameworks: ['svelte'],
        buildTools: ['rollup'],
        testingLibraries: ['vitest']
      };

      await frontendAgent.updateConfig(newConfig);

      const capabilities = frontendAgent.getCapabilities();
      expect(capabilities).toContain('svelte-development');
      expect(capabilities).toContain('rollup-configuration');
      expect(capabilities).toContain('vitest-testing');
    });
  });

  describe('Status and Monitoring', () => {
    beforeEach(async () => {
      await frontendAgent.initialize(mockConfig);
    });

    it('should track workload correctly', async () => {
      expect(frontendAgent.getWorkload()).toBe(0);

      const task: Task = {
        id: 'task-1',
        title: 'Test Task',
        description: 'A test task',
        type: 'component-creation',
        status: TaskStatus.PENDING,
        priority: TaskPriority.MEDIUM,
        dependencies: [],
        estimatedTime: 1000,
        files: [],
        requirements: [],
        createdAt: new Date()
      };

      // Execute task and check final state
      await frontendAgent.executeTask(task);
      
      // Should be idle after completion
      expect(frontendAgent.getStatus()).toBe(AgentStatus.IDLE);
      expect(frontendAgent.getWorkload()).toBe(0);
    });

    it('should provide agent statistics', async () => {
      const task: Task = {
        id: 'task-1',
        title: 'Test Task',
        description: 'A test task',
        type: 'component-creation',
        status: TaskStatus.PENDING,
        priority: TaskPriority.MEDIUM,
        dependencies: [],
        estimatedTime: 1000,
        files: [],
        requirements: [],
        createdAt: new Date()
      };

      await frontendAgent.executeTask(task);

      const stats = frontendAgent.getStatistics();
      expect(stats.totalTasks).toBe(1);
      expect(stats.completedTasks).toBe(1);
      expect(stats.failedTasks).toBe(0);
      expect(stats.successRate).toBe(1);
      expect(stats.status).toBe(AgentStatus.IDLE);
    });

    it('should report as healthy when properly initialized', async () => {
      expect(frontendAgent.isHealthy()).toBe(true);
    });
  });

  describe('Shutdown', () => {
    beforeEach(async () => {
      await frontendAgent.initialize(mockConfig);
    });

    it('should shutdown gracefully', async () => {
      await frontendAgent.shutdown();
      
      expect(frontendAgent.getStatus()).toBe(AgentStatus.OFFLINE);
      expect(frontendAgent.isHealthy()).toBe(false);
    });

    it('should handle shutdown when not initialized', async () => {
      const newAgent = new FrontendAgent('test-2', 'Test Agent 2', mockConfig);
      
      // Should not throw error
      await expect(newAgent.shutdown()).resolves.not.toThrow();
    });
  });
});
/**
 * Unit tests for TestingAgent
 */

import { TestingAgent, TestingAgentConfig } from '../TestingAgent';
import { AgentType, AgentStatus, TaskStatus, TaskPriority } from '../../types';
import { Task } from '../../types/task.types';

describe('TestingAgent', () => {
  let testingAgent: TestingAgent;
  let mockConfig: TestingAgentConfig;

  beforeEach(() => {
    mockConfig = {
      name: 'TestTestingAgent',
      type: AgentType.TESTING,
      capabilities: [],
      maxConcurrentTasks: 3,
      timeout: 30000,
      retryAttempts: 3,
      testingFrameworks: ['jest', 'cypress', 'playwright'],
      testTypes: ['unit', 'integration', 'e2e', 'performance'],
      coverageTools: ['istanbul', 'nyc', 'c8'],
      reportingTools: ['allure', 'mochawesome', 'junit'],
      automationTools: ['github-actions', 'jenkins', 'gitlab-ci'],
      testEnvironments: ['local', 'staging', 'production'],
      quality: {
        coverageThreshold: 80,
        performanceThreshold: 200,
        reliabilityThreshold: 95,
        maintainability: true
      },
      analysis: {
        coverageAnalysis: true,
        performanceAnalysis: true,
        regressionAnalysis: true,
        flakynessDetection: true
      }
    };

    testingAgent = new TestingAgent('testing-1', 'Testing Agent', mockConfig);
  });

  afterEach(async () => {
    if (testingAgent.getStatus() !== AgentStatus.OFFLINE) {
      await testingAgent.shutdown();
    }
  });

  describe('Initialization', () => {
    it('should initialize with correct specialization', () => {
      expect(testingAgent.specialization).toBe(AgentType.TESTING);
      expect(testingAgent.name).toBe('Testing Agent');
      expect(testingAgent.id).toBe('testing-1');
    });

    it('should initialize successfully with valid config', async () => {
      await testingAgent.initialize(mockConfig);
      
      expect(testingAgent.getStatus()).toBe(AgentStatus.IDLE);
      expect(testingAgent.getCapabilities()).toContain('unit-testing');
      expect(testingAgent.getCapabilities()).toContain('integration-testing');
      expect(testingAgent.getCapabilities()).toContain('jest-testing');
      expect(testingAgent.getCapabilities()).toContain('unit-test-type');
    });

    it('should throw error when initializing with invalid config (no frameworks)', async () => {
      const invalidConfig = { ...mockConfig, testingFrameworks: [] };
      
      await expect(testingAgent.initialize(invalidConfig)).rejects.toThrow(
        'Testing agent must have at least one testing framework configured'
      );
    });

    it('should throw error when initializing with invalid config (no test types)', async () => {
      const invalidConfig = { ...mockConfig, testTypes: [] };
      
      await expect(testingAgent.initialize(invalidConfig)).rejects.toThrow(
        'Testing agent must have at least one test type configured'
      );
    });

    it('should setup testing-specific capabilities', async () => {
      await testingAgent.initialize(mockConfig);
      
      const capabilities = testingAgent.getCapabilities();
      expect(capabilities).toContain('unit-testing');
      expect(capabilities).toContain('integration-testing');
      expect(capabilities).toContain('e2e-testing');
      expect(capabilities).toContain('performance-testing');
      expect(capabilities).toContain('load-testing');
      expect(capabilities).toContain('security-testing');
      expect(capabilities).toContain('accessibility-testing');
      expect(capabilities).toContain('visual-testing');
      expect(capabilities).toContain('api-testing');
      expect(capabilities).toContain('test-automation');
      expect(capabilities).toContain('coverage-analysis');
      expect(capabilities).toContain('test-reporting');
      expect(capabilities).toContain('test-maintenance');
      expect(capabilities).toContain('jest-testing');
      expect(capabilities).toContain('unit-test-type');
      expect(capabilities).toContain('istanbul-coverage');
      expect(capabilities).toContain('allure-reporting');
      expect(capabilities).toContain('github-actions-automation');
    });
  });

  describe('Task Execution', () => {
    beforeEach(async () => {
      await testingAgent.initialize(mockConfig);
    });

    it('should execute unit testing task successfully', async () => {
      const task: Task = {
        id: 'task-1',
        title: 'Create Unit Tests for User Service',
        description: 'Write comprehensive unit tests for user service',
        type: 'unit-testing',
        status: TaskStatus.PENDING,
        priority: TaskPriority.HIGH,
        dependencies: [],
        estimatedTime: 3600,
        files: ['src/services/UserService.ts', 'src/models/User.ts'],
        requirements: ['Jest framework', '90% coverage', 'Mock dependencies'],
        createdAt: new Date()
      };

      const result = await testingAgent.executeTask(task);

      expect(result.success).toBe(true);
      expect(result.taskId).toBe(task.id);
      expect(result.output).toHaveProperty('unitTests');
      expect(result.output).toHaveProperty('testUtilities');
      expect(result.output).toHaveProperty('mocks');
      expect(result.output).toHaveProperty('testResults');
      expect(result.filesModified.length).toBeGreaterThan(0);
    });

    it('should execute integration testing task successfully', async () => {
      const task: Task = {
        id: 'task-2',
        title: 'Create Integration Tests for API',
        description: 'Write integration tests for REST API endpoints',
        type: 'integration-testing',
        status: TaskStatus.PENDING,
        priority: TaskPriority.HIGH,
        dependencies: [],
        estimatedTime: 5400,
        files: ['src/controllers/UserController.ts', 'src/routes/users.ts'],
        requirements: ['Database integration', 'API testing', 'Test fixtures'],
        createdAt: new Date()
      };

      const result = await testingAgent.executeTask(task);

      expect(result.success).toBe(true);
      expect(result.taskId).toBe(task.id);
      expect(result.output).toHaveProperty('integrationTests');
      expect(result.output).toHaveProperty('testEnvironment');
      expect(result.output).toHaveProperty('testFixtures');
      expect(result.output).toHaveProperty('testResults');
    });

    it('should execute E2E testing task successfully', async () => {
      const task: Task = {
        id: 'task-3',
        title: 'Create E2E Tests for User Journey',
        description: 'Write end-to-end tests for user registration flow',
        type: 'e2e-testing',
        status: TaskStatus.PENDING,
        priority: TaskPriority.MEDIUM,
        dependencies: [],
        estimatedTime: 7200,
        files: ['src/pages/Register.tsx', 'src/pages/Login.tsx'],
        requirements: ['Cypress/Playwright', 'Cross-browser', 'Page objects'],
        createdAt: new Date()
      };

      const result = await testingAgent.executeTask(task);

      expect(result.success).toBe(true);
      expect(result.taskId).toBe(task.id);
      expect(result.output).toHaveProperty('e2eTests');
      expect(result.output).toHaveProperty('browserSetup');
      expect(result.output).toHaveProperty('pageObjects');
      expect(result.output).toHaveProperty('testResults');
    });

    it('should execute performance testing task successfully', async () => {
      const task: Task = {
        id: 'task-4',
        title: 'Create Performance Tests',
        description: 'Write performance tests for critical API endpoints',
        type: 'performance-testing',
        status: TaskStatus.PENDING,
        priority: TaskPriority.HIGH,
        dependencies: [],
        estimatedTime: 4500,
        files: ['src/api/users.ts', 'src/api/orders.ts'],
        requirements: ['Response time < 200ms', 'Memory profiling', 'Load scenarios'],
        createdAt: new Date()
      };

      const result = await testingAgent.executeTask(task);

      expect(result.success).toBe(true);
      expect(result.taskId).toBe(task.id);
      expect(result.output).toHaveProperty('performanceTests');
      expect(result.output).toHaveProperty('monitoring');
      expect(result.output).toHaveProperty('testResults');
      expect(result.output).toHaveProperty('performanceAnalysis');
    });

    it('should execute load testing task successfully', async () => {
      const task: Task = {
        id: 'task-5',
        title: 'Create Load Tests',
        description: 'Write load tests to validate system scalability',
        type: 'load-testing',
        status: TaskStatus.PENDING,
        priority: TaskPriority.MEDIUM,
        dependencies: [],
        estimatedTime: 6300,
        files: ['src/api/index.ts'],
        requirements: ['1000 concurrent users', 'Ramp-up scenarios', 'Stress testing'],
        createdAt: new Date()
      };

      const result = await testingAgent.executeTask(task);

      expect(result.success).toBe(true);
      expect(result.taskId).toBe(task.id);
      expect(result.output).toHaveProperty('loadTests');
      expect(result.output).toHaveProperty('loadInfrastructure');
      expect(result.output).toHaveProperty('testResults');
      expect(result.output).toHaveProperty('loadAnalysis');
    });

    it('should execute security testing task successfully', async () => {
      const task: Task = {
        id: 'task-6',
        title: 'Create Security Tests',
        description: 'Write security tests for authentication and authorization',
        type: 'security-testing',
        status: TaskStatus.PENDING,
        priority: TaskPriority.HIGH,
        dependencies: [],
        estimatedTime: 5400,
        files: ['src/auth/AuthService.ts', 'src/middleware/auth.ts'],
        requirements: ['OWASP Top 10', 'SQL injection', 'XSS prevention'],
        createdAt: new Date()
      };

      const result = await testingAgent.executeTask(task);

      expect(result.success).toBe(true);
      expect(result.taskId).toBe(task.id);
      expect(result.output).toHaveProperty('securityTests');
      expect(result.output).toHaveProperty('securityTools');
      expect(result.output).toHaveProperty('testResults');
      expect(result.output).toHaveProperty('securityAnalysis');
    });

    it('should execute accessibility testing task successfully', async () => {
      const task: Task = {
        id: 'task-7',
        title: 'Create Accessibility Tests',
        description: 'Write accessibility tests for WCAG compliance',
        type: 'accessibility-testing',
        status: TaskStatus.PENDING,
        priority: TaskPriority.MEDIUM,
        dependencies: [],
        estimatedTime: 3600,
        files: ['src/components/Form.tsx', 'src/components/Navigation.tsx'],
        requirements: ['WCAG 2.1 AA', 'Screen reader', 'Keyboard navigation'],
        createdAt: new Date()
      };

      const result = await testingAgent.executeTask(task);

      expect(result.success).toBe(true);
      expect(result.taskId).toBe(task.id);
      expect(result.output).toHaveProperty('a11yTests');
      expect(result.output).toHaveProperty('a11yTools');
      expect(result.output).toHaveProperty('testResults');
      expect(result.output).toHaveProperty('a11yAnalysis');
    });

    it('should execute visual testing task successfully', async () => {
      const task: Task = {
        id: 'task-8',
        title: 'Create Visual Regression Tests',
        description: 'Write visual tests to detect UI regressions',
        type: 'visual-testing',
        status: TaskStatus.PENDING,
        priority: TaskPriority.MEDIUM,
        dependencies: [],
        estimatedTime: 4500,
        files: ['src/components/Button.tsx', 'src/pages/Dashboard.tsx'],
        requirements: ['Screenshot comparison', 'Cross-browser', 'Responsive'],
        createdAt: new Date()
      };

      const result = await testingAgent.executeTask(task);

      expect(result.success).toBe(true);
      expect(result.taskId).toBe(task.id);
      expect(result.output).toHaveProperty('visualTests');
      expect(result.output).toHaveProperty('visualTools');
      expect(result.output).toHaveProperty('baselines');
      expect(result.output).toHaveProperty('testResults');
    });

    it('should execute API testing task successfully', async () => {
      const task: Task = {
        id: 'task-9',
        title: 'Create API Tests',
        description: 'Write comprehensive API tests for REST endpoints',
        type: 'api-testing',
        status: TaskStatus.PENDING,
        priority: TaskPriority.HIGH,
        dependencies: [],
        estimatedTime: 5400,
        files: ['src/api/users.ts', 'src/api/orders.ts'],
        requirements: ['Schema validation', 'Error handling', 'Authentication'],
        createdAt: new Date()
      };

      const result = await testingAgent.executeTask(task);

      expect(result.success).toBe(true);
      expect(result.taskId).toBe(task.id);
      expect(result.output).toHaveProperty('apiTests');
      expect(result.output).toHaveProperty('apiTools');
      expect(result.output).toHaveProperty('testSchemas');
      expect(result.output).toHaveProperty('testResults');
    });

    it('should execute test automation task successfully', async () => {
      const task: Task = {
        id: 'task-10',
        title: 'Setup Test Automation',
        description: 'Setup automated testing pipeline in CI/CD',
        type: 'test-automation',
        status: TaskStatus.PENDING,
        priority: TaskPriority.HIGH,
        dependencies: [],
        estimatedTime: 7200,
        files: ['.github/workflows/test.yml', 'jest.config.js'],
        requirements: ['GitHub Actions', 'Parallel execution', 'Test reporting'],
        createdAt: new Date()
      };

      const result = await testingAgent.executeTask(task);

      expect(result.success).toBe(true);
      expect(result.taskId).toBe(task.id);
      expect(result.output).toHaveProperty('automationFramework');
      expect(result.output).toHaveProperty('cicdIntegration');
      expect(result.output).toHaveProperty('testPipelines');
      expect(result.output).toHaveProperty('testReporting');
    });

    it('should execute coverage analysis task successfully', async () => {
      const task: Task = {
        id: 'task-11',
        title: 'Analyze Test Coverage',
        description: 'Analyze and improve test coverage',
        type: 'coverage-analysis',
        status: TaskStatus.PENDING,
        priority: TaskPriority.MEDIUM,
        dependencies: [],
        estimatedTime: 2700,
        files: ['src/**/*.ts'],
        requirements: ['80% coverage', 'Branch coverage', 'Coverage reports'],
        createdAt: new Date()
      };

      const result = await testingAgent.executeTask(task);

      expect(result.success).toBe(true);
      expect(result.taskId).toBe(task.id);
      expect(result.output).toHaveProperty('coverageTools');
      expect(result.output).toHaveProperty('coverageResults');
      expect(result.output).toHaveProperty('coverageReports');
      expect(result.output).toHaveProperty('coverageGaps');
    });

    it('should execute test reporting task successfully', async () => {
      const task: Task = {
        id: 'task-12',
        title: 'Generate Test Reports',
        description: 'Generate comprehensive test reports and dashboards',
        type: 'test-reporting',
        status: TaskStatus.PENDING,
        priority: TaskPriority.MEDIUM,
        dependencies: [],
        estimatedTime: 3600,
        files: ['reports/'],
        requirements: ['HTML reports', 'Trend analysis', 'Stakeholder dashboards'],
        createdAt: new Date()
      };

      const result = await testingAgent.executeTask(task);

      expect(result.success).toBe(true);
      expect(result.taskId).toBe(task.id);
      expect(result.output).toHaveProperty('testReports');
      expect(result.output).toHaveProperty('dashboards');
      expect(result.output).toHaveProperty('notifications');
      expect(result.output).toHaveProperty('analytics');
    });

    it('should execute test maintenance task successfully', async () => {
      const task: Task = {
        id: 'task-13',
        title: 'Maintain Test Suite',
        description: 'Optimize and maintain existing test suite',
        type: 'test-maintenance',
        status: TaskStatus.PENDING,
        priority: TaskPriority.LOW,
        dependencies: [],
        estimatedTime: 5400,
        files: ['tests/**/*.test.ts'],
        requirements: ['Flaky test detection', 'Performance optimization', 'Documentation'],
        createdAt: new Date()
      };

      const result = await testingAgent.executeTask(task);

      expect(result.success).toBe(true);
      expect(result.taskId).toBe(task.id);
      expect(result.output).toHaveProperty('testHealth');
      expect(result.output).toHaveProperty('flakyTests');
      expect(result.output).toHaveProperty('testOptimization');
      expect(result.output).toHaveProperty('documentation');
    });

    it('should handle generic testing task', async () => {
      const task: Task = {
        id: 'task-14',
        title: 'Custom Testing Task',
        description: 'A custom testing development task',
        type: 'custom-testing',
        status: TaskStatus.PENDING,
        priority: TaskPriority.LOW,
        dependencies: [],
        estimatedTime: 1800,
        files: ['src/custom/feature.ts'],
        requirements: ['Custom test implementation'],
        createdAt: new Date()
      };

      const result = await testingAgent.executeTask(task);

      expect(result.success).toBe(true);
      expect(result.taskId).toBe(task.id);
      expect(result.output).toHaveProperty('analysis');
      expect(result.output).toHaveProperty('generatedTests');
    });

    it('should handle task execution failure gracefully', async () => {
      // Create a task that will cause an error
      const invalidTask: Task = {
        id: 'invalid-task',
        title: '',
        description: '',
        type: 'unit-testing',
        status: TaskStatus.PENDING,
        priority: TaskPriority.MEDIUM,
        dependencies: [],
        estimatedTime: 3600,
        files: [],
        requirements: [],
        createdAt: new Date()
      };

      const result = await testingAgent.executeTask(invalidTask);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.taskId).toBe(invalidTask.id);
    });

    it('should warn about non-testing task types', async () => {
      const logSpy = jest.spyOn(console, 'log').mockImplementation();
      
      const task: Task = {
        id: 'task-frontend',
        title: 'Create React Component',
        description: 'Create a React component',
        type: 'component-creation',
        status: TaskStatus.PENDING,
        priority: TaskPriority.MEDIUM,
        dependencies: [],
        estimatedTime: 1800,
        files: [],
        requirements: [],
        createdAt: new Date()
      };

      await testingAgent.executeTask(task);

      expect(logSpy).toHaveBeenCalledWith(
        expect.stringContaining("Task type 'component-creation' may not be suitable for testing agent")
      );

      logSpy.mockRestore();
    });
  });

  describe('Configuration Management', () => {
    beforeEach(async () => {
      await testingAgent.initialize(mockConfig);
    });

    it('should update configuration successfully', async () => {
      const newConfig: Partial<TestingAgentConfig> = {
        testingFrameworks: ['vitest', 'playwright'],
        testTypes: ['unit', 'e2e'],
        maxConcurrentTasks: 5
      };

      await testingAgent.updateConfig(newConfig);

      const updatedConfig = testingAgent.getConfig() as TestingAgentConfig;
      expect(updatedConfig.testingFrameworks).toEqual(['vitest', 'playwright']);
      expect(updatedConfig.testTypes).toEqual(['unit', 'e2e']);
      expect(updatedConfig.maxConcurrentTasks).toBe(5);
    });

    it('should update capabilities when configuration changes', async () => {
      const newConfig: Partial<TestingAgentConfig> = {
        testingFrameworks: ['vitest'],
        testTypes: ['unit'],
        coverageTools: ['c8'],
        reportingTools: ['junit'],
        automationTools: ['gitlab-ci']
      };

      await testingAgent.updateConfig(newConfig);

      const capabilities = testingAgent.getCapabilities();
      expect(capabilities).toContain('vitest-testing');
      expect(capabilities).toContain('unit-test-type');
      expect(capabilities).toContain('c8-coverage');
      expect(capabilities).toContain('junit-reporting');
      expect(capabilities).toContain('gitlab-ci-automation');
    });
  });

  describe('Status and Monitoring', () => {
    beforeEach(async () => {
      await testingAgent.initialize(mockConfig);
    });

    it('should track workload correctly', async () => {
      expect(testingAgent.getWorkload()).toBe(0);

      const task: Task = {
        id: 'task-1',
        title: 'Test Task',
        description: 'A test task',
        type: 'unit-testing',
        status: TaskStatus.PENDING,
        priority: TaskPriority.MEDIUM,
        dependencies: [],
        estimatedTime: 1000,
        files: [],
        requirements: [],
        createdAt: new Date()
      };

      // Execute task and check final state
      await testingAgent.executeTask(task);
      
      // Should be idle after completion
      expect(testingAgent.getStatus()).toBe(AgentStatus.IDLE);
      expect(testingAgent.getWorkload()).toBe(0);
    });

    it('should provide agent statistics', async () => {
      const task: Task = {
        id: 'task-1',
        title: 'Test Task',
        description: 'A test task',
        type: 'unit-testing',
        status: TaskStatus.PENDING,
        priority: TaskPriority.MEDIUM,
        dependencies: [],
        estimatedTime: 1000,
        files: [],
        requirements: [],
        createdAt: new Date()
      };

      await testingAgent.executeTask(task);

      const stats = testingAgent.getStatistics();
      expect(stats.totalTasks).toBe(1);
      expect(stats.completedTasks).toBe(1);
      expect(stats.failedTasks).toBe(0);
      expect(stats.successRate).toBe(1);
      expect(stats.status).toBe(AgentStatus.IDLE);
    });

    it('should report as healthy when properly initialized', async () => {
      expect(testingAgent.isHealthy()).toBe(true);
    });
  });

  describe('Shutdown', () => {
    beforeEach(async () => {
      await testingAgent.initialize(mockConfig);
    });

    it('should shutdown gracefully', async () => {
      await testingAgent.shutdown();
      
      expect(testingAgent.getStatus()).toBe(AgentStatus.OFFLINE);
      expect(testingAgent.isHealthy()).toBe(false);
    });

    it('should handle shutdown when not initialized', async () => {
      const newAgent = new TestingAgent('test-2', 'Test Agent 2', mockConfig);
      
      // Should not throw error
      await expect(newAgent.shutdown()).resolves.not.toThrow();
    });
  });
});
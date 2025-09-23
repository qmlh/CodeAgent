/**
 * Unit tests for CodeReviewAgent
 */

import { CodeReviewAgent, CodeReviewAgentConfig } from '../CodeReviewAgent';
import { AgentType, AgentStatus, TaskStatus, TaskPriority } from '../../types';
import { Task } from '../../types/task.types';

describe('CodeReviewAgent', () => {
  let codeReviewAgent: CodeReviewAgent;
  let mockConfig: CodeReviewAgentConfig;

  beforeEach(() => {
    mockConfig = {
      name: 'TestCodeReviewAgent',
      type: AgentType.CODE_REVIEW,
      capabilities: [],
      maxConcurrentTasks: 3,
      timeout: 30000,
      retryAttempts: 3,
      reviewTypes: ['static-analysis', 'security', 'performance', 'quality'],
      languages: ['typescript', 'javascript', 'python', 'java'],
      linters: ['eslint', 'tslint', 'pylint', 'checkstyle'],
      qualityTools: ['sonarqube', 'codeclimate', 'codeacy'],
      securityTools: ['snyk', 'bandit', 'semgrep'],
      standards: {
        codingStandards: ['airbnb', 'google', 'pep8'],
        documentationStandards: ['jsdoc', 'sphinx', 'javadoc'],
        testingStandards: ['jest', 'pytest', 'junit'],
        securityStandards: ['owasp', 'sans', 'nist']
      },
      analysis: {
        staticAnalysis: true,
        securityAnalysis: true,
        performanceAnalysis: true,
        maintainabilityAnalysis: true,
        duplicateDetection: true
      },
      thresholds: {
        complexityThreshold: 10,
        duplicateThreshold: 5,
        coverageThreshold: 80,
        maintainabilityIndex: 70
      }
    };

    codeReviewAgent = new CodeReviewAgent('review-1', 'Code Review Agent', mockConfig);
  });

  afterEach(async () => {
    if (codeReviewAgent.getStatus() !== AgentStatus.OFFLINE) {
      await codeReviewAgent.shutdown();
    }
  });

  describe('Initialization', () => {
    it('should initialize with correct specialization', () => {
      expect(codeReviewAgent.specialization).toBe(AgentType.CODE_REVIEW);
      expect(codeReviewAgent.name).toBe('Code Review Agent');
      expect(codeReviewAgent.id).toBe('review-1');
    });

    it('should initialize successfully with valid config', async () => {
      await codeReviewAgent.initialize(mockConfig);
      
      expect(codeReviewAgent.getStatus()).toBe(AgentStatus.IDLE);
      expect(codeReviewAgent.getCapabilities()).toContain('static-analysis');
      expect(codeReviewAgent.getCapabilities()).toContain('security-review');
      expect(codeReviewAgent.getCapabilities()).toContain('typescript-language');
      expect(codeReviewAgent.getCapabilities()).toContain('eslint-linting');
    });

    it('should throw error when initializing with invalid config (no review types)', async () => {
      const invalidConfig = { ...mockConfig, reviewTypes: [] };
      
      await expect(codeReviewAgent.initialize(invalidConfig)).rejects.toThrow(
        'Code review agent must have at least one review type configured'
      );
    });

    it('should throw error when initializing with invalid config (no languages)', async () => {
      const invalidConfig = { ...mockConfig, languages: [] };
      
      await expect(codeReviewAgent.initialize(invalidConfig)).rejects.toThrow(
        'Code review agent must have at least one language configured'
      );
    });

    it('should setup code review-specific capabilities', async () => {
      await codeReviewAgent.initialize(mockConfig);
      
      const capabilities = codeReviewAgent.getCapabilities();
      expect(capabilities).toContain('static-analysis');
      expect(capabilities).toContain('security-review');
      expect(capabilities).toContain('performance-review');
      expect(capabilities).toContain('code-quality-review');
      expect(capabilities).toContain('architecture-review');
      expect(capabilities).toContain('documentation-review');
      expect(capabilities).toContain('test-review');
      expect(capabilities).toContain('dependency-review');
      expect(capabilities).toContain('compliance-review');
      expect(capabilities).toContain('pull-request-review');
      expect(capabilities).toContain('code-metrics');
      expect(capabilities).toContain('refactoring-suggestions');
      expect(capabilities).toContain('static-analysis-review');
      expect(capabilities).toContain('typescript-language');
      expect(capabilities).toContain('eslint-linting');
      expect(capabilities).toContain('sonarqube-quality');
      expect(capabilities).toContain('snyk-security');
    });
  });

  describe('Task Execution', () => {
    beforeEach(async () => {
      await codeReviewAgent.initialize(mockConfig);
    });

    it('should execute static analysis task successfully', async () => {
      const task: Task = {
        id: 'task-1',
        title: 'Static Analysis Review',
        description: 'Perform static analysis on TypeScript code',
        type: 'static-analysis',
        status: TaskStatus.PENDING,
        priority: TaskPriority.HIGH,
        dependencies: [],
        estimatedTime: 1800,
        files: ['src/services/UserService.ts', 'src/models/User.ts'],
        requirements: ['ESLint', 'TypeScript compiler', 'Complexity analysis'],
        createdAt: new Date()
      };

      const result = await codeReviewAgent.executeTask(task);

      expect(result.success).toBe(true);
      expect(result.taskId).toBe(task.id);
      expect(result.output).toHaveProperty('staticAnalysisResults');
      expect(result.output).toHaveProperty('complexityAnalysis');
      expect(result.output).toHaveProperty('codeSmells');
      expect(result.output).toHaveProperty('analysisReport');
    });

    it('should execute security review task successfully', async () => {
      const task: Task = {
        id: 'task-2',
        title: 'Security Code Review',
        description: 'Review code for security vulnerabilities',
        type: 'security-review',
        status: TaskStatus.PENDING,
        priority: TaskPriority.HIGH,
        dependencies: [],
        estimatedTime: 2700,
        files: ['src/auth/AuthService.ts', 'src/middleware/security.ts'],
        requirements: ['OWASP compliance', 'Vulnerability scanning', 'Dependency check'],
        createdAt: new Date()
      };

      const result = await codeReviewAgent.executeTask(task);

      expect(result.success).toBe(true);
      expect(result.taskId).toBe(task.id);
      expect(result.output).toHaveProperty('securityAnalysis');
      expect(result.output).toHaveProperty('vulnerabilityCheck');
      expect(result.output).toHaveProperty('dependencySecurityCheck');
      expect(result.output).toHaveProperty('securityReport');
    });

    it('should execute performance review task successfully', async () => {
      const task: Task = {
        id: 'task-3',
        title: 'Performance Code Review',
        description: 'Review code for performance issues',
        type: 'performance-review',
        status: TaskStatus.PENDING,
        priority: TaskPriority.MEDIUM,
        dependencies: [],
        estimatedTime: 2400,
        files: ['src/api/handlers.ts', 'src/database/queries.ts'],
        requirements: ['Performance profiling', 'Memory analysis', 'Optimization suggestions'],
        createdAt: new Date()
      };

      const result = await codeReviewAgent.executeTask(task);

      expect(result.success).toBe(true);
      expect(result.taskId).toBe(task.id);
      expect(result.output).toHaveProperty('performanceAnalysis');
      expect(result.output).toHaveProperty('memoryAnalysis');
      expect(result.output).toHaveProperty('optimizationSuggestions');
      expect(result.output).toHaveProperty('performanceReport');
    });

    it('should execute code quality review task successfully', async () => {
      const task: Task = {
        id: 'task-4',
        title: 'Code Quality Review',
        description: 'Review code quality and maintainability',
        type: 'code-quality-review',
        status: TaskStatus.PENDING,
        priority: TaskPriority.MEDIUM,
        dependencies: [],
        estimatedTime: 3600,
        files: ['src/components/', 'src/utils/'],
        requirements: ['Coding standards', 'Maintainability', 'Duplicate detection'],
        createdAt: new Date()
      };

      const result = await codeReviewAgent.executeTask(task);

      expect(result.success).toBe(true);
      expect(result.taskId).toBe(task.id);
      expect(result.output).toHaveProperty('qualityAnalysis');
      expect(result.output).toHaveProperty('standardsCompliance');
      expect(result.output).toHaveProperty('maintainabilityAnalysis');
      expect(result.output).toHaveProperty('duplicateAnalysis');
      expect(result.output).toHaveProperty('qualityReport');
    });

    it('should execute architecture review task successfully', async () => {
      const task: Task = {
        id: 'task-5',
        title: 'Architecture Review',
        description: 'Review system architecture and design patterns',
        type: 'architecture-review',
        status: TaskStatus.PENDING,
        priority: TaskPriority.HIGH,
        dependencies: [],
        estimatedTime: 5400,
        files: ['src/architecture/', 'src/patterns/'],
        requirements: ['Design patterns', 'SOLID principles', 'Dependency analysis'],
        createdAt: new Date()
      };

      const result = await codeReviewAgent.executeTask(task);

      expect(result.success).toBe(true);
      expect(result.taskId).toBe(task.id);
      expect(result.output).toHaveProperty('architectureAnalysis');
      expect(result.output).toHaveProperty('designPatternAnalysis');
      expect(result.output).toHaveProperty('dependencyAnalysis');
      expect(result.output).toHaveProperty('architectureReport');
    });

    it('should execute documentation review task successfully', async () => {
      const task: Task = {
        id: 'task-6',
        title: 'Documentation Review',
        description: 'Review code documentation completeness and quality',
        type: 'documentation-review',
        status: TaskStatus.PENDING,
        priority: TaskPriority.LOW,
        dependencies: [],
        estimatedTime: 1800,
        files: ['src/**/*.ts', 'README.md', 'docs/'],
        requirements: ['JSDoc compliance', 'API documentation', 'README completeness'],
        createdAt: new Date()
      };

      const result = await codeReviewAgent.executeTask(task);

      expect(result.success).toBe(true);
      expect(result.taskId).toBe(task.id);
      expect(result.output).toHaveProperty('documentationAnalysis');
      expect(result.output).toHaveProperty('apiDocAnalysis');
      expect(result.output).toHaveProperty('completenessCheck');
      expect(result.output).toHaveProperty('documentationReport');
    });

    it('should execute test review task successfully', async () => {
      const task: Task = {
        id: 'task-7',
        title: 'Test Code Review',
        description: 'Review test coverage and quality',
        type: 'test-review',
        status: TaskStatus.PENDING,
        priority: TaskPriority.MEDIUM,
        dependencies: [],
        estimatedTime: 2700,
        files: ['src/**/*.test.ts', 'src/**/*.spec.ts'],
        requirements: ['Test coverage', 'Test quality', 'Testing patterns'],
        createdAt: new Date()
      };

      const result = await codeReviewAgent.executeTask(task);

      expect(result.success).toBe(true);
      expect(result.taskId).toBe(task.id);
      expect(result.output).toHaveProperty('coverageAnalysis');
      expect(result.output).toHaveProperty('testQualityAnalysis');
      expect(result.output).toHaveProperty('testPatternAnalysis');
      expect(result.output).toHaveProperty('testReport');
    });

    it('should execute dependency review task successfully', async () => {
      const task: Task = {
        id: 'task-8',
        title: 'Dependency Review',
        description: 'Review project dependencies for security and licensing',
        type: 'dependency-review',
        status: TaskStatus.PENDING,
        priority: TaskPriority.MEDIUM,
        dependencies: [],
        estimatedTime: 1800,
        files: ['package.json', 'package-lock.json', 'yarn.lock'],
        requirements: ['Security audit', 'License compliance', 'Outdated packages'],
        createdAt: new Date()
      };

      const result = await codeReviewAgent.executeTask(task);

      expect(result.success).toBe(true);
      expect(result.taskId).toBe(task.id);
      expect(result.output).toHaveProperty('dependencyAnalysis');
      expect(result.output).toHaveProperty('outdatedCheck');
      expect(result.output).toHaveProperty('licenseAnalysis');
      expect(result.output).toHaveProperty('dependencyReport');
    });

    it('should execute compliance review task successfully', async () => {
      const task: Task = {
        id: 'task-9',
        title: 'Compliance Review',
        description: 'Review code for regulatory and accessibility compliance',
        type: 'compliance-review',
        status: TaskStatus.PENDING,
        priority: TaskPriority.HIGH,
        dependencies: [],
        estimatedTime: 3600,
        files: ['src/components/', 'src/pages/'],
        requirements: ['GDPR compliance', 'WCAG accessibility', 'Industry standards'],
        createdAt: new Date()
      };

      const result = await codeReviewAgent.executeTask(task);

      expect(result.success).toBe(true);
      expect(result.taskId).toBe(task.id);
      expect(result.output).toHaveProperty('regulatoryCheck');
      expect(result.output).toHaveProperty('privacyCheck');
      expect(result.output).toHaveProperty('accessibilityCheck');
      expect(result.output).toHaveProperty('complianceReport');
    });

    it('should execute pull request review task successfully', async () => {
      const task: Task = {
        id: 'task-10',
        title: 'Pull Request Review #123',
        description: 'Review pull request changes',
        type: 'pull-request-review',
        status: TaskStatus.PENDING,
        priority: TaskPriority.HIGH,
        dependencies: [],
        estimatedTime: 2700,
        files: ['src/features/user-management.ts', 'src/tests/user.test.ts'],
        requirements: ['Code changes review', 'Commit message check', 'Breaking changes'],
        createdAt: new Date()
      };

      const result = await codeReviewAgent.executeTask(task);

      expect(result.success).toBe(true);
      expect(result.taskId).toBe(task.id);
      expect(result.output).toHaveProperty('changeAnalysis');
      expect(result.output).toHaveProperty('commitAnalysis');
      expect(result.output).toHaveProperty('breakingChangeAnalysis');
      expect(result.output).toHaveProperty('prFeedback');
    });

    it('should execute code metrics task successfully', async () => {
      const task: Task = {
        id: 'task-11',
        title: 'Code Metrics Analysis',
        description: 'Calculate and analyze code metrics',
        type: 'code-metrics',
        status: TaskStatus.PENDING,
        priority: TaskPriority.LOW,
        dependencies: [],
        estimatedTime: 1800,
        files: ['src/**/*.ts'],
        requirements: ['Complexity metrics', 'Maintainability index', 'Technical debt'],
        createdAt: new Date()
      };

      const result = await codeReviewAgent.executeTask(task);

      expect(result.success).toBe(true);
      expect(result.taskId).toBe(task.id);
      expect(result.output).toHaveProperty('codeMetrics');
      expect(result.output).toHaveProperty('trendAnalysis');
      expect(result.output).toHaveProperty('metricsDashboard');
    });

    it('should execute refactoring suggestions task successfully', async () => {
      const task: Task = {
        id: 'task-12',
        title: 'Refactoring Suggestions',
        description: 'Generate refactoring suggestions for code improvement',
        type: 'refactoring-suggestions',
        status: TaskStatus.PENDING,
        priority: TaskPriority.MEDIUM,
        dependencies: [],
        estimatedTime: 3600,
        files: ['src/legacy/', 'src/utils/'],
        requirements: ['Code smells detection', 'Refactoring opportunities', 'Impact analysis'],
        createdAt: new Date()
      };

      const result = await codeReviewAgent.executeTask(task);

      expect(result.success).toBe(true);
      expect(result.taskId).toBe(task.id);
      expect(result.output).toHaveProperty('refactoringOpportunities');
      expect(result.output).toHaveProperty('refactoringSuggestions');
      expect(result.output).toHaveProperty('impactAnalysis');
    });

    it('should handle generic code review task', async () => {
      const task: Task = {
        id: 'task-13',
        title: 'Custom Code Review',
        description: 'A custom code review task',
        type: 'custom-review',
        status: TaskStatus.PENDING,
        priority: TaskPriority.LOW,
        dependencies: [],
        estimatedTime: 1800,
        files: ['src/custom/feature.ts'],
        requirements: ['Custom review implementation'],
        createdAt: new Date()
      };

      const result = await codeReviewAgent.executeTask(task);

      expect(result.success).toBe(true);
      expect(result.taskId).toBe(task.id);
      expect(result.output).toHaveProperty('analysis');
      expect(result.output).toHaveProperty('reviewResults');
    });

    it('should handle task execution failure gracefully', async () => {
      // Create a task that will cause an error
      const invalidTask: Task = {
        id: 'invalid-task',
        title: '',
        description: '',
        type: 'static-analysis',
        status: TaskStatus.PENDING,
        priority: TaskPriority.MEDIUM,
        dependencies: [],
        estimatedTime: 3600,
        files: [],
        requirements: [],
        createdAt: new Date()
      };

      const result = await codeReviewAgent.executeTask(invalidTask);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.taskId).toBe(invalidTask.id);
    });

    it('should warn about non-review task types', async () => {
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

      await codeReviewAgent.executeTask(task);

      expect(logSpy).toHaveBeenCalledWith(
        expect.stringContaining("Task type 'component-creation' may not be suitable for code review agent")
      );

      logSpy.mockRestore();
    });
  });

  describe('Configuration Management', () => {
    beforeEach(async () => {
      await codeReviewAgent.initialize(mockConfig);
    });

    it('should update configuration successfully', async () => {
      const newConfig: Partial<CodeReviewAgentConfig> = {
        reviewTypes: ['security', 'performance'],
        languages: ['python', 'java'],
        maxConcurrentTasks: 5
      };

      await codeReviewAgent.updateConfig(newConfig);

      const updatedConfig = codeReviewAgent.getConfig() as CodeReviewAgentConfig;
      expect(updatedConfig.reviewTypes).toEqual(['security', 'performance']);
      expect(updatedConfig.languages).toEqual(['python', 'java']);
      expect(updatedConfig.maxConcurrentTasks).toBe(5);
    });

    it('should update capabilities when configuration changes', async () => {
      const newConfig: Partial<CodeReviewAgentConfig> = {
        reviewTypes: ['security'],
        languages: ['python'],
        linters: ['pylint'],
        qualityTools: ['codeclimate'],
        securityTools: ['bandit']
      };

      await codeReviewAgent.updateConfig(newConfig);

      const capabilities = codeReviewAgent.getCapabilities();
      expect(capabilities).toContain('security-review');
      expect(capabilities).toContain('python-language');
      expect(capabilities).toContain('pylint-linting');
      expect(capabilities).toContain('codeclimate-quality');
      expect(capabilities).toContain('bandit-security');
    });
  });

  describe('Status and Monitoring', () => {
    beforeEach(async () => {
      await codeReviewAgent.initialize(mockConfig);
    });

    it('should track workload correctly', async () => {
      expect(codeReviewAgent.getWorkload()).toBe(0);

      const task: Task = {
        id: 'task-1',
        title: 'Test Task',
        description: 'A test task',
        type: 'static-analysis',
        status: TaskStatus.PENDING,
        priority: TaskPriority.MEDIUM,
        dependencies: [],
        estimatedTime: 1000,
        files: [],
        requirements: [],
        createdAt: new Date()
      };

      // Execute task and check final state
      await codeReviewAgent.executeTask(task);
      
      // Should be idle after completion
      expect(codeReviewAgent.getStatus()).toBe(AgentStatus.IDLE);
      expect(codeReviewAgent.getWorkload()).toBe(0);
    });

    it('should provide agent statistics', async () => {
      const task: Task = {
        id: 'task-1',
        title: 'Test Task',
        description: 'A test task',
        type: 'static-analysis',
        status: TaskStatus.PENDING,
        priority: TaskPriority.MEDIUM,
        dependencies: [],
        estimatedTime: 1000,
        files: [],
        requirements: [],
        createdAt: new Date()
      };

      await codeReviewAgent.executeTask(task);

      const stats = codeReviewAgent.getStatistics();
      expect(stats.totalTasks).toBe(1);
      expect(stats.completedTasks).toBe(1);
      expect(stats.failedTasks).toBe(0);
      expect(stats.successRate).toBe(1);
      expect(stats.status).toBe(AgentStatus.IDLE);
    });

    it('should report as healthy when properly initialized', async () => {
      expect(codeReviewAgent.isHealthy()).toBe(true);
    });
  });

  describe('Shutdown', () => {
    beforeEach(async () => {
      await codeReviewAgent.initialize(mockConfig);
    });

    it('should shutdown gracefully', async () => {
      await codeReviewAgent.shutdown();
      
      expect(codeReviewAgent.getStatus()).toBe(AgentStatus.OFFLINE);
      expect(codeReviewAgent.isHealthy()).toBe(false);
    });

    it('should handle shutdown when not initialized', async () => {
      const newAgent = new CodeReviewAgent('test-2', 'Test Agent 2', mockConfig);
      
      // Should not throw error
      await expect(newAgent.shutdown()).resolves.not.toThrow();
    });
  });
});
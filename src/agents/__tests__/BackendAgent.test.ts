/**
 * Unit tests for BackendAgent
 */

import { BackendAgent, BackendAgentConfig } from '../BackendAgent';
import { AgentType, AgentStatus, TaskStatus, TaskPriority } from '../../types';
import { Task } from '../../types/task.types';

describe('BackendAgent', () => {
  let backendAgent: BackendAgent;
  let mockConfig: BackendAgentConfig;

  beforeEach(() => {
    mockConfig = {
      name: 'TestBackendAgent',
      type: AgentType.BACKEND,
      capabilities: [],
      maxConcurrentTasks: 3,
      timeout: 30000,
      retryAttempts: 3,
      frameworks: ['express', 'nestjs', 'fastify'],
      databases: ['postgresql', 'mongodb', 'redis'],
      apiTypes: ['rest', 'graphql', 'grpc'],
      deploymentTargets: ['docker', 'kubernetes', 'aws'],
      testingFrameworks: ['jest', 'mocha', 'supertest'],
      codeQuality: {
        linting: true,
        formatting: true,
        typeChecking: true,
        documentation: true
      },
      security: {
        authentication: true,
        authorization: true,
        dataValidation: true,
        encryption: true
      }
    };

    backendAgent = new BackendAgent('backend-1', 'Backend Agent', mockConfig);
  });

  afterEach(async () => {
    if (backendAgent.getStatus() !== AgentStatus.OFFLINE) {
      await backendAgent.shutdown();
    }
  });

  describe('Initialization', () => {
    it('should initialize with correct specialization', () => {
      expect(backendAgent.specialization).toBe(AgentType.BACKEND);
      expect(backendAgent.name).toBe('Backend Agent');
      expect(backendAgent.id).toBe('backend-1');
    });

    it('should initialize successfully with valid config', async () => {
      await backendAgent.initialize(mockConfig);
      
      expect(backendAgent.getStatus()).toBe(AgentStatus.IDLE);
      expect(backendAgent.getCapabilities()).toContain('api-development');
      expect(backendAgent.getCapabilities()).toContain('database-design');
      expect(backendAgent.getCapabilities()).toContain('express-development');
      expect(backendAgent.getCapabilities()).toContain('postgresql-database');
    });

    it('should throw error when initializing with invalid config (no frameworks)', async () => {
      const invalidConfig = { ...mockConfig, frameworks: [] };
      
      await expect(backendAgent.initialize(invalidConfig)).rejects.toThrow(
        'Backend agent must have at least one framework configured'
      );
    });

    it('should throw error when initializing with invalid config (no databases)', async () => {
      const invalidConfig = { ...mockConfig, databases: [] };
      
      await expect(backendAgent.initialize(invalidConfig)).rejects.toThrow(
        'Backend agent must have at least one database configured'
      );
    });

    it('should setup backend-specific capabilities', async () => {
      await backendAgent.initialize(mockConfig);
      
      const capabilities = backendAgent.getCapabilities();
      expect(capabilities).toContain('api-development');
      expect(capabilities).toContain('database-design');
      expect(capabilities).toContain('service-implementation');
      expect(capabilities).toContain('authentication');
      expect(capabilities).toContain('authorization');
      expect(capabilities).toContain('data-validation');
      expect(capabilities).toContain('business-logic');
      expect(capabilities).toContain('integration');
      expect(capabilities).toContain('performance-optimization');
      expect(capabilities).toContain('backend-testing');
      expect(capabilities).toContain('deployment');
      expect(capabilities).toContain('monitoring');
      expect(capabilities).toContain('express-development');
      expect(capabilities).toContain('postgresql-database');
      expect(capabilities).toContain('rest-api');
      expect(capabilities).toContain('docker-deployment');
      expect(capabilities).toContain('jest-testing');
    });
  });

  describe('Task Execution', () => {
    beforeEach(async () => {
      await backendAgent.initialize(mockConfig);
    });

    it('should execute API development task successfully', async () => {
      const task: Task = {
        id: 'task-1',
        title: 'Create User API',
        description: 'Create REST API for user management',
        type: 'api-development',
        status: TaskStatus.PENDING,
        priority: TaskPriority.HIGH,
        dependencies: [],
        estimatedTime: 7200,
        files: ['src/routes/users.ts', 'src/controllers/userController.ts'],
        requirements: ['REST API', 'CRUD operations', 'Authentication'],
        createdAt: new Date()
      };

      const result = await backendAgent.executeTask(task);

      expect(result.success).toBe(true);
      expect(result.taskId).toBe(task.id);
      expect(result.output).toHaveProperty('apiSpecification');
      expect(result.output).toHaveProperty('routesCode');
      expect(result.output).toHaveProperty('middlewareCode');
      expect(result.output).toHaveProperty('documentation');
    });

    it('should execute database design task successfully', async () => {
      const task: Task = {
        id: 'task-2',
        title: 'Design User Database Schema',
        description: 'Create database schema for user management',
        type: 'database-design',
        status: TaskStatus.PENDING,
        priority: TaskPriority.HIGH,
        dependencies: [],
        estimatedTime: 5400,
        files: ['migrations/001_create_users.sql', 'models/User.ts'],
        requirements: ['PostgreSQL', 'User entity', 'Relationships'],
        createdAt: new Date()
      };

      const result = await backendAgent.executeTask(task);

      expect(result.success).toBe(true);
      expect(result.taskId).toBe(task.id);
      expect(result.output).toHaveProperty('schema');
      expect(result.output).toHaveProperty('migrations');
      expect(result.output).toHaveProperty('models');
      expect(result.output).toHaveProperty('repositories');
    });

    it('should execute service implementation task successfully', async () => {
      const task: Task = {
        id: 'task-3',
        title: 'Implement User Service',
        description: 'Create user service with business logic',
        type: 'service-implementation',
        status: TaskStatus.PENDING,
        priority: TaskPriority.MEDIUM,
        dependencies: [],
        estimatedTime: 4500,
        files: ['src/services/UserService.ts', 'src/interfaces/IUserService.ts'],
        requirements: ['Business logic', 'Dependency injection', 'Unit tests'],
        createdAt: new Date()
      };

      const result = await backendAgent.executeTask(task);

      expect(result.success).toBe(true);
      expect(result.taskId).toBe(task.id);
      expect(result.output).toHaveProperty('interfaces');
      expect(result.output).toHaveProperty('implementations');
      expect(result.output).toHaveProperty('diConfig');
      expect(result.output).toHaveProperty('tests');
    });

    it('should execute authentication task successfully', async () => {
      const task: Task = {
        id: 'task-4',
        title: 'Implement JWT Authentication',
        description: 'Create JWT-based authentication system',
        type: 'authentication',
        status: TaskStatus.PENDING,
        priority: TaskPriority.HIGH,
        dependencies: [],
        estimatedTime: 6300,
        files: ['src/auth/AuthService.ts', 'src/middleware/auth.ts'],
        requirements: ['JWT tokens', 'Password hashing', 'Login/logout'],
        createdAt: new Date()
      };

      const result = await backendAgent.executeTask(task);

      expect(result.success).toBe(true);
      expect(result.taskId).toBe(task.id);
      expect(result.output).toHaveProperty('authService');
      expect(result.output).toHaveProperty('tokenHandling');
      expect(result.output).toHaveProperty('passwordSecurity');
      expect(result.output).toHaveProperty('authMiddleware');
    });

    it('should execute authorization task successfully', async () => {
      const task: Task = {
        id: 'task-5',
        title: 'Implement Role-Based Access Control',
        description: 'Create RBAC system for authorization',
        type: 'authorization',
        status: TaskStatus.PENDING,
        priority: TaskPriority.HIGH,
        dependencies: [],
        estimatedTime: 5400,
        files: ['src/auth/RBAC.ts', 'src/middleware/authorize.ts'],
        requirements: ['Roles', 'Permissions', 'Resource protection'],
        createdAt: new Date()
      };

      const result = await backendAgent.executeTask(task);

      expect(result.success).toBe(true);
      expect(result.taskId).toBe(task.id);
      expect(result.output).toHaveProperty('rbac');
      expect(result.output).toHaveProperty('permissions');
      expect(result.output).toHaveProperty('authzMiddleware');
    });

    it('should execute data validation task successfully', async () => {
      const task: Task = {
        id: 'task-6',
        title: 'Implement Data Validation',
        description: 'Create comprehensive data validation system',
        type: 'data-validation',
        status: TaskStatus.PENDING,
        priority: TaskPriority.MEDIUM,
        dependencies: [],
        estimatedTime: 3600,
        files: ['src/validation/schemas.ts', 'src/middleware/validate.ts'],
        requirements: ['Input validation', 'Schema validation', 'Custom validators'],
        createdAt: new Date()
      };

      const result = await backendAgent.executeTask(task);

      expect(result.success).toBe(true);
      expect(result.taskId).toBe(task.id);
      expect(result.output).toHaveProperty('schemas');
      expect(result.output).toHaveProperty('validationMiddleware');
      expect(result.output).toHaveProperty('customValidators');
    });

    it('should execute business logic task successfully', async () => {
      const task: Task = {
        id: 'task-7',
        title: 'Implement Order Processing Logic',
        description: 'Create business logic for order processing',
        type: 'business-logic',
        status: TaskStatus.PENDING,
        priority: TaskPriority.HIGH,
        dependencies: [],
        estimatedTime: 7200,
        files: ['src/domain/Order.ts', 'src/services/OrderService.ts'],
        requirements: ['Domain models', 'Business rules', 'Workflows'],
        createdAt: new Date()
      };

      const result = await backendAgent.executeTask(task);

      expect(result.success).toBe(true);
      expect(result.taskId).toBe(task.id);
      expect(result.output).toHaveProperty('businessServices');
      expect(result.output).toHaveProperty('domainModels');
      expect(result.output).toHaveProperty('businessRules');
      expect(result.output).toHaveProperty('workflows');
    });

    it('should execute integration task successfully', async () => {
      const task: Task = {
        id: 'task-8',
        title: 'Integrate Payment Gateway',
        description: 'Integrate with external payment service',
        type: 'integration',
        status: TaskStatus.PENDING,
        priority: TaskPriority.HIGH,
        dependencies: [],
        estimatedTime: 5400,
        files: ['src/integrations/PaymentGateway.ts', 'src/webhooks/payment.ts'],
        requirements: ['External API', 'Webhooks', 'Error handling'],
        createdAt: new Date()
      };

      const result = await backendAgent.executeTask(task);

      expect(result.success).toBe(true);
      expect(result.taskId).toBe(task.id);
      expect(result.output).toHaveProperty('apiClients');
      expect(result.output).toHaveProperty('messageHandlers');
      expect(result.output).toHaveProperty('webhookHandlers');
      expect(result.output).toHaveProperty('integrationTests');
    });

    it('should execute performance optimization task successfully', async () => {
      const task: Task = {
        id: 'task-9',
        title: 'Optimize API Performance',
        description: 'Improve API response times and throughput',
        type: 'performance-optimization',
        status: TaskStatus.PENDING,
        priority: TaskPriority.MEDIUM,
        dependencies: [],
        estimatedTime: 6300,
        files: ['src/cache/RedisCache.ts', 'src/db/connectionPool.ts'],
        requirements: ['Caching', 'Query optimization', 'Connection pooling'],
        createdAt: new Date()
      };

      const result = await backendAgent.executeTask(task);

      expect(result.success).toBe(true);
      expect(result.taskId).toBe(task.id);
      expect(result.output).toHaveProperty('performanceAnalysis');
      expect(result.output).toHaveProperty('caching');
      expect(result.output).toHaveProperty('queryOptimization');
      expect(result.output).toHaveProperty('connectionPooling');
      expect(result.output).toHaveProperty('monitoring');
    });

    it('should execute backend testing task successfully', async () => {
      const task: Task = {
        id: 'task-10',
        title: 'Create API Tests',
        description: 'Write comprehensive tests for API endpoints',
        type: 'testing',
        status: TaskStatus.PENDING,
        priority: TaskPriority.MEDIUM,
        dependencies: [],
        estimatedTime: 5400,
        files: ['tests/api/users.test.ts', 'tests/integration/auth.test.ts'],
        requirements: ['Unit tests', 'Integration tests', 'API tests', 'Load tests'],
        createdAt: new Date()
      };

      const result = await backendAgent.executeTask(task);

      expect(result.success).toBe(true);
      expect(result.taskId).toBe(task.id);
      expect(result.output).toHaveProperty('unitTests');
      expect(result.output).toHaveProperty('integrationTests');
      expect(result.output).toHaveProperty('apiTests');
      expect(result.output).toHaveProperty('loadTests');
      expect(result.output).toHaveProperty('testFixtures');
    });

    it('should execute deployment task successfully', async () => {
      const task: Task = {
        id: 'task-11',
        title: 'Setup Docker Deployment',
        description: 'Create Docker configuration for deployment',
        type: 'deployment',
        status: TaskStatus.PENDING,
        priority: TaskPriority.MEDIUM,
        dependencies: [],
        estimatedTime: 4500,
        files: ['Dockerfile', 'docker-compose.yml'],
        requirements: ['Docker', 'CI/CD', 'Environment configs'],
        createdAt: new Date()
      };

      const result = await backendAgent.executeTask(task);

      expect(result.success).toBe(true);
      expect(result.taskId).toBe(task.id);
      expect(result.output).toHaveProperty('deploymentConfig');
      expect(result.output).toHaveProperty('dockerConfig');
      expect(result.output).toHaveProperty('cicdPipelines');
      expect(result.output).toHaveProperty('envConfigs');
      expect(result.filesModified).toContain('Dockerfile');
      expect(result.filesModified).toContain('docker-compose.yml');
    });

    it('should execute monitoring task successfully', async () => {
      const task: Task = {
        id: 'task-12',
        title: 'Setup Application Monitoring',
        description: 'Implement logging, metrics, and health checks',
        type: 'monitoring',
        status: TaskStatus.PENDING,
        priority: TaskPriority.MEDIUM,
        dependencies: [],
        estimatedTime: 3600,
        files: ['src/monitoring/logger.ts', 'src/health/healthCheck.ts'],
        requirements: ['Logging', 'Metrics', 'Health checks', 'Alerting'],
        createdAt: new Date()
      };

      const result = await backendAgent.executeTask(task);

      expect(result.success).toBe(true);
      expect(result.taskId).toBe(task.id);
      expect(result.output).toHaveProperty('loggingConfig');
      expect(result.output).toHaveProperty('metricsCollection');
      expect(result.output).toHaveProperty('healthChecks');
      expect(result.output).toHaveProperty('alerting');
    });

    it('should handle generic backend task', async () => {
      const task: Task = {
        id: 'task-13',
        title: 'Custom Backend Feature',
        description: 'A custom backend development task',
        type: 'custom-backend',
        status: TaskStatus.PENDING,
        priority: TaskPriority.LOW,
        dependencies: [],
        estimatedTime: 1800,
        files: ['src/custom/feature.ts'],
        requirements: ['Custom implementation'],
        createdAt: new Date()
      };

      const result = await backendAgent.executeTask(task);

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
        type: 'api-development',
        status: TaskStatus.PENDING,
        priority: TaskPriority.MEDIUM,
        dependencies: [],
        estimatedTime: 3600,
        files: [],
        requirements: [],
        createdAt: new Date()
      };

      const result = await backendAgent.executeTask(invalidTask);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.taskId).toBe(invalidTask.id);
    });

    it('should warn about non-backend task types', async () => {
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

      await backendAgent.executeTask(task);

      expect(logSpy).toHaveBeenCalledWith(
        expect.stringContaining("Task type 'component-creation' may not be suitable for backend agent")
      );

      logSpy.mockRestore();
    });
  });

  describe('Configuration Management', () => {
    beforeEach(async () => {
      await backendAgent.initialize(mockConfig);
    });

    it('should update configuration successfully', async () => {
      const newConfig: Partial<BackendAgentConfig> = {
        frameworks: ['nestjs', 'koa'],
        databases: ['mongodb', 'redis'],
        maxConcurrentTasks: 5
      };

      await backendAgent.updateConfig(newConfig);

      const updatedConfig = backendAgent.getConfig() as BackendAgentConfig;
      expect(updatedConfig.frameworks).toEqual(['nestjs', 'koa']);
      expect(updatedConfig.databases).toEqual(['mongodb', 'redis']);
      expect(updatedConfig.maxConcurrentTasks).toBe(5);
    });

    it('should update capabilities when configuration changes', async () => {
      const newConfig: Partial<BackendAgentConfig> = {
        frameworks: ['nestjs'],
        databases: ['mongodb'],
        apiTypes: ['graphql'],
        deploymentTargets: ['kubernetes'],
        testingFrameworks: ['mocha']
      };

      await backendAgent.updateConfig(newConfig);

      const capabilities = backendAgent.getCapabilities();
      expect(capabilities).toContain('nestjs-development');
      expect(capabilities).toContain('mongodb-database');
      expect(capabilities).toContain('graphql-api');
      expect(capabilities).toContain('kubernetes-deployment');
      expect(capabilities).toContain('mocha-testing');
    });
  });

  describe('Status and Monitoring', () => {
    beforeEach(async () => {
      await backendAgent.initialize(mockConfig);
    });

    it('should track workload correctly', async () => {
      expect(backendAgent.getWorkload()).toBe(0);

      const task: Task = {
        id: 'task-1',
        title: 'Test Task',
        description: 'A test task',
        type: 'api-development',
        status: TaskStatus.PENDING,
        priority: TaskPriority.MEDIUM,
        dependencies: [],
        estimatedTime: 1000,
        files: [],
        requirements: [],
        createdAt: new Date()
      };

      // Execute task and check final state
      await backendAgent.executeTask(task);
      
      // Should be idle after completion
      expect(backendAgent.getStatus()).toBe(AgentStatus.IDLE);
      expect(backendAgent.getWorkload()).toBe(0);
    });

    it('should provide agent statistics', async () => {
      const task: Task = {
        id: 'task-1',
        title: 'Test Task',
        description: 'A test task',
        type: 'api-development',
        status: TaskStatus.PENDING,
        priority: TaskPriority.MEDIUM,
        dependencies: [],
        estimatedTime: 1000,
        files: [],
        requirements: [],
        createdAt: new Date()
      };

      await backendAgent.executeTask(task);

      const stats = backendAgent.getStatistics();
      expect(stats.totalTasks).toBe(1);
      expect(stats.completedTasks).toBe(1);
      expect(stats.failedTasks).toBe(0);
      expect(stats.successRate).toBe(1);
      expect(stats.status).toBe(AgentStatus.IDLE);
    });

    it('should report as healthy when properly initialized', async () => {
      expect(backendAgent.isHealthy()).toBe(true);
    });
  });

  describe('Shutdown', () => {
    beforeEach(async () => {
      await backendAgent.initialize(mockConfig);
    });

    it('should shutdown gracefully', async () => {
      await backendAgent.shutdown();
      
      expect(backendAgent.getStatus()).toBe(AgentStatus.OFFLINE);
      expect(backendAgent.isHealthy()).toBe(false);
    });

    it('should handle shutdown when not initialized', async () => {
      const newAgent = new BackendAgent('test-2', 'Test Agent 2', mockConfig);
      
      // Should not throw error
      await expect(newAgent.shutdown()).resolves.not.toThrow();
    });
  });
});
/**
 * Tests for validation utilities
 */

import {
  AgentConfigValidator,
  AgentValidator,
  TaskValidator,
  AgentMessageValidator,
  CollaborationSessionValidator,
  ValidationUtils
} from '../validation/validators';
import { AgentType, AgentStatus } from '../../types/agent.types';
import { TaskStatus, TaskPriority } from '../../types/task.types';
import { MessageType } from '../../types/message.types';
import { ValidationError } from '../errors/SystemError';

describe('Validation', () => {
  describe('AgentConfigValidator', () => {
    const validator = new AgentConfigValidator();

    it('should validate valid agent config', () => {
      const config = {
        name: 'Test Agent',
        type: AgentType.FRONTEND,
        capabilities: ['html', 'css', 'javascript'],
        maxConcurrentTasks: 3,
        timeout: 300000,
        retryAttempts: 3,
        customSettings: {}
      };

      const result = validator.validate(config);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject config with empty name', () => {
      const config = {
        name: '',
        type: AgentType.FRONTEND,
        capabilities: ['html'],
        maxConcurrentTasks: 3,
        timeout: 300000,
        retryAttempts: 3
      };

      const result = validator.validate(config);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Agent name is required');
    });

    it('should reject config with invalid type', () => {
      const config = {
        name: 'Test Agent',
        type: 'invalid' as AgentType,
        capabilities: ['html'],
        maxConcurrentTasks: 3,
        timeout: 300000,
        retryAttempts: 3
      };

      const result = validator.validate(config);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid agent type: invalid');
    });

    it('should reject config with no capabilities', () => {
      const config = {
        name: 'Test Agent',
        type: AgentType.FRONTEND,
        capabilities: [],
        maxConcurrentTasks: 3,
        timeout: 300000,
        retryAttempts: 3
      };

      const result = validator.validate(config);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Agent must have at least one capability');
    });
  });

  describe('TaskValidator', () => {
    const validator = new TaskValidator();

    it('should validate valid task', () => {
      const task = {
        id: 'task-123',
        title: 'Test Task',
        description: 'A test task',
        type: 'development',
        status: TaskStatus.PENDING,
        priority: TaskPriority.MEDIUM,
        dependencies: [],
        estimatedTime: 3600000,
        files: [],
        requirements: [],
        createdAt: new Date()
      };

      const result = validator.validate(task);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject task with empty title', () => {
      const task = {
        id: 'task-123',
        title: '',
        description: 'A test task',
        type: 'development',
        status: TaskStatus.PENDING,
        priority: TaskPriority.MEDIUM,
        dependencies: [],
        estimatedTime: 3600000,
        files: [],
        requirements: [],
        createdAt: new Date()
      };

      const result = validator.validate(task);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Task title is required');
    });

    it('should reject task with invalid dates', () => {
      const now = new Date();
      const past = new Date(now.getTime() - 1000);
      
      const task = {
        id: 'task-123',
        title: 'Test Task',
        description: 'A test task',
        type: 'development',
        status: TaskStatus.IN_PROGRESS,
        priority: TaskPriority.MEDIUM,
        dependencies: [],
        estimatedTime: 3600000,
        files: [],
        requirements: [],
        createdAt: now,
        startedAt: past, // Started before created
        completedAt: new Date(past.getTime() - 1000) // Completed before started
      };

      const result = validator.validate(task);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Started date cannot be before created date');
    });
  });

  describe('AgentMessageValidator', () => {
    const validator = new AgentMessageValidator();

    it('should validate valid message', () => {
      const message = {
        id: 'msg-123',
        from: 'agent-1',
        to: 'agent-2',
        type: MessageType.INFO,
        content: 'Hello',
        timestamp: new Date(),
        requiresResponse: false
      };

      const result = validator.validate(message);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should validate message with multiple recipients', () => {
      const message = {
        id: 'msg-123',
        from: 'agent-1',
        to: ['agent-2', 'agent-3'],
        type: MessageType.INFO,
        content: 'Hello all',
        timestamp: new Date(),
        requiresResponse: false
      };

      const result = validator.validate(message);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject message with empty recipients array', () => {
      const message = {
        id: 'msg-123',
        from: 'agent-1',
        to: [],
        type: MessageType.INFO,
        content: 'Hello',
        timestamp: new Date(),
        requiresResponse: false
      };

      const result = validator.validate(message);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Message must have at least one recipient');
    });
  });

  describe('ValidationUtils', () => {
    it('should validate or throw for valid data', () => {
      const validator = new AgentConfigValidator();
      const validConfig = {
        name: 'Test Agent',
        type: AgentType.FRONTEND,
        capabilities: ['html'],
        maxConcurrentTasks: 3,
        timeout: 300000,
        retryAttempts: 3
      };

      expect(() => {
        ValidationUtils.validateOrThrow(validator, validConfig);
      }).not.toThrow();
    });

    it('should throw ValidationError for invalid data', () => {
      const validator = new AgentConfigValidator();
      const invalidConfig = {
        name: '',
        type: AgentType.FRONTEND,
        capabilities: [],
        maxConcurrentTasks: 3,
        timeout: 300000,
        retryAttempts: 3
      };

      expect(() => {
        ValidationUtils.validateOrThrow(validator, invalidConfig);
      }).toThrow(ValidationError);
    });

    it('should validate many items', () => {
      const validator = new AgentConfigValidator();
      const configs = [
        {
          name: 'Agent 1',
          type: AgentType.FRONTEND,
          capabilities: ['html'],
          maxConcurrentTasks: 3,
          timeout: 300000,
          retryAttempts: 3
        },
        {
          name: '', // Invalid
          type: AgentType.BACKEND,
          capabilities: ['node'],
          maxConcurrentTasks: 3,
          timeout: 300000,
          retryAttempts: 3
        }
      ];

      const result = ValidationUtils.validateMany(validator, configs);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Item 1: Agent name is required');
    });

    it('should validate UUID format', () => {
      expect(ValidationUtils.isValidUUID('123e4567-e89b-12d3-a456-426614174000')).toBe(true);
      expect(ValidationUtils.isValidUUID('invalid-uuid')).toBe(false);
      expect(ValidationUtils.isValidUUID('')).toBe(false);
    });

    it('should sanitize strings', () => {
      expect(ValidationUtils.sanitizeString('  <script>alert("xss")</script>  ')).toBe('scriptalert("xss")/script');
      expect(ValidationUtils.sanitizeString('normal text')).toBe('normal text');
    });

    it('should validate email format', () => {
      expect(ValidationUtils.isValidEmail('test@example.com')).toBe(true);
      expect(ValidationUtils.isValidEmail('invalid-email')).toBe(false);
      expect(ValidationUtils.isValidEmail('')).toBe(false);
    });
  });
});
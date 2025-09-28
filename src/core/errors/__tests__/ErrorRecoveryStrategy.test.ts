/**
 * Unit tests for error recovery strategies
 */

import {
  AgentRecoveryStrategy,
  TaskRecoveryStrategy,
  FileRecoveryStrategy,
  CommunicationRecoveryStrategy,
  FallbackRecoveryStrategy
} from '../ErrorRecoveryStrategy';
import { SystemError } from '../SystemError';
import { ErrorType, ErrorSeverity } from '../../../types/error.types';

describe('ErrorRecoveryStrategy', () => {
  describe('AgentRecoveryStrategy', () => {
    let strategy: AgentRecoveryStrategy;

    beforeEach(() => {
      strategy = new AgentRecoveryStrategy();
    });

    it('should handle agent errors', () => {
      const error = new SystemError(
        'Agent timeout',
        ErrorType.AGENT_ERROR,
        ErrorSeverity.MEDIUM,
        true,
        { agentId: 'agent-1' }
      );

      expect(strategy.canHandle(error)).toBe(true);
    });

    it('should not handle non-agent errors', () => {
      const error = new SystemError(
        'File not found',
        ErrorType.FILE_ERROR,
        ErrorSeverity.MEDIUM
      );

      expect(strategy.canHandle(error)).toBe(false);
    });

    it('should handle low severity agent errors', async () => {
      const error = new SystemError(
        'Minor agent issue',
        ErrorType.AGENT_ERROR,
        ErrorSeverity.LOW,
        true,
        { agentId: 'agent-1' }
      );

      const result = await strategy.recover(error, {});

      expect(result.success).toBe(true);
      expect(result.action).toBe('log_and_continue');
      expect(result.message).toContain('agent-1');
    });

    it('should handle medium severity agent errors', async () => {
      const error = new SystemError(
        'Agent state corruption',
        ErrorType.AGENT_ERROR,
        ErrorSeverity.MEDIUM,
        true,
        { agentId: 'agent-1' }
      );

      const result = await strategy.recover(error, {});

      expect(result.success).toBe(true);
      expect(result.action).toBe('reset_agent_state');
      expect(result.message).toContain('agent-1');
    });

    it('should handle high severity agent errors', async () => {
      const error = new SystemError(
        'Agent crashed',
        ErrorType.AGENT_ERROR,
        ErrorSeverity.HIGH,
        true,
        { agentId: 'agent-1' }
      );

      const result = await strategy.recover(error, {});

      expect(result.success).toBe(true);
      expect(result.action).toBe('restart_agent');
      expect(result.message).toContain('agent-1');
    });

    it('should fail recovery when no agent ID is provided', async () => {
      const error = new SystemError(
        'Agent error',
        ErrorType.AGENT_ERROR,
        ErrorSeverity.MEDIUM
      );

      const result = await strategy.recover(error, {});

      expect(result.success).toBe(false);
      expect(result.message).toContain('No agent ID provided');
    });

    it('should have correct priority and name', () => {
      expect(strategy.getPriority()).toBe(100);
      expect(strategy.getName()).toBe('AgentRecoveryStrategy');
    });
  });

  describe('TaskRecoveryStrategy', () => {
    let strategy: TaskRecoveryStrategy;

    beforeEach(() => {
      strategy = new TaskRecoveryStrategy();
    });

    it('should handle task errors', () => {
      const error = new SystemError(
        'Task failed',
        ErrorType.TASK_ERROR,
        ErrorSeverity.MEDIUM,
        true,
        { taskId: 'task-1' }
      );

      expect(strategy.canHandle(error)).toBe(true);
    });

    it('should retry low severity task errors', async () => {
      const error = new SystemError(
        'Task execution failed',
        ErrorType.TASK_ERROR,
        ErrorSeverity.LOW,
        true,
        { taskId: 'task-1', agentId: 'agent-1' }
      );

      const result = await strategy.recover(error, {});

      expect(result.success).toBe(false);
      expect(result.action).toBe('retry_task');
      expect(result.retryAfter).toBe(5000);
      expect(result.message).toContain('task-1');
    });

    it('should reassign medium severity task errors', async () => {
      const error = new SystemError(
        'Task execution failed',
        ErrorType.TASK_ERROR,
        ErrorSeverity.MEDIUM,
        true,
        { taskId: 'task-1' }
      );

      const result = await strategy.recover(error, {});

      expect(result.success).toBe(true);
      expect(result.action).toBe('reassign_task');
      expect(result.message).toContain('task-1');
    });

    it('should cancel high severity task errors', async () => {
      const error = new SystemError(
        'Critical task failure',
        ErrorType.TASK_ERROR,
        ErrorSeverity.CRITICAL,
        true,
        { taskId: 'task-1' }
      );

      const result = await strategy.recover(error, {});

      expect(result.success).toBe(true);
      expect(result.action).toBe('cancel_task');
      expect(result.message).toContain('task-1');
    });

    it('should fail recovery when no task ID is provided', async () => {
      const error = new SystemError(
        'Task error',
        ErrorType.TASK_ERROR,
        ErrorSeverity.MEDIUM
      );

      const result = await strategy.recover(error, {});

      expect(result.success).toBe(false);
      expect(result.message).toContain('No task ID provided');
    });
  });

  describe('FileRecoveryStrategy', () => {
    let strategy: FileRecoveryStrategy;

    beforeEach(() => {
      strategy = new FileRecoveryStrategy();
    });

    it('should handle file errors', () => {
      const error = new SystemError(
        'File access denied',
        ErrorType.FILE_ERROR,
        ErrorSeverity.MEDIUM,
        true,
        { metadata: { filePath: '/path/to/file.txt' } }
      );

      expect(strategy.canHandle(error)).toBe(true);
    });

    it('should retry low severity file errors', async () => {
      const error = new SystemError(
        'File temporarily unavailable',
        ErrorType.FILE_ERROR,
        ErrorSeverity.LOW,
        true,
        { metadata: { filePath: '/path/to/file.txt' } }
      );

      const result = await strategy.recover(error, {});

      expect(result.success).toBe(false);
      expect(result.action).toBe('retry_file_operation');
      expect(result.retryAfter).toBe(2000);
    });

    it('should release locks for medium severity file errors', async () => {
      const error = new SystemError(
        'File locked by another process',
        ErrorType.FILE_ERROR,
        ErrorSeverity.MEDIUM,
        true,
        { metadata: { filePath: '/path/to/file.txt' } }
      );

      const result = await strategy.recover(error, {});

      expect(result.success).toBe(true);
      expect(result.action).toBe('release_locks_and_retry');
    });

    it('should restore from backup for high severity file errors', async () => {
      const error = new SystemError(
        'File corrupted',
        ErrorType.FILE_ERROR,
        ErrorSeverity.HIGH,
        true,
        { metadata: { filePath: '/path/to/file.txt' } }
      );

      const result = await strategy.recover(error, {});

      expect(result.success).toBe(true);
      expect(result.action).toBe('restore_from_backup');
    });
  });

  describe('CommunicationRecoveryStrategy', () => {
    let strategy: CommunicationRecoveryStrategy;

    beforeEach(() => {
      strategy = new CommunicationRecoveryStrategy();
    });

    it('should handle communication errors', () => {
      const error = new SystemError(
        'Connection lost',
        ErrorType.COMMUNICATION_ERROR,
        ErrorSeverity.HIGH
      );

      expect(strategy.canHandle(error)).toBe(true);
    });

    it('should reconnect for medium severity communication errors', async () => {
      const error = new SystemError(
        'Connection timeout',
        ErrorType.COMMUNICATION_ERROR,
        ErrorSeverity.MEDIUM,
        true,
        { agentId: 'agent-1' }
      );

      const result = await strategy.recover(error, {});

      expect(result.success).toBe(false);
      expect(result.action).toBe('reconnect_and_retry');
      expect(result.retryAfter).toBe(3000);
    });

    it('should reset communication system for high severity errors', async () => {
      const error = new SystemError(
        'Communication system failure',
        ErrorType.COMMUNICATION_ERROR,
        ErrorSeverity.CRITICAL
      );

      const result = await strategy.recover(error, {});

      expect(result.success).toBe(true);
      expect(result.action).toBe('reset_communication_system');
    });
  });

  describe('FallbackRecoveryStrategy', () => {
    let strategy: FallbackRecoveryStrategy;

    beforeEach(() => {
      strategy = new FallbackRecoveryStrategy();
    });

    it('should handle any error type', () => {
      const agentError = new SystemError('Agent error', ErrorType.AGENT_ERROR, ErrorSeverity.MEDIUM);
      const fileError = new SystemError('File error', ErrorType.FILE_ERROR, ErrorSeverity.HIGH);
      const systemError = new SystemError('System error', ErrorType.SYSTEM_ERROR, ErrorSeverity.LOW);

      expect(strategy.canHandle(agentError)).toBe(true);
      expect(strategy.canHandle(fileError)).toBe(true);
      expect(strategy.canHandle(systemError)).toBe(true);
    });

    it('should escalate all errors to user', async () => {
      const error = new SystemError(
        'Unknown error',
        ErrorType.SYSTEM_ERROR,
        ErrorSeverity.MEDIUM
      );

      const result = await strategy.recover(error, {});

      expect(result.success).toBe(false);
      expect(result.action).toBe('escalate_to_user');
      expect(result.message).toContain('Manual intervention required');
    });

    it('should have lowest priority', () => {
      expect(strategy.getPriority()).toBe(1);
    });
  });
});
/**
 * Unit tests for error logger
 */

import { ErrorLogger, ErrorLogFilter } from '../ErrorLogger';
import { SystemError } from '../SystemError';
import { ErrorType, ErrorSeverity } from '../../../types/error.types';

describe('ErrorLogger', () => {
  let logger: ErrorLogger;

  beforeEach(() => {
    logger = new ErrorLogger(100, 7); // Small limits for testing
  });

  describe('logError', () => {
    it('should log errors correctly', async () => {
      const error = new SystemError(
        'Test error',
        ErrorType.AGENT_ERROR,
        ErrorSeverity.MEDIUM,
        true,
        { agentId: 'agent-1' }
      );

      const logId = await logger.logError(error, { taskId: 'task-1' }, 'session-1', 'test-agent');

      expect(logId).toBeDefined();
      expect(typeof logId).toBe('string');

      const logs = logger.getLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0].id).toBe(logId);
      expect(logs[0].error).toBe(error);
      expect(logs[0].context.taskId).toBe('task-1');
      expect(logs[0].sessionId).toBe('session-1');
      expect(logs[0].userAgent).toBe('test-agent');
      expect(logs[0].recoveryAttempted).toBe(false);
    });

    it('should classify errors during logging', async () => {
      const error = new SystemError(
        'Agent timeout',
        ErrorType.AGENT_ERROR,
        ErrorSeverity.HIGH
      );

      await logger.logError(error);

      const logs = logger.getLogs();
      expect(logs[0].classification).toBeDefined();
      expect(logs[0].classification.type).toBe(ErrorType.AGENT_ERROR);
      expect(logs[0].classification.severity).toBe(ErrorSeverity.HIGH);
    });

    it('should maintain log size limit', async () => {
      const smallLogger = new ErrorLogger(3, 7);

      // Add 5 errors (exceeds limit of 3)
      for (let i = 0; i < 5; i++) {
        const error = new SystemError(`Error ${i}`, ErrorType.SYSTEM_ERROR, ErrorSeverity.LOW);
        await smallLogger.logError(error);
      }

      const logs = smallLogger.getLogs();
      expect(logs).toHaveLength(3);
      // Should keep the most recent 3 errors (slice keeps last 3, then sorted newest first)
      const messages = logs.map(log => log.error.message).sort();
      expect(messages).toEqual(['Error 2', 'Error 3', 'Error 4']);
    });
  });

  describe('updateRecoveryResult', () => {
    it('should update recovery results correctly', async () => {
      const error = new SystemError('Test error', ErrorType.AGENT_ERROR, ErrorSeverity.MEDIUM);
      const logId = await logger.logError(error);

      const recoveryResult = {
        success: true,
        action: 'restart_agent',
        message: 'Agent restarted successfully'
      };

      const updated = logger.updateRecoveryResult(logId, recoveryResult);

      expect(updated).toBe(true);

      const logs = logger.getLogs();
      expect(logs[0].recoveryAttempted).toBe(true);
      expect(logs[0].recoveryResult).toEqual(recoveryResult);
    });

    it('should return false for non-existent log ID', () => {
      const recoveryResult = {
        success: false,
        action: 'failed',
        message: 'Recovery failed'
      };

      const updated = logger.updateRecoveryResult('non-existent-id', recoveryResult);

      expect(updated).toBe(false);
    });
  });

  describe('getLogs', () => {
    beforeEach(async () => {
      // Add test data
      const errors = [
        new SystemError('Agent error 1', ErrorType.AGENT_ERROR, ErrorSeverity.LOW, true, { agentId: 'agent-1' }),
        new SystemError('File error 1', ErrorType.FILE_ERROR, ErrorSeverity.MEDIUM, true, { agentId: 'agent-2' }),
        new SystemError('Agent error 2', ErrorType.AGENT_ERROR, ErrorSeverity.HIGH, true, { agentId: 'agent-1' }),
        new SystemError('Task error 1', ErrorType.TASK_ERROR, ErrorSeverity.CRITICAL, true, { taskId: 'task-1' }),
      ];

      for (const error of errors) {
        await logger.logError(error);
      }
    });

    it('should return all logs without filter', () => {
      const logs = logger.getLogs();
      expect(logs).toHaveLength(4);
    });

    it('should filter by error type', () => {
      const filter: ErrorLogFilter = {
        errorTypes: [ErrorType.AGENT_ERROR]
      };

      const logs = logger.getLogs(filter);
      expect(logs).toHaveLength(2);
      expect(logs.every(log => log.error.type === ErrorType.AGENT_ERROR)).toBe(true);
    });

    it('should filter by severity', () => {
      const filter: ErrorLogFilter = {
        severities: [ErrorSeverity.HIGH, ErrorSeverity.CRITICAL]
      };

      const logs = logger.getLogs(filter);
      expect(logs).toHaveLength(2);
      expect(logs.every(log => 
        log.error.severity === ErrorSeverity.HIGH || 
        log.error.severity === ErrorSeverity.CRITICAL
      )).toBe(true);
    });

    it('should filter by agent ID', () => {
      const filter: ErrorLogFilter = {
        agentIds: ['agent-1']
      };

      const logs = logger.getLogs(filter);
      expect(logs).toHaveLength(2);
      expect(logs.every(log => log.error.agentId === 'agent-1')).toBe(true);
    });

    it('should filter by task ID', () => {
      const filter: ErrorLogFilter = {
        taskIds: ['task-1']
      };

      const logs = logger.getLogs(filter);
      expect(logs).toHaveLength(1);
      expect(logs[0].error.taskId).toBe('task-1');
    });

    it('should apply pagination', () => {
      const filter: ErrorLogFilter = {
        limit: 2,
        offset: 1
      };

      const logs = logger.getLogs(filter);
      expect(logs).toHaveLength(2);
    });

    it('should filter by date range', async () => {
      // Create a fresh logger for this test to avoid interference
      const freshLogger = new ErrorLogger(100, 7);
      
      const startDate = new Date();
      
      // Add a new error after setting start date
      await new Promise(resolve => setTimeout(resolve, 10));
      const newError = new SystemError('New error', ErrorType.SYSTEM_ERROR, ErrorSeverity.LOW);
      await freshLogger.logError(newError);

      const filter: ErrorLogFilter = {
        startDate
      };

      const logs = freshLogger.getLogs(filter);
      expect(logs).toHaveLength(1);
      expect(logs[0].error.message).toBe('New error');
    });
  });

  describe('getStatistics', () => {
    beforeEach(async () => {
      // Add test data with recovery results
      const errors = [
        new SystemError('Agent error 1', ErrorType.AGENT_ERROR, ErrorSeverity.LOW, true, { agentId: 'agent-1' }),
        new SystemError('Agent error 2', ErrorType.AGENT_ERROR, ErrorSeverity.MEDIUM, true, { agentId: 'agent-1' }),
        new SystemError('File error 1', ErrorType.FILE_ERROR, ErrorSeverity.HIGH, true, { agentId: 'agent-2' }),
      ];

      for (const error of errors) {
        const logId = await logger.logError(error);
        // Add recovery result for first two errors
        if (error.message.includes('Agent')) {
          logger.updateRecoveryResult(logId, {
            success: error.message.includes('error 1'),
            action: 'test_action',
            message: 'Test recovery'
          });
        }
      }
    });

    it('should calculate statistics correctly', () => {
      const stats = logger.getStatistics();

      expect(stats.totalErrors).toBe(3);
      expect(stats.errorsByType[ErrorType.AGENT_ERROR]).toBe(2);
      expect(stats.errorsByType[ErrorType.FILE_ERROR]).toBe(1);
      expect(stats.errorsBySeverity[ErrorSeverity.LOW]).toBe(1);
      expect(stats.errorsBySeverity[ErrorSeverity.MEDIUM]).toBe(1);
      expect(stats.errorsBySeverity[ErrorSeverity.HIGH]).toBe(1);
      expect(stats.errorsByAgent['agent-1']).toBe(2);
      expect(stats.errorsByAgent['agent-2']).toBe(1);
      expect(stats.recoverySuccessRate).toBe(0.5); // 1 success out of 2 attempts
    });

    it('should group errors by hour and day', () => {
      const stats = logger.getStatistics();

      expect(stats.errorsByHour).toHaveLength(24);
      expect(stats.errorsByDay).toHaveLength(7);
      expect(stats.errorsByHour.reduce((a, b) => a + b, 0)).toBe(3);
      expect(stats.errorsByDay.reduce((a, b) => a + b, 0)).toBe(3);
    });

    it('should identify most common errors', () => {
      const stats = logger.getStatistics();

      expect(stats.mostCommonErrors).toBeDefined();
      expect(Array.isArray(stats.mostCommonErrors)).toBe(true);
      expect(stats.mostCommonErrors.length).toBeGreaterThan(0);
      expect(stats.mostCommonErrors[0]).toHaveProperty('message');
      expect(stats.mostCommonErrors[0]).toHaveProperty('count');
      expect(stats.mostCommonErrors[0]).toHaveProperty('percentage');
    });
  });

  describe('export and import', () => {
    beforeEach(async () => {
      const error = new SystemError('Test error', ErrorType.AGENT_ERROR, ErrorSeverity.MEDIUM);
      await logger.logError(error);
    });

    it('should export logs to JSON', () => {
      const exported = logger.exportLogs();
      
      expect(typeof exported).toBe('string');
      
      const parsed = JSON.parse(exported);
      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed).toHaveLength(1);
      expect(parsed[0]).toHaveProperty('id');
      expect(parsed[0]).toHaveProperty('error');
      expect(parsed[0]).toHaveProperty('classification');
    });

    it('should import logs from JSON', () => {
      const exported = logger.exportLogs();
      logger.clearLogs();
      
      expect(logger.getLogCount()).toBe(0);
      
      const importedCount = logger.importLogs(exported);
      
      expect(importedCount).toBe(1);
      expect(logger.getLogCount()).toBe(1);
    });

    it('should handle invalid JSON during import', () => {
      expect(() => {
        logger.importLogs('invalid json');
      }).toThrow('Failed to import logs');
    });

    it('should validate log entries during import', () => {
      const invalidLogs = JSON.stringify([
        { invalid: 'log entry' },
        {
          id: 'valid-id',
          timestamp: new Date().toISOString(),
          error: {
            type: ErrorType.AGENT_ERROR,
            severity: ErrorSeverity.MEDIUM,
            message: 'Valid error'
          },
          classification: {
            type: ErrorType.AGENT_ERROR,
            severity: ErrorSeverity.MEDIUM,
            category: 'agent',
            tags: [],
            confidence: 1.0,
            suggestedActions: []
          },
          context: {},
          recoveryAttempted: false
        }
      ]);

      const importedCount = logger.importLogs(invalidLogs);
      
      expect(importedCount).toBe(1); // Only valid entry imported
    });
  });

  describe('clearLogs', () => {
    it('should clear all logs', async () => {
      const error = new SystemError('Test error', ErrorType.AGENT_ERROR, ErrorSeverity.MEDIUM);
      await logger.logError(error);
      
      expect(logger.getLogCount()).toBe(1);
      
      logger.clearLogs();
      
      expect(logger.getLogCount()).toBe(0);
      expect(logger.getLogs()).toHaveLength(0);
    });
  });
});
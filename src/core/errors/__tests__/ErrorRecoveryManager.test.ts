/**
 * Unit tests for error recovery manager
 */

import { ErrorRecoveryManager, ErrorRecoveryConfig } from '../ErrorRecoveryManager';
import { SystemError } from '../SystemError';
import { IErrorRecoveryStrategy } from '../ErrorRecoveryStrategy';
import { ErrorType, ErrorSeverity, RecoveryResult } from '../../../types/error.types';

// Mock strategy for testing
class MockRecoveryStrategy implements IErrorRecoveryStrategy {
  constructor(
    private name: string,
    private priority: number,
    private canHandleResult: boolean = true,
    private recoveryResult: RecoveryResult = { success: true, action: 'mock_action', message: 'Mock recovery' }
  ) {}

  canHandle(error: SystemError): boolean {
    return this.canHandleResult;
  }

  async recover(error: SystemError, context: any): Promise<RecoveryResult> {
    return this.recoveryResult;
  }

  getPriority(): number {
    return this.priority;
  }

  getName(): string {
    return this.name;
  }
}

describe('ErrorRecoveryManager', () => {
  let manager: ErrorRecoveryManager;
  let mockStrategy: MockRecoveryStrategy;

  beforeEach(() => {
    const config: Partial<ErrorRecoveryConfig> = {
      maxRetryAttempts: 2,
      retryDelayMs: 100,
      enableAutoRecovery: true
    };
    
    manager = new ErrorRecoveryManager(config);
    mockStrategy = new MockRecoveryStrategy('MockStrategy', 200);
  });

  describe('constructor', () => {
    it('should initialize with default strategies', () => {
      const strategies = manager.getStrategies();
      
      expect(strategies.length).toBeGreaterThan(0);
      expect(strategies.some(s => s.getName() === 'AgentRecoveryStrategy')).toBe(true);
      expect(strategies.some(s => s.getName() === 'TaskRecoveryStrategy')).toBe(true);
      expect(strategies.some(s => s.getName() === 'FileRecoveryStrategy')).toBe(true);
      expect(strategies.some(s => s.getName() === 'CommunicationRecoveryStrategy')).toBe(true);
      expect(strategies.some(s => s.getName() === 'FallbackRecoveryStrategy')).toBe(true);
    });

    it('should sort strategies by priority', () => {
      const strategies = manager.getStrategies();
      
      for (let i = 0; i < strategies.length - 1; i++) {
        expect(strategies[i].getPriority()).toBeGreaterThanOrEqual(strategies[i + 1].getPriority());
      }
    });
  });

  describe('handleError', () => {
    it('should handle SystemError correctly', async () => {
      const error = new SystemError(
        'Test error',
        ErrorType.AGENT_ERROR,
        ErrorSeverity.MEDIUM,
        true,
        { agentId: 'agent-1' }
      );

      const result = await manager.handleError(error);

      expect(result).toBeDefined();
      expect(typeof result.success).toBe('boolean');
      expect(typeof result.action).toBe('string');
      expect(typeof result.message).toBe('string');
    });

    it('should convert regular Error to SystemError', async () => {
      const error = new Error('Regular error message');
      const context = { agentId: 'agent-1' };

      const result = await manager.handleError(error, context);

      expect(result).toBeDefined();
      
      // Check that error was logged
      const logs = manager.getErrorLogs();
      expect(logs.length).toBeGreaterThan(0);
      expect(logs[0].error).toBeInstanceOf(SystemError);
    });

    it('should use custom strategy when available', async () => {
      manager.addStrategy(mockStrategy);
      
      const error = new SystemError('Test error', ErrorType.AGENT_ERROR, ErrorSeverity.MEDIUM);
      const result = await manager.handleError(error);

      expect(result.action).toBe('mock_action');
      expect(result.message).toBe('Mock recovery');
    });

    it('should escalate when auto-recovery is disabled', async () => {
      manager.updateConfig({ enableAutoRecovery: false });
      
      const error = new SystemError('Test error', ErrorType.AGENT_ERROR, ErrorSeverity.MEDIUM);
      const result = await manager.handleError(error);

      expect(result.success).toBe(false);
      expect(result.action).toBe('escalated');
    });

    it('should escalate non-recoverable errors', async () => {
      const error = new SystemError(
        'Non-recoverable error',
        ErrorType.SYSTEM_ERROR,
        ErrorSeverity.CRITICAL,
        false // Not recoverable
      );

      const result = await manager.handleError(error);

      expect(result.success).toBe(false);
      expect(result.action).toBe('escalated');
    });

    it('should respect max retry attempts', async () => {
      const failingStrategy = new MockRecoveryStrategy(
        'FailingStrategy',
        200,
        true,
        { success: false, action: 'retry', message: 'Failed', retryAfter: 50 }
      );
      
      manager.addStrategy(failingStrategy);
      
      const error = new SystemError('Failing error', ErrorType.AGENT_ERROR, ErrorSeverity.MEDIUM);
      
      // First attempt
      let result = await manager.handleError(error);
      expect(result.success).toBe(false);
      
      // Second attempt (should still try)
      result = await manager.handleError(error);
      expect(result.success).toBe(false);
      
      // Third attempt (should escalate due to max retries)
      result = await manager.handleError(error);
      expect(result.action).toBe('escalated');
    });

    it('should emit events during error handling', async () => {
      const events: any[] = [];
      manager.addEventListener((event) => {
        events.push(event);
      });

      const error = new SystemError('Test error', ErrorType.AGENT_ERROR, ErrorSeverity.MEDIUM);
      await manager.handleError(error);

      expect(events.length).toBeGreaterThan(0);
      expect(events.some(e => e.type === 'error_occurred')).toBe(true);
    });
  });

  describe('strategy management', () => {
    it('should add custom strategies', () => {
      const initialCount = manager.getStrategies().length;
      
      manager.addStrategy(mockStrategy);
      
      const strategies = manager.getStrategies();
      expect(strategies.length).toBe(initialCount + 1);
      expect(strategies.some(s => s.getName() === 'MockStrategy')).toBe(true);
    });

    it('should remove strategies by name', () => {
      manager.addStrategy(mockStrategy);
      
      const removed = manager.removeStrategy('MockStrategy');
      
      expect(removed).toBe(true);
      expect(manager.getStrategies().some(s => s.getName() === 'MockStrategy')).toBe(false);
    });

    it('should return false when removing non-existent strategy', () => {
      const removed = manager.removeStrategy('NonExistentStrategy');
      expect(removed).toBe(false);
    });

    it('should maintain strategy priority order after adding', () => {
      const highPriorityStrategy = new MockRecoveryStrategy('HighPriority', 1000);
      const lowPriorityStrategy = new MockRecoveryStrategy('LowPriority', 10);
      
      manager.addStrategy(lowPriorityStrategy);
      manager.addStrategy(highPriorityStrategy);
      
      const strategies = manager.getStrategies();
      const highIndex = strategies.findIndex(s => s.getName() === 'HighPriority');
      const lowIndex = strategies.findIndex(s => s.getName() === 'LowPriority');
      
      expect(highIndex).toBeLessThan(lowIndex);
    });
  });

  describe('event handling', () => {
    it('should add and remove event listeners', () => {
      const listener1 = jest.fn();
      const listener2 = jest.fn();
      
      manager.addEventListener(listener1);
      manager.addEventListener(listener2);
      
      manager.removeEventListener(listener1);
      
      // Trigger an event
      const error = new SystemError('Test error', ErrorType.AGENT_ERROR, ErrorSeverity.MEDIUM);
      manager.handleError(error);
      
      // Wait for async operations
      setTimeout(() => {
        expect(listener1).not.toHaveBeenCalled();
        expect(listener2).toHaveBeenCalled();
      }, 100);
    });

    it('should handle listener exceptions gracefully', async () => {
      const faultyListener = jest.fn(() => {
        throw new Error('Listener error');
      });
      
      manager.addEventListener(faultyListener);
      
      // Should not throw despite faulty listener
      const error = new SystemError('Test error', ErrorType.AGENT_ERROR, ErrorSeverity.MEDIUM);
      await expect(manager.handleError(error)).resolves.toBeDefined();
    });
  });

  describe('logging and analysis', () => {
    beforeEach(async () => {
      // Add some test errors
      const errors = [
        new SystemError('Agent error 1', ErrorType.AGENT_ERROR, ErrorSeverity.LOW),
        new SystemError('File error 1', ErrorType.FILE_ERROR, ErrorSeverity.MEDIUM),
        new SystemError('Agent error 2', ErrorType.AGENT_ERROR, ErrorSeverity.HIGH),
      ];

      for (const error of errors) {
        await manager.handleError(error);
      }
    });

    it('should provide error logs', () => {
      const logs = manager.getErrorLogs();
      
      expect(logs.length).toBe(3);
      expect(logs.every(log => log.id && log.timestamp && log.error)).toBe(true);
    });

    it('should provide error statistics', () => {
      const stats = manager.getErrorStatistics();
      
      expect(stats.totalErrors).toBe(3);
      expect(stats.errorsByType[ErrorType.AGENT_ERROR]).toBe(2);
      expect(stats.errorsByType[ErrorType.FILE_ERROR]).toBe(1);
    });

    it('should analyze error trends', () => {
      const analysis = manager.analyzeErrorTrends();
      
      expect(analysis.totalErrors).toBe(3);
      expect(analysis.errorsByType).toBeDefined();
      expect(analysis.recommendations).toBeDefined();
    });

    it('should export and import error logs', () => {
      const exported = manager.exportErrorLogs();
      
      expect(typeof exported).toBe('string');
      
      manager.clearErrorLogs();
      expect(manager.getErrorLogs().length).toBe(0);
      
      const importedCount = manager.importErrorLogs(exported);
      expect(importedCount).toBe(3);
      expect(manager.getErrorLogs().length).toBe(3);
    });

    it('should clear error logs', () => {
      expect(manager.getErrorLogs().length).toBe(3);
      
      manager.clearErrorLogs();
      
      expect(manager.getErrorLogs().length).toBe(0);
    });
  });

  describe('configuration', () => {
    it('should update configuration', () => {
      const newConfig = {
        maxRetryAttempts: 5,
        enableAutoRecovery: false
      };
      
      manager.updateConfig(newConfig);
      
      const config = manager.getConfig();
      expect(config.maxRetryAttempts).toBe(5);
      expect(config.enableAutoRecovery).toBe(false);
    });

    it('should return current configuration', () => {
      const config = manager.getConfig();
      
      expect(config).toHaveProperty('maxRetryAttempts');
      expect(config).toHaveProperty('retryDelayMs');
      expect(config).toHaveProperty('escalationThreshold');
      expect(config).toHaveProperty('enableAutoRecovery');
      expect(config).toHaveProperty('logRetentionDays');
      expect(config).toHaveProperty('maxLogSize');
    });
  });
});
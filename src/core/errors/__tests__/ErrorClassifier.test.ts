/**
 * Unit tests for error classifier
 */

import { ErrorClassifier, ErrorPattern } from '../ErrorClassifier';
import { SystemError } from '../SystemError';
import { ErrorType, ErrorSeverity } from '../../../types/error.types';

describe('ErrorClassifier', () => {
  let classifier: ErrorClassifier;

  beforeEach(() => {
    classifier = new ErrorClassifier();
  });

  describe('classify', () => {
    it('should classify SystemError correctly', () => {
      const error = new SystemError(
        'Agent timeout',
        ErrorType.AGENT_ERROR,
        ErrorSeverity.HIGH,
        true,
        { agentId: 'agent-1' }
      );

      const classification = classifier.classify(error);

      expect(classification.type).toBe(ErrorType.AGENT_ERROR);
      expect(classification.severity).toBe(ErrorSeverity.HIGH);
      expect(classification.category).toBe('agent');
      expect(classification.confidence).toBe(1.0);
      expect(classification.tags).toContain('agent');
    });

    it('should classify timeout errors correctly', () => {
      const error = new Error('Operation timed out after 30 seconds');

      const classification = classifier.classify(error);

      expect(classification.type).toBe(ErrorType.AGENT_ERROR);
      expect(classification.severity).toBe(ErrorSeverity.MEDIUM);
      expect(classification.category).toBe('timeout');
      expect(classification.tags).toContain('timeout');
      expect(classification.tags).toContain('performance');
      expect(classification.suggestedActions).toContain('increase_timeout');
    });

    it('should classify crash errors correctly', () => {
      const error = new Error('Segmentation fault occurred');

      const classification = classifier.classify(error);

      expect(classification.type).toBe(ErrorType.AGENT_ERROR);
      expect(classification.severity).toBe(ErrorSeverity.CRITICAL);
      expect(classification.category).toBe('crash');
      expect(classification.tags).toContain('crash');
      expect(classification.suggestedActions).toContain('restart_agent');
    });

    it('should classify file not found errors correctly', () => {
      const error = new Error('ENOENT: no such file or directory');

      const classification = classifier.classify(error);

      expect(classification.type).toBe(ErrorType.FILE_ERROR);
      expect(classification.severity).toBe(ErrorSeverity.MEDIUM);
      expect(classification.category).toBe('file_access');
      expect(classification.tags).toContain('file');
      expect(classification.suggestedActions).toContain('check_file_path');
    });

    it('should classify permission errors correctly', () => {
      const error = new Error('EACCES: permission denied');

      const classification = classifier.classify(error);

      expect(classification.type).toBe(ErrorType.FILE_ERROR);
      expect(classification.severity).toBe(ErrorSeverity.HIGH);
      expect(classification.category).toBe('permissions');
      expect(classification.tags).toContain('permissions');
      expect(classification.suggestedActions).toContain('check_permissions');
    });

    it('should classify network errors correctly', () => {
      const error = new Error('ECONNREFUSED: Connection refused');

      const classification = classifier.classify(error);

      expect(classification.type).toBe(ErrorType.COMMUNICATION_ERROR);
      expect(classification.severity).toBe(ErrorSeverity.HIGH);
      expect(classification.category).toBe('network');
      expect(classification.tags).toContain('network');
      expect(classification.suggestedActions).toContain('check_network');
    });

    it('should classify memory errors correctly', () => {
      const error = new Error('JavaScript heap out of memory');

      const classification = classifier.classify(error);

      expect(classification.type).toBe(ErrorType.SYSTEM_ERROR);
      expect(classification.severity).toBe(ErrorSeverity.CRITICAL);
      expect(classification.category).toBe('memory');
      expect(classification.tags).toContain('memory');
      expect(classification.suggestedActions).toContain('free_memory');
    });

    it('should provide fallback classification for unknown errors', () => {
      const error = new Error('Completely unrecognizable error xyz123');

      const classification = classifier.classify(error);

      expect(classification.type).toBe(ErrorType.SYSTEM_ERROR);
      expect(classification.severity).toBe(ErrorSeverity.MEDIUM);
      expect(classification.category).toBe('unknown');
      expect(classification.confidence).toBe(0.3);
      expect(classification.tags).toContain('unclassified');
    });

    it('should use context to improve classification', () => {
      const error = new Error('Unknown error');
      const context = { agentId: 'agent-1' };

      const classification = classifier.classify(error, context);

      expect(classification.type).toBe(ErrorType.AGENT_ERROR);
      expect(classification.category).toBe('agent');
      expect(classification.tags).toContain('agent');
    });
  });

  describe('pattern management', () => {
    it('should add custom patterns', () => {
      const pattern: ErrorPattern = {
        name: 'custom_error',
        pattern: /custom error/i,
        type: ErrorType.SYSTEM_ERROR,
        severity: ErrorSeverity.LOW,
        category: 'custom',
        tags: ['custom'],
        suggestedActions: ['custom_action']
      };

      classifier.addPattern(pattern);

      const error = new Error('This is a custom error');
      const classification = classifier.classify(error);

      expect(classification.type).toBe(ErrorType.SYSTEM_ERROR);
      expect(classification.severity).toBe(ErrorSeverity.LOW);
      expect(classification.category).toBe('custom');
      expect(classification.tags).toContain('custom');
      expect(classification.suggestedActions).toContain('custom_action');
    });

    it('should remove patterns by name', () => {
      const pattern: ErrorPattern = {
        name: 'removable_pattern',
        pattern: /removable/i,
        type: ErrorType.SYSTEM_ERROR,
        severity: ErrorSeverity.LOW,
        category: 'removable',
        tags: ['removable'],
        suggestedActions: ['remove_action']
      };

      classifier.addPattern(pattern);
      const removed = classifier.removePattern('removable_pattern');

      expect(removed).toBe(true);

      const error = new Error('This is a removable error');
      const classification = classifier.classify(error);

      // Should fall back to default classification
      expect(classification.category).not.toBe('removable');
    });

    it('should return false when removing non-existent pattern', () => {
      const removed = classifier.removePattern('non_existent_pattern');
      expect(removed).toBe(false);
    });
  });

  describe('analyzeErrorTrends', () => {
    it('should analyze error trends correctly', () => {
      const errors = [
        new SystemError('Error 1', ErrorType.AGENT_ERROR, ErrorSeverity.LOW, true, { agentId: 'agent-1' }),
        new SystemError('Error 2', ErrorType.AGENT_ERROR, ErrorSeverity.MEDIUM, true, { agentId: 'agent-1' }),
        new SystemError('Error 3', ErrorType.FILE_ERROR, ErrorSeverity.HIGH, true, { agentId: 'agent-2' }),
        new SystemError('Error 4', ErrorType.TASK_ERROR, ErrorSeverity.CRITICAL, true, { agentId: 'agent-2' }),
      ];

      const analysis = classifier.analyzeErrorTrends(errors, 3600000);

      expect(analysis.totalErrors).toBe(4);
      expect(analysis.errorsByType[ErrorType.AGENT_ERROR]).toBe(2);
      expect(analysis.errorsByType[ErrorType.FILE_ERROR]).toBe(1);
      expect(analysis.errorsByType[ErrorType.TASK_ERROR]).toBe(1);
      expect(analysis.errorsBySeverity[ErrorSeverity.LOW]).toBe(1);
      expect(analysis.errorsBySeverity[ErrorSeverity.MEDIUM]).toBe(1);
      expect(analysis.errorsBySeverity[ErrorSeverity.HIGH]).toBe(1);
      expect(analysis.errorsBySeverity[ErrorSeverity.CRITICAL]).toBe(1);
      expect(analysis.errorsByAgent['agent-1']).toBe(2);
      expect(analysis.errorsByAgent['agent-2']).toBe(2);
    });

    it('should filter errors by time window', () => {
      const oldError = new SystemError('Old error', ErrorType.AGENT_ERROR, ErrorSeverity.LOW);
      oldError.timestamp = new Date(Date.now() - 7200000); // 2 hours ago

      const recentError = new SystemError('Recent error', ErrorType.AGENT_ERROR, ErrorSeverity.LOW);
      recentError.timestamp = new Date(Date.now() - 1800000); // 30 minutes ago

      const errors = [oldError, recentError];
      const analysis = classifier.analyzeErrorTrends(errors, 3600000); // 1 hour window

      expect(analysis.totalErrors).toBe(1); // Only recent error should be included
    });

    it('should provide recommendations based on error patterns', () => {
      const errors = Array.from({ length: 6 }, (_, i) => 
        new SystemError(`Agent error ${i}`, ErrorType.AGENT_ERROR, ErrorSeverity.MEDIUM, true, { agentId: 'agent-1' })
      );

      const analysis = classifier.analyzeErrorTrends(errors, 3600000);

      expect(analysis.recommendations).toContain('Consider reviewing agent configurations and health checks');
    });
  });
});
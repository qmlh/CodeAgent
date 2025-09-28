/**
 * Error classification and analysis utilities
 */

import { ErrorType, ErrorSeverity, ErrorContext } from '../../types/error.types';
import { SystemError } from './SystemError';

/**
 * Interface for error classification results
 */
export interface ErrorClassification {
  type: ErrorType;
  severity: ErrorSeverity;
  category: string;
  tags: string[];
  confidence: number; // 0-1, how confident we are in this classification
  suggestedActions: string[];
}

/**
 * Interface for error pattern matching
 */
export interface ErrorPattern {
  name: string;
  pattern: RegExp | ((error: Error) => boolean);
  type: ErrorType;
  severity: ErrorSeverity;
  category: string;
  tags: string[];
  suggestedActions: string[];
}

/**
 * Error classifier that analyzes errors and provides classification
 */
export class ErrorClassifier {
  private patterns: ErrorPattern[] = [];

  constructor() {
    this.initializeDefaultPatterns();
  }

  /**
   * Classifies an error and returns classification details
   */
  classify(error: Error, context?: ErrorContext): ErrorClassification {
    // If it's already a SystemError, use its classification
    if (error instanceof SystemError) {
      return this.classifySystemError(error);
    }

    // Try to match against known patterns
    const matchedPattern = this.findMatchingPattern(error);
    if (matchedPattern) {
      return this.createClassificationFromPattern(matchedPattern, error);
    }

    // Fallback classification based on error message and type
    return this.createFallbackClassification(error, context);
  }

  /**
   * Analyzes error trends and patterns
   */
  analyzeErrorTrends(errors: SystemError[], timeWindow: number = 3600000): ErrorAnalysis {
    const now = Date.now();
    const recentErrors = errors.filter(
      error => now - error.timestamp.getTime() <= timeWindow
    );

    const errorsByType = this.groupErrorsByType(recentErrors);
    const errorsBySeverity = this.groupErrorsBySeverity(recentErrors);
    const errorsByAgent = this.groupErrorsByAgent(recentErrors);
    const errorFrequency = this.calculateErrorFrequency(recentErrors, timeWindow);

    return {
      totalErrors: recentErrors.length,
      timeWindow,
      errorsByType,
      errorsBySeverity,
      errorsByAgent,
      errorFrequency,
      trends: this.identifyTrends(recentErrors),
      recommendations: this.generateRecommendations(recentErrors)
    };
  }

  /**
   * Adds a custom error pattern for classification
   */
  addPattern(pattern: ErrorPattern): void {
    this.patterns.push(pattern);
    // Sort by specificity (more specific patterns first)
    this.patterns.sort((a, b) => this.getPatternSpecificity(b) - this.getPatternSpecificity(a));
  }

  /**
   * Removes a pattern by name
   */
  removePattern(name: string): boolean {
    const index = this.patterns.findIndex(p => p.name === name);
    if (index >= 0) {
      this.patterns.splice(index, 1);
      return true;
    }
    return false;
  }

  private initializeDefaultPatterns(): void {
    // Agent-related error patterns
    this.addPattern({
      name: 'agent_timeout',
      pattern: /timeout|timed out|time limit exceeded/i,
      type: ErrorType.AGENT_ERROR,
      severity: ErrorSeverity.MEDIUM,
      category: 'timeout',
      tags: ['timeout', 'performance'],
      suggestedActions: ['increase_timeout', 'check_agent_health', 'restart_agent']
    });

    this.addPattern({
      name: 'agent_crash',
      pattern: /crash|segmentation fault|access violation|fatal error/i,
      type: ErrorType.AGENT_ERROR,
      severity: ErrorSeverity.CRITICAL,
      category: 'crash',
      tags: ['crash', 'critical'],
      suggestedActions: ['restart_agent', 'check_system_resources', 'escalate_to_admin']
    });

    // Task-related error patterns
    this.addPattern({
      name: 'task_dependency_error',
      pattern: /dependency|prerequisite|required task/i,
      type: ErrorType.TASK_ERROR,
      severity: ErrorSeverity.MEDIUM,
      category: 'dependency',
      tags: ['dependency', 'workflow'],
      suggestedActions: ['check_dependencies', 'reorder_tasks', 'resolve_dependencies']
    });

    this.addPattern({
      name: 'task_validation_error',
      pattern: /validation|invalid input|malformed/i,
      type: ErrorType.VALIDATION_ERROR,
      severity: ErrorSeverity.LOW,
      category: 'validation',
      tags: ['validation', 'input'],
      suggestedActions: ['validate_input', 'sanitize_data', 'check_schema']
    });

    // File-related error patterns
    this.addPattern({
      name: 'file_not_found',
      pattern: /file not found|no such file|enoent/i,
      type: ErrorType.FILE_ERROR,
      severity: ErrorSeverity.MEDIUM,
      category: 'file_access',
      tags: ['file', 'access'],
      suggestedActions: ['check_file_path', 'create_missing_file', 'verify_permissions']
    });

    this.addPattern({
      name: 'file_permission_error',
      pattern: /permission denied|access denied|eacces/i,
      type: ErrorType.FILE_ERROR,
      severity: ErrorSeverity.HIGH,
      category: 'permissions',
      tags: ['file', 'permissions', 'security'],
      suggestedActions: ['check_permissions', 'run_as_admin', 'change_file_ownership']
    });

    this.addPattern({
      name: 'file_lock_error',
      pattern: /file locked|lock|busy|in use/i,
      type: ErrorType.FILE_ERROR,
      severity: ErrorSeverity.MEDIUM,
      category: 'file_lock',
      tags: ['file', 'lock', 'concurrency'],
      suggestedActions: ['release_locks', 'retry_operation', 'check_lock_owner']
    });

    // Communication error patterns
    this.addPattern({
      name: 'network_error',
      pattern: /network|connection|socket|econnrefused|enotfound/i,
      type: ErrorType.COMMUNICATION_ERROR,
      severity: ErrorSeverity.HIGH,
      category: 'network',
      tags: ['network', 'connectivity'],
      suggestedActions: ['check_network', 'retry_connection', 'use_fallback_endpoint']
    });

    this.addPattern({
      name: 'message_queue_error',
      pattern: /queue|message|publish|subscribe/i,
      type: ErrorType.COMMUNICATION_ERROR,
      severity: ErrorSeverity.MEDIUM,
      category: 'messaging',
      tags: ['messaging', 'queue'],
      suggestedActions: ['restart_message_queue', 'clear_queue', 'check_queue_health']
    });

    // System error patterns
    this.addPattern({
      name: 'memory_error',
      pattern: /out of memory|memory|heap|enomem/i,
      type: ErrorType.SYSTEM_ERROR,
      severity: ErrorSeverity.CRITICAL,
      category: 'memory',
      tags: ['memory', 'resources'],
      suggestedActions: ['free_memory', 'restart_system', 'increase_memory_limit']
    });

    this.addPattern({
      name: 'disk_space_error',
      pattern: /disk space|no space|enospc/i,
      type: ErrorType.SYSTEM_ERROR,
      severity: ErrorSeverity.HIGH,
      category: 'disk',
      tags: ['disk', 'storage'],
      suggestedActions: ['free_disk_space', 'cleanup_temp_files', 'archive_old_files']
    });
  }

  private classifySystemError(error: SystemError): ErrorClassification {
    return {
      type: error.type,
      severity: error.severity,
      category: this.getCategoryFromType(error.type),
      tags: this.getTagsFromError(error),
      confidence: 1.0, // High confidence for already classified errors
      suggestedActions: this.getSuggestedActionsFromError(error)
    };
  }

  private findMatchingPattern(error: Error): ErrorPattern | null {
    for (const pattern of this.patterns) {
      if (this.matchesPattern(error, pattern)) {
        return pattern;
      }
    }
    return null;
  }

  private matchesPattern(error: Error, pattern: ErrorPattern): boolean {
    if (pattern.pattern instanceof RegExp) {
      return pattern.pattern.test(error.message) || pattern.pattern.test(error.name);
    } else if (typeof pattern.pattern === 'function') {
      return pattern.pattern(error);
    }
    return false;
  }

  private createClassificationFromPattern(pattern: ErrorPattern, error: Error): ErrorClassification {
    return {
      type: pattern.type,
      severity: pattern.severity,
      category: pattern.category,
      tags: [...pattern.tags],
      confidence: 0.8, // Good confidence for pattern matches
      suggestedActions: [...pattern.suggestedActions]
    };
  }

  private createFallbackClassification(error: Error, context?: ErrorContext): ErrorClassification {
    // Basic classification based on error name and context
    let type = ErrorType.SYSTEM_ERROR;
    let severity = ErrorSeverity.MEDIUM;
    let category = 'unknown';
    const tags: string[] = ['unclassified'];

    // Try to infer type from context
    if (context?.agentId) {
      type = ErrorType.AGENT_ERROR;
      category = 'agent';
      tags.push('agent');
    } else if (context?.taskId) {
      type = ErrorType.TASK_ERROR;
      category = 'task';
      tags.push('task');
    } else if (context?.filePath) {
      type = ErrorType.FILE_ERROR;
      category = 'file';
      tags.push('file');
    }

    return {
      type,
      severity,
      category,
      tags,
      confidence: 0.3, // Low confidence for fallback classification
      suggestedActions: ['log_error', 'notify_admin', 'investigate_manually']
    };
  }

  private getCategoryFromType(type: ErrorType): string {
    const categoryMap: Record<ErrorType, string> = {
      [ErrorType.AGENT_ERROR]: 'agent',
      [ErrorType.TASK_ERROR]: 'task',
      [ErrorType.FILE_ERROR]: 'file',
      [ErrorType.COMMUNICATION_ERROR]: 'communication',
      [ErrorType.SYSTEM_ERROR]: 'system',
      [ErrorType.VALIDATION_ERROR]: 'validation',
      [ErrorType.CONFIGURATION_ERROR]: 'configuration',
      [ErrorType.ENVIRONMENT_ERROR]: 'environment',
      [ErrorType.TIMEOUT_ERROR]: 'timeout',
      [ErrorType.DEPENDENCY_ERROR]: 'dependency'
    };
    return categoryMap[type] || 'unknown';
  }

  private getTagsFromError(error: SystemError): string[] {
    const tags: string[] = [this.getCategoryFromType(error.type)];
    
    if (error.agentId) tags.push('agent');
    if (error.taskId) tags.push('task');
    if (error.severity === ErrorSeverity.CRITICAL) tags.push('critical');
    if (!error.recoverable) tags.push('non-recoverable');
    
    return tags;
  }

  private getSuggestedActionsFromError(error: SystemError): string[] {
    const actions: string[] = [];
    
    switch (error.type) {
      case ErrorType.AGENT_ERROR:
        actions.push('check_agent_health', 'restart_agent');
        break;
      case ErrorType.TASK_ERROR:
        actions.push('retry_task', 'reassign_task');
        break;
      case ErrorType.FILE_ERROR:
        actions.push('check_file_permissions', 'retry_file_operation');
        break;
      case ErrorType.COMMUNICATION_ERROR:
        actions.push('check_network', 'reconnect');
        break;
      case ErrorType.SYSTEM_ERROR:
        actions.push('check_system_resources', 'restart_service');
        break;
      case ErrorType.VALIDATION_ERROR:
        actions.push('validate_input', 'fix_data_format');
        break;
      case ErrorType.CONFIGURATION_ERROR:
        actions.push('check_configuration', 'reset_to_defaults');
        break;
      case ErrorType.ENVIRONMENT_ERROR:
        actions.push('check_environment', 'verify_dependencies');
        break;
      case ErrorType.TIMEOUT_ERROR:
        actions.push('increase_timeout', 'retry_operation');
        break;
      case ErrorType.DEPENDENCY_ERROR:
        actions.push('install_dependencies', 'check_versions');
        break;
    }
    
    if (error.severity === ErrorSeverity.CRITICAL) {
      actions.push('escalate_to_admin');
    }
    
    return actions;
  }

  private getPatternSpecificity(pattern: ErrorPattern): number {
    // More specific patterns should have higher scores
    let score = 0;
    
    if (pattern.pattern instanceof RegExp) {
      // More complex regex patterns are considered more specific
      score += pattern.pattern.source.length;
    } else {
      // Function patterns are considered highly specific
      score += 100;
    }
    
    // More tags indicate more specificity
    score += pattern.tags.length * 10;
    
    return score;
  }

  private groupErrorsByType(errors: SystemError[]): Record<ErrorType, number> {
    const groups: Record<ErrorType, number> = {} as Record<ErrorType, number>;
    
    for (const error of errors) {
      groups[error.type] = (groups[error.type] || 0) + 1;
    }
    
    return groups;
  }

  private groupErrorsBySeverity(errors: SystemError[]): Record<ErrorSeverity, number> {
    const groups: Record<ErrorSeverity, number> = {} as Record<ErrorSeverity, number>;
    
    for (const error of errors) {
      groups[error.severity] = (groups[error.severity] || 0) + 1;
    }
    
    return groups;
  }

  private groupErrorsByAgent(errors: SystemError[]): Record<string, number> {
    const groups: Record<string, number> = {};
    
    for (const error of errors) {
      if (error.agentId) {
        groups[error.agentId] = (groups[error.agentId] || 0) + 1;
      }
    }
    
    return groups;
  }

  private calculateErrorFrequency(errors: SystemError[], timeWindow: number): number {
    return errors.length / (timeWindow / 1000 / 60); // Errors per minute
  }

  private identifyTrends(errors: SystemError[]): ErrorTrend[] {
    const trends: ErrorTrend[] = [];
    
    // Identify increasing error rates
    const hourlyGroups = this.groupErrorsByHour(errors);
    if (this.isIncreasingTrend(hourlyGroups)) {
      trends.push({
        type: 'increasing_errors',
        description: 'Error rate is increasing over time',
        severity: 'warning'
      });
    }
    
    // Identify recurring error patterns
    const errorMessages = errors.map(e => e.message);
    const recurringMessages = this.findRecurringPatterns(errorMessages);
    if (recurringMessages.length > 0) {
      trends.push({
        type: 'recurring_errors',
        description: `Found ${recurringMessages.length} recurring error patterns`,
        severity: 'info'
      });
    }
    
    return trends;
  }

  private generateRecommendations(errors: SystemError[]): string[] {
    const recommendations: string[] = [];
    
    const errorsByType = this.groupErrorsByType(errors);
    const errorsBySeverity = this.groupErrorsBySeverity(errors);
    
    // Recommend based on error types
    if (errorsByType[ErrorType.AGENT_ERROR] > 5) {
      recommendations.push('Consider reviewing agent configurations and health checks');
    }
    
    if (errorsByType[ErrorType.FILE_ERROR] > 3) {
      recommendations.push('Review file permissions and disk space availability');
    }
    
    if (errorsByType[ErrorType.COMMUNICATION_ERROR] > 2) {
      recommendations.push('Check network connectivity and message queue health');
    }
    
    // Recommend based on severity
    if (errorsBySeverity[ErrorSeverity.CRITICAL] > 0) {
      recommendations.push('Immediate attention required for critical errors');
    }
    
    if (errorsBySeverity[ErrorSeverity.HIGH] > 2) {
      recommendations.push('Review and address high severity errors promptly');
    }
    
    return recommendations;
  }

  private groupErrorsByHour(errors: SystemError[]): number[] {
    const hours: number[] = new Array(24).fill(0);
    
    for (const error of errors) {
      const hour = error.timestamp.getHours();
      hours[hour]++;
    }
    
    return hours;
  }

  private isIncreasingTrend(hourlyData: number[]): boolean {
    // Simple trend detection - check if recent hours have more errors
    const recentHours = hourlyData.slice(-6); // Last 6 hours
    const earlierHours = hourlyData.slice(-12, -6); // 6 hours before that
    
    const recentAvg = recentHours.reduce((a, b) => a + b, 0) / recentHours.length;
    const earlierAvg = earlierHours.reduce((a, b) => a + b, 0) / earlierHours.length;
    
    return recentAvg > earlierAvg * 1.5; // 50% increase threshold
  }

  private findRecurringPatterns(messages: string[]): string[] {
    const messageCount: Record<string, number> = {};
    
    for (const message of messages) {
      messageCount[message] = (messageCount[message] || 0) + 1;
    }
    
    return Object.keys(messageCount).filter(message => messageCount[message] > 2);
  }
}

/**
 * Interface for error analysis results
 */
export interface ErrorAnalysis {
  totalErrors: number;
  timeWindow: number;
  errorsByType: Record<ErrorType, number>;
  errorsBySeverity: Record<ErrorSeverity, number>;
  errorsByAgent: Record<string, number>;
  errorFrequency: number; // Errors per minute
  trends: ErrorTrend[];
  recommendations: string[];
}

/**
 * Interface for error trends
 */
export interface ErrorTrend {
  type: string;
  description: string;
  severity: 'info' | 'warning' | 'error';
}
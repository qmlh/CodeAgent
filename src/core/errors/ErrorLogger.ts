/**
 * Error logging and analysis functionality
 */

import { ErrorType, ErrorSeverity, ErrorContext } from '../../types/error.types';
import { SystemError } from './SystemError';
import { ErrorClassification, ErrorAnalysis, ErrorClassifier } from './ErrorClassifier';

/**
 * Interface for error log entries
 */
export interface ErrorLogEntry {
  id: string;
  timestamp: Date;
  error: SystemError;
  classification: ErrorClassification;
  context: ErrorContext;
  stackTrace?: string;
  userAgent?: string;
  sessionId?: string;
  recoveryAttempted: boolean;
  recoveryResult?: {
    success: boolean;
    action: string;
    message: string;
  };
}

/**
 * Interface for error log filters
 */
export interface ErrorLogFilter {
  startDate?: Date;
  endDate?: Date;
  errorTypes?: ErrorType[];
  severities?: ErrorSeverity[];
  agentIds?: string[];
  taskIds?: string[];
  categories?: string[];
  tags?: string[];
  recoverable?: boolean;
  limit?: number;
  offset?: number;
}

/**
 * Interface for error statistics
 */
export interface ErrorStatistics {
  totalErrors: number;
  errorsByType: Record<ErrorType, number>;
  errorsBySeverity: Record<ErrorSeverity, number>;
  errorsByCategory: Record<string, number>;
  errorsByAgent: Record<string, number>;
  errorsByHour: number[];
  errorsByDay: number[];
  recoverySuccessRate: number;
  averageErrorsPerHour: number;
  mostCommonErrors: Array<{
    message: string;
    count: number;
    percentage: number;
  }>;
}

/**
 * Error logger that handles error logging, storage, and analysis
 */
export class ErrorLogger {
  private logs: ErrorLogEntry[] = [];
  private classifier: ErrorClassifier;
  private maxLogSize: number;
  private logRetentionDays: number;

  constructor(
    maxLogSize: number = 10000,
    logRetentionDays: number = 30
  ) {
    this.classifier = new ErrorClassifier();
    this.maxLogSize = maxLogSize;
    this.logRetentionDays = logRetentionDays;
    
    // Clean up old logs periodically
    this.startLogCleanup();
  }

  /**
   * Logs an error with classification and context
   */
  async logError(
    error: SystemError,
    context: ErrorContext = {},
    sessionId?: string,
    userAgent?: string
  ): Promise<string> {
    const classification = this.classifier.classify(error, context);
    
    const logEntry: ErrorLogEntry = {
      id: this.generateLogId(),
      timestamp: new Date(),
      error,
      classification,
      context,
      stackTrace: error.stack,
      userAgent,
      sessionId,
      recoveryAttempted: false
    };

    this.logs.push(logEntry);
    
    // Maintain log size limit
    if (this.logs.length > this.maxLogSize) {
      this.logs = this.logs.slice(-this.maxLogSize);
    }

    // Emit log event for real-time monitoring
    this.emitLogEvent('error_logged', logEntry);

    return logEntry.id;
  }

  /**
   * Updates a log entry with recovery attempt results
   */
  updateRecoveryResult(
    logId: string,
    recoveryResult: {
      success: boolean;
      action: string;
      message: string;
    }
  ): boolean {
    const logEntry = this.logs.find(log => log.id === logId);
    if (logEntry) {
      logEntry.recoveryAttempted = true;
      logEntry.recoveryResult = recoveryResult;
      
      this.emitLogEvent('recovery_updated', logEntry);
      return true;
    }
    return false;
  }

  /**
   * Retrieves error logs based on filters
   */
  getLogs(filter: ErrorLogFilter = {}): ErrorLogEntry[] {
    let filteredLogs = [...this.logs];

    // Apply date filters
    if (filter.startDate) {
      filteredLogs = filteredLogs.filter(log => log.timestamp >= filter.startDate!);
    }
    if (filter.endDate) {
      filteredLogs = filteredLogs.filter(log => log.timestamp <= filter.endDate!);
    }

    // Apply type filters
    if (filter.errorTypes && filter.errorTypes.length > 0) {
      filteredLogs = filteredLogs.filter(log => 
        filter.errorTypes!.includes(log.error.type)
      );
    }

    // Apply severity filters
    if (filter.severities && filter.severities.length > 0) {
      filteredLogs = filteredLogs.filter(log => 
        filter.severities!.includes(log.error.severity)
      );
    }

    // Apply agent filters
    if (filter.agentIds && filter.agentIds.length > 0) {
      filteredLogs = filteredLogs.filter(log => 
        log.error.agentId && filter.agentIds!.includes(log.error.agentId)
      );
    }

    // Apply task filters
    if (filter.taskIds && filter.taskIds.length > 0) {
      filteredLogs = filteredLogs.filter(log => 
        log.error.taskId && filter.taskIds!.includes(log.error.taskId)
      );
    }

    // Apply category filters
    if (filter.categories && filter.categories.length > 0) {
      filteredLogs = filteredLogs.filter(log => 
        filter.categories!.includes(log.classification.category)
      );
    }

    // Apply tag filters
    if (filter.tags && filter.tags.length > 0) {
      filteredLogs = filteredLogs.filter(log => 
        filter.tags!.some(tag => log.classification.tags.includes(tag))
      );
    }

    // Apply recoverable filter
    if (filter.recoverable !== undefined) {
      filteredLogs = filteredLogs.filter(log => 
        log.error.recoverable === filter.recoverable
      );
    }

    // Sort by timestamp (newest first)
    filteredLogs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    // Apply pagination
    const offset = filter.offset || 0;
    const limit = filter.limit || filteredLogs.length;
    
    return filteredLogs.slice(offset, offset + limit);
  }

  /**
   * Gets error statistics for analysis
   */
  getStatistics(filter: ErrorLogFilter = {}): ErrorStatistics {
    const logs = this.getLogs(filter);
    
    const totalErrors = logs.length;
    const errorsByType = this.groupByType(logs);
    const errorsBySeverity = this.groupBySeverity(logs);
    const errorsByCategory = this.groupByCategory(logs);
    const errorsByAgent = this.groupByAgent(logs);
    const errorsByHour = this.groupByHour(logs);
    const errorsByDay = this.groupByDay(logs);
    
    const recoveryAttempts = logs.filter(log => log.recoveryAttempted);
    const successfulRecoveries = recoveryAttempts.filter(
      log => log.recoveryResult?.success
    );
    const recoverySuccessRate = recoveryAttempts.length > 0 
      ? successfulRecoveries.length / recoveryAttempts.length 
      : 0;

    const timeSpanHours = this.getTimeSpanInHours(logs);
    const averageErrorsPerHour = timeSpanHours > 0 ? totalErrors / timeSpanHours : 0;

    const mostCommonErrors = this.getMostCommonErrors(logs);

    return {
      totalErrors,
      errorsByType,
      errorsBySeverity,
      errorsByCategory,
      errorsByAgent,
      errorsByHour,
      errorsByDay,
      recoverySuccessRate,
      averageErrorsPerHour,
      mostCommonErrors
    };
  }

  /**
   * Analyzes error trends and patterns
   */
  analyzeErrors(timeWindow: number = 3600000): ErrorAnalysis {
    const recentErrors = this.logs
      .filter(log => Date.now() - log.timestamp.getTime() <= timeWindow)
      .map(log => log.error);
    
    return this.classifier.analyzeErrorTrends(recentErrors, timeWindow);
  }

  /**
   * Exports error logs to JSON format
   */
  exportLogs(filter: ErrorLogFilter = {}): string {
    const logs = this.getLogs(filter);
    return JSON.stringify(logs, null, 2);
  }

  /**
   * Imports error logs from JSON format
   */
  importLogs(jsonData: string): number {
    try {
      const importedLogs: ErrorLogEntry[] = JSON.parse(jsonData);
      let importedCount = 0;

      for (const log of importedLogs) {
        // Validate log entry structure
        if (this.isValidLogEntry(log)) {
          // Convert timestamp string back to Date object if needed
          if (typeof log.timestamp === 'string') {
            log.timestamp = new Date(log.timestamp);
          }
          this.logs.push(log);
          importedCount++;
        }
      }

      // Maintain log size limit
      if (this.logs.length > this.maxLogSize) {
        this.logs = this.logs.slice(-this.maxLogSize);
      }

      // Sort logs by timestamp
      this.logs.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

      return importedCount;
    } catch (error) {
      throw new Error(`Failed to import logs: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Clears all logs
   */
  clearLogs(): void {
    this.logs = [];
    this.emitLogEvent('logs_cleared', null);
  }

  /**
   * Gets the current log count
   */
  getLogCount(): number {
    return this.logs.length;
  }

  private generateLogId(): string {
    return `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private startLogCleanup(): void {
    // Clean up old logs every hour
    setInterval(() => {
      this.cleanupOldLogs();
    }, 3600000); // 1 hour
  }

  private cleanupOldLogs(): void {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.logRetentionDays);
    
    const initialCount = this.logs.length;
    this.logs = this.logs.filter(log => log.timestamp >= cutoffDate);
    
    const removedCount = initialCount - this.logs.length;
    if (removedCount > 0) {
      this.emitLogEvent('logs_cleaned', { removedCount });
    }
  }

  private emitLogEvent(eventType: string, data: any): void {
    // In a real implementation, this would emit events to listeners
    // For now, we'll just log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`ErrorLogger Event: ${eventType}`, data);
    }
  }

  private groupByType(logs: ErrorLogEntry[]): Record<ErrorType, number> {
    const groups: Record<ErrorType, number> = {} as Record<ErrorType, number>;
    
    for (const log of logs) {
      groups[log.error.type] = (groups[log.error.type] || 0) + 1;
    }
    
    return groups;
  }

  private groupBySeverity(logs: ErrorLogEntry[]): Record<ErrorSeverity, number> {
    const groups: Record<ErrorSeverity, number> = {} as Record<ErrorSeverity, number>;
    
    for (const log of logs) {
      groups[log.error.severity] = (groups[log.error.severity] || 0) + 1;
    }
    
    return groups;
  }

  private groupByCategory(logs: ErrorLogEntry[]): Record<string, number> {
    const groups: Record<string, number> = {};
    
    for (const log of logs) {
      const category = log.classification.category;
      groups[category] = (groups[category] || 0) + 1;
    }
    
    return groups;
  }

  private groupByAgent(logs: ErrorLogEntry[]): Record<string, number> {
    const groups: Record<string, number> = {};
    
    for (const log of logs) {
      if (log.error.agentId) {
        groups[log.error.agentId] = (groups[log.error.agentId] || 0) + 1;
      }
    }
    
    return groups;
  }

  private groupByHour(logs: ErrorLogEntry[]): number[] {
    const hours: number[] = new Array(24).fill(0);
    
    for (const log of logs) {
      const hour = log.timestamp.getHours();
      hours[hour]++;
    }
    
    return hours;
  }

  private groupByDay(logs: ErrorLogEntry[]): number[] {
    const days: number[] = new Array(7).fill(0);
    
    for (const log of logs) {
      const day = log.timestamp.getDay();
      days[day]++;
    }
    
    return days;
  }

  private getTimeSpanInHours(logs: ErrorLogEntry[]): number {
    if (logs.length === 0) return 0;
    
    const timestamps = logs.map(log => log.timestamp.getTime());
    const minTime = Math.min(...timestamps);
    const maxTime = Math.max(...timestamps);
    
    return (maxTime - minTime) / (1000 * 60 * 60); // Convert to hours
  }

  private getMostCommonErrors(logs: ErrorLogEntry[]): Array<{
    message: string;
    count: number;
    percentage: number;
  }> {
    const messageCounts: Record<string, number> = {};
    
    for (const log of logs) {
      const message = log.error.message;
      messageCounts[message] = (messageCounts[message] || 0) + 1;
    }
    
    const sortedMessages = Object.entries(messageCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10); // Top 10 most common errors
    
    return sortedMessages.map(([message, count]) => ({
      message,
      count,
      percentage: (count / logs.length) * 100
    }));
  }

  private isValidLogEntry(log: any): log is ErrorLogEntry {
    return (
      log &&
      typeof log.id === 'string' &&
      log.timestamp &&
      log.error &&
      log.classification &&
      typeof log.error.type === 'string' &&
      typeof log.error.severity === 'string' &&
      typeof log.error.message === 'string'
    );
  }
}
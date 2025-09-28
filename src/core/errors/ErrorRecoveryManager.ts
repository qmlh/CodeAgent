/**
 * Main error recovery manager that coordinates error handling, classification, and recovery
 */

import { ErrorType, ErrorSeverity, ErrorContext, RecoveryResult } from '../../types/error.types';
import { SystemError } from './SystemError';
import { 
  IErrorRecoveryStrategy,
  AgentRecoveryStrategy,
  TaskRecoveryStrategy,
  FileRecoveryStrategy,
  CommunicationRecoveryStrategy,
  FallbackRecoveryStrategy
} from './ErrorRecoveryStrategy';
import { ErrorClassifier, ErrorClassification } from './ErrorClassifier';
import { ErrorLogger, ErrorLogEntry } from './ErrorLogger';

/**
 * Configuration for the error recovery manager
 */
export interface ErrorRecoveryConfig {
  maxRetryAttempts: number;
  retryDelayMs: number;
  escalationThreshold: number;
  enableAutoRecovery: boolean;
  logRetentionDays: number;
  maxLogSize: number;
}

/**
 * Interface for error recovery events
 */
export interface ErrorRecoveryEvent {
  type: 'error_occurred' | 'recovery_attempted' | 'recovery_succeeded' | 'recovery_failed' | 'escalated';
  timestamp: Date;
  errorId: string;
  error: SystemError;
  strategy?: string;
  result?: RecoveryResult;
}

/**
 * Main error recovery manager
 */
export class ErrorRecoveryManager {
  private strategies: IErrorRecoveryStrategy[] = [];
  private classifier: ErrorClassifier;
  private logger: ErrorLogger;
  private config: ErrorRecoveryConfig;
  private eventListeners: Array<(event: ErrorRecoveryEvent) => void> = [];
  private retryAttempts: Map<string, number> = new Map();

  constructor(config: Partial<ErrorRecoveryConfig> = {}) {
    this.config = {
      maxRetryAttempts: 3,
      retryDelayMs: 1000,
      escalationThreshold: 5,
      enableAutoRecovery: true,
      logRetentionDays: 30,
      maxLogSize: 10000,
      ...config
    };

    this.classifier = new ErrorClassifier();
    this.logger = new ErrorLogger(this.config.maxLogSize, this.config.logRetentionDays);
    
    this.initializeDefaultStrategies();
  }

  /**
   * Handles an error by classifying it, logging it, and attempting recovery
   */
  async handleError(
    error: Error | SystemError,
    context: ErrorContext = {}
  ): Promise<RecoveryResult> {
    // Convert to SystemError if needed
    const systemError = this.ensureSystemError(error, context);
    
    // Log the error
    const errorId = await this.logger.logError(systemError, context);
    
    // Emit error occurred event
    this.emitEvent({
      type: 'error_occurred',
      timestamp: new Date(),
      errorId,
      error: systemError
    });

    // Attempt recovery if enabled and error is recoverable
    if (this.config.enableAutoRecovery && systemError.recoverable) {
      return await this.attemptRecovery(systemError, context, errorId);
    } else {
      // If auto-recovery is disabled or error is not recoverable, escalate
      await this.escalateError(systemError, context, errorId);
      return {
        success: false,
        action: 'escalated',
        message: 'Error escalated for manual intervention'
      };
    }
  }

  /**
   * Adds a custom recovery strategy
   */
  addStrategy(strategy: IErrorRecoveryStrategy): void {
    this.strategies.push(strategy);
    this.sortStrategiesByPriority();
  }

  /**
   * Removes a recovery strategy by name
   */
  removeStrategy(name: string): boolean {
    const index = this.strategies.findIndex(s => s.getName() === name);
    if (index >= 0) {
      this.strategies.splice(index, 1);
      return true;
    }
    return false;
  }

  /**
   * Gets all registered strategies
   */
  getStrategies(): IErrorRecoveryStrategy[] {
    return [...this.strategies];
  }

  /**
   * Adds an event listener for error recovery events
   */
  addEventListener(listener: (event: ErrorRecoveryEvent) => void): void {
    this.eventListeners.push(listener);
  }

  /**
   * Removes an event listener
   */
  removeEventListener(listener: (event: ErrorRecoveryEvent) => void): void {
    const index = this.eventListeners.indexOf(listener);
    if (index >= 0) {
      this.eventListeners.splice(index, 1);
    }
  }

  /**
   * Gets error logs with optional filtering
   */
  getErrorLogs(filter: any = {}): ErrorLogEntry[] {
    return this.logger.getLogs(filter);
  }

  /**
   * Gets error statistics
   */
  getErrorStatistics(filter: any = {}): any {
    return this.logger.getStatistics(filter);
  }

  /**
   * Analyzes error trends
   */
  analyzeErrorTrends(timeWindow: number = 3600000): any {
    return this.logger.analyzeErrors(timeWindow);
  }

  /**
   * Exports error logs
   */
  exportErrorLogs(filter: any = {}): string {
    return this.logger.exportLogs(filter);
  }

  /**
   * Imports error logs
   */
  importErrorLogs(jsonData: string): number {
    return this.logger.importLogs(jsonData);
  }

  /**
   * Clears all error logs
   */
  clearErrorLogs(): void {
    this.logger.clearLogs();
    this.retryAttempts.clear();
  }

  /**
   * Updates the configuration
   */
  updateConfig(newConfig: Partial<ErrorRecoveryConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Gets the current configuration
   */
  getConfig(): ErrorRecoveryConfig {
    return { ...this.config };
  }

  private initializeDefaultStrategies(): void {
    this.addStrategy(new AgentRecoveryStrategy());
    this.addStrategy(new TaskRecoveryStrategy());
    this.addStrategy(new FileRecoveryStrategy());
    this.addStrategy(new CommunicationRecoveryStrategy());
    this.addStrategy(new FallbackRecoveryStrategy());
  }

  private ensureSystemError(error: Error | SystemError, context: ErrorContext): SystemError {
    if (error instanceof SystemError) {
      return error;
    }

    // Classify the error to determine type and severity
    const classification = this.classifier.classify(error, context);
    
    return new SystemError(
      error.message,
      classification.type,
      classification.severity,
      true, // Assume recoverable by default
      context
    );
  }

  private async attemptRecovery(
    error: SystemError,
    context: ErrorContext,
    errorId: string
  ): Promise<RecoveryResult> {
    // Check if we've exceeded retry attempts for this error pattern
    const errorKey = this.getErrorKey(error);
    const attempts = this.retryAttempts.get(errorKey) || 0;
    
    if (attempts >= this.config.maxRetryAttempts) {
      await this.escalateError(error, context, errorId);
      return {
        success: false,
        action: 'escalated',
        message: `Maximum retry attempts (${this.config.maxRetryAttempts}) exceeded`
      };
    }

    // Find a suitable recovery strategy
    const strategy = this.findRecoveryStrategy(error);
    if (!strategy) {
      await this.escalateError(error, context, errorId);
      return {
        success: false,
        action: 'escalated',
        message: 'No suitable recovery strategy found'
      };
    }

    // Emit recovery attempted event
    this.emitEvent({
      type: 'recovery_attempted',
      timestamp: new Date(),
      errorId,
      error,
      strategy: strategy.getName()
    });

    try {
      // Increment retry attempts
      this.retryAttempts.set(errorKey, attempts + 1);
      
      // Attempt recovery
      const result = await strategy.recover(error, context);
      
      // Update log with recovery result
      this.logger.updateRecoveryResult(errorId, result);
      
      if (result.success) {
        // Reset retry attempts on success
        this.retryAttempts.delete(errorKey);
        
        this.emitEvent({
          type: 'recovery_succeeded',
          timestamp: new Date(),
          errorId,
          error,
          strategy: strategy.getName(),
          result
        });
      } else {
        this.emitEvent({
          type: 'recovery_failed',
          timestamp: new Date(),
          errorId,
          error,
          strategy: strategy.getName(),
          result
        });
        
        // If recovery failed but has a retry delay, schedule retry
        if (result.retryAfter) {
          setTimeout(() => {
            this.handleError(error, context);
          }, result.retryAfter);
        }
      }
      
      return result;
    } catch (recoveryError) {
      const failureResult: RecoveryResult = {
        success: false,
        action: 'recovery_exception',
        message: `Recovery strategy failed: ${recoveryError instanceof Error ? recoveryError.message : 'Unknown error'}`
      };
      
      this.logger.updateRecoveryResult(errorId, failureResult);
      
      this.emitEvent({
        type: 'recovery_failed',
        timestamp: new Date(),
        errorId,
        error,
        strategy: strategy.getName(),
        result: failureResult
      });
      
      return failureResult;
    }
  }

  private findRecoveryStrategy(error: SystemError): IErrorRecoveryStrategy | null {
    for (const strategy of this.strategies) {
      if (strategy.canHandle(error)) {
        return strategy;
      }
    }
    return null;
  }

  private async escalateError(
    error: SystemError,
    context: ErrorContext,
    errorId: string
  ): Promise<void> {
    // In a real implementation, this would notify administrators,
    // create tickets, send alerts, etc.
    
    this.emitEvent({
      type: 'escalated',
      timestamp: new Date(),
      errorId,
      error
    });
    
    // Log escalation
    console.error('Error escalated for manual intervention:', {
      errorId,
      type: error.type,
      severity: error.severity,
      message: error.message,
      context
    });
  }

  private getErrorKey(error: SystemError): string {
    // Create a key that identifies similar errors for retry tracking
    return `${error.type}:${error.message}:${error.agentId || 'unknown'}`;
  }

  private sortStrategiesByPriority(): void {
    this.strategies.sort((a, b) => b.getPriority() - a.getPriority());
  }

  private emitEvent(event: ErrorRecoveryEvent): void {
    for (const listener of this.eventListeners) {
      try {
        listener(event);
      } catch (error) {
        console.error('Error in event listener:', error);
      }
    }
  }
}

// Re-export SystemError for convenience
export { SystemError } from './SystemError';
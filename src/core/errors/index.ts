/**
 * Error handling system exports
 */

// Re-export types first
export type { SystemError as ISystemError, ErrorContext, RecoveryResult } from '../../types/error.types';
export { ErrorType, ErrorSeverity } from '../../types/error.types';

// Core error classes
export * from './SystemError';

// Error recovery strategies
export * from './ErrorRecoveryStrategy';

// Error classification and analysis
export * from './ErrorClassifier';

// Error logging
export * from './ErrorLogger';

// Main error recovery manager
export * from './ErrorRecoveryManager';
/**
 * Example usage of the Error Recovery System
 * This file demonstrates how to use the error recovery components
 */

import { 
  ErrorRecoveryManager, 
  SystemError, 
  ErrorClassifier,
  ErrorLogger,
  AgentRecoveryStrategy,
  TaskRecoveryStrategy
} from './index';
import { ErrorType, ErrorSeverity } from '../../types/error.types';

// Example 1: Basic Error Recovery Manager Usage
async function basicErrorRecoveryExample() {
  console.log('=== Basic Error Recovery Example ===');
  
  // Create an error recovery manager with custom configuration
  const manager = new ErrorRecoveryManager({
    maxRetryAttempts: 3,
    retryDelayMs: 1000,
    enableAutoRecovery: true,
    logRetentionDays: 7,
    maxLogSize: 1000
  });

  // Add event listener to monitor recovery events
  manager.addEventListener((event) => {
    console.log(`Recovery Event: ${event.type} - ${event.error.message}`);
  });

  // Handle different types of errors
  try {
    // Agent error
    const agentError = new SystemError(
      'Agent timeout during task execution',
      ErrorType.AGENT_ERROR,
      ErrorSeverity.MEDIUM,
      true,
      { agentId: 'frontend-agent-1', taskId: 'task-123' }
    );
    
    const result1 = await manager.handleError(agentError);
    console.log('Agent error recovery result:', result1);

    // File error
    const fileError = new SystemError(
      'File access denied: /project/src/main.ts',
      ErrorType.FILE_ERROR,
      ErrorSeverity.HIGH,
      true,
      { agentId: 'backend-agent-2', metadata: { filePath: '/project/src/main.ts' } }
    );
    
    const result2 = await manager.handleError(fileError);
    console.log('File error recovery result:', result2);

    // Regular JavaScript error (will be classified automatically)
    const jsError = new Error('ECONNREFUSED: Connection refused');
    const result3 = await manager.handleError(jsError, { agentId: 'communication-agent' });
    console.log('JS error recovery result:', result3);

  } catch (error) {
    console.error('Error in recovery example:', error);
  }

  // Get error statistics
  const stats = manager.getErrorStatistics();
  console.log('Error Statistics:', {
    totalErrors: stats.totalErrors,
    errorsByType: stats.errorsByType,
    recoverySuccessRate: stats.recoverySuccessRate
  });
}

// Example 2: Custom Recovery Strategy
async function customStrategyExample() {
  console.log('\n=== Custom Recovery Strategy Example ===');
  
  // Create a custom recovery strategy for database errors
  class DatabaseRecoveryStrategy {
    getName() {
      return 'DatabaseRecoveryStrategy';
    }

    getPriority() {
      return 150; // Higher priority than default strategies
    }

    canHandle(error: SystemError) {
      return error.message.toLowerCase().includes('database') ||
             error.message.toLowerCase().includes('connection pool');
    }

    async recover(error: SystemError, context: any) {
      console.log('Attempting database recovery for:', error.message);
      
      // Simulate database reconnection
      await new Promise(resolve => setTimeout(resolve, 100));
      
      return {
        success: true,
        action: 'database_reconnect',
        message: 'Successfully reconnected to database'
      };
    }
  }

  const manager = new ErrorRecoveryManager();
  manager.addStrategy(new DatabaseRecoveryStrategy());

  // Test the custom strategy
  const dbError = new SystemError(
    'Database connection pool exhausted',
    ErrorType.SYSTEM_ERROR,
    ErrorSeverity.HIGH,
    true,
    { agentId: 'data-agent' }
  );

  const result = await manager.handleError(dbError);
  console.log('Database error recovery result:', result);
}

// Example 3: Error Classification and Analysis
async function errorAnalysisExample() {
  console.log('\n=== Error Classification and Analysis Example ===');
  
  const classifier = new ErrorClassifier();
  const logger = new ErrorLogger();

  // Test different error patterns
  const errors = [
    new Error('Operation timed out after 30 seconds'),
    new Error('ENOENT: no such file or directory'),
    new Error('EACCES: permission denied'),
    new Error('JavaScript heap out of memory'),
    new Error('ECONNREFUSED: Connection refused'),
    new SystemError('Agent crashed unexpectedly', ErrorType.AGENT_ERROR, ErrorSeverity.CRITICAL)
  ];

  console.log('Classifying errors:');
  for (const error of errors) {
    const classification = classifier.classify(error);
    console.log(`- "${error.message}"`);
    console.log(`  Type: ${classification.type}, Severity: ${classification.severity}`);
    console.log(`  Category: ${classification.category}, Confidence: ${classification.confidence}`);
    console.log(`  Suggested Actions: ${classification.suggestedActions.join(', ')}`);
    console.log('');

    // Log the error if it's a SystemError
    if (error instanceof SystemError) {
      await logger.logError(error);
    }
  }

  // Analyze error trends
  const systemErrors = errors.filter(e => e instanceof SystemError) as SystemError[];
  if (systemErrors.length > 0) {
    const analysis = classifier.analyzeErrorTrends(systemErrors);
    console.log('Error Trend Analysis:', {
      totalErrors: analysis.totalErrors,
      errorsByType: analysis.errorsByType,
      recommendations: analysis.recommendations
    });
  }
}

// Example 4: Error Pattern Management
async function errorPatternExample() {
  console.log('\n=== Error Pattern Management Example ===');
  
  const classifier = new ErrorClassifier();

  // Add a custom error pattern for API errors
  classifier.addPattern({
    name: 'api_rate_limit',
    pattern: /rate limit|too many requests|429/i,
    type: ErrorType.COMMUNICATION_ERROR,
    severity: ErrorSeverity.MEDIUM,
    category: 'rate_limiting',
    tags: ['api', 'rate_limit', 'throttling'],
    suggestedActions: ['implement_backoff', 'reduce_request_rate', 'use_caching']
  });

  // Test the custom pattern
  const apiError = new Error('API rate limit exceeded: 429 Too Many Requests');
  const classification = classifier.classify(apiError);
  
  console.log('API Error Classification:');
  console.log(`Type: ${classification.type}`);
  console.log(`Category: ${classification.category}`);
  console.log(`Tags: ${classification.tags.join(', ')}`);
  console.log(`Suggested Actions: ${classification.suggestedActions.join(', ')}`);
}

// Run all examples
async function runExamples() {
  try {
    await basicErrorRecoveryExample();
    await customStrategyExample();
    await errorAnalysisExample();
    await errorPatternExample();
    
    console.log('\n=== All examples completed successfully! ===');
  } catch (error) {
    console.error('Error running examples:', error);
  }
}

// Export for use in other files
export {
  basicErrorRecoveryExample,
  customStrategyExample,
  errorAnalysisExample,
  errorPatternExample,
  runExamples
};

// Run examples if this file is executed directly
if (require.main === module) {
  runExamples();
}
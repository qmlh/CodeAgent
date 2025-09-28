import { TestReporter } from '../reporting/TestReporter';
import { TestAnalyzer } from '../utils/TestAnalyzer';
import { BenchmarkResult } from '../performance/PerformanceBenchmarks';

// Global test setup
beforeAll(async () => {
  console.log('🚀 Starting Multi-Agent IDE E2E Test Suite');
  console.log('Environment:', process.env.NODE_ENV || 'test');
  console.log('Node version:', process.version);
  console.log('Platform:', process.platform);
  
  // Set up global test timeout
  jest.setTimeout(300000); // 5 minutes
  
  // Initialize global test utilities
  (global as any).testReporter = new TestReporter('./test-reports/e2e');
  (global as any).testAnalyzer = new TestAnalyzer();
  (global as any).benchmarkResults = [];
});

// Global test teardown
afterAll(async () => {
  console.log('📊 Generating E2E test reports...');
  
  const testReporter = (global as any).testReporter as TestReporter;
  const testAnalyzer = (global as any).testAnalyzer as TestAnalyzer;
  const benchmarkResults = (global as any).benchmarkResults as BenchmarkResult[];
  
  if (benchmarkResults.length > 0) {
    // Add results to analyzer
    testAnalyzer.addBenchmarkResults(benchmarkResults);
    
    // Generate comprehensive report
    const report = await testReporter.generateReport(benchmarkResults);
    
    console.log('✅ E2E Test Suite Completed');
    console.log(`📈 Success Rate: ${report.summary.successRate.toFixed(1)}%`);
    console.log(`⏱️  Total Duration: ${Math.round(report.summary.duration / 1000)}s`);
    console.log(`🔍 Regressions: ${report.regressionAnalysis.hasRegressions ? 'Yes' : 'No'}`);
    
    if (report.recommendations.length > 0) {
      console.log('💡 Recommendations:');
      report.recommendations.forEach(rec => console.log(`   - ${rec}`));
    }
  }
});

// Custom matchers for E2E tests
expect.extend({
  toBeWithinPerformanceThreshold(received: number, expected: number, threshold: number = 0.1) {
    const pass = Math.abs(received - expected) / expected <= threshold;
    
    if (pass) {
      return {
        message: () => `Expected ${received} not to be within ${threshold * 100}% of ${expected}`,
        pass: true
      };
    } else {
      return {
        message: () => `Expected ${received} to be within ${threshold * 100}% of ${expected}`,
        pass: false
      };
    }
  },
  
  toHaveAcceptableMemoryUsage(received: number, maxMB: number = 500) {
    const receivedMB = received / 1024 / 1024;
    const pass = receivedMB <= maxMB;
    
    if (pass) {
      return {
        message: () => `Expected memory usage ${receivedMB.toFixed(1)}MB not to be acceptable (≤${maxMB}MB)`,
        pass: true
      };
    } else {
      return {
        message: () => `Expected memory usage ${receivedMB.toFixed(1)}MB to be acceptable (≤${maxMB}MB)`,
        pass: false
      };
    }
  },
  
  toCompleteWithinTimeout(received: number, timeoutMs: number) {
    const pass = received <= timeoutMs;
    
    if (pass) {
      return {
        message: () => `Expected ${received}ms not to complete within ${timeoutMs}ms`,
        pass: true
      };
    } else {
      return {
        message: () => `Expected ${received}ms to complete within ${timeoutMs}ms`,
        pass: false
      };
    }
  }
});

// Declare custom matchers for TypeScript
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeWithinPerformanceThreshold(expected: number, threshold?: number): R;
      toHaveAcceptableMemoryUsage(maxMB?: number): R;
      toCompleteWithinTimeout(timeoutMs: number): R;
    }
  }
}

// Global error handler for unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Don't exit the process in tests, just log the error
});

// Global error handler for uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  // Don't exit the process in tests, just log the error
});

// Helper function to add benchmark results
(global as any).addBenchmarkResult = (result: BenchmarkResult) => {
  (global as any).benchmarkResults.push(result);
};

// Helper function to get test utilities
(global as any).getTestUtils = () => ({
  reporter: (global as any).testReporter,
  analyzer: (global as any).testAnalyzer
});

console.log('🔧 E2E test environment configured');
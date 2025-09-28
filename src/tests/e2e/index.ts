// Main E2E Test Suite Entry Point
export { TestEnvironment } from './setup/TestEnvironment';
export type { TestEnvironmentConfig } from './setup/TestEnvironment';
export { PerformanceBenchmarkSuite } from './performance/PerformanceBenchmarks';
export type { BenchmarkResult } from './performance/PerformanceBenchmarks';
export { TestReporter } from './reporting/TestReporter';
export type { TestReport, RegressionAnalysis } from './reporting/TestReporter';
export { TestAnalyzer } from './utils/TestAnalyzer';
export type { PerformanceMetrics, SystemHealthMetrics } from './utils/TestAnalyzer';
export { E2ETestRunner } from './run-e2e-tests';
export type { TestRunOptions } from './run-e2e-tests';

// Re-export test scenarios for external use
export * from './scenarios/CollaborationWorkflowTests';
export * from './scenarios/ConcurrentAgentTests';

// Utility functions for external test integration
export async function runE2ETestSuite(options?: {
  suite?: 'all' | 'collaboration' | 'concurrent' | 'performance';
  outputDir?: string;
  verbose?: boolean;
}): Promise<any> {
  const { E2ETestRunner } = await import('./run-e2e-tests');
  const runner = new E2ETestRunner(options);
  return runner.run();
}

export async function runPerformanceBenchmarks(): Promise<any[]> {
  const { PerformanceBenchmarkSuite } = await import('./performance/PerformanceBenchmarks');
  const suite = new PerformanceBenchmarkSuite();
  return suite.runAllBenchmarks();
}

export async function generateTestReport(
  benchmarkResults: any[],
  outputDir?: string
): Promise<any> {
  const { TestReporter } = await import('./reporting/TestReporter');
  const reporter = new TestReporter(outputDir);
  return reporter.generateReport(benchmarkResults);
}
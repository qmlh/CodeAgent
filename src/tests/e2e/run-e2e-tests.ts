#!/usr/bin/env node

import { spawn } from 'child_process';
import * as path from 'path';
import * as fs from 'fs/promises';
import { PerformanceBenchmarkSuite } from './performance/PerformanceBenchmarks';
import { TestReporter } from './reporting/TestReporter';
import { TestAnalyzer } from './utils/TestAnalyzer';

interface TestRunOptions {
  suite?: 'all' | 'collaboration' | 'concurrent' | 'performance';
  verbose?: boolean;
  generateReport?: boolean;
  updateBaseline?: boolean;
  outputDir?: string;
}

class E2ETestRunner {
  private options: TestRunOptions;
  private reporter: TestReporter;
  private analyzer: TestAnalyzer;

  constructor(options: TestRunOptions = {}) {
    this.options = {
      suite: 'all',
      verbose: false,
      generateReport: true,
      updateBaseline: false,
      outputDir: './test-reports/e2e',
      ...options
    };

    this.reporter = new TestReporter(this.options.outputDir);
    this.analyzer = new TestAnalyzer();
  }

  async run(): Promise<void> {
    console.log('🚀 Starting Multi-Agent IDE E2E Test Suite');
    console.log(`📋 Suite: ${this.options.suite}`);
    console.log(`📁 Output: ${this.options.outputDir}`);
    console.log('');

    try {
      // Ensure output directory exists
      await fs.mkdir(this.options.outputDir!, { recursive: true });

      // Run tests based on suite selection
      const results = await this.runTestSuite();

      // Generate reports if requested
      if (this.options.generateReport) {
        await this.generateReports(results);
      }

      console.log('✅ E2E Test Suite completed successfully');
      process.exit(0);

    } catch (error) {
      console.error('❌ E2E Test Suite failed:', error);
      process.exit(1);
    }
  }

  private async runTestSuite(): Promise<any> {
    switch (this.options.suite) {
      case 'collaboration':
        return this.runCollaborationTests();
      
      case 'concurrent':
        return this.runConcurrentTests();
      
      case 'performance':
        return this.runPerformanceTests();
      
      case 'all':
      default:
        return this.runAllTests();
    }
  }

  private async runCollaborationTests(): Promise<any> {
    console.log('🤝 Running Collaboration Workflow Tests...');
    
    return this.runJestTests([
      'src/tests/e2e/scenarios/CollaborationWorkflowTests.ts'
    ]);
  }

  private async runConcurrentTests(): Promise<any> {
    console.log('⚡ Running Concurrent Agent Tests...');
    
    return this.runJestTests([
      'src/tests/e2e/scenarios/ConcurrentAgentTests.ts'
    ]);
  }

  private async runPerformanceTests(): Promise<any> {
    console.log('📊 Running Performance Benchmarks...');
    
    const benchmarkSuite = new PerformanceBenchmarkSuite();
    const results = await benchmarkSuite.runAllBenchmarks();
    
    this.analyzer.addBenchmarkResults(results);
    
    return {
      type: 'performance',
      results,
      summary: {
        totalBenchmarks: results.length,
        successfulBenchmarks: results.filter(r => r.systemMetrics.successRate >= 95).length,
        totalDuration: results.reduce((sum, r) => sum + r.duration, 0)
      }
    };
  }

  private async runAllTests(): Promise<any> {
    console.log('🎯 Running All E2E Tests...');
    
    const results = {
      collaboration: await this.runCollaborationTests(),
      concurrent: await this.runConcurrentTests(),
      performance: await this.runPerformanceTests()
    };

    return results;
  }

  private async runJestTests(testFiles: string[]): Promise<any> {
    return new Promise((resolve, reject) => {
      const jestConfig = path.join(__dirname, 'jest.config.js');
      const args = [
        '--config', jestConfig,
        '--testPathPattern', testFiles.join('|'),
        '--runInBand', // Run tests serially
        '--forceExit'
      ];

      if (this.options.verbose) {
        args.push('--verbose');
      }

      const jestProcess = spawn('npx', ['jest', ...args], {
        stdio: 'inherit',
        cwd: process.cwd()
      });

      jestProcess.on('close', (code) => {
        if (code === 0) {
          resolve({ success: true, exitCode: code });
        } else {
          reject(new Error(`Jest tests failed with exit code ${code}`));
        }
      });

      jestProcess.on('error', (error) => {
        reject(error);
      });
    });
  }

  private async generateReports(results: any): Promise<void> {
    console.log('📊 Generating test reports...');

    try {
      // Extract benchmark results if available
      let benchmarkResults: any[] = [];
      
      if (results.performance?.results) {
        benchmarkResults = results.performance.results;
      } else if (results.type === 'performance') {
        benchmarkResults = results.results;
      }

      if (benchmarkResults.length > 0) {
        // Generate comprehensive report
        const report = await this.reporter.generateReport(benchmarkResults);
        
        console.log('📈 Report Summary:');
        console.log(`   Success Rate: ${report.summary.successRate.toFixed(1)}%`);
        console.log(`   Total Tests: ${report.summary.totalTests}`);
        console.log(`   Duration: ${Math.round(report.summary.duration / 1000)}s`);
        console.log(`   Regressions: ${report.regressionAnalysis.hasRegressions ? 'Yes' : 'No'}`);

        // Show performance trends
        const trends = this.analyzer.generatePerformanceTrends();
        if (Object.keys(trends).length > 0) {
          console.log('📈 Performance Trends:');
          for (const [testName, trend] of Object.entries(trends)) {
            console.log(`   ${testName}: ${(trend as any).throughput?.trend || 'stable'}`);
          }
        }

        // Show anomalies
        for (const result of benchmarkResults) {
          const anomalies = this.analyzer.detectAnomalies(result.testName);
          if (anomalies.length > 0) {
            console.log(`⚠️  Anomalies in ${result.testName}:`);
            anomalies.forEach(anomaly => console.log(`   - ${anomaly}`));
          }
        }

        console.log(`📄 Detailed report saved to: ${this.options.outputDir}/latest-report.html`);
      }

    } catch (error) {
      console.error('Failed to generate reports:', error);
    }
  }
}

// CLI interface
function parseArgs(): TestRunOptions {
  const args = process.argv.slice(2);
  const options: TestRunOptions = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    switch (arg) {
      case '--suite':
        options.suite = args[++i] as any;
        break;
      case '--verbose':
        options.verbose = true;
        break;
      case '--no-report':
        options.generateReport = false;
        break;
      case '--update-baseline':
        options.updateBaseline = true;
        break;
      case '--output':
        options.outputDir = args[++i];
        break;
      case '--help':
        printHelp();
        process.exit(0);
        break;
    }
  }

  return options;
}

function printHelp(): void {
  console.log(`
Multi-Agent IDE E2E Test Runner

Usage: npm run test:e2e [options]

Options:
  --suite <type>        Test suite to run: all, collaboration, concurrent, performance (default: all)
  --verbose             Enable verbose output
  --no-report           Skip report generation
  --update-baseline     Update performance baseline after successful run
  --output <dir>        Output directory for reports (default: ./test-reports/e2e)
  --help                Show this help message

Examples:
  npm run test:e2e                           # Run all tests
  npm run test:e2e -- --suite performance    # Run only performance tests
  npm run test:e2e -- --verbose --no-report  # Run with verbose output, no reports
  `);
}

// Main execution
if (require.main === module) {
  const options = parseArgs();
  const runner = new E2ETestRunner(options);
  runner.run();
}

export { E2ETestRunner };
export type { TestRunOptions };
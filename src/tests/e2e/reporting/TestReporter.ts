import * as fs from 'fs/promises';
import * as path from 'path';
import { BenchmarkResult } from '../performance/PerformanceBenchmarks';

export interface TestReport {
  timestamp: Date;
  environment: {
    nodeVersion: string;
    platform: string;
    arch: string;
    totalMemory: number;
  };
  summary: {
    totalTests: number;
    passedTests: number;
    failedTests: number;
    duration: number;
    successRate: number;
  };
  benchmarks: BenchmarkResult[];
  regressionAnalysis: RegressionAnalysis;
  recommendations: string[];
}

export interface RegressionAnalysis {
  hasRegressions: boolean;
  regressions: {
    testName: string;
    metric: string;
    previousValue: number;
    currentValue: number;
    changePercent: number;
  }[];
  improvements: {
    testName: string;
    metric: string;
    previousValue: number;
    currentValue: number;
    changePercent: number;
  }[];
}

export class TestReporter {
  private reportDir: string;
  private baselineFile: string;

  constructor(reportDir: string = './test-reports') {
    this.reportDir = reportDir;
    this.baselineFile = path.join(reportDir, 'baseline.json');
  }

  async generateReport(
    benchmarkResults: BenchmarkResult[],
    testResults?: any[]
  ): Promise<TestReport> {
    const timestamp = new Date();
    
    // Collect environment information
    const environment = {
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
      totalMemory: require('os').totalmem()
    };

    // Calculate summary statistics
    const summary = this.calculateSummary(benchmarkResults, testResults);

    // Perform regression analysis
    const regressionAnalysis = await this.performRegressionAnalysis(benchmarkResults);

    // Generate recommendations
    const recommendations = this.generateRecommendations(benchmarkResults, regressionAnalysis);

    const report: TestReport = {
      timestamp,
      environment,
      summary,
      benchmarks: benchmarkResults,
      regressionAnalysis,
      recommendations
    };

    // Save report
    await this.saveReport(report);

    // Update baseline if this is a good run
    if (summary.successRate >= 95 && !regressionAnalysis.hasRegressions) {
      await this.updateBaseline(benchmarkResults);
    }

    return report;
  }

  private calculateSummary(
    benchmarkResults: BenchmarkResult[],
    testResults?: any[]
  ): TestReport['summary'] {
    const totalTests = benchmarkResults.length + (testResults?.length || 0);
    const passedBenchmarks = benchmarkResults.filter(r => r.systemMetrics.successRate >= 95).length;
    const passedTests = testResults?.filter(r => r.status === 'passed').length || 0;
    const passedTotal = passedBenchmarks + passedTests;

    const totalDuration = benchmarkResults.reduce((sum, r) => sum + r.duration, 0);

    return {
      totalTests,
      passedTests: passedTotal,
      failedTests: totalTests - passedTotal,
      duration: totalDuration,
      successRate: (passedTotal / totalTests) * 100
    };
  }

  private async performRegressionAnalysis(
    benchmarkResults: BenchmarkResult[]
  ): Promise<RegressionAnalysis> {
    let baseline: BenchmarkResult[] = [];
    
    try {
      const baselineData = await fs.readFile(this.baselineFile, 'utf-8');
      baseline = JSON.parse(baselineData);
    } catch (error) {
      // No baseline exists yet
      return {
        hasRegressions: false,
        regressions: [],
        improvements: []
      };
    }

    const regressions: RegressionAnalysis['regressions'] = [];
    const improvements: RegressionAnalysis['improvements'] = [];

    for (const currentResult of benchmarkResults) {
      const baselineResult = baseline.find(b => b.testName === currentResult.testName);
      if (!baselineResult) continue;

      // Check throughput regression
      if (baselineResult.throughput > 0 && currentResult.throughput > 0) {
        const changePercent = ((currentResult.throughput - baselineResult.throughput) / baselineResult.throughput) * 100;
        
        if (changePercent < -10) { // 10% regression threshold
          regressions.push({
            testName: currentResult.testName,
            metric: 'throughput',
            previousValue: baselineResult.throughput,
            currentValue: currentResult.throughput,
            changePercent
          });
        } else if (changePercent > 10) { // 10% improvement threshold
          improvements.push({
            testName: currentResult.testName,
            metric: 'throughput',
            previousValue: baselineResult.throughput,
            currentValue: currentResult.throughput,
            changePercent
          });
        }
      }

      // Check duration regression
      const durationChangePercent = ((currentResult.duration - baselineResult.duration) / baselineResult.duration) * 100;
      
      if (durationChangePercent > 20) { // 20% slower is a regression
        regressions.push({
          testName: currentResult.testName,
          metric: 'duration',
          previousValue: baselineResult.duration,
          currentValue: currentResult.duration,
          changePercent: durationChangePercent
        });
      } else if (durationChangePercent < -10) { // 10% faster is an improvement
        improvements.push({
          testName: currentResult.testName,
          metric: 'duration',
          previousValue: baselineResult.duration,
          currentValue: currentResult.duration,
          changePercent: durationChangePercent
        });
      }

      // Check memory usage regression
      const memoryChangePercent = ((currentResult.memoryUsage.peak.heapUsed - baselineResult.memoryUsage.peak.heapUsed) / baselineResult.memoryUsage.peak.heapUsed) * 100;
      
      if (memoryChangePercent > 25) { // 25% more memory is a regression
        regressions.push({
          testName: currentResult.testName,
          metric: 'memory',
          previousValue: baselineResult.memoryUsage.peak.heapUsed,
          currentValue: currentResult.memoryUsage.peak.heapUsed,
          changePercent: memoryChangePercent
        });
      } else if (memoryChangePercent < -15) { // 15% less memory is an improvement
        improvements.push({
          testName: currentResult.testName,
          metric: 'memory',
          previousValue: baselineResult.memoryUsage.peak.heapUsed,
          currentValue: currentResult.memoryUsage.peak.heapUsed,
          changePercent: memoryChangePercent
        });
      }
    }

    return {
      hasRegressions: regressions.length > 0,
      regressions,
      improvements
    };
  }

  private generateRecommendations(
    benchmarkResults: BenchmarkResult[],
    regressionAnalysis: RegressionAnalysis
  ): string[] {
    const recommendations: string[] = [];

    // Regression-based recommendations
    if (regressionAnalysis.hasRegressions) {
      recommendations.push('Performance regressions detected. Review recent changes and consider optimization.');
      
      const throughputRegressions = regressionAnalysis.regressions.filter(r => r.metric === 'throughput');
      if (throughputRegressions.length > 0) {
        recommendations.push('Throughput has decreased. Check for inefficient algorithms or increased computational complexity.');
      }

      const memoryRegressions = regressionAnalysis.regressions.filter(r => r.metric === 'memory');
      if (memoryRegressions.length > 0) {
        recommendations.push('Memory usage has increased significantly. Look for memory leaks or inefficient data structures.');
      }
    }

    // Performance-based recommendations
    const lowThroughputTests = benchmarkResults.filter(r => r.throughput > 0 && r.throughput < 1);
    if (lowThroughputTests.length > 0) {
      recommendations.push('Some tests show low throughput (<1 task/sec). Consider optimizing task processing logic.');
    }

    const highMemoryTests = benchmarkResults.filter(r => r.memoryUsage.peak.heapUsed > 500 * 1024 * 1024); // 500MB
    if (highMemoryTests.length > 0) {
      recommendations.push('High memory usage detected (>500MB). Review memory management and consider implementing memory pooling.');
    }

    const slowTests = benchmarkResults.filter(r => r.systemMetrics.averageResponseTime > 10000); // 10 seconds
    if (slowTests.length > 0) {
      recommendations.push('Some operations are taking longer than 10 seconds. Consider implementing timeout mechanisms and optimizing slow operations.');
    }

    // Success rate recommendations
    const lowSuccessRateTests = benchmarkResults.filter(r => r.systemMetrics.successRate < 95);
    if (lowSuccessRateTests.length > 0) {
      recommendations.push('Some tests have success rates below 95%. Investigate and fix reliability issues.');
    }

    // Scalability recommendations
    const scalabilityTest = benchmarkResults.find(r => r.testName.includes('Scalability'));
    if (scalabilityTest && scalabilityTest.systemMetrics.concurrentPeakLoad < 8) {
      recommendations.push('System may not scale well beyond current agent count. Consider implementing better load balancing.');
    }

    // Positive feedback
    if (regressionAnalysis.improvements.length > 0) {
      recommendations.push('Performance improvements detected! Consider documenting the changes that led to these improvements.');
    }

    if (recommendations.length === 0) {
      recommendations.push('All performance metrics are within acceptable ranges. System is performing well.');
    }

    return recommendations;
  }

  private async saveReport(report: TestReport): Promise<void> {
    // Ensure report directory exists
    await fs.mkdir(this.reportDir, { recursive: true });

    // Save detailed report
    const reportFile = path.join(this.reportDir, `test-report-${report.timestamp.toISOString().replace(/[:.]/g, '-')}.json`);
    await fs.writeFile(reportFile, JSON.stringify(report, null, 2));

    // Save summary report
    const summaryFile = path.join(this.reportDir, 'latest-summary.json');
    const summary = {
      timestamp: report.timestamp,
      summary: report.summary,
      hasRegressions: report.regressionAnalysis.hasRegressions,
      recommendations: report.recommendations
    };
    await fs.writeFile(summaryFile, JSON.stringify(summary, null, 2));

    // Generate HTML report
    await this.generateHtmlReport(report);

    console.log(`Test report saved to ${reportFile}`);
  }

  private async generateHtmlReport(report: TestReport): Promise<void> {
    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Multi-Agent IDE Test Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background-color: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .header { text-align: center; margin-bottom: 30px; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .metric-card { background: #f8f9fa; padding: 15px; border-radius: 6px; text-align: center; }
        .metric-value { font-size: 2em; font-weight: bold; color: #007bff; }
        .metric-label { color: #666; margin-top: 5px; }
        .section { margin-bottom: 30px; }
        .section h2 { color: #333; border-bottom: 2px solid #007bff; padding-bottom: 10px; }
        .benchmark-table { width: 100%; border-collapse: collapse; margin-top: 15px; }
        .benchmark-table th, .benchmark-table td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
        .benchmark-table th { background-color: #f8f9fa; font-weight: bold; }
        .regression { color: #dc3545; font-weight: bold; }
        .improvement { color: #28a745; font-weight: bold; }
        .recommendation { background: #fff3cd; border: 1px solid #ffeaa7; padding: 10px; margin: 5px 0; border-radius: 4px; }
        .success { color: #28a745; }
        .warning { color: #ffc107; }
        .error { color: #dc3545; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Multi-Agent IDE Test Report</h1>
            <p>Generated on ${report.timestamp.toLocaleString()}</p>
        </div>

        <div class="section">
            <h2>Summary</h2>
            <div class="summary">
                <div class="metric-card">
                    <div class="metric-value ${report.summary.successRate >= 95 ? 'success' : 'error'}">${report.summary.successRate.toFixed(1)}%</div>
                    <div class="metric-label">Success Rate</div>
                </div>
                <div class="metric-card">
                    <div class="metric-value">${report.summary.totalTests}</div>
                    <div class="metric-label">Total Tests</div>
                </div>
                <div class="metric-card">
                    <div class="metric-value">${Math.round(report.summary.duration / 1000)}s</div>
                    <div class="metric-label">Total Duration</div>
                </div>
                <div class="metric-card">
                    <div class="metric-value ${report.regressionAnalysis.hasRegressions ? 'error' : 'success'}">${report.regressionAnalysis.hasRegressions ? 'Yes' : 'No'}</div>
                    <div class="metric-label">Regressions</div>
                </div>
            </div>
        </div>

        <div class="section">
            <h2>Environment</h2>
            <p><strong>Node.js:</strong> ${report.environment.nodeVersion}</p>
            <p><strong>Platform:</strong> ${report.environment.platform} (${report.environment.arch})</p>
            <p><strong>Total Memory:</strong> ${Math.round(report.environment.totalMemory / 1024 / 1024 / 1024)}GB</p>
        </div>

        <div class="section">
            <h2>Benchmark Results</h2>
            <table class="benchmark-table">
                <thead>
                    <tr>
                        <th>Test Name</th>
                        <th>Duration (ms)</th>
                        <th>Throughput</th>
                        <th>Peak Memory (MB)</th>
                        <th>Success Rate (%)</th>
                    </tr>
                </thead>
                <tbody>
                    ${report.benchmarks.map(benchmark => `
                        <tr>
                            <td>${benchmark.testName}</td>
                            <td>${benchmark.duration.toLocaleString()}</td>
                            <td>${benchmark.throughput.toFixed(2)}</td>
                            <td>${Math.round(benchmark.memoryUsage.peak.heapUsed / 1024 / 1024)}</td>
                            <td class="${benchmark.systemMetrics.successRate >= 95 ? 'success' : 'error'}">${benchmark.systemMetrics.successRate}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>

        ${report.regressionAnalysis.regressions.length > 0 ? `
        <div class="section">
            <h2>Performance Regressions</h2>
            ${report.regressionAnalysis.regressions.map(regression => `
                <div class="regression">
                    <strong>${regression.testName}</strong> - ${regression.metric}: 
                    ${regression.changePercent.toFixed(1)}% worse than baseline
                </div>
            `).join('')}
        </div>
        ` : ''}

        ${report.regressionAnalysis.improvements.length > 0 ? `
        <div class="section">
            <h2>Performance Improvements</h2>
            ${report.regressionAnalysis.improvements.map(improvement => `
                <div class="improvement">
                    <strong>${improvement.testName}</strong> - ${improvement.metric}: 
                    ${Math.abs(improvement.changePercent).toFixed(1)}% better than baseline
                </div>
            `).join('')}
        </div>
        ` : ''}

        <div class="section">
            <h2>Recommendations</h2>
            ${report.recommendations.map(rec => `
                <div class="recommendation">${rec}</div>
            `).join('')}
        </div>
    </div>
</body>
</html>
    `;

    const htmlFile = path.join(this.reportDir, 'latest-report.html');
    await fs.writeFile(htmlFile, htmlContent);
  }

  private async updateBaseline(benchmarkResults: BenchmarkResult[]): Promise<void> {
    await fs.writeFile(this.baselineFile, JSON.stringify(benchmarkResults, null, 2));
    console.log('Baseline updated with current benchmark results');
  }

  async compareWithBaseline(benchmarkResults: BenchmarkResult[]): Promise<RegressionAnalysis> {
    return this.performRegressionAnalysis(benchmarkResults);
  }

  async getHistoricalData(testName: string, days: number = 30): Promise<any[]> {
    // In a real implementation, this would query a database or file system
    // for historical test data to show trends over time
    return [];
  }
}

// Utility function to run reporter from command line
export async function generateTestReport(
  benchmarkResults: BenchmarkResult[],
  outputDir?: string
): Promise<TestReport> {
  const reporter = new TestReporter(outputDir);
  return reporter.generateReport(benchmarkResults);
}
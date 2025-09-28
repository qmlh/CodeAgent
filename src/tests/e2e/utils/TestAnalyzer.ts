import { BenchmarkResult } from '../performance/PerformanceBenchmarks';
import { TestReport } from '../reporting/TestReporter';

export interface PerformanceMetrics {
  throughput: {
    current: number;
    baseline?: number;
    trend: 'improving' | 'degrading' | 'stable';
    changePercent: number;
  };
  latency: {
    average: number;
    p95: number;
    p99: number;
    trend: 'improving' | 'degrading' | 'stable';
  };
  memory: {
    peak: number;
    average: number;
    growth: number;
    efficiency: number; // tasks per MB
  };
  reliability: {
    successRate: number;
    errorRate: number;
    failureTypes: Record<string, number>;
  };
}

export interface SystemHealthMetrics {
  agentHealth: {
    totalAgents: number;
    activeAgents: number;
    failedAgents: number;
    averageLoad: number;
  };
  resourceUtilization: {
    cpuUsage: number;
    memoryUsage: number;
    diskIO: number;
    networkIO: number;
  };
  concurrencyMetrics: {
    maxConcurrentTasks: number;
    averageConcurrency: number;
    queueDepth: number;
    waitTime: number;
  };
}

export class TestAnalyzer {
  private benchmarkHistory: BenchmarkResult[][] = [];
  private reportHistory: TestReport[] = [];

  addBenchmarkResults(results: BenchmarkResult[]): void {
    this.benchmarkHistory.push(results);
    
    // Keep only last 50 runs for analysis
    if (this.benchmarkHistory.length > 50) {
      this.benchmarkHistory.shift();
    }
  }

  addTestReport(report: TestReport): void {
    this.reportHistory.push(report);
    
    // Keep only last 30 reports
    if (this.reportHistory.length > 30) {
      this.reportHistory.shift();
    }
  }

  analyzePerformanceMetrics(testName: string): PerformanceMetrics | null {
    const recentResults = this.benchmarkHistory
      .map(results => results.find(r => r.testName === testName))
      .filter(Boolean) as BenchmarkResult[];

    if (recentResults.length === 0) {
      return null;
    }

    const latest = recentResults[recentResults.length - 1];
    const baseline = recentResults.length > 1 ? recentResults[0] : undefined;

    // Calculate throughput metrics
    const throughputTrend = this.calculateTrend(
      recentResults.map(r => r.throughput).filter(t => t > 0)
    );
    const throughputChange = baseline && baseline.throughput > 0 
      ? ((latest.throughput - baseline.throughput) / baseline.throughput) * 100
      : 0;

    // Calculate latency metrics
    const latencies = recentResults.map(r => r.systemMetrics.averageResponseTime);
    const latencyTrend = this.calculateTrend(latencies);

    // Calculate memory metrics
    const memoryUsages = recentResults.map(r => r.memoryUsage.peak.heapUsed);
    const averageMemory = memoryUsages.reduce((sum, mem) => sum + mem, 0) / memoryUsages.length;
    const memoryGrowth = baseline 
      ? ((latest.memoryUsage.peak.heapUsed - baseline.memoryUsage.peak.heapUsed) / baseline.memoryUsage.peak.heapUsed) * 100
      : 0;

    return {
      throughput: {
        current: latest.throughput,
        baseline: baseline?.throughput,
        trend: throughputTrend,
        changePercent: throughputChange
      },
      latency: {
        average: latest.systemMetrics.averageResponseTime,
        p95: this.calculatePercentile(latencies, 95),
        p99: this.calculatePercentile(latencies, 99),
        trend: latencyTrend
      },
      memory: {
        peak: latest.memoryUsage.peak.heapUsed,
        average: averageMemory,
        growth: memoryGrowth,
        efficiency: latest.systemMetrics.totalTasks / (latest.memoryUsage.peak.heapUsed / 1024 / 1024)
      },
      reliability: {
        successRate: latest.systemMetrics.successRate,
        errorRate: 100 - latest.systemMetrics.successRate,
        failureTypes: {} // Would be populated from actual error tracking
      }
    };
  }

  analyzeSystemHealth(): SystemHealthMetrics {
    if (this.benchmarkHistory.length === 0) {
      return this.getDefaultSystemHealth();
    }

    const latestResults = this.benchmarkHistory[this.benchmarkHistory.length - 1];
    
    // Aggregate metrics across all tests
    const totalAgents = latestResults.reduce((sum, r) => sum + r.agentMetrics.length, 0) / latestResults.length;
    const averageSuccessRate = latestResults.reduce((sum, r) => sum + r.systemMetrics.successRate, 0) / latestResults.length;
    const maxConcurrency = Math.max(...latestResults.map(r => r.systemMetrics.concurrentPeakLoad));
    const averageConcurrency = latestResults.reduce((sum, r) => sum + r.systemMetrics.concurrentPeakLoad, 0) / latestResults.length;

    return {
      agentHealth: {
        totalAgents: Math.round(totalAgents),
        activeAgents: Math.round(totalAgents * (averageSuccessRate / 100)),
        failedAgents: Math.round(totalAgents * ((100 - averageSuccessRate) / 100)),
        averageLoad: this.calculateAverageLoad(latestResults)
      },
      resourceUtilization: {
        cpuUsage: 0, // Would be collected from system monitoring
        memoryUsage: this.calculateMemoryUtilization(latestResults),
        diskIO: 0, // Would be collected from system monitoring
        networkIO: 0 // Would be collected from system monitoring
      },
      concurrencyMetrics: {
        maxConcurrentTasks: maxConcurrency,
        averageConcurrency: Math.round(averageConcurrency),
        queueDepth: 0, // Would be collected from task manager
        waitTime: this.calculateAverageWaitTime(latestResults)
      }
    };
  }

  detectAnomalies(testName: string): string[] {
    const metrics = this.analyzePerformanceMetrics(testName);
    if (!metrics) return [];

    const anomalies: string[] = [];

    // Throughput anomalies
    if (metrics.throughput.changePercent < -50) {
      anomalies.push(`Severe throughput degradation: ${metrics.throughput.changePercent.toFixed(1)}% decrease`);
    } else if (metrics.throughput.changePercent < -25) {
      anomalies.push(`Significant throughput degradation: ${metrics.throughput.changePercent.toFixed(1)}% decrease`);
    }

    // Memory anomalies
    if (metrics.memory.growth > 100) {
      anomalies.push(`Severe memory growth: ${metrics.memory.growth.toFixed(1)}% increase`);
    } else if (metrics.memory.growth > 50) {
      anomalies.push(`Significant memory growth: ${metrics.memory.growth.toFixed(1)}% increase`);
    }

    // Reliability anomalies
    if (metrics.reliability.successRate < 80) {
      anomalies.push(`Low success rate: ${metrics.reliability.successRate.toFixed(1)}%`);
    }

    // Latency anomalies
    if (metrics.latency.p99 > metrics.latency.average * 5) {
      anomalies.push(`High latency variance: P99 is ${(metrics.latency.p99 / metrics.latency.average).toFixed(1)}x average`);
    }

    return anomalies;
  }

  generatePerformanceTrends(): Record<string, any> {
    if (this.benchmarkHistory.length < 3) {
      return {};
    }

    const trends: Record<string, any> = {};
    const testNames = new Set(
      this.benchmarkHistory.flat().map(r => r.testName)
    );

    for (const testName of testNames) {
      const testResults = this.benchmarkHistory
        .map(results => results.find(r => r.testName === testName))
        .filter(Boolean) as BenchmarkResult[];

      if (testResults.length < 3) continue;

      trends[testName] = {
        throughput: {
          values: testResults.map(r => r.throughput),
          trend: this.calculateTrend(testResults.map(r => r.throughput))
        },
        duration: {
          values: testResults.map(r => r.duration),
          trend: this.calculateTrend(testResults.map(r => r.duration))
        },
        memory: {
          values: testResults.map(r => r.memoryUsage.peak.heapUsed),
          trend: this.calculateTrend(testResults.map(r => r.memoryUsage.peak.heapUsed))
        },
        successRate: {
          values: testResults.map(r => r.systemMetrics.successRate),
          trend: this.calculateTrend(testResults.map(r => r.systemMetrics.successRate))
        }
      };
    }

    return trends;
  }

  predictPerformance(testName: string, horizon: number = 5): any {
    const metrics = this.analyzePerformanceMetrics(testName);
    if (!metrics) return null;

    const recentResults = this.benchmarkHistory
      .map(results => results.find(r => r.testName === testName))
      .filter(Boolean) as BenchmarkResult[];

    if (recentResults.length < 5) {
      return {
        confidence: 'low',
        message: 'Insufficient historical data for prediction'
      };
    }

    // Simple linear regression for prediction
    const throughputValues = recentResults.map(r => r.throughput).filter(t => t > 0);
    const memoryValues = recentResults.map(r => r.memoryUsage.peak.heapUsed);
    const durationValues = recentResults.map(r => r.duration);

    return {
      confidence: 'medium',
      predictions: {
        throughput: {
          predicted: this.linearPredict(throughputValues, horizon),
          trend: this.calculateTrend(throughputValues)
        },
        memory: {
          predicted: this.linearPredict(memoryValues, horizon),
          trend: this.calculateTrend(memoryValues)
        },
        duration: {
          predicted: this.linearPredict(durationValues, horizon),
          trend: this.calculateTrend(durationValues)
        }
      },
      recommendations: this.generatePredictionRecommendations(metrics)
    };
  }

  private calculateTrend(values: number[]): 'improving' | 'degrading' | 'stable' {
    if (values.length < 3) return 'stable';

    const recent = values.slice(-3);
    const older = values.slice(-6, -3);

    if (older.length === 0) return 'stable';

    const recentAvg = recent.reduce((sum, val) => sum + val, 0) / recent.length;
    const olderAvg = older.reduce((sum, val) => sum + val, 0) / older.length;

    const changePercent = ((recentAvg - olderAvg) / olderAvg) * 100;

    if (Math.abs(changePercent) < 5) return 'stable';
    return changePercent > 0 ? 'improving' : 'degrading';
  }

  private calculatePercentile(values: number[], percentile: number): number {
    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[Math.max(0, index)];
  }

  private calculateAverageLoad(results: BenchmarkResult[]): number {
    // Calculate average load based on concurrent tasks and duration
    const totalLoad = results.reduce((sum, r) => {
      return sum + (r.systemMetrics.concurrentPeakLoad * r.duration);
    }, 0);
    const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);
    return totalDuration > 0 ? totalLoad / totalDuration : 0;
  }

  private calculateMemoryUtilization(results: BenchmarkResult[]): number {
    const totalMemory = require('os').totalmem();
    const averagePeakMemory = results.reduce((sum, r) => sum + r.memoryUsage.peak.heapUsed, 0) / results.length;
    return (averagePeakMemory / totalMemory) * 100;
  }

  private calculateAverageWaitTime(results: BenchmarkResult[]): number {
    // Estimate wait time based on response time and processing time
    return results.reduce((sum, r) => sum + r.systemMetrics.averageResponseTime, 0) / results.length;
  }

  private linearPredict(values: number[], horizon: number): number {
    if (values.length < 2) return values[values.length - 1] || 0;

    // Simple linear regression
    const n = values.length;
    const x = Array.from({ length: n }, (_, i) => i);
    const y = values;

    const sumX = x.reduce((sum, val) => sum + val, 0);
    const sumY = y.reduce((sum, val) => sum + val, 0);
    const sumXY = x.reduce((sum, val, i) => sum + val * y[i], 0);
    const sumXX = x.reduce((sum, val) => sum + val * val, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    return slope * (n + horizon - 1) + intercept;
  }

  private generatePredictionRecommendations(metrics: PerformanceMetrics): string[] {
    const recommendations: string[] = [];

    if (metrics.throughput.trend === 'degrading') {
      recommendations.push('Throughput is trending downward. Consider performance optimization.');
    }

    if (metrics.memory.growth > 20) {
      recommendations.push('Memory usage is growing. Implement memory management improvements.');
    }

    if (metrics.reliability.successRate < 95) {
      recommendations.push('Success rate is below target. Focus on reliability improvements.');
    }

    return recommendations;
  }

  private getDefaultSystemHealth(): SystemHealthMetrics {
    return {
      agentHealth: {
        totalAgents: 0,
        activeAgents: 0,
        failedAgents: 0,
        averageLoad: 0
      },
      resourceUtilization: {
        cpuUsage: 0,
        memoryUsage: 0,
        diskIO: 0,
        networkIO: 0
      },
      concurrencyMetrics: {
        maxConcurrentTasks: 0,
        averageConcurrency: 0,
        queueDepth: 0,
        waitTime: 0
      }
    };
  }

  // Export analysis data for external tools
  exportAnalysisData(): any {
    return {
      benchmarkHistory: this.benchmarkHistory,
      reportHistory: this.reportHistory,
      trends: this.generatePerformanceTrends(),
      systemHealth: this.analyzeSystemHealth()
    };
  }

  // Import analysis data from external sources
  importAnalysisData(data: any): void {
    if (data.benchmarkHistory) {
      this.benchmarkHistory = data.benchmarkHistory;
    }
    if (data.reportHistory) {
      this.reportHistory = data.reportHistory;
    }
  }
}
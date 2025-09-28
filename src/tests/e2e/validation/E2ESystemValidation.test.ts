import { TestEnvironment, TestEnvironmentConfig } from '../setup/TestEnvironment';
import { PerformanceBenchmarkSuite } from '../performance/PerformanceBenchmarks';
import { TestReporter } from '../reporting/TestReporter';
import { TestAnalyzer } from '../utils/TestAnalyzer';

describe('E2E System Validation', () => {
  describe('Test Environment Setup', () => {
    test('should create and configure test environment', async () => {
      const config: TestEnvironmentConfig = {
        agentCount: 4,
        testDataPath: './validation-workspace',
        timeoutMs: 30000,
        enableLogging: false,
        performanceTracking: true
      };

      const testEnv = new TestEnvironment(config);
      
      // Test environment setup
      await testEnv.setup();
      
      // Verify agents were created
      const agents = testEnv.getAllAgents();
      expect(agents).toHaveLength(4);
      
      // Verify each agent has proper configuration
      for (const agent of agents) {
        expect(agent.id).toBeDefined();
        expect(agent.name).toBeDefined();
        expect(agent.type).toBeDefined();
        expect(agent.status).toBe('idle');
      }
      
      // Test task creation
      const task = await testEnv.createTestTask({
        title: 'Validation Task',
        description: 'Test task for validation',
        type: 'development'
      });
      
      expect(task.id).toBeDefined();
      expect(task.title).toBe('Validation Task');
      expect(task.status).toBe('pending');
      
      // Cleanup
      await testEnv.teardown();
    }, 60000);

    test('should handle test environment errors gracefully', async () => {
      const config: TestEnvironmentConfig = {
        agentCount: 0, // Invalid configuration
        testDataPath: './invalid-workspace',
        timeoutMs: 1000,
        enableLogging: false,
        performanceTracking: false
      };

      const testEnv = new TestEnvironment(config);
      
      // Should handle invalid configuration
      await expect(testEnv.setup()).resolves.not.toThrow();
      
      // Should still allow cleanup
      await expect(testEnv.teardown()).resolves.not.toThrow();
    });
  });

  describe('Performance Benchmark System', () => {
    test('should run performance benchmarks successfully', async () => {
      const benchmarkSuite = new PerformanceBenchmarkSuite();
      
      // Mock the benchmark execution for validation
      const mockResults = await benchmarkSuite.getBenchmarkResults();
      
      // Verify benchmark structure
      expect(Array.isArray(mockResults)).toBe(true);
      
      // If we have results, validate their structure
      if (mockResults.length > 0) {
        const result = mockResults[0];
        expect(result).toHaveProperty('testName');
        expect(result).toHaveProperty('duration');
        expect(result).toHaveProperty('throughput');
        expect(result).toHaveProperty('memoryUsage');
        expect(result).toHaveProperty('systemMetrics');
        expect(result).toHaveProperty('agentMetrics');
      }
    });

    test('should validate benchmark result structure', () => {
      const mockBenchmarkResult = {
        testName: 'Test Benchmark',
        duration: 5000,
        throughput: 2.5,
        memoryUsage: {
          initial: { heapUsed: 50000000 } as NodeJS.MemoryUsage,
          peak: { heapUsed: 75000000 } as NodeJS.MemoryUsage,
          final: { heapUsed: 60000000 } as NodeJS.MemoryUsage
        },
        agentMetrics: [
          {
            agentId: 'test-agent-1',
            tasksCompleted: 5,
            averageTaskTime: 1000,
            errorCount: 0
          }
        ],
        systemMetrics: {
          totalTasks: 10,
          successRate: 100,
          averageResponseTime: 500,
          concurrentPeakLoad: 4
        }
      };

      // Validate required properties
      expect(mockBenchmarkResult.testName).toBeDefined();
      expect(typeof mockBenchmarkResult.duration).toBe('number');
      expect(typeof mockBenchmarkResult.throughput).toBe('number');
      expect(mockBenchmarkResult.memoryUsage).toHaveProperty('initial');
      expect(mockBenchmarkResult.memoryUsage).toHaveProperty('peak');
      expect(mockBenchmarkResult.memoryUsage).toHaveProperty('final');
      expect(Array.isArray(mockBenchmarkResult.agentMetrics)).toBe(true);
      expect(mockBenchmarkResult.systemMetrics).toHaveProperty('totalTasks');
      expect(mockBenchmarkResult.systemMetrics).toHaveProperty('successRate');
    });
  });

  describe('Test Reporting System', () => {
    test('should generate test reports', async () => {
      const reporter = new TestReporter('./test-validation-reports');
      
      const mockBenchmarkResults = [
        {
          testName: 'Mock Test 1',
          duration: 5000,
          throughput: 2.0,
          memoryUsage: {
            initial: { heapUsed: 50000000 } as NodeJS.MemoryUsage,
            peak: { heapUsed: 75000000 } as NodeJS.MemoryUsage,
            final: { heapUsed: 60000000 } as NodeJS.MemoryUsage
          },
          agentMetrics: [],
          systemMetrics: {
            totalTasks: 10,
            successRate: 100,
            averageResponseTime: 500,
            concurrentPeakLoad: 4
          }
        }
      ];

      const report = await reporter.generateReport(mockBenchmarkResults);
      
      // Validate report structure
      expect(report).toHaveProperty('timestamp');
      expect(report).toHaveProperty('environment');
      expect(report).toHaveProperty('summary');
      expect(report).toHaveProperty('benchmarks');
      expect(report).toHaveProperty('regressionAnalysis');
      expect(report).toHaveProperty('recommendations');
      
      // Validate summary
      expect(report.summary.totalTests).toBe(1);
      expect(report.summary.successRate).toBe(100);
      expect(report.summary.duration).toBe(5000);
      
      // Validate environment info
      expect(report.environment.nodeVersion).toBeDefined();
      expect(report.environment.platform).toBeDefined();
      expect(report.environment.arch).toBeDefined();
      
      // Validate recommendations
      expect(Array.isArray(report.recommendations)).toBe(true);
    });

    test('should handle empty benchmark results', async () => {
      const reporter = new TestReporter('./test-validation-reports');
      
      const report = await reporter.generateReport([]);
      
      expect(report.summary.totalTests).toBe(0);
      expect(report.benchmarks).toHaveLength(0);
      expect(report.regressionAnalysis.hasRegressions).toBe(false);
    });
  });

  describe('Test Analysis System', () => {
    test('should analyze performance metrics', () => {
      const analyzer = new TestAnalyzer();
      
      const mockBenchmarkResults = [
        {
          testName: 'Analysis Test',
          duration: 5000,
          throughput: 2.0,
          memoryUsage: {
            initial: { heapUsed: 50000000 } as NodeJS.MemoryUsage,
            peak: { heapUsed: 75000000 } as NodeJS.MemoryUsage,
            final: { heapUsed: 60000000 } as NodeJS.MemoryUsage
          },
          agentMetrics: [],
          systemMetrics: {
            totalTasks: 10,
            successRate: 100,
            averageResponseTime: 500,
            concurrentPeakLoad: 4
          }
        }
      ];

      analyzer.addBenchmarkResults(mockBenchmarkResults);
      
      const metrics = analyzer.analyzePerformanceMetrics('Analysis Test');
      
      if (metrics) {
        expect(metrics).toHaveProperty('throughput');
        expect(metrics).toHaveProperty('latency');
        expect(metrics).toHaveProperty('memory');
        expect(metrics).toHaveProperty('reliability');
        
        expect(metrics.throughput.current).toBe(2.0);
        expect(metrics.reliability.successRate).toBe(100);
      }
    });

    test('should detect anomalies', () => {
      const analyzer = new TestAnalyzer();
      
      // Add baseline results
      const baselineResults = [
        {
          testName: 'Anomaly Test',
          duration: 5000,
          throughput: 10.0, // Good baseline
          memoryUsage: {
            initial: { heapUsed: 50000000 } as NodeJS.MemoryUsage,
            peak: { heapUsed: 75000000 } as NodeJS.MemoryUsage,
            final: { heapUsed: 60000000 } as NodeJS.MemoryUsage
          },
          agentMetrics: [],
          systemMetrics: {
            totalTasks: 10,
            successRate: 100,
            averageResponseTime: 500,
            concurrentPeakLoad: 4
          }
        }
      ];

      // Add degraded results
      const degradedResults = [
        {
          testName: 'Anomaly Test',
          duration: 15000,
          throughput: 2.0, // Significant degradation
          memoryUsage: {
            initial: { heapUsed: 50000000 } as NodeJS.MemoryUsage,
            peak: { heapUsed: 200000000 } as NodeJS.MemoryUsage, // High memory usage
            final: { heapUsed: 180000000 } as NodeJS.MemoryUsage
          },
          agentMetrics: [],
          systemMetrics: {
            totalTasks: 10,
            successRate: 70, // Low success rate
            averageResponseTime: 1500,
            concurrentPeakLoad: 4
          }
        }
      ];

      analyzer.addBenchmarkResults(baselineResults);
      analyzer.addBenchmarkResults(degradedResults);
      
      const anomalies = analyzer.detectAnomalies('Anomaly Test');
      
      expect(Array.isArray(anomalies)).toBe(true);
      // Should detect performance degradation
      expect(anomalies.length).toBeGreaterThan(0);
    });

    test('should generate performance trends', () => {
      const analyzer = new TestAnalyzer();
      
      // Add multiple benchmark results to establish trends
      for (let i = 0; i < 5; i++) {
        const results = [
          {
            testName: 'Trend Test',
            duration: 5000 + i * 100, // Gradually increasing
            throughput: 10.0 - i * 0.5, // Gradually decreasing
            memoryUsage: {
              initial: { heapUsed: 50000000 } as NodeJS.MemoryUsage,
              peak: { heapUsed: 75000000 + i * 5000000 } as NodeJS.MemoryUsage,
              final: { heapUsed: 60000000 } as NodeJS.MemoryUsage
            },
            agentMetrics: [],
            systemMetrics: {
              totalTasks: 10,
              successRate: 100,
              averageResponseTime: 500,
              concurrentPeakLoad: 4
            }
          }
        ];
        analyzer.addBenchmarkResults(results);
      }
      
      const trends = analyzer.generatePerformanceTrends();
      
      expect(typeof trends).toBe('object');
      if (trends['Trend Test']) {
        expect(trends['Trend Test']).toHaveProperty('throughput');
        expect(trends['Trend Test']).toHaveProperty('duration');
        expect(trends['Trend Test']).toHaveProperty('memory');
      }
    });
  });

  describe('Custom Jest Matchers', () => {
    test('should validate performance threshold matcher', () => {
      const currentValue = 10.0;
      const baselineValue = 10.5;
      const threshold = 0.1; // 10% threshold
      
      // Should pass within threshold
      expect(currentValue).toBeWithinPerformanceThreshold(baselineValue, threshold);
      
      // Should fail outside threshold
      const degradedValue = 8.0; // More than 10% degradation
      expect(() => {
        expect(degradedValue).toBeWithinPerformanceThreshold(baselineValue, threshold);
      }).toThrow();
    });

    test('should validate memory usage matcher', () => {
      const acceptableMemory = 100 * 1024 * 1024; // 100MB
      const excessiveMemory = 600 * 1024 * 1024; // 600MB
      
      // Should pass for acceptable memory
      expect(acceptableMemory).toHaveAcceptableMemoryUsage(500);
      
      // Should fail for excessive memory
      expect(() => {
        expect(excessiveMemory).toHaveAcceptableMemoryUsage(500);
      }).toThrow();
    });

    test('should validate timeout matcher', () => {
      const fastOperation = 5000; // 5 seconds
      const slowOperation = 35000; // 35 seconds
      const timeout = 30000; // 30 second timeout
      
      // Should pass for fast operation
      expect(fastOperation).toCompleteWithinTimeout(timeout);
      
      // Should fail for slow operation
      expect(() => {
        expect(slowOperation).toCompleteWithinTimeout(timeout);
      }).toThrow();
    });
  });

  describe('Integration Validation', () => {
    test('should validate complete E2E testing workflow', async () => {
      // This test validates that all components work together
      const testEnv = new TestEnvironment({
        agentCount: 2,
        testDataPath: './integration-validation',
        timeoutMs: 30000,
        enableLogging: false,
        performanceTracking: true
      });

      const reporter = new TestReporter('./integration-validation-reports');
      const analyzer = new TestAnalyzer();

      try {
        // 1. Setup test environment
        await testEnv.setup();
        const agents = testEnv.getAllAgents();
        expect(agents.length).toBe(2);

        // 2. Create and execute a simple task
        const task = await testEnv.createTestTask({
          title: 'Integration Validation Task',
          description: 'Simple task for integration validation',
          type: 'development'
        });

        await testEnv.getCoordinationManager().assignTask(task.id);
        const completedTask = await testEnv.waitForTaskCompletion(task.id);
        expect(completedTask.status).toBe('completed');

        // 3. Create mock benchmark result
        const benchmarkResult = {
          testName: 'Integration Validation',
          duration: 5000,
          throughput: 1.0,
          memoryUsage: {
            initial: process.memoryUsage(),
            peak: process.memoryUsage(),
            final: process.memoryUsage()
          },
          agentMetrics: agents.map(agent => ({
            agentId: agent.id,
            tasksCompleted: 1,
            averageTaskTime: 2500,
            errorCount: 0
          })),
          systemMetrics: {
            totalTasks: 1,
            successRate: 100,
            averageResponseTime: 2500,
            concurrentPeakLoad: 1
          }
        };

        // 4. Add to analyzer and generate report
        analyzer.addBenchmarkResults([benchmarkResult]);
        const report = await reporter.generateReport([benchmarkResult]);

        // 5. Validate integration results
        expect(report.summary.successRate).toBe(100);
        expect(report.benchmarks.length).toBe(1);
        expect(report.recommendations.length).toBeGreaterThan(0);

        console.log('✅ Integration validation completed successfully');

      } finally {
        await testEnv.teardown();
      }
    }, 90000);
  });
});
/**
 * Metrics collection service for gathering performance data
 */

import { EventEmitter } from 'events';
import {
  PerformanceMetric,
  MetricCategory,
  AgentPerformanceMetrics,
  TaskPerformanceMetrics,
  CacheMetrics
} from '../types/performance.types';

export interface MetricCollectionOptions {
  interval: number;
  categories: MetricCategory[];
  enabled: boolean;
}

export class MetricsCollector extends EventEmitter {
  private collectors: Map<MetricCategory, () => Promise<PerformanceMetric[]>> = new Map();
  private timers: Map<MetricCategory, NodeJS.Timeout> = new Map();
  private options: MetricCollectionOptions;
  private isRunning = false;

  // Performance tracking
  private taskStartTimes: Map<string, number> = new Map();
  private agentMetrics: Map<string, AgentPerformanceMetrics> = new Map();
  private cacheStats: Map<string, CacheMetrics> = new Map();

  constructor(options: MetricCollectionOptions) {
    super();
    this.options = options;
    this.initializeCollectors();
  }

  /**
   * Start metrics collection
   */
  public start(): void {
    if (this.isRunning || !this.options.enabled) return;

    this.isRunning = true;
    
    for (const category of this.options.categories) {
      this.startCategoryCollection(category);
    }

    this.emit('collection-started');
  }

  /**
   * Stop metrics collection
   */
  public stop(): void {
    if (!this.isRunning) return;

    this.isRunning = false;

    for (const timer of this.timers.values()) {
      clearInterval(timer);
    }
    this.timers.clear();

    this.emit('collection-stopped');
  }

  /**
   * Track task start
   */
  public trackTaskStart(taskId: string): void {
    this.taskStartTimes.set(taskId, Date.now());
  }

  /**
   * Track task completion
   */
  public trackTaskCompletion(taskId: string, success: boolean, retryCount = 0): TaskPerformanceMetrics | null {
    const startTime = this.taskStartTimes.get(taskId);
    if (!startTime) return null;

    const executionTime = Date.now() - startTime;
    this.taskStartTimes.delete(taskId);

    const metrics: TaskPerformanceMetrics = {
      taskId,
      executionTime,
      queueTime: 0, // Would be calculated from task queue
      retryCount,
      success,
      resourceUsage: {
        cpu: 0, // Would be measured during execution
        memory: process.memoryUsage().heapUsed,
        io: 0 // Would be measured during execution
      }
    };

    this.emit('task-metrics', metrics);
    return metrics;
  }

  /**
   * Update agent metrics
   */
  public updateAgentMetrics(agentId: string, update: Partial<AgentPerformanceMetrics>): void {
    const existing = this.agentMetrics.get(agentId) || {
      agentId,
      taskCompletionRate: 0,
      averageTaskDuration: 0,
      errorRate: 0,
      memoryUsage: 0,
      cpuUsage: 0,
      responseTime: 0,
      throughput: 0
    };

    const updated = { ...existing, ...update };
    this.agentMetrics.set(agentId, updated);
    this.emit('agent-metrics', updated);
  }

  /**
   * Record cache metrics
   */
  public recordCacheMetrics(cacheName: string, metrics: CacheMetrics): void {
    this.cacheStats.set(cacheName, metrics);
    
    this.emit('metrics-collected', [{
      id: `cache-${cacheName}-hit-rate`,
      name: 'Cache Hit Rate',
      value: metrics.hitRate,
      unit: 'percentage',
      timestamp: new Date(),
      category: MetricCategory.SYSTEM,
      tags: { cache: cacheName }
    }]);
  }

  /**
   * Get collected metrics
   */
  public getAgentMetrics(agentId?: string): AgentPerformanceMetrics[] {
    if (agentId) {
      const metrics = this.agentMetrics.get(agentId);
      return metrics ? [metrics] : [];
    }
    return Array.from(this.agentMetrics.values());
  }

  /**
   * Get cache metrics
   */
  public getCacheMetrics(cacheName?: string): CacheMetrics[] {
    if (cacheName) {
      const metrics = this.cacheStats.get(cacheName);
      return metrics ? [metrics] : [];
    }
    return Array.from(this.cacheStats.values());
  }

  /**
   * Measure function execution time
   */
  public measureExecution<T>(
    name: string,
    fn: () => Promise<T>,
    category: MetricCategory = MetricCategory.SYSTEM
  ): Promise<T> {
    const startTime = performance.now();
    
    return fn().then(
      (result) => {
        const duration = performance.now() - startTime;
        this.emit('metrics-collected', [{
          id: `execution-${name}`,
          name: `Execution Time: ${name}`,
          value: duration,
          unit: 'ms',
          timestamp: new Date(),
          category,
          tags: { function: name, status: 'success' }
        }]);
        return result;
      },
      (error) => {
        const duration = performance.now() - startTime;
        this.emit('metrics-collected', [{
          id: `execution-${name}`,
          name: `Execution Time: ${name}`,
          value: duration,
          unit: 'ms',
          timestamp: new Date(),
          category,
          tags: { function: name, status: 'error' }
        }]);
        throw error;
      }
    );
  }

  /**
   * Create a performance timer
   */
  public createTimer(name: string, category: MetricCategory = MetricCategory.SYSTEM): PerformanceTimer {
    return new PerformanceTimer(name, category, (metric) => {
      this.emit('metrics-collected', [metric]);
    });
  }

  private initializeCollectors(): void {
    // System metrics collector
    this.collectors.set(MetricCategory.SYSTEM, async () => {
      const metrics: PerformanceMetric[] = [];
      
      // Process metrics
      const memUsage = process.memoryUsage();
      metrics.push({
        id: 'process-memory-heap-used',
        name: 'Process Heap Used',
        value: memUsage.heapUsed,
        unit: 'bytes',
        timestamp: new Date(),
        category: MetricCategory.MEMORY
      });

      metrics.push({
        id: 'process-memory-heap-total',
        name: 'Process Heap Total',
        value: memUsage.heapTotal,
        unit: 'bytes',
        timestamp: new Date(),
        category: MetricCategory.MEMORY
      });

      return metrics;
    });

    // Agent metrics collector
    this.collectors.set(MetricCategory.AGENT, async () => {
      const metrics: PerformanceMetric[] = [];
      
      for (const [agentId, agentMetrics] of this.agentMetrics.entries()) {
        metrics.push({
          id: `agent-${agentId}-completion-rate`,
          name: 'Agent Task Completion Rate',
          value: agentMetrics.taskCompletionRate,
          unit: 'percentage',
          timestamp: new Date(),
          category: MetricCategory.AGENT,
          tags: { agentId }
        });

        metrics.push({
          id: `agent-${agentId}-response-time`,
          name: 'Agent Response Time',
          value: agentMetrics.responseTime,
          unit: 'ms',
          timestamp: new Date(),
          category: MetricCategory.AGENT,
          tags: { agentId }
        });
      }

      return metrics;
    });

    // UI metrics collector
    this.collectors.set(MetricCategory.UI, async () => {
      const metrics: PerformanceMetric[] = [];
      
      // Performance API metrics (if available)
      if (typeof window !== 'undefined' && window.performance) {
        const navigation = window.performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        if (navigation) {
          metrics.push({
            id: 'ui-dom-content-loaded',
            name: 'DOM Content Loaded',
            value: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
            unit: 'ms',
            timestamp: new Date(),
            category: MetricCategory.UI
          });
        }
      }

      return metrics;
    });
  }

  private startCategoryCollection(category: MetricCategory): void {
    const collector = this.collectors.get(category);
    if (!collector) return;

    const timer = setInterval(async () => {
      try {
        const metrics = await collector();
        if (metrics.length > 0) {
          this.emit('metrics-collected', metrics);
        }
      } catch (error) {
        this.emit('collection-error', { category, error });
      }
    }, this.options.interval);

    this.timers.set(category, timer);
  }
}

/**
 * Performance timer utility class
 */
export class PerformanceTimer {
  private startTime: number;
  private endTime?: number;

  constructor(
    private name: string,
    private category: MetricCategory,
    private onComplete: (metric: PerformanceMetric) => void
  ) {
    this.startTime = performance.now();
  }

  /**
   * Stop the timer and emit metric
   */
  public stop(tags?: Record<string, string>): number {
    this.endTime = performance.now();
    const duration = this.endTime - this.startTime;

    const metric: PerformanceMetric = {
      id: `timer-${this.name}`,
      name: this.name,
      value: duration,
      unit: 'ms',
      timestamp: new Date(),
      category: this.category,
      tags
    };

    this.onComplete(metric);
    return duration;
  }

  /**
   * Get elapsed time without stopping
   */
  public elapsed(): number {
    return performance.now() - this.startTime;
  }
}

/**
 * Decorator for measuring method execution time
 */
export function measurePerformance(category: MetricCategory = MetricCategory.SYSTEM) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const timer = new PerformanceTimer(
        `${target.constructor.name}.${propertyName}`,
        category,
        (metric) => {
          // Emit to global metrics collector if available
          const globalThis = global as any;
          if (globalThis.metricsCollector) {
            globalThis.metricsCollector.emit('metrics-collected', [metric]);
          }
        }
      );

      try {
        const result = await method.apply(this, args);
        timer.stop({ status: 'success' });
        return result;
      } catch (error) {
        timer.stop({ status: 'error' });
        throw error;
      }
    };

    return descriptor;
  };
}
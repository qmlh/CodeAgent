/**
 * Core performance monitoring service
 */

import { EventEmitter } from 'events';
import {
  PerformanceMetric,
  SystemMetrics,
  AgentPerformanceMetrics,
  TaskPerformanceMetrics,
  UIPerformanceMetrics,
  PerformanceAlert,
  PerformanceThreshold,
  PerformanceReport,
  MetricCategory,
  AlertType,
  PerformanceConfig
} from '../types/performance.types';
import { ErrorSeverity } from '../types/error.types';

export class PerformanceMonitor extends EventEmitter {
  private metrics: Map<string, PerformanceMetric[]> = new Map();
  private alerts: PerformanceAlert[] = [];
  private thresholds: Map<string, PerformanceThreshold> = new Map();
  private config: PerformanceConfig;
  private collectionTimer?: NodeJS.Timeout;
  private isRunning = false;

  constructor(config: PerformanceConfig) {
    super();
    this.config = config;
    this.initializeThresholds();
  }

  /**
   * Start performance monitoring
   */
  public start(): void {
    if (this.isRunning) return;

    this.isRunning = true;
    this.startMetricCollection();
    this.emit('monitoring-started');
  }

  /**
   * Stop performance monitoring
   */
  public stop(): void {
    if (!this.isRunning) return;

    this.isRunning = false;
    if (this.collectionTimer) {
      clearInterval(this.collectionTimer);
      this.collectionTimer = undefined;
    }
    this.emit('monitoring-stopped');
  }

  /**
   * Record a performance metric
   */
  public recordMetric(metric: Omit<PerformanceMetric, 'timestamp'>): void {
    const fullMetric: PerformanceMetric = {
      ...metric,
      timestamp: new Date()
    };

    const categoryMetrics = this.metrics.get(metric.category) || [];
    categoryMetrics.push(fullMetric);
    this.metrics.set(metric.category, categoryMetrics);

    // Check thresholds
    this.checkThresholds(fullMetric);

    // Emit metric recorded event
    this.emit('metric-recorded', fullMetric);

    // Clean up old metrics
    this.cleanupOldMetrics();
  }

  /**
   * Get system performance metrics
   */
  public async getSystemMetrics(): Promise<SystemMetrics> {
    const os = await import('os');
    const process = await import('process');

    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;

    return {
      cpu: {
        usage: await this.getCpuUsage(),
        cores: os.cpus().length,
        loadAverage: os.loadavg()
      },
      memory: {
        used: usedMem,
        total: totalMem,
        free: freeMem,
        percentage: (usedMem / totalMem) * 100
      },
      disk: await this.getDiskUsage(),
      network: await this.getNetworkStats()
    };
  }

  /**
   * Record agent performance metrics
   */
  public recordAgentMetrics(metrics: AgentPerformanceMetrics): void {
    this.recordMetric({
      id: `agent-${metrics.agentId}-completion-rate`,
      name: 'Task Completion Rate',
      value: metrics.taskCompletionRate,
      unit: 'percentage',
      category: MetricCategory.AGENT,
      tags: { agentId: metrics.agentId }
    });

    this.recordMetric({
      id: `agent-${metrics.agentId}-avg-duration`,
      name: 'Average Task Duration',
      value: metrics.averageTaskDuration,
      unit: 'ms',
      category: MetricCategory.AGENT,
      tags: { agentId: metrics.agentId }
    });

    this.recordMetric({
      id: `agent-${metrics.agentId}-error-rate`,
      name: 'Error Rate',
      value: metrics.errorRate,
      unit: 'percentage',
      category: MetricCategory.AGENT,
      tags: { agentId: metrics.agentId }
    });
  }

  /**
   * Record task performance metrics
   */
  public recordTaskMetrics(metrics: TaskPerformanceMetrics): void {
    this.recordMetric({
      id: `task-${metrics.taskId}-execution-time`,
      name: 'Task Execution Time',
      value: metrics.executionTime,
      unit: 'ms',
      category: MetricCategory.TASK,
      tags: { taskId: metrics.taskId, success: metrics.success.toString() }
    });

    this.recordMetric({
      id: `task-${metrics.taskId}-queue-time`,
      name: 'Task Queue Time',
      value: metrics.queueTime,
      unit: 'ms',
      category: MetricCategory.TASK,
      tags: { taskId: metrics.taskId }
    });
  }

  /**
   * Record UI performance metrics
   */
  public recordUIMetrics(metrics: UIPerformanceMetrics): void {
    this.recordMetric({
      id: 'ui-render-time',
      name: 'UI Render Time',
      value: metrics.renderTime,
      unit: 'ms',
      category: MetricCategory.UI
    });

    this.recordMetric({
      id: 'ui-fps',
      name: 'Frames Per Second',
      value: metrics.fps,
      unit: 'fps',
      category: MetricCategory.UI
    });

    this.recordMetric({
      id: 'ui-interaction-latency',
      name: 'Interaction Latency',
      value: metrics.interactionLatency,
      unit: 'ms',
      category: MetricCategory.UI
    });
  }

  /**
   * Get metrics by category
   */
  public getMetrics(category?: MetricCategory, limit?: number): PerformanceMetric[] {
    if (category) {
      const categoryMetrics = this.metrics.get(category) || [];
      return limit ? categoryMetrics.slice(-limit) : categoryMetrics;
    }

    const allMetrics: PerformanceMetric[] = [];
    for (const metrics of this.metrics.values()) {
      allMetrics.push(...metrics);
    }

    allMetrics.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    return limit ? allMetrics.slice(0, limit) : allMetrics;
  }

  /**
   * Get active alerts
   */
  public getAlerts(resolved = false): PerformanceAlert[] {
    return this.alerts.filter(alert => alert.resolved === resolved);
  }

  /**
   * Generate performance report
   */
  public generateReport(startDate: Date, endDate: Date): PerformanceReport {
    const metrics = this.getMetrics().filter(
      metric => metric.timestamp >= startDate && metric.timestamp <= endDate
    );

    const alerts = this.alerts.filter(
      alert => alert.timestamp >= startDate && alert.timestamp <= endDate
    );

    return {
      id: `report-${Date.now()}`,
      generatedAt: new Date(),
      period: { start: startDate, end: endDate },
      summary: {
        totalMetrics: metrics.length,
        alerts: alerts.length,
        averagePerformance: this.calculateAveragePerformance(metrics)
      },
      metrics,
      alerts,
      recommendations: this.generateRecommendations(metrics, alerts)
    };
  }

  /**
   * Update configuration
   */
  public updateConfig(config: Partial<PerformanceConfig>): void {
    this.config = { ...this.config, ...config };
    
    if (config.thresholds) {
      this.initializeThresholds();
    }

    this.emit('config-updated', this.config);
  }

  private initializeThresholds(): void {
    this.thresholds.clear();
    for (const threshold of this.config.thresholds) {
      this.thresholds.set(threshold.metricName, threshold);
    }
  }

  private startMetricCollection(): void {
    this.collectionTimer = setInterval(async () => {
      if (!this.isRunning) return;

      try {
        // Collect system metrics
        const systemMetrics = await this.getSystemMetrics();
        this.recordSystemMetrics(systemMetrics);
      } catch (error) {
        this.emit('collection-error', error);
      }
    }, this.config.collectionInterval);
  }

  private recordSystemMetrics(metrics: SystemMetrics): void {
    this.recordMetric({
      id: 'system-cpu-usage',
      name: 'CPU Usage',
      value: metrics.cpu.usage,
      unit: 'percentage',
      category: MetricCategory.CPU
    });

    this.recordMetric({
      id: 'system-memory-usage',
      name: 'Memory Usage',
      value: metrics.memory.percentage,
      unit: 'percentage',
      category: MetricCategory.MEMORY
    });

    this.recordMetric({
      id: 'system-disk-usage',
      name: 'Disk Usage',
      value: metrics.disk.percentage,
      unit: 'percentage',
      category: MetricCategory.SYSTEM
    });
  }

  private checkThresholds(metric: PerformanceMetric): void {
    const threshold = this.thresholds.get(metric.name);
    if (!threshold || !threshold.enabled) return;

    let severity: ErrorSeverity | null = null;
    let thresholdValue = 0;

    if (metric.value >= threshold.criticalThreshold) {
      severity = ErrorSeverity.CRITICAL;
      thresholdValue = threshold.criticalThreshold;
    } else if (metric.value >= threshold.warningThreshold) {
      severity = ErrorSeverity.HIGH;
      thresholdValue = threshold.warningThreshold;
    }

    if (severity) {
      const alert: PerformanceAlert = {
        id: `alert-${Date.now()}-${metric.id}`,
        type: AlertType.THRESHOLD_EXCEEDED,
        severity,
        message: `${metric.name} exceeded ${severity} threshold`,
        metric: metric.name,
        threshold: thresholdValue,
        currentValue: metric.value,
        timestamp: new Date(),
        resolved: false
      };

      this.alerts.push(alert);
      this.emit('alert-triggered', alert);
    }
  }

  private async getCpuUsage(): Promise<number> {
    return new Promise((resolve) => {
      const startUsage = process.cpuUsage();
      const startTime = process.hrtime();

      setTimeout(() => {
        const endUsage = process.cpuUsage(startUsage);
        const endTime = process.hrtime(startTime);
        
        const totalTime = endTime[0] * 1000000 + endTime[1] / 1000;
        const cpuTime = (endUsage.user + endUsage.system);
        const usage = (cpuTime / totalTime) * 100;
        
        resolve(Math.min(100, Math.max(0, usage)));
      }, 100);
    });
  }

  private async getDiskUsage(): Promise<SystemMetrics['disk']> {
    // Simplified disk usage - in real implementation, use fs.statSync
    return {
      used: 0,
      total: 0,
      free: 0,
      percentage: 0
    };
  }

  private async getNetworkStats(): Promise<SystemMetrics['network']> {
    // Simplified network stats - in real implementation, read from /proc/net/dev
    return {
      bytesReceived: 0,
      bytesSent: 0,
      packetsReceived: 0,
      packetsSent: 0
    };
  }

  private cleanupOldMetrics(): void {
    const cutoffDate = new Date(Date.now() - this.config.retentionPeriod);
    
    for (const [category, metrics] of this.metrics.entries()) {
      const filteredMetrics = metrics.filter(metric => metric.timestamp > cutoffDate);
      this.metrics.set(category, filteredMetrics);
    }

    // Clean up old alerts
    this.alerts = this.alerts.filter(alert => alert.timestamp > cutoffDate);
  }

  private calculateAveragePerformance(metrics: PerformanceMetric[]): number {
    if (metrics.length === 0) return 0;
    
    const sum = metrics.reduce((acc, metric) => acc + metric.value, 0);
    return sum / metrics.length;
  }

  private generateRecommendations(
    metrics: PerformanceMetric[],
    alerts: PerformanceAlert[]
  ): string[] {
    const recommendations: string[] = [];

    // Analyze CPU usage
    const cpuMetrics = metrics.filter(m => m.category === MetricCategory.CPU);
    if (cpuMetrics.length > 0) {
      const avgCpu = cpuMetrics.reduce((sum, m) => sum + m.value, 0) / cpuMetrics.length;
      if (avgCpu > 80) {
        recommendations.push('Consider optimizing CPU-intensive operations or scaling resources');
      }
    }

    // Analyze memory usage
    const memoryMetrics = metrics.filter(m => m.category === MetricCategory.MEMORY);
    if (memoryMetrics.length > 0) {
      const avgMemory = memoryMetrics.reduce((sum, m) => sum + m.value, 0) / memoryMetrics.length;
      if (avgMemory > 85) {
        recommendations.push('Memory usage is high - consider implementing memory optimization strategies');
      }
    }

    // Analyze alerts
    const criticalAlerts = alerts.filter(a => a.severity === ErrorSeverity.CRITICAL);
    if (criticalAlerts.length > 0) {
      recommendations.push('Address critical performance alerts immediately');
    }

    return recommendations;
  }
}
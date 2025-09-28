/**
 * Performance monitoring types and interfaces
 */

export interface PerformanceMetric {
  id: string;
  name: string;
  value: number;
  unit: string;
  timestamp: Date;
  category: MetricCategory;
  tags?: Record<string, string>;
}

export enum MetricCategory {
  SYSTEM = 'system',
  AGENT = 'agent',
  TASK = 'task',
  FILE = 'file',
  MEMORY = 'memory',
  CPU = 'cpu',
  NETWORK = 'network',
  UI = 'ui'
}

export interface SystemMetrics {
  cpu: {
    usage: number;
    cores: number;
    loadAverage: number[];
  };
  memory: {
    used: number;
    total: number;
    free: number;
    percentage: number;
  };
  disk: {
    used: number;
    total: number;
    free: number;
    percentage: number;
  };
  network: {
    bytesReceived: number;
    bytesSent: number;
    packetsReceived: number;
    packetsSent: number;
  };
}

export interface AgentPerformanceMetrics {
  agentId: string;
  taskCompletionRate: number;
  averageTaskDuration: number;
  errorRate: number;
  memoryUsage: number;
  cpuUsage: number;
  responseTime: number;
  throughput: number;
}

export interface TaskPerformanceMetrics {
  taskId: string;
  executionTime: number;
  queueTime: number;
  retryCount: number;
  success: boolean;
  resourceUsage: {
    cpu: number;
    memory: number;
    io: number;
  };
}

export interface UIPerformanceMetrics {
  renderTime: number;
  componentCount: number;
  memoryUsage: number;
  fps: number;
  interactionLatency: number;
}

import { ErrorSeverity } from './error.types';

export interface PerformanceAlert {
  id: string;
  type: AlertType;
  severity: ErrorSeverity;
  message: string;
  metric: string;
  threshold: number;
  currentValue: number;
  timestamp: Date;
  resolved: boolean;
}

export enum AlertType {
  THRESHOLD_EXCEEDED = 'threshold_exceeded',
  PERFORMANCE_DEGRADATION = 'performance_degradation',
  RESOURCE_EXHAUSTION = 'resource_exhaustion',
  ANOMALY_DETECTED = 'anomaly_detected'
}



export interface PerformanceThreshold {
  metricName: string;
  warningThreshold: number;
  criticalThreshold: number;
  unit: string;
  enabled: boolean;
}

export interface PerformanceReport {
  id: string;
  generatedAt: Date;
  period: {
    start: Date;
    end: Date;
  };
  summary: {
    totalMetrics: number;
    alerts: number;
    averagePerformance: number;
  };
  metrics: PerformanceMetric[];
  alerts: PerformanceAlert[];
  recommendations: string[];
}

export interface CacheMetrics {
  hitRate: number;
  missRate: number;
  size: number;
  maxSize: number;
  evictions: number;
  averageAccessTime: number;
}

export interface PerformanceConfig {
  enabled: boolean;
  collectionInterval: number;
  retentionPeriod: number;
  thresholds: PerformanceThreshold[];
  alerting: {
    enabled: boolean;
    channels: string[];
  };
  caching: {
    enabled: boolean;
    maxSize: number;
    ttl: number;
  };
}
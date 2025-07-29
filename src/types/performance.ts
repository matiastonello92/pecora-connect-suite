export interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  location?: string;
  context?: string;
  metadata?: Record<string, any>;
}

export interface PerformanceThreshold {
  metric: string;
  threshold: number;
  severity: 'warning' | 'error' | 'critical';
  enabled: boolean;
}

export interface PerformanceAlert {
  id: string;
  metric: string;
  value: number;
  threshold: number;
  severity: 'warning' | 'error' | 'critical';
  timestamp: number;
  location?: string;
  context?: string;
  acknowledged: boolean;
}

export interface PerformanceStats {
  metric: string;
  count: number;
  avg: number;
  min: number;
  max: number;
  p95: number;
  p99: number;
  lastValue: number;
  trend: 'improving' | 'degrading' | 'stable';
}

export interface PerformanceConfig {
  enabled: boolean;
  samplingRate: number; // 0-1, percentage of events to capture
  maxMetrics: number; // max metrics to keep in memory
  thresholds: PerformanceThreshold[];
  exportInterval: number; // ms between exports
}

export const DEFAULT_THRESHOLDS: PerformanceThreshold[] = [
  {
    metric: 'location_switch_time',
    threshold: 100, // ms
    severity: 'warning',
    enabled: true,
  },
  {
    metric: 'location_switch_time',
    threshold: 300, // ms
    severity: 'error',
    enabled: true,
  },
  {
    metric: 'query_time',
    threshold: 200, // ms
    severity: 'warning',
    enabled: true,
  },
  {
    metric: 'query_time',
    threshold: 500, // ms
    severity: 'error',
    enabled: true,
  },
  {
    metric: 'realtime_latency',
    threshold: 150, // ms
    severity: 'warning',
    enabled: true,
  },
  {
    metric: 'realtime_latency',
    threshold: 400, // ms
    severity: 'error',
    enabled: true,
  },
  {
    metric: 'data_load_time',
    threshold: 300, // ms
    severity: 'warning',
    enabled: true,
  },
  {
    metric: 'data_load_time',
    threshold: 1000, // ms
    severity: 'error',
    enabled: true,
  },
];
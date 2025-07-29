import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { 
  PerformanceMetric, 
  PerformanceAlert, 
  PerformanceStats, 
  PerformanceConfig,
  PerformanceThreshold,
  DEFAULT_THRESHOLDS 
} from '@/types/performance';

interface PerformanceMonitoringContextType {
  // Core measurement functions
  startMeasurement: (name: string, context?: string, location?: string) => string;
  endMeasurement: (markId: string, metadata?: Record<string, any>) => number | null;
  recordMetric: (name: string, value: number, context?: string, location?: string, metadata?: Record<string, any>) => void;
  
  // Analytics
  getStats: (metric: string) => PerformanceStats | null;
  getAllStats: () => PerformanceStats[];
  getAlerts: () => PerformanceAlert[];
  acknowledgeAlert: (alertId: string) => void;
  clearAlerts: () => void;
  
  // Configuration
  config: PerformanceConfig;
  updateConfig: (config: Partial<PerformanceConfig>) => void;
  
  // Export/Import
  exportMetrics: () => string;
  clearMetrics: () => void;
  
  // System health
  isHealthy: boolean;
  healthScore: number;
}

const PerformanceMonitoringContext = createContext<PerformanceMonitoringContextType | undefined>(undefined);

const DEFAULT_CONFIG: PerformanceConfig = {
  enabled: true,
  samplingRate: 1.0, // Capture all events initially
  maxMetrics: 10000,
  thresholds: DEFAULT_THRESHOLDS,
  exportInterval: 30000, // 30 seconds
};

export const PerformanceMonitoringProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [config, setConfig] = useState<PerformanceConfig>(DEFAULT_CONFIG);
  const [metrics, setMetrics] = useState<PerformanceMetric[]>([]);
  const [alerts, setAlerts] = useState<PerformanceAlert[]>([]);
  const [stats, setStats] = useState<Map<string, PerformanceStats>>(new Map());
  
  const markCounterRef = useRef(0);
  const alertIdCounterRef = useRef(0);

  // Performance measurement functions
  const startMeasurement = useCallback((name: string, context?: string, location?: string): string => {
    if (!config.enabled || Math.random() > config.samplingRate) {
      return '';
    }

    const markId = `${name}_${++markCounterRef.current}_${Date.now()}`;
    const markName = `start_${markId}`;
    
    try {
      performance.mark(markName, {
        detail: { context, location, startTime: performance.now() }
      });
      return markId;
    } catch (error) {
      console.warn('Performance marking failed:', error);
      return '';
    }
  }, [config.enabled, config.samplingRate]);

  const endMeasurement = useCallback((markId: string, metadata?: Record<string, any>): number | null => {
    if (!markId || !config.enabled) return null;

    const startMarkName = `start_${markId}`;
    const endMarkName = `end_${markId}`;
    const measureName = `measure_${markId}`;

    try {
      performance.mark(endMarkName);
      performance.measure(measureName, startMarkName, endMarkName);
      
      const measure = performance.getEntriesByName(measureName)[0] as PerformanceMeasure;
      const duration = measure?.duration || 0;
      
      // Extract context from start mark
      const startMark = performance.getEntriesByName(startMarkName)[0] as PerformanceMark;
      const detail = (startMark as any)?.detail || {};
      
      // Record the metric
      recordMetric(
        markId.split('_')[0],
        duration,
        detail.context,
        detail.location,
        metadata
      );

      // Clean up marks and measures
      performance.clearMarks(startMarkName);
      performance.clearMarks(endMarkName);
      performance.clearMeasures(measureName);
      
      return duration;
    } catch (error) {
      console.warn('Performance measurement failed:', error);
      return null;
    }
  }, [config.enabled]);

  const recordMetric = useCallback((
    name: string, 
    value: number, 
    context?: string, 
    location?: string, 
    metadata?: Record<string, any>
  ) => {
    if (!config.enabled) return;

    const metric: PerformanceMetric = {
      name,
      value,
      timestamp: performance.now(),
      context,
      location,
      metadata,
    };

    setMetrics(prev => {
      const newMetrics = [...prev, metric];
      
      // Keep only the most recent metrics
      if (newMetrics.length > config.maxMetrics) {
        return newMetrics.slice(-config.maxMetrics);
      }
      
      return newMetrics;
    });

    // Check thresholds and create alerts
    checkThresholds(metric);
  }, [config.enabled, config.maxMetrics]);

  const checkThresholds = useCallback((metric: PerformanceMetric) => {
    const relevantThresholds = config.thresholds.filter(
      t => t.enabled && t.metric === metric.name
    );

    for (const threshold of relevantThresholds) {
      if (metric.value > threshold.threshold) {
        const alert: PerformanceAlert = {
          id: `alert_${++alertIdCounterRef.current}`,
          metric: metric.name,
          value: metric.value,
          threshold: threshold.threshold,
          severity: threshold.severity,
          timestamp: metric.timestamp,
          location: metric.location,
          context: metric.context,
          acknowledged: false,
        };

        setAlerts(prev => [...prev, alert]);
        
        // Console warning for immediate attention
        console.warn(`🚨 Performance Alert: ${metric.name} (${metric.value.toFixed(2)}ms) exceeded ${threshold.severity} threshold (${threshold.threshold}ms)`, {
          location: metric.location,
          context: metric.context,
        });
      }
    }
  }, [config.thresholds]);

  // Calculate statistics
  const calculateStats = useCallback((metricName: string): PerformanceStats | null => {
    const metricData = metrics.filter(m => m.name === metricName);
    if (metricData.length === 0) return null;

    const values = metricData.map(m => m.value).sort((a, b) => a - b);
    const count = values.length;
    const sum = values.reduce((a, b) => a + b, 0);
    const avg = sum / count;
    const min = values[0];
    const max = values[values.length - 1];
    const p95Index = Math.floor(count * 0.95);
    const p99Index = Math.floor(count * 0.99);
    const p95 = values[p95Index] || max;
    const p99 = values[p99Index] || max;
    const lastValue = metricData[metricData.length - 1]?.value || 0;

    // Calculate trend (compare last 10% vs previous 10%)
    const recentCount = Math.max(1, Math.floor(count * 0.1));
    const recentValues = metricData.slice(-recentCount);
    const previousValues = metricData.slice(-recentCount * 2, -recentCount);
    
    let trend: 'improving' | 'degrading' | 'stable' = 'stable';
    if (previousValues.length > 0) {
      const recentAvg = recentValues.reduce((a, b) => a + b.value, 0) / recentValues.length;
      const previousAvg = previousValues.reduce((a, b) => a + b.value, 0) / previousValues.length;
      const change = (recentAvg - previousAvg) / previousAvg;
      
      if (change > 0.1) trend = 'degrading';
      else if (change < -0.1) trend = 'improving';
    }

    return {
      metric: metricName,
      count,
      avg,
      min,
      max,
      p95,
      p99,
      lastValue,
      trend,
    };
  }, [metrics]);

  // Update stats periodically
  useEffect(() => {
    const updateStats = () => {
      const metricNames = Array.from(new Set(metrics.map(m => m.name)));
      const newStats = new Map<string, PerformanceStats>();
      
      for (const name of metricNames) {
        const stat = calculateStats(name);
        if (stat) {
          newStats.set(name, stat);
        }
      }
      
      setStats(newStats);
    };

    const interval = setInterval(updateStats, 5000); // Update every 5 seconds
    updateStats(); // Initial calculation

    return () => clearInterval(interval);
  }, [metrics, calculateStats]);

  // System health calculation
  const isHealthy = React.useMemo(() => {
    const recentAlerts = alerts.filter(a => 
      !a.acknowledged && 
      (performance.now() - a.timestamp) < 60000 // Last minute
    );
    
    const criticalAlerts = recentAlerts.filter(a => a.severity === 'critical');
    const errorAlerts = recentAlerts.filter(a => a.severity === 'error');
    
    return criticalAlerts.length === 0 && errorAlerts.length < 3;
  }, [alerts]);

  const healthScore = React.useMemo(() => {
    const recentAlerts = alerts.filter(a => 
      !a.acknowledged && 
      (performance.now() - a.timestamp) < 300000 // Last 5 minutes
    );
    
    const criticalCount = recentAlerts.filter(a => a.severity === 'critical').length;
    const errorCount = recentAlerts.filter(a => a.severity === 'error').length;
    const warningCount = recentAlerts.filter(a => a.severity === 'warning').length;
    
    let score = 100;
    score -= criticalCount * 30;
    score -= errorCount * 15;
    score -= warningCount * 5;
    
    return Math.max(0, score);
  }, [alerts]);

  // Helper functions
  const getStats = useCallback((metric: string) => stats.get(metric) || null, [stats]);
  const getAllStats = useCallback(() => Array.from(stats.values()), [stats]);
  const getAlerts = useCallback(() => alerts, [alerts]);
  
  const acknowledgeAlert = useCallback((alertId: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId ? { ...alert, acknowledged: true } : alert
    ));
  }, []);

  const clearAlerts = useCallback(() => {
    setAlerts([]);
  }, []);

  const updateConfig = useCallback((newConfig: Partial<PerformanceConfig>) => {
    setConfig(prev => ({ ...prev, ...newConfig }));
  }, []);

  const exportMetrics = useCallback(() => {
    return JSON.stringify({
      metrics,
      alerts,
      stats: Array.from(stats.entries()),
      timestamp: Date.now(),
    }, null, 2);
  }, [metrics, alerts, stats]);

  const clearMetrics = useCallback(() => {
    setMetrics([]);
    setAlerts([]);
    setStats(new Map());
  }, []);

  const value: PerformanceMonitoringContextType = {
    startMeasurement,
    endMeasurement,
    recordMetric,
    getStats,
    getAllStats,
    getAlerts,
    acknowledgeAlert,
    clearAlerts,
    config,
    updateConfig,
    exportMetrics,
    clearMetrics,
    isHealthy,
    healthScore,
  };

  return (
    <PerformanceMonitoringContext.Provider value={value}>
      {children}
    </PerformanceMonitoringContext.Provider>
  );
};

export const usePerformanceMonitoring = (): PerformanceMonitoringContextType => {
  const context = useContext(PerformanceMonitoringContext);
  if (!context) {
    throw new Error('usePerformanceMonitoring must be used within a PerformanceMonitoringProvider');
  }
  return context;
};

// Convenience hooks for specific measurements
export const useLocationSwitchTimer = () => {
  const { startMeasurement, endMeasurement } = usePerformanceMonitoring();
  
  return useCallback((fromLocation?: string, toLocation?: string) => {
    const markId = startMeasurement('location_switch_time', 'navigation', toLocation);
    
    return () => endMeasurement(markId, { fromLocation, toLocation });
  }, [startMeasurement, endMeasurement]);
};

export const useQueryTimer = () => {
  const { startMeasurement, endMeasurement } = usePerformanceMonitoring();
  
  return useCallback((queryName: string, location?: string) => {
    const markId = startMeasurement('query_time', `query_${queryName}`, location);
    
    return (metadata?: Record<string, any>) => endMeasurement(markId, metadata);
  }, [startMeasurement, endMeasurement]);
};

export const useDataLoadTimer = () => {
  const { startMeasurement, endMeasurement } = usePerformanceMonitoring();
  
  return useCallback((dataType: string, location?: string) => {
    const markId = startMeasurement('data_load_time', `data_${dataType}`, location);
    
    return (metadata?: Record<string, any>) => endMeasurement(markId, metadata);
  }, [startMeasurement, endMeasurement]);
};

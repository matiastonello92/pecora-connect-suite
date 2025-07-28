import { useEffect, useRef } from 'react';

interface PerformanceMetrics {
  renderCount: number;
  lastRenderTime: number;
  averageRenderTime: number;
}

interface UsePerformanceMonitoringOptions {
  componentName: string;
  logThreshold?: number; // Log when render time exceeds this threshold (ms)
  enabled?: boolean;
}

export const usePerformanceMonitoring = ({
  componentName,
  logThreshold = 16, // 16ms for 60fps
  enabled = process.env.NODE_ENV === 'development'
}: UsePerformanceMonitoringOptions) => {
  const metricsRef = useRef<PerformanceMetrics>({
    renderCount: 0,
    lastRenderTime: 0,
    averageRenderTime: 0
  });
  const renderStartRef = useRef<number>(0);

  useEffect(() => {
    if (!enabled) return;

    renderStartRef.current = performance.now();
    
    return () => {
      const renderTime = performance.now() - renderStartRef.current;
      const metrics = metricsRef.current;
      
      metrics.renderCount++;
      metrics.lastRenderTime = renderTime;
      metrics.averageRenderTime = (
        (metrics.averageRenderTime * (metrics.renderCount - 1) + renderTime) /
        metrics.renderCount
      );

      if (renderTime > logThreshold) {
        console.warn(
          `🐌 Slow render detected in ${componentName}:`,
          {
            renderTime: `${renderTime.toFixed(2)}ms`,
            threshold: `${logThreshold}ms`,
            renderCount: metrics.renderCount,
            averageRenderTime: `${metrics.averageRenderTime.toFixed(2)}ms`
          }
        );
      }

      // Log periodic summaries
      if (metrics.renderCount % 50 === 0) {
        console.log(
          `📊 Performance summary for ${componentName}:`,
          {
            totalRenders: metrics.renderCount,
            averageRenderTime: `${metrics.averageRenderTime.toFixed(2)}ms`,
            lastRenderTime: `${metrics.lastRenderTime.toFixed(2)}ms`
          }
        );
      }
    };
  });

  return metricsRef.current;
};
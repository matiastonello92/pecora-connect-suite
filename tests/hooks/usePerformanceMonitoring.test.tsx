import { renderHook, act } from '@testing-library/react';
import { usePerformanceMonitoring, PerformanceMonitoringProvider } from '@/hooks/usePerformanceMonitoring';
import { createLargeLocationDataset, performanceAssert, memoryLeakDetector } from '../utils/performanceTestUtils';

// Mock wrapper component
const createWrapper = () => ({ children }: { children: React.ReactNode }) => (
  <PerformanceMonitoringProvider>{children}</PerformanceMonitoringProvider>
);

describe('usePerformanceMonitoring', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Functionality', () => {
    it('should initialize with default configuration', () => {
      const { result } = renderHook(() => usePerformanceMonitoring(), {
        wrapper: createWrapper(),
      });

      expect(result.current.config.enabled).toBe(true);
      expect(result.current.config.samplingRate).toBe(1.0);
      expect(result.current.config.maxMetrics).toBe(10000);
      expect(result.current.isHealthy).toBe(true);
      expect(result.current.healthScore).toBe(100);
    });

    it('should start and end measurements correctly', async () => {
      const { result } = renderHook(() => usePerformanceMonitoring(), {
        wrapper: createWrapper(),
      });

      const startTime = performance.now();
      let markId: string;
      let duration: number | null;

      await act(async () => {
        markId = result.current.startMeasurement('test_metric', 'test_context', 'test_location');
        // Simulate some work
        await new Promise(resolve => setTimeout(resolve, 10));
        duration = result.current.endMeasurement(markId);
      });

      expect(markId).toBeTruthy();
      expect(duration).toBeGreaterThan(0);
      expect(performance.mark).toHaveBeenCalledWith(
        expect.stringContaining('start_test_metric'),
        expect.any(Object)
      );
    });

    it('should record metrics and check thresholds', async () => {
      const { result } = renderHook(() => usePerformanceMonitoring(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        // Record a metric that exceeds warning threshold
        result.current.recordMetric('location_switch_time', 150, 'test_context', 'test_location');
      });

      const alerts = result.current.getAlerts();
      expect(alerts).toHaveLength(1);
      expect(alerts[0].severity).toBe('warning');
      expect(alerts[0].metric).toBe('location_switch_time');
      expect(alerts[0].value).toBe(150);
    });
  });

  describe('Performance Tests', () => {
    it('should handle high-frequency measurements efficiently', async () => {
      const { result } = renderHook(() => usePerformanceMonitoring(), {
        wrapper: createWrapper(),
      });

      const initialMemory = memoryLeakDetector.start();
      const measurementCount = 1000;
      
      const executionTime = await global.measureExecutionTime(async () => {
        await act(async () => {
          const promises = Array.from({ length: measurementCount }, async (_, index) => {
            const markId = result.current.startMeasurement(
              'high_frequency_test',
              'performance_test',
              `location_${index}`
            );
            // Simulate minimal work
            await Promise.resolve();
            return result.current.endMeasurement(markId);
          });
          
          await Promise.all(promises);
        });
      });

      // Performance assertions
      performanceAssert.executionTime(executionTime, 100, `${measurementCount} measurements`);
      expect(memoryLeakDetector.check(initialMemory, 'high-frequency measurements')).toBe(true);

      // Check that all measurements were recorded
      const stats = result.current.getAllStats();
      const testStats = stats.find(s => s.metric === 'high_frequency_test');
      expect(testStats?.count).toBe(measurementCount);
    });

    it('should maintain performance with large metric datasets', async () => {
      const { result } = renderHook(() => usePerformanceMonitoring(), {
        wrapper: createWrapper(),
      });

      const { locations } = createLargeLocationDataset(5000);
      const initialMemory = memoryLeakDetector.start();

      const executionTime = await global.measureExecutionTime(async () => {
        await act(async () => {
          // Record metrics for all locations
          locations.forEach((location, index) => {
            result.current.recordMetric(
              'location_load_time',
              Math.random() * 100 + 50, // 50-150ms
              'bulk_test',
              location.code,
              { index, locationName: location.name }
            );
          });
        });
      });

      performanceAssert.executionTime(executionTime, 200, 'Recording 5000 location metrics');
      expect(memoryLeakDetector.check(initialMemory, 'large metric dataset', 50 * 1024 * 1024)).toBe(true);

      // Verify stats calculation performance
      const statsTime = await global.measureExecutionTime(() => {
        const stats = result.current.getAllStats();
        const locationStats = stats.find(s => s.metric === 'location_load_time');
        expect(locationStats?.count).toBe(5000);
      });

      performanceAssert.executionTime(statsTime, 50, 'Stats calculation for 5000 metrics');
    });

    it('should handle threshold checking efficiently with many alerts', async () => {
      const { result } = renderHook(() => usePerformanceMonitoring(), {
        wrapper: createWrapper(),
      });

      const initialMemory = memoryLeakDetector.start();
      const alertCount = 1000;

      const executionTime = await global.measureExecutionTime(async () => {
        await act(async () => {
          // Generate many threshold violations
          for (let i = 0; i < alertCount; i++) {
            result.current.recordMetric(
              'query_time',
              250 + Math.random() * 100, // 250-350ms (exceeds 200ms threshold)
              'stress_test',
              `location_${i}`
            );
          }
        });
      });

      performanceAssert.executionTime(executionTime, 100, `Generating ${alertCount} alerts`);
      expect(memoryLeakDetector.check(initialMemory, 'alert generation')).toBe(true);

      const alerts = result.current.getAlerts();
      expect(alerts.length).toBeGreaterThan(alertCount * 0.9); // At least 90% should trigger alerts
      expect(result.current.isHealthy).toBe(false);
      expect(result.current.healthScore).toBeLessThan(50);
    });
  });

  describe('Scalability Tests', () => {
    it('should maintain sub-50ms performance under concurrent load', async () => {
      const { result } = renderHook(() => usePerformanceMonitoring(), {
        wrapper: createWrapper(),
      });

      const concurrentOperations = 100;
      const responseTimes: number[] = [];

      const promises = Array.from({ length: concurrentOperations }, async (_, index) => {
        const operationTime = await global.measureExecutionTime(async () => {
          await act(async () => {
            const markId = result.current.startMeasurement(
              'concurrent_test',
              'scalability',
              `location_${index}`
            );
            
            // Simulate realistic work
            await new Promise(resolve => setTimeout(resolve, Math.random() * 5));
            
            result.current.endMeasurement(markId);
            result.current.recordMetric('custom_metric', Math.random() * 100, 'concurrent', `loc_${index}`);
          });
        });
        
        responseTimes.push(operationTime);
        return operationTime;
      });

      await Promise.all(promises);

      // Assert response time requirements
      performanceAssert.responseTime(responseTimes, 50, 75); // Avg < 50ms, P95 < 75ms
      
      const stats = result.current.getAllStats();
      expect(stats.length).toBeGreaterThan(0);
    });

    it('should handle memory cleanup properly with metric rotation', async () => {
      const { result } = renderHook(() => usePerformanceMonitoring(), {
        wrapper: createWrapper(),
      });

      // First, configure a smaller max metrics limit for testing
      await act(async () => {
        result.current.updateConfig({ maxMetrics: 1000 });
      });

      const initialMemory = memoryLeakDetector.start();
      
      // Add more metrics than the limit
      await act(async () => {
        for (let i = 0; i < 1500; i++) {
          result.current.recordMetric(
            'rotation_test',
            Math.random() * 100,
            'cleanup_test',
            `location_${i}`
          );
        }
      });

      // Memory should not grow excessively due to rotation
      expect(memoryLeakDetector.check(initialMemory, 'metric rotation', 20 * 1024 * 1024)).toBe(true);
      
      const stats = result.current.getStats('rotation_test');
      expect(stats?.count).toBeLessThanOrEqual(1000); // Should be limited by maxMetrics
    });
  });

  describe('Error Handling', () => {
    it('should handle performance API failures gracefully', async () => {
      // Mock performance API failure
      const originalMark = performance.mark;
      performance.mark = jest.fn().mockImplementation(() => {
        throw new Error('Performance API unavailable');
      });

      const { result } = renderHook(() => usePerformanceMonitoring(), {
        wrapper: createWrapper(),
      });

      let markId: string;
      let duration: number | null;

      await act(async () => {
        markId = result.current.startMeasurement('error_test');
        duration = result.current.endMeasurement(markId);
      });

      expect(markId).toBe(''); // Should return empty string on error
      expect(duration).toBeNull(); // Should return null on error

      // Restore original implementation
      performance.mark = originalMark;
    });

    it('should maintain functionality when disabled', async () => {
      const { result } = renderHook(() => usePerformanceMonitoring(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        result.current.updateConfig({ enabled: false });
      });

      const markId = result.current.startMeasurement('disabled_test');
      const duration = result.current.endMeasurement(markId);

      expect(markId).toBe('');
      expect(duration).toBeNull();
      expect(result.current.getAllStats()).toHaveLength(0);
    });
  });
});
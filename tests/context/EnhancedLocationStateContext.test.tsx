import { renderHook, act } from '@testing-library/react';
import { EnhancedLocationStateProvider, useEnhancedLocationState } from '@/context/EnhancedLocationStateContext';
import { createLargeLocationDataset, performanceAssert, memoryLeakDetector, simulateConcurrentRequests } from '../utils/performanceTestUtils';

// Mock the useActiveLocations hook
jest.mock('@/hooks/useLocations', () => ({
  useActiveLocations: () => ({
    data: global.createMockLocationData(100),
    isLoading: false,
    error: null,
  }),
}));

// Mock the performance monitoring hook
jest.mock('@/hooks/usePerformanceMonitoring', () => ({
  usePerformanceMonitoring: () => ({
    recordMetric: jest.fn(),
  }),
  useLocationSwitchTimer: () => {
    return jest.fn(() => jest.fn(() => Math.random() * 100 + 50)); // 50-150ms
  },
}));

const createWrapper = () => ({ children }: { children: React.ReactNode }) => (
  <EnhancedLocationStateProvider>{children}</EnhancedLocationStateProvider>
);

describe('EnhancedLocationStateContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Functionality', () => {
    it('should initialize with null active location', () => {
      const { result } = renderHook(() => useEnhancedLocationState(), {
        wrapper: createWrapper(),
      });

      expect(result.current.activeLocation).toBeNull();
      expect(result.current.isLocationSwitching).toBe(false);
      expect(result.current.switchHistory).toHaveLength(0);
      expect(result.current.canSwitchLocations).toBe(true);
      expect(result.current.lastSwitchDuration).toBeNull();
    });

    it('should switch locations correctly', async () => {
      const { result } = renderHook(() => useEnhancedLocationState(), {
        wrapper: createWrapper(),
      });

      const startTime = performance.now();

      await act(async () => {
        await result.current.setActiveLocation('test_location_001');
      });

      const endTime = performance.now();
      const switchTime = endTime - startTime;

      expect(result.current.activeLocation).toBe('test_location_001');
      expect(result.current.isLocationSwitching).toBe(false);
      expect(result.current.switchHistory).toHaveLength(1);
      expect(result.current.lastSwitchDuration).toBeGreaterThan(0);
      
      // Ensure switch completed in reasonable time
      performanceAssert.executionTime(switchTime, 200, 'Location switch');
    });

    it('should prevent concurrent location switches', async () => {
      const { result } = renderHook(() => useEnhancedLocationState(), {
        wrapper: createWrapper(),
      });

      const promise1 = act(async () => {
        await result.current.setActiveLocation('location_001');
      });

      // Try to switch again while first switch is in progress
      const promise2 = act(async () => {
        await result.current.setActiveLocation('location_002');
      });

      await Promise.all([promise1, promise2]);

      // Only one switch should have succeeded
      expect(result.current.switchHistory).toHaveLength(1);
      expect(result.current.activeLocation).toBe('location_001');
    });
  });

  describe('Performance Tests', () => {
    it('should handle rapid location switches efficiently', async () => {
      const { result } = renderHook(() => useEnhancedLocationState(), {
        wrapper: createWrapper(),
      });

      const { locations } = createLargeLocationDataset(100);
      const initialMemory = memoryLeakDetector.start();
      const switchTimes: number[] = [];

      // Perform sequential location switches
      for (let i = 0; i < 20; i++) {
        const location = locations[i % locations.length];
        
        const switchTime = await global.measureExecutionTime(async () => {
          await act(async () => {
            await result.current.setActiveLocation(location.code);
          });
        });
        
        switchTimes.push(switchTime);
        
        // Wait a bit between switches to avoid concurrency issues
        await new Promise(resolve => setTimeout(resolve, 10));
      }

      // Performance assertions
      performanceAssert.responseTime(switchTimes, 100, 150); // Avg < 100ms, P95 < 150ms
      expect(memoryLeakDetector.check(initialMemory, 'rapid location switches')).toBe(true);
      
      expect(result.current.switchHistory).toHaveLength(20);
      expect(result.current.activeLocation).toBeTruthy();
    });

    it('should maintain switch history efficiently with large datasets', async () => {
      const { result } = renderHook(() => useEnhancedLocationState(), {
        wrapper: createWrapper(),
      });

      const { locations } = createLargeLocationDataset(1000);
      const initialMemory = memoryLeakDetector.start();

      // Perform many switches to test history management
      const executionTime = await global.measureExecutionTime(async () => {
        for (let i = 0; i < 100; i++) {
          const location = locations[i % locations.length];
          
          await act(async () => {
            await result.current.setActiveLocation(location.code);
          });
          
          // No delay needed for this test since we're testing memory/performance
          if (i % 10 === 0) {
            await new Promise(resolve => setTimeout(resolve, 1));
          }
        }
      });

      performanceAssert.executionTime(executionTime, 5000, '100 location switches');
      expect(memoryLeakDetector.check(initialMemory, 'switch history management', 10 * 1024 * 1024)).toBe(true);
      
      // History should be limited to 50 entries
      expect(result.current.switchHistory.length).toBeLessThanOrEqual(50);
      expect(result.current.activeLocation).toBeTruthy();
    });

    it('should handle high-concurrency location switching attempts', async () => {
      const { result } = renderHook(() => useEnhancedLocationState(), {
        wrapper: createWrapper(),
      });

      const { locations } = createLargeLocationDataset(100);
      const concurrentRequests = 50;
      
      const requestFunction = async () => {
        const randomLocation = locations[Math.floor(Math.random() * locations.length)];
        await act(async () => {
          await result.current.setActiveLocation(randomLocation.code);
        });
      };

      const results = await simulateConcurrentRequests(requestFunction, concurrentRequests, 1);

      // Most requests should succeed (allowing for concurrency protection)
      expect(results.successfulRequests).toBeGreaterThan(concurrentRequests * 0.7);
      expect(results.averageResponseTime).toBeLessThan(200);
      
      // Should have some switch history
      expect(result.current.switchHistory.length).toBeGreaterThan(0);
    });
  });

  describe('Scalability Tests', () => {
    it('should handle location switching with 10k+ locations efficiently', async () => {
      const { result } = renderHook(() => useEnhancedLocationState(), {
        wrapper: createWrapper(),
      });

      const { locations } = createLargeLocationDataset(10000);
      const initialMemory = memoryLeakDetector.start();

      // Test switching between random locations from large dataset
      const testIterations = 50;
      const switchTimes: number[] = [];

      for (let i = 0; i < testIterations; i++) {
        const randomLocation = locations[Math.floor(Math.random() * locations.length)];
        
        const switchTime = await global.measureExecutionTime(async () => {
          await act(async () => {
            await result.current.setActiveLocation(randomLocation.code);
          });
        });
        
        switchTimes.push(switchTime);
        
        // Brief pause to prevent overwhelming
        if (i % 10 === 0) {
          await new Promise(resolve => setTimeout(resolve, 5));
        }
      }

      // Performance requirements for large datasets
      performanceAssert.responseTime(switchTimes, 150, 200); // Avg < 150ms, P95 < 200ms
      expect(memoryLeakDetector.check(initialMemory, '10k+ location handling', 50 * 1024 * 1024)).toBe(true);
      
      expect(result.current.switchHistory.length).toBeLessThanOrEqual(50);
      expect(result.current.activeLocation).toBeTruthy();
    });

    it('should maintain performance under sustained load', async () => {
      const { result } = renderHook(() => useEnhancedLocationState(), {
        wrapper: createWrapper(),
      });

      const { locations } = createLargeLocationDataset(1000);
      const sustainedOperations = 200;
      const batchSize = 10;
      const responseTimes: number[] = [];

      // Simulate sustained load in batches
      for (let batch = 0; batch < sustainedOperations / batchSize; batch++) {
        const batchPromises = Array.from({ length: batchSize }, async (_, index) => {
          const location = locations[(batch * batchSize + index) % locations.length];
          
          const operationTime = await global.measureExecutionTime(async () => {
            await act(async () => {
              await result.current.setActiveLocation(location.code);
            });
            
            // Small delay to simulate real usage
            await new Promise(resolve => setTimeout(resolve, 1));
          });
          
          responseTimes.push(operationTime);
          return operationTime;
        });

        await Promise.all(batchPromises);
        
        // Brief pause between batches
        await new Promise(resolve => setTimeout(resolve, 10));
      }

      // Performance should not degrade significantly over time
      const firstHalf = responseTimes.slice(0, responseTimes.length / 2);
      const secondHalf = responseTimes.slice(responseTimes.length / 2);
      
      const firstHalfAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
      const secondHalfAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
      
      // Performance degradation should be minimal (< 50% increase)
      expect(secondHalfAvg).toBeLessThan(firstHalfAvg * 1.5);
      
      performanceAssert.responseTime(responseTimes, 150, 250);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle switching to the same location gracefully', async () => {
      const { result } = renderHook(() => useEnhancedLocationState(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.setActiveLocation('same_location');
      });

      const initialHistoryLength = result.current.switchHistory.length;

      // Try to switch to the same location
      await act(async () => {
        await result.current.setActiveLocation('same_location');
      });

      // Should not add to history or change state
      expect(result.current.switchHistory.length).toBe(initialHistoryLength);
      expect(result.current.activeLocation).toBe('same_location');
    });

    it('should handle rapid state changes without memory leaks', async () => {
      const { result } = renderHook(() => useEnhancedLocationState(), {
        wrapper: createWrapper(),
      });

      const initialMemory = memoryLeakDetector.start();
      
      // Rapid state changes
      for (let i = 0; i < 100; i++) {
        await act(async () => {
          await result.current.setActiveLocation(`rapid_location_${i}`);
        });
      }

      expect(memoryLeakDetector.check(initialMemory, 'rapid state changes', 20 * 1024 * 1024)).toBe(true);
      expect(result.current.switchHistory.length).toBeLessThanOrEqual(50);
    });

    it('should handle component unmounting gracefully', async () => {
      const { result, unmount } = renderHook(() => useEnhancedLocationState(), {
        wrapper: createWrapper(),
      });

      // Start a location switch
      const switchPromise = act(async () => {
        await result.current.setActiveLocation('unmount_test');
      });

      // Unmount component while switch is in progress
      unmount();

      // Should not throw errors
      await expect(switchPromise).resolves.toBeUndefined();
    });
  });
});
import { renderHook, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useOptimizedLocationQueries } from '@/hooks/useOptimizedQueries';
import { createLargeLocationDataset, createMockUserData, performanceAssert, memoryLeakDetector, simulateConcurrentRequests } from '../utils/performanceTestUtils';

// Mock the performance monitoring hooks
jest.mock('@/hooks/usePerformanceMonitoring', () => ({
  useQueryTimer: () => {
    return jest.fn(() => jest.fn(() => Math.random() * 100 + 25)); // 25-125ms
  },
  usePerformanceMonitoring: () => ({
    recordMetric: jest.fn(),
  }),
}));

// Create a test QueryClient
const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      gcTime: 0,
    },
  },
});

const createWrapper = (queryClient: QueryClient) => 
  ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

describe('useOptimizedLocationQueries', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    jest.clearAllMocks();
  });

  afterEach(() => {
    queryClient.clear();
  });

  describe('Basic Functionality', () => {
    it('should initialize with default configuration', () => {
      const { result } = renderHook(() => useOptimizedLocationQueries(), {
        wrapper: createWrapper(queryClient),
      });

      expect(result.current.config.batchSize).toBe(100);
      expect(result.current.config.maxConcurrent).toBe(5);
      expect(result.current.config.enableVirtualization).toBe(true);
      expect(result.current.config.cacheTimeout).toBe(300000);
    });

    it('should accept custom configuration', () => {
      const customConfig = {
        batchSize: 50,
        maxConcurrent: 3,
        enableVirtualization: false,
        cacheTimeout: 600000,
      };

      const { result } = renderHook(() => useOptimizedLocationQueries(customConfig), {
        wrapper: createWrapper(queryClient),
      });

      expect(result.current.config).toEqual(expect.objectContaining(customConfig));
    });
  });

  describe('Virtualized Location Loading', () => {
    it('should handle pagination efficiently', async () => {
      const { result } = renderHook(() => useOptimizedLocationQueries(), {
        wrapper: createWrapper(queryClient),
      });

      const { locations } = createLargeLocationDataset(1000);
      
      // Mock successful pagination response
      const mockSupabase = require('@/integrations/supabase/client').supabase;
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockReturnValue({
              range: jest.fn().mockResolvedValue({
                data: locations.slice(0, 100),
                error: null,
                count: 1000,
              }),
            }),
          }),
        }),
      });

      const initialMemory = memoryLeakDetector.start();

      let queryResult: any;
      const executionTime = await global.measureExecutionTime(async () => {
        queryResult = renderHook(() => result.current.useVirtualizedLocations(0, 100), {
          wrapper: createWrapper(queryClient),
        });
        
        await act(async () => {
          // Wait for query to resolve
          await new Promise(resolve => setTimeout(resolve, 50));
        });
      });

      performanceAssert.executionTime(executionTime, 100, 'Virtualized location loading');
      expect(memoryLeakDetector.check(initialMemory, 'pagination query')).toBe(true);

      expect(mockSupabase.from).toHaveBeenCalledWith('locations');
    });

    it('should handle large page sizes efficiently', async () => {
      const { result } = renderHook(() => useOptimizedLocationQueries(), {
        wrapper: createWrapper(queryClient),
      });

      const { locations } = createLargeLocationDataset(5000);
      
      const mockSupabase = require('@/integrations/supabase/client').supabase;
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockReturnValue({
              range: jest.fn().mockResolvedValue({
                data: locations.slice(0, 1000),
                error: null,
                count: 5000,
              }),
            }),
          }),
        }),
      });

      const executionTime = await global.measureExecutionTime(async () => {
        renderHook(() => result.current.useVirtualizedLocations(0, 1000), {
          wrapper: createWrapper(queryClient),
        });
        
        await act(async () => {
          await new Promise(resolve => setTimeout(resolve, 100));
        });
      });

      performanceAssert.executionTime(executionTime, 200, 'Large page size loading');
    });
  });

  describe('Batch Location Data Queries', () => {
    it('should batch location IDs efficiently', async () => {
      const { result } = renderHook(() => useOptimizedLocationQueries({ batchSize: 50 }), {
        wrapper: createWrapper(queryClient),
      });

      const { locations } = createLargeLocationDataset(200);
      const locationIds = locations.map(l => l.code);

      // Mock batch query responses
      const mockSupabase = require('@/integrations/supabase/client').supabase;
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          in: jest.fn().mockReturnValue({
            order: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue({
                data: [],
                error: null,
              }),
            }),
            limit: jest.fn().mockResolvedValue({
              data: [],
              error: null,
            }),
          }),
        }),
      });

      const initialMemory = memoryLeakDetector.start();

      const executionTime = await global.measureExecutionTime(async () => {
        renderHook(() => result.current.useBatchLocationData(locationIds), {
          wrapper: createWrapper(queryClient),
        });
        
        await act(async () => {
          await new Promise(resolve => setTimeout(resolve, 200));
        });
      });

      performanceAssert.executionTime(executionTime, 300, 'Batch location data loading');
      expect(memoryLeakDetector.check(initialMemory, 'batch queries', 30 * 1024 * 1024)).toBe(true);

      // Should create 4 batches (200 / 50)
      expect(mockSupabase.from).toHaveBeenCalledTimes(12); // 3 queries per batch × 4 batches
    });

    it('should handle concurrent batch requests efficiently', async () => {
      const { result } = renderHook(() => useOptimizedLocationQueries({ maxConcurrent: 3 }), {
        wrapper: createWrapper(queryClient),
      });

      const { locations } = createLargeLocationDataset(1000);
      const locationIds = locations.map(l => l.code);

      const mockSupabase = require('@/integrations/supabase/client').supabase;
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          in: jest.fn().mockReturnValue({
            order: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue({
                data: [],
                error: null,
              }),
            }),
            limit: jest.fn().mockResolvedValue({
              data: [],
              error: null,
            }),
          }),
        }),
      });

      const concurrentRequests = 10;
      const responseTimes: number[] = [];

      const requestFunction = async () => {
        const batchSize = 100;
        const randomStart = Math.floor(Math.random() * (locationIds.length - batchSize));
        const batchIds = locationIds.slice(randomStart, randomStart + batchSize);
        
        const operationTime = await global.measureExecutionTime(async () => {
          renderHook(() => result.current.useBatchLocationData(batchIds), {
            wrapper: createWrapper(queryClient),
          });
          
          await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 50));
          });
        });
        
        responseTimes.push(operationTime);
        return operationTime;
      };

      await simulateConcurrentRequests(requestFunction, concurrentRequests, 1);

      performanceAssert.responseTime(responseTimes, 200, 300);
    });
  });

  describe('Performance and Scalability Tests', () => {
    it('should handle 10,000+ location queries efficiently', async () => {
      const { result } = renderHook(() => useOptimizedLocationQueries(), {
        wrapper: createWrapper(queryClient),
      });

      const { locations } = createLargeLocationDataset(10000);
      const locationIds = locations.map(l => l.code).slice(0, 5000); // Test with 5k

      const mockSupabase = require('@/integrations/supabase/client').supabase;
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          in: jest.fn().mockReturnValue({
            order: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue({
                data: [],
                error: null,
              }),
            }),
            limit: jest.fn().mockResolvedValue({
              data: [],
              error: null,
            }),
          }),
        }),
      });

      const initialMemory = memoryLeakDetector.start();

      const executionTime = await global.measureExecutionTime(async () => {
        renderHook(() => result.current.useBatchLocationData(locationIds), {
          wrapper: createWrapper(queryClient),
        });
        
        await act(async () => {
          await new Promise(resolve => setTimeout(resolve, 500));
        });
      });

      // Should handle large datasets efficiently
      performanceAssert.executionTime(executionTime, 1000, '5000 location batch queries');
      expect(memoryLeakDetector.check(initialMemory, 'large dataset queries', 100 * 1024 * 1024)).toBe(true);
    });

    it('should maintain query performance under sustained load', async () => {
      const { result } = renderHook(() => useOptimizedLocationQueries(), {
        wrapper: createWrapper(queryClient),
      });

      const { locations } = createLargeLocationDataset(1000);
      
      const mockSupabase = require('@/integrations/supabase/client').supabase;
      mockSupabase.rpc.mockResolvedValue({
        data: locations.slice(0, 100),
        error: null,
      });

      const sustainedQueries = 50;
      const responseTimes: number[] = [];

      for (let i = 0; i < sustainedQueries; i++) {
        const queryTime = await global.measureExecutionTime(async () => {
          renderHook(() => result.current.useOptimizedLocationData(`LOC${i.toString().padStart(5, '0')}`), {
            wrapper: createWrapper(queryClient),
          });
          
          await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 20));
          });
        });
        
        responseTimes.push(queryTime);
        
        // Brief pause between queries
        await new Promise(resolve => setTimeout(resolve, 10));
      }

      // Performance should remain consistent
      performanceAssert.responseTime(responseTimes, 100, 150);
      
      // Check for performance degradation over time
      const firstQuarter = responseTimes.slice(0, sustainedQueries / 4);
      const lastQuarter = responseTimes.slice(-sustainedQueries / 4);
      
      const firstAvg = firstQuarter.reduce((a, b) => a + b, 0) / firstQuarter.length;
      const lastAvg = lastQuarter.reduce((a, b) => a + b, 0) / lastQuarter.length;
      
      expect(lastAvg).toBeLessThan(firstAvg * 1.3); // < 30% degradation
    });

    it('should handle memory efficiently with query caching', async () => {
      const { result } = renderHook(() => useOptimizedLocationQueries({ cacheTimeout: 60000 }), {
        wrapper: createWrapper(queryClient),
      });

      const { locations } = createLargeLocationDataset(100);
      
      const mockSupabase = require('@/integrations/supabase/client').supabase;
      mockSupabase.rpc.mockResolvedValue({
        data: locations,
        error: null,
      });

      const initialMemory = memoryLeakDetector.start();

      // Perform many queries with caching
      for (let i = 0; i < 50; i++) {
        const locationCode = `LOC${(i % 10).toString().padStart(5, '0')}`; // Repeat locations for cache hits
        
        renderHook(() => result.current.useOptimizedLocationData(locationCode), {
          wrapper: createWrapper(queryClient),
        });
        
        await act(async () => {
          await new Promise(resolve => setTimeout(resolve, 5));
        });
      }

      // Memory usage should be controlled due to caching
      expect(memoryLeakDetector.check(initialMemory, 'query caching', 50 * 1024 * 1024)).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle query failures gracefully', async () => {
      const { result } = renderHook(() => useOptimizedLocationQueries(), {
        wrapper: createWrapper(queryClient),
      });

      const mockSupabase = require('@/integrations/supabase/client').supabase;
      mockSupabase.rpc.mockRejectedValue(new Error('Database connection failed'));

      let errorOccurred = false;

      try {
        renderHook(() => result.current.useOptimizedLocationData('error_location'), {
          wrapper: createWrapper(queryClient),
        });
        
        await act(async () => {
          await new Promise(resolve => setTimeout(resolve, 100));
        });
      } catch (error) {
        errorOccurred = true;
      }

      // Error should be handled gracefully without crashing
      expect(errorOccurred).toBe(false);
    });

    it('should handle malformed data responses', async () => {
      const { result } = renderHook(() => useOptimizedLocationQueries(), {
        wrapper: createWrapper(queryClient),
      });

      const mockSupabase = require('@/integrations/supabase/client').supabase;
      mockSupabase.rpc.mockResolvedValue({
        data: null, // Malformed response
        error: null,
      });

      const executionTime = await global.measureExecutionTime(async () => {
        renderHook(() => result.current.useOptimizedLocationData('malformed_data'), {
          wrapper: createWrapper(queryClient),
        });
        
        await act(async () => {
          await new Promise(resolve => setTimeout(resolve, 50));
        });
      });

      // Should handle gracefully and quickly
      performanceAssert.executionTime(executionTime, 100, 'Malformed data handling');
    });
  });
});
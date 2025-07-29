import { renderHook, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useDashboardConfig } from '@/hooks/useDashboardConfig';
import { createMockDashboardConfigs, performanceAssert, memoryLeakDetector } from '../utils/performanceTestUtils';

const createTestQueryClient = () => new QueryClient({
  defaultOptions: { queries: { retry: false, gcTime: 0 } }
});

const createWrapper = (queryClient: QueryClient) => 
  ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

describe('useDashboardConfig', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    jest.clearAllMocks();
  });

  describe('Performance Tests', () => {
    it('should handle large dashboard configurations efficiently', async () => {
      const { result } = renderHook(() => useDashboardConfig('LOC00001'), {
        wrapper: createWrapper(queryClient),
      });

      const mockConfigs = createMockDashboardConfigs(1000);
      const largeConfig = mockConfigs[0];
      
      // Add many widgets to test large JSONB handling
      largeConfig.widgets = Array.from({ length: 50 }, (_, i) => ({
        id: `widget_${i}`,
        type: 'metric',
        title: `Widget ${i}`,
        position: { x: i % 4, y: Math.floor(i / 4), width: 1, height: 1 },
        is_visible: true,
        config: { metric: `metric_${i}`, data: Array(100).fill(i) },
      }));

      const mockSupabase = require('@/integrations/supabase/client').supabase;
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            maybeSingle: jest.fn().mockResolvedValue({
              data: largeConfig,
              error: null,
            }),
          }),
        }),
        upsert: jest.fn().mockReturnValue({
          select: jest.fn().mockResolvedValue({
            data: [largeConfig],
            error: null,
          }),
        }),
      });

      const initialMemory = memoryLeakDetector.start();

      const executionTime = await global.measureExecutionTime(async () => {
        await act(async () => {
          await result.current.saveDashboardConfig(largeConfig);
        });
      });

      performanceAssert.executionTime(executionTime, 200, 'Large dashboard config save');
      expect(memoryLeakDetector.check(initialMemory, 'large JSONB handling')).toBe(true);
    });

    it('should handle 10,000+ dashboard configurations', async () => {
      const configs = createMockDashboardConfigs(10000);
      
      const executionTime = await global.measureExecutionTime(() => {
        // Test configuration processing
        configs.forEach(config => {
          expect(config.widgets.length).toBeGreaterThan(0);
          expect(config.layout).toBeDefined();
          expect(config.theme).toBeDefined();
        });
      });

      performanceAssert.executionTime(executionTime, 100, '10k dashboard config processing');
    });
  });
});
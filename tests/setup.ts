import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';

// Mock console methods to reduce noise during tests
global.console = {
  ...console,
  // Keep error and warn for debugging
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
};

// Mock performance API for testing
Object.defineProperty(global, 'performance', {
  writable: true,
  value: {
    mark: jest.fn(),
    measure: jest.fn(),
    getEntriesByName: jest.fn(() => [{ duration: 42 }]),
    clearMarks: jest.fn(),
    clearMeasures: jest.fn(),
    now: jest.fn(() => Date.now()),
  },
});

// Mock React Query
jest.mock('@tanstack/react-query', () => ({
  useQuery: jest.fn(),
  useMutation: jest.fn(),
  useQueryClient: jest.fn(() => ({
    invalidateQueries: jest.fn(),
    prefetchQuery: jest.fn(),
    setQueryData: jest.fn(),
  })),
  QueryClient: jest.fn(() => ({
    invalidateQueries: jest.fn(),
    prefetchQuery: jest.fn(),
    setQueryData: jest.fn(),
  })),
}));

// Mock Supabase client
jest.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          order: jest.fn(() => ({
            range: jest.fn(() => Promise.resolve({ data: [], error: null, count: 0 })),
            limit: jest.fn(() => Promise.resolve({ data: [], error: null })),
          })),
          limit: jest.fn(() => Promise.resolve({ data: [], error: null })),
        })),
        in: jest.fn(() => ({
          order: jest.fn(() => Promise.resolve({ data: [], error: null })),
          limit: jest.fn(() => Promise.resolve({ data: [], error: null })),
        })),
        maybeSingle: jest.fn(() => Promise.resolve({ data: null, error: null })),
        single: jest.fn(() => Promise.resolve({ data: null, error: null })),
      })),
      insert: jest.fn(() => ({
        select: jest.fn(() => Promise.resolve({ data: [], error: null })),
      })),
      update: jest.fn(() => ({
        eq: jest.fn(() => ({
          select: jest.fn(() => Promise.resolve({ data: [], error: null })),
        })),
      })),
      upsert: jest.fn(() => ({
        select: jest.fn(() => Promise.resolve({ data: [], error: null })),
      })),
    })),
    rpc: jest.fn(() => Promise.resolve({ data: [], error: null })),
    auth: {
      getUser: jest.fn(() => Promise.resolve({ 
        data: { user: { id: 'test-user-id' } }, 
        error: null 
      })),
    },
    channel: jest.fn(() => ({
      on: jest.fn(() => ({
        subscribe: jest.fn(),
      })),
      track: jest.fn(),
    })),
    removeChannel: jest.fn(),
  },
}));

// Cleanup after each test
afterEach(() => {
  cleanup();
  jest.clearAllMocks();
});

// Setup performance monitoring for memory leak detection
beforeEach(() => {
  if (global.gc) {
    global.gc();
  }
});

// Global test utilities
global.createMockLocationData = (count: number = 1000) => {
  return Array.from({ length: count }, (_, index) => ({
    code: `loc_${index.toString().padStart(5, '0')}`,
    name: `Location ${index + 1}`,
    id: `id_${index}`,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }));
};

global.measureMemoryUsage = () => {
  if (global.gc) {
    global.gc();
  }
  return (performance as any).memory?.usedJSHeapSize || 0;
};

global.measureExecutionTime = async (fn: () => Promise<any> | any) => {
  const start = performance.now();
  await fn();
  return performance.now() - start;
};

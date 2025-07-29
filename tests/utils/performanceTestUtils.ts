// Performance test utilities for large-scale testing

export const createLargeLocationDataset = (size: number = 10000) => {
  console.log(`Generating ${size} location records...`);
  const start = performance.now();
  
  const locations = Array.from({ length: size }, (_, index) => ({
    id: `loc-${index.toString().padStart(6, '0')}`,
    code: `LOC${index.toString().padStart(5, '0')}`,
    name: `Location ${index + 1}`,
    is_active: Math.random() > 0.1, // 90% active
    created_at: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
    hierarchy: {
      country: `Country ${Math.floor(index / 1000)}`,
      region: `Region ${Math.floor(index / 100)}`,
      city: `City ${Math.floor(index / 10)}`,
    },
    metadata: {
      population: Math.floor(Math.random() * 1000000),
      timezone: 'UTC',
      coordinates: {
        lat: -90 + Math.random() * 180,
        lng: -180 + Math.random() * 360,
      },
    },
  }));
  
  const duration = performance.now() - start;
  console.log(`Generated ${size} locations in ${duration.toFixed(2)}ms`);
  
  return { locations, generationTime: duration };
};

export const createMockUserData = (count: number = 100000) => {
  console.log(`Generating ${count} user records...`);
  const start = performance.now();
  
  const users = Array.from({ length: count }, (_, index) => ({
    id: `user-${index.toString().padStart(6, '0')}`,
    email: `user${index}@test.com`,
    first_name: `User`,
    last_name: `${index}`,
    locations: [`LOC${Math.floor(Math.random() * 1000).toString().padStart(5, '0')}`],
    role: ['base', 'manager', 'admin'][Math.floor(Math.random() * 3)],
    status: 'active',
    created_at: new Date().toISOString(),
  }));
  
  const duration = performance.now() - start;
  console.log(`Generated ${count} users in ${duration.toFixed(2)}ms`);
  
  return { users, generationTime: duration };
};

export const createMockDashboardConfigs = (locationCount: number = 1000) => {
  return Array.from({ length: locationCount }, (_, index) => ({
    id: `config-${index}`,
    location_id: `LOC${index.toString().padStart(5, '0')}`,
    widgets: [
      {
        id: 'widget1',
        type: 'metric',
        title: 'Sales Overview',
        position: { x: 0, y: 0, width: 2, height: 1 },
        is_visible: true,
        config: { metric: 'total_sales' },
      },
      {
        id: 'widget2',
        type: 'chart',
        title: 'Inventory Status',
        position: { x: 2, y: 0, width: 2, height: 2 },
        is_visible: true,
        config: { chart_type: 'bar', limit: 10 },
      },
    ],
    layout: {
      columns: 4,
      rows: 6,
      grid_gap: 16,
      responsive_breakpoints: {
        mobile: 768,
        tablet: 1024,
        desktop: 1280,
      },
    },
    theme: {
      primary_color: 'hsl(220, 100%, 50%)',
      secondary_color: 'hsl(220, 100%, 90%)',
      background_color: 'hsl(0, 0%, 100%)',
      text_color: 'hsl(0, 0%, 10%)',
      accent_color: 'hsl(45, 100%, 50%)',
      font_family: 'Inter, sans-serif',
      border_radius: 8,
      shadow_style: '0 2px 4px rgba(0,0,0,0.1)',
    },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }));
};

export const simulateConcurrentRequests = async (
  requestFunction: () => Promise<any>,
  concurrency: number = 1000,
  iterations: number = 10
) => {
  console.log(`Simulating ${concurrency} concurrent requests x ${iterations} iterations`);
  
  const results = {
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    averageResponseTime: 0,
    minResponseTime: Infinity,
    maxResponseTime: 0,
    responseTimes: [] as number[],
  };
  
  for (let iteration = 0; iteration < iterations; iteration++) {
    const promises = Array.from({ length: concurrency }, async () => {
      const start = performance.now();
      try {
        await requestFunction();
        const duration = performance.now() - start;
        results.responseTimes.push(duration);
        results.successfulRequests++;
        results.minResponseTime = Math.min(results.minResponseTime, duration);
        results.maxResponseTime = Math.max(results.maxResponseTime, duration);
        return { success: true, duration };
      } catch (error) {
        results.failedRequests++;
        return { success: false, error };
      }
    });
    
    await Promise.all(promises);
    results.totalRequests += concurrency;
  }
  
  results.averageResponseTime = results.responseTimes.reduce((a, b) => a + b, 0) / results.responseTimes.length;
  
  return results;
};

export const performanceAssert = {
  executionTime: (actualTime: number, maxTime: number, operation: string) => {
    if (actualTime > maxTime) {
      throw new Error(
        `Performance assertion failed: ${operation} took ${actualTime.toFixed(2)}ms, expected < ${maxTime}ms`
      );
    }
  },
  
  memoryUsage: (beforeMemory: number, afterMemory: number, maxIncrease: number, operation: string) => {
    const increase = afterMemory - beforeMemory;
    if (increase > maxIncrease) {
      throw new Error(
        `Memory assertion failed: ${operation} used ${increase} bytes, expected < ${maxIncrease} bytes`
      );
    }
  },
  
  responseTime: (times: number[], maxAverage: number, maxP95: number) => {
    const sorted = times.sort((a, b) => a - b);
    const average = times.reduce((a, b) => a + b, 0) / times.length;
    const p95Index = Math.floor(times.length * 0.95);
    const p95 = sorted[p95Index];
    
    if (average > maxAverage) {
      throw new Error(`Average response time ${average.toFixed(2)}ms exceeds ${maxAverage}ms`);
    }
    
    if (p95 > maxP95) {
      throw new Error(`P95 response time ${p95.toFixed(2)}ms exceeds ${maxP95}ms`);
    }
  },
};

export const memoryLeakDetector = {
  start: () => {
    if (global.gc) global.gc();
    return (performance as any).memory?.usedJSHeapSize || 0;
  },
  
  check: (initialMemory: number, operation: string, maxIncrease: number = 10 * 1024 * 1024) => {
    if (global.gc) global.gc();
    const currentMemory = (performance as any).memory?.usedJSHeapSize || 0;
    const increase = currentMemory - initialMemory;
    
    if (increase > maxIncrease) {
      console.warn(`Potential memory leak in ${operation}: ${increase} bytes increase`);
      return false;
    }
    
    return true;
  },
};
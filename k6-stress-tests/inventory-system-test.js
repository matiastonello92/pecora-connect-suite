import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// Custom metrics
export const errorRate = new Rate('inventory_errors');
export const queryResponseTime = new Trend('inventory_query_time');
export const writeResponseTime = new Trend('inventory_write_time');
export const operationCount = new Counter('inventory_operations');

// Heavy load test configuration
export const options = {
  stages: [
    { duration: '1m', target: 100 }, // Warm up
    { duration: '2m', target: 750 }, // Medium load
    { duration: '3m', target: 2000 }, // High load
    { duration: '5m', target: 5000 }, // Peak load (simulating end-of-month inventory)
    { duration: '2m', target: 10000 }, // Extreme stress test
    { duration: '3m', target: 0 }, // Cool down
  ],
  thresholds: {
    'inventory_errors': ['rate<0.08'], // Less than 8% errors under extreme load
    'inventory_query_time': ['p(95)<2500'], // 95% queries under 2.5s
    'inventory_write_time': ['p(90)<3000'], // 90% writes under 3s
    'http_req_duration': ['p(99)<5000'], // 99% under 5s
  },
};

const BASE_URL = __ENV.BASE_URL || 'https://cqlbidkagiknfplzbwse.supabase.co';
const ANON_KEY = __ENV.ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNxbGJpZGthZ2lrbmZwbHpid3NlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM1MzIwNjIsImV4cCI6MjA2OTEwODA2Mn0.U28s4yA5d9nLhnr7q-OcfYx6vfjquqXG8c7kOSXz1FA';

const headers = {
  'apikey': ANON_KEY,
  'Authorization': `Bearer ${ANON_KEY}`,
  'Content-Type': 'application/json',
  'Prefer': 'return=minimal'
};

const testLocations = ['menton', 'lyon', 'paris', 'marseille', 'nice'];
const testDepartments = ['kitchen', 'bar', 'dining', 'storage'];
const testStatuses = ['in_progress', 'completed', 'approved'];

export default function() {
  const location = testLocations[Math.floor(Math.random() * testLocations.length)];
  const department = testDepartments[Math.floor(Math.random() * testDepartments.length)];
  const status = testStatuses[Math.floor(Math.random() * testStatuses.length)];
  
  group('Inventory System Heavy Load Test', function() {
    
    // Test 1: Monthly Inventories Query (Heavy Read Operation)
    group('Query Monthly Inventories', function() {
      const response = http.get(
        `${BASE_URL}/rest/v1/monthly_inventories?location=eq.${location}&select=*,monthly_inventory_items(*)&order=created_at.desc&limit=20`, 
        { headers }
      );
      
      queryResponseTime.add(response.timings.duration);
      operationCount.add(1);
      
      const success = check(response, {
        'inventories loaded': (r) => r.status === 200,
        'response time acceptable': (r) => r.timings.duration < 3000,
        'valid data structure': (r) => {
          try {
            const data = JSON.parse(r.body);
            return Array.isArray(data);
          } catch {
            return false;
          }
        },
      });
      
      if (!success) {
        errorRate.add(1);
      }
    });

    // Test 2: Kitchen Products Query (Frequent Operation)
    group('Query Kitchen Products', function() {
      const response = http.get(
        `${BASE_URL}/rest/v1/kitchen_products?location=eq.${location}&select=*&order=name.asc`, 
        { headers }
      );
      
      queryResponseTime.add(response.timings.duration);
      operationCount.add(1);
      
      const success = check(response, {
        'products loaded': (r) => r.status === 200,
        'fast response': (r) => r.timings.duration < 1500,
      });
      
      if (!success) {
        errorRate.add(1);
      }
    });

    // Test 3: Create Monthly Inventory (Write-Heavy Operation)
    group('Create Monthly Inventory', function() {
      const newInventory = {
        location: location,
        department: department,
        user_id: '00000000-0000-0000-0000-000000000000',
        status: 'in_progress',
        total_value: Math.floor(Math.random() * 10000) + 1000
      };
      
      const response = http.post(
        `${BASE_URL}/rest/v1/monthly_inventories`, 
        JSON.stringify(newInventory), 
        { headers }
      );
      
      writeResponseTime.add(response.timings.duration);
      operationCount.add(1);
      
      const success = check(response, {
        'inventory created': (r) => [201, 409, 403].includes(r.status), // 403/409 expected for test data
        'reasonable response time': (r) => r.timings.duration < 4000,
      });
      
      if (!success) {
        errorRate.add(1);
      }
    });

    // Test 4: Inventory Items Bulk Operations
    group('Bulk Inventory Items Query', function() {
      const response = http.get(
        `${BASE_URL}/rest/v1/monthly_inventory_items?select=*,inventory_id,product_id&limit=100`, 
        { headers }
      );
      
      queryResponseTime.add(response.timings.duration);
      operationCount.add(1);
      
      const success = check(response, {
        'items loaded': (r) => r.status === 200,
        'bulk query performance': (r) => r.timings.duration < 2000,
      });
      
      if (!success) {
        errorRate.add(1);
      }
    });

    // Test 5: Complex Location-Aware Data Query
    group('Location-Aware Data Aggregation', function() {
      const testUserId = '00000000-0000-0000-0000-000000000000';
      const response = http.post(
        `${BASE_URL}/rest/v1/rpc/get_location_aware_data`, 
        JSON.stringify({
          target_user_id: testUserId,
          table_name: 'monthly_inventories',
          location_codes: [location],
          status_filter: status
        }), 
        { headers }
      );
      
      queryResponseTime.add(response.timings.duration);
      operationCount.add(1);
      
      const success = check(response, {
        'aggregation successful': (r) => [200, 400].includes(r.status),
        'complex query performance': (r) => r.timings.duration < 3500,
      });
      
      if (!success) {
        errorRate.add(1);
      }
    });

    // Test 6: Equipment Management Load
    group('Equipment Management Stress', function() {
      const response = http.get(
        `${BASE_URL}/rest/v1/equipment?location=eq.${location}&select=*&order=created_at.desc`, 
        { headers }
      );
      
      queryResponseTime.add(response.timings.duration);
      operationCount.add(1);
      
      const success = check(response, {
        'equipment data loaded': (r) => r.status === 200,
        'acceptable latency': (r) => r.timings.duration < 2000,
      });
      
      if (!success) {
        errorRate.add(1);
      }
    });

  });

  // Simulate realistic inventory management patterns
  // End-of-month periods have higher frequency
  const isEndOfMonth = Math.random() < 0.3;
  sleep(isEndOfMonth ? Math.random() * 0.5 + 0.2 : Math.random() * 2 + 0.5);
}
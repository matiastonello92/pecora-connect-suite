import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// Custom metrics
export const errorRate = new Rate('errors');
export const responseTime = new Trend('response_time');
export const requestCount = new Counter('request_count');

// Test configuration
export const options = {
  stages: [
    { duration: '2m', target: 100 }, // Ramp up
    { duration: '5m', target: 100 }, // Stay at 100 users
    { duration: '2m', target: 500 }, // Ramp up to 500
    { duration: '5m', target: 500 }, // Stay at 500 users
    { duration: '2m', target: 1000 }, // Ramp up to 1000
    { duration: '10m', target: 1000 }, // Stay at 1000 users
    { duration: '5m', target: 0 }, // Ramp down
  ],
  thresholds: {
    'errors': ['rate<0.1'], // Error rate should be less than 10%
    'response_time': ['p(95)<2000'], // 95% of requests should be under 2s
    'http_req_duration': ['p(99)<5000'], // 99% of requests should be under 5s
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

export default function() {
  group('Authentication API Tests', function() {
    
    // Test 1: Get active locations
    group('Get Active Locations', function() {
      const response = http.post(`${BASE_URL}/rest/v1/rpc/get_active_locations`, 
        JSON.stringify({}), 
        { headers }
      );
      
      requestCount.add(1);
      responseTime.add(response.timings.duration);
      
      const success = check(response, {
        'status is 200': (r) => r.status === 200,
        'response time < 2000ms': (r) => r.timings.duration < 2000,
        'has valid response': (r) => r.body && r.body.length > 0,
      });
      
      if (!success) {
        errorRate.add(1);
      }
    });

    // Test 2: Validate user locations
    group('Validate User Locations', function() {
      const testUserId = '00000000-0000-0000-0000-000000000000';
      const response = http.post(`${BASE_URL}/rest/v1/rpc/validate_user_locations_batch`, 
        JSON.stringify({
          target_user_id: testUserId,
          location_codes: ['menton', 'lyon', 'paris']
        }), 
        { headers }
      );
      
      requestCount.add(1);
      responseTime.add(response.timings.duration);
      
      const success = check(response, {
        'status is 200 or 400': (r) => [200, 400].includes(r.status),
        'response time < 1500ms': (r) => r.timings.duration < 1500,
      });
      
      if (!success) {
        errorRate.add(1);
      }
    });

    // Test 3: Get location system health
    group('Location System Health Check', function() {
      const response = http.post(`${BASE_URL}/rest/v1/rpc/validate_location_system_health`, 
        JSON.stringify({}), 
        { headers }
      );
      
      requestCount.add(1);
      responseTime.add(response.timings.duration);
      
      const success = check(response, {
        'status is 200': (r) => r.status === 200,
        'response time < 3000ms': (r) => r.timings.duration < 3000,
        'returns health data': (r) => r.body && JSON.parse(r.body).length >= 0,
      });
      
      if (!success) {
        errorRate.add(1);
      }
    });

  });

  // Random sleep between 1-3 seconds
  sleep(Math.random() * 2 + 1);
}
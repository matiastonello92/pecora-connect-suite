/**
 * k6 Load Testing Script for Location Management System
 * 
 * Tests 100,000 concurrent users across multiple scenarios:
 * - Location hierarchy fetching (10,000+ records)
 * - Location switching performance
 * - Dashboard data loading
 * - Real-time chat connections
 * 
 * Usage: k6 run --vus 1000 --duration 15m k6-load-test.js
 */

import http from 'k6/http';
import ws from 'k6/ws';
import { check, sleep, fail } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';
import { randomString, randomIntBetween } from 'https://jslib.k6.io/k6-utils/1.4.0/index.js';

// Custom metrics for detailed performance tracking
const locationFetchTime = new Trend('location_fetch_duration');
const locationSwitchTime = new Trend('location_switch_duration');
const dashboardLoadTime = new Trend('dashboard_load_duration');
const chatLatency = new Trend('chat_latency');
const chatConnectionRate = new Rate('chat_connection_success');
const apiErrorRate = new Rate('api_errors');
const locationSwitchSuccessRate = new Rate('location_switch_success');
const dashboardLoadSuccessRate = new Rate('dashboard_load_success');

// Test configuration
export const options = {
  stages: [
    // Ramp-up phase: 1,000 to 100,000 users over 5 minutes
    { duration: '1m', target: 5000 },   // Quick initial ramp
    { duration: '2m', target: 25000 },  // Moderate increase
    { duration: '2m', target: 100000 }, // Reach peak load
    
    // Sustain phase: Hold 100,000 users for 10 minutes
    { duration: '10m', target: 100000 },
    
    // Ramp-down phase: Graceful decrease
    { duration: '2m', target: 0 },
  ],
  
  // Performance thresholds - Success criteria
  thresholds: {
    // Overall performance requirements
    'http_req_duration': ['p(95)<200'], // 95% of requests under 200ms
    'http_req_failed': ['rate<0.001'],  // 99.9% success rate
    
    // Specific endpoint thresholds
    'location_fetch_duration': ['p(95)<200', 'p(99)<500'],
    'location_switch_duration': ['p(95)<100', 'p(99)<150'],
    'dashboard_load_duration': ['p(95)<300', 'p(99)<500'],
    'chat_latency': ['p(95)<150', 'p(99)<250'],
    
    // Success rate thresholds
    'chat_connection_success': ['rate>0.999'],
    'location_switch_success': ['rate>0.999'],
    'dashboard_load_success': ['rate>0.999'],
    'api_errors': ['rate<0.001'],
  },
  
  // Resource limits
  noVUConnectionReuse: false,
  userAgent: 'k6-load-test/1.0.0',
  
  // Batch requests for better performance
  batch: 10,
  batchPerHost: 5,
};

// Configuration - Update these URLs for your environment
const config = {
  // Base API URL - Update for your environment
  baseUrl: __ENV.API_BASE_URL || 'https://cqlbidkagiknfplzbwse.supabase.co',
  
  // WebSocket URL for chat testing
  wsUrl: __ENV.WS_URL || 'wss://cqlbidkagiknfplzbwse.supabase.co',
  
  // Authentication
  apiKey: __ENV.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNxbGJpZGthZ2lrbmZwbHpid3NlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM1MzIwNjIsImV4cCI6MjA2OTEwODA2Mn0.U28s4yA5d9nLhnr7q-OcfYx6vfjquqXG8c7kOSXz1FA',
  
  // Test auth token (you'll need to provide a valid JWT token)
  authToken: __ENV.AUTH_TOKEN || '',
};

// Sample location data for testing
const testLocations = [
  'test_country_1', 'test_country_2', 'test_country_3',
  'test_region_1', 'test_region_2', 'test_region_11',
  'test_city_1', 'test_city_2', 'test_city_100', 'test_city_1000',
  'menton', 'lyon' // Existing test locations
];

// Common headers for API requests
function getHeaders(includeAuth = true) {
  const headers = {
    'Content-Type': 'application/json',
    'apikey': config.apiKey,
    'accept-profile': 'public',
  };
  
  if (includeAuth && config.authToken) {
    headers['authorization'] = `Bearer ${config.authToken}`;
  }
  
  return headers;
}

// Test scenario 1: Fetch location hierarchy (10,000+ records)
function testLocationHierarchyFetch() {
  const startTime = Date.now();
  
  // Test fetching all active locations
  const response = http.get(`${config.baseUrl}/rest/v1/locations?is_active=eq.true&select=*&limit=10000`, {
    headers: getHeaders(),
    tags: { name: 'location_hierarchy_fetch' },
  });
  
  const duration = Date.now() - startTime;
  locationFetchTime.add(duration);
  
  const success = check(response, {
    'location fetch status is 200': (r) => r.status === 200,
    'location fetch response time < 200ms': (r) => r.timings.duration < 200,
    'location fetch has data': (r) => {
      try {
        const data = JSON.parse(r.body);
        return Array.isArray(data) && data.length > 0;
      } catch {
        return false;
      }
    },
  });
  
  if (!success) {
    apiErrorRate.add(1);
  }
  
  return response;
}

// Test scenario 2: Location switching performance
function testLocationSwitch() {
  const randomLocation = testLocations[randomIntBetween(0, testLocations.length - 1)];
  const startTime = Date.now();
  
  // Simulate location switch via user location data fetch
  const response = http.post(`${config.baseUrl}/rest/v1/rpc/get_user_location_data`, 
    JSON.stringify({
      target_user_id: '80e7a510-f277-4879-b0f0-f89d08682ece', // Test user ID
      location_codes: [randomLocation]
    }), {
      headers: getHeaders(),
      tags: { name: 'location_switch' },
    }
  );
  
  const duration = Date.now() - startTime;
  locationSwitchTime.add(duration);
  
  const success = check(response, {
    'location switch status is 200': (r) => r.status === 200,
    'location switch response time < 100ms': (r) => r.timings.duration < 100,
    'location switch has valid response': (r) => {
      try {
        const data = JSON.parse(r.body);
        return Array.isArray(data);
      } catch {
        return false;
      }
    },
  });
  
  locationSwitchSuccessRate.add(success);
  
  if (!success) {
    apiErrorRate.add(1);
  }
  
  return response;
}

// Test scenario 3: Dashboard data loading
function testDashboardLoad(locationId) {
  const startTime = Date.now();
  
  // Simulate multiple dashboard data requests in parallel
  const requests = [
    // Cash closures
    {
      method: 'GET',
      url: `${config.baseUrl}/rest/v1/cash_closures?location=eq.${locationId}&order=created_at.desc&limit=50`,
      params: { headers: getHeaders(), tags: { name: 'dashboard_cash_closures' } }
    },
    // Equipment
    {
      method: 'GET', 
      url: `${config.baseUrl}/rest/v1/equipment?location=eq.${locationId}&order=created_at.desc`,
      params: { headers: getHeaders(), tags: { name: 'dashboard_equipment' } }
    },
    // Monthly inventories
    {
      method: 'GET',
      url: `${config.baseUrl}/rest/v1/monthly_inventories?location=eq.${locationId}&order=created_at.desc&limit=20`,
      params: { headers: getHeaders(), tags: { name: 'dashboard_inventories' } }
    },
    // Optimized location data
    {
      method: 'POST',
      url: `${config.baseUrl}/rest/v1/rpc/get_location_aware_data`,
      body: JSON.stringify({
        target_user_id: '80e7a510-f277-4879-b0f0-f89d08682ece',
        table_name: 'equipment',
        location_codes: [locationId]
      }),
      params: { headers: getHeaders(), tags: { name: 'dashboard_location_data' } }
    }
  ];
  
  const responses = http.batch(requests);
  const duration = Date.now() - startTime;
  dashboardLoadTime.add(duration);
  
  let allSuccess = true;
  responses.forEach((response, index) => {
    const success = check(response, {
      [`dashboard request ${index} status is 200`]: (r) => r.status === 200,
      [`dashboard request ${index} response time acceptable`]: (r) => r.timings.duration < 300,
    });
    
    if (!success) {
      allSuccess = false;
      apiErrorRate.add(1);
    }
  });
  
  dashboardLoadSuccessRate.add(allSuccess);
  
  return responses;
}

// Test scenario 4: Real-time chat connection
function testChatConnection(locationId) {
  const startTime = Date.now();
  let connectionSuccess = false;
  
  // Test WebSocket connection for chat
  const response = ws.connect(`${config.wsUrl}/realtime/v1/websocket?apikey=${config.apiKey}`, {
    tags: { name: 'chat_websocket' },
  }, function (socket) {
    
    socket.on('open', function () {
      const latency = Date.now() - startTime;
      chatLatency.add(latency);
      connectionSuccess = true;
      
      // Send initial chat join message
      socket.send(JSON.stringify({
        topic: `realtime:public:chats:location=eq.${locationId}`,
        event: 'phx_join',
        payload: {},
        ref: randomString(10)
      }));
      
      // Simulate some chat activity
      setTimeout(() => {
        socket.send(JSON.stringify({
          topic: `realtime:public:chat_messages`,
          event: 'INSERT',
          payload: {
            content: `Test message from VU ${__VU}`,
            chat_id: randomString(36),
            sender_id: '80e7a510-f277-4879-b0f0-f89d08682ece'
          },
          ref: randomString(10)
        }));
      }, 100);
      
      // Close connection after short activity
      setTimeout(() => {
        socket.close();
      }, randomIntBetween(1000, 3000));
    });
    
    socket.on('message', function (data) {
      try {
        const message = JSON.parse(data);
        check(message, {
          'chat message is valid': (msg) => msg.topic !== undefined,
        });
      } catch (e) {
        // Invalid JSON message
      }
    });
    
    socket.on('error', function (e) {
      console.error('WebSocket error:', e);
      connectionSuccess = false;
    });
  });
  
  chatConnectionRate.add(connectionSuccess);
  
  return response;
}

// User scenarios - Different user behavior patterns
export default function () {
  const userType = randomIntBetween(1, 4);
  const locationId = testLocations[randomIntBetween(0, testLocations.length - 1)];
  
  switch (userType) {
    case 1: // Heavy dashboard user
      testLocationHierarchyFetch();
      sleep(0.5);
      testDashboardLoad(locationId);
      sleep(1);
      testLocationSwitch();
      break;
      
    case 2: // Chat-focused user  
      testLocationHierarchyFetch();
      sleep(0.2);
      testChatConnection(locationId);
      sleep(2);
      testLocationSwitch();
      break;
      
    case 3: // Location switcher
      testLocationHierarchyFetch();
      sleep(0.3);
      for (let i = 0; i < 3; i++) {
        testLocationSwitch();
        sleep(0.5);
      }
      testDashboardLoad(locationId);
      break;
      
    case 4: // Mixed usage
      testLocationHierarchyFetch();
      sleep(0.2);
      testLocationSwitch();
      sleep(0.3);
      testDashboardLoad(locationId);
      sleep(0.5);
      testChatConnection(locationId);
      break;
  }
  
  // Random sleep to simulate real user behavior
  sleep(randomIntBetween(1, 5));
}

// Setup function - runs once before the test starts
export function setup() {
  console.log('🚀 Starting Location Management System Load Test');
  console.log(`📊 Testing with up to 100,000 concurrent users`);
  console.log(`🎯 Target endpoints: ${config.baseUrl}`);
  console.log(`⚡ WebSocket endpoint: ${config.wsUrl}`);
  
  // Verify API is accessible
  const response = http.get(`${config.baseUrl}/rest/v1/locations?limit=1`, {
    headers: getHeaders(false),
  });
  
  if (response.status !== 200) {
    fail(`API not accessible. Status: ${response.status}`);
  }
  
  console.log('✅ API connectivity verified');
  return {};
}

// Teardown function - runs after the test completes
export function teardown(data) {
  console.log('🏁 Load test completed');
  console.log('📈 Check the detailed metrics above for performance analysis');
}

// Handle summary - Custom summary formatting
export function handleSummary(data) {
  const summary = {
    'stdout': textSummary(data, { indent: ' ', enableColors: true }),
    'summary.json': JSON.stringify(data, null, 2),
    'summary.html': htmlReport(data),
  };
  
  return summary;
}

// Text summary helper
function textSummary(data, options = {}) {
  const indent = options.indent || '';
  const colors = options.enableColors || false;
  
  let output = '\n';
  output += `${indent}📊 Location Management System Load Test Results\n`;
  output += `${indent}================================================\n\n`;
  
  // Test execution summary
  output += `${indent}Test Duration: ${data.state.testRunDurationMs}ms\n`;
  output += `${indent}Total VUs: ${data.metrics.vus_max.values.max}\n`;
  output += `${indent}Total Requests: ${data.metrics.http_reqs.values.count}\n`;
  output += `${indent}Request Rate: ${data.metrics.http_reqs.values.rate.toFixed(2)}/s\n\n`;
  
  // Performance metrics
  output += `${indent}🎯 Performance Metrics:\n`;
  output += `${indent}  Location Fetch (p95): ${data.metrics.location_fetch_duration?.values.p95?.toFixed(2) || 'N/A'}ms\n`;
  output += `${indent}  Location Switch (p95): ${data.metrics.location_switch_duration?.values.p95?.toFixed(2) || 'N/A'}ms\n`;
  output += `${indent}  Dashboard Load (p95): ${data.metrics.dashboard_load_duration?.values.p95?.toFixed(2) || 'N/A'}ms\n`;
  output += `${indent}  Chat Latency (p95): ${data.metrics.chat_latency?.values.p95?.toFixed(2) || 'N/A'}ms\n\n`;
  
  // Success rates
  output += `${indent}✅ Success Rates:\n`;
  output += `${indent}  Overall Success: ${((1 - (data.metrics.http_req_failed?.values.rate || 0)) * 100).toFixed(2)}%\n`;
  output += `${indent}  Location Switch: ${((data.metrics.location_switch_success?.values.rate || 0) * 100).toFixed(2)}%\n`;
  output += `${indent}  Dashboard Load: ${((data.metrics.dashboard_load_success?.values.rate || 0) * 100).toFixed(2)}%\n`;
  output += `${indent}  Chat Connections: ${((data.metrics.chat_connection_success?.values.rate || 0) * 100).toFixed(2)}%\n\n`;
  
  return output;
}

// HTML report helper (basic implementation)
function htmlReport(data) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Load Test Results</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .metric { margin: 10px 0; padding: 10px; background: #f5f5f5; border-radius: 5px; }
        .success { color: green; }
        .warning { color: orange; }
        .error { color: red; }
      </style>
    </head>
    <body>
      <h1>Location Management System Load Test Results</h1>
      <div class="metric">
        <h3>Test Summary</h3>
        <p>Duration: ${data.state.testRunDurationMs}ms</p>
        <p>Total Requests: ${data.metrics.http_reqs.values.count}</p>
        <p>Request Rate: ${data.metrics.http_reqs.values.rate.toFixed(2)}/s</p>
      </div>
      <div class="metric">
        <h3>Performance Metrics</h3>
        <p>Location Fetch (p95): ${data.metrics.location_fetch_duration?.values.p95?.toFixed(2) || 'N/A'}ms</p>
        <p>Location Switch (p95): ${data.metrics.location_switch_duration?.values.p95?.toFixed(2) || 'N/A'}ms</p>
        <p>Dashboard Load (p95): ${data.metrics.dashboard_load_duration?.values.p95?.toFixed(2) || 'N/A'}ms</p>
        <p>Chat Latency (p95): ${data.metrics.chat_latency?.values.p95?.toFixed(2) || 'N/A'}ms</p>
      </div>
    </body>
    </html>
  `;
}
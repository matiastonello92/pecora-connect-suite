import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';
import { SharedArray } from 'k6/data';

// Custom metrics for comprehensive system testing
export const systemErrorRate = new Rate('system_errors');
export const authResponseTime = new Trend('auth_response_time');
export const chatResponseTime = new Trend('chat_response_time');
export const inventoryResponseTime = new Trend('inventory_response_time');
export const dbOperationTime = new Trend('db_operation_time');
export const totalOperations = new Counter('total_operations');

// Extreme load configuration for full system stress test
export const options = {
  stages: [
    { duration: '2m', target: 500 }, // Warm up
    { duration: '5m', target: 2500 }, // Build up
    { duration: '3m', target: 7500 }, // High load
    { duration: '5m', target: 15000 }, // Peak load
    { duration: '2m', target: 25000 }, // Extreme peak
    { duration: '3m', target: 50000 }, // Maximum stress
    { duration: '5m', target: 100000 }, // Ultimate stress test
    { duration: '5m', target: 0 }, // Cool down
  ],
  thresholds: {
    'system_errors': ['rate<0.15'], // Less than 15% errors under extreme load
    'auth_response_time': ['p(95)<3000'], // 95% auth under 3s
    'chat_response_time': ['p(95)<2000'], // 95% chat under 2s
    'inventory_response_time': ['p(90)<4000'], // 90% inventory under 4s
    'db_operation_time': ['p(99)<10000'], // 99% DB ops under 10s
    'http_req_duration': ['p(99)<15000'], // 99% under 15s
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

// Test data pools
const locations = ['menton', 'lyon', 'paris', 'marseille', 'nice', 'cannes', 'antibes', 'grasse'];
const departments = ['kitchen', 'bar', 'dining', 'reception', 'management', 'storage'];
const userRoles = ['super_admin', 'manager', 'staff', 'trainee'];
const chatMessages = [
  'System status update required',
  'Inventory check needed urgently',
  'Equipment maintenance scheduled',
  'New staff orientation tomorrow',
  'Monthly reports due today',
  'Customer feedback review',
  'Safety protocol update',
  'Training session at 3 PM'
];

export default function() {
  const location = locations[Math.floor(Math.random() * locations.length)];
  const department = departments[Math.floor(Math.random() * departments.length)];
  const role = userRoles[Math.floor(Math.random() * userRoles.length)];
  const message = chatMessages[Math.floor(Math.random() * chatMessages.length)];
  
  // Distribute load across different system components
  const testComponent = Math.random();
  
  group('Full System Stress Test', function() {
    
    if (testComponent < 0.3) {
      // 30% - Authentication & User Management Load
      group('Authentication System Load', function() {
        const startTime = Date.now();
        
        // Test user profile operations
        const profileResponse = http.get(`${BASE_URL}/rest/v1/profiles?select=*&limit=50`, { headers });
        authResponseTime.add(Date.now() - startTime);
        totalOperations.add(1);
        
        const authSuccess = check(profileResponse, {
          'profiles loaded': (r) => r.status === 200,
          'auth response acceptable': (r) => r.timings.duration < 5000,
        });
        
        if (!authSuccess) systemErrorRate.add(1);
        
        // Test location validation
        const locationValidation = http.post(`${BASE_URL}/rest/v1/rpc/validate_user_locations_batch`, 
          JSON.stringify({
            target_user_id: '00000000-0000-0000-0000-000000000000',
            location_codes: [location]
          }), 
          { headers }
        );
        
        authResponseTime.add(locationValidation.timings.duration);
        totalOperations.add(1);
        
        if (!check(locationValidation, { 'location validation ok': (r) => [200, 400].includes(r.status) })) {
          systemErrorRate.add(1);
        }
      });
      
    } else if (testComponent < 0.6) {
      // 30% - Chat & Communication Systems
      group('Chat System Heavy Load', function() {
        const startTime = Date.now();
        
        // Load chat lists
        const chatsResponse = http.get(`${BASE_URL}/rest/v1/chats?location=eq.${location}&select=*`, { headers });
        chatResponseTime.add(Date.now() - startTime);
        totalOperations.add(1);
        
        const chatSuccess = check(chatsResponse, {
          'chats loaded': (r) => r.status === 200,
          'chat response time ok': (r) => r.timings.duration < 3000,
        });
        
        if (!chatSuccess) systemErrorRate.add(1);
        
        // Load recent messages
        const messagesResponse = http.get(`${BASE_URL}/rest/v1/chat_messages?select=*&order=created_at.desc&limit=100`, { headers });
        chatResponseTime.add(messagesResponse.timings.duration);
        totalOperations.add(1);
        
        // Test notification queries
        const notificationsResponse = http.get(`${BASE_URL}/rest/v1/notifications?select=*&limit=20`, { headers });
        chatResponseTime.add(notificationsResponse.timings.duration);
        totalOperations.add(1);
        
        if (!check(messagesResponse, { 'messages loaded': (r) => r.status === 200 }) ||
            !check(notificationsResponse, { 'notifications loaded': (r) => r.status === 200 })) {
          systemErrorRate.add(1);
        }
      });
      
    } else {
      // 40% - Inventory & Business Operations
      group('Business Operations Heavy Load', function() {
        const startTime = Date.now();
        
        // Complex inventory queries
        const inventoryResponse = http.get(
          `${BASE_URL}/rest/v1/monthly_inventories?location=eq.${location}&select=*,monthly_inventory_items(*)&order=created_at.desc&limit=25`, 
          { headers }
        );
        inventoryResponseTime.add(Date.now() - startTime);
        totalOperations.add(1);
        
        const invSuccess = check(inventoryResponse, {
          'inventory loaded': (r) => r.status === 200,
          'inventory response time': (r) => r.timings.duration < 6000,
        });
        
        if (!invSuccess) systemErrorRate.add(1);
        
        // Equipment management
        const equipmentResponse = http.get(`${BASE_URL}/rest/v1/equipment?location=eq.${location}&select=*`, { headers });
        inventoryResponseTime.add(equipmentResponse.timings.duration);
        totalOperations.add(1);
        
        // Supplier operations
        const suppliersResponse = http.get(`${BASE_URL}/rest/v1/suppliers?location=eq.${location}&select=*`, { headers });
        inventoryResponseTime.add(suppliersResponse.timings.duration);
        totalOperations.add(1);
        
        // Cash closure operations
        const cashResponse = http.get(`${BASE_URL}/rest/v1/cash_closures?location=eq.${location}&select=*&limit=10`, { headers });
        inventoryResponseTime.add(cashResponse.timings.duration);
        totalOperations.add(1);
        
        if (!check(equipmentResponse, { 'equipment loaded': (r) => r.status === 200 }) ||
            !check(suppliersResponse, { 'suppliers loaded': (r) => r.status === 200 }) ||
            !check(cashResponse, { 'cash closures loaded': (r) => r.status === 200 })) {
          systemErrorRate.add(1);
        }
      });
    }
    
    // Additional stress operations for extreme load
    if (__VU % 10 === 0) { // Every 10th user does heavy DB operations
      group('Heavy Database Operations', function() {
        const dbStart = Date.now();
        
        // Complex RPC calls
        const healthCheck = http.post(`${BASE_URL}/rest/v1/rpc/validate_location_system_health`, 
          JSON.stringify({}), { headers });
        
        const locationData = http.post(`${BASE_URL}/rest/v1/rpc/get_location_aware_data`, 
          JSON.stringify({
            target_user_id: '00000000-0000-0000-0000-000000000000',
            table_name: 'monthly_inventories',
            location_codes: [location]
          }), 
          { headers });
        
        dbOperationTime.add(Date.now() - dbStart);
        totalOperations.add(2);
        
        if (!check(healthCheck, { 'health check ok': (r) => r.status === 200 }) ||
            !check(locationData, { 'location data ok': (r) => [200, 400].includes(r.status) })) {
          systemErrorRate.add(1);
        }
      });
    }
    
    // Burst operations for stress testing
    if (__VU % 50 === 0) { // Every 50th user simulates burst activity
      group('Burst Activity Simulation', function() {
        for (let i = 0; i < 5; i++) {
          const burstResponse = http.get(`${BASE_URL}/rest/v1/locations?select=*&is_active=eq.true`, { headers });
          totalOperations.add(1);
          
          if (!check(burstResponse, { 'burst request ok': (r) => r.status === 200 })) {
            systemErrorRate.add(1);
          }
          
          sleep(0.1); // Small delay between burst requests
        }
      });
    }
    
  });

  // Dynamic sleep based on load level
  const currentVUs = __VU;
  if (currentVUs < 1000) {
    sleep(Math.random() * 2 + 0.5);
  } else if (currentVUs < 10000) {
    sleep(Math.random() * 1 + 0.2);
  } else if (currentVUs < 50000) {
    sleep(Math.random() * 0.5 + 0.1);
  } else {
    sleep(Math.random() * 0.2); // Minimal sleep for extreme load
  }
}
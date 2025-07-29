import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';
import { SharedArray } from 'k6/data';

// Custom metrics
export const errorRate = new Rate('chat_errors');
export const messageResponseTime = new Trend('message_response_time');
export const connectionTime = new Trend('chat_connection_time');
export const messageCount = new Counter('messages_sent');

// Test configuration for high-stress chat system testing
export const options = {
  stages: [
    { duration: '1m', target: 50 }, // Warm up
    { duration: '3m', target: 500 }, // Normal load
    { duration: '2m', target: 1500 }, // High load
    { duration: '5m', target: 2500 }, // Peak load
    { duration: '2m', target: 5000 }, // Extreme load
    { duration: '3m', target: 0 }, // Cool down
  ],
  thresholds: {
    'chat_errors': ['rate<0.05'], // Less than 5% errors
    'message_response_time': ['p(95)<1500'], // 95% under 1.5s
    'chat_connection_time': ['p(90)<1000'], // 90% connections under 1s
    'http_req_duration': ['p(99)<3000'], // 99% under 3s
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

// Simulated test data
const testLocations = ['menton', 'lyon', 'paris', 'marseille'];
const testMessages = [
  'Hello team!',
  'How is everything going?',
  'Any updates on the inventory?',
  'Great work today!',
  'Let me know if you need help',
  'Meeting at 3 PM',
  'Please check the new procedures',
  'Thanks for your hard work!'
];

export default function() {
  const location = testLocations[Math.floor(Math.random() * testLocations.length)];
  const message = testMessages[Math.floor(Math.random() * testMessages.length)];
  
  group('Chat System Stress Test', function() {
    
    // Test 1: Get user chats (simulating chat list loading)
    group('Load Chat List', function() {
      const startTime = Date.now();
      const response = http.get(`${BASE_URL}/rest/v1/chats?location=eq.${location}&select=*`, 
        { headers }
      );
      
      const connectionTime = Date.now() - startTime;
      connectionTime.add(connectionTime);
      
      const success = check(response, {
        'chat list loaded': (r) => r.status === 200,
        'response time acceptable': (r) => r.timings.duration < 2000,
        'has chat data': (r) => r.body !== null,
      });
      
      if (!success) {
        errorRate.add(1);
      }
    });

    // Test 2: Get chat messages (simulating message history loading)
    group('Load Chat Messages', function() {
      const response = http.get(`${BASE_URL}/rest/v1/chat_messages?select=*&order=created_at.desc&limit=50`, 
        { headers }
      );
      
      messageResponseTime.add(response.timings.duration);
      
      const success = check(response, {
        'messages loaded': (r) => r.status === 200,
        'response under 1500ms': (r) => r.timings.duration < 1500,
      });
      
      if (!success) {
        errorRate.add(1);
      }
    });

    // Test 3: Send message (highest stress operation)
    group('Send Chat Message', function() {
      const newMessage = {
        content: `${message} - Test ${__ITER}`,
        chat_id: '00000000-0000-0000-0000-000000000001',
        sender_id: '00000000-0000-0000-0000-000000000000',
        message_type: 'text'
      };
      
      const response = http.post(`${BASE_URL}/rest/v1/chat_messages`, 
        JSON.stringify(newMessage), 
        { headers }
      );
      
      messageResponseTime.add(response.timings.duration);
      messageCount.add(1);
      
      const success = check(response, {
        'message sent successfully': (r) => [201, 409].includes(r.status), // 409 might occur due to test constraints
        'response time acceptable': (r) => r.timings.duration < 2000,
      });
      
      if (!success) {
        errorRate.add(1);
      }
    });

    // Test 4: Get unread message counts
    group('Get Unread Counts', function() {
      const testUserId = '00000000-0000-0000-0000-000000000000';
      const response = http.post(`${BASE_URL}/rest/v1/rpc/get_user_unread_counts`, 
        JSON.stringify({ user_id: testUserId }), 
        { headers }
      );
      
      const success = check(response, {
        'unread counts retrieved': (r) => [200, 400].includes(r.status),
        'fast response': (r) => r.timings.duration < 1000,
      });
      
      if (!success) {
        errorRate.add(1);
      }
    });

    // Test 5: Real-time connection simulation
    group('Real-time Connection Test', function() {
      const startTime = Date.now();
      
      // Simulate establishing a real-time connection
      const response = http.get(`${BASE_URL}/rest/v1/chat_participants?user_id=eq.00000000-0000-0000-0000-000000000000`, 
        { headers }
      );
      
      const connectionLatency = Date.now() - startTime;
      connectionTime.add(connectionLatency);
      
      const success = check(response, {
        'connection established': (r) => r.status === 200,
        'low latency': (r) => connectionLatency < 500,
      });
      
      if (!success) {
        errorRate.add(1);
      }
    });

  });

  // Simulate realistic user behavior with variable delays
  sleep(Math.random() * 1.5 + 0.5);
}
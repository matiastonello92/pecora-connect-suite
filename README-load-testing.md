# Location Management System Load Testing

This directory contains comprehensive k6 load testing scripts designed to simulate 100,000 concurrent users interacting with the location management system API.

## 🎯 Test Coverage

The load test simulates real-world usage patterns across four critical endpoints:

1. **GET /locations** - Location hierarchy fetching (10,000+ records)
2. **POST /location-switch** - Active location switching (target: <100ms)
3. **GET /dashboard/:location_id** - Dashboard data loading (target: <300ms)  
4. **WS /chat/:location_id** - Real-time chat connections (target: <150ms latency)

## 📊 Performance Targets

### Success Criteria
- **Query time**: <200ms (95th percentile)
- **Location switch**: <100ms (95th percentile)
- **Dashboard load**: <300ms (95th percentile)
- **Chat latency**: <150ms (95th percentile)
- **Success rate**: 99.9% for all operations

### Load Profile
- **Ramp-up**: 1,000 → 100,000 users over 5 minutes
- **Sustain**: 100,000 users for 10 minutes
- **Ramp-down**: 100,000 → 0 users over 2 minutes
- **Total duration**: ~15 minutes

## 🚀 Quick Start

### Prerequisites

1. **Install k6**:
   ```bash
   # macOS
   brew install k6
   
   # Ubuntu/Debian
   sudo gpg -k
   sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
   echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
   sudo apt-get update
   sudo apt-get install k6
   
   # Windows
   choco install k6
   ```

2. **Set environment variables**:
   ```bash
   export API_BASE_URL="https://your-api-domain.com"
   export SUPABASE_ANON_KEY="your-supabase-anon-key"
   export AUTH_TOKEN="your-jwt-token"  # Optional for authenticated tests
   ```

### Running Tests

#### Option 1: Using the Helper Script (Recommended)

```bash
# Make the script executable
chmod +x run-load-test.sh

# Quick validation (10 users, 30 seconds)
./run-load-test.sh validate

# Full load test (100,000 users, 15 minutes)
./run-load-test.sh full

# Custom test (5,000 users, 10 minutes)
./run-load-test.sh custom 5000 10m

# Analyze latest results
./run-load-test.sh analyze
```

#### Option 2: Direct k6 Commands

```bash
# Quick validation test
k6 run --vus 10 --duration 30s k6-load-test.js

# Full load test
k6 run --vus 1000 --duration 15m k6-load-test.js

# Custom configuration
k6 run --vus 5000 --duration 10m k6-load-test.js
```

#### Option 3: Docker Compose (Isolated Environment)

```bash
# Run with monitoring stack (InfluxDB + Grafana)
docker-compose -f docker-compose.k6.yml up --build

# Access Grafana dashboard at http://localhost:3000
# Username: admin, Password: admin
```

## 📁 File Structure

```
├── k6-load-test.js           # Main load test script
├── k6-test-config.json       # Alternative scenario configuration
├── docker-compose.k6.yml     # Docker setup with monitoring
├── run-load-test.sh          # Helper script for easy test execution
├── README-load-testing.md    # This documentation
└── k6-results/              # Test results directory (auto-created)
    ├── validation-results.json
    ├── full-load-test-*.json
    └── custom-test-*.json
```

## 🧪 Test Scenarios

The load test includes four distinct user behavior patterns:

### 1. Heavy Dashboard User (25% of users)
- Fetches location hierarchy
- Loads dashboard data extensively
- Switches locations occasionally
- **Focus**: Dashboard performance under load

### 2. Chat-Focused User (25% of users)  
- Establishes WebSocket connections
- Maintains persistent chat connections
- Minimal location switching
- **Focus**: Real-time connection stability

### 3. Location Switcher (25% of users)
- Frequently changes active location
- Tests location switching performance
- Moderate dashboard usage
- **Focus**: Location switch responsiveness

### 4. Mixed Usage (25% of users)
- Balanced usage across all features
- Realistic user behavior simulation
- **Focus**: Overall system resilience

## 📈 Metrics and Monitoring

### Key Performance Indicators (KPIs)

The test tracks detailed metrics for each endpoint:

- **Response Time Percentiles**: p50, p95, p99
- **Throughput**: Requests per second
- **Error Rates**: Failed requests percentage
- **Success Rates**: Feature-specific success metrics
- **Resource Utilization**: Connection pooling efficiency

### Custom Metrics

- `location_fetch_duration`: Time to fetch location hierarchy
- `location_switch_duration`: Location switching performance
- `dashboard_load_duration`: Dashboard loading time
- `chat_latency`: WebSocket connection establishment time
- `chat_connection_success`: Chat connection success rate

### Result Analysis

Results are automatically saved in multiple formats:

- **JSON**: Machine-readable detailed metrics
- **CSV**: Spreadsheet-compatible format
- **HTML**: Human-readable summary report
- **Console**: Real-time progress and summary

## ⚙️ Configuration Options

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `API_BASE_URL` | Base URL for API endpoints | Supabase URL |
| `WS_URL` | WebSocket endpoint for chat | Supabase WS URL |
| `SUPABASE_ANON_KEY` | Supabase anonymous key | Required |
| `AUTH_TOKEN` | JWT token for authenticated requests | Optional |

### Test Parameters

Modify these in `k6-load-test.js`:

```javascript
// Adjust load profile
export const options = {
  stages: [
    { duration: '2m', target: 50000 },  // Faster ramp-up
    { duration: '5m', target: 50000 },  // Shorter sustain
    { duration: '1m', target: 0 },      // Quick ramp-down
  ],
  
  // Adjust thresholds
  thresholds: {
    'http_req_duration': ['p(95)<150'],  // Stricter timing
    'http_req_failed': ['rate<0.0001'],  // Higher success rate
  },
};
```

## 🔧 Troubleshooting

### Common Issues

1. **Connection Refused**
   ```
   Error: dial tcp: connect: connection refused
   ```
   - **Solution**: Verify API_BASE_URL is correct and accessible

2. **Authentication Errors**
   ```
   Error: 401 Unauthorized
   ```
   - **Solution**: Check SUPABASE_ANON_KEY and AUTH_TOKEN variables

3. **Rate Limiting**
   ```
   Error: 429 Too Many Requests
   ```
   - **Solution**: Reduce concurrent users or add delays between requests

4. **Memory Issues**
   ```
   Error: insufficient memory
   ```
   - **Solution**: Reduce VUs or use multiple test machines

### Performance Tuning

1. **Increase system limits**:
   ```bash
   # Increase file descriptor limit
   ulimit -n 65536
   
   # Increase network buffer sizes
   sudo sysctl -w net.core.rmem_max=134217728
   sudo sysctl -w net.core.wmem_max=134217728
   ```

2. **k6 optimization**:
   ```bash
   # Disable verbose logging for better performance
   k6 run --quiet k6-load-test.js
   
   # Use multiple output formats
   k6 run --out json=results.json --out csv=results.csv k6-load-test.js
   ```

## 📋 Best Practices

### Before Running Tests

1. **Coordinate with your team**: Inform stakeholders about the test schedule
2. **Monitor resources**: Ensure sufficient infrastructure capacity
3. **Backup data**: Consider data safety during high-load testing
4. **Start small**: Begin with validation tests before full load

### During Tests

1. **Monitor system resources**: CPU, memory, network, database
2. **Watch for bottlenecks**: Database connections, API rate limits
3. **Check logs**: Application and infrastructure logs for errors
4. **Be ready to stop**: Have a plan to abort if issues arise

### After Tests

1. **Analyze results thoroughly**: Don't just look at pass/fail
2. **Compare with baselines**: Track performance over time
3. **Document findings**: Share insights with the development team
4. **Plan improvements**: Use results to guide optimization efforts

## 🎯 Success Criteria Validation

The test automatically validates performance against these criteria:

✅ **Location Hierarchy Fetching**: <200ms for 10,000+ records  
✅ **Location Switching**: <100ms response time  
✅ **Dashboard Loading**: <300ms for complete dashboard  
✅ **Chat Connections**: <150ms WebSocket establishment  
✅ **Overall Success Rate**: >99.9% for all operations  
✅ **Concurrent User Capacity**: 100,000 simultaneous users  

### Interpreting Results

- **Green metrics**: Performance meets or exceeds targets
- **Yellow metrics**: Performance close to limits (investigate)
- **Red metrics**: Performance below targets (requires optimization)

## 🔗 Integration with CI/CD

To integrate with your CI/CD pipeline:

```yaml
# GitHub Actions example
- name: Run Load Test
  run: |
    chmod +x run-load-test.sh
    ./run-load-test.sh validate
    
- name: Analyze Results
  run: ./run-load-test.sh analyze
```

## 📞 Support

For questions or issues with the load testing setup:

1. Check the troubleshooting section above
2. Review k6 documentation: https://k6.io/docs/
3. Analyze test results for specific bottlenecks
4. Consider reaching out to the development team with detailed logs

---

**Note**: This load test is designed to stress-test the system. Always run tests in a controlled environment and coordinate with your team to avoid disrupting production services.
#!/bin/bash

# Setup Test Environment for Management PN
# This script sets up a complete test environment

set -e

echo "🚀 Setting up Test Environment for Management PN..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
print_step() {
    echo -e "${BLUE}📋 Step $1: $2${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   print_error "This script should not be run as root"
   exit 1
fi

# Step 1: Prerequisites Check
print_step "1" "Checking Prerequisites"

# Check Node.js
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

NODE_VERSION=$(node -v | cut -d 'v' -f 2 | cut -d '.' -f 1)
if [ "$NODE_VERSION" -lt 18 ]; then
    print_error "Node.js version must be 18 or higher. Current: $(node -v)"
    exit 1
fi

# Check npm/yarn
if ! command -v npm &> /dev/null && ! command -v yarn &> /dev/null; then
    print_error "Neither npm nor yarn is installed."
    exit 1
fi

# Check git
if ! command -v git &> /dev/null; then
    print_error "Git is not installed."
    exit 1
fi

print_success "Prerequisites check passed"

# Step 2: Environment Configuration
print_step "2" "Setting up Environment Configuration"

# Create environment files
cat > .env.test << EOF
# Test Environment Configuration
NODE_ENV=test
VITE_ENVIRONMENT=test
VITE_API_BASE_URL=https://test.managementpn.services

# Supabase Configuration (Test Project)
VITE_SUPABASE_URL=https://TEST_PROJECT_ID.supabase.co
VITE_SUPABASE_ANON_KEY=TEST_ANON_KEY

# Feature Flags for Test
VITE_ENABLE_ANALYTICS=false
VITE_ENABLE_ERROR_REPORTING=true
VITE_ENABLE_DEBUG_MODE=true
VITE_ENABLE_PERFORMANCE_MONITORING=true

# Test-specific settings
VITE_TEST_DATA_SEED=true
VITE_MOCK_EXTERNAL_SERVICES=true
EOF

print_success "Environment configuration created (.env.test)"

# Step 3: Package.json Scripts
print_step "3" "Adding Test Environment Scripts"

# Create test build script
if [ -f "package.json" ]; then
    # Add test scripts to package.json
    npm pkg set scripts.build:test="vite build --mode test"
    npm pkg set scripts.dev:test="vite --mode test --host 0.0.0.0 --port 8081"
    npm pkg set scripts.preview:test="vite preview --mode test --port 8082"
    npm pkg set scripts.test:e2e="playwright test --config=playwright.test.config.ts"
    npm pkg set scripts.test:load="k6 run k6-load-test.js"
    npm pkg set scripts.deploy:test="./scripts/deploy-test.sh"
    
    print_success "Test scripts added to package.json"
else
    print_error "package.json not found in current directory"
    exit 1
fi

# Step 4: Vite Configuration for Test
print_step "4" "Configuring Vite for Test Environment"

cat > vite.config.test.ts << 'EOF'
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// Test-specific Vite configuration
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    host: "0.0.0.0",
    port: 8081,
    strictPort: true,
  },
  build: {
    outDir: "dist-test",
    sourcemap: true,
    minify: false, // Keep readable for debugging
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          supabase: ['@supabase/supabase-js'],
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu']
        }
      }
    }
  },
  define: {
    __TEST_ENVIRONMENT__: true,
    __BUILD_TIME__: JSON.stringify(new Date().toISOString())
  }
});
EOF

print_success "Test Vite configuration created"

# Step 5: Docker Configuration for Test
print_step "5" "Setting up Docker Configuration for Test"

cat > docker-compose.test.yml << 'EOF'
version: '3.8'

services:
  app-test:
    build:
      context: .
      dockerfile: Dockerfile.test
    ports:
      - "8081:8081"
    environment:
      - NODE_ENV=test
      - VITE_ENVIRONMENT=test
    volumes:
      - ./src:/app/src
      - ./public:/app/public
    networks:
      - test-network
    depends_on:
      - postgres-test
      - redis-test

  postgres-test:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: managementpn_test
      POSTGRES_USER: test_user
      POSTGRES_PASSWORD: test_password
    ports:
      - "5433:5432"
    volumes:
      - postgres_test_data:/var/lib/postgresql/data
      - ./scripts/test-db-init.sql:/docker-entrypoint-initdb.d/init.sql
    networks:
      - test-network

  redis-test:
    image: redis:7-alpine
    ports:
      - "6380:6379"
    volumes:
      - redis_test_data:/data
    networks:
      - test-network

  nginx-test:
    image: nginx:alpine
    ports:
      - "8080:80"
      - "8443:443"
    volumes:
      - ./nginx/test.conf:/etc/nginx/conf.d/default.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - app-test
    networks:
      - test-network

networks:
  test-network:
    driver: bridge

volumes:
  postgres_test_data:
  redis_test_data:
EOF

print_success "Docker test configuration created"

# Step 6: Create Dockerfile for Test
cat > Dockerfile.test << 'EOF'
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Build for test environment
RUN npm run build:test

# Expose port
EXPOSE 8081

# Start the application
CMD ["npm", "run", "preview:test"]
EOF

print_success "Test Dockerfile created"

# Step 7: Nginx Configuration for Test
print_step "7" "Creating Nginx Configuration for Test"

mkdir -p nginx

cat > nginx/test.conf << 'EOF'
upstream app_test {
    server app-test:8081;
}

# HTTP to HTTPS redirect
server {
    listen 80;
    server_name test.managementpn.services;
    return 301 https://$server_name$request_uri;
}

# HTTPS server
server {
    listen 443 ssl http2;
    server_name test.managementpn.services;

    # SSL Configuration
    ssl_certificate /etc/nginx/ssl/test.managementpn.services.crt;
    ssl_certificate_key /etc/nginx/ssl/test.managementpn.services.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' https: data: 'unsafe-inline' 'unsafe-eval';" always;
    add_header X-Environment "test" always;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;

    # Main application
    location / {
        proxy_pass http://app_test;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Environment "test";
        
        # WebSocket support
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }

    # API routes with rate limiting
    location /api/ {
        limit_req zone=api burst=100 nodelay;
        proxy_pass http://app_test;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Environment "test";
    }

    # Health check endpoint
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}

# Rate limiting zones
limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
EOF

print_success "Nginx test configuration created"

# Step 8: Database Migration Scripts
print_step "8" "Creating Database Migration Scripts"

mkdir -p scripts

cat > scripts/test-db-init.sql << 'EOF'
-- Test Database Initialization Script
-- This script sets up the test database with sample data

-- Create test-specific extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create test data schema
CREATE SCHEMA IF NOT EXISTS test_data;

-- Test users (for development/testing only)
INSERT INTO auth.users (id, email, created_at, updated_at, email_confirmed_at) VALUES
  ('550e8400-e29b-41d4-a716-446655440000', 'test.admin@managementpn.services', NOW(), NOW(), NOW()),
  ('550e8400-e29b-41d4-a716-446655440001', 'test.manager@managementpn.services', NOW(), NOW(), NOW()),
  ('550e8400-e29b-41d4-a716-446655440002', 'test.user@managementpn.services', NOW(), NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Clean existing test data
TRUNCATE TABLE test_data.sample_locations CASCADE;

-- Create sample test data
CREATE TABLE IF NOT EXISTS test_data.sample_locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  parent_code TEXT,
  level INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert sample location hierarchy for testing
INSERT INTO test_data.sample_locations (code, name, level) VALUES
  ('test_italy', 'Italy (Test)', 1),
  ('test_france', 'France (Test)', 1),
  ('test_lombardy', 'Lombardy (Test)', 2),
  ('test_paris', 'Paris (Test)', 2),
  ('test_milan', 'Milan (Test)', 3),
  ('test_lyon', 'Lyon (Test)', 3);

-- Create test performance indexes
CREATE INDEX IF NOT EXISTS idx_test_locations_code ON test_data.sample_locations(code);
CREATE INDEX IF NOT EXISTS idx_test_locations_parent ON test_data.sample_locations(parent_code);
EOF

print_success "Database initialization script created"

# Step 9: Test Data Seeding Script
cat > scripts/seed-test-data.js << 'EOF'
#!/usr/bin/env node

/**
 * Test Data Seeding Script
 * Seeds the test database with realistic data for testing
 */

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://TEST_PROJECT_ID.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_KEY) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY environment variable is required');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function seedTestData() {
  console.log('🌱 Seeding test data...');

  try {
    // Seed locations
    const { error: locationsError } = await supabase
      .from('locations')
      .upsert([
        { code: 'test_menton', name: 'Menton (Test)', is_active: true },
        { code: 'test_nice', name: 'Nice (Test)', is_active: true },
        { code: 'test_cannes', name: 'Cannes (Test)', is_active: true },
      ], { onConflict: 'code' });

    if (locationsError) throw locationsError;

    // Seed test profiles
    const { error: profilesError } = await supabase
      .from('profiles')
      .upsert([
        {
          user_id: '550e8400-e29b-41d4-a716-446655440000',
          email: 'test.admin@managementpn.services',
          first_name: 'Test',
          last_name: 'Admin',
          role: 'super_admin',
          access_level: 'general_manager',
          locations: ['test_menton', 'test_nice', 'test_cannes'],
          status: 'active'
        },
        {
          user_id: '550e8400-e29b-41d4-a716-446655440001',
          email: 'test.manager@managementpn.services',
          first_name: 'Test',
          last_name: 'Manager',
          role: 'manager',
          access_level: 'assistant_manager',
          locations: ['test_menton'],
          status: 'active'
        }
      ], { onConflict: 'user_id' });

    if (profilesError) throw profilesError;

    // Seed sample equipment
    const { error: equipmentError } = await supabase
      .from('equipment')
      .upsert([
        {
          name: 'Test Coffee Machine',
          category: 'Kitchen',
          department: 'Kitchen',
          location: 'test_menton',
          status: 'operational',
          model: 'Test Model X1',
          serial_number: 'TEST001'
        },
        {
          name: 'Test POS System',
          category: 'Technology',
          department: 'Front of House',
          location: 'test_menton',
          status: 'operational',
          model: 'Test POS Pro',
          serial_number: 'TEST002'
        }
      ]);

    if (equipmentError) throw equipmentError;

    console.log('✅ Test data seeded successfully');
    
    // Performance test: Create many locations for load testing
    console.log('🚀 Creating performance test data...');
    
    const performanceData = [];
    for (let i = 1; i <= 1000; i++) {
      performanceData.push({
        code: `perf_test_${i.toString().padStart(4, '0')}`,
        name: `Performance Test Location ${i}`,
        is_active: true
      });
    }

    // Insert in batches of 100
    for (let i = 0; i < performanceData.length; i += 100) {
      const batch = performanceData.slice(i, i + 100);
      const { error } = await supabase
        .from('locations')
        .upsert(batch, { onConflict: 'code' });
      
      if (error) throw error;
      
      if (i % 500 === 0) {
        console.log(`📊 Inserted ${i + batch.length}/1000 performance test locations`);
      }
    }

    console.log('✅ Performance test data created successfully');

  } catch (error) {
    console.error('❌ Error seeding test data:', error);
    process.exit(1);
  }
}

seedTestData();
EOF

chmod +x scripts/seed-test-data.js
print_success "Test data seeding script created"

# Step 10: Deployment Script
print_step "10" "Creating Deployment Script"

cat > scripts/deploy-test.sh << 'EOF'
#!/bin/bash

# Test Environment Deployment Script

set -e

echo "🚀 Deploying to Test Environment..."

# Build for test
echo "📦 Building application for test environment..."
npm run build:test

# Run tests before deployment
echo "🧪 Running tests..."
npm run test:unit || { echo "❌ Unit tests failed"; exit 1; }

# Deploy to test server (customize based on your infrastructure)
echo "🌐 Deploying to test.managementpn.services..."

# Example: Deploy to a staging server
# rsync -avz --delete dist-test/ user@test.managementpn.services:/var/www/test/

# Example: Deploy using Docker
docker-compose -f docker-compose.test.yml up -d --build

# Run post-deployment checks
echo "🔍 Running post-deployment checks..."
sleep 30

# Health check
if curl -f https://test.managementpn.services/health > /dev/null 2>&1; then
    echo "✅ Test environment is healthy"
else
    echo "❌ Test environment health check failed"
    exit 1
fi

# Run basic smoke tests
echo "💨 Running smoke tests..."
npx playwright test --config=playwright.test.config.ts --grep="@smoke"

echo "✅ Test environment deployment completed successfully!"
echo "🌐 Test environment available at: https://test.managementpn.services"
EOF

chmod +x scripts/deploy-test.sh
print_success "Deployment script created"

# Step 11: Monitoring Configuration
print_step "11" "Setting up Monitoring Configuration"

mkdir -p monitoring

cat > monitoring/test-monitoring.yml << 'EOF'
# Test Environment Monitoring Configuration

version: '3.8'

services:
  prometheus-test:
    image: prom/prometheus:latest
    ports:
      - "9091:9090"
    volumes:
      - ./prometheus.test.yml:/etc/prometheus/prometheus.yml
      - prometheus_test_data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--web.console.libraries=/etc/prometheus/console_libraries'
      - '--web.console.templates=/etc/prometheus/consoles'
      - '--storage.tsdb.retention.time=7d'
    networks:
      - monitoring-test

  grafana-test:
    image: grafana/grafana:latest
    ports:
      - "3001:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=test_admin_password
      - GF_INSTALL_PLUGINS=grafana-clock-panel,grafana-simple-json-datasource
    volumes:
      - grafana_test_data:/var/lib/grafana
      - ./grafana-dashboards:/etc/grafana/provisioning/dashboards
    networks:
      - monitoring-test
    depends_on:
      - prometheus-test

  alertmanager-test:
    image: prom/alertmanager:latest
    ports:
      - "9094:9093"
    volumes:
      - ./alertmanager.test.yml:/etc/alertmanager/alertmanager.yml
    networks:
      - monitoring-test

networks:
  monitoring-test:
    driver: bridge

volumes:
  prometheus_test_data:
  grafana_test_data:
EOF

print_success "Monitoring configuration created"

# Step 12: Final Configuration
print_step "12" "Final Configuration and Instructions"

# Create README for test environment
cat > TEST_ENVIRONMENT_README.md << 'EOF'
# Test Environment Setup

This document describes the test environment setup for Management PN.

## 🌍 Environment Details

- **URL**: https://test.managementpn.services
- **Purpose**: Isolated testing environment
- **Database**: Separate Supabase project
- **Domain**: test.managementpn.services

## 🚀 Quick Start

1. **Initial Setup**:
   ```bash
   ./scripts/setup-test-environment.sh
   ```

2. **Start Development Server for Test**:
   ```bash
   npm run dev:test
   ```

3. **Build for Test**:
   ```bash
   npm run build:test
   ```

4. **Deploy to Test**:
   ```bash
   npm run deploy:test
   ```

## 🔧 Configuration

### Environment Variables
- Copy `.env.test` and update the Supabase credentials
- Update DNS settings for test.managementpn.services
- Configure SSL certificates

### Database Setup
1. Create a new Supabase project for testing
2. Run database migrations
3. Seed test data:
   ```bash
   node scripts/seed-test-data.js
   ```

### DNS Configuration
Add these DNS records to your domain provider:

```
Type: A
Name: test
Value: YOUR_SERVER_IP

Type: CNAME  
Name: test
Value: test.managementpn.services
```

## 🧪 Testing

### Load Testing
```bash
npm run test:load
```

### End-to-End Testing
```bash
npm run test:e2e
```

### Performance Testing
```bash
k6 run k6-load-test.js --env ENVIRONMENT=test
```

## 🔍 Monitoring

- **Grafana**: http://localhost:3001 (test_admin_password)
- **Prometheus**: http://localhost:9091
- **Application Health**: https://test.managementpn.services/health

## 📊 Performance Targets

- Location queries: < 200ms
- Location switch: < 100ms  
- Dashboard load: < 300ms
- Chat latency: < 150ms
- Success rate: > 99.9%

## 🔒 Security

- Separate API keys for all services
- Isolated database
- Test-specific authentication flows
- Rate limiting enabled

## 📝 Deployment Process

1. Code changes pushed to `test` branch
2. Automated CI/CD pipeline triggers
3. Tests run automatically
4. Deployment to test environment
5. Smoke tests verify deployment
6. Notification of deployment status

## 🛠️ Troubleshooting

### Common Issues

1. **SSL Certificate Issues**:
   ```bash
   sudo certbot --nginx -d test.managementpn.services
   ```

2. **Database Connection**:
   - Verify Supabase project URL and keys
   - Check network connectivity
   - Verify RLS policies

3. **Performance Issues**:
   - Check Grafana dashboards
   - Review application logs
   - Run performance profiling

### Logs Location
- Application: `/var/log/managementpn-test/`
- Nginx: `/var/log/nginx/`
- Docker: `docker-compose -f docker-compose.test.yml logs`

## 📞 Support

For test environment issues:
1. Check monitoring dashboards
2. Review application logs
3. Check database connectivity
4. Verify DNS resolution

EOF

print_success "Test environment documentation created"

# Final steps
print_step "13" "Installation Complete"

echo ""
echo "🎉 Test Environment Setup Complete!"
echo ""
echo "Next steps:"
echo "1. 📝 Update .env.test with your Supabase test project credentials"
echo "2. 🌐 Configure DNS for test.managementpn.services"
echo "3. 🔒 Set up SSL certificates"
echo "4. 🗄️ Run database migrations and seed data"
echo "5. 🚀 Deploy to test environment"
echo ""
echo "📚 See TEST_ENVIRONMENT_README.md for detailed instructions"
echo ""
echo "🔗 Quick commands:"
echo "   npm run dev:test     # Start test development server"
echo "   npm run build:test   # Build for test environment"
echo "   npm run deploy:test  # Deploy to test environment"
echo ""

print_success "Setup script completed successfully!"
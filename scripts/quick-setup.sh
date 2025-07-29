#!/bin/bash

# Quick Setup Script for Test Environment
echo "🚀 Quick Test Environment Setup"

# Make scripts executable
chmod +x scripts/setup-test-environment.sh
chmod +x scripts/deploy-test.sh
chmod +x scripts/health-check.sh
chmod +x scripts/seed-test-data.js

echo "✅ Test environment configuration completed!"
echo ""
echo "Next steps:"
echo "1. Run: ./scripts/setup-test-environment.sh"
echo "2. Update .env.test with your Supabase test project credentials"
echo "3. Configure DNS for test.managementpn.services"
echo "4. Deploy: npm run deploy:test"
echo ""
echo "📚 See TEST_ENVIRONMENT_GUIDE.md for complete instructions"
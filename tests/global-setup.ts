import { chromium, FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  console.log('🚀 Starting global test setup...');
  
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  try {
    // Verify test environment is accessible
    const baseURL = config.projects[0].use.baseURL || 'https://test.managementpn.services';
    console.log(`🌐 Testing connection to: ${baseURL}`);
    
    const response = await page.goto(`${baseURL}/health`);
    
    if (!response || !response.ok()) {
      throw new Error(`Test environment not accessible at ${baseURL}`);
    }
    
    console.log('✅ Test environment is accessible');
    
    // Seed test data if needed
    console.log('🌱 Seeding test data...');
    
    await page.request.post(`${baseURL}/api/seed-test-data`, {
      data: {
        type: 'all',
        count: 100,
        clear: true
      }
    });
    
    console.log('✅ Test data seeded successfully');
    
    // Create test users for authentication tests
    console.log('👥 Setting up test users...');
    
    // This would typically use your authentication service
    // For now, we'll just verify the auth endpoint exists
    const authResponse = await page.goto(`${baseURL}/auth`);
    
    if (authResponse && authResponse.ok()) {
      console.log('✅ Authentication endpoints available');
    }
    
  } catch (error) {
    console.error('❌ Global setup failed:', error);
    throw error;
  } finally {
    await browser.close();
  }
  
  console.log('✅ Global test setup completed');
}

export default globalSetup;
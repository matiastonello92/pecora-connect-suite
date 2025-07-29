import { chromium, FullConfig } from '@playwright/test';

async function globalTeardown(config: FullConfig) {
  console.log('🧹 Starting global test teardown...');
  
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  try {
    const baseURL = config.projects[0].use.baseURL || 'https://test.managementpn.services';
    
    // Clean up test data
    console.log('🗑️ Cleaning up test data...');
    
    await page.request.post(`${baseURL}/api/cleanup-test-data`, {
      data: {
        cleanupType: 'partial', // Keep base test data, remove test-specific data
        olderThan: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() // 24 hours
      }
    });
    
    console.log('✅ Test data cleanup completed');
    
    // Generate test report summary
    console.log('📊 Generating test summary...');
    
    const testSummary = {
      timestamp: new Date().toISOString(),
      environment: 'test',
      baseURL,
      cleanup: 'completed'
    };
    
    // Log summary for CI/CD systems
    console.log('Test Summary:', JSON.stringify(testSummary, null, 2));
    
  } catch (error) {
    console.error('❌ Global teardown failed:', error);
    // Don't throw - teardown failures shouldn't fail the test run
  } finally {
    await browser.close();
  }
  
  console.log('✅ Global test teardown completed');
}

export default globalTeardown;
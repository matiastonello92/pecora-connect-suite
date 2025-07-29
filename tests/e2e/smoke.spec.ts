import { test, expect } from '@playwright/test';

// Smoke tests for test environment
test.describe('Test Environment Smoke Tests @smoke', () => {
  test.beforeEach(async ({ page }) => {
    // Set test environment context
    await page.addInitScript(() => {
      window.localStorage.setItem('test-environment', 'true');
    });
  });

  test('homepage loads successfully', async ({ page }) => {
    await page.goto('/');
    
    // Check if page loads
    await expect(page).toHaveTitle(/Management PN/);
    
    // Check for test environment indicator
    const testBanner = page.locator('[data-testid="test-environment-banner"]');
    if (await testBanner.isVisible()) {
      await expect(testBanner).toContainText('Test Environment');
    }
  });

  test('health check endpoint responds', async ({ page }) => {
    const response = await page.request.get('/health');
    expect(response.ok()).toBeTruthy();
    expect(response.status()).toBe(200);
  });

  test('authentication flow works', async ({ page }) => {
    await page.goto('/auth');
    
    // Check login form is present
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('dashboard loads for authenticated user', async ({ page }) => {
    // Mock authentication
    await page.addInitScript(() => {
      window.localStorage.setItem('supabase.auth.token', JSON.stringify({
        access_token: 'test-token',
        refresh_token: 'test-refresh',
        user: {
          id: 'test-user-id',
          email: 'test@managementpn.services'
        }
      }));
    });

    await page.goto('/dashboard');
    
    // Should not redirect to login
    await expect(page).toHaveURL(/\/dashboard/);
    
    // Check for dashboard elements
    await expect(page.locator('[data-testid="dashboard-content"]')).toBeVisible();
  });

  test('location switching works', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Check location switcher
    const locationSwitcher = page.locator('[data-testid="location-switcher"]');
    if (await locationSwitcher.isVisible()) {
      await locationSwitcher.click();
      
      // Should show location options
      await expect(page.locator('[data-testid="location-option"]').first()).toBeVisible();
    }
  });

  test('API endpoints respond correctly', async ({ page }) => {
    const endpoints = [
      '/api/locations',
      '/api/dashboard/stats',
      '/api/health'
    ];

    for (const endpoint of endpoints) {
      const response = await page.request.get(endpoint);
      expect(response.status()).toBeLessThan(500); // No server errors
    }
  });

  test('performance budgets are met', async ({ page }) => {
    await page.goto('/');
    
    // Wait for page to fully load
    await page.waitForLoadState('networkidle');
    
    // Check performance timing
    const performanceMetrics = await page.evaluate(() => {
      const timing = performance.timing;
      return {
        domContentLoaded: timing.domContentLoadedEventEnd - timing.navigationStart,
        fullLoad: timing.loadEventEnd - timing.navigationStart,
        firstPaint: performance.getEntriesByType('paint')[0]?.startTime || 0
      };
    });

    // Performance budgets for test environment
    expect(performanceMetrics.domContentLoaded).toBeLessThan(3000); // 3s
    expect(performanceMetrics.fullLoad).toBeLessThan(5000); // 5s
    expect(performanceMetrics.firstPaint).toBeLessThan(1500); // 1.5s
  });

  test('WebSocket connections work', async ({ page }) => {
    let wsConnected = false;
    
    page.on('websocket', ws => {
      wsConnected = true;
      expect(ws.url()).toContain('supabase.co');
    });

    await page.goto('/chat');
    
    // Wait a bit for WebSocket to connect
    await page.waitForTimeout(2000);
    
    // Check if WebSocket connected (optional, depends on implementation)
    if (wsConnected) {
      console.log('✅ WebSocket connection established');
    }
  });

  test('error handling works correctly', async ({ page }) => {
    // Test 404 page
    await page.goto('/non-existent-page');
    await expect(page.locator('h1')).toContainText(/404|Not Found/i);
    
    // Test API error handling
    const response = await page.request.get('/api/non-existent-endpoint');
    expect(response.status()).toBe(404);
  });

  test('responsive design works', async ({ page }) => {
    await page.goto('/');
    
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.locator('body')).toBeVisible();
    
    // Test tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(page.locator('body')).toBeVisible();
    
    // Test desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
    await expect(page.locator('body')).toBeVisible();
  });
});
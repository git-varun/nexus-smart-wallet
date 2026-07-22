import { test, expect } from '@playwright/test';

test.describe('Network Request Routing Verification', () => {
  const EXPECTED_BACKEND = process.env.VITE_API_BASE_URL || 'http://localhost:3001';

  test('All API requests should route to the correct backend host', async ({ page }) => {
    const apiRequests: string[] = [];
    const invalidRequests: string[] = [];

    // Intercept all requests
    await page.route('**/*', (route) => {
      const url = route.request().url();
      
      if (url.includes('/api/')) {
        apiRequests.push(url);
        if (!url.startsWith(EXPECTED_BACKEND)) {
          invalidRequests.push(url);
        }
      }
      return route.continue();
    });

    // Navigate to app
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Trigger a login attempt (will fire /api/auth/login)
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'Password123!');
    await page.click('button:has-text("Sign In")');

    // Wait for the login request to be processed
    await page.waitForTimeout(1000);

    // Assert that no requests went to unexpected hosts
    expect(invalidRequests, `Found API requests routed to incorrect hosts: ${invalidRequests.join(', ')}`).toHaveLength(0);
    
    // Assert that at least some API requests were captured (sanity check)
    expect(apiRequests.length).toBeGreaterThan(0);
  });
});

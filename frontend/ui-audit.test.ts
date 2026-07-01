import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// URLs for pages (adjust if needed)
const pages = [
  { path: '/', name: 'Home' },
  { path: '/activity', name: 'Activity' },
  { path: '/security', name: 'Security' },
];

for (const { path, name } of pages) {
  test(`UI audit – ${name}`, async ({ page }) => {
    // Navigate to the dev server running on port 8080
    await page.goto(`http://localhost:8080${path}`);
    // Wait for app to load (network idle)
    await page.waitForLoadState('networkidle');
    // Take a screenshot
    await page.screenshot({ path: `ui-audit-${name.toLowerCase()}.png`, fullPage: true });
    
    // Accessibility check using AxeBuilder
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
    expect(accessibilityScanResults.violations).toEqual([]);
  });
}

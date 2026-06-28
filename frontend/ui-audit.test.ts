import { test } from '@playwright/test';
import { injectAxe, checkA11y } from '@axe-core/playwright';

// URLs for pages (adjust if needed)
const pages = [
  { path: '/', name: 'Home' },
  { path: '/activity', name: 'Activity' },
  { path: '/security', name: 'Security' },
];

for (const { path, name } of pages) {
  test(`UI audit – ${name}`, async ({ page }) => {
    // Navigate to the dev server (default Vite port 5173)
    await page.goto(`http://localhost:5173${path}`);
    // Wait for app to load (network idle)
    await page.waitForLoadState('networkidle');
    // Take a screenshot
    await page.screenshot({ path: `ui-audit-${name.toLowerCase()}.png`, fullPage: true });
    // Accessibility check with axe
    // Accessibility check
    await injectAxe(page);
    const violations = await checkA11y(page, {
      detailedReport: true,
      axeOptions: {},
    });
    expect(violations).toEqual([]);
  });
}

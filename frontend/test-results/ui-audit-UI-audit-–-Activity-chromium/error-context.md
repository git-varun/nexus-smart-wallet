# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: ui-audit.test.ts >> UI audit – Activity
- Location: ui-audit.test.ts:12:3

# Error details

```
Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:8080/activity
Call log:
  - navigating to "http://localhost:8080/activity", waiting until "load"

```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | import AxeBuilder from '@axe-core/playwright';
  3  | 
  4  | // URLs for pages (adjust if needed)
  5  | const pages = [
  6  |   { path: '/', name: 'Home' },
  7  |   { path: '/activity', name: 'Activity' },
  8  |   { path: '/security', name: 'Security' },
  9  | ];
  10 | 
  11 | for (const { path, name } of pages) {
  12 |   test(`UI audit – ${name}`, async ({ page }) => {
  13 |     // Navigate to the dev server running on port 8080
> 14 |     await page.goto(`http://localhost:8080${path}`);
     |                ^ Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:8080/activity
  15 |     // Wait for app to load (network idle)
  16 |     await page.waitForLoadState('networkidle');
  17 |     // Take a screenshot
  18 |     await page.screenshot({ path: `ui-audit-${name.toLowerCase()}.png`, fullPage: true });
  19 |     
  20 |     // Accessibility check using AxeBuilder
  21 |     const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
  22 |     expect(accessibilityScanResults.violations).toEqual([]);
  23 |   });
  24 | }
  25 | 
```
# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: auth-verification.spec.ts >> Authentication System Verification >> Phase 1 & Phase 10 - Registration and UI States
- Location: auth-verification.spec.ts:57:3

# Error details

```
Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:8080/
Call log:
  - navigating to "http://localhost:8080/", waiting until "load"

```

# Test source

```ts
  1   | import { test, expect, BrowserContext, Page } from '@playwright/test';
  2   | 
  3   | const BASE_URL = 'http://localhost:8080';
  4   | const UNIQUE_ID = Date.now();
  5   | const TEST_EMAIL = `verify_user_${UNIQUE_ID}@example.com`;
  6   | const TEST_PASSWORD = 'SecurePass123!';
  7   | 
  8   | test.describe.configure({ mode: 'serial' });
  9   | 
  10  | test.describe('Authentication System Verification', () => {
  11  |   let context: BrowserContext;
  12  |   let page: Page;
  13  | 
  14  |   test.beforeAll(async ({ browser }) => {
  15  |     // Fresh context for verification
  16  |     context = await browser.newContext();
  17  |     page = await context.newPage();
  18  |   });
  19  | 
  20  |   test.afterAll(async () => {
  21  |     await context.close();
  22  |   });
  23  | 
  24  |   // Track network requests and console
  25  |   const setupTrackers = (p: Page, prefix: string) => {
  26  |     p.on('console', (msg) => {
  27  |       if (msg.type() === 'error' || msg.type() === 'warning') {
  28  |         console.log(`[${prefix} Console ${msg.type()}] ${msg.text()}`);
  29  |       }
  30  |     });
  31  | 
  32  |     p.on('pageerror', (err) => {
  33  |       console.log(`[${prefix} Page Error] ${err.message}\n${err.stack}`);
  34  |     });
  35  | 
  36  |     p.on('request', (req) => {
  37  |       const url = req.url();
  38  |       if (url.includes('/api/')) {
  39  |         console.log(`[${prefix} Request] ${req.method()} ${url}`);
  40  |       }
  41  |     });
  42  | 
  43  |     p.on('response', async (res) => {
  44  |       const url = res.url();
  45  |       if (url.includes('/api/')) {
  46  |         let bodyText = '';
  47  |         try {
  48  |           bodyText = await res.text();
  49  |         } catch (_) {
  50  |           // ignore
  51  |         }
  52  |         console.log(`[${prefix} Response] ${res.request().method()} ${url} Status=${res.status()} Body=${bodyText.slice(0, 300)}`);
  53  |       }
  54  |     });
  55  |   };
  56  | 
  57  |   test('Phase 1 & Phase 10 - Registration and UI States', async () => {
  58  |     setupTrackers(page, 'P1');
  59  |     console.log('\n--- PHASE 1: REGISTRATION ---');
> 60  |     await page.goto(BASE_URL);
      |                ^ Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:8080/
  61  |     await page.waitForLoadState('load');
  62  | 
  63  | 
  64  | 
  65  |     // Verify Login form loads, then switch to Register
  66  |     console.log('Switching to Sign Up form...');
  67  |     await page.locator('text=Sign Up').first().click();
  68  |     await expect(page.getByRole('heading', { name: 'Create Account' })).toBeVisible();
  69  | 
  70  |     // Fill short password and invalid email to trigger validation
  71  |     console.log('Testing validation inputs...');
  72  |     await page.getByPlaceholder('Enter your email').fill('invalid-email@');
  73  |     await page.getByPlaceholder('Create a strong password').fill('short');
  74  |     await page.getByPlaceholder('Confirm your password').fill('mismatch');
  75  |     
  76  |     // Attempt submit
  77  |     const submitBtn = page.getByRole('button', { name: 'Create Account' });
  78  |     await submitBtn.click();
  79  | 
  80  |     // Wait short time to let error messages or browser validation tooltips show
  81  |     await page.waitForTimeout(1000);
  82  | 
  83  |     // Let's check if the browser's native email validation blocked submit, or if custom errors show.
  84  |     // If native email validation blocks it, let's type a valid email format but keep password short and mismatched
  85  |     console.log('Fills email with valid format but invalid password credentials...');
  86  |     await page.getByPlaceholder('Enter your email').fill('valid-email@example.com');
  87  |     await submitBtn.click();
  88  | 
  89  |     // Now verify validation message for short password
  90  |     console.log('Checking custom password length validation...');
  91  |     await expect(page.locator('text=Password must be at least 8 characters')).toBeVisible();
  92  | 
  93  |     // Mismatched passwords
  94  |     console.log('Testing password mismatch validation...');
  95  |     await page.getByPlaceholder('Create a strong password').fill('SecurePass123!');
  96  |     await page.getByPlaceholder('Confirm your password').fill('SecurePass123Mismatch!');
  97  |     await submitBtn.click();
  98  |     await expect(page.locator('text=Passwords do not match')).toBeVisible();
  99  | 
  100 |     // Successful register with valid details
  101 |     console.log(`Submitting valid registration: ${TEST_EMAIL}`);
  102 |     await page.getByPlaceholder('Enter your email').fill(TEST_EMAIL);
  103 |     await page.getByPlaceholder('Create a strong password').fill(TEST_PASSWORD);
  104 |     await page.getByPlaceholder('Confirm your password').fill(TEST_PASSWORD);
  105 | 
  106 |     // Check strength indicator
  107 |     await expect(page.locator('text=Strong')).toBeVisible();
  108 | 
  109 |     // Click register
  110 |     await submitBtn.click();
  111 |     console.log('Register submitted. Waiting for transition...');
  112 |     await page.waitForTimeout(5000); // Allow time for API request and redirect
  113 | 
  114 |     // Check if user is authenticated (dashboard shell elements are visible)
  115 |     const token = await page.evaluate(() => localStorage.getItem('nexus_auth_token'));
  116 |     const refreshToken = await page.evaluate(() => localStorage.getItem('nexus_refresh_token'));
  117 |     console.log(`Local storage state: token=${!!token}, refreshToken=${!!refreshToken}`);
  118 | 
  119 |     // If redirected to home, we should see sidebar or balance card
  120 |     const currentUrl = page.url();
  121 |     console.log(`Current page URL: ${currentUrl}`);
  122 |   });
  123 | 
  124 |   test('Phase 2 - Duplicate Registration', async ({ browser }) => {
  125 |     console.log('\n--- PHASE 2: DUPLICATE REGISTRATION ---');
  126 |     // Open new isolated page context
  127 |     const dupContext = await browser.newContext();
  128 |     const dupPage = await dupContext.newPage();
  129 |     setupTrackers(dupPage, 'P2');
  130 | 
  131 |     await dupPage.goto(BASE_URL);
  132 |     await dupPage.waitForLoadState('load');
  133 | 
  134 | 
  135 |     await dupPage.locator('text=Sign Up').first().click();
  136 | 
  137 |     console.log(`Attempting duplicate registration with: ${TEST_EMAIL}`);
  138 |     await dupPage.getByPlaceholder('Enter your email').fill(TEST_EMAIL);
  139 |     await dupPage.getByPlaceholder('Create a strong password').fill(TEST_PASSWORD);
  140 |     await dupPage.getByPlaceholder('Confirm your password').fill(TEST_PASSWORD);
  141 |     
  142 |     const submitBtn = dupPage.getByRole('button', { name: 'Create Account' });
  143 |     await submitBtn.click();
  144 | 
  145 |     // Verify that we see duplicate registration error
  146 |     console.log('Checking for registration failure/error message...');
  147 |     await dupPage.waitForTimeout(2000);
  148 | 
  149 |     // The form should show an error banner
  150 |     const errorBanner = dupPage.locator('text=User already exists').or(dupPage.locator('text=failed')).or(dupPage.locator('text=registered'));
  151 |     const isErrorVisible = await errorBanner.isVisible();
  152 |     console.log(`Duplicate registration error visible: ${isErrorVisible}`);
  153 |     
  154 |     await dupContext.close();
  155 |   });
  156 | 
  157 |   test('Phase 3 - Login Flow', async ({ browser }) => {
  158 |     console.log('\n--- PHASE 3: LOGIN FLOW ---');
  159 |     const loginContext = await browser.newContext();
  160 |     const loginPage = await loginContext.newPage();
```
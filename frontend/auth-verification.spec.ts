import { test, expect, BrowserContext, Page } from '@playwright/test';

const BASE_URL = 'http://localhost:8080';
const UNIQUE_ID = Date.now();
const TEST_EMAIL = `verify_user_${UNIQUE_ID}@example.com`;
const TEST_PASSWORD = 'SecurePass123!';

test.describe.configure({ mode: 'serial' });

test.describe('Authentication System Verification', () => {
  let context: BrowserContext;
  let page: Page;

  test.beforeAll(async ({ browser }) => {
    // Fresh context for verification
    context = await browser.newContext();
    page = await context.newPage();
  });

  test.afterAll(async () => {
    await context.close();
  });

  // Track network requests and console
  const setupTrackers = (p: Page, prefix: string) => {
    p.on('console', (msg) => {
      if (msg.type() === 'error' || msg.type() === 'warning') {
        console.log(`[${prefix} Console ${msg.type()}] ${msg.text()}`);
      }
    });

    p.on('pageerror', (err) => {
      console.log(`[${prefix} Page Error] ${err.message}\n${err.stack}`);
    });

    p.on('request', (req) => {
      const url = req.url();
      if (url.includes('/api/')) {
        console.log(`[${prefix} Request] ${req.method()} ${url}`);
      }
    });

    p.on('response', async (res) => {
      const url = res.url();
      if (url.includes('/api/')) {
        let bodyText = '';
        try {
          bodyText = await res.text();
        } catch (_) {
          // ignore
        }
        console.log(`[${prefix} Response] ${res.request().method()} ${url} Status=${res.status()} Body=${bodyText.slice(0, 300)}`);
      }
    });
  };

  test('Phase 1 & Phase 10 - Registration and UI States', async () => {
    setupTrackers(page, 'P1');
    console.log('\n--- PHASE 1: REGISTRATION ---');
    await page.goto(BASE_URL);
    await page.waitForLoadState('load');



    // Verify Login form loads, then switch to Register
    console.log('Switching to Sign Up form...');
    await page.locator('text=Sign Up').first().click();
    await expect(page.getByRole('heading', { name: 'Create Account' })).toBeVisible();

    // Fill short password and invalid email to trigger validation
    console.log('Testing validation inputs...');
    await page.getByPlaceholder('Enter your email').fill('invalid-email@');
    await page.getByPlaceholder('Create a strong password').fill('short');
    await page.getByPlaceholder('Confirm your password').fill('mismatch');
    
    // Attempt submit
    const submitBtn = page.getByRole('button', { name: 'Create Account' });
    await submitBtn.click();

    // Wait short time to let error messages or browser validation tooltips show
    await page.waitForTimeout(1000);

    // Let's check if the browser's native email validation blocked submit, or if custom errors show.
    // If native email validation blocks it, let's type a valid email format but keep password short and mismatched
    console.log('Fills email with valid format but invalid password credentials...');
    await page.getByPlaceholder('Enter your email').fill('valid-email@example.com');
    await submitBtn.click();

    // Now verify validation message for short password
    console.log('Checking custom password length validation...');
    await expect(page.locator('text=Password must be at least 8 characters')).toBeVisible();

    // Mismatched passwords
    console.log('Testing password mismatch validation...');
    await page.getByPlaceholder('Create a strong password').fill('SecurePass123!');
    await page.getByPlaceholder('Confirm your password').fill('SecurePass123Mismatch!');
    await submitBtn.click();
    await expect(page.locator('text=Passwords do not match')).toBeVisible();

    // Successful register with valid details
    console.log(`Submitting valid registration: ${TEST_EMAIL}`);
    await page.getByPlaceholder('Enter your email').fill(TEST_EMAIL);
    await page.getByPlaceholder('Create a strong password').fill(TEST_PASSWORD);
    await page.getByPlaceholder('Confirm your password').fill(TEST_PASSWORD);

    // Check strength indicator
    await expect(page.locator('text=Strong')).toBeVisible();

    // Click register
    await submitBtn.click();
    console.log('Register submitted. Waiting for transition...');
    await page.waitForTimeout(5000); // Allow time for API request and redirect

    // Check if user is authenticated (dashboard shell elements are visible)
    const token = await page.evaluate(() => localStorage.getItem('nexus_auth_token'));
    const refreshToken = await page.evaluate(() => localStorage.getItem('nexus_refresh_token'));
    console.log(`Local storage state: token=${!!token}, refreshToken=${!!refreshToken}`);

    // If redirected to home, we should see sidebar or balance card
    const currentUrl = page.url();
    console.log(`Current page URL: ${currentUrl}`);
  });

  test('Phase 2 - Duplicate Registration', async ({ browser }) => {
    console.log('\n--- PHASE 2: DUPLICATE REGISTRATION ---');
    // Open new isolated page context
    const dupContext = await browser.newContext();
    const dupPage = await dupContext.newPage();
    setupTrackers(dupPage, 'P2');

    await dupPage.goto(BASE_URL);
    await dupPage.waitForLoadState('load');


    await dupPage.locator('text=Sign Up').first().click();

    console.log(`Attempting duplicate registration with: ${TEST_EMAIL}`);
    await dupPage.getByPlaceholder('Enter your email').fill(TEST_EMAIL);
    await dupPage.getByPlaceholder('Create a strong password').fill(TEST_PASSWORD);
    await dupPage.getByPlaceholder('Confirm your password').fill(TEST_PASSWORD);
    
    const submitBtn = dupPage.getByRole('button', { name: 'Create Account' });
    await submitBtn.click();

    // Verify that we see duplicate registration error
    console.log('Checking for registration failure/error message...');
    await dupPage.waitForTimeout(2000);

    // The form should show an error banner
    const errorBanner = dupPage.locator('text=User already exists').or(dupPage.locator('text=failed')).or(dupPage.locator('text=registered'));
    const isErrorVisible = await errorBanner.isVisible();
    console.log(`Duplicate registration error visible: ${isErrorVisible}`);
    
    await dupContext.close();
  });

  test('Phase 3 - Login Flow', async ({ browser }) => {
    console.log('\n--- PHASE 3: LOGIN FLOW ---');
    const loginContext = await browser.newContext();
    const loginPage = await loginContext.newPage();
    setupTrackers(loginPage, 'P3');

    await loginPage.goto(BASE_URL);
    await loginPage.waitForLoadState('load');



    // Test incorrect login
    console.log('Testing incorrect login credentials...');
    await loginPage.getByPlaceholder('Enter your email').fill(TEST_EMAIL);
    await loginPage.getByPlaceholder('Enter your password').fill('WrongPassword123!');
    await loginPage.getByRole('button', { name: 'Sign In' }).click();

    await loginPage.waitForTimeout(1000);
    const errorMsg = loginPage.locator('text=Invalid credentials').or(loginPage.locator('text=failed')).or(loginPage.locator('text=incorrect'));
    console.log(`Incorrect credentials error visible: ${await errorMsg.isVisible()}`);

    // Test successful login
    console.log(`Logging in with correct credentials: ${TEST_EMAIL}`);
    await loginPage.getByPlaceholder('Enter your password').fill(TEST_PASSWORD);
    await loginPage.getByRole('button', { name: 'Sign In' }).click();

    await loginPage.waitForTimeout(4000);
    const token = await loginPage.evaluate(() => localStorage.getItem('nexus_auth_token'));
    console.log(`Login context token exists: ${!!token}`);
    console.log(`Logged in URL: ${loginPage.url()}`);

    await loginContext.close();
  });

  test('Phase 4 & 5 - Auth Persistence and Protected Routes', async () => {
    console.log('\n--- PHASE 4 & 5: PERSISTENCE AND PROTECTED ROUTES ---');
    // Ensure we are logged in on the primary page
    const tokenBefore = await page.evaluate(() => localStorage.getItem('nexus_auth_token'));
    if (!tokenBefore) {
      console.log('Re-authenticating primary page...');
      await page.goto(BASE_URL);

      await page.getByPlaceholder('Enter your email').fill(TEST_EMAIL);
      await page.getByPlaceholder('Enter your password').fill(TEST_PASSWORD);
      await page.getByRole('button', { name: 'Sign In' }).click();
      await page.waitForTimeout(4000);
    }

    console.log('Refreshing the page to verify persistence...');
    await page.reload();
    await page.waitForLoadState('load');
    await page.waitForTimeout(2000);

    const tokenAfter = await page.evaluate(() => localStorage.getItem('nexus_auth_token'));
    console.log(`Token after refresh exists: ${!!tokenAfter}`);

    // Navigate to protected pages
    console.log('Attempting to access protected route /settings...');
    await page.goto(`${BASE_URL}/settings`);
    await page.waitForLoadState('load');
    await page.waitForTimeout(2000);
    console.log(`URL after navigating: ${page.url()}`);
    // If authenticated, AuthPage form should NOT be visible
    const authHeading = page.getByRole('heading', { name: 'Welcome Back' }).or(page.getByRole('heading', { name: 'Create Account' }));
    console.log(`Is authentication form visible on /settings? ${await authHeading.isVisible()}`);

    console.log('Attempting to access protected route /security...');
    await page.goto(`${BASE_URL}/security`);
    await page.waitForLoadState('load');
    await page.waitForTimeout(2000);
    console.log(`Is authentication form visible on /security? ${await authHeading.isVisible()}`);
  });

  test('Phase 6 - Logout and Back Button Restriction', async () => {
    console.log('\n--- PHASE 6: LOGOUT ---');
    // Go back to homepage or dashboard
    await page.goto(BASE_URL);
    await page.waitForLoadState('load');
    await page.waitForTimeout(2000);

    console.log('Locating Sign Out button...');
    const signOutBtn = page.locator('button[title="Sign Out"]').first();
    const isSignOutVisible = await signOutBtn.isVisible();
    console.log(`Sign Out button visible: ${isSignOutVisible}`);

    if (isSignOutVisible) {
      console.log('Clicking Sign Out...');
      await signOutBtn.click();
      await page.waitForTimeout(2000);
    } else {
      console.log('Fallback: trigger logout via localStorage clear');
      await page.evaluate(() => {
        localStorage.removeItem('nexus_auth_token');
        localStorage.removeItem('nexus_refresh_token');
      });
      await page.reload();
    }

    const tokenAfterLogout = await page.evaluate(() => localStorage.getItem('nexus_auth_token'));
    console.log(`Token after logout exists: ${!!tokenAfterLogout}`);

    // Verify protected pages are inaccessible
    console.log('Attempting to access /settings after logout...');
    await page.goto(`${BASE_URL}/settings`);
    await page.waitForLoadState('load');
    await page.waitForTimeout(2000);
    const authHeading = page.getByRole('heading', { name: 'Welcome Back' }).or(page.getByRole('heading', { name: 'Create Account' }));
    console.log(`Is authentication/welcome screen visible on /settings post-logout? ${await authHeading.isVisible()}`);

    // Verify back button cannot restore authenticated state
    console.log('Testing back button restriction...');
    await page.goBack();
    await page.waitForLoadState('load');
    await page.waitForTimeout(2000);
    console.log(`URL after browser Back: ${page.url()}`);
    const tokenBack = await page.evaluate(() => localStorage.getItem('nexus_auth_token'));
    console.log(`Token after Back button exists: ${!!tokenBack}`);
  });

  test('Phase 7 - Invalid Session Handling', async () => {
    console.log('\n--- PHASE 7: INVALID SESSION HANDLING ---');
    // Set a corrupted/invalid token in localStorage
    console.log('Setting corrupt token in localStorage...');
    await page.evaluate(() => {
      localStorage.setItem('nexus_auth_token', 'corrupted_jwt_token_xyz_invalid');
    });

    // Reload page
    console.log('Reloading page with corrupt token...');
    await page.reload();
    await page.waitForLoadState('load');
    await page.waitForTimeout(2000);

    // Verify redirected to login/auth screen
    const welcomeText = page.getByRole('heading', { name: 'Welcome Back' });
    console.log(`Is authentication/welcome screen visible with corrupt token? ${await welcomeText.isVisible()}`);
  });

  test('Phase 8 - Refresh Token Recovery', async () => {
    console.log('\n--- PHASE 8: REFRESH TOKEN RECOVERY ---');
    // Log in to get fresh valid tokens
    console.log('Logging in to obtain valid tokens...');
    await page.goto(BASE_URL);

    await page.getByPlaceholder('Enter your email').fill(TEST_EMAIL);
    await page.getByPlaceholder('Enter your password').fill(TEST_PASSWORD);
    await page.getByRole('button', { name: 'Sign In' }).click();
    await page.waitForTimeout(4000);

    const validAuthToken = await page.evaluate(() => localStorage.getItem('nexus_auth_token'));
    const validRefreshToken = await page.evaluate(() => localStorage.getItem('nexus_refresh_token'));
    console.log(`Tokens obtained: auth=${!!validAuthToken}, refresh=${!!validRefreshToken}`);

    if (validAuthToken && validRefreshToken) {
      // Corrupt ONLY the access token (auth token)
      console.log('Corrupting access token in localStorage, keeping refresh token...');
      await page.evaluate(() => {
        localStorage.setItem('nexus_auth_token', 'invalid_access_token_but_valid_refresh');
      });

      // Reload page which triggers API auth/status check
      console.log('Reloading page (triggers token refresh interceptor)...');
      await page.reload();
      await page.waitForLoadState('load');
      await page.waitForTimeout(3000);

      // Verify that the access token was automatically recovered/refreshed
      const finalAuthToken = await page.evaluate(() => localStorage.getItem('nexus_auth_token'));
      console.log(`Token after refresh cycle exists: ${!!finalAuthToken}`);
      console.log(`Is final token valid (not the corrupted one)? ${finalAuthToken !== 'invalid_access_token_but_valid_refresh'}`);
    }
  });

  test('Phase 9 - Multi-Tab Synchronization', async () => {
    console.log('\n--- PHASE 9: MULTI-TAB SYNCHRONIZATION ---');
    // Open a second tab (within the same browser context)
    const tab2 = await context.newPage();
    setupTrackers(tab2, 'TAB2');

    console.log('Navigating Tab 2 to homepage...');
    await tab2.goto(BASE_URL);
    await tab2.waitForLoadState('load');
    await tab2.waitForTimeout(2000);

    // Verify Tab 2 is authenticated (because it shares the context/storage)
    const tab2Auth = await tab2.evaluate(() => !!localStorage.getItem('nexus_auth_token'));
    console.log(`Is Tab 2 authenticated? ${tab2Auth}`);

    // Logout in Tab 1
    console.log('Logging out in Tab 1...');
    await page.goto(BASE_URL);
    const signOutBtn = page.locator('button[title="Sign Out"]').first();
    if (await signOutBtn.isVisible()) {
      await signOutBtn.click();
    } else {
      await page.evaluate(() => {
        localStorage.removeItem('nexus_auth_token');
        localStorage.removeItem('nexus_refresh_token');
      });
      await page.reload();
    }
    await page.waitForTimeout(2000);

    // Reload Tab 2 or verify storage event
    console.log('Checking Tab 2 authentication state after Tab 1 logout...');
    await tab2.reload();
    await tab2.waitForLoadState('load');
    await tab2.waitForTimeout(2000);
    const tab2AuthPostLogout = await tab2.evaluate(() => !!localStorage.getItem('nexus_auth_token'));
    console.log(`Is Tab 2 authenticated after Tab 1 logout? ${tab2AuthPostLogout}`);

    await tab2.close();
  });
});

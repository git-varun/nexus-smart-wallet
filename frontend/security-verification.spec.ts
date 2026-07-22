import { test, expect, BrowserContext, Page } from '@playwright/test';

const BASE_URL = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:8080';
const API_URL = process.env.VITE_API_BASE_URL || 'http://localhost:3001';

test.describe.configure({ mode: 'serial' });

test.describe('Authentication Security & Edge Cases', () => {
  let context: BrowserContext;
  let page: Page;

  test.beforeAll(async ({ browser }) => {
    context = await browser.newContext();
    page = await context.newPage();
    // Navigate to base URL to establish origin for fetch requests
    await page.goto(BASE_URL);
    await page.waitForLoadState('load');
  });

  test.afterAll(async () => {
    await context.close();
  });

  // Helper to register a new user in the browser context
  const registerNewUser = async (p: Page, email: string) => {
    return p.evaluate(async ({ url, email }) => {
      const res = await fetch(`${url}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: 'Password123!' })
      });
      return { status: res.status, body: await res.json() };
    }, { url: API_URL, email });
  };

  test('Phase 1 - Refresh Token Rotation', async () => {
    console.log('\n--- PHASE 1: REFRESH TOKEN ROTATION ---');
    const email = `security_rotate_${Date.now()}@example.com`;
    const regResult = await registerNewUser(page, email);
    
    expect(regResult.status).toBe(201);
    expect(regResult.body.success).toBe(true);
    
    const { token: token1, refreshToken: refToken1 } = regResult.body.data;
    expect(token1).toBeTruthy();
    expect(refToken1).toBeTruthy();

    console.log('Triggering first token refresh...');
    const refreshResult1 = await page.evaluate(async ({ url, refreshToken }) => {
      const res = await fetch(`${url}/api/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken })
      });
      return { status: res.status, body: await res.json() };
    }, { url: API_URL, refreshToken: refToken1 });

    expect(refreshResult1.status).toBe(200);
    expect(refreshResult1.body.success).toBe(true);

    const { token: token2, refreshToken: refToken2 } = refreshResult1.body.data;
    expect(token2).toBeTruthy();
    expect(refToken2).toBeTruthy();
    expect(token2).not.toBe(token1);
    expect(refToken2).not.toBe(refToken1);
    console.log('Successfully rotated tokens. Old refresh token:', refToken1.slice(0, 10), 'New refresh token:', refToken2.slice(0, 10));

    // Attempt reuse of old refresh token
    console.log('Attempting reuse of the previous refresh token...');
    const reuseResult = await page.evaluate(async ({ url, refreshToken }) => {
      const res = await fetch(`${url}/api/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken })
      });
      return { status: res.status, body: await res.json() };
    }, { url: API_URL, refreshToken: refToken1 });

    console.log(`Reused token refresh result: status=${reuseResult.status}, body=`, JSON.stringify(reuseResult.body));
    // The server should reject it
    expect(reuseResult.status).toBe(401);

    // Verify session revocation (new refresh token should also become invalid due to reuse alert)
    console.log('Verifying session revocation rule (new refresh token should be revoked due to old token reuse)...');
    const newRefreshResult = await page.evaluate(async ({ url, refreshToken }) => {
      const res = await fetch(`${url}/api/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken })
      });
      return { status: res.status, body: await res.json() };
    }, { url: API_URL, refreshToken: refToken2 });

    console.log(`New token refresh result post-reuse: status=${newRefreshResult.status}, body=`, JSON.stringify(newRefreshResult.body));
    expect(newRefreshResult.status).toBe(401); // Replay detection should have revoked the whole session!
  });

  test('Phase 2 - Replay Attack Protection (Concurrent Requests)', async () => {
    console.log('\n--- PHASE 2: REPLAY PROTECTION (CONCURRENT) ---');
    const email = `security_replay_${Date.now()}@example.com`;
    const regResult = await registerNewUser(page, email);
    
    expect(regResult.status).toBe(201);
    const { refreshToken } = regResult.body.data;

    console.log('Sending two concurrent refresh requests with same refresh token in parallel...');
    const results = await page.evaluate(async ({ url, refreshToken }) => {
      const reqs = [1, 2].map(() => 
        fetch(`${url}/api/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken })
        }).then(async res => ({ status: res.status, body: await res.json().catch(() => ({})) }))
      );
      return Promise.all(reqs);
    }, { url: API_URL, refreshToken });

    console.log('Concurrent refresh results:', JSON.stringify(results, null, 2));

    // One of them might succeed and the other fail, OR if the first completes before second, the second is marked as reuse and revokes both.
    // In any case, we expect at most one succeeds, and no duplicate active sessions are created.
    const successes = results.filter(r => r.status === 200);
    const failures = results.filter(r => r.status !== 200);
    
    console.log(`Successes: ${successes.length}, Failures: ${failures.length}`);
    expect(successes.length).toBeLessThanOrEqual(1);
    expect(failures.length).toBeGreaterThanOrEqual(1);
  });

  test('Phase 3 - JWT Validation Edge Cases', async () => {
    console.log('\n--- PHASE 3: JWT VALIDATION EDGE CASES ---');
    
    // Helpers to test token validation status code and payload
    const testToken = async (authHeader: string | null) => {
      return page.evaluate(async ({ url, header }) => {
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (header !== null) {
          headers['Authorization'] = header;
        }
        const res = await fetch(`${url}/api/profile`, {
          method: 'GET',
          headers
        });
        return { status: res.status, body: await res.json().catch(() => ({})) };
      }, { url: API_URL, header: authHeader });
    };

    const cases = [
      { name: 'Missing Authorization header', header: null, expectedStatus: 401 },
      { name: 'Empty Token', header: 'Bearer ', expectedStatus: 401 },
      { name: 'Random/Gibberish Token', header: 'Bearer random_gibberish_12345', expectedStatus: 401 },
      { name: 'Incorrect Bearer format (no space)', header: 'Bearerrandom_token', expectedStatus: 401 },
      { name: 'Incorrect Bearer prefix', header: 'Token random_token', expectedStatus: 401 },
      { name: 'Malformed JWT signature', header: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxMjMifQ.malformed_signature', expectedStatus: 401 },
    ];

    for (const c of cases) {
      console.log(`Testing JWT case: ${c.name}`);
      const res = await testToken(c.header);
      console.log(`Result: status=${res.status}, success=${res.body.success}, error=`, res.body.error);
      expect(res.status).toBe(c.expectedStatus);
      expect(res.body.success).toBe(false);
      // Ensure no internal stack trace is exposed
      expect(JSON.stringify(res.body)).not.toContain('Stack');
      expect(JSON.stringify(res.body)).not.toContain('mongoose');
    }
  });

  test('Phase 4 - Authorization & IDOR/BOLA', async () => {
    console.log('\n--- PHASE 4: AUTHORIZATION (BOLA/IDOR) ---');
    const emailA = `user_a_${Date.now()}@example.com`;
    const emailB = `user_b_${Date.now()}@example.com`;

    console.log('Registering User A...');
    const regA = await registerNewUser(page, emailA);
    const tokenA = regA.body.data.token;

    console.log('Registering User B...');
    const regB = await registerNewUser(page, emailB);
    const tokenB = regB.body.data.token;

    // Create a smart account for User B to generate an address
    console.log('Creating Smart Account for User B...');
    const saResultB = await page.evaluate(async ({ url, token }) => {
      const res = await fetch(`${url}/api/accounts/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ chainId: 84532, walletID: 'ALCHEMY', accountType: 'default' })
      });
      return { status: res.status, body: await res.json() };
    }, { url: API_URL, token: tokenB });

    expect(saResultB.status).toBe(201);
    const userBAddress = saResultB.body.data.smartAccount.address;
    console.log(`User B Smart Account Address: ${userBAddress}`);

    // User A attempts to access User B's smart account details directly by address parameter
    console.log(`User A attempts to fetch details of User B's address: ${userBAddress}...`);
    const bolaResult = await page.evaluate(async ({ url, token, address }) => {
      const res = await fetch(`${url}/api/accounts/${address}?chainId=84532`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      return { status: res.status, body: await res.json() };
    }, { url: API_URL, token: tokenA, address: userBAddress });

    console.log(`BOLA Request result: status=${bolaResult.status}, success=${bolaResult.body.success}, error=`, JSON.stringify(bolaResult.body.error));
    
    // Assert BOLA is blocked and returns 403 Forbidden
    expect(bolaResult.status).toBe(403);
    expect(bolaResult.body.success).toBe(false);
    expect(bolaResult.body.error.code).toBe('FORBIDDEN');
    console.log('PASS: getSmartAccountDetails is protected. Access denied with status:', bolaResult.status);
  });

  test('Phase 5 - Rate Limiting', async () => {
    console.log('\n--- PHASE 5: RATE LIMITING ---');
    console.log('Sending 35 invalid login requests in rapid succession to trigger rate limiter...');
    
    const results = await page.evaluate(async ({ url }) => {
      const attempts = [];
      for (let i = 0; i < 35; i++) {
        attempts.push(
          fetch(`${url}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'rate_limit_test@example.com', password: 'WrongPassword!' })
          }).then(res => res.status)
        );
        // Short pause to avoid sockets starvation but keep it fast
        await new Promise(r => setTimeout(r, 20));
      }
      return Promise.all(attempts);
    }, { url: API_URL });

    const statusCounts = results.reduce((acc, status) => {
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);

    console.log('Rate limiting response status codes distribution:', statusCounts);
    
    // Expected: some 429 Too Many Requests status codes should appear at the end
    expect(statusCounts[429]).toBeGreaterThan(0);
  });

  test('Phase 6 - Logout Invalidation', async () => {
    console.log('\n--- PHASE 6: LOGOUT INVALIDATION ---');
    const email = `logout_sec_${Date.now()}@example.com`;
    const regResult = await registerNewUser(page, email);
    
    const { token, refreshToken } = regResult.body.data;
    
    console.log('Logging out user...');
    const logoutRes = await page.evaluate(async ({ url, token, refreshToken }) => {
      const res = await fetch(`${url}/api/auth/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ refreshToken })
      });
      return { status: res.status, body: await res.json() };
    }, { url: API_URL, token, refreshToken });

    expect(logoutRes.status).toBe(200);
    console.log('Logout response:', JSON.stringify(logoutRes.body));

    // Try accessing protected page using blacklisted access token
    console.log('Trying to access /api/profile with logged-out access token...');
    const accessTry = await page.evaluate(async ({ url, token }) => {
      const res = await fetch(`${url}/api/profile`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      return res.status;
    }, { url: API_URL, token });
    console.log(`Access try status: ${accessTry}`);
    expect(accessTry).toBe(401);

    // Try refreshing using logged-out refresh token
    console.log('Trying to refresh session with logged-out refresh token...');
    const refreshTry = await page.evaluate(async ({ url, refreshToken }) => {
      const res = await fetch(`${url}/api/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken })
      });
      return res.status;
    }, { url: API_URL, refreshToken });
    console.log(`Refresh try status: ${refreshTry}`);
    expect(refreshTry).toBe(401);
  });

  test('Phase 12 - Security Headers and CORS', async ({ request }) => {
    console.log('\n--- PHASE 12: SECURITY HEADERS & CORS ---');
    
    const res = await request.get(`${API_URL}/api/health`);
    const headers = res.headers();

    console.log('Backend response headers:', JSON.stringify(headers, null, 2));

    // Verify key security headers
    console.log('Verifying Content-Security-Policy...');
    expect(headers['content-security-policy']).toBeDefined();
    
    console.log('Verifying X-Content-Type-Options...');
    expect(headers['x-content-type-options']).toBe('nosniff');

    console.log('Verifying X-Frame-Options...');
    expect(headers['x-frame-options']).toBeDefined();

    console.log('Verifying Referrer-Policy...');
    expect(headers['referrer-policy']).toBeDefined();

    console.log('Verifying CORS Access-Control-Allow-Origin...');
    const corsRes = await request.get(`${API_URL}/api/health`, {
      headers: { 'Origin': BASE_URL }
    });
    const corsHeaders = corsRes.headers();

    console.log('CORS headers for origin:', corsHeaders['access-control-allow-origin']);
    expect(corsHeaders['access-control-allow-origin']).toBe(BASE_URL);
    expect(corsHeaders['access-control-allow-credentials']).toBe('true');
  });
});

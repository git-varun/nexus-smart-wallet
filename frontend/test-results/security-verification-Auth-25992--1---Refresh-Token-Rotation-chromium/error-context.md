# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: security-verification.spec.ts >> Authentication Security & Edge Cases >> Phase 1 - Refresh Token Rotation
- Location: security-verification.spec.ts:36:3

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
  4   | const API_URL = 'http://localhost:3001';
  5   | 
  6   | test.describe.configure({ mode: 'serial' });
  7   | 
  8   | test.describe('Authentication Security & Edge Cases', () => {
  9   |   let context: BrowserContext;
  10  |   let page: Page;
  11  | 
  12  |   test.beforeAll(async ({ browser }) => {
  13  |     context = await browser.newContext();
  14  |     page = await context.newPage();
  15  |     // Navigate to base URL to establish origin for fetch requests
> 16  |     await page.goto(BASE_URL);
      |                ^ Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:8080/
  17  |     await page.waitForLoadState('load');
  18  |   });
  19  | 
  20  |   test.afterAll(async () => {
  21  |     await context.close();
  22  |   });
  23  | 
  24  |   // Helper to register a new user in the browser context
  25  |   const registerNewUser = async (p: Page, email: string) => {
  26  |     return p.evaluate(async ({ url, email }) => {
  27  |       const res = await fetch(`${url}/api/auth/register`, {
  28  |         method: 'POST',
  29  |         headers: { 'Content-Type': 'application/json' },
  30  |         body: JSON.stringify({ email, password: 'Password123!' })
  31  |       });
  32  |       return { status: res.status, body: await res.json() };
  33  |     }, { url: API_URL, email });
  34  |   };
  35  | 
  36  |   test('Phase 1 - Refresh Token Rotation', async () => {
  37  |     console.log('\n--- PHASE 1: REFRESH TOKEN ROTATION ---');
  38  |     const email = `security_rotate_${Date.now()}@example.com`;
  39  |     const regResult = await registerNewUser(page, email);
  40  |     
  41  |     expect(regResult.status).toBe(201);
  42  |     expect(regResult.body.success).toBe(true);
  43  |     
  44  |     const { token: token1, refreshToken: refToken1 } = regResult.body.data;
  45  |     expect(token1).toBeTruthy();
  46  |     expect(refToken1).toBeTruthy();
  47  | 
  48  |     console.log('Triggering first token refresh...');
  49  |     const refreshResult1 = await page.evaluate(async ({ url, refreshToken }) => {
  50  |       const res = await fetch(`${url}/api/auth/refresh`, {
  51  |         method: 'POST',
  52  |         headers: { 'Content-Type': 'application/json' },
  53  |         body: JSON.stringify({ refreshToken })
  54  |       });
  55  |       return { status: res.status, body: await res.json() };
  56  |     }, { url: API_URL, refreshToken: refToken1 });
  57  | 
  58  |     expect(refreshResult1.status).toBe(200);
  59  |     expect(refreshResult1.body.success).toBe(true);
  60  | 
  61  |     const { token: token2, refreshToken: refToken2 } = refreshResult1.body.data;
  62  |     expect(token2).toBeTruthy();
  63  |     expect(refToken2).toBeTruthy();
  64  |     expect(token2).not.toBe(token1);
  65  |     expect(refToken2).not.toBe(refToken1);
  66  |     console.log('Successfully rotated tokens. Old refresh token:', refToken1.slice(0, 10), 'New refresh token:', refToken2.slice(0, 10));
  67  | 
  68  |     // Attempt reuse of old refresh token
  69  |     console.log('Attempting reuse of the previous refresh token...');
  70  |     const reuseResult = await page.evaluate(async ({ url, refreshToken }) => {
  71  |       const res = await fetch(`${url}/api/auth/refresh`, {
  72  |         method: 'POST',
  73  |         headers: { 'Content-Type': 'application/json' },
  74  |         body: JSON.stringify({ refreshToken })
  75  |       });
  76  |       return { status: res.status, body: await res.json() };
  77  |     }, { url: API_URL, refreshToken: refToken1 });
  78  | 
  79  |     console.log(`Reused token refresh result: status=${reuseResult.status}, body=`, JSON.stringify(reuseResult.body));
  80  |     // The server should reject it
  81  |     expect(reuseResult.status).toBe(401);
  82  | 
  83  |     // Verify session revocation (new refresh token should also become invalid due to reuse alert)
  84  |     console.log('Verifying session revocation rule (new refresh token should be revoked due to old token reuse)...');
  85  |     const newRefreshResult = await page.evaluate(async ({ url, refreshToken }) => {
  86  |       const res = await fetch(`${url}/api/auth/refresh`, {
  87  |         method: 'POST',
  88  |         headers: { 'Content-Type': 'application/json' },
  89  |         body: JSON.stringify({ refreshToken })
  90  |       });
  91  |       return { status: res.status, body: await res.json() };
  92  |     }, { url: API_URL, refreshToken: refToken2 });
  93  | 
  94  |     console.log(`New token refresh result post-reuse: status=${newRefreshResult.status}, body=`, JSON.stringify(newRefreshResult.body));
  95  |     expect(newRefreshResult.status).toBe(401); // Replay detection should have revoked the whole session!
  96  |   });
  97  | 
  98  |   test('Phase 2 - Replay Attack Protection (Concurrent Requests)', async () => {
  99  |     console.log('\n--- PHASE 2: REPLAY PROTECTION (CONCURRENT) ---');
  100 |     const email = `security_replay_${Date.now()}@example.com`;
  101 |     const regResult = await registerNewUser(page, email);
  102 |     
  103 |     expect(regResult.status).toBe(201);
  104 |     const { refreshToken } = regResult.body.data;
  105 | 
  106 |     console.log('Sending two concurrent refresh requests with same refresh token in parallel...');
  107 |     const results = await page.evaluate(async ({ url, refreshToken }) => {
  108 |       const reqs = [1, 2].map(() => 
  109 |         fetch(`${url}/api/auth/refresh`, {
  110 |           method: 'POST',
  111 |           headers: { 'Content-Type': 'application/json' },
  112 |           body: JSON.stringify({ refreshToken })
  113 |         }).then(async res => ({ status: res.status, body: await res.json().catch(() => ({})) }))
  114 |       );
  115 |       return Promise.all(reqs);
  116 |     }, { url: API_URL, refreshToken });
```
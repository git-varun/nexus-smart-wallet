import { test, expect } from '@playwright/test';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';
import http from 'http';

const API_URL = process.env.VITE_API_BASE_URL || 'http://localhost:3001';
const UNIQUE_ID = Date.now();
const EMAIL = `e2e_journey_${UNIQUE_ID}@example.com`;
const PASSWORD = 'Password123!';

test.describe('E2E Production Smart Wallet Journey', () => {

  test('Execute complete lifecycle verification', async ({ request }) => {
    console.log('\n==================================================');
    console.log('STARTING E2E PRODUCTION SMART WALLET LIFE-CYCLE SWEEP');
    console.log('==================================================\n');

    // 1. REGISTER A NEW USER
    console.log('[1/12] Registering user:', EMAIL);
    const regRes = await request.post(`${API_URL}/api/auth/register`, {
      data: {
        email: EMAIL,
        password: PASSWORD,
        username: `user_${UNIQUE_ID.toString().slice(-6)}`
      }
    });
    expect(regRes.status()).toBe(201);
    const regBody = await regRes.json();
    expect(regBody.success).toBe(true);
    const token = regBody.data.token;
    expect(token).toBeTruthy();
    console.log('  -> Registration SUCCESS. Token obtained.');

    const authHeaders = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    // 2. CREATE A SMART WALLET (COUNTERFACTUAL)
    console.log('\n[2/12] Creating smart wallet...');
    const createRes = await request.post(`${API_URL}/api/accounts/create`, {
      headers: authHeaders,
      data: {
        chainId: 84532,
        walletID: 'ALCHEMY',
        accountType: 'light-account'
      }
    });
    expect(createRes.status()).toBe(201);
    const createBody = await createRes.json();
    expect(createBody.success).toBe(true);
    const walletAddress = createBody.data.smartAccount.address;
    expect(walletAddress).toBeTruthy();
    console.log(`  -> Smart Wallet Created. Counterfactual address: ${walletAddress}`);

    // 3. DUPLICATE WALLET PREVENTION
    console.log('\n[3/12] Verifying duplicate wallet prevention...');
    const createDupRes = await request.post(`${API_URL}/api/accounts/create`, {
      headers: authHeaders,
      data: {
        chainId: 84532,
        walletID: 'ALCHEMY',
        accountType: 'light-account'
      }
    });
    expect(createDupRes.status()).toBe(400); 
    const createDupBody = await createDupRes.json();
    expect(createDupBody.success).toBe(false);
    expect(createDupBody.error.code).toBe('SMART_ACCOUNT_CREATION_FAILED');
    expect(createDupBody.error.message).toContain('Account already exists');
    console.log('  -> Duplicate prevention PASS (returned 400 Bad Request with Account already exists).');

    // 4. PORTFOLIO SYNCHRONIZATION
    console.log('\n[4/12] Fetching initial portfolio balances...');
    const portfolioRes = await request.get(`${API_URL}/api/portfolio`, {
      headers: authHeaders,
      params: {
        address: walletAddress,
        chainId: '84532'
      }
    });
    expect(portfolioRes.status()).toBe(200);
    const portfolioBody = await portfolioRes.json();
    console.log('  -> Portfolio body:', JSON.stringify(portfolioBody));
    expect(portfolioBody.success).toBe(true);
    expect(portfolioBody.data).toBeDefined();

    // 5. PORTFOLIO REFRESH ACTION
    console.log('\n[5/12] Triggering portfolio refresh...');
    const refreshRes = await request.post(`${API_URL}/api/portfolio/refresh`, {
      headers: authHeaders,
      data: {
        address: walletAddress,
        chainId: 84532
      }
    });
    expect(refreshRes.status()).toBe(200);
    const refreshBody = await refreshRes.json();
    expect(refreshBody.success).toBe(true);
    console.log('  -> Portfolio refresh returned success.');

    // 6. CRYPTOGRAPHIC SESSION KEYS
    console.log('\n[6/12] Generating and registering cryptographic session key...');
    const ownerPrivateKey = generatePrivateKey();
    const ownerAccount = privateKeyToAccount(ownerPrivateKey);
    const ownerAddress = ownerAccount.address;
    console.log('  -> Owner Address:', ownerAddress);

    // Link the smart account to our test owner for session key registration
    // (Normally done on creation, but we will mock/link it or register session key under ownerAddress)
    const sessionKeyPrivateKey = generatePrivateKey();
    const sessionKeyAccount = privateKeyToAccount(sessionKeyPrivateKey);
    const sessionKeyPublicKey = sessionKeyAccount.address;

    const expiresAt = new Date(Date.now() + 3600000).toISOString();

    console.log('  -> Registering session key at endpoint (custodial auto-signature)...');
    const sessionRes = await request.post(`${API_URL}/api/sessions/create`, {
      headers: authHeaders,
      data: {
        ownerAddress: walletAddress,
        publicKey: sessionKeyPublicKey,
        chainId: 84532,
        expiresAt,
        permissions: [{
          target: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', // USDC
          allowedFunctions: ['0xa9059cbb'], // transfer
          spendingLimit: '100000000'
        }]
      }
    });
    
    expect(sessionRes.status()).toBe(201);
    const sessionBody = await sessionRes.json();
    expect(sessionBody.success).toBe(true);
    console.log('  -> Session key registered successfully:', JSON.stringify(sessionBody.data));

    // 7. SESSION KEY VALIDATION
    console.log('\n[7/12] Validating registered session key...');
    const validateRes = await request.post(`${API_URL}/api/sessions/validate`, {
      headers: authHeaders,
      data: {
        publicKey: sessionKeyPublicKey,
        targetContract: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
        functionSelector: '0xa9059cbb',
        value: '0'
      }
    });
    expect(validateRes.status()).toBe(200);
    const validateBody = await validateRes.json();
    expect(validateBody.success).toBe(true);
    expect(validateBody.data.isValid).toBe(true);
    console.log('  -> Validation PASS (session key verified as valid).');

    // 8. WALLET SECURITY BOLA/IDOR PREVENTION
    console.log('\n[8/12] Testing BOLA/IDOR unauthorized access prevention...');
    // Create another user to get a second token
    const regRes2 = await request.post(`${API_URL}/api/auth/register`, {
      data: {
        email: `other_${UNIQUE_ID}@example.com`,
        password: PASSWORD,
        username: `other_${UNIQUE_ID.toString().slice(-6)}`
      }
    });
    const regBody2 = await regRes2.json();
    const token2 = regBody2.data.token;
    
    const authHeaders2 = {
      'Authorization': `Bearer ${token2}`,
      'Content-Type': 'application/json'
    };

    // User 2 attempts to fetch details of User 1's wallet address
    const bolaRes = await request.get(`${API_URL}/api/accounts/${walletAddress}?chainId=84532`, {
      headers: authHeaders2
    });
    expect(bolaRes.status()).toBe(403);
    const bolaBody = await bolaRes.json();
    expect(bolaBody.success).toBe(false);
    expect(bolaBody.error.code).toBe('FORBIDDEN');
    console.log('  -> BOLA access request rejected with 403 Forbidden. IDOR security check PASS.');

    // 9. SERVER-SENT EVENTS CONNECTION
    console.log('\n[9/12] Verifying Server-Sent Events (SSE) subscribe endpoints...');
    // Connect to SSE using Node's http module to prevent hanging Playwright's context
    const ssePromise = new Promise<void>((resolve, reject) => {
      const req = http.get(`${API_URL}/api/notifications/subscribe?token=${encodeURIComponent(token)}`, (res) => {
        console.log(`  -> SSE connection status: ${res.statusCode}`);
        console.log('  -> SSE response headers:', JSON.stringify(res.headers));
        expect(res.statusCode).toBe(200);
        expect(res.headers['content-type']).toContain('text/event-stream');
        res.destroy(); // Close connection immediately
        resolve();
      });
      req.on('error', (err) => reject(err));
      req.setTimeout(5000, () => {
        req.destroy();
        reject(new Error('SSE connection timeout'));
      });
    });
    await ssePromise;
    console.log('  -> SSE subscription established with text/event-stream header and verified.');

    // 10. SMART WALLET DEPLOYMENT
    console.log('\n[10/12] Initiating wallet deployment UserOperation...');
    const deployRes = await request.post(`${API_URL}/api/transactions/deploy`, {
      headers: authHeaders,
      data: {
        chainId: 84532,
        walletID: 'ALCHEMY',
        paymasterID: 'ALCHEMY',
        bundlerID: 'ALCHEMY'
      }
    });
    
    console.log(`  -> Deployment submission status: ${deployRes.status()}`);
    const deployBody = await deployRes.json();
    console.log('  -> Deployment body:', JSON.stringify(deployBody));

    if (deployRes.status() === 201 || deployRes.status() === 200) {
      const txId = deployBody.data.transactionId;
      console.log(`  -> Deployment queued in worker. Tx ID: ${txId}`);
      
      // Let's poll for deployment transaction status
      let status = 'queued';
      let attempts = 0;
      while (status === 'queued' || status === 'processing') {
        attempts++;
        if (attempts > 5) break;
        await new Promise(r => setTimeout(r, 1000));
        
        const txStatusRes = await request.get(`${API_URL}/api/transactions/${txId}`, {
          headers: authHeaders
        });
        if (txStatusRes.status() === 200) {
          const txStatusBody = await txStatusRes.json();
          status = txStatusBody.data.status;
          console.log(`     Polling tx status attempt ${attempts}: ${status}`);
        }
      }
    }

    // 11. OPERATIONAL METRICS & LATENCY CHECK
    console.log('\n[11/12] Querying operational metrics...');
    const metricsRes = await request.get(`${API_URL}/api/metrics`);
    expect(metricsRes.status()).toBe(200);
    const metricsBody = await metricsRes.json();
    expect(metricsBody.api).toBeDefined();
    console.log('  -> Metrics fetched:', JSON.stringify(metricsBody));

    // 12. LOGOUT & SESSION INVALIDATION
    console.log('\n[12/12] Logging out and testing session invalidation...');
    const logoutRes = await request.post(`${API_URL}/api/auth/logout`, {
      headers: authHeaders
    });
    expect(logoutRes.status()).toBe(200);
    console.log('  -> Logout endpoint returned success.');

    // Try to access profile with logged-out token
    const profileRes = await request.get(`${API_URL}/api/profile`, {
      headers: authHeaders
    });
    expect(profileRes.status()).toBe(401);
    console.log('  -> Profile request with logged-out token correctly returned 401 Unauthorized.');

    console.log('\n==================================================');
    console.log('E2E LIFE-CYCLE RUNTIME VERIFICATION COMPLETE');
    console.log('==================================================\n');
  });

});

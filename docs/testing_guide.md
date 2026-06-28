# Nexus Smart Wallet — Integration & Testing Guide

This guide describes the testing framework, local EVM node integration (Anvil), in-memory database setups, and mocking policy.

---

## 1. Testing Framework Structure

The backend uses **Jest** with `ts-jest` for testing.

```
backend/tests/
├── unit/               # Unit tests checking isolated business rules
│   └── signer.service.test.ts
├── integration/        # Integration tests using database and blockchain processes
│   ├── database.test.ts      # Mongo memory server CRUD tests
│   ├── anvil.test.ts         # Programmatic local Anvil blockchain node tests
│   ├── sessionKey.test.ts    # Cryptographic signature validation flow tests
│   ├── concurrency.test.ts   # Concurrency race tests for nonce updates
│   └── transaction.service.test.ts
├── api/                # API route level checks (auth registration validation)
│   └── auth.test.ts
├── mocks/              # Shared mocking utilities
│   ├── blockchain.mock.ts
│   └── database.mock.ts
└── harness/            # Harness scripts to debug specific worker states
```

---

## 2. Infrastructure Setup (Local EVM & Database)

To ensure tests represent real production environments, mocks are replaced with programmatic database and blockchain runners.

### A. Programmatic Local EVM Node (Anvil)
Anvil (from the Foundry toolkit) is spawned programmatically in `anvil.test.ts` and `concurrency.test.ts` to execute transaction receipts on-chain.
* **Launch configuration:**
  ```typescript
  import { spawn } from "child_process";
  
  // Spawns Anvil matching local viem chains (localhost ID 1337)
  const anvilProcess = spawn("anvil", ["--port", "8545", "--chain-id", "1337"]);
  ```
* **Teardown:**
  ```typescript
  anvilProcess.kill();
  ```
* **Viem Integration:** RPC URLs point to `http://127.0.0.1:8545`.

### B. In-Memory Database (`mongodb-memory-server`)
Enables full CRUD assertions against MongoDB.
* **Launch configuration:**
  ```typescript
  import mongoose from "mongoose";
  import { MongoMemoryServer } from "mongodb-memory-server";
  
  const mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
  ```
* **Teardown:**
  ```typescript
  await mongoose.disconnect();
  await mongoServer.stop();
  ```

---

## 3. Mocking Policy

* **Database Queries:** Integration tests must query the in-memory Mongo database directly. Mocks are only allowed in pure unit tests.
* **Smart Account Clients:** Mocks are restricted to external RPC paymaster and bundler endpoints (e.g. Alchemy API routes and Pimlico sponsorship APIs) since Base Sepolia testnets are not run locally during offline test sweeps.
* **Jest Mock Isolation:**
  * The configuration file `jest.config.js` sets `resetMocks: true`, which resets mocked endpoints before each test.
  * Define mocks inside `beforeEach` hooks to prevent state pollution across tests.

---

## 4. Running the Tests

### Requirements
* Install Foundry (which includes the `anvil` CLI):
  ```bash
  curl -L https://foundry.paradigm.xyz | bash
  foundryup
  ```

### Run Commands
```bash
# Run all tests
cd backend
npm test

# Run a specific test suite
npx jest tests/integration/concurrency.test.ts
```

### Zero Open Handles Verification
Ensure Jest exits cleanly without leaks:
1. Always close connection pools (`mongoose.disconnect()`) and stop background service listeners inside `afterAll` hooks.
2. In `rateLimiter.middleware.ts`, the periodic eviction interval is un-ref'd (`interval.unref()`), allowing the Node.js event loop to exit even if the timer is still active.
3. Call `redis.quit()` on all active Redis instances.

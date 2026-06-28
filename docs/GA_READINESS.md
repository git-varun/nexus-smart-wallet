# GA Readiness Plan — Nexus Smart Wallet

This document serves as the canonical General Availability (GA) Readiness Plan and production release roadmap for the **Nexus Smart Wallet** platform. As the Principal Software Architect and Release Manager, I have conducted a deep codebase audit of the backend, frontend, configuration, and testing files. 

This roadmap outlines all remaining gaps that must be resolved prior to a production mainnet launch. Findings are categorized by severity, detailing their impact, affected files, recommended implementations, estimated efforts, and target release milestones.

---

## 1. Executive Summary & Quality Gates

Before launching the Nexus Smart Wallet on EVM mainnets, the platform must transition from its current Release Candidate (RC) state to a hardened, secure, and production-ready architecture. This plan identifies **20 gaps** categorized as follows:

| Severity | Count | Definition / Gateway Criteria |
| :--- | :---: | :--- |
| **Critical** | 2 | Must fix immediately. Code exhibits severe bugs causing platform-wide denial of service or critical functionality blocks. |
| **High** | 5 | Must fix before mainnet. High-risk security vulnerabilities, broken user flows, or immediate DoS vulnerabilities. |
| **Medium** | 5 | Recommended before mainnet. Operational risks, database query degradation, user privacy leaks, or connection dropouts. |
| **Low** | 3 | Minor issues, deprecated testnet configurations, or broken test suites that do not block core runtime logic. |
| **Technical Debt** | 2 | General code health, linting warnings, or bundle size optimizations. Can be deferred post-launch. |
| **Enhancement** | 3 | High-value security hardening and UX features planned for post-GA or v1.1. |

---

## 2. Comprehensive Findings & Implementation Roadmap

### A. Critical Gaps

#### 1. Head-of-Line (HOL) Blocking in Transaction Queue Worker
* **Severity:** 🔥 CRITICAL
* **Release Milestone:** GA Release Candidate (Pre-Mainnet)
* **Estimated Effort:** 1–2 Days
* **Affected Files:**
  * [`backend/src/services/worker.service.ts`](file:///home/dev-var/Personal/Projects/nexus-smart-wallet/backend/src/services/worker.service.ts) (specifically `processQueue` method)
* **Description:** 
  In the transaction queue worker (`processQueue`), the query fetches all transactions in `queued` or `retrying` status, sorted by creation date. It selects the oldest transaction (`targetTx`). It then performs a concurrency safety check: if there is *any* active transaction in `processing` or `submitted` status for that specific account (`targetTx.accountId`), the function terminates early with a simple `return;`.
  
  Because the loop breaks and returns immediately, the worker stops scanning the queue. Consequently, a single pending transaction for User A will completely halt the transaction queue for User B, User C, and all other users on the platform, even if those other accounts are idle and ready to process.
* **Impact:** 
  Severe platform-wide Denial of Service (DoS) under concurrent usage. If one user's transaction gets stuck in `submitted` state (e.g. due to gas pricing hikes or RPC latency), no other user on the entire platform can execute transactions.
* **Recommended Implementation:**
  Modify `processQueue` to continue scanning other queued transactions instead of returning immediately, or update the database query to exclude transactions whose `accountId` is already in a "busy" list (i.e. has active transactions in `processing` or `submitted` status).
  ```typescript
  // Example fix: query queued transactions whose accounts are not currently busy
  const busyAccounts = await TransactionModel.find({
      status: { $in: ['processing', 'submitted'] }
  }).distinct('accountId');

  const nextAvailableTx = await TransactionModel.findOne({
      status: { $in: ['queued', 'retrying'] },
      accountId: { $nin: busyAccounts }
  }).sort({ createdAt: 1 });
  ```

#### 2. Session Key Feature Integration Gap (Orphaned Feature)
* **Severity:** 🔥 CRITICAL
* **Release Milestone:** GA Release Candidate (Pre-Mainnet)
* **Estimated Effort:** 5–7 Days
* **Affected Files:**
  * [`backend/src/routes/index.ts`](file:///home/dev-var/Personal/Projects/nexus-smart-wallet/backend/src/routes/index.ts)
  * [`backend/src/controllers/transaction.controller.ts`](file:///home/dev-var/Personal/Projects/nexus-smart-wallet/backend/src/controllers/transaction.controller.ts)
  * [`backend/src/services/transaction.service.ts`](file:///home/dev-var/Personal/Projects/nexus-smart-wallet/backend/src/services/transaction.service.ts)
  * [`backend/src/services/worker.service.ts`](file:///home/dev-var/Personal/Projects/nexus-smart-wallet/backend/src/services/worker.service.ts)
* **Description:** 
  The backend implements routes, schemas, and services to create, list, revoke, and validate session keys (`/sessions/*`). However, this entire feature is disconnected from the transaction execution workflow. The transaction controller's send routes (`/transactions/send` and `/transactions/batch`) require full user JWT authentication (`requireAuth`) and do not accept session key signatures. The queue worker completely ignores session permissions and executes all transactions directly using the custodial relayer key without validating if a valid session key authorized the payload.
* **Impact:** 
  The session key feature is dead code in production. Clients cannot execute transactions on behalf of smart accounts using session keys, making dApp integrations impossible.
* **Recommended Implementation:**
  Create a new endpoint (e.g., `POST /api/transactions/send-session-key`) or extend `POST /api/transactions/send` to accept a session key signature. The backend must:
  1. Recover the session key signer address from the transaction payload signature.
  2. Call `validateSessionKeyService` to ensure the session key is active, not expired, authorized for the target contract and function selector, and within the spending limit.
  3. Decrement the spending limit in the session key record.
  4. Enqueue the transaction with a reference to the authorizing session key.

---

### B. High Gaps

#### 3. Rate Limiter Trust Proxy Security Defect
* **Severity:** 🚨 HIGH
* **Release Milestone:** GA Release Candidate (Pre-Mainnet)
* **Estimated Effort:** 1 Hour
* **Affected Files:**
  * [`backend/src/app.ts`](file:///home/dev-var/Personal/Projects/nexus-smart-wallet/backend/src/app.ts)
  * [`backend/src/middleware/rateLimiter.middleware.ts`](file:///home/dev-var/Personal/Projects/nexus-smart-wallet/backend/src/middleware/rateLimiter.middleware.ts)
* **Description:** 
  The Express app does not set `app.set('trust proxy', true)`. In the rate limiter middleware, the client IP is extracted via `req.ip || req.socket.remoteAddress || 'unknown'`.
* **Impact:** 
  When the application is deployed behind a reverse proxy (e.g. Nginx, AWS ALB, Cloudflare), Express will resolve `req.ip` to the local loopback address (`127.0.0.1`) or the load balancer's internal IP address for all incoming requests. As a result, all users share the same rate-limit bucket. If a single user triggers a rate limit (e.g. 15 wallet creation requests in 15 minutes), the entire platform will block all users with an HTTP 429 error.
* **Recommended Implementation:**
  Add the trust proxy directive during the Express application bootstrap:
  ```typescript
  // backend/src/app.ts
  const app = express();
  app.set('trust proxy', true); // Or configure it conditionally based on NODE_ENV
  ```

#### 4. Auto-Registration Flow with Hardcoded Insecure Passwords
* **Severity:** 🚨 HIGH
* **Release Milestone:** GA Release Candidate (Pre-Mainnet)
* **Estimated Effort:** 2–3 Days
* **Affected Files:**
  * [`frontend/src/entities/wallet/hooks/useBackendSmartAccount.ts`](file:///home/dev-var/Personal/Projects/nexus-smart-wallet/frontend/src/entities/wallet/hooks/useBackendSmartAccount.ts) (specifically the `connect` callback)
* **Description:** 
  In the frontend's authentication hook, if a login attempt fails with `INVALID_CREDENTIALS` or indicates the user does not exist, the hook automatically calls the registration endpoint using the input email and a default hardcoded password: `password || 'password123'`. 
* **Impact:** 
  Severe security risk. If a user registers their email but makes a typo during their first login, they might inadvertently register a new, insecure account with a default password of `'password123'`. Furthermore, attackers can exploit this flow to claim and register arbitrary email addresses with weak default credentials.
* **Recommended Implementation:**
  Remove the auto-registration fallback and the hardcoded password logic from the login hook. Separate the login and registration interfaces completely, forcing users to explicitly sign up with a custom, strong password that conforms to the password strength policy.

#### 5. DoS Vulnerability in Portfolio Sync via Sequential RPC Querying
* **Severity:** 🚨 HIGH
* **Release Milestone:** GA Release Candidate (Pre-Mainnet)
* **Estimated Effort:** 2–3 Days
* **Affected Files:**
  * [`backend/src/services/portfolio.service.ts`](file:///home/dev-var/Personal/Projects/nexus-smart-wallet/backend/src/services/portfolio.service.ts) (specifically `syncPortfolio` method)
* **Description:** 
  When syncing user token balances, the backend fetches ERC-20 token balances from Alchemy. For every non-zero balance returned, the code calls `fetchERC20Metadata` sequentially inside a `for` loop to retrieve the token's name, symbol, and decimals. Each metadata query makes 3 sequential `readContract` RPC calls.
* **Impact:** 
  If a user holds multiple ERC-20 assets (including spam or airdropped tokens), the sync query will execute dozens of sequential RPC reads. This triggers severe API response latency (exceeding 10+ seconds), leads to request timeouts, and risks rate-limiting (HTTP 429) the application's RPC provider connection.
* **Recommended Implementation:**
  1. Cache resolved token metadata in a dedicated `TokenMetadata` MongoDB collection so that RPC lookups are only executed once per unique token contract address.
  2. Implement a multicall contract interface to batch multiple token queries into a single RPC execution payload.
  3. Execute RPC queries in parallel with a concurrency control helper (e.g. `p-limit`) instead of sequential `for` loops.

#### 6. Missing Client-Side Session Key Signing for Non-Custodial Wallets
* **Severity:** 🚨 HIGH
* **Release Milestone:** GA Release Candidate (Pre-Mainnet)
* **Estimated Effort:** 2–3 Days
* **Affected Files:**
  * [`frontend/src/entities/sessionKey/hooks/useSessionKeys.ts`](file:///home/dev-var/Personal/Projects/nexus-smart-wallet/frontend/src/entities/sessionKey/hooks/useSessionKeys.ts)
  * [`frontend/src/widgets/SecurityWidget/SecurityWidget.tsx`](file:///home/dev-var/Personal/Projects/nexus-smart-wallet/frontend/src/widgets/SecurityWidget/SecurityWidget.tsx)
* **Description:** 
  The session key registration endpoint (`POST /sessions/create`) requires a cryptographic signature proof from non-custodial smart account owners. In the frontend query hook (`useSessionKeys.ts`), the API request is dispatched with the `ownerAddress`, `publicKey`, `permissions`, and `expiresAt` but completely omits the `signature` payload.
* **Impact:** 
  Creating a session key fails with a `SIGNATURE_REQUIRED` error (HTTP 400) for all non-custodial accounts (e.g., wallets connected via RainbowKit/MetaMask), locking users out of secure session management.
* **Recommended Implementation:**
  Update the frontend hook to prompt the user's browser wallet to sign the authorization message using `viem` or `wagmi` before sending the registration request. The signature must then be appended to the API payload.
  ```typescript
  // Message structure in backend:
  const message = `Register session key: ${publicKey.toLowerCase()}\nOwner: ${ownerAddress.toLowerCase()}\nChain ID: ${chainId}\nExpires At: ${expiresAt || 'Never'}`;
  ```

#### 7. Selected Session Key Ignored on Frontend Transaction Dispatch
* **Severity:** 🚨 HIGH
* **Release Milestone:** GA Release Candidate (Pre-Mainnet)
* **Estimated Effort:** 1–2 Days
* **Affected Files:**
  * [`frontend/src/features/transaction/TransactionInterface.tsx`](file:///home/dev-var/Personal/Projects/nexus-smart-wallet/frontend/src/features/transaction/TransactionInterface.tsx)
* **Description:** 
  The frontend `TransactionInterface` component maintains a `selectedSessionKey` state variable and displays a dropdown allowing users to select a registered session key. However, this variable is never used in the execution flows: `handleExecuteTransaction` dispatches transactions using the standard EOA owner wallet hook, ignoring the selected session key.
* **Impact:** 
  Transactions are always signed by the master owner wallet key, completely bypassing the session key system in the UI.
* **Recommended Implementation:**
  When `selectedSessionKey` is set to an active key, the transaction submission logic must route the payload to the session key transaction endpoint, signing the transaction payload with the ephemeral session private key generated and stored client-side.

---

### C. Medium Gaps

#### 8. User Enumeration Vulnerability on Authentication Routes
* **Severity:** 🚨 MEDIUM
* **Release Milestone:** GA Release Candidate (Pre-Mainnet)
* **Estimated Effort:** 2 Hours
* **Affected Files:**
  * [`backend/src/controllers/auth.controller.ts`](file:///home/dev-var/Personal/Projects/nexus-smart-wallet/backend/src/controllers/auth.controller.ts)
* **Description:** 
  The login controller distinguishes between non-existent users and incorrect passwords. It returns an HTTP 400 `INVALID_CREDENTIALS` ("user does not exist") if the email lookup fails, and an HTTP 401 `INVALID_CREDENTIALS` ("Invalid email or password") if the bcrypt check fails.
* **Impact:** 
  Attackers can perform user enumeration, scanning the login endpoint to compile a list of registered emails, which violates user privacy and aids target profiling.
* **Recommended Implementation:**
  Align response codes and messages. For both failed user lookup and password mismatch, return HTTP 401 `INVALID_CREDENTIALS` with a generic message: `"Invalid email or password."`

#### 9. Missing Database Indexes on Core Transaction Queries
* **Severity:** 🚨 MEDIUM
* **Release Milestone:** GA Release Candidate (Pre-Mainnet)
* **Estimated Effort:** 2 Hours
* **Affected Files:**
  * [`backend/src/models/Transaction.schema.ts`](file:///home/dev-var/Personal/Projects/nexus-smart-wallet/backend/src/models/Transaction.schema.ts)
* **Description:** 
  The backend repository queries transactions by `accountId` sorted by `createdAt: -1` (e.g. `findTransactionsByAccountId`). The Mongoose schema lacks an index for `accountId` or a compound index on `{ accountId: 1, createdAt: -1 }`.
* **Impact:** 
  MongoDB must perform full collection scans for account transaction history queries. As the transaction log grows, the database will experience high CPU usage and query latency spikes.
* **Recommended Implementation:**
  Add the compound index to the schema definition:
  ```typescript
  transactionSchema.index({ accountId: 1, createdAt: -1 });
  ```

#### 10. Missing SSE Heartbeats (Pings) in Notification Service
* **Severity:** 🚨 MEDIUM
* **Release Milestone:** GA Release Candidate (Pre-Mainnet)
* **Estimated Effort:** 4 Hours
* **Affected Files:**
  * [`backend/src/services/notification.service.ts`](file:///home/dev-var/Personal/Projects/nexus-smart-wallet/backend/src/services/notification.service.ts)
* **Description:** 
  The notification service handles real-time alerts via Server-Sent Events (SSE). It streams events to the client on transaction updates but does not send periodic keep-alive heartbeats.
* **Impact:** 
  Reverse proxies, firewalls, and load balancers (such as AWS ALB, Cloudflare, or Nginx) automatically drop idle HTTP connections after 30 to 60 seconds. This causes frequent connection drops, forcing the frontend to repeatedly reconnect, creating network overhead, and causing notification delays.
* **Recommended Implementation:**
  Implement a heartbeat interval in `NotificationService` that writes a comment ping (`:\n\n`) to all connected client sockets every 15–20 seconds to prevent connection timeouts.
  ```typescript
  // Inside NotificationService constructor:
  setInterval(() => {
      this.clients.forEach(client => {
          client.res.write(':\n\n'); // SSE comment heartbeat
      });
  }, 15000);
  ```

#### 11. Stateless Logout and Lack of JWT Server-Side Invalidation
* **Severity:** 🚨 MEDIUM
* **Release Milestone:** GA Release Candidate (Pre-Mainnet)
* **Estimated Effort:** 1 Day
* **Affected Files:**
  * [`backend/src/services/auth.service.ts`](file:///home/dev-var/Personal/Projects/nexus-smart-wallet/backend/src/services/auth.service.ts)
  * [`backend/src/controllers/auth.controller.ts`](file:///home/dev-var/Personal/Projects/nexus-smart-wallet/backend/src/controllers/auth.controller.ts)
* **Description:** 
  The `/auth/logout` endpoint outputs a message advising the client to delete the token. It does not perform server-side invalidation.
* **Impact:** 
  If a JWT is compromised, logging out does not terminate the session. The compromised token remains fully valid and usable to execute transactions until its 24-hour expiration window closes.
* **Recommended Implementation:**
  Maintain a Redis-based token blocklist. When a user logs out, compute the remaining lifespan of the JWT and store the token signature in Redis with a matching Time-to-Live (TTL). The authentication middleware must reject any token present in the blocklist.

#### 12. Hardcoded Worker Node Identifier in Clustered Deployments
* **Severity:** 🚨 MEDIUM
* **Release Milestone:** Post-GA Staging (Operational Hardening)
* **Estimated Effort:** 2 Hours
* **Affected Files:**
  * [`backend/src/services/worker.service.ts`](file:///home/dev-var/Personal/Projects/nexus-smart-wallet/backend/src/services/worker.service.ts)
* **Description:** 
  When the queue worker claims a transaction job, it sets `workerId` to a hardcoded string `'worker-node-1'`.
* **Impact:** 
  If the API is scaled horizontally (e.g. running 3 container replicas in ECS/Kubernetes), all worker replicas will write the exact same ID (`'worker-node-1'`) to claimed records. This obscures logs, making it impossible to audit which container claimed a transaction or debug race conditions.
* **Recommended Implementation:**
  Resolve the worker node identifier dynamically using the host's container hostname or a generated UUID:
  ```typescript
  const workerId = process.env.HOSTNAME || `worker-node-${crypto.randomUUID()}`;
  ```

---

### D. Low Gaps

#### 13. Deprecated Polygon Mumbai Testnet Configuration
* **Severity:** 🚨 LOW
* **Release Milestone:** GA Release Candidate (Pre-Mainnet)
* **Estimated Effort:** 1 Hour
* **Affected Files:**
  * [`backend/src/config/chain.ts`](file:///home/dev-var/Personal/Projects/nexus-smart-wallet/backend/src/config/chain.ts)
* **Description:** 
  The chain config map contains Polygon Mumbai (`80001: "polygon-mumbai"`).
* **Impact:** 
  Polygon Mumbai was permanently shut down in April 2024. Attempts to initiate transactions, retrieve clients, or query public contracts on chain ID 80001 will fail, potentially cluttering logs and causing API errors.
* **Recommended Implementation:**
  Remove the `80001: "polygon-mumbai"` key from `ALCHEMY_CHAIN_MAP` and register the current Polygon Amoy testnet (`80002: "polygon-amoy"`).

#### 14. Ignored Mongoose Database Connection Options
* **Severity:** 🚨 LOW
* **Release Milestone:** GA Release Candidate (Pre-Mainnet)
* **Estimated Effort:** 1 Hour
* **Affected Files:**
  * [`backend/src/database/index.ts`](file:///home/dev-var/Personal/Projects/nexus-smart-wallet/backend/src/database/index.ts)
* **Description:** 
  The `config` object defines custom pool sizes and socket timeouts:
  ```typescript
  options: {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
  }
  ```
  However, these options are not passed to the database connection method: `mongoose.connect(config.database.mongodb.uri)`.
* **Impact:** 
  The application connects using Mongoose defaults, bypassing the optimized connection pool limit and timeouts, which can degrade database resilience under high load.
* **Recommended Implementation:**
  Pass the configuration options object to the mongoose connect call:
  ```typescript
  await mongoose.connect(config.database.mongodb.uri, config.database.mongodb.options);
  ```

#### 15. Broken Playwright Test Suite due to Missing `expect` Import
* **Severity:** 🚨 LOW
* **Release Milestone:** GA Release Candidate (Pre-Mainnet)
* **Estimated Effort:** 10 Minutes
* **Affected Files:**
  * [`frontend/ui-audit.test.ts`](file:///home/dev-var/Personal/Projects/nexus-smart-wallet/frontend/ui-audit.test.ts)
* **Description:** 
  The Playwright visual audit test script uses `expect` on line 26 to assert zero accessibility violations. However, the file only imports `test` from the library:
  ```typescript
  import { test } from '@playwright/test';
  ```
* **Impact:** 
  Running visual audit checks will crash with a `ReferenceError: expect is not defined`, breaking automated CI checks.
* **Recommended Implementation:**
  Import `expect` along with `test` from `@playwright/test`:
  ```typescript
  import { test, expect } from '@playwright/test';
  ```

---

### E. Technical Debt

#### 16. Extensive ESLint Warnings in Backend and Frontend Codebases
* **Severity:** Technical Debt
* **Release Milestone:** Post-GA Cleanup
* **Estimated Effort:** 2–3 Days
* **Affected Files:**
  * Multiple backend files (164 warnings) and frontend files (63 warnings)
* **Description:** 
  The codebase contains several ESLint warnings, primarily regarding `no-explicit-any` usage in typings and missing hook dependency arrays in React.
* **Impact:** 
  Obscures valid static analysis warnings in CI/CD pipeline runs and increases build log noise.
* **Recommended Implementation:**
  1. Define explicit Interfaces and Types to replace `any` in service classes.
  2. Complete the dependency arrays for `useEffect` and `useCallback` hooks on the frontend.

#### 17. Frontend Bundle Size Bloat (wagmi & RainbowKit)
* **Severity:** Technical Debt
* **Release Milestone:** Post-GA Optimization
* **Estimated Effort:** 2–3 Days
* **Affected Files:**
  * [`frontend/package.json`](file:///home/dev-var/Personal/Projects/nexus-smart-wallet/frontend/package.json)
  * [`frontend/vite.config.ts`](file:///home/dev-var/Personal/Projects/nexus-smart-wallet/frontend/vite.config.ts)
* **Description:** 
  The frontend production build outputs a bundle size of 1.6 MB, primarily caused by dependencies on `wagmi` and `RainbowKit`.
* **Impact:** 
  Degrades web page load performance and increases Time to Interactive (TTI), particularly on mobile devices or slower networks.
* **Recommended Implementation:**
  Configure lazy loading for wallet widgets, evaluate Vite code-splitting chunk strategies, and implement Gzip/Brotli compression at the host (Nginx) level.

---

### F. Future Roadmap & Enhancements

#### 18. Asymmetric AWS KMS / GCP Cloud KMS Relayer Signer
* **Severity:** Enhancement
* **Release Milestone:** Post-GA Security Hardening
* **Estimated Effort:** 4–5 Days
* **Affected Files:**
  * [`backend/src/services/signer.service.ts`](file:///home/dev-var/Personal/Projects/nexus-smart-wallet/backend/src/services/signer.service.ts)
  * New signer class: `backend/src/services/signer/kms.signer.ts`
* **Description:** 
  The custodial EOA relayer currently loads a raw private key (`MASTER_WALLET_PRIVATE_KEY`) into server environment memory.
* **Impact:** 
  If the server environment is compromised, the private key can be leaked, risking relayer funds.
* **Recommended Implementation:**
  Implement the asymmetric signing class (`KmsSigner`) detailed in `secrets_management.md` using the AWS SDK KMS Client, executing secp256k1 transaction signatures on cloud Hardware Security Modules (HSMs) without exposing the private key.

#### 19. Non-Custodial Passkey (WebAuthn) Smart Account Support
* **Severity:** Enhancement
* **Release Milestone:** Future Roadmap (v1.1)
* **Estimated Effort:** 10–15 Days
* **Affected Files:**
  * Frontend login modules, contract compilation layers
* **Description:** 
  Frictionless onboarding using passkey biometric verification instead of standard EOA seed phrases or custodial keys.
* **Recommended Implementation:**
  Integrate WebAuthn browser registration APIs and map them to smart contracts supporting secp256r1 signature verification (e.g. Safe or Kernel v3).

#### 20. SLO Dashboards & Prometheus Alerts Setup
* **Severity:** Enhancement
* **Release Milestone:** Post-GA Staging (DevOps)
* **Estimated Effort:** 3–4 Days
* **Affected Files:**
  * DevOps infrastructure configurations
* **Description:** 
  The platform exposes metrics at `/api/metrics` but lacks dashboards and active alerting channels.
* **Recommended Implementation:**
  Deploy Prometheus instances to scrape the metrics endpoint, and set up Grafana dashboards with alert manager notifications to trigger Slack or PagerDuty alerts if transaction latencies exceed the defined SLO thresholds.

---

## 3. GA Release Roadmap & Execution Phases

To resolve the identified gaps efficiently, development should proceed in three distinct phases:

### Phase 1: Pre-Mainnet Hardening (Must-Fix)
* **Objective:** Fix all Critical and High gaps to secure the platform.
* **Key Tasks:**
  1. Fix the **Head-of-Line blocking** bug in `worker.service.ts`.
  2. Implement **Session Key signature verification** on transaction routes.
  3. Update frontend `useSessionKeys.ts` to request EOA signatures, and update `TransactionInterface.tsx` to include the selected session key.
  4. Fix the **Rate Limiter trust proxy** vulnerability in `app.ts`.
  5. Decouple login and registration on the frontend; remove auto-signup with the `'password123'` fallback.
  6. Implement caching/parallelism for token metadata lookups in `portfolio.service.ts`.
  7. Correct the **Mumbai testnet** mapping to Polygon Amoy.
  8. Pass the configuration options to Mongoose in `database/index.ts`.
  9. Add `expect` imports in the Playwright visual tests.

### Phase 2: Operations & Quality Stabilization (Recommended)
* **Objective:** Resolve Medium gaps to improve database performance, SSE connection stability, and audit trails.
* **Key Tasks:**
  1. Fix the user enumeration vulnerability in `auth.controller.ts`.
  2. Add database indexes to `Transaction.schema.ts`.
  3. Implement SSE heartbeat pings in `notification.service.ts` to prevent connection drops.
  4. Implement server-side stateless JWT blacklisting in Redis upon logout.
  5. Resolve dynamic `workerId` assignment in `worker.service.ts` for clustered setups.

### Phase 3: Post-GA Optimization & Roadmap (Enhancements)
* **Objective:** General code cleaning, relayer hardware security migration, and bundle optimization.
* **Key Tasks:**
  1. Clean up the ESLint warnings across backend and frontend.
  2. Configure code-splitting in Vite to optimize bundle sizes.
  3. Implement the AWS/GCP KMS relayer signer.
  4. Build Prometheus alert rules and Grafana SLO dashboards.
  5. R&D for WebAuthn passkey smart accounts (v1.1).

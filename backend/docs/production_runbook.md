# Nexus Smart Wallet — Production Operations Runbook

This runbook provides deployment guides, failure recovery paths, queue operations, and transaction lifecycle documentation for the Nexus Smart Wallet backend infrastructure.

---

## 1. Environment & Configuration Guide

The application requires specific environment variables to boot. Startup will fail fast with an error message if config checks do not pass.

### Production Environment Variables (`.env`)

| Variable | Type | Validation Rule | Purpose |
|---|---|---|---|
| `PORT` | Number | Integer | Port Express listens on. Defaults to `3000`. |
| `NODE_ENV` | String | `production` / `development` / `test` | Application environment. |
| `CORS_ORIGINS` | String | Comma-separated URLs (starts with http/https) | Authorized domains. |
| `MONGODB_URI` | String | URL (`mongodb://` or `mongodb+srv://`) | Main database connection string. |
| `ALCHEMY_API_KEY` | String | Required non-empty string | API key for Alchemy RPC/Paymaster. |
| `MASTER_WALLET_PRIVATE_KEY` | String | 32-byte hex starting with `0x` | Custodial relayer key. |
| `JWT_SECRET` | String | Min 32 characters in production | Signing secret for session tokens. |

---

## 2. API Rate Limits Reference

Rate limiting is enforced at the route level to protect the service from resource exhaustion and DDoS vectors:

- **Authentication (`/api/auth/*`):** 15-minute window, max 30 requests.
- **Wallet Creation (`/api/accounts/create`):** 15-minute window, max 15 requests.
- **Wallet Deployment (`/api/transactions/deploy`):** 15-minute window, max 15 requests.
- **Transaction Submission (`/api/transactions/send`):** 15-minute window, max 60 requests.
- **Status Polling (`/api/transactions/:idOrHash`):** 1-minute window, max 120 requests.
- **Health Checks (`/api/health/*`):** 1-minute window, max 60 requests.

---

## 3. Transaction Lifecycle State Machine

Each transaction transitions through explicit states to guarantee traceability and idempotency:

```
        POST /send
            │
            ▼
        ┌───────┐
        │QUEUED │
        └───┬───┘
            │
      Worker claims
            │
            ▼
      ┌──────────┐
      │PROCESSING│
      └─────┬────┘
            │
    UserOp submitted
            │
            ▼
       ┌─────────┐
       │SUBMITTED│
       └────┬────┘
            │
    ┌───────┴───────┐
    ▼               ▼
(Success)        (Transient Error)
┌─────────┐      ┌────────┐
│CONFIRMED│      │RETRYING│
└─────────┘      └───┬────┘
                     │
               Max 5 Retries
                     │
             ┌───────┴───────┐
             ▼               ▼
         (Succeeds)      (Permanent Error/Reverts)
         ┌─────────┐     ┌──────┐
         │CONFIRMED│     │FAILED│
         └─────────┘     └──────┘
```

- **Idempotency Check:** Every transaction requires an `idempotencyKey` index constraint. If a duplicate key is sent, the API returns the existing transaction state immediately without re-enqueuing.

---

## 4. Operational Monitoring & Health

### Monitoring Endpoints
- **Liveness:** `GET /api/health/liveness` (returns 200 if server is listening).
- **Startup:** `GET /api/health/startup` (returns 200 if environment configuration is valid).
- **Readiness:** `GET /api/health/readiness` (returns 200 if MongoDB is connected, the worker loop is running, and RPC network nodes respond to JSON-RPC pings. Returns 503 Service Unavailable if degraded).
- **Metrics Report:** `GET /api/health/metrics` (or `/api/metrics` / `GET /api/health/metrics` - returns API counts, latencies, database query profiles, queue lengths, and blockchain transaction latencies in JSON format).

---

## 5. Failure Recovery Runbook

### Case A: Queue Worker Stuck Jobs
- **Symptom:** Transaction state remains in `'processing'` or `'submitted'` for more than 10 minutes without shifting to `'confirmed'` or `'failed'`.
- **Reason:** The server crashed, or the bundler dropped the UserOperation before inclusion.
- **Recovery:**
  1. Simply restarting the server triggers the built-in crash recovery routine: it scans for any jobs in `'processing'` status and resets them to `'queued'`.
  2. If the bundler dropped the userop, the next worker loop will pick up the re-enqueued job, assign a fresh EOA nonce, and re-sign/re-submit the UserOperation.

### Case B: EOA Signer Nonce Desynchronization
- **Symptom:** Worker logs show `"nonce too low"` or `"underpriced replacement transaction"` errors.
- **Reason:** The custodial private key was used outside the application (e.g. via Metamask or custom scripts), causing the database `NonceModel` to lag behind the actual on-chain transaction count.
- **Recovery:**
  1. Restarting the backend worker automatically syncs the persistent `NonceModel` with the on-chain state:
     `nextNonce = Math.max(record.nonce, onChainCount)`
  2. Alternatively, manually clear/update the `Nonce` document in MongoDB for the given `signerAddress` and `chainId` to match the exact `nonce` count shown on Basescan.

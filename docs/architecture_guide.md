# Nexus Smart Wallet — Canonical Architecture Guide

This document describes the production architecture, data flow, background queue workers, cryptographic signing module, and state lifecycle configurations of the Nexus Smart Wallet platform.

---

## 1. System Overview

Nexus Smart Wallet separates client-side interface logic from ERC-4337 blockchain orchestration. All account abstraction computations (UserOperation assembly, paymaster sponsorship checks, and EOA signing) execute on the backend, allowing a stateless, secure, and fast frontend experience.

```
┌─────────────────┐             HTTP Requests             ┌─────────────────┐
│                 │ ────────────────────────────────────> │                 │
│  React Frontend │                                       │ Express Backend │
│      (SPA)      │ <──────────────────────────────────── │      (API)      │
│                 │           Server-Sent Events          │                 │
└─────────────────┘ ────────────────────────────────────> └────────┬────────┘
                                                                   │
                                                                   │ Read/Write DB
                                                                   ▼
       ┌─────────────────┐        Redis Pub/Sub Sub       ┌─────────────────┐
       │     Bundler     │ <───────────────────────────── │  MongoDB & Redis│
       │    (RPC Node)   │                                │  (Shared Cache) │
       └─────────────────┘                                └─────────────────┘
```

---

## 2. Component Directory Architectures

### Backend (Express + Mongoose + permissionless)
* **API Layer (`src/controllers/`):** Handlers that validate request schemas using Zod middleware, authenticate sessions via JWT, invoke backend services, and serialize response JSON envelopes.
* **Service Layer (`src/services/`):** Contains pure business logic. Coordinates database transactions, invokes ERC-4337 client helper methods, maps provider configurations, and publishes notification events.
* **Queue Worker (`src/services/worker.service.ts`):** Background processor that polls database queues, serializes execution per account, checks stuck transactions, and updates receipts.
* **Signing Module (`src/services/signer/`):** Manages key material loading and executes cryptographic ECDSA signatures.
* **Database Layer (`src/repositories/` & `src/models/`):** Mongoose schemas and compound query indexes (e.g. index on account transactions or unique keys).

### Frontend (Vite + Redux + wagmi)
* **State Management (`src/store/`):** Uses Redux Toolkit with `redux-persist` to maintain session JWTs, cached user configurations, and selected active chains. A separate slice (`smartAccountObjectsSlice`) tracks non-serializable viem clients.
* **API Consumer (`src/services/apiClient.ts`):** Lightweight Fetch wrapper wrapping REST endpoints. Enforces token injection and parses structured responses.
* **State Hook (`src/hooks/useBackendSmartAccount.ts`):** The primary custom hook consumed by views. Dispatches loading flags, executes login forms, and delegates transactions.

---

## 3. Core Architectural Modules

### A. Queue & Worker Architecture
To prevent transaction failures resulting from EOA nonce collisions, the backend serializes transaction execution using a FIFO database queue.

1. **Job Enqueuing:** Calling `/api/transactions/send` or `/deploy` validates parameters and inserts a new transaction document into MongoDB with status `'queued'`.
2. **Sequential Lock:** The worker queries MongoDB for any jobs in `'processing'` or `'submitted'` status for the specific smart account. If one exists, it halts execution for that account to maintain sequence order.
3. **Execution Loop:** If the account is idle, the worker claims the oldest queued job, transitions it to `'processing'`, retrieves/increments the EOA nonce atomically using `getNextNonce`, signs the UserOperation, and submits it to the bundler.
4. **Crash Recovery:** 
   * On startup, the worker scans MongoDB for jobs in `'processing'` and resets them to `'queued'`.
   * It also scans for `'submitted'` jobs, queries the bundler client to verify if a receipt was generated, and updates them to `'confirmed'` (or `'failed'`) or resets them to `'queued'` if dropped.

### B. Signing Architecture
All smart contract accounts predicted or deployed are *custodial* in this version.
* **Custodial Relayer Key:** Loaded from `MASTER_WALLET_PRIVATE_KEY` env.
* **Signer Service (`src/services/signer/signer.service.ts`):** Exposes `CustodialSigner` wrapping `viem` `privateKeyToAccount`.
* **Flow:** The `CustodialSigner` serves as the owner key inside the `permissionless` account adapters. When the user executes a transaction, the backend uses this relayer account to sign the UserOperation hash.

### C. Provider Registry (`src/services/provider.service.ts`)
Decouples application logic from specific RPC endpoints.
* Resolves standard bundler and paymaster URLs based on the selected `walletID`, `chainId`, `bundlerID`, and `paymasterID`.
* Supports both **Alchemy** (Base Sepolia) and **Pimlico** (multi-chain fallback).
* Automatically extracts gas fee market oracle fees (`maxFeePerGas`, `maxPriorityFeePerGas`) using Pimlico's fast fee estimator.

### D. Session Key Architecture
Provides cryptographic authorization for third-party keys without exposing the master custodial EOA.
* **Owner Signature Validation:** When registering a session key via `/api/sessions/create`, the owner (smart account signer) must sign a message detailing the policy parameters (`publicKey`, `allowedContracts`, `allowedFunctions`, `spendingLimit`, `expiryTime`).
* **Validation Middleware:** The backend verifies this signature using `viem` `verifyMessage` before inserting the session key policy into MongoDB.
* **Lazy Evaluation:** During transaction submission, if a `sessionKeySignature` is passed, the service validates that the session key is active, has not expired, target contract matches the allowlist, function selector is permitted, and transaction value is within the spending limit.

### E. Portfolio Cache & Sync
* **Persistence:** Native token, ERC20, and NFT assets discovered on-chain are cached in `PortfolioModel` database collection to optimize dashboard response times.
* **Background Cron:** A background job reconciles cached portfolios against the blockchain every 15 minutes.
* **On-Demand Refresh:** Users can trigger an instant cache reconciliation via `/api/portfolio/refresh`.

### F. Clustered Notification Architecture
* **SSE Interface:** Users establish a persistent Server-Sent Events (SSE) connection via `/api/notifications/subscribe`.
* **Redis Pub/Sub:** When the queue worker confirms or fails a transaction on instance A, it publishes the event to the Redis channel `notifications:publish`.
* **Clustered Delivery:** Instances B and C (subscribed to the same Redis channel) receive the event and write it to their local SSE client sockets, ensuring seamless delivery across multi-replica servers.

---

## 4. State Lifecycles

### Transaction Lifecycle State Machine

```
         POST /api/transactions/send
                      │
                      ▼
               ┌─────────────┐
               │   QUEUED    │
               └──────┬──────┘
                      │  Worker picks up job
                      ▼
               ┌─────────────┐
               │ PROCESSING  │
               └──────┬──────┘
                      │  UserOp submitted to bundler
                      ▼
               ┌─────────────┐
               │  SUBMITTED  │
               └──────┬──────┘
                      ├──────────────────────────┐
                      ▼ (Confirmed on-chain)     ▼ (Transient RPC Error)
               ┌─────────────┐            ┌─────────────┐
               │  CONFIRMED  │            │  RETRYING   │
               └─────────────┘            └──────┬──────┘
                                                 │
                                                 ▼ (Max 5 Retries Exhausted)
                                          ┌─────────────┐
                                          │   FAILED    │
                                          └─────────────┘
```

### Session Key Lifecycle

```
      Owner Cryptographic Signature Proof
                      │
                      ▼
               ┌─────────────┐
               │   ACTIVE    │
               └──────┬──────┘
                      ├──────────────────────────┐
                      ▼ (Explicit Revocation)    ▼ (Expiry Time Reached)
               ┌─────────────┐            ┌─────────────┐
               │   REVOKED   │            │   EXPIRED   │
               └─────────────┘            └─────────────┘
```

# Nexus Smart Wallet — Release Notes (v1.0 RC1)

We are pleased to announce the release of **Nexus Smart Wallet Release Candidate 1 (RC1)**. This version resolves all critical release blockers, enabling a secure, production-ready, and scalable smart account deployment platform.

---

## 1. Major Architectural Enhancements

* **Atomic Nonce Verification:** Developed a robust Optimistic Concurrency Control (OCC) loop within `getNextNonce` to fetch, increment, and record on-chain nonces atomically in MongoDB, eliminating transaction collisions under load.
* **Distributed Notification Engine:** Migrated process-local SSE notifications to a Redis Pub/Sub channel architecture, facilitating synchronized real-time client notifications across clustered nodes.
* **Clustered Rate Limiting:** Swapped local Map-based rate limits with a Redis-backed window rate limiter. Retains an auto-evicting memory map backup to guarantee active protection if Redis is temporarily unreachable.
* **Nginx Static Asset Hosting:** The frontend container has been updated to build static bundles served via Nginx 1.25 Alpine with custom gzip compression and routing configuration.
* **Multi-Stage Runtimes:** Rewrote Docker configurations using slim Alpine images, running applications under isolated non-root system users (`USER node`).

---

## 2. Implemented Security Controls

* **Cryptographic Session Keys:** Registrations on `/api/sessions/create` now validate owner signature proofs using `viem` recovery to prove account-owner authorization before saving session key policies.
* **CI Secrets Protection:** Removed hardcoded Alchemy and relayer secrets from workflow scripts, replacing them with Actions Runner secret variables.
* **Active Log Redaction:** Integrated Winston-style sanitization inside the logger to mask private key signatures and authorization headers.
* **CORS & CSP Constraints:** Restricts API consumption to configured domain lists, and restricts client connections to secure RPC gateways.

---

## 3. Production Capabilities

* **Multi-Framework Support:** Predicted counterfactual addresses and deployed smart contracts for Alchemy (Light Account), Simple, Safe, Kernel, Biconomy, and Trust wallets.
* **Batch Multicalls:** Batch transaction validation and execution flows are fully integrated.
* **Real-time Synchronization:** Transaction confirms, failures, and deployments trigger instant real-time UI pushes.

---

## 4. Known Limitations & Technical Debt

### Known Limitations
* **Custodial Relayer Signer:** All transactions are signed by a central EOA relayer key. This is a custodial setup. Transitioning to WebAuthn (Passkeys) or MPC is planned for a future major release.
* **No Password Reset:** Users cannot recover forgotten passwords. Standard state-restoration mechanisms (e.g. email reset workflows) must be developed before general public access.

### Technical Debt
* **Eslint Warnings:** The codebase contains 164 backend warnings and 135 frontend warnings (predominantly `no-explicit-any` and missing hook dependency declarations). These warnings do not affect compiler execution or build results.
* ** wagmi/RainbowKit Bundle Bloat:** The frontend main bundle size remains at 1.6 MB due to wagmi library dependencies. Code splitting will be evaluated in the next phase.

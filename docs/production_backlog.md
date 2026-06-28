# Nexus Smart Wallet — Curated Production Backlog

This backlog outlines the future evolution of the Nexus Smart Wallet platform, categorized by purpose and containing structured priorities, dependencies, and acceptance criteria.

---

## 1. Future Enhancements

### A. AWS KMS / GCP Cloud KMS Relayer Signer Integration
* **Description:** Transition the custodial EOA relayer signer from loading raw private keys in environment memory to executing SECP256K1 signatures remotely on cloud Hardware Security Modules (HSMs).
* **Priority:** 🔥 HIGH
* **Dependencies:** Cloud KMS infrastructure setup, AWS SDK client package imports.
* **Acceptance Criteria:** 
  1. Relayer address can be derived from the KMS public key.
  2. Transaction execution succeeds without `MASTER_WALLET_PRIVATE_KEY` present in environment variables.

### B. Non-Custodial Passkey (WebAuthn) Signer
* **Description:** Move away from custodial relational keys by enabling users to register biometric or hardware passkeys directly from the browser, signing UserOperations on-client.
* **Priority:** 🚨 MEDIUM
* **Dependencies:** WebAuthn browser APIs, ERC-4337 smart contracts supporting secp256r1 verification (e.g. Safe or Kernel v3).
* **Acceptance Criteria:**
  1. Users can register a passkey on account creation.
  2. Transactions are signed using browser biometrics and validated on-chain.

### C. Multi-Chain Smart Account Gas Optimization
* **Description:** Allow users to maintain a single central gas tank (deposit) on one chain, sponsoring transactions on any other EVM networks dynamically.
* **Priority:** Low
* **Dependencies:** Cross-chain messaging bridges (e.g. LayerZero or CCIP), paymaster settlement contracts.
* **Acceptance Criteria:**
  1. Sponsoring transactions on Base Sepolia using balances deposited on Arbitrum Sepolia.

---

## 2. Engineering Quality Improvements

### A. Resolve Remaining ESLint Warnings
* **Description:** Clean up the remaining 164 backend and 63 frontend ESLint warnings (principally `no-explicit-any` and missing react-hooks dependencies) to restore clean checks.
* **Priority:** 🚨 MEDIUM
* **Dependencies:** None.
* **Acceptance Criteria:**
  1. Running `npm run lint` or `pnpm run lint` completes with `0 problems` (both errors and warnings equal 0).

### B. High-Concurrency Stress Benchmarking
* **Description:** Benchmark the Express API and Redis queue worker under heavy loads (200+ concurrent requests) to identify potential write blockages.
* **Priority:** Low
* **Dependencies:** Artillery or k6 benchmarking configs.
* **Acceptance Criteria:**
  1. API sustains >100 transactions per second without database lock deadlocks.

### C. Session Verification Penetration Review
* **Description:** Perform an audit of the signature recovery methods to verify that no replay attacks can occur across chain networks.
* **Priority:** 🔥 HIGH
* **Dependencies:** Security auditor engagement.
* **Acceptance Criteria:**
  1. Signature verification checks fail if a replay token from chain A is sent to chain B.

---

## 3. Operational Optimizations

### A. Automated Secret Rotation Configs
* **Description:** Integrate HashiCorp Vault or AWS Secrets Manager to rotate the `JWT_SECRET` and API credentials every 30 days.
* **Priority:** Low
* **Dependencies:** Vault or AWS Secrets agent.
* **Acceptance Criteria:**
  1. Credentials update dynamically without requiring manual container rebuilds.

### B. SLO Dashboard & Monitoring Alerts
* **Description:** Export Prometheus metrics from `/api/metrics` to build Grafana Service Level Objective dashboards tracking latency spikes and failed UserOperations.
* **Priority:** 🚨 MEDIUM
* **Dependencies:** Prometheus and Grafana instance deployment.
* **Acceptance Criteria:**
  1. Alerts fire when transaction verification latency exceeds 15 seconds.

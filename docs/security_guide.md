# Nexus Smart Wallet — Security Architecture Guide

This document describes the implemented security model, cryptographic authentication policies, Relayer key protections, and access controls of the Nexus Smart Wallet platform.

---

## 1. Authentication & Session Verification

### User Authentication (JWT)
* Users authenticate via email and password on `/api/auth/login`.
* Passwords are encrypted using **bcrypt** with 12 validation rounds.
* The API returns a signed JSON Web Token (JWT).
* **JWT Properties:** Signed using the environment variable `JWT_SECRET`. Token payload contains:
  * `userId`: The MongoDB unique identifier of the user.
  * `email`: Optional email address.
  * Expiration time: Hardcoded to 24 hours.
* **Validation:** Injected into subsequent requests using the `Authorization: Bearer <token>` header. The authentication middleware validates the signature, extracts the user details, and binds them to the request context.

### Password Strength Policy
* Enforced on user signup `/api/auth/register`.
* **Rules:** Minimum 8 characters; must contain at least one uppercase letter, one lowercase letter, one digit, and one special character (`!@#$%^&*`).

---

## 2. Cryptographic Session Key Verification

Session keys allow third-party clients (e.g. game frontends) to submit specific transactions on behalf of a user's smart account without loading the master Relayer EOA private key.

### A. The Registration Flow
1. The client generates a local key pair (the Session Key).
2. The user signs a cryptographic message containing the authorization policy using their EOA owner wallet:
   * `sessionKeyAddress` (public key of the session key)
   * `allowedContracts` (whitelist target contract addresses)
   * `allowedFunctions` (list of permitted function selectors)
   * `spendingLimit` (maximum value permitted)
   * `expiryTime` (UNIX timestamp expiration)
3. The client submits the registration details and the cryptographic signature to `/api/sessions/create`.
4. **Signature Verification:** The backend uses `viem` `verifyMessage` to recover the signer's address from the signature. It validates that the recovered signer matches the smart account owner address registered in MongoDB.
5. The session policy is persisted in the database only if signature verification succeeds.

### B. Execution Flow
1. When submitting a transaction using a session key, the client sends the transaction payload and signs it using the Session Key.
2. The transaction queue worker:
   * Retrieves the persisted session policy from MongoDB.
   * Verifies that the key is active and current time is less than `expiresAt`.
   * Verifies that the transaction target contract matches the whitelist.
   * Verifies that the function selector matches the permitted function signature.
   * Checks that the transaction value does not exceed the remaining spending limit.
3. If all verification steps pass, the worker executes the UserOperation on the blockchain using the custodial master relayer key.

---

## 3. Relayer Private Key Protection (EOA Custodial Relayer)

* The master EOA key (`MASTER_WALLET_PRIVATE_KEY`) is stored as an environment variable.
* **KMS/HSM Migration Path:** For production deployment, configure the signer to load keys from **AWS KMS** or **GCP Cloud KMS** using an asymmetric key pair type `ECC_SEC_P256K1`. This executes signature computations remotely on dedicated HSM hardware without loading private key material into application memory. (Consult [HSM KMS Migration Guide](secrets_management.md) for full setup instructions).

---

## 4. Operational Mitigations & Hardening

### A. Rate Limiting Policy
Rate limits are enforced at the network route level to prevent quota exhaustion and Denial of Service (DoS) attacks:
* Implemented via a Redis pipeline, tracking request counts per IP address within sliding time windows.
* In the event that Redis becomes unavailable, the rate limiter falls back to a local memory Map. The Map features an active periodic eviction interval to prune inactive IPs, preventing memory leaks under high volumes of traffic.

### B. Sensitive Log Redaction
* Structured logs are processed through a winston-style redaction filter (`logger.ts`).
* Automatically flags and masks private key formats (`0x` followed by 64 hex characters), authentication headers, passwords, and JSON keys containing strings like `secret`, `token`, `authorization`, `jwt`, and `apikey`.

### C. CORS & CSP WHitelisting
* **CORS:** Cross-Origin Resource Sharing is configured inside `app.ts` to restrict requests to origins whitelisted in the environment variables (`CORS_ORIGINS`).
* **CSP:** Content Security Policy headers are set via `helmet`. Connection domains are locked down to secure gateways (`https://*.alchemy.com`, `https://*.pimlico.io`, and `https://sepolia.base.org`).

---

## 5. Third-Party RPC Trust Assumptions

* The backend connects to external RPC networks (Alchemy / Pimlico) to submit UserOperations.
* Request payloads sent to external nodes are validated on input, and RPC return values are sanitized to protect MongoDB queries from injection issues.

---
name: web3-security-audit
description: Line‑by‑line security review of Web3‑related code (smart‑contract interactions, wallet handling, signature verification) and production‑ready checks (environment variables, rate limiting, error handling).
---

# Web3 Security Audit Skill

## Goal
Identify insecure patterns, missing validations, and potential attack vectors in the front‑end code that talks to blockchain/web3 services.

## Procedure
1. **Static analysis** – Run ESLint with `security` plugin and `eslint-plugin-no-unsanitized`. Capture any `dangerous` or `eval` usage.
2. **Dependency audit** – Execute `pnpm audit` and flag high‑severity vulnerabilities.
3. **Signature handling** – Search for private‑key usage, `signMessage`, `recoverPublicKey`, or `eth_sign` calls. Verify that secrets are never stored in source.
4. **Contract interaction** – Locate `contract.methods` or `writeContract` calls. Ensure that:
   - Addresses are validated (checksum).
   - `value` fields are properly bounded.
   - `await` is used and errors are caught.
5. **Environment checks** – Confirm that production secrets are read from `process.env` and not hard‑coded.
6. **Production hardening** – Verify CSP headers, rate‑limiting hooks, and fallback UI for node‑failure.
7. **Report** – Produce `web3_security_audit_report.md` with file links, line numbers, and severity levels.

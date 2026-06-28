# Changelog

All notable changes to the Nexus Smart Wallet project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.0-rc2] - 2026-06-24

This Release Candidate 2 (RC2) resolves all remaining critical front-end/back-end contract mismatches, FSD page compliance violations, data adapter bypasses, accessibility barriers, and documentation gaps.

### Fixed
* **API Mismatches:** Aligned frontend `getOperationStatus` request body with backend Zod validation schema (supplying `bundlerId`). Configured Developer Console gas price query to supply both `chainId` and `bundlerID` parameters.
* **FSD Compliancy:** Refactored `Security`, `DeveloperTools`, and `Home` pages to be composition-only layouts, moving business/state logic to `SecurityWidget`, `DeveloperConsole`, and `PortfolioSummary` widgets.
* **Centralized Adapters:** Enforced data adapters for Wallet, SessionKey, Transaction, and SSE Notifications to eliminate direct backend DTO consumption.
* **React Query registry:** Enforced centralized query keys and registered mutation keys for all mutation states.
* **Accessibility:** Linked shared inputs and labels using stable unique React IDs, added `aria-label` tags to table pagination controls and search filters, and exported/implemented dialog Close buttons.
* **Documentation & Templates:** Corrected cache flush paths, log rotation metrics, auth endpoints in guides, and generated missing environment `.env.example` templates.

## [1.0.0-rc1] - 2026-06-22

This Release Candidate 1 (RC1) brings the Nexus Smart Wallet platform to production readiness by addressing all critical security and operational blockers.

### Added
* **Cryptographic Session Keys:** Full signature proof validation inside the `/sessions/create` endpoint.
* **Optimistic Concurrency Control:** Sequential nonce synchronization and retry loop to prevent Relayer EOA nonce collisions.
* **Clustered Notification Engine:** Redis Pub/Sub integration for SSE notifications, enabling horizontal scalability.
* **Distributed Rate Limiting:** Redis sliding-window IP rate limiter with local eviction memory map failover.
* **Real Integration Tests:** Added programmatic Anvil node spawning and `mongodb-memory-server` integrations for offline verification.
* **Docker Multi-Stage Builds:** Production-grade Alpine container setups, utilizing non-root users (`USER node`) and optimized Nginx static hosting for the frontend.

### Changed
* **Secure Environment Loading:** PURGED all hardcoded secrets in CI pipelines and codebase configs, replacing them with dynamic variables.
* **CI/CD Pipeline Hardening:** Enforced gated lint checks without fallback bypass codes.
* **Express routing consolidation:** Cleaned up unused / duplicate endpoints.

### Removed
* **Orphan Frontend Components:** Deleted unused code directories under `components/session` and `components/transaction`.
* **Duplicate REST APIs:** Removed obsolete `/session-keys` router definitions.

---

## [0.8.0] - 2026-05-10

### Added
* Initial proof of concept (POC).
* Support for Base Sepolia smart accounts prediction and deployment.
* JWT authentication and basic database CRUD.
* Basic SSE notification socket streaming.
* Mock-heavy unit testing.

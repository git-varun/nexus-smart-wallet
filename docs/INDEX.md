# Alphabetical & Structural Index

This index organizes files and key code references for easy navigation across directories.

## 📌 Alphabetical Index
- **A**
  - Accounts API: [api/accounts.md](api/accounts.md)
  - Account Mongoose Schema: [backend/models.md#account](backend/models.md#account)
  - Anvil EVM Tests: [testing/integration-tests.md#anvil](testing/integration-tests.md#anvil)
  - Authentication (Security): [security/authentication.md](security/authentication.md)
  - Authorization Routes: [security/authorization.md](security/authorization.md)
- **B**
  - Backend Services: [backend/services.md](backend/services.md)
  - Bcrypt Hashing: [security/jwt.md](security/jwt.md)
  - Bundler Registry: [architecture/erc4337.md#bundler](architecture/erc4337.md#bundler)
- **C**
  - Cache Flush: [operations/troubleshooting.md#cache-flush](operations/troubleshooting.md#cache-flush)
  - Capabilities Discovery: [api/developer.md](api/developer.md)
  - Concurrency Lock: [architecture/queue.md#optimistic-concurrency](architecture/queue.md#optimistic-concurrency)
  - CORS Setup: [security/authorization.md#cors](security/authorization.md#cors)
- **D**
  - Database Schemas: [architecture/database.md](architecture/database.md)
  - Disaster Recovery: [operations/disaster-recovery.md](operations/disaster-recovery.md)
  - Docker Configurations: [operations/docker.md](operations/docker.md)
- **E**
  - ERC-4337 Architecture: [architecture/erc4337.md](architecture/erc4337.md)
  - Environment Variables: [reference/environment.md](reference/environment.md)
- **F**
  - Feature-Sliced Design: [frontend/architecture.md](frontend/architecture.md)
  - FIFO Queue Workers: [backend/workers.md](backend/workers.md)
- **H**
  - Health & Metrics API: [api/health.md](api/health.md)
  - Heartbeat SSE: [architecture/notifications.md#heartbeat](architecture/notifications.md#heartbeat)
- **I**
  - Integration Tests: [testing/integration-tests.md](testing/integration-tests.md)
- **J**
  - JWT Tokens: [security/jwt.md](security/jwt.md)
- **L**
  - Logging & Winston: [operations/logging.md](operations/logging.md)
- **N**
  - Nonces Audit: [operations/troubleshooting.md#nonces](operations/troubleshooting.md#nonces)
  - Notifications Event Replay: [architecture/notifications.md#event-replay](architecture/notifications.md#event-replay)
- **O**
  - OpenAPI Spec: [api/openapi.yaml](api/openapi.yaml)
- **P**
  - Playwright specs: [testing/playwright.md](testing/playwright.md)
  - Portfolio Cache: [architecture/database.md#portfolio-cache](architecture/database.md#portfolio-cache)
  - Provider Registry: [backend/services.md#provider-service](backend/services.md#provider-service)
- **R**
  - Rate Limiter Sliding Window: [security/rate-limiting.md](security/rate-limiting.md)
  - Redis Pub/Sub: [architecture/redis.md#pubsub](architecture/redis.md#pubsub)
  - Refresh Token Rotation: [security/refresh-tokens.md](security/refresh-tokens.md)
- **S**
  - Session Keys Proofs: [security/session-keys.md](security/session-keys.md)
  - SLO Objectives: [operations/monitoring.md#slis-slos](operations/monitoring.md#slis-slos)
- **T**
  - Threat Matrix: [security/threat-model.md](security/threat-model.md)
  - Transaction Lifecycle: [architecture/wallet-lifecycle.md#state-machine](architecture/wallet-lifecycle.md#state-machine)
- **V**
  - Validation Middleware: [backend/validation.md](backend/validation.md)
- **W**
  - Winston redactions: [operations/logging.md#redaction](operations/logging.md#redaction)

## 🏗️ Architecture Index
- [System Overview](architecture/system-overview.md) — Main system architecture context
- [ERC-4337 Core](architecture/erc4337.md) — Core smart account abstractions
- [FIFO Nonce Queue](architecture/queue.md) — Transaction locking design
- [SSE Notifications](architecture/notifications.md) — real-time events push

## 🔌 API Routes Index
- [Auth APIs](api/authentication.md) — Signups, Logins, Sessions management
- [Accounts APIs](api/accounts.md) — Predicted, Deployed Smart Wallet details
- [Transactions APIs](api/transactions.md) — Gas estimations, single/batch sends

## 💻 Frontend Layers Index
- [FSD Layers Layout](frontend/architecture.md) — Feature-Sliced Design structure
- [Context Providers](frontend/providers.md) — React provider tree layout
- [UX User Flows](frontend/user-flows.md) — Critical web interface paths

## ⚙️ Backend Core Index
- [Services Folder](backend/services.md) — Details on core helper classes
- [Database Models](backend/models.md) — Fields, indices, unique parameters of Mongoose models
- [Workers Loops](backend/workers.md) — Background loops and Cron triggers

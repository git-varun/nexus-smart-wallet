# Nexus Smart Wallet — Canonical Project Portal

Welcome to the canonical, production-grade documentation portal for the **Nexus Smart Wallet** platform.

This portal acts as the single source of truth for engineering, operations, security, and product teams. All documented designs, architectural patterns, APIs, and procedures are synced directly with the implementation source code.

## 📌 Document Quick Links

### [🏗️ System Architecture](./architecture/system-overview.md)
* [System Overview](./architecture/system-overview.md) | [Frontend Architecture](./architecture/frontend.md) | [Backend Architecture](./architecture/backend.md)
* [ERC-4337 Integration](./architecture/erc4337.md) | [Wallet Lifecycle](./architecture/wallet-lifecycle.md)
* [FIFO Nonce Queue](./architecture/queue.md) | [SSE Clustered Notifications](./architecture/notifications.md)

### [🔌 API Reference](./api/overview.md)
* [REST Endpoint Spec](./api/overview.md) | [Auth Endpoints](./api/authentication.md) | [Smart Account Routes](./api/accounts.md)
* [Transaction Routes](./api/transactions.md) | [Session Keys Control](./api/session-keys.md)

### [💻 Frontend Guide](./frontend/architecture.md)
* [FSD Filer Structures](./frontend/architecture.md) | [Routing Guards](./frontend/routing.md) | [Redux & React Query Store](./frontend/state-management.md)
* [Atomic UI Components](./frontend/components.md) | [UX User Flows](./frontend/user-flows.md)

### [⚙️ Backend Engineering](./backend/architecture.md)
* [Layered Controller/Services](./backend/services.md) | [Zod Input Schemes](./backend/validation.md) | [Mongoose Schema Maps](./backend/models.md)
* [Background Event Workers](./backend/workers.md) | [Database Collections](./backend/queues.md)

### [🔒 Security Matrix](./security/authentication.md)
* [Bcrypt & JWT Auth](./security/jwt.md) | [Refresh Token Rotation](./security/refresh-tokens.md) | [Session Key Verification](./security/session-keys.md)
* [Redis Sliding Limiters](./security/rate-limiting.md) | [Winston Redaction Loggers](./operations/logging.md)

### [🚀 Operations & DR Runbooks](./operations/runbook.md)
* [Zero downtime Deployments](./operations/deployment.md) | [Container Orchestration](./operations/docker.md) | [Health and Metric SLOs](./operations/monitoring.md)
* [Stuck Nonce Audits](./operations/troubleshooting.md) | [Backup and Restoration](./operations/disaster-recovery.md)

### [🧪 Testing Harness](./testing/strategy.md)
* [Unit and Mock Targets](./testing/unit-tests.md) | [Local EVM (Anvil) Specs](./testing/integration-tests.md) | [Playwright E2E Spec](./testing/playwright.md)

---

## 🛠️ Tech Stack Quick Reference

* **Frontend:** React (Vite), Redux Toolkit, React Query (Tanstack), Viem, TailwindCSS.
* **Backend:** Node.js, Express, TypeScript, Mongoose, Zod.
* **Infrastructure:** MongoDB, Redis (Pub/Sub & Rate Limiting), Docker, Nginx.
* **Integrations:** Alchemy SDK, Pimlico SDK, permissionless.js.

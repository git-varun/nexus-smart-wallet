# Nexus Smart Wallet — Canonical Project Portal

Welcome to the canonical, production-grade documentation portal for the **Nexus Smart Wallet** platform.

This portal acts as the single source of truth for engineering, operations, security, and product teams. All documented designs, architectural patterns, APIs, and procedures are synced directly with the implementation source code.

## 📌 Document Quick Links

### [🏗️ System Architecture](file:///home/dev-var/Personal/Projects/nexus-smart-wallet/docs/architecture/system-overview.md)
* [System Overview](file:///home/dev-var/Personal/Projects/nexus-smart-wallet/docs/architecture/system-overview.md) | [Frontend Architecture](file:///home/dev-var/Personal/Projects/nexus-smart-wallet/docs/architecture/frontend.md) | [Backend Architecture](file:///home/dev-var/Personal/Projects/nexus-smart-wallet/docs/architecture/backend.md)
* [ERC-4337 Integration](file:///home/dev-var/Personal/Projects/nexus-smart-wallet/docs/architecture/erc4337.md) | [Wallet Lifecycle](file:///home/dev-var/Personal/Projects/nexus-smart-wallet/docs/architecture/wallet-lifecycle.md)
* [FIFO Nonce Queue](file:///home/dev-var/Personal/Projects/nexus-smart-wallet/docs/architecture/queue.md) | [SSE Clustered Notifications](file:///home/dev-var/Personal/Projects/nexus-smart-wallet/docs/architecture/notifications.md)

### [🔌 API Reference](file:///home/dev-var/Personal/Projects/nexus-smart-wallet/docs/api/overview.md)
* [REST Endpoint Spec](file:///home/dev-var/Personal/Projects/nexus-smart-wallet/docs/api/overview.md) | [Auth Endpoints](file:///home/dev-var/Personal/Projects/nexus-smart-wallet/docs/api/authentication.md) | [Smart Account Routes](file:///home/dev-var/Personal/Projects/nexus-smart-wallet/docs/api/accounts.md)
* [Transaction Routes](file:///home/dev-var/Personal/Projects/nexus-smart-wallet/docs/api/transactions.md) | [Session Keys Control](file:///home/dev-var/Personal/Projects/nexus-smart-wallet/docs/api/session-keys.md)

### [💻 Frontend Guide](file:///home/dev-var/Personal/Projects/nexus-smart-wallet/docs/frontend/architecture.md)
* [FSD Filer Structures](file:///home/dev-var/Personal/Projects/nexus-smart-wallet/docs/frontend/architecture.md) | [Routing Guards](file:///home/dev-var/Personal/Projects/nexus-smart-wallet/docs/frontend/routing.md) | [Redux & React Query Store](file:///home/dev-var/Personal/Projects/nexus-smart-wallet/docs/frontend/state-management.md)
* [Atomic UI Components](file:///home/dev-var/Personal/Projects/nexus-smart-wallet/docs/frontend/components.md) | [UX User Flows](file:///home/dev-var/Personal/Projects/nexus-smart-wallet/docs/frontend/user-flows.md)

### [⚙️ Backend Engineering](file:///home/dev-var/Personal/Projects/nexus-smart-wallet/docs/backend/architecture.md)
* [Layered Controller/Services](file:///home/dev-var/Personal/Projects/nexus-smart-wallet/docs/backend/services.md) | [Zod Input Schemes](file:///home/dev-var/Personal/Projects/nexus-smart-wallet/docs/backend/validation.md) | [Mongoose Schema Maps](file:///home/dev-var/Personal/Projects/nexus-smart-wallet/docs/backend/models.md)
* [Background Event Workers](file:///home/dev-var/Personal/Projects/nexus-smart-wallet/docs/backend/workers.md) | [Database Collections](file:///home/dev-var/Personal/Projects/nexus-smart-wallet/docs/backend/queues.md)

### [🔒 Security Matrix](file:///home/dev-var/Personal/Projects/nexus-smart-wallet/docs/security/authentication.md)
* [Bcrypt & JWT Auth](file:///home/dev-var/Personal/Projects/nexus-smart-wallet/docs/security/jwt.md) | [Refresh Token Rotation](file:///home/dev-var/Personal/Projects/nexus-smart-wallet/docs/security/refresh-tokens.md) | [Session Key Verification](file:///home/dev-var/Personal/Projects/nexus-smart-wallet/docs/security/session-keys.md)
* [Redis Sliding Limiters](file:///home/dev-var/Personal/Projects/nexus-smart-wallet/docs/security/rate-limiting.md) | [Winston Redaction Loggers](file:///home/dev-var/Personal/Projects/nexus-smart-wallet/docs/operations/logging.md)

### [🚀 Operations & DR Runbooks](file:///home/dev-var/Personal/Projects/nexus-smart-wallet/docs/operations/runbook.md)
* [Zero downtime Deployments](file:///home/dev-var/Personal/Projects/nexus-smart-wallet/docs/operations/deployment.md) | [Container Orchestration](file:///home/dev-var/Personal/Projects/nexus-smart-wallet/docs/operations/docker.md) | [Health and Metric SLOs](file:///home/dev-var/Personal/Projects/nexus-smart-wallet/docs/operations/monitoring.md)
* [Stuck Nonce Audits](file:///home/dev-var/Personal/Projects/nexus-smart-wallet/docs/operations/troubleshooting.md) | [Backup and Restoration](file:///home/dev-var/Personal/Projects/nexus-smart-wallet/docs/operations/disaster-recovery.md)

### [🧪 Testing Harness](file:///home/dev-var/Personal/Projects/nexus-smart-wallet/docs/testing/strategy.md)
* [Unit and Mock Targets](file:///home/dev-var/Personal/Projects/nexus-smart-wallet/docs/testing/unit-tests.md) | [Local EVM (Anvil) Specs](file:///home/dev-var/Personal/Projects/nexus-smart-wallet/docs/testing/integration-tests.md) | [Playwright E2E Spec](file:///home/dev-var/Personal/Projects/nexus-smart-wallet/docs/testing/playwright.md)

---

## 🛠️ Tech Stack Quick Reference

* **Frontend:** React (Vite), Redux Toolkit, React Query (Tanstack), Viem, TailwindCSS.
* **Backend:** Node.js, Express, TypeScript, Mongoose, Zod.
* **Infrastructure:** MongoDB, Redis (Pub/Sub & Rate Limiting), Docker, Nginx.
* **Integrations:** Alchemy SDK, Pimlico SDK, permissionless.js.

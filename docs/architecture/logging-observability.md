# Observability and Logs Architecture

Observability is maintained through structured JSON logging, distributed request tracing, and live system metrics.

## 📡 Core Modules
1. **Winston Logger (`utils/logger.ts`):** Logs are formatted in JSON and written to standard output. Includes key redaction rules for passwords, private keys, JWTs, and API credentials.
2. **Distributed Tracing Middleware:** Mounts a unique `requestId` (via UUIDv4) onto every incoming request and binds it using Node's `AsyncLocalStorage`. The worker preserves this ID to trace jobs from enqueuing to blockchain mining.
3. **Metrics Tracker (`utils/metrics.ts`):** Collects active request counts, average API request latency, Redis command delays, queue depths, and on-chain mining times.
4. **Health Check Routes:** Mounts detailed startup, liveness, and readiness endpoints to verify connections.

Related Pages:
* [Winston Redaction](file:///home/dev-var/Personal/Projects/nexus-smart-wallet/docs/operations/logging.md)
* [Monitoring & Health](file:///home/dev-var/Personal/Projects/nexus-smart-wallet/docs/operations/monitoring.md)

# Redis Architecture

Redis serves as the caching layer, rate limiter, and pub/sub message broker.

## ⚙️ Core Roles
1. **Sliding Window Rate Limiter:** Tracks requests by IP address. In case Redis becomes unavailable, the rate limiter falls back to an in-memory Map with active periodic pruners.
2. **Notification Event Broker:** Distributes transaction confirmation and failure events across clustered Express API server replicas via Redis Pub/Sub.
3. **Slow Command Logging:** Integrates a wrapper for Redis commands (like `GET`, `SET`, `EVAL`) that triggers warnings if execution takes longer than `LOG_SLOW_REDIS_MS` (default: 100ms).

Related Pages:
* [SSE Notifications](notifications.md)
* [Redis Rate Limits](file:///home/dev-var/Personal/Projects/nexus-smart-wallet/docs/security/rate-limiting.md)

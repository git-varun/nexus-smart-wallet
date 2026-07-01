# Rate Limiting Security

Rate limiters are configured at the network route level to prevent DoS attacks.

## 📡 Limiter Strategies
* **Redis Limiter:** Uses Redis pipeline increments to track IP addresses.
* **In-Memory Fallback:** If Redis is down, rate limiting falls back to an in-memory Map. Stale IPs are pruned periodically to prevent memory leaks.
* **Limits Configuration:**
  * **Auth routes (`/api/auth/`):** Max 5 requests per 1 minute.
  * **Wallet deployment (`/transactions/deploy`):** Max 3 requests per 10 minutes.
  * **Standard wallet calls:** Max 10 requests per 1 minute.

Related Pages:
* [Redis Architecture](file:///home/dev-var/Personal/Projects/nexus-smart-wallet/docs/architecture/redis.md)
* [Incident Response](file:///home/dev-var/Personal/Projects/nexus-smart-wallet/docs/operations/troubleshooting.md)

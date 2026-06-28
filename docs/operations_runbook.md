# Nexus Smart Wallet — Production Operations Runbook

This runbook contains monitoring endpoints, incident response guidelines, recovery procedures, deployment steps, and system recovery runbooks.

---

## 1. System Health Checks & Metrics

### Health Monitoring Routes
The backend mounts several operational health routes at the `/api` prefix:
* **Liveness (`GET /api/health/liveness`):** Simple TCP check. Returns HTTP 200 `OK` if the process is listening.
* **Startup (`GET /api/health/startup`):** Validates config schema at boot. Returns HTTP 200 if environment variables are correct.
* **Readiness (`GET /api/health/readiness`):** Verifies that MongoDB is connected, Redis is listening, and Base RPC networks respond to JSON-RPC pings. Returns HTTP 503 `Service Unavailable` if degraded.

### Health Check Interpretation
* **HTTP 200**: Service is healthy.
* **HTTP 503**: Database, cache, or RPC provider is down. Route traffic away from this replica immediately.

### Production Metrics
* **Route**: `GET /api/metrics` (protected by the environment variable `METRICS_KEY`).
* **Format**: JSON structure containing active connection latency, database write rates, queue length, and confirmation durations.

---

## 2. Service Startup & Restart Order

To prevent startup dependency failures (such as the backend booting before the database accepts sockets), services must be started or restarted in the following order:

```text
  1. Redis Container   (Cache & event broker)
          ↓
  2. MongoDB Container (Persistent metadata store)
          ↓
  3. Backend API       (Express backend gateway & queue workers)
          ↓
  4. Nginx Static Host (Frontend assets delivery)
```

Command execution script:
```bash
# Graceful sequential startup
docker compose up -d redis
docker compose up -d mongo
# Wait for DB readiness socket
docker compose up -d backend
docker compose up -d frontend
```

---

## 3. Logs & Retention Policy

### Log Locations
* **Backend API Container Logs**: Written to standard output (`stdout`/`stderr`), captured by Docker log driver, and stored in `/var/lib/docker/containers/` on host systems.
* **Database Logs**: Streamed directly into standard docker runtime logs.
* **Access Logs**: Nginx accesses are recorded in `/var/log/nginx/access.log` and errors in `/var/log/nginx/error.log`.

### Log Retention Policy
* Docker log rotation is configured via `daemon.json` or `docker-compose.yml` properties:
  * Maximum file size: `10m` (10 Megabytes).
  * Maximum file count: `3` backups.
* Production environments must forward logs to a centralized log aggregator (e.g. Datadog, ELK stack, or GCP Cloud Logging) with a standard **30-day retention window** to comply with security audits.

---

## 4. Cache Invalidation Procedures

If data desynchronization is suspected between cached database models and on-chain ledger records, use the following procedures:

### A. Manual Portfolio Cache Flush
To force a sync of user balances, trigger the portfolio sync endpoint:
```bash
curl -X POST http://localhost:3000/api/portfolio/refresh \
  -H "Authorization: Bearer <auth_jwt>" \
  -H "Content-Type: application/json" \
  -d '{"address": "0xSmartAccountAddress", "chainId": 84532}'
```

### B. Redis Cache Purge
To drop all active rate limits or SSE session subscriptions, flush Redis cache keys:
```bash
docker compose exec redis redis-cli FLUSHALL
```
*Note: Flushing Redis will temporarily reset rate limit counters, but will not affect MongoDB transaction queues or user details.*

---

## 5. Service Level Objectives (SLOs) & Alert Thresholds

The platform is monitored against the following Service Level Indicators (SLIs):

| Metric | SLI Indicator | SLO Objective | Critical Alert Threshold |
| :--- | :--- | :--- | :--- |
| **API Availability** | Successful HTTP statuses (`2xx`/`3xx`/`4xx` vs `5xx`). | **> 99.9%** | **< 99.0%** over 5m window. |
| **P95 Latency** | Response time of non-transaction routes. | **< 300 ms** | **> 1000 ms** over 5m window. |
| **Queue Latency** | Time from transaction enqueue to on-chain mine. | **< 15 seconds** | **> 60 seconds** for any queue item. |
| **Error Rate** | Proportion of network requests returning HTTP 5xx. | **< 0.1%** | **> 1.0%** over 5m window. |

---

## 6. Incident Response Runbooks

### Incident A: Relayer EOA Nonce Desynchronization
* **Symptom:** Relayer logs show `"nonce too low"` or transaction execution times out.
* **Impact:** High. Transactions are stuck in the queue and cannot be submitted.
* **Recovery Action:**
  1. Restart the backend instance. The startup routine retrieves the actual on-chain transaction count and synchronizes the record atomically:
     `nextNonce = Math.max(record.nonce, onChainNonce)`
  2. If the EOA relayer is heavily loaded, check that `concurrency.test.ts` passes. The system will handle concurrent updates using the built-in OCC retry loop.

### Incident B: Stuck Submitted Transaction
* **Symptom:** Transaction status stays in `'submitted'` status for more than 10 minutes without moving to `'confirmed'` or `'failed'`.
* **Impact:** High. Future transactions for that specific smart account are blocked.
* **Recovery Action:**
  1. Restart the backend container.
  2. The worker startup hook automatically queries the bundler client for the receipt status of all submitted transaction hashes.
  3. If found on-chain, status updates to `'confirmed'`.
  4. If dropped or rejected by the bundler, the job is reset to `'queued'`, claimed by the next loop, and assigned a fresh correct nonce.

### Incident C: Redis Failover
* **Symptom:** Redis instance crashes.
* **Impact:** Medium. Live push notifications fail and rate limiting falls back to local memory.
* **Recovery Action:**
  1. Re-launch the Redis container. The backend automatically re-establishes Pub/Sub sockets without rebooting.

---

## 7. Disaster Recovery Checklist

In the event of a total system failure or database corruption:
* [ ] Verify container bridge network is active (`docker network ls`).
* [ ] Check host storage space (`df -h`) to ensure write logs haven't exhausted disk limits.
* [ ] Shut down active container stack: `docker compose down`.
* [ ] Restore latest database backup using the `mongorestore` instructions below.
* [ ] Spin up Redis and MongoDB first, verifying TCP logs: `docker compose up -d redis mongo`.
* [ ] Spin up API containers and tail logs to check for successful blockchain client connection setup.

### Database Backup & Restore
* **Backup**:
  ```bash
  docker compose exec mongo mongodump --db nexus-wallet --out /data/db/backups/nexus_backup_$(date +%F)
  ```
* **Restore**:
  ```bash
  docker compose exec mongo mongorestore --db nexus-wallet /data/db/backups/nexus_backup_<date>
  ```

---

## 8. Deployment & Rollback Procedures

### A. Rolling Deployment Procedure
Production deployments must achieve zero downtime using standard rolling updates:
1. Compile and push the container images to the registry:
   ```bash
   docker build -t registry/nexus-backend:v1.0.0 ./backend
   docker build -t registry/nexus-frontend:v1.0.0 ./frontend
   ```
2. Deploy backend updates using rolling container restarts:
   ```bash
   # Re-launch backend with minor version tags
   docker compose pull backend
   docker compose up -d --no-deps --scale backend=2 backend
   ```
3. Nginx automatically monitors backend container lifecycles and routes requests to the active container.

### B. Version Rollback Procedure
If live metrics indicate a degradation after deployment:
1. Re-tag the last stable image in the registry as `latest`.
2. Push the fallback tag and restart service runners:
   ```bash
   docker compose pull backend
   docker compose up -d --no-deps backend
   ```
3. Run readiness tests (`curl http://localhost:3000/api/health/readiness`) to verify database integration before routing user traffic back to the node.

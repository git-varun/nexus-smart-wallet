# Operational Runbook

Sequential steps for starting, stopping, and rolling back services.

## 🔄 Service Startup Order
To prevent dependency issues, start services in the following order:
1. **Redis Container** (Cache & rates limiter)
2. **MongoDB Container** (Database metadata)
3. **Backend API** (Express and queue workers)
4. **Nginx Static Host** (Frontend assets)

```bash
docker compose up -d redis
docker compose up -d mongo
docker compose up -d backend
docker compose up -d frontend
```

## 🔄 Version Rollback
If a deployment degrades system performance:
1. Re-tag the last stable image in the registry as `latest`.
2. Pull the fallback tag:
   ```bash
   docker compose pull backend
   docker compose up -d --no-deps backend
   ```
3. Verify readiness using `curl http://localhost:3000/api/health/readiness`.

Related Pages:
* [Deployment Guide](deployment.md)
* [Docker Topologies](docker.md)

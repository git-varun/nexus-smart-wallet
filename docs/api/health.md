# Health & Metrics Endpoints

Operational endpoints for container orchestrators (Kubernetes/Docker) and monitoring stack (Prometheus).

## 1. Liveness Probe
* **Endpoint:** `GET /api/health/liveness`
* **Auth Required:** No
* **Description:** Verifies that Express is listening. Returns HTTP 200 `OK`.

## 2. Startup Probe
* **Endpoint:** `GET /api/health/startup`
* **Auth Required:** No
* **Description:** Verifies that the config validation passed at startup. Returns HTTP 200 `OK`.

## 3. Readiness Probe
* **Endpoint:** `GET /api/health/readiness`
* **Auth Required:** No
* **Description:** Verifies database connections and RPC accessibility.
* **Response Example (Healthy):**
  ```json
  {
    "success": true,
    "data": {
      "status": "ready",
      "mongodb": "connected",
      "redis": "connected"
    }
  }
  ```
* **Response Example (Degraded - 503 Service Unavailable):**
  ```json
  {
    "success": false,
    "error": {
      "code": "SERVICE_UNAVAILABLE",
      "message": "Redis is disconnected"
    }
  }
  ```

## 4. System Metrics
* **Endpoint:** `GET /api/metrics`
* **Auth Required:** Public (metrics key protection can be loaded in production via `METRICS_KEY`)
* **Response Example (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "activeRequests": 1,
      "apiCallCount": 4251,
      "errorCount": 8,
      "averageLatencyMs": 35.4,
      "redisConnection": "connected",
      "queueLength": 0
    }
  }
  ```

Related Pages:
* [Monitoring & Health](file:///home/dev-var/Personal/Projects/nexus-smart-wallet/docs/operations/monitoring.md)
* [Logging & Observability](file:///home/dev-var/Personal/Projects/nexus-smart-wallet/docs/architecture/logging-observability.md)

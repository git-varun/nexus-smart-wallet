# C4 Architecture — Level 4: Deployment

This document details the production deployment architecture of the Nexus Smart Wallet system, including cluster topology, network bridges, container boundaries, and load balancing.

---

## 1. Deployment Topology

The system is deployed using isolated Docker containers configured inside a multi-service bridge network:

```mermaid
graph TD
    Client["Browser client"] -->|Port 8080 (HTTPS)| LoadBalancer["Nginx Proxy / Load Balancer\n(Static Assets / SSL Termination)"]
    
    subgraph Container Stack (Docker Compose Bridge)
        LoadBalancer -->|Serves Static Files| NginxStatic["Nginx Static Host Container\n(Frontend)"]
        LoadBalancer -->|Proxies /api requests| Backend1["Express API Instance A\n(Backend Container)"]
        LoadBalancer -->|Proxies /api requests| Backend2["Express API Instance B\n(Backend Container)"]
        
        Backend1 & Backend2 -->|Persists metadata| MongoReplica["MongoDB Container\n(Mounted Storage Volume)"]
        Backend1 & Backend2 -->|Pub/Sub Event Broker| RedisContainer["Redis Container\n(Cache & Session Store)"]
    end
    
    Backend1 & Backend2 -->|Sends UserOps| ExternalRPC["External ERC-4337 RPCs\n(Alchemy / Pimlico)"]
```

---

## 2. Infrastructure Deployment Catalog

### A. Routing & Proxy Layer
* **Nginx Load Balancer**: Handles SSL termination and routes requests. Path `/api/*` requests are load-balanced across active API containers, while all other requests map to the static frontend container.
* **Nginx Frontend Static Container**: Serves static minified React JS/CSS files. Configured to return `index.html` for all unknown routes, enabling React Router client-side routing.

### B. Scalable Application Tier
* **Express API Containers**: Multi-instance Node.js backend replicas. They remain completely stateless, coordinating shared states (such as active user sessions and nonce updates) via Redis and MongoDB.
* **Redis Pub/Sub Connection**: Both Backend instances are connected to the same Redis container to synchronize Server-Sent Events (SSE). When an event occurs on Instance A, it is broadcast to Instance B via Redis to ensure any connected user receives the alert immediately.

### C. Data Persistence Tier
* **MongoDB Container**: Bound to a host volume (`mongo-data`) to prevent data loss upon container restarts.
* **Redis Container**: Configured with append-only file (AOF) persistence enabled to ensure active rate limits and session cache survive crashes.

---

## 3. High Availability Checklist

1. **Database Persistence**: Ensure `docker-compose.yml` mounts host paths for `/data/db` to retain account info.
2. **Stateless API Replicas**: API containers must never write local files (e.g. avatars) to container storage. Avatars are uploaded to decentralized storage or base64-encoded in MongoDB.
3. **Graceful Reloads**: Containers are configured with health check paths. Rolling updates spawn the new container and wait for the `/api/health/readiness` check to pass before tearing down the old node.

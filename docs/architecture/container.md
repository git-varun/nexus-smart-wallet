# C4 Architecture — Level 2: Containers

This document details the software containers that make up the Nexus Smart Wallet system, their responsibilities, and how they communicate.

---

## 1. Container Diagram

```mermaid
graph TB
    User["Wallet Owner\n(Browser Client)"] -->|HTTPS / WSS| Nginx["Nginx static Server\n(Frontend Container)"]
    Nginx -->|Serves bundle| Browser["React SPA\n(Browser Runtime)"]
    
    Browser -->|REST API (HTTP/JWT)| API["Express Backend API\n(Backend Container)"]
    Browser -->|SSE (Real-time events)| API
    
    API -->|Reads / Writes metadata| DB["MongoDB\n(Database Container)"]
    API -->|Pub/Sub & Rate limiting| Cache["Redis\n(Cache & Broker Container)"]
    
    API -->|JSON-RPC| ExternalRPC["External ERC-4337 RPCs\n(Bundler / Paymaster)"]
```

---

## 2. Container Catalog

| Container | Technology | Responsibility |
| :--- | :--- | :--- |
| **Nginx Static Server** | Nginx 1.25 Alpine | Serves compiled static frontend single-page assets (JS, CSS, HTML). Manages asset gzip compression and routes fallback requests to `index.html`. |
| **React SPA** | React 18 / TypeScript / Vite | Renders the dashboard interfaces, manages client-side crypto keys (Wagmi/Viem), creates session keys, and tracks transaction statuses. |
| **Express Backend API** | Node.js / Express / TypeScript | Gateway system. Exposes REST endpoints for user authentication, wallet creation, portfolio synchronization, and session key registry. |
| **MongoDB** | MongoDB 7.0 | Datastore. Persists user accounts, smart account metadata, transaction histories, and session key policies. |
| **Redis** | Redis 7.0 | Cache and Event Broker. Manages sliding window rate limits, Pub/Sub channels for clustered SSE dispatch, and transaction queues. |
| **External ERC-4337 RPCs** | HTTPS JSON-RPC API | External bundlers and paymasters (e.g. Alchemy, Pimlico) that handle blockchain state execution and gas fee sponsorships. |

---

## 3. Communication Protocols

* **HTTPS**: Frontend loads static assets from Nginx, and client app queries Express API via secure REST protocols.
* **JWT (Bearer Tokens)**: Used for request authentication on all endpoints starting with `/api/` (except register/login).
* **Server-Sent Events (SSE)**: Single persistent HTTP socket established from the browser to the backend for real-time notification streaming.
* **TCP Socket connections**: Backend communicates with MongoDB using Mongoose, and with Redis using `ioredis`.
* **JSON-RPC 2.0**: The backend communicates with external EVM nodes, bundlers, and paymaster servers using standard JSON-RPC payloads over HTTPS.

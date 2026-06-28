# ADR-005: Redis Pub/Sub for Distributed Real-time Notifications

## Status
Accepted

## Context
The Nexus Smart Wallet utilizes Server-Sent Events (SSE) to push real-time transaction updates (queue status, confirmations, failures) to the browser. In early prototypes, active client connections were tracked in an in-memory array on a single server instance. In a production clustered deployment (e.g., behind a load balancer with multiple backend instances), this causes a delivery failure: if a transaction confirms on Node A, but the user's browser is connected to Node B, the notification is lost.

## Decision
We migrated the real-time notification engine to use a **Redis Pub/Sub channel architecture**:

1. **Redis Publisher**: When a background job or transaction controller finishes processing, it publishes the event to `notifications:publish` via the standard Redis connection.
2. **Redis Subscriber Client**: At startup, every backend instance initializes a secondary Redis connection dedicated to subscribing to `notifications:publish`.
3. **Broadcasting**: Upon receiving a message from the Redis channel, each instance scans its local client connection pool and writes the data to the corresponding SSE client socket.
4. **Graceful Fallback**: If Redis is not configured or fails, the code falls back to local in-memory distribution.

```text
Backend Event -> Redis Channel -> All Backend Instances -> Local SSE Sockets -> Client Browser
```

## Alternatives Considered
* **In-Memory SSE Pool (Legacy)**: Standard single-process array. Degrades under horizontal scaling.
* **WebSocket Frameworks (Socket.io)**: Heavy socket handshake overhead. Requires complex sticky session configuration on Nginx load balancers. SSE is unidirectional and fits the notification requirement with zero overhead.
* **Client Polling**: Periodic HTTP requests. Rejected because of network congestion, high database load, and delayed visual feedback.

## Consequences
* **Positives**:
  * Supports horizontal scaling and multi-instance Docker container deployments.
  * Completely decouples transaction execution workers from client connection targets.
  * Retains simple HTTP-based EventSource compatibility for the web frontend.
* **Negatives**:
  * Adds Redis as a hard runtime dependency.

## Future Considerations
Implement a backup database buffer for messages to allow clients that temporarily lose connection to request missed messages on reconnection.

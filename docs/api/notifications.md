# Notification Endpoints

Endpoints for real-time pushing event streams.

## 1. Subscribe to SSE Push Feed
* **Endpoint:** `GET /api/notifications/subscribe`
* **Auth Required:** No (Establishes connection stream)
* **Request Query:** `lastEventId` (optional, for missed event recovery)
* **Headers Returned:** `Content-Type: text/event-stream`, `Connection: keep-alive`, `Cache-Control: no-cache`
* **Client Heartbeat Interval:** Heartbeat commentary is pushed every 15 seconds.
* **Payload Examples:**
  * **connected:** `event: connected\ndata: {"type":"connected","userId":"..."}\n\n`
  * **heartbeat:** `event: heartbeat\ndata: {"type":"heartbeat","timestamp":"..."}\n\n`
  * **transaction.confirmed:** `event: transaction.confirmed\ndata: {"transactionId":"...","hash":"..."}\n\n`

Related Pages:
* [SSE Notifications](file:///home/dev-var/Personal/Projects/nexus-smart-wallet/docs/architecture/notifications.md)
* [Redis Architecture](file:///home/dev-var/Personal/Projects/nexus-smart-wallet/docs/architecture/redis.md)

# API Specification Overview

The Nexus Smart Wallet API is structured as a REST API. All endpoints are prefixed with `/api` and consume/produce JSON payloads.

## 🔐 Authentication Modes
* **Public:** No token required.
* **JWT:** Requires a valid token in the `Authorization: Bearer <token>` header.
* **Session Key:** Requiring session key signatures inside transaction request bodies.
* **Admin:** Requiring private validation keys (e.g. `METRICS_KEY`).

## 📥 JSON Error Envelope
In the event of an execution failure, the API returns a structured error:
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed: password must contain at least one uppercase letter",
    "requestId": "22bc9671-591a-4712-9c1a-cc6e582fa189",
    "timestamp": "2026-06-30T01:00:00.000Z"
  }
}
```

Related Pages:
* [Authentication API](authentication.md)
* [Health & Metrics API](health.md)

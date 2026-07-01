# Authorization Model

The application enforces authorization rules at the route, middleware, and worker levels.

## 🛡️ Access Control Layers
1. **Route Level (`requireAuth` Middleware):**
   * Decodes JWT headers and extracts `userId` and `email`.
   * Queries Mongoose to verify user existence and status.
2. **Object Level (BOLA Protections):**
   * Controllers check that target resources (Smart Accounts, Portfolio caches) are owned by the requesting `userId`.
3. **Execution Level (Session Key Policy Enforcement):**
   * When a transaction is submitted using a session key signature, the worker validates the target contract matches the whitelist, the function selector is authorized, and the spending limit is respected.

Related Pages:
* [Express Middlewares](file:///home/dev-var/Personal/Projects/nexus-smart-wallet/docs/backend/middleware.md)
* [Session Key Control](file:///home/dev-var/Personal/Projects/nexus-smart-wallet/docs/api/session-keys.md)

# Express Middlewares

Middlewares injected in API routes to enforce validation, security, and rate limiting.

## 📁 Middlewares List (`src/middleware/`)
* **requireAuth:**
  * Decodes JWT headers and extracts `userId`.
  * Verifies the token is not on the denylist.
* **validateBody:**
  * Validates request payloads against Zod schemas.
* **rateLimiters:**
  * Configures sliding-window rate limiters per IP address using Redis pipelines, falling back to local memory if Redis is unavailable.
  * *Limiters:* `authRateLimiter`, `walletRateLimiter`, `deployRateLimiter`, `sendTxRateLimiter`, `pollingRateLimiter`, `healthRateLimiter`.
* **requestIdMiddleware:**
  * Injects a unique `requestId` header to trace executions.
* **upload.middleware:**
  * Uses **multer** to process profile image uploads to disk.
* **errorHandlerMiddleware:**
  * Catches errors, logs exceptions, and returns JSON error envelopes.

Related Pages:
* [Zod Schemas](validation.md)
* [Redis Rate Limits](file:///home/dev-var/Personal/Projects/nexus-smart-wallet/docs/security/rate-limiting.md)

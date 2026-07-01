# Express Controllers

Express controller handlers map HTTP routes to services.

## 📁 Controller Directory (`src/controllers/`)
* **`auth.controller.ts`:** Handles logins, signups, refresh calls, and logs sessions.
* **`account.controller.ts`:** Handles Smart Account predictions and details fetching.
* **`transaction.controller.ts`:** Handles deploys, single/batch transfers, gas estimations, and polling status.
* **`sessionKey.controller.ts`:** Handles session registrations, validations, and revocations.
* **`portfolio.controller.ts`:** Fetches and refreshes cached portfolio states.
* **`notification.controller.ts`:** Handlers for establishing SSE connections.
* **`user.controller.ts`:** Manages profile displayName updates, avatar uploads, and avatar configuration settings.

Related Pages:
* [Backend Services](services.md)
* [Express Middlewares](middleware.md)

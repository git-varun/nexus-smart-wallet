# Authorization and Role Security

Access controls are enforced using validation middleware and object ownership verification.

## 🔒 Security Implementations
* **requireAuth Middleware:** Restricts endpoints to authenticated users.
* **Broken Object Level Authorization (BOLA) Protection:** Checks that users can only query/modify their own portfolios, accounts, and session keys.
* **CORS Whitelists:** Limits origin access using origins listed in `CORS_ORIGINS`.
* **Helmet Security Headers:** Injects standard security headers.
* **Content Security Policy (CSP):** Limits connections to secure Alchemy, Pimlico, and Base Sepolia gateways.

Related Pages:
* [Express Middlewares](file:///home/dev-var/Personal/Projects/nexus-smart-wallet/docs/backend/middleware.md)
* [Threat Profiles](threat-model.md)

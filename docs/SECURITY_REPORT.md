# General Availability Security Verification Report

## 1. Authentication Security Lifecycle
* **Short-lived Access Tokens:** JWT access tokens expire after 1 hour, minimizing the window of opportunity for intercepted tokens.
* **Refresh Token Rotation (RTR):** Refresh tokens are rotated on every single use. If a rotated refresh token is used a second time (indicating a replay attack), the system automatically revokes all sessions belonging to the user.
* **Token Revocation / Blacklisting:** Access tokens are blacklisted in Redis (with a TTL-indexed MongoDB fallback) immediately upon logout or revocation, ensuring they cannot be reused.

## 2. Session Key Cryptographic Sandboxing
* **Local Storage Encryption:** Ephemeral session private keys stored on the client side are encrypted in `localStorage` using a key bound to the active browser tab's `sessionStorage`. If the tab or browser is closed, the decryption key is destroyed, neutralizing XSS data extraction risks.
* **Cryptographic Signatures:** Every transaction authorized via session keys validates the user's cryptographic signature on-chain and inside the transaction service.

## 3. Infrastructure and Gateway Hardening
* **Helmet Security Headers:** Content Security Policy (CSP), XSS protection, and frameguard headers are configured.
* **CORS Policies:** CORS settings are restricted to verified domains configured in the production environment variables.
* **File Upload Constraints:** User avatar uploads are restricted to image mime types and capped at a maximum of 5MB via Multer configuration.

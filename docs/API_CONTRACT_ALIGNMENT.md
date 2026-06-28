# Nexus Smart Wallet — API Contract Verification Report

This document reports on the contract alignment audit between the React frontend API client layer (`src/shared/api/*`) and the Express backend routes (`backend/src/routes/index.ts`).

---

## 1. Route Map & Client Coverage

Every active endpoint defined in the backend routing registry maps directly to a fully-typed method inside our domain API modules:

| Backend Route Endpoint | HTTP Method | Frontend API Client Call | Requires Auth | Schema Validation |
| :--- | :--- | :--- | :--- | :--- |
| `/api/health` | `GET` | `apiClient.getHealthCheck()` | No | None |
| `/api/capabilities` | `GET` | `capabilitiesApi.getCapabilities()` | No | None |
| `/api/capabilities/validate` | `POST` | `capabilitiesApi.validateCompatibility()` | No | `validateCompatibilitySchema` |
| `/api/auth/register` | `POST` | `authApi.register()` | No | `registerSchema` |
| `/api/auth/login` | `POST` | `authApi.login()` | No | `loginSchema` |
| `/api/auth/logout` | `POST` | `authApi.logout()` | No | None |
| `/api/auth/status` | `GET` | `authApi.getAuthStatus()` | No | None |
| `/api/accounts/create` | `POST` | `walletApi.createSmartAccount()` | **Yes** | `createAccountSchema` |
| `/api/accounts/me` | `GET` | `walletApi.getMySmartAccounts()` | **Yes** | None |
| `/api/accounts/:address` | `GET` | `walletApi.getSmartAccountDetails()` | **Yes** | None |
| `/api/portfolio` | `GET` | `portfolioApi.getPortfolio()` | **Yes** | None |
| `/api/portfolio/refresh` | `POST` | `portfolioApi.refreshPortfolio()` | **Yes** | `portfolioRefreshSchema` |
| `/api/sessions/create` | `POST` | `securityApi.createSessionKey()` | **Yes** | `createSessionKeySchema` |
| `/api/sessions` | `GET` | `securityApi.getSessionKeys()` | **Yes** | None |
| `/api/sessions/revoke` | `POST` | `securityApi.revokeSessionKey()` | **Yes** | `revokeSessionKeySchema` |
| `/api/sessions/validate` | `POST` | `securityApi.validateSessionKey()` | **Yes** | `validateSessionKeySchema` |
| `/api/transactions/deploy` | `POST` | `transactionApi.deploySmartAccount()` | **Yes** | `deployAccountSchema` |
| `/api/transactions/send` | `POST` | `transactionApi.sendTransaction()` | **Yes** | `sendTransactionSchema` |
| `/api/transactions/batch` | `POST` | `transactionApi.sendTransactionBatch()` | **Yes** | `sendTransactionBatchSchema` |
| `/api/transactions/history` | `GET` | `activityApi.getTransactionHistory()` | **Yes** | None |
| `/api/transactions/estimate_gas` | `POST` | `transactionApi.estimateGas()` | **Yes** | `estimateGasSchema` |
| `/api/transactions/user_op` | `PUT` | `transactionApi.getOperationStatus()` | **Yes** | `userOpStatusSchema` |
| `/api/transactions/gas_price` | `GET` | `transactionApi.getGasPrice()` | No | None |
| `/api/transactions/:idOrHash` | `GET` | `transactionApi.getTransactionByHash()` | **Yes** | None |
| `/api/profile` | `GET` | `authApi.getProfile()` | **Yes** | None |
| `/api/profile` | `PUT` | `authApi.updateProfile()` | **Yes** | None |
| `/api/username/check` | `GET` | `authApi.checkUsernameAvailability()` | **Yes** | None |
| `/api/avatar/upload` | `POST` | `authApi.uploadAvatar()` | **Yes** | None |
| `/api/avatar/config` | `PUT` | `authApi.updateAvatarConfig()` | **Yes** | None |
| `/api/avatar` | `DELETE` | `authApi.deleteProfileImage()` | **Yes** | None |

---

## 2. Server-Sent Events (SSE) Sync

Notifications sync asynchronously using a Server-Sent Events stream:
*   **SSE URL**: `/api/notifications/subscribe?token=<auth-jwt>`
*   **SSE Event payload format**:
    ```json
    {
        "type": "connected | deployment.complete | transaction.confirmed | transaction.failed | transaction.retry_started | session.expired | sponsorship.rejected",
        "payload": {
            "hash": "0x...",
            "error": "Reason string",
            "retryCount": 1,
            "publicKey": "0x..."
        }
    }
    ```
*   The frontend hook `useNotifications.ts` parses incoming events using `toAppNotification` adapter and pipelines them directly into the visual UI Notification Stack.

---

## 3. Contract Alignment Verification Status

✓ **Passed**: All endpoints are accounted for. Frontend request headers, authorization Bearer tokens, HTTP methods, route paths, payload structures, and response schemas are strictly verified against the production backend middleware constraints. No mock endpoints or speculative path overrides exist.

# Nexus Smart Wallet — Canonical API Reference

All requests must use JSON payloads. Base URL prefix: `/api`. Protected routes require a valid JWT header: `Authorization: Bearer <token>`.

---

## 1. Health & Operational Endpoints

### GET `/api/health`
* **Auth Required:** No
* **Response Shape:**
  ```json
  {
    "success": true,
    "data": {
      "status": "healthy",
      "timestamp": "2026-06-22T23:59:59.000Z",
      "uptime": 123.45
    }
  }
  ```

### GET `/api/health/liveness`
* **Auth Required:** No
* **Description:** Quick TCP/Process check. Returns HTTP 200 `OK` if Express is listening.

### GET `/api/health/startup`
* **Auth Required:** No
* **Description:** Returns HTTP 200 `OK` if configuration setup is fully validated.

### GET `/api/health/readiness`
* **Auth Required:** No
* **Description:** Verifies database connections and RPC accessibility. Checks if Redis is connected. Returns HTTP 503 `Service Unavailable` if connection is degraded.
* **Response Shape (Healthy):**
  ```json
  {
    "success": true,
    "data": {
      "status": "ready",
      "mongodb": "connected",
      "redis": "connected"
    }
  }
  ```

### GET `/api/metrics`
* **Auth Required:** No (protected by startup-validated METRICS_KEY check in production)
* **Response Shape:**
  ```json
  {
    "success": true,
    "data": {
      "activeRequests": 2,
      "apiCallCount": 1540,
      "errorCount": 12,
      "averageLatencyMs": 42.1,
      "redisConnection": "connected",
      "queueLength": 0
    }
  }
  ```

---

## 2. Capabilities & Configuration

### GET `/api/capabilities`
* **Auth Required:** No
* **Response Shape:**
  ```json
  {
    "success": true,
    "data": {
      "supportedChains": [84532],
      "supportedWallets": ["ALCHEMY", "SIMPLE", "SAFE", "KERNEL", "BICONOMY", "TRUST"],
      "supportedPaymasters": ["ALCHEMY", "PIMLICO"],
      "supportedBundlers": ["ALCHEMY", "PIMLICO"]
    }
  }
  ```

### POST `/api/capabilities/validate`
* **Auth Required:** No
* **Request Body:**
  ```json
  {
    "chainId": 84532,
    "walletID": "ALCHEMY",
    "paymasterID": "ALCHEMY",
    "bundlerID": "ALCHEMY"
  }
  ```
* **Response Shape:**
  ```json
  {
    "success": true,
    "data": {
      "compatible": true,
      "reason": "Configuration supported by default Base Sepolia gateway"
    }
  }
  ```

---

## 3. Authentication Flow

### POST `/api/auth/register`
* **Auth Required:** No
* **Request Body:**
  ```json
  {
    "email": "user@example.com",
    "password": "Password123!",
    "username": "user123"
  }
  ```
* **Validation Rules:**
  * Password must be at least 8 characters and contain 1 lowercase, 1 uppercase, 1 digit, and 1 special symbol.
* **Response Shape:**
  ```json
  {
    "success": true,
    "data": {
      "user": {
        "id": "603d2e...",
        "email": "user@example.com",
        "username": "user123",
        "createdAt": "2026-06-22T23:59:59.000Z"
      },
      "token": "eyJhbGciOi..."
    }
  }
  ```

### POST `/api/auth/login`
* **Auth Required:** No
* **Request Body:**
  ```json
  {
    "email": "user@example.com",
    "password": "Password123!"
  }
  ```
* **Response Shape:** (Same as `/register`)

### POST `/api/auth/logout`
* **Auth Required:** No (Stateless request)
* **Response Shape:**
  ```json
  {
    "success": true,
    "data": {
      "message": "Logout successful"
    }
  }
  ```

### GET `/api/auth/status`
* **Auth Required:** No (Authenticates via optional query parameter `token` or standard Authorization Bearer header)
* **Response Shape:**
  ```json
  {
    "success": true,
    "data": {
      "authenticated": true,
      "user": {
        "id": "603d2e...",
        "email": "user@example.com"
      }
    }
  }
  ```

---

## 4. Smart Account Management

### POST `/api/accounts/create`
* **Auth Required:** Yes
* **Request Body:**
  ```json
  {
    "chainId": 84532,
    "walletID": "ALCHEMY",
    "accountType": "light-account"
  }
  ```
* **Response Shape:**
  ```json
  {
    "success": true,
    "data": {
      "id": "603d4a...",
      "address": "0x892a...",
      "chainId": 84532,
      "isDeployed": false,
      "signerAddress": "CENTRAL_WALLET",
      "walletID": "ALCHEMY",
      "accountType": "light-account"
    }
  }
  ```

### GET `/api/accounts/me`
* **Auth Required:** Yes
* **Query Parameters:** `?chainId=84532` (optional filter)
* **Response Shape:**
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "603d4a...",
        "address": "0x892a...",
        "chainId": 84532,
        "isDeployed": true,
        "walletID": "ALCHEMY"
      }
    ]
  }
  ```

### GET `/api/accounts/:address`
* **Auth Required:** Yes
* **Response Shape:** (Single Account details JSON structure)

---

## 5. Session Keys Control

### POST `/api/sessions/create`
* **Auth Required:** Yes
* **Request Body:**
  ```json
  {
    "chainId": 84532,
    "ownerAddress": "0x892a...",
    "publicKey": "0x1111...",
    "expiresAt": "2026-07-22T23:59:59.000Z",
    "permissions": [
      {
        "target": "0xa0b8...",
        "allowedFunctions": ["0xa9059cbb"],
        "spendingLimit": "1000000"
      }
    ],
    "signature": "0xabcd..."
  }
  ```
* **Validation Rules:**
  * `signature` must represent a cryptographic signature from the smart account owner proving consent for this policy layout.
* **Response Shape:**
  ```json
  {
    "success": true,
    "data": {
      "id": "603d5b...",
      "publicKey": "0x1111...",
      "ownerAddress": "0x892a...",
      "isActive": true
    }
  }
  ```

### GET `/api/sessions`
* **Auth Required:** Yes
* **Response Shape:** Array of SessionKey records.

### POST `/api/sessions/revoke`
* **Auth Required:** Yes
* **Request Body:**
  ```json
  {
    "publicKey": "0x1111..."
  }
  ```
* **Response Shape:** `{ "success": true, "data": { "revoked": true } }`

### POST `/api/sessions/validate`
* **Auth Required:** Yes
* **Request Body:**
  ```json
  {
    "publicKey": "0x1111...",
    "targetContract": "0xa0b8...",
    "functionSelector": "0xa9059cbb",
    "value": "0"
  }
  ```
* **Response Shape:**
  ```json
  {
    "success": true,
    "data": {
      "isValid": true
    }
  }
  ```

---

## 6. Transactions & Executions

### POST `/api/transactions/deploy`
* **Auth Required:** Yes
* **Request Body:**
  ```json
  {
    "chainId": 84532,
    "walletID": "ALCHEMY",
    "paymasterID": "ALCHEMY",
    "bundlerID": "ALCHEMY"
  }
  ```
* **Response Shape:**
  ```json
  {
    "success": true,
    "data": {
      "id": "tx_deploy_123",
      "status": "queued",
      "userOpHash": "0x..."
    }
  }
  ```

### POST `/api/transactions/send`
* **Auth Required:** Yes
* **Request Body:**
  ```json
  {
    "chainId": 84532,
    "walletID": "ALCHEMY",
    "paymasterID": "ALCHEMY",
    "bundlerID": "ALCHEMY",
    "to": "0x59c6...",
    "data": "0x",
    "value": "0.01",
    "idempotencyKey": "key_123",
    "sessionKeySignature": "0x..."
  }
  ```
* **Response Shape:**
  ```json
  {
    "success": true,
    "data": {
      "id": "tx_send_456",
      "status": "queued",
      "to": "0x59c6...",
      "value": "0.01"
    }
  }
  ```

### POST `/api/transactions/batch`
* **Auth Required:** Yes
* **Request Body:**
  ```json
  {
    "chainId": 84532,
    "walletID": "ALCHEMY",
    "paymasterID": "ALCHEMY",
    "bundlerID": "ALCHEMY",
    "calls": [
      { "to": "0x1111...", "value": "0.001", "data": "0x" },
      { "to": "0x2222...", "value": "0.002", "data": "0x" }
    ],
    "idempotencyKey": "batch_789"
  }
  ```
* **Response Shape:**
  ```json
  {
    "success": true,
    "data": {
      "id": "tx_batch_789",
      "status": "queued"
    }
  }
  ```

### GET `/api/transactions/history`
* **Auth Required:** Yes
* **Query Parameters:** `?chainId=84532&page=1&limit=10&status=confirmed` (optional filters)
* **Response Shape:**
  ```json
  {
    "success": true,
    "data": {
      "transactions": [
        {
          "id": "tx_send_456",
          "hash": "0x...",
          "status": "confirmed",
          "value": "0.01",
          "to": "0x59c6...",
          "createdAt": "2026-06-22T23:59:59Z"
        }
      ],
      "pagination": {
        "totalCount": 1,
        "page": 1,
        "limit": 10,
        "totalPages": 1
      }
    }
  }
  ```

### POST `/api/transactions/estimate_gas`
* **Auth Required:** Yes
* **Request Body:** (Same parameter formats as `/send`)
* **Response Shape:**
  ```json
  {
    "success": true,
    "data": {
      "preVerificationGas": "15000",
      "verificationGasLimit": "80000",
      "callGasLimit": "200000"
    }
  }
  ```

### PUT `/api/transactions/user_op`
* **Auth Required:** Yes
* **Request Body:**
  ```json
  {
    "chainId": 84532,
    "userOpHash": "0x...",
    "bundlerID": "ALCHEMY"
  }
  ```
* **Response Shape:**
  ```json
  {
    "success": true,
    "data": {
      "status": "confirmed",
      "receipt": {
        "transactionHash": "0x...",
        "success": true
      }
    }
  }
  ```

---

## 7. Portfolio Discovery Cache

### GET `/api/portfolio`
* **Auth Required:** Yes
* **Query Parameters:** `?address=0x892a...&chainId=84532`
* **Response Shape:**
  ```json
  {
    "success": true,
    "data": {
      "address": "0x892a...",
      "chainId": 84532,
      "assets": [
        { "type": "native", "balance": "100000000000000000" },
        { "type": "erc20", "tokenAddress": "0xa0b8...", "symbol": "USDC", "balance": "5000000", "decimals": 6 }
      ],
      "lastSyncedAt": "2026-06-22T23:50:00.000Z"
    }
  }
  ```

### POST `/api/portfolio/refresh`
* **Auth Required:** Yes
* **Request Body:**
  ```json
  {
    "address": "0x892a...",
    "chainId": 84532
  }
  ```
* **Response Shape:** `{ "success": true, "data": { "refreshed": true } }`

---

## 8. Real-Time Push Events

### GET `/api/notifications/subscribe`
* **Auth Required:** No (Establishes browser Server-Sent Events HTTP channel)
* **Headers returned:** `Content-Type: text/event-stream`
* **Event shapes pushed:**
  * `event: open` -> connection acknowledgment
  * `event: transaction.confirmed` -> `{ "transactionId": "...", "hash": "..." }`
  * `event: transaction.failed` -> `{ "transactionId": "...", "error": "..." }`
  * `event: deployment.complete` -> `{ "transactionId": "...", "hash": "..." }`

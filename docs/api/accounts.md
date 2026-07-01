# Smart Account Endpoints

Endpoints for counterfactual predicting, metadata queries, and smart account details.

## 1. Predict and Cache Smart Account
* **Endpoint:** `POST /api/accounts/create`
* **Auth Required:** JWT
* **Request Schema (Zod):** [validation.md#createaccountschema](file:///home/dev-var/Personal/Projects/nexus-smart-wallet/docs/backend/validation.md#createaccountschema)
* **Request Example:**
  ```json
  {
    "chainId": 84532,
    "walletID": "ALCHEMY",
    "accountType": "light-account"
  }
  ```
* **Response Example (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "id": "649c12aa7e1f427b14040db8",
      "address": "0x892a000000000000000000000000000000000012",
      "chainId": 84532,
      "isDeployed": false,
      "signerAddress": "0xCentralEOA",
      "walletID": "ALCHEMY",
      "accountType": "light-account"
    }
  }
  ```

## 2. Get User's Smart Accounts
* **Endpoint:** `GET /api/accounts/me`
* **Auth Required:** JWT
* **Query Parameters:** `chainId` (optional, e.g. `?chainId=84532`)
* **Response Example (200 OK):**
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "649c12aa7e1f427b14040db8",
        "address": "0x892a000000000000000000000000000000000012",
        "chainId": 84532,
        "isDeployed": true,
        "walletID": "ALCHEMY"
      }
    ]
  }
  ```

## 3. Get Smart Account Details by Address
* **Endpoint:** `GET /api/accounts/:address`
* **Auth Required:** JWT
* **Response Example (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "id": "649c12aa7e1f427b14040db8",
      "address": "0x892a000000000000000000000000000000000012",
      "chainId": 84532,
      "isDeployed": true,
      "signerAddress": "0xCentralEOA",
      "walletID": "ALCHEMY",
      "accountType": "light-account",
      "isActive": true,
      "createdAt": "2026-06-30T01:30:00.000Z",
      "updatedAt": "2026-06-30T01:31:00.000Z"
    }
  }
  ```

Related Pages:
* [Wallet Lifecycle Architecture](file:///home/dev-var/Personal/Projects/nexus-smart-wallet/docs/architecture/wallet-lifecycle.md)
* [Transactions API](transactions.md)

# Transaction Endpoints

Endpoints for smart account deployments, gas estimations, and transaction relays (single/batch).

## 1. Deploy Smart Account Counterfactual contract
* **Endpoint:** `POST /api/transactions/deploy`
* **Auth Required:** JWT
* **Request Schema (Zod):** [validation.md#deployaccountschema](file:///home/dev-var/Personal/Projects/nexus-smart-wallet/docs/backend/validation.md#deployaccountschema)
* **Request Example:**
  ```json
  {
    "chainId": 84532,
    "walletID": "ALCHEMY",
    "paymasterID": "ALCHEMY",
    "bundlerID": "ALCHEMY",
    "idempotencyKey": "deploy_user_12a"
  }
  ```
* **Response Example (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "id": "tx_deploy_922ac",
      "status": "queued",
      "userOpHash": "0x..."
    }
  }
  ```

## 2. Send Smart Account Transaction
* **Endpoint:** `POST /api/transactions/send`
* **Auth Required:** JWT
* **Request Schema:** [validation.md#sendtransactionschema](file:///home/dev-var/Personal/Projects/nexus-smart-wallet/docs/backend/validation.md#sendtransactionschema)
* **Request Example:**
  ```json
  {
    "to": "0x1111111111111111111111111111111111111111",
    "value": "0.01",
    "data": "0x",
    "chainId": 84532,
    "walletID": "ALCHEMY",
    "paymasterID": "ALCHEMY",
    "bundlerID": "ALCHEMY",
    "idempotencyKey": "send_user_13b"
  }
  ```
* **Response Example (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "id": "tx_send_392ca",
      "status": "queued",
      "to": "0x1111111111111111111111111111111111111111",
      "value": "0.01"
    }
  }
  ```

## 3. Send Batch Smart Account Transactions
* **Endpoint:** `POST /api/transactions/batch`
* **Auth Required:** JWT
* **Request Schema:** [validation.md#sendtransactionbatchschema](file:///home/dev-var/Personal/Projects/nexus-smart-wallet/docs/backend/validation.md#sendtransactionbatchschema)
* **Request Example:**
  ```json
  {
    "calls": [
      { "to": "0x1111111111111111111111111111111111111111", "value": "0.005", "data": "0x" },
      { "to": "0x2222222222222222222222222222222222222222", "value": "0.002", "data": "0x" }
    ],
    "chainId": 84532,
    "walletID": "ALCHEMY",
    "paymasterID": "ALCHEMY",
    "bundlerID": "ALCHEMY",
    "idempotencyKey": "batch_user_44d"
  }
  ```
* **Response Example (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "id": "tx_batch_892cc",
      "status": "queued"
    }
  }
  ```

## 4. Query Gas Estimation
* **Endpoint:** `POST /api/transactions/estimate_gas`
* **Auth Required:** JWT
* **Request Schema:** [validation.md#estimategasschema](file:///home/dev-var/Personal/Projects/nexus-smart-wallet/docs/backend/validation.md#estimategasschema)
* **Response Example (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "preVerificationGas": "15000",
      "verificationGasLimit": "85000",
      "callGasLimit": "210000"
    }
  }
  ```

Related Pages:
* [ERC-4337 Architecture](file:///home/dev-var/Personal/Projects/nexus-smart-wallet/docs/architecture/erc4337.md)
* [FIFO Nonce Queue](file:///home/dev-var/Personal/Projects/nexus-smart-wallet/docs/architecture/queue.md)

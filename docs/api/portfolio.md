# Portfolio Endpoints

Endpoints for fetching and updating cached balances of on-chain portfolios.

## 1. Fetch Cached Portfolio
* **Endpoint:** `GET /api/portfolio`
* **Auth Required:** JWT
* **Query Parameters:** `address` (required, smart account EOA), `chainId` (required, number)
* **Response Example (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "address": "0x892a000000000000000000000000000000000012",
      "chainId": 84532,
      "assets": [
        {
          "type": "native",
          "balance": "100000000000000000"
        },
        {
          "type": "erc20",
          "tokenAddress": "0x328a0000000000000000000000000000000000ef",
          "symbol": "USDC",
          "name": "USD Coin",
          "decimals": 6,
          "balance": "5000000"
        }
      ],
      "lastSyncedAt": "2026-06-30T01:30:00.000Z"
    }
  }
  ```

## 2. Force Refresh Portfolio Cache
* **Endpoint:** `POST /api/portfolio/refresh`
* **Auth Required:** JWT
* **Request Schema (Zod):** [validation.md#portfoliorefreshschema](file:///home/dev-var/Personal/Projects/nexus-smart-wallet/docs/backend/validation.md#portfoliorefreshschema)
* **Request Example:**
  ```json
  {
    "address": "0x892a000000000000000000000000000000000012",
    "chainId": 84532
  }
  ```
* **Response Example (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "refreshed": true
    }
  }
  ```

Related Pages:
* [Database Architecture](file:///home/dev-var/Personal/Projects/nexus-smart-wallet/docs/architecture/database.md)
* [Background Workers](file:///home/dev-var/Personal/Projects/nexus-smart-wallet/docs/backend/workers.md)

# Developer Capability Endpoints

Endpoints for querying network features, whitelist configurations, and compatibility checks.

## 1. Get API Capabilities
* **Endpoint:** `GET /api/capabilities`
* **Auth Required:** No
* **Response Example (200 OK):**
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

## 2. Validate Configuration Compatibility
* **Endpoint:** `POST /api/capabilities/validate`
* **Auth Required:** No
* **Request Schema (Zod):** [validation.md#validatecompatibilityschema](file:///home/dev-var/Personal/Projects/nexus-smart-wallet/docs/backend/validation.md#validatecompatibilityschema)
* **Request Example:**
  ```json
  {
    "chainId": 84532,
    "walletID": "ALCHEMY",
    "paymasterID": "ALCHEMY",
    "bundlerID": "ALCHEMY"
  }
  ```
* **Response Example (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "compatible": true,
      "reason": "Configuration supported by default Base Sepolia gateway"
    }
  }
  ```

Related Pages:
* [Express Config](file:///home/dev-var/Personal/Projects/nexus-smart-wallet/docs/reference/configuration.md)
* [Zod Validation Schemas](file:///home/dev-var/Personal/Projects/nexus-smart-wallet/docs/backend/validation.md)

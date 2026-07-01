# Session Keys Control Endpoints

Endpoints for registering, revoking, and checking cryptographic session keys.

## 1. Register Session Key Policy
* **Endpoint:** `POST /api/sessions/create`
* **Auth Required:** JWT
* **Request Schema (Zod):** [validation.md#createsessionkeyschema](file:///home/dev-var/Personal/Projects/nexus-smart-wallet/docs/backend/validation.md#createsessionkeyschema)
* **Request Example:**
  ```json
  {
    "ownerAddress": "0xSmartAccountAddress",
    "publicKey": "0xSessionKeyPublicAddress",
    "chainId": 84532,
    "expiresAt": "2026-07-30T00:00:00.000Z",
    "permissions": [
      {
        "target": "0xTargetUSDCContract",
        "allowedFunctions": ["0xa9059cbb"],
        "spendingLimit": "1000000"
      }
    ],
    "signature": "0xCryptographicOwnerConsentProofSignature..."
  }
  ```
* **Response Example (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "id": "649c15ab7e1f427b14040dc1",
      "publicKey": "0xsessionkeypublicaddress",
      "ownerAddress": "0xsmartaccountaddress",
      "isActive": true
    }
  }
  ```

## 2. Get Active Session Keys
* **Endpoint:** `GET /api/sessions`
* **Auth Required:** JWT
* **Response Example (200 OK):** (Returns array of registered SessionKey records)

## 3. Revoke Session Key
* **Endpoint:** `POST /api/sessions/revoke`
* **Auth Required:** JWT
* **Request Schema:** [validation.md#revokesessionkeyschema](file:///home/dev-var/Personal/Projects/nexus-smart-wallet/docs/backend/validation.md#revokesessionkeyschema)
* **Response Example (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "revoked": true
    }
  }
  ```

Related Pages:
* [Session Key Flow](file:///home/dev-var/Personal/Projects/nexus-smart-wallet/docs/security/session-keys.md)
* [System Authentication](file:///home/dev-var/Personal/Projects/nexus-smart-wallet/docs/architecture/authentication.md)

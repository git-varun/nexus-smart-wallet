# Authentication Endpoints

Endpoints for user authentication and session management.

## 1. User Registration
* **Endpoint:** `POST /api/auth/register`
* **Auth Required:** No
* **Request Schema (Zod):** [validation.md#registerschema](file:///home/dev-var/Personal/Projects/nexus-smart-wallet/docs/backend/validation.md#registerschema)
* **Request Example:**
  ```json
  {
    "email": "dev@example.com",
    "password": "StrongPassword123!",
    "username": "developer_wallet"
  }
  ```
* **Response Example (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "user": {
        "id": "649c10427e1f427b14040db4",
        "email": "dev@example.com",
        "username": "developer_wallet",
        "createdAt": "2026-06-30T01:30:00.000Z"
      },
      "token": "eyJhbGciOiJIUzI1Ni..."
    }
  }
  ```

## 2. User Login
* **Endpoint:** `POST /api/auth/login`
* **Auth Required:** No
* **Request Schema:** [validation.md#loginschema](file:///home/dev-var/Personal/Projects/nexus-smart-wallet/docs/backend/validation.md#loginschema)
* **Request Example:**
  ```json
  {
    "email": "dev@example.com",
    "password": "StrongPassword123!"
  }
  ```
* **Response Example (200 OK):** (Same schema as Registration)

## 3. Session Status Check
* **Endpoint:** `GET /api/auth/status`
* **Auth Required:** Optional (JWT header or `?token=` query parameter)
* **Response Example (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "authenticated": true,
      "user": {
        "id": "649c10427e1f427b14040db4",
        "email": "dev@example.com"
      }
    }
  }
  ```

## 4. User Logout
* **Endpoint:** `POST /api/auth/logout`
* **Auth Required:** No (Stateless request)
* **Response Example (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "message": "Logout successful"
    }
  }
  ```

## 5. Token Refresh
* **Endpoint:** `POST /api/auth/refresh`
* **Auth Required:** No
* **Request Schema:** [validation.md#refreshschema](file:///home/dev-var/Personal/Projects/nexus-smart-wallet/docs/backend/validation.md#refreshschema)
* **Request Example:**
  ```json
  {
    "refreshToken": "rf_92ac192...",
    "deviceIdentifier": "chrome-desktop"
  }
  ```
* **Response Example (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "token": "new_jwt_token_here",
      "refreshToken": "new_refresh_token_here"
    }
  }
  ```

Related Pages:
* [Bcrypt & JWT Auth](file:///home/dev-var/Personal/Projects/nexus-smart-wallet/docs/security/jwt.md)
* [Refresh Tokens](file:///home/dev-var/Personal/Projects/nexus-smart-wallet/docs/security/refresh-tokens.md)

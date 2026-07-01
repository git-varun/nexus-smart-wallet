# User Settings & Profile Endpoints

Endpoints for managing user preferences, theme, and profile avatars.

## 1. Get Profile Details
* **Endpoint:** `GET /api/profile`
* **Auth Required:** JWT
* **Response Example (200 OK):** (Returns the authenticated user details model)

## 2. Update Profile preferences
* **Endpoint:** `PUT /api/profile`
* **Auth Required:** JWT
* **Request Example:**
  ```json
  {
    "displayName": "Nexus Builder",
    "preferences": {
      "theme": "dark",
      "language": "en"
    }
  }
  ```
* **Response Example (200 OK):** (Returns updated user document)

## 3. Upload Profile Image
* **Endpoint:** `POST /api/avatar/upload`
* **Auth Required:** JWT
* **Request Content-Type:** `multipart/form-data`
* **Request Body:** `profileImage` (binary file payload)
* **Response Example (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "profileImageUrl": "/uploads/avatar_649c12.png"
    }
  }
  ```

## 4. Delete Profile Image
* **Endpoint:** `DELETE /api/avatar`
* **Auth Required:** JWT
* **Response Example (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "message": "Avatar image deleted successfully"
    }
  }
  ```

Related Pages:
* [Mongoose Models](file:///home/dev-var/Personal/Projects/nexus-smart-wallet/docs/backend/models.md)
* [Express Middlewares](file:///home/dev-var/Personal/Projects/nexus-smart-wallet/docs/backend/middleware.md#uploadmiddleware)

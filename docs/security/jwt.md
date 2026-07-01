# JWT Specification

Detailed JSON Web Token specs.

## ⚙️ Properties
* **Signing Algorithm:** HS256.
* **Signing Key Source:** `JWT_SECRET` environment variable.
* **Expiration Duration:** Hardcoded to 24 hours.
* **Payload Structure:**
  ```json
  {
    "userId": "649c12aa7e1f427b14040db8",
    "email": "dev@example.com",
    "iat": 1782292800,
    "exp": 1782379200
  }
  ```

Related Pages:
* [Authentication Security](authentication.md)
* [Refresh Tokens](refresh-tokens.md)

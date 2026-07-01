# Refresh Token Rotation (RTR)

Refresh Token Rotation ensures refresh tokens are invalidated upon reuse.

## 🔄 Rotation Flow
1. **Generation:** When logging in, the server returns a JWT and a cryptographically random `refreshToken`.
2. **Persistence:** The session details are stored in the `UserSession` collection.
3. **Rotation:** To refresh a token, the client calls `/api/auth/refresh`. The server invalidates the old refresh token, pushes it to `usedRefreshTokens`, and returns a new refresh token.
4. **Breach Detection:** If a token listed in `usedRefreshTokens` is used again, the server flags it as a replay attempt, invalidates the entire session, and requires the user to log in again.

Related Pages:
* [Authentication Security](authentication.md)
* [JWT Specs](jwt.md)

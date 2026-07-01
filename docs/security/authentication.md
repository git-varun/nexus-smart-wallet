# Authentication Security

The platform relies on **bcrypt** and stateless JWTs to secure user accounts.

## 🔒 Security Implementations
* **Bcrypt Password Salting:** Password strings are hashed using bcrypt with 12 validation rounds.
* **Stateless JWTs:** API routes use JWTs containing the `userId` and `email` parameters.
* **Storage strategy:** Tokens are stored in the client-side Redux store.
* **Replay Protection:** Unique request IDs are logged, and JWTs are tied to device sessions.

Related Pages:
* [JWT Specs](jwt.md)
* [Refresh Tokens](refresh-tokens.md)

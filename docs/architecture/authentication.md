# System Authentication Architecture

Nexus Smart Wallet implements a dual-layer authentication model: user authentication for platform access and cryptographic validation for blockchain transactions.

## 🔑 User Platform Authentication (JWT)
* Enforced via standard JWTs generated during login/registration.
* Signed on the server using `JWT_SECRET`.
* Enforces **Refresh Token Rotation (RTR)** to prevent token reuse hijacks.
* JWTs expire in 24 hours. Refresh tokens are tracked in the `UserSession` MongoDB collection.

## 🖋️ Transaction Cryptographic Signatures (Session Keys)
* To execute transactions without prompting the user for every relayer signature, the client registers a **Session Key**.
* **Owner Signature:** The client signs a session key policy payload using the wallet owner's EOA key.
* **Middleware Verification:** The server recovers the signer address using Viem and verifies it matches the smart account owner address.
* Session key policies are stored in MongoDB.

Related Pages:
* [Bcrypt & JWT Auth](file:///home/dev-var/Personal/Projects/nexus-smart-wallet/docs/security/jwt.md)
* [Session Key Flow](file:///home/dev-var/Personal/Projects/nexus-smart-wallet/docs/security/session-keys.md)

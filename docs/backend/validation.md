# Zod Validation Schemas

Input schemas used inside `validation.middleware.ts`.

## 📁 Schemas Map
* **registerSchema:**
  * `email:` Must be a valid email format.
  * `password:` Minimum 8 characters.
* **loginSchema:**
  * `email:` Valid email format.
  * `password:` Required string.
* **createAccountSchema:**
  * `chainId:` Positive integer.
  * `walletID:` Supported wallets.
  * `accountType:` Required string.
* **deployAccountSchema:**
  * `chainId:` Positive integer.
  * `walletID`, `paymasterID`, `bundlerID`: Supported values.
* **sendTransactionSchema:**
  * `to:` Valid Ethereum address.
  * `value:` Valid numeric string.
  * `data:` Optional hex data string (must start with 0x).
  * `idempotencyKey:` Optional unique string.
* **createSessionKeySchema:**
  * `ownerAddress`, `publicKey`: Ethereum address.
  * `expiresAt:` Optional ISO datetime string.
  * `permissions:` Array containing `target`, `allowedFunctions`, and `spendingLimit`.

Related Pages:
* [Express Middlewares](middleware.md)
* [API Specification Overview](file:///home/dev-var/Personal/Projects/nexus-smart-wallet/docs/api/overview.md)

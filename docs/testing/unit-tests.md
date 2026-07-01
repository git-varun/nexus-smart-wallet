# Unit Assertions Guide

Unit tests verify business rules in isolation.

## 🎯 Target Components
* **Signer Service (`signer.service.test.ts`):** Verifies custodial EOA keys sign UserOperation hashes correctly.
* **Middlewares:** Verifies payload validation rules and error response schemas.
* **Mocks Policy:** Unit tests mock external RPC bundlers and paymasters to run independently of testnet connections.

Related Pages:
* [Testing Strategy](strategy.md)
* [Local Verification Checks](verification.md)

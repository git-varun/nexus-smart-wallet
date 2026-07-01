# Cryptographic Session Key Verification

Session keys enable clients to interact with smart accounts within strict permission boundaries.

## 🔑 Registration Proof
1. The client generates a local key pair (session key).
2. The user signs a policy payload containing target contract whitelists, permitted function selectors, spending limits, and an expiration timestamp using their owner EOA.
3. The client registers the key via `/api/sessions/create`.
4. The server recovers the signer address using Viem and verifies it matches the smart account owner address.

## 🛡️ Constraint Verification
During transaction execution, the queue worker:
* Verifies the current timestamp is within the session's expiry limit.
* Verifies the target contract matches the whitelisted address.
* Verifies the function selector matches the permitted selector.
* Validates the transaction value does not exceed the remaining spending limit.

Related Pages:
* [Session Keys Control Endpoints](file:///home/dev-var/Personal/Projects/nexus-smart-wallet/docs/api/session-keys.md)
* [Threat Profiles](threat-model.md)

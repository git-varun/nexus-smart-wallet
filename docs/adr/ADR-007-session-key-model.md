# ADR-007: Cryptographic Session Key Security Model

## Status
Accepted

## Context
High-frequency interactions (such as blockchain gaming or automated trading) are severely hindered by standard web3 UX, which forces users to manually sign a popup notification for every transaction. However, storing the user's primary EOA private key in client-side memory or granting unrestricted access tokens to third-party applications compromises security.

## Decision
We implemented a **Cryptographic Session Key Security Model**:

1. **Ephemeral Keys**: Third-party applications generate an ephemeral local key pair in client memory.
2. **Signed Scope Policies**: The user signs a policy document specifying constraints:
   * Permitted target contract address.
   * Whitelisted function selectors (e.g. only `mint(uint256)`).
   * Limit on transaction value or spending amount.
   * Strict expiration date.
3. **Backend Cryptographic Check**: When a session key initiates an action, the backend transaction service verifies:
   * The policy exists and has not expired.
   * The signature was created by the active session key.
   * The request parameters fit the limits defined in the policy.
4. **Relayer Execution**: If verified, the EOA Relayer signs the UserOperation and sends it to the blockchain network.

## Alternatives Considered
* **Local Custodial Storage**: Encrypting the user's primary private key and storing it in browser local storage. Rejected because it exposes users to malicious scripts (XSS) that can drain the wallet.
* **Pure API Access Tokens**: standard bearer JWTs. Rejected because they are not cryptographically bound to specific transaction parameters, meaning a compromised token could be used to execute arbitrary calls.

## Consequences
* **Positives**:
  * Seamless user experience (one sign click sets up hours of zero-signature transactions).
  * Strong security containment: even if a session key is compromised, the hacker cannot transfer the wallet owner keys or spend beyond the limit.
* **Negatives**:
  * Requires managing and validating cryptographic signatures on the backend.

## Future Considerations
Migrate to **On-Chain Session Key Modules** (e.g., ERC-7715) so that the constraints are validated directly within the Smart Account contract bytecode rather than in the backend database.

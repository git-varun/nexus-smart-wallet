# ADR-006: Atomic Transaction Queue & Nonce Management

## Status
Accepted

## Context
The Nexus Smart Wallet utilizes a custodial EOA Relayer key to execute smart account transactions. Smart account systems require strictly sequential nonces. Under high concurrent user load, multiple requests attempting to submit transactions at the same time would retrieve the same nonce value. This resulted in "nonce too low" rejections from the RPC bundlers, causing transactions to get stuck or fail silently.

## Decision
We implemented a database-backed **Transaction Queue** paired with an **Atomic Nonce Verification Loop** using **Optimistic Concurrency Control (OCC)**:

1. **Queue Model**: All transactions are written to the database in a `'queued'` state.
2. **Atomic Increment (`getNextNonce`)**: Instead of relying on application memory, nonces are tracked via a dedicated atomic schema collection. The worker uses MongoDB atomic operations (`findOneAndUpdate` with `$inc`) to claim nonces.
3. **OCC Retry Loop**: If a version check or nonce conflict is encountered, the worker aborts, releases the nonce, and schedules a retry step with exponential backoff.
4. **Self-Healing Startup**: On backend boot, the startup sequence checks the actual on-chain transaction count and syncs the database counter to resolve any manual discrepancies.

## Alternatives Considered
* **In-Memory Mutex Lock**: Using a library like `async-mutex` on the server process. Rejected because it fails to protect against concurrency issues across multiple distributed instances.
* **Direct Chain Nonce Queries**: Fetching `getTransactionCount` from the RPC node before every submit. Rejected because JSON-RPC node responses are cached and not updated in real-time, leading to collisions when transactions are submitted in the same block.

## Consequences
* **Positives**:
  * Complete protection against transaction collisions, even under distributed loads.
  * Stickiness of nonce sequencing ensures transactions are mined in the exact order of submission.
  * Failed or dropped submissions are safely recycled and re-queued.
* **Negatives**:
  * Sequential queues mean a single blocked transaction (e.g. out of gas) can delay subsequent transactions for that account.

## Future Considerations
Implement a **Multi-Relayer Key Pool** where the backend holds a set of EOA keys, routing transactions to different signer addresses to execute operations concurrently.

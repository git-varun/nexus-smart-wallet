# Background Workers

Background loops managed by the queue worker service (`worker.service.ts`).

## 🔄 Worker Loops & Interval Checks
1. **Queue Processor Polling Loop (every 2 seconds):**
   * Sweeps MongoDB for jobs in `queued` or `retrying` status.
   * Processes ready transactions on idle smart accounts.
   * Updates state to `processing` and invokes blockchain clients.
2. **Heartbeat Loop (every 5 seconds):**
   * Updates `worker:heartbeat:<ID>` in Redis.
3. **Reconciliation Worker Loop (every 30 seconds):**
   * Sweeps undeployed accounts to check for on-chain bytecodes.
4. **Stale Recovery Worker Loop (every 60 seconds):**
   * Resets transactions stuck in `processing` (longer than 5m) back to `queued`.
   * Resolves stuck `submitted` transactions by checking bundler receipts.
5. **Portfolio Sync Worker Loop (every 15 minutes):**
   * Sweeps cached portfolio balances and syncs them with blockchain ledger.

Related Pages:
* [FIFO Transaction Queue](queues.md)
* [Stuck Nonce Audits](file:///home/dev-var/Personal/Projects/nexus-smart-wallet/docs/operations/troubleshooting.md)

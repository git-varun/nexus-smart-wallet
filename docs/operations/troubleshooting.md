# Troubleshooting Stuck Operations

Guides for resolving common runtime errors.

## Incident A: Stuck Nonces ("nonce too low")
* **Symptom:** Relayer logs output "nonce too low" errors.
* **Action:**
  1. Restart the backend container.
  2. The startup hook synchronizes the local database nonce record with the actual on-chain count.
  3. The worker resets stuck processing jobs to queued to retry execution.

## Incident B: Stuck Submitted Transactions
* **Symptom:** Transaction status remains in `submitted` for over 10 minutes.
* **Action:**
  1. Restart the backend container.
  2. The worker startup hook queries the bundler to verify the status of all submitted transaction hashes.
  3. If confirmed on-chain, the status is updated. If dropped by the bundler, the job is reset to `queued` to re-execute with a correct nonce.

Related Pages:
* [FIFO Nonce Queue](file:///home/dev-var/Personal/Projects/nexus-smart-wallet/docs/architecture/queue.md)
* [Background Workers](file:///home/dev-var/Personal/Projects/nexus-smart-wallet/docs/backend/workers.md)

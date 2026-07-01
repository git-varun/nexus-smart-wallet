# Transaction Queue Specifications

Details of the transaction queue system.

## 🛠️ Queue Schema & Fields
Transactions are queued as MongoDB documents:
* **status:** `pending`, `queued`, `processing`, `submitted`, `confirmed`, `failed`, `retrying`, `cancelled`.
* **retryCount:** Counts execution retries (maximum of 5).
* **failureReason:** Stores execution error stack details.
* **idempotencyKey:** Enforces unique transaction submissions.

## 🔄 Retry Policy & Backoff
If a transient execution error occurs (e.g. network timeout, low gas pricing, node rate limits), the queue worker:
1. Increments `retryCount`.
2. Marks status as `retrying`.
3. Applies exponential backoff before retrying (capped at 5 minutes).

Related Pages:
* [Background Workers](workers.md)
* [Mongoose Models](models.md)

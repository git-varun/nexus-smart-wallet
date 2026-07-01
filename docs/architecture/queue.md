# FIFO Transaction Queue & Nonce Manager

To prevent transaction failures due to out-of-order execution or EOA nonce collisions under high load, the backend processes transactions via a FIFO database queue.

## 🔒 Concurrency Locking
1. **Queued Status:** Every transaction request is saved to MongoDB in the `queued` status.
2. **Serial Lock:** The background worker polls the database for queued transactions. To maintain correct sequence order, the worker checks if there is any active job in `processing` or `submitted` status for the target smart account. If so, it skips execution for that account.
3. **Atomic Nonce Generation:** If the account is idle, the worker claims the transaction, updates its status to `processing`, and increments the EOA nonce atomically using the Mongoose optimistic concurrency retry loop.

## 🛠️ Nonce Lock Code Concept
```typescript
export async function getNextNonce(smartAccountAddress, chainId, getOnChainNonce) {
    const onChainCount = await getOnChainNonce();
    while (true) {
        const record = await NonceModel.findOneAndUpdate(
            { signerAddress: smartAccountAddress, chainId },
            { $setOnInsert: { nonce: Number(onChainCount) } },
            { upsert: true, new: true }
        );
        const currentVal = Math.max(record.nonce, Number(onChainCount));
        const res = await NonceModel.updateOne(
            { signerAddress: smartAccountAddress, chainId, nonce: record.nonce },
            { $set: { nonce: currentVal + 1 } }
        );
        if (res.modifiedCount > 0) return BigInt(currentVal);
        await new Promise(resolve => setTimeout(resolve, Math.random() * 15 + 5));
    }
}
```

Related Pages:
* [Background Workers](file:///home/dev-var/Personal/Projects/nexus-smart-wallet/docs/backend/workers.md)
* [Stuck Nonce Audits](file:///home/dev-var/Personal/Projects/nexus-smart-wallet/docs/operations/troubleshooting.md)

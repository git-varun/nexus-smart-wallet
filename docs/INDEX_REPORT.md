# MongoDB Index Audit & Verification Report

Generated at: 2026-06-28T10:18:52.396Z

This report contains an audit of all active collections and their configured indexes to verify correct query planning, compound index utilization, and elimination of collection scans.

## Collection: `users`

| Index Name | Keys | Unique | Sparse | Background |
|---|---|---|---|---|
| _id_ | `_id: 1` | ❌ False | ❌ False | ❌ False |
| email_1 | `email: 1` | ✅ True | ✅ True | ✅ True |
| username_1 | `username: 1` | ✅ True | ✅ True | ✅ True |

### Query Plan Explanation

- **Winning Plan Stage:** `FETCH` -> `IXSCAN`
- **Index Usage:** ✅ Index scan utilized successfully.

---

## Collection: `transactions`

| Index Name | Keys | Unique | Sparse | Background |
|---|---|---|---|---|
| _id_ | `_id: 1` | ❌ False | ❌ False | ❌ False |
| idempotencyKey_1 | `idempotencyKey: 1` | ✅ True | ✅ True | ✅ True |
| userId_1_chainId_1_createdAt_-1 | `userId: 1`, `chainId: 1`, `createdAt: -1` | ❌ False | ❌ False | ✅ True |
| status_1_createdAt_1 | `status: 1`, `createdAt: 1` | ❌ False | ❌ False | ✅ True |
| hash_1 | `hash: 1` | ✅ True | ✅ True | ✅ True |
| userOpHash_1 | `userOpHash: 1` | ✅ True | ✅ True | ✅ True |
| status_1_chainId_1_accountId_1 | `status: 1`, `chainId: 1`, `accountId: 1` | ❌ False | ❌ False | ✅ True |

### Query Plan Explanation

- **Winning Plan Stage:** `FETCH` -> `IXSCAN`
- **Index Usage:** ✅ Index scan utilized successfully.

---

## Collection: `portfolios`

| Index Name | Keys | Unique | Sparse | Background |
|---|---|---|---|---|
| _id_ | `_id: 1` | ❌ False | ❌ False | ❌ False |
| address_1_chainId_1 | `address: 1`, `chainId: 1` | ✅ True | ❌ False | ✅ True |
| userId_1 | `userId: 1` | ❌ False | ❌ False | ✅ True |

### Query Plan Explanation

- **Winning Plan Stage:** `FETCH` -> `IXSCAN`
- **Index Usage:** ✅ Index scan utilized successfully.

---

## Collection: `sessionkeys`

| Index Name | Keys | Unique | Sparse | Background |
|---|---|---|---|---|
| _id_ | `_id: 1` | ❌ False | ❌ False | ❌ False |
| ownerAddress_1_chainId_1 | `ownerAddress: 1`, `chainId: 1` | ❌ False | ❌ False | ✅ True |
| publicKey_1 | `publicKey: 1` | ✅ True | ❌ False | ✅ True |

### Query Plan Explanation

- **Winning Plan Stage:** `FETCH` -> `IXSCAN`
- **Index Usage:** ✅ Index scan utilized successfully.

---

## Collection: `nonces`

| Index Name | Keys | Unique | Sparse | Background |
|---|---|---|---|---|
| _id_ | `_id: 1` | ❌ False | ❌ False | ❌ False |
| signerAddress_1_chainId_1 | `signerAddress: 1`, `chainId: 1` | ✅ True | ❌ False | ✅ True |

### Query Plan Explanation

- **Winning Plan Stage:** `FETCH` -> `IXSCAN`
- **Index Usage:** ✅ Index scan utilized successfully.

---

## Collection: `accounts`

| Index Name | Keys | Unique | Sparse | Background |
|---|---|---|---|---|
| _id_ | `_id: 1` | ❌ False | ❌ False | ❌ False |
| address_1 | `address: 1` | ❌ False | ❌ False | ✅ True |
| userId_1_chainId_1 | `userId: 1`, `chainId: 1` | ❌ False | ❌ False | ✅ True |
| address_1_chainId_1 | `address: 1`, `chainId: 1` | ✅ True | ❌ False | ✅ True |

### Query Plan Explanation

- **Winning Plan Stage:** `FETCH` -> `IXSCAN`
- **Index Usage:** ✅ Index scan utilized successfully.

---


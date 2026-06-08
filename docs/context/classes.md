# Classes, Services, Hooks & Slices

## Backend services

### `auth.service` — `backend/src/services/auth.service.ts`

| Function | Signature | Notes |
|----------|-----------|-------|
| `generateToken` | `(userId, email?) → string` | JWT, expires in `config.security.tokenExpiryHours` (24h) |
| `verifyToken` | `(token) → {userId, email?} | null` | |
| `hashPassword` | `(plain) → Promise<string>` | bcrypt 12 rounds |
| `comparePassword` | `(plain, hashed) → Promise<bool>` | |
| `validatePasswordStrength` | `(pwd) → {isValid, message?}` | min 8, upper+lower+digit+special |
| `validateToken` | `(token) → Promise<SessionValidationResult>` | checks DB for user |
| `getAuthStatus` | `(token?) → Promise<AuthStatusResult>` | |
| `logoutUser` | `() → {success}` | stateless, no-op |

### `account.service` — `backend/src/services/account.service.ts`

| Function | Signature | Notes |
|----------|-----------|-------|
| `createUserAccount` | `(userId, chainId, walletID, accountType)` | calls `getAccount` from permissionless, stores in DB |
| `getUserAccount` | `(userId, chainId, walletID)` | returns first match |
| `getUserAccounts` | `(userId, chainId)` | all accounts for user+chain |
| `getAccountDetails` | `(address, chainId)` | by address, validates chainId match |

### `transaction.service` — `backend/src/services/transaction.service.ts`

| Function | Signature | Notes |
|----------|-----------|-------|
| `deploySmartAccountService` | `(userId, chainId, walletID, paymasterID, bundlerId)` | sends zero-value UserOp to deploy; updates `isDeployed=true` |
| `sendTransaction` | `(userId, chainId, walletID, paymasterID, bundlerId, request)` | builds + submits UserOp |
| `estimateGas` | `(userId, chainId, walletID, paymasterID, bundlerId, request)` | `client.estimateUserOperationGas` |
| `getUserOperationStatus` | `(chainId, userOpHash, bundlerId)` | Alchemy or Pimlico lookup |
| `getUserTransactionHistory` | `(userId, chainId?)` | from MongoDB |
| `getGasPriceObject` | `(chainId, bundlerId)` | Pimlico only currently |

## Backend repositories

All in `backend/src/repositories/`. Pattern: thin Mongoose wrappers.

- **userRepository:** `findById`, `findByEmail`, `createUser`, `updateUser`
- **accountRepository:** `findBy(query)`, `findAccountByAddress`, `createAccount`, `updateAccount`
- **transactionRepository:** `createTransaction`, `findTransactionsByUserId`, `findTransactionByHash`

## Frontend hooks

### `useBackendSmartAccount` — PRIMARY

File: `frontend/src/hooks/useBackendSmartAccount.ts`

Wraps `apiClient` + Redux dispatch. The main hook used by all current components.

| Returned | Type | Description |
|----------|------|-------------|
| `isAuthenticated` | bool | From Redux |
| `user` | User\|null | |
| `accountInfo` | SmartAccountInfo\|null | First account for current chain |
| `userAccounts` | SmartAccountInfo[] | All accounts |
| `currentChainId` | number | default 84532 |
| `token` | string\|null | JWT |
| `connect(email)` | async fn | Auth via backend |
| `loginWithCredentials({user, token})` | async fn | Set auth state after login form |
| `disconnect()` | async fn | Logout + clear Redux |
| `createSmartAccount(chainId?, walletID?, accountType?)` | async fn | POST /api/accounts/create |
| `deploySmartAccount(paymasterID?, bundlerID?)` | async fn | POST /api/transactions/deploy, then reloads account data |
| `sendTransaction(to, data?, value?)` | async fn | POST /api/transactions/send |
| `executeTransaction({target, value?, data?})` | async fn | |
| `switchChain(chainId)` | async fn | updates Redux + reloads accounts |
| `checkAuthStatus()` | async fn | verifies stored JWT |
| `refreshData` | alias for `checkAuthStatus` | |

### `useSmartAccount` — DEPRECATED

File: `frontend/src/hooks/useSmartAccount.ts`  
Direct Alchemy AA via `@account-kit`. Maintained for legacy. **Do not use for new features.**

### `useTransactionHistoryBackend`

File: `frontend/src/hooks/useTransactionHistoryBackend.ts`  
Fetches `/api/transactions/history` and populates state.

### `useSessionKeys`

File: `frontend/src/hooks/useSessionKeys.ts`  
Session key creation/listing (UI layer, backend support partial).

## Redux slices

### `smartAccountSlice` — `frontend/src/store/smartAccountSlice.ts`

State: `isAuthenticated`, `user`, `token`, `smartAccountAddress`, `smartAccountInfo`, `userAccounts`, `currentChainId`, `isCreatingAccount`, `creationError`, `isExecuting`, `isLoading`, `newGuardian`, `guardianError`

Key actions: `setAuthData`, `clearAuthData`, `setSmartAccountInfo`, `setUserAccounts`, `setCurrentChainId`, `completeAccountCreation`, `resetSmartAccountState`

### `smartAccountObjectsSlice` — `frontend/src/store/smartAccountObjectsSlice.ts`

Holds non-serializable objects (`account`, `client`) — not persisted.

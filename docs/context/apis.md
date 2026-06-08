# APIs

Base path: `POST|GET /api/...`  
Auth header: `Authorization: Bearer <jwt>`  
All responses: `{ success: boolean, data?: T, error?: { code, message } }`

## Public routes

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Server liveness check |
| GET | `/api/health` | Service health |
| POST | `/api/auth/register` | `{ email, password }` → `{ user, token }` |
| POST | `/api/auth/login` | `{ email, password }` → `{ user, token }` |
| POST | `/api/auth/logout` | Stateless — client deletes token |
| GET | `/api/auth/status` | `?token=...` or Bearer → `{ authenticated, user }` |
| GET | `/api/transactions/gas_price` | `?chainId&bundlerId` → gas price object |

## Protected routes (require JWT)

### Smart Accounts

| Method | Path | Body / Query | Description |
|--------|------|-------------|-------------|
| POST | `/api/accounts/create` | `{ chainId, walletID, accountType }` | Create counterfactual smart account |
| GET | `/api/accounts/me` | `?chainId` | List user's accounts for chain |
| GET | `/api/accounts/:address` | `?chainId` | Get account details by address |

### Transactions

| Method | Path | Body | Description |
|--------|------|------|-------------|
| POST | `/api/transactions/deploy` | `{ chainId, walletID, paymasterID, bundlerId }` | Deploy (activate) smart account on-chain |
| POST | `/api/transactions/send` | `{ chainId, walletID, paymasterID, bundlerId, to, data?, value? }` | Send ERC-4337 UserOperation |
| GET | `/api/transactions/history` | `?chainId?` | Get user's transaction list |
| POST | `/api/transactions/estimate_gas` | same as send | Estimate gas for UserOperation |
| PUT | `/api/transactions/user_op` | `{ chainId, userOpHash, bundlerId }` | Poll UserOperation status |

### Profile

| Method | Path | Body | Description |
|--------|------|------|-------------|
| GET | `/api/profile` | — | Get user profile |
| PUT | `/api/profile` | `{ username?, displayName?, preferences? }` | Update profile |
| GET | `/api/username/check` | `?username=` | Check availability |
| POST | `/api/avatar/upload` | multipart `profileImage` | Upload profile image |
| PUT | `/api/avatar/config` | `{ seed, style, backgroundColor, textColor, pattern }` | Set generated avatar |
| DELETE | `/api/avatar` | — | Remove profile image |

## Key request shapes

```ts
// POST /api/accounts/create
{ chainId: number, walletID: "ALCHEMY"|"SAFE"|..., accountType: string }

// POST /api/transactions/send
{
  chainId: number,
  walletID: string,
  paymasterID: "ALCHEMY"|"PIMLICO",
  bundlerId: "ALCHEMY"|"PIMLICO",
  to: `0x${string}`,
  data?: `0x${string}`,
  value?: string  // ETH as decimal string, e.g. "0.01"
}
```

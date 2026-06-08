# Models

MongoDB via Mongoose. All models strip `_id`/`__v` in `toJSON`, expose `id` string.

## User — `backend/src/models/User.schema.ts`

```ts
{
  email?:          string (unique, sparse)
  username?:       string (unique, sparse, 3–20 chars, /^[a-zA-Z0-9_-]+$/)
  displayName?:    string (max 50)
  profileImageUrl?: string
  avatarConfig?:   { seed, style, backgroundColor, textColor, pattern }
  preferences?:    {
    theme: 'light'|'dark'|'auto'   // default 'auto'
    language: string               // default 'en'
    notifications: boolean         // default true
    privacy: { showEmail, showOnlineStatus }
  }
  password:        string (bcrypt hashed, required)
  createdAt:       Date
  lastLogin?:      Date
}
```

## Account — `backend/src/models/Account.schema.ts`

```ts
{
  userId:        string (required)
  address:       string (lowercase, required)
  chainId:       number (required, default 84532)
  isDeployed:    boolean (default false)
  signerAddress: string (set to "CENTRAL_WALLET" for server-side accounts)
  accountType:   string
  walletID:      string  // "ALCHEMY"|"SAFE"|"KERNEL"|"BICONOMY"|"TRUST"|"SIMPLE"
  providerInfo:  Map<string, any>  // stores factory + factoryData for deployment
  isActive:      boolean (default true)
  createdAt:     Date
  updatedAt:     Date
}
```

## Transaction — `backend/src/models/Transaction.schema.ts`

```ts
{
  userId:      string (required)
  accountId:   string (the smart account address, required)
  hash:        string (on-chain tx hash, required)
  userOpHash:  string (ERC-4337 userOp hash, required)
  to?:         string
  value?:      string (ETH decimal string, default "0")
  data?:       string
  bundlerID?:  string
  paymasterID?: string
  walletID?:   string
  gasUsed?:    string
  status:      'pending'|'confirmed'|'failed' (default 'pending')
  chainId:     number (required)
  createdAt:   Date
  updatedAt:   Date
}
```

## Frontend types — `frontend/src/types/account.ts`

```ts
interface SmartAccountInfo {
  id: string; address: Address; chainId: number;
  isDeployed: boolean; balance?: string; nonce?: number;
  createdAt: string; updatedAt: string;
  walletID?: string; accountType?: string;
}
interface User { id: string; email: string; createdAt: string; lastLogin?: string }
```

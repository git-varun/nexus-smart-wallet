# Constraints

## Environment variables

### Backend (`.env`)

| Key | Required | Notes |
|-----|----------|-------|
| `MONGODB_URI` | Yes | MongoDB connection string |
| `JWT_SECRET` | Yes | Sign/verify JWTs |
| `ALCHEMY_API_KEY` | Yes (prod) | Alchemy RPC + paymaster |
| `ALCHEMY_POLICY_ID` | No | Gas sponsorship policy |
| `PIMLICO_API_KEY` | No | Pimlico bundler/paymaster |
| `PIMLICO_POLICY_ID` | No | |
| `MASTER_WALLET_PRIVATE_KEY` | No | Central signer; must be `0x` + 64 hex chars |
| `MASTER_WALLET_ENABLED` | No | `"true"` to activate |
| `PORT` | No | Default `3000` |
| `NODE_ENV` | No | `development`\|`production` |
| `CORS_ORIGINS` | No | Comma-separated; default `http://localhost:5173` |

### Frontend (`.env`)

| Key | Notes |
|-----|-------|
| `VITE_ALCHEMY_API_KEY` | Used by legacy `useSmartAccount` hook only |
| `VITE_API_BASE_URL` | Backend URL; default `http://localhost:3000` |

### Docker

- Backend container exposes `3000`; pass runtime env vars (`MONGODB_URI`, `JWT_SECRET`, provider keys, central wallet vars) at `docker run`/orchestrator time
- Frontend dev container exposes Vite on `3001`; set backend URL at runtime with `VITE_API_BASE_URL`
- Compose loads `backend/.env`, overrides `MONGODB_URI` with local Mongo, maps frontend to host `8080`, and maps logs to `docker-logs/backend/` and `docker-logs/frontend/`
- Backend runtime creates writable `uploads/profile-images/` and `logs/` directories inside the container

## Supported values (backend)

```ts
SUPPORTED_WALLETS  = ["ALCHEMY", "SIMPLE", "SAFE", "KERNEL", "BICONOMY", "TRUST"]
SUPPORTED_PAYMASTER = ["ALCHEMY", "PIMLICO"]
SUPPORTED_BUNDLER   = ["ALCHEMY", "PIMLICO"]
```

## Account creation rules

- One account per `(userId, chainId, walletID, accountType)` tuple — duplicate check enforced in `account.service`
- Counterfactual address is deterministic via salt `generateSalt(userId, chainId)` — same user always gets same address per chain per wallet type
- `signerAddress` is always `"CENTRAL_WALLET"` (custodial); no per-user EOA signing

## Transaction rules

- `TRUST` wallet uses EntryPoint **0.6**; all others use EntryPoint **0.7**
- `KERNEL` wallet skips factory args in UserOp (handled internally by permissionless)
- Gas price fetched from Pimlico `fast` tier when `bundlerId === "PIMLICO"`; no gas price injection for Alchemy bundler path
- Alchemy paymaster requires `prepareUserOperation` first to get stub data before `sendUserOperation`

## Password policy

- Min 8 chars, must contain: lowercase, uppercase, digit, special (`!@#$%^&*`)

## File uploads

- Profile images stored at `backend/uploads/profile-images/`
- Multer processes `multipart/form-data` field name `profileImage`

## Known limitations / POC caveats

- CORS set to `origin: true` (all origins) — not for production
- `contentSecurityPolicy` disabled via helmet
- `BigInt.prototype.toJSON` patched globally on backend for JSON serialization
- Session keys (frontend) are UI-only — no full backend session key management yet
- Batch transactions via `useBackendSmartAccount` throw "not yet supported"
- `useSmartAccount` hook is deprecated; avoid extending it

# Integrations

## Alchemy (backend)

- **Config:** `ALCHEMY_API_KEY`, `ALCHEMY_POLICY_ID`
- **Used for:** Light Account creation (`@account-kit/smart-contracts`), paymaster stub data, UserOp lookup by hash
- **File:** `backend/src/scripts/alchemyApi.ts`, `backend/src/config/chain.ts` (chainId → slug map)
- **Wallet IDs using Alchemy infra:** `"ALCHEMY"` → `toLightSmartAccount` (permissionless), version 2.0.0 for EP0.7

## Pimlico (backend)

- **Config:** `PIMLICO_API_KEY`, `PIMLICO_POLICY_ID`
- **Used for:** Gas price oracle (`fast.maxFeePerGas/maxPriorityFeePerGas`), UserOp status polling
- **File:** `backend/src/scripts/pimlicoApi.ts`
- **RPC pattern:** `https://api.pimlico.io/v2/{chainId}/rpc?apikey={key}`

## permissionless (backend)

- **Pkg:** `permissionless` 0.2 + `viem/account-abstraction`
- **File:** `backend/src/scripts/permissionless.ts`
- **Exports:** `getAccount(walletID, accountDetails)`, `bundlerClient(...)`, `paymasterClient(...)`
- **Wallet adapters:**

| walletID | permissionless function | EntryPoint |
|----------|------------------------|-----------|
| ALCHEMY / LIGHT | `toLightSmartAccount` | 0.7 |
| SIMPLE | `toSimpleSmartAccount` | 0.7 |
| KERNEL | `toKernelSmartAccount` v0.3.1 | 0.7 |
| TRUST | `toTrustSmartAccount` | **0.6** |
| BICONOMY / NEXUS | `toNexusSmartAccount` v1.0.0 | 0.7 |
| SAFE | `toSafeSmartAccount` v1.4.1 | 0.7 |

- **Salt:** `generateSalt(userId, chainId)` → deterministic BigInt nonce so same user always gets same address per chain
- **Signer:** Central wallet from `MASTER_WALLET_PRIVATE_KEY` env — all accounts are custodial server-side

## Safe SDK (backend)

- **Pkgs:** `@safe-global/protocol-kit`, `@safe-global/relay-kit`
- `toSafeSmartAccount` is used via permissionless, not the protocol-kit directly in the main service path

## wagmi + RainbowKit (frontend)

- **Config:** `frontend/src/config/wagmi.ts`
- **Purpose:** Connect external wallets (MetaMask, etc.) for the legacy `useSmartAccount` hook
- **Note:** The primary `useBackendSmartAccount` hook does **not** use wagmi — it's purely API-driven

## apiClient (frontend)

- **File:** `frontend/src/services/apiClient.ts`
- **Pattern:** All methods return `ApiResponse<T>`. Token passed as argument (not global).
- **Base URL:** `VITE_API_BASE_URL` env or defaults to `http://localhost:3000`

## Redux Persist (frontend)

- **Store:** `frontend/src/store/store.ts`
- **Persisted slice:** `smartAccount` (auth token, user info, chainId)
- **NOT persisted:** `smartAccountObjects` (contains non-serializable AA account/client objects)

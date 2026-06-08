# Tech Stack

## Backend

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js ≥18, TypeScript 5.3 |
| Framework | Express 4 |
| Database | MongoDB via Mongoose 8 |
| Auth | JWT (jsonwebtoken) + bcrypt (12 rounds) |
| AA SDK | permissionless 0.2, viem 2.34 |
| Alchemy SDK | @account-kit/infra, @account-kit/smart-contracts, @account-kit/signer |
| Safe SDK | @safe-global/protocol-kit, @safe-global/relay-kit |
| File upload | multer (profile images → `backend/uploads/`) |
| Validation | zod 4 |
| Logging | Custom `createServiceLogger` (winston-style) |
| Dev server | tsx watch |

## Frontend

| Layer | Technology |
|-------|-----------|
| Framework | React 18, TypeScript 5.3 |
| Build | Vite 5 |
| State | Redux Toolkit 2 + redux-persist |
| Wallet | wagmi 2, RainbowKit 2, viem 2.21 |
| AA (legacy) | @aa-sdk/core, @account-kit/smart-contracts |
| UI primitives | Radix UI (dialog, tooltip, tabs, toast, etc.) |
| Styling | Tailwind CSS 3, tailwind-merge, clsx |
| Charts | Recharts 3 |
| Animations | Framer Motion 10 |
| HTTP | Fetch-based `apiClient.ts` |
| Icons | lucide-react |

## Docker

- Backend image: simple dev-mode Node 20 image, runs `pnpm dev` on port **3000**
- Frontend image: simple dev-mode Node 20 image, runs `pnpm dev` on port **3001**
- Frontend API URL is passed as runtime env `VITE_API_BASE_URL`
- Dev orchestration uses root `docker-compose.yml`

## Dev conventions

- `pnpm` (migrated from yarn — lock files present for both)
- Backend default port: **3000**; Frontend dev: **5173**
- All AA logic runs server-side; frontend uses `apiClient` to call backend

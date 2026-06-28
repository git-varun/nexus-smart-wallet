# Software Bill of Materials (SBOM)

Generated at: 2026-06-28T11:58:12.128Z

This document lists all direct runtime and developer dependencies for the Nexus Smart Wallet application to support CVE tracking, licensing audits, and supply chain security.

## 1. Backend Service Dependencies

| Package | Version | Type | License | Usage / Purpose |
|---|---|---|---|---|
| `bcrypt` | `^6.0.0` | Runtime | MIT / Apache-2.0 | API Service & Database Router |
| `cors` | `^2.8.5` | Runtime | MIT / Apache-2.0 | API Service & Database Router |
| `dotenv` | `^16.6.1` | Runtime | MIT / Apache-2.0 | API Service & Database Router |
| `express` | `^4.21.2` | Runtime | MIT / Apache-2.0 | API Service & Database Router |
| `helmet` | `^7.2.0` | Runtime | MIT / Apache-2.0 | API Service & Database Router |
| `ioredis` | `^5.11.1` | Runtime | MIT / Apache-2.0 | API Service & Database Router |
| `jsonwebtoken` | `^9.0.2` | Runtime | MIT / Apache-2.0 | API Service & Database Router |
| `mongoose` | `^8.17.2` | Runtime | MIT / Apache-2.0 | API Service & Database Router |
| `multer` | `^2.0.2` | Runtime | MIT / Apache-2.0 | API Service & Database Router |
| `nanoid` | `^5.1.5` | Runtime | MIT / Apache-2.0 | API Service & Database Router |
| `permissionless` | `^0.3.0` | Runtime | MIT / Apache-2.0 | API Service & Database Router |
| `tslib` | `^2.8.0` | Runtime | MIT / Apache-2.0 | API Service & Database Router |
| `viem` | `^2.34.0` | Runtime | MIT / Apache-2.0 | API Service & Database Router |
| `zod` | `^4.1.12` | Runtime | MIT / Apache-2.0 | API Service & Database Router |
| `@types/bcrypt` | `^6.0.0` | Development | MIT / Apache-2.0 | Testing & Type Checking |
| `@types/cors` | `^2.8.19` | Development | MIT / Apache-2.0 | Testing & Type Checking |
| `@types/express` | `^4.17.19` | Development | MIT / Apache-2.0 | Testing & Type Checking |
| `@types/helmet` | `^0.0.48` | Development | MIT / Apache-2.0 | Testing & Type Checking |
| `@types/ioredis` | `^4.28.10` | Development | MIT / Apache-2.0 | Testing & Type Checking |
| `@types/jest` | `^30.0.0` | Development | MIT / Apache-2.0 | Testing & Type Checking |
| `@types/jsonwebtoken` | `^9.0.10` | Development | MIT / Apache-2.0 | Testing & Type Checking |
| `@types/mongoose` | `^5.11.96` | Development | MIT / Apache-2.0 | Testing & Type Checking |
| `@types/multer` | `^2.0.0` | Development | MIT / Apache-2.0 | Testing & Type Checking |
| `@types/node` | `^20.19.11` | Development | MIT / Apache-2.0 | Testing & Type Checking |
| `@types/supertest` | `^6.0.3` | Development | MIT / Apache-2.0 | Testing & Type Checking |
| `@typescript-eslint/eslint-plugin` | `^8.41.0` | Development | MIT / Apache-2.0 | Testing & Type Checking |
| `@typescript-eslint/parser` | `^8.41.0` | Development | MIT / Apache-2.0 | Testing & Type Checking |
| `eslint` | `^8.56.0` | Development | MIT / Apache-2.0 | Testing & Type Checking |
| `jest` | `^29.7.0` | Development | MIT / Apache-2.0 | Testing & Type Checking |
| `mongodb-memory-server` | `^11.2.0` | Development | MIT / Apache-2.0 | Testing & Type Checking |
| `supertest` | `^7.1.4` | Development | MIT / Apache-2.0 | Testing & Type Checking |
| `ts-jest` | `^29.2.0` | Development | MIT / Apache-2.0 | Testing & Type Checking |
| `tsx` | `^4.7.0` | Development | MIT / Apache-2.0 | Testing & Type Checking |
| `typescript` | `^5.3.3` | Development | MIT / Apache-2.0 | Testing & Type Checking |

## 2. Frontend Client Dependencies

| Package | Version | Type | License | Usage / Purpose |
|---|---|---|---|---|
| `@aa-sdk/core` | `^4.52.0` | Runtime | MIT / Apache-2.0 | Web Wallet UI & RPC Connectivity |
| `@account-kit/infra` | `^4.52.0` | Runtime | MIT / Apache-2.0 | Web Wallet UI & RPC Connectivity |
| `@account-kit/smart-contracts` | `^4.52.0` | Runtime | MIT / Apache-2.0 | Web Wallet UI & RPC Connectivity |
| `@radix-ui/react-dialog` | `^1.0.5` | Runtime | MIT / Apache-2.0 | Web Wallet UI & RPC Connectivity |
| `@radix-ui/react-dropdown-menu` | `^2.0.6` | Runtime | MIT / Apache-2.0 | Web Wallet UI & RPC Connectivity |
| `@radix-ui/react-progress` | `^1.0.3` | Runtime | MIT / Apache-2.0 | Web Wallet UI & RPC Connectivity |
| `@radix-ui/react-slider` | `^1.1.2` | Runtime | MIT / Apache-2.0 | Web Wallet UI & RPC Connectivity |
| `@radix-ui/react-switch` | `^1.0.3` | Runtime | MIT / Apache-2.0 | Web Wallet UI & RPC Connectivity |
| `@radix-ui/react-tabs` | `^1.0.4` | Runtime | MIT / Apache-2.0 | Web Wallet UI & RPC Connectivity |
| `@radix-ui/react-toast` | `^1.1.5` | Runtime | MIT / Apache-2.0 | Web Wallet UI & RPC Connectivity |
| `@radix-ui/react-tooltip` | `^1.0.7` | Runtime | MIT / Apache-2.0 | Web Wallet UI & RPC Connectivity |
| `@rainbow-me/rainbowkit` | `^2.0.0` | Runtime | MIT / Apache-2.0 | Web Wallet UI & RPC Connectivity |
| `@reduxjs/toolkit` | `^2.8.2` | Runtime | MIT / Apache-2.0 | Web Wallet UI & RPC Connectivity |
| `@stablelib/ed25519` | `^2.0.2` | Runtime | MIT / Apache-2.0 | Web Wallet UI & RPC Connectivity |
| `@stablelib/random` | `^2.0.1` | Runtime | MIT / Apache-2.0 | Web Wallet UI & RPC Connectivity |
| `@tailwindcss/forms` | `^0.5.7` | Runtime | MIT / Apache-2.0 | Web Wallet UI & RPC Connectivity |
| `@tailwindcss/typography` | `^0.5.10` | Runtime | MIT / Apache-2.0 | Web Wallet UI & RPC Connectivity |
| `@tanstack/react-query` | `^5.0.0` | Runtime | MIT / Apache-2.0 | Web Wallet UI & RPC Connectivity |
| `class-variance-authority` | `^0.7.0` | Runtime | MIT / Apache-2.0 | Web Wallet UI & RPC Connectivity |
| `clsx` | `^2.1.0` | Runtime | MIT / Apache-2.0 | Web Wallet UI & RPC Connectivity |
| `framer-motion` | `^10.16.16` | Runtime | MIT / Apache-2.0 | Web Wallet UI & RPC Connectivity |
| `lucide-react` | `^0.320.0` | Runtime | MIT / Apache-2.0 | Web Wallet UI & RPC Connectivity |
| `react` | `^18.2.0` | Runtime | MIT / Apache-2.0 | Web Wallet UI & RPC Connectivity |
| `react-dom` | `^18.2.0` | Runtime | MIT / Apache-2.0 | Web Wallet UI & RPC Connectivity |
| `react-is` | `^19.1.0` | Runtime | MIT / Apache-2.0 | Web Wallet UI & RPC Connectivity |
| `react-redux` | `^9.2.0` | Runtime | MIT / Apache-2.0 | Web Wallet UI & RPC Connectivity |
| `react-router-dom` | `^7.18.0` | Runtime | MIT / Apache-2.0 | Web Wallet UI & RPC Connectivity |
| `recharts` | `^3.1.0` | Runtime | MIT / Apache-2.0 | Web Wallet UI & RPC Connectivity |
| `redux-persist` | `^6.0.0` | Runtime | MIT / Apache-2.0 | Web Wallet UI & RPC Connectivity |
| `tailwind-merge` | `^2.2.0` | Runtime | MIT / Apache-2.0 | Web Wallet UI & RPC Connectivity |
| `viem` | `^2.21.0` | Runtime | MIT / Apache-2.0 | Web Wallet UI & RPC Connectivity |
| `wagmi` | `^2.12.0` | Runtime | MIT / Apache-2.0 | Web Wallet UI & RPC Connectivity |
| `@axe-core/playwright` | `^4.12.1` | Development | MIT / Apache-2.0 | Build system & compilation |
| `@playwright/test` | `^1.61.1` | Development | MIT / Apache-2.0 | Build system & compilation |
| `@types/node` | `^20.10.6` | Development | MIT / Apache-2.0 | Build system & compilation |
| `@types/react` | `^18.2.45` | Development | MIT / Apache-2.0 | Build system & compilation |
| `@types/react-dom` | `^18.2.18` | Development | MIT / Apache-2.0 | Build system & compilation |
| `@typescript-eslint/eslint-plugin` | `^6.21.0` | Development | MIT / Apache-2.0 | Build system & compilation |
| `@typescript-eslint/parser` | `^6.21.0` | Development | MIT / Apache-2.0 | Build system & compilation |
| `@vitejs/plugin-react` | `^4.2.1` | Development | MIT / Apache-2.0 | Build system & compilation |
| `autoprefixer` | `^10.4.16` | Development | MIT / Apache-2.0 | Build system & compilation |
| `eslint` | `^8.55.0` | Development | MIT / Apache-2.0 | Build system & compilation |
| `eslint-plugin-react` | `^7.37.5` | Development | MIT / Apache-2.0 | Build system & compilation |
| `eslint-plugin-react-hooks` | `^4.6.0` | Development | MIT / Apache-2.0 | Build system & compilation |
| `eslint-plugin-react-refresh` | `^0.4.5` | Development | MIT / Apache-2.0 | Build system & compilation |
| `playwright` | `^1.61.1` | Development | MIT / Apache-2.0 | Build system & compilation |
| `postcss` | `^8.4.32` | Development | MIT / Apache-2.0 | Build system & compilation |
| `tailwindcss` | `^3.4.0` | Development | MIT / Apache-2.0 | Build system & compilation |
| `typescript` | `^5.3.3` | Development | MIT / Apache-2.0 | Build system & compilation |
| `vite` | `^5.0.8` | Development | MIT / Apache-2.0 | Build system & compilation |


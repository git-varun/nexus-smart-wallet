# Nexus Smart Wallet — Dependency Inventory

This document tracks the core library dependencies, their purposes, owners, and lifecycle upgrade strategies.

---

## 1. Core Dependency Matrix

| Package | Category | Purpose | Owner | Upgrade Strategy |
| :--- | :--- | :--- | :--- | :--- |
| **React** | Core UI | Frontend component rendering engine. | Frontend | Major releases reviewed yearly. |
| **Vite** | Build Tool | Frontend bundling and hot module reloading. | Frontend | Upgrade minor versions monthly. |
| **TailwindCSS**| Styling | Utility classes for UI component layout. | Frontend | Upgrade minor versions monthly. |
| **Wagmi** | Web3 | EVM wallet account connections. | Frontend | Review minor updates quarterly. |
| **RainbowKit** | Web3 UI | Connect wallet modal and account badges. | Frontend | Update minor versions quarterly. |
| **Viem** | EVM Client | Low-level blockchain RPC queries. | Shared | Follow major releases closely. |
| **Redux Toolkit**| Client State| Manages persistent user auth tokens. | Frontend | Update minor versions quarterly. |
| **TanStack Query**| Server State| Server state cache management. | Frontend | Upgrade minor versions monthly. |
| **Express** | API Gateway | Backend HTTP server framework. | Backend | Upgrade minor versions quarterly. |
| **Mongoose** | Database | MongoDB Object Document Mapper (ODM). | Backend | Minor updates monthly; LTS only. |
| **ioredis** | Cache / Broker| Redis Client for Pub/Sub notifications. | Backend | Minor updates quarterly. |
| **jsonwebtoken**| Security | User authorization JWT generator. | Backend | Upgrade minor versions quarterly. |
| **bcrypt** | Security | Cryptographic password hashing. | Backend | Upgrade minor versions quarterly. |
| **Zod** | Validation | Type-safe schema input validation. | Shared | Upgrade minor versions quarterly. |

---

## 2. Upgrade Protocols

### Security Vulnerabilities
Any dependency flagged by `npm audit` or `pnpm audit` with a severity level of **High** or **Critical** must be updated immediately via a dedicated hotfix branch.

### Quarterly Review
Every quarter, the engineering team reviews dependencies:
1. **Compatibility**: Verify that upgrading a package does not introduce breaking contract shifts (e.g. Wagmi breaking updates with Viem).
2. **Bundle Size**: Check frontend production bundles (`pnpm run build`) to ensure dependency additions do not cause layout chunk sizes to inflate beyond configured performance budgets.
3. **Deprecations**: Identify deprecated methods and schedule refactoring tasks to replace them.

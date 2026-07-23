# Nexus Smart Wallet Platform (v1.0 RC1)

Nexus Smart Wallet is a production-ready ERC-4337 Account Abstraction platform built to enable users to create, deploy, and manage smart contract wallets across EVM networks (defaulting to Base Sepolia).

## Core Capabilities
* **Counterfactual Account Prediction:** Predicts and generates deterministic smart account addresses per user, chain, and wallet type (using standard factories).
* **Multi-Framework Account Abstraction:** Built-in adapters for **Light Account (Alchemy)**, **Simple Account**, **Safe**, **Kernel**, **Biconomy**, and **Trust Wallet**.
* **Gasless Relaying & Sponsorship:** Full integration with Alchemy and Pimlico Paymasters and Bundlers.
* **Cryptographic Session Keys:** Secure, owner-authorized session key policies restricting target contracts, allowed functions, and spending limits with signature validation.
* **Concurrent Transaction Queue:** OCC-backed sequential nonce management preventing database race conditions under heavy load.
* **Distributed Operations:** Redis-backed distributed rate limiter and clustered SSE notifications via Redis Pub/Sub.

---

## Repository Structure

```
nexus-smart-wallet/
├── backend/            # Express API, MongoDB repository, worker service, & AA signing logic
│   ├── src/            # TypeScript source code
│   └── tests/          # Real integration and unit tests (Mongo memory server, local Anvil)
├── frontend/           # React SPA (Vite + Redux Toolkit + Tailwind CSS + wagmi/RainbowKit)
│   └── src/            # React components, state slices, hooks, and apiClient
├── docs/               # Canonical documentation guides and reports
└── docker-compose.yml  # Production deployment multi-container configuration
```

---

## Documentation Directory

The authoritative documentation is hosted in the [`/docs`](docs/README.md) directory. Please consult the specific guides below:

1. **[Canonical Architecture Guide](docs/architecture/system-overview.md):** Deep dive into core services (worker, queue, signing), portfolio caches, notification system, and transaction lifecycle.
2. **[Canonical API Reference](docs/api/overview.md):** Complete specifications of REST endpoints, schemas, validation rules, and response shapes.
3. **[Deployment & Operational Runbook](docs/operations/runbook.md):** Detailed environment configurations, system check commands, logging policies, and failover/rollback procedures.
4. **[Security Architecture Guide](docs/security/authentication.md):** Details on the cryptographic session key validation model, JWT authentication, rate limiting, and log redactions.
5. **[Integration & Testing Guide](docs/testing/strategy.md):** Testing methodology, programmatic Anvil setups, MongoDB Memory Server integration, and mock isolation policies.
6. **[Release Notes & Changelog](docs/reference/changelog.md):** Summary of Release Candidate 1 (RC1) improvements and production capabilities. See also the root [CHANGELOG.md](CHANGELOG.md).

---

## Quick Start

### 1. Requirements
Ensure the following are installed locally:
* **Node.js** (v18 or higher)
* **pnpm** (preferred for frontend) / **npm**
* **Docker & Docker Compose** (for containerized deployments)
* **Anvil** (foundry toolkit, required to run the local integration tests)

### 2. Environment Setup
Configure `.env` files in both the frontend and backend directories:
* **Backend:** Copy `backend/.env` template and set your `ALCHEMY_API_KEY`, `PIMLICO_API_KEY`, `JWT_SECRET` (min 32 characters), and `MASTER_WALLET_PRIVATE_KEY` (non-default secure EOA signer).
* **Frontend:** Copy `frontend/.env` and update API urls and keys.

### 3. Run Locally (Development)
```bash
# Run backend
cd backend
npm install
npm run dev

# Run frontend
cd ../frontend
pnpm install
pnpm run dev
```

### 4. Run Tests
The integration tests run against programmatically spawned Anvil node forks and Mongo memory servers:
```bash
cd backend
npm test
```

### 5. Production Docker Compose
Deploy the complete production stack (MongoDB, Redis, Node Backend, Nginx Frontend):
```bash
docker compose up --build -d
```
The application will be accessible at `http://localhost:8080` (or your configured `FRONTEND_PORT`).

---

## License
Distributed under the MIT License. See `LICENSE` for details.

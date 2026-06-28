# Nexus Smart Wallet — Production Deployment Guide

This guide details the production runtime prerequisites, environment configurations, and multi-stage container deployments for the Nexus Smart Wallet platform.

---

## 1. System Requirements

To build and run the application in a production environment:
* **Node.js:** version 18.0.0 or higher.
* **pnpm / npm:** version 8 or higher.
* **MongoDB:** version 6.0 or 7.0.
* **Redis:** version 7.x (Alpine variant recommended).
* **Docker & Docker Compose:** for containerized runtimes.

---

## 2. Environment Configurations

Configure `.env` files in both the frontend and backend directories before launching services. Startup validation routines verify configurations at boot and crash the service if parameters are missing or insecure.

### Backend Environments (`backend/.env`)

* **`MONGODB_URI`** (Starts with `mongodb://` or `mongodb+srv://`)  
  *Main database connection string.*
* **`JWT_SECRET`** (Minimum 32 characters)  
  *Token signing secret. Default developer credentials are rejected.*
* **`ALCHEMY_API_KEY`** (Required non-empty string)  
  *Alchemy API key for RPC and gas sponsorship paymaster clients.*
* **`PIMLICO_API_KEY`** (Required non-empty string)  
  *Pimlico key for gas fee oracle estimators and backup bundlers.*
* **`MASTER_WALLET_PRIVATE_KEY`** (32-byte hex starting with `0x`)  
  *EOA relayer private key. The default development key is rejected.*
* **`MASTER_WALLET_ENABLED`** (`"true"`)  
  *Activates Relayer EOA transaction capabilities.*
* **`REDIS_URI`** (Starts with `redis://`)  
  *Redis connection string. Mandatory if Redis is enabled.*
* **`METRICS_KEY`** (Required non-empty string)  
  *Protects metrics stats from unauthorized remote lookups.*
* **`PORT`** (Integer)  
  *Express API port. Defaults to 3000.*
* **`NODE_ENV`** (`"production"` \| `"development"`)  
  *Toggles production validation and security checks.*

### Frontend Environments (`frontend/.env`)

* **`VITE_API_BASE_URL`**  
  *Base URL of the Express backend API (defaults to `http://localhost:3000`).*
* **`VITE_CHAIN_ID`**  
  *Base Sepolia chain ID (`84532`).*
* **`VITE_WALLETCONNECT_PROJECT_ID`**  
  *RainbowKit project identifier key.*

---

## 3. Production Docker Architecture

Development containers (`pnpm dev` or `tsx watch`) are not used in production. Both frontend and backend leverage optimized multi-stage runtimes.

### A. Backend Container (`backend/Dockerfile`)
1. **Compilation (Stage 1):** Spawns a full Node Alpine build environment, installs dependencies, and runs `pnpm run build` to compile TypeScript to production-ready JavaScript in `dist/`.
2. **Runtime Isolation (Stage 2):** Spawns a clean `node:22.13-alpine` base. Installs *production-only* node modules (`pnpm install --prod --frozen-lockfile`) and copies `/dist` from Stage 1.
3. **User Hardening:** Grants directory privileges to the non-root user `node` and switches runtime context to `USER node`.
4. **Health Check:** Runs every 30s using native Node fetch to call `/api/health`.

### B. Frontend Container (`frontend/Dockerfile`)
1. **Static Build (Stage 1):** Compiles the Vite React single-page application into assets inside `dist/`.
2. **Serving Layer (Stage 2):** Employs `nginx:1.25-alpine`. Copies assets to `/usr/share/nginx/html`.
3. **Nginx Server Configurations (`nginx.conf`):** Configures route fallbacks to `index.html` (supporting React Router), enables gzip compression for static assets, and defines secure caching headers.

### C. Docker Compose Orchestration (`docker-compose.yml`)
Deploy the entire production stack (MongoDB 7, Redis 7, Backend API, Nginx Frontend) with isolated network bridges and persistent volumes:

```bash
# Clone the repository and navigate to root
cd nexus-smart-wallet

# Copy and configure environment templates
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# Build and run containers in detached mode
docker compose up --build -d
```

The frontend will be accessible at `http://localhost:8080` (or your configured `FRONTEND_PORT`).

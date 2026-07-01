# Environment Variables Table

Documentation of environment variables parsed from configuration templates.

## ⚙️ Backend Environment Variables

| Variable | Default Value | Description |
| :--- | :--- | :--- |
| `ALCHEMY_API_KEY` | `N/A` | =========================================== NEXUS SMART WALLET BACKEND CONFIGURATION =========================================== ALCHEMY CONFIGURATION Your Alchemy API Key for RPC and Smart Account integrations |
| `ALCHEMY_POLICY_ID` | `N/A` | Your Alchemy Gas Manager Policy ID (optional/required for sponsorship) |
| `PIMLICO_API_KEY` | `N/A` | PIMLICO CONFIGURATION Your Pimlico API Key for bundler/paymaster or fee oracle services |
| `PIMLICO_POLICY_ID` | `N/A` | Your Pimlico Sponsorship Policy ID (optional) |
| `MASTER_WALLET_PRIVATE_KEY` | `N/A` | CENTRALIZED WALLET CONFIGURATION (Required) EOA master private key used for smart account deployments and transactions MUST be a 32-byte hex starting with 0x (do NOT use the default test key in production) |
| `MASTER_WALLET_ENABLED` | `true` | No description provided |
| `MONGODB_URI` | `N/A` | DATABASE CONFIGURATION (MongoDB) MongoDB connection URI (e.g. mongodb://localhost:27017/nexus-wallet) |
| `MONGODB_DB_NAME` | `nexus-wallet` | No description provided |
| `MONGODB_MAX_POOL_SIZE` | `10` | No description provided |
| `MONGODB_SERVER_SELECTION_TIMEOUT` | `5000` | No description provided |
| `MONGODB_SOCKET_TIMEOUT` | `45000` | No description provided |
| `PORT` | `3000` | SERVER CONFIGURATION |
| `NODE_ENV` | `development` | No description provided |
| `CORS_ORIGINS` | `http://localhost:5173,http://localhost:3000,http://localhost:3001,http://localhost:8080,http://127.0.0.1:8080` | Comma-separated allowed origins (e.g. http://localhost:5173) |
| `LOG_LEVEL` | `INFO` | LOGGING CONFIGURATION |
| `JWT_SECRET` | `N/A` | SECURITY CONFIGURATION Secret key used for signing authentication JWT tokens (must be at least 32 characters) |
| `METRICS_KEY` | `N/A` | Key used to protect the /api/metrics endpoint from unauthorized read access |
| `REDIS_URI` | `redis://localhost:6379` | REDIS CONFIGURATION (Required for Pub/Sub & Rate Limiting) |
| `REDIS_ENABLED` | `true` | No description provided |

## ⚙️ Frontend Environment Variables

| Variable | Default Value | Description |
| :--- | :--- | :--- |
| `VITE_ALCHEMY_API_KEY` | `N/A` | Frontend Configuration Your Alchemy API Key for frontend RPC and account kit integrations |
| `VITE_ALCHEMY_POLICY_ID` | `N/A` | Your Alchemy Gas Manager Policy ID for client-side transaction sponsoring |
| `VITE_WALLETCONNECT_PROJECT_ID` | `N/A` | RainbowKit / WalletConnect project ID |
| `VITE_CHAIN_ID` | `84532` | Blockchain Chain ID (e.g., 84532 for Base Sepolia) |
| `VITE_PIMLICO_API_KEY` | `N/A` | Pimlico configuration |
| `VITE_PIMLICO_SPONSORSHIP_POLICY_ID` | `N/A` | No description provided |
| `VITE_API_BASE_URL` | `http://localhost:3000` | Backend API Configuration Base endpoint of the Express backend API |
| `NODE_ENV` | `development` | No description provided |

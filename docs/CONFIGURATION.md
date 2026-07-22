# Configuration Guide

This document describes the environment variables required to run the Nexus Smart Wallet application.

## Frontend Environment Variables

The frontend application (built with Vite) requires the following environment variables. In development, these should be placed in `frontend/.env` or `frontend/.env.local`.

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `VITE_API_BASE_URL` | Yes | - | The base URL for the backend API. Must start with `http://` or `https://` and have no trailing slash. (e.g. `http://localhost:3001` or `https://api.production.com`) |
| `VITE_CHAIN_ID` | No | `84532` | The chain ID for the smart wallet network (default is Base Sepolia). |
| `VITE_ALCHEMY_API_KEY` | No | `''` | Alchemy API key for blockchain interactions. |
| `VITE_ALCHEMY_POLICY_ID` | No | `''` | Alchemy gas sponsorship policy ID. |
| `VITE_WALLETCONNECT_PROJECT_ID` | No | `''` | Project ID for WalletConnect integration. |
| `VITE_PIMLICO_API_KEY` | No | `''` | Pimlico API key for bundler and paymaster services. |
| `VITE_PIMLICO_SPONSORSHIP_POLICY_ID` | No | `''` | Pimlico gas sponsorship policy ID. |

### Development Setup

Create a `.env` file in the `frontend` directory:

```env
VITE_API_BASE_URL=http://localhost:3001
VITE_CHAIN_ID=84532
# Add your specific keys below for local development
VITE_ALCHEMY_API_KEY=your_alchemy_key
VITE_WALLETCONNECT_PROJECT_ID=your_walletconnect_id
```

### Production Setup

In a production environment (e.g., Vercel, Netlify, Docker), ensure these environment variables are provided securely in the build/runtime environment.

**Important**: The application implements fail-fast startup validation. If `VITE_API_BASE_URL` is missing or invalid, the application will abort startup. Additionally, in development, it will perform a health check against the backend on startup and fail visibly if the backend is unreachable.

### E2E Testing Configuration

Playwright tests use the same variables. If they run outside the Vite context, they fallback to standard Node.js `process.env`.
- `VITE_API_BASE_URL` (Defaults to `http://localhost:3001`)
- `PLAYWRIGHT_TEST_BASE_URL` (Defaults to `http://localhost:8080`)

## Backend Environment Variables

*(Document backend environment variables here as the project progresses into operational maturity.)*

## Troubleshooting

- **Startup Aborted**: Check your browser console. The frontend uses Zod for strict schema validation. It will output exactly which variables are missing or misconfigured.
- **Backend Unreachable**: Ensure the backend server is running and accessible at the URL defined in `VITE_API_BASE_URL`.

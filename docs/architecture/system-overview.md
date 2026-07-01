# System Architecture Context

Nexus Smart Wallet splits client-side presentation from core ERC-4337 smart wallet mechanics. To optimize mobile/web battery life and speed, all heavy operations (assembling userOperations, fetching RPC gas price history, checking paymaster stub sponsorships) run on the Express backend.

## 🏗️ System Integration Diagram

```mermaid
graph TD
    User([User Web Browser]) -->|React SPA / HTTP| Express[Express API Gateway]
    User -->|SSE Connection| Express
    Express -->|Read / Write| Mongo[(MongoDB Metadata)]
    Express -->|Token Denylist / Rates| Redis[(Redis Cache & PubSub)]
    Worker[Queue Worker Thread] -->|OCC Nonces| Mongo
    Worker -->|Submit UserOp| Bundler[RPC Bundler: Pimlico/Alchemy]
    Worker -->|Fetch Gas Estimates| Paymaster[RPC Paymaster: Pimlico/Alchemy]
    Bundler -->|Submit Tx| Ledger[Base Sepolia Blockchain]
    Express -->|Redis PubSub Channel| Redis
    Redis -->|Broadcast Notify| Express
    Express -->|SSE Pushed Event| User
```

## 🔌 Third-Party Integrations
* **Alchemy / Pimlico Bundlers:** Used to relay userOperations. Resolved dynamically depending on selected `walletID` and `chainId`.
* **Pimlico Gas Estimators:** Utilized to fetch gas oracle price data.
* **permissionless.js:** Integrates the Smart Account contracts on-chain (Base Sepolia) with backend Viem clients.

Related Pages:
* [Backend Architecture](backend.md)
* [ERC-4337 Integration](erc4337.md)

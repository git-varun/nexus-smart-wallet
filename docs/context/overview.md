# Overview

**Project:** Nexus Smart Wallet  
**Type:** ERC-4337 Account Abstraction wallet platform (POC)  
**Purpose:** Let users create and manage smart contract wallets across multiple EVM chains. Supports gasless transactions via bundlers and paymasters.

## Repo layout

```
nexus-smart-wallet/
├── backend/        Express API + MongoDB + AA logic
├── frontend/       React SPA (Vite + Redux + wagmi)
└── docs/context/   LLM context files (this folder)
```

## Core user flows

1. **Register / Login** → JWT issued, stored in localStorage  
2. **Create smart account** → backend picks wallet type + chain, deploys counterfactual address, stores in DB  
3. **Deploy wallet** → backend sends a zero-value UserOperation via bundler to deploy the contract on-chain  
4. **Send transaction** → backend builds UserOperation, optionally sponsors gas via paymaster, submits via bundler  
5. **View history** → frontend fetches transaction list from backend DB  

## Default chain

Base Sepolia (`chainId: 84532`). All account creation defaults to this chain.

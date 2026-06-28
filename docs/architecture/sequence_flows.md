# C4 Architecture — Sequence Diagrams

This document details the step-by-step cryptographic and network execution flows for key wallet operations.

---

## 1. User Authentication Flow

This flow validates user credentials and returns a secure JWT:

```mermaid
sequenceDiagram
    autonumber
    actor User as Wallet Owner
    participant FE as React Frontend
    participant BE as Express API
    participant DB as MongoDB

    User->>FE: Inputs email & password
    FE->>BE: POST /api/auth/login
    BE->>DB: Fetch user record by email
    DB-->>BE: Returns encrypted credentials (bcrypt hash)
    BE->>BE: Compares password via bcrypt.compare()
    BE->>BE: Signs JWT payload (userId, email) using JWT_SECRET
    BE-->>FE: Returns 200 OK with Bearer Token & user profile
    FE->>FE: Saves token to Redux store & localStorage
```

---

## 2. Smart Wallet Creation Flow

This flow predicts and registers a new ERC-4337 smart wallet counterfactual address:

```mermaid
sequenceDiagram
    autonumber
    actor User as Wallet Owner
    participant FE as React Frontend
    participant BE as Express API
    participant RPC as Alchemy RPC Node
    participant DB as MongoDB

    User->>FE: Selects smart account type (e.g. Light Account)
    FE->>BE: POST /api/wallets/create { ownerAddress, factoryType }
    BE->>RPC: Queries factory smart contract to predict counterfactual address
    RPC-->>BE: Returns Predicted Smart Account Address (0x...)
    BE->>DB: Save Smart Account metadata (address, owner, chain, factory, deployed=false)
    DB-->>BE: Confirms save
    BE-->>FE: Returns 200 OK with SmartAccount metadata
```

---

## 3. Portfolio Asset Refresh Flow

This flow syncs on-chain balances with the database cache for fast front-end queries:

```mermaid
sequenceDiagram
    autonumber
    actor User as Wallet Owner
    participant FE as React Frontend
    participant BE as Express API
    participant DB as MongoDB
    participant RPC as Alchemy/Base RPC

    User->>FE: Opens Assets tab
    FE->>BE: GET /api/portfolio/assets?address=0x...&chainId=84532
    BE->>DB: Query cached portfolio assets
    DB-->>BE: Returns cached balances
    Note over BE: If cache is stale (>30s) or sync requested
    BE->>RPC: Batch query native & ERC20 token balances on-chain
    RPC-->>BE: Returns raw token balances
    BE->>DB: Update PortfolioModel balances & set synced timestamp
    BE-->>FE: Returns normalized portfolio assets list
    FE->>FE: Maps elements through toAsset() adapter
    FE->>User: Renders asset balances & valuations
```

---

## 4. Session Key Registration Flow

This flow registers a cryptographic session key with restricted execution scopes:

```mermaid
sequenceDiagram
    autonumber
    actor User as Wallet Owner
    participant FE as React Frontend
    participant BE as Express API
    participant DB as MongoDB

    FE->>FE: Generates ephemeral local key pair (Session Public Key)
    User->>FE: Reviews constraints (allow target contract, spending limit, expiry)
    User->>FE: Signs authorization policy document with EOA Owner key
    FE->>BE: POST /api/sessions/create { address, chainId, policy, ownerSignature }
    BE->>BE: Recover signer address using viem verifyMessage()
    BE->>DB: Verify recovered signer matches registered Smart Account owner
    BE->>DB: Persist Session Key Policy document
    DB-->>BE: Confirms save
    BE-->>FE: Returns 200 OK (Session Key registered)
```

---

## 5. Transaction Execution Flow (with Session Key)

This flow validates scopes, claims nonces, submits UserOperations, and polls confirmations:

```mermaid
sequenceDiagram
    autonumber
    actor App as Client Application
    participant BE as Express API
    participant DB as MongoDB
    participant Broker as Redis (Pub/Sub)
    participant Bundler as Pimlico RPC (Bundler)
    participant Chain as EVM Blockchain

    App->>BE: POST /api/transactions/send { calls, sessionKeySignature }
    BE->>DB: Query Session Key Policy constraints
    DB-->>BE: Returns Policy
    BE->>BE: Verifies session signature & validates transaction parameters match policy limits
    BE->>DB: Claims atomic incremental nonce via getNextNonce()
    DB-->>BE: Returns Nonce
    BE->>BE: Packages UserOperation (calldata, nonce, gas parameters)
    BE->>BE: Signs UserOperation with master Relayer EOA key
    BE->>Bundler: eth_sendUserOperation
    Bundler-->>BE: Returns UserOperation Hash
    BE->>DB: Write transaction record to Queue (status='submitted')
    BE-->>App: Returns 200 OK with UserOperation hash
    
    Note over BE: Transaction worker background poll
    BE->>Bundler: eth_getUserOperationReceipt
    Bundler-->>BE: Returns receipt (blockHash, transactionHash, gasUsed)
    BE->>DB: Update transaction status to 'confirmed'
    BE->>Broker: Publish 'transaction.confirmed' to Redis channel
    Broker-->>BE: Active SSE subscriptions fetch message
    BE-->>App: Send Server-Sent Event (real-time notification)
```

---

## 6. Real-time Notification Dispatch Flow

This flow distributes events in a horizontal cluster using Redis Pub/Sub:

```mermaid
sequenceDiagram
    autonumber
    participant Worker as Backend Worker
    participant Redis as Redis Pub/Sub
    participant NodeA as Backend Node A (SSE Server)
    participant NodeB as Backend Node B (SSE Server)
    actor Client as User Browser

    Client->>NodeA: Establishes GET /api/notifications/subscribe (SSE)
    NodeA-->>Client: 200 OK (EventSource connected)
    
    Note over Worker: Background job completes transaction
    Worker->>Redis: Publish 'notifications:publish' { userId, type: 'transaction.confirmed', payload }
    
    Note over Redis: Broadcast to all active nodes
    Redis-->>NodeA: Receives broadcast message
    Redis-->>NodeB: Receives broadcast message
    
    NodeA->>NodeA: Scans local client pool for matching userId
    NodeA-->>Client: Writes data: {"type": "transaction.confirmed", ...} to SSE socket
    NodeB->>NodeB: Scans local client pool (no matching user, skips)
```

---

## 7. Smart Wallet Deployment Flow

This flow handles counterfactual smart account deployment alongside transaction execution:

```mermaid
sequenceDiagram
    autonumber
    actor User as Wallet Owner
    participant FE as React Frontend
    participant BE as Express API
    participant DB as MongoDB
    participant Bundler as Pimlico RPC (Bundler)

    User->>FE: Clicks "Send Transaction" (first wallet action)
    FE->>BE: POST /api/transactions/send
    BE->>DB: Query Smart Account deployment status
    DB-->>BE: Returns deployed=false
    BE->>BE: Generates deployment payload (initCode) using wallet factory calldata
    BE->>BE: Prepends deployment calldata to UserOperation calldata
    BE->>BE: Signs UserOperation with Relayer EOA key
    BE->>Bundler: Submit UserOperation (contains deploy + call payload)
    Bundler-->>BE: Returns UserOperation Hash
    
    Note over BE: Worker polls for block confirmation
    BE->>Bundler: Query receipt
    Bundler-->>BE: Returns transaction receipt (Smart Account contract deployed)
    BE->>DB: Set Smart Account deployed=true
    BE->>DB: Update transaction status to 'confirmed'
    BE-->>FE: Dispatches SSE event 'deployment.complete'
    FE->>FE: Toggles wallet badge status to 'Deployed' in UI
```

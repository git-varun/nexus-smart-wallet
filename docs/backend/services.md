# Backend Services

Summary of backend business services in `backend/src/services/`.

## 1. Authentication Service (`auth.service.ts`)
* Performs email register/login operations.
* Hashes passwords using **bcrypt** (12 rounds).
* Issues JWTs and manages refresh token validation.

## 2. Account Service (`account.service.ts`)
* Predicts counterfactual smart account addresses based on the owner EOA.
* Audits on-chain deployment status.

## 3. Transaction Service (`transaction.service.ts`)
* Assembles, estimates, and queues transaction jobs.
* Communicates with ERC-4337 bundlers and paymasters.
* Implements the `getNextNonce` EOA nonce manager.

## 4. Session Key Service (`sessionKey.service.ts`)
* Validates cryptographic session key signatures.
* Verifies transaction constraints (whitelists, spending limits).

## 5. Provider Service (`provider.service.ts`)
* Resolves bundler and paymaster RPC clients.
* Integrates custom Pimlico and Alchemy API calls.

## 6. Notification Service (`notification.service.ts`)
* Manages SSE client subscriptions.
* Broadcasts events using Redis Pub/Sub channels.

## 7. Redis Service (`redis.service.ts`)
* Configures Redis client instances and provides connection status.
* Wraps commands for slow command execution alerts.

Related Pages:
* [Express Controllers](controllers.md)
* [Background Workers](workers.md)

# C4 Architecture — Level 3: Components

This document details the internal component structures for the React Frontend and Express Backend containers.

---

## 1. Frontend SPA Components (React & FSD)

The frontend uses Feature-Sliced Design to partition internal components:

```mermaid
graph TD
    AppShell["App Shell\n(Shell & Providers)"] --> PageRouter["Page Router\n(Routes Registry)"]
    PageRouter --> Pages["Pages\n(Composition Grids)"]
    Pages --> Widgets["Widgets\n(PortfolioSummary, RecentActivity)"]
    
    Widgets --> Features["Features\n(Forms, Action triggers)"]
    Widgets --> Entities["Entities\n(AssetCard, TransactionRow)"]
    
    Features & Entities --> SharedUI["Shared UI Kit\n(Button, Table, StateView)"]
    Entities --> Adapters["Adapters\n(toAsset, toTransaction)"]
    Entities --> QueryClient["Query Factory\n(React Query hooks)"]
```

### Component Details
* **App Shell & Providers**: Wraps the app in global contexts (`ThemeProvider`, `NotificationProvider`, Redux Store, React Query Client).
* **Page Router**: Maps route IDs defined in `src/app/config/routes.ts` to visual pages.
* **Widgets**: The functional composition units (e.g. `PortfolioSummary`, `RecentActivity`).
* **Features & Mutations**: Implements specific interactions (e.g., login, session key creation) calling mutations.
* **Entities & Queries**: Fetches domain schemas and caches them via React Query, processing raw JSON response arrays through Adapters before mounting them.
* **Shared UI**: Stateless, wallet-agnostic visual controls (Forms, Tables, Charts, Fallbacks).

---

## 2. Backend API Components (Express)

The backend follows a layered MVC-Service structure:

```mermaid
graph TD
    Request["Incoming HTTPS Request"] --> ExpressRouter["Express Router\n(routes/index.ts)"]
    ExpressRouter --> Middleware["Middlewares\n(Auth, Rate Limiter, Validation)"]
    
    Middleware --> Controllers["Controllers\n(Wallet, Portfolio, SessionKey)"]
    Controllers --> Services["Services\n(Notification, Provider, Transaction)"]
    
    Services --> DBModels["Database Models\n(Mongoose Schemas)"]
    Services --> RedisClient["Redis Service\n(Cache / Broker)"]
    Services --> EVMClient["EVM Provider\n(Viem / Bundler RPC)"]
```

### Component Details
* **Router & Middleware**: Intercepts requests, validates inputs (using Zod), enforces sliding rate limits, and extracts authorization JWTs.
* **Controllers**: Sanitizes inputs, delegates requests to core services, and structures JSON response envelopes.
* **Services**:
  * **Provider Service**: Manages Viem client instantiation, network connections, and smart account contract deployments.
  * **Transaction Service**: Manages transaction queue states, processes optimistic nonces (`getNextNonce`), and interacts with the Pimlico / Alchemy RPC bundlers.
  * **Notification Service**: Manages Redis Pub/Sub subscriber queues and distributes real-time events to active client sockets.
  * **Redis Service**: Abstracts cache storage and rate limiter buckets.
* **Database Models**: Mongoose schemas representing collections in MongoDB (`User`, `SmartAccount`, `SessionKey`, `Transaction`).

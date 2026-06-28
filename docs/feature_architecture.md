# Nexus Smart Wallet — Feature Module & Shared Components Architecture

This document describes the design, folder organization, API client layer, React Query integrations, reusable UI components, and backend capability configurations of the Nexus Smart Wallet frontend.

---

## 1. Feature Module Architecture (`src/features/`)

To support domain co-location, scalability, and code isolation, the application is organized into specialized feature folders under `src/features/`. Each feature module owns its components, custom hooks, mutations, and types:

*   **`auth/`**: Authentication, session registration, credentials mapping, and login wrappers.
    *   *Components*: `AuthenticationPage`, `LoginForm`, `RegisterForm`
*   **`portfolio/`**: Account summary, ERC-20 token balances, USD asset valuations, and chain distribution details.
    *   *Components*: `AccountOverview`, `AccountGrid`, `ChainDistribution`, `StatCard`, `AssetCard`, `BalanceCard`
*   **`wallet/`**: Deployment, Smart Account info, bundlers, and paymasters.
    *   *Components*: `WalletDashboard`, `WalletCard`, `QuickActionCard`, `BundlerSelector`, `PaymasterSelector`, `EmailWalletConnect`
*   **`transaction/`**: ERC-4337 transaction execution, advanced configurations, and status indicators.
    *   *Components*: `TransactionInterface`, `StatusBadge`
*   **`activity/`**: User operation streams, transaction confirmation feeds, and charts.
    *   *Components*: `TransactionHistory`, `LiveActivityFeed`, `ActivityCard`, `ActivityChart`
*   **`security/`**: Multi-sig social recovery, session keys authorization, and guardian thresholds.
    *   *Components*: `SecurityCard`, `SessionKeyCard`
*   **`notification/`**: Push notifications and system alerts.
    *   *Components*: `NotificationCard`
*   **`settings/`**: User preferences, visual themes, languages, and profile credentials.
    *   *Components*: `UserProfile`
*   **`developer/`**: Smart Account creation panels and node/API network statuses.
    *   *Components*: `AlchemyAccountCreator`, `AlchemyStatusSimple`, `NetworkStatus`

---

## 2. Standardized API Client Layer (`src/services/apiClient.ts`)

The application consumes a standardized, fully-typed API client wrapper (`apiClient`) which provides:

1.  **Request Interceptor**: Automatically pulls the authentication token from Redux state and injects it as an `Authorization: Bearer <token>` header on every request.
2.  **Response Interceptor**:
    *   Normalizes success/error responses to match the backend `ApiResponse<T>` envelope format.
    *   Catches HTTP `401 Unauthorized` responses and fires a global window event (`nexus-auth-unauthorized`) to safely trigger login modal triggers across components.
3.  **Automatic Retry Strategy**: Performs exponential backoff retry (up to 3 retries by default) for read queries (`GET` requests) that fail due to network interruptions.
    *   *Mutation Rule*: To prevent duplicate executions, mutations (`POST`, `PUT`, `DELETE` requests) are **never** retried.
4.  **Error Normalization**: Maps native HTTP error states, parsing failures, and browser connection drops into a unified interface:
    ```typescript
    interface ApiResponse<T = any> {
        success: boolean;
        data?: T;
        error?: {
            code: string;
            message: string;
            status?: number;
        };
    }
    ```

---

## 3. Custom Query & Mutation Hooks (React Query)

Every state query maps to a cached React Query hook. Key hooks include:

*   **`useCapabilities()`**: Dynamic fetching of supported EVM networks, ERC-4337 providers, paymasters, and features directly from the backend capability endpoints.
*   **`usePortfolio()`**: Polls smart account balances, chain distributions, and token prices with automatic refresh caching.
*   **`useSessionKeys()`**: Reads and manages authorized session keys.
*   **`useTransactionHistoryBackend()`**: Monitors the sequential queue, maps pending transactions, and manages the execution loop state.

---

## 4. Reusable Primitives (`src/ui/`)

To prevent logic duplication, core components are built on top of high-performance, agnostic primitives:

### A. Form System (`src/ui/Form.tsx`)
A unified wrapper supporting validation rules, loading states, validation error mappings, dirty flags, and responsive buttons:
```typescript
import { Form, FormField, SubmitButton } from '@/ui/Form';
```

### B. Data Table System (`src/ui/Table.tsx`)
A generic grid (`<DataTable>`) used across transactions, assets, and notification lists. Supports:
*   Sorting by columns.
*   Search filtering and field queries.
*   Pagination and record count sizing.
*   Multi-selection and action items.

### C. Chart Infrastructure (`src/ui/Chart.tsx`)
Standardized responsive charting wrapper utilizing Recharts:
*   `type="line"`: Asset valuations over time.
*   `type="area"`: Layer-2 gas price trends.
*   `type="donut"`: Multi-chain portfolio distributions.
*   `type="bar"`: Periodic activity logs.

### D. Timeline Components (`src/ui/ProgressTimeline.tsx`)
Visualizes sequential multi-step statuses mapping exactly to the backend state engines:
*   **`TransactionLifecycleTimeline`**: `queued` ➔ `processing` ➔ `submitted` ➔ `success` / `failed`.
*   **`DeploymentLifecycleTimeline`**: predicting ➔ preparing ➔ deploying ➔ deployed.

---

## 5. Shared Business Components

Feature components are modular widgets that consume domain states directly:
*   **`AssetCard`**: Renders token balance, USD valuation, and quick actions.
*   **`BalanceCard`**: Displays overall portfolio worth and chain distribution breakdown.
*   **`WalletCard`**: Shows smart account addresses, deployment status, and chain icons.
*   **`ActivityCard`**: Visualizes details of a transaction log with corresponding status badges.
*   **`SecurityCard`**: Displays threshold signature metrics (e.g. `2/3 Guardians`).
*   **`SessionKeyCard`**: Renders key limits, target contracts, and expiration timers.
*   **`QuickActionCard`**: Modular action triggers (Send, Receive, Deploy, etc.).
*   **`StatusBadge`**: Type-safe badge rendering themed status borders and indicators.

---

## 6. Capability Integration (Configuration-driven UI)

The frontend is **fully configuration-driven** by backend capabilities. It queries the `/api/capabilities` endpoint dynamically:
*   **Supported Chains**: Populates chain switchers and active wallet grids.
*   **Supported Paymasters**: Configures gas sponsor capabilities and selectors.
*   **Supported Bundlers**: Populates relayer speed metrics.
*   **Supported Features**: Dynamically hides/shows security controls, session keys, and recovery forms.

No provider values, chains, or capability flags are hardcoded in the frontend.

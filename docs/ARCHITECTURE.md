# Nexus Smart Wallet — Frontend Architecture Reference (Feature-Sliced Design)

This document defines the canonical frontend architecture for the Nexus Smart Wallet application. It governs directory ownership, state distribution, import boundaries, data adapters, and UI design rules.

---

## 1. Directory & Layer Responsibilities

The application follows the **Feature-Sliced Design (FSD)** architecture. Code is divided into layers, each with strict rules of dependency and isolation.

```text
app       (Global configurations, providers, persistent Redux store, Tailwind entries)
 ↓
pages     (Routing entry points composed exclusively of pre-assembled widgets)
 ↓
widgets   (Assembled layout blocks combining features and entities: PortfolioSummary, RecentActivity)
 ↓
features  (User interactions: forms, sliders, selectors, mutating API state)
 ↓
entities  (Domain representations: models, adapters, query hooks: wallet, portfolio, sessionKey)
 ↓
shared    (Agnostic primitives: UI kit, api client, helpers: cn, reactQuery)
```

### Layer Details
*   **`src/app/`**:
    *   `providers/`: Context providers (`ThemeProvider`, `NotificationProvider`, `ToastProvider`).
    *   `store/`: Redux slices (`smartAccountSlice`, `smartAccountObjectsSlice`) representing authentication status, selected chain, and persistent session tokens.
    *   `config/`: Wagmi configurations, chain definitions, and route mappings.
    *   `layouts/`: Frame shells (`Shell.tsx`, `MainLayout.tsx`, `ErrorBoundary.tsx`).
*   **`src/pages/`**:
    *   High-level views mapped directly to routing registry rules (Overview, Assets, Transfer, Activity, Security, Settings).
    *   Must only render layout templates and FSD widgets. No page may contain direct API queries or state definitions.
*   **`src/widgets/`**:
    *   Large, self-contained business widgets composed of multiple features and entities.
    *   Examples: `PortfolioSummary` (merges portfolio details & asset tables), `RecentActivity` (merges historical list & activity feed).
*   **`src/features/`**:
    *   Interactive components that execute actions. Features alter state or call API mutations.
    *   Examples: `auth/LoginForm` (auth mutation), `wallet/AccountCreation` (wallet creation mutation), `wallet/BundlerSelector` (paymaster selections).
*   **`src/entities/`**:
    *   Domain entities representing core models. Owns query hooks, adapters, types, and domain UI cards.
    *   Slices: `wallet`, `asset`, `portfolio`, `transaction`, `sessionKey`, `notification`, `capability`.
*   **`src/shared/`**:
    *   Agnostic tools and styling entries. Must contain no smart contracts or wallet business logic.
    *   `shared/api/`: Base `apiClient` mapping, interceptors, and normalized domain API files (`auth.ts`, `wallet.ts`, etc.).
    *   `shared/ui/`: Primitive UI kit components (`Button`, `Table`, `Form`, `Chart`, `ProgressTimeline`, etc.).
    *   `shared/lib/`: Common helpers (`cn`, `reactQuery` client factory).

---

## 2. Strict Import & Dependency Rules

To prevent spaghetti logic and cyclic dependency loops, the following rules are strictly enforced:

1.  **Strict Downward Imports**: A component in a lower layer (e.g., `shared`) may **never** import anything from a higher layer (e.g., `entities`, `features`, `widgets`).
2.  **No Cross-Feature/Entity Imports**: A slice inside `entities` (e.g., `entities/portfolio`) cannot import components or hooks directly from another slice (e.g., `entities/sessionKey`). Share logic via `shared` or coordinate in `widgets`.
3.  **Strict Absolute Imports**: All internal imports must use the absolute path alias `@/` (resolving to `src/`). No deep relative parent traversals (`../../../../`) are permitted.
4.  **No Direct API Calls in UI**: UI components must consume data via React Query hooks defined within the `entities` layer. They must never trigger fetch/api client instances directly.

---

## 3. State Ownership Matrix

To prevent duplicate states and synchronize updates, the application's state is distributed across distinct owners:

| State Segment | Owner | Sync / Cache Mechanism |
| :--- | :--- | :--- |
| **Authentication & Token** | Auth Slice (Redux Toolkit) | Persisted via `redux-persist` to `localStorage`. |
| **EVM Signers / Wagmi** | Wagmi / RainbowKit | Managed by standard Wagmi provider connectors. |
| **Portfolio & Assets** | Portfolio Entity (React Query) | Cache validation: 30s stale time (`QUERY_TIMES.STANDARD_STALE`). |
| **Session Keys** | Session Key Entity (React Query) | Cache validation: 30s stale time; auto-invalidated on key revokes. |
| **Infrastructure Capabilities** | Capability Registry (React Query) | Cached statically: 5m stale time (`QUERY_TIMES.STATIC_STALE`). |
| **Transactions & Queue** | Transaction Entity (React Query) | Volatile Cache: 10s stale time; auto-polls on incomplete queue. |
| **System Notifications** | Notification Context | In-memory stack; connected via Server-Sent Events (SSE). |
| **Theme & Accent Settings** | Theme Provider | Persisted class attributes (`dark`/`light`) on html element. |

---

## 4. Data Flow & Entity Adapters

All API interactions map through a multi-stage data flow to decouple frontend layout concerns from changes in backend schemas:

```text
Backend API Response (DTO)
          ↓
   Entity Adapter (Adapter)  <-- Maps DTO types, parsing Dates and casting BigInts
          ↓
  Frontend Model (Entity)
          ↓
  Query/Mutation Hook (React Query)
          ↓
  Interactive Widget / Component
```

### Adapter Implementations (`entities/*/model/adapter.ts`)
Each entity folder co-locates an `adapter.ts` that normalizes raw JSON payloads before ingestion:
*   `toSmartWallet`: Normalizes database `SmartAccountInfo` schemas.
*   `toAsset` & `toPortfolio`: Maps balance metrics and price valuations.
*   `toTransaction`: Converts timestamp strings to JavaScript `Date` instances and maps queue status fields.
*   `toSessionKey`: Casts spending limit parameters and parses expiration values.
*   `toCapabilities`: Transforms chain configs and feature switches.

---

## 5. UI Primitives & Design System

Agnostic primitives co-located inside `shared/ui/` follow the system design tokens:

1.  **Forms (`Form.tsx`)**: Centralizes async submission loading, dirty state detection, and validation errors.
2.  **Tables (`Table.tsx` / `<DataTable>`)**: Integrates column sorting, pagination controls, search criteria, and record selection.
3.  **Charts (`Chart.tsx`)**: Recharts wrapper styling responsive legends, tooltips, HSL backgrounds, and accessible tooltips.
4.  **Timelines (`ProgressTimeline.tsx`)**: Visualizes multi-stage flows (e.g. queue pipeline, deployment setup) driven directly by type-safe contract statuses.

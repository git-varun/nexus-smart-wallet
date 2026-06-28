# ADR-002: React Query (TanStack Query) for Server State Management

## Status
Accepted

## Context
Originally, the client managed API data fetching using Redux Toolkit slices or manual state hooks inside UI components. This resulted in significant boilerplate, complex loading and error tracking code, and no clean mechanism for automatic background synchronization, cache invalidation, or optimistic UI updates.

## Decision
We adopted **TanStack Query (React Query)** as the authoritative framework for caching and synchronizing server state. 

### Enforcements
* **Centralized Registry**: Every query and mutation key must be defined in `src/shared/lib/reactQuery.ts`. No inline query strings (e.g. `['wallet', address]`) are permitted in hooks. They must use the key factories (e.g. `QUERY_KEYS.wallet.detail(address)`).
* **Retry and Cache Policies**: Setup default retry rules (3 retries with exponential backoff) and stale times (e.g., standard stale time of 30 seconds for portfolio data, 10 seconds for transactions queue, 5 minutes for capabilities config).
* **Automatic Invalidation**: Mutations must declare their invalidation path on success (e.g., creating a session key invalidates the session list query).

## Alternatives Considered
* **Redux Toolkit Query (RTK Query)**: Highly integrated with Redux, but we found React Query to be more lightweight and have a more intuitive hook-based API that fits naturally with FSD entity structures.
* **Manual Component State (`useEffect` + `fetch`)**: Unacceptable for production due to race conditions, lack of cache sharing between components, and high maintenance overhead.

## Consequences
* **Positives**:
  * Decouples components from server state retrieval logic.
  * Native handling of caching, loading, error, and stale states.
  * Invalidation flows automatically update UI dashboards upon transaction completions.
* **Negatives**:
  * Requires familiarity with cache invalidation patterns to prevent stale data displays.
  * Increases dependency size of the bundle.

## Future Considerations
Implement browser storage integration (`persistQueryClient`) to enable fast visual startup checks using offline-cached values.

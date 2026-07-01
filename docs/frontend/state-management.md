# Frontend State Management

The frontend splits state management between **Redux Toolkit** (for local/session states) and **React Query** (for server/on-chain caching).

## 🗄️ Redux Store (`src/app/store/`)
* **redux-persist:** Saves the user auth state (JWT, refresh token, preferences) to LocalStorage.
* **smartAccountObjectsSlice:** Keeps Viem client models. These are marked non-serializable and excluded from standard Redux middleware checks.
* **Slices:**
  * `authSlice:` Keeps active session details and tokens.
  * `themeSlice:` Keeps active preferences (light, dark, auto).

## 📡 React Query Cache (`shared/lib/reactQuery`)
* Used to fetch and cache portfolio balances and transaction logs.
* Enforces cache invalidations upon receiving SSE events.

Related Pages:
* [Architecture FSD](architecture.md)
* [Context Providers](providers.md)

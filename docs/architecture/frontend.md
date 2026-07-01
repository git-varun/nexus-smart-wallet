# Frontend Architecture

The Nexus Smart Wallet frontend is a Single Page Application built on **React**, **Vite**, and **TailwindCSS**. It adheres to the **Feature-Sliced Design (FSD)** guidelines to decouple layout grids, widgets, features, and domain models.

## 📁 Component Organization Map
* **App (`src/app/`):** Imports global styles, configures the Redux store, and defines index providers.
* **Pages (`src/pages/`):** High-level view components bound to routes.
* **Widgets (`src/widgets/`):** Large compound widgets combining multiple features (e.g. `LiveActivityFeedWidget`).
* **Features (`src/features/`):** Core user interactions (e.g. login form, send transaction button).
* **Entities (`src/entities/`):** Business data entities (e.g. user details, transaction history, token lists).
* **Shared (`src/shared/`):** Atomic UI widgets, generic utilities, and fetch clients.

## 🗄️ State and Cache Configuration
* **Redux Toolkit:** Manages user login JWT tokens, refresh sessions, and interface theme selections. Persisted to LocalStorage via `redux-persist`.
* **React Query:** Manages client-side query caching of on-chain portfolios and transaction histories. Includes query invalidation parameters on SSE notifications.
* **Viem Client Store (`smartAccountObjectsSlice`):** Maintains runtime-configured non-serializable viem public and bundler clients.

Related Pages:
* [FSD Filer Structures](file:///home/dev-var/Personal/Projects/nexus-smart-wallet/docs/frontend/architecture.md)
* [Redux & React Query Store](file:///home/dev-var/Personal/Projects/nexus-smart-wallet/docs/frontend/state-management.md)

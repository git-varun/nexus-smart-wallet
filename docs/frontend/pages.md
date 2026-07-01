# Pages Directory

Documentation of views inside `frontend/src/pages/`.

## 1. Home (`Home.tsx`)
* **Route:** `/`
* **Widgets used:** `LiveActivityFeedWidget`, `PortfolioSummary`, `QuickActions`.
* **State:** Local query params, chain selectors.
* **Interactions:** Allows users to switch chains, check active smart wallet EOA addresses, and see recent transactions.

## 2. Assets (`Assets.tsx`)
* **Route:** `/assets`
* **Widgets used:** `AssetsOverview`, `PortfolioSummary`.
* **APIs called:** `GET /api/portfolio`.

## 3. Transfer (`Transfer.tsx`)
* **Route:** `/transfer`
* **Features:** Enqueue transfers.
* **APIs called:** `POST /api/transactions/send`, `POST /api/transactions/estimate_gas`.

## 4. Activity (`Activity.tsx`)
* **Route:** `/activity`
* **Widgets used:** `RecentActivity`.
* **APIs called:** `GET /api/transactions/history`.

## 5. Security (`Security.tsx`)
* **Route:** `/security`
* **Widgets used:** `SecurityOverview`, `SecurityWidget`.
* **APIs called:** `GET /api/sessions`, `POST /api/sessions/create`, `POST /api/sessions/revoke`.

## 6. Settings (`Settings.tsx`)
* **Route:** `/settings`
* **Interactions:** Modifies displayName, profile avatar image, theme preferences, and manages session logs.
* **APIs called:** `GET /api/profile`, `PUT /api/profile`, `POST /api/avatar/upload`, `DELETE /api/avatar`.

## 7. DeveloperTools (`DeveloperTools.tsx`)
* **Route:** `/developer`
* **Widgets used:** `DeveloperConsole`.
* **APIs called:** `GET /api/capabilities`, `POST /api/capabilities/validate`.

Related Pages:
* [Router Config](routing.md)
* [Reusable Components](components.md)

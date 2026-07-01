# Frontend Routing Guard & Configuration

Routing is configured using **react-router-dom** within `frontend/src/app/App.tsx`.

## 🔒 MainLayout Route Guard
* All functional application views reside within the `MainLayout` wrapper.
* **Authentication Guard:** Enforces state validation checks. If the Redux store's user token is missing or expired, it redirects to the login flow.
* **Sidebar Layout:** Mounts the primary navigation bar (Assets, Transfer, Activity, Security, Settings, DeveloperTools).

## 🚀 Code Splitting & Lazy Loading
All page views are loaded dynamically using `React.lazy` and wrapped inside a `Suspense` block to minimize bundle sizes.
```typescript
const Home = React.lazy(() => import('@/pages/Home'));
const Assets = React.lazy(() => import('@/pages/Assets'));
const Transfer = React.lazy(() => import('@/pages/Transfer'));
const Activity = React.lazy(() => import('@/pages/Activity'));
const Security = React.lazy(() => import('@/pages/Security'));
const Settings = React.lazy(() => import('@/pages/Settings'));
const DeveloperTools = React.lazy(() => import('@/pages/DeveloperTools'));
const NotFound = React.lazy(() => import('@/pages/NotFound'));
```

Related Pages:
* [Pages Directory](pages.md)
* [Context Providers](providers.md)

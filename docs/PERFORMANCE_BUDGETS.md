# Nexus Smart Wallet — Performance Budgets

This document defines the quantitative target limits for client-side loading times, bundle sizes, and backend API response latencies to ensure an optimal user experience.

---

## 1. Client-Side Bundle Sizes

Static assets served from the Nginx server must comply with the following size limits:

| Target Asset | Metric Type | Limit Cap | Rationale |
| :--- | :--- | :--- | :--- |
| **Initial JS Bundle** | Gzipped Size | **< 500 KB** | Ensures rapid startup on mobile connections. |
| **Largest Route Chunk** | Gzipped Size | **< 300 KB** | Prevents blocking route transition delays. |
| **CSS Stylesheet** | Raw Size | **< 100 KB** | Guarantees fast paint times. |

### Verification
Bundle sizes are validated at every production build compilation (`pnpm run build`). Chunks that trigger Vite bundle warnings must be inspected for code splitting.

---

## 2. Core User Experience Timings (Core Web Vitals)

Timings are measured under simulated throttle settings (Mobile 3G network profiles):

| Metric | Target Cap | Description |
| :--- | :--- | :--- |
| **LCP (Largest Contentful Paint)**| **< 2.5 seconds** | Time taken for the main screen elements to become visible. |
| **FID (First Input Delay)** | **< 100 milliseconds** | Time taken for the UI to process the first button interaction. |
| **CLS (Cumulative Layout Shift)**| **< 0.1** | Restricts unexpected visual element shifting during load. |
| **TTI (Time to Interactive)** | **< 3.0 seconds** | Time taken for the dashboard to become fully responsive. |

---

## 3. Backend API Response Budgets

API latency is measured at the server level (P95 percentiles over a 24-hour cycle):

| Endpoint Route / Action | P95 Latency Cap | Mitigation strategy for breaches |
| :--- | :--- | :--- |
| **Dashboard API (`/api/wallets`)**| **< 500 ms** | Optimize DB index lookups or cache wallet details. |
| **Portfolio Sync (`/api/portfolio/refresh`)**| **< 1.0 s** | Batch Viem RPC queries; implement Redis cache. |
| **Transaction Submit (`/api/transactions/send`)**| **< 2.0 s** | Execute validation synchronously; queue UserOperation delivery asynchronously. |
| **Session Key creation (`/api/sessions/create`)**| **< 800 ms** | Optimize viem cryptographic key recovery checks. |

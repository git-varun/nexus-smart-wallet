# Nexus Smart Wallet — Definition of Done (DoD)

This document outlines the strict quality gating requirements that every feature branch must satisfy before it can be merged into the `master` branch.

---

## 1. Definition of Done Checklist

Every feature pull request must contain checked assertions satisfying the following categories:

### A. Backend Implementation
* [ ] **Logic Complete**: Core service operations, database query updates, and blockchain calls are fully implemented.
* [ ] **Validation Layer**: Input parameters are sanitized and validated using Zod schemas at the route level.
* [ ] **Error Normalization**: Raw node/blockchain exceptions are caught, logged with appropriate context, and translated into standardized JSON error responses.

### B. API Layer & Typings
* [ ] **Typed API Client**: The backend endpoint is added to the corresponding file in `src/shared/api/*` on the frontend with complete request and response types.
* [ ] **Zero Inline Strings**: No endpoint strings or raw query URLs are placed directly inside components.
* [ ] **No DTO Leakage**: Frontend UI components do not consume raw backend DTO models. All network data is run through an entity adapter (`model/adapter.ts`).

### C. Frontend Query Architecture
* [ ] **Query Key Registry**: All query and mutation keys are registered in `src/shared/lib/reactQuery.ts`.
* [ ] **Cache Configuration**: Appropriate cache times and stale times are configured matching default policies.
* [ ] **Mutation Invalidation**: Success handlers trigger automatic invalidation for all affected query cache chains.

### D. User Interface & Accessibility
* [ ] **Visual States**: The layout handles the full async lifecycle:
  * Loading state (skeletons or loaders).
  * Empty state (illustrations + CTA).
  * Error state (clean error feedback + retry action).
  * Unauthorized state (redirects to login).
* [ ] **Responsiveness**: Elements adjust smoothly across standard breakpoints (`sm`, `md`, `lg`). Mobile drawer/sidebar overlays are verified.
* [ ] **Accessibility (a11y)**: Accessible HTML markup is used. Interactive controls have focus outlines and `aria-label` tags.
* [ ] **Design Tokens**: Styling is strictly derived from the Tailwind configuration. No hardcoded hex values or ad-hoc margins.

### E. Quality Assurance & Tests
* [ ] **Unit Tests**: Business logic and helper functions are verified via isolated tests.
* [ ] **Integration Tests**: Database operations, session validations, and concurrency sequences run successfully against in-memory Mongo servers or Anvil nodes.
* [ ] **Zero Open Handles**: Test suites exit cleanly without hung database pools or active intervals.

### F. Documentation & Compilation
* [ ] **Documentation**: Any change to API contracts or layout structures is updated in the corresponding markdown files in `/docs`.
* [ ] **TypeScript Clean**: `pnpm run type-check` executes with **0 errors**.
* [ ] **Lint Clean**: `pnpm run lint` passes with **0 errors**.
* [ ] **Production Build**: `pnpm run build` succeeds, generating static bundles under `dist/` cleanly.

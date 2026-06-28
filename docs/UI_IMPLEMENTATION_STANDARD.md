# Nexus Smart Wallet — UI & Page Implementation Standard

This document defines the canonical guidelines and development constraints for implementing new user interface pages and components within the Nexus Smart Wallet application. 

This standard serves as a binding contract to eliminate architectural drift, guarantee strict separation of concerns, enforce backend contract alignment, and maintain a highly polished, responsive, and consistent user experience.

---

## 1. Component Hierarchy & Composition Rules

To maintain the Feature-Sliced Design (FSD) architecture, UI elements must follow a strict composition hierarchy:

```text
  Pages (Composition Only)
    ↓
  Widgets (Pre-assembled Blocks)
    ↓
  Features (Interactions / Mutations) & Entities (Domain Models / Queries)
    ↓
  Shared UI Primitives (Stateless Layout Blocks)
```

### Page Constraints (`src/pages/*`)
1. **Pages are Composition-Only Layouts**: Pages must only mount widgets and define high-level structural grid arrangements. They must never implement inline Tailwind styling for custom elements, custom HTML structures, or unique page styling.
2. **Zero Direct Fetch / API Queries**: Pages must **never** call hooks that perform direct API requests (e.g. `useQuery`, `useMutation`) or interact with the base API client.
3. **Zero Local Business Logic**: Pages must **never** implement complex state handlers, form validations, data transformation, or calculations. All business logic must be delegated down to widgets, features, or hooks.
4. **No Direct DTO Consumption**: Pages must **never** ingest raw backend Data Transfer Objects (DTOs).

### Widget Constraints (`src/widgets/*`)
1. **Self-Contained Business Units**: Widgets represent cohesive regions of a page (e.g., `PortfolioSummary`, `RecentActivityFeed`, `SecurityMfaCard`).
2. **Composition of Features and Entities**: Widgets are created by placing entity representations (e.g., `AssetCard`, `TransactionRow`) alongside interactive features (e.g., `TransferButton`, `ToggleSessionKeyForm`).
3. **Internal Data Coordination**: If a widget contains interactive states (e.g. searching, pagination), it must manage it via features or standardized shared states, avoiding raw custom business hooks.

### Features (`src/features/*`) & Entities (`src/entities/*`)
1. **Interaction and Mutation Boundaries**: Features represent mutative actions (forms, dialog triggers, toggle actions). They own mutation state hooks (`useMutation`).
2. **Domain Boundaries**: Entities own read-only domain queries (`useQuery`), schema adapters (`model/adapter.ts`), and static type definitions.
3. **Separation of Read/Write**: Never combine queries and mutations in the same directory unless they belong strictly to the same feature/entity boundary.

---

## 2. Data Flow & Adapter Enforcements

No component, feature, widget, or page may directly consume raw backend DTOs. 

### Data Adaptation Pipeline
Every backend response must pass through an entity adapter before reaching any UI component:

```text
Backend API Response (DTO) -> Entity Adapter (adapter.ts) -> Type-safe Frontend Entity -> UI Component
```

### Validation Checklist
*   Check that API return types are run through the corresponding adapter (e.g., `toPortfolio(response)`).
*   Any date string (`ISO-8601`) from the database must be parsed into a JavaScript `Date` object or formatted string inside the adapter.
*   Casing conversions (e.g., `snake_case` on backend to `camelCase` on frontend) must occur entirely within the adapter layer.
*   BigInt conversions (e.g., parsing raw token values or gas limits from string representations) must happen in the adapter layer.

---

## 3. Asynchronous State Standard

Every page and primary business widget must explicitly handle the standard lifecycle states of asynchronous data retrieval. Do not show blank areas, generic unstyled text elements, or broken layouts during async loading or failures.

### Standard Fallback Visual Resolvers
Use the generic `<StateView>` component (located in `src/shared/ui/StateView.tsx`) to render consistent screens for:

| State | Trigger Criteria | UI Presentation Requirement |
| :--- | :--- | :--- |
| **Loading** | `isLoading` is true | Sleek skeleton screens or micro-animated loaders mapping the expected final layout. No blocking fullscreen overlay spinners. |
| **Empty** | Collection is empty (`data.length === 0`) | Accessible illustration, descriptive text, and a primary call-to-action (CTA) to guide the user (e.g., "Create your first session key"). |
| **Error** | API query fails (`isError` is true) | Clean error description, diagnostic code, and a "Retry Connection" button triggering cache refetch. |
| **Offline** | `navigator.onLine === false` | Discrete banner indicating network interruption while preserving existing cached content. |
| **Unauthorized** | HTTP `401` returned from API client | Intercepted globally by the router to transition to login, displaying clear session expiration warnings. |
| **Forbidden** | HTTP `403` returned from API client | Standardized access denied screen detailing missing capability permissions. |
| **No Results** | Search query yields zero matching results | Visual feedback explaining that search filters returned nothing, with a "Clear Search" helper link. |

---

## 4. API Contract Alignment & Verification Rules

Every frontend API client module (located in `src/shared/api/*`) must match the backend controller implementation exactly:
1. **No Frontend Workarounds**: If a backend API does not return a required field, do not inject placeholder strings or mock local states in the frontend client. Request a backend contract modification and create a backlog item.
2. **Strict Casing & Type Enforcement**: Path parameters, query variables, and request body parameters must strictly match the types expected by the Express router validation middleware.
3. **Explicit Error Boundaries**: API requests must normalize backend errors into the standard error format:
    ```typescript
    export interface NormalizedError {
        code: string;
        message: string;
        details?: Record<string, string[]>;
    }
    ```

---

## 5. Design Tokens & Styling Constraints

All UI styling must utilize the Tailwind config design tokens. No custom hexadecimal colors, absolute sizes, or non-token margins may be introduced:

1. **Colors**: Always map theme values to standard semantic classes (e.g., `bg-background`, `text-foreground`, `border-border`, `text-muted-foreground`, `bg-primary`, `text-primary-foreground`).
2. **Typography**: Use standard tailwind text sizing paired with tracking/font-weight conventions:
    *   Large Title: `text-3xl font-bold tracking-tight`
    *   Subheading: `text-sm font-medium text-muted-foreground`
    *   Body: `text-sm text-foreground`
3. **Spacing**: Restrict layouts to standard modular spacing steps (`p-4`, `p-6`, `gap-4`, `gap-6`, `space-y-4`). Avoid arbitrary values (e.g. `p-[17px]`).
4. **Micro-animations**: Every clickable control (buttons, tab pills, accordion headers) must support transition styling (`transition-all duration-200 ease-in-out hover:scale-[1.01] active:scale-[0.99]`).
5. **Responsiveness**: Implement standard breakpoints (`sm:`, `md:`, `lg:`) to adapt layouts for mobile views (e.g., switching sidebars to collapsible overlays and converting tabular layouts to list card grids on screens under `768px`).

---

## 6. Verification Checklist for Pull Requests

Before submitting any code for review, ensure the implementation satisfies the following assertions:

*   [ ] Does the page compose widgets instead of raw features or primitives?
*   [ ] Are all API client modules isolated in `src/shared/api/` with zero queries or inline URLs in the UI components?
*   [ ] Do all data integrations use entity adapters (`toEntity()`) to transform backend responses?
*   [ ] Are all React Query keys managed through the central factory (`QUERY_KEYS` / `MUTATION_KEYS`)?
*   [ ] Have loading, empty, and error fallback states been fully verified using the `<StateView>` component?
*   [ ] Does the page compile with zero TypeScript errors?
*   [ ] Does the code pass the linter with zero errors?

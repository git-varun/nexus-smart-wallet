# ADR-001: Feature-Sliced Design (FSD) Architecture

## Status
Accepted

## Context
The Nexus Smart Wallet client application was originally structured using standard React components, hooks, and services layout. As features expanded (session keys, multisig, portfolios), this lack of architectural structure led to circular dependency loops, business logic leaks into stateless UI components, and directory sprawl. We needed a modular, highly scalable frontend architecture that enforces a clean separation of concerns and clear dependency directions.

## Decision
We adopted the **Feature-Sliced Design (FSD)** architecture. Under FSD, the codebase is partitioned into distinct vertical slices across a set of hierarchical layers:

1. **`app`**: Global configurations, providers, store init, and global styles.
2. **`pages`**: Routing entries that assemble widgets. Contains composition logic only.
3. **`widgets`**: Self-contained UI layout blocks that combine features and entities.
4. **`features`**: Action-oriented components that trigger state mutations (e.g. forms, sliders).
5. **`entities`**: Domain-specific logic (e.g. portfolio, wallet, sessionKey) including query hooks and adapters.
6. **`shared`**: Agnostic building blocks, UI primitives, helper functions, and base client configurations.

### Import Constraints
* **Downward Only**: Higher layers can import from lower layers, but lower layers can *never* import from higher layers (e.g. `shared` cannot import from `entities`).
* **No Cross-Imports at Feature/Entity Levels**: Slices within `features` or `entities` cannot import from peer slices directly. They must coordinate via `widgets` or be extracted into `shared`.

## Alternatives Considered
* **Flat Feature Directories (`src/features/*`)**: Standard in many React projects, but it does not specify internal composition limits. This leads to features importing features, recreating cyclic loops.
* **Component vs. Service Layering (MVVM)**: Hard to scale for web wallets where domain boundaries (wallets, assets, session keys) are tightly integrated yet conceptually distinct.

## Consequences
* **Positives**:
  * Circular dependency issues are structurally resolved.
  * Dependency boundaries make reasoning about code changes straightforward.
  * Pages are simple composition files, reducing clutter.
* **Negatives**:
  * Slightly higher file creation overhead (boilerplate) for small changes.
  * Requires discipline and code reviews to prevent developers from violating cross-import boundaries.

## Future Considerations
Implement a custom ESLint rule or `dependency-cruiser` script in the CI/CD pipeline to programmatically block architectural boundary violations.

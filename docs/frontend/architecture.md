# Frontend Architecture (Feature-Sliced Design)

The frontend follows the **Feature-Sliced Design (FSD)** architecture. FSD structures the source code into layers, slices, and segments to ensure decoupled components.

## 🧱 Architectural Layers
1. **App (`src/app/`):** Defines global configurations, styles (`globals.css`), Redux store, and React Query clients.
2. **Pages (`src/pages/`):** Composite views constructed from widgets and features.
3. **Widgets (`src/widgets/`):** Independent UI sections (e.g. `AssetsOverview`, `LiveActivityFeedWidget`).
4. **Features (`src/features/`):** User interactions with business value (e.g. `auth`, `transaction`).
5. **Entities (`src/entities/`):** Domain models, states, and client endpoints.
6. **Shared (`src/shared/`):** Reusable atomic UI buttons, input forms, and helper functions.

## 📌 FSD Dependency Constraints
* **FSD Imports Hierarchy:** A module inside a layer can only import modules from **lower layers** (e.g. `Pages` can import from `Widgets`, but `Widgets` cannot import from `Pages`).
* **Strict Decoupling:** Cross-slice imports within the same layer are forbidden.

Related Pages:
* [Router Config](routing.md)
* [Reusable Components](components.md)

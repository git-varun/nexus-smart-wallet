# Reusable Components

Reusable components are split between FSD widgets and atomic UI components.

## 🧱 Widgets (`src/widgets/`)
* **AssetsOverview:** Renders tables of ERC20 and NFT balances with loading states.
* **LiveActivityFeedWidget:** Listens to SSE notifications and renders live updates of pending/confirmed UserOperations.
* **SecurityOverview:** Displays registered session keys and their spending limit indicators.
* **DeveloperConsole:** Inspects bundler/paymaster configs.

## ⚛️ Atomic UI (`src/shared/ui/`)
* **Button:** Standard button supporting variations (primary, secondary, outline, danger) and loading spinners.
* **Card:** Zinc-900 grid containers with border details.
* **Dialog:** Accessible modal dialogues.
* **StateView:** Handles standard empty, loading, and error layouts.
* **ProgressTimeline:** Renders progress timelines for transaction lifecycles.

Related Pages:
* [Architecture FSD](architecture.md)
* [Tailwind Design System](design-system.md)

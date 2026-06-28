# ADR-004: Backend-Driven Capability Registry & Feature Gating

## Status
Accepted

## Context
Smart account setups, gas paymasters, bundler services, and session key modules vary across different blockchain networks (Base Sepolia, Ethereum Mainnet, Arbitrum). Hardcoding feature logic (e.g. showing "Session Keys" only if `chainId === 84532`) leads to client code bloat, fragile conditional logic, and requires frontend code releases whenever a capability is added or removed on the backend.

## Decision
We implemented a dynamic, backend-driven **Capability Registry** and dynamic **Feature Gating**:

1. **API Capabilities Query**: The client requests `/api/capabilities` at startup. The backend responds with feature flags, chain details, and supported smart contract factory versions.
2. **Dynamic Context (`CapabilityContext`)**: The registry config is loaded via React Query and bound to a global context provider.
3. **Declarative Gating (`<FeatureGate>`)**: Rather than checking chains or permissions inline, the UI wraps restricted actions or layouts in a declarative wrapper:
   ```tsx
   <FeatureGate feature="sessionKeys" fallback={<StateView status="forbidden" />}>
       <SessionKeyDashboard />
   </FeatureGate>
   ```

## Alternatives Considered
* **Frontend Network Switching Lists**: Hardcoding supported features in a local frontend file like `chains.ts`. Rejected because changes require a redeployment of the static frontend bundle.
* **Inline Conditionals**: Using standard javascript conditionals like `if (selectedChainId === 84532)`. Rejected as it leads to spaghetti logic scattered across components.

## Consequences
* **Positives**:
  * Enables backend toggling of features without changing frontend code.
  * Guarantees that users are never shown interface modules that are unsupported by the underlying network or backend bundlers.
  * Standardizes access-denied screens using the centralized `<FeatureGate>` fallback.
* **Negatives**:
  * Requires a blocking API lookup at initial boot, necessitating loading states.

## Future Considerations
Expand the capability payload to include gas price thresholds so the frontend can dynamically warn users or restrict large transactions if networks are overloaded.

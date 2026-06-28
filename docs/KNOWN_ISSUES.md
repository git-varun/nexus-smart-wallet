# General Availability Known Issues Register

The following minor known behaviors exist in the release candidate, with corresponding operational mitigations:

| Issue | Severity | Impact | Mitigation |
|---|---|---|---|
| **Bcrypt Auth CPU Bound** | Low | Authentication registration throughput is limited to ~30-40 req/s per node container due to standard password hashing work factor. | horizontal scaling of backend API instances; use standard load-balancer routing. |
| **Local Anvil RPC Dependencies** | Low | Integration tests run against an in-memory Mongo database and mock providers. Running against real EVM providers requires active internet connectivity. | Standard mock providers are integrated into Jest tests to ensure local build independence. |

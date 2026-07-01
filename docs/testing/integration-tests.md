# Integration Harness Setup

Integration tests use programmatic database and blockchain runners to simulate real production environments.

## 💾 In-Memory MongoDB Database
* **mongodb-memory-server:** Used to run CRUD test assertions.
* Configured in `database.test.ts` to spin up a temporary database at startup and close the connection pool during teardown.

## ⛓️ Programmatic EVM Blockchain Node (Anvil)
* Spawns an **Anvil** process to verify transaction mining.
* **Launch configuration:**
  ```typescript
  import { spawn } from "child_process";
  const anvilProcess = spawn("anvil", ["--port", "8545", "--chain-id", "1337"]);
  ```
* **Teardown:** Kills the process using `anvilProcess.kill()`.

Related Pages:
* [Testing Strategy](strategy.md)
* [Local Verification Checks](verification.md)

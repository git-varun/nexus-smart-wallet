# Local Verification & Test Commands

Commands to execute the test suite.

## ⚙️ Prerequisites
* Install the **Foundry** toolkit (includes the `anvil` CLI):
  ```bash
  curl -L https://foundry.paradigm.xyz | bash
  foundryup
  ```

## 🚀 Execution Commands
* **Run all backend tests:**
  ```bash
  cd backend && npm test
  ```
* **Run a specific test suite:**
  ```bash
  npx jest tests/integration/concurrency.test.ts
  ```
* **Run Playwright end-to-end tests:**
  ```bash
  cd frontend && npx playwright test
  ```

Related Pages:
* [Testing Strategy](strategy.md)
* [Integration Harness](integration-tests.md)

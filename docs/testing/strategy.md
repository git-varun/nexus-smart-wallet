# Testing Strategy

The testing matrix utilizes **Jest** for unit and integration testing, and **Playwright** for end-to-end browser testing.

## 📁 Test Directories Layout
* **`tests/unit/`:** Contains unit tests checking isolated business rules.
* **`tests/integration/`:** Integrates the database and blockchain nodes.
* **`tests/api/`:** Checks endpoint schemas and validation rules.
* **`tests/mocks/`:** Contains shared mocking helpers.

Related Pages:
* [Integration Harness](integration-tests.md)
* [Playwright Browser tests](playwright.md)

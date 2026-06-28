# Nexus Smart Wallet — Context Index

Authoritative production documentation is located directly inside the `/docs` directory. The legacy context files in this subdirectory have been consolidated and promoted to maintain documentation integrity.

## Authoritative Canonical Documentation Set

| Document Path | Description | When to read |
| :--- | :--- | :--- |
| [README.md](../../README.md) (root) | Setup instructions, architecture overview | Always — start here |
| [docs/architecture_guide.md](../architecture_guide.md) | System overview, worker concurrency queue, and lifecycle states | Implementing backend services and state logic |
| [docs/api_reference.md](../api_reference.md) | Complete REST API endpoint reference and Zod validation rules | Working on API requests and data validation |
| [docs/operations_runbook.md](../operations_runbook.md) | Docker configurations, environment variables, and failover runbook | Deploying or troubleshooting infrastructure |
| [docs/security_guide.md](../security_guide.md) | Cryptographic signature validations, rate limiting, and log redactions | Assessing system security or editing access rules |
| [docs/testing_guide.md](../testing_guide.md) | Jest tests, Anvil local node spawning, and database isolation | Writing unit or integration tests |
| [docs/release_notes.md](../release_notes.md) | Release Candidate 1 (RC1) capabilities and known limitations | Reviewing release progress |
| [docs/production_backlog.md](../production_backlog.md) | Roadmap for KMS signers, passkeys, and dashboard updates | Planning next sprints |
| [CHANGELOG.md](../../CHANGELOG.md) (root) | Semantic Version change log tracking | Checking historical commits |

---

## Legacy Context Files
* **[overview.md](overview.md):** Purpose and basic repository layout.
* *(Other context files have been removed or consolidated into the main guides to prevent duplicate canonical documentation).*

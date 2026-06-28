# Documentation Inventory Report

This report documents the documentation audit performed during Phase 1 and the canonicalization actions executed during this sprint.

---

## 1. Documentation Audit Inventory

| Document Path | Original State | Audit Result | Action Taken |
| :--- | :--- | :--- | :--- |
| `README.md` (root) | Missing | 🔴 Missing | **Created.** Provides quick-start instructions and points to canonical guides. |
| `CHANGELOG.md` (root) | Missing | 🔴 Missing | **Created.** Traces change log history using standard formatting. |
| `backend/docs/production_runbook.md` | Outdated | ⚠️ Outdated | **Consolidated.** Promoted to the canonical operational runbook `docs/operations_runbook.md`. |
| `backend/docs/secrets_management.md` | Current | 🟢 Current | **Retained.** Serves as a reference guide for HSM migration. |
| `docs/context/index.md` | Outdated | ⚠️ Outdated | **Updated.** Now indexes the new canonical document set. |
| `docs/context/overview.md` | Current | 🟢 Current | **Retained.** Left under `/docs/context/` as quick context. |
| `docs/context/architecture.md` | Outdated/Duplicate | 🔴 Duplicate | **Archived.** Fully superseded by `docs/architecture_guide.md`. |
| `docs/context/apis.md` | Outdated/Duplicate | 🔴 Duplicate | **Archived.** Contained legacy REST endpoints; superseded by `docs/api_reference.md`. |
| `docs/context/models.md` | Missing structures | ⚠️ Outdated | **Archived.** Stale schema information superseded by `docs/architecture_guide.md`. |
| `docs/context/tech-stack.md` | Stale Docker details | ⚠️ Outdated | **Archived.** Superseded by `docs/architecture_guide.md` and `docs/operations_runbook.md`. |
| `docs/context/constraints.md` | Inaccurate statements | ⚠️ Outdated | **Archived.** Superseded by `docs/security_guide.md`. |
| `docs/context/classes.md` | Stale service descriptions| ⚠️ Outdated | **Archived.** Superseded by `docs/architecture_guide.md`. |
| `docs/context/integrations.md` | Current | 🟢 Current | **Archived.** Consolidating into canonical guides. |

---

## 2. Established Canonical Document Set

To establish a single canonical source for every architectural and operational topic, the following new guides were created inside the `/docs` directory:

1. **`docs/architecture_guide.md` (Canonical Architecture Guide):** Autoritative guide detailing system modules, queue worker, signing services, transaction lifecycle, session key architecture, and multi-instance notifications.
2. **`docs/api_reference.md` (Canonical API Reference):** Defines route paths, authentication rules, input Zod schemas, responses, error codes, and request/response examples.
3. **`docs/operations_runbook.md` (Deployment & Operations Runbook):** Details environment configurations, CI/CD pipeline structures, health indicators, metrics logs, and incident recovery paths.
4. **`docs/security_guide.md` (Security Architecture Guide):** Explains cryptographic session key verification, relayer protections, JWT authentication, rate limiting, and log redactions.
5. **`docs/testing_guide.md` (Integration & Testing Guide):** Guides unit and integration tests, explaining programmatic Anvil node and Mongo Memory Server testing architectures.
6. **`docs/release_notes.md` (Release Notes):** Summarizes RC1 production capabilities, security remediations, and engineering technical debt.
7. **`docs/production_backlog.md` (Curated Production Backlog):** Curates future enhancements, engineering quality tasks, and operations optimizations.

---

## 3. Historical File Archiving

Outdated duplicate files inside `/docs/context/` have been removed to prevent information fragmentation and maintain document integrity.
Only `/docs/context/index.md` and `/docs/context/overview.md` remain in `/docs/context/` to serve as a quick contextual redirect for developers.
All other context documents are deleted or replaced by the canonical document set.

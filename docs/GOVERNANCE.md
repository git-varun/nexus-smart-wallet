# Nexus Smart Wallet — Repository Governance

This document outlines the branching guidelines, versioning policies, documentation ownership, and architectural change processes for the Nexus Smart Wallet codebase.

---

## 1. Branching Strategy

The repository follows a Git Flow hybrid model to enforce strict production stability:

```text
    master  (Canonical release branch; always stable)
      ▲
      │ (Pull Request via CI checks & Peer approvals)
    develop (Pre-release staging / feature integration)
      ▲
      ├───────────────┬───────────────┐
    feature/auth    feature/assets  hotfix/nonce-low
```

* **`master`**: Contains production-ready code. Commits trigger container compilations and deployment pipelines. Direct pushes are blocked.
* **`develop`**: Integration target for all completed feature branches. Scheduled for release testing.
* **`feature/*`**: Short-lived branches targeting single capabilities (e.g. `feature/session-keys`). Merged into `develop` using squash merges.
* **`hotfix/*`**: Urgent production patches (e.g. queue failures). Merges directly back to both `master` and `develop`.

---

## 2. Versioning Policy

The project enforces **Semantic Versioning 2.0.0 (SemVer)** format: `MAJOR.MINOR.PATCH`.

* **MAJOR**: Architectural changes or contract adjustments that break backward compatibility (e.g., swapping REST API signatures or replacing database collections).
* **MINOR**: New business functionality or features (e.g. implementing Assets or automations dashboards) that are backward-compatible.
* **PATCH**: Backward-compatible security improvements, bug fixes, or performance adjustments.

---

## 3. Architecture Change Process

To prevent architectural drift, any change modifying structural layers (FSD layers, central libraries, client interfaces) must undergo the **Architecture Decision Record (ADR)** workflow:

1. **Proposal**: Create a new ADR document inside `docs/adr/ADR-XXX-subject.md` with status `Proposed`.
2. **Review**: Present the proposed ADR during a design meeting with the engineering team.
3. **Approval**: Upon approval, update the status to `Accepted` and implement the associated code changes.
4. **Deprecation**: If a previous decision is replaced, update the old ADR status to `Superseded` and link it directly to the new record.

---

## 4. Documentation Ownership

Documentation resides in the `/docs` folder as the absolute canonical source of truth:
* Code implementations must match documented interfaces.
* Any change to database schemas, routing parameters, or environment variables requires updates to matching files in `/docs` within the same pull request.
* Code comments and JSDoc tags inside the codebase serve to document code interfaces (classes, interfaces, methods) rather than global architecture.

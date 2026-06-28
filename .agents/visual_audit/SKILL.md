---
name: visual-audit
description: Review visual layout consistency, alignment, color usage, and responsive design across the front‑end.
---

# Visual Audit Skill

## Goal
Detect UI irregularities such as mis‑aligned components, broken grids, inconsistent spacing, and missing design tokens.

## Steps
1. **Start dev server** (`pnpm --filter nexus-smart-wallet-frontend run dev`).
2. **Capture screenshots** of main routes (`/`, `/activity`, `/security`, `/settings`, etc.) with Playwright.
3. **Compare** against design spec (baseline images if available) using pixel‑diff (`pixelmatch`).
4. **Log** any deviation > 5 px as a warning with file and component reference.
5. **Produce report** `visual_audit_report.md` with embedded screenshots and diff highlights.

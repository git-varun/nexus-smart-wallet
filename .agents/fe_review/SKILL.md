---
name: frontend-review
description: A comprehensive skill for performing a front‑end code review, including linting, type‑checking, UI alignment, accessibility, and documentation checks.
---

# Front‑end Review Skill

## Goal
Automate a thorough review of the React/Vite front‑end codebase. The skill should be usable by any Antigravity agent to:
1. **Run static analysis** – lint, type‑check, and detect `any` usage.
2. **Verify React hook dependencies** – ensure `useEffect`/`useMemo` dependency arrays are correct.
3. **Check UI alignment & design consistency** – scan component styles for common layout bugs.
4. **Validate accessibility** – run axe core checks for ARIA violations.
5. **Confirm documentation** – presence of JSDoc/comments for exported symbols.
6. **Produce a concise report** – list findings with file links and line numbers.

## Procedure
1. **Setup**
   - Ensure the workspace root is the project root (`/home/dev-var/Personal/Projects/nexus-smart-wallet`).
   - Install dev dependencies if missing: `pnpm install` (run in `frontend` folder).

2. **Static analysis**
   - Run lint with auto‑fix: `pnpm --filter nexus-smart-wallet-frontend run lint -- --fix`.
   - Run TypeScript type‑check: `pnpm --filter nexus-smart-wallet-frontend run typecheck`.
   - Capture warnings for `@typescript-eslint/no-explicit-any` and other rule violations.

3. **React hook validation**
   - Run ESLint rule `react-hooks/exhaustive-deps` (included in the lint step).
   - Parse the lint output for `missing dependency` or `unnecessary dependency` messages.

4. **UI alignment audit**
   - Start the dev server: `pnpm --filter nexus-smart-wallet-frontend run dev`.
   - Use Playwright or Puppeteer (headless) to take screenshots of the main pages (`/`, `/activity`, `/security`).
   - Compare against a baseline (if available) or run CSS validation via `stylelint`.
   - Flag any element with `overflow: hidden` or mis‑aligned flex/grid items.

5. **Accessibility check**
   - Install `@axe-core/playwright` and run: `pnpm axe:check` (custom script). Collect any violations.

6. **Documentation audit**
   - Search for exported functions/components lacking JSDoc: `grep -R "export function" src | grep -v "/**"`.
   - List missing documentation entries.

7. **Report generation**
   - Aggregate all findings into a markdown artifact `frontend_review_report.md`.
   - Include clickable links: `[file.ts](file:///absolute/path/to/file.ts#L10-L20)`.
   - Summarize severity (error, warning, suggestion).

## Expected Output
A markdown report with sections:
- **Lint & TypeScript warnings**
- **React Hook issues**
- **UI alignment observations** (screenshots embedded)
- **Accessibility violations**
- **Documentation gaps**

The skill should be invoked by agents with the command `invoke_subagent` or by directly calling the defined steps.

## Notes
- The skill assumes a Unix‑like environment with `pnpm` available.
- Network access is not required; all checks run locally.
- If any step fails, abort and surface the error to the user.

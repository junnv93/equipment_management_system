# Evaluation: analytics-role-prop-convention

Status: PASS

## Evidence

- Reviewed `.claude/contracts/analytics-role-prop-convention.md`.
- Confirmed `apps/frontend/lib/analytics/track.ts` documents `role` / `permission` / `teamId` style props as convention-forbidden analytics props, while explicitly keeping them out of the direct PII deny-list.
- Confirmed direct PII deny-list behavior remains intact for identifying keys including `userId` and `email`; `apps/frontend/lib/analytics/__tests__/track.test.ts` covers DEV throws and no dispatch for both keys.
- Searched production `track()` call sites under `apps/frontend/app`, `apps/frontend/components`, `apps/frontend/hooks`, and `apps/frontend/lib`:
  - `rg -n "track\s*\(" apps/frontend/app apps/frontend/components apps/frontend/hooks apps/frontend/lib --glob '!**/__tests__/**' --glob '!**/*.test.*' --glob '!**/*.spec.*'`
  - Inspected call props; production callers pass state/count/dialog/action/inspection/template metadata, not `role`, `userRole`, `permission`, or `teamId` analytics props.

## Commands

- `pnpm --filter frontend test -- track.test.ts bridge.test.ts events.test.ts`
  - PASS: 3 suites passed, 11 tests passed.
- `pnpm --filter frontend run type-check`
  - PASS.

## Residual Risks

- The `role` / `permission` / `teamId` rule is currently a documented caller convention, not a runtime deny-list or lint rule. Future production call sites still rely on review/search discipline unless a static guard is added.

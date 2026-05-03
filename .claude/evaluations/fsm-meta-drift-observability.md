# fsm-meta-drift-observability Evaluation

## Result

PASS

## Evidence

- Added `apps/frontend/lib/observability/fsm-meta-drift.ts`.
- Updated `apps/frontend/lib/api/checkout-api.ts` so list/detail checkout responses send missing-`meta` drift through `recordFsmMetaDrift()`.
- Added `apps/frontend/lib/observability/__tests__/fsm-meta-drift.test.ts` covering development console behavior, production client monitoring, and optional Sentry breadcrumb emission.
- Updated `apps/frontend/tsconfig.json` to exclude Playwright config variants from application type-check, matching the existing `playwright.config.ts` exclusion and unblocking `tsc --noEmit`.

## Commands

- `pnpm --filter frontend exec prettier --write lib/observability/fsm-meta-drift.ts lib/observability/__tests__/fsm-meta-drift.test.ts lib/api/checkout-api.ts`
- `pnpm --filter frontend exec eslint lib/observability/fsm-meta-drift.ts lib/observability/__tests__/fsm-meta-drift.test.ts lib/api/checkout-api.ts`
- `pnpm --filter frontend test -- fsm-meta-drift.test.ts --runInBand`
- `pnpm --filter frontend exec prettier --write tsconfig.json`
- `pnpm --filter frontend run type-check`

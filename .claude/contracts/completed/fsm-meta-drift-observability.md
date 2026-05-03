# fsm-meta-drift-observability

## Scope

- Replace frontend-only dev console drift detection with a reusable observability helper.
- Preserve local developer visibility for missing checkout `meta`.
- In production, route FSM drift to existing client monitoring and add a Sentry breadcrumb when a runtime Sentry integration is present.

## Acceptance

- `checkoutApi.getCheckouts()` records `endpoint: list` when a checkout row has missing `meta`.
- `checkoutApi.getCheckout()` records `endpoint: detail` when a checkout detail response has missing `meta`.
- Development keeps the existing `console.warn('[FSM drift] meta missing', checkoutId)` behavior.
- Production calls `reportError()` with `page: checkouts`, `action: fsm_meta_drift`, `severity: warning`, and structured event data.
- If `globalThis.Sentry.addBreadcrumb` exists, the helper emits `{ category: 'fsm', message: 'meta missing', level: 'warning', data }`.

## Verification

- `pnpm --filter frontend exec prettier --write lib/observability/fsm-meta-drift.ts lib/observability/__tests__/fsm-meta-drift.test.ts lib/api/checkout-api.ts`
- `pnpm --filter frontend exec eslint lib/observability/fsm-meta-drift.ts lib/observability/__tests__/fsm-meta-drift.test.ts lib/api/checkout-api.ts`
- `pnpm --filter frontend test -- fsm-meta-drift.test.ts --runInBand`
- `pnpm --filter frontend run type-check`

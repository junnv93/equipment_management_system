# monitoring-auth-404-alert-rule Evaluation

## Result

PASS

## Evidence

- `apps/backend/src/modules/monitoring/monitoring.service.ts` now checks normalized endpoints for `/api/auth/*` 404 responses and emits `NextAuth route reached backend and returned 404`.
- The warning includes structured `endpoint` and `statusCode` metadata.
- Existing request counters and Prometheus metric calls still run through `recordHttpRequest()`.
- `apps/backend/src/modules/monitoring/__tests__/monitoring.service.spec.ts` verifies `/api/auth/*` 404 warns and `/api/auth/*` 2xx does not warn.

## Verification

- `pnpm --filter backend test -- monitoring.service.spec.ts` — PASS, 17 tests
- `pnpm --filter backend run type-check` — PASS

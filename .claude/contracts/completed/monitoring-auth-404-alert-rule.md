# monitoring-auth-404-alert-rule

## Scope

Close `monitoring-middleware-auth-404-alert-rule`.

## MUST

- Detect backend 404 responses for `/api/auth/*`.
- Emit a structured warning that can be picked up by backend logs/monitoring.
- Preserve normal HTTP request counting and metrics behavior.
- Do not warn for successful `/api/auth/*` responses.
- Add focused unit coverage.

## Verification

- `pnpm --filter backend test -- monitoring.service.spec.ts`
- `pnpm --filter backend run type-check`

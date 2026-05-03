# Contract: analytics-events-registry-production-callers

## Scope

Close tech-debt item `analytics-events-other-domains-pending`.

## MUST

- Production analytics callers must not pass raw string event names to `track()`.
- Sidebar toggle analytics must be registered in `ANALYTICS_EVENTS`.
- Existing sidebar checkouts click analytics must remain registered.
- Focused frontend analytics registry test passes.
- Frontend type-check passes.

## SHOULD

- Leave `track.ts` low-level string API intact for dispatch flexibility.
- Do not introduce external telemetry listener behavior.

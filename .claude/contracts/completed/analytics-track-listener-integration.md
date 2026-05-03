# Contract: analytics-track-listener-integration

## Scope

Close tracker item `analytics-track-listener-integration`.

## MUST

- Register a client-side listener for `app:analytics` during app provider mount.
- Preserve `track()` as the single event emission entry point.
- Forward analytics events to common external sinks when present:
  - `window.gtag`
  - `window.dataLayer`
- When no external sink exists, the listener MUST be a no-op and MUST NOT break navigation.
- Do not add PII fields or weaken the existing `track()` deny-list.
- Add focused unit coverage for the listener behavior.

## Verification

- Run focused analytics tests.
- Run `pnpm --filter frontend run type-check`.
- Harness evaluator must return PASS before moving this contract to `completed/`.

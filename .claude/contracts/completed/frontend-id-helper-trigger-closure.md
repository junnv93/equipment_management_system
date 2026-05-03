# Contract: frontend-id-helper-trigger-closure

## Scope

Close stale tracker item `frontend-id-helper-격상` by verification.

## MUST

- Frontend production code MUST NOT generate persistent domain IDs client-side for API writes.
- Allowed non-trigger cases:
  - CSP nonce generation in `apps/frontend/proxy.ts`.
  - Optimistic UI-only temporary IDs such as `temp-*`, which are replaced by server data.
  - E2E/test fixture uniqueness strings.
- If no persistent frontend domain ID generation exists, no frontend identifier helper is required.
- No product behavior changes are required for this closure.

## Verification

- Search frontend production code for `randomUUID`, `crypto.random`, `Math.random`, `Date.now`, `temp-*`, and optimistic ID creation.
- Run frontend type-check.
- Harness evaluator must return PASS before moving this contract to `completed/`.

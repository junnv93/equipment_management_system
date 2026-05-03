# Contract: analytics-role-prop-convention

## Scope

Close tracker item `analytics PII deny-list 'role' 정책 명시`.

## MUST

- `track.ts` MUST clearly document that `role` / `permission` style props are not strict direct PII keys but must not be sent as analytics props by convention.
- The existing direct PII deny-list behavior MUST remain unchanged for identifying keys such as `userId` and `email`.
- Production analytics callers MUST NOT pass `role`, `userRole`, `permission`, or `teamId` props to `track()`.
- Focused analytics tests and frontend type-check MUST pass.

## SHOULD

- Keep this as a convention/documentation closure, not a product analytics policy change.

## Verification

- Search production analytics `track()` call sites for role/permission/team props.
- Run focused analytics tests.
- Run `pnpm --filter frontend run type-check`.
- Harness evaluator must return PASS before moving this contract to `completed/`.

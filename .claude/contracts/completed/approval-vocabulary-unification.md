# Contract: approval-vocabulary-unification

## Scope

Close tech-debt item `approval-vocabulary-unification`.

## MUST

- Remove the stale approval vocabulary split between `components/admin/approval-constants.ts` and `lib/api/approvals-api.ts`.
- Preserve active approval API imports through the `approvals-api` barrel and schema SSOT.
- Verify no frontend caller imports the removed legacy constants file.

## SHOULD

- Avoid broad approval-domain refactors.

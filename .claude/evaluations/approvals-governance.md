# Evaluation: approvals-governance

**Date**: 2026-05-04
**Verdict**: PASS after repair
**Iterations**: 2

## Iteration 1

Independent evaluator result: FAIL on M6.

Finding: approval analytics `averageProcessingDays` matched `disposal_requests.id` against
`audit_logs.entity_id`, but disposal approval audit logs use `entityType='equipment'` and
`entityIdPath='params.equipmentId'`.

## Repair

`apps/backend/src/modules/approvals/approvals.service.ts` now resolves analytics source timestamps
with entity-type-qualified subqueries and handles disposal through
`disposal_requests.equipment_id = audit_logs.entity_id`.

Frontend static `ROLE_TABS` export was removed from `apps/frontend/lib/api/approvals/types.ts` and
the approvals page/dashboard now consume `/api/approvals/categories`.

## Final MUST Status

| Criterion | Verdict |
|-----------|---------|
| M1 lab_manager self_inspection category | PASS |
| M2 DB-backed role category override with fallback | PASS |
| M3 Zod validation for role/category settings | PASS |
| M4 approval_delegations schema + migration | PASS |
| M5 delegation list/create/revoke APIs | PASS |
| M6 analytics API scoped server aggregation | PASS |
| M7 frontend API barrel exports governance APIs | PASS |
| M8 approvals page analytics rendering | PASS |
| M9 PendingCountsByCategory key regression | PASS |
| M10 tech-debt tracker closure evidence | PASS |

## Verification Commands

- `pnpm --filter backend exec tsc --noEmit` — PASS
- `pnpm --filter frontend exec tsc --noEmit` — PASS
- `pnpm --filter backend exec jest src/modules/approvals/__tests__/approvals.service.spec.ts --runInBand` — PASS
- `rg -n "ROLE_TABS" apps/frontend/lib apps/frontend/components apps/frontend/app apps/backend/src/modules/approvals apps/backend/src/modules/settings` — no runtime hits

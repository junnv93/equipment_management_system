# e2e-soft-fork-apply-forward-submit

## Scope

- Close the inspection-template soft-fork submit coverage gap without adding a flaky browser race.
- Add parent RTL coverage for the missing submit handoff: `apply_forward` → template version+1 mutation → inspection create.
- Extend wf-19f browser coverage so a permission-bearing user can submit `apply_forward` and the database observes template v+1 plus inspection creation.

## Acceptance

- `InspectionFormDialog` opens `SoftForkDialog` when the current form structure differs from the latest template.
- Choosing `apply_forward` calls `useUpsertTemplate` with:
  - `inspectionType: intermediate`
  - `version: latestTemplate.version + 1`
  - `supersededBy: latestTemplate.id`
  - `forkChoice: apply_forward`
  - the current edited structure
- On successful template upsert, the original pending inspection DTO is submitted via `createByEquipment`.
- `wf-19f-soft-fork-decision.spec.ts` declares a browser scenario for `system_admin` choosing default `apply_forward`; after submit, DB state shows one non-seed intermediate inspection and latest template version 2.

## Verification

- `pnpm --filter frontend exec eslint components/inspections/__tests__/InspectionFormDialog.softfork.test.tsx`
- `pnpm --filter frontend test -- InspectionFormDialog.softfork.test.tsx --runInBand`
- `pnpm --filter frontend exec prettier --write tests/e2e/workflows/wf-19f-soft-fork-decision.spec.ts`
- `pnpm --filter frontend exec eslint tests/e2e/workflows/wf-19f-soft-fork-decision.spec.ts` (ignored by current frontend ESLint config; no errors)
- `pnpm --filter frontend exec playwright test tests/e2e/workflows/wf-19f-soft-fork-decision.spec.ts --list`

# e2e-soft-fork-apply-forward-submit Evaluation

## Result

PASS

## Evidence

- Added `apps/frontend/components/inspections/__tests__/InspectionFormDialog.softfork.test.tsx`.
- The new parent RTL spec edits a template-prefilled inspection item, submits, chooses `apply_forward`, and asserts the template mutation receives `version: 4` from latest template `v3`.
- The same spec asserts inspection creation is called only after the template upsert success callback.
- Extended `apps/frontend/tests/e2e/workflows/wf-19f-soft-fork-decision.spec.ts` with `WF-19f-3`, where `system_admin` edits the prefilled form structure, accepts default `apply_forward`, submits, and DB checks confirm one non-seed inspection plus latest template version 2.
- Playwright `--list` registers the new scenario across chromium, firefox, webkit, Mobile Chrome, and Mobile Safari.

## Commands

- `pnpm --filter frontend exec prettier --write components/inspections/__tests__/InspectionFormDialog.softfork.test.tsx`
- `pnpm --filter frontend exec eslint components/inspections/__tests__/InspectionFormDialog.softfork.test.tsx`
- `pnpm --filter frontend test -- InspectionFormDialog.softfork.test.tsx --runInBand`
- `pnpm --filter frontend exec prettier --write tests/e2e/workflows/wf-19f-soft-fork-decision.spec.ts`
- `pnpm --filter frontend exec eslint tests/e2e/workflows/wf-19f-soft-fork-decision.spec.ts`
- `pnpm --filter frontend exec playwright test tests/e2e/workflows/wf-19f-soft-fork-decision.spec.ts --list`

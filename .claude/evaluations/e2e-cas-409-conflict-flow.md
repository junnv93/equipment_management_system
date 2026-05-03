# e2e-cas-409-conflict-flow Evaluation

## Result

PASS

## Evidence

- Added `apps/frontend/components/inspections/__tests__/InspectionFormDialog.softfork.test.tsx`.
- The CAS test forces `useUpsertTemplate` to invoke `onError({ statusCode: 409 })` while `isConflictError` returns true.
- Assertions cover destructive toast copy, `queryKeys.inspectionTemplate.latest('equipment-1', 'intermediate')` invalidation, and no inspection creation.

## Commands

- `pnpm --filter frontend exec prettier --write components/inspections/__tests__/InspectionFormDialog.softfork.test.tsx`
- `pnpm --filter frontend exec eslint components/inspections/__tests__/InspectionFormDialog.softfork.test.tsx`
- `pnpm --filter frontend test -- InspectionFormDialog.softfork.test.tsx --runInBand`

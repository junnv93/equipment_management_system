# e2e-cas-409-conflict-flow

## Scope

- Close the inspection-template CAS 409 UX coverage gap at the parent component boundary.
- Avoid browser-level concurrent-edit simulation because the tracker already identifies that as race-prone.
- Verify the observable behavior owned by `InspectionFormDialog`.

## Acceptance

- During `apply_forward`, a 409-like error recognized by `isConflictError`:
  - shows the soft-fork conflict toast copy,
  - invalidates the latest inspection-template query for the equipment and inspection type,
  - does not submit the pending inspection.
- The pending DTO remains preserved by component behavior for retry.

## Verification

- `pnpm --filter frontend exec eslint components/inspections/__tests__/InspectionFormDialog.softfork.test.tsx`
- `pnpm --filter frontend test -- InspectionFormDialog.softfork.test.tsx --runInBand`

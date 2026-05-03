# e2e-gallery-ui-auto-show Evaluation

## Result

PASS

## Evidence

- Added `apps/frontend/components/inspections/__tests__/InspectionFormDialog.gallery.test.tsx`.
- The test renders `InspectionFormDialog` with:
  - equipment query resolved,
  - latest template hook returning 404/missing,
  - gallery hook returning one matched template,
  - skip flag disabled.
- The assertion waits until the mocked `TemplateGallery` receives `open=true` and the matched item list.

## Verification

```bash
pnpm --filter frontend test -- InspectionFormDialog.gallery.test.tsx --runInBand
```

Result: 1 suite / 1 test PASS.


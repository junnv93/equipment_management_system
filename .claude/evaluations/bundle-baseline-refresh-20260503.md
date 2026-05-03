# Evaluation: bundle-baseline-refresh-20260503

> **Date**: 2026-05-03
> **Result**: PASS

## Results

| ID | Result | Evidence |
|----|--------|----------|
| M1 | PASS | `pnpm measure:bundle` completed. It generated `apps/frontend/.next/analyze/client.json` and saved `scripts/bundle-baseline-checkouts.json` with `generatedAt: "2026-05-03"` and total checkouts gzip 66.30 kB. |
| M2 | PASS | `node scripts/check-bundle-size.mjs --baseline` saved `scripts/bundle-baseline.json` with `generatedAt: "2026-05-03"`, `measurementSource: "build-artifacts"`, shared root main 126.36 kB, 74 routes, max route 154.63 kB. |
| M3 | PASS | `scripts/measure-bundle.mjs` now runs `pnpm --filter frontend exec next build --webpack`, matching Next 16 analyzer guidance. |
| M4 | PASS | Invalid skeleton named exports were removed from route page modules. The remaining page named exports are Next-allowed `metadata` and `generateMetadata`. |
| M5 | PASS | The three tracker items `bundle-size-baseline`, `bundle-size-baseline-after-axios-baseurl-simplification`, and `bundle-baseline-update` are closed with shared bundle evidence. |
| S1 | PASS | Skeleton reuse moved to colocated files and `loading.tsx` imports those files directly. |
| S2 | PASS | The normal frontend build script remains unchanged; the webpack mode is isolated to analyzer measurement. |

## Build Fixes Required For Measurement

- `scripts/measure-bundle.mjs`: switched analyzer build to `next build --webpack` because Next 16 Turbopack does not emit webpack-bundle-analyzer JSON.
- `apps/frontend/app/(dashboard)/equipment/create/CreateEquipmentFormSkeleton.tsx`: moved invalid page named export out of `page.tsx`.
- `apps/frontend/app/(dashboard)/teams/create/CreateTeamPageSkeleton.tsx`: moved invalid page named export out of `page.tsx`.
- `apps/frontend/app/(dashboard)/reports/calibration-factors/CalibrationFactorsLoadingSkeleton.tsx`: moved invalid page named export out of `page.tsx`.

## Commands

```bash
pnpm measure:bundle
# PASS — checkouts gzip total 66.30 kB, baseline saved

node scripts/check-bundle-size.mjs --baseline
# PASS — 74 routes, max 154.63 kB, baseline saved

rg -n "^export (function|const|class|async function)" apps/frontend/app -g page.tsx
# PASS — only metadata/generateMetadata exports remain
```

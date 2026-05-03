# phase-4-6-sparkline-trend-api

## Scope

Close `phase-4-6-sparkline-trend-api`.

## MUST

- Extend the shared checkout summary contract with 14-day KPI trend arrays.
- Populate outbound summary trends from backend checkout data.
- Keep summary fallbacks type-complete.
- Replace the outbound `SparklineMini` empty-array placeholder with real summary trend data.
- Derive the `trend` prop from the returned time-series values.

## Verification

- `pnpm --filter @equipment-management/schemas build`
- `pnpm --filter backend run type-check`
- `pnpm --filter backend test -- checkouts.service.spec.ts --runTestsByPath src/modules/checkouts/__tests__/checkouts.service.spec.ts`
- `pnpm --filter frontend exec eslint 'app/(dashboard)/checkouts/page.tsx' 'app/(dashboard)/checkouts/tabs/OutboundCheckoutsTab.tsx'`

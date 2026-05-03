# checkout-summary-delay-meta

## Scope

Close `phase-4-5-checkout-summary-extension`.

## MUST

- Extend the shared `CheckoutSummary` type with `avgDelayDays` and `maxOverdueDays`.
- Populate both fields from backend checkout summary aggregation.
- Keep SSR/default summary fallbacks type-complete.
- Render overdue hero KPI meta copy using the new fields.
- Add ko/en i18n strings for the meta copy.

## Verification

- `pnpm --filter @equipment-management/schemas build`
- `pnpm --filter backend run type-check`
- `pnpm --filter frontend run type-check`

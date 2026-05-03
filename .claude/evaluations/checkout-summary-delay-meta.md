# checkout-summary-delay-meta Evaluation

## Result

PASS

## Evidence

- `packages/schemas/src/checkout.ts` now includes `avgDelayDays` and `maxOverdueDays` on `CheckoutSummary`.
- `apps/backend/src/modules/checkouts/checkouts.service.ts#getSummary()` computes both values from current overdue and late-returned checkouts.
- `apps/frontend/app/(dashboard)/checkouts/page.tsx` fallback summaries include the new fields.
- `apps/frontend/components/checkouts/HeroKPI.tsx` supports a `meta` slot.
- `apps/frontend/app/(dashboard)/checkouts/tabs/OutboundCheckoutsTab.tsx` renders overdue hero meta with average delay and max overdue days.
- `apps/frontend/messages/{ko,en}/checkouts.json` include `outbound.overdueMeta`.

## Verification

- `pnpm --filter @equipment-management/schemas build` — PASS
- `pnpm --filter backend run type-check` — PASS
- `pnpm --filter frontend run type-check` — PASS

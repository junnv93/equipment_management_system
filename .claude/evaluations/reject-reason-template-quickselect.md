# reject-reason-template-quickselect Evaluation

## Result

PASS

## Evidence

- `apps/frontend/lib/api/checkout-api.ts` now includes `RejectionPreset` and `checkoutApi.getRejectionPresets()`.
- `apps/frontend/components/approvals/RejectModal.tsx` no longer maps the five hardcoded `TEMPLATE_KEYS`; it fetches presets from the backend route and renders their labels/templates in the quick-select.
- `apps/frontend/components/approvals/__tests__/RejectModal.test.tsx` mocks backend presets and verifies selecting a DB-backed preset fills the rejection reason textarea.
- Existing backend evidence:
  - `apps/backend/drizzle/0047_add_rejection_presets.sql`
  - `apps/backend/src/modules/checkouts/checkouts.controller.ts#getRejectionPresets`
  - `apps/backend/src/modules/checkouts/checkouts.service.ts#getRejectionPresets`

## Commands

- `pnpm --filter frontend exec prettier --write components/approvals/RejectModal.tsx components/approvals/__tests__/RejectModal.test.tsx lib/api/checkout-api.ts`
- `pnpm --filter frontend exec eslint components/approvals/RejectModal.tsx components/approvals/__tests__/RejectModal.test.tsx lib/api/checkout-api.ts`
- `pnpm --filter frontend test -- RejectModal.test.tsx --runInBand`
- `pnpm --filter frontend run type-check`

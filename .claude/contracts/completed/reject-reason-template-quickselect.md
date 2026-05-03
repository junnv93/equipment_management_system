# reject-reason-template-quickselect

## Scope

- Remove the approvals reject modal dependency on five hardcoded i18n rejection templates.
- Use the existing backend `rejection_presets` table and `GET /api/checkouts/rejection-presets` route as the preset source.
- Keep direct input available and preserve the existing rule that selecting a preset does not overwrite a reason the user already typed.

## Acceptance

- Frontend checkout API exposes `getRejectionPresets()`.
- `RejectModal` loads presets when the modal is open and templates are shown.
- Preset select options are populated from DB-backed backend response labels/templates.
- Selecting a preset fills the textarea when the textarea is still empty.
- Focused test covers the DB-backed preset path.

## Verification

- `pnpm --filter frontend exec prettier --write components/approvals/RejectModal.tsx components/approvals/__tests__/RejectModal.test.tsx lib/api/checkout-api.ts`
- `pnpm --filter frontend exec eslint components/approvals/RejectModal.tsx components/approvals/__tests__/RejectModal.test.tsx lib/api/checkout-api.ts`
- `pnpm --filter frontend test -- RejectModal.test.tsx --runInBand`
- `pnpm --filter frontend run type-check`

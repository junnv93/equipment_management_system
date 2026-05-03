# Contract: nc-design-review-phases-eslint-disable-cleanup

## Scope

Close tracker item `nc-design-review-phases-eslint-disable-2건`.

## MUST

- Remove the two targeted `no-restricted-syntax` `self-audit-exception` comments from:
  - `apps/frontend/components/non-conformances/NCDocumentsSection.tsx`
  - `apps/frontend/components/non-conformances/CreateNonConformanceForm.tsx`
- Preserve current `Promise.allSettled` partial-failure behavior.
- Continue counting rejected uploads correctly.
- Do not change NC upload UX, API calls, permissions, or i18n keys.

## Verification

- Run focused frontend lint for the two files, or the closest available frontend lint command.
- Run `pnpm --filter frontend run type-check`.
- Harness evaluator must return PASS before moving this contract to `completed/`.

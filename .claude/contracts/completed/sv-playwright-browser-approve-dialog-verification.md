# sv-playwright-browser-approve-dialog-verification

## Status

Completed on 2026-05-03.

## Scope

- Add browser-level Playwright coverage for software validation approval dialogs:
  - `approveDialog`: technical manager opens the dialog, enters a review comment, confirms approval, and the backend record stores the comment.
  - `qualityApproveDialog`: quality manager opens the dialog, enters a review comment, confirms final approval, and the backend record stores the comment.
- Keep the existing WF-14b API workflow untouched; this contract covers the missing UI/browser path.

## Deliverables

- Added `apps/frontend/tests/e2e/workflows/wf-14c-software-validation-approve-dialog.spec.ts`.
- The spec creates isolated test software/validation records through existing E2E helpers, then exercises the real validation list page dialogs.

## Verification

- `pnpm --filter frontend exec prettier --write tests/e2e/workflows/wf-14c-software-validation-approve-dialog.spec.ts`
- `pnpm --filter frontend exec eslint tests/e2e/workflows/wf-14c-software-validation-approve-dialog.spec.ts`
  - Result: no errors; the E2E file is ignored by the configured ESLint ignore pattern.
- `pnpm --filter frontend exec playwright test tests/e2e/workflows/wf-14c-software-validation-approve-dialog.spec.ts --list`
  - Result: both dialog scenarios are listed under every configured browser project.

## Notes

- Full browser execution still requires the local dev server, backend, database seed, and storageState setup. The missing tracked artifact was the Playwright browser scenario, now present and loadable.

# dday-baseline-png-initial-capture

## Status

Completed on 2026-05-03.

## Scope

- Generate the initial D-day 6-level visual regression baseline PNGs.
- Keep the fixture dev-only while making it routable by Next.js App Router.

## Deliverables

- Moved the D-day fixture from the private App Router folder `app/(dashboard)/__visual__/dday` to the routable dev-only path `app/(dashboard)/visual-fixtures/dday`.
- Updated `apps/frontend/tests/e2e/visual/dday-6level.spec.ts` to use `/visual-fixtures/dday`.
- Added a `.gitignore` exception for `apps/frontend/tests/e2e/visual/**/*.png` so visual baselines can be committed while other debug PNGs remain ignored.
- Generated 12 baseline PNGs under `apps/frontend/tests/e2e/visual/dday-6level.spec.ts-snapshots/`:
  - 6 levels × light theme.
  - 6 levels × dark theme.

## Verification

- `pnpm --filter frontend exec prettier --write 'app/(dashboard)/visual-fixtures/dday/page.tsx' tests/e2e/visual/dday-6level.spec.ts`
- `pnpm --filter frontend exec eslint 'app/(dashboard)/visual-fixtures/dday/page.tsx' tests/e2e/visual/dday-6level.spec.ts`
  - Result: no errors; the E2E spec is ignored by the existing ESLint ignore pattern.
- `PLAYWRIGHT_BASE_URL=http://localhost:3101 pnpm --filter frontend exec playwright test --config playwright.visual.config.ts visual/dday-6level --project=chromium --update-snapshots --reporter=list`
  - Result: 12 passed.
- `find apps/frontend/tests/e2e/visual/dday-6level.spec.ts-snapshots -type f -name '*.png' | wc -l`
  - Result: 12.

## Notes

- The old `__visual__` directory name started with `_`, so Next.js treated it as a private folder and returned 404. The new `visual-fixtures` route preserves the production `notFound()` guard without using a private folder name.

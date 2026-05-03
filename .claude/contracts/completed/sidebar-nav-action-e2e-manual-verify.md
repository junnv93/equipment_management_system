# sidebar-nav-action-e2e-manual-verify

## Status

Completed on 2026-05-03.

## Scope

- Convert the previously blocked sidebar navigation manual check into a repeatable Playwright harness.
- Verify the runtime regression targets for `NavRowWithSecondaryAction` on the real `/checkouts` route:
  - hydration / nested-anchor console violations are zero.
  - `aside#desktop-sidebar` contains zero nested anchors (`a a`).
  - keyboard Tab order moves from the main `/checkouts` anchor to the secondary `view=yourTurn` anchor.

## Deliverables

- Added `apps/frontend/playwright.sidebar.config.ts` as a frontend-only sidebar harness config without the default backend seeding global setup.
- Updated `apps/frontend/tests/e2e/features/layout/sidebar-nav-action.spec.ts` so `/api/checkouts/pending-count` is stubbed to `{ count: 1 }`, making the secondary anchor deterministic instead of seed-dependent.

## Verification

- `pnpm --filter frontend exec prettier --write playwright.sidebar.config.ts tests/e2e/features/layout/sidebar-nav-action.spec.ts`
- `pnpm --filter frontend exec eslint playwright.sidebar.config.ts tests/e2e/features/layout/sidebar-nav-action.spec.ts`
  - Result: no errors; the E2E spec is ignored by the existing ESLint ignore pattern.
- `PLAYWRIGHT_BASE_URL=http://localhost:3101 pnpm --filter frontend exec playwright test --config playwright.sidebar.config.ts --reporter=list`
  - Result: 3 passed.

## Notes

- The harness still needs a running frontend dev server and existing storageState.
- The backend was intentionally not required for this focused regression check; the pending-count API response is fixed in Playwright to cover the secondary-anchor path deterministically.

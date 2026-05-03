# Evaluation: playwright-trace-on-failure-policy

## Result

Pass.

## Evidence

- `dday-6level.spec.ts` now applies file-level `test.use({ trace: 'retain-on-failure' })`.
- `group-indeterminate.spec.ts` now includes `trace: 'retain-on-failure'` in its file-level `test.use` block with the existing auth state.
- Static grep found both `trace: 'retain-on-failure'` settings.
- `pnpm --filter frontend exec playwright test tests/e2e/visual/dday-6level.spec.ts tests/e2e/features/checkouts/group-indeterminate.spec.ts --list` discovered 81 tests across setup plus the two target specs.

## Notes

- This closes the stale Open tracker item without changing the global Playwright default of `on-first-retry`.

# Contract — E2E Suite-27 Equipment Import Auto Checkout Tracking

## MUST (blocking)

- [ ] `pnpm tsc --noEmit` clean across workspace (0 errors)
- [ ] `pnpm --filter backend run test` passes ≥ 551 tests (no backend source changes expected)
- [ ] New suite `apps/frontend/tests/e2e/features/checkouts/suite-27-import-return-checkout/` runs on chromium, all non-fixme cases PASS
- [ ] Every `test.describe` / `beforeEach` includes chromium project gating
- [ ] `test.describe.configure({ mode: 'serial' })` applied
- [ ] Any VERSION_CONFLICT reference uses `ErrorCode.VersionConflict` from `@equipment-management/schemas` — no local literals
- [ ] `git diff apps/backend/src/database` EMPTY
- [ ] `git diff packages/db/src/schema` EMPTY
- [ ] No hardcoded equipment/import UUIDs — imports are created dynamically per test
- [ ] New helpers live in `checkout-helpers.ts` only; no duplication of `workflow-helpers.ts` signatures (grep before add)
- [ ] Helper additions reuse `getCheckoutPool()` / `getBackendToken()` patterns
- [ ] Every `test.fixme` cites a specific backend `file:line` in a comment directly above
- [ ] Suite-23/24/25/26 each pass standalone after suite-27 addition
- [ ] Permission role assertions use SSOT role strings via existing `getBackendToken(page, role)` helper — no hand-rolled JWT

## SHOULD (non-blocking)

- [ ] `docs/manual/checkout-import-scenarios.md` updated: 시나리오 3 의 🔴 "자동 Checkout 생성" 항목이 suite-27 로 커버됨을 명시 + S27-01~04 의 상태 전이 매트릭스 추가
- [ ] `afterEach` cancels any auto-checkout still active + clears backend cache
- [ ] `afterAll` runs `cleanupCheckoutPool`
- [ ] Spec header explicitly documents complementary relationship to WF-13 (no duplication pretense)
- [ ] Test names follow suite-26 Korean-prefixed style

## Verification Commands

```bash
pnpm tsc --noEmit
pnpm --filter backend run test
pnpm --filter frontend exec playwright test --project=chromium tests/e2e/features/checkouts/suite-27-import-return-checkout
pnpm --filter frontend exec playwright test --project=chromium tests/e2e/features/checkouts/suite-23-cross-site-rbac
pnpm --filter frontend exec playwright test --project=chromium tests/e2e/features/checkouts/suite-24-cancel-equipment-recovery
pnpm --filter frontend exec playwright test --project=chromium tests/e2e/features/checkouts/suite-25-cas-concurrent-approval
pnpm --filter frontend exec playwright test --project=chromium tests/e2e/features/checkouts/suite-26-shared-equipment
git diff --exit-code apps/backend/src/database
git diff --exit-code packages/db/src/schema
```

## Out of Scope

- Backend code changes (feature already implemented)
- Seed modification
- Frontend UI changes
- Non-rental (`internal_shared`) sourceType flow — separate follow-up
- WF-13 refactoring — leave untouched

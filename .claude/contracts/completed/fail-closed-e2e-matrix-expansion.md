# Contract: fail-closed-e2e-matrix-expansion

> **Slug**: `fail-closed-e2e-matrix-expansion`
> **Created**: 2026-05-03
> **Mode**: stale tech-debt closure harness

## Scope

Close the stale Open tracker item that claimed `fail-closed.spec.ts` still had 12 cases and needed expansion to 20 cases. Current code already contains the 20-case fail-closed matrix, and the earlier `checkout-meta-fail-closed` contract/evaluation records this S3 evidence.

## MUST

| ID | Requirement | Evidence |
|----|-------------|----------|
| M1 | The fail-closed E2E spec declares the 20-case matrix. | `fail-closed.spec.ts` header says `시나리오 매트릭스 (20건)`. |
| M2 | The spec contains FC-01 through FC-20 test cases. | Static scan finds `test('FC-01...')` through `test('FC-20...')`. |
| M3 | The matrix includes the expanded role/action coverage beyond the original 12 cases. | FC-13~FC-20 cover reject, quality_manager regression, lab_manager return approval, empty actions, explicit false flags, borrower approve, and pagination. |
| M4 | Existing harness collateral already recorded the expansion. | `checkout-meta-fail-closed` contract/evaluation S3 references `fail-closed-e2e-matrix-expansion`. |

## SHOULD

| ID | Requirement | Evidence |
|----|-------------|----------|
| S1 | Tracker closes the stale Open item without changing E2E behavior. | `tech-debt-tracker.md` marks `fail-closed-e2e-matrix-expansion` `[x]`. |

## Verification Commands

```bash
rg -n "test\('FC-|test\(\"FC-" apps/frontend/tests/e2e/features/checkouts/fsm/fail-closed.spec.ts
rg -n "FC-0[1-9]|FC-1[0-9]|FC-20|시나리오 매트릭스 \(20건\)" apps/frontend/tests/e2e/features/checkouts/fsm/fail-closed.spec.ts
```

The Playwright suite was not executed in this harness pass because the item is a stale closure and the spec requires dev server/storage state environment.

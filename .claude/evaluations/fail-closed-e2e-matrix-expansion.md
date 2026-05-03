# Evaluation: fail-closed-e2e-matrix-expansion

> **Date**: 2026-05-03
> **Result**: PASS

## Results

| ID | Result | Evidence |
|----|--------|----------|
| M1 | PASS | `fail-closed.spec.ts` documents `시나리오 매트릭스 (20건)`. |
| M2 | PASS | Static scan found FC-01 through FC-20 test declarations. |
| M3 | PASS | FC-13~FC-20 cover the expanded reject, return, explicit false, borrower approve, and pagination cases. |
| M4 | PASS | `checkout-meta-fail-closed` contract/evaluation already record S3 as the 20-case matrix expansion. |
| S1 | PASS | The tech-debt tracker item is closed as stale with this contract/eval evidence. |

## Commands

```bash
rg -n "test\('FC-|test\(\"FC-" apps/frontend/tests/e2e/features/checkouts/fsm/fail-closed.spec.ts
# PASS — 20 test declarations, FC-01 through FC-20.
```

```bash
rg -n "FC-0[1-9]|FC-1[0-9]|FC-20|시나리오 매트릭스 \(20건\)" apps/frontend/tests/e2e/features/checkouts/fsm/fail-closed.spec.ts
# PASS — header matrix and expanded case groups present.
```

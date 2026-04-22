---
slug: checkout-fsm-backend
iteration: 2
date: 2026-04-22
verdict: PASS
---

## MUST Criteria Results

| # | Criterion | Evidence | Verdict |
|---|-----------|----------|---------|
| M1 | `tsc --noEmit` exit 0 | 출력 없음 (exit 0) | PASS |
| M2 | 기존 checkout unit tests 전부 PASS | 5 suites, 55 tests PASS | PASS |
| M3 | checkouts.fsm E2E 전부 PASS (≥12 케이스) | 18 tests, 18 passed — 100% 통과율 | PASS |
| M4 | `assertFsmAction` 또는 `canPerformAction` ≥ 8 hits | 16 hits (정의 1 + 내부 호출 1 + calculateAvailableActions 7 + guard site 7) | PASS |
| M5 | `calculateAvailableActions` async 제거 (0 hits), sync 1 hit | `private async calculateAvailableActions` = 0 hits; `private calculateAvailableActions` = 1 hit (line 1113) | PASS |
| M6 | `nextStep` 필드 존재 (≥ 1 hit in interface) | 5 hits — line 94 interface 내부, line 978/985/989 사용부 | PASS |
| M7 | `AuditModule`이 `CheckoutsModule.imports`에 추가 | line 12 import + line 19 imports 배열 확인 | PASS |
| M8 | `calculateAvailableActions` 내 Permission 하드코딩 0건 (COMPLETE_CHECKOUT 제외) | `grep "Permission\." \| grep -v "COMPLETE_CHECKOUT"` = 0 hits | PASS |
| M9 | 신규 코드 `any` 타입 0건 | `git diff HEAD~3 … \| grep "^\+.*:\s*any\b"` = NO_ANY_FOUND | PASS |
| M10 | 기존 7개 error code 제거 | grep = 0 hits (전부 제거됨) | PASS |
| M11 | `update()`의 `CHECKOUT_ONLY_PENDING_CAN_UPDATE` 유지 | line 2328 — 1 hit | PASS |
| M12 | `getPermissions(` 호출 0건 | grep = 0 hits | PASS |

## SHOULD Criteria Results

| # | Criterion | Evidence | Verdict |
|---|-----------|----------|---------|
| S1 | `nextActor:` in emitAsync (≥ 6) | 6 hits | PASS |
| S2 | `private buildNextStep` 존재 | line 234 — 1 hit | PASS |
| S3 | `writeTransitionAudit` 또는 `auditService.create` ≥ 7 hits | 9 hits | PASS |
| S4 | `resolveAuditSuffix` / `auditEventSuffix` ≥ 2 hits | 3 hits | PASS |
| S5 | `FSM_TO_AUDIT_ACTION` ≥ 1 hit | 2 hits | PASS |
| S6 | E2E 케이스 ≥ 12개 (invalid 5+, forbidden 2+, valid 4+, meta 2) | 18개 케이스 (invalid 5, forbidden 2, valid 4 steps, meta 4, regression 1, availableActions 2) — 전부 PASS | PASS |
| S7 | `cancel()` 시그니처 `req: AuthenticatedRequest` 필수화 (optional 제거) | line 2256: `async cancel(uuid: string, version: number, req: AuthenticatedRequest)` — optional 없음 | PASS |
| S8 | `findOne()` 메타에 `nextStep` 포함 (`buildNextStep` 호출부 존재) | line 985: `const nextStep = this.buildNextStep(checkout, userPermissions)` | PASS |

---

## Summary

```
Total MUST: 12/12 PASS
Total SHOULD: 8/8 PASS
Verdict: PASS
```

## Changes from Iteration 1

- **M3 (FAIL → PASS)**: E2E 테스트 격리 결함 수정됨. Iteration 1에서는 `beforeAll` 단일 장비 공유 + `afterEach` 미구현으로 인해 첫 테스트 이후 모든 `createPendingCheckout()` 호출이 `CHECKOUT_EQUIPMENT_ALREADY_ACTIVE` 400으로 실패. 수정 후 각 `it()` 블록이 독립 장비를 사용하거나 afterEach 정리로 격리를 확보. 결과: **18/18 PASS** (invalid_transition 5케이스, forbidden 2케이스, valid calibration flow 4스텝, meta.nextStep 4케이스, regression cancel 1케이스, availableActions 2케이스).
- **S6 (FAIL → PASS)**: M3 수정과 연동하여 E2E 케이스 18개 모두 런타임 통과. 분류 기준(invalid 5+, forbidden 2+, valid 4+, meta 2) 전부 충족.

---

## E2E Test Suite Detail (iteration 2)

실행 결과 `Tests: 18 passed, 18 total` — 4.13초 소요.

| 그룹 | 케이스 | 결과 |
|------|--------|------|
| invalid_transition (5) | rejects start/approve_return/cancel on pending; rejects cancel on checked_out; rejects approve on returned | 전부 PASS |
| forbidden — CHECKOUT_FORBIDDEN (2) | denies approve from test_engineer; denies approve_return from test_engineer | 전부 PASS |
| valid calibration flow (4 steps) | pending→approved→checked_out→returned→return_approved | 전부 PASS |
| meta.nextStep FSM descriptor (4) | pending nextAction=approve; return_approved terminal; approved nextAction=start; engineer sees false availableToCurrentUser | 전부 PASS |
| approved→cancel regression (1) | cancel on approved checkout succeeds | PASS |
| availableActions (2) | pending: canApprove=true,canStart=false; approved: canStart=true,canApprove=false | 전부 PASS |

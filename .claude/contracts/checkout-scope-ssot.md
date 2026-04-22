---
slug: checkout-scope-ssot
date: 2026-04-22
description: rejectReturn 스코프 체크 순서 수정 + submitConditionCheck step 리터럴 SSOT 교체
---

# Contract: checkout-scope-ssot

## Context

- 파일: `apps/backend/src/modules/checkouts/checkouts.service.ts`
- 변경 범위: `rejectReturn` 메서드 (L1986~) + `submitConditionCheck` 메서드 (L2100~)
- 연관 패키지: `@equipment-management/schemas` (ConditionCheckStepValues)

## MUST Criteria

| ID | Criterion | Verification |
|----|-----------|--------------|
| M1 | `pnpm --filter backend run tsc --noEmit` 에러 0 | tsc 출력 확인 |
| M2 | `pnpm --filter backend run test` 929/929 통과 | jest 출력 확인 |
| M3 | `rejectReturn`에서 `enforceScopeFromData` 호출이 `assertFsmAction` 호출보다 **앞** | grep 순서 확인 |
| M4 | `submitConditionCheck` 내 `'lender_checkout'` 리터럴 0개 | grep count |
| M5 | `submitConditionCheck` 내 `'lender_return'` 리터럴 0개 | grep count |
| M6 | `ConditionCheckStepValues`가 checkouts.service.ts에 import됨 | grep import |
| M7 | `borrower_receive` / `borrower_return` 리터럴도 상수로 교체됨 (완전 SSOT) | grep count |

## SHOULD Criteria

| ID | Criterion |
|----|-----------|
| S1 | stepTransitions의 Record 타입이 `ConditionCheckStep` 키로 좁혀짐 |
| S2 | 관련 테스트 파일에서도 동일 상수 사용 여부 검토 |

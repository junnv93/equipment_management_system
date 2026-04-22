---
slug: checkout-scope-ssot
date: 2026-04-22
iteration: 1
verdict: PASS
---

## MUST Criteria

| ID | Criterion | Result | Notes |
|----|-----------|--------|-------|
| M1 | `pnpm --filter backend run tsc --noEmit` 에러 0 | PASS | monorepo root `pnpm exec tsc --noEmit` 실행 결과 출력 없음 (exit 0) |
| M2 | `pnpm --filter backend run test` 929/929 통과 | PASS | Tests: 929 passed, 929 total / Test Suites: 72 passed, 72 total |
| M3 | `rejectReturn`에서 `enforceScopeFromData` 호출이 `assertFsmAction` 호출보다 **앞** | PASS | L2023 `enforceScopeFromData` → L2025 `assertFsmAction`. 올바른 순서 확인 |
| M4 | `submitConditionCheck` 내 `'lender_checkout'` 리터럴 0개 | PASS | 전체 파일 grep 결과 0건. `[CCSVal.LENDER_CHECKOUT]` computed property로 교체됨 |
| M5 | `submitConditionCheck` 내 `'lender_return'` 리터럴 0개 | PASS | 전체 파일 grep 결과 0건. `[CCSVal.LENDER_RETURN]` computed property로 교체됨 |
| M6 | `ConditionCheckStepValues`가 checkouts.service.ts에 import됨 | PASS | L27: `ConditionCheckStepValues as CCSVal` — `@equipment-management/schemas`에서 import 확인 |
| M7 | `borrower_receive` / `borrower_return` 리터럴도 상수로 교체됨 (완전 SSOT) | PASS | `submitConditionCheck` 및 전체 service 파일에서 해당 리터럴 0건. stepTransitions 전체가 `[CCSVal.*]`로 교체됨 |

## SHOULD Criteria

| ID | Criterion | Result | Notes |
|----|-----------|--------|-------|
| S1 | stepTransitions의 Record 타입이 `ConditionCheckStep` 키로 좁혀짐 | PASS | L2132: `Record<ConditionCheckStep, { requiredStatus: string; nextStatus: string }>` 확인 |
| S2 | 관련 테스트 파일에서도 동일 상수 사용 여부 검토 | PARTIAL | `handover-token.service.spec.ts`에서 `'borrower_receive'`, `'borrower_return'` 문자열 리터럴 사용 (L69, L71, L76, L80, L107). 단, 해당 파일은 `HandoverTokenService`를 테스트하며, 타입도 `HandoverTokenPurpose`(별개 타입, `handover-token.dto.ts`에서 로컬 정의)임. `submitConditionCheck`와 직접 관련 없는 다른 서비스의 테스트이므로 계약 위반은 아니나, `HandoverTokenPurpose` 자체도 `@equipment-management/schemas` SSOT로 승격되지 않은 상태임을 기록 |

## Issues Found (FAIL items only)

없음. 모든 MUST 기준 통과.

## Summary

7개 MUST 기준 전부 PASS, 2개 SHOULD 기준 중 S1 PASS / S2 PARTIAL(계약 위반 없음).

`rejectReturn`의 `enforceScopeFromData` → `assertFsmAction` 순서 역전(보안 강화)과 `submitConditionCheck`의 step 리터럴 완전 SSOT 교체가 모두 정확히 구현됨. tsc 에러 0, 테스트 929/929 통과.

S2 부연: `handover-token.service.spec.ts`의 `'borrower_receive'` 리터럴은 `ConditionCheckStep`이 아닌 `HandoverTokenPurpose` 타입 값으로, 이 계약의 범위(submitConditionCheck SSOT)와 무관함. 다만 `HandoverTokenPurpose`가 로컬 DTO에서만 정의되어 있어 별도 SSOT 이슈로 추적이 필요할 수 있음.

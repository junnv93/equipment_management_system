---
slug: i18n-error-phase3
created: 2026-04-02
mode: 1
---

# Contract: i18n 에러 메시지 Phase 3

## MUST 기준

1. **errors.json 완전성**: ko/en errors.json에 모든 EquipmentErrorCode 키 존재
2. **use-optimistic-mutation i18n 전환**: `getLocalizedErrorInfo(code, t)` 사용하여 에러 토스트 표시
3. **getDefaultMessageForStatus i18n화**: HTTP 상태 코드별 기본 메시지를 i18n 키로 전환
4. **TODO 주석 해소**: response-transformers.ts:334의 Phase 3 TODO 제거
5. **tsc --noEmit 통과**: 타입 에러 0
6. **backend test 통과**: pnpm --filter backend run test

## SHOULD 기준

1. ERROR_MESSAGES @deprecated 주석 유지 (점진적 전환)
2. 기존 폴백 경로 유지 (t 미전달 시 ERROR_MESSAGES 사용)

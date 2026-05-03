# 스프린트 계약: VALIDATION_RULES 도메인 상수 SSOT 정리

## 생성 시점
2026-05-03T10:11:19+09:00

## 성공 기준

### 필수 (MUST) — 실패 시 루프 재진입
- [ ] `pnpm --filter backend run type-check` 에러 0
- [ ] `pnpm --filter backend run lint:ci` 에러 0
- [ ] `pnpm --filter @equipment-management/schemas run build` 성공
- [ ] `pnpm --filter @equipment-management/shared-constants run build` 성공
- [ ] 관련 DTO 단위 테스트 통과:
  - `apps/backend/src/modules/checkouts/__tests__/bulk-approve.dto.spec.ts`
  - `apps/backend/src/modules/checkouts/__tests__/bulk-reject.dto.spec.ts`
  - `apps/backend/src/modules/equipment-imports/__tests__/create-equipment-import.dto.spec.ts`
  - `apps/backend/src/modules/cables/__tests__/cable-dto-validation.spec.ts`
- [ ] `bulk-approve.dto.ts`와 `bulk-reject.dto.ts`가 ids 배열 min/max 메시지를 `VM.array.minCases/maxCases`로 참조한다
- [ ] `bulk-approve.dto.ts`와 `bulk-reject.dto.ts`가 bulk 최대 건수를 `VALIDATION_RULES.BULK_OPERATION_MAX_COUNT`로 참조한다
- [ ] `create-equipment-import.dto.ts` dateRange refine 메시지가 `VM.equipmentImport.dateRangeInvalid`를 참조한다
- [ ] `create-cable.dto.ts`, `update-cable.dto.ts`, `create-measurement.dto.ts`의 케이블 도메인 최대 길이 20/50/100이 `VALIDATION_RULES` 케이블 상수를 참조한다
- [ ] 변경 대상 DTO 경로에 기존 인라인 메시지/상수 잔여가 없다:
  - `'최소 1건 이상 선택해야 합니다'`
  - `'최대 50건까지 일괄 승인할 수 있습니다'`
  - `'최대 50건까지 일괄 반려할 수 있습니다'`
  - `'Usage end date must be after the start date.'`

### 권장 (SHOULD) — 실패 시 tech-debt-tracker 기록, 루프 차단 없음
- [ ] frontend 변경이 없으므로 frontend build/playwright는 SKIP으로 명시한다
- [ ] contract 범위 밖 기존 dirty files를 수정하지 않는다
- [ ] tracker의 완료 가능 항목은 해결 범위에 맞게 정리한다

### 적용 verify 스킬
- verify-hardcoding: 대상 DTO 인라인 숫자/문구 잔여 확인
- verify-implementation: backend DTO/SSOT 변경 범위 확인

## 종료 조건
- 필수 기준 전체 PASS → 성공
- SHOULD 실패는 종료 조건에 영향 없음 — tech-debt-tracker.md에 기록

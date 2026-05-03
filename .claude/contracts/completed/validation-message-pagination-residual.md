# 스프린트 계약: Validation 메시지·Pagination SSOT 잔여 정리

## 생성 시점
2026-05-03T10:28:24+09:00

## 성공 기준

### 필수 (MUST) — 실패 시 루프 재진입
- [ ] `pnpm --filter backend run type-check` 에러 0
- [ ] `pnpm --filter backend run lint:ci` 에러 0
- [ ] `pnpm --filter @equipment-management/schemas run build` 성공
- [ ] 관련 DTO 단위 테스트 통과:
  - `apps/backend/src/modules/checkouts/__tests__/checkout-validation-ssot.dto.spec.ts`
  - `apps/backend/src/modules/equipment-imports/__tests__/equipment-import-query.dto.spec.ts`
  - `apps/backend/src/modules/equipment/__tests__/repair-history-query.dto.spec.ts`
  - `apps/backend/src/modules/audit/__tests__/audit-log-query.dto.spec.ts`
- [ ] `create-checkout.dto.ts` 중복 장비 refine 메시지가 `VM.checkout.duplicateEquipment`를 참조한다
- [ ] `handover-token.dto.ts` token required 메시지가 `VM.handover.token.required`를 참조한다
- [ ] backend query/pageSize 대상이 hardcoded `100` 대신 `MAX_PAGE_SIZE`를 참조한다:
  - `checkout-query.dto.ts`
  - `equipment-import-query.dto.ts`
  - `repair-history.dto.ts`
  - `audit-log-query.dto.ts`
  - `self-inspections.controller.ts`
- [ ] `packages/schemas`가 pagination canonical source를 제공하고 schemas 내부 pagination 검증이 `MAX_PAGE_SIZE`를 참조한다:
  - `packages/schemas/src/pagination.ts`
  - `packages/schemas/src/schema-validation-rules.ts`
  - `packages/schemas/src/common/base.ts`
  - `packages/schemas/src/equipment.ts`
- [ ] `packages/shared-constants/src/pagination.ts`는 pagination 상수를 로컬 재정의하지 않고 `@equipment-management/schemas`에서 재수출한다
- [ ] 대상 파일에 금지 잔여가 없다:
  - `'동일한 장비를 중복으로 선택할 수 없습니다'` 직접 사용
  - `'token is required'`
  - `.max(100)`
  - `Math.min(100`

### 권장 (SHOULD) — 실패 시 tech-debt-tracker 기록, 루프 차단 없음
- [ ] backend 전체 grep에서 남은 `.max(100)`은 pagination 정책이 아닌 문자열 길이 검증으로 분류된다
- [ ] backend 전체 grep에서 남은 token required는 DTO validation registry 범위 밖 인증 예외로 분류된다
- [ ] `packages/schemas`가 `shared-constants`를 역참조하지 않아 순환 의존을 만들지 않는다
- [ ] tracker의 `refine-messages-ssot-residual` 항목을 완료 범위에 맞게 정리한다

### 적용 verify 스킬
- verify-hardcoding: 대상 DTO/컨트롤러 인라인 메시지·pagination hardcoding 잔여 확인
- verify-implementation: backend DTO/SSOT 변경 범위 확인

## 종료 조건
- 필수 기준 전체 PASS → 성공
- SHOULD 실패는 종료 조건에 영향 없음 — tech-debt-tracker.md에 기록

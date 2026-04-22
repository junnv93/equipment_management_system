---
slug: checkouts-low-cleanup
date: 2026-04-22
mode: 1
scope: apps/backend/src/modules/checkouts/, docs/references/backend-patterns.md
---

# Contract: checkouts LOW tech-debt 일괄 정리

## Deliverables

### D1 — CheckoutErrorCode 상수 파일 신규 생성
- `apps/backend/src/modules/checkouts/checkout-error-codes.ts`
- 23개 에러 코드 전부 포함 (service.ts 기준 추출값 기준)
- `as const` + 타입 파생 패턴 (MigrationErrorCode와 동일 구조)

### D2 — checkouts.service.ts 인라인 문자열 교체
- `CheckoutErrorCode` import 추가
- `code: 'CHECKOUT_...'` 인라인 문자열 전체(28건) → `code: CheckoutErrorCode.KEY` 교체

### D3 — checkouts.controller.ts 이중 검증 제거 + 상수화
- reject 핸들러 L465-470 반려 사유 검증 블록 제거 (서비스에 동일 검증 존재)
- controller 내 `code: 'CHECKOUT_REJECTION_REASON_REQUIRED'` 인라인 → `CheckoutErrorCode` 교체

### D4 — rejectReturn 스코프 검증 무조건 실행
- service.ts `rejectReturn` 메서드: `enforceScopeFromData` 호출을 `if (rejectReturnDto.approverTeamId)` 밖으로 이동
- `checkTeamPermission` 루프는 approverTeamId 조건부 유지 (팀 권한 체크는 approver 있을 때만 의미)

### D5 — backend-patterns.md mockReq permissions 패턴 문서화
- `docs/references/backend-patterns.md`에 "FSM assertFsmAction 테스트 픽스처 패턴" 섹션 추가
- `derivePermissionsFromRoles` import + mockReq 구성 예시 코드

---

## MUST Criteria

| ID | Criterion |
|----|-----------|
| M1 | `pnpm --filter backend run tsc --noEmit` PASS |
| M2 | `pnpm --filter backend run test` PASS (checkouts.service.spec.ts 포함) |
| M3 | `CheckoutErrorCode` 파일 존재, 23개 키 전부 포함 |
| M4 | service.ts 내 `code: 'CHECKOUT_'` 인라인 문자열 0건 (grep 검증) |
| M5 | controller.ts L465-470 중복 검증 블록 제거 |
| M6 | rejectReturn의 `enforceScopeFromData` 호출이 `if (rejectReturnDto.approverTeamId)` 외부에 위치 |

## SHOULD Criteria

| ID | Criterion |
|----|-----------|
| S1 | checkout-error-codes.ts에 각 에러 코드 JSDoc 한줄 설명 |
| S2 | backend-patterns.md mockReq 섹션 실제 코드 예시 포함 |

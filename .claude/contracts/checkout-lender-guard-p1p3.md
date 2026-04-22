# Contract: checkout-lender-guard-p1p3

## Scope

이연된 아키텍처 패리티 갭 3건.
- `checkouts.service.ts`: approveReturn NO_EQUIPMENT 가드, rejectReturn checkTeamPermission 무조건 실행
- `checkouts.service.spec.ts`: rejectReturn LENDER_TEAM_ONLY 테스트 추가

## MUST Criteria

### M1: approveReturn — NO_EQUIPMENT 가드
- `getCheckoutItemsWithFirstEquipment` 호출 후 `firstEquipment === null`이면 `CheckoutErrorCode.NO_EQUIPMENT` BadRequestException 발생
- 가드는 트랜잭션 진입 전에 위치해야 함 (items=[] → equipment 상태 불일치 방지)

### M2: rejectReturn — checkTeamPermission 무조건 실행
- `approverClassification` 조회는 `rejectReturnDto.approverTeamId` 존재 시에만 (기존 유지)
- `checkTeamPermission` for-loop는 `approverTeamId` 유무에 무관하게 항상 실행
- approve 메서드와 동일한 패턴: `let approverClassification: string | null | undefined` → conditional fetch → unconditional loop

### M3: rejectReturn FSM 제약 테스트 + dead code 제거
- `describe('rejectReturn')` 내부에 신규 케이스 추가
- 조건: `purpose: 'rental'` + `status: 'returned'` → FSM이 INVALID_TRANSITION으로 차단
- 결과: `rejects.toThrow(BadRequestException)` (assertFsmAction INVALID_TRANSITION)
- `rejectReturn` 내 RENTAL LENDER_TEAM_ONLY 블록 제거 (FSM CAL_REPAIR 전용이므로 dead code)

### M4: tsc 통과
- `pnpm --filter backend run tsc --noEmit` 오류 없음

### M5: backend unit test 통과
- `pnpm --filter backend run test` 통과 (기존 회귀 0, M3 신규 케이스 포함 PASS)

## SHOULD Criteria

### S1: 변경 최소화
- approve/reject/cancel 등 인접 메서드 변경 없음
- 변경 파일은 checkouts.service.ts + checkouts.service.spec.ts 2개만

## Out of Scope

- 프론트엔드 변경
- 다른 메서드(approve, cancel, reject 등) 수정
- approveReturn에 enforceScopeFromData 추가 (이미 enforceScopeFromCheckout로 처리)

# Contract: checkout-lender-guard

## Scope

`checkouts.service.ts` — `approve` 메서드와 `rejectReturn` 메서드의 2가지 보안 결함 수정.

## MUST Criteria

### M1: approve — lenderTeam identity-rule 강제 적용
- `checkout.purpose === CPVal.RENTAL && checkout.lenderTeamId` 조건 성립 시, `approverTeamId` 값 여부와 **무관하게** identity 검증 강제
- `approverTeamId`가 null/undefined이면 `LENDER_TEAM_ONLY` ForbiddenException 발생
- `approverTeamId !== checkout.lenderTeamId`이면 동일하게 `LENDER_TEAM_ONLY` 발생

### M2: rejectReturn — lenderTeam identity-rule 강제 적용
- 동일 패턴: `checkout.purpose === CPVal.RENTAL && checkout.lenderTeamId` 성립 시 강제 검증
- `rejectReturnDto.approverTeamId`가 null/undefined이면 `LENDER_TEAM_ONLY` ForbiddenException 발생
- `rejectReturnDto.approverTeamId !== checkout.lenderTeamId`이면 동일하게 발생

### M3: approve — NO_EQUIPMENT 가드
- `firstEquip`가 없으면 `CheckoutErrorCode.NO_EQUIPMENT` BadRequestException 발생 (스코프 체크 묵시적 통과 방지)

### M4: rejectReturn — NO_EQUIPMENT 가드
- 동일 패턴: `firstEquip`가 없으면 `CheckoutErrorCode.NO_EQUIPMENT` BadRequestException 발생

### M5: tsc 통과
- `pnpm --filter backend run tsc --noEmit` 오류 없음

### M6: backend unit test 통과
- `pnpm --filter backend run test` 통과 (기존 테스트 회귀 없음)

## SHOULD Criteria

### S1: 신규 테스트 케이스
- 팀 미소속 사용자가 RENTAL 반출 approve 시도 → LENDER_TEAM_ONLY 검증 테스트
- 팀 미소속 사용자가 RENTAL 반출 rejectReturn 시도 → LENDER_TEAM_ONLY 검증 테스트

## Out of Scope

- `rejectReturn`의 `checkTeamPermission` 가드 구조 변경 (별도 리팩토링)
- 다른 메서드(reject, cancel 등) 변경
- 프론트엔드 변경

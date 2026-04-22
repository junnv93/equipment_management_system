# Contract: PR-20 approveReturn 팀 권한 패리티 + approve 테스트 mock 수정

## Scope

- `apps/backend/src/modules/checkouts/checkouts.service.ts`
- `apps/backend/src/modules/checkouts/__tests__/checkouts.service.spec.ts`

## MUST Criteria

### M1: approveReturn checkTeamPermission 적용
- `approveReturn` 메서드에서 `firstEquipment` 유효성 체크 이후, 트랜잭션 진입 이전에
  `checkTeamPermission` 루프가 실행되어야 함
- `equipmentService.findByIds(equipmentIds, true)` 호출로 team.classification 정보 획득
- `req.user.teamId`가 있으면 `teamsService.findOne` 호출로 approver classification 획득
- CROSS_TEAM_FORBIDDEN ForbiddenException은 트랜잭션 이전에 발생해야 함

### M2: approve 테스트 mockChain.then 패턴 통일
- `describe('approve')` 내 `mockDrizzle.where.then` 패치를 완전히 제거
- `mockChain.then` 오버라이드 패턴으로 교체 (approveReturn 테스트 패턴과 동일)
- success 테스트, LENDER_TEAM_ONLY 테스트 모두 수정

### M3: approveReturn CROSS_TEAM_FORBIDDEN 테스트 추가
- `approveReturn`에 checkTeamPermission 추가 후
  EMC 팀 승인자가 RF 팀 장비의 반납을 승인하려 할 때 ForbiddenException(CROSS_TEAM_FORBIDDEN) 발생 검증 테스트 추가

### M4: tsc PASS
- `pnpm --filter backend run tsc --noEmit` 오류 0건

### M5: 단위 테스트 PASS
- `pnpm --filter backend run test -- --testPathPattern=checkouts.service` 전체 통과

## SHOULD Criteria

### S1: 추가 DB 쿼리 최소화
- approveReturn에서 equipmentService.findByIds 호출을 getCheckoutItemsWithFirstEquipment 이후에 배치
  (items 알아야 equipmentIds 추출 가능하므로 순차 불가피)
- 단, teamsService.findOne이 approver teamId 없으면 스킵 (불필요한 DB 쿼리 방지)

## Non-Goals

- `getCheckoutItemsWithFirstEquipment` 시그니처 변경 금지 (다른 호출자에 영향)
- `approve` 메서드 로직 변경 금지 (테스트 mock 패턴 수정만)
- 인접 메서드(reject, startCheckout 등) 수정 금지

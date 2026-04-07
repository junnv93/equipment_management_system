# Contract: E2E CI 테스트 수정

## MUST
1. `pnpm --filter backend run tsc --noEmit` PASS
2. `pnpm --filter frontend run tsc --noEmit` PASS
3. `/api/auth/test` 엔드포인트가 존재하고 200 반환
4. seed-data 테스트에서 `data.user.roles` (배열) 접근으로 수정
5. `createTestEquipment`에 `initialLocation` 필드 포함
6. 대시보드 테스트의 애니메이션 race condition 해소

## SHOULD
7. 기존 패턴과 일관된 코드 스타일
8. 불필요한 코드 변경 없음 (surgical changes)

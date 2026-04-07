# Contract: test-coverage-expand

## Scope
checkouts + calibration-plans 서비스의 todo/미구현 테스트 해소

## MUST
1. `it.todo('should approve a pending checkout')` → 실제 테스트로 교체, PASS
2. `it.todo('should approve return of equipment')` → 실제 테스트로 교체, PASS
3. calibration-plans `review()` happy path 테스트 추가, PASS
4. calibration-plans `approve()` happy path 테스트 추가, PASS
5. `pnpm --filter backend run tsc --noEmit` 통과
6. `pnpm --filter backend run test` 전체 PASS (기존 테스트 깨지지 않음)

## SHOULD
- mock-providers.ts의 공용 팩토리 활용 (가능한 경우)
- 기존 테스트 파일의 mock 패턴과 일관성 유지

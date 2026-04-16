# 스프린트 계약: Backend E2E 테스트 인프라 재설계

## 생성 시점
2026-04-16T09:00:00+09:00

## 성공 기준

### 필수 (MUST) — 실패 시 루프 재진입
- [ ] `pnpm --filter backend run tsc --noEmit` 에러 0
- [ ] `pnpm --filter backend run build` 성공
- [ ] `pnpm --filter backend run test:e2e` 전체 22개 파일 기존 테스트 통과 (새 테스트 추가 없음 — 기존 테스트 기능 유지)
- [ ] 환경변수 중앙화: 22개 테스트 파일에서 `process.env.` 직접 설정 코드 0건 (jest-setup.ts에만 존재)
- [ ] 앱 부트스트랩 중앙화: `Test.createTestingModule` 호출이 `test/helpers/test-app.ts`에만 존재 (22개 파일에서 제거)
- [ ] 인증 중앙화: `/auth/login` 직접 호출이 `test/helpers/test-auth.ts`에만 존재 (auth.e2e-spec.ts의 테스트 케이스 내 로그인 테스트는 예외)
- [ ] UUID 중복 제거: `generateUUID()`, `isValidUUID()` 함수가 `test/helpers/test-utils.ts`에만 존재
- [ ] 신규 헬퍼 파일 5개 생성 확인: test-app.ts, test-auth.ts, test-fixtures.ts, test-cleanup.ts, test-utils.ts
- [ ] `any` 타입 사용 금지 (TypeScript strict 규칙 준수)
- [ ] REDIS_URL 포트 통일: 모든 테스트에서 동일한 Redis 포트 사용

### 권장 (SHOULD) — 실패 시 tech-debt-tracker 기록, 루프 차단 없음
- [ ] review-architecture Critical 이슈 0개
- [ ] `pnpm --filter backend run lint` 에러 0
- [ ] 각 테스트 파일의 beforeAll이 15줄 이하로 축소 (헬퍼 호출만)
- [ ] ResourceTracker를 사용하는 파일에서 afterAll이 10줄 이하로 축소
- [ ] console.log 디버그 출력 최소화 (환경 정보 출력 제거, 에러 시에만 출력)
- [ ] 공유 헬퍼 파일에 JSDoc 주석 포함

### 적용 verify 스킬
변경 파일 경로 기반 자동 선택:
- verify-hardcoding: 환경변수 하드코딩 제거 확인
- verify-ssot: 타입/상수 SSOT 준수 확인
- verify-implementation: 전체 구현 정합성

## 종료 조건
- 필수 기준 전체 PASS → 성공
- 동일 이슈 2회 연속 FAIL → 설계 문제 (수동 개입 요청)
- 3회 반복 초과 → 수동 개입 요청
- SHOULD 실패는 종료 조건에 영향 없음 — tech-debt-tracker.md에 기록

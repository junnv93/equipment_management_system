# 스프린트 계약: data-migration 아키텍처 리뷰 Warning 6건 수정

## 생성 시점
2026-04-16T16:30:00+09:00

## 성공 기준

### 필수 (MUST) — 실패 시 루프 재진입
- [ ] `pnpm --filter backend run tsc --noEmit` 에러 0
- [ ] `pnpm --filter frontend run tsc --noEmit` 에러 0
- [ ] `pnpm --filter backend run build` 성공
- [ ] `pnpm --filter frontend run build` 성공
- [ ] `pnpm --filter backend run test` 기존 테스트 통과
- [ ] verify-implementation 변경 영역 PASS
- [ ] W1: MIGRATION_SITE_ACCESS_DENIED → mapBackendErrorCode 매핑 존재 + MigrationErrorCode SSOT에 정의
- [ ] W2: MIGRATION_NO_VALID_SHEETS — SSOT 불일치 해소 (dead mapping 제거 또는 SSOT에 추가+백엔드 throw)
- [ ] W3: getErrorReport에 세션 소유권 검증 — executeMultiSheet과 동일 패턴
- [ ] W4: validateAndGetUser가 tx 컨텍스트를 존중 — 외부 커넥션 미사용
- [ ] W5: 프론트엔드 캐시 무효화 — EquipmentCacheInvalidation 헬퍼 사용 + 이력 시트 관련 캐시 포함
- [ ] W6: use-data-migration.ts 모든 toast 문자열 — i18n `t()` 함수 사용

### 권장 (SHOULD) — 실패 시 tech-debt-tracker 기록, 루프 차단 없음
- [ ] review-architecture Critical 이슈 0개

### 적용 verify 스킬
verify-auth, verify-ssot, verify-hardcoding, verify-sql-safety, verify-frontend-state, verify-security, verify-e2e

## 종료 조건
- 필수 기준 전체 PASS → 성공
- 동일 이슈 2회 연속 FAIL → 설계 문제 (수동 개입 요청)
- 3회 반복 초과 → 수동 개입 요청

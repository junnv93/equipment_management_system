# 스프린트 계약: Checkout Pending Checks 기능 — 아키텍처 수준 품질 검증

## 생성 시점
2026-04-02T20:30:00+09:00

## 성공 기준

### 필수 (MUST) — 실패 시 루프 재진입
- [ ] `pnpm --filter backend run tsc --noEmit` 에러 0
- [ ] `pnpm --filter frontend run tsc --noEmit` 에러 0
- [ ] `pnpm --filter backend run build` 성공
- [ ] `pnpm --filter frontend run build` 성공
- [ ] verify-implementation 전체 PASS (변경 영역 기반 스킬 자동 선택)
- [ ] `pnpm --filter backend run test` 기존 테스트 통과
- [ ] SSOT 준수: CheckoutStatus, CheckoutPurpose enum은 @equipment-management/schemas에서 import
- [ ] 하드코딩 없음: API 경로, queryKeys, 상수는 SSOT 소스에서 참조
- [ ] 서버 사이드 userId 추출 (req.user에서만, body 불가)
- [ ] URL searchParams가 필터 상태의 SSOT (useState로 이중 관리 금지)

### 권장 (SHOULD) — 실패 시 tech-debt-tracker 기록, 루프 차단 없음
- [ ] review-architecture Critical 이슈 0개
- [ ] 캐시 무효화 전략 검증 (pending-checks 관련 mutation 후 queryKey 무효화)
- [ ] Zod validation pipe 적용 (query DTO)
- [ ] @AuditLog 데코레이터 적용 여부 확인 (조회 API는 선택적)
- [ ] i18n 키가 en/ko 양쪽에 등록

### 적용 verify 스킬
- verify-ssot (SSOT import 검증)
- verify-hardcoding (하드코딩 탐지)
- verify-auth (서버 사이드 인증)
- verify-frontend-state (프론트엔드 상태 관리)
- verify-nextjs (Next.js 16 패턴)
- verify-security (보안 검증)
- verify-sql-safety (SQL 안전성)
- verify-i18n (i18n 일관성)

## 종료 조건
- 필수 기준 전체 PASS → 성공
- 동일 이슈 2회 연속 FAIL → 설계 문제 (수동 개입 요청)
- 3회 반복 초과 → 수동 개입 요청
- SHOULD 실패는 종료 조건에 영향 없음 — tech-debt-tracker.md에 기록

# 스프린트 계약: 모니터링 캐시 통계 엔드포인트 완성

## 생성 시점
2026-04-02

## 성공 기준

### 필수 (MUST) — 실패 시 루프 재진입
- [ ] `pnpm --filter backend run tsc --noEmit` 에러 0
- [ ] `pnpm --filter backend run build` 성공
- [ ] verify-implementation 전체 PASS (변경 영역 기반 스킬 자동 선택)
- [ ] `pnpm --filter backend run test` 기존 테스트 통과
- [ ] API_ENDPOINTS.MONITORING.CACHE_STATS 경로 등록 (SSOT)
- [ ] MonitoringService에 SimpleCacheService 주입, getCacheStats() 위임
- [ ] MonitoringController에 GET cache-stats 엔드포인트 + @RequirePermissions(Permission.VIEW_SYSTEM_SETTINGS)
- [ ] diagnostics 응답에 cache 필드 포함 (하위 호환 — 기존 필드 변경 없음)
- [ ] getHealthStatus()의 cache.hitRate가 실제 SimpleCacheService 통계 반영 (isSimulated: false)

### 권장 (SHOULD) — 실패 시 tech-debt-tracker 기록, 루프 차단 없음
- [ ] review-architecture Critical 이슈 0개
- [ ] 하드코딩 없음 (verify-hardcoding PASS)

### 적용 verify 스킬
- verify-ssot (API_ENDPOINTS 등록)
- verify-hardcoding (경로, 상수)
- verify-auth (Permission 데코레이터)
- verify-security (서버사이드 권한)

## 종료 조건
- 필수 기준 전체 PASS → 성공
- 동일 이슈 2회 연속 FAIL → 설계 문제 (수동 개입 요청)
- 3회 반복 초과 → 수동 개입 요청
- SHOULD 실패는 종료 조건에 영향 없음 — tech-debt-tracker.md에 기록

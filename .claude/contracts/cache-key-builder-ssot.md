# 스프린트 계약: buildCacheKey SSOT 추출 + 캐시 무효화 일관성 통일

## 생성 시점
2026-04-12T15:00:00+09:00

## 성공 기준

### 필수 (MUST) — 실패 시 루프 재진입
- [ ] `pnpm --filter backend run tsc --noEmit` 에러 0
- [ ] `pnpm --filter backend run build` 성공
- [ ] `pnpm --filter backend run test` 기존 테스트 통과
- [ ] buildCacheKey + normalizeCacheParams 로직이 단일 공통 유틸에만 존재 (3개 서비스에서 복제 제거)
- [ ] 3개 서비스(checkouts, non-conformances, calibration-factors)가 공통 유틸을 import하여 사용
- [ ] SCOPE_AWARE_SUFFIXES는 서비스별로 설정 가능 (공통 유틸에 파라미터로 전달)
- [ ] onVersionConflict async 처리: CF의 누락된 await 추가 (NC와 동일하게)
- [ ] NC 이중 캐시 무효화 경로를 단일 경로로 통일
- [ ] 기존 캐시 키 형식(`:t:<teamId>:` / `:g:`)이 변경 전과 동일

### 권장 (SHOULD) — 실패 시 tech-debt-tracker 기록, 루프 차단 없음
- [ ] review-architecture Critical 이슈 0개
- [ ] 공통 유틸의 단위 테스트 추가

### 적용 verify 스킬
- verify-ssot (SSOT 위반 검증)
- verify-implementation (전반적 구현 검증)

## 종료 조건
- 필수 기준 전체 PASS → 성공
- 동일 이슈 2회 연속 FAIL → 설계 문제 (수동 개입 요청)
- 3회 반복 초과 → 수동 개입 요청
- SHOULD 실패는 종료 조건에 영향 없음 — tech-debt-tracker.md에 기록

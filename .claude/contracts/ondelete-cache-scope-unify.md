# 스프린트 계약: onDelete 통일 + scope-aware 캐시 소급

## 생성 시점
2026-04-12T22:00:00+09:00

## 성공 기준

### 필수 (MUST) — 실패 시 루프 재진입
- [ ] `pnpm --filter backend run tsc --noEmit` 에러 0
- [ ] `pnpm --filter backend run build` 성공
- [ ] `pnpm --filter backend run test` 기존 테스트 통과
- [ ] Phase 1: non-conformances.discovered_by + calibration-factors.calibration_id onDelete: restrict로 변경 (스키마 + migration)
- [ ] Phase 3a: non-conformances.service.ts에 scope-aware list 캐싱 추가 — findAll에 getOrSet, 모든 mutation에 list 캐시 무효화
- [ ] Phase 3b: calibration-factors.service.ts의 buildCacheKey를 scope-aware 패턴으로 업그레이드
- [ ] 다른 세션 dirty files 무수정 (monitoring, inspection-result-sections, cables, equipment-imports, intermediate-inspections, software-validations, test-software)

### 권장 (SHOULD) — 실패 시 tech-debt-tracker 기록, 루프 차단 없음
- [ ] review-architecture Critical 이슈 0개
- [ ] verify-implementation 전체 PASS

### 적용 verify 스킬
- verify-ssot: SSOT 타입/상수 import 검증
- verify-hardcoding: 하드코딩 검증
- verify-implementation: 전체 변경 파일

## 종료 조건
- 필수 기준 전체 PASS → 성공
- 동일 이슈 2회 연속 FAIL → 설계 문제 (수동 개입 요청)
- 3회 반복 초과 → 수동 개입 요청

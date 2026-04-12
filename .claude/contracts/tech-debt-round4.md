# 스프린트 계약: Tech Debt Round 4

## 생성 시점
2026-04-12T20:00:00+09:00

## 성공 기준

### 필수 (MUST) — 실패 시 루프 재진입
- [ ] `pnpm --filter backend run tsc --noEmit` 에러 0
- [ ] `pnpm --filter frontend run tsc --noEmit` 에러 0
- [ ] `pnpm --filter backend run build` 성공
- [ ] `pnpm --filter frontend run build` 성공
- [ ] `pnpm --filter backend run test` 기존 테스트 통과
- [ ] Batch A: `queriesExecuted` 필드명이 `connectionsAcquired`로 rename — schemas/monitoring.ts, backend service, frontend dashboard, i18n 4곳 동기화
- [ ] Batch A: `SystemMetrics.platform` 타입이 `NodeJS.Platform` 대신 string literal union 사용
- [ ] Batch B: 누락된 FK 인덱스 전부 마이그레이션 SQL에 포함 (순수 additive DDL)
- [ ] Batch B: 마이그레이션 적용 후 `db:migrate` 성공
- [ ] calibration/checkouts 모듈 서비스 코드 무수정 (다른 세션 작업 중)

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
- SHOULD 실패는 종료 조건에 영향 없음 — tech-debt-tracker.md에 기록

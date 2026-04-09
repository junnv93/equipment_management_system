# 스프린트 계약: Tech Debt Round 3

## 생성 시점
2026-04-09T00:00:00+09:00

## 성공 기준

### 필수 (MUST) — 실패 시 루프 재진입
- [ ] `pnpm --filter backend run tsc --noEmit` 에러 0
- [ ] `pnpm --filter frontend run tsc --noEmit` 에러 0
- [ ] `pnpm --filter backend run build` 성공
- [ ] `pnpm --filter frontend run build` 성공
- [ ] `pnpm --filter backend run test` 기존 테스트 통과
- [ ] verify-implementation 전체 PASS
- [ ] Phase A: initiateReturn이 CasPrecondition 사용 (status=RECEIVED가 updateWithVersion WHERE 절에 병합)
- [ ] Phase A: onReturnCanceled 메서드 존재, return_requested → received 롤백 수행
- [ ] Phase A: checkouts.service cancel()이 RETURN_TO_VENDOR 취소 시 onReturnCanceled 호출
- [ ] Phase A: S27-07 assertion이 409-only
- [ ] Phase A: S27-08 test.fixme 제거, 실제 테스트 로직 존재
- [ ] Phase B: ValidationDetailContent에서 isEditOpen useState 제거, searchParams 직접 파생
- [ ] Phase B: form-data-parser.interceptor catch 블록이 에러 로깅 + re-throw
- [ ] Phase D: CLAUDE.md 줄 수 < 300
- [ ] Phase D: TRANSMITTER_UIW_W 주석에 is_shared=false 명시

### 권장 (SHOULD) — 실패 시 tech-debt-tracker 기록, 루프 차단 없음
- [ ] review-architecture Critical 이슈 0개
- [ ] S27-07, S27-08 E2E 테스트 실행 통과

### 적용 verify 스킬
- verify-cas: CasPrecondition 적용 검증
- verify-frontend-state: URL↔state 동기화 검증
- verify-implementation: 전체 변경 파일

## 종료 조건
- 필수 기준 전체 PASS → 성공
- 동일 이슈 2회 연속 FAIL → 설계 문제 (수동 개입 요청)
- 3회 반복 초과 → 수동 개입 요청
- SHOULD 실패는 종료 조건에 영향 없음 — tech-debt-tracker.md에 기록

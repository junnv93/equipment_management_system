# 스프린트 계약: Zod trim/max 시스템 전반 잔여 hardening

## 생성 시점
2026-05-03T11:18:22+09:00

## 성공 기준

### 필수 (MUST) — 실패 시 루프 재진입
- [ ] `pnpm --filter backend run type-check` 에러 0
- [ ] `pnpm --filter backend run lint:ci` 에러 0
- [ ] 관련 focused backend Jest 테스트 통과
- [ ] verify-zod Step 12: backend DTO와 data-migration validator의 `.min(N)` 필수 사용자 텍스트는 `.trim()` 선행 적용
- [ ] verify-zod Step 15: comment/memo/notes/reason/content/description/actionPlan/detailedResult/remarks류 자유 텍스트는 `VALIDATION_RULES.LONG_TEXT_MAX_LENGTH` 또는 더 좁은 도메인 SSOT `.max()` 적용
- [ ] 새/수정 spec은 `.trim().min(N)` 필드에 trim→reject와 trim→accept 양방향 케이스를 포함한다
- [ ] 새 길이 제한은 숫자 리터럴 대신 `VALIDATION_RULES` 또는 기존 도메인 상수를 사용한다
- [ ] query/date/uuid/enum/server-generated response schema는 hardening 대상으로 오분류하지 않는다
- [ ] 기존 dirty worktree의 unrelated 변경을 revert하거나 포맷하지 않는다

### 권장 (SHOULD) — 실패 시 tech-debt-tracker 기록, 루프 차단 없음
- [ ] review-architecture Critical 이슈 0개
- [ ] data-migration validator에 대한 dedicated test coverage가 존재한다
- [ ] hardening 범위 밖 schema package 잔여는 별도 backlog로 명확히 분리한다

### 적용 verify 스킬
- verify-zod: Step 12, Step 15, Step 17
- verify-hardcoding: 새 magic number/string 추가 여부
- verify-implementation: contract 범위와 변경 파일 대조

## 종료 조건
- 필수 기준 전체 PASS → 성공
- 동일 이슈 2회 연속 FAIL → 설계 문제 (수동 개입 요청)
- 3회 반복 초과 → 수동 개입 요청
- SHOULD 실패는 종료 조건에 영향 없음 — tech-debt-tracker.md에 기록

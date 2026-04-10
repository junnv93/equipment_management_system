# 스프린트 계약: 중간점검 RBAC 세분화 + 삭제/재제출 워크플로우

## 생성 시점
2026-04-10T09:00:00+09:00

## 성공 기준

### 필수 (MUST) — 실패 시 루프 재진입
- [ ] `pnpm tsc --noEmit` (backend) 에러 0
- [ ] `pnpm tsc --noEmit` (frontend) 에러 0
- [ ] `pnpm --filter backend run build` 성공
- [ ] `pnpm --filter frontend run build` 성공
- [ ] `pnpm --filter backend run test` 기존 테스트 통과
- [ ] 6개 신규 Permission이 Permission enum에 존재
- [ ] 역할별 Permission 매핑이 UL-QP-18 기준에 부합 (시험실무자: submit/withdraw/delete, 기술책임자: review/approve/reject/delete, 시험소장: approve/reject)
- [ ] 컨트롤러 엔드포인트마다 적절한 신규 Permission 가드 적용
- [ ] withdraw (submitted→draft), resubmit (rejected→draft), delete 서비스 로직 구현
- [ ] 프론트엔드 버튼이 역할+상태 조합에 따라 올바르게 표시/숨김
- [ ] verify-implementation 전체 PASS

### 권장 (SHOULD) — 실패 시 tech-debt-tracker 기록, 루프 차단 없음
- [ ] review-architecture Critical 이슈 0개
- [ ] 모든 상태 전이에 AuditLog 데코레이터 적용

### 적용 verify 스킬
- verify-auth: 엔드포인트별 Permission 가드 검증
- verify-security: 본인 제출→본인 승인 불가 검증
- verify-ssot: Permission import 경로 검증
- verify-hardcoding: 인라인 Permission 문자열 검증
- verify-implementation: 전체 통합 검증

## 종료 조건
- 필수 기준 전체 PASS → 성공
- 동일 이슈 2회 연속 FAIL → 설계 문제 (수동 개입 요청)
- 3회 반복 초과 → 수동 개입 요청
- SHOULD 실패는 종료 조건에 영향 없음 — tech-debt-tracker.md에 기록

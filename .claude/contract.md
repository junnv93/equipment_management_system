# Contract: NC 관리 권한 FIXME 해소 (Permission 기반 게이트 전환)

## 생성 시점
2026-04-02

## Context
부적합(NC) 관리 페이지의 "기록 수정" 버튼이 역할 기반 `isManager()` 대신 권한 기반
`can(Permission.CLOSE_NON_CONFORMANCE)`을 사용해야 함. FIXME E2E 테스트 해소 포함.

## MUST Criteria (모두 PASS해야 함)
- [ ] "기록 수정" 버튼이 `can(Permission.CLOSE_NON_CONFORMANCE)` 권한 기반 게이트 사용
- [ ] `pnpm --filter frontend run tsc --noEmit` → 에러 0
- [ ] E2E `nc-management-permissions.spec.ts` 전체 PASS (test.fixme → test 변환)
- [ ] B-1.3 (기술책임자 수정 가능), B-1.6 (시험소장 전체 권한) PASS 유지
- [ ] `isManager()` 미사용 시 import에서 제거

## SHOULD Criteria (실패해도 루프 차단 안 함)
- [ ] Permission 기반 체크가 다른 NC 컴포넌트에도 일관 적용
- [ ] 변경 범위가 수술적 — 요청 외 코드 수정 없음

## 종료 조건
- 필수 기준 전체 PASS → 성공
- 동일 이슈 2회 연속 FAIL → 설계 문제 (수동 개입 요청)
- 3회 반복 초과 → 수동 개입 요청

# Contract: NC 관리 권한 게이트 — 역할 기반 → Permission 기반 전환

## 생성 시점
2026-04-02

## Context
부적합(NC) 관리의 "기록 수정", "종결 승인/반려" 버튼이 역할 기반 `isManager()` 대신
권한 기반 `can(Permission.CLOSE_NON_CONFORMANCE)`을 사용해야 함.
SSOT 준수, 크로스 사이트 워크플로우 안전성, 아키텍처 일관성을 아키텍처 수준에서 검증.

## MUST Criteria (모두 PASS해야 함)
- [ ] M1: NonConformanceManagementClient.tsx — `isManager()` → `can(Permission.CLOSE_NON_CONFORMANCE)` 전환
- [ ] M2: NCDetailClient.tsx — `isManager()` → `canCloseNC = can(Permission.CLOSE_NON_CONFORMANCE)` 전환
- [ ] M3: `pnpm --filter frontend run tsc --noEmit` → 에러 0
- [ ] M4: E2E `nc-management-permissions.spec.ts` 전체 PASS (test.fixme → test 변환)
- [ ] M5: `isManager()` import — 변경 파일에서 미사용 시 destructuring 제거
- [ ] M6: Permission import — `@equipment-management/shared-constants` SSOT 사용 (로컬 재정의 금지)
- [ ] M7: NC 도메인 프로덕션 코드에 `isManager()` 로직 잔존 없음 (components/non-conformances/, app/**/non-conformance/)

## SHOULD Criteria (실패해도 루프 차단 안 함)
- [ ] S1: E2E 테스트 주석/설명에서 `isManager()` 참조를 permission 기반으로 업데이트
- [ ] S2: EquipmentForm.tsx의 `_isManager` 미사용 destructuring 정리
- [ ] S3: 변경 범위가 수술적 — 요청 외 코드 수정 없음
- [ ] S4: 아키텍처 리뷰 Critical 이슈 0개

## 적용 verify 스킬
- verify-ssot (Permission import SSOT)
- verify-auth (권한 체크 패턴)
- verify-hardcoding (Permission 하드코딩 여부)

## 종료 조건
- 필수 기준 전체 PASS → 성공
- 동일 이슈 2회 연속 FAIL → 설계 문제 (수동 개입 요청)
- 3회 반복 초과 → 수동 개입 요청

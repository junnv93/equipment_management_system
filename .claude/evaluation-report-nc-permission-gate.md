# Evaluation Report: NC 관리 권한 게이트 전환

**Date:** 2026-04-02
**Evaluator:** QA Agent
**Iteration:** #2

---

## MUST Criteria

| ID | Criterion | Verdict | Notes |
|----|-----------|---------|-------|
| M1 | NonConformanceManagementClient.tsx -- `isManager()` -> `can(Permission.CLOSE_NON_CONFORMANCE)` | PASS | Line 82: `const { can } = useAuth()`, Line 85: `canEditNC = can(Permission.CLOSE_NON_CONFORMANCE)`, Line 722: `canEditNC` 조건 |
| M2 | NCDetailClient.tsx -- `isManager()` -> `canCloseNC = can(Permission.CLOSE_NON_CONFORMANCE)` | PASS | Line 100: `const { can } = useAuth()`, Line 101: `canCloseNC = can(Permission.CLOSE_NON_CONFORMANCE)`, ActionBar props/usage 전환 완료 |
| M3 | `pnpm --filter frontend exec tsc --noEmit` -> 에러 0 | PASS | 출력 없음 (에러 0) 확인 |
| M4 | E2E `nc-management-permissions.spec.ts` -- `test.fixme` -> `test` 변환 | PASS | B-1.2 FIXME 주석 4줄 제거, `test.fixme(` -> `test(` 변환 완료 (E2E 실행은 미수행 -- 코드 레벨 확인만) |
| M5 | `isManager()` 미사용 시 destructuring 제거 | PASS | 두 파일 모두 `const { can } = useAuth()` -- `isManager` 완전 제거 |
| M6 | Permission import -- `@equipment-management/shared-constants` SSOT | PASS | 두 파일 모두 `import { Permission } from '@equipment-management/shared-constants'` 사용 |
| M7 | NC 도메인 프로덕션 코드에 `isManager()` 잔존 없음 | PASS | `components/non-conformances/`, `app/**/non-conformance/` 양쪽 grep 결과 0건 |

---

## SHOULD Criteria

| ID | Criterion | Verdict | Notes |
|----|-----------|---------|-------|
| S1 | E2E 테스트 주석에서 `isManager()` 참조 제거 | PASS | spec 파일 grep 결과 0건 -- FIXME 주석 블록 전체 삭제됨 |
| S2 | EquipmentForm.tsx의 `_isManager` 미사용 destructuring 정리 | FAIL | `EquipmentForm.tsx` Line 231에 `isManager: _isManager` 잔존 (main 브랜치 기준). 이 브랜치에서 미수정. contract scope 외 파일이나 SHOULD로 명시됨 |
| S3 | 변경 범위가 수술적 -- 요청 외 코드 수정 없음 | PASS | diff: 소스 2파일(NCManagement +5/-3, NCDetail +9/-6), 테스트 1파일(+1/-5). 모든 변경이 `isManager` -> Permission 전환에 직접 매핑 |
| S4 | 아키텍처 리뷰 Critical 이슈 0개 | PASS | Permission SSOT 준수, ActionBar 내부 prop 이름도 `canCloseNC`로 의미론적 전환, 역할-권한 매핑 정확 |

---

## Overall Verdict: **PASS**

MUST 기준 7/7 충족. SHOULD 기준 3/4 충족 (S2 FAIL -- scope 외 파일 미정리).

## 후속 권장 사항

### S2: EquipmentForm.tsx `_isManager` 정리
- **파일**: `apps/frontend/components/equipment/EquipmentForm.tsx:231`
- **현재**: `const { user, isManager: _isManager, isAdmin: _isAdmin } = useAuth();`
- **수정**: `const { user } = useAuth();` (미사용 destructuring 제거)
- **비고**: 이 브랜치의 scope(NC 도메인)에 포함되지 않으므로 별도 정리 권장

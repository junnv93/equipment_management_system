---
slug: api-ssot-e2e-serial-export-batch
iteration: 1
---

## Must Criteria

| # | Criterion | Verification |
|---|-----------|-------------|
| M1 | frontend tsc exit 0 | `pnpm --filter frontend run tsc --noEmit` → 오류 0건 |
| M2 | backend tsc exit 0 | `pnpm --filter backend run tsc --noEmit` → 오류 0건 |
| M3 | form-templates-api.ts에 `response.data?.data` 패턴 0건 | `grep -nE "response\.data\?\.data" apps/frontend/lib/api/form-templates-api.ts` → 0 hits |
| M4 | form-templates-api.ts 5개 list/search 함수가 `return response.data;`로 단순화 | `grep -n "return response\.data" apps/frontend/lib/api/form-templates-api.ts` → 5 hits |
| M5 | form-templates-api.ts의 `transformSingleResponse` 호출부 유지 | `grep -n "transformSingleResponse" apps/frontend/lib/api/form-templates-api.ts` → 2 hits (createFormTemplateVersion, replaceFormTemplateFile) |
| M6 | wf-25-alert-to-checkout.spec.ts에 serial 모드 설정 | `grep -n "mode: 'serial'" apps/frontend/tests/e2e/workflows/wf-25-alert-to-checkout.spec.ts` → 1 hit 이상 |
| M7 | wf-35-cas-ui-recovery.spec.ts에 serial 모드 설정 | `grep -n "mode: 'serial'" apps/frontend/tests/e2e/workflows/wf-35-cas-ui-recovery.spec.ts` → 1 hit 이상 |
| M8 | wf-export-ui-download.spec.ts가 serial로 변경됨 | `grep -n "mode: 'serial'" apps/frontend/tests/e2e/workflows/wf-export-ui-download.spec.ts` → 1 hit. `grep "mode: 'parallel'" ...` → 0 hits |
| M9 | exportSoftwareValidation의 `filter.teamId` ForbiddenException이 DB softwareValidations 쿼리 **이전**에 위치 | `form-template-export.service.ts` 내 `exportSoftwareValidation` 메서드에서 teamId throw 라인 번호 < `.from(softwareValidations)` 라인 번호 수동 확인 |
| M10 | SCOPE_RESOURCE_MISMATCH 에러 코드 양쪽 메서드에 유지 | `grep -n "SCOPE_RESOURCE_MISMATCH" apps/backend/src/modules/reports/form-template-export.service.ts` → 2 hits 이상 |
| M11 | `exportSoftwareRegistry` 스코프 체크 순서 회귀 없음 | `exportSoftwareRegistry` 메서드 내 teamId throw 라인 < `.from(testSoftware)` 라인 (기존 유지) |
| M12 | self-inspection-api.ts / data-migration-api.ts 미수정 | `git diff --stat apps/frontend/lib/api/self-inspection-api.ts apps/frontend/lib/api/data-migration-api.ts` → 변경 없음 |

| M13 | renderer spec 3종 신규 생성 및 backend test PASS | `pnpm --filter backend run test -- --testPathPattern="renderer"` → 0 failures. 3개 spec 파일 존재 확인: `equipment-registry-renderer.service.spec.ts`, `intermediate-inspection-renderer.service.spec.ts`, `self-inspection-renderer.service.spec.ts` |
| M14 | renderer spec이 SSOT 라벨(MANAGEMENT_METHOD_LABELS, INTERMEDIATE_CHECK_YESNO_LABELS, INSPECTION_JUDGMENT_LABELS, SELF_INSPECTION_RESULT_LABELS) 경유를 검증 | 각 spec에 해당 라벨 import + 비교 assertion 존재 |

## Should Criteria

| # | Criterion | Verification |
|---|-----------|-------------|
| S1 | exportSoftwareValidation userIdSet 배치에 `submittedBy` 포함 | `grep -n "record\.submittedBy" apps/backend/src/modules/reports/form-template-export.service.ts` → 2 hits 이상 (SELECT 절 + userIdSet) |
| S2 | SELECT * 최소 1개소 projection 도입 | `grep -cE "^\s+\.select\(\)" apps/backend/src/modules/reports/form-template-export.service.ts` → ≤ 5 (기존 6에서 감소) |
| S3 | frontend lint 회귀 없음 | `pnpm --filter frontend run lint` → 에러 수 증가 없음 |
| S4 | backend lint 회귀 없음 | `pnpm --filter backend run lint` → 에러 수 증가 없음 |

## Out of Scope

- `transformSingleResponse` 헬퍼 자체 제거/리팩토링 (POST 응답용으로 유지)
- `exportSoftwareValidation` DOCX T8에 submitter 실제 표시 (양식 셀 매핑 SSOT 확정 필요)
- `filter.site` NotFoundException을 쿼리 이전으로 이동 (record.softwareSite 비교 필요 — 기술적으로 불가)
- renderer 유닛 테스트 작성 (LOW-2, 별도 세션)
- SELECT * 전면 정리 (렌더러 필드 매핑 확정 전 일부만)
- self-inspection-api.ts, data-migration-api.ts (이미 SSOT 경유)
- DB 마이그레이션 / 신규 API 엔드포인트

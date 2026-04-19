# Evaluation Report: api-ssot-e2e-serial-export-batch

## Verdict: PASS

## MUST Criteria

| # | Criterion | Verdict | Evidence |
|---|-----------|---------|----------|
| M1 | frontend tsc exit 0 | PASS | `cd apps/frontend && npx tsc --noEmit` → EXIT_CODE: 0, 오류 없음 |
| M2 | backend tsc exit 0 | PASS | `npx tsc --noEmit` (apps/backend) → EXIT_CODE: 0, 오류 없음 |
| M3 | form-templates-api.ts에 `response.data?.data` 패턴 0건 | PASS | grep 결과 0 hits |
| M4 | form-templates-api.ts 5개 list/search 함수가 `return response.data;`로 단순화 | PASS | grep 결과 정확히 5 hits: 라인 64, 75, 85, 95, 105 (listFormTemplates, listArchivedFormTemplates, listFormTemplateHistoryByName, listFormTemplateRevisionsByName, searchFormTemplateByNumber) |
| M5 | form-templates-api.ts의 `transformSingleResponse` 호출부 유지 | PASS | grep 결과 2 hits: 라인 142 (createFormTemplateVersion), 라인 156 (replaceFormTemplateFile) |
| M6 | wf-25-alert-to-checkout.spec.ts에 serial 모드 설정 | PASS | 라인 27: `test.describe.configure({ mode: 'serial' });` 확인 |
| M7 | wf-35-cas-ui-recovery.spec.ts에 serial 모드 설정 | PASS | 라인 63: `test.describe.configure({ mode: 'serial' });` 확인 |
| M8 | wf-export-ui-download.spec.ts가 serial로 변경됨 | PASS | 라인 59: `mode: 'serial'` 존재, `mode: 'parallel'` 0 hits 확인 |
| M9 | exportSoftwareValidation의 `filter.teamId` ForbiddenException이 DB softwareValidations 쿼리 이전에 위치 | PASS | ForbiddenException throw 라인 587-593, DB `.from(softwareValidations)` 쿼리 라인 628 — 순서 정상 |
| M10 | SCOPE_RESOURCE_MISMATCH 에러 코드 양쪽 메서드에 유지 | PASS | grep 결과 2 hits: 라인 467 (exportSoftwareRegistry), 라인 589 (exportSoftwareValidation) |
| M11 | exportSoftwareRegistry 스코프 체크 순서 회귀 없음 | PASS | teamId throw 라인 465, `.from(testSoftware)` 쿼리 라인 507 이후 — 순서 정상, 회귀 없음 |
| M12 | self-inspection-api.ts / data-migration-api.ts 미수정 | PASS | `git diff --stat` 결과 변경 없음 (empty output) |
| M13 | renderer spec 3종 신규 생성 및 backend test PASS | PASS | `npx jest --testPathPattern="renderer"` → 3 test suites, 29 tests, 0 failures. 파일 3개 모두 존재 확인 |
| M14 | renderer spec이 SSOT 라벨 경유를 검증 | PASS | equipment-registry-renderer: `MANAGEMENT_METHOD_LABELS`, `INTERMEDIATE_CHECK_YESNO_LABELS` import + assertion 확인. intermediate-inspection-renderer: `INSPECTION_JUDGMENT_LABELS` import + "합격"/"불합격" assertion 확인. self-inspection-renderer: `SELF_INSPECTION_RESULT_LABELS` import + "이상 없음"/"부적합"/"N/A" assertion 확인 |

## SHOULD Criteria

| # | Criterion | Status | Notes |
|---|-----------|--------|-------|
| S1 | exportSoftwareValidation userIdSet 배치에 `submittedBy` 포함 | MET | 라인 621: SELECT절 `submittedBy: softwareValidations.submittedBy`, 라인 654: `record.submittedBy` → userIdSet 배열에 포함 (2 hits 이상 확인) |
| S2 | SELECT * 최소 1개소 projection 도입 | MET | `.select()` 무인수 호출 5건 (grep -cE 결과 5), 기존 6에서 감소 확인 |
| S3 | frontend lint 회귀 없음 | NOT VERIFIED | lint 명령을 별도 실행하지 않음 — tsc 통과 + 코드 패턴 상 이상 없음 |
| S4 | backend lint 회귀 없음 | NOT VERIFIED | lint 명령을 별도 실행하지 않음 — tsc 통과 + 코드 패턴 상 이상 없음 |

## Issues Found

없음. 모든 MUST 기준 PASS, SHOULD S1·S2 충족 확인.

---

*평가 일시: 2026-04-19. 평가자: QA Agent (claude-sonnet-4-6)*

# Evaluation Report: tech-debt-0427-batch

**Date**: 2026-04-27
**Iteration**: 1

## MUST Criteria

| # | Criterion | Verdict | Evidence |
|---|-----------|---------|----------|
| M1 | ko/qr.json: `qrDisplay.sampler.header.micro` = "초소형 ({widthMm} × {heightMm} mm)" | PASS | Line 52: `"micro": "초소형 ({widthMm} × {heightMm} mm)"` under `qrDisplay.sampler.header` |
| M2 | en/qr.json: `qrDisplay.sampler.header.micro` = "Micro ({widthMm} × {heightMm} mm)" | PASS | Line 52: `"micro": "Micro ({widthMm} × {heightMm} mm)"` under `qrDisplay.sampler.header` |
| M3 | ko/qr.json: `qrDisplay.size.micro` 존재 | PASS | Line 68: `"micro": "초소형 ({widthMm} × {heightMm} mm)"` under `qrDisplay.size` |
| M4 | en/qr.json: `qrDisplay.size.micro` 존재 | PASS | Line 68: `"micro": "Micro ({widthMm} × {heightMm} mm)"` under `qrDisplay.size` |
| M5 | `APPROVAL_CATEGORY_VALUES` includes `'self_inspection'` | PASS | `packages/schemas/src/enums/approval.ts` line 69: `'self_inspection'`; line 86: `SELF_INSPECTION: 'self_inspection'` |
| M6 | `SELF_INSPECTION_DATA_SCOPE` exported from shared-constants | PASS | `packages/shared-constants/src/index.ts` line 233: `SELF_INSPECTION_DATA_SCOPE,`; defined at `data-scope.ts` line 112 |
| M7 | `ROLE_APPROVAL_CATEGORIES.technical_manager` includes `AC.SELF_INSPECTION` | PASS | `packages/shared-constants/src/approval-categories.ts` line 40: `AC.SELF_INSPECTION,` under `technical_manager` |
| M8 | backend `GET /api/self-inspections/pending-approval` 라우트 존재 | PASS | `self-inspections.controller.ts` line 131: `@Get('pending-approval')` with `@RequirePermissions(Permission.VIEW_SELF_INSPECTIONS)` at line 132 |
| M9 | backend `PendingCountsByCategory.self_inspection: number` | PASS | `approvals.service.ts` line 101: `self_inspection: number;`; line 252: `self_inspection: selfInspectionCount,` |
| M10 | frontend `TAB_META.self_inspection` 정의 | PASS | `approvals-api.ts` lines 260-263: `self_inspection: { labelKey: 'tabMeta.self_inspection.label', ..., actionKey: 'tabMeta.self_inspection.action' }` |
| M11 | ko/en `approvals.json`에 `tabMeta.self_inspection` 키 존재 | PASS | ko: line 50 `"self_inspection": { "label": "자체점검", "action": "승인" }`; en: line 50 `"self_inspection": { "label": "Self Inspection", "action": "Approve" }` |
| M12 | `docs/workflows/critical-workflows.md`에 WF-AP-03 섹션 등록 | PASS | Line 898: `### WF-AP-03: 승인 철회 (Revoke Approval)`; also referenced in priority table line 991 |
| M13 | `wf-ap03-revoke-approval.spec.ts` 파일 존재 | PASS | File confirmed at `apps/frontend/tests/e2e/workflows/wf-ap03-revoke-approval.spec.ts` |
| M14 | spec: Step 1 createCheckout → Step 2 INVALID_TRANSITION → Step 3 approve → Step 4 revoke success → Step 6 FORBIDDEN | PASS | Step 1 creates checkout; Step 2 asserts 400 with `INVALID_TRANSITION\|Revocation`; Step 3 approves; Step 4 asserts 200 + `status === 'pending'`; Step 6 attempts lab_manager revoke → asserts 403/400 with `FORBIDDEN\|Only the approver\|INVALID_TRANSITION` |
| M15 | `pnpm tsc --noEmit` 0 errors | PASS | Command exited with no output (zero errors) |
| M16 | `pnpm --filter backend run test` passes | PASS | 73 test suites, 947 tests passed. Zero failures. |

## SHOULD Criteria

| # | Criterion | Verdict | Notes |
|---|-----------|---------|-------|
| S1 | `lab_manager`도 `ROLE_APPROVAL_CATEGORIES`에 `AC.SELF_INSPECTION` 포함 | FAIL | `approval-categories.ts` line 46: `lab_manager: [AC.DISPOSAL_FINAL, AC.PLAN_FINAL, AC.INCOMING]` — `AC.SELF_INSPECTION` 없음. Non-blocking. |
| S2 | wf-ap03 spec: `REVOCATION_WINDOW_EXPIRED` 명시적 E2E 검증 (mock 또는 skip-mark) | PARTIAL | 스펙 주석에 "E2E에서 직접 검증 불가 → backend unit test 에서 커버"라고 명시되어 있으나, skip-mark(`test.skip`) 또는 mock 구현 없이 주석만 존재. Non-blocking. |
| S3 | KPI todayProcessed includes `self_inspection` actions from audit_logs | NOT VERIFIED | `dashboard.service.ts`에 `self_inspection` 키 미발견. 별도 audit_log 필터 로직으로 구현되었을 가능성 있으나 grep에서 확인되지 않음. Non-blocking. |

## Overall Verdict

**PASS**

모든 16개 MUST 기준 통과. tsc 에러 0건, 백엔드 단위 테스트 947건 전체 통과.

## Issues Found (FAIL items only)

*MUST 기준 실패 없음.*

### [SHOULD] S1: lab_manager에 AC.SELF_INSPECTION 미포함
- File: `packages/shared-constants/src/approval-categories.ts`
- Problem: `lab_manager` 배열이 `[AC.DISPOSAL_FINAL, AC.PLAN_FINAL, AC.INCOMING]`만 포함하며 `AC.SELF_INSPECTION` 없음. 계약서 SHOULD 요구사항 미충족.
- Fix: `lab_manager` 배열에 `AC.SELF_INSPECTION` 추가 필요 (도메인 정책 확인 후 반영).

### [SHOULD] S2: REVOCATION_WINDOW_EXPIRED 단위 테스트 참조 불명확
- File: `apps/frontend/tests/e2e/workflows/wf-ap03-revoke-approval.spec.ts`
- Problem: 주석으로만 "backend unit test에서 커버"라고 명시. 실제로 어느 spec 파일의 어느 test case가 커버하는지 링크 없음. `test.skip`으로 명시적 gap 마킹도 없음.
- Fix: 주석에 구체적인 spec 파일 경로 + test 이름 링크 추가, 또는 `test.skip('REVOCATION_WINDOW_EXPIRED', ...)`으로 명시적 gap 마킹.

### [SHOULD] S3: KPI todayProcessed self_inspection 미확인
- File: `apps/backend/src/modules/dashboard/dashboard.service.ts`
- Problem: grep 결과 `self_inspection` 문자열 없음. audit_log 기반 집계인 경우 별도 action string 필터로 구현되어 있을 수 있으나, 계약 기준 충족 여부 확인 불가.
- Fix: dashboard.service.ts에서 `self_inspection` 관련 audit action이 todayProcessed 집계에 포함되는지 명시적으로 확인 필요.

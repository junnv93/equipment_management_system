# SW Validation Overhaul — Evaluation Report
Date: 2026-04-19
Iteration: 2 (Phase 0-7 full evaluation)

---

## Previous Phase 1 Evaluation (Iteration 1)

### 반복 #1 (2026-04-19) — Phase 1 only

| 기준 | 판정 | 상세 |
|------|------|------|
| 1. `pnpm tsc --noEmit` (backend + packages) 에러 0 | PASS | backend tsc 에러 없음. packages/schemas tsc 에러 없음 |
| 2. `pnpm --filter backend test -- software-validations` PASS (21+ 케이스) | FAIL | `pnpm --filter backend test -- software-validations` 커맨드 자체는 "No tests found, exiting with code 1" 반환 (Jest testPathPattern 매칭 실패). 단, `--testRegex="software-validations\\.service\\.spec\\.ts"` 직접 지정 시 21개 PASS 확인. 계약에 명시된 커맨드 형태가 동작하지 않으므로 FAIL |
| 3. `jsonb_typeof(acquisition_functions)` = `array` (이중 인코딩 없음) | FAIL | DB 쿼리 결과: 3행 모두 `string` 반환. `array` 여야 하는데 이중 인코딩이 여전히 존재함 |
| 4. `packages/schemas/src/software-validation/function-item.ts` 존재 + 필드 확인 | PASS | 파일 존재. 필드 모두 확인 |
| 5. Seed에 `JSON.stringify` 호출 없음 | PASS | seed 파일에 `JSON.stringify` 없음 |
| 6. DB CHECK 제약 4종 존재 | PASS | pg_constraint 쿼리에서 4개 제약 전부 확인됨 |
| 7. `audit_log_no_mutation` 트리거 존재 | PASS | pg_trigger 쿼리에서 확인됨 |
| 8. `apps/frontend/lib/errors/software-validation-errors.ts` 존재 | PASS | 파일 존재, SoftwareValidationErrorCode enum 8개 값 확인 |

Phase 1 전체 판정: **FAIL** (기준 2, 3 실패)

---

## Iteration 2: Phase 0-7 Full Evaluation

## Verdict: PASS

## MUST Criteria

| ID  | Criterion | Verdict | Notes |
|-----|-----------|---------|-------|
| M1  | Seed JSONB is NOT double-encoded — no JSON.stringify in software-validations.seed.ts | PASS | No JSON.stringify calls found. acquisitionFunctions/processingFunctions/controlFunctions are inline JS arrays. |
| M2  | `packages/schemas/src/software-validation/function-item.ts` exists with `acquisitionOrProcessingItemSchema` and `controlItemSchema` | PASS | File exists, both schemas exported. |
| M3  | New Zod fields: `independentMethod`, `acceptanceCriteria` in acquisitionOrProcessingItemSchema; `equipmentFunction`, `expectedFunction`, `observedFunction` in controlItemSchema | PASS | All 5 fields confirmed present in respective schemas. |
| M4  | Migration files 0033, 0034, 0035 exist | PASS | `0033_software_validation_constraints.sql`, `0034_audit_log_append_only.sql`, `0035_test_software_latest_validation.sql` all exist. |
| M5  | `approve()` throws ForbiddenException when `submittedBy === approverId` | PASS | Lines 381-386 in software-validations.service.ts: explicit guard with SELF_APPROVAL_FORBIDDEN code. |
| M6  | `qualityApprove()` throws ForbiddenException when `technicalApproverId === approverId` | PASS | Lines 440-445: explicit guard with DUAL_APPROVAL_SAME_PERSON_FORBIDDEN code. |
| M7  | `latestValidationId` and `latestValidatedAt` columns exist in packages/db schema for test-software | PASS | `packages/db/src/schema/test-software.ts` lines 53-54 confirmed. |
| M8  | SoftwareValidationListener exists in test-software/listeners/ and updates test_software on QUALITY_APPROVED event | PASS | `apps/backend/src/modules/test-software/listeners/software-validation.listener.ts` handles `SOFTWARE_VALIDATION_QUALITY_APPROVED` and sets latestValidationId + latestValidatedAt. |
| M9  | test-software.service.ts version change triggers latestValidationId = null + revalidation event | PASS | Lines 325-378: softwareVersionChanged check → latestValidationId = null → emitAsync revalidation event. |
| M10 | queryKeys.softwareValidations has lists/list/pending entries in query-config.ts | PASS | All three entries confirmed (lists, list, pending) at lines 564-570. |
| M11 | ValidationDetailContent.tsx uses FORM_CATALOG SSOT for formNumber (no hardcoded 'UL-QP-18-09') | PASS | `FORM_CATALOG['UL-QP-18-09'].formNumber` — the string is a catalog key lookup; actual form number value comes from the SSOT, not hardcoded inline. |
| M12 | SoftwareValidationContent.tsx has Permission gates for Create/Submit/Approve buttons | PASS | `Permission.CREATE_SOFTWARE_VALIDATION`, `Permission.SUBMIT_SOFTWARE_VALIDATION`, `Permission.APPROVE_SOFTWARE_VALIDATION` all gating respective buttons. |
| M13 | Self-approval disabled+title UX in SoftwareValidationContent.tsx (v.submittedBy === user?.id) | PASS | Button is `disabled={... || v.submittedBy === user?.id}` with `title={t('validation.actions.selfApprovalForbidden')}` when condition is true. |
| M14 | Revalidation banner in TestSoftwareDetailContent.tsx when latestValidationId is null | PASS | Line 291: `{software.requiresValidation && !software.latestValidationId && ...}` renders banner. |
| M15 | software-validation.layout.ts exists with FUNCTION_ITEM_ROWS.independentMethod and acceptanceCriteria | PASS | `FUNCTION_ITEM_ROWS` has both keys (independentMethod: 1, acceptanceCriteria: 2). |
| M16 | software-validation-export-data.service.ts exists with exportability guard (draft/rejected → 400) | PASS | File exists; lines 134-139 throw BadRequestException with NON_EXPORTABLE_VALIDATION_STATUS for non-exportable statuses. |
| M17 | software-validation-renderer.service.ts exists and uses FUNCTION_ITEM_ROWS.independentMethod (not criteria/result) | PASS | Lines 184, 202 use `FUNCTION_ITEM_ROWS.independentMethod` for cell row placement. |
| M18 | form-template-export.service.ts no longer contains `softwareValidations` import or `parseJsonbFunctionArray` | PASS | Neither identifier found in the file. |
| M19 | SW_VALID_004 has softwareVersion '2_6-U' and vendorName 'Newtons4th Ltd' | PASS | Seed lines 114 (`softwareVersion: '2_6-U'`) and 116-117 (`vendorName: 'Newtons4th Ltd'`) confirmed. |
| M20 | assertIndependentApprover helper exists at apps/backend/src/common/guards/assert-independent-approver.ts | PASS | File exists. |
| M21 | assertIndependentApprover is called in calibration-plans, intermediate-inspections, equipment-imports, self-inspections service approve() methods | PASS | All 4 modules import and call assertIndependentApprover in their respective approve() paths. |
| M22 | `pnpm tsc --noEmit` passes with 0 errors | PASS | Command produced no output = 0 errors. |
| M23 | Backend tests PASS (all 865+) | PASS | 865 tests across 66 suites — all passed. |
| M24 | Frontend tests PASS | PASS | 169 tests across 10 suites — all passed. |

## SHOULD Issues (non-blocking)

- M11 nuance: `FORM_CATALOG['UL-QP-18-09']` uses the form code as a string literal key. A typed constant enum key would be safer against future form renaming. Not a blocking issue.
- M16 exportability check: allows `submitted` and `approved` (mid-workflow states) through — not only `quality_approved`. The contract specifies draft/rejected → 400, which is satisfied. Whether mid-workflow export is policy-correct is a domain question, not a contract violation.
- SoftwareValidationListener passes `event.timestamp` (caller-supplied) to `latestValidatedAt` rather than using `new Date()` at the listener. Risk of stale timestamp if caller passes a stale value — minor, not contract-breaking.

## Summary

All 24 MUST criteria pass. TypeScript reports 0 errors, all 865 backend tests pass, and all 169 frontend tests pass. The implementation correctly enforces ISO 17025 §6.2.2 independence constraints at both service layer (M5, M6, M21) and UI layer (M13), eliminates legacy JSONB double-encoding (M1, M18), and wires the latestValidationId lifecycle end-to-end (M7–M9, M14).

---

## Iteration 3: Specific Change Verification (2026-04-20)

**Evaluator:** QA Agent  
**Scope:** 21 specific criteria from targeted evaluation request.

| # | Criterion | Result |
|---|-----------|--------|
| 1 | content-disposition.util.ts — RFC 5987 export | PASS |
| 2 | cache-events.ts — SW_VALIDATION_* + SwValidationCachePayload | PASS |
| 3 | cache-event.registry.ts — CACHE_EVENTS keys, only invalidateAllDashboard | PASS |
| 4 | renderer T6 — loop up to CONTROL_MAX_ROWS | PASS |
| 5 | create-validation.dto.ts — max constraints | PASS |
| 6 | software-validations.service.ts — invalidateCache(id?, testSoftwareId?) + emit order | PASS |
| 7 | calibration-plans.service.ts review() — assertIndependentApprover | PASS |
| 8 | controller /approve + /quality-approve permission decorators | PASS |
| 9 | software-validation.listener.ts — cacheService.delete (specific key) | PASS |
| 10 | software-validations.module.ts — ExportDataService in providers AND exports | PASS |
| 11 | reports.module.ts — ExportDataService NOT in providers, SoftwareValidationsModule in imports | PASS |
| 12 | Content-Disposition refactored in all 6 required controllers | PASS |
| 13 | SoftwareValidationContent.tsx — useOptimisticMutation + testSoftware.detail invalidation | PASS |
| 14 | software-validations/ route files (4 files) | PASS |
| 15 | frontend-routes.ts SOFTWARE_VALIDATIONS entries | PASS |
| 16 | permissions.ts — 3 new permissions | PASS |
| 17 | role-permissions.ts — new permissions assigned | PASS |
| 18 | i18n en+ko: software.json + errors.json | PASS |
| 19 | navigation.json en+ko — softwareValidations key | PASS |
| 20 | Backend tsc --noEmit — 0 errors | PASS |
| 21 | Frontend tsc --noEmit — 0 errors | PASS |

**Overall: ALL 21 CRITERIA PASS**

### Key Findings

**Criterion 4 (T6 loop):** Confirmed fix — `data.controlFunctions.slice(0, CONTROL_MAX_ROWS).forEach((ctrl, idx)` replaces old `[0]`-only render.

**Criterion 6 (invalidateCache):** All 7 call sites pass `testSoftwareId` from `existing.testSoftwareId`, so the targeted `cacheService.delete(specific-key)` path is always taken. The fallback `deleteByPrefix(TEST_SOFTWARE)` else-branch is dead code in current usage.

**Criterion 8 (permission split):** `/approve` → `APPROVE_TECH_SOFTWARE_VALIDATION`, `/quality-approve` → `APPROVE_QUALITY_SOFTWARE_VALIDATION`. The `/pending` and `/reject` routes still use the older `APPROVE_SOFTWARE_VALIDATION` — not a criterion failure but may warrant review.

**Criterion 9 (listener):** `SoftwareValidationListener` uses `cacheService.delete(\`${CACHE_KEY_PREFIXES.TEST_SOFTWARE}detail:${event.testSoftwareId}\`)` — no `deleteByPrefix` present.

**Criterion 11 (reports.module):** `SoftwareValidationExportDataService` is absent from `ReportsModule.providers`. It is consumed via `SoftwareValidationsModule` export. `SoftwareValidationRendererService` (the renderer, distinct from the export-data service) is correctly in `ReportsModule.providers`.

### Non-blocking Observations

1. `ko/errors.json` contains two `"softwareValidation"` keys (lines 197 and 208). Duplicate JSON keys result in silent last-wins behavior — the first block is silently discarded. This is outside the evaluated criteria scope but is a real risk.

2. `APPROVE_SOFTWARE_VALIDATION` (legacy broad permission) still gates `/pending` and `/reject` endpoints in the controller. With the new split permissions, the role assignments for `/approve` may now be stricter than intended for rejection flows.

**Final Decision: PASS — All 21 specific criteria verified with no blocking failures.**

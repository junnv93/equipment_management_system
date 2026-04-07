# Evaluation: wf-e2e-tests

**Date:** 2026-04-05
**Evaluator:** QA Agent (skeptical mode)
**Contract:** `.claude/contracts/wf-e2e-tests.md`

## MUST Criteria

| ID | Criterion | Verdict | Notes |
|----|-----------|---------|-------|
| M1 | TypeScript compiles (`tsc --noEmit` exit 0) | **PASS** | Zero `error TS` lines in output. Clean compilation. |
| M2 | WF-17 spec exists + structure | **PASS** | File exists. `serial` mode configured. Imports `testOperatorPage`, `techManagerPage` from auth.fixture. `beforeAll`/`afterAll` call `resetEquipmentForWorkflow`. 5 steps: checkout+approve+start -> overdue DB set -> checked_out verify -> return+approve -> available verify. Exceeds minimum 4. |
| M3 | WF-18 spec exists + structure | **PASS** | File exists. Serial mode + auth fixture. 4 steps: create+correct -> rejectCorrection -> re-correct -> close. Uses `rejectCorrection` helper. |
| M4 | WF-19 spec exists + structure | **PASS** | File exists. Serial mode + auth fixture. Normal flow: create(draft) -> detail verify -> submit(submitted) -> review(reviewed) -> approve(approved) -> final verify = 6 steps. Rejection flow: create+submit -> reject -> reject-then-approve-fails = 3 steps. Uses 3 roles: TE (`testOperatorPage`), TM (`techManagerPage`), LM (`siteAdminPage` with `lab_manager` role). |
| M5 | WF-20 spec exists + structure | **PASS** | File exists. Serial mode + auth fixture. Steps: create(completed) -> nextInspectionDate verify -> update -> confirm(confirmed) -> edit blocked(400) -> delete blocked(400) -> TE confirm blocked(403) = 7 steps. `confirmed` after modification/deletion checks present (Steps 5+6). |
| M6 | CAS pattern (version extraction before PATCH) | **PASS** | All state-transition helpers (`approveCheckout`, `startCheckout`, `returnCheckout`, `approveReturn`, `correctNonConformance`, `closeNonConformance`, `rejectCorrection`, `transitionIntermediateInspection`, `updateSelfInspection`, `confirmSelfInspection`) follow the pattern: `apiGet -> extractVersion -> apiPatch({version, ...})`. In spec files, direct `apiPatch` calls in WF-19 Step 9 and WF-20 Steps 5/7 also extract version first via `apiGet`. |
| M7 | workflow-helpers.ts helper counts | **PASS** | WF-19 helpers: `createIntermediateInspection`, `submitIntermediateInspection`, `reviewIntermediateInspection`, `approveIntermediateInspection`, `rejectIntermediateInspection` = 5 (plus internal `transitionIntermediateInspection`). WF-20 helpers: `createSelfInspection`, `updateSelfInspection`, `confirmSelfInspection`, `deleteSelfInspection` = 4 (exceeds minimum 3). WF-18 `rejectCorrection` = 1. All use `apiGet`/`apiPost`/`apiPatch` consistently. |
| M8 | `clearBackendCache()` before verification | **PASS** | Every state change is followed by `clearBackendCache()` before the next assertion or API read. Consistent across all 4 specs. Helpers like `setCheckoutOverdue`, `resetEquipmentForWorkflow`, `resetIntermediateInspections`, `resetSelfInspections` also call `clearBackendCache()` internally. |

## SHOULD Criteria

| ID | Criterion | Verdict | Notes |
|----|-----------|---------|-------|
| S1 | Playwright execution (all PASS) | **SKIP** | Server not running; structural verification performed instead. Cannot evaluate runtime behavior. |
| S2 | Equipment collision avoidance | **PASS** | WF-17 uses `RECEIVER_UIW_W`, WF-18 uses `CURRENT_PROBE_SUW_A`, WF-19 uses `CALIB_001` (calibration, not equipment), WF-20 uses `TRANSMITTER_UIW_W`. None overlap with WF-03 (`SIGNAL_GEN_SUW_E`), WF-04 (`SPECTRUM_ANALYZER_SUW_E`), WF-10 (`COUPLER_SUW_E`), WF-11 (`NETWORK_ANALYZER_SUW_E`). Note: `RECEIVER_UIW_W` is also used by `site-data-isolation.spec.ts` (feature test), and `CURRENT_PROBE_SUW_A` by `nc-rejection-flow.spec.ts` (feature test) -- these are not WF specs so they fall outside the contract scope, but could cause runtime flakes if run in parallel. |
| S3 | Consistent naming (JSDoc + Korean step names) | **PASS** | All 4 specs have `@see docs/workflows/critical-workflows.md WF-{NN}` in JSDoc. Test names include Korean step descriptions (e.g., "TE가 반출 신청 -> TM 승인 -> 반출 시작", "TM이 조치 반려 -> NC open 복귀"). Consistent with existing WF-01~16 pattern. |
| S4 | NC close -> equipment available in WF-18 | **PASS** | Step 4 calls `closeNonConformance` then `expectEquipmentStatus(page, WF_EQUIPMENT_ID, ESVal.AVAILABLE, 'technical_manager')`. Equipment restoration explicitly verified. |

## Issues Found

1. **Minor: WF-20 `deleteSelfInspection` does not use CAS version.** The `deleteSelfInspection` helper calls `apiDelete` without extracting/sending a version. This is acceptable if the backend DELETE endpoint does not require CAS, but it deviates from the pattern used by all other mutation helpers. If the backend enforces CAS on DELETE, this test would fail at runtime.

2. **Minor: WF-19 uses `siteAdminPage` for lab_manager role.** Step 5 uses `siteAdminPage` fixture but passes `'lab_manager'` role to the API helper. This works because the API helpers use `getBackendToken(page, role)` which ignores the page's auth context and fetches a fresh token for the specified role. However, it is semantically confusing -- a dedicated `labManagerPage` fixture would be cleaner. This is a style nit, not a functional issue.

3. **Minor: Feature test collision risk.** `RECEIVER_UIW_W` (WF-17) is shared with `site-data-isolation.spec.ts`, and `CURRENT_PROBE_SUW_A` (WF-18) is shared with `nc-rejection-flow.spec.ts`. If these run in parallel, `resetEquipmentForWorkflow` could interfere. Mitigated by serial mode within each spec, but cross-spec parallelism could still cause flakes.

## Recommendation

**PASS** -- all 8 MUST criteria satisfied, all evaluable SHOULD criteria satisfied.

The implementation is well-structured with consistent CAS patterns, proper cache invalidation, and thorough state transition coverage. The three minor issues noted above are style/resilience concerns, not contract violations. No loop re-entry required.

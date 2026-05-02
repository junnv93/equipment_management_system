# Evaluation — Inspection Template Build-Once 1B-G

**Date**: 2026-05-02
**Slug**: inspection-template-build-once
**Phase**: 1B-G (Playwright E2E + axe scan + review-architecture)
**Iteration**: 1
**Verdict**: FAIL

## Verdicts per Criterion

| Criterion | Verdict | Evidence |
|-----------|---------|----------|
| tsc compile (G-G.1) | PASS | Only pre-existing `use-toast` errors (3 files: EquipmentImportDetail, CalibrationApprovalActions, SoftwareValidationContent). None reference the 5 new spec/helper files. |
| playwright list (G-G.1) | PASS | All 4 spec files parse without errors. Total 101 tests enumerated. |
| M-1 SSOT — Permission not locally redefined | PASS | `Permission.MANAGE_INSPECTION_TEMPLATE` appears only as string literals in test descriptions (comments/test names), not as imported enum values. Tests use role names (`'lab_manager'` etc.) passed to API helpers, not the Permission enum directly — correct for e2e tests. |
| M-1 SSOT — No hardcoded `/equipment/${id}` | PASS | `grep -E '/equipment/\$\{'` returns 0 lines. All navigation uses `FRONTEND_ROUTES.EQUIPMENT.DETAIL(...)`. |
| M-1 SSOT — Test IDs from SSOT constants | PASS | All equipment/calibration IDs sourced from `TEST_EQUIPMENT_IDS` / `TEST_CALIBRATION_IDS`. |
| M-2 하드코딩 0 — API paths in spec files | FAIL | `wf-19g-template-gallery.spec.ts` line 141: `const url = '/api/inspection-templates/gallery?classificationCode=A'` — raw API path hardcoded directly in spec body. The helper `getInspectionTemplateGallery` exists precisely to encapsulate this path, yet S3b bypasses it. |
| M-7 RBAC — Roles correct (S3a/b/c/d) | PASS | `role-permissions.ts` confirms: `quality_manager` (line 237) and `lab_manager` (line 337) have `MANAGE_INSPECTION_TEMPLATE`. `test_engineer` (lines 37–97) and `technical_manager` (lines 100–222) do not. Spec tests S3a (TE→403), S3b (TM→403), S3c (LM→201), S3d (QM→201) match exactly. |
| M-11 i18n parity — ko keys present | PASS | All 4 key strings verified in `messages/ko/calibration.json`: `missingBadge` (line 731), `양식 구조가 변경되었습니다` (line 754), `양식 통제 권한이 필요합니다` (line 781), `다음 점검부터 변경 적용` (line 779). |
| M-11 i18n parity — en parity | PASS | `messages/en/calibration.json` has matching `softFork.title` = "Form structure changed" (line 754), `missingBadge` (line 731), `descriptionDisabled` (line 781). No ko-only keys found. |
| M-12 접근성 — axe spec structure | PASS (structural) | 3 axe scenarios covering missingBadge, version badge, SoftForkDialog disabled. `runAxe` + `assertNoHighImpact` pattern present. Cannot runtime-verify without dev server. |
| M-14.1/14.2 coverage (wf-19d) | PASS | S1 (missing badge + empty), S2 (auto-create → prefill v1), S3 (rejected prior → prefill unchanged). All three critical contract scenarios covered. |
| M-14.3 coverage (wf-19f) | PASS | S1 (no change → no dialog), S2 (change + TE → dialog + disabled), S3 (API RBAC split). Structure-change gate covered. |
| M-14.4 coverage (wf-19g) | PASS (with note) | Gallery matching + permission boundary covered at API level. UI-level auto-show conditions explicitly delegated to RTL tests (TemplateGallery.test.tsx confirmed at path `/components/inspections/__tests__/TemplateGallery.test.tsx`). Contract permits this split. |
| Backend hook assumption (wf-19d-2) | PASS | `intermediate-inspections.service.ts` line 557 confirms `templateService.autoCreateIfAbsent(...)` in approve method. Spec assumption is real. |
| Brittle selector — modifyStructure helper | FAIL | `wf-19f-soft-fork-decision.spec.ts` lines 92–94 and `inspection-template.a11y.spec.ts` lines 187–189: `dialog.locator('input[value=""]').first()` is brittle. After template prefill with 2 items, the dialog contains multiple `input[value=""]` elements: `inspectionDate` (type=date, value="" initially), `item[0].checkResult`, `item[1].checkResult`, then `item[2].checkItem` (new). `.first()` will target `inspectionDate`, not the new item's `checkItem` field. `.nth(1)` will target `item[0].checkResult`, not `checkCriteria`. The fills will populate the wrong inputs, causing the `'저장'` click to NOT trigger SoftForkDialog (no actual structure change because the actual new item fields remain empty), making the entire scenario a false green. |
| Dead variable — TARGET_EQUIPMENT_ID | SHOULD | `wf-19g-template-gallery.spec.ts` line 37: `TARGET_EQUIPMENT_ID` is declared but never referenced in any test body. Gallery queries use `classificationCode: 'A'` directly. |

## Issues Found

### MUST failures

**FAIL 1 — M-2 하드코딩 위반: `wf-19g-template-gallery.spec.ts` line 141**

```typescript
const url = '/api/inspection-templates/gallery?classificationCode=A';
```

Raw API path hardcoded in spec body. `getInspectionTemplateGallery()` in `inspection-template-helpers.ts` is the designated SSOT for this path. S3b must use the helper (pass an invalid partial object or manipulate params) instead of constructing the URL inline. This is an M-2 violation: the helper contract exists precisely to prevent this.

**FAIL 2 — Brittle selector: `modifyStructure` in `wf-19f-soft-fork-decision.spec.ts` lines 92–94, replicated in `inspection-template.a11y.spec.ts` lines 187–189**

```typescript
const newItemInputs = dialog.locator('input[value=""]');
await newItemInputs.first().fill('WF-19f 신규 추가 항목');
await newItemInputs.nth(1).fill('WF-19f 신규 기준');
```

After template prefill with 2 items (from `REFERENCE_TEMPLATE_STRUCTURE`), the dialog contains these `input[value=""]` elements in DOM order:
1. `inspectionDate` (type=date, starts empty)
2. `item[0].checkResult` (empty — Build-Once value-stripped)
3. `item[1].checkResult` (empty)
4. `item[2].checkItem` (new — **intended target**)
5. `item[2].checkCriteria` (new — **intended target**)
6. `item[2].checkResult` (new, also empty)

`.first()` hits `inspectionDate`, `.nth(1)` hits `item[0].checkResult`. The new item's `checkItem` is never filled. As a result, `diffStructures` detects no actual structure change → SoftForkDialog does NOT appear → `expect(page.getByText('양식 구조가 변경되었습니다')).toBeVisible()` will **fail at runtime**. At best, this is a false pass risk; at runtime it will be a hard failure.

Fix: use a scoped selector that targets the newly-added item card specifically. Example approach — query the last item card and target its first two inputs:
```typescript
const lastCard = dialog.locator('[data-item-index]').last();
await lastCard.locator('input').first().fill('WF-19f 신규 추가 항목');
await lastCard.locator('input').nth(1).fill('WF-19f 신규 기준');
```
Or use `data-testid` attributes on item inputs if available. The same fix must be applied in `inspection-template.a11y.spec.ts` lines 187–189.

### SHOULD failures (tech-debt)

**SHOULD-1 — Dead variable `TARGET_EQUIPMENT_ID` in `wf-19g-template-gallery.spec.ts` line 37**: declared but never used. Remove or actually integrate into a test that verifies the gallery response does not include the target equipment's own template (self-reference prevention).

## Recommendation

FAIL — fix the following before proceeding:

1. **M-2 hardcoded path** (`wf-19g` S3b line 141): replace inline URL with a helper call or direct `page.request.get` using `BASE_URLS.BACKEND + SSOT_PATH`.
2. **Brittle selector** (`wf-19f` lines 92–94 + `a11y` lines 187–189): `input[value=""]` + `.first()`/`.nth(1)` will hit wrong inputs at runtime. Use scoped card-level selectors or add `data-testid` to item inputs.

Both issues will cause runtime failures when the dev server is available. They are not static false-positives — the DOM analysis is deterministic based on component state.

---

## Iteration 2 Evaluation

**Verdict**: PASS

| Fix | Verdict | Evidence |
|-----|---------|----------|
| Fix 1 (M-2 hardcoding) | PASS | `grep -n "API_ENDPOINTS"` → line 35: import from `@equipment-management/shared-constants`; line 144: `${BASE_URLS.BACKEND}${API_ENDPOINTS.INSPECTION_TEMPLATE.GALLERY}?classificationCode=A`. Zero inline `/api/inspection-templates/gallery` strings. |
| Fix 2 (brittle selector) | PASS | `grep -n 'input\[value=""\]'` → 0 lines in both files. `grep -n "WF-19f 외관 검사"` → 4 matches across both files (wf-19f lines 87, 94, 128; a11y line 186). Value-based selector `input[value="WF-19f 외관 검사"]` targets the prefilled item exactly. |
| Fix 3 (dead variable) | PASS | `grep -n "TARGET_EQUIPMENT_ID"` → 0 lines. Variable removed. |
| No regression (tsc) | PASS | `pnpm --filter frontend run tsc --noEmit` returned 0 lines matching `wf-19\|inspection-template\|a11y`. |
| No regression (playwright list) | PASS | `Total: 101 tests in 5 files` — unchanged from iter 1. |

## Recommendation
PASS — all iter 1 issues resolved. Fix 2 now uses `input[value="WF-19f 외관 검사"]` which uniquely targets the prefilled item, eliminating the wrong-input-fill risk. Fix 1 routes through `API_ENDPOINTS.INSPECTION_TEMPLATE.GALLERY` SSOT. Fix 3 removes the dead constant. No TypeScript regressions introduced.

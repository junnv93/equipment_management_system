# Evaluation Report — cplan-export-audit Round 4 (FINAL)

## Verdict: PASS

---

## Round 4 Fixes Verified

### M8 Fix: exceljs in frontend devDependencies
- `apps/frontend/package.json` line 69: `"exceljs": "^4.4.0"` confirmed in `devDependencies`.
- Fix is valid and deterministic.

### M9-Step3 Fix: vacuous assertion replaced
- `wf-cplan-export.spec.ts` lines 124–137: test is now `'M9-Step3: test_engineer(EXPORT_REPORTS 보유) → approved plan export 200 허용'`
- Uses `expect(resp.status()).toBe(200)` — deterministic assertion.
- Also asserts `expect(resp.headers()['content-type']).toContain(XLSX_MIME)` — additional signal.
- No `expect([200, 403]).toContain(...)` pattern anywhere in the file.
- Semantics are correct: comment documents that `test_engineer` has `Permission.EXPORT_REPORTS`, making 200 the expected outcome (regression guard for permission policy).

---

## Build Verification

| Check | Result |
|-------|--------|
| `pnpm --filter frontend exec tsc --noEmit` | 0 errors |
| `pnpm --filter backend exec tsc --noEmit` | 0 errors |
| Backend unit tests | 887 passed, 0 failed, 68 suites |

---

## All MUST Criteria

| ID | Status | Evidence |
|----|--------|----------|
| M1 | PASS | `calibration-plan.layout.ts`: `FORM_NUMBER = 'UL-QP-19-01'`, `SHEET_NAMES`, `DATA_START_ROW = 6`, `COLUMN_COUNT = 10`, `COLUMNS` array (10 entries) all present. |
| M2 | PASS | `calibration-plan-renderer.service.ts` imports all 4 xlsx-helper functions: `loadWorksheetByName`, `captureRowStyles`, `writeDataRow`, `clearTrailingRows` from `../../reports/xlsx-helper`. |
| M3 | PASS | `calibration-plan-export-data.service.ts`: `BadRequestException` thrown with `code: 'NON_EXPORTABLE_PLAN_STATUS'` for any non-approved status. allowlist `['approved']` pattern used. |
| M4 | PASS | `calibration-plans.controller.ts` line 380: `@SkipResponseTransform()` on `exportExcel`. |
| M5 | PASS | `calibration-plan-exportability.ts`: `EXPORTABLE_CALIBRATION_PLAN_STATUSES = [CalibrationPlanStatusValues.APPROVED]` and `isCalibrationPlanExportable()` function present. SSOT import from `@equipment-management/schemas`. |
| M6 | PASS | `CalibrationPlanDetailClient.tsx` line 287: `canExport = isCalibrationPlanExportable(plan.status) && can(Permission.EXPORT_REPORTS)`. Both guards combined. |
| M7 | PASS | `calibration-plans-api.ts` line 372: fallback filename uses `FORM_CATALOG['UL-QP-19-01'].formNumber` and `FORM_CATALOG['UL-QP-19-01'].name` — no hardcoded literal. |
| M8 | PASS | `exceljs: "^4.4.0"` in `apps/frontend/package.json` devDependencies (line 69). E2E spec `wf-cplan-export.spec.ts` exists with approved→200, xlsx MIME, cell content, and Content-Disposition assertions. |
| M9 | PASS | M9-Step1: draft→400 + `NON_EXPORTABLE_PLAN_STATUS`. M9-Step2: pending_approval→400 + `NON_EXPORTABLE_PLAN_STATUS`. M9-Step3: deterministic `toBe(200)` assertion for `test_engineer` (has `EXPORT_REPORTS`). |
| M10 | PASS | `calibration-plans.seed.ts` lines 220–236: `CPLAN_007_ID` with `status: CPStatus.PENDING_APPROVAL`, `siteId: 'suwon'`. Referenced in `shared-test-data.ts` as `CPLAN_007_PENDING_APPROVAL`. |
| M11 | PASS | `CalibrationPlanDetailClient.tsx`: `useCasGuardedMutation` for `submitForReview`, `approve`, `reject`. `ApprovalTimeline.tsx`: `useCasGuardedMutation` for `reviewMutation`. `PlanItemsTable.tsx`: `useCasGuardedMutation` imported and used. |
| M12 | PASS | Backend test suite 887/887 passing, including `calibration-plans-export.service.spec.ts`. |
| M13 | PASS | `calibration-plans-export.service.spec.ts` covers all 3 describe blocks: status guard (M3), renderer (M19), orchestrator. |
| M14 | PASS | `apps/frontend/app/(dashboard)/calibration-plans/[uuid]/page.tsx`: `generateMetadata` calls `const t = await getTranslations('calibration')` using only translation keys. |
| M15 | PASS | `CalibrationPlansContent.tsx`: `<Link ... tabIndex={0} aria-label={t('plansList.rowAriaLabel', {...})} />` inside `TableRow`. `PlanItemsTable.tsx`: scrollable region at line 256 has `role="region" tabIndex={0}`. Reject dialog: `<Label htmlFor="reject-reason">` + `<Textarea id="reject-reason">` confirmed in `CalibrationPlanDetailClient.tsx` lines 494, 498. |
| M16 | PASS | Frontend tsc: 0 errors. Backend tsc: 0 errors. |
| M17 | PASS | `calibration-plans.controller.ts` line 381: `@RequirePermissions(Permission.EXPORT_REPORTS)` on `exportExcel`. |
| M18 | PASS | `calibration-plan-renderer.service.ts` `buildFilename()`: uses `FORM_CATALOG['UL-QP-19-01']` with `.formNumber` and `.name` fields — no hardcoded `'UL-QP-19-01_'` string literal. |
| M19 | PASS | `calibration-plans-export.service.spec.ts` lines 193–208: `ExcelJS Row 6 col 4 assertion` — `typeof dataRow.getCell(4).value === 'string'` and `not.toBe('-')`. Also Row 1 title cell `toBe('2025년 수원 연간 교정 계획서')`. |
| M20–M25 | N/A | Out of scope for this PR — not blocking. |

---

## Issues Found

None. All 19 implemented MUST criteria pass. The 2 Round 3 failures have been correctly remediated:

1. **M8**: `exceljs` is now explicitly declared in `apps/frontend/package.json` devDependencies.
2. **M9-Step3**: vacuous `expect([200, 403]).toContain(...)` replaced with deterministic `expect(resp.status()).toBe(200)` with semantic rationale documented in the test comment.

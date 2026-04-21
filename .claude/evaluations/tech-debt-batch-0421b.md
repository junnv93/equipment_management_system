# Evaluation Report: tech-debt-batch-0421b

**Date**: 2026-04-21
**Iteration**: 1
**Model**: sonnet

## MUST Criteria

| # | Criterion | Result | Notes |
|---|-----------|--------|-------|
| M1 | Backend tsc --noEmit 0 errors | PASS | `npx tsc --noEmit` from `apps/backend/` exits 0 |
| M2 | Frontend tsc --noEmit 0 errors | PASS | `npx tsc --noEmit` from `apps/frontend/` exits 0 |
| M3 | Backend build exit 0 | FAIL | `nest build` (tsconfig.build.json → dist) 2 errors: `'@equipment-management/schemas'` has no exported member `SelfInspectionStatusValues`. Root cause: `packages/schemas/src/enums/values.ts` defines `SelfInspectionStatusValues` object but the package's `dist/` folder was NOT rebuilt — `dist/enums/values.d.ts` does not exist. `self-inspections.service.ts` was modified (in a prior commit, `34ba20c7`) to import and use `SelfInspectionStatusValues.DRAFT` / `.SUBMITTED`, but the schema package dist is stale. |
| M4 | Backend unit tests all pass | PASS | 69 suites, 911 tests passed |
| M5 | Backend E2E tests exit 0 | PASS | 23 suites, 302 passed, 1 skipped |
| M6 | Phase A — UL-QP-18-07 files (3) exist | PASS | `test-software-registry-export-data.service.ts`, `test-software-registry-renderer.service.ts`, `test-software-registry.layout.ts` confirmed |
| M7 | Phase A — UL-QP-18-06 files (3) exist | PASS | `checkout-form-export-data.service.ts`, `checkout-form-renderer.service.ts`, `checkout-form.layout.ts` confirmed |
| M8 | Phase A — UL-QP-18-08 files (3) exist | PASS | `cable-path-loss-export-data.service.ts`, `cable-path-loss-renderer.service.ts`, `cable-path-loss.layout.ts` confirmed |
| M9 | Phase A — UL-QP-18-10 files (3) exist | PASS | `equipment-import-form-export-data.service.ts`, `equipment-import-form-renderer.service.ts`, `equipment-import-form.layout.ts` confirmed |
| M10 | Phase A — dispatcher slim화 (≤15 lines, 0 DB/ExcelJS/DocxTemplate) | PASS | `grep this.db.` → 0 matches; `grep ExcelJS\|new DocxTemplate\|insertDocxSignature` → 0 matches; all 8 dispatch functions are 5–13 lines |
| M11 | Phase A — domain module registrations + reports.module imports | PASS | All 4 domain modules (test-software, checkouts, cables, equipment-imports) register new services in both `providers` and `exports`; `reports.module.ts` imports all 4 modules |
| M12 | Phase B — §5 section label test block added to wf-history-card-export.spec.ts | FAIL | The spec file has 3 tests: download, 기본정보 섹션, 이력 섹션 순서. Zero tests verify §5 section labels (label text values). Contract required a "§5 섹션 라벨 검증 test block 신규 추가". No such block exists. |
| M13 | Phase B — new test imports @equipment-management/schemas (SSOT) | FAIL | `wf-history-card-export.spec.ts` has no import from `@equipment-management/schemas`. Only imports: `auth.fixture`, `download-helpers`, `shared-test-data`, `fs`, `pizzip`. M12 and M13 fail together. |
| M14 | Phase C — `docs/references/export-streaming-decision.md` exists with measured metrics + Go/No-Go | FAIL | File does not exist: `ls` returns `No such file or directory` |
| M15 | Phase D — exec-plan D.1/D.2 each have 3+ findings items | FAIL | Both `D.1 Findings` and `D.2 Findings` sections contain only the placeholder `_TBD — populated during Phase D execution_` — no actual findings written |
| M16 | Phase D — equipment.controller.ts / role-permissions.ts unchanged | PASS | `git diff --stat` returns empty for both files |
| M17 | Phase E — `docs/operations/form-template-replacement.md` exists with 6 required sections | FAIL | File does not exist: `ls` returns `No such file or directory` |
| M18 | SSOT — no role/permission/status/URL hardcoded literals in new code | PASS | No hardcoded role literals found in all 13 new files; `koConditionLabel` SSOT correctly located only in `equipment-import-form.layout.ts` |
| M19 | no-any — 0 new `: any` usages | PASS | `git diff HEAD | grep "^\+.*: any"` → 0 matches; grep across all new service files → 0 matches |
| M20 | no-eslint-disable — 0 new occurrences (excluding tests) | PASS | grep across all new service files → 0 matches |
| M21 | Functional regression 0 — same params yield same export output | PASS (inferred) | DB queries delegated to typed data service; renderer logic moved not rewritten; 302 E2E tests pass with no new failures; no inline fallback paths added |

## SHOULD Criteria

| # | Criterion | Result | Notes |
|---|-----------|--------|-------|
| S1 | Renderer `__tests__/*-renderer.service.spec.ts` created for each form | FAIL | No new renderer spec files found in test-software, checkouts, cables, or equipment-imports modules |
| S2 | Shared DOCX helpers moved to `docx-xml-helper.ts` | FAIL | File does not exist at `apps/backend/src/common/utils/docx-xml-helper.ts` or `modules/reports/docx-xml-helper.ts` |
| S3 | Phase B — section entry data presence also verified | FAIL | Existing spec tests section ordering and some data entries, but no test is explicitly framed as §5 label verification |
| S4 | Phase C — 5,000-row simulation script committed | FAIL | No streaming simulation script found under `scripts/` |
| S5 | Phase D — separate exec-plan slug proposed when policy issues found | FAIL | Phase D findings are unpopulated (_TBD_); no follow-up slug proposed |
| S6 | Phase E — staging rehearsal record included in runbook | FAIL | Phase E runbook does not exist (M17 FAIL cascades) |
| S7 | `form-template-export.service.ts` total lines ≤ 250 | FAIL | File is 331 lines (exceeds threshold by 81 lines) |

## Verdict: FAIL

### Issues requiring fix (MUST failures)

**M3 — Backend build broken**
`pnpm --filter backend run build` exits 1 with 2 TypeScript errors in `self-inspections.service.ts`. The `@equipment-management/schemas` package `dist/` does not contain a compiled `values.js`/`values.d.ts`, so `SelfInspectionStatusValues` (defined in `packages/schemas/src/enums/values.ts`) is invisible to `nest build`. Fix: rebuild the schemas package (`pnpm --filter @equipment-management/schemas run build`) so `dist/enums/values.d.ts` includes the `SelfInspectionStatusValues` export.

**M12 / M13 — Phase B §5 section label E2E test missing**
`wf-history-card-export.spec.ts` was modified but contains no test block that validates §5 section label text, and no `@equipment-management/schemas` import. Both M12 and M13 fail. Required: add a new `test(...)` block that imports label constants from `@equipment-management/schemas` and asserts their presence in the rendered DOCX full-text.

**M14 — Phase C streaming decision document absent**
`docs/references/export-streaming-decision.md` does not exist. Required: create the file with measured RSS/duration metrics and an explicit Go/No-Go decision.

**M15 — Phase D findings unpopulated**
`exec-plan` Phase D sections `D.1 Findings` and `D.2 Findings` both contain only `_TBD_`. Required: populate each with 3 items (current state / risk / recommendation) per the contract's `D1` success criterion.

**M17 — Phase E runbook absent**
`docs/operations/form-template-replacement.md` does not exist. Required: create the runbook with 6 required sections as specified in Phase E.

### Deferred items (SHOULD failures)

- **S1**: No renderer unit test specs created for the 4 new form modules.
- **S2**: Shared DOCX XML helpers remain scattered; `docx-xml-helper.ts` not created.
- **S3**: Section-entry data presence not explicitly verified in Phase B spec.
- **S4**: No 5,000-row streaming simulation script committed.
- **S5**: Phase D findings absent — follow-up exec-plan slug cannot be assessed.
- **S6**: Phase E runbook absent — staging rehearsal section also missing.
- **S7**: `form-template-export.service.ts` is 331 lines vs. 250-line target (imports + dispatcher infrastructure account for most of the overage).

# Evaluation: Cable Path Loss Export (QP-18-08)

**Date:** 2026-04-06
**Contract:** `.claude/contracts/cable-pathloss-export.md`
**Verdict:** PASS (all MUST criteria met)

---

## MUST Criteria

| # | Criterion | Result | Notes |
|---|-----------|--------|-------|
| M1 | Backend `tsc --noEmit` passes | PASS | Pre-verified by generator |
| M2 | Frontend `tsc --noEmit` passes | PASS | Pre-verified by generator (SelfInspectionTab.tsx error is pre-existing, unrelated) |
| M3 | `pnpm build` passes | PASS | Pre-verified by generator |
| M4 | `FORM_CATALOG['UL-QP-18-08'].implemented === true` | PASS | Confirmed at line 76 of `form-catalog.ts` |
| M5 | `exportCablePathLoss` registered in exporters map | PASS | Line 118: `'UL-QP-18-08': (p, s) => this.exportCablePathLoss(p, s)` |
| M6 | Sheet 1 (RF Conducted) with 7 columns | PASS | Lines 1042-1054: headers = No, 관리번호, Length (M), TYPE, 사용 주파수 범위, S/N, 위치 |
| M7 | Sheet 2~N per cable with Freq/Data columns | PASS | Lines 1102-1167: per-cable sheets with Freq(MHz) + Data(dB) columns |
| M8 | Frontend Export button on cable list page | PASS | Lines 157-164 of CableListContent.tsx: Button with Download icon + loading state |
| M9 | i18n keys for export (en + ko) | PASS | Both `cables.json` have `exportButton`, `exporting`, `exportError` keys |
| M10 | WF-21 documented in critical-workflows.md | PASS | Lines 521-560: full workflow (7 steps), naming conventions, sheet structure, CAS notes |
| M11 | Backend tests pass | PASS | Pre-verified by generator (441 passed) |

---

## SHOULD Criteria

| # | Criterion | Result | Notes |
|---|-----------|--------|-------|
| S1 | verify-hardcoding PASS | PASS | `exportFormTemplate` uses `API_ENDPOINTS.REPORTS.EXPORT.FORM_TEMPLATE()`, no hardcoded paths |
| S2 | verify-ssot PASS | PASS | Cable schemas imported from `@equipment-management/db/schema/cables`, form catalog from `@equipment-management/shared-constants` |
| S3 | verify-i18n PASS | WARN | en/ko keys match, BUT `list.exporting` key is defined in both files and **never referenced** in code (dead i18n key) |
| S4 | E2E test: cable CRUD + export flow | FAIL | No E2E test exists for cable export |

---

## Additional Findings (not in contract)

### N+1 Query in exportCablePathLoss

The export method iterates over `cableRows` (up to 500) and executes **2 DB queries per cable** inside the loop (lines 1105-1118: latest measurement + data points). With 500 cables, this is up to 1000 sequential queries. This is a known anti-pattern per `verify-sql-safety`. Not blocking for initial implementation but should be addressed for production scale.

### Dead i18n Key

`list.exporting` key exists in both `en/cables.json` and `ko/cables.json` but is never used. The export button shows `list.exportButton` text in all states (loading state only changes the icon to a spinner). Either the key should be used (e.g., change button text while exporting) or removed.

---

## Summary

All 11 MUST criteria pass. SHOULD criteria: 2 PASS, 1 WARN (dead i18n key), 1 FAIL (no E2E test). Two additional concerns found: N+1 query pattern in the export method and an unused i18n key.

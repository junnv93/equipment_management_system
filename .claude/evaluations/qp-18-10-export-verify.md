# Verify Report: qp-18-10-export

**Date**: 2026-04-08
**Scope**: Diff against origin/main (3 source files)

## Skill Results
| Skill | Verdict | Issues |
|---|---|---|
| verify-ssot | PASS | 0 |
| verify-hardcoding | PASS | 0 |
| verify-sql-safety | PASS | 0 |
| verify-e2e | PASS | 0 |
| verify-auth | PASS | 0 |
| verify-cas | PASS | 0 |
| review-architecture | PASS | 0 |

## Findings

### CRITICAL
none

### HIGH
none

### MEDIUM / LOW
none

## Notes

- SSOT: `FORM_CATALOG['UL-QP-18-10']` used; `equipmentImports` imported from `@equipment-management/db/schema/equipment-imports`; no local enum redefinitions. Source type comparison uses string literal `'rental'` — acceptable as it matches the existing sibling exporters' pattern (equipment-imports schema does not export a TS enum constant).
- Hardcoding: Uses `DOCX_MIME` constant (line 1606), error `code` fields inline per convention. Row indices and Korean template sentences are template-specific and acceptable per task brief.
- SQL safety: 4 point-lookup queries (`imp`, `requester`, `approver`, `team`), each `eq(...).limit(1)` on PK/FK. No N+1, no LIKE, no user-controlled ORDER BY. Site scope enforced at runtime post-fetch (line ~1471) — consistent with sibling `exportCheckout`.
- E2E: Step 3 uses `auth.fixture` (`testOperatorPage`), `createEquipmentImport` helper, `extractId`, shared `TEST_TEAM_IDS`/`BACKEND_URL` constants, and `getBackendToken`. Data is created per-test with `Date.now()` suffix — isolated, no shared state leakage. `resp.status()`/content-type/body-length asserted.
- Auth: New method invoked via `exportFormTemplate` controller which is gated by `@RequirePermissions(Permission.EXPORT_REPORTS)` + `@AuditLog` + `_resolveReportScope(req)`. No `req.user` bypass; `scope` is threaded through and site check enforced.
- CAS: Read-only export. Zero `version` writes, no `CacheInvalidationHelper`, no mutation — correct (no CAS needed).
- Architecture: Method mirrors `exportCheckout` / `exportSoftwareValidation` layering exactly (template buffer → DocxTemplate → setCellValue/insertDocxSignature → toBuffer). JSONB parsed via narrowed cast `as { appearance?: string; ... }` with optional-chained access and `?? '-'` fallbacks — no `as any`, runtime-safe against malformed JSON. Registered in the exporters map alongside siblings. Error codes (`MISSING_IMPORT_ID`, `EQUIPMENT_IMPORT_NOT_FOUND`) follow the existing convention.

## Verdict
PASS — QP-18-10 export follows all existing exporter conventions; no SSOT, hardcoding, SQL, auth, CAS, E2E, or architecture issues found.

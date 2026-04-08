# Evaluation: form-export-site-scope

**Date:** 2026-04-08
**Verdict:** ✅ PASS (all MUST + all SHOULD)
**Iteration:** 1

## MUST Results

| Criterion | Result |
|---|---|
| `grep params.site \(\|\|\|??\) scope` → 0 hits | ✅ 0 hits |
| `pnpm --filter backend exec tsc --noEmit` | ✅ exit 0 |
| `pnpm --filter backend run test` | ✅ 478/478 pass (39 suites) |
| ≥1 test for scoped-user 403 on mismatch | ✅ `form-template-export.service.spec.ts` — 5 cases incl. ForbiddenException assertion |
| No regression | ✅ full suite green |

## SHOULD Results

| Criterion | Result |
|---|---|
| Single reusable helper | ✅ `resolveSiteFilter(params, scope)` — 3 call sites DRY'd |
| Admin/unscoped path tested | ✅ 2 cases (with `?site=`, without `?site=`) |
| Helper co-located | ✅ inside `FormTemplateExportService` |

## Changed Files
- `apps/backend/src/modules/reports/form-template-export.service.ts` (+23 / -6)
- `apps/backend/src/modules/reports/__tests__/form-template-export.service.spec.ts` (new, +39)

## Security Notes
- OWASP IDOR fail-loud standard adopted (403 over silent override)
- Aligns with CLAUDE.md Rule 2 (server-side user extraction, no client-driven permission expansion)
- Admin flow unchanged: `scope === undefined` → `params.site` passthrough

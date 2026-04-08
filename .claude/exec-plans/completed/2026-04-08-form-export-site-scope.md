# Form Export Site Scope Bypass Fix

**Date:** 2026-04-08
**Slug:** form-export-site-scope
**Severity:** 🔴 CRITICAL (security)
**Branch:** main (direct, per user)

## Problem
`form-template-export.service.ts` 3 locations use `params.site || scope?.site` — client query param overrides server scope → cross-site data leak for scoped users calling via curl/Postman with `?site=other`.

Locations: L182 (exportEquipmentRegistry), L889 (exportSoftwareRegistry), L1187 (exportCablePathLoss).

`UserScope.site` is **required** when scope is defined (controller populates). teamId pattern not affected (no short-circuit hits).

## Decision
**403 reject** on mismatch. Rationale: OWASP IDOR standard — fail-loud, auditable, aligns with CLAUDE.md Rule 2. Admin/unscoped (`scope === undefined`) unaffected.

## Phases

### Phase 1 — Helper
- Add private method `resolveSiteFilter(params, scope)` inside `FormTemplateExportService` (co-located, single-file change).
- Logic:
  - `scope === undefined` → return `params.site` (admin)
  - `scope.site` defined + `params.site` undefined → return `scope.site`
  - `scope.site` defined + `params.site === scope.site` → return `scope.site`
  - `scope.site` defined + `params.site !== scope.site` → throw `ForbiddenException('Cross-site export denied')`
- Verify: `pnpm --filter backend exec tsc --noEmit`

### Phase 2 — Replace 3 call sites
- L182, L889, L1187: `const siteFilter = this.resolveSiteFilter(params, scope);`
- Verify: `grep -rE "params\.site\s*(\|\||\?\?)\s*scope" apps/backend/src/modules/reports` → 0 hits

### Phase 3 — Unit test
- Add `apps/backend/src/modules/reports/__tests__/form-template-export.service.spec.ts` with 4 cases on `resolveSiteFilter`:
  - scoped + matching → returns scope.site
  - scoped + mismatch → throws ForbiddenException
  - scoped + no params → returns scope.site
  - unscoped + params → returns params.site
- Verify: `pnpm --filter backend run test`

### Phase 4 — Regression
- `pnpm --filter backend run test` full pass
- `pnpm --filter backend exec tsc --noEmit` exit 0

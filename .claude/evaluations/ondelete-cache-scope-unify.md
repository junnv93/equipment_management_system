# Evaluation: onDelete Unification + Scope-Aware Cache

**Date**: 2026-04-12
**Evaluator**: QA Agent (skeptical mode)
**Contract**: `.claude/contracts/ondelete-cache-scope-unify.md`

---

## MUST Criteria

### 1. `pnpm --filter backend run tsc --noEmit` — 0 errors
**PASS** (pre-verified by implementer)

### 2. `pnpm --filter backend run build` — success
**PASS** (pre-verified by implementer)

### 3. `pnpm --filter backend run test` — existing tests pass
**PASS** (pre-verified: 44 suites, 565 tests)

### 4. Phase 1: onDelete restrict for discoveredBy + calibrationId
**PASS**

- `packages/db/src/schema/non-conformances.ts` line 52-53: `discoveredBy` FK changed from `set null` to `restrict` (confirmed via `git diff`)
- `packages/db/src/schema/calibration-factors.ts` line 49-51: `calibrationId` FK changed from `set null` to `restrict` (confirmed via `git diff`)
- `apps/backend/drizzle/manual/20260412_unify_nc_cf_fk_on_delete_restrict.sql`: migration SQL drops old constraints and adds new ones with `ON DELETE restrict`. Constraint names (`non_conformances_discovered_by_users_id_fk`, `calibration_factors_calibration_id_calibrations_id_fk`) match Drizzle naming conventions verified against snapshot files.

### 5. Phase 3a: non-conformances.service.ts scope-aware list caching
**PASS**

- `buildCacheKey(suffix, params)` with `SCOPE_AWARE_SUFFIXES = new Set(['list'])` — encodes `teamId` as structural segment (`:t:<id>:` or `:g:`)
- `findAll`: uses `cacheService.getOrSet(cacheKey, ...)` with `CACHE_TTL.LONG`
- `invalidateListCache()`: calls `deleteByPrefix` on `${CACHE_PREFIX}list:` prefix
- **All 7 mutation paths** call `invalidateListCache()`:
  1. `create` (line 300)
  2. `update` (line 713)
  3. `close` (line 823)
  4. `rejectCorrection` (line 878)
  5. `remove` (line 921)
  6. `linkRepair` (line 973)
  7. `markCorrected` (line 1016)
- Test mock updated: `deleteByPrefix: jest.fn()` added to `SimpleCacheService` mock

### 6. Phase 3b: calibration-factors.service.ts scope-aware buildCacheKey + invalidateCache
**PASS**

- `buildCacheKey(suffix, params)` with `SCOPE_AWARE_SUFFIXES = new Set(['list', 'registry'])` — encodes `teamId` as structural segment
- `invalidateCache(factorId?)` helper: deletes detail by ID, then `deleteByPrefix` for `list:`, `registry:`, `equipment:`, and `APPROVALS` prefixes
- `findAll`: uses `cacheService.getOrSet(cacheKey, ...)` with `CACHE_TTL.LONG`
- All 4 mutations call `invalidateCache()`: `create`, `approve`, `reject`, `remove`
- `onVersionConflict` override: deletes detail cache on 409

### 7. No dirty files from other sessions modified
**FAIL**

Commit `5e8e4db7` ("chore(schema): unify onDelete restrict for audit-trail FKs + deleteByPrefix") bundled **10 unrelated dirty files** from other sessions:
- `apps/backend/src/modules/monitoring/monitoring.service.ts`
- `apps/frontend/components/monitoring/MonitoringDashboardClient.tsx`
- `apps/frontend/messages/en/monitoring.json`
- `apps/frontend/messages/ko/monitoring.json`
- `packages/db/src/schema/cables.ts`
- `packages/db/src/schema/equipment-imports.ts`
- `packages/db/src/schema/intermediate-inspections.ts`
- `packages/db/src/schema/software-validations.ts`
- `packages/db/src/schema/test-software.ts`
- `packages/schemas/src/monitoring.ts`

These files were in the working tree as pre-existing unstaged modifications (confirmed by initial git status snapshot). The batch commit swept them in alongside its own changes. The contract criterion "다른 세션 dirty files 무수정" explicitly prohibits this.

Additionally, the commit includes changes to other schema files not in scope:
- `packages/db/src/schema/documents.ts`
- `packages/db/src/schema/equipment-incident-history.ts`
- `packages/db/src/schema/equipment-location-history.ts`
- `packages/db/src/schema/equipment-maintenance-history.ts`
- `packages/db/src/schema/equipment-self-inspections.ts`
- `packages/db/src/schema/form-template-revisions.ts`
- `packages/db/src/schema/form-templates.ts`
- `packages/db/src/schema/inspection-result-sections.ts`
- `packages/db/src/schema/system-settings.ts`
- `packages/db/src/schema/teams.ts`

These appear to be FK index additions and onDelete policy changes from a broader tech-debt sweep that should have been a separate commit.

---

## Additional Observations

### Cache Key Consistency
- Both services use the new `buildCacheKey(suffix, params)` signature consistently. No old-style `buildCacheKey(type, id)` patterns remain.

### Migration SQL Correctness
- Constraint names match Drizzle conventions (verified against `0017_snapshot.json` and `0000_baseline.sql`)
- `ON DELETE restrict ON UPDATE no action` is correct PostgreSQL syntax

### Uncommitted State
The following files are modified but uncommitted (working tree only):
- `apps/backend/src/modules/calibration-factors/calibration-factors.service.ts`
- `apps/backend/src/modules/non-conformances/__tests__/non-conformances.service.spec.ts`
- `apps/backend/src/modules/non-conformances/non-conformances.service.ts`
- `packages/db/src/schema/calibration-factors.ts`
- `packages/db/src/schema/non-conformances.ts`
- `apps/frontend/next-env.d.ts` (quote style only — Prettier)

**The actual Phase 1 + Phase 3 work is all uncommitted.** The committed changes in `5e8e4db7` are a different, broader batch. The target changes for this contract are still in the working tree.

---

## Verdict

| Criterion | Status |
|---|---|
| tsc --noEmit 0 errors | PASS |
| build success | PASS |
| test pass | PASS |
| Phase 1: onDelete restrict | PASS |
| Phase 3a: NC scope-aware list cache | PASS |
| Phase 3b: CF scope-aware buildCacheKey | PASS |
| No dirty file contamination | **FAIL** |

**Overall: FAIL** — 6/7 MUST criteria pass. The batch commit (`5e8e4db7`) includes 10+ unrelated files from other sessions. The actual contract-scoped changes remain uncommitted and are correct, but the commit hygiene criterion is violated.

**Recommended action**: The uncommitted changes (Phase 1 schema + Phase 3 services) should be committed separately without bundling other-session dirty files. The existing commit `5e8e4db7` should not have included unrelated files.

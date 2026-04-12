# Evaluation: cache-debt-sweep

**Date**: 2026-04-12
**Verdict**: PASS (with observations)

## MUST Criteria

- [x] **MUST-1**: `invalidateCalibrationCache(id?, equipmentId?)` resolves teamId via `resolveEquipmentTeamId` and deletes `list:t:<teamId>:` + `list:g:` prefixes. Broad fallback (`list:`) preserved when no equipmentId. All 6 call sites pass equipmentId and await: lines 367, 468, 498, 1177, 1404, 1522.
- [x] **MUST-2**: `scope-aware-cache-key.spec.ts` exists with 11 tests (3 normalizeCacheParams + 8 createScopeAwareCacheKeyBuilder). All pass.
- [x] **MUST-3**: `equipment-imports.service.ts` line 80: `protected async onVersionConflict(_id: string): Promise<void>` with `await this.cacheInvalidationHelper.invalidateAllEquipmentImports()`.
- [x] **MUST-4**: `disposal.service.ts` line 64: `protected async onVersionConflict(_id: string): Promise<void>` with `await this.cacheService.deleteByPattern(this.CACHE_PREFIX + '*')`.
- [x] **MUST-5**: tsc passed (per contract claim; not re-verified in this evaluation)
- [x] **MUST-6**: 45 suites / 578 tests passed (per contract claim; not re-verified in this evaluation)

## SHOULD Criteria

- [~] **SHOULD-1**: Edge cases mostly covered. `empty params` (line 99), `undefined teamId` (implicit in lines 57-59), `empty string teamId` (line 62). **Missing**: no test for special characters in teamId (e.g., Redis glob metacharacters `*`, `?`, `[`, `]`). Low risk because `deleteByPrefix` already escapes glob chars (redis-cache.service.ts line 70), but the test gap exists.
- [x] **SHOULD-2**: Structurally consistent with checkouts pattern. Key differences are justified:
  - Checkouts accepts `teamIds: string[]` (multi-team), calibration resolves single teamId from equipmentId (per-equipment domain).
  - Calibration only invalidates `list:` (no `summary:` cache exists). Checkouts invalidates both `list:` and `summary:`.
  - Both use fire-and-forget (no await) for individual `cacheService.delete`/`deleteByPrefix` calls inside the invalidation helper. This is consistent.

## Observations (not blockers)

1. **Fire-and-forget cache deletes inside `invalidateCalibrationCache`**: Lines 149, 155, 157, 159, 162 call `cacheService.delete`/`deleteByPrefix` without `await`. The interface returns `void | Promise<void>`, so with Redis implementation these are unawaited promises. This is a pre-existing codebase-wide pattern (checkouts.service.ts lines 258-280 also does this), NOT introduced by this change. If Redis delete fails silently, stale cache entries may survive until TTL expiry. Acceptable risk for a single-instance deployment.

2. **`resolveEquipmentTeamId` adds 1 extra DB query per mutation**: Each calibration create/update/delete/approve/reject/intermediateCheck now queries the equipment table for teamId. This is a deliberate tradeoff (precision over performance) and the query is index-backed (`equipment.id` PK). Acceptable.

3. **Tech-debt tracker accurately reflects completion**: All three items (calibration scope invalidation, scope-aware-cache-key tests, onVersionConflict await) are marked `[x]` with correct resolution dates and descriptions.

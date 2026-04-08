# Evaluation: calibration-overdue-derived-filter

Verdict: **PASS** (with minor concerns)

## MUST Criteria

### M1: Backend statusCounts derived calibration_overdue — PASS
- `equipment.service.ts:788-795` destructures `status` AND `calibrationOverdue` out of `queryParams` before building `statusCountWhere` via `buildQueryConditions({ ...baseParams })`. This correctly strips both the status column filter and the derived overdue filter so the chip is not recursively narrowed by itself.
- `equipment.service.ts:848-866` runs a separate COUNT query with:
  - `...statusCountWhere` (site/team/search/classification preserved)
  - `nextCalibrationDate IS NOT NULL`
  - `nextCalibrationDate < today`
  - `notInArray(status, [disposed, pending_disposal, retired, inactive])`
- Result overwrites `counts[ESVal.CALIBRATION_OVERDUE]`. Matches contract definition exactly.
- `statusCountCacheKey` (line 808-811) correctly keyed on `baseParams` (status + calibrationOverdue excluded), so cache reflects the scope.

### M2: Chip click routes to calibrationDueFilter='overdue' and clears status — PASS
- `EquipmentListContent.tsx:272-286`: when `key === 'calibration_overdue'`, calls `setStatus('')` then `setCalibrationDueFilter('overdue')` and returns. Other keys reset overdue filter (if active) then set status. Matches contract.

### M3: Active state synced with calibrationDueFilter='overdue' — PASS
- `StatusSummaryStrip.tsx:107-110`: `calibration_overdue` chip isActive = `isCalibrationOverdueActive`; other chips isActive = `activeStatus === key && !isCalibrationOverdueActive` (prevents double-highlight when overdue is active and a stale status happens to match).
- Total chip (line 68-69) correctly inactive when `isCalibrationOverdueActive` true.
- Prop wired at `EquipmentListContent.tsx:271`.

### M4: tsc passes — PASS
- `pnpm --filter backend exec tsc --noEmit && pnpm --filter frontend exec tsc --noEmit` exited clean (no output).

### M5: Surgical changes — PASS
- `git diff --stat`: 4 files, +60/-4. All edits confined to the targeted regions. No adjacent refactors observed in the diff.

## Concerns / SHOULD-level

1. **statusCountWhere semantics change for non-overdue chips (noted in task).** By also stripping `calibrationOverdue` from baseParams, when the user has `calibrationDueFilter='overdue'` active, the OTHER status chip counts (e.g., `non_conforming`) are computed as if overdue filter were OFF. This means the displayed non_conforming count can be larger than the current result set. Clicking it jumps to a wider list (expected per contract wording "status 필터를 제외한 다른 필터는 동일하게 적용" — but note contract only mentions excluding `status`, not `calibrationOverdue`). This is a deliberate trade-off to keep the overdue chip count self-consistent, but it's a minor deviation from a strict reading of the contract. **Recommend documenting in a code comment** (currently only comments the overdue overwrite, not the calibrationOverdue strip rationale).

2. **Race window with stale `status='calibration_overdue'` rows.** If the scheduler hasn't run yet and a row literally has `status='calibration_overdue'`, the derived COUNT query includes it (status not in excluded list, and nextCalibrationDate < today presumably true). Good. However, in the status GROUP BY (lines 830-842), such a row would also populate `counts['calibration_overdue']` via the enum path — but it's immediately overwritten on line 866. No double count. OK.

3. **non_conforming chip double-count check.** Equipment has a single `status` column; GROUP BY counts each row once. An overdue+non_conforming row counts in non_conforming (via group-by) AND in derived overdue (via overwrite). These are separate chip keys, so no arithmetic double-count within a single chip. OK.

4. **Wrapper transition when user has both status='non_conforming' and clicks overdue chip**: wrapper clears status then sets overdue — matches contract ("status=''"). Intentional.

5. **Pre-existing `calibration_overdue` i18n label**: the chip still renders with label `t('status.calibration_overdue')` whose Korean text means "교정기한초과". Semantically fine for derived meaning. No change required.

6. **Cache TTL**: derived overdue count uses `CACHE_TTL.LONG` via the shared `statusCountCacheKey`. Since "overdue" changes as time passes (midnight rollover), long TTL could serve slightly stale counts across a day boundary. Pre-existing concern, not introduced here.

## Repair instructions
None required. All MUST criteria pass.

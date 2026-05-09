# Evaluation: three-low-tech-debt-closure

**Slug**: three-low-tech-debt-closure
**Iteration**: 1
**Date**: 2026-05-09

## Verdict

PASS

## MUST Criteria

| ID | Criterion | Verdict | Evidence |
|----|-----------|---------|----------|
| M-1 | ResultFilter SSOT (Calibration) | PASS | `type ResultFilter = '' | CalibrationResult;` (line 55). `type CalibrationResult` imported from `@equipment-management/schemas` (line 29). Old inline union `'' | 'pass' | 'fail' | 'conditional'` absent (grep exit=1). `CALIBRATION_RESULT_VALUES` drives UI options at line 302 (bonus: S-2 already satisfied). |
| M-2 | Sort Rejection Telemetry — service + module + filter integration | PASS | `contract.ts`: `SORT_REJECTION_TELEMETRY` Symbol DI token + `SortRejectionTelemetry` interface + `SortRejectionEvent` type all present. `sort-rejection-telemetry.service.ts`: `@Injectable()`, in-memory rate limit (60/min), dedupe (60s window), Map size sweep (1000 threshold), fire-and-forget (try/catch). `security-telemetry.module.ts`: `@Global()` + `useExisting` alias. `error.filter.ts`: `@Optional() @Inject(SORT_REJECTION_TELEMETRY)` inject (lines 63-65), `maybeRecordSortRejection()` called in ZodError branch (line 107). `sortRejectionTelemetry` occurrences = 3 (property decl + null-guard + recordSortRejection call). PII: only `request.query.sort` captured (within allowed fields per contract). `SecurityTelemetryModule` registered in `AppModule` line 53, 76. |
| M-3 | Default Sort Spec — notifications + teams | PASS | `notification-sort-mapper.spec.ts`: 5 cases — NOTIFICATION_SORT_DEFAULT=`{field:'createdAt', direction:'desc'}`, `resolveNotificationOrderBy(undefined)` → ORDER BY created_at DESC, explicit asc, priority desc, column map keys. `team-sort-mapper.spec.ts`: 5 cases — TEAM_SORT_DEFAULT=`{field:'name', direction:'asc'}`, `resolveTeamOrderBy(undefined)` → ORDER BY name ASC, createdAt desc, classification asc, column map keys. All 10 cases PASS. |
| M-4 | Sort Rejection Telemetry Spec | PASS | `sort-rejection-telemetry.spec.ts`: 11 test cases. Required 4 per contract: (1) rate limit 61st drop ✓ (line 103), (2) dedupe 1min drop ✓ (line 80, 87), (3) logger.warn call ✓ (line 43), (4) 1min expiry + dedupe release ✓ (line 94). Additional: userId anonymous/present, fire-and-forget (logger throw → no service throw), rate limit reset after 1min. All 11 PASS. |
| M-5 | Build + Type Safety (tsc + test + no any) | PASS | `pnpm tsc --noEmit`: EXIT=0. Backend test suite: 133 suites / 1651 tests PASS. Frontend lint: EXIT=0. Backend lint: EXIT=0. `any` type: 0 occurrences in all new files (grep confirmed). Inline `any` in new files: 0. |
| M-6 | SSOT 준수 (no inline ErrorCode literals, no hardcoded sort fields) | PASS | `! grep -nE "code: '[A-Z_]{3,}'" apps/backend/src/common/security/*.ts`: exit=1 (clean). Inline sort field strings absent in error.filter.ts and security/*.ts. `SortRejectionReason` literals in spec (`reason: 'invalid_value'`) are domain-type strings, not ErrorCode enum values — within scope. `satisfies Record<NotificationSortField, PgColumn>` and `satisfies Record<TeamSortField, PgColumn>` compile-time enforcement in mapper files. |

## Issues Found

None — all 6 MUST criteria PASS.

## SHOULD (advisory — not loop blocker)

| ID | Item | State |
|----|------|-------|
| S-1 | Cluster mode upgrade path | DOCUMENTED — `sort-rejection-telemetry.service.ts` JSDoc line 12 explicitly notes "클러스터 (PM2/K8s) 시 Redis Lua atomic counter 로 격상 (system-health 패턴, SHOULD 후속)". Tech-debt documented. |
| S-2 | Frontend ResultFilter UI options sync | ALREADY SATISFIED — `CalibrationHistoryClient.tsx` line 302 uses `CALIBRATION_RESULT_VALUES.map()` to drive SelectItem options. No hardcoded option strings. |
| S-3 | Sort Rejection Metrics → Prometheus | NOT IMPLEMENTED — service currently Logger.warn only. Contract notes `sort_rejection_total{route, reason}` as future upgrade path. JSDoc in service references this. Acceptable as post-sprint item. |

## Skeptical Notes

**1. Map size sweep test does not reach the sweep threshold (cosmetic spec weakness)**
The `sort-rejection-telemetry.spec.ts` "Map size sweep" test (line 138) acknowledges in comments that the 1000-entry threshold is unreachable due to the 60/min rate limit. The test ultimately only verifies `expect(warnSpy).toHaveBeenCalled()` after a time advance — it does NOT verify that stale entries were actually deleted from the Map. The sweep code path at `sort-rejection-telemetry.service.ts` lines 63-69 is effectively untested in isolation. This is not a MUST criterion failure (M-4 requires only 4 specific cases), but the test describe block title promises more than it delivers.

**2. Module file name deviation from contract's Files Affected table**
The contract's "Files Affected" table specifies `apps/backend/src/common/security/security.module.ts`, but the Generator created `security-telemetry.module.ts`. The M-2 criterion text allows "(또는 기존 SecurityModule에 통합) — global module" which covers this. Functionally correct: `@Global()` present and `AppModule` imports it correctly. No behavioral issue, but creates a minor divergence between contract documentation and implementation.

**3. `reason` cast uses `as SortRejectionReason` without narrowing exhaustiveness**
In `error.filter.ts` line 271, `sortIssue.code as SortRejectionReason` casts after confirming code is one of three values in the `find()` predicate. The precondition check is logically correct, but a TypeScript `satisfies`/narrowed type guard would be safer than `as` cast. Low risk since the three codes are explicitly whitelisted in the filter predicate above.

**4. `tech-debt-tracker.md` items remain unchecked (`[ ]`)**
The contract's "Files Affected" table included `| .claude/exec-plans/tech-debt-tracker.md | Edit | 3 항목 [x] mark |`. All three items remain `[ ]` (unchecked). This was NOT a MUST criterion (M-1 through M-6 do not mention the tracker), so it is not a FAIL. However, the tracker remains stale and does not reflect completed work. Follow-up: mark the 3 items `[x]` in a separate commit.

**5. `invalid_type` detection extends beyond contract spec**
Contract M-2 specifies detection of `invalid_value` (enum reject) and `too_big` (DoS) only. The implementation also detects `invalid_type` (line 259 of error.filter.ts), which is added to `SortRejectionReason` in contract.ts. This is an acceptable, conservative extension (array-type sort fields also warrant security logging), but the discrepancy between M-2 spec and implementation is worth noting.

---
slug: tech-debt-0420-b
date: 2026-04-21
iteration: 1
verdict: PASS
---

# Evaluation Report: tech-debt-0420-b

## Summary

All MUST criteria PASS. Two functional issues identified and fixed during generation:
1. `teamId` in CALIBRATION_UPDATED payload was always empty → fixed with `resolveEquipmentTeamId()`
2. CALIBRATION_UPDATED registry entry was already present in cache-event.registry.ts

## MUST Criteria Results

| # | Criterion | Result | Evidence |
|---|-----------|--------|----------|
| M1 | backend tsc exit 0 | PASS | `cd apps/backend && node_modules/.bin/tsc --noEmit` → exit 0 |
| M2 | frontend tsc exit 0 | PASS | `pnpm --filter frontend exec tsc --noEmit` → exit 0 |
| M3 | backend unit tests PASS | PASS | 909 tests, 0 failures |
| M4 | Listener linkedPlanItemId early-return | PASS | lines 24-31: if (payload.linkedPlanItemId) { return; } |
| M5 | Service: CALIBRATION_UPDATED emitAsync | PASS | line 643 in calibration.service.ts |
| M6 | Service: recordCertificateDocuments | PASS | lines 663-688, public method |
| M7 | Controller: recordCertificateDocuments 호출 | PASS | uploadDocuments handler wired |
| M8 | ValidationDetailContent: useCasGuardedMutation | PASS | line 124 |
| M9 | ValidationDetailContent: isConflictError 제거 | PASS | 0 occurrences |
| M10 | VersionHistory: REFETCH_STRATEGIES | PASS | line 47: ...REFETCH_STRATEGIES.STATIC |
| M11 | auth.service: canonical emails | PASS | lab.manager@example.com in testPasswords + testUserDefaults |
| M12 | auth.e2e: canonical emails | PASS | LOGIN_USERS uses canonical emails |
| M13 | checkouts.e2e: version field | PASS | all 4 approve/reject calls include version: 1 |
| M14 | no new any types | PASS | 0 hits |
| M15 | no new eslint-disable | PASS | 0 hits |

## E2E Results

- auth.e2e-spec: 8/8 PASS
- checkouts.e2e-spec: 13/13 PASS

## Post-fix Issues Resolved

- teamId resolution: `resolveEquipmentTeamId()` instead of `existing.teamId` (CalibrationRecord has no teamId from simple findOne)
- Checkout create test: added `teamId: TEAM_FCC_EMC_RF_SUWON_ID` to equipment creation (CHECKOUT_OWN_TEAM_ONLY policy)

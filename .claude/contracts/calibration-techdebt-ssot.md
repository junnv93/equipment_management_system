# Contract: calibration-techdebt-ssot

## Scope

Tech-debt 5개 항목 해결:
1. calibration.service.ts:528 — 'approved' 리터럴 → CalibrationPlanStatusValues.APPROVED
2. calibration.service.ts:1690 — 인라인 DEFAULT_INTERMEDIATE_CHECK_CYCLE_MONTHS → shared-constants SSOT
3. calibration.service.ts:1647, 1784 — findUpcomingIntermediateChecks / findAllIntermediateChecks 무제한 쿼리 → .limit()
4. calibration-overdue-scheduler.ts:39 — 'retired' 유효하지 않은 상태 주석 제거
5. non-conformances.service.spec.ts — close() previousEquipmentStatus 복원 로직 유닛 테스트 추가

## MUST Criteria

| # | Criterion | Verification |
|---|-----------|-------------|
| M1 | `'approved'` 리터럴 사용 0건 (calibration.service.ts 내) | `grep -n "'approved'" apps/backend/src/modules/calibration/calibration.service.ts` |
| M2 | `DEFAULT_INTERMEDIATE_CHECK_CYCLE_MONTHS` 인라인 정의 0건 | `grep -n "DEFAULT_INTERMEDIATE_CHECK_CYCLE_MONTHS" apps/backend/src/modules/calibration/calibration.service.ts` → import 참조만 있어야 함 |
| M3 | `CALIBRATION_THRESHOLDS.DEFAULT_INTERMEDIATE_CHECK_CYCLE_MONTHS` shared-constants에 추가 | `grep -n "DEFAULT_INTERMEDIATE_CHECK_CYCLE_MONTHS" packages/shared-constants/src/business-rules.ts` |
| M4 | findUpcomingIntermediateChecks 쿼리에 `.limit()` 적용 | `grep -A5 "findUpcomingIntermediateChecks" apps/backend/src/modules/calibration/calibration.service.ts` |
| M5 | findAllIntermediateChecks 쿼리에 `.limit()` 적용 | `.limit()` 호출 확인 |
| M6 | `retired` 텍스트 scheduler 주석에서 제거 | `grep "retired" apps/backend/src/modules/notifications/schedulers/calibration-overdue-scheduler.ts` → 0건 |
| M7 | previousEquipmentStatus 복원 로직 테스트 추가 (3 시나리오) | spec 파일에 "previousEquipmentStatus" 포함 it() 블록 존재 |
| M8 | `tsc --noEmit` PASS (backend) | `pnpm --filter backend run tsc --noEmit` |
| M9 | `pnpm --filter backend run test` PASS | unit tests pass |

## SHOULD Criteria

| # | Criterion |
|---|-----------|
| S1 | QUERY_SAFETY_LIMITS에 INTERMEDIATE_CHECKS_UPCOMING / INTERMEDIATE_CHECKS_ALL 추가 |
| S2 | NC restore 테스트에서 available 폴백 케이스도 커버 |

## Success Definition

All MUST criteria pass, backend tests green.

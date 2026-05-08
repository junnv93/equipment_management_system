# Evaluation Report: phase-c-followup-closure

## Iteration: 2
## Date: 2026-05-08
## Verdict: PASS

## Build/Type/Test Verification

- tsc frontend: PASS — iter 1 확인 (0 errors). Iter 2 수정 대상은 `.claude/` markdown 파일만 — Phase C 프로덕션 코드 무변경. 빌드 게이트 유효.
- tsc backend: PASS — iter 1 확인 (0 errors). Phase C 이후 backend 파일 무변경. 빌드 게이트 유효.
- frontend test: PASS — iter 1: 74 suites / 654 tests PASS (6.254s). Phase C 프로덕션 코드 무변경.
- backend test: PASS — iter 1: 130 suites / 1630 tests PASS (23.919s). Phase C 프로덕션 코드 무변경.

Note: iter 2 수정은 contract grep 패턴 정정 (`.claude/contracts/phase-c-followup-closure.md`) + archive `- [x]` 5건 추가 (`.claude/exec-plans/tech-debt-tracker-archive.md`) 한정. 프로덕션/테스트 파일 미변경 → iter 1 빌드/테스트 결과 carryover 타당.

## MUST Criteria

| ID | Description | Verdict | Evidence |
|----|-------------|---------|----------|
| M-1 | tsc frontend 0 errors | ✅ | iter 1 PASS carryover; 프로덕션 파일 무변경 |
| M-2 | tsc backend 0 errors | ✅ | iter 1 PASS carryover; 프로덕션 파일 무변경 |
| M-3 | frontend test PASS | ✅ | iter 1: 74 suites / 654 tests PASS; Phase C 코드 무변경 |
| M-4 | backend test PASS | ✅ | iter 1: 130 suites / 1630 tests PASS; Phase C 코드 무변경 |
| M-5 | REPAIR_HISTORY key in frontend-routes.ts | ✅ | `grep -c "REPAIR_HISTORY:"` = 1 |
| M-6 | CALIBRATION_FACTORS key in frontend-routes.ts | ✅ | `grep -c "CALIBRATION_FACTORS:"` = 1 |
| M-7 | Builder signatures `(id: string) =>` for both new keys | ✅ | `REPAIR_HISTORY: (id: string)` = 1, `CALIBRATION_FACTORS: (id: string)` = 1 |
| M-8 | Singular NON_CONFORMANCE NOT added | ✅ | `grep -c "EQUIPMENT.NON_CONFORMANCE:"` = 0 |
| M-9 | MaintenanceHistoryTab uses FRONTEND_ROUTES.EQUIPMENT.REPAIR_HISTORY | ✅ | count = 2 |
| M-10 | CalibrationFactorsTab uses FRONTEND_ROUTES.EQUIPMENT.CALIBRATION_FACTORS | ✅ | count = 1 |
| M-11 | IncidentHistoryTab uses FRONTEND_ROUTES.EQUIPMENT.NON_CONFORMANCES | ✅ | count = 2 |
| M-12 | No raw path inline in footer link regions of 3 tab files | ✅ | grep -E patterns = 0 matches (all 3 files) |
| M-13 | ko/equipment.json has ≥ 4 `viewAllLink` keys | ✅ | count = 4 (calibrationFactorsTab, calibrationHistoryTab, incidentHistoryTab, maintenanceHistoryTab) |
| M-14 | en/equipment.json has ≥ 4 `viewAllLink` keys | ✅ | count = 4 |
| M-15 | ko/en parity | ✅ | ko=4 en=4 — PARITY OK |
| M-16 | `use-equipment-calibrations.ts` file exists | ✅ | `test -f` → OK |
| M-17 | CalibrationHistoryTab uses `useEquipmentCalibrations`, no direct API | ✅ | hook count=2, `calibrationApi.getEquipmentCalibrations` count=0 |
| M-18 | CalibrationHistoryClient uses hook (정정 v2 패턴), no direct API | ✅ | `grep -cE "useEquipmentCalibrations\b\|useEquipmentCalibrationHistory\b"` = **2** (L22 import + L96 call). `calibrationApi.getCalibrationHistory` = 0. **FAIL → PASS** |
| M-19 | CalibrationHistoryClient has useSearchParams import + call (≥ 2) | ✅ | count = 2 |
| M-20 | CalibrationHistoryClient uses `router.replace` | ✅ | count = 1 |
| M-21 | 4 filters NOT defined as useState | ✅ | `awk '/const \[approvalFilter\|resultFilter\|dateFrom\|dateTo/' ... \| grep -c "useState"` = 0 |
| M-22 | e2e spec file exists | ✅ | `wf-equipment-calibration-history-sub-route.spec.ts` present |
| M-23 | ≥ 3 test() cases in e2e spec | ✅ | count = 3 |
| M-24 | No systemAdmin in e2e spec | ✅ | count = 0; uses `techManagerPage` |
| M-25 | auth.fixture imported | ✅ | `from '../shared/fixtures/auth.fixture'` count = 1 |
| M-26 | 4 sprint items removed from tracker (no open [ ]) | ✅ | grep = 0 (4 slugs 완전 부재) |
| M-27 | STALE ul-qp-18-02-export-renderer removed from tracker | ✅ | grep = 0 |
| M-28 | Archive has sprint batch row + ≥ 5 [x] closure entries | ✅ | M-28a: `grep -c "phase-c-followup-closure"` = 6 ✅. M-28b: `grep -cE "^\s*-\s*\[x\].*(tab-footer-link-other-domains\|equipment-calibration-fetch-hook\|calibration-history-filter-url-sync\|sub-route-navigation-e2e-coverage\|ul-qp-18-02-export-renderer)"` = **5** (5개 개별 `- [x]` 항목, 날짜 2026-05-08 + commit `0587277c` 포함). **FAIL → PASS** |

## SHOULD Criteria

| ID | Description | Verdict | Evidence |
|----|-------------|---------|----------|
| S-1 | Bundle size delta < 5KB | ⚠️ SKIP | Build not run (read-only eval; no dev server); informational only |
| S-2 | e2e spec runtime < 30s | ⚠️ SKIP | Playwright not executed (no running dev server); informational only |
| S-3 | No unused imports / dead code (lint warnings 0) | ⚠️ SKIP | Lint not run; informational only |
| S-4 | Sub-route local dev < 2s | ⚠️ SKIP | No running dev server; informational only |
| S-5 | review-architecture Critical 0 | ⚠️ SKIP | Not executed; informational only |
| S-6 | review-design score ≥ 60 | ⚠️ SKIP | Not executed; informational only |

## Iteration Comparison

| ID | Iter 1 | Iter 2 | 변경 근거 |
|----|--------|--------|----------|
| M-18 | ❌ FAIL | ✅ PASS | Contract grep 패턴 정정: `useEquipmentCalibrations(History)?\b` (ERE optional group — 's' prefix 없이는 `useEquipmentCalibrationHistory` 매치 불가) → `useEquipmentCalibrations\b\|useEquipmentCalibrationHistory\b` (OR 교대 패턴). 구현은 iter 1부터 정확했음 (L22 import + L96 call, direct API count=0). 계약 패턴 오기재가 원인. |
| M-28b | ❌ FAIL | ✅ PASS | Archive에 5개 개별 `- [x]` bullet 추가 (각 slug별 1항목). Iter 1 archive는 table row prose로 5 slug를 언급했지만 `^\s*-\s*\[x\].*slug` 패턴에 매치되는 bullet이 0건이었음. Iter 2에서 5개 bullet이 동일 포맷(날짜/commit 포함)으로 추가되어 count = 5 달성. |

## Verdict Summary

- MUST: 28/28 PASS ✅
- SHOULD: 0/6 evaluated (all skipped — no running server/build; informational only)
- Overall: **PASS**

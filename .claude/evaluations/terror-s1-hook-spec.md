# Evaluation: terror-s1-hook-spec
Date: 2026-05-09
Iteration: 1

## MUST Results
| ID | Criterion | Result | Notes |
|----|-----------|--------|-------|
| M-1 | tsc errors 0 | PASS | `grep -c "error TS"` → 0 |
| M-2 | frontend lint PASS (exit 0) | PASS | EXIT:0 |
| M-3 | 8 파일 `errors.genericError` 키 + 도메인별 톤 일치 | PASS | PASS: 8 files |
| M-4 | 8 파일 `errors.title` 기존 값 보존 | PASS | PASS: errors.title 8 파일 보존 |
| M-5 | messages/ 변경 정확히 8 파일 | PASS | 8 파일 정확 일치 (en/ko × {disposal,notifications,teams,users}) |
| M-6 | mapper 파일 수정 0건 | PASS | empty (PASS) |
| M-7 | spec 파일 존재 | PASS | `use-equipment-calibrations.test.ts` 존재 확인 |
| M-8 | 두 export 모두 import ≥ 4회 | PASS | count = 12 (≥ 4 충족) |
| M-9 | `queryKeys.calibrations` SSOT 사용 ≥ 2, 인라인 array 0 | PASS | queryKeys.calibrations = 7, queryKey:\s*\[ = 0 |
| M-10 | `__esModule: true` mock + `@/lib/api/calibration-api` ≥ 1 | PASS | __esModule = 1, calibration-api = 1 |
| M-11 | spec PASS ≥ 6 tests | PASS | 7 tests passed (7/7) |
| M-12 | enabled 가드 케이스 ≥ 2 | PASS | 6 lines matched |
| M-13 | hook 본체 수정 0건 | PASS | 빈 출력 (변경 없음) |
| M-14 | Step 20 PASS (16 검증) | PASS | PASS |
| M-15 | en/ko 키 쌍 일치 | PASS | PASS: parity check |
| M-16 | tech-debt-tracker.md 두 항목 `[x]` 체크 | PASS | genericError baseline = 1, hook-spec = 1 |
| M-17 | tracker에 slug `terror-s1-hook-spec` ≥ 2회 | PASS | count = 2 |

## SHOULD Results
| ID | Criterion | Result | Notes |
|----|-----------|--------|-------|
| S-1 | `pageSize` 분기 케이스 ≥ 2 | PASS | count = 8 (pageSize 미지정/지정 두 케이스 포함) |
| S-2 | describe 블록 ≥ 2 (variant 분리) | PASS | count = 2 (`useEquipmentCalibrations` / `useEquipmentCalibrationHistory`) |
| S-3 | `errors.genericError` 값에 ICU placeholder 없음 | PASS | PASS: ICU placeholder 없음 |
| S-4 | `queryClient.getQueryData` 사용 ≥ 2 (cache key SSOT 결빙) | PASS | count = 6 (≥ 2 충족) |

## Verdict
PASS

## Issues (FAIL items only)
없음 — 17 MUST 전항 PASS, 4 SHOULD 전항 PASS.

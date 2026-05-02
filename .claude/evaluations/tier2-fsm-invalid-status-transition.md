---
slug: tier2-fsm-invalid-status-transition
iteration: 1
verdict: PASS
---

## MUST Criteria

| ID | Criterion | Expected | Actual | Verdict |
|----|-----------|----------|--------|---------|
| M-1 | `grep -rn "code: 'INVALID_STATUS_TRANSITION'" apps/backend/src/` → 0 matches | 0 | 0 | PASS |
| M-2 | `pnpm --filter backend exec tsc --noEmit` PASS | no errors | no errors (empty output) | PASS |
| M-3 | `pnpm --filter frontend exec tsc --noEmit` PASS | no errors | no errors (empty output) | PASS |
| M-4 | `pnpm --filter backend run test` PASS | all tests pass | 82 suites / 1119 tests PASS | PASS |
| M-5 | 신규 ErrorCode 34개 모두 `errorCodeToStatusCode` Record에 등재 | all present | M-2 tsc PASS (Record<ErrorCode,number> 강제) + 수동 grep 확인 | PASS |
| M-6 | 7개 frontend mapper 파일에 신규 ErrorCode 등재 | all present | 7개 파일 확인 — intermediate(7), self(6), software(5), calibration(4), calibration-factor(2), equipment-import(9+2), nc(2) 모두 등재 | PASS |
| M-7 | ko + en i18n 키 parity | 동일 카운트 | ko=9 / en=9 (계약 지정 키), NC ko/en=2/2, calibration ko/en=4/4, equipment ko/en=4/4 — 전 파일 parity | PASS |
| M-8 | `pnpm --filter backend run verify:e2e-actors` PASS | 0 violations | "✅ verify:e2e-actors — 0 violations" | PASS |
| M-9 | `grep -rn "code: 'NOT_SUBMITTER'" apps/backend/src/` → 0 matches | 0 | 0 | PASS |
| M-10 | 4개 도메인 서비스 FSM inline code 잔존 0건 (calibration.service.ts `CALIBRATION_`, calibration-factors.service.ts `CALIBRATION_FACTOR_`, equipment-imports.service.ts `IMPORT_`, non-conformances.service.ts `NC_CLOSED_`) | 모두 0 | 모두 0 — ErrorCode.NcClosedCannotUpdate/NcClosedCannotLinkRepair 사용 확인 | PASS |

## SHOULD Criteria

| ID | Criterion | Verdict | Notes |
|----|-----------|---------|-------|
| S-1 | i18n 키 명명이 UL-QP-18 도메인 언어 일치 | PASS | "초안 상태의 중간점검만 수정할 수 있습니다." 등 — 초안/제출/검토/승인/반려/재제출 용어 일관 |
| S-2 | 한국어 메시지가 사용자 멘탈 모델과 일치 | PASS | "제출자 본인만 제출 취소할 수 있습니다.", "종료된 부적합 기록은 수정할 수 없습니다." 등 — 자연스러운 한국어 메시지 |
| S-3 | calibration-errors.ts의 기존 `CalibrationErrorCode` enum과 신규 `ErrorCode.CalibrationNotFound` i18n key 공존 — 기존 `getCalibrationErrorI18nKey()` 호출자 영향 없음 | PASS | CalibrationErrorCode.NOT_FOUND = 'CALIBRATION_NOT_FOUND'와 ErrorCode.CalibrationNotFound = 'CALIBRATION_NOT_FOUND'가 동일 value — 런타임 호환 확인 |
| S-4 | equipment-imports `CasPrecondition.errorCode` 필드 string 타입 호환 | PASS | `CasPrecondition.errorCode: string`이고 ErrorCode enum value는 string — tsc PASS로 자동 검증 |
| S-5 | ErrorCode value 문자열은 기존 inline literal과 동일 (API 호환성) | PASS | `IMPORT_NOT_FOUND`, `NC_CLOSED_CANNOT_UPDATE` 등 enum value가 기존 inline string과 1:1 일치 |
| S-6 | 각 도메인 mapper의 mapXxxErrorToToast 함수 시그니처 변경 없음 | PASS | 7개 mapper 모두 `(error: unknown, t: TranslationFunction): ErrorToast` 일관 |

## Issues Found

없음. 모든 MUST/SHOULD 기준 통과.

## 비고 — 계약 범위 외 잔존 inline codes (Out of Scope 명시됨)

아래 inline codes는 계약 **제외 범위**에 해당하며 FAIL 판정 대상이 아님:

- `non-conformances.service.ts` 내 `NC_TYPE_REQUIRED`, `NC_EQUIPMENT_ALREADY_NON_CONFORMING`, `NC_NOT_FOUND`, `NC_REPAIR_ALREADY_LINKED`, `NC_REPAIR_RECORD_REQUIRED`, `NC_RECALIBRATION_REQUIRED` (6건) — "NC의 나머지 inline codes는 별도 sprint" 명시
- `intermediate-inspections.service.ts`, `self-inspections.service.ts` 내 `INTERMEDIATE_INSPECTION_NOT_FOUND`, `SELF_INSPECTION_NOT_FOUND` 등 NOT_FOUND 계열 (7건) — NOT_FOUND 계열은 이번 sprint 대상 아님
- Controller layer, Export service, result-sections.service.ts 내 기타 inline codes — "Pipe/Interceptor layer inline literal은 tech-debt" 명시

## Verification Commands Run

```bash
grep -rn "code: 'INVALID_STATUS_TRANSITION'" apps/backend/src/ | wc -l  # → 0
grep -rn "code: 'NOT_SUBMITTER'" apps/backend/src/ | wc -l               # → 0
grep -n "code: 'CALIBRATION_" apps/backend/src/modules/calibration/calibration.service.ts | grep -v "ErrorCode\." | wc -l  # → 0
grep -n "code: 'CALIBRATION_FACTOR_" apps/backend/src/modules/calibration-factors/calibration-factors.service.ts | grep -v "ErrorCode\." | wc -l  # → 0
grep -n "code: 'IMPORT_\|errorCode: 'IMPORT_" apps/backend/src/modules/equipment-imports/equipment-imports.service.ts | grep -v "ErrorCode\." | wc -l  # → 0
grep -n "code: 'NC_CLOSED_" apps/backend/src/modules/non-conformances/non-conformances.service.ts | grep -v "ErrorCode\." | wc -l  # → 0
pnpm --filter backend exec tsc --noEmit                                   # → no errors
pnpm --filter frontend exec tsc --noEmit                                  # → no errors
pnpm --filter backend run test                                            # → 82 suites / 1119 tests PASS
pnpm --filter backend run verify:e2e-actors                               # → 0 violations
# i18n parity: ko_count=9 en_count=9 (contract 지정 키)
```

# Evaluation: Form Template Silent Failure 제거 (Iteration 2)
**Date**: 2026-04-10
**Iteration**: 2
**Scope**: apps/backend/src/modules/reports/form-template-export.service.ts, apps/backend/src/modules/reports/docx-template.util.ts, apps/backend/src/modules/equipment/services/history-card.service.ts

## MUST Criteria Results
| # | Criterion | Result | Notes |
|---|---|---|---|
| M-1 | QP-18-01: `worksheets[0]` fallback 제거, 시트 미발견 시 throw | **PASS** | `worksheets[0]` fallback 삭제, `!sheet` 시 InternalServerErrorException throw 확인 (line ~242) |
| M-2 | QP-18-08: 빈 워크북 fallback(try-catch) 제거, 에러 전파 | **PASS** | try-catch 제거됨. `getTemplateBuffer` 에러가 그대로 전파. 추가로 `RF Conducted` 시트 미발견 시도 throw 추가 |
| M-3 | DocxTemplate 생성 시 formLabel 2nd arg 전달 (6곳) | **PASS** | QP-18-03/05/06/07/09/10 총 6곳 모두 formLabel 문자열 전달 확인 |
| M-4 | InternalServerErrorException import 존재 | **PASS** | form-template-export.service.ts import 블록에 `InternalServerErrorException` 추가 확인 |
| M-5 | history-card.service.ts fillSectionRows() `pos === -1` silent return -> throw | **PASS** | `if (pos === -1) return;` 가 `throw new InternalServerErrorException(...)` 로 교체됨 (line ~574) |
| M-6 | docx-template.util.ts setDataRows() data.length > cells.length 시 throw | **PASS** | line 96-99에서 `data.length > cells.length` 검사 후 InternalServerErrorException throw 확인 |
| M-7 | `pnpm tsc --noEmit` PASS | **PASS** | 출력 없이 정상 종료 |
| M-8 | `pnpm --filter backend run build` PASS | **PASS** | `nest build` 정상 완료 |
| M-9 | `pnpm --filter backend run test` 회귀 없음 | **PASS** | 44 suites, 551 tests 전부 통과 |

## SHOULD Criteria Results
| # | Criterion | Result | Notes |
|---|---|---|---|
| S-1 | 에러 메시지에 양식번호(UL-QP-18-XX) + 실패 위치 포함 | **PASS** | 모든 에러 메시지가 `[UL-QP-18-XX]` 접두사 + 구체적 실패 위치/원인 포함. history-card.service.ts는 `FORM_LABEL` 상수로 통일 |
| S-2 | insertEquipmentPhoto() silent return에 throw 또는 warn 추가 | **FAIL** | line 722, 726, 729에 `return xml;` (silent return) 3건 그대로 유지. 양식 구조 매칭 실패("사진" 라벨/인접 셀 미발견) 시 로그 없이 사진 누락 |
| S-3 | 이미지 다운로드 실패는 throw가 아닌 warn 유지 | **PASS** | line 671-673에서 catch 블록이 warn 로그 후 return xml 유지 |

## Issues Found (if any)
### WARN-1: insertEquipmentPhoto silent returns (S-2)
**File**: `apps/backend/src/modules/equipment/services/history-card.service.ts`, lines 722/726/729

`insertEquipmentPhoto()` 메서드에서 양식 내 "사진" 라벨이나 인접 셀을 찾지 못할 때 아무 경고 없이 원본 xml을 그대로 반환한다. 이미지 다운로드 실패(line 672)에는 warn이 있으나, 양식 구조 매칭 실패 3곳에는 아무 피드백이 없어 양식 변경 시 사진 누락을 감지할 수 없다. 최소한 `this.logger.warn(...)` 추가를 권장.

## Summary
- FAIL: 0건
- WARN: 1건 (S-2: insertEquipmentPhoto silent return 미수정 -- SHOULD이므로 verdict에 영향 없음)
- PASS: 12건 (MUST 9 + SHOULD 2)
- **Verdict**: PASS

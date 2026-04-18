# 평가 보고서: e2e-ssot-label-regression

**날짜**: 2026-04-18
**계약**: `.claude/contracts/e2e-ssot-label-regression.md`
**반복**: 2 (M9 showRetired 어서션 수정)

## MUST 기준 판정

| # | 기준 | 판정 | 비고 |
|---|------|------|------|
| M1 | tsc PASS | PASS | exit 0 확인 |
| M2 | wf-19b Step 4 — PizZip + '합격' 검증 | PASS | serial scope inspectionId 재사용, guard assertion 포함 |
| M3 | wf-20b snapshot 필드 추가 | PASS | classification: 'calibrated', calibrationValidityPeriod: '1년' |
| M4 | wf-20b DOCX XML '1년'/'교정기기'/'이상 없음' 검증 | PASS | Step 3b |
| M5 | wf-21 신규 spec — UL-QP-18-01 200+xlsx | PASS | Step 1 |
| M6 | wf-21 D열(col 4) MANAGEMENT_METHOD_LABELS | PASS | Set 기반 검증 |
| M7 | wf-21 O열(col 15) YESNO_LABELS | PASS | Set 기반 검증 |
| M8 | wf-21 P열(col 16) AVAILABILITY_LABELS | PASS | Set 기반 검증 |
| M9 | showRetired=true → 상대적 '불용' 행 증가 | PASS (iter 2) | pending_disposal isActive=true 문제 수정: 절대값→상대비교 |
| M10 | 하드코딩 없음 — Set 허용 목록 사용 | PASS | |

## SHOULD 기준 판정

| # | 기준 | 판정 |
|---|------|------|
| S1 | 빈 xlsx edge case | NOT PRESENT — Step 4(401) 로 대체 |
| S2 | OUTPUT_DIR xlsx 저장 | PASS |

## 수정 이력

**Iter 1 → Iter 2**: `equipment-registry-data.service.ts`는 `disposed` 상태만 필터링하고 `pending_disposal`(isActive=true)은 기본 export에도 포함. Step 3의 `defaultDisposedValues.toHaveLength(0)` 어서션이 항상 실패. → 상대적 비교(`retiredDisposedCount > defaultDisposedCount`)로 수정.

## 최종 판정: PASS

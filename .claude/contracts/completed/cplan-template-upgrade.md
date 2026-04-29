# Contract: cplan-template-upgrade

## Slug
`cplan-template-upgrade`

## 목표
연간 교정계획서(UL-QP-19-01) XLSX 내보내기를 신규 양식으로 교체하고,
교정 완료 항목의 확인란(I열)에 문서 작성자 전자서명, 비고란(J열)에 실제 교정일자를 기재.

## MUST 기준

| # | 기준 | 검증 방법 |
|---|------|-----------|
| M1 | `pnpm --filter backend run tsc --noEmit` PASS | 직접 실행 |
| M2 | `pnpm --filter backend run build` PASS | 직접 실행 |
| M3 | `calibration-plan.layout.ts`의 `SHEET_NAMES`에 `'Sheet1'` 포함 | grep |
| M4 | `calibration-plan.layout.ts`에 `DATA_END_ROW` 상수 존재 (값 ≤ 33) | grep |
| M5 | `clearTrailingRows` 호출 시 endRow로 `Layout.DATA_END_ROW` 사용 (sheet.rowCount 금지) | grep |
| M6 | `confirmedBy` 있을 때 I열에 `plan.authorName` 기록 (shrink-to-fit alignment) | grep |
| M7 | `actualCalibrationDate` 있을 때 J열에 `YYYY.MM.DD` 형식(도트 구분, 제로패딩) 기록 | grep |
| M8 | `docs/procedure/template/`에 `UL-QP-19-01` 포함 `.xlsx` 파일 존재 (신규 파일 복사) | ls |
| M9 | 기존 `UL-QP-19-01(00) 연간 교정계획서_RF_2026.xlsx` 삭제 또는 교체 | ls |

## SHOULD 기준

| # | 기준 |
|---|------|
| S1 | 제목 업데이트 시 폰트(맑은 고딕 18pt Bold)를 명시적으로 설정하여 rich text 덮어쓰기 후 스타일 복원 |
| S2 | `formatDotDate`가 `DEFAULT_TIMEZONE` 기반으로 날짜 계산 (로컬 timezone 오류 방지) |
| S3 | `SHEET_NAMES` 우선순위: `'Sheet1'` > `'연간 교정계획서'` > `'교정계획서'` |

## 변경 범위

### 파일 1 (새 파일 복사)
`docs/procedure/template/UL-QP-19-01(00) 연간 교정계획서.xlsx`
- Windows `c:/Users/kmjkd/Downloads/UL-QP-19-01(00) 연간 교정계획서.xlsx` 복사
- 기존 `_RF_2026.xlsx` 삭제

### 파일 2
`apps/backend/src/modules/calibration-plans/calibration-plan.layout.ts`
- `SHEET_NAMES`: `['Sheet1', '연간 교정계획서', '교정계획서']` 순서로 변경
- `DATA_END_ROW = 32` 추가 (새 템플릿 데이터 마지막 행 — Row 33은 빈 구분행, Row 34+는 서명란)

### 파일 3
`apps/backend/src/modules/calibration-plans/services/calibration-plan-renderer.service.ts`
- I열 값: `item.confirmedBy ? (plan.authorName ?? '-') : '-'`
- I열 alignment: writeDataRow 후 I 셀에 `{ horizontal: 'center', vertical: 'middle', shrinkToFit: true }` 적용
- J열 값: `item.actualCalibrationDate ? formatDotDate(item.actualCalibrationDate) : (item.notes ?? '-')`
- `formatDotDate(d)` private 메서드 추가 (`YYYY.MM.DD`, DEFAULT_TIMEZONE 기반)
- `clearTrailingRows` endRow: `sheet.rowCount` → `Layout.DATA_END_ROW`
- 제목 업데이트 후 `titleCell.font = { bold: true, size: 18, name: '맑은 고딕', charset: 129 }` 설정

## 비변경 범위
- DB 스키마 / 마이그레이션 — 변경 없음
- `calibration-plans.service.ts` — 변경 없음 (authorName 이미 포함)
- 프론트엔드 — 변경 없음
- `xlsx-helper.ts` — 변경 없음 (writeDataRow 후 셀별 alignment 직접 적용)

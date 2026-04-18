# Contract: E2E SSOT 라벨 회귀 검증 (wf-19b / wf-20b 확장 + wf-21 신규)

**Slug**: `e2e-ssot-label-regression`
**Mode**: 1 (Lightweight)
**Date**: 2026-04-18

## Deliverable

| 파일 | 변경 |
|------|------|
| `apps/frontend/tests/e2e/workflows/wf-19b-intermediate-inspection-export.spec.ts` | Step 4 추가: DOCX XML에서 '합격' 라벨 검증 |
| `apps/frontend/tests/e2e/workflows/wf-20b-self-inspection-export.spec.ts` | Step 2 create에 snapshot 필드 추가 + Step N: DOCX XML '1년' 검증 |
| `apps/frontend/tests/e2e/workflows/wf-21-equipment-registry-export.spec.ts` | 신규 — xlsx export API + SSOT 라벨 셀 검증 |

## MUST Criteria

| # | Criterion |
|---|-----------|
| M1 | `pnpm tsc --noEmit` PASS (frontend) |
| M2 | wf-19b: Step 4 추가, PizZip으로 DOCX XML 파싱 후 '합격' 텍스트 포함 검증 |
| M3 | wf-20b: Step 1 create에 `classification: 'calibrated', calibrationValidityPeriod: '1년'` 추가 |
| M4 | wf-20b: DOCX XML에서 '1년' 또는 'calibrated' 관련 snapshot 텍스트 검증 스텝 추가 |
| M5 | wf-21: 신규 spec 파일, `GET /api/reports/export/form/UL-QP-18-01` → 200 + xlsx 검증 |
| M6 | wf-21: ExcelJS로 xlsx 파싱, Row 3 D열(col 4) ∈ {'외부 교정','자체 점검','비대상'} |
| M7 | wf-21: Row 3 O열(col 15) ∈ {'O','X'} (INTERMEDIATE_CHECK_YESNO_LABELS) |
| M8 | wf-21: Row 3 P열(col 16) ∈ {'사용','고장','여분','불용'} (EQUIPMENT_AVAILABILITY_LABELS) |
| M9 | wf-21: showRetired=true 파라미터 테스트 추가 |
| M10 | 하드코딩 없음: 라벨 값은 허용 목록(Set/Array)으로 검증, 특정 값 단일 하드코딩 금지 |

## SHOULD Criteria

| # | Criterion |
|---|-----------|
| S1 | wf-21: 빈 xlsx (데이터 0건) edge case 검증 |
| S2 | wf-21: OUTPUT_DIR에 xlsx 파일 저장 (수동 확인용) |

## Key Patterns
- PizZip import: `import PizZip from 'pizzip'`
- ExcelJS import: `import ExcelJS from 'exceljs'`
- xlsx 파싱: `const wb = new ExcelJS.Workbook(); await wb.xlsx.load(Buffer.from(await resp.body()))`
- 셀 접근: `sheet.getCell(3, 4).value` (row, col 1-based)
- DOCX XML 파싱: `new PizZip(docxBuffer).file('word/document.xml')?.asText()`
- 기존 wf-19b/wf-20b 패턴 유지 (test.describe.configure mode: serial, beforeAll/afterAll)

# Evaluation: Form Template Silent Failure Elimination

**Date**: 2026-04-10
**Scope**: docx-template.util.ts, history-card.service.ts, form-template-export.service.ts, calibration-plans-export.service.ts

## MUST Criteria Results

| # | Criterion | Result | Notes |
|---|---|---|---|
| M-1 | DocxTemplate.setCellValue() 범위 초과 시 throw | **PASS** | table/row/cell 3단계 모두 InternalServerErrorException + formLabel 포함 메시지 |
| M-2 | DocxTemplate.setDataRows() 범위 초과 시 throw | **PASS** | table/row 2단계 검증. 단, dataRows 내부 cell 초과는 silent skip (line 97: `if (ci < cells.length)`) |
| M-3 | DocxTemplate.setSignatureImage() 범위 초과 시 throw | **PASS** | table/row/cell 3단계 모두 검증 |
| M-4 | injectCellAfterLabel() 라벨 미발견 시 throw | **PASS** | 라벨 미발견(line 455-457) + 빈 셀 부족(line 450-452) 모두 throw |
| M-5 | fillSectionRows() 섹션 마커 미발견 시 throw | **PASS** | sectionPos === -1 시 throw (line 561-563) |
| M-6 | 체크박스/날짜/보관장소 치환 실패 시 throw | **PASS** | assertReplace/assertReplaceRegex 헬퍼로 검증 (lines 486-502) |
| M-7 | XLSX 워크시트 미발견 시 throw (silent fallback 제거) | **FAIL** | QP-18-01: 여전히 `worksheets[0]` fallback (line 242). QP-18-08: 여전히 빈 워크북 fallback (lines 1239-1241). QP-19-01만 throw 구현됨. |
| M-8 | pnpm tsc --noEmit PASS | **PASS** | 에러 없이 완료 |
| M-9 | pnpm --filter backend run build PASS | **PASS** | nest build 성공 |
| M-10 | 기존 backend test 회귀 없음 | **PASS** | 44 suites, 551 tests passed |

## Issues Found

### FAIL-1: QP-18-01 워크시트 fallback 제거 안 됨 (M-7 위반)

**File**: `form-template-export.service.ts`, line 240-242
```typescript
const sheet =
  workbook.getWorksheet('시험설비 관리대장') ||
  workbook.getWorksheet('시험설비 관리 대장') ||
  workbook.worksheets[0];  // <-- silent fallback 잔존
```
`worksheets[0]`로 fallback하면 시트명이 완전히 다른 경우(e.g. 'Sheet1')에 잘못된 시트에 데이터가 기록되어 **오염된 출력**이 나온다. QP-19-01처럼 throw해야 한다.

### FAIL-2: QP-18-08 템플릿 로드 실패 시 빈 워크북 fallback 잔존 (M-7 위반)

**File**: `form-template-export.service.ts`, lines 1233-1241
```typescript
try {
  const templateBuffer = await this.formTemplateService.getTemplateBuffer('UL-QP-18-08');
  workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(toExcelLoadableBuffer(templateBuffer));
} catch {
  workbook = new ExcelJS.Workbook();  // <-- silent fallback: 빈 워크북 생성
}
```
템플릿이 없거나 손상되었을 때 빈 워크북으로 진행하면 서식 없는 출력물이 생성된다. 이는 "양식이 기준" 원칙 위반이며, throw해야 한다.

### WARN-1: DocxTemplate formLabel 미전달 (6곳)

**File**: `form-template-export.service.ts`, lines 423, 610, 798, 962, 1098, 1542

모든 `new DocxTemplate(templateBuf)` 호출이 formLabel을 전달하지 않아 에러 발생 시 `[unknown]`으로 표시된다.
DocxTemplate constructor는 `formLabel = 'unknown'` 기본값을 사용하므로 **에러가 발생하지는 않으나**, 디버깅 시 어느 양식에서 문제가 발생했는지 식별이 어렵다.

영향받는 양식: QP-18-03, QP-18-05, QP-18-06, QP-18-07, QP-18-09, QP-18-10

### WARN-2: InternalServerErrorException 미임포트

**File**: `form-template-export.service.ts`

`InternalServerErrorException`이 import 목록에 없다. 현재 이 파일에서 직접 throw하지는 않으므로 (DocxTemplate 내부에서 throw) 빌드는 통과하지만, M-7 수정 시 import 추가가 필요하다.

### WARN-3: fillSectionRows() 내부 silent return 잔존

**File**: `history-card.service.ts`, line 570
```typescript
if (pos === -1) return;  // 제목행+헤더행 건너뛰기 실패 시 silent return
```
섹션 마커는 찾았지만(throw 통과) `</w:tr>` 태그를 충분히 찾지 못하면 silently 빈 행을 건너뛰고 아무 데이터도 채우지 않는다. 이 경우에도 throw하는 것이 일관적이다.

### WARN-4: insertEquipmentPhoto() silent return 3곳

**File**: `history-card.service.ts`, lines 714, 718, 721
```typescript
if (photoTextIdx === -1) return xml;   // "사진" 텍스트 미발견
if (nextTcStart === -1) return xml;    // 다음 <w:tc> 미발견
if (nextPEnd === -1) return xml;       // </w:p> 미발견
```
사진 삽입 실패 시 오류 없이 사진이 빠진 문서가 생성된다. 사진은 선택적 요소이므로 warn 수준이지만, 다른 필드들이 모두 throw하는 것과 일관성이 없다.

### WARN-5: setDataRows() cell 초과 silent skip

**File**: `docx-template.util.ts`, line 97
```typescript
if (ci < cells.length) {
  cells[ci] = this.replaceCellText(cells[ci], val);
}
// ci >= cells.length이면 데이터가 silently 버려진다
```
데이터 열이 템플릿 셀 수보다 많으면 초과 데이터가 무시된다. 열 구조 변경 감지 불가.

## Summary

- **FAIL**: 2건 (M-7: QP-18-01 worksheets[0] fallback, QP-18-08 빈 워크북 fallback)
- **WARN**: 5건 (formLabel 미전달, import 누락, silent return 잔존 3곳)
- **PASS**: M-1~M-6, M-8~M-10

**결론**: M-7 미충족으로 인해 **FAIL**. QP-18-01과 QP-18-08의 silent fallback을 throw로 교체해야 한다. formLabel 전달도 함께 수정 권장.

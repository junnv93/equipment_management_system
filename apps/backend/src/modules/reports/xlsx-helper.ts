import type ExcelJS from 'exceljs';
import { FormRenderError } from './docx-xml-helper';

/**
 * XLSX 양식 렌더링 범용 유틸리티.
 *
 * ExcelJS workbook/worksheet 조작을 표준화하여 양식별 renderer가 재사용.
 * 에러는 `FormRenderError` (docx-xml-helper 재사용) 구조화 예외로 throw.
 *
 * 사용처:
 * - `equipment-registry-renderer.service.ts` (UL-QP-18-01 시험설비 관리대장)
 * - 향후 UL-QP-19-01 등 xlsx 기반 양식도 재사용 가능.
 */

/**
 * 워크북에서 지정된 시트명 리스트 중 처음 매칭되는 워크시트를 반환.
 *
 * 양식 변종(띄어쓰기 차이 등)을 대응하기 위해 다중 시트명 fallback 지원.
 * 모두 매칭 실패 시 FormRenderError throw.
 *
 * @param workbook ExcelJS Workbook
 * @param candidateNames 후보 시트명 리스트 (원본 우선순위)
 * @param formLabel 에러 메시지에 포함될 양식 번호 (예: 'UL-QP-18-01')
 * @throws FormRenderError 모든 후보 시트명 매칭 실패 시
 */
export function loadWorksheetByName(
  workbook: ExcelJS.Workbook,
  candidateNames: readonly string[],
  formLabel: string
): ExcelJS.Worksheet {
  for (const name of candidateNames) {
    const sheet = workbook.getWorksheet(name);
    if (sheet) return sheet;
  }
  throw new FormRenderError(
    formLabel,
    `워크시트 매칭 실패`,
    `후보 시트명 [${candidateNames.join(', ')}] 중 일치하는 시트가 없습니다. 양식의 시트명이 변경되었을 수 있습니다.`
  );
}

/**
 * 지정 행(1-based)의 셀 스타일을 1~columnCount 범위로 복제 반환.
 *
 * 템플릿 원본 행(보통 첫 데이터 행)의 서식을 참조용으로 추출하여
 * 이후 `writeDataRow`에서 각 데이터 행에 재주입.
 *
 * @param sheet 워크시트
 * @param rowIdx 스타일 참조 행 (1-based)
 * @param columnCount 추출할 컬럼 수 (A~ = 1~)
 * @returns 각 셀의 스타일 복제본 (0-based 배열)
 */
export function captureRowStyles(
  sheet: ExcelJS.Worksheet,
  rowIdx: number,
  columnCount: number
): Partial<ExcelJS.Style>[] {
  const row = sheet.getRow(rowIdx);
  const styles: Partial<ExcelJS.Style>[] = [];
  for (let c = 1; c <= columnCount; c++) {
    styles.push({ ...row.getCell(c).style });
  }
  return styles;
}

/**
 * 지정 행(1-based)에 값 배열을 쓰고 스타일을 적용.
 *
 * - values 배열 길이가 columnCount보다 짧으면 남은 셀은 건드리지 않음.
 * - 스타일은 각 셀의 `style`에 Object.assign으로 덮어쓰기.
 * - 행 커밋은 호출자가 별도 `row.commit()` 호출 필요 없음 (ExcelJS 자동).
 *
 * @param sheet 워크시트
 * @param rowIdx 쓸 행 (1-based)
 * @param values 값 배열 (0-based, columnCount 이하)
 * @param styles `captureRowStyles` 결과 (0-based)
 */
export function writeDataRow(
  sheet: ExcelJS.Worksheet,
  rowIdx: number,
  values: readonly (string | number | null)[],
  styles: readonly Partial<ExcelJS.Style>[]
): void {
  const row = sheet.getRow(rowIdx);
  values.forEach((val, c) => {
    const cell = row.getCell(c + 1);
    cell.value = val;
    if (styles[c]) {
      Object.assign(cell.style, styles[c]);
    }
  });
  row.commit();
}

/**
 * startRow~endRow 범위의 행을 null로 비우기 (템플릿에 남아있는 sample 행 제거).
 *
 * 데이터 행 수가 템플릿 sample 행 수보다 적을 때, 남은 sample 행을 지우기 위해 사용.
 * 스타일은 보존하고 값만 null로 설정.
 *
 * @param sheet 워크시트
 * @param startRow 시작 행 (1-based, 포함)
 * @param endRow 끝 행 (1-based, 포함)
 * @param columnCount 비울 컬럼 수
 */
export function clearTrailingRows(
  sheet: ExcelJS.Worksheet,
  startRow: number,
  endRow: number,
  columnCount: number
): void {
  for (let r = startRow; r <= endRow; r++) {
    const row = sheet.getRow(r);
    for (let c = 1; c <= columnCount; c++) {
      row.getCell(c).value = null;
    }
    row.commit();
  }
}

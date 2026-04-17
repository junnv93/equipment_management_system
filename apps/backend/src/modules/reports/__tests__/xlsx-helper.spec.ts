import ExcelJS from 'exceljs';
import {
  captureRowStyles,
  clearTrailingRows,
  loadWorksheetByName,
  writeDataRow,
} from '../xlsx-helper';
import { FormRenderError } from '../docx-xml-helper';

describe('xlsx-helper', () => {
  describe('loadWorksheetByName', () => {
    it('첫 번째 매칭 시트명을 반환한다', () => {
      const wb = new ExcelJS.Workbook();
      wb.addWorksheet('시험설비 관리대장');
      const sheet = loadWorksheetByName(
        wb,
        ['시험설비 관리대장', '시험설비 관리 대장'],
        'UL-QP-18-01'
      );
      expect(sheet.name).toBe('시험설비 관리대장');
    });

    it('대체 시트명 fallback으로 매칭한다 (띄어쓰기 변종)', () => {
      const wb = new ExcelJS.Workbook();
      wb.addWorksheet('시험설비 관리 대장'); // 띄어쓰기 있는 변종
      const sheet = loadWorksheetByName(
        wb,
        ['시험설비 관리대장', '시험설비 관리 대장'],
        'UL-QP-18-01'
      );
      expect(sheet.name).toBe('시험설비 관리 대장');
    });

    it('모두 매칭 실패 시 FormRenderError throw한다', () => {
      const wb = new ExcelJS.Workbook();
      wb.addWorksheet('다른 시트');
      expect(() => loadWorksheetByName(wb, ['시험설비 관리대장'], 'UL-QP-18-01')).toThrow(
        FormRenderError
      );
    });
  });

  describe('captureRowStyles', () => {
    it('지정 행의 셀 스타일을 columnCount만큼 추출한다', () => {
      const wb = new ExcelJS.Workbook();
      const sheet = wb.addWorksheet('Sheet1');
      sheet.getRow(3).getCell(1).style = {
        font: { bold: true, size: 12 },
        alignment: { horizontal: 'center' },
      };
      const styles = captureRowStyles(sheet, 3, 3);
      expect(styles).toHaveLength(3);
      expect(styles[0].font).toEqual({ bold: true, size: 12 });
      expect(styles[0].alignment).toEqual({ horizontal: 'center' });
    });
  });

  describe('writeDataRow', () => {
    it('값 배열을 셀에 쓰고 스타일을 적용한다', () => {
      const wb = new ExcelJS.Workbook();
      const sheet = wb.addWorksheet('Sheet1');
      const styles: Partial<ExcelJS.Style>[] = [
        { font: { bold: true } },
        { font: { italic: true } },
      ];
      writeDataRow(sheet, 5, ['hello', 42], styles);
      expect(sheet.getRow(5).getCell(1).value).toBe('hello');
      expect(sheet.getRow(5).getCell(2).value).toBe(42);
      expect(sheet.getRow(5).getCell(1).style.font).toEqual({ bold: true });
      expect(sheet.getRow(5).getCell(2).style.font).toEqual({ italic: true });
    });

    it('null 값도 정상적으로 쓴다', () => {
      const wb = new ExcelJS.Workbook();
      const sheet = wb.addWorksheet('Sheet1');
      writeDataRow(sheet, 1, ['a', null, 'c'], [{}, {}, {}]);
      expect(sheet.getRow(1).getCell(2).value).toBeNull();
    });
  });

  describe('clearTrailingRows', () => {
    it('startRow~endRow 범위의 셀 값을 null로 비운다', () => {
      const wb = new ExcelJS.Workbook();
      const sheet = wb.addWorksheet('Sheet1');
      for (let r = 1; r <= 5; r++) {
        for (let c = 1; c <= 3; c++) {
          sheet.getRow(r).getCell(c).value = `r${r}c${c}`;
        }
      }
      clearTrailingRows(sheet, 3, 5, 3);
      expect(sheet.getRow(1).getCell(1).value).toBe('r1c1');
      expect(sheet.getRow(3).getCell(1).value).toBeNull();
      expect(sheet.getRow(5).getCell(3).value).toBeNull();
    });
  });
});

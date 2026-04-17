import type { ColumnMappingEntry } from './equipment-column-mapping';
import { parseExcelDate, toNumber, buildAliasIndex } from './equipment-column-mapping';

export const CALIBRATION_COLUMN_MAPPING: ColumnMappingEntry[] = [
  {
    dbField: 'managementNumber',
    aliases: ['관리번호', '장비번호', 'Management Number', 'Mgmt No.'],
    required: true,
  },
  {
    dbField: 'calibrationDate',
    aliases: ['교정일', '교정일자', 'Calibration Date', 'Cal Date'],
    required: true,
    transform: parseExcelDate,
  },
  {
    dbField: 'agencyName',
    aliases: ['교정기관', '교정 기관', 'Agency Name', 'Calibration Agency'],
  },
  {
    dbField: 'certificateNumber',
    aliases: ['성적서번호', '인증서번호', 'Certificate Number', 'Cert No'],
  },
  { dbField: 'result', aliases: ['교정결과', '결과', 'Result', 'Calibration Result'] },
  { dbField: 'notes', aliases: ['비고', '메모', 'Notes', 'Remarks'] },
  {
    dbField: 'completionDate',
    aliases: ['교정완료일', '완료일', 'Completion Date', 'Cal Completion Date'],
    transform: parseExcelDate,
  },
];

export const CALIBRATION_ALIAS_INDEX: Map<string, ColumnMappingEntry> = buildAliasIndex(
  CALIBRATION_COLUMN_MAPPING
);

/**
 * 교정 시트에서 제거된 컬럼 정의 (SSOT: 하드코딩 Set 아닌 배열 기반 자동 추출)
 */
export const DEPRECATED_CALIBRATION_COLUMNS: ColumnMappingEntry[] = [
  {
    dbField: 'cost',
    aliases: ['교정비용', '비용', 'Cost', 'Calibration Cost'],
    transform: toNumber,
  },
];

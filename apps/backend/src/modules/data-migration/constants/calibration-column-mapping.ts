import type { ColumnMappingEntry } from './equipment-column-mapping';
import { parseExcelDate, toNumber } from './equipment-column-mapping';

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
  {
    dbField: 'cost',
    aliases: ['교정비용', '비용', 'Cost', 'Calibration Cost'],
    transform: toNumber,
  },
  { dbField: 'notes', aliases: ['비고', '메모', 'Notes', 'Remarks'] },
];

export const CALIBRATION_ALIAS_INDEX: Map<string, ColumnMappingEntry> = new Map(
  CALIBRATION_COLUMN_MAPPING.flatMap((entry) =>
    entry.aliases.map((alias) => [alias.toLowerCase().trim(), entry])
  )
);

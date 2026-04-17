/**
 * 교정 인자 Excel 컬럼 매핑
 */
import type { ColumnMappingEntry } from './equipment-column-mapping';
import { parseExcelDate, toNumber, buildAliasIndex } from './equipment-column-mapping';

export const CALIBRATION_FACTOR_COLUMN_MAPPING: ColumnMappingEntry[] = [
  {
    dbField: 'managementNumber',
    aliases: ['장비관리번호', '관리번호', 'Equipment Management Number', 'Equipment No.'],
    required: true,
  },
  {
    dbField: 'factorType',
    aliases: ['인자유형', '인자 유형', 'Factor Type', 'Type'],
    required: true,
  },
  {
    dbField: 'factorName',
    aliases: ['인자명', '인자 이름', 'Factor Name', 'Name'],
    required: true,
  },
  {
    dbField: 'factorValue',
    aliases: ['인자값', '보정값', 'Factor Value', 'Value'],
    transform: toNumber,
    required: true,
  },
  {
    dbField: 'unit',
    aliases: ['단위', 'Unit'],
    required: true,
  },
  {
    dbField: 'effectiveDate',
    aliases: ['유효시작일', '적용일', 'Effective Date', 'Start Date'],
    transform: parseExcelDate,
    required: true,
  },
  {
    dbField: 'expiryDate',
    aliases: ['유효종료일', '만료일', 'Expiry Date', 'End Date'],
    transform: parseExcelDate,
  },
];

export const CALIBRATION_FACTOR_ALIAS_INDEX: Map<string, ColumnMappingEntry> = buildAliasIndex(
  CALIBRATION_FACTOR_COLUMN_MAPPING
);

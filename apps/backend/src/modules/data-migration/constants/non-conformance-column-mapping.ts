/**
 * 부적합 관리 Excel 컬럼 매핑
 */
import type { ColumnMappingEntry } from './equipment-column-mapping';
import { parseExcelDate } from './equipment-column-mapping';

export const NON_CONFORMANCE_COLUMN_MAPPING: ColumnMappingEntry[] = [
  {
    dbField: 'managementNumber',
    aliases: ['장비관리번호', '관리번호', 'Equipment Management Number', 'Equipment No.'],
    required: true,
  },
  {
    dbField: 'discoveryDate',
    aliases: ['발견일', '발견일자', 'Discovery Date', 'Found Date'],
    transform: parseExcelDate,
    required: true,
  },
  {
    dbField: 'ncType',
    aliases: ['부적합유형', '유형', 'NC Type', 'Type'],
    required: true,
  },
  {
    dbField: 'cause',
    aliases: ['원인', '부적합원인', 'Cause', 'Reason'],
    required: true,
  },
  {
    dbField: 'actionPlan',
    aliases: ['조치계획', '시정계획', 'Action Plan', 'Correction Plan'],
  },
  {
    dbField: 'correctionContent',
    aliases: ['시정내용', '조치내용', 'Correction Content', 'Correction Details'],
  },
  {
    dbField: 'correctionDate',
    aliases: ['시정일', '조치완료일', 'Correction Date'],
    transform: parseExcelDate,
  },
  {
    dbField: 'resolutionType',
    aliases: ['해결방법', '해결유형', '조치유형', 'Resolution Type', 'Resolution Method'],
  },
];

export const NON_CONFORMANCE_ALIAS_INDEX: Map<string, ColumnMappingEntry> = new Map(
  NON_CONFORMANCE_COLUMN_MAPPING.flatMap((entry) =>
    entry.aliases.map((alias) => [alias.toLowerCase().trim(), entry])
  )
);

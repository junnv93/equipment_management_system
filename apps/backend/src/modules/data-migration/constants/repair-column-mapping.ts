import type { ColumnMappingEntry } from './equipment-column-mapping';
import { parseExcelDate } from './equipment-column-mapping';
import { REPAIR_RESULT_VALUES } from '@equipment-management/schemas';

function mapRepairResult(value: unknown): string | undefined {
  if (!value || typeof value !== 'string') return undefined;
  const normalized = value.trim().toLowerCase();
  const MAP: Record<string, string> = {
    완료: 'completed',
    completed: 'completed',
    '완료(completed)': 'completed',
    부분: 'partial',
    partial: 'partial',
    부분완료: 'partial',
    실패: 'failed',
    failed: 'failed',
  };
  const result = MAP[normalized];
  return result && (REPAIR_RESULT_VALUES as readonly string[]).includes(result)
    ? result
    : undefined;
}

export const REPAIR_COLUMN_MAPPING: ColumnMappingEntry[] = [
  {
    dbField: 'managementNumber',
    aliases: ['관리번호', '장비번호', 'Management Number', 'Mgmt No.'],
    required: true,
  },
  {
    dbField: 'repairDate',
    aliases: ['수리일', '수리일자', 'Repair Date'],
    required: true,
    transform: parseExcelDate,
  },
  {
    dbField: 'repairDescription',
    aliases: ['수리내용', '수리 내용', 'Repair Description', 'Description'],
    required: true,
  },
  {
    dbField: 'repairResult',
    aliases: ['수리결과', '결과', 'Repair Result', 'Result'],
    transform: mapRepairResult,
  },
  { dbField: 'notes', aliases: ['비고', '메모', 'Notes', 'Remarks'] },
];

export const REPAIR_ALIAS_INDEX: Map<string, ColumnMappingEntry> = new Map(
  REPAIR_COLUMN_MAPPING.flatMap((entry) =>
    entry.aliases.map((alias) => [alias.toLowerCase().trim(), entry])
  )
);

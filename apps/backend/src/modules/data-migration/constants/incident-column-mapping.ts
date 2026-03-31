import type { ColumnMappingEntry } from './equipment-column-mapping';
import { parseExcelDate } from './equipment-column-mapping';
import { INCIDENT_TYPE_VALUES } from '@equipment-management/schemas';

function mapIncidentType(value: unknown): string | undefined {
  if (!value || typeof value !== 'string') return undefined;
  const normalized = value.trim().toLowerCase();
  const MAP: Record<string, string> = {
    손상: 'damage',
    damage: 'damage',
    오작동: 'malfunction',
    malfunction: 'malfunction',
    변경: 'change',
    change: 'change',
    수리: 'repair',
    repair: 'repair',
  };
  const result = MAP[normalized];
  return result && (INCIDENT_TYPE_VALUES as readonly string[]).includes(result)
    ? result
    : undefined;
}

export const INCIDENT_COLUMN_MAPPING: ColumnMappingEntry[] = [
  {
    dbField: 'managementNumber',
    aliases: ['관리번호', '장비번호', 'Management Number', 'Mgmt No.'],
    required: true,
  },
  {
    dbField: 'occurredAt',
    aliases: ['발생일', '사고일', '발생일자', 'Occurred At', 'Incident Date'],
    required: true,
    transform: parseExcelDate,
  },
  {
    dbField: 'incidentType',
    aliases: ['사고유형', '유형', 'Incident Type', 'Type'],
    required: true,
    transform: mapIncidentType,
  },
  { dbField: 'content', aliases: ['내용', '사고내용', 'Content', 'Description'], required: true },
];

export const INCIDENT_ALIAS_INDEX: Map<string, ColumnMappingEntry> = new Map(
  INCIDENT_COLUMN_MAPPING.flatMap((entry) =>
    entry.aliases.map((alias) => [alias.toLowerCase().trim(), entry])
  )
);

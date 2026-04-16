/**
 * 시험용 소프트웨어 Excel 컬럼 매핑
 */
import type { ColumnMappingEntry } from './equipment-column-mapping';
import { parseExcelDate, toBoolean, mapSiteValue } from './equipment-column-mapping';

export const TEST_SOFTWARE_COLUMN_MAPPING: ColumnMappingEntry[] = [
  {
    dbField: 'managementNumber',
    aliases: ['관리번호', 'P번호', 'P-Number', 'Management Number'],
    required: true,
  },
  {
    dbField: 'name',
    aliases: ['소프트웨어명', '프로그램명', 'Software Name', 'Name'],
    required: true,
  },
  {
    dbField: 'softwareVersion',
    aliases: ['버전', '소프트웨어버전', 'Version', 'SW Version'],
  },
  {
    dbField: 'testField',
    aliases: ['시험분야', '시험 분야', 'Test Field'],
    required: true,
  },
  {
    dbField: 'manufacturer',
    aliases: ['제조사', '개발사', 'Manufacturer', 'Developer'],
  },
  {
    dbField: 'location',
    aliases: ['설치위치', '위치', 'Location', 'Install Location'],
  },
  {
    dbField: 'installedAt',
    aliases: ['설치일', '도입일', 'Installed Date', 'Install Date'],
    transform: parseExcelDate,
  },
  {
    dbField: 'requiresValidation',
    aliases: ['유효성검증필요', '검증필요', 'Requires Validation'],
    transform: toBoolean,
  },
  {
    dbField: 'site',
    aliases: ['사이트', 'Site'],
    transform: mapSiteValue,
  },
];

export const TEST_SOFTWARE_ALIAS_INDEX: Map<string, ColumnMappingEntry> = new Map(
  TEST_SOFTWARE_COLUMN_MAPPING.flatMap((entry) =>
    entry.aliases.map((alias) => [alias.toLowerCase().trim(), entry])
  )
);

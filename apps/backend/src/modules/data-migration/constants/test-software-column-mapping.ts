/**
 * 시험용 소프트웨어 Excel 컬럼 매핑
 */
import type { ColumnMappingEntry } from './equipment-column-mapping';
import {
  parseExcelDate,
  toBoolean,
  mapSiteValue,
  buildAliasIndex,
} from './equipment-column-mapping';

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
  // FK 해석용 가상 필드 (이름만 — 이메일은 Azure AD에서 매핑)
  {
    dbField: 'primaryManagerName',
    aliases: ['주담당자', '주담당자명', 'Primary Manager', 'Primary Manager Name'],
  },
  {
    dbField: 'secondaryManagerName',
    aliases: ['부담당자', '부담당자명', 'Secondary Manager', 'Secondary Manager Name'],
  },
];

export const TEST_SOFTWARE_ALIAS_INDEX: Map<string, ColumnMappingEntry> = buildAliasIndex(
  TEST_SOFTWARE_COLUMN_MAPPING
);

/**
 * 시험용 SW 시트에서 제거된 컬럼 정의 (SSOT: 하드코딩 Set 아닌 배열 기반 자동 추출)
 */
export const DEPRECATED_TEST_SOFTWARE_COLUMNS: ColumnMappingEntry[] = [
  {
    dbField: 'primaryManagerEmail',
    aliases: ['주담당자이메일', '주담당자 이메일', 'Primary Manager Email'],
  },
  {
    dbField: 'secondaryManagerEmail',
    aliases: ['부담당자이메일', '부담당자 이메일', 'Secondary Manager Email'],
  },
];

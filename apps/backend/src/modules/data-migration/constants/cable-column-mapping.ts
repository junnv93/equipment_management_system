/**
 * 케이블 Excel 컬럼 매핑
 */
import type { ColumnMappingEntry } from './equipment-column-mapping';
import {
  parseExcelDate,
  toInteger,
  mapSiteValue,
  buildAliasIndex,
} from './equipment-column-mapping';

export const CABLE_COLUMN_MAPPING: ColumnMappingEntry[] = [
  {
    dbField: 'managementNumber',
    aliases: ['관리번호', '케이블번호', 'Management Number', 'Cable No.'],
    required: true,
  },
  {
    dbField: 'length',
    aliases: ['길이', '케이블길이', 'Length', 'Cable Length'],
  },
  {
    dbField: 'connectorType',
    aliases: ['커넥터타입', '커넥터 타입', '커넥터유형', 'Connector Type'],
  },
  {
    dbField: 'frequencyRangeMin',
    aliases: ['최소주파수', '주파수최소', 'Freq Min', 'Min Frequency'],
    transform: toInteger,
  },
  {
    dbField: 'frequencyRangeMax',
    aliases: ['최대주파수', '주파수최대', 'Freq Max', 'Max Frequency'],
    transform: toInteger,
  },
  {
    dbField: 'serialNumber',
    aliases: ['일련번호', 'Serial Number', 'S/N'],
  },
  {
    dbField: 'location',
    aliases: ['위치', '보관위치', 'Location'],
  },
  {
    dbField: 'site',
    aliases: ['사이트', 'Site'],
    transform: mapSiteValue,
  },
  {
    dbField: 'lastMeasurementDate',
    aliases: ['최종측정일', '마지막 측정일', 'Last Measurement Date'],
    transform: parseExcelDate,
  },
];

export const CABLE_ALIAS_INDEX: Map<string, ColumnMappingEntry> =
  buildAliasIndex(CABLE_COLUMN_MAPPING);

/**
 * 크로스-사이트 필터 유틸리티
 *
 * 장비(equipment)를 경유하는 사이트 격리 서브쿼리를 SSOT로 제공합니다.
 * 부적합(NC), 소프트웨어 등 equipment에 종속된 엔티티가
 * 사이트 기반 접근제어를 적용할 때 사용합니다.
 *
 * @example
 * // 부적합 목록에서 사이트 필터 적용
 * if (site) conditions.push(equipmentBelongsToSite(ncTable.equipmentId, site));
 */

import { sql, type SQL } from 'drizzle-orm';
import type { AnyColumn } from 'drizzle-orm';
import { equipment } from '@equipment-management/db/schema/equipment';

/**
 * 장비 ID 컬럼이 특정 사이트에 속하는지 확인하는 SQL 조건을 생성합니다.
 *
 * 생성되는 SQL:
 *   `equipmentIdColumn IN (SELECT id FROM equipment WHERE site = $site)`
 *
 * @param equipmentIdColumn - 장비 ID를 참조하는 컬럼 (예: nonConformances.equipmentId)
 * @param site - 필터링할 사이트 코드 (예: 'SUW', 'UIW', 'PYT')
 */
export function equipmentBelongsToSite(equipmentIdColumn: AnyColumn, site: string): SQL {
  return sql`${equipmentIdColumn} IN (SELECT ${equipment.id} FROM ${equipment} WHERE ${equipment.site} = ${site})`;
}

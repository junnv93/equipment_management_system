/**
 * 장비 스코프 필터 유틸리티
 *
 * 장비(equipment)를 경유하는 사이트/팀 격리 서브쿼리를 SSOT로 제공합니다.
 * 부적합(NC), 소프트웨어, 보정계수 등 equipment에 종속된 엔티티가
 * @SiteScoped 데코레이터의 site/team 스코프를 적용할 때 사용합니다.
 *
 * 테이블/컬럼명은 Drizzle 스키마 메타데이터(getTableName, getTableColumns)에서
 * 동적으로 파생합니다. 이를 통해:
 * - SSOT 준수: 스키마 변경 시 자동 반영
 * - Drizzle relational query(lateral join)에서 alias 충돌 방지
 *   (${schema.column} 참조는 relational query 내부에서 잘못된 alias로 치환됨)
 *
 * @example
 * // 부적합 목록에서 사이트/팀 필터 적용
 * if (site) conditions.push(equipmentBelongsToSite(ncTable.equipmentId, site));
 * if (teamId) conditions.push(equipmentBelongsToTeam(ncTable.equipmentId, teamId));
 */

import { sql, getTableName, getTableColumns, type SQL } from 'drizzle-orm';
import type { AnyColumn } from 'drizzle-orm';
import { equipment } from '@equipment-management/db/schema/equipment';

/**
 * equipment 스키마에서 파생된 테이블/컬럼명 (모듈 로드 시 1회 계산)
 *
 * sql.raw()로 삽입되어 Drizzle relational query의 alias 치환 대상에서 제외됩니다.
 * 스키마가 변경되면 여기서 자동으로 새 이름이 반영됩니다.
 */
const EQUIPMENT_TABLE = getTableName(equipment);
const EQUIPMENT_COLS = getTableColumns(equipment);
const EQUIPMENT_ID_COL = EQUIPMENT_COLS.id.name;
const EQUIPMENT_SITE_COL = EQUIPMENT_COLS.site.name;
const EQUIPMENT_TEAM_ID_COL = EQUIPMENT_COLS.teamId.name;

/**
 * 장비 ID 컬럼이 특정 사이트에 속하는지 확인하는 SQL 조건을 생성합니다.
 *
 * 생성되는 SQL:
 *   `equipmentIdColumn IN (SELECT "id" FROM "equipment" WHERE "site" = $site)`
 *
 * @param equipmentIdColumn - 장비 ID를 참조하는 컬럼 (예: nonConformances.equipmentId)
 * @param site - 필터링할 사이트 코드 (예: 'suwon', 'uiwang', 'pyeongtaek')
 */
export function equipmentBelongsToSite(equipmentIdColumn: AnyColumn, site: string): SQL {
  return sql`${equipmentIdColumn} IN (SELECT "${sql.raw(EQUIPMENT_ID_COL)}" FROM "${sql.raw(EQUIPMENT_TABLE)}" WHERE "${sql.raw(EQUIPMENT_SITE_COL)}" = ${site})`;
}

/**
 * 장비 ID 컬럼이 특정 팀에 속하는지 확인하는 SQL 조건을 생성합니다.
 *
 * @SiteScoped 인터셉터가 team 스코프를 resolve한 경우 사용됩니다.
 * `common/scope/scope-sql-builder.ts:buildScopePredicate({ team: ... })` 콜백으로
 * 직접 전달 가능. equipment 경유 cross-table 케이스에서 team→teamId 매칭 SSOT.
 *
 * 생성되는 SQL:
 *   `equipmentIdColumn IN (SELECT "id" FROM "equipment" WHERE "team_id" = $teamId)`
 *
 * @param equipmentIdColumn - 장비 ID를 참조하는 컬럼 (예: nonConformances.equipmentId)
 * @param teamId - 필터링할 팀 UUID
 */
export function equipmentBelongsToTeam(equipmentIdColumn: AnyColumn, teamId: string): SQL {
  return sql`${equipmentIdColumn} IN (SELECT "${sql.raw(EQUIPMENT_ID_COL)}" FROM "${sql.raw(EQUIPMENT_TABLE)}" WHERE "${sql.raw(EQUIPMENT_TEAM_ID_COL)}" = ${teamId})`;
}

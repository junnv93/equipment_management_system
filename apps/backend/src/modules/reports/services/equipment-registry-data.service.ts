import { Inject, Injectable } from '@nestjs/common';
import { and, eq, ne, sql, type SQL } from 'drizzle-orm';
import type { AppDatabase } from '@equipment-management/db';
import { equipment } from '@equipment-management/db/schema/equipment';
import { CLASSIFICATION_TO_CODE, type Classification } from '@equipment-management/schemas';
import { EXPORT_QUERY_LIMITS } from '@equipment-management/shared-constants';
import type { EnforcedScope } from '../../../common/scope/scope-enforcer';

/**
 * Equipment Registry 렌더러가 소비할 단일 행 shape.
 *
 * 원본 `equipment.$inferSelect`를 그대로 노출하면 너무 넓으므로 렌더러가 실제 참조하는 필드만 타입화.
 */
export type EquipmentRegistryRow = typeof equipment.$inferSelect;

export interface EquipmentRegistryData {
  rows: EquipmentRegistryRow[];
}

/**
 * UL-QP-18-01 시험설비 관리대장 데이터 집계 서비스.
 *
 * form-template-export.service.ts 의 exportEquipmentRegistry 내 DB 쿼리 블록을 이관.
 * Scope enforcement(site/teamId)는 WHERE 조건에 직접 적용.
 */
@Injectable()
export class EquipmentRegistryDataService {
  constructor(
    @Inject('DRIZZLE_INSTANCE')
    private readonly db: AppDatabase
  ) {}

  async getData(
    params: Record<string, string>,
    filter: EnforcedScope
  ): Promise<EquipmentRegistryData> {
    const conditions: SQL<unknown>[] = [];

    if (filter.site) {
      conditions.push(eq(equipment.site, filter.site));
    }
    if (filter.teamId) {
      conditions.push(eq(equipment.teamId, filter.teamId));
    }
    if (params.status) {
      conditions.push(sql`${equipment.status} = ${params.status}`);
    }
    if (params.managementMethod) {
      conditions.push(eq(equipment.managementMethod, params.managementMethod));
    }
    if (params.classification && params.classification in CLASSIFICATION_TO_CODE) {
      const code = CLASSIFICATION_TO_CODE[params.classification as Classification];
      conditions.push(eq(equipment.classificationCode, code));
    }
    if (params.manufacturer) {
      conditions.push(eq(equipment.manufacturer, params.manufacturer));
    }
    if (params.location) {
      conditions.push(eq(equipment.location, params.location));
    }
    if (params.isShared === 'true') {
      conditions.push(eq(equipment.isShared, true));
    } else if (params.isShared === 'false') {
      conditions.push(eq(equipment.isShared, false));
    }

    // 활성 장비만 (isActive = true)
    conditions.push(eq(equipment.isActive, true));

    // 폐기 장비 숨기기 (showRetired=true일 때만 포함)
    if (params.showRetired !== 'true') {
      conditions.push(ne(equipment.status, 'disposed'));
    }

    const rows = await this.db
      .select()
      .from(equipment)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(equipment.managementNumber)
      .limit(EXPORT_QUERY_LIMITS.FULL_EXPORT);

    return { rows };
  }
}

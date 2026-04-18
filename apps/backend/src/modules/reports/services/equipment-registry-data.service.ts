import { Inject, Injectable } from '@nestjs/common';
import { and, eq, ne, sql, type SQL } from 'drizzle-orm';
import type { AppDatabase } from '@equipment-management/db';
import { equipment } from '@equipment-management/db/schema/equipment';
import { teams } from '@equipment-management/db/schema/teams';
import { CLASSIFICATION_TO_CODE, type Classification } from '@equipment-management/schemas';
import { EXPORT_QUERY_LIMITS } from '@equipment-management/shared-constants';
import type { EnforcedScope } from '../../../common/scope/scope-enforcer';

/**
 * Equipment Registry 렌더러(`equipment-registry-renderer.service.ts`)가 실제 참조하는 16개 컬럼만 포함.
 * `equipment-registry.layout.ts`의 COLUMNS key 목록과 1:1 대응.
 */
export type EquipmentRegistryRow = Pick<
  typeof equipment.$inferSelect,
  | 'managementNumber'
  | 'assetNumber'
  | 'name'
  | 'managementMethod'
  | 'lastCalibrationDate'
  | 'calibrationAgency'
  | 'calibrationCycle'
  | 'nextCalibrationDate'
  | 'manufacturer'
  | 'purchaseYear'
  | 'modelName'
  | 'serialNumber'
  | 'description'
  | 'location'
  | 'needsIntermediateCheck'
  | 'status'
>;

export interface EquipmentRegistryData {
  rows: EquipmentRegistryRow[];
  /** filter.teamId 가 설정된 경우 조회된 팀 이름 (제목/파일명에 사용) */
  teamName?: string;
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

    const [rows, teamResult] = await Promise.all([
      this.db
        .select({
          managementNumber: equipment.managementNumber,
          assetNumber: equipment.assetNumber,
          name: equipment.name,
          managementMethod: equipment.managementMethod,
          lastCalibrationDate: equipment.lastCalibrationDate,
          calibrationAgency: equipment.calibrationAgency,
          calibrationCycle: equipment.calibrationCycle,
          nextCalibrationDate: equipment.nextCalibrationDate,
          manufacturer: equipment.manufacturer,
          purchaseYear: equipment.purchaseYear,
          modelName: equipment.modelName,
          serialNumber: equipment.serialNumber,
          description: equipment.description,
          location: equipment.location,
          needsIntermediateCheck: equipment.needsIntermediateCheck,
          status: equipment.status,
        })
        .from(equipment)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(equipment.managementNumber)
        .limit(EXPORT_QUERY_LIMITS.FULL_EXPORT),
      filter.teamId
        ? this.db
            .select({ name: teams.name })
            .from(teams)
            .where(eq(teams.id, filter.teamId))
            .limit(1)
        : Promise.resolve([] as { name: string }[]),
    ]);

    return { rows, teamName: teamResult[0]?.name };
  }
}

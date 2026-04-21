import { Inject, Injectable } from '@nestjs/common';
import { and, asc, eq, inArray, type SQL } from 'drizzle-orm';
import { sql } from 'drizzle-orm';
import type { AppDatabase } from '@equipment-management/db';
import { cables, cableLossDataPoints } from '@equipment-management/db/schema/cables';
import { EXPORT_QUERY_LIMITS } from '@equipment-management/shared-constants';
import type { CableConnectorType, CableStatus, Site } from '@equipment-management/schemas';
import { CableStatusValues } from '@equipment-management/schemas';
import type { EnforcedScope } from '../../../common/scope/scope-enforcer';

export interface CableListRow {
  id: string;
  managementNumber: string;
  length: string | null;
  connectorType: string | null;
  frequencyRangeMin: number | null;
  frequencyRangeMax: number | null;
  serialNumber: string | null;
  location: string | null;
}

export interface CableDataPoint {
  cableId: string;
  measurementId: string;
  measurementDate: Date;
  frequencyMhz: number;
  lossDb: string;
}

export interface CablePathLossExportData {
  cables: CableListRow[];
  /** cableId → { measurementId, measurementDate, dataPoints[] } */
  measurementsByCableId: Map<
    string,
    { measurementId: string; measurementDate: Date; dataPoints: CableDataPoint[] }
  >;
}

/**
 * UL-QP-18-08 Cable and Path Loss 관리대장 내보내기 데이터 수집 서비스.
 *
 * 케이블 목록(시트1) + 개별 Path Loss 데이터(시트2~N) 조회.
 * 렌더링 관심사(ExcelJS 호출, 시트 구조)는 CablePathLossRendererService로 분리.
 */
@Injectable()
export class CablePathLossExportDataService {
  constructor(
    @Inject('DRIZZLE_INSTANCE')
    private readonly db: AppDatabase
  ) {}

  async getData(
    params: Record<string, string>,
    filter: EnforcedScope
  ): Promise<CablePathLossExportData> {
    const conditions: SQL<unknown>[] = [];

    if (filter.site) {
      conditions.push(eq(cables.site, filter.site as Site));
    }
    if (params.connectorType) {
      conditions.push(eq(cables.connectorType, params.connectorType as CableConnectorType));
    }
    if (params.status) {
      conditions.push(eq(cables.status, params.status as CableStatus));
    } else {
      conditions.push(eq(cables.status, CableStatusValues.ACTIVE));
    }

    const cableRows = await this.db
      .select()
      .from(cables)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(cables.managementNumber)
      .limit(EXPORT_QUERY_LIMITS.SECTION_EXPORT);

    const measurementsByCableId = new Map<
      string,
      { measurementId: string; measurementDate: Date; dataPoints: CableDataPoint[] }
    >();

    const cableIds = cableRows.map((c) => c.id);

    if (cableIds.length > 0) {
      // 각 케이블의 최신 측정을 DISTINCT ON으로 한 번에 조회
      const latestMeasurements = await this.db.execute<{
        id: string;
        cable_id: string;
        measurement_date: Date;
      }>(sql`
        SELECT DISTINCT ON (cable_id) id, cable_id, measurement_date
        FROM cable_loss_measurements
        WHERE cable_id IN (${sql.join(
          cableIds.map((id) => sql`${id}`),
          sql`, `
        )})
        ORDER BY cable_id, measurement_date DESC
      `);

      const measurementIdByCableId = new Map<string, { id: string; measurementDate: Date }>();
      for (const row of latestMeasurements.rows) {
        measurementIdByCableId.set(row.cable_id, {
          id: row.id,
          measurementDate: row.measurement_date,
        });
      }

      const measurementIds = [...measurementIdByCableId.values()].map((m) => m.id);

      const allDataPoints =
        measurementIds.length > 0
          ? await this.db
              .select()
              .from(cableLossDataPoints)
              .where(inArray(cableLossDataPoints.measurementId, measurementIds))
              .orderBy(
                asc(cableLossDataPoints.measurementId),
                asc(cableLossDataPoints.frequencyMhz)
              )
          : [];

      const dpByMeasurementId = new Map<string, typeof allDataPoints>();
      for (const dp of allDataPoints) {
        const arr = dpByMeasurementId.get(dp.measurementId) ?? [];
        arr.push(dp);
        dpByMeasurementId.set(dp.measurementId, arr);
      }

      for (const [cableId, measurement] of measurementIdByCableId.entries()) {
        const dataPoints = (dpByMeasurementId.get(measurement.id) ?? []).map((dp) => ({
          cableId,
          measurementId: measurement.id,
          measurementDate: measurement.measurementDate,
          frequencyMhz: dp.frequencyMhz,
          lossDb: String(dp.lossDb),
        }));
        measurementsByCableId.set(cableId, {
          measurementId: measurement.id,
          measurementDate: measurement.measurementDate,
          dataPoints,
        });
      }
    }

    return { cables: cableRows, measurementsByCableId };
  }
}

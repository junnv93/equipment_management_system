import { Injectable, Inject } from '@nestjs/common';
import { and, eq, gte, inArray, sql } from 'drizzle-orm';
import type { AppDatabase } from '@equipment-management/db';
import * as schema from '@equipment-management/db/schema';
import { checkouts } from '@equipment-management/db/schema/checkouts';
import {
  CheckoutStatus,
  CheckoutPurposeValues as CPVal,
  CheckoutDirectionValues as CDVal,
  EQUIPMENT_IMPORT_STATUS_VALUES,
  type InboundOverviewQueryInput,
} from '@equipment-management/schemas';
import { CACHE_TTL } from '@equipment-management/shared-constants';
import type { CheckoutQueryDto } from '../checkouts/dto/checkout-query.dto';
import type { CheckoutListResponse } from '../checkouts/checkouts.service';
import { CheckoutsService } from '../checkouts/checkouts.service';
import { EquipmentImportsService } from '../equipment-imports/equipment-imports.service';
import type { EquipmentImportListResult } from '../equipment-imports/types/equipment-import.types';
import { SimpleCacheService } from '../../common/cache/simple-cache.service';
import { CACHE_KEY_PREFIXES } from '../../common/cache/cache-key-prefixes';

export interface InboundOverviewResult {
  standard: CheckoutListResponse;
  rental: EquipmentImportListResult;
  internalShared: EquipmentImportListResult;
  sparkline: { standard: number[]; rental: number[]; internalShared: number[] };
  generatedAt: string;
}

@Injectable()
export class InboundOverviewService {
  constructor(
    @Inject('DRIZZLE_INSTANCE')
    private readonly db: AppDatabase,
    private readonly checkoutsService: CheckoutsService,
    private readonly equipmentImportsService: EquipmentImportsService,
    private readonly cacheService: SimpleCacheService
  ) {}

  /**
   * 반입 현황 집계 BFF.
   * 표준 반입 + 외부 렌탈 + 내부 공용 3섹션을 단일 요청으로 집계.
   * Promise.all로 6개 쿼리(3섹션 + sparkline 3개) 병렬 실행.
   */
  async getInboundOverview(
    query: InboundOverviewQueryInput,
    teamId: string | null
  ): Promise<InboundOverviewResult> {
    const limitPerSection = query.limitPerSection ?? 10;
    const search = query.searchTerm || undefined;
    const statusFilter =
      query.statusFilter && query.statusFilter !== 'all' ? query.statusFilter : undefined;

    // 30초 team별 캐시 — 동일 필터 반복 요청 시 6개 병렬 DB 쿼리 절감
    const cacheKey = `${CACHE_KEY_PREFIXES.INBOUND_OVERVIEW}t:${teamId ?? 'all'}:s:${statusFilter ?? ''}:q:${search ?? ''}:l:${limitPerSection}`;
    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        const isValidImportStatus = statusFilter
          ? (EQUIPMENT_IMPORT_STATUS_VALUES as readonly string[]).includes(statusFilter)
          : false;

        const [
          standard,
          rental,
          internalShared,
          sparklineStandard,
          sparklineRental,
          sparklineInternal,
        ] = await Promise.all([
          // 타팀 장비 대여 건 (direction=inbound)
          this.checkoutsService.findAll(
            {
              teamId: teamId ?? undefined,
              direction: CDVal.INBOUND,
              search,
              statuses: statusFilter ? [statusFilter as CheckoutStatus] : undefined,
              page: 1,
              pageSize: limitPerSection,
            } as CheckoutQueryDto,
            false
          ),
          // 외부 업체 렌탈
          this.equipmentImportsService.findAll({
            sourceType: 'rental',
            search,
            status: isValidImportStatus
              ? (statusFilter as (typeof EQUIPMENT_IMPORT_STATUS_VALUES)[number])
              : undefined,
            page: 1,
            limit: limitPerSection,
          }),
          // 내부 공용장비
          this.equipmentImportsService.findAll({
            sourceType: 'internal_shared',
            search,
            status: isValidImportStatus
              ? (statusFilter as (typeof EQUIPMENT_IMPORT_STATUS_VALUES)[number])
              : undefined,
            page: 1,
            limit: limitPerSection,
          }),
          // Sparkline: 최근 14일 일별 표준 반입 카운트
          this.buildCheckoutSparkline(teamId),
          // Sparkline: 최근 14일 일별 렌탈 반입 카운트
          this.buildImportSparkline('rental'),
          // Sparkline: 최근 14일 일별 내부 공용 반입 카운트
          this.buildImportSparkline('internal_shared'),
        ]);

        return {
          standard,
          rental,
          internalShared,
          sparkline: {
            standard: sparklineStandard,
            rental: sparklineRental,
            internalShared: sparklineInternal,
          },
          generatedAt: new Date().toISOString(),
        };
      },
      CACHE_TTL.SHORT
    );
  }

  private async buildCheckoutSparkline(teamId: string | null): Promise<number[]> {
    const DAYS = 14;
    const since = new Date();
    since.setDate(since.getDate() - DAYS + 1);
    since.setHours(0, 0, 0, 0);

    const conditions = [gte(checkouts.createdAt, since), eq(checkouts.purpose, CPVal.RENTAL)];

    if (teamId) {
      const requesterIdsByTeam = this.db
        .select({ id: schema.users.id })
        .from(schema.users)
        .where(eq(schema.users.teamId, teamId));
      conditions.push(inArray(checkouts.requesterId, requesterIdsByTeam));
    }

    const rows = await this.db
      .select({
        day: sql<string>`DATE(${checkouts.createdAt})`,
        count: sql<number>`COUNT(*)`,
      })
      .from(checkouts)
      .where(and(...conditions))
      .groupBy(sql`DATE(${checkouts.createdAt})`)
      .orderBy(sql`DATE(${checkouts.createdAt})`);

    return this.fillDailyArray(rows, DAYS, since);
  }

  private async buildImportSparkline(sourceType: 'rental' | 'internal_shared'): Promise<number[]> {
    const DAYS = 14;
    const since = new Date();
    since.setDate(since.getDate() - DAYS + 1);
    since.setHours(0, 0, 0, 0);

    const rows = await this.db
      .select({
        day: sql<string>`DATE(${schema.equipmentImports.createdAt})`,
        count: sql<number>`COUNT(*)`,
      })
      .from(schema.equipmentImports)
      .where(
        and(
          gte(schema.equipmentImports.createdAt, since),
          eq(schema.equipmentImports.sourceType, sourceType)
        )
      )
      .groupBy(sql`DATE(${schema.equipmentImports.createdAt})`)
      .orderBy(sql`DATE(${schema.equipmentImports.createdAt})`);

    return this.fillDailyArray(rows, DAYS, since);
  }

  private fillDailyArray(
    rows: { day: string; count: number }[],
    days: number,
    since: Date
  ): number[] {
    const countByDay = new Map(rows.map((r) => [r.day, Number(r.count)]));
    return Array.from({ length: days }, (_, i) => {
      const d = new Date(since);
      d.setDate(d.getDate() + i);
      const key = d.toISOString().slice(0, 10);
      return countByDay.get(key) ?? 0;
    });
  }
}

import { Injectable, Inject } from '@nestjs/common';
import { and, avg, count, desc, eq, gte, isNotNull, lte, sql } from 'drizzle-orm';
import type { SQL } from 'drizzle-orm';
import type { AppDatabase } from '@equipment-management/db';
import {
  equipment as equipmentTable,
  calibrations as calibrationsTable,
  checkouts as checkoutsTable,
  checkoutItems as checkoutItemsTable,
  teams as teamsTable,
  repairHistory as repairHistoryTable,
  auditLogs as auditLogsTable,
} from '@equipment-management/db/schema';
import {
  AUDIT_ACTION_LABELS,
  AUDIT_ENTITY_TYPE_LABELS,
  EQUIPMENT_STATUS_LABELS,
  CALIBRATION_STATUS_LABELS,
  CALIBRATION_APPROVAL_STATUS_LABELS,
  REPAIR_RESULT_LABELS,
  CheckoutStatusValues as CSVal,
  CalibrationStatusEnum,
  type AuditAction,
  type AuditEntityType,
  type AuditLogFilter,
  type CalibrationStatus,
  type EquipmentStatus,
} from '@equipment-management/schemas';
import {
  USER_ROLE_LABELS,
  DEFAULT_LOCALE,
  DEFAULT_TIMEZONE,
  REPORT_CONSTANTS,
  REPORT_EXPORT_ROW_LIMIT,
  REPORT_UTILIZATION_THRESHOLDS,
  CACHE_TTL,
  type UserRole,
  type ResolvedDataScope,
} from '@equipment-management/shared-constants';
import { SimpleCacheService } from '../../common/cache/simple-cache.service';
import { CACHE_KEY_PREFIXES, buildStableCacheKey } from '../../common/cache/cache-key-prefixes';
import { dispatchScopePredicate } from '../../common/scope/scope-sql-builder';
import type { ReportColumn, ReportData } from './report-export.service';
import type {
  EquipmentUsageReport,
  CalibrationStatusReport,
  CheckoutStatisticsReport,
  UtilizationRateReport,
  EquipmentDowntimeReport,
} from './reports.types';
import type {
  EquipmentUsageQueryInput,
  CalibrationStatusQueryInput,
  CheckoutStatisticsQueryInput,
  UtilizationRateQueryInput,
  EquipmentDowntimeQueryInput,
} from './dto/report-query.dto';

// ─── 공통 날짜 유틸 ───────────────────────────────────────────────────────────

/**
 * period 문자열에서 [start, end] 날짜 범위를 계산합니다.
 * startDate/endDate가 직접 제공되면 그대로 사용합니다.
 */
function resolveDateRange(
  period: string,
  startDate?: string,
  endDate?: string
): { start: Date; end: Date } {
  if (startDate && endDate) {
    return { start: new Date(startDate), end: new Date(endDate) };
  }

  const end = new Date();
  end.setHours(23, 59, 59, 999);
  const start = new Date();

  switch (period) {
    case 'last_week':
      start.setDate(start.getDate() - 7);
      break;
    case 'last_quarter':
      start.setMonth(start.getMonth() - 3);
      break;
    case 'last_year':
      start.setFullYear(start.getFullYear() - 1);
      break;
    default: // last_month
      start.setMonth(start.getMonth() - 1);
  }

  start.setHours(0, 0, 0, 0);
  return { start, end };
}

// ─── RBAC 스코프 → Drizzle 조건 변환 ─────────────────────────────────────────

/**
 * ResolvedDataScope를 장비 테이블 기준 Drizzle WHERE 조건으로 변환합니다.
 * 보고서의 모든 쿼리는 equipment 테이블을 JOIN하므로 여기서 통일 적용.
 *
 * SSOT: `common/scope/scope-sql-builder.ts:dispatchScopePredicate` 정책 상태기계를
 * 위임 호출. 본 함수는 equipment 테이블의 join 컬럼(site/teamId)만 결정하고
 * 정책 분기(all/site/team→site fallback/none)는 SSOT 가 책임진다.
 *
 * 정책 정렬:
 * - all  → 빈 배열 (필터 미적용)
 * - site → equipment.site = scope.site
 * - team → teamId 우선, 누락 시 site 폴백 (SiteScopeInterceptor 와 동일한 team ⊂ site 정책)
 * - none → sql`FALSE` (0행 강제)
 */
function scopeToEquipmentConditions(scope: ResolvedDataScope): SQL[] {
  const dispatch = dispatchScopePredicate(scope, {
    site: (s) => eq(equipmentTable.site, s),
    team: (t) => eq(equipmentTable.teamId, t),
  });
  switch (dispatch.kind) {
    case 'all':
      return [];
    case 'none':
      return [sql`FALSE`];
    case 'condition':
      return [dispatch.condition];
    case 'unavailable':
      // 두 콜백이 모두 제공되었으므로 도달 불가. 방어적 fail-closed.
      return [sql`FALSE`];
  }
}

// ─── 상태 레이블: @equipment-management/schemas SSOT 사용 ─────────────────

@Injectable()
export class ReportsService {
  constructor(
    @Inject('DRIZZLE_INSTANCE')
    private readonly db: AppDatabase,
    private readonly cacheService: SimpleCacheService
  ) {}

  // ══════════════════════════════════════════════════════════════════════════
  // 통계 집계 API (JSON 응답)
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * 장비 사용(반출) 통계
   */
  async getEquipmentUsage(
    query: EquipmentUsageQueryInput,
    scope: ResolvedDataScope
  ): Promise<EquipmentUsageReport> {
    const cacheKey = buildStableCacheKey(CACHE_KEY_PREFIXES.REPORTS, 'usage', {
      startDate: query.startDate,
      endDate: query.endDate,
      equipmentId: query.equipmentId,
      scope,
    });
    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        const { start, end } = resolveDateRange('last_month', query.startDate, query.endDate);
        const scopeConditions = scopeToEquipmentConditions(scope);

        const dateConditions = [
          gte(checkoutsTable.createdAt, start),
          lte(checkoutsTable.createdAt, end),
        ];
        const equipCondition = query.equipmentId
          ? eq(checkoutItemsTable.equipmentId, query.equipmentId)
          : undefined;

        const allConditions = [
          ...dateConditions,
          ...(equipCondition ? [equipCondition] : []),
          ...scopeConditions,
        ];

        const teamRows = await this.db
          .select({
            teamName: teamsTable.name,
            checkoutCount: sql<number>`COUNT(DISTINCT ${checkoutsTable.id})`,
            equipmentCount: sql<number>`COUNT(DISTINCT ${checkoutItemsTable.equipmentId})`,
          })
          .from(checkoutsTable)
          .innerJoin(checkoutItemsTable, eq(checkoutItemsTable.checkoutId, checkoutsTable.id))
          .innerJoin(equipmentTable, eq(checkoutItemsTable.equipmentId, equipmentTable.id))
          .leftJoin(teamsTable, eq(equipmentTable.teamId, teamsTable.id))
          .where(and(...allConditions))
          .groupBy(teamsTable.id, teamsTable.name);

        const topRows = await this.db
          .select({
            equipmentId: checkoutItemsTable.equipmentId,
            name: equipmentTable.name,
            checkoutCount: sql<number>`COUNT(DISTINCT ${checkoutsTable.id})`,
          })
          .from(checkoutsTable)
          .innerJoin(checkoutItemsTable, eq(checkoutItemsTable.checkoutId, checkoutsTable.id))
          .innerJoin(equipmentTable, eq(checkoutItemsTable.equipmentId, equipmentTable.id))
          .where(and(...allConditions))
          .groupBy(checkoutItemsTable.equipmentId, equipmentTable.name)
          .orderBy(desc(sql`COUNT(DISTINCT ${checkoutsTable.id})`))
          .limit(REPORT_CONSTANTS.TOP_N_LIMIT);

        const totalCheckouts = teamRows.reduce((acc, r) => acc + Number(r.checkoutCount), 0);

        return {
          timeframe: { startDate: start.toISOString(), endDate: end.toISOString() },
          totalUsageHours: totalCheckouts * REPORT_CONSTANTS.HOURS_PER_CHECKOUT,
          totalEquipmentCount: topRows.length,
          departmentDistribution: teamRows.map((r) => ({
            departmentId: r.teamName ?? '미배정',
            departmentName: r.teamName ?? '미배정',
            usageHours: Number(r.checkoutCount) * REPORT_CONSTANTS.HOURS_PER_CHECKOUT,
            equipmentCount: Number(r.equipmentCount),
          })),
          topEquipment: topRows.map((r) => ({
            equipmentId: r.equipmentId ?? '',
            name: r.name ?? '',
            usageHours: Number(r.checkoutCount) * REPORT_CONSTANTS.HOURS_PER_CHECKOUT,
            usageCount: Number(r.checkoutCount),
          })),
          monthlyTrend: await this._getMonthlyCheckoutTrend(start, end, scopeConditions),
        };
      },
      CACHE_TTL.MEDIUM
    );
  }

  /**
   * 교정 상태 통계
   */
  async getCalibrationStatus(
    query: CalibrationStatusQueryInput,
    scope: ResolvedDataScope
  ): Promise<CalibrationStatusReport> {
    const cacheKey = buildStableCacheKey(CACHE_KEY_PREFIXES.REPORTS, 'calibration-status', {
      timeframe: query.timeframe,
      status: query.status,
      scope,
    });
    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        const { start, end } = resolveDateRange(query.timeframe ?? 'last_month');
        const scopeConditions = scopeToEquipmentConditions(scope);

        // 교정 쿼리: calibrations → equipment JOIN으로 스코프 적용
        const calConditions: SQL[] = [
          gte(calibrationsTable.calibrationDate, start),
          lte(calibrationsTable.calibrationDate, end),
          ...scopeConditions,
        ];
        if (query.status)
          calConditions.push(eq(calibrationsTable.status, query.status as CalibrationStatus));

        // 4개 독립 쿼리 병렬 실행
        const [statusRows, [overdueRow], [dueRow], [totalEquipRow]] = await Promise.all([
          this.db
            .select({
              status: calibrationsTable.status,
              statusCount: count(calibrationsTable.id),
            })
            .from(calibrationsTable)
            .innerJoin(equipmentTable, eq(calibrationsTable.equipmentId, equipmentTable.id))
            .where(and(...calConditions))
            .groupBy(calibrationsTable.status),
          // 교정기한초과: date-derived (nextCalibrationDate < today, 폐기/비활성 제외)
          this.db
            .select({ cnt: count(equipmentTable.id) })
            .from(equipmentTable)
            .where(
              and(
                isNotNull(equipmentTable.nextCalibrationDate),
                sql`${equipmentTable.nextCalibrationDate} < now()`,
                sql`${equipmentTable.status} NOT IN ('disposed', 'pending_disposal', 'inactive')`,
                ...scopeConditions
              )
            ),
          // 교정예정(30일 이내): date-derived
          this.db
            .select({ cnt: count(equipmentTable.id) })
            .from(equipmentTable)
            .where(
              and(
                isNotNull(equipmentTable.nextCalibrationDate),
                gte(equipmentTable.nextCalibrationDate, sql`now()`),
                lte(equipmentTable.nextCalibrationDate, sql`now() + interval '30 days'`),
                sql`${equipmentTable.status} NOT IN ('disposed', 'pending_disposal', 'inactive')`,
                ...scopeConditions
              )
            ),
          this.db
            .select({ cnt: count(equipmentTable.id) })
            .from(equipmentTable)
            .where(scopeConditions.length > 0 ? and(...scopeConditions) : undefined),
        ]);

        const totalCalibrations = statusRows.reduce((acc, r) => acc + Number(r.statusCount), 0);

        return {
          summary: {
            totalEquipment: Number(totalEquipRow?.cnt ?? 0),
            requireCalibration: Number(dueRow?.cnt ?? 0) + Number(overdueRow?.cnt ?? 0),
            dueThisMonth: Number(dueRow?.cnt ?? 0),
            overdue: Number(overdueRow?.cnt ?? 0),
            completedThisMonth: statusRows
              .filter((r) => r.status === CalibrationStatusEnum.enum.completed)
              .reduce((acc, r) => acc + Number(r.statusCount), 0),
          },
          status: statusRows.map((r) => ({
            status: CALIBRATION_STATUS_LABELS[r.status] ?? r.status,
            count: Number(r.statusCount),
            percentage:
              totalCalibrations > 0
                ? Math.round((Number(r.statusCount) / totalCalibrations) * 1000) / 10
                : 0,
          })),
          calibrationTrend: await this._getMonthlyCalibrationTrend(start, end, scopeConditions),
        };
      },
      CACHE_TTL.MEDIUM
    );
  }

  /**
   * @deprecated Use getCheckoutStatistics. 메서드 이름 호환성 유지.
   */
  async getRentalStatistics(
    query: CheckoutStatisticsQueryInput,
    scope: ResolvedDataScope
  ): Promise<CheckoutStatisticsReport> {
    return this.getCheckoutStatistics(query, scope);
  }

  /**
   * 반출 통계 (대여/교정/수리 포함)
   */
  async getCheckoutStatistics(
    query: CheckoutStatisticsQueryInput,
    scope: ResolvedDataScope
  ): Promise<CheckoutStatisticsReport> {
    const cacheKey = buildStableCacheKey(CACHE_KEY_PREFIXES.REPORTS, 'checkout-stats', {
      startDate: query.startDate,
      endDate: query.endDate,
      scope,
    });
    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        const { start, end } = resolveDateRange('last_month', query.startDate, query.endDate);
        const scopeConditions = scopeToEquipmentConditions(scope);

        const dateConditions: SQL[] = [
          gte(checkoutsTable.createdAt, start),
          lte(checkoutsTable.createdAt, end),
        ];

        // 스코프 적용을 위해 equipment JOIN 필요 — COUNT(DISTINCT)로 item fan-out 방지
        const statusRows = await this.db
          .select({
            status: checkoutsTable.status,
            statusCount: sql<number>`COUNT(DISTINCT ${checkoutsTable.id})`,
          })
          .from(checkoutsTable)
          .innerJoin(checkoutItemsTable, eq(checkoutItemsTable.checkoutId, checkoutsTable.id))
          .innerJoin(equipmentTable, eq(checkoutItemsTable.equipmentId, equipmentTable.id))
          .where(and(...dateConditions, ...scopeConditions))
          .groupBy(checkoutsTable.status);

        const teamRows = await this.db
          .select({
            teamName: teamsTable.name,
            teamId: teamsTable.id,
            checkoutCount: sql<number>`COUNT(DISTINCT ${checkoutsTable.id})`,
          })
          .from(checkoutsTable)
          .innerJoin(checkoutItemsTable, eq(checkoutItemsTable.checkoutId, checkoutsTable.id))
          .innerJoin(equipmentTable, eq(checkoutItemsTable.equipmentId, equipmentTable.id))
          .leftJoin(teamsTable, eq(equipmentTable.teamId, teamsTable.id))
          .where(and(...dateConditions, ...scopeConditions))
          .groupBy(teamsTable.id, teamsTable.name);

        const totalCount = statusRows.reduce((acc, r) => acc + Number(r.statusCount), 0);
        const activeStatuses: Set<string> = new Set([
          CSVal.APPROVED,
          CSVal.CHECKED_OUT,
          CSVal.LENDER_CHECKED,
          CSVal.BORROWER_RECEIVED,
          CSVal.IN_USE,
        ]);
        const returnedStatuses: Set<string> = new Set([
          CSVal.RETURNED,
          CSVal.RETURN_APPROVED,
          CSVal.LENDER_RECEIVED,
        ]);

        const activeCount = statusRows
          .filter((r) => activeStatuses.has(r.status))
          .reduce((acc, r) => acc + Number(r.statusCount), 0);
        const returnedCount = statusRows
          .filter((r) => returnedStatuses.has(r.status))
          .reduce((acc, r) => acc + Number(r.statusCount), 0);

        // 실제 평균 대여 기간 계산 (반환된 checkout의 actualReturnDate - createdAt)
        const avgDurationResult = await this._computeAvgCheckoutDuration(
          start,
          end,
          scopeConditions
        );

        return {
          timeframe: { startDate: start.toISOString(), endDate: end.toISOString() },
          summary: {
            totalCheckouts: totalCount,
            activeCheckouts: activeCount,
            avgCheckoutDuration: avgDurationResult,
            returnRate: totalCount > 0 ? Math.round((returnedCount / totalCount) * 1000) / 10 : 0,
          },
          checkoutsByDepartment: teamRows.map((r) => ({
            departmentId: r.teamId ?? '미배정',
            departmentName: r.teamName ?? '미배정',
            count: Number(r.checkoutCount),
            percentage:
              totalCount > 0 ? Math.round((Number(r.checkoutCount) / totalCount) * 1000) / 10 : 0,
          })),
          checkoutStatus: statusRows.map((r) => ({
            status: r.status,
            count: Number(r.statusCount),
            percentage:
              totalCount > 0 ? Math.round((Number(r.statusCount) / totalCount) * 1000) / 10 : 0,
          })),
          monthlyTrend: await this._getMonthlyCheckoutTrend(start, end, scopeConditions),
        };
      },
      CACHE_TTL.MEDIUM
    );
  }

  /**
   * 장비 활용률 통계
   */
  async getUtilizationRate(
    query: UtilizationRateQueryInput,
    scope: ResolvedDataScope
  ): Promise<UtilizationRateReport> {
    const cacheKey = buildStableCacheKey(CACHE_KEY_PREFIXES.REPORTS, 'utilization', {
      period: query.period,
      equipmentId: query.equipmentId,
      scope,
    });
    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        const period = query.period;
        const { start, end } = resolveDateRange(`last_${period}`);
        const scopeConditions = scopeToEquipmentConditions(scope);

        const checkoutDateConditions = [
          gte(checkoutsTable.createdAt, start),
          lte(checkoutsTable.createdAt, end),
        ];
        const itemCondition = query.equipmentId
          ? eq(checkoutItemsTable.equipmentId, query.equipmentId)
          : undefined;

        const rows = await this.db
          .select({
            equipmentId: equipmentTable.id,
            name: equipmentTable.name,
            managementNumber: equipmentTable.managementNumber,
            teamName: teamsTable.name,
            checkoutCount: sql<number>`COALESCE(COUNT(DISTINCT ${checkoutsTable.id}), 0)`,
          })
          .from(equipmentTable)
          .leftJoin(teamsTable, eq(equipmentTable.teamId, teamsTable.id))
          .leftJoin(checkoutItemsTable, eq(checkoutItemsTable.equipmentId, equipmentTable.id))
          .leftJoin(
            checkoutsTable,
            and(eq(checkoutsTable.id, checkoutItemsTable.checkoutId), ...checkoutDateConditions)
          )
          .where(and(...(itemCondition ? [itemCondition] : []), ...scopeConditions))
          .groupBy(
            equipmentTable.id,
            equipmentTable.name,
            equipmentTable.managementNumber,
            teamsTable.name
          )
          .orderBy(desc(sql`COALESCE(COUNT(DISTINCT ${checkoutsTable.id}), 0)`));

        const periodDays = Math.max(
          1,
          Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
        );

        const withRate = rows.map((r) => ({
          ...r,
          utilizationRate: Math.min(
            100,
            Math.round((Number(r.checkoutCount) / periodDays) * 1000) / 10
          ),
        }));

        const avg =
          withRate.length > 0
            ? withRate.reduce((acc, r) => acc + r.utilizationRate, 0) / withRate.length
            : 0;

        const sorted = [...withRate].sort((a, b) => b.utilizationRate - a.utilizationRate);

        return {
          period,
          summary: {
            averageUtilization: Math.round(avg * 10) / 10,
            highUtilizationCount: withRate.filter(
              (r) => r.utilizationRate >= REPORT_UTILIZATION_THRESHOLDS.HIGH
            ).length,
            lowUtilizationCount: withRate.filter(
              (r) => r.utilizationRate <= REPORT_UTILIZATION_THRESHOLDS.LOW
            ).length,
            totalEquipmentCount: withRate.length,
          },
          utilizationByCategory: [],
          topUtilized: sorted.slice(0, REPORT_CONSTANTS.TOP_N_LIMIT).map((r) => ({
            equipmentId: r.equipmentId,
            name: `${r.name} (${r.managementNumber})`,
            utilizationRate: r.utilizationRate,
            department: r.teamName ?? '-',
          })),
          lowUtilized: sorted
            .slice(-REPORT_CONSTANTS.TOP_N_LIMIT)
            .reverse()
            .map((r) => ({
              equipmentId: r.equipmentId,
              name: `${r.name} (${r.managementNumber})`,
              utilizationRate: r.utilizationRate,
              department: r.teamName ?? '-',
            })),
        };
      },
      CACHE_TTL.MEDIUM
    );
  }

  /**
   * 장비 가동 중단(수리) 통계
   */
  async getEquipmentDowntime(
    query: EquipmentDowntimeQueryInput,
    scope: ResolvedDataScope
  ): Promise<EquipmentDowntimeReport> {
    const cacheKey = buildStableCacheKey(CACHE_KEY_PREFIXES.REPORTS, 'downtime', {
      startDate: query.startDate,
      endDate: query.endDate,
      equipmentId: query.equipmentId,
      scope,
    });
    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        const { start, end } = resolveDateRange('last_month', query.startDate, query.endDate);
        const scopeConditions = scopeToEquipmentConditions(scope);

        const conditions: SQL[] = [
          gte(repairHistoryTable.repairDate, start),
          lte(repairHistoryTable.repairDate, end),
          ...scopeConditions,
        ];
        if (query.equipmentId)
          conditions.push(eq(repairHistoryTable.equipmentId, query.equipmentId));

        const repairRows = await this.db
          .select({
            equipmentId: equipmentTable.id,
            name: equipmentTable.name,
            managementNumber: equipmentTable.managementNumber,
            incidentCount: count(repairHistoryTable.id),
          })
          .from(repairHistoryTable)
          .innerJoin(equipmentTable, eq(repairHistoryTable.equipmentId, equipmentTable.id))
          .where(and(...conditions))
          .groupBy(equipmentTable.id, equipmentTable.name, equipmentTable.managementNumber)
          .orderBy(desc(count(repairHistoryTable.id)))
          .limit(REPORT_CONSTANTS.TOP_N_LIMIT * 2);

        const totalIncidents = repairRows.reduce((acc, r) => acc + Number(r.incidentCount), 0);

        // 수리 결과별 실제 그룹핑
        const reasonRows = await this.db
          .select({
            repairResult: repairHistoryTable.repairResult,
            incidentCount: count(repairHistoryTable.id),
          })
          .from(repairHistoryTable)
          .innerJoin(equipmentTable, eq(repairHistoryTable.equipmentId, equipmentTable.id))
          .where(and(...conditions))
          .groupBy(repairHistoryTable.repairResult)
          .orderBy(desc(count(repairHistoryTable.id)));

        const RESULT_LABELS = REPAIR_RESULT_LABELS as Record<string, string>;

        return {
          timeframe: { startDate: start.toISOString(), endDate: end.toISOString() },
          summary: {
            totalDowntimeHours: totalIncidents * REPORT_CONSTANTS.HOURS_PER_CHECKOUT,
            totalIncidents,
            avgDowntimeDuration: totalIncidents > 0 ? REPORT_CONSTANTS.HOURS_PER_CHECKOUT : 0,
            affectedEquipmentCount: repairRows.length,
          },
          downtimeReasons: reasonRows.map((r) => ({
            reason: RESULT_LABELS[r.repairResult ?? ''] ?? r.repairResult ?? '미분류',
            hours: Number(r.incidentCount) * REPORT_CONSTANTS.HOURS_PER_CHECKOUT,
            percentage:
              totalIncidents > 0
                ? Math.round((Number(r.incidentCount) / totalIncidents) * 1000) / 10
                : 0,
          })),
          topDowntimeEquipment: repairRows.slice(0, REPORT_CONSTANTS.BOTTOM_N_LIMIT).map((r) => ({
            equipmentId: r.equipmentId ?? '',
            name: `${r.name ?? ''} (${r.managementNumber ?? ''})`,
            downtimeHours: Number(r.incidentCount) * REPORT_CONSTANTS.HOURS_PER_CHECKOUT,
            incidents: Number(r.incidentCount),
          })),
          monthlyTrend: [],
        };
      },
      CACHE_TTL.MEDIUM
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // 내보내기 데이터 조회 (export endpoints에서 파일 생성용)
  // ══════════════════════════════════════════════════════════════════════════

  async getEquipmentInventoryData(
    filters: { site?: string; status?: string; teamId?: string },
    scope: ResolvedDataScope
  ): Promise<ReportData> {
    const scopeConditions = scopeToEquipmentConditions(scope);
    const conditions: SQL[] = [...scopeConditions];
    if (filters.site) conditions.push(eq(equipmentTable.site, filters.site));
    if (filters.status)
      conditions.push(eq(equipmentTable.status, filters.status as EquipmentStatus));
    if (filters.teamId) conditions.push(eq(equipmentTable.teamId, filters.teamId));

    const rows = await this.db
      .select({
        managementNumber: equipmentTable.managementNumber,
        name: equipmentTable.name,
        manufacturer: equipmentTable.manufacturer,
        modelName: equipmentTable.modelName,
        status: equipmentTable.status,
        teamName: teamsTable.name,
        location: equipmentTable.location,
        lastCalibrationDate: equipmentTable.lastCalibrationDate,
        nextCalibrationDate: equipmentTable.nextCalibrationDate,
        calibrationCycle: equipmentTable.calibrationCycle,
        serialNumber: equipmentTable.serialNumber,
        siteCode: equipmentTable.siteCode,
      })
      .from(equipmentTable)
      .leftJoin(teamsTable, eq(equipmentTable.teamId, teamsTable.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(equipmentTable.managementNumber)
      .limit(REPORT_EXPORT_ROW_LIMIT);

    const columns: ReportColumn[] = [
      { header: '관리번호', key: 'managementNumber', width: 16 },
      { header: '장비명', key: 'name', width: 24 },
      { header: '제조사', key: 'manufacturer', width: 16 },
      { header: '모델명', key: 'modelName', width: 20 },
      { header: '상태', key: 'statusLabel', width: 14 },
      { header: '팀', key: 'teamName', width: 18 },
      { header: '위치', key: 'location', width: 16 },
      { header: '마지막 교정일', key: 'lastCalibration', width: 16 },
      { header: '다음 교정일', key: 'nextCalibration', width: 16 },
      { header: '교정주기(월)', key: 'calibrationCycle', width: 14 },
      { header: '시험소', key: 'siteCode', width: 10 },
    ];

    const fmtDate = (d: Date | null | undefined): string =>
      d ? new Date(d).toLocaleDateString(DEFAULT_LOCALE) : '-';

    return {
      title: '장비 현황 보고서',
      columns,
      generatedAt: new Date(),
      rows: rows.map((r) => ({
        managementNumber: r.managementNumber,
        name: r.name,
        manufacturer: r.manufacturer ?? '-',
        modelName: r.modelName ?? '-',
        statusLabel: EQUIPMENT_STATUS_LABELS[r.status] ?? r.status,
        teamName: r.teamName ?? '-',
        location: r.location ?? '-',
        lastCalibration: fmtDate(r.lastCalibrationDate),
        nextCalibration: fmtDate(r.nextCalibrationDate),
        calibrationCycle: r.calibrationCycle ? `${r.calibrationCycle}개월` : '-',
        siteCode: r.siteCode ?? '-',
        serialNumber: r.serialNumber ?? '-',
      })),
    };
  }

  async getCalibrationStatusData(
    filters: { startDate?: string; endDate?: string; status?: string },
    scope: ResolvedDataScope
  ): Promise<ReportData> {
    const { start, end } = resolveDateRange('last_year', filters.startDate, filters.endDate);
    const scopeConditions = scopeToEquipmentConditions(scope);

    const conditions: SQL[] = [
      gte(calibrationsTable.calibrationDate, start),
      lte(calibrationsTable.calibrationDate, end),
      ...scopeConditions,
    ];
    if (filters.status)
      conditions.push(eq(calibrationsTable.status, filters.status as CalibrationStatus));

    const rows = await this.db
      .select({
        managementNumber: equipmentTable.managementNumber,
        equipmentName: equipmentTable.name,
        calibrationDate: calibrationsTable.calibrationDate,
        completionDate: calibrationsTable.completionDate,
        agencyName: calibrationsTable.agencyName,
        certificateNumber: calibrationsTable.certificateNumber,
        status: calibrationsTable.status,
        approvalStatus: calibrationsTable.approvalStatus,
        result: calibrationsTable.result,
        cost: calibrationsTable.cost,
        nextCalibrationDate: calibrationsTable.nextCalibrationDate,
      })
      .from(calibrationsTable)
      .innerJoin(equipmentTable, eq(calibrationsTable.equipmentId, equipmentTable.id))
      .where(and(...conditions))
      .orderBy(desc(calibrationsTable.calibrationDate))
      .limit(REPORT_EXPORT_ROW_LIMIT);

    // SSOT: @equipment-management/schemas
    const APPROVAL_LABELS = CALIBRATION_APPROVAL_STATUS_LABELS as Record<string, string>;
    const fmtDate = (d: Date | null | undefined): string =>
      d ? new Date(d).toLocaleDateString(DEFAULT_LOCALE) : '-';

    return {
      title: '교정 현황 보고서',
      columns: [
        { header: '관리번호', key: 'managementNumber', width: 16 },
        { header: '장비명', key: 'equipmentName', width: 24 },
        { header: '교정일', key: 'calibrationDateStr', width: 14 },
        { header: '완료일', key: 'completionDateStr', width: 14 },
        { header: '교정기관', key: 'agencyName', width: 20 },
        { header: '교정증서번호', key: 'certificateNumber', width: 18 },
        { header: '상태', key: 'statusLabel', width: 12 },
        { header: '승인상태', key: 'approvalStatus', width: 14 },
        { header: '결과', key: 'result', width: 16 },
        { header: '비용(원)', key: 'costStr', width: 14 },
        { header: '다음교정일', key: 'nextCalibrationStr', width: 14 },
      ],
      generatedAt: new Date(),
      rows: rows.map((r) => ({
        managementNumber: r.managementNumber ?? '-',
        equipmentName: r.equipmentName ?? '-',
        calibrationDateStr: fmtDate(r.calibrationDate),
        completionDateStr: fmtDate(r.completionDate),
        agencyName: r.agencyName ?? '-',
        certificateNumber: r.certificateNumber ?? '-',
        statusLabel: CALIBRATION_STATUS_LABELS[r.status] ?? r.status,
        approvalStatus: APPROVAL_LABELS[r.approvalStatus] ?? r.approvalStatus,
        result: r.result ?? '-',
        costStr: r.cost ? `${Number(r.cost).toLocaleString(DEFAULT_LOCALE)}원` : '-',
        nextCalibrationStr: fmtDate(r.nextCalibrationDate),
      })),
    };
  }

  async getUtilizationData(
    filters: { startDate?: string; endDate?: string; period?: string; site?: string },
    scope: ResolvedDataScope
  ): Promise<ReportData> {
    const { start, end } = resolveDateRange(
      filters.period ?? 'last_month',
      filters.startDate,
      filters.endDate
    );
    const periodDays = Math.max(
      1,
      Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
    );
    const scopeConditions = scopeToEquipmentConditions(scope);

    const checkoutDateConditions = [
      gte(checkoutsTable.createdAt, start),
      lte(checkoutsTable.createdAt, end),
    ];

    const equipConditions: SQL[] = [...scopeConditions];
    if (filters.site) equipConditions.push(eq(equipmentTable.site, filters.site));

    const rows = await this.db
      .select({
        managementNumber: equipmentTable.managementNumber,
        name: equipmentTable.name,
        teamName: teamsTable.name,
        siteCode: equipmentTable.siteCode,
        checkoutCount: sql<number>`COALESCE(COUNT(DISTINCT ${checkoutsTable.id}), 0)`,
      })
      .from(equipmentTable)
      .leftJoin(teamsTable, eq(equipmentTable.teamId, teamsTable.id))
      .leftJoin(checkoutItemsTable, eq(checkoutItemsTable.equipmentId, equipmentTable.id))
      .leftJoin(
        checkoutsTable,
        and(eq(checkoutsTable.id, checkoutItemsTable.checkoutId), ...checkoutDateConditions)
      )
      .where(equipConditions.length > 0 ? and(...equipConditions) : undefined)
      .groupBy(
        equipmentTable.id,
        equipmentTable.managementNumber,
        equipmentTable.name,
        teamsTable.name,
        equipmentTable.siteCode
      )
      .orderBy(desc(sql`COALESCE(COUNT(DISTINCT ${checkoutsTable.id}), 0)`))
      .limit(REPORT_EXPORT_ROW_LIMIT);

    const getGrade = (rate: number): string => {
      if (rate >= REPORT_UTILIZATION_THRESHOLDS.HIGH) return '고활용';
      if (rate >= REPORT_UTILIZATION_THRESHOLDS.LOW) return '보통';
      return '저활용';
    };

    return {
      title: '장비 활용률 보고서',
      columns: [
        { header: '관리번호', key: 'managementNumber', width: 16 },
        { header: '장비명', key: 'name', width: 24 },
        { header: '팀', key: 'teamName', width: 18 },
        { header: '시험소', key: 'siteCode', width: 10 },
        { header: '반출횟수', key: 'checkoutCount', width: 12 },
        { header: '활용률(%)', key: 'utilizationRate', width: 12 },
        { header: '활용등급', key: 'utilizationGrade', width: 12 },
      ],
      generatedAt: new Date(),
      rows: rows.map((r) => {
        const rate = Math.min(100, Math.round((Number(r.checkoutCount) / periodDays) * 1000) / 10);
        return {
          managementNumber: r.managementNumber,
          name: r.name,
          teamName: r.teamName ?? '-',
          siteCode: r.siteCode ?? '-',
          checkoutCount: Number(r.checkoutCount),
          utilizationRate: `${rate}%`,
          utilizationGrade: getGrade(rate),
        };
      }),
    };
  }

  async getTeamEquipmentData(
    filters: { site?: string; teamId?: string },
    scope: ResolvedDataScope
  ): Promise<ReportData> {
    const scopeConditions = scopeToEquipmentConditions(scope);
    const conditions: SQL[] = [...scopeConditions];
    if (filters.site) conditions.push(eq(equipmentTable.site, filters.site));
    if (filters.teamId) conditions.push(eq(equipmentTable.teamId, filters.teamId));

    const rows = await this.db
      .select({
        teamName: teamsTable.name,
        teamSite: teamsTable.site,
        managementNumber: equipmentTable.managementNumber,
        name: equipmentTable.name,
        manufacturer: equipmentTable.manufacturer,
        modelName: equipmentTable.modelName,
        status: equipmentTable.status,
        location: equipmentTable.location,
        nextCalibrationDate: equipmentTable.nextCalibrationDate,
      })
      .from(equipmentTable)
      .leftJoin(teamsTable, eq(equipmentTable.teamId, teamsTable.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(teamsTable.name, equipmentTable.managementNumber)
      .limit(REPORT_EXPORT_ROW_LIMIT);

    const fmtDate = (d: Date | null | undefined): string =>
      d ? new Date(d).toLocaleDateString(DEFAULT_LOCALE) : '-';

    return {
      title: '팀별 장비 현황 보고서',
      columns: [
        { header: '팀명', key: 'teamName', width: 20 },
        { header: '시험소', key: 'teamSite', width: 12 },
        { header: '관리번호', key: 'managementNumber', width: 16 },
        { header: '장비명', key: 'name', width: 24 },
        { header: '제조사', key: 'manufacturer', width: 16 },
        { header: '모델명', key: 'modelName', width: 20 },
        { header: '상태', key: 'statusLabel', width: 14 },
        { header: '위치', key: 'location', width: 16 },
        { header: '다음 교정일', key: 'nextCalibration', width: 16 },
      ],
      generatedAt: new Date(),
      rows: rows.map((r) => ({
        teamName: r.teamName ?? '미배정',
        teamSite: r.teamSite ?? '-',
        managementNumber: r.managementNumber,
        name: r.name,
        manufacturer: r.manufacturer ?? '-',
        modelName: r.modelName ?? '-',
        statusLabel: EQUIPMENT_STATUS_LABELS[r.status] ?? r.status,
        location: r.location ?? '-',
        nextCalibration: fmtDate(r.nextCalibrationDate),
      })),
    };
  }

  async getMaintenanceData(
    filters: { startDate?: string; endDate?: string; equipmentId?: string },
    scope: ResolvedDataScope
  ): Promise<ReportData> {
    const { start, end } = resolveDateRange('last_year', filters.startDate, filters.endDate);
    const scopeConditions = scopeToEquipmentConditions(scope);

    const conditions: SQL[] = [
      gte(repairHistoryTable.repairDate, start),
      lte(repairHistoryTable.repairDate, end),
      ...scopeConditions,
    ];
    if (filters.equipmentId) {
      conditions.push(eq(repairHistoryTable.equipmentId, filters.equipmentId));
    }

    const rows = await this.db
      .select({
        managementNumber: equipmentTable.managementNumber,
        equipmentName: equipmentTable.name,
        teamName: teamsTable.name,
        repairDate: repairHistoryTable.repairDate,
        repairDescription: repairHistoryTable.repairDescription,
        repairResult: repairHistoryTable.repairResult,
        notes: repairHistoryTable.notes,
      })
      .from(repairHistoryTable)
      .innerJoin(equipmentTable, eq(repairHistoryTable.equipmentId, equipmentTable.id))
      .leftJoin(teamsTable, eq(equipmentTable.teamId, teamsTable.id))
      .where(and(...conditions))
      .orderBy(desc(repairHistoryTable.repairDate))
      .limit(REPORT_EXPORT_ROW_LIMIT);

    // SSOT: @equipment-management/schemas
    const RESULT_LABELS = REPAIR_RESULT_LABELS as Record<string, string>;

    return {
      title: '수리 및 점검 이력 보고서',
      columns: [
        { header: '관리번호', key: 'managementNumber', width: 16 },
        { header: '장비명', key: 'equipmentName', width: 24 },
        { header: '팀', key: 'teamName', width: 18 },
        { header: '수리일자', key: 'repairDateStr', width: 14 },
        { header: '수리내용', key: 'repairDescription', width: 30 },
        { header: '수리결과', key: 'repairResult', width: 14 },
        { header: '비용(원)', key: 'costStr', width: 14 },
        { header: '비고', key: 'notes', width: 20 },
      ],
      generatedAt: new Date(),
      rows: rows.map((r) => ({
        managementNumber: r.managementNumber ?? '-',
        equipmentName: r.equipmentName ?? '-',
        teamName: r.teamName ?? '-',
        repairDateStr: r.repairDate
          ? new Date(r.repairDate).toLocaleDateString(DEFAULT_LOCALE)
          : '-',
        repairDescription: r.repairDescription,
        repairResult: RESULT_LABELS[r.repairResult ?? ''] ?? r.repairResult ?? '-',
        costStr: '-',
        notes: r.notes ?? '-',
      })),
    };
  }

  /**
   * 감사 로그 내보내기 데이터 조회
   *
   * RBAC 스코프 필터(userSite/userTeamId)는 컨트롤러에서 resolveDataScope()로 주입됨.
   * REPORT_EXPORT_ROW_LIMIT 적용 — 대용량 데이터는 날짜 범위 필터로 분할 내보내기 권장.
   */
  async getAuditLogExportData(filter: AuditLogFilter): Promise<ReportData> {
    const conditions: SQL[] = [];

    if (filter.userId) conditions.push(eq(auditLogsTable.userId, filter.userId));
    if (filter.entityType) conditions.push(eq(auditLogsTable.entityType, filter.entityType));
    if (filter.entityId) conditions.push(eq(auditLogsTable.entityId, filter.entityId));
    if (filter.action) conditions.push(eq(auditLogsTable.action, filter.action));
    if (filter.startDate)
      conditions.push(gte(auditLogsTable.timestamp, new Date(filter.startDate)));
    if (filter.endDate) conditions.push(lte(auditLogsTable.timestamp, new Date(filter.endDate)));
    // RBAC 서버 강제 스코프
    if (filter.userSite) conditions.push(eq(auditLogsTable.userSite, filter.userSite));
    if (filter.userTeamId) conditions.push(eq(auditLogsTable.userTeamId, filter.userTeamId));

    const rows = await this.db
      .select({
        timestamp: auditLogsTable.timestamp,
        userName: auditLogsTable.userName,
        userRole: auditLogsTable.userRole,
        action: auditLogsTable.action,
        entityType: auditLogsTable.entityType,
        entityName: auditLogsTable.entityName,
        entityId: auditLogsTable.entityId,
        ipAddress: auditLogsTable.ipAddress,
        userSite: auditLogsTable.userSite,
      })
      .from(auditLogsTable)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(auditLogsTable.timestamp))
      .limit(REPORT_EXPORT_ROW_LIMIT);

    const columns: ReportColumn[] = [
      { header: '시간', key: 'timestampStr', width: 22 },
      { header: '사용자명', key: 'userName', width: 16 },
      { header: '역할', key: 'roleLabel', width: 14 },
      { header: '액션', key: 'actionLabel', width: 12 },
      { header: '대상유형', key: 'entityTypeLabel', width: 16 },
      { header: '대상명', key: 'entityName', width: 24 },
      { header: '대상ID(앞8자)', key: 'entityIdShort', width: 16 },
      { header: 'IP주소', key: 'ipAddress', width: 16 },
      { header: '시험소', key: 'userSite', width: 10 },
    ];

    const fmtTs = (d: Date | string): string =>
      new Date(d).toLocaleString(DEFAULT_LOCALE, { timeZone: DEFAULT_TIMEZONE });

    return {
      title: '감사 로그 보고서',
      columns,
      generatedAt: new Date(),
      rows: rows.map((r) => ({
        timestampStr: fmtTs(r.timestamp),
        userName: r.userName,
        roleLabel:
          r.userRole === 'system'
            ? '시스템'
            : r.userRole === 'unknown'
              ? '알 수 없음'
              : (USER_ROLE_LABELS[r.userRole as UserRole] ?? r.userRole),
        actionLabel: AUDIT_ACTION_LABELS[r.action as AuditAction] ?? r.action,
        entityTypeLabel: AUDIT_ENTITY_TYPE_LABELS[r.entityType as AuditEntityType] ?? r.entityType,
        entityName: r.entityName ?? '-',
        entityIdShort: r.entityId.substring(0, 8),
        ipAddress: r.ipAddress ?? '-',
        userSite: r.userSite ?? '-',
      })),
    };
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Private 집계 헬퍼
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * 실제 평균 대여 기간 계산 (일 단위)
   * actualReturnDate가 있는 반환된 checkout의 (actualReturnDate - createdAt) 평균
   */
  private async _computeAvgCheckoutDuration(
    start: Date,
    end: Date,
    scopeConditions: SQL[]
  ): Promise<number> {
    const result = await this.db
      .select({
        avgDays: avg(
          sql<number>`EXTRACT(EPOCH FROM (${checkoutsTable.actualReturnDate} - ${checkoutsTable.createdAt})) / 86400`
        ),
      })
      .from(checkoutsTable)
      .innerJoin(checkoutItemsTable, eq(checkoutItemsTable.checkoutId, checkoutsTable.id))
      .innerJoin(equipmentTable, eq(checkoutItemsTable.equipmentId, equipmentTable.id))
      .where(
        and(
          gte(checkoutsTable.createdAt, start),
          lte(checkoutsTable.createdAt, end),
          isNotNull(checkoutsTable.actualReturnDate),
          ...scopeConditions
        )
      );

    const avgDays = result[0]?.avgDays;
    return avgDays ? Math.round(Number(avgDays) * 10) / 10 : 0;
  }

  /**
   * 월별 반출/반환 추이 — 실제 반환 상태 카운트
   */
  private async _getMonthlyCheckoutTrend(
    start: Date,
    end: Date,
    scopeConditions: SQL[]
  ): Promise<{ month: string; checkouts: number; returns: number }[]> {
    // 전체 checkout 월별 카운트 — INNER JOIN + COUNT(DISTINCT)로 fan-out 방지
    const checkoutRows = await this.db
      .select({
        month: sql<string>`TO_CHAR(${checkoutsTable.createdAt}, 'YYYY-MM')`,
        checkouts: sql<number>`COUNT(DISTINCT ${checkoutsTable.id})`,
      })
      .from(checkoutsTable)
      .innerJoin(checkoutItemsTable, eq(checkoutItemsTable.checkoutId, checkoutsTable.id))
      .innerJoin(equipmentTable, eq(checkoutItemsTable.equipmentId, equipmentTable.id))
      .where(
        and(
          gte(checkoutsTable.createdAt, start),
          lte(checkoutsTable.createdAt, end),
          ...scopeConditions
        )
      )
      .groupBy(sql`TO_CHAR(${checkoutsTable.createdAt}, 'YYYY-MM')`)
      .orderBy(sql`TO_CHAR(${checkoutsTable.createdAt}, 'YYYY-MM')`);

    // 반환된 checkout 월별 카운트 (actualReturnDate 기준) — INNER JOIN + COUNT(DISTINCT)
    const returnRows = await this.db
      .select({
        month: sql<string>`TO_CHAR(${checkoutsTable.actualReturnDate}, 'YYYY-MM')`,
        returns: sql<number>`COUNT(DISTINCT ${checkoutsTable.id})`,
      })
      .from(checkoutsTable)
      .innerJoin(checkoutItemsTable, eq(checkoutItemsTable.checkoutId, checkoutsTable.id))
      .innerJoin(equipmentTable, eq(checkoutItemsTable.equipmentId, equipmentTable.id))
      .where(
        and(
          isNotNull(checkoutsTable.actualReturnDate),
          gte(checkoutsTable.actualReturnDate, start),
          lte(checkoutsTable.actualReturnDate, end),
          ...scopeConditions
        )
      )
      .groupBy(sql`TO_CHAR(${checkoutsTable.actualReturnDate}, 'YYYY-MM')`)
      .orderBy(sql`TO_CHAR(${checkoutsTable.actualReturnDate}, 'YYYY-MM')`);

    // 양쪽 월을 합집합으로 병합 — 반환 전용 월도 포함
    const checkoutMap = new Map(checkoutRows.map((r) => [r.month, Number(r.checkouts)]));
    const returnMap = new Map(returnRows.map((r) => [r.month, Number(r.returns)]));
    const allMonths = new Set([...checkoutMap.keys(), ...returnMap.keys()]);

    return [...allMonths].sort().map((month) => ({
      month,
      checkouts: checkoutMap.get(month) ?? 0,
      returns: returnMap.get(month) ?? 0,
    }));
  }

  private async _getMonthlyCalibrationTrend(
    start: Date,
    end: Date,
    scopeConditions: SQL[]
  ): Promise<{ month: string; completed: number; due: number; overdue: number }[]> {
    const rows = await this.db
      .select({
        month: sql<string>`TO_CHAR(${calibrationsTable.calibrationDate}, 'YYYY-MM')`,
        status: calibrationsTable.status,
        cnt: count(calibrationsTable.id),
      })
      .from(calibrationsTable)
      .innerJoin(equipmentTable, eq(calibrationsTable.equipmentId, equipmentTable.id))
      .where(
        and(
          gte(calibrationsTable.calibrationDate, start),
          lte(calibrationsTable.calibrationDate, end),
          ...scopeConditions
        )
      )
      .groupBy(
        sql`TO_CHAR(${calibrationsTable.calibrationDate}, 'YYYY-MM')`,
        calibrationsTable.status
      )
      .orderBy(sql`TO_CHAR(${calibrationsTable.calibrationDate}, 'YYYY-MM')`);

    const byMonth: Record<string, { completed: number; due: number; overdue: number }> = {};
    for (const r of rows) {
      if (!byMonth[r.month]) byMonth[r.month] = { completed: 0, due: 0, overdue: 0 };
      if (r.status === CalibrationStatusEnum.enum.completed)
        byMonth[r.month].completed += Number(r.cnt);
      if (r.status === CalibrationStatusEnum.enum.scheduled) byMonth[r.month].due += Number(r.cnt);
      if (r.status === CalibrationStatusEnum.enum.failed) byMonth[r.month].overdue += Number(r.cnt);
    }

    return Object.entries(byMonth).map(([month, counts]) => ({ month, ...counts }));
  }
}

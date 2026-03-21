import { Injectable, Inject } from '@nestjs/common';
import type { AppDatabase } from '@equipment-management/db';
import { eq, and, count, gte, lte, desc, inArray, sql, SQL } from 'drizzle-orm';
import * as schema from '@equipment-management/db/schema';
import {
  UserRole,
  EquipmentStatusEnum,
  CheckoutStatusEnum,
  CalibrationRequiredEnum,
  CheckoutPurposeValues as CPVal,
  AUDIT_TO_ACTIVITY_TYPE,
  RENTAL_ACTIVITY_TYPE_OVERRIDES,
  AUDIT_ACTION_LABELS,
  AUDIT_ENTITY_TYPE_LABELS,
} from '@equipment-management/schemas';
import { SimpleCacheService } from '../../common/cache/simple-cache.service';
import { CACHE_KEY_PREFIXES } from '../../common/cache/cache-key-prefixes';
import { ApprovalsService } from '../approvals/approvals.service';
import {
  CACHE_TTL,
  DASHBOARD_ITEM_LIMIT,
  DASHBOARD_ACTIVITIES_LIMIT,
} from '@equipment-management/shared-constants';
import {
  DashboardSummaryDto,
  EquipmentByTeamDto,
  OverdueCalibrationDto,
  UpcomingCalibrationDto,
  OverdueCheckoutDto,
  UpcomingCheckoutReturnDto,
  RecentActivityDto,
  PendingApprovalCountsDto,
  EquipmentStatusStatsDto,
} from './dto/dashboard-response.dto';

/**
 * 대시보드 서비스
 *
 * 역할별 데이터 스코프는 Controller의 resolveDashboardScope()가
 * DASHBOARD_DATA_SCOPE 정책으로 사전 해석한 site/teamId 파라미터로 제공됩니다.
 * 서비스는 순수 데이터 접근 레이어로, 정책 해석을 하지 않습니다.
 *
 * 모든 조회 메서드는 SimpleCacheService로 캐싱됩니다 (30s TTL).
 * 캐시 무효화: CacheInvalidationHelper.invalidateAllDashboard()
 */
@Injectable()
export class DashboardService {
  constructor(
    @Inject('DRIZZLE_INSTANCE') private readonly db: AppDatabase,
    private readonly cacheService: SimpleCacheService,
    private readonly approvalsService: ApprovalsService
  ) {}

  /**
   * 대시보드 요약 정보 조회
   */
  async getSummary(teamId?: string, site?: string): Promise<DashboardSummaryDto> {
    const cacheKey = `${CACHE_KEY_PREFIXES.DASHBOARD}summary:${site || 'all'}:${teamId || 'all'}`;
    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        // 3개 equipment COUNT → 1개 조건부 집계 + checkout COUNT 병렬 실행 (4쿼리 → 2쿼리)
        const today = new Date();
        const thirtyDaysLater = new Date(today);
        thirtyDaysLater.setDate(today.getDate() + 30);

        const siteTeamFilter = and(
          teamId ? eq(schema.equipment.teamId, teamId) : undefined,
          site ? eq(schema.equipment.site, site) : undefined
        );

        const [[equipmentStats], [checkoutResult]] = await Promise.all([
          // 단일 쿼리: total + available + upcoming calibrations (FILTER 조건부 집계)
          this.db
            .select({
              total: count(),
              available: sql<number>`cast(count(*) filter (where ${schema.equipment.status} = ${EquipmentStatusEnum.enum.available}) as integer)`,
              upcomingCalibrations: sql<number>`cast(count(*) filter (where ${schema.equipment.calibrationRequired} = ${CalibrationRequiredEnum.enum.required} and ${schema.equipment.nextCalibrationDate} >= ${today} and ${schema.equipment.nextCalibrationDate} <= ${thirtyDaysLater}) as integer)`,
            })
            .from(schema.equipment)
            .where(siteTeamFilter),
          // 활성 반출 수 (다른 테이블이므로 별도 쿼리, 병렬 실행)
          this.db
            .select({
              count: sql<number>`cast(count(distinct ${schema.checkouts.id}) as integer)`,
            })
            .from(schema.checkouts)
            .innerJoin(
              schema.checkoutItems,
              eq(schema.checkouts.id, schema.checkoutItems.checkoutId)
            )
            .leftJoin(schema.equipment, eq(schema.checkoutItems.equipmentId, schema.equipment.id))
            .where(
              and(
                eq(schema.checkouts.status, CheckoutStatusEnum.enum.checked_out),
                teamId ? eq(schema.equipment.teamId, teamId) : undefined,
                site ? eq(schema.equipment.site, site) : undefined
              )
            ),
        ]);

        return {
          totalEquipment: equipmentStats?.total || 0,
          availableEquipment: equipmentStats?.available || 0,
          activeCheckouts: checkoutResult?.count || 0,
          upcomingCalibrations: equipmentStats?.upcomingCalibrations || 0,
        };
      },
      CACHE_TTL.SHORT
    );
  }

  /**
   * 팀별 장비 현황 조회
   */
  async getEquipmentByTeam(teamId?: string, site?: string): Promise<EquipmentByTeamDto[]> {
    const cacheKey = `${CACHE_KEY_PREFIXES.DASHBOARD}equipmentByTeam:${site || 'all'}:${teamId || 'all'}`;
    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        const results = await this.db
          .select({
            teamId: schema.equipment.teamId,
            teamName: schema.teams.name,
            count: count(),
          })
          .from(schema.equipment)
          .leftJoin(schema.teams, eq(schema.equipment.teamId, schema.teams.id))
          .where(
            and(
              teamId ? eq(schema.equipment.teamId, teamId) : undefined,
              site ? eq(schema.equipment.site, site) : undefined
            )
          )
          .groupBy(schema.equipment.teamId, schema.teams.name);

        return results.map((r) => ({
          id: r.teamId || 'unknown',
          name: r.teamName || '미지정',
          count: r.count,
        }));
      },
      CACHE_TTL.SHORT
    );
  }

  /**
   * 교정 지연 장비 조회
   */
  async getOverdueCalibrations(
    teamId?: string,
    site?: string
  ): Promise<{ items: OverdueCalibrationDto[]; hasMore: boolean }> {
    const cacheKey = `${CACHE_KEY_PREFIXES.DASHBOARD}overdueCalibrations:${site || 'all'}:${teamId || 'all'}`;
    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        const today = new Date();

        const results = await this.db
          .select({
            id: schema.equipment.id,
            name: schema.equipment.name,
            managementNumber: schema.equipment.managementNumber,
            nextCalibrationDate: schema.equipment.nextCalibrationDate,
            teamName: schema.teams.name,
          })
          .from(schema.equipment)
          .leftJoin(schema.teams, eq(schema.equipment.teamId, schema.teams.id))
          .where(
            and(
              eq(schema.equipment.calibrationRequired, CalibrationRequiredEnum.enum.required),
              lte(schema.equipment.nextCalibrationDate, today),
              teamId ? eq(schema.equipment.teamId, teamId) : undefined,
              site ? eq(schema.equipment.site, site) : undefined
            )
          )
          .orderBy(schema.equipment.nextCalibrationDate)
          .limit(DASHBOARD_ITEM_LIMIT + 1);

        const hasMore = results.length > DASHBOARD_ITEM_LIMIT;
        const items = hasMore ? results.slice(0, DASHBOARD_ITEM_LIMIT) : results;

        return {
          items: items.map((r) => {
            const dueDate = r.nextCalibrationDate ? new Date(r.nextCalibrationDate) : today;
            const daysOverdue = Math.floor(
              (today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)
            );

            return {
              id: r.id,
              name: r.name,
              managementNumber: r.managementNumber,
              dueDate: r.nextCalibrationDate ? r.nextCalibrationDate.toISOString() : '',
              daysOverdue,
              teamName: r.teamName || undefined,
            };
          }),
          hasMore,
        };
      },
      CACHE_TTL.SHORT
    );
  }

  /**
   * 교정 예정 장비 조회 (다음 N일 이내)
   */
  async getUpcomingCalibrations(
    days: number,
    teamId?: string,
    site?: string
  ): Promise<{ items: UpcomingCalibrationDto[]; hasMore: boolean }> {
    const cacheKey = `${CACHE_KEY_PREFIXES.DASHBOARD}upcomingCalibrations:${days}:${site || 'all'}:${teamId || 'all'}`;
    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        const today = new Date();
        const futureDate = new Date(today);
        futureDate.setDate(today.getDate() + days);

        const results = await this.db
          .select({
            id: schema.equipment.id,
            name: schema.equipment.name,
            managementNumber: schema.equipment.managementNumber,
            nextCalibrationDate: schema.equipment.nextCalibrationDate,
          })
          .from(schema.equipment)
          .where(
            and(
              eq(schema.equipment.calibrationRequired, CalibrationRequiredEnum.enum.required),
              gte(schema.equipment.nextCalibrationDate, today),
              lte(schema.equipment.nextCalibrationDate, futureDate),
              teamId ? eq(schema.equipment.teamId, teamId) : undefined,
              site ? eq(schema.equipment.site, site) : undefined
            )
          )
          .orderBy(schema.equipment.nextCalibrationDate)
          .limit(DASHBOARD_ITEM_LIMIT + 1);

        const hasMore = results.length > DASHBOARD_ITEM_LIMIT;
        const items = hasMore ? results.slice(0, DASHBOARD_ITEM_LIMIT) : results;

        return {
          items: items.map((r) => {
            const dueDate = r.nextCalibrationDate ? new Date(r.nextCalibrationDate) : today;
            const daysUntilDue = Math.floor(
              (dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
            );

            return {
              id: r.id,
              equipmentId: r.id,
              equipmentName: r.name,
              managementNumber: r.managementNumber,
              dueDate: r.nextCalibrationDate ? r.nextCalibrationDate.toISOString() : '',
              daysUntilDue,
            };
          }),
          hasMore,
        };
      },
      CACHE_TTL.SHORT
    );
  }

  /**
   * 반출 지연 조회 (checkouts + checkout_items 테이블 사용 - 대여/교정/수리 포함)
   */
  async getOverdueCheckouts(
    teamId?: string,
    site?: string
  ): Promise<{ items: OverdueCheckoutDto[]; hasMore: boolean }> {
    const cacheKey = `${CACHE_KEY_PREFIXES.DASHBOARD}overdueCheckouts:${site || 'all'}:${teamId || 'all'}`;
    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        const today = new Date();

        // checkout_items를 통해 장비 정보 조회 (checkoutItemId로 행 고유 식별)
        const results = await this.db
          .select({
            id: schema.checkouts.id,
            checkoutItemId: schema.checkoutItems.id,
            equipmentId: schema.checkoutItems.equipmentId,
            equipmentName: schema.equipment.name,
            equipmentManagementNumber: schema.equipment.managementNumber,
            userId: schema.checkouts.requesterId,
            userName: schema.users.name,
            userEmail: schema.users.email,
            teamName: schema.teams.name,
            expectedReturnDate: schema.checkouts.expectedReturnDate,
            checkoutDate: schema.checkouts.checkoutDate,
            status: schema.checkouts.status,
            purpose: schema.checkouts.purpose,
          })
          .from(schema.checkouts)
          .innerJoin(schema.checkoutItems, eq(schema.checkouts.id, schema.checkoutItems.checkoutId))
          .leftJoin(schema.equipment, eq(schema.checkoutItems.equipmentId, schema.equipment.id))
          .leftJoin(schema.users, eq(schema.checkouts.requesterId, schema.users.id))
          .leftJoin(schema.teams, eq(schema.equipment.teamId, schema.teams.id))
          .where(
            and(
              eq(schema.checkouts.status, CheckoutStatusEnum.enum.checked_out),
              lte(schema.checkouts.expectedReturnDate, today),
              teamId ? eq(schema.equipment.teamId, teamId) : undefined,
              site ? eq(schema.equipment.site, site) : undefined
            )
          )
          .orderBy(schema.checkouts.expectedReturnDate)
          .limit(DASHBOARD_ITEM_LIMIT + 1);

        const hasMore = results.length > DASHBOARD_ITEM_LIMIT;
        const items = hasMore ? results.slice(0, DASHBOARD_ITEM_LIMIT) : results;

        return {
          items: items.map((r) => {
            const expectedDate = r.expectedReturnDate ? new Date(r.expectedReturnDate) : today;
            const daysOverdue = Math.floor(
              (today.getTime() - expectedDate.getTime()) / (1000 * 60 * 60 * 24)
            );

            return {
              id: r.id,
              checkoutItemId: r.checkoutItemId,
              equipmentId: r.equipmentId,
              equipment: {
                id: r.equipmentId,
                name: r.equipmentName || '',
                managementNumber: r.equipmentManagementNumber || '',
              },
              userId: r.userId,
              user: {
                id: r.userId,
                name: r.userName || '',
                email: r.userEmail || '',
              },
              expectedReturnDate: r.expectedReturnDate ? r.expectedReturnDate.toISOString() : '',
              startDate: r.checkoutDate ? r.checkoutDate.toISOString() : '',
              status: r.status || '',
              daysOverdue,
              teamName: r.teamName || undefined,
            };
          }),
          hasMore,
        };
      },
      CACHE_TTL.SHORT
    );
  }

  /**
   * 반납 예정 반출 조회 (달력용, 다음 N일 이내)
   */
  async getUpcomingCheckoutReturns(
    days: number = 30,
    teamId?: string,
    site?: string
  ): Promise<{ items: UpcomingCheckoutReturnDto[]; hasMore: boolean }> {
    const cacheKey = `${CACHE_KEY_PREFIXES.DASHBOARD}upcomingCheckoutReturns:${days}:${site || 'all'}:${teamId || 'all'}`;
    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        const today = new Date();
        const futureDate = new Date(today);
        futureDate.setDate(today.getDate() + days);

        const results = await this.db
          .select({
            id: schema.checkouts.id,
            checkoutItemId: schema.checkoutItems.id,
            equipmentName: schema.equipment.name,
            managementNumber: schema.equipment.managementNumber,
            expectedReturnDate: schema.checkouts.expectedReturnDate,
            purpose: schema.checkouts.purpose,
          })
          .from(schema.checkouts)
          .innerJoin(schema.checkoutItems, eq(schema.checkouts.id, schema.checkoutItems.checkoutId))
          .leftJoin(schema.equipment, eq(schema.checkoutItems.equipmentId, schema.equipment.id))
          .where(
            and(
              eq(schema.checkouts.status, CheckoutStatusEnum.enum.checked_out),
              gte(schema.checkouts.expectedReturnDate, today),
              lte(schema.checkouts.expectedReturnDate, futureDate),
              teamId ? eq(schema.equipment.teamId, teamId) : undefined,
              site ? eq(schema.equipment.site, site) : undefined
            )
          )
          .orderBy(schema.checkouts.expectedReturnDate)
          .limit(DASHBOARD_ITEM_LIMIT + 1);

        const hasMore = results.length > DASHBOARD_ITEM_LIMIT;
        const items = hasMore ? results.slice(0, DASHBOARD_ITEM_LIMIT) : results;

        return {
          items: items.map((r) => {
            const expectedDate = r.expectedReturnDate ? new Date(r.expectedReturnDate) : today;
            const daysUntilReturn = Math.floor(
              (expectedDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
            );

            return {
              id: r.id,
              checkoutItemId: r.checkoutItemId,
              equipmentName: r.equipmentName || '',
              managementNumber: r.managementNumber || '',
              expectedReturnDate: r.expectedReturnDate ? r.expectedReturnDate.toISOString() : '',
              daysUntilReturn,
              purpose: r.purpose || '',
            };
          }),
          hasMore,
        };
      },
      CACHE_TTL.SHORT
    );
  }

  /**
   * 최근 활동 내역 조회
   *
   * 감사 로그(audit_logs)를 기반으로 7일 이내 활동을 조회합니다.
   * - entityType: equipment, calibration, checkout 등 대시보드 관련
   * - action: create, update, approve, reject
   * - checkout LEFT JOIN으로 purpose 기반 rental/checkout 분기
   *
   * 스코프 필터링: Controller의 resolveDashboardScope()가 DASHBOARD_DATA_SCOPE로
   * 해석한 site/teamId를 그대로 사용합니다. 서비스 내부에 역할별 분기 없음.
   * - teamId 설정 → auditLogs.userTeamId 필터 (TE/TM)
   * - site 설정 → auditLogs.userSite 필터 (LM)
   * - 둘 다 미설정 → 전체 조회 (QM/SA)
   */
  async getRecentActivities(
    limit = DASHBOARD_ACTIVITIES_LIMIT,
    teamId?: string,
    site?: string
  ): Promise<RecentActivityDto[]> {
    const cacheKey = `${CACHE_KEY_PREFIXES.DASHBOARD}recentActivities:${site || 'all'}:${teamId || 'all'}`;
    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        // 스코프 조건: Controller에서 정책 해석 완료된 site/teamId 사용
        const scopeConditions: SQL[] = [];
        if (teamId) {
          scopeConditions.push(eq(schema.auditLogs.userTeamId, teamId));
        }
        if (site) {
          scopeConditions.push(eq(schema.auditLogs.userSite, site));
        }

        const results = await this.db
          .select({
            id: schema.auditLogs.id,
            action: schema.auditLogs.action,
            entityType: schema.auditLogs.entityType,
            entityId: schema.auditLogs.entityId,
            entityName: schema.auditLogs.entityName,
            userId: schema.auditLogs.userId,
            userName: schema.auditLogs.userName,
            timestamp: schema.auditLogs.timestamp,
            details: schema.auditLogs.details,
            checkoutPurpose: schema.checkouts.purpose,
          })
          .from(schema.auditLogs)
          .leftJoin(
            schema.checkouts,
            and(
              eq(schema.auditLogs.entityType, 'checkout'),
              eq(schema.auditLogs.entityId, schema.checkouts.id)
            )
          )
          .where(
            and(
              gte(schema.auditLogs.timestamp, sevenDaysAgo),
              inArray(schema.auditLogs.entityType, [
                'equipment',
                'calibration',
                'checkout',
                'non_conformance',
                'calibration_plan',
              ]),
              inArray(schema.auditLogs.action, ['create', 'update', 'approve', 'reject']),
              ...scopeConditions
            )
          )
          .orderBy(desc(schema.auditLogs.timestamp))
          .limit(limit);

        // 결과 변환
        return results.map((row) => {
          const actionKey = `${row.action}:${row.entityType}`;
          let activityType = AUDIT_TO_ACTIVITY_TYPE[actionKey] || 'unknown';

          // rental purpose면 오버라이드
          if (row.entityType === 'checkout' && row.checkoutPurpose === CPVal.RENTAL) {
            activityType = RENTAL_ACTIVITY_TYPE_OVERRIDES[activityType] || activityType;
          }

          const details = this.formatActivityDetails(
            row.action,
            row.entityType,
            row.entityName || ''
          );

          return {
            id: row.id,
            type: activityType,
            equipmentId: row.entityType === 'equipment' ? row.entityId : '',
            equipmentName: row.entityName || '',
            userId: row.userId,
            userName: row.userName,
            timestamp: row.timestamp.toISOString(),
            details,
            entityId: row.entityId,
            entityName: row.entityName || '',
          };
        });
      },
      CACHE_TTL.SHORT
    );
  }

  /**
   * 활동 상세 메시지 포매팅 (한국어)
   */
  private formatActivityDetails(action: string, entityType: string, entityName: string): string {
    const actionLabel = (AUDIT_ACTION_LABELS as Record<string, string>)[action] || action;
    const entityLabel =
      (AUDIT_ENTITY_TYPE_LABELS as Record<string, string>)[entityType] || entityType;

    if (entityName) {
      return `${entityLabel} "${entityName}" ${actionLabel}`;
    }
    return `${entityLabel} ${actionLabel}`;
  }

  /**
   * 승인 대기 카운트 조회
   *
   * SSOT: ApprovalsService.getApprovalCountsByScope()에 위임.
   * Dashboard DTO 형식으로 매핑만 담당합니다.
   */
  async getPendingApprovalCounts(
    userRole: UserRole,
    teamId?: string,
    site?: string
  ): Promise<PendingApprovalCountsDto> {
    const cacheKey = `${CACHE_KEY_PREFIXES.DASHBOARD}pendingApprovalCounts:${userRole}:${site || 'all'}:${teamId || 'all'}`;
    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        const counts = await this.approvalsService.getApprovalCountsByScope({
          role: userRole,
          site: site ?? undefined,
          teamId: teamId ?? undefined,
        });

        const equipment = counts.equipment;
        const calibration = counts.calibration;
        const checkout = counts.outgoing;
        const software = counts.software;

        return {
          equipment,
          calibration,
          checkout,
          software,
          total: equipment + calibration + checkout + software,
        };
      },
      CACHE_TTL.SHORT
    );
  }

  /**
   * 장비 상태별 통계 조회
   */
  async getEquipmentStatusStats(teamId?: string, site?: string): Promise<EquipmentStatusStatsDto> {
    const cacheKey = `${CACHE_KEY_PREFIXES.DASHBOARD}equipmentStatusStats:${site || 'all'}:${teamId || 'all'}`;
    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        const results = await this.db
          .select({
            status: schema.equipment.status,
            count: count(),
          })
          .from(schema.equipment)
          .where(
            and(
              teamId ? eq(schema.equipment.teamId, teamId) : undefined,
              site ? eq(schema.equipment.site, site) : undefined
            )
          )
          .groupBy(schema.equipment.status);

        const stats: EquipmentStatusStatsDto = {};
        results.forEach((r) => {
          stats[r.status || 'unknown'] = r.count;
        });

        return stats;
      },
      CACHE_TTL.SHORT
    );
  }

  /**
   * 대시보드 전체 집계 조회 (SSR 단일 요청용)
   *
   * 7개 서브 쿼리를 병렬로 실행하고 결과를 하나의 응답으로 묶습니다.
   * Promise.allSettled로 부분 실패를 허용합니다 — 일부 데이터 조회 실패 시에도
   * 나머지 데이터는 정상 반환됩니다 (null로 표시).
   *
   * 각 서브 메서드는 이미 SimpleCacheService(30s TTL)로 캐싱되므로
   * 집계 메서드 자체의 추가 캐시는 불필요합니다.
   */
  async getAggregate(
    userRole: UserRole,
    site: string | undefined,
    teamId?: string,
    days = 30,
    activitiesLimit = 20
  ): Promise<import('./dto/dashboard-response.dto').DashboardAggregateDto> {
    const [
      summaryResult,
      equipmentByTeamResult,
      overdueCalibResult,
      upcomingCalibResult,
      overdueCheckoutsResult,
      statusStatsResult,
      recentActivitiesResult,
      upcomingCheckoutReturnsResult,
    ] = await Promise.allSettled([
      this.getSummary(teamId, site),
      this.getEquipmentByTeam(teamId, site),
      this.getOverdueCalibrations(teamId, site),
      this.getUpcomingCalibrations(days, teamId, site),
      this.getOverdueCheckouts(teamId, site),
      this.getEquipmentStatusStats(teamId, site),
      this.getRecentActivities(activitiesLimit, teamId, site),
      this.getUpcomingCheckoutReturns(days, teamId, site),
    ]);

    return {
      summary: summaryResult.status === 'fulfilled' ? summaryResult.value : null,
      equipmentByTeam:
        equipmentByTeamResult.status === 'fulfilled' ? equipmentByTeamResult.value : null,
      overdueCalibrations:
        overdueCalibResult.status === 'fulfilled' ? overdueCalibResult.value : null,
      upcomingCalibrations:
        upcomingCalibResult.status === 'fulfilled' ? upcomingCalibResult.value : null,
      overdueCheckouts:
        overdueCheckoutsResult.status === 'fulfilled' ? overdueCheckoutsResult.value : null,
      equipmentStatusStats:
        statusStatsResult.status === 'fulfilled' ? statusStatsResult.value : null,
      recentActivities:
        recentActivitiesResult.status === 'fulfilled' ? recentActivitiesResult.value : null,
      upcomingCheckoutReturns:
        upcomingCheckoutReturnsResult.status === 'fulfilled'
          ? upcomingCheckoutReturnsResult.value
          : null,
    };
  }
}

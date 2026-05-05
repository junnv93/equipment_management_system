import { Injectable, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { AppDatabase } from '@equipment-management/db';
import { eq, and, count, gte, lte, desc, inArray, notInArray, sql, SQL } from 'drizzle-orm';
import * as schema from '@equipment-management/db/schema';
import {
  UserRole,
  EquipmentStatusEnum,
  EquipmentStatusValues as ESVal,
  CheckoutStatusEnum,
  CalibrationRequiredEnum,
  CalibrationPlanStatusValues,
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
  CALIBRATION_THRESHOLDS,
  DASHBOARD_ITEM_LIMIT,
  DASHBOARD_ACTIVITIES_LIMIT,
  SYSTEM_HEALTH_OVERALL_THRESHOLDS,
  DASHBOARD_TIME_WINDOWS,
  type DashboardScope,
} from '@equipment-management/shared-constants';
import {
  STORAGE_HEALTH_PROVIDER,
  ASYNC_WORK_BACKLOG_PROVIDER,
  SYSTEM_ERROR_EVENT_PROVIDER,
} from './health-providers/tokens';
import type {
  StorageHealthProvider,
  AsyncWorkBacklogProvider,
  SystemErrorEventProvider,
} from './health-providers/types';
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
/**
 * 대시보드 카운트에서 제외할 장비 상태 (SSOT)
 *
 * 장비 목록의 showRetired=false 기본값과 일치시키기 위해
 * disposed 상태를 모든 대시보드 쿼리에서 제외합니다.
 * 이 상수를 수정하면 getSummary, getEquipmentByTeam, getEquipmentStatusStats에 동시 반영.
 */
const DASHBOARD_EXCLUDED_STATUSES = [ESVal.DISPOSED] as const;

@Injectable()
export class DashboardService {
  constructor(
    @Inject('DRIZZLE_INSTANCE') private readonly db: AppDatabase,
    private readonly cacheService: SimpleCacheService,
    private readonly approvalsService: ApprovalsService,
    private readonly configService: ConfigService,
    @Inject(STORAGE_HEALTH_PROVIDER)
    private readonly storageHealthProvider: StorageHealthProvider,
    @Inject(ASYNC_WORK_BACKLOG_PROVIDER)
    private readonly asyncWorkBacklogProvider: AsyncWorkBacklogProvider,
    @Inject(SYSTEM_ERROR_EVENT_PROVIDER)
    private readonly systemErrorEventProvider: SystemErrorEventProvider
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
        thirtyDaysLater.setDate(today.getDate() + DASHBOARD_TIME_WINDOWS.upcomingCalibrationDays);

        // retired/disposed 제외 — 장비 목록(showRetired=false 기본값)과 카운트 일치
        const siteTeamFilter = and(
          teamId ? eq(schema.equipment.teamId, teamId) : undefined,
          site ? eq(schema.equipment.site, site) : undefined,
          notInArray(schema.equipment.status, [...DASHBOARD_EXCLUDED_STATUSES])
        );

        // 단일 쿼리: total + available + activeCheckouts + upcoming calibrations (FILTER 조건부 집계)
        // ✅ SSOT: activeCheckouts도 equipment.status 기반 — KPI 클릭 → 장비 목록(status=checked_out) 건수와 일치
        const [equipmentStats] = await this.db
          .select({
            total: count(),
            available: sql<number>`cast(count(*) filter (where ${schema.equipment.status} = ${EquipmentStatusEnum.enum.available}) as integer)`,
            activeCheckouts: sql<number>`cast(count(*) filter (where ${schema.equipment.status} = ${EquipmentStatusEnum.enum.checked_out}) as integer)`,
            upcomingCalibrations: sql<number>`cast(count(*) filter (where ${schema.equipment.calibrationRequired} = ${CalibrationRequiredEnum.enum.required} and ${schema.equipment.nextCalibrationDate} >= ${today} and ${schema.equipment.nextCalibrationDate} <= ${thirtyDaysLater}) as integer)`,
          })
          .from(schema.equipment)
          .where(siteTeamFilter);

        return {
          totalEquipment: equipmentStats?.total || 0,
          availableEquipment: equipmentStats?.available || 0,
          activeCheckouts: equipmentStats?.activeCheckouts || 0,
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
              site ? eq(schema.equipment.site, site) : undefined,
              notInArray(schema.equipment.status, [...DASHBOARD_EXCLUDED_STATUSES])
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
              notInArray(schema.equipment.status, [...DASHBOARD_EXCLUDED_STATUSES]),
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
              notInArray(schema.equipment.status, [...DASHBOARD_EXCLUDED_STATUSES]),
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
    days: number = CALIBRATION_THRESHOLDS.WARNING_DAYS,
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
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - DASHBOARD_TIME_WINDOWS.recentActivityDays);

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
            // audit_logs.userId는 사용자 삭제 후 NULL이 될 수 있음 (FK SET NULL) — DTO 호환 위해 빈 문자열로 폴백
            userId: row.userId ?? '',
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
        const software = counts.software_validation;

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
              site ? eq(schema.equipment.site, site) : undefined,
              notInArray(schema.equipment.status, [...DASHBOARD_EXCLUDED_STATUSES])
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

  // ============================================================================
  // 대시보드 개선안 v1 — 신규 엔드포인트 서비스 메소드 (§3.9, §4.3, §A.4, §A.7)
  // ============================================================================

  /**
   * §A.7 — 반출 현황 조회 (scope 통합 응답).
   * 권한 가드는 컨트롤러에서 수행 — 서비스는 site/teamId/userId 파라미터에 따라
   * 순수 데이터 조회만 수행한다.
   */
  async getCheckoutsByScope(params: {
    scope: DashboardScope;
    userId: string;
    teamId?: string;
    site?: string;
  }): Promise<import('./dto/dashboard-response.dto').DashboardCheckoutsScopeDto> {
    const { scope, userId, teamId, site } = params;
    // 캐시 키: scope + (me는 userId / team은 teamId / lab은 site / all은 'all').
    // dashboard:* 패턴이 invalidateAllDashboard()로 일괄 무효화되므로 안전.
    const cacheKey = `${CACHE_KEY_PREFIXES.DASHBOARD}checkoutsScope:${scope}:${
      scope === 'me'
        ? userId
        : scope === 'team'
          ? (teamId ?? 'team')
          : scope === 'lab'
            ? (site ?? 'lab')
            : 'all'
    }`;
    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        const today = new Date();
        const futureDate = new Date(today);
        futureDate.setDate(today.getDate() + CALIBRATION_THRESHOLDS.WARNING_DAYS);

        const baseConditions = [
          eq(schema.checkouts.status, CheckoutStatusEnum.enum.checked_out),
          gte(schema.checkouts.expectedReturnDate, today),
          lte(schema.checkouts.expectedReturnDate, futureDate),
        ];
        if (scope === 'me') baseConditions.push(eq(schema.checkouts.requesterId, userId));
        if (teamId) baseConditions.push(eq(schema.equipment.teamId, teamId));
        if (site) baseConditions.push(eq(schema.equipment.site, site));

        const upcomingRows = await this.db
          .select({
            id: schema.checkouts.id,
            checkoutItemId: schema.checkoutItems.id,
            equipmentName: schema.equipment.name,
            managementNumber: schema.equipment.managementNumber,
            expectedReturnDate: schema.checkouts.expectedReturnDate,
          })
          .from(schema.checkouts)
          .innerJoin(schema.checkoutItems, eq(schema.checkouts.id, schema.checkoutItems.checkoutId))
          .leftJoin(schema.equipment, eq(schema.checkoutItems.equipmentId, schema.equipment.id))
          .where(and(...baseConditions))
          .orderBy(schema.checkouts.expectedReturnDate)
          .limit(DASHBOARD_ITEM_LIMIT);

        // 기한 초과: 동일 scope 필터 + expectedReturnDate < today.
        const overdueConditions = [
          eq(schema.checkouts.status, CheckoutStatusEnum.enum.checked_out),
          lte(schema.checkouts.expectedReturnDate, today),
        ];
        if (scope === 'me') overdueConditions.push(eq(schema.checkouts.requesterId, userId));
        if (teamId) overdueConditions.push(eq(schema.equipment.teamId, teamId));
        if (site) overdueConditions.push(eq(schema.equipment.site, site));

        const [overdueRow] = await this.db
          .select({ count: count() })
          .from(schema.checkouts)
          .innerJoin(schema.checkoutItems, eq(schema.checkouts.id, schema.checkoutItems.checkoutId))
          .leftJoin(schema.equipment, eq(schema.checkoutItems.equipmentId, schema.equipment.id))
          .where(and(...overdueConditions));

        // scope='me' 한정: 본인 신청 중 pending 상태(승인 대기) 카운트.
        let pendingRequests: number | undefined;
        if (scope === 'me') {
          const [pendingRow] = await this.db
            .select({ count: count() })
            .from(schema.checkouts)
            .where(
              and(
                eq(schema.checkouts.requesterId, userId),
                eq(schema.checkouts.status, CheckoutStatusEnum.enum.pending)
              )
            );
          pendingRequests = pendingRow?.count ?? 0;
        }

        return {
          pendingReturns: upcomingRows.map((r) => {
            const expectedDate = r.expectedReturnDate ? new Date(r.expectedReturnDate) : today;
            const daysUntilDue = Math.floor(
              (expectedDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
            );
            return {
              id: r.id,
              checkoutItemId: r.checkoutItemId,
              equipmentName: r.equipmentName ?? '',
              managementNumber: r.managementNumber ?? undefined,
              expectedReturnDate: r.expectedReturnDate ? r.expectedReturnDate.toISOString() : '',
              daysUntilDue,
            };
          }),
          overdueCount: overdueRow?.count ?? 0,
          pendingRequests,
        };
      },
      CACHE_TTL.SHORT
    );
  }

  /**
   * §3.9 — 시스템관리자 시스템 상태 조회.
   *
   * 데이터 소스 SSOT 는 `health-providers/` 의 3 strategy:
   *  - StorageHealthProvider       — host-disk / configured-capacity / pg-database 우선순위
   *  - AsyncWorkBacklogProvider    — prom-client gauge 합산 (BullMQ 도입 시 strategy 교체)
   *  - SystemErrorEventProvider    — system_error_events 테이블 (audit-rejection-proxy 는 fallback)
   *
   * 본 메서드는 인라인으로 측정 가능한 메트릭 (dbResponseMs / activeUsers / maxUsers) 만 직접 쿼리하고
   * 나머지는 provider 에 위임 — orchestrator 패턴.
   */
  async getSystemHealth(): Promise<import('./dto/dashboard-response.dto').SystemHealthMetricsDto> {
    const cacheKey = `${CACHE_KEY_PREFIXES.DASHBOARD}systemHealth`;
    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        const now = new Date();
        const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

        // DB 응답시간 측정.
        const dbStart = Date.now();
        await this.db.execute(sql`SELECT 1`);
        const dbResponseMs = Date.now() - dbStart;

        // 활성 사용자: 최근 5분 audit 액티비티 unique userId.
        const activeRows = await this.db
          .select({ userId: schema.auditLogs.userId })
          .from(schema.auditLogs)
          .where(gte(schema.auditLogs.createdAt, fiveMinutesAgo))
          .groupBy(schema.auditLogs.userId);
        const activeUsers = activeRows.length;

        // 최대 사용자: 시스템 등록된 활성 사용자 수.
        const [maxRow] = await this.db
          .select({ count: count() })
          .from(schema.users)
          .where(eq(schema.users.isActive, true));
        const maxUsers = maxRow?.count ?? 0;

        // Provider 위임 — 3 메트릭 병렬 조회.
        const [storageSnapshot, backlogSnapshot, errorSnapshot] = await Promise.all([
          this.storageHealthProvider.read(),
          this.asyncWorkBacklogProvider.read(),
          this.systemErrorEventProvider.count24h(),
        ]);

        // storagePct null 케이스 (storage backend 가 pg-database 폴백 모드) 는 overallStatus 판정에서 storage 조건 skip.
        // DTO 응답은 number 필수이므로 0 으로 폴백 — frontend 는 storageBackend 식별자로 분기 가능.
        const storagePctForDto = storageSnapshot.storagePct ?? 0;
        const storageHealthy =
          storageSnapshot.storagePct === null ||
          storageSnapshot.storagePct < SYSTEM_HEALTH_OVERALL_THRESHOLDS.degraded.storagePct;

        // SSOT: SYSTEM_HEALTH_OVERALL_THRESHOLDS — 프론트와 동일 임계값으로 판정 일관성 보장.
        const overallStatus: 'healthy' | 'degraded' | 'down' =
          dbResponseMs >= SYSTEM_HEALTH_OVERALL_THRESHOLDS.down.dbMs
            ? 'down'
            : dbResponseMs >= SYSTEM_HEALTH_OVERALL_THRESHOLDS.degraded.dbMs || !storageHealthy
              ? 'degraded'
              : 'healthy';

        return {
          overallStatus,
          activeUsers,
          maxUsers,
          dbResponseMs,
          storagePct: storagePctForDto,
          queueSize: backlogSnapshot.queueSize,
          errorCount24h: errorSnapshot.errorCount24h,
          measuredAt: now.toISOString(),
          dbSizeBytes: storageSnapshot.dbSizeBytes,
          storageBackend: storageSnapshot.backend,
          queueBackend: backlogSnapshot.backend,
          errorSource: errorSnapshot.source,
        };
      },
      // MEDIUM(5min) — frontend MONITORING refetchInterval과 일치하여 매 폴링이 fresh DB hit가 되지 않도록.
      CACHE_TTL.MEDIUM
    );
  }

  /**
   * §4.3 — 품질책임자 검토 대기 hero.
   *
   * `plan_review` 단계의 calibration plans 카운트 + 평균/최장 대기 일수.
   * 처리율(processingRate) = thisWeekProcessed / thisWeekTotal * 100.
   */
  async getQualityReviewPending(): Promise<
    import('./dto/dashboard-response.dto').QualityReviewPendingDto
  > {
    const cacheKey = `${CACHE_KEY_PREFIXES.DASHBOARD}qualityReviewPending`;
    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        const now = new Date();
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - DASHBOARD_TIME_WINDOWS.recentActivityDays);

        // 검토 대기 = calibrationPlans.status='pending_review' (품질책임자 검토 단계).
        const pendingRows = await this.db
          .select({
            id: schema.calibrationPlans.id,
            createdAt: schema.calibrationPlans.createdAt,
          })
          .from(schema.calibrationPlans)
          .where(eq(schema.calibrationPlans.status, CalibrationPlanStatusValues.PENDING_REVIEW));

        const pendingCount = pendingRows.length;
        const waitDays = pendingRows.map((r) => {
          const created = r.createdAt ? new Date(r.createdAt) : now;
          return Math.max(
            0,
            Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24))
          );
        });
        const avgWaitDays =
          waitDays.length === 0
            ? 0
            : Math.round((waitDays.reduce((s, d) => s + d, 0) / waitDays.length) * 10) / 10;
        const maxWaitDays = waitDays.length === 0 ? 0 : Math.max(...waitDays);

        // 이번 주 처리: 검토/승인을 거쳐 approved/rejected/pending_approval 단계로 전이된 plans.
        const [processedRow] = await this.db
          .select({ count: count() })
          .from(schema.calibrationPlans)
          .where(
            and(
              gte(schema.calibrationPlans.updatedAt, weekStart),
              notInArray(schema.calibrationPlans.status, [
                CalibrationPlanStatusValues.DRAFT,
                CalibrationPlanStatusValues.PENDING_REVIEW,
              ])
            )
          );
        const thisWeekProcessed = processedRow?.count ?? 0;

        // 이번 주 도착 + carryover.
        const [arrivedRow] = await this.db
          .select({ count: count() })
          .from(schema.calibrationPlans)
          .where(gte(schema.calibrationPlans.createdAt, weekStart));
        const thisWeekTotal = (arrivedRow?.count ?? 0) + pendingCount;

        const processingRate =
          thisWeekTotal === 0 ? 100 : Math.round((thisWeekProcessed / thisWeekTotal) * 100);

        return {
          pendingCount,
          avgWaitDays,
          maxWaitDays,
          thisWeekProcessed,
          thisWeekTotal,
          processingRate,
        };
      },
      CACHE_TTL.SHORT
    );
  }

  /**
   * §A.4 — 시험실무자 빠른 요약.
   *
   * 시험실무자 본인 시점의 3가지 카운트:
   *  1. 본인 반출 신청 중 pending 상태 카운트.
   *  2. 본인 팀(teamId) 장비의 30일 이내 교정 임박 — 시험실무자는 본인 팀 장비를 다룸.
   *  3. 본인 팀 장비 중 non_conforming 상태 카운트.
   *
   * equipment에는 user-level owner FK가 없으므로 teamId 기반 scope을 적용합니다.
   * teamId가 없는 사용자(예외 케이스)에게는 0 fallback.
   */
  async getMyQuickSummary(
    userId: string,
    teamId?: string
  ): Promise<import('./dto/dashboard-response.dto').MyQuickSummaryDto> {
    const cacheKey = `${CACHE_KEY_PREFIXES.DASHBOARD}myQuickSummary:${userId}:${teamId ?? 'none'}`;
    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        const [pendingRow] = await this.db
          .select({ count: count() })
          .from(schema.checkouts)
          .where(
            and(
              eq(schema.checkouts.requesterId, userId),
              eq(schema.checkouts.status, CheckoutStatusEnum.enum.pending)
            )
          );
        const pendingCheckoutRequests = pendingRow?.count ?? 0;

        // teamId 미지정 사용자는 임박 교정 + 부적합 카운트를 0으로 fallback.
        if (!teamId) {
          return {
            pendingCheckoutRequests,
            upcomingCalibrations: undefined,
            nonconformanceItems: 0,
          };
        }

        const today = new Date();
        const upcomingWindow = new Date(today);
        upcomingWindow.setDate(today.getDate() + DASHBOARD_TIME_WINDOWS.upcomingCalibrationDays);

        const upcomingRows = await this.db
          .select({
            id: schema.equipment.id,
            nextCalibrationDate: schema.equipment.nextCalibrationDate,
          })
          .from(schema.equipment)
          .where(
            and(
              eq(schema.equipment.teamId, teamId),
              gte(schema.equipment.nextCalibrationDate, today),
              lte(schema.equipment.nextCalibrationDate, upcomingWindow)
            )
          )
          .orderBy(schema.equipment.nextCalibrationDate);

        const upcomingCalibrations =
          upcomingRows.length === 0
            ? undefined
            : {
                count: upcomingRows.length,
                nearestDays: Math.max(
                  0,
                  Math.floor(
                    ((upcomingRows[0].nextCalibrationDate?.getTime() ?? today.getTime()) -
                      today.getTime()) /
                      (1000 * 60 * 60 * 24)
                  )
                ),
              };

        const [ncRow] = await this.db
          .select({ count: count() })
          .from(schema.equipment)
          .where(
            and(
              eq(schema.equipment.teamId, teamId),
              eq(schema.equipment.status, ESVal.NON_CONFORMING)
            )
          );
        const nonconformanceItems = ncRow?.count ?? 0;

        return {
          pendingCheckoutRequests,
          upcomingCalibrations,
          nonconformanceItems,
        };
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
    days: number = CALIBRATION_THRESHOLDS.WARNING_DAYS,
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

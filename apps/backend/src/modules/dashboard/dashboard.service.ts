import { Injectable, Inject } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq, and, count, gte, lte } from 'drizzle-orm';
import * as schema from '@equipment-management/db/schema';
import { UserRole } from '@equipment-management/schemas';
import { SimpleCacheService } from '../../common/cache/simple-cache.service';
import {
  DashboardSummaryDto,
  EquipmentByTeamDto,
  OverdueCalibrationDto,
  UpcomingCalibrationDto,
  OverdueCheckoutDto,
  RecentActivityDto,
  PendingApprovalCountsDto,
  EquipmentStatusStatsDto,
} from './dto/dashboard-response.dto';

/** 대시보드 캐시 TTL (30s — 프론트엔드 CACHE_TIMES.SHORT와 동기화) */
const DASHBOARD_CACHE_TTL = 30_000;

/**
 * 대시보드 서비스
 *
 * 역할별 맞춤형 대시보드 데이터를 제공합니다.
 * - test_engineer: 본인 관련 데이터만
 * - technical_manager: 팀 내 데이터
 * - lab_manager: 시험소 데이터
 * - SYSTEM_ADMIN: 전체 데이터
 *
 * site 파라미터가 주어지면 해당 사이트 소속 장비/요청만 반환합니다.
 * site가 undefined(system_admin 등)이면 전체 데이터를 반환합니다.
 *
 * 모든 조회 메서드는 SimpleCacheService로 캐싱됩니다 (30s TTL).
 * 캐시 무효화: CacheInvalidationHelper.invalidateAllDashboard()
 */
@Injectable()
export class DashboardService {
  constructor(
    @Inject('DRIZZLE_INSTANCE') private readonly db: NodePgDatabase<typeof schema>,
    private readonly cacheService: SimpleCacheService
  ) {}

  /**
   * 대시보드 요약 정보 조회
   */
  async getSummary(
    _userId: string,
    _userRole: UserRole,
    teamId?: string,
    site?: string
  ): Promise<DashboardSummaryDto> {
    const cacheKey = `dashboard:summary:${site || 'all'}:${teamId || 'all'}`;
    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        // 전체 장비 수
        const [totalResult] = await this.db
          .select({ count: count() })
          .from(schema.equipment)
          .where(
            and(
              teamId ? eq(schema.equipment.teamId, teamId) : undefined,
              site ? eq(schema.equipment.site, site) : undefined
            )
          );

        const totalEquipment = totalResult?.count || 0;

        // 사용 가능 장비 수
        const [availableResult] = await this.db
          .select({ count: count() })
          .from(schema.equipment)
          .where(
            and(
              eq(schema.equipment.status, 'available'),
              teamId ? eq(schema.equipment.teamId, teamId) : undefined,
              site ? eq(schema.equipment.site, site) : undefined
            )
          );

        const availableEquipment = availableResult?.count || 0;

        // 활성 반출 수 (checkouts 테이블 - 대여 포함)
        const [checkoutResult] = await this.db
          .select({ count: count() })
          .from(schema.checkouts)
          .where(eq(schema.checkouts.status, 'checked_out'));

        const activeCheckouts = checkoutResult?.count || 0;

        // 교정 예정 장비 수 (30일 이내)
        const today = new Date();
        const thirtyDaysLater = new Date(today);
        thirtyDaysLater.setDate(today.getDate() + 30);

        const [calibrationResult] = await this.db
          .select({ count: count() })
          .from(schema.equipment)
          .where(
            and(
              eq(schema.equipment.calibrationRequired, 'required'),
              gte(schema.equipment.nextCalibrationDate, today),
              lte(schema.equipment.nextCalibrationDate, thirtyDaysLater),
              teamId ? eq(schema.equipment.teamId, teamId) : undefined,
              site ? eq(schema.equipment.site, site) : undefined
            )
          );

        const upcomingCalibrations = calibrationResult?.count || 0;

        return {
          totalEquipment,
          availableEquipment,
          activeCheckouts,
          upcomingCalibrations,
        };
      },
      DASHBOARD_CACHE_TTL
    );
  }

  /**
   * 팀별 장비 현황 조회
   */
  async getEquipmentByTeam(
    _userId: string,
    _userRole: UserRole,
    teamId?: string,
    site?: string
  ): Promise<EquipmentByTeamDto[]> {
    const cacheKey = `dashboard:equipmentByTeam:${site || 'all'}:${teamId || 'all'}`;
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
      DASHBOARD_CACHE_TTL
    );
  }

  /**
   * 교정 지연 장비 조회
   */
  async getOverdueCalibrations(
    _userId: string,
    _userRole: UserRole,
    teamId?: string,
    site?: string
  ): Promise<OverdueCalibrationDto[]> {
    const cacheKey = `dashboard:overdueCalibrations:${site || 'all'}:${teamId || 'all'}`;
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
              eq(schema.equipment.calibrationRequired, 'required'),
              lte(schema.equipment.nextCalibrationDate, today),
              teamId ? eq(schema.equipment.teamId, teamId) : undefined,
              site ? eq(schema.equipment.site, site) : undefined
            )
          )
          .orderBy(schema.equipment.nextCalibrationDate)
          .limit(50);

        return results.map((r) => {
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
        });
      },
      DASHBOARD_CACHE_TTL
    );
  }

  /**
   * 교정 예정 장비 조회 (다음 N일 이내)
   */
  async getUpcomingCalibrations(
    _userId: string,
    _userRole: UserRole,
    days: number,
    teamId?: string,
    site?: string
  ): Promise<UpcomingCalibrationDto[]> {
    const cacheKey = `dashboard:upcomingCalibrations:${days}:${site || 'all'}:${teamId || 'all'}`;
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
              eq(schema.equipment.calibrationRequired, 'required'),
              gte(schema.equipment.nextCalibrationDate, today),
              lte(schema.equipment.nextCalibrationDate, futureDate),
              teamId ? eq(schema.equipment.teamId, teamId) : undefined,
              site ? eq(schema.equipment.site, site) : undefined
            )
          )
          .orderBy(schema.equipment.nextCalibrationDate)
          .limit(50);

        return results.map((r) => {
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
        });
      },
      DASHBOARD_CACHE_TTL
    );
  }

  /**
   * 반출 지연 조회 (checkouts + checkout_items 테이블 사용 - 대여/교정/수리 포함)
   */
  async getOverdueCheckouts(
    _userId: string,
    _userRole: UserRole,
    teamId?: string,
    site?: string
  ): Promise<OverdueCheckoutDto[]> {
    const cacheKey = `dashboard:overdueCheckouts:${site || 'all'}:${teamId || 'all'}`;
    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        const today = new Date();

        // checkout_items를 통해 장비 정보 조회
        const results = await this.db
          .select({
            id: schema.checkouts.id,
            equipmentId: schema.checkoutItems.equipmentId,
            equipmentName: schema.equipment.name,
            equipmentManagementNumber: schema.equipment.managementNumber,
            userId: schema.checkouts.requesterId,
            userName: schema.users.name,
            userEmail: schema.users.email,
            expectedReturnDate: schema.checkouts.expectedReturnDate,
            checkoutDate: schema.checkouts.checkoutDate,
            status: schema.checkouts.status,
            purpose: schema.checkouts.purpose,
          })
          .from(schema.checkouts)
          .innerJoin(schema.checkoutItems, eq(schema.checkouts.id, schema.checkoutItems.checkoutId))
          .leftJoin(schema.equipment, eq(schema.checkoutItems.equipmentId, schema.equipment.id))
          .leftJoin(schema.users, eq(schema.checkouts.requesterId, schema.users.id))
          .where(
            and(
              eq(schema.checkouts.status, 'checked_out'),
              lte(schema.checkouts.expectedReturnDate, today),
              teamId ? eq(schema.equipment.teamId, teamId) : undefined,
              site ? eq(schema.equipment.site, site) : undefined
            )
          )
          .orderBy(schema.checkouts.expectedReturnDate)
          .limit(50);

        return results.map((r) => {
          const expectedDate = r.expectedReturnDate ? new Date(r.expectedReturnDate) : today;
          const daysOverdue = Math.floor(
            (today.getTime() - expectedDate.getTime()) / (1000 * 60 * 60 * 24)
          );

          return {
            id: r.id,
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
          };
        });
      },
      DASHBOARD_CACHE_TTL
    );
  }

  /**
   * 최근 활동 내역 조회 (기본 구현 - 빈 배열 반환)
   */
  async getRecentActivities(
    _userId: string,
    _userRole: UserRole,
    _limit: number,
    _teamId?: string,
    _site?: string
  ): Promise<RecentActivityDto[]> {
    // 감사 로그 기능 구현 전까지 빈 배열 반환 — DB 쿼리 없으므로 캐싱 불필요
    return [];
  }

  /**
   * 승인 대기 카운트 조회
   */
  async getPendingApprovalCounts(
    _userId: string,
    userRole: UserRole,
    teamId?: string,
    site?: string
  ): Promise<PendingApprovalCountsDto> {
    const cacheKey = `dashboard:pendingApprovalCounts:${userRole}:${site || 'all'}:${teamId || 'all'}`;
    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        // 장비 승인 대기 (equipmentRequests 테이블 조회 + 팀/사이트 필터링)
        const isLabManager = userRole === 'lab_manager';
        let equipmentCountResult: { count: number }[];

        if (teamId && !isLabManager) {
          // technical_manager: 같은 팀 요청자의 승인 대기만 조회
          equipmentCountResult = await this.db
            .select({ count: count() })
            .from(schema.equipmentRequests)
            .innerJoin(schema.users, eq(schema.equipmentRequests.requestedBy, schema.users.id))
            .where(
              and(
                eq(schema.equipmentRequests.approvalStatus, 'pending_approval'),
                eq(schema.users.teamId, teamId)
              )
            );
        } else if (site) {
          // 사이트 필터: 같은 사이트 요청자의 승인 대기만 조회
          equipmentCountResult = await this.db
            .select({ count: count() })
            .from(schema.equipmentRequests)
            .innerJoin(schema.users, eq(schema.equipmentRequests.requestedBy, schema.users.id))
            .where(
              and(
                eq(schema.equipmentRequests.approvalStatus, 'pending_approval'),
                eq(schema.users.site, site)
              )
            );
        } else {
          // system_admin 또는 teamId/site 없음: 전체 조회
          equipmentCountResult = await this.db
            .select({ count: count() })
            .from(schema.equipmentRequests)
            .where(eq(schema.equipmentRequests.approvalStatus, 'pending_approval'));
        }

        const [equipmentCount] = equipmentCountResult;

        // 교정 승인 대기 (calibrations 테이블 조회 - 추후 approvalStatus 컬럼 추가 필요)
        const calibration = 0;

        // 반출 승인 대기 (checkouts - 대여 포함, 사이트 필터링)
        let checkoutCountResult: { count: number }[];

        if (site) {
          // 같은 사이트 요청자의 반출 승인 대기만 조회
          checkoutCountResult = await this.db
            .select({ count: count() })
            .from(schema.checkouts)
            .innerJoin(schema.users, eq(schema.checkouts.requesterId, schema.users.id))
            .where(and(eq(schema.checkouts.status, 'pending'), eq(schema.users.site, site)));
        } else {
          checkoutCountResult = await this.db
            .select({ count: count() })
            .from(schema.checkouts)
            .where(eq(schema.checkouts.status, 'pending'));
        }

        const [checkoutCount] = checkoutCountResult;

        // 보정계수, 소프트웨어 승인 대기 (스키마 미구현)
        const calibrationFactor = 0;
        const software = 0;

        const equipment = equipmentCount?.count || 0;
        const checkout = checkoutCount?.count || 0;

        return {
          equipment,
          calibration,
          checkout,
          calibrationFactor,
          software,
          total: equipment + calibration + checkout + calibrationFactor + software,
        };
      },
      DASHBOARD_CACHE_TTL
    );
  }

  /**
   * 장비 상태별 통계 조회
   */
  async getEquipmentStatusStats(
    _userId: string,
    _userRole: UserRole,
    teamId?: string,
    site?: string
  ): Promise<EquipmentStatusStatsDto> {
    const cacheKey = `dashboard:equipmentStatusStats:${site || 'all'}:${teamId || 'all'}`;
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
      DASHBOARD_CACHE_TTL
    );
  }
}

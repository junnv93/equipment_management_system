import { Injectable, Inject } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq, and, count, gte, lte, sql } from 'drizzle-orm';
import * as schema from '../../database/drizzle/schema';
import { UserRole } from '../auth/rbac/roles.enum';
import {
  DashboardSummaryDto,
  EquipmentByTeamDto,
  OverdueCalibrationDto,
  UpcomingCalibrationDto,
  OverdueRentalDto,
  RecentActivityDto,
  PendingApprovalCountsDto,
  EquipmentStatusStatsDto,
} from './dto/dashboard-response.dto';

/**
 * 대시보드 서비스
 *
 * 역할별 맞춤형 대시보드 데이터를 제공합니다.
 * - test_engineer: 본인 관련 데이터만
 * - technical_manager: 팀 내 데이터
 * - lab_manager: 시험소 데이터
 * - SYSTEM_ADMIN: 전체 데이터
 */
@Injectable()
export class DashboardService {
  constructor(
    @Inject('DRIZZLE_INSTANCE') private readonly db: NodePgDatabase<typeof schema>
  ) {}

  /**
   * 대시보드 요약 정보 조회
   */
  async getSummary(userId: string, userRole: UserRole, teamId?: string, site?: string): Promise<DashboardSummaryDto> {
    // 전체 장비 수
    const [totalResult] = await this.db
      .select({ count: count() })
      .from(schema.equipment);

    const totalEquipment = totalResult?.count || 0;

    // 사용 가능 장비 수
    const [availableResult] = await this.db
      .select({ count: count() })
      .from(schema.equipment)
      .where(eq(schema.equipment.status, 'available'));

    const availableEquipment = availableResult?.count || 0;

    // 활성 대여 수 (loans 테이블)
    const [loanResult] = await this.db
      .select({ count: count() })
      .from(schema.loans)
      .where(eq(schema.loans.status, 'active'));

    const activeRentals = loanResult?.count || 0;

    // 활성 반출 수 (checkouts 테이블)
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
          lte(schema.equipment.nextCalibrationDate, thirtyDaysLater)
        )
      );

    const upcomingCalibrations = calibrationResult?.count || 0;

    return {
      totalEquipment,
      availableEquipment,
      activeRentals,
      activeCheckouts,
      upcomingCalibrations,
    };
  }

  /**
   * 팀별 장비 현황 조회
   */
  async getEquipmentByTeam(userId: string, userRole: UserRole, teamId?: string, site?: string): Promise<EquipmentByTeamDto[]> {
    const results = await this.db
      .select({
        teamId: schema.equipment.teamId,
        teamName: schema.teams.name,
        count: count(),
      })
      .from(schema.equipment)
      .leftJoin(schema.teams, eq(schema.equipment.teamId, schema.teams.id))
      .groupBy(schema.equipment.teamId, schema.teams.name);

    return results.map((r) => ({
      id: r.teamId || 'unknown',
      name: r.teamName || '미지정',
      count: r.count,
    }));
  }

  /**
   * 교정 지연 장비 조회
   */
  async getOverdueCalibrations(userId: string, userRole: UserRole, teamId?: string, site?: string): Promise<OverdueCalibrationDto[]> {
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
          lte(schema.equipment.nextCalibrationDate, today)
        )
      )
      .orderBy(schema.equipment.nextCalibrationDate)
      .limit(50);

    return results.map((r) => {
      const dueDate = r.nextCalibrationDate ? new Date(r.nextCalibrationDate) : today;
      const daysOverdue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));

      return {
        id: r.id,
        name: r.name,
        managementNumber: r.managementNumber,
        dueDate: r.nextCalibrationDate ? r.nextCalibrationDate.toISOString() : '',
        daysOverdue,
        teamName: r.teamName || undefined,
      };
    });
  }

  /**
   * 교정 예정 장비 조회 (다음 N일 이내)
   */
  async getUpcomingCalibrations(
    userId: string,
    userRole: UserRole,
    days: number,
    teamId?: string,
    site?: string
  ): Promise<UpcomingCalibrationDto[]> {
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
          lte(schema.equipment.nextCalibrationDate, futureDate)
        )
      )
      .orderBy(schema.equipment.nextCalibrationDate)
      .limit(50);

    return results.map((r) => {
      const dueDate = r.nextCalibrationDate ? new Date(r.nextCalibrationDate) : today;
      const daysUntilDue = Math.floor((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      return {
        id: r.id,
        equipmentId: r.id,
        equipmentName: r.name,
        managementNumber: r.managementNumber,
        dueDate: r.nextCalibrationDate ? r.nextCalibrationDate.toISOString() : '',
        daysUntilDue,
      };
    });
  }

  /**
   * 대여 지연 조회 (loans 테이블 사용)
   */
  async getOverdueRentals(userId: string, userRole: UserRole, teamId?: string, site?: string): Promise<OverdueRentalDto[]> {
    const today = new Date();

    const results = await this.db
      .select({
        id: schema.loans.id,
        equipmentId: schema.loans.equipmentId,
        equipmentName: schema.equipment.name,
        equipmentManagementNumber: schema.equipment.managementNumber,
        userId: schema.loans.borrowerId,
        userName: schema.users.name,
        userEmail: schema.users.email,
        expectedReturnDate: schema.loans.expectedReturnDate,
        loanDate: schema.loans.loanDate,
        status: schema.loans.status,
      })
      .from(schema.loans)
      .leftJoin(schema.equipment, eq(schema.loans.equipmentId, schema.equipment.id))
      .leftJoin(schema.users, eq(schema.loans.borrowerId, schema.users.id))
      .where(
        and(
          eq(schema.loans.status, 'active'),
          lte(schema.loans.expectedReturnDate, today)
        )
      )
      .orderBy(schema.loans.expectedReturnDate)
      .limit(50);

    return results.map((r) => {
      const expectedDate = r.expectedReturnDate ? new Date(r.expectedReturnDate) : today;
      const daysOverdue = Math.floor((today.getTime() - expectedDate.getTime()) / (1000 * 60 * 60 * 24));

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
        startDate: r.loanDate ? r.loanDate.toISOString() : '',
        status: r.status || '',
        daysOverdue,
      };
    });
  }

  /**
   * 최근 활동 내역 조회 (기본 구현 - 빈 배열 반환)
   */
  async getRecentActivities(
    userId: string,
    userRole: UserRole,
    limit: number,
    teamId?: string,
    site?: string
  ): Promise<RecentActivityDto[]> {
    // 감사 로그 기능 구현 전까지 빈 배열 반환
    return [];
  }

  /**
   * 승인 대기 카운트 조회
   */
  async getPendingApprovalCounts(userId: string, userRole: UserRole, teamId?: string, site?: string): Promise<PendingApprovalCountsDto> {
    // 장비 승인 대기
    const [equipmentCount] = await this.db
      .select({ count: count() })
      .from(schema.equipment)
      .where(eq(schema.equipment.approvalStatus, 'pending_approval'));

    // 교정 승인 대기 (calibrations 테이블 조회 - 추후 approvalStatus 컬럼 추가 필요)
    const calibration = 0;

    // 대여 승인 대기 (loans)
    const [loanCount] = await this.db
      .select({ count: count() })
      .from(schema.loans)
      .where(eq(schema.loans.status, 'pending'));

    // 반출 승인 대기 (checkouts)
    const [checkoutCount] = await this.db
      .select({ count: count() })
      .from(schema.checkouts)
      .where(eq(schema.checkouts.status, 'pending'));

    // 보정계수, 소프트웨어 승인 대기 (스키마 미구현)
    const calibrationFactor = 0;
    const software = 0;

    const equipment = equipmentCount?.count || 0;
    const rental = loanCount?.count || 0;
    const checkout = checkoutCount?.count || 0;

    return {
      equipment,
      calibration,
      rental,
      checkout,
      calibrationFactor,
      software,
      total: equipment + calibration + rental + checkout + calibrationFactor + software,
    };
  }

  /**
   * 장비 상태별 통계 조회
   */
  async getEquipmentStatusStats(userId: string, userRole: UserRole, teamId?: string, site?: string): Promise<EquipmentStatusStatsDto> {
    const results = await this.db
      .select({
        status: schema.equipment.status,
        count: count(),
      })
      .from(schema.equipment)
      .groupBy(schema.equipment.status);

    const stats: EquipmentStatusStatsDto = {};
    results.forEach((r) => {
      stats[r.status || 'unknown'] = r.count;
    });

    return stats;
  }
}

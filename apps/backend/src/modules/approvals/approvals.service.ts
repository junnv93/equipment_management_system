import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import type { AppDatabase } from '@equipment-management/db';
import {
  eq,
  and,
  or,
  ne,
  gte,
  lt,
  inArray,
  notInArray,
  isNull,
  isNotNull,
  count,
  sql,
  type SQL,
} from 'drizzle-orm';
import * as schema from '@equipment-management/db/schema';
import {
  CalibrationApprovalStatusEnum,
  CalibrationPlanStatusValues,
  SoftwareApprovalStatusValues,
  CheckoutStatusValues,
  CheckoutPurposeValues,
  EquipmentImportStatusValues,
  EquipmentImportSourceEnum,
  NonConformanceStatusValues,
  NonConformanceTypeValues,
  DisposalReviewStatusValues,
  ApprovalStatusEnum,
  type UserRole,
} from '@equipment-management/schemas';
import { isLabManager as checkIsLabManager } from '@equipment-management/shared-constants';

/**
 * 역할별 승인 카테고리 매핑
 *
 * SSOT: 프론트엔드 ROLE_TABS (approvals-api.ts)와 동기화
 *
 * 역할에 해당하지 않는 카테고리는 DB 쿼리 생략 (0 반환)
 */
const ROLE_CATEGORIES: Record<UserRole, ReadonlySet<string>> = {
  test_engineer: new Set(),
  technical_manager: new Set([
    'outgoing',
    'incoming',
    'equipment',
    'calibration',
    'inspection',
    'nonconformity',
    'disposal_review',
    'software',
  ]),
  quality_manager: new Set(['plan_review']),
  lab_manager: new Set(['disposal_final', 'plan_final', 'incoming']),
  system_admin: new Set(),
};

/**
 * 카테고리별 승인 대기 개수
 *
 * Direction-based categories (consolidated):
 * - outgoing: All equipment leaving facility (checkouts + vendor returns)
 * - incoming: All equipment entering facility (returns + rental imports + shared imports)
 *
 * Specialized categories:
 * - equipment, calibration, inspection, nonconformity, disposal_review, disposal_final, etc.
 */
export interface ApprovalKpiResponse {
  /** 오늘 현재 사용자가 처리(승인+반려)한 건수 */
  todayProcessed: number;
}

export interface PendingCountsByCategory {
  // Direction-based (consolidated)
  outgoing: number;
  incoming: number;

  // Specialized approvals
  equipment: number;
  calibration: number;
  inspection: number;
  nonconformity: number;
  disposal_review: number;
  disposal_final: number;
  plan_review: number;
  plan_final: number;
  software: number;
}

/**
 * 승인 관리 통합 서비스
 *
 * 모든 승인 카테고리의 대기 개수를 한 번에 조회하여
 * 프론트엔드가 13번의 별도 API 호출을 할 필요 없이
 * 1번의 호출로 모든 배지 카운트를 가져올 수 있도록 함
 */
@Injectable()
export class ApprovalsService {
  constructor(
    @Inject('DRIZZLE_INSTANCE')
    private readonly db: AppDatabase
  ) {}

  /**
   * 역할별 승인 대기 개수 조회 (Approvals 페이지용)
   *
   * getApprovalCountsByScope() 결과에 ROLE_CATEGORIES gating을 적용합니다.
   * 역할에 해당하지 않는 카테고리는 DB 쿼리 자체를 생략합니다.
   */
  async getPendingCountsByRole(
    userId: string,
    userRole: UserRole
  ): Promise<PendingCountsByCategory> {
    // Get user's team and site for filtering
    const user = await this.db.query.users.findFirst({
      where: eq(schema.users.id, userId),
      columns: {
        id: true,
        teamId: true,
        site: true,
      },
    });

    if (!user) {
      throw new NotFoundException({
        code: 'USER_NOT_FOUND',
        message: `User not found (userId: ${userId}). Session may be expired or account deleted.`,
      });
    }

    const isLabManager = checkIsLabManager(userRole);

    // Role gating: 해당 역할이 접근 불가한 카테고리는 쿼리 자체를 생략
    const allowedCategories = ROLE_CATEGORIES[userRole] ?? new Set();
    const rawCounts = await this.getApprovalCountsByScope(
      user.teamId,
      user.site,
      isLabManager,
      allowedCategories
    );

    return rawCounts;
  }

  /**
   * 스코프 기반 승인 대기 개수 — Core Counting (SSOT)
   *
   * DashboardService와 ApprovalsController 양쪽에서 사용하는 단일 소스.
   * allowedCategories가 주어지면 해당 카테고리만 쿼리하고 나머지는 0을 반환합니다.
   * 생략 시 전체 카테고리를 쿼리합니다 (Dashboard용).
   *
   * @param userTeamId - 사용자 팀 ID (team-scoped 필터링)
   * @param userSite - 사용자 사이트 (site-scoped 필터링)
   * @param isLabManager - lab_manager 여부 (cross-site visibility)
   * @param allowedCategories - 쿼리할 카테고리 제한 (없으면 전체)
   */
  async getApprovalCountsByScope(
    userTeamId: string | null,
    userSite: string | null,
    isLabManager: boolean,
    allowedCategories?: ReadonlySet<string>
  ): Promise<PendingCountsByCategory> {
    const shouldQuery = (category: string): boolean =>
      !allowedCategories || allowedCategories.has(category);

    const [
      outgoingCheckouts,
      outgoingVendorReturns,
      incomingReturns,
      incomingRentalImports,
      incomingSharedImports,
      equipmentCount,
      calibrationCount,
      inspectionCount,
      nonconformityCount,
      disposalReviewCount,
      disposalFinalCount,
      planReviewCount,
      planFinalCount,
      softwareCount,
    ] = await Promise.all([
      // === Outgoing (반출) ===
      shouldQuery('outgoing')
        ? this.getCheckoutCount(
            CheckoutStatusValues.PENDING,
            undefined,
            userTeamId,
            isLabManager,
            CheckoutPurposeValues.RETURN_TO_VENDOR
          )
        : Promise.resolve(0),

      shouldQuery('outgoing')
        ? this.getCheckoutCount(
            CheckoutStatusValues.PENDING,
            CheckoutPurposeValues.RETURN_TO_VENDOR,
            userTeamId,
            isLabManager
          )
        : Promise.resolve(0),

      // === Incoming (반입) ===
      shouldQuery('incoming')
        ? this.getCheckoutCount(CheckoutStatusValues.RETURNED, undefined, userTeamId, isLabManager)
        : Promise.resolve(0),

      shouldQuery('incoming')
        ? this.getEquipmentImportCount(
            EquipmentImportStatusValues.PENDING,
            EquipmentImportSourceEnum.enum.rental,
            userSite
          )
        : Promise.resolve(0),

      shouldQuery('incoming')
        ? this.getEquipmentImportCount(
            EquipmentImportStatusValues.PENDING,
            EquipmentImportSourceEnum.enum.internal_shared,
            userSite
          )
        : Promise.resolve(0),

      // === Specialized ===
      shouldQuery('equipment') ? this.getEquipmentRequestCount(userSite) : Promise.resolve(0),
      shouldQuery('calibration') ? this.getCalibrationCount(userSite) : Promise.resolve(0),
      shouldQuery('inspection') ? this.getIntermediateCheckCount() : Promise.resolve(0),
      shouldQuery('nonconformity')
        ? this.getNonConformanceCount(userTeamId, isLabManager)
        : Promise.resolve(0),
      shouldQuery('disposal_review')
        ? this.getDisposalReviewCount('', isLabManager, userTeamId)
        : Promise.resolve(0),
      shouldQuery('disposal_final') ? this.getDisposalFinalCount(userSite) : Promise.resolve(0),
      shouldQuery('plan_review') ? this.getCalibrationPlanReviewCount() : Promise.resolve(0),
      shouldQuery('plan_final') ? this.getCalibrationPlanFinalCount() : Promise.resolve(0),
      shouldQuery('software') ? this.getSoftwareCount() : Promise.resolve(0),
    ]);

    return {
      outgoing: outgoingCheckouts + outgoingVendorReturns,
      incoming: incomingReturns + incomingRentalImports + incomingSharedImports,
      equipment: equipmentCount,
      calibration: calibrationCount,
      inspection: inspectionCount,
      nonconformity: nonconformityCount,
      disposal_review: disposalReviewCount,
      disposal_final: disposalFinalCount,
      plan_review: planReviewCount,
      plan_final: planFinalCount,
      software: softwareCount,
    };
  }

  /**
   * 승인 KPI 조회 (오늘 처리 건수)
   *
   * audit_logs에서 오늘 해당 사용자가 approve/reject 한 건수를 집계
   */
  async getKpi(userId: string): Promise<ApprovalKpiResponse> {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const result = await this.db
      .select({ value: count() })
      .from(schema.auditLogs)
      .where(
        and(
          eq(schema.auditLogs.userId, userId),
          gte(schema.auditLogs.timestamp, todayStart),
          inArray(schema.auditLogs.action, ['approve', 'reject', 'review'])
        )
      );

    return {
      todayProcessed: result[0]?.value ?? 0,
    };
  }

  /**
   * 반출 승인 대기 개수 조회
   *
   * N+1 제거: findMany + client-side filter → COUNT + JOIN WHERE
   */
  private async getCheckoutCount(
    status: string,
    purpose?: string,
    userTeamId?: string | null,
    isLabManager?: boolean,
    excludePurpose?: string
  ): Promise<number> {
    try {
      const conditions: SQL[] = [eq(schema.checkouts.status, status)];
      if (purpose) conditions.push(eq(schema.checkouts.purpose, purpose));
      if (excludePurpose) conditions.push(ne(schema.checkouts.purpose, excludePurpose));

      // Team filter: DB-level JOIN + WHERE (client-side filter 제거)
      if (!isLabManager && userTeamId) {
        const [result] = await this.db
          .select({ count: count() })
          .from(schema.checkouts)
          .innerJoin(schema.users, eq(schema.checkouts.requesterId, schema.users.id))
          .where(and(...conditions, eq(schema.users.teamId, userTeamId)));
        return result?.count ?? 0;
      }

      const [result] = await this.db
        .select({ count: count() })
        .from(schema.checkouts)
        .where(and(...conditions));
      return result?.count ?? 0;
    } catch {
      return 0;
    }
  }

  /**
   * 장비 반입 승인 대기 개수 조회
   *
   * findMany + .length → COUNT (데이터 전송 제거)
   */
  private async getEquipmentImportCount(
    status: string,
    sourceType: string,
    userSite?: string | null
  ): Promise<number> {
    try {
      const conditions: SQL[] = [
        eq(schema.equipmentImports.status, status),
        eq(schema.equipmentImports.sourceType, sourceType),
      ];
      if (userSite) conditions.push(eq(schema.equipmentImports.site, userSite));

      const [result] = await this.db
        .select({ count: count() })
        .from(schema.equipmentImports)
        .where(and(...conditions));
      return result?.count ?? 0;
    } catch {
      return 0;
    }
  }

  /**
   * 장비 등록/수정/삭제 승인 대기 개수
   *
   * select + .length → COUNT
   */
  private async getEquipmentRequestCount(userSite?: string | null): Promise<number> {
    try {
      if (userSite) {
        const [result] = await this.db
          .select({ count: count() })
          .from(schema.equipmentRequests)
          .innerJoin(schema.users, eq(schema.equipmentRequests.requestedBy, schema.users.id))
          .where(
            and(
              eq(schema.equipmentRequests.approvalStatus, ApprovalStatusEnum.enum.pending_approval),
              eq(schema.users.site, userSite)
            )
          );
        return result?.count ?? 0;
      }

      const [result] = await this.db
        .select({ count: count() })
        .from(schema.equipmentRequests)
        .where(
          eq(schema.equipmentRequests.approvalStatus, ApprovalStatusEnum.enum.pending_approval)
        );
      return result?.count ?? 0;
    } catch {
      return 0;
    }
  }

  /**
   * 교정 기록 승인 대기 개수
   *
   * select + .length → COUNT
   */
  private async getCalibrationCount(userSite?: string | null): Promise<number> {
    try {
      if (userSite) {
        const [result] = await this.db
          .select({ count: count() })
          .from(schema.calibrations)
          .innerJoin(schema.equipment, eq(schema.calibrations.equipmentId, schema.equipment.id))
          .where(
            and(
              eq(
                schema.calibrations.approvalStatus,
                CalibrationApprovalStatusEnum.enum.pending_approval
              ),
              eq(schema.equipment.site, userSite)
            )
          );
        return result?.count ?? 0;
      }

      const [result] = await this.db
        .select({ count: count() })
        .from(schema.calibrations)
        .where(
          eq(
            schema.calibrations.approvalStatus,
            CalibrationApprovalStatusEnum.enum.pending_approval
          )
        );
      return result?.count ?? 0;
    } catch {
      return 0;
    }
  }

  /**
   * 중간점검 처리 대기 개수
   *
   * intermediateCheckDate가 오늘 이전인 교정 건수를 반환합니다.
   * 기술책임자가 completeIntermediateCheck()로 완료 처리해야 할 항목입니다.
   */
  private async getIntermediateCheckCount(): Promise<number> {
    try {
      const today = new Date().toISOString().split('T')[0];
      const [result] = await this.db
        .select({ count: count() })
        .from(schema.calibrations)
        .where(
          and(
            isNotNull(schema.calibrations.intermediateCheckDate),
            lt(schema.calibrations.intermediateCheckDate, today)
          )
        );
      return result?.count ?? 0;
    } catch {
      return 0;
    }
  }

  /**
   * 부적합 종료 승인 대기 개수 (corrected 상태)
   *
   * Team filtering:
   * - technical_manager: Only non-conformances from their own team
   * - lab_manager: All non-conformances (cross-site visibility)
   */
  private async getNonConformanceCount(
    userTeamId?: string | null,
    isLabManager?: boolean
  ): Promise<number> {
    try {
      // N+1 제거: findMany + 2중 client-side filter → COUNT + SQL WHERE 푸시다운
      const conditions: SQL[] = [
        eq(schema.nonConformances.status, NonConformanceStatusValues.CORRECTED),
        isNull(schema.nonConformances.deletedAt),
        // 수리 필요 유형은 수리 이력이 있어야 승인 가능
        or(
          notInArray(schema.nonConformances.ncType, [
            NonConformanceTypeValues.DAMAGE,
            NonConformanceTypeValues.MALFUNCTION,
          ]),
          isNotNull(schema.nonConformances.repairHistoryId)
        )!,
      ];

      if (!isLabManager && userTeamId) {
        conditions.push(eq(schema.equipment.teamId, userTeamId));
      }

      const [result] = await this.db
        .select({ count: count() })
        .from(schema.nonConformances)
        .innerJoin(schema.equipment, eq(schema.nonConformances.equipmentId, schema.equipment.id))
        .where(and(...conditions));
      return result?.count ?? 0;
    } catch {
      return 0;
    }
  }

  /**
   * 폐기 검토 대기 개수 (기술책임자)
   */
  private async getDisposalReviewCount(
    _userId: string,
    isLabManager: boolean,
    userTeamId?: string | null
  ): Promise<number> {
    try {
      // N+1 제거: findMany + client-side filter → COUNT + JOIN WHERE
      if (!isLabManager && userTeamId) {
        const [result] = await this.db
          .select({ count: count() })
          .from(schema.disposalRequests)
          .innerJoin(schema.equipment, eq(schema.disposalRequests.equipmentId, schema.equipment.id))
          .where(
            and(
              eq(schema.disposalRequests.reviewStatus, DisposalReviewStatusValues.PENDING),
              eq(schema.equipment.teamId, userTeamId)
            )
          );
        return result?.count ?? 0;
      }

      const [result] = await this.db
        .select({ count: count() })
        .from(schema.disposalRequests)
        .where(eq(schema.disposalRequests.reviewStatus, DisposalReviewStatusValues.PENDING));
      return result?.count ?? 0;
    } catch {
      return 0;
    }
  }

  /**
   * 폐기 최종 승인 대기 개수 (시험소장)
   *
   * Site filtering: JOIN equipment, filter by equipment.site
   */
  private async getDisposalFinalCount(userSite?: string | null): Promise<number> {
    try {
      if (userSite) {
        const [result] = await this.db
          .select({ count: count() })
          .from(schema.disposalRequests)
          .innerJoin(schema.equipment, eq(schema.disposalRequests.equipmentId, schema.equipment.id))
          .where(
            and(
              eq(schema.disposalRequests.reviewStatus, DisposalReviewStatusValues.REVIEWED),
              eq(schema.equipment.site, userSite)
            )
          );
        return result?.count ?? 0;
      }

      const [result] = await this.db
        .select({ count: count() })
        .from(schema.disposalRequests)
        .where(eq(schema.disposalRequests.reviewStatus, DisposalReviewStatusValues.REVIEWED));
      return result?.count ?? 0;
    } catch {
      return 0;
    }
  }

  /**
   * 교정계획서 검토 대기 개수 (품질책임자)
   */
  private async getCalibrationPlanReviewCount(): Promise<number> {
    try {
      const [result] = await this.db
        .select({ count: count() })
        .from(schema.calibrationPlans)
        .where(
          and(
            eq(schema.calibrationPlans.status, CalibrationPlanStatusValues.PENDING_REVIEW),
            eq(schema.calibrationPlans.isLatestVersion, true)
          )
        );
      return result?.count ?? 0;
    } catch {
      return 0;
    }
  }

  /**
   * 교정계획서 최종 승인 대기 개수 (시험소장)
   */
  private async getCalibrationPlanFinalCount(): Promise<number> {
    try {
      const [result] = await this.db
        .select({ count: count() })
        .from(schema.calibrationPlans)
        .where(
          and(
            eq(schema.calibrationPlans.status, CalibrationPlanStatusValues.PENDING_APPROVAL),
            eq(schema.calibrationPlans.isLatestVersion, true)
          )
        );
      return result?.count ?? 0;
    } catch {
      return 0;
    }
  }

  /**
   * 소프트웨어 검증 승인 대기 개수
   */
  private async getSoftwareCount(): Promise<number> {
    try {
      const [result] = await this.db
        .select({ count: count() })
        .from(schema.softwareHistory)
        .where(eq(schema.softwareHistory.approvalStatus, SoftwareApprovalStatusValues.PENDING));
      return result?.count ?? 0;
    } catch {
      return 0;
    }
  }
}

import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { eq, and, gte, inArray, count } from 'drizzle-orm';
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
    private readonly db: PostgresJsDatabase<typeof schema>
  ) {}

  /**
   * 역할별 승인 대기 개수 조회
   *
   * 모든 카테고리의 개수를 병렬로 조회하여 성능 최적화
   *
   * @param userId - 현재 사용자 ID (권한 필터링용)
   * @param userRole - 사용자 역할 (technical_manager, lab_manager, quality_manager)
   * @returns 카테고리별 대기 개수
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

    // ✅ 사용자가 존재하지 않는 경우 명확한 에러 반환
    if (!user) {
      throw new NotFoundException({
        code: 'USER_NOT_FOUND',
        message: `User not found (userId: ${userId}). Session may be expired or account deleted.`,
      });
    }

    const userTeamId = user.teamId;
    const userSite = user.site;
    const isLabManager = checkIsLabManager(userRole);

    // Role-based category gating
    const allowedCategories = ROLE_CATEGORIES[userRole] ?? new Set();
    const shouldQuery = (category: string): boolean => allowedCategories.has(category);

    // Parallel execution for efficiency (with role gating)
    const [
      // Direction-based counts (consolidated)
      outgoingCheckouts,
      outgoingVendorReturns,
      incomingReturns,
      incomingRentalImports,
      incomingSharedImports,

      // Specialized counts
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
      // Regular checkouts (calibration, repair, rental — RETURN_TO_VENDOR 제외)
      shouldQuery('outgoing')
        ? this.getCheckoutCount(
            CheckoutStatusValues.PENDING,
            undefined,
            userTeamId,
            isLabManager,
            CheckoutPurposeValues.RETURN_TO_VENDOR
          )
        : Promise.resolve(0),

      // Equipment being returned to vendors (part of outgoing)
      shouldQuery('outgoing')
        ? this.getCheckoutCount(
            CheckoutStatusValues.PENDING,
            CheckoutPurposeValues.RETURN_TO_VENDOR,
            userTeamId,
            isLabManager
          )
        : Promise.resolve(0),

      // === Incoming (반입) ===
      // Equipment returning from calibration/repair
      shouldQuery('incoming')
        ? this.getCheckoutCount(CheckoutStatusValues.RETURNED, undefined, userTeamId, isLabManager)
        : Promise.resolve(0),

      // Rental equipment arriving from vendors
      shouldQuery('incoming')
        ? this.getEquipmentImportCount(
            EquipmentImportStatusValues.PENDING,
            EquipmentImportSourceEnum.enum.rental,
            userSite
          )
        : Promise.resolve(0),

      // Shared equipment arriving from other teams
      shouldQuery('incoming')
        ? this.getEquipmentImportCount(
            EquipmentImportStatusValues.PENDING,
            EquipmentImportSourceEnum.enum.internal_shared,
            userSite
          )
        : Promise.resolve(0),

      // === Specialized (not movement) ===
      shouldQuery('equipment') ? this.getEquipmentRequestCount(userSite) : Promise.resolve(0),
      shouldQuery('calibration') ? this.getCalibrationCount(userSite) : Promise.resolve(0),
      shouldQuery('inspection') ? this.getIntermediateCheckCount() : Promise.resolve(0),
      shouldQuery('nonconformity')
        ? this.getNonConformanceCount(userTeamId, isLabManager)
        : Promise.resolve(0),
      shouldQuery('disposal_review')
        ? this.getDisposalReviewCount(userId, isLabManager, userTeamId)
        : Promise.resolve(0),
      shouldQuery('disposal_final') ? this.getDisposalFinalCount(userSite) : Promise.resolve(0),
      shouldQuery('plan_review') ? this.getCalibrationPlanReviewCount() : Promise.resolve(0), // Cross-site
      shouldQuery('plan_final') ? this.getCalibrationPlanFinalCount() : Promise.resolve(0),
      shouldQuery('software') ? this.getSoftwareCount() : Promise.resolve(0),
    ]);

    return {
      // Consolidated direction counts
      outgoing: outgoingCheckouts + outgoingVendorReturns,
      incoming: incomingReturns + incomingRentalImports + incomingSharedImports,

      // Specialized counts
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
   */
  private async getCheckoutCount(
    status: string,
    purpose?: string,
    userTeamId?: string | null,
    isLabManager?: boolean,
    excludePurpose?: string
  ): Promise<number> {
    try {
      const checkouts = await this.db.query.checkouts.findMany({
        where: (checkouts, { eq: eqFn, and: andFn, ne }) => {
          const conditions = [eqFn(checkouts.status, status)];

          if (purpose) {
            conditions.push(eqFn(checkouts.purpose, purpose));
          }

          if (excludePurpose) {
            conditions.push(ne(checkouts.purpose, excludePurpose));
          }

          return andFn(...conditions);
        },
        columns: {
          id: true,
          requesterId: true,
        },
        with: {
          requester: {
            columns: {
              teamId: true,
            },
          },
        },
      });

      // Filter by team if not lab_manager
      if (!isLabManager && userTeamId) {
        return checkouts.filter((c) => c.requester?.teamId === userTeamId).length;
      }

      return checkouts.length;
    } catch {
      return 0;
    }
  }

  /**
   * 장비 반입 승인 대기 개수 조회
   *
   * Site filtering: equipmentImports has direct site column
   */
  private async getEquipmentImportCount(
    status: string,
    sourceType: string,
    userSite?: string | null
  ): Promise<number> {
    try {
      const items = await this.db.query.equipmentImports.findMany({
        where: (imports, { eq: eqFn, and: andFn }) => {
          const conditions = [eqFn(imports.status, status), eqFn(imports.sourceType, sourceType)];
          if (userSite) {
            conditions.push(eqFn(imports.site, userSite));
          }
          return andFn(...conditions);
        },
        columns: {
          id: true,
        },
      });

      return items.length;
    } catch {
      return 0;
    }
  }

  /**
   * 장비 등록/수정/삭제 승인 대기 개수
   *
   * Site filtering: JOIN users via requestedBy, filter by users.site
   * Pattern: DashboardService.getPendingApprovalCounts
   */
  private async getEquipmentRequestCount(userSite?: string | null): Promise<number> {
    try {
      if (userSite) {
        const result = await this.db
          .select({ id: schema.equipmentRequests.id })
          .from(schema.equipmentRequests)
          .innerJoin(schema.users, eq(schema.equipmentRequests.requestedBy, schema.users.id))
          .where(
            and(
              eq(schema.equipmentRequests.approvalStatus, ApprovalStatusEnum.enum.pending_approval),
              eq(schema.users.site, userSite)
            )
          );
        return result.length;
      }

      const items = await this.db.query.equipmentRequests.findMany({
        where: eq(
          schema.equipmentRequests.approvalStatus,
          ApprovalStatusEnum.enum.pending_approval
        ),
        columns: {
          id: true,
        },
      });

      return items.length;
    } catch {
      return 0;
    }
  }

  /**
   * 교정 기록 승인 대기 개수
   *
   * Site filtering: JOIN equipment, filter by equipment.site
   */
  private async getCalibrationCount(userSite?: string | null): Promise<number> {
    try {
      if (userSite) {
        const result = await this.db
          .select({ id: schema.calibrations.id })
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
        return result.length;
      }

      const items = await this.db.query.calibrations.findMany({
        where: eq(
          schema.calibrations.approvalStatus,
          CalibrationApprovalStatusEnum.enum.pending_approval
        ),
        columns: {
          id: true,
        },
      });

      return items.length;
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
      const items = await this.db.query.calibrations.findMany({
        where: (calibrations, { isNotNull, lt, and: andFn }) =>
          andFn(
            isNotNull(calibrations.intermediateCheckDate),
            lt(calibrations.intermediateCheckDate, today)
          ),
        columns: { id: true },
      });
      return items.length;
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
      const items = await this.db.query.nonConformances.findMany({
        where: (nc, { eq: eqFn, and: andFn, isNull: isNullFn }) =>
          andFn(eqFn(nc.status, NonConformanceStatusValues.CORRECTED), isNullFn(nc.deletedAt)),
        columns: {
          id: true,
          ncType: true,
          repairHistoryId: true,
        },
        with: {
          equipment: {
            columns: {
              teamId: true,
            },
          },
        },
      });

      // Filter out items that require repair but don't have repair history
      let validItems = items.filter((item) => {
        const requiresRepair =
          item.ncType === NonConformanceTypeValues.DAMAGE ||
          item.ncType === NonConformanceTypeValues.MALFUNCTION;
        return !requiresRepair || item.repairHistoryId !== null;
      });

      // Team filtering (cross-site workflow consideration)
      if (!isLabManager && userTeamId) {
        validItems = validItems.filter((item) => item.equipment?.teamId === userTeamId);
      }

      return validItems.length;
    } catch {
      return 0;
    }
  }

  /**
   * 폐기 검토 대기 개수 (기술책임자)
   */
  private async getDisposalReviewCount(
    userId: string,
    isLabManager: boolean,
    userTeamId?: string | null
  ): Promise<number> {
    try {
      const requests = await this.db.query.disposalRequests.findMany({
        where: eq(schema.disposalRequests.reviewStatus, DisposalReviewStatusValues.PENDING),
        columns: {
          id: true,
        },
        with: {
          equipment: {
            columns: {
              teamId: true,
            },
          },
        },
      });

      // Filter by team if not lab_manager
      if (!isLabManager && userTeamId) {
        return requests.filter((r) => r.equipment?.teamId === userTeamId).length;
      }

      return requests.length;
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
        const result = await this.db
          .select({ id: schema.disposalRequests.id })
          .from(schema.disposalRequests)
          .innerJoin(schema.equipment, eq(schema.disposalRequests.equipmentId, schema.equipment.id))
          .where(
            and(
              eq(schema.disposalRequests.reviewStatus, DisposalReviewStatusValues.REVIEWED),
              eq(schema.equipment.site, userSite)
            )
          );
        return result.length;
      }

      const items = await this.db.query.disposalRequests.findMany({
        where: eq(schema.disposalRequests.reviewStatus, DisposalReviewStatusValues.REVIEWED),
        columns: {
          id: true,
        },
      });

      return items.length;
    } catch {
      return 0;
    }
  }

  /**
   * 교정계획서 검토 대기 개수 (품질책임자)
   */
  private async getCalibrationPlanReviewCount(): Promise<number> {
    try {
      const items = await this.db.query.calibrationPlans.findMany({
        where: (plans, { eq: eqFn, and: andFn }) =>
          andFn(
            eqFn(plans.status, CalibrationPlanStatusValues.PENDING_REVIEW),
            eqFn(plans.isLatestVersion, true)
          ),
        columns: { id: true },
      });
      return items.length;
    } catch {
      return 0;
    }
  }

  /**
   * 교정계획서 최종 승인 대기 개수 (시험소장)
   */
  private async getCalibrationPlanFinalCount(): Promise<number> {
    try {
      const items = await this.db.query.calibrationPlans.findMany({
        where: (plans, { eq: eqFn, and: andFn }) =>
          andFn(
            eqFn(plans.status, CalibrationPlanStatusValues.PENDING_APPROVAL),
            eqFn(plans.isLatestVersion, true)
          ),
        columns: { id: true },
      });
      return items.length;
    } catch {
      return 0;
    }
  }

  /**
   * 소프트웨어 검증 승인 대기 개수
   */
  private async getSoftwareCount(): Promise<number> {
    try {
      const items = await this.db.query.softwareHistory.findMany({
        where: eq(schema.softwareHistory.approvalStatus, SoftwareApprovalStatusValues.PENDING),
        columns: { id: true },
      });
      return items.length;
    } catch {
      return 0;
    }
  }
}

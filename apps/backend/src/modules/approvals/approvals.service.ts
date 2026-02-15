import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { eq, and, isNull } from 'drizzle-orm';
import * as schema from '@equipment-management/db/schema';
import { CalibrationApprovalStatusEnum } from '@equipment-management/schemas';

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
  async getPendingCountsByRole(userId: string, userRole: string): Promise<PendingCountsByCategory> {
    // Get user's team for filtering
    const user = await this.db.query.users.findFirst({
      where: eq(schema.users.id, userId),
      columns: {
        id: true,
        teamId: true,
      },
    });

    // ✅ 사용자가 존재하지 않는 경우 명확한 에러 반환
    if (!user) {
      throw new NotFoundException(
        `사용자를 찾을 수 없습니다 (userId: ${userId}). 세션이 만료되었거나 삭제된 계정입니다.`
      );
    }

    const userTeamId = user.teamId;
    const isLabManager = userRole === 'lab_manager';

    // Parallel execution for efficiency
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
      // Regular checkouts (calibration, repair, rental, etc.)
      this.getCheckoutCount('pending', undefined, userTeamId, isLabManager),

      // Equipment being returned to vendors
      this.getCheckoutCount('pending', 'return_to_vendor', userTeamId, isLabManager),

      // === Incoming (반입) ===
      // Equipment returning from calibration/repair
      this.getCheckoutCount('returned', undefined, userTeamId, isLabManager),

      // Rental equipment arriving from vendors
      this.getEquipmentImportCount('pending', 'rental'),

      // Shared equipment arriving from other teams
      this.getEquipmentImportCount('pending', 'internal_shared'),

      // === Specialized (not movement) ===
      this.getEquipmentRequestCount(),
      this.getCalibrationCount(),
      this.getIntermediateCheckCount(),
      this.getNonConformanceCount(userTeamId, isLabManager),
      this.getDisposalReviewCount(userId, isLabManager, userTeamId),
      this.getDisposalFinalCount(),
      this.getCalibrationPlanReviewCount(),
      this.getCalibrationPlanFinalCount(),
      this.getSoftwareCount(),
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
   * 반출 승인 대기 개수 조회
   */
  private async getCheckoutCount(
    status: string,
    purpose?: string,
    userTeamId?: string | null,
    isLabManager?: boolean
  ): Promise<number> {
    try {
      const checkouts = await this.db.query.checkouts.findMany({
        where: (checkouts, { eq: eqFn, and: andFn }) => {
          const conditions = [eqFn(checkouts.status, status)];

          if (purpose) {
            conditions.push(eqFn(checkouts.purpose, purpose));
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
   */
  private async getEquipmentImportCount(status: string, sourceType: string): Promise<number> {
    try {
      const items = await this.db.query.equipmentImports.findMany({
        where: (imports, { eq: eqFn, and: andFn }) =>
          andFn(eqFn(imports.status, status), eqFn(imports.sourceType, sourceType)),
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
   */
  private async getEquipmentRequestCount(): Promise<number> {
    try {
      const items = await this.db.query.equipmentRequests.findMany({
        where: eq(schema.equipmentRequests.approvalStatus, 'pending_approval'),
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
   */
  private async getCalibrationCount(): Promise<number> {
    try {
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
   * 중간점검 승인 대기 개수
   *
   * TODO: Implement when intermediate check approval flow is defined
   * Currently returns 0 as placeholder
   */
  private async getIntermediateCheckCount(): Promise<number> {
    return 0;
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
          andFn(eqFn(nc.status, 'corrected'), isNullFn(nc.deletedAt)),
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
        const requiresRepair = ['damage', 'malfunction'].includes(item.ncType);
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
        where: eq(schema.disposalRequests.reviewStatus, 'pending'),
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
   */
  private async getDisposalFinalCount(): Promise<number> {
    try {
      const items = await this.db.query.disposalRequests.findMany({
        where: eq(schema.disposalRequests.reviewStatus, 'reviewed'),
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
   *
   * TODO: Implement when calibration plan approval flow is defined
   * Currently returns 0 as placeholder
   */
  private async getCalibrationPlanReviewCount(): Promise<number> {
    return 0;
  }

  /**
   * 교정계획서 최종 승인 대기 개수 (시험소장)
   *
   * TODO: Implement when calibration plan approval flow is defined
   * Currently returns 0 as placeholder
   */
  private async getCalibrationPlanFinalCount(): Promise<number> {
    return 0;
  }

  /**
   * 소프트웨어 검증 승인 대기 개수
   *
   * TODO: Implement when software approval is migrated to database
   * Currently returns 0 as placeholder (service uses in-memory data)
   */
  private async getSoftwareCount(): Promise<number> {
    return 0;
  }
}

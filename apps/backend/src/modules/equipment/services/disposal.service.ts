import {
  Injectable,
  NotFoundException,
  Inject,
  Logger,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import type { AppDatabase } from '@equipment-management/db';
import { createVersionConflictException } from '../../../common/base/versioned-base.service';
import { eq, and, inArray, sql } from 'drizzle-orm';
import { disposalRequests } from '@equipment-management/db/schema';
import { equipment } from '@equipment-management/db/schema';
import { users } from '@equipment-management/db/schema';
import {
  RequestDisposalInput,
  ReviewDisposalInput,
  ApproveDisposalInput,
} from '../dto/disposal.dto';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { SimpleCacheService } from '../../../common/cache/simple-cache.service';
import { CACHE_KEY_PREFIXES } from '../../../common/cache/cache-key-prefixes';
import { VersionedBaseService } from '../../../common/base/versioned-base.service';
import { CacheInvalidationHelper } from '../../../common/cache/cache-invalidation.helper';
import { NOTIFICATION_EVENTS } from '../../notifications/events/notification-events';
import {
  DisposalReviewStatusValues as DRVal,
  EquipmentStatusValues as ESVal,
  UserRoleValues as URVal,
} from '@equipment-management/schemas';
import { DASHBOARD_ITEM_LIMIT } from '@equipment-management/shared-constants';
import type { DisposalRequestWithRelations } from './disposal.types';

/**
 * 장비 폐기 서비스
 *
 * 2단계 승인 워크플로우:
 * 1. 요청 (test_engineer, technical_manager, lab_manager) → reviewStatus='pending'
 * 2. 검토 (technical_manager, 같은 팀) → reviewStatus='reviewed' or 'rejected'
 * 3. 승인 (lab_manager) → reviewStatus='approved' or 'rejected', equipment.status='disposed'
 */
@Injectable()
export class DisposalService extends VersionedBaseService {
  private readonly logger = new Logger(DisposalService.name);
  private readonly CACHE_PREFIX = CACHE_KEY_PREFIXES.EQUIPMENT;

  constructor(
    @Inject('DRIZZLE_INSTANCE')
    protected readonly db: AppDatabase,
    private readonly cacheService: SimpleCacheService,
    private readonly cacheInvalidationHelper: CacheInvalidationHelper,
    private readonly eventEmitter: EventEmitter2
  ) {
    super();
  }

  /**
   * CAS 충돌 시 stale 캐시 광범위 무효화 훅 (VersionedBaseService 정책).
   *
   * disposal 도메인은 disposalRequests + equipment 멀티 엔티티가 연동되므로
   * 특정 detail 키 단위 삭제로는 정합성 보장이 어려워 `CACHE_PREFIX + '*'` 로
   * equipment 도메인 전체를 무효화한다 (기존 inline 정책과 동일 semantics).
   */
  protected async onVersionConflict(_id: string): Promise<void> {
    this.cacheService.deleteByPattern(this.CACHE_PREFIX + '*');
  }

  /**
   * 폐기 요청 생성
   *
   * @param equipmentId 장비 ID
   * @param dto 폐기 요청 데이터
   * @param requestedBy 요청자 ID
   * @returns 생성된 폐기 요청
   */
  async requestDisposal(
    equipmentId: string,
    dto: RequestDisposalInput,
    requestedBy: string
  ): Promise<DisposalRequestWithRelations | null> {
    // 1. 장비 존재 확인
    const equipmentItem = await this.db.query.equipment.findFirst({
      where: eq(equipment.id, equipmentId),
    });

    if (!equipmentItem) {
      throw new NotFoundException({
        code: 'EQUIPMENT_NOT_FOUND',
        message: `Equipment not found. (ID: ${equipmentId})`,
      });
    }

    // 2. 중복 요청 확인 (진행 중인 요청이 있는지)
    const existingRequest = await this.db.query.disposalRequests.findFirst({
      where: and(
        eq(disposalRequests.equipmentId, equipmentId),
        eq(disposalRequests.reviewStatus, DRVal.PENDING)
      ),
    });

    if (existingRequest) {
      throw new ConflictException({
        code: 'DISPOSAL_ALREADY_IN_PROGRESS',
        message: 'A disposal request is already in progress.',
      });
    }

    // 3. 트랜잭션: 폐기 요청 생성 + 장비 상태 변경
    const result = await this.db.transaction(async (tx) => {
      // 폐기 요청 생성
      const [request] = await tx
        .insert(disposalRequests)
        .values({
          equipmentId,
          reason: dto.reason,
          reasonDetail: dto.reasonDetail,
          requestedBy,
          reviewStatus: DRVal.PENDING,
        })
        .returning();

      // 장비 상태를 'pending_disposal'로 변경 (version bump 필수 — 후속 CAS 업데이트 일관성)
      await tx
        .update(equipment)
        .set({
          status: ESVal.PENDING_DISPOSAL,
          version: sql`version + 1`,
          updatedAt: new Date(),
        } as Record<string, unknown>)
        .where(eq(equipment.id, equipmentId));

      return request;
    });

    // 4. 캐시 무효화 (SSOT: CacheInvalidationHelper — 장비 상세/목록 + 폐기 요청 + 대시보드)
    await this.cacheInvalidationHelper.invalidateAfterDisposal(equipmentId);

    this.logger.log(
      `폐기 요청 생성: equipmentId=${equipmentId}, requestId=${result.id}, requestedBy=${requestedBy}`
    );

    // 📢 알림 이벤트 발행 (폐기 요청)
    this.eventEmitter.emit(NOTIFICATION_EVENTS.DISPOSAL_REQUESTED, {
      disposalId: result.id,
      equipmentId,
      equipmentName: equipmentItem.name ?? '',
      managementNumber: equipmentItem.managementNumber ?? '',
      requesterId: requestedBy,
      requesterTeamId: equipmentItem.teamId ?? '',
      site: equipmentItem.site ?? '',
      actorId: requestedBy,
      actorName: '',
      timestamp: new Date(),
    });

    // Relations 포함하여 반환
    return this.getCurrentDisposalRequest(equipmentId);
  }

  /**
   * 폐기 검토 (technical_manager, 같은 팀)
   *
   * @param equipmentId 장비 ID
   * @param reviewDto 검토 데이터
   * @param reviewedBy 검토자 ID
   * @returns 검토된 폐기 요청
   */
  async reviewDisposal(
    equipmentId: string,
    reviewDto: ReviewDisposalInput,
    reviewedBy: string
  ): Promise<DisposalRequestWithRelations | null> {
    // 1. 현재 요청 조회
    const request = await this.db.query.disposalRequests.findFirst({
      where: and(
        eq(disposalRequests.equipmentId, equipmentId),
        eq(disposalRequests.reviewStatus, DRVal.PENDING)
      ),
    });

    if (!request) {
      throw new NotFoundException({
        code: 'DISPOSAL_PENDING_NOT_FOUND',
        message: 'Pending disposal request not found.',
      });
    }

    // 2. 장비 조회 (팀 확인용)
    const equipmentItem = await this.db.query.equipment.findFirst({
      where: eq(equipment.id, equipmentId),
    });

    if (!equipmentItem) {
      throw new NotFoundException({
        code: 'EQUIPMENT_NOT_FOUND',
        message: `Equipment not found. (ID: ${equipmentId})`,
      });
    }

    // 3. 검토자 정보 조회 (팀 확인용)
    const reviewer = await this.db.query.users.findFirst({
      where: eq(users.id, reviewedBy),
    });

    if (!reviewer) {
      throw new NotFoundException({
        code: 'DISPOSAL_REVIEWER_NOT_FOUND',
        message: `Reviewer not found. (ID: ${reviewedBy})`,
      });
    }

    // 4. 팀 기반 권한 검증 (같은 팀인지 확인)
    // lab_manager는 모든 팀의 장비를 검토할 수 있음
    const isLabManager = reviewer.role === URVal.LAB_MANAGER;
    if (!isLabManager && equipmentItem.teamId && equipmentItem.teamId !== reviewer.teamId) {
      throw new ForbiddenException({
        code: 'DISPOSAL_TEAM_SCOPE_ONLY',
        message: 'Can only review equipment from the same team.',
      });
    }

    // 5. 트랜잭션: 검토 처리 (CAS: disposalRequests.version 검증은 베이스 클래스 위임)
    await this.db.transaction(async (tx) => {
      if (reviewDto.decision === 'approve') {
        // 승인: reviewStatus를 'reviewed'로 변경
        await this.updateWithVersion(
          disposalRequests,
          request.id,
          reviewDto.version,
          {
            reviewStatus: DRVal.REVIEWED,
            reviewedBy,
            reviewedAt: new Date(),
            reviewOpinion: reviewDto.opinion,
          },
          '폐기요청',
          tx as AppDatabase,
          'DISPOSAL_REQUEST_NOT_FOUND'
        );
      } else {
        // 반려: reviewStatus를 'rejected'로 변경하고 장비 상태를 'available'로 원복
        await this.updateWithVersion(
          disposalRequests,
          request.id,
          reviewDto.version,
          {
            reviewStatus: DRVal.REJECTED,
            rejectedBy: reviewedBy,
            rejectedAt: new Date(),
            rejectionReason: reviewDto.opinion,
            rejectionStep: 'review',
          },
          '폐기요청',
          tx as AppDatabase,
          'DISPOSAL_REQUEST_NOT_FOUND'
        );

        // 장비 상태 원복 (version bump 필수 — 후속 CAS 업데이트 일관성)
        await tx
          .update(equipment)
          .set({
            status: ESVal.AVAILABLE,
            version: sql`version + 1`,
            updatedAt: new Date(),
          } as Record<string, unknown>)
          .where(eq(equipment.id, equipmentId));
      }
    });

    // 6. 캐시 무효화 (SSOT: CacheInvalidationHelper — 장비 상세/목록 + 폐기 요청 + 대시보드)
    await this.cacheInvalidationHelper.invalidateAfterDisposal(equipmentId);

    this.logger.log(
      `폐기 검토 완료: requestId=${request.id}, decision=${reviewDto.decision}, reviewedBy=${reviewedBy}`
    );

    // 📢 알림 이벤트 발행 (폐기 검토)
    if (reviewDto.decision === 'approve') {
      this.eventEmitter.emit(NOTIFICATION_EVENTS.DISPOSAL_REVIEWED, {
        disposalId: request.id,
        equipmentId,
        equipmentName: equipmentItem.name ?? '',
        managementNumber: equipmentItem.managementNumber ?? '',
        requesterId: request.requestedBy,
        requesterTeamId: equipmentItem.teamId ?? '',
        site: equipmentItem.site ?? '',
        actorId: reviewedBy,
        actorName: '',
        timestamp: new Date(),
      });
    } else {
      this.eventEmitter.emit(NOTIFICATION_EVENTS.DISPOSAL_REJECTED, {
        disposalId: request.id,
        equipmentId,
        equipmentName: equipmentItem.name ?? '',
        managementNumber: equipmentItem.managementNumber ?? '',
        requesterId: request.requestedBy,
        requesterTeamId: equipmentItem.teamId ?? '',
        site: equipmentItem.site ?? '',
        reason: reviewDto.opinion ?? '',
        rejectionStep: 'review',
        actorId: reviewedBy,
        actorName: '',
        timestamp: new Date(),
      });
    }

    // Relations 포함하여 반환
    return this.getCurrentDisposalRequest(equipmentId);
  }

  /**
   * 폐기 최종 승인 (lab_manager)
   *
   * @param equipmentId 장비 ID
   * @param approveDto 승인 데이터
   * @param approvedBy 승인자 ID
   * @returns 승인된 폐기 요청
   */
  async approveDisposal(
    equipmentId: string,
    approveDto: ApproveDisposalInput,
    approvedBy: string
  ): Promise<DisposalRequestWithRelations | null> {
    // 1. 현재 요청 조회 (reviewStatus='reviewed'만 승인 가능)
    const request = await this.db.query.disposalRequests.findFirst({
      where: and(
        eq(disposalRequests.equipmentId, equipmentId),
        eq(disposalRequests.reviewStatus, DRVal.REVIEWED)
      ),
    });

    if (!request) {
      throw new NotFoundException({
        code: 'DISPOSAL_REVIEWED_NOT_FOUND',
        message: 'Reviewed disposal request not found.',
      });
    }

    // 2. 트랜잭션: 승인 처리 (CAS: disposalRequests.version 검증은 베이스 클래스 위임)
    await this.db.transaction(async (tx) => {
      if (approveDto.decision === 'approve') {
        // 승인: reviewStatus를 'approved'로 변경하고 장비 상태를 'disposed'로 변경
        await this.updateWithVersion(
          disposalRequests,
          request.id,
          approveDto.version,
          {
            reviewStatus: DRVal.APPROVED,
            approvedBy,
            approvedAt: new Date(),
            approvalComment: approveDto.comment || null,
          },
          '폐기요청',
          tx as AppDatabase,
          'DISPOSAL_REQUEST_NOT_FOUND'
        );

        // 장비 상태를 'disposed'로 변경 (version bump 필수 — 후속 CAS 업데이트 일관성)
        await tx
          .update(equipment)
          .set({
            status: ESVal.DISPOSED,
            version: sql`version + 1`,
            updatedAt: new Date(),
          } as Record<string, unknown>)
          .where(eq(equipment.id, equipmentId));
      } else {
        // 반려: reviewStatus를 'rejected'로 변경하고 장비 상태를 'available'로 원복
        await this.updateWithVersion(
          disposalRequests,
          request.id,
          approveDto.version,
          {
            reviewStatus: DRVal.REJECTED,
            rejectedBy: approvedBy,
            rejectedAt: new Date(),
            rejectionReason: approveDto.comment || '승인 단계에서 반려',
            rejectionStep: 'approval',
          },
          '폐기요청',
          tx as AppDatabase,
          'DISPOSAL_REQUEST_NOT_FOUND'
        );

        // 장비 상태 원복 (version bump 필수 — 후속 CAS 업데이트 일관성)
        await tx
          .update(equipment)
          .set({
            status: ESVal.AVAILABLE,
            version: sql`version + 1`,
            updatedAt: new Date(),
          } as Record<string, unknown>)
          .where(eq(equipment.id, equipmentId));
      }
    });

    // 3. 캐시 무효화 (SSOT: CacheInvalidationHelper — 장비 상세/목록 + 폐기 요청 + 대시보드)
    await this.cacheInvalidationHelper.invalidateAfterDisposal(equipmentId);

    this.logger.log(
      `폐기 최종 승인 완료: requestId=${request.id}, decision=${approveDto.decision}, approvedBy=${approvedBy}`
    );

    // 📢 알림 이벤트 발행 (폐기 최종 승인/반려)
    // 장비 정보 + 승인자 정보 조회 (크로스 사이트 워크플로우: site, teamId 필수)
    const [equipmentItem, approver] = await Promise.all([
      this.db.query.equipment.findFirst({
        where: eq(equipment.id, equipmentId),
      }),
      this.db.query.users.findFirst({
        where: eq(users.id, approvedBy),
      }),
    ]);

    if (approveDto.decision === 'approve') {
      this.eventEmitter.emit(NOTIFICATION_EVENTS.DISPOSAL_APPROVED, {
        disposalId: request.id,
        equipmentId,
        equipmentName: equipmentItem?.name ?? '',
        managementNumber: equipmentItem?.managementNumber ?? '',
        requesterId: request.requestedBy,
        requesterTeamId: equipmentItem?.teamId ?? '',
        site: equipmentItem?.site ?? '',
        actorId: approvedBy,
        actorName: approver?.name ?? '',
        timestamp: new Date(),
      });
    } else {
      this.eventEmitter.emit(NOTIFICATION_EVENTS.DISPOSAL_REJECTED, {
        disposalId: request.id,
        equipmentId,
        equipmentName: equipmentItem?.name ?? '',
        managementNumber: equipmentItem?.managementNumber ?? '',
        requesterId: request.requestedBy,
        requesterTeamId: equipmentItem?.teamId ?? '',
        site: equipmentItem?.site ?? '',
        reason: approveDto.comment ?? '',
        rejectionStep: 'approval',
        actorId: approvedBy,
        actorName: approver?.name ?? '',
        timestamp: new Date(),
      });
    }

    // Relations 포함하여 반환
    return this.getCurrentDisposalRequest(equipmentId);
  }

  /**
   * 폐기 요청 취소 (요청자 본인만 가능)
   *
   * @param equipmentId 장비 ID
   * @param userId 사용자 ID
   * @returns 성공 메시지
   */
  async cancelDisposalRequest(
    equipmentId: string,
    userId: string
  ): Promise<{ success: boolean; message: string }> {
    // 1. 현재 요청 조회
    const request = await this.db.query.disposalRequests.findFirst({
      where: and(
        eq(disposalRequests.equipmentId, equipmentId),
        eq(disposalRequests.reviewStatus, DRVal.PENDING)
      ),
    });

    if (!request) {
      throw new NotFoundException({
        code: 'DISPOSAL_PENDING_NOT_FOUND',
        message: 'Pending disposal request not found.',
      });
    }

    // 2. 권한 검증 (요청자 본인만 취소 가능)
    if (request.requestedBy !== userId) {
      throw new ForbiddenException({
        code: 'DISPOSAL_ONLY_REQUESTER_CAN_CANCEL',
        message: 'Only the requester can cancel this request.',
      });
    }

    // 3. 장비 현재 version 조회 (CAS 보호용)
    const currentEquipment = await this.db.query.equipment.findFirst({
      where: eq(equipment.id, equipmentId),
      columns: { version: true },
    });

    if (!currentEquipment) {
      throw new NotFoundException({
        code: 'EQUIPMENT_NOT_FOUND',
        message: `Equipment not found. (ID: ${equipmentId})`,
      });
    }

    // 4. 트랜잭션: 요청 삭제 + 장비 상태 원복 (CAS 보호)
    await this.db.transaction(async (tx) => {
      // 폐기 요청 삭제 (CAS: version 조건으로 동시 취소 방지)
      const deleted = await tx
        .delete(disposalRequests)
        .where(
          and(eq(disposalRequests.id, request.id), eq(disposalRequests.version, request.version))
        )
        .returning({ id: disposalRequests.id });

      if (deleted.length === 0) {
        this.cacheService.deleteByPattern(this.CACHE_PREFIX + '*');
        throw createVersionConflictException(request.version + 1, request.version);
      }

      // 장비 상태 원복 (CAS: version 조건으로 동시 수정 방지 — 베이스 클래스 위임)
      await this.updateWithVersion(
        equipment,
        equipmentId,
        currentEquipment.version,
        { status: ESVal.AVAILABLE },
        '장비',
        tx as AppDatabase,
        'EQUIPMENT_NOT_FOUND'
      );
    });

    // 4. 캐시 무효화 (SSOT: CacheInvalidationHelper — 장비 상세/목록 + 폐기 요청 + 대시보드)
    await this.cacheInvalidationHelper.invalidateAfterDisposal(equipmentId);

    this.logger.log(
      `폐기 요청 취소: requestId=${request.id}, equipmentId=${equipmentId}, userId=${userId}`
    );

    return {
      success: true,
      message: '폐기 요청이 취소되었습니다.',
    };
  }

  /**
   * 현재 폐기 요청 조회 (pending, reviewed 상태)
   *
   * @param equipmentId 장비 ID
   * @returns 폐기 요청 (없으면 null)
   */
  async getCurrentDisposalRequest(
    equipmentId: string
  ): Promise<DisposalRequestWithRelations | null> {
    const request = await this.db.query.disposalRequests.findFirst({
      where: and(
        eq(disposalRequests.equipmentId, equipmentId),
        inArray(disposalRequests.reviewStatus, [DRVal.PENDING, DRVal.REVIEWED, DRVal.APPROVED])
      ),
      with: {
        equipment: true,
        requester: true,
        reviewer: true,
        approver: true,
        rejector: true,
      },
      orderBy: (disposalRequests, { desc }) => [desc(disposalRequests.createdAt)],
    });

    return request || null;
  }

  /**
   * 검토 대기 중인 폐기 요청 목록 조회 (기술책임자용)
   * reviewStatus='pending'인 요청들을 최신순으로 반환
   *
   * 권한 필터링:
   * - technical_manager: 같은 팀 장비만 조회 가능
   * - lab_manager: 모든 팀 장비 조회 가능
   *
   * @param userId - 현재 사용자 ID (팀 필터링용)
   */
  async getPendingReviewRequests(
    userId: string,
    site?: string,
    teamId?: string
  ): Promise<unknown[]> {
    // 1. 현재 사용자 조회 (역할 및 팀 확인)
    const currentUser = await this.db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!currentUser) {
      throw new NotFoundException({
        code: 'USER_NOT_FOUND',
        message: `User not found. (ID: ${userId})`,
      });
    }

    // 2. DB 레벨 필터 조건 구성 (site/team은 equipment 테이블 컬럼)
    // Drizzle findMany의 with(relations)은 cross-table WHERE를 지원하지 않으므로
    // 먼저 equipment JOIN으로 대상 폐기 요청 ID를 필터링한 후 relations 쿼리 수행
    const isLabManager = currentUser.role === URVal.LAB_MANAGER;

    const joinConditions = [
      eq(disposalRequests.reviewStatus, DRVal.PENDING),
      eq(disposalRequests.equipmentId, equipment.id),
    ];

    // site 필터 (SiteScopeInterceptor → lab_manager)
    if (site) {
      joinConditions.push(eq(equipment.site, site));
    }

    // team 필터 (SiteScopeInterceptor → technical_manager)
    const effectiveTeamId = teamId ?? (!isLabManager ? currentUser.teamId : undefined);
    if (effectiveTeamId) {
      joinConditions.push(eq(equipment.teamId, effectiveTeamId));
    }

    // 3. JOIN으로 DB 레벨 필터링하여 대상 ID 추출
    const filteredIds = await this.db
      .select({ id: disposalRequests.id })
      .from(disposalRequests)
      .innerJoin(equipment, eq(disposalRequests.equipmentId, equipment.id))
      .where(and(...joinConditions))
      .orderBy(sql`${disposalRequests.requestedAt} DESC`)
      .limit(DASHBOARD_ITEM_LIMIT);

    if (filteredIds.length === 0) {
      return [];
    }

    // 4. Relations 포함 조회 (필터링된 ID만)
    const requests = await this.db.query.disposalRequests.findMany({
      where: inArray(
        disposalRequests.id,
        filteredIds.map((r) => r.id)
      ),
      with: {
        equipment: true,
        requester: {
          columns: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
          with: {
            team: true, // ← Critical: includes team relation
          },
        },
      },
      orderBy: (disposalRequests, { desc }) => [desc(disposalRequests.requestedAt)],
    });

    return requests;
  }

  /**
   * 최종 승인 대기 중인 폐기 요청 목록 조회 (시험소장용)
   * reviewStatus='reviewed'인 요청들을 최신순으로 반환
   */
  async getPendingApprovalRequests(site?: string): Promise<unknown[]> {
    // DB 레벨 site 필터링 (getPendingReviewRequests와 동일 패턴)
    // Drizzle findMany의 with(relations)은 cross-table WHERE를 지원하지 않으므로
    // 먼저 equipment JOIN으로 대상 폐기 요청 ID를 필터링
    const joinConditions = [
      eq(disposalRequests.reviewStatus, DRVal.REVIEWED),
      eq(disposalRequests.equipmentId, equipment.id),
    ];

    if (site) {
      joinConditions.push(eq(equipment.site, site));
    }

    const filteredIds = await this.db
      .select({ id: disposalRequests.id })
      .from(disposalRequests)
      .innerJoin(equipment, eq(disposalRequests.equipmentId, equipment.id))
      .where(and(...joinConditions))
      .orderBy(sql`${disposalRequests.reviewedAt} DESC`)
      .limit(DASHBOARD_ITEM_LIMIT);

    if (filteredIds.length === 0) {
      return [];
    }

    // Relations 포함 조회 (필터링된 ID만)
    const requests = await this.db.query.disposalRequests.findMany({
      where: inArray(
        disposalRequests.id,
        filteredIds.map((r) => r.id)
      ),
      with: {
        equipment: true,
        requester: {
          columns: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
          with: {
            team: true,
          },
        },
        reviewer: {
          columns: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
          with: {
            team: true,
          },
        },
      },
      orderBy: (disposalRequests, { desc }) => [desc(disposalRequests.reviewedAt)],
    });

    return requests;
  }

  /**
   * 장비 캐시 무효화
   *
   * 폐기 처리 시 장비 상태가 변경되므로 캐시를 삭제하여
   * 최신 데이터가 조회되도록 합니다.
   */
  /**
   * 장비 사이트 정보 조회 (enforceSiteAccess용 경량 조회)
   */
  async getEquipmentSiteInfo(
    equipmentId: string
  ): Promise<{ site: string; teamId: string | null }> {
    const item = await this.db.query.equipment.findFirst({
      where: eq(equipment.id, equipmentId),
      columns: { site: true, teamId: true },
    });

    if (!item) {
      throw new NotFoundException({
        code: 'EQUIPMENT_NOT_FOUND',
        message: `Equipment not found. (ID: ${equipmentId})`,
      });
    }

    return { site: item.site, teamId: item.teamId };
  }
}

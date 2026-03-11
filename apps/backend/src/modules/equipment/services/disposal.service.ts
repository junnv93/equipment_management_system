import {
  Injectable,
  NotFoundException,
  Inject,
  Logger,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import type { AppDatabase } from '@equipment-management/db';
import { eq, and, inArray, sql } from 'drizzle-orm';
import * as schema from '@equipment-management/db/schema';
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
import { VersionedBaseService } from '../../../common/base/versioned-base.service';
import { NOTIFICATION_EVENTS } from '../../notifications/events/notification-events';
import {
  DisposalReviewStatusValues as DRVal,
  EquipmentStatusValues as ESVal,
} from '@equipment-management/schemas';

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
  private readonly CACHE_PREFIX = 'equipment:';

  constructor(
    @Inject('DRIZZLE_INSTANCE')
    protected readonly db: AppDatabase,
    private readonly cacheService: SimpleCacheService,
    private readonly eventEmitter: EventEmitter2
  ) {
    super();
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
  ): Promise<{
    id: string;
    createdAt: Date;
    updatedAt: Date;
    requestedBy: string;
    approvedBy: string | null;
    reason: string;
    approvedAt: Date | null;
    rejectionReason: string | null;
    equipmentId: string;
    requestedAt: Date;
    reviewedBy: string | null;
    reviewedAt: Date | null;
    rejectedBy: string | null;
    rejectedAt: Date | null;
    reasonDetail: string;
    reviewStatus: string;
    reviewOpinion: string | null;
    approvalComment: string | null;
    rejectionStep: string | null;
    equipment: {
      repairHistory: string | null;
      id: string;
      name: string;
      managementNumber: string;
      siteCode: string | null;
      classificationCode: string | null;
      managementSerialNumber: number | null;
      assetNumber: string | null;
      modelName: string | null;
      manufacturer: string | null;
      manufacturerContact: string | null;
      serialNumber: string | null;
      description: string | null;
      location: string | null;
      specMatch: string | null;
      calibrationRequired: string | null;
      initialLocation: string | null;
      installationDate: Date | null;
      calibrationCycle: number | null;
      lastCalibrationDate: Date | null;
      nextCalibrationDate: Date | null;
      calibrationAgency: string | null;
      needsIntermediateCheck: boolean | null;
      calibrationMethod: string | null;
      lastIntermediateCheckDate: Date | null;
      intermediateCheckCycle: number | null;
      nextIntermediateCheckDate: Date | null;
      site: string;
      createdAt: Date | null;
      updatedAt: Date | null;
      teamId: string | null;
      managerId: string | null;
      purchaseDate: Date | null;
      price: number | null;
      supplier: string | null;
      contactInfo: string | null;
      softwareVersion: string | null;
      firmwareVersion: string | null;
      softwareName: string | null;
      softwareType: string | null;
      manualLocation: string | null;
      accessories: string | null;
      mainFeatures: string | null;
      technicalManager: string | null;
      status: string;
      isActive: boolean | null;
      approvalStatus: string | null;
      requestedBy: string | null;
      approvedBy: string | null;
      equipmentType: string | null;
      calibrationResult: string | null;
      correctionFactor: string | null;
      intermediateCheckSchedule: Date | null;
      isShared: boolean;
      sharedSource: string | null;
      owner: string | null;
      externalIdentifier: string | null;
      usagePeriodStart: Date | null;
      usagePeriodEnd: Date | null;
    };
    requester: {
      id: string;
      name: string;
      location: string | null;
      site: string | null;
      createdAt: Date;
      updatedAt: Date;
      teamId: string | null;
      email: string;
      role: string;
      azureAdId: string | null;
      position: string | null;
    };
    approver: {
      id: string;
      name: string;
      location: string | null;
      site: string | null;
      createdAt: Date;
      updatedAt: Date;
      teamId: string | null;
      email: string;
      role: string;
      azureAdId: string | null;
      position: string | null;
    } | null;
    reviewer: {
      id: string;
      name: string;
      location: string | null;
      site: string | null;
      createdAt: Date;
      updatedAt: Date;
      teamId: string | null;
      email: string;
      role: string;
      azureAdId: string | null;
      position: string | null;
    } | null;
    rejector: {
      id: string;
      name: string;
      location: string | null;
      site: string | null;
      createdAt: Date;
      updatedAt: Date;
      teamId: string | null;
      email: string;
      role: string;
      azureAdId: string | null;
      position: string | null;
    } | null;
  } | null> {
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

      // 장비 상태를 'pending_disposal'로 변경
      await tx
        .update(equipment)
        .set({
          status: ESVal.PENDING_DISPOSAL,
          updatedAt: new Date(),
        })
        .where(eq(equipment.id, equipmentId));

      return request;
    });

    // 4. 캐시 무효화 - 장비 데이터가 변경되었으므로 캐시 삭제
    await this.invalidateEquipmentCache();

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
  ): Promise<{
    id: string;
    createdAt: Date;
    updatedAt: Date;
    requestedBy: string;
    approvedBy: string | null;
    reason: string;
    approvedAt: Date | null;
    rejectionReason: string | null;
    equipmentId: string;
    requestedAt: Date;
    reviewedBy: string | null;
    reviewedAt: Date | null;
    rejectedBy: string | null;
    rejectedAt: Date | null;
    reasonDetail: string;
    reviewStatus: string;
    reviewOpinion: string | null;
    approvalComment: string | null;
    rejectionStep: string | null;
    equipment: {
      repairHistory: string | null;
      id: string;
      name: string;
      managementNumber: string;
      siteCode: string | null;
      classificationCode: string | null;
      managementSerialNumber: number | null;
      assetNumber: string | null;
      modelName: string | null;
      manufacturer: string | null;
      manufacturerContact: string | null;
      serialNumber: string | null;
      description: string | null;
      location: string | null;
      specMatch: string | null;
      calibrationRequired: string | null;
      initialLocation: string | null;
      installationDate: Date | null;
      calibrationCycle: number | null;
      lastCalibrationDate: Date | null;
      nextCalibrationDate: Date | null;
      calibrationAgency: string | null;
      needsIntermediateCheck: boolean | null;
      calibrationMethod: string | null;
      lastIntermediateCheckDate: Date | null;
      intermediateCheckCycle: number | null;
      nextIntermediateCheckDate: Date | null;
      site: string;
      createdAt: Date | null;
      updatedAt: Date | null;
      teamId: string | null;
      managerId: string | null;
      purchaseDate: Date | null;
      price: number | null;
      supplier: string | null;
      contactInfo: string | null;
      softwareVersion: string | null;
      firmwareVersion: string | null;
      softwareName: string | null;
      softwareType: string | null;
      manualLocation: string | null;
      accessories: string | null;
      mainFeatures: string | null;
      technicalManager: string | null;
      status: string;
      isActive: boolean | null;
      approvalStatus: string | null;
      requestedBy: string | null;
      approvedBy: string | null;
      equipmentType: string | null;
      calibrationResult: string | null;
      correctionFactor: string | null;
      intermediateCheckSchedule: Date | null;
      isShared: boolean;
      sharedSource: string | null;
      owner: string | null;
      externalIdentifier: string | null;
      usagePeriodStart: Date | null;
      usagePeriodEnd: Date | null;
    };
    requester: {
      id: string;
      name: string;
      location: string | null;
      site: string | null;
      createdAt: Date;
      updatedAt: Date;
      teamId: string | null;
      email: string;
      role: string;
      azureAdId: string | null;
      position: string | null;
    };
    approver: {
      id: string;
      name: string;
      location: string | null;
      site: string | null;
      createdAt: Date;
      updatedAt: Date;
      teamId: string | null;
      email: string;
      role: string;
      azureAdId: string | null;
      position: string | null;
    } | null;
    reviewer: {
      id: string;
      name: string;
      location: string | null;
      site: string | null;
      createdAt: Date;
      updatedAt: Date;
      teamId: string | null;
      email: string;
      role: string;
      azureAdId: string | null;
      position: string | null;
    } | null;
    rejector: {
      id: string;
      name: string;
      location: string | null;
      site: string | null;
      createdAt: Date;
      updatedAt: Date;
      teamId: string | null;
      email: string;
      role: string;
      azureAdId: string | null;
      position: string | null;
    } | null;
  } | null> {
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
    const isLabManager = reviewer.role === 'lab_manager';
    if (!isLabManager && equipmentItem.teamId && equipmentItem.teamId !== reviewer.teamId) {
      throw new ForbiddenException({
        code: 'DISPOSAL_TEAM_SCOPE_ONLY',
        message: 'Can only review equipment from the same team.',
      });
    }

    // 5. 트랜잭션: 검토 처리 (CAS: version 검증)
    await this.db.transaction(async (tx) => {
      if (reviewDto.decision === 'approve') {
        // 승인: reviewStatus를 'reviewed'로 변경
        const [updated] = await tx
          .update(disposalRequests)
          .set({
            reviewStatus: DRVal.REVIEWED,
            reviewedBy,
            reviewedAt: new Date(),
            reviewOpinion: reviewDto.opinion,
            version: sql`version + 1`,
            updatedAt: new Date(),
          } as Record<string, unknown>)
          .where(
            and(
              eq(disposalRequests.id, request.id),
              eq(disposalRequests.version, reviewDto.version)
            )
          )
          .returning();

        if (!updated) {
          throw new ConflictException({
            message: '다른 사용자가 이미 수정했습니다. 페이지를 새로고침하세요.',
            code: 'VERSION_CONFLICT',
          });
        }
      } else {
        // 반려: reviewStatus를 'rejected'로 변경하고 장비 상태를 'available'로 원복
        const [updated] = await tx
          .update(disposalRequests)
          .set({
            reviewStatus: DRVal.REJECTED,
            rejectedBy: reviewedBy,
            rejectedAt: new Date(),
            rejectionReason: reviewDto.opinion,
            rejectionStep: 'review',
            version: sql`version + 1`,
            updatedAt: new Date(),
          } as Record<string, unknown>)
          .where(
            and(
              eq(disposalRequests.id, request.id),
              eq(disposalRequests.version, reviewDto.version)
            )
          )
          .returning();

        if (!updated) {
          throw new ConflictException({
            message: '다른 사용자가 이미 수정했습니다. 페이지를 새로고침하세요.',
            code: 'VERSION_CONFLICT',
          });
        }

        // 장비 상태 원복
        await tx
          .update(equipment)
          .set({
            status: ESVal.AVAILABLE,
            updatedAt: new Date(),
          })
          .where(eq(equipment.id, equipmentId));
      }
    });

    // 6. 반려 시에만 캐시 무효화 (장비 상태 변경됨)
    if (reviewDto.decision === 'reject') {
      await this.invalidateEquipmentCache();
    }

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
  ): Promise<{
    id: string;
    createdAt: Date;
    updatedAt: Date;
    requestedBy: string;
    approvedBy: string | null;
    reason: string;
    approvedAt: Date | null;
    rejectionReason: string | null;
    equipmentId: string;
    requestedAt: Date;
    reviewedBy: string | null;
    reviewedAt: Date | null;
    rejectedBy: string | null;
    rejectedAt: Date | null;
    reasonDetail: string;
    reviewStatus: string;
    reviewOpinion: string | null;
    approvalComment: string | null;
    rejectionStep: string | null;
    equipment: {
      repairHistory: string | null;
      id: string;
      name: string;
      managementNumber: string;
      siteCode: string | null;
      classificationCode: string | null;
      managementSerialNumber: number | null;
      assetNumber: string | null;
      modelName: string | null;
      manufacturer: string | null;
      manufacturerContact: string | null;
      serialNumber: string | null;
      description: string | null;
      location: string | null;
      specMatch: string | null;
      calibrationRequired: string | null;
      initialLocation: string | null;
      installationDate: Date | null;
      calibrationCycle: number | null;
      lastCalibrationDate: Date | null;
      nextCalibrationDate: Date | null;
      calibrationAgency: string | null;
      needsIntermediateCheck: boolean | null;
      calibrationMethod: string | null;
      lastIntermediateCheckDate: Date | null;
      intermediateCheckCycle: number | null;
      nextIntermediateCheckDate: Date | null;
      site: string;
      createdAt: Date | null;
      updatedAt: Date | null;
      teamId: string | null;
      managerId: string | null;
      purchaseDate: Date | null;
      price: number | null;
      supplier: string | null;
      contactInfo: string | null;
      softwareVersion: string | null;
      firmwareVersion: string | null;
      softwareName: string | null;
      softwareType: string | null;
      manualLocation: string | null;
      accessories: string | null;
      mainFeatures: string | null;
      technicalManager: string | null;
      status: string;
      isActive: boolean | null;
      approvalStatus: string | null;
      requestedBy: string | null;
      approvedBy: string | null;
      equipmentType: string | null;
      calibrationResult: string | null;
      correctionFactor: string | null;
      intermediateCheckSchedule: Date | null;
      isShared: boolean;
      sharedSource: string | null;
      owner: string | null;
      externalIdentifier: string | null;
      usagePeriodStart: Date | null;
      usagePeriodEnd: Date | null;
    };
    requester: {
      id: string;
      name: string;
      location: string | null;
      site: string | null;
      createdAt: Date;
      updatedAt: Date;
      teamId: string | null;
      email: string;
      role: string;
      azureAdId: string | null;
      position: string | null;
    };
    approver: {
      id: string;
      name: string;
      location: string | null;
      site: string | null;
      createdAt: Date;
      updatedAt: Date;
      teamId: string | null;
      email: string;
      role: string;
      azureAdId: string | null;
      position: string | null;
    } | null;
    reviewer: {
      id: string;
      name: string;
      location: string | null;
      site: string | null;
      createdAt: Date;
      updatedAt: Date;
      teamId: string | null;
      email: string;
      role: string;
      azureAdId: string | null;
      position: string | null;
    } | null;
    rejector: {
      id: string;
      name: string;
      location: string | null;
      site: string | null;
      createdAt: Date;
      updatedAt: Date;
      teamId: string | null;
      email: string;
      role: string;
      azureAdId: string | null;
      position: string | null;
    } | null;
  } | null> {
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

    // 2. 트랜잭션: 승인 처리 (CAS: version 검증)
    await this.db.transaction(async (tx) => {
      if (approveDto.decision === 'approve') {
        // 승인: reviewStatus를 'approved'로 변경하고 장비 상태를 'disposed'로 변경
        const [updated] = await tx
          .update(disposalRequests)
          .set({
            reviewStatus: DRVal.APPROVED,
            approvedBy,
            approvedAt: new Date(),
            approvalComment: approveDto.comment || null,
            version: sql`version + 1`,
            updatedAt: new Date(),
          } as Record<string, unknown>)
          .where(
            and(
              eq(disposalRequests.id, request.id),
              eq(disposalRequests.version, approveDto.version)
            )
          )
          .returning();

        if (!updated) {
          throw new ConflictException({
            message: '다른 사용자가 이미 수정했습니다. 페이지를 새로고침하세요.',
            code: 'VERSION_CONFLICT',
          });
        }

        // 장비 상태를 'disposed'로 변경
        await tx
          .update(equipment)
          .set({
            status: ESVal.DISPOSED,
            updatedAt: new Date(),
          })
          .where(eq(equipment.id, equipmentId));
      } else {
        // 반려: reviewStatus를 'rejected'로 변경하고 장비 상태를 'available'로 원복
        const [updated] = await tx
          .update(disposalRequests)
          .set({
            reviewStatus: DRVal.REJECTED,
            rejectedBy: approvedBy,
            rejectedAt: new Date(),
            rejectionReason: approveDto.comment || '승인 단계에서 반려',
            rejectionStep: 'approval',
            version: sql`version + 1`,
            updatedAt: new Date(),
          } as Record<string, unknown>)
          .where(
            and(
              eq(disposalRequests.id, request.id),
              eq(disposalRequests.version, approveDto.version)
            )
          )
          .returning();

        if (!updated) {
          throw new ConflictException({
            message: '다른 사용자가 이미 수정했습니다. 페이지를 새로고침하세요.',
            code: 'VERSION_CONFLICT',
          });
        }

        // 장비 상태 원복
        await tx
          .update(equipment)
          .set({
            status: ESVal.AVAILABLE,
            updatedAt: new Date(),
          })
          .where(eq(equipment.id, equipmentId));
      }
    });

    // 3. 캐시 무효화 (장비 상태가 변경됨)
    await this.invalidateEquipmentCache();

    this.logger.log(
      `폐기 최종 승인 완료: requestId=${request.id}, decision=${approveDto.decision}, approvedBy=${approvedBy}`
    );

    // 📢 알림 이벤트 발행 (폐기 최종 승인/반려)
    if (approveDto.decision === 'approve') {
      this.eventEmitter.emit(NOTIFICATION_EVENTS.DISPOSAL_APPROVED, {
        disposalId: request.id,
        equipmentId,
        equipmentName: '',
        managementNumber: '',
        requesterId: request.requestedBy,
        requesterTeamId: '',
        site: '',
        actorId: approvedBy,
        actorName: '',
        timestamp: new Date(),
      });
    } else {
      this.eventEmitter.emit(NOTIFICATION_EVENTS.DISPOSAL_REJECTED, {
        disposalId: request.id,
        equipmentId,
        equipmentName: '',
        managementNumber: '',
        requesterId: request.requestedBy,
        requesterTeamId: '',
        site: '',
        reason: approveDto.comment ?? '',
        rejectionStep: 'approval',
        actorId: approvedBy,
        actorName: '',
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

    // 3. 트랜잭션: 요청 삭제 + 장비 상태 원복
    await this.db.transaction(async (tx) => {
      // 폐기 요청 삭제
      await tx.delete(disposalRequests).where(eq(disposalRequests.id, request.id));

      // 장비 상태 원복 (available)
      await tx
        .update(equipment)
        .set({
          status: ESVal.AVAILABLE,
          updatedAt: new Date(),
        })
        .where(eq(equipment.id, equipmentId));
    });

    // 4. 캐시 무효화 (장비 상태가 변경됨)
    await this.invalidateEquipmentCache();

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
  async getCurrentDisposalRequest(equipmentId: string): Promise<{
    id: string;
    createdAt: Date;
    updatedAt: Date;
    requestedBy: string;
    approvedBy: string | null;
    reason: string;
    approvedAt: Date | null;
    rejectionReason: string | null;
    equipmentId: string;
    requestedAt: Date;
    reviewedBy: string | null;
    reviewedAt: Date | null;
    rejectedBy: string | null;
    rejectedAt: Date | null;
    reasonDetail: string;
    reviewStatus: string;
    reviewOpinion: string | null;
    approvalComment: string | null;
    rejectionStep: string | null;
    equipment: {
      repairHistory: string | null;
      id: string;
      name: string;
      managementNumber: string;
      siteCode: string | null;
      classificationCode: string | null;
      managementSerialNumber: number | null;
      assetNumber: string | null;
      modelName: string | null;
      manufacturer: string | null;
      manufacturerContact: string | null;
      serialNumber: string | null;
      description: string | null;
      location: string | null;
      specMatch: string | null;
      calibrationRequired: string | null;
      initialLocation: string | null;
      installationDate: Date | null;
      calibrationCycle: number | null;
      lastCalibrationDate: Date | null;
      nextCalibrationDate: Date | null;
      calibrationAgency: string | null;
      needsIntermediateCheck: boolean | null;
      calibrationMethod: string | null;
      lastIntermediateCheckDate: Date | null;
      intermediateCheckCycle: number | null;
      nextIntermediateCheckDate: Date | null;
      site: string;
      createdAt: Date | null;
      updatedAt: Date | null;
      teamId: string | null;
      managerId: string | null;
      purchaseDate: Date | null;
      price: number | null;
      supplier: string | null;
      contactInfo: string | null;
      softwareVersion: string | null;
      firmwareVersion: string | null;
      softwareName: string | null;
      softwareType: string | null;
      manualLocation: string | null;
      accessories: string | null;
      mainFeatures: string | null;
      technicalManager: string | null;
      status: string;
      isActive: boolean | null;
      approvalStatus: string | null;
      requestedBy: string | null;
      approvedBy: string | null;
      equipmentType: string | null;
      calibrationResult: string | null;
      correctionFactor: string | null;
      intermediateCheckSchedule: Date | null;
      isShared: boolean;
      sharedSource: string | null;
      owner: string | null;
      externalIdentifier: string | null;
      usagePeriodStart: Date | null;
      usagePeriodEnd: Date | null;
    };
    requester: {
      id: string;
      name: string;
      location: string | null;
      site: string | null;
      createdAt: Date;
      updatedAt: Date;
      teamId: string | null;
      email: string;
      role: string;
      azureAdId: string | null;
      position: string | null;
    };
    approver: {
      id: string;
      name: string;
      location: string | null;
      site: string | null;
      createdAt: Date;
      updatedAt: Date;
      teamId: string | null;
      email: string;
      role: string;
      azureAdId: string | null;
      position: string | null;
    } | null;
    reviewer: {
      id: string;
      name: string;
      location: string | null;
      site: string | null;
      createdAt: Date;
      updatedAt: Date;
      teamId: string | null;
      email: string;
      role: string;
      azureAdId: string | null;
      position: string | null;
    } | null;
    rejector: {
      id: string;
      name: string;
      location: string | null;
      site: string | null;
      createdAt: Date;
      updatedAt: Date;
      teamId: string | null;
      email: string;
      role: string;
      azureAdId: string | null;
      position: string | null;
    } | null;
  } | null> {
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
  async getPendingReviewRequests(userId: string): Promise<unknown[]> {
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

    // 2. lab_manager는 모든 요청 조회, technical_manager는 같은 팀만 조회
    const isLabManager = currentUser.role === 'lab_manager';

    const requests = await this.db.query.disposalRequests.findMany({
      where: eq(disposalRequests.reviewStatus, DRVal.PENDING),
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

    // 3. lab_manager가 아니면 같은 팀 장비만 필터링
    if (!isLabManager && currentUser.teamId) {
      return requests.filter((request) => request.equipment.teamId === currentUser.teamId);
    }

    return requests;
  }

  /**
   * 최종 승인 대기 중인 폐기 요청 목록 조회 (시험소장용)
   * reviewStatus='reviewed'인 요청들을 최신순으로 반환
   */
  async getPendingApprovalRequests(): Promise<unknown[]> {
    const requests = await this.db.query.disposalRequests.findMany({
      where: eq(disposalRequests.reviewStatus, DRVal.REVIEWED),
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
        reviewer: {
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
  private async invalidateEquipmentCache(): Promise<void> {
    try {
      await this.cacheService.deleteByPattern(this.CACHE_PREFIX + '*');
      this.logger.log('장비 캐시 무효화 완료');
    } catch (error) {
      this.logger.error('장비 캐시 무효화 실패:', error);
      // 캐시 무효화 실패는 치명적이지 않으므로 계속 진행
    }
  }
}

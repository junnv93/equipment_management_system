import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  ConflictException,
  Logger,
  Inject,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { eq, and, desc, inArray, sql } from 'drizzle-orm';
import {
  equipmentRequests,
  equipmentAttachments,
  equipment,
  users,
} from '@equipment-management/db/schema';
import { UserRoleValues, ApprovalStatusValues } from '@equipment-management/schemas';
import { DASHBOARD_ITEM_LIMIT } from '@equipment-management/shared-constants';
import { SimpleCacheService } from '../../../common/cache/simple-cache.service';
import { CACHE_KEY_PREFIXES } from '../../../common/cache/cache-key-prefixes';
import type { AppDatabase } from '@equipment-management/db';
import { EquipmentService } from '../equipment.service';
import type { CreateEquipmentDto } from '../dto/create-equipment.dto';
import type { UpdateEquipmentDto } from '../dto/update-equipment.dto';
import { NOTIFICATION_EVENTS } from '../../notifications/events/notification-events';
import {
  serializeRequestData,
  deserializeRequestData,
  parseRequestDataForDisplay,
} from '../utils/request-data-codec';
import type { EquipmentRequest } from '@equipment-management/db/schema/equipment-requests';
import type { EquipmentAttachment } from '@equipment-management/db/schema/equipment-attachments';
import type {
  users as UsersTable,
  equipment as EquipmentTable,
} from '@equipment-management/db/schema';

// 관계 타입 정의 (Drizzle query with relations)
type UserSelect = typeof UsersTable.$inferSelect;
type EquipmentSelect = typeof EquipmentTable.$inferSelect;

/**
 * 장비 승인 서비스
 * 장비 등록/수정/삭제 승인 프로세스를 관리합니다.
 */
@Injectable()
export class EquipmentApprovalService {
  private readonly logger = new Logger(EquipmentApprovalService.name);

  constructor(
    @Inject('DRIZZLE_INSTANCE')
    private readonly db: AppDatabase,
    private readonly equipmentService: EquipmentService,
    private readonly eventEmitter: EventEmitter2,
    private readonly cacheService: SimpleCacheService
  ) {}

  /**
   * 장비 등록 요청 생성
   */
  async createEquipmentRequest(
    createDto: CreateEquipmentDto,
    requestedBy: string,
    attachmentUuids?: string[]
  ): Promise<EquipmentRequest> {
    try {
      // 사용자 존재 여부 확인 (외래 키 제약 조건 — JWT 인증 통과 시 반드시 존재해야 함)
      const user = await this.db.query.users.findFirst({
        where: eq(users.id, requestedBy),
      });

      if (!user) {
        throw new NotFoundException({
          code: 'USER_NOT_FOUND',
          message: `User ${requestedBy} not found. Authenticated users must exist in the database.`,
        });
      }

      // 요청 생성 (id는 자동 생성됨)
      const [request] = await this.db
        .insert(equipmentRequests)
        .values({
          requestType: 'create',
          requestedBy,
          approvalStatus: ApprovalStatusValues.PENDING_APPROVAL,
          requestData: serializeRequestData(createDto as unknown as Record<string, unknown>),
        })
        .returning();

      // 첨부 파일 연결 (요청 ID 업데이트) — 단일 배치 UPDATE
      if (attachmentUuids && attachmentUuids.length > 0) {
        await this.db
          .update(equipmentAttachments)
          .set({ requestId: request.id })
          .where(inArray(equipmentAttachments.id, attachmentUuids));
      }

      // 📢 알림 이벤트 발행
      this.eventEmitter.emit(NOTIFICATION_EVENTS.EQUIPMENT_REQUEST_CREATED, {
        requestId: request.id,
        equipmentId: '',
        equipmentName: createDto.name || '신규 장비',
        managementNumber: createDto.managementNumber || '',
        requesterId: requestedBy,
        requesterTeamId: user.teamId ?? '',
        actorId: requestedBy,
        actorName: user.name ?? '',
        timestamp: new Date(),
      });

      this.logger.log(`Equipment create request created: ${request.id}`);
      return request;
    } catch (error) {
      this.logger.error(`Failed to create equipment request`, error);
      throw new BadRequestException({
        code: 'EQUIPMENT_REQUEST_CREATE_FAILED',
        message: 'Failed to create equipment registration request.',
      });
    }
  }

  /**
   * 장비 수정 요청 생성
   */
  async updateEquipmentRequest(
    equipmentUuid: string,
    updateDto: UpdateEquipmentDto,
    requestedBy: string,
    attachmentUuids?: string[]
  ): Promise<EquipmentRequest> {
    try {
      // 기존 장비 조회
      const existingEquipment = await this.equipmentService.findOne(equipmentUuid);
      if (!existingEquipment) {
        throw new NotFoundException({
          code: 'EQUIPMENT_NOT_FOUND',
          message: 'Equipment not found.',
        });
      }

      // 사용자 존재 여부 확인 (JWT 인증 통과 시 반드시 존재해야 함)
      const user = await this.db.query.users.findFirst({
        where: eq(users.id, requestedBy),
      });

      if (!user) {
        throw new NotFoundException({
          code: 'USER_NOT_FOUND',
          message: `User ${requestedBy} not found. Authenticated users must exist in the database.`,
        });
      }

      // 요청 생성
      const [request] = await this.db
        .insert(equipmentRequests)
        .values({
          requestType: 'update',
          equipmentId: existingEquipment.id,
          requestedBy,
          approvalStatus: ApprovalStatusValues.PENDING_APPROVAL,
          requestData: serializeRequestData(updateDto as unknown as Record<string, unknown>),
        })
        .returning();

      // 첨부 파일 연결 — 단일 배치 UPDATE (createEquipmentRequest와 동일 패턴)
      if (attachmentUuids && attachmentUuids.length > 0) {
        await this.db
          .update(equipmentAttachments)
          .set({ requestId: request.id })
          .where(inArray(equipmentAttachments.id, attachmentUuids));
      }

      this.logger.log(`Equipment update request created: ${request.id}`);
      return request;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Failed to create equipment update request: ${error}`);
      throw new BadRequestException({
        code: 'EQUIPMENT_REQUEST_UPDATE_FAILED',
        message: 'Failed to create equipment update request.',
      });
    }
  }

  /**
   * 장비 삭제 요청 생성
   */
  async deleteEquipmentRequest(
    equipmentUuid: string,
    requestedBy: string
  ): Promise<EquipmentRequest> {
    try {
      // 기존 장비 조회
      const existingEquipment = await this.equipmentService.findOne(equipmentUuid);
      if (!existingEquipment) {
        throw new NotFoundException({
          code: 'EQUIPMENT_NOT_FOUND',
          message: 'Equipment not found.',
        });
      }

      // 사용자 존재 여부 확인 (JWT 인증 통과 시 반드시 존재해야 함)
      const user = await this.db.query.users.findFirst({
        where: eq(users.id, requestedBy),
      });

      if (!user) {
        throw new NotFoundException({
          code: 'USER_NOT_FOUND',
          message: `User ${requestedBy} not found. Authenticated users must exist in the database.`,
        });
      }

      // 요청 생성
      const [request] = await this.db
        .insert(equipmentRequests)
        .values({
          requestType: 'delete',
          equipmentId: existingEquipment.id,
          requestedBy,
          approvalStatus: ApprovalStatusValues.PENDING_APPROVAL,
        })
        .returning();

      this.logger.log(`Equipment delete request created: ${request.id}`);
      return request;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Failed to create equipment delete request: ${error}`);
      throw new BadRequestException({
        code: 'EQUIPMENT_REQUEST_DELETE_FAILED',
        message: 'Failed to create equipment delete request.',
      });
    }
  }

  /**
   * 승인 대기 요청 목록 조회
   */
  async findPendingRequests(
    userRoles: string[],
    _userSite?: string,
    userTeamId?: string
  ): Promise<EquipmentRequest[]> {
    try {
      // 기술책임자 또는 관리자만 승인 대기 목록 조회 가능
      const isLabManager = userRoles.includes(UserRoleValues.LAB_MANAGER);
      const canViewAll = userRoles.includes(UserRoleValues.TECHNICAL_MANAGER) || isLabManager;

      if (!canViewAll) {
        throw new ForbiddenException({
          code: 'EQUIPMENT_REQUEST_NO_VIEW_PERMISSION',
          message: 'No permission to view pending approval list.',
        });
      }

      const requests = await this.db.query.equipmentRequests.findMany({
        where: eq(equipmentRequests.approvalStatus, ApprovalStatusValues.PENDING_APPROVAL),
        orderBy: [desc(equipmentRequests.requestedAt)],
        limit: DASHBOARD_ITEM_LIMIT,
        with: {
          requester: {
            with: {
              team: true,
            },
          },
          equipment: true,
        },
      });

      // technical_manager: 같은 팀 요청자의 대기 건만 반환
      if (!isLabManager && userTeamId) {
        return requests.filter((r) => {
          const requester = (r as EquipmentRequest & { requester?: UserSelect | null }).requester;
          return requester?.teamId === userTeamId;
        });
      }

      return requests;
    } catch (error) {
      if (error instanceof ForbiddenException) {
        throw error;
      }
      this.logger.error(`Failed to find pending requests: ${error}`);
      throw new BadRequestException({
        code: 'EQUIPMENT_REQUEST_LIST_FAILED',
        message: 'Failed to fetch pending approval list.',
      });
    }
  }

  /**
   * equipmentId 필수 검증 (update/delete 요청에서 사용)
   */
  private requireEquipmentId(equipmentId: string | null): string {
    if (!equipmentId) {
      throw new BadRequestException({
        code: 'EQUIPMENT_REQUEST_NO_EQUIPMENT_ID',
        message: 'Equipment ID is missing.',
      });
    }
    return equipmentId;
  }

  /**
   * 요청 상세 조회
   */
  async findRequestByUuid(requestUuid: string): Promise<
    EquipmentRequest & {
      requester?: UserSelect | null;
      approver?: UserSelect | null;
      equipment?: EquipmentSelect | null;
      attachments?: EquipmentAttachment[];
    }
  > {
    try {
      const request = await this.db.query.equipmentRequests.findFirst({
        where: eq(equipmentRequests.id, requestUuid),
        with: {
          requester: true,
          approver: true,
          equipment: true,
        },
      });

      if (!request) {
        throw new NotFoundException({
          code: 'EQUIPMENT_REQUEST_NOT_FOUND',
          message: 'Equipment request not found.',
        });
      }

      // 첨부 파일 조회 (테이블 미생성 시에도 승인 플로우 차단 방지)
      let attachments: EquipmentAttachment[] = [];
      try {
        attachments = await this.db.query.equipmentAttachments.findMany({
          where: eq(equipmentAttachments.requestId, request.id),
        });
      } catch (attachmentError) {
        this.logger.warn(`첨부 파일 조회 실패 (승인 플로우에 영향 없음): ${attachmentError}`);
      }

      return {
        ...request,
        attachments,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Failed to find request: ${error}`);
      throw new BadRequestException({
        code: 'EQUIPMENT_REQUEST_FETCH_FAILED',
        message: 'Failed to fetch equipment request.',
      });
    }
  }

  /**
   * 요청 승인
   */
  async approveRequest(
    requestUuid: string,
    approvedBy: string,
    userRoles: string[],
    expectedVersion: number
  ): Promise<EquipmentRequest> {
    try {
      // 권한 확인: 기술책임자 또는 관리자만 승인 가능
      const canApprove =
        userRoles.includes(UserRoleValues.TECHNICAL_MANAGER) ||
        userRoles.includes(UserRoleValues.LAB_MANAGER);

      if (!canApprove) {
        throw new ForbiddenException({
          code: 'EQUIPMENT_REQUEST_NO_APPROVE_PERMISSION',
          message: 'No permission to approve this request.',
        });
      }

      // 요청 조회
      const request = await this.findRequestByUuid(requestUuid);

      // 이미 처리된 요청인지 확인
      if (request.approvalStatus !== ApprovalStatusValues.PENDING_APPROVAL) {
        throw new BadRequestException({
          code: 'EQUIPMENT_REQUEST_ALREADY_PROCESSED',
          message: 'This request has already been processed.',
        });
      }

      // 승인자 존재 여부 확인 (JWT 인증 통과 시 반드시 존재해야 함)
      const approver = await this.db.query.users.findFirst({
        where: eq(users.id, approvedBy),
      });

      if (!approver) {
        throw new NotFoundException({
          code: 'USER_NOT_FOUND',
          message: `Approver ${approvedBy} not found. Authenticated users must exist in the database.`,
        });
      }

      // CAS 선점: 요청 상태를 먼저 업데이트하여 동시 승인 방지
      // 장비 작업보다 CAS를 먼저 실행해야 중복 장비 생성/수정/삭제를 방지할 수 있음
      const [updated] = await this.db
        .update(equipmentRequests)
        .set({
          approvalStatus: ApprovalStatusValues.APPROVED,
          approvedBy,
          approvedAt: new Date(),
          version: sql`version + 1`,
        } as Record<string, unknown>)
        .where(
          and(eq(equipmentRequests.id, requestUuid), eq(equipmentRequests.version, expectedVersion))
        )
        .returning();

      if (!updated) {
        this.cacheService.deleteByPattern(`${CACHE_KEY_PREFIXES.APPROVALS}*`);
        throw new ConflictException({
          code: 'VERSION_CONFLICT',
          message: 'The request has been modified by another user. Please refresh and try again.',
        });
      }

      // CAS 선점 성공 → 요청 타입에 따라 장비 작업 실행
      if (request.requestType === 'create') {
        const requestData = deserializeRequestData('create', request.requestData);
        await this.equipmentService.create(requestData);
      } else if (request.requestType === 'update') {
        const equipmentData = this.requireEquipmentId(request.equipmentId);
        const currentEquipment = await this.db.query.equipment.findFirst({
          where: eq(equipment.id, equipmentData),
        });
        if (!currentEquipment) {
          throw new NotFoundException({
            code: 'EQUIPMENT_NOT_FOUND',
            message: 'Equipment not found.',
          });
        }
        const requestData = deserializeRequestData('update', request.requestData);
        // CAS: 요청 생성 시의 version은 stale → 현재 DB version으로 교체
        requestData.version = currentEquipment.version;
        await this.equipmentService.update(currentEquipment.id, requestData);
      } else if (request.requestType === 'delete') {
        const equipmentId = this.requireEquipmentId(request.equipmentId);
        const currentEquipment = await this.db.query.equipment.findFirst({
          where: eq(equipment.id, equipmentId),
        });
        if (!currentEquipment) {
          throw new NotFoundException({
            code: 'EQUIPMENT_NOT_FOUND',
            message: 'Equipment not found.',
          });
        }
        await this.equipmentService.remove(currentEquipment.id);
      }

      // 📢 알림 이벤트 발행
      const displayData = parseRequestDataForDisplay(request.requestData);
      this.eventEmitter.emit(NOTIFICATION_EVENTS.EQUIPMENT_REQUEST_APPROVED, {
        requestId: requestUuid,
        equipmentId: request.equipmentId ?? '',
        equipmentName: displayData.name || 'Equipment',
        managementNumber: displayData.managementNumber || '',
        requesterId: request.requestedBy,
        requesterTeamId: '',
        actorId: approvedBy,
        actorName: '',
        timestamp: new Date(),
      });

      this.cacheService.deleteByPattern(`${CACHE_KEY_PREFIXES.APPROVALS}*`);
      this.logger.log(`Request approved: ${requestUuid}`);
      return updated;
    } catch (error) {
      if (
        error instanceof ForbiddenException ||
        error instanceof NotFoundException ||
        error instanceof BadRequestException ||
        error instanceof ConflictException
      ) {
        throw error;
      }
      this.logger.error(`Failed to approve request: ${error}`);
      throw new BadRequestException({
        code: 'EQUIPMENT_REQUEST_APPROVE_FAILED',
        message: 'Failed to approve equipment request.',
      });
    }
  }

  /**
   * 요청 반려
   */
  async rejectRequest(
    requestUuid: string,
    approvedBy: string,
    rejectionReason: string,
    userRoles: string[],
    expectedVersion: number
  ): Promise<EquipmentRequest> {
    try {
      // 권한 확인
      const canReject =
        userRoles.includes(UserRoleValues.TECHNICAL_MANAGER) ||
        userRoles.includes(UserRoleValues.LAB_MANAGER);

      if (!canReject) {
        throw new ForbiddenException({
          code: 'EQUIPMENT_REQUEST_NO_REJECT_PERMISSION',
          message: 'No permission to reject this request.',
        });
      }

      // 반려 사유 필수
      if (!rejectionReason || rejectionReason.trim().length === 0) {
        throw new BadRequestException({
          code: 'EQUIPMENT_REQUEST_REJECTION_REASON_REQUIRED',
          message: 'Rejection reason is required.',
        });
      }

      // 요청 조회
      const request = await this.findRequestByUuid(requestUuid);

      // 이미 처리된 요청인지 확인
      if (request.approvalStatus !== ApprovalStatusValues.PENDING_APPROVAL) {
        throw new BadRequestException({
          code: 'EQUIPMENT_REQUEST_ALREADY_PROCESSED',
          message: 'This request has already been processed.',
        });
      }

      // 승인자 존재 여부 확인 (JWT 인증 통과 시 반드시 존재해야 함)
      const approver = await this.db.query.users.findFirst({
        where: eq(users.id, approvedBy),
      });

      if (!approver) {
        throw new NotFoundException({
          code: 'USER_NOT_FOUND',
          message: `Approver ${approvedBy} not found. Authenticated users must exist in the database.`,
        });
      }

      // 요청 상태 업데이트 (CAS: version 체크로 동시 수정 방지)
      const [updated] = await this.db
        .update(equipmentRequests)
        .set({
          approvalStatus: ApprovalStatusValues.REJECTED,
          approvedBy,
          approvedAt: new Date(),
          rejectionReason,
          version: sql`version + 1`,
        } as Record<string, unknown>)
        .where(
          and(eq(equipmentRequests.id, requestUuid), eq(equipmentRequests.version, expectedVersion))
        )
        .returning();

      if (!updated) {
        this.cacheService.deleteByPattern(`${CACHE_KEY_PREFIXES.APPROVALS}*`);
        throw new ConflictException({
          code: 'VERSION_CONFLICT',
          message: 'The request has been modified by another user. Please refresh and try again.',
        });
      }

      // 📢 알림 이벤트 발행
      const rejectDisplayData = parseRequestDataForDisplay(request.requestData);
      this.eventEmitter.emit(NOTIFICATION_EVENTS.EQUIPMENT_REQUEST_REJECTED, {
        requestId: requestUuid,
        equipmentId: request.equipmentId ?? '',
        equipmentName: rejectDisplayData.name || 'Equipment',
        managementNumber: rejectDisplayData.managementNumber || '',
        requesterId: request.requestedBy,
        requesterTeamId: '',
        reason: rejectionReason,
        actorId: approvedBy,
        actorName: '',
        timestamp: new Date(),
      });

      this.cacheService.deleteByPattern(`${CACHE_KEY_PREFIXES.APPROVALS}*`);
      this.logger.log(`Request rejected: ${requestUuid}`);
      return updated;
    } catch (error) {
      if (
        error instanceof ForbiddenException ||
        error instanceof NotFoundException ||
        error instanceof BadRequestException ||
        error instanceof ConflictException
      ) {
        throw error;
      }
      this.logger.error(`Failed to reject request: ${error}`);
      throw new BadRequestException({
        code: 'EQUIPMENT_REQUEST_REJECT_FAILED',
        message: 'Failed to reject equipment request.',
      });
    }
  }
}

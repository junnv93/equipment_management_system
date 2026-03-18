import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Inject,
  Logger,
  forwardRef,
  ConflictException,
} from '@nestjs/common';
import { eq, and, desc, sql, SQL, or } from 'drizzle-orm';
import type { AppDatabase } from '@equipment-management/db';
import { VersionedBaseService } from '../../common/base/versioned-base.service';
import { SimpleCacheService } from '../../common/cache/simple-cache.service';
import { CACHE_KEY_PREFIXES } from '../../common/cache/cache-key-prefixes';
import * as schema from '@equipment-management/db/schema';
import { equipmentImports } from '@equipment-management/db/schema/equipment-imports';
import { equipment } from '@equipment-management/db/schema/equipment';
import {
  EquipmentImportStatus,
  EquipmentImportStatusValues as EIVal,
  EquipmentStatusValues as ESVal,
  generateTemporaryManagementNumber,
  SITE_TO_CODE,
  TEMPORARY_EQUIPMENT_PREFIX,
  type Classification,
  type EquipmentStatus,
  type Site,
} from '@equipment-management/schemas';
import { CreateEquipmentImportInput } from './dto/create-equipment-import.dto';
import { ApproveEquipmentImportDto } from './dto/approve-equipment-import.dto';
import { RejectEquipmentImportDto } from './dto/reject-equipment-import.dto';
import { ReceiveEquipmentImportDto } from './dto/receive-equipment-import.dto';
import { EquipmentImportQueryDto } from './dto/equipment-import-query.dto';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { EquipmentService } from '../equipment/equipment.service';
import { CheckoutsService } from '../checkouts/checkouts.service';
import { NOTIFICATION_EVENTS } from '../notifications/events/notification-events';
import { calculateNextCalibrationDate } from '../../common/utils';
import {
  isRentalImport,
  getReturnDestination,
  getOwnerName,
  getSharedSource,
  type EquipmentImportListResult,
} from './types/equipment-import.types';
import { likeContains, likeStartsWith, safeIlike } from '../../common/utils/like-escape';

type EquipmentImport = typeof equipmentImports.$inferSelect;

@Injectable()
export class EquipmentImportsService extends VersionedBaseService {
  private readonly logger = new Logger(EquipmentImportsService.name);

  constructor(
    @Inject('DRIZZLE_INSTANCE')
    protected readonly db: AppDatabase,
    private readonly equipmentService: EquipmentService,
    @Inject(forwardRef(() => CheckoutsService))
    private readonly checkoutsService: CheckoutsService,
    private readonly eventEmitter: EventEmitter2,
    private readonly cacheService: SimpleCacheService
  ) {
    super();
  }

  /**
   * 장비 반입 신청 생성 (통합: 렌탈 + 내부 공용)
   *
   * sourceType에 따라 조건부 필드 처리:
   * - rental: vendorName 필수 (Zod에서 validation)
   * - internal_shared: ownerDepartment 필수 (Zod에서 validation)
   */
  async create(
    dto: CreateEquipmentImportInput,
    requesterId: string,
    site: string,
    teamId: string
  ): Promise<EquipmentImport> {
    const usagePeriodStart = new Date(dto.usagePeriodStart);
    const usagePeriodEnd = new Date(dto.usagePeriodEnd);

    if (usagePeriodEnd <= usagePeriodStart) {
      throw new BadRequestException({
        code: 'IMPORT_END_DATE_BEFORE_START',
        message: 'Usage end date must be after the start date.',
      });
    }

    // Discriminated union - TypeScript ensures correct fields based on sourceType
    const baseValues = {
      requesterId,
      site,
      teamId,
      sourceType: dto.sourceType,
      equipmentName: dto.equipmentName,
      modelName: dto.modelName || null,
      manufacturer: dto.manufacturer || null,
      serialNumber: dto.serialNumber || null,
      description: dto.description || null,
      classification: dto.classification,
      usagePeriodStart,
      usagePeriodEnd,
      reason: dto.reason,
      status: EIVal.PENDING as EquipmentImportStatus,
    };

    let values: typeof equipmentImports.$inferInsert;

    if (dto.sourceType === 'rental') {
      values = {
        ...baseValues,
        vendorName: dto.vendorName,
        vendorContact: dto.vendorContact || null,
        externalIdentifier: dto.externalIdentifier || null,
        ownerDepartment: null,
        internalContact: null,
        borrowingJustification: null,
      };
    } else {
      // internal_shared
      values = {
        ...baseValues,
        ownerDepartment: dto.ownerDepartment,
        internalContact: dto.internalContact || null,
        borrowingJustification: dto.borrowingJustification || null,
        vendorName: null,
        vendorContact: null,
        externalIdentifier: null,
      };
    }

    const [created] = await this.db.insert(equipmentImports).values(values).returning();

    this.logger.log(`Equipment import created: ${created.id} (sourceType: ${created.sourceType})`);

    // 📢 알림 이벤트 발행 (장비 반입 신청)
    this.eventEmitter.emit(NOTIFICATION_EVENTS.IMPORT_CREATED, {
      importId: created.id,
      equipmentName: dto.equipmentName,
      managementNumber: '',
      requesterId,
      requesterTeamId: teamId,
      site,
      actorId: requesterId,
      actorName: '',
      timestamp: new Date(),
    });

    return created;
  }

  /**
   * 장비 반입 목록 조회 (sourceType 필터 지원)
   */
  async findAll(query: EquipmentImportQueryDto): Promise<EquipmentImportListResult> {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const offset = (page - 1) * limit;

    const whereConditions: SQL<unknown>[] = [];

    if (query.status) {
      whereConditions.push(eq(equipmentImports.status, query.status));
    }
    if (query.sourceType) {
      whereConditions.push(eq(equipmentImports.sourceType, query.sourceType));
    }
    if (query.site) {
      whereConditions.push(eq(equipmentImports.site, query.site));
    }
    if (query.teamId) {
      whereConditions.push(eq(equipmentImports.teamId, query.teamId));
    }
    if (query.search) {
      const pattern = likeContains(query.search);
      whereConditions.push(
        or(
          safeIlike(equipmentImports.equipmentName, pattern),
          safeIlike(equipmentImports.vendorName, pattern),
          safeIlike(equipmentImports.ownerDepartment, pattern)
        )!
      );
    }

    const whereClause = whereConditions.length > 0 ? and(...whereConditions) : undefined;

    const isAsc = query.sortOrder === 'asc';

    // Use relational query with team data
    const items = await this.db.query.equipmentImports.findMany({
      where: whereClause,
      with: {
        requester: {
          columns: {
            id: true,
            name: true,
            email: true,
          },
          with: {
            team: true, // ← Critical: includes team relation
          },
        },
        team: true,
        approver: {
          columns: {
            id: true,
            name: true,
            email: true,
          },
        },
        receiver: {
          columns: {
            id: true,
            name: true,
            email: true,
          },
        },
        equipment: {
          columns: {
            id: true,
            name: true,
            managementNumber: true,
          },
        },
      },
      orderBy: (imports, { asc: ascFn, desc: descFn }) => {
        const sortBy = query.sortBy;

        if (sortBy === 'usagePeriodStart') {
          return isAsc ? [ascFn(imports.usagePeriodStart)] : [descFn(imports.usagePeriodStart)];
        }
        if (sortBy === 'usagePeriodEnd') {
          return isAsc ? [ascFn(imports.usagePeriodEnd)] : [descFn(imports.usagePeriodEnd)];
        }
        if (sortBy === 'status') {
          return isAsc ? [ascFn(imports.status)] : [descFn(imports.status)];
        }
        // Default: createdAt
        return isAsc ? [ascFn(imports.createdAt)] : [descFn(imports.createdAt)];
      },
      limit,
      offset,
    });

    // Get total count
    const countResult = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(equipmentImports)
      .where(whereClause);

    const totalItems = countResult[0]?.count || 0;

    return {
      items,
      meta: {
        totalItems,
        itemCount: items.length,
        itemsPerPage: limit,
        totalPages: Math.ceil(totalItems / limit),
        currentPage: page,
      },
    };
  }

  /**
   * 장비 반입 상세 조회
   */
  async findOne(id: string): Promise<EquipmentImport> {
    const result = await this.db
      .select()
      .from(equipmentImports)
      .where(eq(equipmentImports.id, id))
      .limit(1);

    if (result.length === 0) {
      throw new NotFoundException({
        code: 'IMPORT_NOT_FOUND',
        message: `Equipment import ${id} not found.`,
      });
    }

    return result[0];
  }

  /**
   * 장비 반입 승인
   * pending → approved
   */
  async approve(
    id: string,
    approverId: string,
    dto: ApproveEquipmentImportDto
  ): Promise<EquipmentImport> {
    const equipmentImport = await this.findOne(id);

    if (equipmentImport.status !== EIVal.PENDING) {
      throw new BadRequestException({
        code: 'IMPORT_ONLY_PENDING_CAN_APPROVE',
        message: 'Only pending import requests can be approved.',
      });
    }

    // ✅ CAS: optimistic locking
    let updated: EquipmentImport;
    try {
      updated = await this.updateWithVersion<EquipmentImport>(
        equipmentImports,
        id,
        dto.version,
        {
          status: EIVal.APPROVED as EquipmentImportStatus,
          approverId,
          approvedAt: new Date(),
        },
        'Equipment import'
      );
    } catch (error) {
      if (error instanceof ConflictException) {
        this.cacheService.deleteByPattern(CACHE_KEY_PREFIXES.EQUIPMENT_IMPORTS + '*');
      }
      throw error;
    }

    this.logger.log(`Equipment import approved: ${id} (sourceType: ${updated.sourceType})`);

    // 📢 알림 이벤트 발행 (장비 반입 승인)
    this.eventEmitter.emit(NOTIFICATION_EVENTS.IMPORT_APPROVED, {
      importId: id,
      equipmentName: updated.equipmentName,
      managementNumber: '',
      requesterId: updated.requesterId,
      requesterTeamId: updated.teamId ?? '',
      site: updated.site ?? '',
      actorId: approverId,
      actorName: '',
      timestamp: new Date(),
    });

    return updated;
  }

  /**
   * 장비 반입 거절
   * pending → rejected
   */
  async reject(
    id: string,
    approverId: string,
    dto: RejectEquipmentImportDto
  ): Promise<EquipmentImport> {
    const equipmentImport = await this.findOne(id);

    if (equipmentImport.status !== EIVal.PENDING) {
      throw new BadRequestException({
        code: 'IMPORT_ONLY_PENDING_CAN_REJECT',
        message: 'Only pending import requests can be rejected.',
      });
    }

    // ✅ CAS: optimistic locking
    let updated: EquipmentImport;
    try {
      updated = await this.updateWithVersion<EquipmentImport>(
        equipmentImports,
        id,
        dto.version,
        {
          status: EIVal.REJECTED as EquipmentImportStatus,
          approverId,
          approvedAt: new Date(),
          rejectionReason: dto.rejectionReason,
        },
        'Equipment import'
      );
    } catch (error) {
      if (error instanceof ConflictException) {
        this.cacheService.deleteByPattern(CACHE_KEY_PREFIXES.EQUIPMENT_IMPORTS + '*');
      }
      throw error;
    }

    // 📢 알림 이벤트 발행 (장비 반입 거절)
    this.eventEmitter.emit(NOTIFICATION_EVENTS.IMPORT_REJECTED, {
      importId: id,
      equipmentName: updated.equipmentName,
      managementNumber: '',
      requesterId: updated.requesterId,
      requesterTeamId: updated.teamId ?? '',
      site: updated.site ?? '',
      reason: dto.rejectionReason,
      actorId: approverId,
      actorName: '',
      timestamp: new Date(),
    });

    return updated;
  }

  /**
   * 수령 확인 + 장비 자동 등록
   * approved → received
   *
   * 핵심 로직 (sourceType 기반):
   * 1. TEMP-XXX 관리번호 생성
   * 2. 장비 자동 생성:
   *    - rental: sharedSource='external', owner=vendorName
   *    - internal_shared: sharedSource='internal_shared', owner=ownerDepartment
   * 3. equipment_imports.equipmentId 연결
   */
  async receive(
    id: string,
    receivedBy: string,
    dto: ReceiveEquipmentImportDto
  ): Promise<EquipmentImport> {
    const equipmentImport = await this.findOne(id);

    if (equipmentImport.status !== EIVal.APPROVED) {
      throw new BadRequestException({
        code: 'IMPORT_ONLY_APPROVED_CAN_RECEIVE',
        message: 'Only approved import requests can be received.',
      });
    }

    // TEMP 관리번호 생성 (중복 시 retry)
    const managementNumber = await this.generateUniqueTemporaryNumber(
      equipmentImport.site as Site,
      equipmentImport.classification as Classification
    );

    // 다음 교정일 자동 계산 — SSOT 유틸리티 사용
    let nextCalibrationDate: Date | null = null;
    if (
      dto.calibrationInfo?.calibrationMethod === 'external_calibration' &&
      dto.calibrationInfo.calibrationCycle &&
      dto.calibrationInfo.lastCalibrationDate
    ) {
      nextCalibrationDate =
        calculateNextCalibrationDate(
          dto.calibrationInfo.lastCalibrationDate,
          dto.calibrationInfo.calibrationCycle
        ) ?? null;
    }

    // sourceType 기반 동적 필드 결정
    const sharedSource = getSharedSource(equipmentImport);
    const owner = getOwnerName(equipmentImport);
    const externalIdentifier = isRentalImport(equipmentImport)
      ? equipmentImport.externalIdentifier
      : null;

    this.logger.log(
      `Receiving equipment import: ${id} (sourceType: ${equipmentImport.sourceType}, sharedSource: ${sharedSource}, owner: ${owner})`
    );

    // 장비 생성 + 반입 상태 업데이트 — 원자성 보장
    let updated: typeof equipmentImports.$inferSelect;
    try {
      updated = await this.db.transaction(async (tx) => {
        const [newEquipment] = await tx
          .insert(equipment)
          .values({
            name: equipmentImport.equipmentName,
            managementNumber,
            site: equipmentImport.site,
            modelName: equipmentImport.modelName,
            manufacturer: equipmentImport.manufacturer,
            serialNumber: equipmentImport.serialNumber,
            description: equipmentImport.description,
            teamId: equipmentImport.teamId,
            isShared: true,
            sharedSource, // 'external' or 'internal_shared'
            owner, // vendorName or ownerDepartment
            externalIdentifier,
            usagePeriodStart: equipmentImport.usagePeriodStart,
            usagePeriodEnd: equipmentImport.usagePeriodEnd,
            status: ESVal.TEMPORARY,
            isActive: true,
            approvalStatus: EIVal.APPROVED,
            // 교정 정보 추가
            calibrationMethod: dto.calibrationInfo?.calibrationMethod || null,
            calibrationCycle: dto.calibrationInfo?.calibrationCycle || null,
            lastCalibrationDate: dto.calibrationInfo?.lastCalibrationDate
              ? new Date(dto.calibrationInfo.lastCalibrationDate)
              : null,
            calibrationAgency: dto.calibrationInfo?.calibrationAgency || null,
            nextCalibrationDate,
            createdAt: new Date(),
            updatedAt: new Date(),
          } as typeof equipment.$inferInsert)
          .returning();

        // ✅ CAS: equipment import 업데이트 (tx 컨텍스트로 원자성 보장)
        const result = await this.updateWithVersion<typeof equipmentImports.$inferSelect>(
          equipmentImports,
          id,
          equipmentImport.version,
          {
            status: EIVal.RECEIVED as EquipmentImportStatus,
            receivedBy,
            receivedAt: new Date(),
            receivingCondition: dto.receivingCondition,
            equipmentId: newEquipment.id,
          },
          'Equipment import',
          tx
        );

        this.logger.log(
          `Equipment created from import: ${newEquipment.id} (managementNumber: ${managementNumber})`
        );

        return result;
      });
    } catch (error) {
      if (error instanceof ConflictException) {
        this.cacheService.deleteByPattern(CACHE_KEY_PREFIXES.EQUIPMENT_IMPORTS + '*');
      }
      throw error;
    }

    return updated;
  }

  /**
   * 반납 시작 → checkout 자동 생성
   * received → return_requested
   *
   * destination 동적 결정:
   * - rental: vendorName
   * - internal_shared: ownerDepartment
   */
  async initiateReturn(
    id: string,
    requesterId: string,
    userTeamId?: string
  ): Promise<EquipmentImport> {
    const equipmentImport = await this.findOne(id);

    if (equipmentImport.status !== EIVal.RECEIVED) {
      throw new BadRequestException({
        code: 'IMPORT_ONLY_RECEIVED_CAN_RETURN',
        message: 'Only received imports can initiate a return.',
      });
    }

    if (!equipmentImport.equipmentId) {
      throw new BadRequestException({
        code: 'IMPORT_NO_LINKED_EQUIPMENT',
        message: 'No linked equipment found.',
      });
    }

    // 장비의 이전 상태를 저장 (보상 롤백용)
    const previousEquipment = await this.equipmentService.findOne(equipmentImport.equipmentId);
    const previousEquipmentStatus = previousEquipment.status as EquipmentStatus;

    // 장비 상태를 'available'로 변경 (checkout 생성 조건 충족)
    await this.equipmentService.updateStatus(equipmentImport.equipmentId, ESVal.AVAILABLE);

    // destination 동적 결정
    const destination = getReturnDestination(equipmentImport);
    const sourceTypeLabel = isRentalImport(equipmentImport) ? 'Rental' : 'Internal shared';

    this.logger.log(
      `Initiating return for equipment import: ${id} (sourceType: ${equipmentImport.sourceType}, destination: ${destination})`
    );

    let newCheckout: Awaited<ReturnType<typeof this.checkoutsService.create>>;
    try {
      // checkout 자동 생성
      newCheckout = await this.checkoutsService.create(
        {
          equipmentIds: [equipmentImport.equipmentId],
          purpose: 'return_to_vendor',
          destination,
          reason: `${sourceTypeLabel} equipment return (import request #${equipmentImport.id.substring(0, 8)})`,
          expectedReturnDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7일 후
        } as Parameters<typeof this.checkoutsService.create>[0],
        requesterId,
        userTeamId
      );
    } catch (error) {
      // 보상: checkout 생성 실패 시 장비 상태 롤백
      this.logger.warn(`Checkout creation failed, rolling back equipment status: ${error}`);
      await this.equipmentService.updateStatus(
        equipmentImport.equipmentId,
        previousEquipmentStatus
      );
      throw error;
    }

    // equipment import 업데이트 — CAS로 동시 요청 방어
    let updated: EquipmentImport;
    try {
      updated = await this.updateWithVersion<EquipmentImport>(
        equipmentImports,
        id,
        equipmentImport.version,
        {
          status: EIVal.RETURN_REQUESTED as EquipmentImportStatus,
          returnCheckoutId: newCheckout.id,
        },
        'Equipment import'
      );
    } catch (error) {
      // 보상: CAS 실패 시 checkout 취소 + 장비 상태 롤백
      this.logger.warn(`Import CAS update failed, compensating: ${error}`);
      try {
        await this.checkoutsService.cancel(newCheckout.id);
        await this.equipmentService.updateStatus(
          equipmentImport.equipmentId,
          previousEquipmentStatus
        );
      } catch (compensateError) {
        this.logger.error(`Compensation failed (manual intervention needed): ${compensateError}`);
      }
      if (error instanceof ConflictException) {
        this.cacheService.deleteByPattern(CACHE_KEY_PREFIXES.EQUIPMENT_IMPORTS + '*');
      }
      throw error;
    }

    return updated;
  }

  /**
   * 취소
   * pending/approved → canceled
   */
  async cancel(id: string, userId: string): Promise<EquipmentImport> {
    const equipmentImport = await this.findOne(id);

    if (equipmentImport.status !== EIVal.PENDING && equipmentImport.status !== EIVal.APPROVED) {
      throw new BadRequestException({
        code: 'IMPORT_ONLY_PENDING_OR_APPROVED_CAN_CANCEL',
        message: 'Only pending or approved import requests can be canceled.',
      });
    }

    // 본인만 취소 가능
    if (equipmentImport.requesterId !== userId) {
      throw new BadRequestException({
        code: 'IMPORT_ONLY_REQUESTER_CAN_CANCEL',
        message: 'Only the requester can cancel their own import request.',
      });
    }

    const [updated] = await this.db
      .update(equipmentImports)
      .set({
        status: EIVal.CANCELED as EquipmentImportStatus,
        updatedAt: new Date(),
      })
      .where(eq(equipmentImports.id, id))
      .returning();

    return updated;
  }

  /**
   * checkout 반납 완료 콜백
   * return_requested → returned
   * 장비 status → 'inactive'
   */
  async onReturnCompleted(checkoutId: string): Promise<void> {
    const result = await this.db
      .select()
      .from(equipmentImports)
      .where(eq(equipmentImports.returnCheckoutId, checkoutId))
      .limit(1);

    if (result.length === 0) {
      return; // 장비 반입과 연결되지 않은 checkout
    }

    const equipmentImport = result[0];

    this.logger.log(
      `Return completed for equipment import: ${equipmentImport.id} (sourceType: ${equipmentImport.sourceType})`
    );

    // 장비 반입 완료 + 장비 비활성화 — 동일 tx 내 원자성 보장
    await this.db.transaction(async (tx) => {
      await tx
        .update(equipmentImports)
        .set({
          status: EIVal.RETURNED as EquipmentImportStatus,
          updatedAt: new Date(),
        })
        .where(eq(equipmentImports.id, equipmentImport.id));

      // 장비 비활성화 — tx 내에서 직접 UPDATE (equipmentService는 별도 커넥션이므로 사용 불가)
      if (equipmentImport.equipmentId) {
        await tx
          .update(equipment)
          .set({
            status: ESVal.INACTIVE,
            version: sql`version + 1`,
            updatedAt: new Date(),
          } as Record<string, unknown>)
          .where(eq(equipment.id, equipmentImport.equipmentId));
      }
    });
  }

  /**
   * TEMP 관리번호 고유 생성 (중복 시 retry)
   */
  private async generateUniqueTemporaryNumber(
    site: Site,
    classification: Classification
  ): Promise<string> {
    const maxRetries = 10;

    for (let i = 0; i < maxRetries; i++) {
      // 현재 최대 일련번호 조회 (SSOT: TEMPORARY_EQUIPMENT_PREFIX + SITE_TO_CODE)
      const tempPrefix = `${TEMPORARY_EQUIPMENT_PREFIX}${SITE_TO_CODE[site]}-`;
      const result = await this.db
        .select({ managementNumber: equipment.managementNumber })
        .from(equipment)
        .where(safeIlike(equipment.managementNumber, likeStartsWith(tempPrefix)))
        .orderBy(desc(equipment.managementNumber))
        .limit(1);

      let nextSerial = 1;
      if (result.length > 0 && result[0].managementNumber) {
        // "TEMP-SUW-E0001" → extract serial
        const match = result[0].managementNumber.match(/(\d{4})$/);
        if (match) {
          nextSerial = parseInt(match[1], 10) + 1;
        }
      }

      const serialStr = String(nextSerial).padStart(4, '0');
      const managementNumber = generateTemporaryManagementNumber(site, classification, serialStr);

      // 중복 확인
      const existing = await this.db.query.equipment.findFirst({
        where: eq(equipment.managementNumber, managementNumber),
      });

      if (!existing) {
        return managementNumber;
      }
    }

    throw new BadRequestException({
      code: 'IMPORT_TEMP_NUMBER_GENERATION_FAILED',
      message: 'Failed to generate temporary management number. Please contact administrator.',
    });
  }

  /**
   * 장비 반입의 사이트 및 팀 조회
   * 크로스사이트/크로스팀 접근 제어에 사용
   */
  async getImportSiteAndTeam(importId: string): Promise<{ site: string; teamId: string | null }> {
    const result = await this.db
      .select({ site: equipmentImports.site, teamId: equipmentImports.teamId })
      .from(equipmentImports)
      .where(eq(equipmentImports.id, importId))
      .limit(1);

    if (result.length === 0) {
      throw new NotFoundException({
        code: 'EQUIPMENT_IMPORT_NOT_FOUND',
        message: `Equipment import ${importId} not found.`,
      });
    }

    return result[0];
  }
}

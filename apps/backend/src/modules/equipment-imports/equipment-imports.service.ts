import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Inject,
  Logger,
  forwardRef,
} from '@nestjs/common';
import { eq, and, like, desc, asc, sql, SQL, or } from 'drizzle-orm';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import * as schema from '@equipment-management/db/schema';
import { equipmentImports } from '@equipment-management/db/schema/equipment-imports';
import { equipment } from '@equipment-management/db/schema/equipment';
import {
  EquipmentImportStatus,
  generateTemporaryManagementNumber,
  type Classification,
  type Site,
  type EquipmentImportSource,
} from '@equipment-management/schemas';
import { CreateEquipmentImportInput } from './dto/create-equipment-import.dto';
import { RejectEquipmentImportDto } from './dto/reject-equipment-import.dto';
import { ReceiveEquipmentImportDto } from './dto/receive-equipment-import.dto';
import { EquipmentImportQueryDto } from './dto/equipment-import-query.dto';
import { EquipmentService } from '../equipment/equipment.service';
import { CheckoutsService } from '../checkouts/checkouts.service';
import { addMonths } from 'date-fns';
import {
  isRentalImport,
  isInternalSharedImport,
  getReturnDestination,
  getOwnerName,
  getSharedSource,
} from './types/equipment-import.types';

type EquipmentImport = typeof equipmentImports.$inferSelect;

@Injectable()
export class EquipmentImportsService {
  private readonly logger = new Logger(EquipmentImportsService.name);

  constructor(
    @Inject('DRIZZLE_INSTANCE')
    private readonly db: PostgresJsDatabase<typeof schema>,
    private readonly equipmentService: EquipmentService,
    @Inject(forwardRef(() => CheckoutsService))
    private readonly checkoutsService: CheckoutsService
  ) {}

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
      throw new BadRequestException('사용 종료일은 시작일보다 늦어야 합니다.');
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
      status: 'pending' as EquipmentImportStatus,
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

    return created;
  }

  /**
   * 장비 반입 목록 조회 (sourceType 필터 지원)
   */
  async findAll(query: EquipmentImportQueryDto) {
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
      whereConditions.push(
        or(
          like(equipmentImports.equipmentName, `%${query.search}%`),
          like(equipmentImports.vendorName, `%${query.search}%`),
          like(equipmentImports.ownerDepartment, `%${query.search}%`)
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
      throw new NotFoundException(`장비 반입 ${id}을(를) 찾을 수 없습니다.`);
    }

    return result[0];
  }

  /**
   * 장비 반입 승인
   * pending → approved
   */
  async approve(id: string, approverId: string): Promise<EquipmentImport> {
    const equipmentImport = await this.findOne(id);

    if (equipmentImport.status !== 'pending') {
      throw new BadRequestException('승인 대기 상태의 반입 신청만 승인할 수 있습니다.');
    }

    const [updated] = await this.db
      .update(equipmentImports)
      .set({
        status: 'approved' as EquipmentImportStatus,
        approverId,
        approvedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(equipmentImports.id, id))
      .returning();

    this.logger.log(`Equipment import approved: ${id} (sourceType: ${updated.sourceType})`);

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

    if (equipmentImport.status !== 'pending') {
      throw new BadRequestException('승인 대기 상태의 반입 신청만 거절할 수 있습니다.');
    }

    const [updated] = await this.db
      .update(equipmentImports)
      .set({
        status: 'rejected' as EquipmentImportStatus,
        approverId,
        approvedAt: new Date(),
        rejectionReason: dto.rejectionReason,
        updatedAt: new Date(),
      })
      .where(eq(equipmentImports.id, id))
      .returning();

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

    if (equipmentImport.status !== 'approved') {
      throw new BadRequestException('승인된 반입 신청만 수령 처리할 수 있습니다.');
    }

    // TEMP 관리번호 생성 (중복 시 retry)
    const managementNumber = await this.generateUniqueTemporaryNumber(
      equipmentImport.site as Site,
      equipmentImport.classification as Classification
    );

    // 다음 교정일 자동 계산
    let nextCalibrationDate: Date | null = null;
    if (
      dto.calibrationInfo?.calibrationMethod === 'external_calibration' &&
      dto.calibrationInfo.calibrationCycle &&
      dto.calibrationInfo.lastCalibrationDate
    ) {
      nextCalibrationDate = addMonths(
        new Date(dto.calibrationInfo.lastCalibrationDate),
        dto.calibrationInfo.calibrationCycle
      );
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

    // 장비 직접 생성
    const [newEquipment] = await this.db
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
        status: 'temporary',
        isActive: true,
        approvalStatus: 'approved',
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

    // equipment import 업데이트
    const [updated] = await this.db
      .update(equipmentImports)
      .set({
        status: 'received' as EquipmentImportStatus,
        receivedBy,
        receivedAt: new Date(),
        receivingCondition: dto.receivingCondition,
        equipmentId: newEquipment.id,
        updatedAt: new Date(),
      })
      .where(eq(equipmentImports.id, id))
      .returning();

    this.logger.log(
      `Equipment created from import: ${newEquipment.id} (managementNumber: ${managementNumber})`
    );

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

    if (equipmentImport.status !== 'received') {
      throw new BadRequestException('수령 완료된 반입 건만 반납을 시작할 수 있습니다.');
    }

    if (!equipmentImport.equipmentId) {
      throw new BadRequestException('연결된 장비가 없습니다.');
    }

    // 장비 상태를 'available'로 변경 (checkout 생성 조건 충족)
    await this.equipmentService.updateStatus(equipmentImport.equipmentId, 'available');

    // destination 동적 결정
    const destination = getReturnDestination(equipmentImport);
    const sourceTypeLabel = isRentalImport(equipmentImport) ? '렌탈' : '내부 공용';

    this.logger.log(
      `Initiating return for equipment import: ${id} (sourceType: ${equipmentImport.sourceType}, destination: ${destination})`
    );

    // checkout 자동 생성
    const newCheckout = await this.checkoutsService.create(
      {
        equipmentIds: [equipmentImport.equipmentId],
        purpose: 'return_to_vendor',
        destination,
        reason: `${sourceTypeLabel} 장비 반납 (반입 신청 #${equipmentImport.id.substring(0, 8)})`,
        expectedReturnDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7일 후
      } as Parameters<typeof this.checkoutsService.create>[0],
      requesterId,
      userTeamId
    );

    // equipment import 업데이트
    const [updated] = await this.db
      .update(equipmentImports)
      .set({
        status: 'return_requested' as EquipmentImportStatus,
        returnCheckoutId: newCheckout.id,
        updatedAt: new Date(),
      })
      .where(eq(equipmentImports.id, id))
      .returning();

    return updated;
  }

  /**
   * 취소
   * pending/approved → canceled
   */
  async cancel(id: string, userId: string): Promise<EquipmentImport> {
    const equipmentImport = await this.findOne(id);

    if (equipmentImport.status !== 'pending' && equipmentImport.status !== 'approved') {
      throw new BadRequestException('승인 대기 또는 승인됨 상태의 반입 신청만 취소할 수 있습니다.');
    }

    // 본인만 취소 가능
    if (equipmentImport.requesterId !== userId) {
      throw new BadRequestException('본인이 신청한 반입 건만 취소할 수 있습니다.');
    }

    const [updated] = await this.db
      .update(equipmentImports)
      .set({
        status: 'canceled' as EquipmentImportStatus,
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

    // 장비 반입 완료 처리
    await this.db
      .update(equipmentImports)
      .set({
        status: 'returned' as EquipmentImportStatus,
        updatedAt: new Date(),
      })
      .where(eq(equipmentImports.id, equipmentImport.id));

    // 장비 비활성화
    if (equipmentImport.equipmentId) {
      await this.equipmentService.updateStatus(equipmentImport.equipmentId, 'inactive');
    }
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
      // 현재 최대 일련번호 조회
      const result = await this.db
        .select({ managementNumber: equipment.managementNumber })
        .from(equipment)
        .where(
          like(
            equipment.managementNumber,
            `TEMP-${site === 'suwon' ? 'SUW' : site === 'uiwang' ? 'UIW' : 'PYT'}-%`
          )
        )
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

    throw new BadRequestException('임시 관리번호 생성에 실패했습니다. 관리자에게 문의하세요.');
  }
}

// ============================================================================
// DEPRECATED: Legacy alias (backward compatibility)
// ============================================================================

/**
 * @deprecated Use EquipmentImportsService instead
 */
export const RentalImportsService = EquipmentImportsService;

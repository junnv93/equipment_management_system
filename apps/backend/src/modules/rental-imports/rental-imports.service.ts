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
import { rentalImports } from '@equipment-management/db/schema/rental-imports';
import { equipment } from '@equipment-management/db/schema/equipment';
import {
  RentalImportStatus,
  generateTemporaryManagementNumber,
  type Classification,
  type Site,
} from '@equipment-management/schemas';
import { CreateRentalImportDto } from './dto/create-rental-import.dto';
import { RejectRentalImportDto } from './dto/reject-rental-import.dto';
import { ReceiveRentalImportDto } from './dto/receive-rental-import.dto';
import { RentalImportQueryDto } from './dto/rental-import-query.dto';
import { EquipmentService } from '../equipment/equipment.service';
import { CheckoutsService } from '../checkouts/checkouts.service';
import { addMonths } from 'date-fns';

type RentalImport = typeof rentalImports.$inferSelect;

@Injectable()
export class RentalImportsService {
  private readonly logger = new Logger(RentalImportsService.name);

  constructor(
    @Inject('DRIZZLE_INSTANCE')
    private readonly db: PostgresJsDatabase<typeof schema>,
    private readonly equipmentService: EquipmentService,
    @Inject(forwardRef(() => CheckoutsService))
    private readonly checkoutsService: CheckoutsService
  ) {}

  /**
   * 렌탈 반입 신청 생성
   */
  async create(
    dto: CreateRentalImportDto,
    requesterId: string,
    site: string,
    teamId: string
  ): Promise<RentalImport> {
    const usagePeriodStart = new Date(dto.usagePeriodStart);
    const usagePeriodEnd = new Date(dto.usagePeriodEnd);

    if (usagePeriodEnd <= usagePeriodStart) {
      throw new BadRequestException('사용 종료일은 시작일보다 늦어야 합니다.');
    }

    const [created] = await this.db
      .insert(rentalImports)
      .values({
        requesterId,
        site,
        teamId,
        equipmentName: dto.equipmentName,
        modelName: dto.modelName || null,
        manufacturer: dto.manufacturer || null,
        serialNumber: dto.serialNumber || null,
        description: dto.description || null,
        classification: dto.classification,
        vendorName: dto.vendorName,
        vendorContact: dto.vendorContact || null,
        externalIdentifier: dto.externalIdentifier || null,
        usagePeriodStart,
        usagePeriodEnd,
        reason: dto.reason,
        status: 'pending',
      } as typeof rentalImports.$inferInsert)
      .returning();

    return created;
  }

  /**
   * 렌탈 반입 목록 조회
   */
  async findAll(query: RentalImportQueryDto) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const offset = (page - 1) * limit;

    const whereConditions: SQL<unknown>[] = [];

    if (query.status) {
      whereConditions.push(eq(rentalImports.status, query.status));
    }
    if (query.site) {
      whereConditions.push(eq(rentalImports.site, query.site));
    }
    if (query.teamId) {
      whereConditions.push(eq(rentalImports.teamId, query.teamId));
    }
    if (query.search) {
      whereConditions.push(
        or(
          like(rentalImports.equipmentName, `%${query.search}%`),
          like(rentalImports.vendorName, `%${query.search}%`)
        )!
      );
    }

    const whereClause = whereConditions.length > 0 ? and(...whereConditions) : undefined;

    const sortColumn =
      query.sortBy === 'usagePeriodStart'
        ? rentalImports.usagePeriodStart
        : query.sortBy === 'usagePeriodEnd'
          ? rentalImports.usagePeriodEnd
          : query.sortBy === 'status'
            ? rentalImports.status
            : rentalImports.createdAt;

    const orderFn = query.sortOrder === 'asc' ? asc : desc;

    const [items, countResult] = await Promise.all([
      this.db
        .select()
        .from(rentalImports)
        .where(whereClause)
        .orderBy(orderFn(sortColumn))
        .limit(limit)
        .offset(offset),
      this.db
        .select({ count: sql<number>`count(*)::int` })
        .from(rentalImports)
        .where(whereClause),
    ]);

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
   * 렌탈 반입 상세 조회
   */
  async findOne(id: string): Promise<RentalImport> {
    const result = await this.db
      .select()
      .from(rentalImports)
      .where(eq(rentalImports.id, id))
      .limit(1);

    if (result.length === 0) {
      throw new NotFoundException(`렌탈 반입 ${id}을(를) 찾을 수 없습니다.`);
    }

    return result[0];
  }

  /**
   * 렌탈 반입 승인
   * pending → approved
   */
  async approve(id: string, approverId: string): Promise<RentalImport> {
    const rentalImport = await this.findOne(id);

    if (rentalImport.status !== 'pending') {
      throw new BadRequestException('승인 대기 상태의 반입 신청만 승인할 수 있습니다.');
    }

    const [updated] = await this.db
      .update(rentalImports)
      .set({
        status: 'approved' as RentalImportStatus,
        approverId,
        approvedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(rentalImports.id, id))
      .returning();

    return updated;
  }

  /**
   * 렌탈 반입 거절
   * pending → rejected
   */
  async reject(id: string, approverId: string, dto: RejectRentalImportDto): Promise<RentalImport> {
    const rentalImport = await this.findOne(id);

    if (rentalImport.status !== 'pending') {
      throw new BadRequestException('승인 대기 상태의 반입 신청만 거절할 수 있습니다.');
    }

    const [updated] = await this.db
      .update(rentalImports)
      .set({
        status: 'rejected' as RentalImportStatus,
        approverId,
        approvedAt: new Date(),
        rejectionReason: dto.rejectionReason,
        updatedAt: new Date(),
      })
      .where(eq(rentalImports.id, id))
      .returning();

    return updated;
  }

  /**
   * 수령 확인 + 장비 자동 등록
   * approved → received
   *
   * 핵심 로직:
   * 1. TEMP-XXX 관리번호 생성
   * 2. 장비 자동 생성 (isShared=true, sharedSource='external', status='temporary')
   * 3. rental_imports.equipmentId 연결
   */
  async receive(
    id: string,
    receivedBy: string,
    dto: ReceiveRentalImportDto
  ): Promise<RentalImport> {
    const rentalImport = await this.findOne(id);

    if (rentalImport.status !== 'approved') {
      throw new BadRequestException('승인된 반입 신청만 수령 처리할 수 있습니다.');
    }

    // TEMP 관리번호 생성 (중복 시 retry)
    const managementNumber = await this.generateUniqueTemporaryNumber(
      rentalImport.site as Site,
      rentalImport.classification as Classification
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

    // 장비 직접 생성 (createShared DTO와 시그니처가 다르므로 직접 insert)
    const [newEquipment] = await this.db
      .insert(equipment)
      .values({
        name: rentalImport.equipmentName,
        managementNumber,
        site: rentalImport.site,
        modelName: rentalImport.modelName,
        manufacturer: rentalImport.manufacturer,
        serialNumber: rentalImport.serialNumber,
        description: rentalImport.description,
        teamId: rentalImport.teamId,
        isShared: true,
        sharedSource: 'external',
        owner: rentalImport.vendorName,
        externalIdentifier: rentalImport.externalIdentifier,
        usagePeriodStart: rentalImport.usagePeriodStart,
        usagePeriodEnd: rentalImport.usagePeriodEnd,
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

    // rental import 업데이트
    const [updated] = await this.db
      .update(rentalImports)
      .set({
        status: 'received' as RentalImportStatus,
        receivedBy,
        receivedAt: new Date(),
        receivingCondition: dto.receivingCondition,
        equipmentId: newEquipment.id,
        updatedAt: new Date(),
      })
      .where(eq(rentalImports.id, id))
      .returning();

    return updated;
  }

  /**
   * 반납 시작 → checkout 자동 생성
   * received → return_requested
   */
  async initiateReturn(
    id: string,
    requesterId: string,
    userTeamId?: string
  ): Promise<RentalImport> {
    const rentalImport = await this.findOne(id);

    if (rentalImport.status !== 'received') {
      throw new BadRequestException('수령 완료된 반입 건만 반납을 시작할 수 있습니다.');
    }

    if (!rentalImport.equipmentId) {
      throw new BadRequestException('연결된 장비가 없습니다.');
    }

    // 장비 상태를 'available'로 변경 (checkout 생성 조건 충족)
    await this.equipmentService.updateStatus(rentalImport.equipmentId, 'available');

    // checkout 자동 생성
    const newCheckout = await this.checkoutsService.create(
      {
        equipmentIds: [rentalImport.equipmentId],
        purpose: 'return_to_vendor',
        destination: rentalImport.vendorName,
        reason: `렌탈 장비 반납 (반입 신청 #${rentalImport.id.substring(0, 8)})`,
        expectedReturnDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7일 후
      } as Parameters<typeof this.checkoutsService.create>[0],
      requesterId,
      userTeamId
    );

    // rental import 업데이트
    const [updated] = await this.db
      .update(rentalImports)
      .set({
        status: 'return_requested' as RentalImportStatus,
        returnCheckoutId: newCheckout.id,
        updatedAt: new Date(),
      })
      .where(eq(rentalImports.id, id))
      .returning();

    return updated;
  }

  /**
   * 취소
   * pending/approved → canceled
   */
  async cancel(id: string, userId: string): Promise<RentalImport> {
    const rentalImport = await this.findOne(id);

    if (rentalImport.status !== 'pending' && rentalImport.status !== 'approved') {
      throw new BadRequestException('승인 대기 또는 승인됨 상태의 반입 신청만 취소할 수 있습니다.');
    }

    // 본인만 취소 가능
    if (rentalImport.requesterId !== userId) {
      throw new BadRequestException('본인이 신청한 반입 건만 취소할 수 있습니다.');
    }

    const [updated] = await this.db
      .update(rentalImports)
      .set({
        status: 'canceled' as RentalImportStatus,
        updatedAt: new Date(),
      })
      .where(eq(rentalImports.id, id))
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
      .from(rentalImports)
      .where(eq(rentalImports.returnCheckoutId, checkoutId))
      .limit(1);

    if (result.length === 0) {
      return; // 렌탈 반입과 연결되지 않은 checkout
    }

    const rentalImport = result[0];

    // 렌탈 반입 완료 처리
    await this.db
      .update(rentalImports)
      .set({
        status: 'returned' as RentalImportStatus,
        updatedAt: new Date(),
      })
      .where(eq(rentalImports.id, rentalImport.id));

    // 장비 비활성화
    if (rentalImport.equipmentId) {
      await this.equipmentService.updateStatus(rentalImport.equipmentId, 'inactive');
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

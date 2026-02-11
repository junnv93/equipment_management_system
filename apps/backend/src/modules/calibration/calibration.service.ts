import { Injectable, NotFoundException, BadRequestException, Logger, Inject } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { VersionedBaseService } from '../../common/base/versioned-base.service';
import { CreateCalibrationDto } from './dto/create-calibration.dto';
import { UpdateCalibrationDto } from './dto/update-calibration.dto';
import { CalibrationQueryDto } from './dto/calibration-query.dto';
import { ApproveCalibrationDto, RejectCalibrationDto } from './dto/approve-calibration.dto';
import { CalibrationStatus, CalibrationApprovalStatusEnum } from '@equipment-management/schemas';
import { nonConformances } from '@equipment-management/db/schema/non-conformances';
import { getUtcStartOfDay, getUtcEndOfDay, addDaysUtc } from '../../common/utils';
import * as schema from '@equipment-management/db/schema';
import { and, eq, gte, lte, count, sql, or, desc, asc, SQL, isNull } from 'drizzle-orm';

// 교정 기록 인터페이스
export interface CalibrationRecord {
  id: string;
  equipmentId: string;
  calibrationManagerId: string;
  calibrationDate: Date;
  nextCalibrationDate: Date;
  calibrationMethod: string;
  status: string;
  calibrationAgency: string;
  certificationNumber: string | null;
  certificatePath: string | null; // 교정성적서 파일 경로
  result: string | null; // 교정 결과 (pass, fail, conditional)
  cost: number | null;
  isPassed: boolean | null;
  resultNotes: string | null;
  reportFilePath: string | null;
  additionalInfo: string | null;
  // 승인 프로세스 필드
  approvalStatus: string;
  registeredBy: string | null;
  approvedBy: string | null;
  registeredByRole: string | null;
  registrarComment: string | null;
  approverComment: string | null;
  rejectionReason: string | null;
  intermediateCheckDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

// 임시 교정 데이터
const temporaryCalibrations: CalibrationRecord[] = [
  {
    id: '1a2b3c4d-5e6f-7g8h-9i0j-1k2l3m4n5o6p',
    equipmentId: '1a2b3c4d-5e6f-7g8h-9i0j-1k2l3m4n5o6p',
    calibrationManagerId: '550e8400-e29b-41d4-a716-446655440001',
    calibrationDate: new Date('2023-01-15'),
    nextCalibrationDate: new Date('2024-01-15'),
    calibrationMethod: 'external_calibration',
    status: 'completed',
    calibrationAgency: '한국계측기술원',
    certificationNumber: 'CERT-2023-0001',
    certificatePath: '/uploads/calibration/CERT-2023-0001.pdf',
    result: 'pass',
    cost: 500000,
    isPassed: true,
    resultNotes: '모든 파라미터가 허용 오차 범위 내에 있습니다.',
    reportFilePath: '/reports/calibration/EQ-RF-001-2023.pdf',
    additionalInfo: '온도 23±2°C, 습도 50±10%RH 환경에서 교정 수행',
    approvalStatus: 'approved',
    registeredBy: '550e8400-e29b-41d4-a716-446655440001',
    approvedBy: '550e8400-e29b-41d4-a716-446655440001',
    registeredByRole: 'technical_manager',
    registrarComment: '검토 완료',
    approverComment: null,
    rejectionReason: null,
    intermediateCheckDate: new Date('2023-07-15'),
    createdAt: new Date('2022-12-20'),
    updatedAt: new Date('2023-01-20'),
  },
  {
    id: '2b3c4d5e-6f7g-8h9i-0j1k-2l3m4n5o6p7q',
    equipmentId: '2b3c4d5e-6f7g-8h9i-0j1k-2l3m4n5o6p7q',
    calibrationManagerId: '660f9500-f30b-52e5-b827-557766550111',
    calibrationDate: new Date('2023-02-20'),
    nextCalibrationDate: new Date('2024-02-20'),
    calibrationMethod: 'external_calibration',
    status: 'completed',
    calibrationAgency: '테크원 계측',
    certificationNumber: 'CERT-2023-0002',
    certificatePath: null,
    result: 'pass',
    cost: 350000,
    isPassed: true,
    resultNotes: '모든 테스트 통과.',
    reportFilePath: '/reports/calibration/OSC-001-2023.pdf',
    additionalInfo: null,
    approvalStatus: 'pending_approval',
    registeredBy: '770a0600-a40c-63f6-c938-668877660222',
    approvedBy: null,
    registeredByRole: 'test_engineer',
    registrarComment: null,
    approverComment: null,
    rejectionReason: null,
    intermediateCheckDate: null,
    createdAt: new Date('2023-01-15'),
    updatedAt: new Date('2023-02-25'),
  },
  {
    id: '3c4d5e6f-7g8h-9i0j-1k2l-3m4n5o6p7q8r',
    equipmentId: '3c4d5e6f-7g8h-9i0j-1k2l-3m4n5o6p7q8r',
    calibrationManagerId: '550e8400-e29b-41d4-a716-446655440001',
    calibrationDate: new Date('2024-06-15'),
    nextCalibrationDate: new Date('2026-06-15'),
    calibrationMethod: 'external_calibration',
    status: 'scheduled',
    calibrationAgency: '키사이트 코리아',
    certificationNumber: null,
    certificatePath: null,
    result: null,
    cost: null,
    isPassed: null,
    resultNotes: null,
    reportFilePath: null,
    additionalInfo: '730일 주기로 교정 필요',
    approvalStatus: 'approved',
    registeredBy: '550e8400-e29b-41d4-a716-446655440001',
    approvedBy: '550e8400-e29b-41d4-a716-446655440001',
    registeredByRole: 'technical_manager',
    registrarComment: '교정 예정 등록 확인',
    approverComment: null,
    rejectionReason: null,
    intermediateCheckDate: new Date('2025-06-15'),
    createdAt: new Date('2023-03-10'),
    updatedAt: new Date('2023-03-10'),
  },
];

// 검색 가능한 교정 목록
const calibrations: CalibrationRecord[] = [...temporaryCalibrations];

@Injectable()
export class CalibrationService extends VersionedBaseService {
  private readonly logger = new Logger(CalibrationService.name);

  constructor(
    @Inject('DRIZZLE_INSTANCE')
    protected readonly db: NodePgDatabase<typeof schema>
  ) {
    super();
  }

  /**
   * 교정 요약 통계 조회
   * GET /api/calibration/summary
   *
   * ✅ UTC 기준 날짜 비교로 타임존 문제 방지
   * ✅ SSOT: EquipmentService와 동일한 날짜 계산 로직 사용
   *
   * @deprecated 향후 리팩토링 시 EquipmentService로 통합 예정
   *   - CalibrationService는 교정 기록 관리에만 집중
   *   - 장비 필터링/통계는 EquipmentService가 담당
   */
  async getSummary(): Promise<{ total: number; overdueCount: number; dueInMonthCount: number }> {
    const today = getUtcStartOfDay(); // ✅ UTC 기준 오늘 00:00:00
    const thirtyDaysLater = getUtcEndOfDay(addDaysUtc(today, 30)); // ✅ UTC 기준 30일 후 23:59:59

    // Count total equipment requiring calibration
    const [totalResult] = await this.db
      .select({ count: count() })
      .from(schema.equipment)
      .where(
        and(
          eq(schema.equipment.isActive, true), // ✅ 활성 장비만
          eq(schema.equipment.calibrationRequired, 'required')
        )
      );

    // Count overdue (nextCalibrationDate < today)
    // ✅ sql 템플릿으로 명시적 타임스탬프 변환 (Drizzle ORM Date 처리 이슈 방지)
    const [overdueResult] = await this.db
      .select({ count: count() })
      .from(schema.equipment)
      .where(
        and(
          eq(schema.equipment.isActive, true),
          eq(schema.equipment.calibrationRequired, 'required'),
          sql`${schema.equipment.nextCalibrationDate} IS NOT NULL`,
          sql`${schema.equipment.nextCalibrationDate} < ${today.toISOString()}::timestamp`
        )
      );

    // Count upcoming (within 30 days)
    // ✅ EquipmentService의 calibrationDue 필터와 동일한 로직
    const [upcomingResult] = await this.db
      .select({ count: count() })
      .from(schema.equipment)
      .where(
        and(
          eq(schema.equipment.isActive, true),
          eq(schema.equipment.calibrationRequired, 'required'),
          sql`${schema.equipment.nextCalibrationDate} IS NOT NULL`,
          sql`${schema.equipment.nextCalibrationDate} >= ${today.toISOString()}::timestamp`,
          sql`${schema.equipment.nextCalibrationDate} <= ${thirtyDaysLater.toISOString()}::timestamp`
        )
      );

    return {
      total: totalResult?.count || 0,
      overdueCount: overdueResult?.count || 0,
      dueInMonthCount: upcomingResult?.count || 0,
    };
  }

  /**
   * 교정 기한 초과 장비 조회
   * GET /api/calibration/overdue
   *
   * ✅ UTC 기준 날짜 비교로 타임존 문제 방지
   * ✅ SSOT: EquipmentService의 calibrationDue=-1 필터와 동일한 로직
   *
   * @deprecated 향후 리팩토링 시 EquipmentService.findAll({ calibrationOverdue: true })로 대체 예정
   *   - 장비 필터링은 EquipmentService에서 담당
   *   - CalibrationService는 교정 기록 관리에만 집중
   */
  async getOverdueCalibrations(): Promise<
    {
      id: string;
      equipmentId: string;
      equipmentName: string;
      managementNumber: string;
      calibrationDate: string;
      nextCalibrationDate: string;
      team: string | undefined;
      teamId: string | undefined;
      calibrationAgency: string;
    }[]
  > {
    const today = getUtcStartOfDay(); // ✅ UTC 기준 오늘 00:00:00

    // ✅ sql 템플릿으로 명시적 타임스탬프 변환
    const results = await this.db
      .select({
        id: schema.equipment.id,
        equipmentId: schema.equipment.id,
        equipmentName: schema.equipment.name,
        managementNumber: schema.equipment.managementNumber,
        nextCalibrationDate: schema.equipment.nextCalibrationDate,
        teamId: schema.equipment.teamId,
        teamName: schema.teams.name,
        calibrationAgency: schema.equipment.calibrationAgency,
        lastCalibrationDate: schema.equipment.lastCalibrationDate,
      })
      .from(schema.equipment)
      .leftJoin(schema.teams, eq(schema.equipment.teamId, schema.teams.id))
      .where(
        and(
          eq(schema.equipment.isActive, true), // ✅ 활성 장비만
          eq(schema.equipment.calibrationRequired, 'required'),
          sql`${schema.equipment.nextCalibrationDate} IS NOT NULL`,
          sql`${schema.equipment.nextCalibrationDate} < ${today.toISOString()}::timestamp` // ✅ UTC 기준 비교
        )
      )
      .orderBy(schema.equipment.nextCalibrationDate)
      .limit(100);

    return results.map((r) => ({
      id: r.id,
      equipmentId: r.equipmentId,
      equipmentName: r.equipmentName,
      managementNumber: r.managementNumber,
      calibrationDate: r.lastCalibrationDate?.toISOString() || '',
      nextCalibrationDate: r.nextCalibrationDate?.toISOString() || '',
      team: r.teamName || undefined,
      teamId: r.teamId || undefined,
      calibrationAgency: r.calibrationAgency || '',
    }));
  }

  /**
   * 교정 예정 장비 조회 (N일 이내)
   * GET /api/calibration/upcoming?days=N
   *
   * ✅ UTC 기준 날짜 비교로 타임존 문제 방지
   * ✅ SSOT: EquipmentService의 calibrationDue 필터와 동일한 로직
   *
   * @deprecated 향후 리팩토링 시 EquipmentService.findAll({ calibrationDue: days })로 대체 예정
   *   - 장비 필터링은 EquipmentService에서 담당
   *   - CalibrationService는 교정 기록 관리에만 집중
   *
   * @param days - 오늘부터 N일 이내에 교정이 예정된 장비 조회 (기본값: 30)
   */
  async getUpcomingCalibrations(days: number = 30): Promise<
    {
      id: string;
      equipmentId: string;
      equipmentName: string;
      managementNumber: string;
      calibrationDate: string;
      nextCalibrationDate: string;
      team: string | undefined;
      teamId: string | undefined;
      calibrationAgency: string;
    }[]
  > {
    const today = getUtcStartOfDay(); // ✅ UTC 기준 오늘 00:00:00
    const futureDate = getUtcEndOfDay(addDaysUtc(today, days)); // ✅ UTC 기준 N일 후 23:59:59

    // ✅ sql 템플릿으로 명시적 타임스탬프 변환 (Drizzle ORM Date 처리 이슈 방지)
    const results = await this.db
      .select({
        id: schema.equipment.id,
        equipmentId: schema.equipment.id,
        equipmentName: schema.equipment.name,
        managementNumber: schema.equipment.managementNumber,
        nextCalibrationDate: schema.equipment.nextCalibrationDate,
        teamId: schema.equipment.teamId,
        teamName: schema.teams.name,
        calibrationAgency: schema.equipment.calibrationAgency,
        lastCalibrationDate: schema.equipment.lastCalibrationDate,
      })
      .from(schema.equipment)
      .leftJoin(schema.teams, eq(schema.equipment.teamId, schema.teams.id))
      .where(
        and(
          eq(schema.equipment.isActive, true), // ✅ 활성 장비만
          eq(schema.equipment.calibrationRequired, 'required'),
          sql`${schema.equipment.nextCalibrationDate} IS NOT NULL`,
          // ✅ EquipmentService와 동일한 조건: 오늘 <= nextCalibrationDate <= 오늘+N일
          sql`${schema.equipment.nextCalibrationDate} >= ${today.toISOString()}::timestamp`,
          sql`${schema.equipment.nextCalibrationDate} <= ${futureDate.toISOString()}::timestamp`
        )
      )
      .orderBy(schema.equipment.nextCalibrationDate)
      .limit(100);

    return results.map((r) => ({
      id: r.id,
      equipmentId: r.equipmentId,
      equipmentName: r.equipmentName,
      managementNumber: r.managementNumber,
      calibrationDate: r.lastCalibrationDate?.toISOString() || '',
      nextCalibrationDate: r.nextCalibrationDate?.toISOString() || '',
      team: r.teamName || undefined,
      teamId: r.teamId || undefined,
      calibrationAgency: r.calibrationAgency || '',
    }));
  }

  create(
    createCalibrationDto: CreateCalibrationDto
  ): import('/home/kmjkds/equipment_management_system/apps/backend/src/modules/calibration/calibration.service').CalibrationRecord {
    const { registeredBy, registeredByRole, registrarComment, ...rest } = createCalibrationDto;

    // 교정 기록은 시험실무자만 등록 가능 (UL-QP-18 등록/승인 완전 분리 정책)
    // 모든 교정 기록은 기술책임자 이상의 승인 필요
    const approvalStatus = CalibrationApprovalStatusEnum.enum.pending_approval;

    const newCalibration: CalibrationRecord = {
      id: `calibration-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      equipmentId: rest.equipmentId,
      calibrationManagerId: rest.calibrationManagerId,
      calibrationDate: rest.calibrationDate,
      nextCalibrationDate: rest.nextCalibrationDate,
      calibrationMethod: rest.calibrationMethod,
      status: rest.status || 'scheduled',
      calibrationAgency: rest.calibrationAgency,
      certificationNumber: rest.certificationNumber || null,
      certificatePath: rest.certificatePath || null,
      result: rest.result || null,
      cost: rest.cost || null,
      isPassed: rest.isPassed ?? null,
      resultNotes: rest.resultNotes || null,
      reportFilePath: rest.reportFilePath || null,
      additionalInfo: rest.additionalInfo || null,
      approvalStatus,
      registeredBy: registeredBy || null,
      approvedBy: null, // 모든 교정 기록은 승인 대기 상태로 시작
      registeredByRole: registeredByRole || null,
      registrarComment: registrarComment || null,
      approverComment: null,
      rejectionReason: null,
      intermediateCheckDate: rest.intermediateCheckDate || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    calibrations.push(newCalibration);
    return newCalibration;
  }

  async findAll(query: CalibrationQueryDto): Promise<{
    items: {
      id: string;
      equipmentId: string;
      technicianId: string | null;
      status: string;
      calibrationDate: Date;
      completionDate: Date | null;
      nextCalibrationDate: Date | null;
      agencyName: string | null;
      certificateNumber: string | null;
      certificatePath: string | null;
      result: string | null;
      cost: string | null;
      notes: string | null;
      intermediateCheckDate: string | null;
      approvalStatus: string;
      registeredBy: string | null;
      approvedBy: string | null;
      registeredByRole: string | null;
      registrarComment: string | null;
      approverComment: string | null;
      rejectionReason: string | null;
      createdAt: Date;
      updatedAt: Date;
      equipmentName: string | null;
      managementNumber: string | null;
      teamId: string | null;
      teamName: string | null;
    }[];
    meta: {
      totalItems: number;
      itemCount: number;
      itemsPerPage: number;
      totalPages: number;
      currentPage: number;
    };
  }> {
    const {
      equipmentId,
      calibrationManagerId,
      statuses,
      calibrationAgency,
      fromDate,
      toDate,
      nextFromDate,
      nextToDate,
      isPassed,
      search,
      sort = 'calibrationDate.desc',
      page = 1,
      pageSize = 20,
      approvalStatus,
    } = query;

    // ========== 1. Build WHERE conditions ==========
    const whereConditions: SQL<unknown>[] = [];

    // equipmentId filter
    if (equipmentId) {
      whereConditions.push(eq(schema.calibrations.equipmentId, equipmentId));
    }

    // calibrationManagerId filter
    if (calibrationManagerId) {
      whereConditions.push(eq(schema.calibrations.technicianId, calibrationManagerId));
    }

    // statuses filter (comma-separated string)
    if (statuses) {
      const statusArray = statuses.split(',').map((s) => s.trim());
      whereConditions.push(
        sql`${schema.calibrations.status} IN (${sql.join(
          statusArray.map((s) => sql`${s}`),
          sql`, `
        )})`
      );
    }

    // calibrationAgency filter (LIKE query)
    if (calibrationAgency) {
      whereConditions.push(
        sql`LOWER(${schema.calibrations.agencyName}) LIKE LOWER(${'%' + calibrationAgency + '%'})`
      );
    }

    // Date range filters
    if (fromDate) {
      whereConditions.push(gte(schema.calibrations.calibrationDate, new Date(fromDate)));
    }
    if (toDate) {
      whereConditions.push(lte(schema.calibrations.calibrationDate, new Date(toDate)));
    }
    if (nextFromDate) {
      whereConditions.push(gte(schema.calibrations.nextCalibrationDate, new Date(nextFromDate)));
    }
    if (nextToDate) {
      whereConditions.push(lte(schema.calibrations.nextCalibrationDate, new Date(nextToDate)));
    }

    // isPassed filter
    if (isPassed !== undefined) {
      const isParsedPassed = isPassed === 'true';
      whereConditions.push(eq(schema.calibrations.result, isParsedPassed ? 'passed' : 'failed'));
    }

    // approvalStatus filter
    if (approvalStatus) {
      whereConditions.push(eq(schema.calibrations.approvalStatus, approvalStatus));
    }

    // search filter (multiple fields)
    if (search) {
      const searchCondition = or(
        sql`LOWER(${schema.calibrations.certificateNumber}) LIKE LOWER(${'%' + search + '%'})`,
        sql`LOWER(${schema.calibrations.notes}) LIKE LOWER(${'%' + search + '%'})`,
        sql`LOWER(${schema.calibrations.agencyName}) LIKE LOWER(${'%' + search + '%'})`,
        sql`LOWER(${schema.equipment.name}) LIKE LOWER(${'%' + search + '%'})`,
        sql`LOWER(${schema.equipment.managementNumber}) LIKE LOWER(${'%' + search + '%'})`
      );
      if (searchCondition) {
        whereConditions.push(searchCondition);
      }
    }

    // ========== 2. Count total items ==========
    const countResult = await this.db
      .select({ count: count() })
      .from(schema.calibrations)
      .leftJoin(schema.equipment, eq(schema.calibrations.equipmentId, schema.equipment.id))
      .leftJoin(schema.teams, eq(schema.equipment.teamId, schema.teams.id))
      .where(whereConditions.length > 0 ? and(...whereConditions) : undefined);

    const totalItems = Number(countResult[0]?.count || 0);
    const totalPages = Math.ceil(totalItems / pageSize);
    const offset = (page - 1) * pageSize;

    // ========== 3. Build ORDER BY ==========
    let orderByClause;
    if (sort) {
      const [field, direction] = sort.split('.');
      const isAsc = direction === 'asc';

      // Map sort field to Drizzle column
      const sortColumn =
        {
          calibrationDate: schema.calibrations.calibrationDate,
          nextCalibrationDate: schema.calibrations.nextCalibrationDate,
          status: schema.calibrations.status,
          agencyName: schema.calibrations.agencyName,
          equipmentName: schema.equipment.name,
        }[field] || schema.calibrations.calibrationDate;

      orderByClause = isAsc ? asc(sortColumn) : desc(sortColumn);
    } else {
      orderByClause = desc(schema.calibrations.calibrationDate);
    }

    // ========== 4. Fetch data with JOINs ==========
    const items = await this.db
      .select({
        // Calibration fields
        id: schema.calibrations.id,
        equipmentId: schema.calibrations.equipmentId,
        technicianId: schema.calibrations.technicianId,
        status: schema.calibrations.status,
        calibrationDate: schema.calibrations.calibrationDate,
        completionDate: schema.calibrations.completionDate,
        nextCalibrationDate: schema.calibrations.nextCalibrationDate,
        agencyName: schema.calibrations.agencyName,
        certificateNumber: schema.calibrations.certificateNumber,
        certificatePath: schema.calibrations.certificatePath,
        result: schema.calibrations.result,
        cost: schema.calibrations.cost,
        notes: schema.calibrations.notes,
        intermediateCheckDate: schema.calibrations.intermediateCheckDate,
        approvalStatus: schema.calibrations.approvalStatus,
        registeredBy: schema.calibrations.registeredBy,
        approvedBy: schema.calibrations.approvedBy,
        registeredByRole: schema.calibrations.registeredByRole,
        registrarComment: schema.calibrations.registrarComment,
        approverComment: schema.calibrations.approverComment,
        rejectionReason: schema.calibrations.rejectionReason,
        createdAt: schema.calibrations.createdAt,
        updatedAt: schema.calibrations.updatedAt,

        // ✅ Joined equipment fields (CRITICAL for frontend)
        equipmentName: schema.equipment.name,
        managementNumber: schema.equipment.managementNumber,
        teamId: schema.equipment.teamId,

        // ✅ Joined team fields
        teamName: schema.teams.name,
      })
      .from(schema.calibrations)
      .leftJoin(schema.equipment, eq(schema.calibrations.equipmentId, schema.equipment.id))
      .leftJoin(schema.teams, eq(schema.equipment.teamId, schema.teams.id))
      .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
      .orderBy(orderByClause)
      .limit(pageSize)
      .offset(offset);

    // ========== 5. Return paginated response ==========
    return {
      items,
      meta: {
        totalItems,
        itemCount: items.length,
        itemsPerPage: pageSize,
        totalPages,
        currentPage: page,
      },
    };
  }

  async findOne(
    id: string
  ): Promise<
    import('/home/kmjkds/equipment_management_system/apps/backend/src/modules/calibration/calibration.service').CalibrationRecord
  > {
    const calibration = calibrations.find((cal) => cal.id === id);

    if (!calibration) {
      throw new NotFoundException(`교정 ID ${id}를 찾을 수 없습니다.`);
    }

    return calibration;
  }

  async update(
    id: string,
    updateCalibrationDto: UpdateCalibrationDto
  ): Promise<
    import('/home/kmjkds/equipment_management_system/apps/backend/src/modules/calibration/calibration.service').CalibrationRecord
  > {
    const index = calibrations.findIndex((cal) => cal.id === id);

    if (index === -1) {
      throw new NotFoundException(`교정 ID ${id}를 찾을 수 없습니다.`);
    }

    const now = new Date();
    calibrations[index] = {
      ...calibrations[index],
      ...updateCalibrationDto,
      updatedAt: now,
    } as CalibrationRecord;

    return calibrations[index];
  }

  async remove(id: string): Promise<{ id: string; deleted: boolean }> {
    const index = calibrations.findIndex((cal) => cal.id === id);

    if (index === -1) {
      throw new NotFoundException(`교정 ID ${id}를 찾을 수 없습니다.`);
    }

    calibrations.splice(index, 1);
    return { id, deleted: true };
  }

  // 특정 장비의 교정 기록 조회
  async findByEquipment(equipmentId: string): Promise<{
    items: {
      id: string;
      equipmentId: string;
      technicianId: string | null;
      status: string;
      calibrationDate: Date;
      completionDate: Date | null;
      nextCalibrationDate: Date | null;
      agencyName: string | null;
      certificateNumber: string | null;
      certificatePath: string | null;
      result: string | null;
      cost: string | null;
      notes: string | null;
      intermediateCheckDate: string | null;
      approvalStatus: string;
      registeredBy: string | null;
      approvedBy: string | null;
      registeredByRole: string | null;
      registrarComment: string | null;
      approverComment: string | null;
      rejectionReason: string | null;
      createdAt: Date;
      updatedAt: Date;
      equipmentName: string | null;
      managementNumber: string | null;
      teamId: string | null;
      teamName: string | null;
    }[];
    meta: {
      totalItems: number;
      itemCount: number;
      itemsPerPage: number;
      totalPages: number;
      currentPage: number;
    };
  }> {
    return this.findAll({ equipmentId });
  }

  // 특정 날짜 범위의 교정 일정 조회
  async findScheduled(
    fromDate: Date,
    toDate: Date
  ): Promise<{
    items: {
      id: string;
      equipmentId: string;
      technicianId: string | null;
      status: string;
      calibrationDate: Date;
      completionDate: Date | null;
      nextCalibrationDate: Date | null;
      agencyName: string | null;
      certificateNumber: string | null;
      certificatePath: string | null;
      result: string | null;
      cost: string | null;
      notes: string | null;
      intermediateCheckDate: string | null;
      approvalStatus: string;
      registeredBy: string | null;
      approvedBy: string | null;
      registeredByRole: string | null;
      registrarComment: string | null;
      approverComment: string | null;
      rejectionReason: string | null;
      createdAt: Date;
      updatedAt: Date;
      equipmentName: string | null;
      managementNumber: string | null;
      teamId: string | null;
      teamName: string | null;
    }[];
    meta: {
      totalItems: number;
      itemCount: number;
      itemsPerPage: number;
      totalPages: number;
      currentPage: number;
    };
  }> {
    return this.findAll({
      fromDate,
      toDate,
      statuses: 'scheduled',
    });
  }

  // 교정 상태 변경
  async updateStatus(
    id: string,
    status: CalibrationStatus
  ): Promise<
    import('/home/kmjkds/equipment_management_system/apps/backend/src/modules/calibration/calibration.service').CalibrationRecord
  > {
    return this.update(id, { status });
  }

  // 예정된 교정 완료 처리
  async completeCalibration(
    id: string,
    updateDto: UpdateCalibrationDto
  ): Promise<
    import('/home/kmjkds/equipment_management_system/apps/backend/src/modules/calibration/calibration.service').CalibrationRecord
  > {
    const calibration = await this.findOne(id);

    if (calibration.status !== 'scheduled' && calibration.status !== 'in_progress') {
      throw new Error('예정되었거나 진행 중인 교정만 완료 처리할 수 있습니다.');
    }

    return this.update(id, {
      ...updateDto,
      status: 'completed',
    });
  }

  // 특정 담당자가 담당하는 교정 목록 조회
  async findByManager(calibrationManagerId: string): Promise<{
    items: {
      id: string;
      equipmentId: string;
      technicianId: string | null;
      status: string;
      calibrationDate: Date;
      completionDate: Date | null;
      nextCalibrationDate: Date | null;
      agencyName: string | null;
      certificateNumber: string | null;
      certificatePath: string | null;
      result: string | null;
      cost: string | null;
      notes: string | null;
      intermediateCheckDate: string | null;
      approvalStatus: string;
      registeredBy: string | null;
      approvedBy: string | null;
      registeredByRole: string | null;
      registrarComment: string | null;
      approverComment: string | null;
      rejectionReason: string | null;
      createdAt: Date;
      updatedAt: Date;
      equipmentName: string | null;
      managementNumber: string | null;
      teamId: string | null;
      teamName: string | null;
    }[];
    meta: {
      totalItems: number;
      itemCount: number;
      itemsPerPage: number;
      totalPages: number;
      currentPage: number;
    };
  }> {
    return this.findAll({ calibrationManagerId });
  }

  // 다음 교정 예정일이 다가오는 장비 교정 기록 조회
  // ✅ UTC 기준 날짜 비교
  async findDueCalibrations(days: number): Promise<{
    items: {
      id: string;
      equipmentId: string;
      technicianId: string | null;
      status: string;
      calibrationDate: Date;
      completionDate: Date | null;
      nextCalibrationDate: Date | null;
      agencyName: string | null;
      certificateNumber: string | null;
      certificatePath: string | null;
      result: string | null;
      cost: string | null;
      notes: string | null;
      intermediateCheckDate: string | null;
      approvalStatus: string;
      registeredBy: string | null;
      approvedBy: string | null;
      registeredByRole: string | null;
      registrarComment: string | null;
      approverComment: string | null;
      rejectionReason: string | null;
      createdAt: Date;
      updatedAt: Date;
      equipmentName: string | null;
      managementNumber: string | null;
      teamId: string | null;
      teamName: string | null;
    }[];
    meta: {
      totalItems: number;
      itemCount: number;
      itemsPerPage: number;
      totalPages: number;
      currentPage: number;
    };
  }> {
    const today = getUtcStartOfDay();
    const dueDate = addDaysUtc(today, days);

    return this.findAll({
      nextFromDate: today,
      nextToDate: dueDate,
    });
  }

  // 승인 대기 중인 교정 목록 조회 (with team relations)
  async findPendingApprovals(): Promise<{
    items: Array<{
      id: string;
      equipmentId: string;
      technicianId: string | null;
      status: string;
      calibrationDate: Date;
      completionDate: Date | null;
      nextCalibrationDate: Date | null;
      agencyName: string | null;
      certificateNumber: string | null;
      certificatePath: string | null;
      result: string | null;
      cost: string | null;
      notes: string | null;
      intermediateCheckDate: string | null;
      approvalStatus: string;
      registeredBy: string | null;
      approvedBy: string | null;
      registeredByRole: string | null;
      registrarComment: string | null;
      approverComment: string | null;
      rejectionReason: string | null;
      createdAt: Date;
      updatedAt: Date;
      equipmentName: string | null;
      managementNumber: string | null;
      teamId: string | null;
      teamName: string | null;
      registeredByUser?: {
        id: string;
        name: string;
        email: string;
        team: {
          id: string;
          name: string;
        } | null;
      } | null;
      approvedByUser?: {
        id: string;
        name: string;
        email: string;
      } | null;
    }>;
    meta: {
      totalItems: number;
      itemCount: number;
      itemsPerPage: number;
      totalPages: number;
      currentPage: number;
    };
  }> {
    // Use Drizzle relational query to include user→team relations
    const items = await this.db.query.calibrations.findMany({
      where: (calibrations, { eq }) =>
        eq(calibrations.approvalStatus, CalibrationApprovalStatusEnum.enum.pending_approval),
      with: {
        equipment: {
          columns: {
            id: true,
            name: true,
            managementNumber: true,
            teamId: true,
          },
        },
        registeredByUser: {
          columns: {
            id: true,
            name: true,
            email: true,
          },
          with: {
            team: true, // ← Critical: includes team relation
          },
        },
        approvedByUser: {
          columns: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: (calibrations, { desc }) => [desc(calibrations.createdAt)],
    });

    // Transform to match expected response format
    const transformedItems = items.map((item) => ({
      id: item.id,
      equipmentId: item.equipmentId,
      technicianId: item.technicianId,
      status: item.status,
      calibrationDate: item.calibrationDate,
      completionDate: item.completionDate,
      nextCalibrationDate: item.nextCalibrationDate,
      agencyName: item.agencyName,
      certificateNumber: item.certificateNumber,
      certificatePath: item.certificatePath,
      result: item.result,
      cost: item.cost,
      notes: item.notes,
      intermediateCheckDate: item.intermediateCheckDate,
      approvalStatus: item.approvalStatus,
      registeredBy: item.registeredBy,
      approvedBy: item.approvedBy,
      registeredByRole: item.registeredByRole,
      registrarComment: item.registrarComment,
      approverComment: item.approverComment,
      rejectionReason: item.rejectionReason,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      equipmentName: item.equipment?.name || null,
      managementNumber: item.equipment?.managementNumber || null,
      teamId: item.equipment?.teamId || null,
      teamName: null, // Will be populated from registeredByUser.team if needed
      registeredByUser: item.registeredByUser || null,
      approvedByUser: item.approvedByUser || null,
    }));

    return {
      items: transformedItems,
      meta: {
        totalItems: transformedItems.length,
        itemCount: transformedItems.length,
        itemsPerPage: 20,
        totalPages: 1,
        currentPage: 1,
      },
    };
  }

  // 교정 승인 (CAS 보호)
  async approveCalibration(
    id: string,
    approveDto: ApproveCalibrationDto
  ): Promise<
    import('/home/kmjkds/equipment_management_system/apps/backend/src/modules/calibration/calibration.service').CalibrationRecord
  > {
    const calibration = await this.findOne(id);

    if (calibration.approvalStatus !== CalibrationApprovalStatusEnum.enum.pending_approval) {
      throw new BadRequestException('승인 대기 상태인 교정만 승인할 수 있습니다.');
    }

    if (!approveDto.approverComment) {
      throw new BadRequestException('승인 시 승인자 코멘트는 필수입니다.');
    }

    // ✅ CAS: DB 기반 optimistic locking
    await this.updateWithVersion(
      schema.calibrations,
      id,
      approveDto.version,
      {
        approvalStatus: CalibrationApprovalStatusEnum.enum.approved,
        approvedBy: approveDto.approverId,
        approverComment: approveDto.approverComment,
      },
      '교정 기록'
    );

    // 인메모리 캐시도 동기화
    const index = calibrations.findIndex((cal) => cal.id === id);
    if (index !== -1) {
      calibrations[index] = {
        ...calibrations[index],
        approvalStatus: CalibrationApprovalStatusEnum.enum.approved,
        approvedBy: approveDto.approverId,
        approverComment: approveDto.approverComment,
        updatedAt: new Date(),
      };
    }

    // 장비 교정일 자동 업데이트 및 교정 기한 초과 부적합 자동 조치
    await this.updateEquipmentCalibrationDates(
      calibration.equipmentId,
      calibration.calibrationDate,
      calibration.nextCalibrationDate,
      id, // calibrationId
      approveDto.approverId // 승인자 ID
    );

    return calibration;
  }

  /**
   * 장비의 교정일자를 자동 업데이트합니다.
   * 교정 승인 시 호출되어 장비의 lastCalibrationDate, nextCalibrationDate를 갱신합니다.
   */
  private async updateEquipmentCalibrationDates(
    equipmentId: string,
    calibrationDate: Date,
    nextCalibrationDate: Date,
    calibrationId?: string,
    approverId?: string
  ): Promise<void> {
    try {
      await this.db
        .update(schema.equipment)
        .set({
          lastCalibrationDate: calibrationDate,
          nextCalibrationDate: nextCalibrationDate,
          updatedAt: new Date(),
          version: sql`${schema.equipment.version} + 1`,
        })
        .where(eq(schema.equipment.id, equipmentId));

      this.logger.log(
        `장비 교정일 업데이트 완료: ${equipmentId}, ` +
          `lastCalibrationDate: ${calibrationDate}, ` +
          `nextCalibrationDate: ${nextCalibrationDate}`
      );

      // 교정 기한 초과 부적합 자동 조치 완료 처리
      if (calibrationId) {
        await this.markCalibrationOverdueAsCorrected(equipmentId, calibrationId, approverId);
      }
    } catch (error) {
      this.logger.error(`장비 교정일 업데이트 실패: ${equipmentId}`, error);
      // 장비 업데이트 실패는 교정 승인을 차단하지 않음 (best effort)
    }
  }

  /**
   * 교정 완료 시 calibration_overdue 부적합 자동 조치 완료 처리
   *
   * 교정 승인 후 호출되어 해당 장비의 open calibration_overdue 부적합을
   * corrected 상태로 변경하고, 장비 상태를 available로 복원합니다.
   *
   * @param equipmentId 장비 ID
   * @param calibrationId 교정 기록 ID (연결용)
   * @param correctedBy 조치자 ID
   */
  private async markCalibrationOverdueAsCorrected(
    equipmentId: string,
    calibrationId: string,
    correctedBy?: string
  ): Promise<void> {
    try {
      // open 또는 analyzing 상태의 calibration_overdue 부적합 조회
      const existingNc = await this.db
        .select({
          id: nonConformances.id,
          status: nonConformances.status,
        })
        .from(nonConformances)
        .where(
          and(
            eq(nonConformances.equipmentId, equipmentId),
            eq(nonConformances.ncType, 'calibration_overdue'),
            isNull(nonConformances.deletedAt),
            sql`${nonConformances.status} IN ('open', 'analyzing')`
          )
        )
        .limit(1);

      if (existingNc.length === 0) {
        this.logger.debug(`장비 ${equipmentId}: open calibration_overdue 부적합 없음`);
        return;
      }

      const nc = existingNc[0];
      const today = new Date();

      // 트랜잭션으로 부적합 조치 + 장비 상태 복원 처리
      await this.db.transaction(async (tx) => {
        // (A) 부적합을 corrected 상태로 변경
        await tx
          .update(nonConformances)
          .set({
            status: 'corrected',
            resolutionType: 'recalibration',
            calibrationId,
            correctionContent: '교정 완료로 인한 자동 조치 완료',
            correctionDate: today.toISOString().split('T')[0],
            correctedBy: correctedBy || null,
            updatedAt: today,
          })
          .where(eq(nonConformances.id, nc.id));

        // (B) 장비 상태를 available로 복원
        // 교정 완료로 부적합이 해결되었으므로 정상 사용 가능 상태로 변경
        await tx
          .update(schema.equipment)
          .set({
            status: 'available',
            updatedAt: today,
          })
          .where(eq(schema.equipment.id, equipmentId));

        this.logger.log(
          `장비 ${equipmentId}: calibration_overdue 부적합(${nc.id}) 조치 완료 + 상태 available로 복원`
        );
      });
    } catch (error) {
      this.logger.error(
        `calibration_overdue 부적합 자동 조치 실패: ${equipmentId}`,
        error instanceof Error ? error.stack : String(error)
      );
      // 부적합 조치 실패는 교정 승인을 차단하지 않음 (best effort)
    }
  }

  // 교정 반려 (CAS 보호)
  async rejectCalibration(
    id: string,
    rejectDto: RejectCalibrationDto
  ): Promise<
    import('/home/kmjkds/equipment_management_system/apps/backend/src/modules/calibration/calibration.service').CalibrationRecord
  > {
    const calibration = await this.findOne(id);

    if (calibration.approvalStatus !== CalibrationApprovalStatusEnum.enum.pending_approval) {
      throw new BadRequestException('승인 대기 상태인 교정만 반려할 수 있습니다.');
    }

    if (!rejectDto.rejectionReason) {
      throw new BadRequestException('반려 사유는 필수입니다.');
    }

    // ✅ CAS: DB 기반 optimistic locking
    await this.updateWithVersion(
      schema.calibrations,
      id,
      rejectDto.version,
      {
        approvalStatus: CalibrationApprovalStatusEnum.enum.rejected,
        approvedBy: rejectDto.approverId,
        rejectionReason: rejectDto.rejectionReason,
      },
      '교정 기록'
    );

    // 인메모리 캐시도 동기화
    const index = calibrations.findIndex((cal) => cal.id === id);
    if (index !== -1) {
      calibrations[index] = {
        ...calibrations[index],
        approvalStatus: CalibrationApprovalStatusEnum.enum.rejected,
        approvedBy: rejectDto.approverId,
        rejectionReason: rejectDto.rejectionReason,
        updatedAt: new Date(),
      };
    }

    return calibration;
  }

  // 중간점검 일정이 다가오는 교정 조회
  async findUpcomingIntermediateChecks(
    days: number = 7
  ): Promise<
    import('/home/kmjkds/equipment_management_system/apps/backend/src/modules/calibration/calibration.service').CalibrationRecord[]
  > {
    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(today.getDate() + days);

    return calibrations.filter((cal) => {
      if (!cal.intermediateCheckDate) return false;
      const checkDate = new Date(cal.intermediateCheckDate);
      return checkDate >= today && checkDate <= futureDate;
    });
  }

  // 중간점검 완료 처리
  async completeIntermediateCheck(
    id: string,
    completedBy: string,
    notes?: string
  ): Promise<{ calibration: CalibrationRecord; message: string }> {
    const calibration = await this.findOne(id);

    if (!calibration.intermediateCheckDate) {
      throw new BadRequestException('이 교정에는 중간점검이 예정되어 있지 않습니다.');
    }

    const index = calibrations.findIndex((cal) => cal.id === id);
    const now = new Date();

    // 중간점검 완료 기록 (다음 중간점검일은 6개월 후로 설정)
    const nextIntermediateCheckDate = new Date(now);
    nextIntermediateCheckDate.setMonth(nextIntermediateCheckDate.getMonth() + 6);

    calibrations[index] = {
      ...calibrations[index],
      // 중간점검 완료 시 다음 중간점검일로 업데이트
      intermediateCheckDate: nextIntermediateCheckDate,
      resultNotes: notes
        ? `${calibrations[index].resultNotes || ''}\n[${now.toISOString()}] 중간점검 완료: ${notes} (담당자: ${completedBy})`
        : `${calibrations[index].resultNotes || ''}\n[${now.toISOString()}] 중간점검 완료 (담당자: ${completedBy})`,
      updatedAt: now,
    };

    return {
      calibration: calibrations[index],
      message: '중간점검이 완료되었습니다.',
    };
  }

  // 중간점검 필요 장비 목록 조회 (과거 및 예정)
  async findAllIntermediateChecks(query?: {
    status?: 'pending' | 'completed' | 'overdue';
    equipmentId?: string;
    managerId?: string;
  }): Promise<{
    items: Array<
      CalibrationRecord & {
        equipment?: {
          id: string;
          name: string;
          managementNumber: string;
          teamId: string | null;
          team?: { id: string; name: string } | null;
        };
      }
    >;
    meta: { totalItems: number; overdueCount: number; pendingCount: number };
  }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Use Drizzle relational query with equipment→team relations
    const items = await this.db.query.calibrations.findMany({
      where: (calibrations, { isNotNull, eq, and: andFn }) => {
        const conditions = [isNotNull(calibrations.intermediateCheckDate)];

        if (query?.equipmentId) {
          conditions.push(eq(calibrations.equipmentId, query.equipmentId));
        }

        // Note: managerId filter removed as technicianId doesn't map to manager role
        // Schema has technicianId (교정 담당자), not calibrationManagerId

        return andFn(...conditions);
      },
      with: {
        equipment: {
          columns: {
            id: true,
            name: true,
            managementNumber: true,
            teamId: true,
          },
          with: {
            team: true, // ← Critical: includes team relation
          },
        },
      },
      orderBy: (calibrations, { asc: ascFn }) => [ascFn(calibrations.intermediateCheckDate)],
    });

    // Filter by status (overdue/pending) in memory since it requires date comparison
    let results = items;
    if (query?.status) {
      results = items.filter((cal) => {
        if (!cal.intermediateCheckDate) return false;

        const checkDate = new Date(cal.intermediateCheckDate);
        checkDate.setHours(0, 0, 0, 0);

        if (query.status === 'overdue') {
          return checkDate < today;
        } else if (query.status === 'pending') {
          return checkDate >= today;
        }
        return true;
      });
    }

    return {
      items: results as unknown as Array<
        CalibrationRecord & {
          equipment?: {
            id: string;
            name: string;
            managementNumber: string;
            teamId: string | null;
            team?: { id: string; name: string } | null;
          };
        }
      >,
      meta: {
        totalItems: results.length,
        overdueCount: items.filter((cal) => {
          if (!cal.intermediateCheckDate) return false;
          const checkDate = new Date(cal.intermediateCheckDate);
          checkDate.setHours(0, 0, 0, 0);
          return checkDate < today;
        }).length,
        pendingCount: items.filter((cal) => {
          if (!cal.intermediateCheckDate) return false;
          const checkDate = new Date(cal.intermediateCheckDate);
          checkDate.setHours(0, 0, 0, 0);
          return checkDate >= today;
        }).length,
      },
    };
  }
}

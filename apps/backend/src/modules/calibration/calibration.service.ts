import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Logger,
  Inject,
} from '@nestjs/common';
import type { AppDatabase } from '@equipment-management/db';
import { VersionedBaseService } from '../../common/base/versioned-base.service';
import { SimpleCacheService } from '../../common/cache/simple-cache.service';
import { CACHE_KEY_PREFIXES } from '../../common/cache/cache-key-prefixes';
import { CreateCalibrationDto } from './dto/create-calibration.dto';
import { UpdateCalibrationDto } from './dto/update-calibration.dto';
import { CalibrationQueryDto } from './dto/calibration-query.dto';
import { ApproveCalibrationDto, RejectCalibrationDto } from './dto/approve-calibration.dto';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { NOTIFICATION_EVENTS } from '../notifications/events/notification-events';
import {
  CalibrationStatus,
  type CalibrationApprovalStatus,
  CalibrationApprovalStatusEnum,
  NonConformanceStatusValues as NCStatusVal,
  NonConformanceTypeValues as NCTypeVal,
  EquipmentStatusValues as ESVal,
  DEFAULT_LOCALE,
} from '@equipment-management/schemas';
import { nonConformances } from '@equipment-management/db/schema/non-conformances';
import { CACHE_TTL } from '@equipment-management/shared-constants';
import {
  getUtcStartOfDay,
  getUtcEndOfDay,
  addDaysUtc,
  calculateNextCalibrationDate,
} from '../../common/utils';
import * as schema from '@equipment-management/db/schema';
import { and, eq, gte, lte, count, sql, or, desc, asc, SQL, isNull } from 'drizzle-orm';
import { likeContains, safeIlike } from '../../common/utils/like-escape';
import { I18nService } from '../../common/i18n/i18n.service';

// Drizzle 추론 타입 (DB 컬럼과 1:1 대응)
type CalibrationRow = typeof schema.calibrations.$inferSelect;

/**
 * 교정 기록 인터페이스 (API 응답 SSOT)
 *
 * SSOT 체인: DB Schema → CalibrationRow → transformDbToRecord() → CalibrationRecord
 * 프론트엔드 Calibration 인터페이스와 1:1 대응
 */
export interface CalibrationRecord {
  id: string;
  equipmentId: string;
  calibrationManagerId: string;
  calibrationDate: Date;
  nextCalibrationDate: Date;
  status: string;
  calibrationAgency: string;
  certificateNumber: string | null;
  certificatePath: string | null;
  result: string | null;
  cost: number | null;
  notes: string | null;
  approvalStatus: string;
  registeredBy: string | null;
  approvedBy: string | null;
  registeredByRole: string | null;
  registrarComment: string | null;
  approverComment: string | null;
  rejectionReason: string | null;
  intermediateCheckDate: Date | null;
  version: number;
  createdAt: Date;
  updatedAt: Date;
  // 조인 필드 (목록 조회 시)
  equipmentName?: string;
  managementNumber?: string;
  team?: string;
  teamId?: string;
  teamName?: string;
}

@Injectable()
export class CalibrationService extends VersionedBaseService {
  private readonly logger = new Logger(CalibrationService.name);

  constructor(
    @Inject('DRIZZLE_INSTANCE')
    protected readonly db: AppDatabase,
    private readonly cacheService: SimpleCacheService,
    private readonly eventEmitter: EventEmitter2,
    private readonly i18n: I18nService
  ) {
    super();
  }

  // ============================================================================
  // 캐시 관리
  // ============================================================================

  private buildCacheKey(type: string, id?: string): string {
    return id
      ? `${CACHE_KEY_PREFIXES.CALIBRATION}${type}:${id}`
      : `${CACHE_KEY_PREFIXES.CALIBRATION}${type}`;
  }

  private invalidateCalibrationCache(id?: string): void {
    if (id) {
      this.cacheService.delete(this.buildCacheKey('detail', id));
    }
    this.cacheService.deleteByPattern(`${CACHE_KEY_PREFIXES.CALIBRATION}list:*`);
    this.cacheService.deleteByPattern(`${CACHE_KEY_PREFIXES.CALIBRATION}pending:*`);
  }

  // ============================================================================
  // DB ↔ CalibrationRecord 변환 헬퍼
  // DTO 필드명(calibrationAgency)과 DB 컬럼명(agencyName)의 불일치를 해결
  // ============================================================================

  /**
   * DB row → CalibrationRecord (API 응답 SSOT)
   *
   * 유일한 DB↔API 변환 지점. 모든 메서드가 이 함수를 통해 응답을 생성합니다.
   * DB 컬럼명 → API 필드명 매핑:
   *   - technicianId → calibrationManagerId
   *   - agencyName → calibrationAgency
   *   - certificateNumber → certificateNumber (동일)
   *   - notes → notes (동일)
   */
  private transformDbToRecord(row: CalibrationRow): CalibrationRecord {
    return {
      id: row.id,
      equipmentId: row.equipmentId,
      calibrationManagerId: row.technicianId || '',
      calibrationDate: row.calibrationDate,
      nextCalibrationDate: row.nextCalibrationDate || new Date(),
      status: row.status,
      calibrationAgency: row.agencyName || '',
      certificateNumber: row.certificateNumber,
      certificatePath: row.certificatePath,
      result: row.result?.toLowerCase() ?? null,
      cost: row.cost ? Number(row.cost) : null,
      notes: row.notes,
      approvalStatus: row.approvalStatus,
      registeredBy: row.registeredBy,
      approvedBy: row.approvedBy,
      registeredByRole: row.registeredByRole,
      registrarComment: row.registrarComment,
      approverComment: row.approverComment,
      rejectionReason: row.rejectionReason,
      intermediateCheckDate: row.intermediateCheckDate ? new Date(row.intermediateCheckDate) : null,
      version: row.version,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  /**
   * CreateCalibrationDto → DB insert 데이터
   * DTO 필드명 → DB 컬럼명 매핑
   *
   * ✅ Zod 검증 적용됨 → DTO 필드명만 처리 (raw body 폴백 불필요)
   * 매핑:
   *   - calibrationManagerId → technicianId
   *   - calibrationAgency → agencyName
   *   - certificateNumber → certificateNumber (동일)
   *   - notes → notes (동일)
   */
  private transformDtoToInsert(
    dto: CreateCalibrationDto,
    approvalStatus: CalibrationApprovalStatus
  ): typeof schema.calibrations.$inferInsert {
    // result: 대소문자 정규화 (PASS → pass, FAIL → fail, CONDITIONAL → conditional)
    const resultValue = dto.result || null;
    const normalizedResult = resultValue ? resultValue.toLowerCase() : null;

    // technicianId: calibrationManagerId 우선, registeredBy 폴백
    const technicianId = dto.calibrationManagerId || dto.registeredBy || null;

    return {
      equipmentId: dto.equipmentId,
      technicianId,
      calibrationDate: dto.calibrationDate,
      nextCalibrationDate: dto.nextCalibrationDate,
      status: dto.status || 'scheduled',
      agencyName: dto.calibrationAgency || null,
      certificateNumber: dto.certificateNumber || null,
      certificatePath: dto.certificatePath || null,
      result: normalizedResult,
      cost: dto.cost?.toString() || null,
      notes: dto.notes || null,
      intermediateCheckDate: dto.intermediateCheckDate
        ? dto.intermediateCheckDate instanceof Date
          ? dto.intermediateCheckDate.toISOString().split('T')[0]
          : String(dto.intermediateCheckDate)
        : null,
      approvalStatus,
      registeredBy: dto.registeredBy || null,
      approvedBy: null,
      registeredByRole: dto.registeredByRole || null,
      registrarComment: dto.registrarComment || null,
      approverComment: null,
      rejectionReason: null,
    };
  }

  // ============================================================================
  // CRUD 메서드 (모두 DB 기반)
  // ============================================================================

  /**
   * 교정 상세 조회
   * GET /api/calibration/:uuid
   *
   * ✅ DB 쿼리 사용 (기존 인메모리 배열 검색 → DB 조회로 수정)
   * ✅ checkout 모듈의 findOne 패턴과 동일
   */
  async findOne(id: string): Promise<CalibrationRecord> {
    const cacheKey = this.buildCacheKey('detail', id);
    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        const [row] = await this.db
          .select()
          .from(schema.calibrations)
          .where(eq(schema.calibrations.id, id))
          .limit(1);

        if (!row) {
          throw new NotFoundException({
            code: 'CALIBRATION_NOT_FOUND',
            message: `Calibration ID ${id} not found`,
          });
        }

        return this.transformDbToRecord(row);
      },
      CACHE_TTL.LONG
    );
  }

  /**
   * 교정 등록
   * POST /api/calibration
   *
   * ✅ DB insert 사용 (기존 인메모리 push → DB insert로 수정)
   * ✅ checkout 모듈의 create 패턴과 동일: .insert().values().returning()
   */
  async create(createCalibrationDto: CreateCalibrationDto): Promise<CalibrationRecord> {
    // 모든 교정 기록은 기술책임자 이상의 승인 필요
    const approvalStatus = CalibrationApprovalStatusEnum.enum.pending_approval;

    // SSOT: nextCalibrationDate는 장비의 calibrationCycle 기반으로 백엔드에서 계산
    const [equip] = await this.db
      .select({ calibrationCycle: schema.equipment.calibrationCycle })
      .from(schema.equipment)
      .where(eq(schema.equipment.id, createCalibrationDto.equipmentId))
      .limit(1);

    const computedNextDate = calculateNextCalibrationDate(
      createCalibrationDto.calibrationDate,
      equip?.calibrationCycle ?? undefined
    );

    const dtoWithComputedDate = {
      ...createCalibrationDto,
      nextCalibrationDate:
        computedNextDate ??
        createCalibrationDto.nextCalibrationDate ??
        createCalibrationDto.calibrationDate,
    };

    const insertData = this.transformDtoToInsert(dtoWithComputedDate, approvalStatus);

    const [inserted] = await this.db.insert(schema.calibrations).values(insertData).returning();

    this.logger.log(
      `교정 기록 등록: ${inserted.id} (장비: ${inserted.equipmentId}, 등록자: ${inserted.registeredBy})`
    );

    this.invalidateCalibrationCache();

    // 📢 알림 이벤트 발행 (교정 등록 → 승인자에게 알림)
    try {
      const [equip] = await this.db
        .select({
          name: schema.equipment.name,
          managementNumber: schema.equipment.managementNumber,
          teamId: schema.equipment.teamId,
        })
        .from(schema.equipment)
        .where(eq(schema.equipment.id, inserted.equipmentId))
        .limit(1);
      this.eventEmitter.emit(NOTIFICATION_EVENTS.CALIBRATION_CREATED, {
        calibrationId: inserted.id,
        equipmentId: inserted.equipmentId,
        equipmentName: equip?.name ?? '',
        managementNumber: equip?.managementNumber ?? '',
        teamId: equip?.teamId ?? '',
        actorId: inserted.registeredBy ?? '',
        actorName: '',
        timestamp: new Date(),
      });
    } catch {
      // 알림 발행 실패가 비즈니스 로직을 차단하지 않음
    }

    return this.transformDbToRecord(inserted);
  }

  /**
   * 교정 정보 수정
   * PATCH /api/calibration/:uuid
   *
   * ✅ DB update 사용 (기존 인메모리 배열 조작 → DB update로 수정)
   */
  async update(id: string, updateCalibrationDto: UpdateCalibrationDto): Promise<CalibrationRecord> {
    // 먼저 존재 여부 확인
    await this.findOne(id);

    // DTO → DB 컬럼 매핑 (부분 업데이트)
    const updateData: Record<string, unknown> = {};

    if (updateCalibrationDto.calibrationAgency !== undefined) {
      updateData.agencyName = updateCalibrationDto.calibrationAgency;
    }
    if (updateCalibrationDto.certificateNumber !== undefined) {
      updateData.certificateNumber = updateCalibrationDto.certificateNumber;
    }
    if (updateCalibrationDto.calibrationManagerId !== undefined) {
      updateData.technicianId = updateCalibrationDto.calibrationManagerId;
    }
    if (updateCalibrationDto.notes !== undefined) {
      updateData.notes = updateCalibrationDto.notes;
    }
    if (updateCalibrationDto.certificatePath !== undefined) {
      updateData.certificatePath = updateCalibrationDto.certificatePath;
    }
    if (updateCalibrationDto.calibrationDate !== undefined) {
      updateData.calibrationDate = updateCalibrationDto.calibrationDate;
    }
    if (updateCalibrationDto.nextCalibrationDate !== undefined) {
      updateData.nextCalibrationDate = updateCalibrationDto.nextCalibrationDate;
    }
    if (updateCalibrationDto.status !== undefined) {
      updateData.status = updateCalibrationDto.status;
    }
    if (updateCalibrationDto.result !== undefined) {
      updateData.result = updateCalibrationDto.result;
    }
    if (updateCalibrationDto.cost !== undefined) {
      updateData.cost = updateCalibrationDto.cost?.toString();
    }
    if (updateCalibrationDto.intermediateCheckDate !== undefined) {
      updateData.intermediateCheckDate = updateCalibrationDto.intermediateCheckDate
        ? updateCalibrationDto.intermediateCheckDate instanceof Date
          ? updateCalibrationDto.intermediateCheckDate.toISOString().split('T')[0]
          : String(updateCalibrationDto.intermediateCheckDate)
        : null;
    }

    if (updateCalibrationDto.version !== undefined) {
      // ✅ CAS 보호: 클라이언트가 version을 전송한 경우 (상태 변경 등)
      try {
        await this.updateWithVersion(
          schema.calibrations,
          id,
          updateCalibrationDto.version,
          updateData,
          'Calibration record'
        );
      } catch (error) {
        // ✅ CAS 캐시 정합성: 409 시 stale 캐시 제거
        if (error instanceof ConflictException) {
          this.cacheService.delete(this.buildCacheKey('detail', id));
        }
        throw error;
      }
    } else {
      // version 없는 내부 호출 (certificatePath 업데이트 등)
      const [updated] = await this.db
        .update(schema.calibrations)
        .set({ ...updateData, updatedAt: new Date() })
        .where(eq(schema.calibrations.id, id))
        .returning();

      if (!updated) {
        throw new NotFoundException({
          code: 'CALIBRATION_NOT_FOUND',
          message: `Calibration ID ${id} not found`,
        });
      }
    }

    this.invalidateCalibrationCache(id);
    return this.findOne(id);
  }

  /**
   * 교정 삭제
   * DELETE /api/calibration/:uuid
   *
   * ✅ DB delete 사용 (기존 인메모리 splice → DB delete로 수정)
   */
  async remove(id: string): Promise<{ id: string; deleted: boolean }> {
    // 존재 여부 확인
    await this.findOne(id);

    await this.db.delete(schema.calibrations).where(eq(schema.calibrations.id, id));

    this.invalidateCalibrationCache(id);
    return { id, deleted: true };
  }

  // ============================================================================
  // 목록 조회 (기존 DB 기반 - 변경 없음)
  // ============================================================================

  /**
   * 교정 요약 통계 조회
   * GET /api/calibration/summary
   *
   * ✅ UTC 기준 날짜 비교로 타임존 문제 방지
   * ✅ SSOT: EquipmentService와 동일한 날짜 계산 로직 사용
   */
  async getSummary(
    teamId?: string,
    site?: string
  ): Promise<{ total: number; overdueCount: number; dueInMonthCount: number }> {
    const today = getUtcStartOfDay();
    const thirtyDaysLater = getUtcEndOfDay(addDaysUtc(today, 30));

    // 공통 기본 조건
    const baseConditions: SQL<unknown>[] = [
      eq(schema.equipment.isActive, true),
      eq(schema.equipment.calibrationRequired, 'required'),
    ];
    if (teamId) baseConditions.push(eq(schema.equipment.teamId, teamId));
    if (site) baseConditions.push(eq(schema.equipment.site, site));

    const [totalResult] = await this.db
      .select({ count: count() })
      .from(schema.equipment)
      .where(and(...baseConditions));

    const [overdueResult] = await this.db
      .select({ count: count() })
      .from(schema.equipment)
      .where(
        and(
          ...baseConditions,
          sql`${schema.equipment.nextCalibrationDate} IS NOT NULL`,
          sql`${schema.equipment.nextCalibrationDate} < ${today.toISOString()}::timestamp`
        )
      );

    const [upcomingResult] = await this.db
      .select({ count: count() })
      .from(schema.equipment)
      .where(
        and(
          ...baseConditions,
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
   */
  async getOverdueCalibrations(
    teamId?: string,
    site?: string
  ): Promise<
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
    const today = getUtcStartOfDay();

    const whereConditions: SQL<unknown>[] = [
      eq(schema.equipment.isActive, true),
      eq(schema.equipment.calibrationRequired, 'required'),
      sql`${schema.equipment.nextCalibrationDate} IS NOT NULL`,
      sql`${schema.equipment.nextCalibrationDate} < ${today.toISOString()}::timestamp`,
    ];
    if (teamId) whereConditions.push(eq(schema.equipment.teamId, teamId));
    if (site) whereConditions.push(eq(schema.equipment.site, site));

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
      .where(and(...whereConditions))
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
   */
  async getUpcomingCalibrations(
    days: number = 30,
    teamId?: string,
    site?: string
  ): Promise<
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
    const today = getUtcStartOfDay();
    const futureDate = getUtcEndOfDay(addDaysUtc(today, days));

    const whereConditions: SQL<unknown>[] = [
      eq(schema.equipment.isActive, true),
      eq(schema.equipment.calibrationRequired, 'required'),
      sql`${schema.equipment.nextCalibrationDate} IS NOT NULL`,
      sql`${schema.equipment.nextCalibrationDate} >= ${today.toISOString()}::timestamp`,
      sql`${schema.equipment.nextCalibrationDate} <= ${futureDate.toISOString()}::timestamp`,
    ];
    if (teamId) whereConditions.push(eq(schema.equipment.teamId, teamId));
    if (site) whereConditions.push(eq(schema.equipment.site, site));

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
      .where(and(...whereConditions))
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

  async findAll(query: CalibrationQueryDto): Promise<{
    items: CalibrationRecord[];
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
      teamId,
      site,
    } = query;

    // ========== 1. Build WHERE conditions ==========
    const whereConditions: SQL<unknown>[] = [];

    if (equipmentId) {
      whereConditions.push(eq(schema.calibrations.equipmentId, equipmentId));
    }

    if (calibrationManagerId) {
      whereConditions.push(eq(schema.calibrations.technicianId, calibrationManagerId));
    }

    if (statuses) {
      const statusArray = statuses.split(',').map((s) => s.trim());
      whereConditions.push(
        sql`${schema.calibrations.status} IN (${sql.join(
          statusArray.map((s) => sql`${s}`),
          sql`, `
        )})`
      );
    }

    if (calibrationAgency) {
      whereConditions.push(
        safeIlike(schema.calibrations.agencyName, likeContains(calibrationAgency))
      );
    }

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

    if (isPassed !== undefined) {
      const isParsedPassed = isPassed === 'true';
      whereConditions.push(eq(schema.calibrations.result, isParsedPassed ? 'pass' : 'fail'));
    }

    if (approvalStatus) {
      whereConditions.push(
        eq(schema.calibrations.approvalStatus, approvalStatus as CalibrationApprovalStatus)
      );
    }

    if (search) {
      const pattern = likeContains(search);
      const searchCondition = or(
        safeIlike(schema.calibrations.certificateNumber, pattern),
        safeIlike(schema.calibrations.notes, pattern),
        safeIlike(schema.calibrations.agencyName, pattern),
        safeIlike(schema.equipment.name, pattern),
        safeIlike(schema.equipment.managementNumber, pattern)
      );
      if (searchCondition) {
        whereConditions.push(searchCondition);
      }
    }

    if (teamId) {
      whereConditions.push(eq(schema.equipment.teamId, teamId));
    }
    if (site) {
      whereConditions.push(eq(schema.equipment.site, site));
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
    // ✅ Phase 4: 전체 행 조회 후 transformDbToRecord()로 정규화
    const rows = await this.db
      .select({
        calibration: schema.calibrations,
        equipmentName: schema.equipment.name,
        managementNumber: schema.equipment.managementNumber,
        teamId: schema.equipment.teamId,
        teamName: schema.teams.name,
      })
      .from(schema.calibrations)
      .leftJoin(schema.equipment, eq(schema.calibrations.equipmentId, schema.equipment.id))
      .leftJoin(schema.teams, eq(schema.equipment.teamId, schema.teams.id))
      .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
      .orderBy(orderByClause)
      .limit(pageSize)
      .offset(offset);

    const items: CalibrationRecord[] = rows.map((row) => ({
      ...this.transformDbToRecord(row.calibration),
      equipmentName: row.equipmentName || undefined,
      managementNumber: row.managementNumber || undefined,
      team: row.teamName || undefined,
      teamId: row.teamId || undefined,
      teamName: row.teamName || undefined,
    }));

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

  async findByEquipment(equipmentId: string): Promise<{
    items: CalibrationRecord[];
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

  async findScheduled(
    fromDate: Date,
    toDate: Date
  ): Promise<{
    items: CalibrationRecord[];
    meta: {
      totalItems: number;
      itemCount: number;
      itemsPerPage: number;
      totalPages: number;
      currentPage: number;
    };
  }> {
    return this.findAll({ fromDate, toDate, statuses: 'scheduled' });
  }

  // 교정 상태 변경
  async updateStatus(id: string, status: CalibrationStatus): Promise<CalibrationRecord> {
    return this.update(id, { status });
  }

  // 예정된 교정 완료 처리
  async completeCalibration(
    id: string,
    updateDto: UpdateCalibrationDto
  ): Promise<CalibrationRecord> {
    const calibration = await this.findOne(id);

    if (calibration.status !== 'scheduled' && calibration.status !== 'in_progress') {
      throw new BadRequestException({
        code: 'CALIBRATION_INVALID_STATUS_FOR_COMPLETE',
        message: 'Only scheduled or in-progress calibrations can be completed.',
      });
    }

    return this.update(id, {
      ...updateDto,
      status: 'completed',
    });
  }

  async findByManager(calibrationManagerId: string): Promise<{
    items: CalibrationRecord[];
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

  async findDueCalibrations(days: number): Promise<{
    items: CalibrationRecord[];
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

  // ============================================================================
  // 승인 프로세스 (DB 기반 + CAS)
  // ============================================================================

  /**
   * 승인 대기 교정 목록 조회 (with team relations)
   * GET /api/calibration/pending
   *
   * ✅ version 필드 포함 (프론트엔드 CAS 버전 추출용)
   */
  async findPendingApprovals(): Promise<{
    items: (CalibrationRecord & {
      registeredByUser?: {
        id: string;
        name: string;
        email: string;
        team: { id: string; name: string } | null;
      } | null;
      approvedByUser?: { id: string; name: string; email: string } | null;
    })[];
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
      where: (calibrations, { eq: eqFn }) =>
        eqFn(calibrations.approvalStatus, CalibrationApprovalStatusEnum.enum.pending_approval),
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
          columns: { id: true, name: true, email: true },
          with: { team: true },
        },
        approvedByUser: {
          columns: { id: true, name: true, email: true },
        },
      },
      orderBy: (calibrations, { desc: descFn }) => [descFn(calibrations.createdAt)],
      limit: 500,
    });

    // ✅ Phase 4: transformDbToRecord 기반 정규화
    const transformedItems = items.map((item) => ({
      ...this.transformDbToRecord(item as unknown as CalibrationRow),
      equipmentName: item.equipment?.name || undefined,
      managementNumber: item.equipment?.managementNumber || undefined,
      teamId: item.equipment?.teamId || undefined,
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

  /**
   * 교정 승인 (CAS 보호)
   * PATCH /api/calibration/:uuid/approve
   *
   * ✅ findOne이 DB 쿼리로 변경되어 모든 교정 ID에 대해 정상 동작
   * ✅ 인메모리 동기화 코드 제거 (DB가 유일한 소스)
   */
  async approveCalibration(
    id: string,
    approveDto: ApproveCalibrationDto
  ): Promise<CalibrationRecord> {
    const calibration = await this.findOne(id);

    if (calibration.approvalStatus !== CalibrationApprovalStatusEnum.enum.pending_approval) {
      throw new BadRequestException({
        code: 'CALIBRATION_ONLY_PENDING_CAN_APPROVE',
        message: 'Only pending calibrations can be approved.',
      });
    }

    // ✅ CAS: DB 기반 optimistic locking
    try {
      await this.updateWithVersion(
        schema.calibrations,
        id,
        approveDto.version,
        {
          approvalStatus: CalibrationApprovalStatusEnum.enum.approved,
          approvedBy: approveDto.approverId,
          approverComment: approveDto.approverComment,
        },
        'Calibration record'
      );
    } catch (error) {
      // ✅ CAS 캐시 정합성: 409 시 stale 캐시 제거 (checkout 패턴)
      if (error instanceof ConflictException) {
        this.cacheService.delete(this.buildCacheKey('detail', id));
      }
      throw error;
    }

    // 캐시 무효화 (성공)
    this.invalidateCalibrationCache(id);

    // 장비 교정일 자동 업데이트 및 교정 기한 초과 부적합 자동 조치
    await this.updateEquipmentCalibrationDates(
      calibration.equipmentId,
      calibration.calibrationDate,
      id,
      approveDto.approverId
    );

    // 📢 알림 이벤트 발행 (교정 승인)
    // equipment JOIN으로 이벤트 페이로드 enrichment (findOne은 calibrations만 조회)
    const [approvedEquip] = await this.db
      .select({
        name: schema.equipment.name,
        managementNumber: schema.equipment.managementNumber,
        teamId: schema.equipment.teamId,
        site: schema.equipment.site,
      })
      .from(schema.equipment)
      .where(eq(schema.equipment.id, calibration.equipmentId))
      .limit(1);

    this.eventEmitter.emit(NOTIFICATION_EVENTS.CALIBRATION_APPROVED, {
      calibrationId: id,
      equipmentId: calibration.equipmentId,
      equipmentName: approvedEquip?.name ?? '',
      managementNumber: approvedEquip?.managementNumber ?? '',
      registeredBy: calibration.registeredBy ?? '',
      teamId: approvedEquip?.teamId ?? '',
      site: approvedEquip?.site ?? '',
      actorId: approveDto.approverId,
      actorName: '',
      timestamp: new Date(),
    });

    // ✅ 승인 완료된 최신 데이터 반환 (DB 재조회)
    return this.findOne(id);
  }

  /**
   * 장비의 교정일자를 자동 업데이트합니다.
   * 교정 승인 시 호출되어 장비의 lastCalibrationDate를 갱신하고,
   * nextCalibrationDate는 calibrationDate + calibrationCycle(개월)로 계산합니다.
   */
  private async updateEquipmentCalibrationDates(
    equipmentId: string,
    calibrationDate: Date,
    calibrationId?: string,
    approverId?: string
  ): Promise<void> {
    try {
      // 장비의 교정 주기 조회
      const [equip] = await this.db
        .select({ calibrationCycle: schema.equipment.calibrationCycle })
        .from(schema.equipment)
        .where(eq(schema.equipment.id, equipmentId))
        .limit(1);

      // 차기 교정일 = 교정일 + 교정주기(개월) — SSOT 유틸리티 사용
      const nextCalibrationDate =
        calculateNextCalibrationDate(calibrationDate, equip?.calibrationCycle ?? undefined) ??
        calibrationDate;

      await this.db
        .update(schema.equipment)
        .set({
          lastCalibrationDate: calibrationDate,
          nextCalibrationDate,
          updatedAt: new Date(),
          version: sql`${schema.equipment.version} + 1`,
        })
        .where(eq(schema.equipment.id, equipmentId));

      this.logger.log(
        `장비 교정일 업데이트 완료: ${equipmentId}, ` +
          `lastCalibrationDate: ${calibrationDate}, ` +
          `nextCalibrationDate: ${nextCalibrationDate}`
      );

      if (calibrationId) {
        await this.markCalibrationOverdueAsCorrected(equipmentId, calibrationId, approverId);
      }
    } catch (error) {
      this.logger.error(`장비 교정일 업데이트 실패: ${equipmentId}`, error);
    }
  }

  /**
   * 교정 완료 시 calibration_overdue 부적합 자동 조치 완료 처리
   */
  private async markCalibrationOverdueAsCorrected(
    equipmentId: string,
    calibrationId: string,
    correctedBy?: string
  ): Promise<void> {
    try {
      const existingNc = await this.db
        .select({
          id: nonConformances.id,
          status: nonConformances.status,
        })
        .from(nonConformances)
        .where(
          and(
            eq(nonConformances.equipmentId, equipmentId),
            eq(nonConformances.ncType, NCTypeVal.CALIBRATION_OVERDUE),
            isNull(nonConformances.deletedAt),
            eq(nonConformances.status, NCStatusVal.OPEN)
          )
        )
        .limit(1);

      if (existingNc.length === 0) {
        this.logger.debug(`장비 ${equipmentId}: open calibration_overdue 부적합 없음`);
        return;
      }

      const nc = existingNc[0];
      const today = new Date();

      await this.db.transaction(async (tx) => {
        await tx
          .update(nonConformances)
          .set({
            status: NCStatusVal.CORRECTED,
            resolutionType: 'recalibration',
            calibrationId,
            correctionContent: this.i18n.t(
              'system.calibrationOverdue.correctionContent',
              DEFAULT_LOCALE
            ),
            correctionDate: today.toISOString().split('T')[0],
            correctedBy: correctedBy || null,
            updatedAt: today,
          })
          .where(eq(nonConformances.id, nc.id));

        await tx
          .update(schema.equipment)
          .set({
            status: ESVal.AVAILABLE,
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
    }
  }

  /**
   * 교정 반려 (CAS 보호)
   * PATCH /api/calibration/:uuid/reject
   *
   * ✅ findOne이 DB 쿼리로 변경되어 모든 교정 ID에 대해 정상 동작
   * ✅ 인메모리 동기화 코드 제거 (DB가 유일한 소스)
   */
  async rejectCalibration(id: string, rejectDto: RejectCalibrationDto): Promise<CalibrationRecord> {
    const calibration = await this.findOne(id);

    if (calibration.approvalStatus !== CalibrationApprovalStatusEnum.enum.pending_approval) {
      throw new BadRequestException({
        code: 'CALIBRATION_ONLY_PENDING_CAN_REJECT',
        message: 'Only pending calibrations can be rejected.',
      });
    }

    if (!rejectDto.rejectionReason) {
      throw new BadRequestException({
        code: 'CALIBRATION_REJECTION_REASON_REQUIRED',
        message: 'Rejection reason is required.',
      });
    }

    // ✅ CAS: DB 기반 optimistic locking
    try {
      await this.updateWithVersion(
        schema.calibrations,
        id,
        rejectDto.version,
        {
          approvalStatus: CalibrationApprovalStatusEnum.enum.rejected,
          approvedBy: rejectDto.approverId,
          rejectionReason: rejectDto.rejectionReason,
        },
        'Calibration record'
      );
    } catch (error) {
      // ✅ CAS 캐시 정합성: 409 시 stale 캐시 제거
      if (error instanceof ConflictException) {
        this.cacheService.delete(this.buildCacheKey('detail', id));
      }
      throw error;
    }

    // 캐시 무효화 (성공)
    this.invalidateCalibrationCache(id);

    // 📢 알림 이벤트 발행 (교정 반려)
    // equipment JOIN으로 이벤트 페이로드 enrichment (findOne은 calibrations만 조회)
    const [rejectedEquip] = await this.db
      .select({
        name: schema.equipment.name,
        managementNumber: schema.equipment.managementNumber,
        teamId: schema.equipment.teamId,
        site: schema.equipment.site,
      })
      .from(schema.equipment)
      .where(eq(schema.equipment.id, calibration.equipmentId))
      .limit(1);

    this.eventEmitter.emit(NOTIFICATION_EVENTS.CALIBRATION_REJECTED, {
      calibrationId: id,
      equipmentId: calibration.equipmentId,
      equipmentName: rejectedEquip?.name ?? '',
      managementNumber: rejectedEquip?.managementNumber ?? '',
      registeredBy: calibration.registeredBy ?? '',
      teamId: rejectedEquip?.teamId ?? '',
      site: rejectedEquip?.site ?? '',
      reason: rejectDto.rejectionReason,
      actorId: rejectDto.approverId,
      actorName: '',
      timestamp: new Date(),
    });

    // ✅ 반려 완료된 최신 데이터 반환 (DB 재조회)
    return this.findOne(id);
  }

  // ============================================================================
  // 중간점검 (DB 기반)
  // ============================================================================

  /**
   * 중간점검 일정이 다가오는 교정 조회
   *
   * ✅ DB 쿼리 사용 (기존 인메모리 필터 → DB 조회로 수정)
   */
  async findUpcomingIntermediateChecks(days: number = 7): Promise<CalibrationRecord[]> {
    const today = getUtcStartOfDay();
    const futureDate = getUtcEndOfDay(addDaysUtc(today, days));

    const rows = await this.db
      .select()
      .from(schema.calibrations)
      .where(
        and(
          sql`${schema.calibrations.intermediateCheckDate} IS NOT NULL`,
          sql`${schema.calibrations.intermediateCheckDate}::date >= ${today.toISOString().split('T')[0]}::date`,
          sql`${schema.calibrations.intermediateCheckDate}::date <= ${futureDate.toISOString().split('T')[0]}::date`
        )
      )
      .orderBy(asc(schema.calibrations.intermediateCheckDate));

    return rows.map((row) => this.transformDbToRecord(row));
  }

  /**
   * 중간점검 완료 처리
   *
   * ✅ DB update 사용 (기존 인메모리 배열 조작 → DB update로 수정)
   */
  async completeIntermediateCheck(
    id: string,
    completedBy: string,
    notes?: string
  ): Promise<{ calibration: CalibrationRecord; message: string }> {
    const calibration = await this.findOne(id);

    if (!calibration.intermediateCheckDate) {
      throw new BadRequestException({
        code: 'CALIBRATION_NO_INTERMEDIATE_CHECK',
        message: 'No intermediate check is scheduled for this calibration.',
      });
    }

    const now = new Date();
    const nextIntermediateCheckDate = new Date(now);
    nextIntermediateCheckDate.setMonth(nextIntermediateCheckDate.getMonth() + 6);

    // DB 기존 notes에 중간점검 기록 추가
    const existingNotes = calibration.notes || '';
    const checkNote = notes
      ? `${existingNotes}\n[${now.toISOString()}] 중간점검 완료: ${notes} (담당자: ${completedBy})`
      : `${existingNotes}\n[${now.toISOString()}] 중간점검 완료 (담당자: ${completedBy})`;

    const [updated] = await this.db
      .update(schema.calibrations)
      .set({
        intermediateCheckDate: nextIntermediateCheckDate.toISOString().split('T')[0],
        notes: checkNote.trim(),
        updatedAt: now,
      })
      .where(eq(schema.calibrations.id, id))
      .returning();

    return {
      calibration: this.transformDbToRecord(updated),
      message: '중간점검이 완료되었습니다.',
    };
  }

  /**
   * 중간점검 필요 장비 목록 조회 (과거 및 예정)
   * ✅ 이미 DB 기반 (변경 없음)
   */
  async findAllIntermediateChecks(query?: {
    status?: 'pending' | 'completed' | 'overdue';
    equipmentId?: string;
    managerId?: string;
    teamId?: string;
    site?: string;
  }): Promise<{
    items: CalibrationRecord[];
    meta: { totalItems: number; overdueCount: number; pendingCount: number };
  }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const items = await this.db.query.calibrations.findMany({
      where: (calibrations, { isNotNull, eq: eqFn, and: andFn }) => {
        const conditions = [isNotNull(calibrations.intermediateCheckDate)];

        if (query?.equipmentId) {
          conditions.push(eqFn(calibrations.equipmentId, query.equipmentId));
        }

        return andFn(...conditions);
      },
      with: {
        equipment: {
          columns: {
            id: true,
            name: true,
            managementNumber: true,
            teamId: true,
            site: true,
          },
          with: {
            team: true,
          },
        },
      },
      orderBy: (calibrations, { asc: ascFn }) => [ascFn(calibrations.intermediateCheckDate)],
      limit: 500,
    });

    let results = items;

    // status 필터
    if (query?.status) {
      results = results.filter((cal) => {
        if (!cal.intermediateCheckDate) return false;
        const checkDate = new Date(cal.intermediateCheckDate);
        checkDate.setHours(0, 0, 0, 0);

        if (query.status === 'overdue') return checkDate < today;
        if (query.status === 'pending') return checkDate >= today;
        return true;
      });
    }

    // teamId/site 필터 (post-filter: Drizzle relational query 제한)
    if (query?.teamId) {
      results = results.filter(
        (cal) =>
          (cal as unknown as { equipment?: { teamId?: string | null } }).equipment?.teamId ===
          query.teamId
      );
    }
    if (query?.site) {
      results = results.filter(
        (cal) =>
          (cal as unknown as { equipment?: { site?: string | null } }).equipment?.site ===
          query.site
      );
    }

    // ✅ 플래튼: nested equipment/team → CalibrationRecord 조인 필드
    const flattenedItems: CalibrationRecord[] = results.map((item) => {
      const equip = (
        item as unknown as {
          equipment?: {
            id: string;
            name: string;
            managementNumber: string;
            teamId: string | null;
            site?: string | null;
            team?: { id: string; name: string } | null;
          };
        }
      ).equipment;
      return {
        ...this.transformDbToRecord(item as unknown as CalibrationRow),
        equipmentName: equip?.name || undefined,
        managementNumber: equip?.managementNumber || undefined,
        team: equip?.team?.name || undefined,
        teamId: equip?.teamId || undefined,
        teamName: equip?.team?.name || undefined,
      };
    });

    return {
      items: flattenedItems,
      meta: {
        totalItems: flattenedItems.length,
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

  /**
   * 교정 기록의 사이트 및 팀 조회 (calibrations → equipment 경유)
   * 크로스사이트/크로스팀 접근 제어에 사용
   */
  async getCalibrationSiteAndTeam(
    calibrationId: string
  ): Promise<{ site: string; teamId: string | null }> {
    const result = await this.db
      .select({ site: schema.equipment.site, teamId: schema.equipment.teamId })
      .from(schema.calibrations)
      .innerJoin(schema.equipment, eq(schema.calibrations.equipmentId, schema.equipment.id))
      .where(eq(schema.calibrations.id, calibrationId))
      .limit(1);

    if (result.length === 0) {
      throw new NotFoundException({
        code: 'CALIBRATION_NOT_FOUND',
        message: `Calibration ${calibrationId} not found.`,
      });
    }

    return result[0];
  }
}

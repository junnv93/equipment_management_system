import { Injectable, NotFoundException, BadRequestException, Logger, Inject } from '@nestjs/common';
import type { AppDatabase } from '@equipment-management/db';
import {
  VersionedBaseService,
  createVersionConflictException,
} from '../../common/base/versioned-base.service';
import { SimpleCacheService } from '../../common/cache/simple-cache.service';
import { CACHE_KEY_PREFIXES } from '../../common/cache/cache-key-prefixes';
import { createScopeAwareCacheKeyBuilder } from '../../common/cache/scope-aware-cache-key';
import { CacheInvalidationHelper } from '../../common/cache/cache-invalidation.helper';
import { CreateCalibrationDto } from './dto/create-calibration.dto';
import { UpdateCalibrationDto } from './dto/update-calibration.dto';
import { CalibrationQueryDto } from './dto/calibration-query.dto';
import { ApproveCalibrationDto, RejectCalibrationDto } from './dto/approve-calibration.dto';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { NOTIFICATION_EVENTS } from '../notifications/events/notification-events';
import { CACHE_EVENTS } from '../../common/cache/cache-events';
import { FileUploadService } from '../../common/file-upload/file-upload.service';
import type { MulterFile } from '../../types/common.types';
import {
  CalibrationStatusEnum,
  type CalibrationStatus,
  type CalibrationApprovalStatus,
  CalibrationApprovalStatusEnum,
  NonConformanceStatusValues as NCStatusVal,
  NonConformanceTypeValues as NCTypeVal,
  ResolutionTypeEnum,
  DEFAULT_LOCALE,
  type IntermediateCheckStatus,
  CalibrationRequiredEnum,
  IntermediateCheckFilterStatusValues,
  type DocumentType,
} from '@equipment-management/schemas';
import { nonConformances } from '@equipment-management/db/schema/non-conformances';
import {
  CACHE_TTL,
  CALIBRATION_THRESHOLDS,
  DEFAULT_PAGE_SIZE,
  SELECTOR_PAGE_SIZE,
} from '@equipment-management/shared-constants';
import {
  getUtcStartOfDay,
  getUtcEndOfDay,
  addDaysUtc,
  calculateNextCalibrationDate,
} from '../../common/utils';
import * as schema from '@equipment-management/db/schema';
import {
  and,
  eq,
  gte,
  lt,
  lte,
  count,
  sql,
  or,
  desc,
  asc,
  SQL,
  isNull,
  aliasedTable,
} from 'drizzle-orm';
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
    private readonly cacheInvalidationHelper: CacheInvalidationHelper,
    private readonly eventEmitter: EventEmitter2,
    private readonly i18n: I18nService,
    private readonly fileUploadService: FileUploadService
  ) {
    super();
  }

  // ============================================================================
  // 캐시 관리
  // ============================================================================

  private readonly CACHE_PREFIX = CACHE_KEY_PREFIXES.CALIBRATION;

  private readonly buildCacheKey = createScopeAwareCacheKeyBuilder(
    CACHE_KEY_PREFIXES.CALIBRATION,
    new Set(['list'])
  );

  /**
   * VersionedBaseService 훅 override — 409 발생 시 detail 캐시 자동 무효화.
   * update/approve/reject/completeIntermediateCheck 모든 updateWithVersion 경로 단일 정책.
   */
  protected async onVersionConflict(id: string): Promise<void> {
    await this.cacheService.delete(this.buildCacheKey('detail', { id }));
  }

  /**
   * 캐시 무효화 헬퍼
   *
   * equipmentId가 제공되면 해당 장비의 teamId를 조회하여
   * team-scoped + global scope만 정밀 무효화.
   * equipmentId 없으면 전체 list: prefix broad 무효화 (fallback).
   */
  private async invalidateCalibrationCache(id?: string, equipmentId?: string): Promise<void> {
    if (id) {
      this.cacheService.delete(this.buildCacheKey('detail', { id }));
    }

    if (equipmentId) {
      const teamId = await this.resolveEquipmentTeamId(equipmentId);
      if (teamId) {
        this.cacheService.deleteByPrefix(`${this.CACHE_PREFIX}list:t:${teamId}:`);
      }
      this.cacheService.deleteByPrefix(`${this.CACHE_PREFIX}list:g:`);
    } else {
      this.cacheService.deleteByPrefix(`${this.CACHE_PREFIX}list:`);
    }

    this.cacheService.deleteByPrefix(CACHE_KEY_PREFIXES.APPROVALS);
  }

  private async resolveEquipmentTeamId(equipmentId: string): Promise<string | null> {
    const [row] = await this.db
      .select({ teamId: schema.equipment.teamId })
      .from(schema.equipment)
      .where(eq(schema.equipment.id, equipmentId))
      .limit(1);
    return row?.teamId ?? null;
  }

  /**
   * 교정 승인 후 교차 엔티티 캐시 무효화
   *
   * 승인 시 equipment(교정일 업데이트) + NC(overdue 자동 조치) + dashboard에 영향.
   * SSOT: CacheInvalidationHelper의 장비/NC/대시보드 메서드 위임
   */
  private async invalidateAfterCalibrationApproval(equipmentId: string): Promise<void> {
    await this.cacheInvalidationHelper.invalidateAfterEquipmentUpdate(equipmentId, true);
  }

  /**
   * 교정 반려 후 교차 엔티티 캐시 무효화
   *
   * 반려 시 equipment 상태 변경 없음 — 대시보드 승인 카운트만 영향.
   * SSOT: CacheInvalidationHelper.invalidateAllDashboard()
   */
  private async invalidateAfterCalibrationRejection(): Promise<void> {
    await this.cacheInvalidationHelper.invalidateAllDashboard();
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
      status: dto.status || CalibrationStatusEnum.enum.scheduled,
      agencyName: dto.calibrationAgency || null,
      certificateNumber: dto.certificateNumber || null,
      certificatePath: dto.certificatePath || null,
      result: normalizedResult,
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
    const cacheKey = this.buildCacheKey('detail', { id });
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
   * 교정 등록 (원자 multipart)
   * POST /api/calibration
   *
   * 파일 저장(tx 외부) → DB 트랜잭션(calibrations + documents) 원자 insert.
   * tx 실패 시 저장된 파일 best-effort 삭제(보상 트랜잭션).
   */
  async createWithDocuments(
    createCalibrationDto: CreateCalibrationDto,
    files: MulterFile[],
    documentTypes: DocumentType[],
    descriptions: (string | undefined)[],
    actorId: string
  ): Promise<{
    calibration: CalibrationRecord;
    documents: (typeof schema.documents.$inferSelect)[];
  }> {
    const approvalStatus = CalibrationApprovalStatusEnum.enum.pending_approval;

    const [equipForCreate] = await this.db
      .select({
        calibrationCycle: schema.equipment.calibrationCycle,
        name: schema.equipment.name,
        managementNumber: schema.equipment.managementNumber,
        teamId: schema.equipment.teamId,
        site: schema.equipment.site,
      })
      .from(schema.equipment)
      .where(eq(schema.equipment.id, createCalibrationDto.equipmentId))
      .limit(1);

    const computedNextDate = calculateNextCalibrationDate(
      createCalibrationDto.calibrationDate,
      equipForCreate?.calibrationCycle ?? undefined
    );

    const dtoWithComputedDate = {
      ...createCalibrationDto,
      nextCalibrationDate:
        computedNextDate ??
        createCalibrationDto.nextCalibrationDate ??
        createCalibrationDto.calibrationDate,
    };

    // 파일 저장 — tx 외부 (스토리지는 DB 롤백 불가, 보상 패턴으로 처리)
    const uploadedMeta = await this.fileUploadService.saveFiles(files, 'calibration/pending');
    const storedKeys = uploadedMeta.map((m) => m.filePath);

    try {
      const result = await this.db.transaction(async (tx) => {
        const insertData = this.transformDtoToInsert(dtoWithComputedDate, approvalStatus);
        const [calibrationRow] = await tx
          .insert(schema.calibrations)
          .values(insertData)
          .returning();

        const documentInserts = uploadedMeta.map((meta, i) => ({
          calibrationId: calibrationRow.id,
          documentType: documentTypes[i],
          description: descriptions[i] ?? null,
          fileName: meta.fileName,
          originalFileName: meta.originalFileName,
          filePath: meta.filePath,
          fileSize: meta.fileSize,
          mimeType: meta.mimeType,
          fileHash: meta.fileHash,
          uploadedBy: actorId,
          isLatest: true as const,
          parentDocumentId: null,
          revisionNumber: 1,
        }));

        const documentRows = await tx.insert(schema.documents).values(documentInserts).returning();

        return { calibration: calibrationRow, documents: documentRows };
      });

      this.logger.log(
        `교정 기록 등록: ${result.calibration.id} (장비: ${result.calibration.equipmentId}, 문서: ${result.documents.length}건)`
      );

      await this.invalidateCalibrationCache(undefined, result.calibration.equipmentId);

      // 캐시 무효화 이벤트 (CACHE_EVENTS 채널)
      try {
        await this.eventEmitter.emitAsync(CACHE_EVENTS.CALIBRATION_CREATED, {
          calibrationId: result.calibration.id,
          equipmentId: result.calibration.equipmentId,
          teamId: equipForCreate?.teamId ?? '',
          actorId,
          documentIds: result.documents.map((d) => d.id),
        });
      } catch (error) {
        this.logger.warn(
          `교정 캐시 이벤트 발행 실패 (calibrationId: ${result.calibration.id}): ${error}`
        );
      }

      // 알림 이벤트 (NOTIFICATION_EVENTS 채널)
      try {
        await this.eventEmitter.emitAsync(NOTIFICATION_EVENTS.CALIBRATION_CREATED, {
          calibrationId: result.calibration.id,
          equipmentId: result.calibration.equipmentId,
          equipmentName: equipForCreate?.name ?? '',
          managementNumber: equipForCreate?.managementNumber ?? '',
          teamId: equipForCreate?.teamId ?? '',
          site: equipForCreate?.site ?? '',
          actorId,
          actorName: '',
          timestamp: new Date(),
        });
      } catch (error) {
        this.logger.warn(
          `교정 등록 알림 발행 실패 (calibrationId: ${result.calibration.id}): ${error}`
        );
      }

      return {
        calibration: this.transformDbToRecord(result.calibration),
        documents: result.documents,
      };
    } catch (error) {
      // 보상: tx 실패 시 저장된 파일 best-effort 삭제
      const deleteResults = await Promise.allSettled(
        storedKeys.map((key) => this.fileUploadService.deleteFile(key))
      );
      const failedDeletes = deleteResults.filter((r) => r.status === 'rejected');
      if (failedDeletes.length > 0) {
        this.logger.error(
          `calibration_storage_orphan: ${failedDeletes.length}개 파일 삭제 실패 — 수동 정리 필요`,
          { storedKeys }
        );
      }
      throw error;
    }
  }

  /**
   * 교정 정보 수정
   * PATCH /api/calibration/:uuid
   *
   * ✅ DB update 사용 (기존 인메모리 배열 조작 → DB update로 수정)
   */
  async update(id: string, updateCalibrationDto: UpdateCalibrationDto): Promise<CalibrationRecord> {
    // 먼저 존재 여부 확인 + equipmentId 캐시 무효화용 보존
    const existing = await this.findOne(id);

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
    if (updateCalibrationDto.intermediateCheckDate !== undefined) {
      updateData.intermediateCheckDate = updateCalibrationDto.intermediateCheckDate
        ? updateCalibrationDto.intermediateCheckDate instanceof Date
          ? updateCalibrationDto.intermediateCheckDate.toISOString().split('T')[0]
          : String(updateCalibrationDto.intermediateCheckDate)
        : null;
    }

    if (updateCalibrationDto.version !== undefined) {
      // ✅ CAS 보호: 클라이언트가 version을 전송한 경우 (상태 변경 등)
      // 409 시 detail 캐시 무효화는 onVersionConflict() 훅이 처리.
      await this.updateWithVersion(
        schema.calibrations,
        id,
        updateCalibrationDto.version,
        updateData,
        'Calibration record'
      );
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

    await this.invalidateCalibrationCache(id, existing.equipmentId);
    return this.findOne(id);
  }

  /**
   * 교정 삭제
   * DELETE /api/calibration/:uuid
   *
   * ✅ DB delete 사용 (기존 인메모리 splice → DB delete로 수정)
   */
  async remove(id: string, version?: number): Promise<{ id: string; deleted: boolean }> {
    // 존재 여부 확인
    const calibration = await this.findOne(id);

    if (version !== undefined) {
      // CAS 보호: version 일치 시에만 삭제
      const result = await this.db
        .delete(schema.calibrations)
        .where(and(eq(schema.calibrations.id, id), eq(schema.calibrations.version, version)))
        .returning({ id: schema.calibrations.id });

      if (result.length === 0) {
        this.cacheService.delete(this.buildCacheKey('detail', { id }));
        throw createVersionConflictException(calibration.version as number, version);
      }
    } else {
      // 내부 호출 (version 미제공): CAS 없이 삭제
      await this.db.delete(schema.calibrations).where(eq(schema.calibrations.id, id));
    }

    await this.invalidateCalibrationCache(id, calibration.equipmentId);
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
    const thirtyDaysLater = getUtcEndOfDay(addDaysUtc(today, CALIBRATION_THRESHOLDS.WARNING_DAYS));

    // 공통 기본 조건: 교정 대상 장비 (retired/disposed 제외)
    const baseConditions: SQL<unknown>[] = [
      eq(schema.equipment.isActive, true),
      eq(schema.equipment.calibrationRequired, CalibrationRequiredEnum.enum.required),
    ];
    if (teamId) baseConditions.push(eq(schema.equipment.teamId, teamId));
    if (site) baseConditions.push(eq(schema.equipment.site, site));

    // ✅ SSOT: 단일 FILTER 집계 쿼리
    // overdueCount는 date-derived (nextCalibrationDate < today)
    const [result] = await this.db
      .select({
        total: count(),
        overdueCount: sql<number>`cast(count(*) filter (where ${schema.equipment.nextCalibrationDate} is not null and ${schema.equipment.nextCalibrationDate} < ${today.toISOString()}::timestamp) as integer)`,
        dueInMonthCount: sql<number>`cast(count(*) filter (where ${schema.equipment.nextCalibrationDate} is not null and ${schema.equipment.nextCalibrationDate} >= ${today.toISOString()}::timestamp and ${schema.equipment.nextCalibrationDate} <= ${thirtyDaysLater.toISOString()}::timestamp) as integer)`,
      })
      .from(schema.equipment)
      .where(and(...baseConditions));

    return {
      total: result?.total || 0,
      overdueCount: result?.overdueCount || 0,
      dueInMonthCount: result?.dueInMonthCount || 0,
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
      eq(schema.equipment.calibrationRequired, CalibrationRequiredEnum.enum.required),
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
      .limit(SELECTOR_PAGE_SIZE);

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
    days: number = CALIBRATION_THRESHOLDS.WARNING_DAYS,
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
      eq(schema.equipment.calibrationRequired, CalibrationRequiredEnum.enum.required),
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
      .limit(SELECTOR_PAGE_SIZE);

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
      pageSize = DEFAULT_PAGE_SIZE,
      approvalStatus,
      teamId,
      site,
      calibrationDueStatus,
    } = query;

    // scope-aware 캐시 키: teamId가 구조적 segment로 인코딩됨
    const cacheKey = this.buildCacheKey('list', {
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
      sort,
      page,
      pageSize,
      approvalStatus,
      teamId,
      site,
      calibrationDueStatus,
    });

    return this.cacheService.getOrSet(cacheKey, () => this.findAllInternal(query), CACHE_TTL.SHORT);
  }

  private async findAllInternal(query: CalibrationQueryDto): Promise<{
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
      pageSize = DEFAULT_PAGE_SIZE,
      approvalStatus,
      teamId,
      site,
      calibrationDueStatus,
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
    if (calibrationDueStatus) {
      const today = getUtcStartOfDay();
      const thirtyDaysLater = getUtcEndOfDay(
        addDaysUtc(today, CALIBRATION_THRESHOLDS.WARNING_DAYS)
      );
      switch (calibrationDueStatus) {
        case 'overdue':
          whereConditions.push(
            sql`${schema.equipment.nextCalibrationDate} IS NOT NULL`,
            sql`${schema.equipment.nextCalibrationDate} < ${today.toISOString()}::timestamp`
          );
          break;
        case 'upcoming':
          whereConditions.push(
            sql`${schema.equipment.nextCalibrationDate} IS NOT NULL`,
            sql`${schema.equipment.nextCalibrationDate} >= ${today.toISOString()}::timestamp`,
            sql`${schema.equipment.nextCalibrationDate} <= ${thirtyDaysLater.toISOString()}::timestamp`
          );
          break;
        case 'normal':
          whereConditions.push(
            sql`(${schema.equipment.nextCalibrationDate} IS NULL OR ${schema.equipment.nextCalibrationDate} > ${thirtyDaysLater.toISOString()}::timestamp)`
          );
          break;
      }
    }

    const whereArg = whereConditions.length > 0 ? and(...whereConditions) : undefined;
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

    // ========== 2+4. Count + Fetch data 병렬 실행 ==========
    // ✅ Phase 4: 전체 행 조회 후 transformDbToRecord()로 정규화
    const [countResult, rows] = await Promise.all([
      this.db
        .select({ count: count() })
        .from(schema.calibrations)
        .leftJoin(schema.equipment, eq(schema.calibrations.equipmentId, schema.equipment.id))
        .leftJoin(schema.teams, eq(schema.equipment.teamId, schema.teams.id))
        .where(whereArg),
      this.db
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
        .where(whereArg)
        .orderBy(orderByClause)
        .limit(pageSize)
        .offset(offset),
    ]);

    const totalItems = Number(countResult[0]?.count || 0);
    const totalPages = Math.ceil(totalItems / pageSize);

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
    return this.findAll({ fromDate, toDate, statuses: CalibrationStatusEnum.enum.scheduled });
  }

  // 교정 상태 변경 (CAS 보호)
  async updateStatus(
    id: string,
    status: CalibrationStatus,
    version: number
  ): Promise<CalibrationRecord> {
    return this.update(id, { status, version });
  }

  // 예정된 교정 완료 처리
  async completeCalibration(
    id: string,
    updateDto: UpdateCalibrationDto
  ): Promise<CalibrationRecord> {
    const calibration = await this.findOne(id);

    if (
      calibration.status !== CalibrationStatusEnum.enum.scheduled &&
      calibration.status !== CalibrationStatusEnum.enum.in_progress
    ) {
      throw new BadRequestException({
        code: 'CALIBRATION_INVALID_STATUS_FOR_COMPLETE',
        message: 'Only scheduled or in-progress calibrations can be completed.',
      });
    }

    return this.update(id, {
      ...updateDto,
      status: CalibrationStatusEnum.enum.completed,
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
  async findPendingApprovals(
    page = 1,
    pageSize: number = DEFAULT_PAGE_SIZE,
    site?: string,
    teamId?: string
  ): Promise<{
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
    // ========== 1. Build WHERE conditions (findAll 패턴 준수) ==========
    const whereConditions: SQL<unknown>[] = [
      eq(schema.calibrations.approvalStatus, CalibrationApprovalStatusEnum.enum.pending_approval),
    ];
    if (site) {
      whereConditions.push(eq(schema.equipment.site, site));
    }
    if (teamId) {
      whereConditions.push(eq(schema.equipment.teamId, teamId));
    }

    const offset = (page - 1) * pageSize;

    // ========== 3. Fetch data with JOINs (DB-level 필터링 + 페이지네이션) ==========
    // aliasedTable로 users를 두 번 JOIN (registeredBy, approvedBy)
    const registrar = aliasedTable(schema.users, 'registrar');
    const approver = aliasedTable(schema.users, 'approver');
    const registrarTeam = aliasedTable(schema.teams, 'registrar_team');

    // ========== 2+3. Count + Fetch data 병렬 실행 ==========
    const [[{ count: totalItems }], rows] = await Promise.all([
      this.db
        .select({ count: count() })
        .from(schema.calibrations)
        .leftJoin(schema.equipment, eq(schema.calibrations.equipmentId, schema.equipment.id))
        .where(and(...whereConditions)),
      this.db
        .select({
          calibration: schema.calibrations,
          equipmentName: schema.equipment.name,
          managementNumber: schema.equipment.managementNumber,
          equipmentTeamId: schema.equipment.teamId,
          // registeredByUser
          registrarId: registrar.id,
          registrarName: registrar.name,
          registrarEmail: registrar.email,
          registrarTeamId: registrarTeam.id,
          registrarTeamName: registrarTeam.name,
          // approvedByUser
          approverId: approver.id,
          approverName: approver.name,
          approverEmail: approver.email,
        })
        .from(schema.calibrations)
        .leftJoin(schema.equipment, eq(schema.calibrations.equipmentId, schema.equipment.id))
        .leftJoin(registrar, eq(schema.calibrations.registeredBy, registrar.id))
        .leftJoin(registrarTeam, eq(registrar.teamId, registrarTeam.id))
        .leftJoin(approver, eq(schema.calibrations.approvedBy, approver.id))
        .where(and(...whereConditions))
        .orderBy(desc(schema.calibrations.createdAt))
        .limit(pageSize)
        .offset(offset),
    ]);

    const totalPages = Math.ceil(totalItems / pageSize);

    // ========== 4. Transform (findAll 패턴 + user relations) ==========
    const transformedItems = rows.map((row) => ({
      ...this.transformDbToRecord(row.calibration),
      equipmentName: row.equipmentName || undefined,
      managementNumber: row.managementNumber || undefined,
      teamId: row.equipmentTeamId || undefined,
      registeredByUser: row.registrarId
        ? {
            id: row.registrarId,
            name: row.registrarName ?? '',
            email: row.registrarEmail ?? '',
            team: row.registrarTeamId
              ? { id: row.registrarTeamId, name: row.registrarTeamName ?? '' }
              : null,
          }
        : null,
      approvedByUser: row.approverId
        ? {
            id: row.approverId,
            name: row.approverName ?? '',
            email: row.approverEmail ?? '',
          }
        : null,
    }));

    return {
      items: transformedItems,
      meta: {
        totalItems,
        itemCount: transformedItems.length,
        itemsPerPage: pageSize,
        totalPages,
        currentPage: page,
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

    // ✅ CAS: DB 기반 optimistic locking — 409 시 캐시 무효화는 onVersionConflict() 훅이 처리.
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

    // 캐시 무효화 (교정 자체) — calibration.equipmentId로 team-scoped 정밀 무효화
    await this.invalidateCalibrationCache(id, calibration.equipmentId);

    // 장비 정보 1회 조회 — 교정일 업데이트 + 알림 이벤트 공용 (이중 DB 호출 방지)
    const [approvedEquip] = await this.db
      .select({
        name: schema.equipment.name,
        managementNumber: schema.equipment.managementNumber,
        teamId: schema.equipment.teamId,
        site: schema.equipment.site,
        calibrationCycle: schema.equipment.calibrationCycle,
      })
      .from(schema.equipment)
      .where(eq(schema.equipment.id, calibration.equipmentId))
      .limit(1);

    // 장비 교정일 자동 업데이트 및 교정 기한 초과 부적합 자동 조치
    await this.updateEquipmentCalibrationDates(
      calibration.equipmentId,
      calibration.calibrationDate,
      id,
      approveDto.approverId,
      approvedEquip?.calibrationCycle ?? undefined
    );

    // 📢 알림 이벤트 발행 (교정 승인) — approvedEquip 재사용
    await this.eventEmitter.emitAsync(NOTIFICATION_EVENTS.CALIBRATION_APPROVED, {
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

    // 교차 엔티티 캐시 무효화: 승인 시 equipment(교정일) + NC(overdue 조치) + dashboard
    await this.invalidateAfterCalibrationApproval(calibration.equipmentId);

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
    approverId?: string,
    /** 호출자가 이미 조회한 calibrationCycle (DB 이중 조회 방지) */
    preloadedCycle?: number
  ): Promise<void> {
    try {
      // 장비의 교정 주기: 호출자가 전달하면 재사용, 아니면 조회
      let cycle = preloadedCycle;
      if (cycle === undefined) {
        const [equip] = await this.db
          .select({ calibrationCycle: schema.equipment.calibrationCycle })
          .from(schema.equipment)
          .where(eq(schema.equipment.id, equipmentId))
          .limit(1);
        cycle = equip?.calibrationCycle ?? undefined;
      }

      // 차기 교정일 = 교정일 + 교정주기(개월) — SSOT 유틸리티 사용
      const nextCalibrationDate =
        calculateNextCalibrationDate(calibrationDate, cycle) ?? calibrationDate;

      // ✅ W-13: 장비 업데이트 + NC 조치를 하나의 트랜잭션으로 감싸기
      // CAS 면제: 교정 승인 콜백에 의한 교정일 자동 갱신 (시스템 트리거)
      // calibration 엔티티에서 이미 CAS를 통과한 후 실행되므로,
      // equipment에 대한 별도 CAS는 불필요. 교정일은 시스템 계산값이며 사용자 입력이 아님.
      await this.db.transaction(async (tx) => {
        // 과거 교정이력 승인 시 최신 교정일을 더 오래된 날짜로 덮어쓰지 않도록 조건부 갱신
        // WHERE lastCalibrationDate IS NULL OR lastCalibrationDate < calibrationDate
        const [updated] = await tx
          .update(schema.equipment)
          .set({
            lastCalibrationDate: calibrationDate,
            nextCalibrationDate,
            updatedAt: new Date(),
            version: sql`${schema.equipment.version} + 1`,
          })
          .where(
            and(
              eq(schema.equipment.id, equipmentId),
              or(
                isNull(schema.equipment.lastCalibrationDate),
                lt(schema.equipment.lastCalibrationDate, calibrationDate)
              )
            )
          )
          .returning({ id: schema.equipment.id });

        if (updated) {
          this.logger.log(
            `장비 교정일 업데이트 완료: ${equipmentId}, ` +
              `lastCalibrationDate: ${calibrationDate}, ` +
              `nextCalibrationDate: ${nextCalibrationDate}`
          );
        } else {
          this.logger.log(
            `장비 교정일 업데이트 건너뜀 (최신 이력 아님): ${equipmentId}, calibrationDate: ${calibrationDate}`
          );
        }

        // NC 해결: 장비 교정일 갱신 여부와 무관하게 처리
        // 이유: 최신 교정이력이 아닌 과거 이력 승인 시 updated=undefined(날짜 미갱신)이지만
        //       교정 승인 자체는 완료되었으므로 NC는 종료되어야 함
        if (calibrationId) {
          await this.markCalibrationOverdueAsCorrectedTx(
            tx,
            equipmentId,
            calibrationId,
            approverId
          );
        }
      });
    } catch (error) {
      this.logger.error(`장비 교정일 업데이트 실패: ${equipmentId}`, error);
      throw error;
    }
  }

  /**
   * 교정 완료 시 calibration_overdue 부적합 자동 조치 완료 처리 (트랜잭션 내)
   */
  private async markCalibrationOverdueAsCorrectedTx(
    tx: Parameters<Parameters<AppDatabase['transaction']>[0]>[0],
    equipmentId: string,
    calibrationId: string,
    correctedBy?: string
  ): Promise<void> {
    const existingNc = await tx
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

    // NC를 corrected로 변경 + 교정 기록 연결
    // 장비 상태 복원(non_conforming → available)은 NC 종결(close) 시점에 위임
    // → close()의 "다른 열린 부적합 확인" 로직이 정상 동작하도록 보장
    await tx
      .update(nonConformances)
      .set({
        status: NCStatusVal.CORRECTED,
        resolutionType: ResolutionTypeEnum.enum.recalibration,
        calibrationId,
        correctionContent: this.i18n.t(
          'system.calibrationOverdue.correctionContent',
          DEFAULT_LOCALE
        ),
        correctionDate: today.toISOString().split('T')[0],
        correctedBy: correctedBy || null,
        updatedAt: today,
        version: sql`${nonConformances.version} + 1`,
      })
      .where(eq(nonConformances.id, nc.id));

    this.logger.log(
      `장비 ${equipmentId}: calibration_overdue 부적합(${nc.id}) corrected로 변경 (장비 상태 복원은 종결 시 처리)`
    );
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

    // ✅ CAS: DB 기반 optimistic locking — 409 시 캐시 무효화는 onVersionConflict() 훅이 처리.
    // C-8: approvedBy를 null 유지 — 반려자는 approvedBy가 아님.
    // 반려 상태는 approvalStatus: 'rejected' + rejectionReason으로 추적.
    await this.updateWithVersion(
      schema.calibrations,
      id,
      rejectDto.version,
      {
        approvalStatus: CalibrationApprovalStatusEnum.enum.rejected,
        rejectionReason: rejectDto.rejectionReason,
      },
      'Calibration record'
    );

    // 캐시 무효화 (교정 자체) — calibration.equipmentId로 team-scoped 정밀 무효화
    await this.invalidateCalibrationCache(id, calibration.equipmentId);
    // 교차 엔티티: 반려는 equipment 상태 변경 없음 — 대시보드 승인 카운트만 영향
    await this.invalidateAfterCalibrationRejection();

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

    await this.eventEmitter.emitAsync(NOTIFICATION_EVENTS.CALIBRATION_REJECTED, {
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
  async findUpcomingIntermediateChecks(
    days: number = CALIBRATION_THRESHOLDS.INTERMEDIATE_CHECK_UPCOMING_DAYS
  ): Promise<CalibrationRecord[]> {
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
    version: number,
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

    // 장비별 중간점검 주기를 DB에서 조회 (기본값 6개월)
    const DEFAULT_INTERMEDIATE_CHECK_CYCLE_MONTHS = 6;
    const [equip] = await this.db
      .select({ intermediateCheckCycle: schema.equipment.intermediateCheckCycle })
      .from(schema.equipment)
      .where(eq(schema.equipment.id, calibration.equipmentId))
      .limit(1);
    const cycleMonths = equip?.intermediateCheckCycle ?? DEFAULT_INTERMEDIATE_CHECK_CYCLE_MONTHS;

    const nextIntermediateCheckDate = new Date(now);
    nextIntermediateCheckDate.setMonth(nextIntermediateCheckDate.getMonth() + cycleMonths);

    // DB 기존 notes에 중간점검 기록 추가
    const existingNotes = calibration.notes || '';
    const checkNote = notes
      ? `${existingNotes}\n[${now.toISOString()}] 중간점검 완료: ${notes} (담당자: ${completedBy})`
      : `${existingNotes}\n[${now.toISOString()}] 중간점검 완료 (담당자: ${completedBy})`;

    // ✅ CAS: updateWithVersion으로 중복 완료 처리 방지.
    // 409 시 detail 캐시 무효화는 onVersionConflict() 훅이 처리.
    const updated = await this.updateWithVersion<CalibrationRow>(
      schema.calibrations,
      id,
      version,
      {
        intermediateCheckDate: nextIntermediateCheckDate.toISOString().split('T')[0],
        notes: checkNote.trim(),
      },
      'Calibration record'
    );

    await this.invalidateCalibrationCache(id, calibration.equipmentId);

    await this.eventEmitter.emitAsync(NOTIFICATION_EVENTS.INTERMEDIATE_CHECK_COMPLETED, {
      calibrationId: id,
      equipmentId: calibration.equipmentId,
      equipmentName: '',
      managementNumber: '',
      teamId: '',
      actorId: completedBy,
      actorName: '',
      timestamp: new Date(),
    });

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
    status?: IntermediateCheckStatus;
    equipmentId?: string;
    managerId?: string;
    teamId?: string;
    site?: string;
  }): Promise<{
    items: CalibrationRecord[];
    meta: { totalItems: number; overdueCount: number; pendingCount: number; dueCount: number };
  }> {
    const today = getUtcStartOfDay();
    const todayStr = today.toISOString().split('T')[0];

    // ✅ JOIN 기반 쿼리: teamId/site를 DB 레벨에서 필터링 (post-filter 제거)
    // Drizzle relational query는 nested where를 지원하지 않으므로 select+join 사용
    const whereConditions: SQL[] = [sql`${schema.calibrations.intermediateCheckDate} IS NOT NULL`];

    if (query?.equipmentId) {
      whereConditions.push(eq(schema.calibrations.equipmentId, query.equipmentId));
    }
    if (query?.status === IntermediateCheckFilterStatusValues.OVERDUE) {
      whereConditions.push(sql`${schema.calibrations.intermediateCheckDate} < ${todayStr}`);
    } else if (query?.status === IntermediateCheckFilterStatusValues.DUE) {
      whereConditions.push(sql`${schema.calibrations.intermediateCheckDate} <= ${todayStr}`);
    } else if (query?.status === IntermediateCheckFilterStatusValues.PENDING) {
      whereConditions.push(sql`${schema.calibrations.intermediateCheckDate} >= ${todayStr}`);
    }

    // 크로스사이트 워크플로우: teamId/site 필터를 DB 레벨에서 처리
    if (query?.teamId) {
      whereConditions.push(eq(schema.equipment.teamId, query.teamId));
    }
    if (query?.site) {
      whereConditions.push(eq(schema.equipment.site, query.site));
    }

    const rows = await this.db
      .select({
        calibration: schema.calibrations,
        equipmentName: schema.equipment.name,
        equipmentMgmtNo: schema.equipment.managementNumber,
        equipmentTeamId: schema.equipment.teamId,
        equipmentSite: schema.equipment.site,
        teamName: schema.teams.name,
      })
      .from(schema.calibrations)
      .leftJoin(schema.equipment, eq(schema.calibrations.equipmentId, schema.equipment.id))
      .leftJoin(schema.teams, eq(schema.equipment.teamId, schema.teams.id))
      .where(and(...whereConditions))
      .orderBy(asc(schema.calibrations.intermediateCheckDate));

    // 플래튼: JOIN 결과 → CalibrationRecord
    const flattenedItems: CalibrationRecord[] = rows.map((row) => ({
      ...this.transformDbToRecord(row.calibration),
      equipmentName: row.equipmentName || undefined,
      managementNumber: row.equipmentMgmtNo || undefined,
      team: row.teamName || undefined,
      teamId: row.equipmentTeamId || undefined,
      teamName: row.teamName || undefined,
    }));

    const { overdueCount, pendingCount, dueCount } = flattenedItems.reduce(
      (acc, cal) => {
        if (!cal.intermediateCheckDate) return acc;
        const ts = getUtcStartOfDay(new Date(cal.intermediateCheckDate)).getTime();
        const todayTs = today.getTime();
        if (ts < todayTs) acc.overdueCount++;
        if (ts >= todayTs) acc.pendingCount++;
        if (ts <= todayTs) acc.dueCount++;
        return acc;
      },
      { overdueCount: 0, pendingCount: 0, dueCount: 0 }
    );

    return {
      items: flattenedItems,
      meta: {
        totalItems: flattenedItems.length,
        overdueCount,
        pendingCount,
        dueCount,
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

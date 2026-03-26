import { Injectable, Inject, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { eq, desc, and, isNull, sql } from 'drizzle-orm';
import { createVersionConflictException } from '../../../common/base/versioned-base.service';
import type { AppDatabase } from '@equipment-management/db';
import {
  equipmentLocationHistory,
  equipmentMaintenanceHistory,
  equipmentIncidentHistory,
  equipment,
  users,
  checkouts,
  checkoutItems,
} from '@equipment-management/db/schema';
import { nonConformances } from '@equipment-management/db/schema/non-conformances';
import {
  EquipmentStatusEnum,
  NonConformanceStatusEnum,
  NonConformanceTypeEnum,
  DEFAULT_LOCALE,
} from '@equipment-management/schemas';
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from '@equipment-management/shared-constants';
import {
  CreateLocationHistoryDto,
  CreateMaintenanceHistoryDto,
  CreateIncidentHistoryDto,
  LocationHistoryResponseDto,
  MaintenanceHistoryResponseDto,
  IncidentHistoryResponseDto,
} from '../dto/equipment-history.dto';
import { getUtcStartOfDay } from '../../../common/utils';
import { CacheInvalidationHelper } from '../../../common/cache/cache-invalidation.helper';
import { I18nService } from '../../../common/i18n/i18n.service';

import type { PaginatedResponse, PaginationMeta } from '../../../common/types/api-response';

/** 표준 PaginationMeta 생성 (SSOT: common/types/api-response.ts) */
function buildPaginationMeta(total: number, pageSize: number, currentPage: number): PaginationMeta {
  return {
    totalItems: total,
    itemCount: Math.min(pageSize, total - (currentPage - 1) * pageSize),
    itemsPerPage: pageSize,
    totalPages: Math.ceil(total / pageSize) || 1,
    currentPage,
  };
}

@Injectable()
export class EquipmentHistoryService {
  private readonly logger = new Logger(EquipmentHistoryService.name);

  constructor(
    @Inject('DRIZZLE_INSTANCE')
    private readonly db: AppDatabase,
    private readonly cacheInvalidationHelper: CacheInvalidationHelper,
    private readonly i18n: I18nService
  ) {}

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

  /**
   * 이력 ID로 장비 사이트 정보 역추적 (삭제 등 historyId만 있는 엔드포인트용)
   */
  async getEquipmentSiteInfoByLocationHistoryId(
    historyId: string
  ): Promise<{ site: string; teamId: string | null }> {
    const [result] = await this.db
      .select({ site: equipment.site, teamId: equipment.teamId })
      .from(equipmentLocationHistory)
      .innerJoin(equipment, eq(equipmentLocationHistory.equipmentId, equipment.id))
      .where(eq(equipmentLocationHistory.id, historyId))
      .limit(1);
    if (!result)
      throw new NotFoundException({
        code: 'HISTORY_NOT_FOUND',
        message: `Location history ${historyId} not found.`,
      });
    return result;
  }

  async getEquipmentSiteInfoByMaintenanceHistoryId(
    historyId: string
  ): Promise<{ site: string; teamId: string | null }> {
    const [result] = await this.db
      .select({ site: equipment.site, teamId: equipment.teamId })
      .from(equipmentMaintenanceHistory)
      .innerJoin(equipment, eq(equipmentMaintenanceHistory.equipmentId, equipment.id))
      .where(eq(equipmentMaintenanceHistory.id, historyId))
      .limit(1);
    if (!result)
      throw new NotFoundException({
        code: 'HISTORY_NOT_FOUND',
        message: `Maintenance history ${historyId} not found.`,
      });
    return result;
  }

  async getEquipmentSiteInfoByIncidentHistoryId(
    historyId: string
  ): Promise<{ site: string; teamId: string | null }> {
    const [result] = await this.db
      .select({ site: equipment.site, teamId: equipment.teamId })
      .from(equipmentIncidentHistory)
      .innerJoin(equipment, eq(equipmentIncidentHistory.equipmentId, equipment.id))
      .where(eq(equipmentIncidentHistory.id, historyId))
      .limit(1);
    if (!result)
      throw new NotFoundException({
        code: 'HISTORY_NOT_FOUND',
        message: `Incident history ${historyId} not found.`,
      });
    return result;
  }

  /**
   * 사용자가 데이터베이스에 존재하는지 확인
   * 사용자가 존재하면 userId를 반환하고, 존재하지 않으면 null을 반환합니다.
   */
  private async validateAndGetUserId(userId?: string): Promise<string | null> {
    if (!userId) {
      return null;
    }

    try {
      const user = await this.db.query.users.findFirst({
        where: eq(users.id, userId),
      });
      return user ? userId : null;
    } catch {
      // 사용자 검증 실패 시 null 반환 (로그인한 사용자가 DB에 없을 수 있음)
      return null;
    }
  }

  // ===================== 위치 변동 이력 — SSOT 헬퍼 =====================

  /**
   * changedAt 기준 가장 최신 위치 이력의 newLocation 조회 (SSOT)
   *
   * 동점(같은 changedAt) 시 createdAt DESC로 가장 나중에 생성된 기록 선택.
   * 인덱스: equipment_location_history_equipment_changed_at_idx (equipmentId, changedAt)
   */
  private async resolveLatestLocation(
    queryRunner: AppDatabase,
    equipmentId: string
  ): Promise<string | null> {
    const [latest] = await queryRunner
      .select({ newLocation: equipmentLocationHistory.newLocation })
      .from(equipmentLocationHistory)
      .where(eq(equipmentLocationHistory.equipmentId, equipmentId))
      .orderBy(desc(equipmentLocationHistory.changedAt), desc(equipmentLocationHistory.createdAt))
      .limit(1);
    return latest?.newLocation ?? null;
  }

  /**
   * equipment.location을 최신 위치 이력과 동기화 (SSOT)
   *
   * CAS 적용: expectedVersion 전달 시 낙관적 잠금 체크.
   * CAS 미적용: expectedVersion 생략 시 직접 UPDATE (내부 호출용).
   *
   * @throws ConflictException CAS 실패 시 (code: 'VERSION_CONFLICT')
   */
  private async syncEquipmentLocation(
    queryRunner: AppDatabase,
    equipmentId: string,
    location: string | null,
    expectedVersion?: number
  ): Promise<void> {
    const updateData = {
      location,
      version: sql`version + 1`,
      updatedAt: new Date(),
    } as Record<string, unknown>;

    if (expectedVersion !== undefined) {
      const [updated] = await queryRunner
        .update(equipment)
        .set(updateData)
        .where(and(eq(equipment.id, equipmentId), eq(equipment.version, expectedVersion)))
        .returning({ version: equipment.version });

      if (!updated) {
        throw createVersionConflictException(undefined, expectedVersion);
      }
    } else {
      await queryRunner.update(equipment).set(updateData).where(eq(equipment.id, equipmentId));
    }
  }

  // ===================== 위치 변동 이력 =====================

  /**
   * 장비의 위치 변동 이력 조회
   */
  async getLocationHistory(
    equipmentUuid: string,
    options: { page?: number; pageSize?: number } = {}
  ): Promise<PaginatedResponse<LocationHistoryResponseDto>> {
    const page = options.page ?? 1;
    const pageSize = Math.min(options.pageSize ?? DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE);
    const offset = (page - 1) * pageSize;

    const [countResult] = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(equipmentLocationHistory)
      .where(eq(equipmentLocationHistory.equipmentId, equipmentUuid));

    const total = Number(countResult?.count ?? 0);

    const records = await this.db
      .select()
      .from(equipmentLocationHistory)
      .where(eq(equipmentLocationHistory.equipmentId, equipmentUuid))
      .orderBy(desc(equipmentLocationHistory.changedAt), desc(equipmentLocationHistory.createdAt))
      .limit(pageSize)
      .offset(offset);

    return {
      items: records.map((record) => ({
        id: record.id,
        equipmentId: record.equipmentId,
        changedAt: record.changedAt,
        previousLocation: record.previousLocation ?? undefined,
        newLocation: record.newLocation,
        notes: record.notes ?? undefined,
        changedBy: record.changedBy ?? undefined,
        createdAt: record.createdAt,
      })),
      meta: buildPaginationMeta(total, pageSize, page),
    };
  }

  /**
   * 위치 변동 이력 추가 (외부 API용)
   *
   * 트랜잭션 내에서:
   * 1. equipment.location 조회 → previousLocation으로 저장
   * 2. equipment_location_history INSERT
   * 3. resolveLatestLocation → syncEquipmentLocation (SSOT 헬퍼)
   * 4. 캐시 무효화
   */
  async createLocationHistory(
    equipmentUuid: string,
    dto: CreateLocationHistoryDto,
    userId?: string
  ): Promise<LocationHistoryResponseDto> {
    const validatedUserId = await this.validateAndGetUserId(userId);

    // 현재 장비 위치 조회
    const currentEquipment = await this.db.query.equipment.findFirst({
      where: eq(equipment.id, equipmentUuid),
      columns: { location: true },
    });
    if (!currentEquipment) {
      throw new NotFoundException({
        code: 'EQUIPMENT_NOT_FOUND',
        message: `Equipment not found. (ID: ${equipmentUuid})`,
      });
    }

    const previousLocation = currentEquipment.location ?? null;

    // 트랜잭션: history INSERT + equipment.location 동기화
    const record = await this.db.transaction(async (tx) => {
      // 1. 이력 생성
      const [historyRecord] = await tx
        .insert(equipmentLocationHistory)
        .values({
          equipmentId: equipmentUuid,
          changedAt: new Date(dto.changedAt),
          previousLocation,
          newLocation: dto.newLocation,
          notes: dto.notes ?? null,
          changedBy: validatedUserId,
        })
        .returning();

      // 2. 최신 이력 기준 위치 결정 + equipment.location 동기화 (SSOT 헬퍼)
      const resolvedLocation = await this.resolveLatestLocation(tx, equipmentUuid);
      await this.syncEquipmentLocation(tx, equipmentUuid, resolvedLocation, dto.version);

      return historyRecord;
    });

    // 캐시 무효화 (SSOT: CacheInvalidationHelper)
    await this.cacheInvalidationHelper.invalidateAfterEquipmentUpdate(equipmentUuid, false, false);

    this.logger.debug(
      `✓ Location history added: ${equipmentUuid} [${previousLocation ?? '(없음)'}] → [${dto.newLocation}]`
    );

    return {
      id: record.id,
      equipmentId: record.equipmentId,
      changedAt: record.changedAt,
      previousLocation: record.previousLocation ?? undefined,
      newLocation: record.newLocation,
      notes: record.notes ?? undefined,
      changedBy: record.changedBy ?? undefined,
      createdAt: record.createdAt,
    };
  }

  /**
   * 위치 변동 이력 추가 (내부 전용)
   *
   * equipment.location UPDATE 없이 history INSERT만 수행.
   * 장비 생성(create) / 수정(update) 시 호출 — 해당 서비스에서 이미 location을 처리하므로.
   */
  async createLocationHistoryInternal(
    equipmentId: string,
    data: {
      changedAt: string;
      newLocation: string;
      previousLocation: string | null;
      notes?: string;
    },
    userId?: string
  ): Promise<void> {
    const validatedUserId = await this.validateAndGetUserId(userId);
    await this.db.insert(equipmentLocationHistory).values({
      equipmentId,
      changedAt: new Date(data.changedAt),
      previousLocation: data.previousLocation,
      newLocation: data.newLocation,
      notes: data.notes ?? null,
      changedBy: validatedUserId,
    });
  }

  /**
   * 위치 변동 이력 삭제
   *
   * 삭제 후 resolveLatestLocation → syncEquipmentLocation (SSOT 헬퍼).
   * 이력이 모두 삭제되면 equipment.location을 null로 설정.
   *
   * @param historyId 삭제 대상 이력 UUID
   * @param expectedVersion 장비 CAS 버전 (프론트엔드에서 전달, 동시 수정 방지)
   */
  async deleteLocationHistory(historyId: string, expectedVersion?: number): Promise<void> {
    const result = await this.db.transaction(async (tx) => {
      // 1. 삭제 대상의 equipmentId 확보 + 삭제
      const [deleted] = await tx
        .delete(equipmentLocationHistory)
        .where(eq(equipmentLocationHistory.id, historyId))
        .returning();

      if (!deleted) {
        throw new NotFoundException(`Location history with ID ${historyId} not found`);
      }

      // 2. 최신 이력 기준 위치 결정 + equipment.location 동기화 (SSOT 헬퍼)
      const resolvedLocation = await this.resolveLatestLocation(tx, deleted.equipmentId);
      await this.syncEquipmentLocation(tx, deleted.equipmentId, resolvedLocation, expectedVersion);

      return deleted;
    });

    // 캐시 무효화 (SSOT: CacheInvalidationHelper)
    await this.cacheInvalidationHelper.invalidateAfterEquipmentUpdate(
      result.equipmentId,
      false,
      false
    );
  }

  // ===================== 유지보수 내역 =====================

  /**
   * 장비의 유지보수 내역 조회
   */
  async getMaintenanceHistory(
    equipmentUuid: string,
    options: { page?: number; pageSize?: number } = {}
  ): Promise<PaginatedResponse<MaintenanceHistoryResponseDto>> {
    const page = options.page ?? 1;
    const pageSize = Math.min(options.pageSize ?? DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE);
    const offset = (page - 1) * pageSize;

    const [countResult] = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(equipmentMaintenanceHistory)
      .where(eq(equipmentMaintenanceHistory.equipmentId, equipmentUuid));

    const total = Number(countResult?.count ?? 0);

    const records = await this.db
      .select()
      .from(equipmentMaintenanceHistory)
      .where(eq(equipmentMaintenanceHistory.equipmentId, equipmentUuid))
      .orderBy(desc(equipmentMaintenanceHistory.performedAt))
      .limit(pageSize)
      .offset(offset);

    return {
      items: records.map((record) => ({
        id: record.id,
        equipmentId: record.equipmentId,
        performedAt: record.performedAt,
        content: record.content,
        performedBy: record.performedBy ?? undefined,
        createdAt: record.createdAt,
      })),
      meta: buildPaginationMeta(total, pageSize, page),
    };
  }

  /**
   * 유지보수 내역 추가
   */
  async createMaintenanceHistory(
    equipmentUuid: string,
    dto: CreateMaintenanceHistoryDto,
    userId?: string
  ): Promise<MaintenanceHistoryResponseDto> {
    // 사용자 ID 검증 (DB에 존재하지 않으면 null 설정)
    const validatedUserId = await this.validateAndGetUserId(userId);

    const [record] = await this.db
      .insert(equipmentMaintenanceHistory)
      .values({
        equipmentId: equipmentUuid,
        performedAt: new Date(dto.performedAt),
        content: dto.content,
        performedBy: validatedUserId,
      })
      .returning();

    return {
      id: record.id,
      equipmentId: record.equipmentId,
      performedAt: record.performedAt,
      content: record.content,
      performedBy: record.performedBy ?? undefined,
      createdAt: record.createdAt,
    };
  }

  /**
   * 유지보수 내역 삭제
   */
  async deleteMaintenanceHistory(historyId: string): Promise<void> {
    const result = await this.db
      .delete(equipmentMaintenanceHistory)
      .where(eq(equipmentMaintenanceHistory.id, historyId))
      .returning();

    if (result.length === 0) {
      throw new NotFoundException(`Maintenance history with ID ${historyId} not found`);
    }
  }

  // ===================== 손상/오작동/변경/수리 내역 =====================

  /**
   * 장비의 손상/오작동/변경/수리 내역 조회
   */
  async getIncidentHistory(
    equipmentUuid: string,
    options: { page?: number; pageSize?: number } = {}
  ): Promise<PaginatedResponse<IncidentHistoryResponseDto>> {
    const page = options.page ?? 1;
    const pageSize = Math.min(options.pageSize ?? DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE);
    const offset = (page - 1) * pageSize;

    const [countResult] = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(equipmentIncidentHistory)
      .where(eq(equipmentIncidentHistory.equipmentId, equipmentUuid));

    const total = Number(countResult?.count ?? 0);

    const records = await this.db
      .select()
      .from(equipmentIncidentHistory)
      .where(eq(equipmentIncidentHistory.equipmentId, equipmentUuid))
      .orderBy(desc(equipmentIncidentHistory.occurredAt))
      .limit(pageSize)
      .offset(offset);

    return {
      items: records.map((record) => ({
        id: record.id,
        equipmentId: record.equipmentId,
        occurredAt: record.occurredAt,
        incidentType: record.incidentType,
        content: record.content,
        reportedBy: record.reportedBy ?? undefined,
        createdAt: record.createdAt,
        nonConformanceId: record.nonConformanceId ?? undefined,
      })),
      meta: buildPaginationMeta(total, pageSize, page),
    };
  }

  /**
   * 손상/오작동/변경/수리 내역 추가 (부적합 생성 선택 가능)
   *
   * 특별 처리: calibration_overdue 타입은 자동으로 부적합 생성 (중복 방지)
   *
   * ⚠️ 과거 이력 처리:
   * - 부적합 기록은 과거 일자로도 생성 가능 (이력 추적용)
   * - 장비 상태 변경은 현재 시점 기준으로만 수행 (과거 이력은 현재 상태에 영향 없음)
   */
  async createIncidentHistory(
    equipmentUuid: string,
    dto: CreateIncidentHistoryDto,
    userId?: string
  ): Promise<IncidentHistoryResponseDto> {
    // 사용자 ID 검증 (DB에 존재하지 않으면 null 설정)
    const validatedUserId = await this.validateAndGetUserId(userId);

    // UTC 기준 현재 날짜
    const today = getUtcStartOfDay();
    const occurredDate = getUtcStartOfDay(new Date(dto.occurredAt));

    // 과거 이력 여부 판단 (현재 날짜보다 이전)
    const isPastIncident = occurredDate.getTime() < today.getTime();

    // 트랜잭션으로 원자성 보장
    let equipmentStatusChanged = false;

    const result = await this.db.transaction(async (tx) => {
      // 1. 사고이력 생성 (항상 수행 - 과거/현재 모두)
      const [record] = await tx
        .insert(equipmentIncidentHistory)
        .values({
          equipmentId: equipmentUuid,
          occurredAt: new Date(dto.occurredAt),
          incidentType: dto.incidentType,
          content: dto.content,
          reportedBy: validatedUserId,
        })
        .returning();

      let nonConformanceId: string | undefined;

      // 2-A. 교정 기한 초과는 자동으로 부적합 생성 (중복 방지)
      if (dto.incidentType === NonConformanceTypeEnum.enum.calibration_overdue) {
        // 2-A-1. 이미 open 상태의 calibration_overdue 부적합이 있는지 확인
        const existingNc = await tx
          .select()
          .from(nonConformances)
          .where(
            and(
              eq(nonConformances.equipmentId, equipmentUuid),
              eq(nonConformances.ncType, NonConformanceTypeEnum.enum.calibration_overdue),
              isNull(nonConformances.deletedAt),
              eq(nonConformances.status, NonConformanceStatusEnum.enum.open)
            )
          )
          .limit(1);

        if (existingNc.length === 0) {
          // 2-A-2. 기존 부적합 없음 → 새로 생성 (과거/현재 모두 생성)
          const [nc] = await tx
            .insert(nonConformances)
            .values({
              equipmentId: equipmentUuid,
              discoveryDate: occurredDate.toISOString().split('T')[0],
              discoveredBy: validatedUserId,
              cause: dto.content,
              ncType: NonConformanceTypeEnum.enum.calibration_overdue,
              actionPlan:
                dto.actionPlan ||
                this.i18n.t('system.calibrationOverdue.defaultActionPlan', DEFAULT_LOCALE),
              status: NonConformanceStatusEnum.enum.open,
            })
            .returning();

          nonConformanceId = nc.id;

          // 2-A-3. 장비 상태 변경 (현재 시점 기준으로만 수행)
          // ✅ 과거 이력은 현재 장비 상태에 영향을 주지 않음
          if (!isPastIncident) {
            // 장비 정보 조회 (교정 기한 확인)
            const [currentEquipment] = await tx
              .select({
                status: equipment.status,
                nextCalibrationDate: equipment.nextCalibrationDate,
              })
              .from(equipment)
              .where(eq(equipment.id, equipmentUuid))
              .limit(1);

            // 현재 교정 기한이 실제로 초과되었는지 확인
            const isActuallyOverdue =
              currentEquipment?.nextCalibrationDate &&
              new Date(currentEquipment.nextCalibrationDate).getTime() < today.getTime();

            // 실제로 교정 기한이 초과된 경우에만 상태 변경
            if (
              isActuallyOverdue &&
              currentEquipment?.status !== EquipmentStatusEnum.enum.non_conforming
            ) {
              // CAS 면제: 시스템 자동 트리거 (사고이력 생성 → 부적합 전환)
              // 사용자 직접 요청이 아닌 내부 비즈니스 규칙에 의한 상태 변경이므로
              // version WHERE 조건 없이 무조건 갱신. CalibrationOverdueScheduler와 동일 패턴.
              await tx
                .update(equipment)
                .set({
                  status: EquipmentStatusEnum.enum.non_conforming,
                  version: sql`version + 1`,
                  updatedAt: new Date(),
                } as Record<string, unknown>)
                .where(eq(equipment.id, equipmentUuid));
              equipmentStatusChanged = true;
            }
          }
        } else {
          // 2-A-4. 이미 부적합 존재 → 기존 ID만 반환 (중복 생성 방지)
          nonConformanceId = existingNc[0].id;
        }
      }
      // 2-B. damage/malfunction 수동 부적합 생성 (기존 로직)
      else if (dto.createNonConformance === true) {
        // damage/malfunction만 부적합 생성 가능 (검증)
        if (!['damage', 'malfunction'].includes(dto.incidentType)) {
          throw new BadRequestException({
            code: 'NC_INVALID_INCIDENT_TYPE',
            message:
              'Non-conformance can only be created for damage or malfunction incident types.',
          });
        }

        // userId 검증 (부적합 생성 시 필수)
        if (!validatedUserId) {
          throw new BadRequestException(
            '부적합 생성 시 사용자 인증이 필요합니다. 로그인 후 다시 시도해주세요.'
          );
        }

        // 부적합 생성
        const [nc] = await tx
          .insert(nonConformances)
          .values({
            equipmentId: equipmentUuid,
            discoveryDate: occurredDate.toISOString().split('T')[0], // timestamp → date
            discoveredBy: validatedUserId,
            cause: dto.content,
            ncType: dto.incidentType as 'damage' | 'malfunction',
            actionPlan: dto.actionPlan ?? null,
            status: NonConformanceStatusEnum.enum.open,
          })
          .returning();

        nonConformanceId = nc.id;

        // 3. 장비 상태 변경 (선택 + 현재 시점만)
        // ✅ 과거 이력은 현재 장비 상태에 영향을 주지 않음
        if (dto.changeEquipmentStatus === true && !isPastIncident) {
          // CAS 면제: 사고이력 등록 시 부적합 전환은 트랜잭션 내 시스템 규칙
          // 사용자는 사고이력을 등록하는 것이지, 장비 상태를 직접 수정하지 않음
          await tx
            .update(equipment)
            .set({
              status: EquipmentStatusEnum.enum.non_conforming,
              version: sql`version + 1`,
              updatedAt: new Date(),
            } as Record<string, unknown>)
            .where(eq(equipment.id, equipmentUuid));
          equipmentStatusChanged = true;
        }
      }

      // 4. 부적합 생성된 경우 사고이력에 FK 연결
      if (nonConformanceId) {
        await tx
          .update(equipmentIncidentHistory)
          .set({ nonConformanceId })
          .where(eq(equipmentIncidentHistory.id, record.id));
      }

      // 5. 응답 반환
      return {
        id: record.id,
        equipmentId: record.equipmentId,
        occurredAt: record.occurredAt,
        incidentType: record.incidentType,
        content: record.content,
        reportedBy: record.reportedBy ?? undefined,
        createdAt: record.createdAt,
        nonConformanceId, // 부적합 생성된 경우 ID 포함
      };
    });

    // 트랜잭션 완료 후 캐시 무효화 (calibration-overdue-scheduler 패턴과 동일)
    if (equipmentStatusChanged) {
      await this.cacheInvalidationHelper.invalidateAfterEquipmentUpdate(
        equipmentUuid,
        true, // statusChanged
        false // teamIdChanged
      );
    }

    return result;
  }

  // ===================== 반출 이력 =====================

  /**
   * 장비별 반출 이력 조회
   *
   * checkoutItems(N:M 매핑) → checkouts(헤더) → users(신청자) JOIN 경로.
   * CheckoutsModule에 의존하지 않고 Drizzle DB 직접 쿼리 (순환 의존성 회피).
   * 인덱스: checkout_items_equipment_id_idx (checkoutItems.equipmentId)
   */
  async getCheckoutHistory(
    equipmentUuid: string,
    options: { page?: number; pageSize?: number } = {}
  ): Promise<PaginatedResponse<Record<string, unknown>>> {
    const page = options.page ?? 1;
    const pageSize = Math.min(options.pageSize ?? DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE);
    const offset = (page - 1) * pageSize;

    // COUNT 쿼리 (페이지네이션)
    const [countResult] = await this.db
      .select({ count: sql<number>`count(DISTINCT ${checkouts.id})` })
      .from(checkoutItems)
      .innerJoin(checkouts, eq(checkoutItems.checkoutId, checkouts.id))
      .where(eq(checkoutItems.equipmentId, equipmentUuid));

    const total = Number(countResult?.count ?? 0);

    // 데이터 쿼리: 서브쿼리로 checkout ID 특정 → checkouts → users
    // checkoutItems에 (checkoutId, equipmentId) unique 미존재 → 서브쿼리로 DISTINCT 보장
    const checkoutIdSubquery = this.db
      .selectDistinct({ checkoutId: checkoutItems.checkoutId })
      .from(checkoutItems)
      .where(eq(checkoutItems.equipmentId, equipmentUuid));

    const rows = await this.db
      .select({
        id: checkouts.id,
        version: checkouts.version,
        purpose: checkouts.purpose,
        destination: checkouts.destination,
        reason: checkouts.reason,
        status: checkouts.status,
        checkoutDate: checkouts.checkoutDate,
        expectedReturnDate: checkouts.expectedReturnDate,
        actualReturnDate: checkouts.actualReturnDate,
        createdAt: checkouts.createdAt,
        userName: users.name,
        userEmail: users.email,
      })
      .from(checkouts)
      .leftJoin(users, eq(checkouts.requesterId, users.id))
      .where(sql`${checkouts.id} IN (${checkoutIdSubquery})`)
      .orderBy(desc(checkouts.createdAt))
      .limit(pageSize)
      .offset(offset);

    return {
      items: rows.map((row) => ({
        id: row.id,
        version: row.version,
        purpose: row.purpose,
        destination: row.destination,
        reason: row.reason,
        status: row.status,
        checkoutDate: row.checkoutDate,
        expectedReturnDate: row.expectedReturnDate,
        actualReturnDate: row.actualReturnDate,
        createdAt: row.createdAt,
        user: row.userName ? { name: row.userName, email: row.userEmail } : undefined,
      })),
      meta: buildPaginationMeta(total, pageSize, page),
    };
  }

  /**
   * 손상/오작동/변경/수리 내역 삭제
   */
  async deleteIncidentHistory(historyId: string): Promise<void> {
    // UUID 형식 검증
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(historyId)) {
      throw new BadRequestException(`Invalid history ID format: ${historyId}`);
    }

    try {
      const result = await this.db
        .delete(equipmentIncidentHistory)
        .where(eq(equipmentIncidentHistory.id, historyId))
        .returning();

      if (result.length === 0) {
        throw new NotFoundException(`Incident history with ID ${historyId} not found`);
      }
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      console.error(`[deleteIncidentHistory] Error deleting incident history ${historyId}:`, error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new BadRequestException(`Failed to delete incident history: ${errorMessage}`);
    }
  }
}

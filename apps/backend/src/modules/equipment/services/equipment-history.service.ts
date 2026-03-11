import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { eq, desc, and, isNull, sql } from 'drizzle-orm';
import type { AppDatabase } from '@equipment-management/db';
import * as schema from '@equipment-management/db/schema';
import {
  equipmentLocationHistory,
  equipmentMaintenanceHistory,
  equipmentIncidentHistory,
  equipment,
  users,
} from '@equipment-management/db/schema';
import { nonConformances } from '@equipment-management/db/schema/non-conformances';
import {
  CreateLocationHistoryDto,
  CreateMaintenanceHistoryDto,
  CreateIncidentHistoryDto,
  LocationHistoryResponseDto,
  MaintenanceHistoryResponseDto,
  IncidentHistoryResponseDto,
} from '../dto/equipment-history.dto';
import { getUtcStartOfDay } from '../../../common/utils';

@Injectable()
export class EquipmentHistoryService {
  constructor(
    @Inject('DRIZZLE_INSTANCE')
    private readonly db: AppDatabase
  ) {}

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

  // ===================== 위치 변동 이력 =====================

  /**
   * 장비의 위치 변동 이력 조회
   */
  async getLocationHistory(equipmentUuid: string): Promise<LocationHistoryResponseDto[]> {
    const records = await this.db
      .select()
      .from(equipmentLocationHistory)
      .where(eq(equipmentLocationHistory.equipmentId, equipmentUuid))
      .orderBy(desc(equipmentLocationHistory.changedAt));

    return records.map((record) => ({
      id: record.id,
      equipmentId: record.equipmentId,
      changedAt: record.changedAt,
      newLocation: record.newLocation,
      notes: record.notes ?? undefined,
      changedBy: record.changedBy ?? undefined,
      createdAt: record.createdAt,
    }));
  }

  /**
   * 위치 변동 이력 추가
   */
  async createLocationHistory(
    equipmentUuid: string,
    dto: CreateLocationHistoryDto,
    userId?: string
  ): Promise<LocationHistoryResponseDto> {
    // 사용자 ID 검증 (DB에 존재하지 않으면 null 설정)
    const validatedUserId = await this.validateAndGetUserId(userId);

    const [record] = await this.db
      .insert(equipmentLocationHistory)
      .values({
        equipmentId: equipmentUuid,
        changedAt: new Date(dto.changedAt),
        newLocation: dto.newLocation,
        notes: dto.notes ?? null,
        changedBy: validatedUserId,
      })
      .returning();

    return {
      id: record.id,
      equipmentId: record.equipmentId,
      changedAt: record.changedAt,
      newLocation: record.newLocation,
      notes: record.notes ?? undefined,
      changedBy: record.changedBy ?? undefined,
      createdAt: record.createdAt,
    };
  }

  /**
   * 위치 변동 이력 삭제
   */
  async deleteLocationHistory(historyId: string): Promise<void> {
    const result = await this.db
      .delete(equipmentLocationHistory)
      .where(eq(equipmentLocationHistory.id, historyId))
      .returning();

    if (result.length === 0) {
      throw new NotFoundException(`Location history with ID ${historyId} not found`);
    }
  }

  // ===================== 유지보수 내역 =====================

  /**
   * 장비의 유지보수 내역 조회
   */
  async getMaintenanceHistory(equipmentUuid: string): Promise<MaintenanceHistoryResponseDto[]> {
    const records = await this.db
      .select()
      .from(equipmentMaintenanceHistory)
      .where(eq(equipmentMaintenanceHistory.equipmentId, equipmentUuid))
      .orderBy(desc(equipmentMaintenanceHistory.performedAt));

    return records.map((record) => ({
      id: record.id,
      equipmentId: record.equipmentId,
      performedAt: record.performedAt,
      content: record.content,
      performedBy: record.performedBy ?? undefined,
      createdAt: record.createdAt,
    }));
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
  async getIncidentHistory(equipmentUuid: string): Promise<IncidentHistoryResponseDto[]> {
    const records = await this.db
      .select()
      .from(equipmentIncidentHistory)
      .where(eq(equipmentIncidentHistory.equipmentId, equipmentUuid))
      .orderBy(desc(equipmentIncidentHistory.occurredAt));

    return records.map((record) => ({
      id: record.id,
      equipmentId: record.equipmentId,
      occurredAt: record.occurredAt,
      incidentType: record.incidentType,
      content: record.content,
      reportedBy: record.reportedBy ?? undefined,
      createdAt: record.createdAt,
    }));
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
    return await this.db.transaction(async (tx) => {
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
      if (dto.incidentType === 'calibration_overdue') {
        // 2-A-1. 이미 open/analyzing 상태의 calibration_overdue 부적합이 있는지 확인
        const existingNc = await tx
          .select()
          .from(nonConformances)
          .where(
            and(
              eq(nonConformances.equipmentId, equipmentUuid),
              eq(nonConformances.ncType, 'calibration_overdue'),
              isNull(nonConformances.deletedAt),
              sql`${nonConformances.status} IN ('open', 'analyzing')`
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
              ncType: 'calibration_overdue',
              actionPlan: dto.actionPlan || '교정 수행 필요',
              status: 'open',
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
            if (isActuallyOverdue && currentEquipment?.status !== 'non_conforming') {
              await tx
                .update(equipment)
                .set({
                  status: 'non_conforming',
                  updatedAt: new Date(),
                })
                .where(eq(equipment.id, equipmentUuid));
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
            status: 'open',
          })
          .returning();

        nonConformanceId = nc.id;

        // 3. 장비 상태 변경 (선택 + 현재 시점만)
        // ✅ 과거 이력은 현재 장비 상태에 영향을 주지 않음
        if (dto.changeEquipmentStatus === true && !isPastIncident) {
          await tx
            .update(equipment)
            .set({
              status: 'non_conforming',
              updatedAt: new Date(),
            })
            .where(eq(equipment.id, equipmentUuid));
        }
      }

      // 4. 응답 반환
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

import { Injectable, Inject, NotFoundException, BadRequestException, forwardRef } from '@nestjs/common';
import { eq, desc } from 'drizzle-orm';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import * as schema from '../../../database/drizzle/schema';
import {
  equipmentLocationHistory,
  equipmentMaintenanceHistory,
  equipmentIncidentHistory,
  equipment,
} from '../../../database/drizzle/schema';
import { nonConformances } from '@equipment-management/db/schema/non-conformances';
import {
  CreateLocationHistoryDto,
  CreateMaintenanceHistoryDto,
  CreateIncidentHistoryDto,
  LocationHistoryResponseDto,
  MaintenanceHistoryResponseDto,
  IncidentHistoryResponseDto,
} from '../dto/equipment-history.dto';
import { NonConformancesService } from '../../non-conformances/non-conformances.service';

@Injectable()
export class EquipmentHistoryService {
  constructor(
    @Inject('DRIZZLE_INSTANCE')
    private readonly db: PostgresJsDatabase<typeof schema>,
    @Inject(forwardRef(() => NonConformancesService))
    private readonly nonConformancesService: NonConformancesService
  ) {}

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

    return records.map((record: any) => ({
      id: record.id,
      equipmentId: record.equipmentId,
      changedAt: record.changedAt,
      newLocation: record.newLocation,
      notes: record.notes || undefined,
      changedBy: record.changedBy || undefined,
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
    const [record] = await this.db
      .insert(equipmentLocationHistory)
      .values({
        equipmentId: equipmentUuid,
        changedAt: new Date(dto.changedAt),
        newLocation: dto.newLocation,
        notes: dto.notes || null,
        changedBy: userId || null,
      } as any)
      .returning();

    return {
      id: record.id,
      equipmentId: record.equipmentId,
      changedAt: record.changedAt,
      newLocation: record.newLocation,
      notes: (record as any).notes || undefined,
      changedBy: (record as any).changedBy || undefined,
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

    return records.map((record: any) => ({
      id: record.id,
      equipmentId: record.equipmentId,
      performedAt: record.performedAt,
      content: record.content,
      performedBy: record.performedBy || undefined,
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
    const [record] = await this.db
      .insert(equipmentMaintenanceHistory)
      .values({
        equipmentId: equipmentUuid,
        performedAt: new Date(dto.performedAt),
        content: dto.content,
        performedBy: userId || null,
      } as any)
      .returning();

    return {
      id: record.id,
      equipmentId: record.equipmentId,
      performedAt: record.performedAt,
      content: record.content,
      performedBy: (record as any).performedBy || undefined,
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

    return records.map((record: any) => ({
      id: record.id,
      equipmentId: record.equipmentId,
      occurredAt: record.occurredAt,
      incidentType: record.incidentType,
      content: record.content,
      reportedBy: record.reportedBy || undefined,
      createdAt: record.createdAt,
    }));
  }

  /**
   * 손상/오작동/변경/수리 내역 추가 (부적합 생성 선택 가능)
   */
  async createIncidentHistory(
    equipmentUuid: string,
    dto: CreateIncidentHistoryDto,
    userId?: string
  ): Promise<IncidentHistoryResponseDto> {
    // 트랜잭션으로 원자성 보장
    return await this.db.transaction(async (tx) => {
      // 1. 사고이력 생성 (항상 수행)
      const [record] = await tx
        .insert(equipmentIncidentHistory)
        .values({
          equipmentId: equipmentUuid,
          occurredAt: new Date(dto.occurredAt),
          incidentType: dto.incidentType,
          content: dto.content,
          reportedBy: userId || null,
        } as any)
        .returning();

      let nonConformanceId: string | undefined;

      // 2. 부적합 생성 (선택)
      if (dto.createNonConformance === true) {
        // damage/malfunction만 부적합 생성 가능 (검증)
        if (!['damage', 'malfunction'].includes(dto.incidentType)) {
          throw new BadRequestException(
            '부적합은 손상 또는 오작동 유형에서만 생성할 수 있습니다'
          );
        }

        // userId 검증 (부적합 생성 시 필수)
        if (!userId) {
          throw new BadRequestException(
            '부적합 생성 시 사용자 인증이 필요합니다. 로그인 후 다시 시도해주세요.'
          );
        }

        // 부적합 생성
        const [nc] = await tx
          .insert(nonConformances)
          .values({
            equipmentId: equipmentUuid,
            discoveryDate: new Date(dto.occurredAt).toISOString().split('T')[0], // timestamp → date
            discoveredBy: userId,
            cause: dto.content,
            ncType: dto.incidentType as 'damage' | 'malfunction',
            actionPlan: dto.actionPlan || null,
            status: 'open',
          } as any)
          .returning();

        nonConformanceId = nc.id;

        // 3. 장비 상태 변경 (선택)
        if (dto.changeEquipmentStatus === true) {
          await tx
            .update(equipment)
            .set({
              status: 'non_conforming',
              updatedAt: new Date(),
            } as any)
            .where(eq(equipment.id, equipmentUuid));
        }
      }

      // 4. 응답 반환
      return {
        id: record.id,
        equipmentId: record.equipmentId,
        occurredAt: record.occurredAt,
        incidentType: (record as any).incidentType,
        content: record.content,
        reportedBy: (record as any).reportedBy || undefined,
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
      throw new BadRequestException(`Failed to delete incident history: ${error.message}`);
    }
  }
}

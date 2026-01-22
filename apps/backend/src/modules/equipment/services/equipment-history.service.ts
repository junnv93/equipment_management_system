import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { eq, desc } from 'drizzle-orm';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import * as schema from '../../../database/drizzle/schema';
import {
  equipmentLocationHistory,
  equipmentMaintenanceHistory,
  equipmentIncidentHistory,
} from '../../../database/drizzle/schema';
import {
  CreateLocationHistoryDto,
  CreateMaintenanceHistoryDto,
  CreateIncidentHistoryDto,
  LocationHistoryResponseDto,
  MaintenanceHistoryResponseDto,
  IncidentHistoryResponseDto,
} from '../dto/equipment-history.dto';

@Injectable()
export class EquipmentHistoryService {
  constructor(
    @Inject('DRIZZLE_INSTANCE')
    private readonly db: PostgresJsDatabase<typeof schema>
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
   * 손상/오작동/변경/수리 내역 추가
   */
  async createIncidentHistory(
    equipmentUuid: string,
    dto: CreateIncidentHistoryDto,
    userId?: string
  ): Promise<IncidentHistoryResponseDto> {
    const [record] = await this.db
      .insert(equipmentIncidentHistory)
      .values({
        equipmentId: equipmentUuid,
        occurredAt: new Date(dto.occurredAt),
        incidentType: dto.incidentType,
        content: dto.content,
        reportedBy: userId || null,
      } as any)
      .returning();

    return {
      id: record.id,
      equipmentId: record.equipmentId,
      occurredAt: record.occurredAt,
      incidentType: (record as any).incidentType,
      content: record.content,
      reportedBy: (record as any).reportedBy || undefined,
      createdAt: record.createdAt,
    };
  }

  /**
   * 손상/오작동/변경/수리 내역 삭제
   */
  async deleteIncidentHistory(historyId: string): Promise<void> {
    const result = await this.db
      .delete(equipmentIncidentHistory)
      .where(eq(equipmentIncidentHistory.id, historyId))
      .returning();

    if (result.length === 0) {
      throw new NotFoundException(`Incident history with ID ${historyId} not found`);
    }
  }
}

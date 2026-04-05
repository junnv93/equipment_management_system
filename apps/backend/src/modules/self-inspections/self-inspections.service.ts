import {
  Inject,
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import type { AppDatabase } from '@equipment-management/db';
import { eq, desc, and, sql } from 'drizzle-orm';
import {
  equipmentSelfInspections,
  equipment,
  type EquipmentSelfInspection,
} from '@equipment-management/db/schema';
import type { CreateSelfInspectionInput } from './dto/create-self-inspection.dto';
import type { UpdateSelfInspectionInput } from './dto/update-self-inspection.dto';

@Injectable()
export class SelfInspectionsService {
  constructor(
    @Inject('DRIZZLE_INSTANCE')
    private readonly db: AppDatabase
  ) {}

  async create(
    equipmentId: string,
    dto: CreateSelfInspectionInput,
    inspectorId: string
  ): Promise<EquipmentSelfInspection> {
    // 장비 존재 확인
    const [eqRow] = await this.db
      .select({ id: equipment.id })
      .from(equipment)
      .where(eq(equipment.id, equipmentId))
      .limit(1);

    if (!eqRow) {
      throw new NotFoundException({
        code: 'EQUIPMENT_NOT_FOUND',
        message: `Equipment ${equipmentId} not found.`,
      });
    }

    const inspectionDate = new Date(dto.inspectionDate);
    const cycle = dto.inspectionCycle ?? 6;
    const nextDate = new Date(inspectionDate);
    nextDate.setMonth(nextDate.getMonth() + cycle);
    const nextInspectionDate = nextDate.toISOString().split('T')[0];

    const [created] = await this.db
      .insert(equipmentSelfInspections)
      .values({
        equipmentId,
        inspectionDate,
        inspectorId,
        appearance: dto.appearance,
        functionality: dto.functionality,
        safety: dto.safety,
        calibrationStatus: dto.calibrationStatus,
        overallResult: dto.overallResult,
        remarks: dto.remarks ?? null,
        inspectionCycle: cycle,
        nextInspectionDate,
        status: 'completed',
      })
      .returning();

    return created;
  }

  async findByEquipment(
    equipmentId: string,
    page = 1,
    pageSize = 20
  ): Promise<{ data: EquipmentSelfInspection[]; total: number }> {
    const offset = (page - 1) * pageSize;

    const data = await this.db
      .select()
      .from(equipmentSelfInspections)
      .where(eq(equipmentSelfInspections.equipmentId, equipmentId))
      .orderBy(desc(equipmentSelfInspections.inspectionDate))
      .limit(pageSize)
      .offset(offset);

    const [{ count }] = await this.db
      .select({ count: countFn() })
      .from(equipmentSelfInspections)
      .where(eq(equipmentSelfInspections.equipmentId, equipmentId));

    return { data, total: Number(count) };
  }

  async findById(id: string): Promise<EquipmentSelfInspection> {
    const [row] = await this.db
      .select()
      .from(equipmentSelfInspections)
      .where(eq(equipmentSelfInspections.id, id))
      .limit(1);

    if (!row) {
      throw new NotFoundException({
        code: 'SELF_INSPECTION_NOT_FOUND',
        message: `Self-inspection ${id} not found.`,
      });
    }

    return row;
  }

  async update(
    id: string,
    dto: UpdateSelfInspectionInput,
    _userId: string
  ): Promise<EquipmentSelfInspection> {
    const existing = await this.findById(id);

    if (existing.status === 'confirmed') {
      throw new BadRequestException({
        code: 'ALREADY_CONFIRMED',
        message: 'Confirmed inspections cannot be modified.',
      });
    }

    if (existing.version !== dto.version) {
      throw new ConflictException({
        code: 'VERSION_CONFLICT',
        message: 'Self-inspection was modified by another user.',
        currentVersion: existing.version,
        expectedVersion: dto.version,
      });
    }

    const updateData: Record<string, unknown> = {
      version: existing.version + 1,
      updatedAt: new Date(),
    };

    if (dto.inspectionDate) updateData.inspectionDate = new Date(dto.inspectionDate);
    if (dto.appearance) updateData.appearance = dto.appearance;
    if (dto.functionality) updateData.functionality = dto.functionality;
    if (dto.safety) updateData.safety = dto.safety;
    if (dto.calibrationStatus) updateData.calibrationStatus = dto.calibrationStatus;
    if (dto.overallResult) updateData.overallResult = dto.overallResult;
    if (dto.remarks !== undefined) updateData.remarks = dto.remarks;
    if (dto.inspectionCycle) {
      updateData.inspectionCycle = dto.inspectionCycle;
      const baseDate = dto.inspectionDate ? new Date(dto.inspectionDate) : existing.inspectionDate;
      const nextDate = new Date(baseDate);
      nextDate.setMonth(nextDate.getMonth() + dto.inspectionCycle);
      updateData.nextInspectionDate = nextDate.toISOString().split('T')[0];
    }

    const [updated] = await this.db
      .update(equipmentSelfInspections)
      .set(updateData)
      .where(
        and(
          eq(equipmentSelfInspections.id, id),
          eq(equipmentSelfInspections.version, existing.version)
        )
      )
      .returning();

    if (!updated) {
      throw new ConflictException({
        code: 'VERSION_CONFLICT',
        message: 'Self-inspection was modified by another user.',
      });
    }

    return updated;
  }

  async confirm(
    id: string,
    confirmedBy: string,
    version: number
  ): Promise<EquipmentSelfInspection> {
    const existing = await this.findById(id);

    if (existing.status === 'confirmed') {
      throw new BadRequestException({
        code: 'ALREADY_CONFIRMED',
        message: 'Self-inspection is already confirmed.',
      });
    }

    if (existing.status !== 'completed') {
      throw new BadRequestException({
        code: 'NOT_COMPLETED',
        message: 'Only completed inspections can be confirmed.',
      });
    }

    if (existing.version !== version) {
      throw new ConflictException({
        code: 'VERSION_CONFLICT',
        message: 'Self-inspection was modified by another user.',
        currentVersion: existing.version,
        expectedVersion: version,
      });
    }

    const [updated] = await this.db
      .update(equipmentSelfInspections)
      .set({
        status: 'confirmed',
        confirmedBy,
        confirmedAt: new Date(),
        version: existing.version + 1,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(equipmentSelfInspections.id, id),
          eq(equipmentSelfInspections.version, existing.version)
        )
      )
      .returning();

    if (!updated) {
      throw new ConflictException({
        code: 'VERSION_CONFLICT',
        message: 'Self-inspection was modified by another user.',
      });
    }

    return updated;
  }

  /**
   * 장비 사이트 정보 조회 (enforceSiteAccess용)
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
   * 자체점검 ID로 장비 사이트 정보 역추적
   */
  async getEquipmentSiteInfoBySelfInspectionId(
    selfInspectionId: string
  ): Promise<{ site: string; teamId: string | null }> {
    const [result] = await this.db
      .select({ site: equipment.site, teamId: equipment.teamId })
      .from(equipmentSelfInspections)
      .innerJoin(equipment, eq(equipmentSelfInspections.equipmentId, equipment.id))
      .where(eq(equipmentSelfInspections.id, selfInspectionId))
      .limit(1);
    if (!result) {
      throw new NotFoundException({
        code: 'SELF_INSPECTION_NOT_FOUND',
        message: `Self-inspection ${selfInspectionId} not found.`,
      });
    }
    return result;
  }

  async delete(id: string): Promise<void> {
    const existing = await this.findById(id);

    if (existing.status === 'confirmed') {
      throw new BadRequestException({
        code: 'ALREADY_CONFIRMED',
        message: 'Confirmed inspections cannot be deleted.',
      });
    }

    await this.db.delete(equipmentSelfInspections).where(eq(equipmentSelfInspections.id, id));
  }
}

const countFn = (): ReturnType<typeof sql<number>> => sql<number>`count(*)`;

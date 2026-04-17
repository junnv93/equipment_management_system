import { Injectable, NotFoundException, Inject, forwardRef } from '@nestjs/common';
import { eq, and, gte, lte, asc, desc, sql } from 'drizzle-orm';
import type { AppDatabase } from '@equipment-management/db';
import { repairHistory, RepairHistory, equipment } from '@equipment-management/db/schema';
import {
  CreateRepairHistoryDto,
  UpdateRepairHistoryDto,
  RepairHistoryQueryDto,
} from '../dto/repair-history.dto';
import { NonConformancesService } from '../../non-conformances/non-conformances.service';
import { NonConformanceStatus } from '../../non-conformances/dto/non-conformance-query.dto';
import { RepairResultValues } from '@equipment-management/schemas';
import { CacheInvalidationHelper } from '../../../common/cache/cache-invalidation.helper';

const RepairResultEnum = RepairResultValues;

// 컨트롤러 하위 호환성을 위한 타입 별칭
export type RepairHistoryRecord = RepairHistory;

@Injectable()
export class RepairHistoryService {
  constructor(
    @Inject('DRIZZLE_INSTANCE')
    private readonly db: AppDatabase,
    @Inject(forwardRef(() => NonConformancesService))
    private nonConformancesService: NonConformancesService,
    private readonly cacheInvalidationHelper: CacheInvalidationHelper
  ) {}

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
   * 수리 이력 ID로 장비 사이트 정보 역추적
   */
  async getEquipmentSiteInfoByRepairHistoryId(
    repairHistoryId: string
  ): Promise<{ site: string; teamId: string | null }> {
    const [result] = await this.db
      .select({ site: equipment.site, teamId: equipment.teamId })
      .from(repairHistory)
      .innerJoin(equipment, eq(repairHistory.equipmentId, equipment.id))
      .where(eq(repairHistory.id, repairHistoryId))
      .limit(1);
    if (!result) {
      throw new NotFoundException({
        code: 'REPAIR_HISTORY_NOT_FOUND',
        message: `Repair history ${repairHistoryId} not found.`,
      });
    }
    return result;
  }

  /**
   * 장비별 수리 이력 목록 조회
   */
  async findByEquipment(
    equipmentUuid: string,
    query: RepairHistoryQueryDto
  ): Promise<{
    items: RepairHistoryRecord[];
    meta: {
      totalItems: number;
      currentPage: number;
      itemsPerPage: number;
      totalPages: number;
    };
  }> {
    const {
      fromDate,
      toDate,
      repairResult,
      includeDeleted = false,
      sort = 'repairDate.desc',
    } = query;

    const page = query.page ? Number(query.page) : 1;
    const pageSize = query.pageSize ? Number(query.pageSize) : 20;

    const conditions = [eq(repairHistory.equipmentId, equipmentUuid)];
    if (!includeDeleted) conditions.push(eq(repairHistory.isDeleted, false));
    if (fromDate) conditions.push(gte(repairHistory.repairDate, new Date(fromDate)));
    if (toDate) conditions.push(lte(repairHistory.repairDate, new Date(toDate)));
    if (repairResult) conditions.push(eq(repairHistory.repairResult, repairResult));

    const [sortField, sortOrder] = sort.split('.');
    const sortColumn =
      sortField === 'repairDate' ? repairHistory.repairDate : repairHistory.createdAt;
    const orderBy = sortOrder === 'asc' ? asc(sortColumn) : desc(sortColumn);

    const [items, [{ count }]] = await Promise.all([
      this.db
        .select()
        .from(repairHistory)
        .where(and(...conditions))
        .orderBy(orderBy)
        .limit(pageSize)
        .offset((page - 1) * pageSize),
      this.db
        .select({ count: sql<number>`count(*)` })
        .from(repairHistory)
        .where(and(...conditions)),
    ]);

    const totalItems = Number(count);
    return {
      items,
      meta: {
        totalItems,
        currentPage: page,
        itemsPerPage: pageSize,
        totalPages: Math.ceil(totalItems / pageSize),
      },
    };
  }

  /**
   * 수리 이력 상세 조회
   */
  async findOne(uuid: string): Promise<RepairHistoryRecord> {
    const [record] = await this.db
      .select()
      .from(repairHistory)
      .where(and(eq(repairHistory.id, uuid), eq(repairHistory.isDeleted, false)))
      .limit(1);

    if (!record) {
      throw new NotFoundException({
        code: 'REPAIR_HISTORY_NOT_FOUND',
        message: `Repair history not found: ${uuid}`,
      });
    }
    return record;
  }

  /**
   * 수리 이력 생성
   * 부적합 ID가 제공되면 자동으로 연결하고, 수리 완료 시 부적합 상태 업데이트
   */
  async create(
    equipmentUuid: string,
    dto: CreateRepairHistoryDto,
    createdBy: string
  ): Promise<RepairHistoryRecord> {
    const [newRecord] = await this.db
      .insert(repairHistory)
      .values({
        equipmentId: equipmentUuid,
        repairDate: new Date(dto.repairDate),
        repairDescription: dto.repairDescription,
        repairResult: dto.repairResult || null,
        notes: dto.notes || null,
        attachmentPath: dto.attachmentPath || null,
        createdBy,
      })
      .returning();

    if (dto.nonConformanceId) {
      await this.nonConformancesService.linkRepair(dto.nonConformanceId, newRecord.id);

      if (dto.repairResult === RepairResultEnum.COMPLETED) {
        await this.nonConformancesService.markCorrected(dto.nonConformanceId, {
          correctionContent: `수리 완료: ${dto.repairDescription}`,
          correctionDate: new Date(dto.repairDate),
          correctedBy: createdBy,
        });
      }
    }

    // 이력카드/장비 상세의 UL-QP-18-02 이력 섹션에 반영되도록 캐시 무효화
    // (equipment_history.service 및 non_conformance 경로와 동일 SSOT 사용)
    await this.cacheInvalidationHelper.invalidateAfterEquipmentUpdate(equipmentUuid, false, false);

    return newRecord;
  }

  /**
   * 수리 이력 수정
   * repairResult가 'completed'로 변경되면 연결된 부적합 상태 자동 업데이트
   */
  async update(uuid: string, dto: UpdateRepairHistoryDto): Promise<RepairHistoryRecord> {
    const existing = await this.findOne(uuid);
    const previousResult = existing.repairResult;

    const updateData: Partial<typeof repairHistory.$inferInsert> = { updatedAt: new Date() };
    if (dto.repairDate) updateData.repairDate = new Date(dto.repairDate);
    if (dto.repairDescription) updateData.repairDescription = dto.repairDescription;
    if (dto.repairResult !== undefined) updateData.repairResult = dto.repairResult || null;
    if (dto.notes !== undefined) updateData.notes = dto.notes || null;
    if (dto.attachmentPath !== undefined) updateData.attachmentPath = dto.attachmentPath || null;

    const [updatedRecord] = await this.db
      .update(repairHistory)
      .set(updateData)
      .where(eq(repairHistory.id, uuid))
      .returning();

    if (
      dto.repairResult === RepairResultEnum.COMPLETED &&
      previousResult !== RepairResultEnum.COMPLETED
    ) {
      const linkedNC = await this.nonConformancesService.findByRepairId(uuid);
      if (linkedNC && linkedNC.status !== NonConformanceStatus.CORRECTED) {
        await this.nonConformancesService.markCorrected(linkedNC.id, {
          correctionContent: `수리 완료: ${updatedRecord.repairDescription}`,
          correctionDate: updatedRecord.repairDate,
          correctedBy: updatedRecord.createdBy,
        });
      }
    }

    await this.cacheInvalidationHelper.invalidateAfterEquipmentUpdate(
      existing.equipmentId,
      false,
      false
    );

    return updatedRecord;
  }

  /**
   * 수리 이력 삭제 (소프트 삭제)
   */
  async remove(uuid: string, deletedBy: string): Promise<{ deleted: boolean; id: string }> {
    const existing = await this.findOne(uuid);

    const now = new Date();
    await this.db
      .update(repairHistory)
      .set({ isDeleted: true, deletedAt: now, deletedBy, updatedAt: now })
      .where(eq(repairHistory.id, uuid));

    await this.cacheInvalidationHelper.invalidateAfterEquipmentUpdate(
      existing.equipmentId,
      false,
      false
    );

    return { deleted: true, id: uuid };
  }

  /**
   * 장비별 수리 이력 요약 (건수)
   */
  async getSummary(equipmentUuid: string): Promise<{ count: number }> {
    const [result] = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(repairHistory)
      .where(and(eq(repairHistory.equipmentId, equipmentUuid), eq(repairHistory.isDeleted, false)));

    return { count: Number(result.count) };
  }

  /**
   * 최근 수리 이력 조회
   */
  async getRecentRepairs(equipmentUuid: string, limit: number = 5): Promise<RepairHistoryRecord[]> {
    return this.db
      .select()
      .from(repairHistory)
      .where(and(eq(repairHistory.equipmentId, equipmentUuid), eq(repairHistory.isDeleted, false)))
      .orderBy(desc(repairHistory.repairDate))
      .limit(limit);
  }
}

import {
  Inject,
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import type { AppDatabase } from '@equipment-management/db';
import { eq, desc } from 'drizzle-orm';
import {
  intermediateInspections,
  intermediateInspectionItems,
  intermediateInspectionEquipment,
  calibrations,
  type IntermediateInspection,
} from '@equipment-management/db/schema';
import { VersionedBaseService } from '../../common/base/versioned-base.service';
import { SimpleCacheService } from '../../common/cache/simple-cache.service';
import { CACHE_KEY_PREFIXES } from '../../common/cache/cache-key-prefixes';
import { CACHE_TTL } from '@equipment-management/shared-constants';
import type { CreateInspectionInput } from './dto/create-inspection.dto';
import type { UpdateInspectionInput } from './dto/update-inspection.dto';

@Injectable()
export class IntermediateInspectionsService extends VersionedBaseService {
  private readonly CACHE_PREFIX = CACHE_KEY_PREFIXES.CALIBRATION + 'inspections:';

  constructor(
    @Inject('DRIZZLE_INSTANCE')
    protected readonly db: AppDatabase,
    private readonly cacheService: SimpleCacheService
  ) {
    super();
  }

  private buildCacheKey(type: string, id: string): string {
    return `${this.CACHE_PREFIX}${type}:${id}`;
  }

  private invalidateCache(id?: string): void {
    if (id) {
      this.cacheService.delete(this.buildCacheKey('detail', id));
    }
    this.cacheService.deleteByPrefix(this.CACHE_PREFIX + 'list:');
    this.cacheService.deleteByPrefix(CACHE_KEY_PREFIXES.CALIBRATION);
  }

  /**
   * 중간점검 생성 (draft 상태) — 3테이블 트랜잭션 삽입
   */
  async create(
    dto: CreateInspectionInput,
    equipmentId: string,
    createdBy: string
  ): Promise<IntermediateInspection> {
    // calibrationId 존재 확인
    const [cal] = await this.db
      .select({ id: calibrations.id, equipmentId: calibrations.equipmentId })
      .from(calibrations)
      .where(eq(calibrations.id, dto.calibrationId))
      .limit(1);

    if (!cal) {
      throw new NotFoundException({
        code: 'CALIBRATION_NOT_FOUND',
        message: `Calibration with UUID ${dto.calibrationId} not found.`,
      });
    }

    const result = await this.db.transaction(async (tx) => {
      const [created] = await tx
        .insert(intermediateInspections)
        .values({
          calibrationId: dto.calibrationId,
          equipmentId,
          inspectionDate: new Date(dto.inspectionDate),
          inspectorId: createdBy,
          classification: dto.classification ?? null,
          inspectionCycle: dto.inspectionCycle ?? null,
          calibrationValidityPeriod: dto.calibrationValidityPeriod ?? null,
          overallResult: dto.overallResult ?? null,
          remarks: dto.remarks ?? null,
          approvalStatus: 'draft',
          createdBy,
        })
        .returning();

      // 점검 항목 삽입
      if (dto.items && dto.items.length > 0) {
        await tx.insert(intermediateInspectionItems).values(
          dto.items.map((item) => ({
            inspectionId: created.id,
            itemNumber: item.itemNumber,
            checkItem: item.checkItem,
            checkCriteria: item.checkCriteria,
            checkResult: item.checkResult ?? null,
            judgment: item.judgment ?? null,
          }))
        );
      }

      // 측정 장비 삽입
      if (dto.measurementEquipment && dto.measurementEquipment.length > 0) {
        await tx.insert(intermediateInspectionEquipment).values(
          dto.measurementEquipment.map((equip) => ({
            inspectionId: created.id,
            equipmentId: equip.equipmentId,
            calibrationDate: equip.calibrationDate ? new Date(equip.calibrationDate) : null,
          }))
        );
      }

      return created;
    });

    this.invalidateCache();

    return result;
  }

  /**
   * 특정 교정의 중간점검 목록 조회
   */
  async findByCalibration(calibrationId: string): Promise<IntermediateInspection[]> {
    const cacheKey = this.buildCacheKey('list', calibrationId);

    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        return this.db
          .select()
          .from(intermediateInspections)
          .where(eq(intermediateInspections.calibrationId, calibrationId))
          .orderBy(desc(intermediateInspections.createdAt));
      },
      CACHE_TTL.LONG
    );
  }

  /**
   * 중간점검 상세 조회 (항목 + 측정장비 포함)
   */
  async findOne(id: string): Promise<
    IntermediateInspection & {
      items: (typeof intermediateInspectionItems.$inferSelect)[];
      inspectionEquipment: (typeof intermediateInspectionEquipment.$inferSelect)[];
    }
  > {
    const cacheKey = this.buildCacheKey('detail', id);

    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        const [record] = await this.db
          .select()
          .from(intermediateInspections)
          .where(eq(intermediateInspections.id, id))
          .limit(1);

        if (!record) {
          throw new NotFoundException({
            code: 'INTERMEDIATE_INSPECTION_NOT_FOUND',
            message: `Intermediate inspection with UUID ${id} not found.`,
          });
        }

        const [items, inspectionEquipment] = await Promise.all([
          this.db
            .select()
            .from(intermediateInspectionItems)
            .where(eq(intermediateInspectionItems.inspectionId, id))
            .orderBy(intermediateInspectionItems.itemNumber),
          this.db
            .select()
            .from(intermediateInspectionEquipment)
            .where(eq(intermediateInspectionEquipment.inspectionId, id)),
        ]);

        return { ...record, items, inspectionEquipment };
      },
      CACHE_TTL.MEDIUM
    );
  }

  /**
   * 중간점검 수정 (draft 상태에서만 가능)
   */
  async update(id: string, dto: UpdateInspectionInput): Promise<IntermediateInspection> {
    const existing = await this.findOne(id);

    if (existing.approvalStatus !== 'draft') {
      throw new BadRequestException({
        code: 'INVALID_STATUS_TRANSITION',
        message: 'Only draft inspections can be updated.',
      });
    }

    const { version, items, measurementEquipment, ...updateFields } = dto;

    const updateData: Record<string, unknown> = {};
    if (updateFields.inspectionDate !== undefined)
      updateData.inspectionDate = updateFields.inspectionDate
        ? new Date(updateFields.inspectionDate)
        : null;
    if (updateFields.classification !== undefined)
      updateData.classification = updateFields.classification;
    if (updateFields.inspectionCycle !== undefined)
      updateData.inspectionCycle = updateFields.inspectionCycle;
    if (updateFields.calibrationValidityPeriod !== undefined)
      updateData.calibrationValidityPeriod = updateFields.calibrationValidityPeriod;
    if (updateFields.overallResult !== undefined)
      updateData.overallResult = updateFields.overallResult;
    if (updateFields.remarks !== undefined) updateData.remarks = updateFields.remarks;

    let updated: IntermediateInspection;
    try {
      // 트랜잭션으로 메인 테이블 + 하위 테이블 동시 수정
      updated = await this.db.transaction(async (tx) => {
        const result = await this.updateWithVersion<IntermediateInspection>(
          intermediateInspections,
          id,
          version,
          updateData,
          '중간점검',
          tx,
          'INTERMEDIATE_INSPECTION_NOT_FOUND'
        );

        // 항목 교체 (전체 삭제 후 재삽입)
        if (items !== undefined) {
          await tx
            .delete(intermediateInspectionItems)
            .where(eq(intermediateInspectionItems.inspectionId, id));

          if (items.length > 0) {
            await tx.insert(intermediateInspectionItems).values(
              items.map((item) => ({
                inspectionId: id,
                itemNumber: item.itemNumber,
                checkItem: item.checkItem,
                checkCriteria: item.checkCriteria,
                checkResult: item.checkResult ?? null,
                judgment: item.judgment ?? null,
              }))
            );
          }
        }

        // 측정 장비 교체
        if (measurementEquipment !== undefined) {
          await tx
            .delete(intermediateInspectionEquipment)
            .where(eq(intermediateInspectionEquipment.inspectionId, id));

          if (measurementEquipment.length > 0) {
            await tx.insert(intermediateInspectionEquipment).values(
              measurementEquipment.map((equip) => ({
                inspectionId: id,
                equipmentId: equip.equipmentId,
                calibrationDate: equip.calibrationDate ? new Date(equip.calibrationDate) : null,
              }))
            );
          }
        }

        return result;
      });
    } catch (error) {
      if (error instanceof ConflictException) {
        this.cacheService.delete(this.buildCacheKey('detail', id));
      }
      throw error;
    }

    this.invalidateCache(id);

    return updated;
  }

  /**
   * 중간점검 제출 (draft → submitted)
   */
  async submit(id: string, version: number, userId: string): Promise<IntermediateInspection> {
    const existing = await this.findOne(id);

    if (existing.approvalStatus !== 'draft') {
      throw new BadRequestException({
        code: 'INVALID_STATUS_TRANSITION',
        message: 'Only draft inspections can be submitted.',
      });
    }

    let updated: IntermediateInspection;
    try {
      updated = await this.updateWithVersion<IntermediateInspection>(
        intermediateInspections,
        id,
        version,
        {
          approvalStatus: 'submitted',
          submittedAt: new Date(),
          submittedBy: userId,
        },
        '중간점검',
        undefined,
        'INTERMEDIATE_INSPECTION_NOT_FOUND'
      );
    } catch (error) {
      if (error instanceof ConflictException) {
        this.cacheService.delete(this.buildCacheKey('detail', id));
      }
      throw error;
    }

    this.invalidateCache(id);

    return updated;
  }

  /**
   * 검토 (submitted → reviewed)
   */
  async review(id: string, version: number, userId: string): Promise<IntermediateInspection> {
    const existing = await this.findOne(id);

    if (existing.approvalStatus !== 'submitted') {
      throw new BadRequestException({
        code: 'INVALID_STATUS_TRANSITION',
        message: 'Only submitted inspections can be reviewed.',
      });
    }

    let updated: IntermediateInspection;
    try {
      updated = await this.updateWithVersion<IntermediateInspection>(
        intermediateInspections,
        id,
        version,
        {
          approvalStatus: 'reviewed',
          reviewedAt: new Date(),
          reviewedBy: userId,
        },
        '중간점검',
        undefined,
        'INTERMEDIATE_INSPECTION_NOT_FOUND'
      );
    } catch (error) {
      if (error instanceof ConflictException) {
        this.cacheService.delete(this.buildCacheKey('detail', id));
      }
      throw error;
    }

    this.invalidateCache(id);

    return updated;
  }

  /**
   * 승인 (reviewed → approved)
   */
  async approve(id: string, version: number, userId: string): Promise<IntermediateInspection> {
    const existing = await this.findOne(id);

    if (existing.approvalStatus !== 'reviewed') {
      throw new BadRequestException({
        code: 'INVALID_STATUS_TRANSITION',
        message: 'Only reviewed inspections can be approved.',
      });
    }

    let updated: IntermediateInspection;
    try {
      updated = await this.updateWithVersion<IntermediateInspection>(
        intermediateInspections,
        id,
        version,
        {
          approvalStatus: 'approved',
          approvedAt: new Date(),
          approvedBy: userId,
        },
        '중간점검',
        undefined,
        'INTERMEDIATE_INSPECTION_NOT_FOUND'
      );
    } catch (error) {
      if (error instanceof ConflictException) {
        this.cacheService.delete(this.buildCacheKey('detail', id));
      }
      throw error;
    }

    this.invalidateCache(id);

    return updated;
  }

  /**
   * 반려 (submitted/reviewed → rejected)
   */
  async reject(
    id: string,
    version: number,
    userId: string,
    reason: string
  ): Promise<IntermediateInspection> {
    const existing = await this.findOne(id);

    if (existing.approvalStatus !== 'submitted' && existing.approvalStatus !== 'reviewed') {
      throw new BadRequestException({
        code: 'INVALID_STATUS_TRANSITION',
        message: 'Only submitted or reviewed inspections can be rejected.',
      });
    }

    let updated: IntermediateInspection;
    try {
      updated = await this.updateWithVersion<IntermediateInspection>(
        intermediateInspections,
        id,
        version,
        {
          approvalStatus: 'rejected',
          rejectedAt: new Date(),
          rejectedBy: userId,
          rejectionReason: reason,
        },
        '중간점검',
        undefined,
        'INTERMEDIATE_INSPECTION_NOT_FOUND'
      );
    } catch (error) {
      if (error instanceof ConflictException) {
        this.cacheService.delete(this.buildCacheKey('detail', id));
      }
      throw error;
    }

    this.invalidateCache(id);

    return updated;
  }
}

import { Inject, Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import type { AppDatabase } from '@equipment-management/db';
import { eq, desc, and, inArray } from 'drizzle-orm';
import {
  intermediateInspections,
  intermediateInspectionItems,
  intermediateInspectionEquipment,
  inspectionResultSections,
  inspectionDocumentItems,
  calibrations,
  equipment,
  type IntermediateInspection,
  type DocumentRecord,
  type InspectionDocumentItem,
} from '@equipment-management/db/schema';
import type { DocumentService } from '../../common/file-upload/document.service';
import type { DocumentType } from '@equipment-management/schemas';
import type { MulterFile } from '../../types/common.types';
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

  private invalidateCache(id?: string, equipmentId?: string): void {
    if (id) {
      this.cacheService.delete(this.buildCacheKey('detail', id));
    }
    if (equipmentId) {
      this.cacheService.delete(this.buildCacheKey('list-equip', equipmentId));
    }
    this.cacheService.deleteByPrefix(this.CACHE_PREFIX + 'list:');
    this.cacheService.deleteByPrefix(CACHE_KEY_PREFIXES.CALIBRATION);
  }

  /**
   * VersionedBaseService 훅 override — 409 발생 시 detail 캐시 자동 무효화.
   * 5개 updateWithVersion 경로(update/finalize/approve/reject/remove) 단일 정책 공유.
   */
  protected async onVersionConflict(id: string): Promise<void> {
    await this.cacheService.delete(this.buildCacheKey('detail', id));
  }

  /**
   * 중간점검 생성 (draft 상태) — 3테이블 트랜잭션 삽입
   */
  async create(
    dto: CreateInspectionInput & { calibrationId: string },
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
            detailedResult: item.detailedResult ?? null,
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

      // 결과 섹션 삽입 (1-step 폼에서 함께 전송된 경우)
      if (dto.resultSections && dto.resultSections.length > 0) {
        await tx.insert(inspectionResultSections).values(
          dto.resultSections.map((section) => ({
            inspectionId: created.id,
            inspectionType: 'intermediate' as const,
            sortOrder: section.sortOrder,
            sectionType: section.sectionType,
            title: section.title,
            content: section.content,
            tableData: section.tableData,
            richTableData: section.richTableData,
            documentId: section.documentId,
            imageWidthCm: section.imageWidthCm?.toString(),
            imageHeightCm: section.imageHeightCm?.toString(),
            createdBy,
          }))
        );
      }

      return created;
    });

    this.invalidateCache(undefined, equipmentId);

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
   * 특정 장비의 중간점검 목록 조회
   */
  async findByEquipment(equipmentId: string): Promise<IntermediateInspection[]> {
    const cacheKey = this.buildCacheKey('list-equip', equipmentId);

    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        return this.db
          .select()
          .from(intermediateInspections)
          .where(eq(intermediateInspections.equipmentId, equipmentId))
          .orderBy(desc(intermediateInspections.createdAt));
      },
      CACHE_TTL.LONG
    );
  }

  /**
   * 장비 기반 중간점검 생성 — 최신 승인된 교정을 자동 조회
   *
   * 승인된 교정 우선, 없으면 가장 최근 교정을 사용.
   * 교정 기록이 전혀 없으면 NO_ACTIVE_CALIBRATION 에러.
   */
  async createByEquipment(
    equipmentId: string,
    dto: Omit<CreateInspectionInput, 'calibrationId'>,
    createdBy: string
  ): Promise<IntermediateInspection> {
    // 승인된 교정 우선 조회
    let [calibration] = await this.db
      .select({ id: calibrations.id })
      .from(calibrations)
      .where(
        and(eq(calibrations.equipmentId, equipmentId), eq(calibrations.approvalStatus, 'approved'))
      )
      .orderBy(desc(calibrations.createdAt))
      .limit(1);

    // 승인된 교정이 없으면 최신 교정 fallback
    if (!calibration) {
      [calibration] = await this.db
        .select({ id: calibrations.id })
        .from(calibrations)
        .where(eq(calibrations.equipmentId, equipmentId))
        .orderBy(desc(calibrations.createdAt))
        .limit(1);
    }

    if (!calibration) {
      throw new NotFoundException({
        code: 'NO_ACTIVE_CALIBRATION',
        message: `Equipment ${equipmentId} has no calibration records. Cannot create intermediate inspection.`,
      });
    }

    return this.create({ ...dto, calibrationId: calibration.id }, equipmentId, createdBy);
  }

  /**
   * 교정 기반 중간점검 생성 — calibrationId에서 equipmentId를 조회
   */
  async createByCalibration(
    calibrationId: string,
    dto: Omit<CreateInspectionInput, 'calibrationId'>,
    createdBy: string
  ): Promise<IntermediateInspection> {
    const [cal] = await this.db
      .select({ equipmentId: calibrations.equipmentId })
      .from(calibrations)
      .where(eq(calibrations.id, calibrationId))
      .limit(1);

    if (!cal) {
      throw new NotFoundException({
        code: 'CALIBRATION_NOT_FOUND',
        message: `Calibration with UUID ${calibrationId} not found.`,
      });
    }

    return this.create({ ...dto, calibrationId }, cal.equipmentId, createdBy);
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

    // 트랜잭션으로 메인 테이블 + 하위 테이블 동시 수정.
    // 409 시 detail 캐시 무효화는 onVersionConflict() 훅이 처리.
    const updated = await this.db.transaction(async (tx) => {
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
              detailedResult: item.detailedResult ?? null,
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

    this.invalidateCache(id, existing.equipmentId);

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

    const updated = await this.updateWithVersion<IntermediateInspection>(
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

    this.invalidateCache(id, existing.equipmentId);

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

    const updated = await this.updateWithVersion<IntermediateInspection>(
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

    this.invalidateCache(id, existing.equipmentId);

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

    const updated = await this.updateWithVersion<IntermediateInspection>(
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

    this.invalidateCache(id, existing.equipmentId);

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

    const updated = await this.updateWithVersion<IntermediateInspection>(
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

    this.invalidateCache(id, existing.equipmentId);

    return updated;
  }

  /**
   * 제출 취소 (submitted → draft)
   */
  async withdraw(id: string, version: number, userId: string): Promise<IntermediateInspection> {
    const existing = await this.findOne(id);

    if (existing.approvalStatus !== 'submitted') {
      throw new BadRequestException({
        code: 'INVALID_STATUS_TRANSITION',
        message: 'Only submitted inspections can be withdrawn.',
      });
    }

    if (existing.submittedBy !== userId) {
      throw new BadRequestException({
        code: 'NOT_SUBMITTER',
        message: 'Only the submitter can withdraw a submitted inspection.',
      });
    }

    const updated = await this.updateWithVersion<IntermediateInspection>(
      intermediateInspections,
      id,
      version,
      {
        approvalStatus: 'draft',
        submittedAt: null,
        submittedBy: null,
      },
      '중간점검',
      undefined,
      'INTERMEDIATE_INSPECTION_NOT_FOUND'
    );

    this.invalidateCache(id, existing.equipmentId);

    return updated;
  }

  /**
   * 재제출 (rejected → draft)
   */
  async resubmit(id: string, version: number, userId: string): Promise<IntermediateInspection> {
    const existing = await this.findOne(id);

    if (existing.approvalStatus !== 'rejected') {
      throw new BadRequestException({
        code: 'INVALID_STATUS_TRANSITION',
        message: 'Only rejected inspections can be resubmitted.',
      });
    }

    const updated = await this.updateWithVersion<IntermediateInspection>(
      intermediateInspections,
      id,
      version,
      {
        approvalStatus: 'draft',
        rejectedAt: null,
        rejectedBy: null,
        rejectionReason: null,
      },
      '중간점검',
      undefined,
      'INTERMEDIATE_INSPECTION_NOT_FOUND'
    );

    this.invalidateCache(id, existing.equipmentId);

    return updated;
  }

  /**
   * 중간점검 삭제 (hard-delete, 하위 테이블 cascade)
   *
   * 시험실무자: draft/submitted/rejected 상태에서만 삭제 가능
   * 기술책임자: 모든 상태에서 삭제 가능 (approved 포함)
   * 삭제 가능 여부 판단은 컨트롤러에서 수행 (역할 기반)
   */
  async remove(id: string, allowApproved: boolean): Promise<{ success: boolean }> {
    const existing = await this.findOne(id);

    if (
      !allowApproved &&
      existing.approvalStatus !== 'draft' &&
      existing.approvalStatus !== 'submitted' &&
      existing.approvalStatus !== 'rejected'
    ) {
      throw new BadRequestException({
        code: 'CANNOT_DELETE_APPROVED',
        message: 'Cannot delete approved or reviewed inspections.',
      });
    }

    await this.db.transaction(async (tx) => {
      // inspectionDocumentItems 삭제 (polymorphic FK — cascade 없음)
      const itemIds = await tx
        .select({ id: intermediateInspectionItems.id })
        .from(intermediateInspectionItems)
        .where(eq(intermediateInspectionItems.inspectionId, id));
      if (itemIds.length > 0) {
        await tx.delete(inspectionDocumentItems).where(
          and(
            inArray(
              inspectionDocumentItems.inspectionItemId,
              itemIds.map((i) => i.id)
            ),
            eq(inspectionDocumentItems.inspectionItemType, 'intermediate')
          )
        );
      }
      // 하위 테이블 삭제
      await tx
        .delete(inspectionResultSections)
        .where(
          and(
            eq(inspectionResultSections.inspectionId, id),
            eq(inspectionResultSections.inspectionType, 'intermediate')
          )
        );
      await tx
        .delete(intermediateInspectionItems)
        .where(eq(intermediateInspectionItems.inspectionId, id));
      await tx
        .delete(intermediateInspectionEquipment)
        .where(eq(intermediateInspectionEquipment.inspectionId, id));
      await tx.delete(intermediateInspections).where(eq(intermediateInspections.id, id));
    });

    this.invalidateCache(id, existing.equipmentId);

    return { success: true };
  }

  /**
   * 장비 UUID로 사이트 정보 조회 (enforceSiteAccess용)
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
   * 중간점검 ID로 장비 사이트 정보 역추적 (enforceSiteAccess용)
   */
  async getEquipmentSiteInfoByInspectionId(
    inspectionId: string
  ): Promise<{ site: string; teamId: string | null }> {
    const [result] = await this.db
      .select({ site: equipment.site, teamId: equipment.teamId })
      .from(intermediateInspections)
      .innerJoin(equipment, eq(intermediateInspections.equipmentId, equipment.id))
      .where(eq(intermediateInspections.id, inspectionId))
      .limit(1);
    if (!result) {
      throw new NotFoundException({
        code: 'INTERMEDIATE_INSPECTION_NOT_FOUND',
        message: `Intermediate inspection ${inspectionId} not found.`,
      });
    }
    return result;
  }

  /**
   * 교정 ID로 장비 사이트 정보 역추적 (enforceSiteAccess용)
   */
  async getEquipmentSiteInfoByCalibrationId(
    calibrationId: string
  ): Promise<{ site: string; teamId: string | null }> {
    const [result] = await this.db
      .select({ site: equipment.site, teamId: equipment.teamId })
      .from(calibrations)
      .innerJoin(equipment, eq(calibrations.equipmentId, equipment.id))
      .where(eq(calibrations.id, calibrationId))
      .limit(1);
    if (!result) {
      throw new NotFoundException({
        code: 'CALIBRATION_NOT_FOUND',
        message: `Calibration ${calibrationId} not found.`,
      });
    }
    return result;
  }

  // ============================================================================
  // 항목별 사진 업로드
  // ============================================================================

  async uploadItemPhoto(
    inspectionId: string,
    itemId: string,
    file: MulterFile,
    userId: string,
    documentService: DocumentService,
    opts: { documentType: DocumentType; sortOrder: number; description?: string }
  ): Promise<{ document: DocumentRecord; link: InspectionDocumentItem }> {
    // 항목이 해당 점검에 속하는지 검증
    const [item] = await this.db
      .select({ id: intermediateInspectionItems.id })
      .from(intermediateInspectionItems)
      .where(
        and(
          eq(intermediateInspectionItems.id, itemId),
          eq(intermediateInspectionItems.inspectionId, inspectionId)
        )
      )
      .limit(1);

    if (!item) {
      throw new NotFoundException({
        code: 'INSPECTION_ITEM_NOT_FOUND',
        message: `Item ${itemId} not found in inspection ${inspectionId}.`,
      });
    }

    // documents에 저장
    const document = await documentService.createDocument(file, {
      intermediateInspectionId: inspectionId,
      documentType: opts.documentType,
      description: opts.description,
      uploadedBy: userId,
      subdirectory: 'inspection-photos',
    });

    // 연결 테이블에 매핑
    const [link] = await this.db
      .insert(inspectionDocumentItems)
      .values({
        documentId: document.id,
        inspectionItemId: itemId,
        inspectionItemType: 'intermediate',
        sortOrder: opts.sortOrder,
      })
      .returning();

    return { document, link };
  }
}

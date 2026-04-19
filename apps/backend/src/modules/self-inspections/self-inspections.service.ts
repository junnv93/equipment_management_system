import {
  Inject,
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import type { AppDatabase } from '@equipment-management/db';
import { eq, and, desc, sql, inArray } from 'drizzle-orm';
import {
  equipmentSelfInspections,
  selfInspectionItems,
  inspectionDocumentItems,
  inspectionResultSections,
  equipment,
  type EquipmentSelfInspection,
  type NewEquipmentSelfInspection,
  type SelfInspectionItem,
  type DocumentRecord,
  type InspectionDocumentItem,
} from '@equipment-management/db/schema';
import type { DocumentService } from '../../common/file-upload/document.service';
import type { DocumentType } from '@equipment-management/schemas';
import type { MulterFile } from '../../types/common.types';
import {
  SELF_INSPECTION_LEGACY_COLUMN_MAP,
  type SelfInspectionItemJudgment,
} from '@equipment-management/schemas';
import { VersionedBaseService } from '../../common/base/versioned-base.service';
import { SimpleCacheService } from '../../common/cache/simple-cache.service';
import { CACHE_KEY_PREFIXES } from '../../common/cache/cache-key-prefixes';
import { CACHE_TTL } from '@equipment-management/shared-constants';
import { assertIndependentApprover } from '../../common/guards/assert-independent-approver';
import type { CreateSelfInspectionInput } from './dto/create-self-inspection.dto';
import type { UpdateSelfInspectionInput } from './dto/update-self-inspection.dto';

export interface SelfInspectionWithItems extends EquipmentSelfInspection {
  items: SelfInspectionItem[];
}

@Injectable()
export class SelfInspectionsService extends VersionedBaseService {
  private readonly CACHE_PREFIX = CACHE_KEY_PREFIXES.SELF_INSPECTIONS;

  constructor(
    @Inject('DRIZZLE_INSTANCE')
    protected readonly db: AppDatabase,
    private readonly cacheService: SimpleCacheService
  ) {
    super();
  }

  // ============================================================================
  // 캐시 헬퍼
  // ============================================================================

  private buildCacheKey(type: string, id: string): string {
    return `${this.CACHE_PREFIX}${type}:${id}`;
  }

  private invalidateCache(id?: string, equipmentId?: string): void {
    if (id) {
      this.cacheService.delete(this.buildCacheKey('detail', id));
    }
    if (equipmentId) {
      this.cacheService.deleteByPrefix(this.buildCacheKey('list-equip', equipmentId));
    }
  }

  protected async onVersionConflict(id: string): Promise<void> {
    await this.cacheService.delete(this.buildCacheKey('detail', id));
  }

  // ============================================================================
  // CRUD
  // ============================================================================

  async create(
    equipmentId: string,
    dto: CreateSelfInspectionInput,
    inspectorId: string
  ): Promise<SelfInspectionWithItems> {
    // 장비 존재 확인 + snapshot 소스 값 조회
    // calibrationRequired는 UL-QP-18-05 양식 헤더 "분류" snapshot 기본값 derivation에 필요.
    const [eqRow] = await this.db
      .select({ id: equipment.id, calibrationRequired: equipment.calibrationRequired })
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

    // items에서 기존 고정 컬럼 값 추출 (하위 호환)
    const legacyValues = this.extractLegacyValues(dto);

    // UL-QP-18-05 양식 헤더 snapshot — 장비 마스터 drift 방지.
    // DTO 명시값 > 장비 마스터 derivation 순 fallback.
    const classificationSnapshot =
      dto.classification ??
      (eqRow.calibrationRequired === 'required' ? 'calibrated' : 'non_calibrated');
    const validityPeriodSnapshot = dto.calibrationValidityPeriod ?? null;

    return await this.db.transaction(async (tx) => {
      const [created] = await tx
        .insert(equipmentSelfInspections)
        .values({
          equipmentId,
          inspectionDate,
          inspectorId,
          appearance: legacyValues.appearance,
          functionality: legacyValues.functionality,
          safety: legacyValues.safety,
          calibrationStatus: legacyValues.calibrationStatus,
          overallResult: dto.overallResult,
          remarks: dto.remarks ?? null,
          specialNotes: dto.specialNotes ?? null,
          inspectionCycle: cycle,
          nextInspectionDate,
          classification: classificationSnapshot,
          calibrationValidityPeriod: validityPeriodSnapshot,
          approvalStatus: 'draft',
          createdBy: inspectorId,
        })
        .returning();

      // 점검 항목 삽입
      const insertedItems = await tx
        .insert(selfInspectionItems)
        .values(
          dto.items.map((item) => ({
            inspectionId: created.id,
            itemNumber: item.itemNumber,
            checkItem: item.checkItem,
            checkResult: item.checkResult,
            detailedResult: item.detailedResult ?? null,
          }))
        )
        .returning();

      this.invalidateCache(undefined, equipmentId);
      return { ...created, items: insertedItems };
    });
  }

  async findByEquipment(
    equipmentId: string,
    page = 1,
    pageSize = 20
  ): Promise<{ data: SelfInspectionWithItems[]; total: number }> {
    const cacheKey = this.buildCacheKey('list-equip', `${equipmentId}:${page}:${pageSize}`);
    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        const offset = (page - 1) * pageSize;

        const rows = await this.db
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

        // batch IN 쿼리로 모든 items를 한 번에 로드 (N+1 방지)
        const inspectionIds = rows.map((r) => r.id);
        const allItems =
          inspectionIds.length > 0
            ? await this.db
                .select()
                .from(selfInspectionItems)
                .where(inArray(selfInspectionItems.inspectionId, inspectionIds))
                .orderBy(selfInspectionItems.itemNumber)
            : [];

        // inspectionId별로 그룹핑
        const itemsByInspection = new Map<string, SelfInspectionItem[]>();
        for (const item of allItems) {
          const list = itemsByInspection.get(item.inspectionId) ?? [];
          list.push(item);
          itemsByInspection.set(item.inspectionId, list);
        }

        const data = rows.map((row) => ({
          ...row,
          items: itemsByInspection.get(row.id) ?? [],
        }));

        return { data, total: Number(count) };
      },
      CACHE_TTL.LONG
    );
  }

  async findById(id: string): Promise<SelfInspectionWithItems> {
    return this.cacheService.getOrSet(
      this.buildCacheKey('detail', id),
      async () => {
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

        const items = await this.db
          .select()
          .from(selfInspectionItems)
          .where(eq(selfInspectionItems.inspectionId, id))
          .orderBy(selfInspectionItems.itemNumber);

        return { ...row, items };
      },
      CACHE_TTL.MEDIUM
    );
  }

  async update(
    id: string,
    dto: UpdateSelfInspectionInput,
    _userId: string
  ): Promise<SelfInspectionWithItems> {
    const existing = await this.findById(id);

    if (existing.approvalStatus !== 'draft') {
      throw new BadRequestException({
        code: 'INVALID_STATUS_TRANSITION',
        message: 'Only draft inspections can be modified.',
      });
    }

    return await this.db.transaction(async (tx) => {
      const updateData: Partial<NewEquipmentSelfInspection> = {};

      if (dto.inspectionDate) updateData.inspectionDate = new Date(dto.inspectionDate);
      if (dto.overallResult) updateData.overallResult = dto.overallResult;
      if (dto.remarks !== undefined) updateData.remarks = dto.remarks;
      if (dto.specialNotes !== undefined) updateData.specialNotes = dto.specialNotes;
      if (dto.inspectionCycle) {
        updateData.inspectionCycle = dto.inspectionCycle;
        const baseDate = dto.inspectionDate
          ? new Date(dto.inspectionDate)
          : existing.inspectionDate;
        const nextDate = new Date(baseDate);
        nextDate.setMonth(nextDate.getMonth() + dto.inspectionCycle);
        updateData.nextInspectionDate = nextDate.toISOString().split('T')[0];
      }

      // items가 있으면 기존 고정 컬럼도 동기화
      if (dto.items) {
        const legacyValues = this.extractLegacyValues(dto);
        updateData.appearance = legacyValues.appearance;
        updateData.functionality = legacyValues.functionality;
        updateData.safety = legacyValues.safety;
        updateData.calibrationStatus = legacyValues.calibrationStatus;
      } else {
        // 개별 고정 컬럼 업데이트 (하위 호환)
        if (dto.appearance) updateData.appearance = dto.appearance;
        if (dto.functionality) updateData.functionality = dto.functionality;
        if (dto.safety) updateData.safety = dto.safety;
        if (dto.calibrationStatus) updateData.calibrationStatus = dto.calibrationStatus;
      }

      const updated = await this.updateWithVersion<EquipmentSelfInspection>(
        equipmentSelfInspections,
        id,
        dto.version,
        updateData,
        'Self-inspection',
        tx,
        'SELF_INSPECTION_NOT_FOUND'
      );

      // items가 있으면 전체 교체 (cascade delete 후 재삽입)
      let updatedItems: SelfInspectionItem[];
      if (dto.items) {
        await tx.delete(selfInspectionItems).where(eq(selfInspectionItems.inspectionId, id));
        updatedItems = await tx
          .insert(selfInspectionItems)
          .values(
            dto.items.map((item) => ({
              inspectionId: id,
              itemNumber: item.itemNumber,
              checkItem: item.checkItem,
              checkResult: item.checkResult,
              detailedResult: item.detailedResult ?? null,
            }))
          )
          .returning();
      } else {
        updatedItems = await tx
          .select()
          .from(selfInspectionItems)
          .where(eq(selfInspectionItems.inspectionId, id))
          .orderBy(selfInspectionItems.itemNumber);
      }

      this.invalidateCache(id, existing.equipmentId);
      return { ...updated, items: updatedItems };
    });
  }

  // ============================================================================
  // 결재 워크플로우
  // ============================================================================

  /**
   * 제출 (draft → submitted)
   * 담당+검토 = 시험실무자 동일인 (QP-18-05 양식 구조)
   */
  async submit(id: string, version: number, userId: string): Promise<SelfInspectionWithItems> {
    const existing = await this.findById(id);

    if (existing.approvalStatus !== 'draft') {
      throw new BadRequestException({
        code: 'INVALID_STATUS_TRANSITION',
        message: 'Only draft inspections can be submitted.',
      });
    }

    const updated = await this.updateWithVersion<EquipmentSelfInspection>(
      equipmentSelfInspections,
      id,
      version,
      {
        approvalStatus: 'submitted',
        submittedAt: new Date(),
        submittedBy: userId,
      },
      'Self-inspection',
      undefined,
      'SELF_INSPECTION_NOT_FOUND'
    );

    this.invalidateCache(id, existing.equipmentId);
    const items = await this.db
      .select()
      .from(selfInspectionItems)
      .where(eq(selfInspectionItems.inspectionId, id))
      .orderBy(selfInspectionItems.itemNumber);
    return { ...updated, items };
  }

  /**
   * 제출 취소 (submitted → draft, 제출자 본인만 가능)
   */
  async withdraw(id: string, version: number, userId: string): Promise<SelfInspectionWithItems> {
    const existing = await this.findById(id);

    if (existing.approvalStatus !== 'submitted') {
      throw new BadRequestException({
        code: 'INVALID_STATUS_TRANSITION',
        message: 'Only submitted inspections can be withdrawn.',
      });
    }

    if (existing.submittedBy !== userId) {
      throw new ForbiddenException({
        code: 'NOT_SUBMITTER',
        message: 'Only the submitter can withdraw a submitted inspection.',
      });
    }

    const updated = await this.updateWithVersion<EquipmentSelfInspection>(
      equipmentSelfInspections,
      id,
      version,
      {
        approvalStatus: 'draft',
        submittedAt: null,
        submittedBy: null,
      },
      'Self-inspection',
      undefined,
      'SELF_INSPECTION_NOT_FOUND'
    );

    this.invalidateCache(id, existing.equipmentId);
    const items = await this.db
      .select()
      .from(selfInspectionItems)
      .where(eq(selfInspectionItems.inspectionId, id))
      .orderBy(selfInspectionItems.itemNumber);
    return { ...updated, items };
  }

  /**
   * 승인 (submitted → approved)
   * 기술책임자만 가능
   */
  async approve(id: string, version: number, userId: string): Promise<SelfInspectionWithItems> {
    const existing = await this.findById(id);

    if (existing.approvalStatus !== 'submitted') {
      throw new BadRequestException({
        code: 'INVALID_STATUS_TRANSITION',
        message: 'Only submitted inspections can be approved.',
      });
    }

    assertIndependentApprover(existing.submittedBy, userId);

    const updated = await this.updateWithVersion<EquipmentSelfInspection>(
      equipmentSelfInspections,
      id,
      version,
      {
        approvalStatus: 'approved',
        approvedAt: new Date(),
        approvedBy: userId,
      },
      'Self-inspection',
      undefined,
      'SELF_INSPECTION_NOT_FOUND'
    );

    this.invalidateCache(id, existing.equipmentId);
    const items = await this.db
      .select()
      .from(selfInspectionItems)
      .where(eq(selfInspectionItems.inspectionId, id))
      .orderBy(selfInspectionItems.itemNumber);
    return { ...updated, items };
  }

  /**
   * 반려 (submitted → rejected)
   * 기술책임자만 가능
   */
  async reject(
    id: string,
    version: number,
    userId: string,
    reason: string
  ): Promise<SelfInspectionWithItems> {
    const existing = await this.findById(id);

    if (existing.approvalStatus !== 'submitted') {
      throw new BadRequestException({
        code: 'INVALID_STATUS_TRANSITION',
        message: 'Only submitted inspections can be rejected.',
      });
    }

    const updated = await this.updateWithVersion<EquipmentSelfInspection>(
      equipmentSelfInspections,
      id,
      version,
      {
        approvalStatus: 'rejected',
        rejectedAt: new Date(),
        rejectedBy: userId,
        rejectionReason: reason,
      },
      'Self-inspection',
      undefined,
      'SELF_INSPECTION_NOT_FOUND'
    );

    this.invalidateCache(id, existing.equipmentId);
    const items = await this.db
      .select()
      .from(selfInspectionItems)
      .where(eq(selfInspectionItems.inspectionId, id))
      .orderBy(selfInspectionItems.itemNumber);
    return { ...updated, items };
  }

  /**
   * 재제출 (rejected → draft)
   * 반려 사유 초기화
   */
  async resubmit(id: string, version: number, _userId: string): Promise<SelfInspectionWithItems> {
    const existing = await this.findById(id);

    if (existing.approvalStatus !== 'rejected') {
      throw new BadRequestException({
        code: 'INVALID_STATUS_TRANSITION',
        message: 'Only rejected inspections can be resubmitted.',
      });
    }

    const updated = await this.updateWithVersion<EquipmentSelfInspection>(
      equipmentSelfInspections,
      id,
      version,
      {
        approvalStatus: 'draft',
        rejectedAt: null,
        rejectedBy: null,
        rejectionReason: null,
      },
      'Self-inspection',
      undefined,
      'SELF_INSPECTION_NOT_FOUND'
    );

    this.invalidateCache(id, existing.equipmentId);
    const items = await this.db
      .select()
      .from(selfInspectionItems)
      .where(eq(selfInspectionItems.inspectionId, id))
      .orderBy(selfInspectionItems.itemNumber);
    return { ...updated, items };
  }

  // ============================================================================
  // 삭제 (CRITICAL FIX: 트랜잭션 + 고아 레코드 정리)
  // ============================================================================

  /**
   * 삭제: 시험실무자는 draft/submitted/rejected 만, 기술책임자는 모든 상태 삭제 가능
   */
  async delete(id: string, allowApproved: boolean): Promise<void> {
    const existing = await this.findById(id);

    if (
      !allowApproved &&
      existing.approvalStatus !== 'draft' &&
      existing.approvalStatus !== 'submitted' &&
      existing.approvalStatus !== 'rejected'
    ) {
      throw new BadRequestException({
        code: 'CANNOT_DELETE_APPROVED',
        message: 'Cannot delete an approved inspection.',
      });
    }

    await this.db.transaction(async (tx) => {
      // inspectionDocumentItems 삭제 (polymorphic FK — cascade 없음)
      const itemIds = await tx
        .select({ id: selfInspectionItems.id })
        .from(selfInspectionItems)
        .where(eq(selfInspectionItems.inspectionId, id));

      if (itemIds.length > 0) {
        await tx.delete(inspectionDocumentItems).where(
          and(
            inArray(
              inspectionDocumentItems.inspectionItemId,
              itemIds.map((i) => i.id)
            ),
            eq(inspectionDocumentItems.inspectionItemType, 'self')
          )
        );
      }

      // 결과 섹션 삭제
      await tx
        .delete(inspectionResultSections)
        .where(
          and(
            eq(inspectionResultSections.inspectionId, id),
            eq(inspectionResultSections.inspectionType, 'self')
          )
        );

      // 항목 삭제 (cascade로도 가능하나 명시적 삭제)
      await tx.delete(selfInspectionItems).where(eq(selfInspectionItems.inspectionId, id));

      // 본체 삭제
      await tx.delete(equipmentSelfInspections).where(eq(equipmentSelfInspections.id, id));
    });

    this.invalidateCache(id, existing.equipmentId);
  }

  // ============================================================================
  // 사이트 접근 제어
  // ============================================================================

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
    const [item] = await this.db
      .select({ id: selfInspectionItems.id })
      .from(selfInspectionItems)
      .where(
        and(eq(selfInspectionItems.id, itemId), eq(selfInspectionItems.inspectionId, inspectionId))
      )
      .limit(1);

    if (!item) {
      throw new NotFoundException({
        code: 'INSPECTION_ITEM_NOT_FOUND',
        message: `Item ${itemId} not found in self-inspection ${inspectionId}.`,
      });
    }

    const document = await documentService.createDocument(file, {
      selfInspectionId: inspectionId,
      documentType: opts.documentType,
      description: opts.description,
      uploadedBy: userId,
      subdirectory: 'inspection-photos',
    });

    const [link] = await this.db
      .insert(inspectionDocumentItems)
      .values({
        documentId: document.id,
        inspectionItemId: itemId,
        inspectionItemType: 'self',
        sortOrder: opts.sortOrder,
      })
      .returning();

    return { document, link };
  }

  // ============================================================================
  // Private 헬퍼
  // ============================================================================

  /**
   * items 배열에서 기존 고정 컬럼 값 추출 (하위 호환)
   */
  private extractLegacyValues(dto: {
    items?: { checkItem: string; checkResult: string }[];
    appearance?: SelfInspectionItemJudgment;
    functionality?: SelfInspectionItemJudgment;
    safety?: SelfInspectionItemJudgment;
    calibrationStatus?: SelfInspectionItemJudgment;
  }): {
    appearance: SelfInspectionItemJudgment;
    functionality: SelfInspectionItemJudgment;
    safety: SelfInspectionItemJudgment;
    calibrationStatus: SelfInspectionItemJudgment;
  } {
    if (dto.appearance && dto.functionality && dto.safety && dto.calibrationStatus) {
      return {
        appearance: dto.appearance,
        functionality: dto.functionality,
        safety: dto.safety,
        calibrationStatus: dto.calibrationStatus,
      };
    }

    const itemMap = new Map<string, SelfInspectionItemJudgment>();
    for (const item of dto.items ?? []) {
      const legacyKey = SELF_INSPECTION_LEGACY_COLUMN_MAP[item.checkItem];
      if (legacyKey) {
        itemMap.set(legacyKey, item.checkResult as SelfInspectionItemJudgment);
      }
    }

    return {
      appearance: itemMap.get('appearance') ?? 'na',
      functionality: itemMap.get('functionality') ?? 'na',
      safety: itemMap.get('safety') ?? 'na',
      calibrationStatus: itemMap.get('calibrationStatus') ?? 'na',
    };
  }
}

const countFn = (): ReturnType<typeof sql<number>> => sql<number>`count(*)`;

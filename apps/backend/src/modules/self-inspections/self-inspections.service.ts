import { Inject, Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import type { AppDatabase } from '@equipment-management/db';
import { eq, and, desc, sql, inArray } from 'drizzle-orm';
import {
  equipmentSelfInspections,
  selfInspectionItems,
  inspectionDocumentItems,
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
import type { CreateSelfInspectionInput } from './dto/create-self-inspection.dto';
import type { UpdateSelfInspectionInput } from './dto/update-self-inspection.dto';

export interface SelfInspectionWithItems extends EquipmentSelfInspection {
  items: SelfInspectionItem[];
}

@Injectable()
export class SelfInspectionsService extends VersionedBaseService {
  constructor(
    @Inject('DRIZZLE_INSTANCE')
    protected readonly db: AppDatabase
  ) {
    super();
  }

  async create(
    equipmentId: string,
    dto: CreateSelfInspectionInput,
    inspectorId: string
  ): Promise<SelfInspectionWithItems> {
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

    // items에서 기존 고정 컬럼 값 추출 (하위 호환)
    const legacyValues = this.extractLegacyValues(dto);

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
          status: 'completed',
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

      return { ...created, items: insertedItems };
    });
  }

  async findByEquipment(
    equipmentId: string,
    page = 1,
    pageSize = 20
  ): Promise<{ data: SelfInspectionWithItems[]; total: number }> {
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
  }

  async findById(id: string): Promise<SelfInspectionWithItems> {
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
  }

  async update(
    id: string,
    dto: UpdateSelfInspectionInput,
    _userId: string
  ): Promise<SelfInspectionWithItems> {
    const existing = await this.findById(id);

    if (existing.status === 'confirmed') {
      throw new BadRequestException({
        code: 'ALREADY_CONFIRMED',
        message: 'Confirmed inspections cannot be modified.',
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

      return { ...updated, items: updatedItems };
    });
  }

  async confirm(
    id: string,
    confirmedBy: string,
    version: number
  ): Promise<SelfInspectionWithItems> {
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

    return await this.db.transaction(async (tx) => {
      const updated = await this.updateWithVersion<EquipmentSelfInspection>(
        equipmentSelfInspections,
        id,
        version,
        {
          status: 'confirmed',
          confirmedBy,
          confirmedAt: new Date(),
        },
        'Self-inspection',
        tx,
        'SELF_INSPECTION_NOT_FOUND'
      );

      const items = await tx
        .select()
        .from(selfInspectionItems)
        .where(eq(selfInspectionItems.inspectionId, id))
        .orderBy(selfInspectionItems.itemNumber);

      return { ...updated, items };
    });
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

  /**
   * items 배열에서 기존 고정 컬럼 값 추출 (하위 호환)
   * 외관검사 → appearance, 기능 점검 → functionality, 안전 점검 → safety, 교정 상태 점검 → calibrationStatus
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
    // DTO에 직접 고정 컬럼이 있으면 우선 사용
    if (dto.appearance && dto.functionality && dto.safety && dto.calibrationStatus) {
      return {
        appearance: dto.appearance,
        functionality: dto.functionality,
        safety: dto.safety,
        calibrationStatus: dto.calibrationStatus,
      };
    }

    // items에서 매핑 (SSOT: @equipment-management/schemas)
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
}

const countFn = (): ReturnType<typeof sql<number>> => sql<number>`count(*)`;

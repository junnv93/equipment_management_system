import { Inject, Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import type { AppDatabase } from '@equipment-management/db';
import { eq, and, asc, inArray } from 'drizzle-orm';
import {
  inspectionResultSections,
  type InspectionResultSection,
  type NewInspectionResultSection,
} from '@equipment-management/db/schema';
import type { InspectionType } from '@equipment-management/schemas';
import { SimpleCacheService } from '../../common/cache/simple-cache.service';
import { CACHE_KEY_PREFIXES } from '../../common/cache/cache-key-prefixes';
import type {
  CreateResultSectionInput,
  UpdateResultSectionInput,
  ReorderResultSectionsInput,
} from './dto/result-section.dto';

@Injectable()
export class ResultSectionsService {
  /**
   * IntermediateInspectionsService 와 동일한 prefix 를 공유해 부모 inspection 의
   * detail / list 캐시를 원자적으로 무효화할 수 있게 한다.
   * (self-inspections 는 현재 cache 인프라 미사용 — 별도 처리 불필요)
   */
  private readonly INTERMEDIATE_CACHE_PREFIX = CACHE_KEY_PREFIXES.CALIBRATION + 'inspections:';

  constructor(
    @Inject('DRIZZLE_INSTANCE')
    private readonly db: AppDatabase,
    private readonly cacheService: SimpleCacheService
  ) {}

  /**
   * 섹션 CRUD 후 부모 inspection 캐시 무효화.
   * - intermediate: detail(:id), list-equip(:equipmentId — 알 수 없음 → prefix 전체 무효화)
   * - self: SelfInspectionsService 가 캐시 인프라 없음 → no-op
   */
  private invalidateParentCache(inspectionId: string, inspectionType: InspectionType): void {
    if (inspectionType !== 'intermediate') return;
    this.cacheService.delete(`${this.INTERMEDIATE_CACHE_PREFIX}detail:${inspectionId}`);
    // 섹션 변경은 list 쿼리 정렬에는 영향 없지만, 부모 IntermediateInspectionsService 의
    // invalidateCache() 가 list 를 함께 제거하는 패턴이므로 정합성을 위해 동일하게 처리.
    this.cacheService.deleteByPrefix(this.INTERMEDIATE_CACHE_PREFIX + 'list:');
    this.cacheService.deleteByPrefix(this.INTERMEDIATE_CACHE_PREFIX + 'list-equip:');
  }

  async findByInspection(
    inspectionId: string,
    inspectionType: InspectionType
  ): Promise<InspectionResultSection[]> {
    return this.db
      .select()
      .from(inspectionResultSections)
      .where(
        and(
          eq(inspectionResultSections.inspectionId, inspectionId),
          eq(inspectionResultSections.inspectionType, inspectionType)
        )
      )
      .orderBy(asc(inspectionResultSections.sortOrder));
  }

  async create(
    inspectionId: string,
    inspectionType: InspectionType,
    dto: CreateResultSectionInput,
    createdBy: string
  ): Promise<InspectionResultSection> {
    const [section] = await this.db
      .insert(inspectionResultSections)
      .values({
        inspectionId,
        inspectionType,
        sortOrder: dto.sortOrder,
        sectionType: dto.sectionType,
        title: dto.title,
        content: dto.content,
        tableData: dto.tableData,
        richTableData: dto.richTableData,
        documentId: dto.documentId,
        imageWidthCm: dto.imageWidthCm?.toString(),
        imageHeightCm: dto.imageHeightCm?.toString(),
        createdBy,
      })
      .returning();
    this.invalidateParentCache(inspectionId, inspectionType);
    return section;
  }

  async update(
    sectionId: string,
    inspectionId: string,
    inspectionType: InspectionType,
    dto: UpdateResultSectionInput
  ): Promise<InspectionResultSection> {
    // Partial<NewInspectionResultSection> 로 Record<string, unknown> 대체 — 필드명 오타/타입 안전성 확보
    const updateData: Partial<NewInspectionResultSection> = { updatedAt: new Date() };
    if (dto.sortOrder !== undefined) updateData.sortOrder = dto.sortOrder;
    if (dto.sectionType !== undefined) updateData.sectionType = dto.sectionType;
    if (dto.title !== undefined) updateData.title = dto.title;
    if (dto.content !== undefined) updateData.content = dto.content;
    if (dto.tableData !== undefined) updateData.tableData = dto.tableData;
    if (dto.richTableData !== undefined) updateData.richTableData = dto.richTableData;
    if (dto.documentId !== undefined) updateData.documentId = dto.documentId;
    if (dto.imageWidthCm !== undefined) updateData.imageWidthCm = dto.imageWidthCm.toString();
    if (dto.imageHeightCm !== undefined) updateData.imageHeightCm = dto.imageHeightCm.toString();

    const [updated] = await this.db
      .update(inspectionResultSections)
      .set(updateData)
      .where(
        and(
          eq(inspectionResultSections.id, sectionId),
          eq(inspectionResultSections.inspectionId, inspectionId),
          eq(inspectionResultSections.inspectionType, inspectionType)
        )
      )
      .returning();

    if (!updated) {
      throw new NotFoundException({
        code: 'RESULT_SECTION_NOT_FOUND',
        message: `Result section ${sectionId} not found.`,
      });
    }
    this.invalidateParentCache(inspectionId, inspectionType);
    return updated;
  }

  async delete(
    sectionId: string,
    inspectionId: string,
    inspectionType: InspectionType
  ): Promise<void> {
    const [deleted] = await this.db
      .delete(inspectionResultSections)
      .where(
        and(
          eq(inspectionResultSections.id, sectionId),
          eq(inspectionResultSections.inspectionId, inspectionId),
          eq(inspectionResultSections.inspectionType, inspectionType)
        )
      )
      .returning({ id: inspectionResultSections.id });

    if (!deleted) {
      throw new NotFoundException({
        code: 'RESULT_SECTION_NOT_FOUND',
        message: `Result section ${sectionId} not found.`,
      });
    }
    this.invalidateParentCache(inspectionId, inspectionType);
  }

  /**
   * 결과 섹션 순서 재할당 — 단일 트랜잭션으로 race condition 제거.
   *
   * 프론트에서 현재 순서의 전체 섹션 ID 배열을 전달한다.
   * 서비스는:
   * 1. 전달된 ID 가 모두 해당 inspection 에 속하는지 검증 (개수 일치 + inArray)
   * 2. tx 안에서 sortOrder 를 0..N-1 로 재할당
   * 3. 정렬된 결과 반환
   *
   * 기존 pairwise PATCH 방식(첫 패치 성공 후 두 번째 실패 시 sortOrder 불일치)을 대체한다.
   */
  async reorder(
    inspectionId: string,
    inspectionType: InspectionType,
    input: ReorderResultSectionsInput
  ): Promise<InspectionResultSection[]> {
    const { sectionIds } = input;

    // 중복 방지: 동일 ID 가 배열 안에 두 번 들어오면 inArray 매치 카운트는 맞지만
    // sortOrder 가 뒤에 오는 값으로 덮어쓰이므로 정렬이 왜곡될 수 있다.
    const uniqueIds = new Set(sectionIds);
    if (uniqueIds.size !== sectionIds.length) {
      throw new BadRequestException({
        code: 'RESULT_SECTION_DUPLICATE',
        message: '중복된 섹션 ID 가 포함되어 있습니다.',
      });
    }

    return this.db
      .transaction(async (tx) => {
        // 1. 주어진 ID 가 모두 해당 inspection 에 속하는지 확인
        const existing = await tx
          .select({ id: inspectionResultSections.id })
          .from(inspectionResultSections)
          .where(
            and(
              eq(inspectionResultSections.inspectionId, inspectionId),
              eq(inspectionResultSections.inspectionType, inspectionType),
              inArray(inspectionResultSections.id, sectionIds)
            )
          );

        if (existing.length !== sectionIds.length) {
          throw new BadRequestException({
            code: 'RESULT_SECTION_MISMATCH',
            message: '일부 섹션 ID 가 해당 점검에 속하지 않습니다.',
          });
        }

        // 2. 총 섹션 개수와 일치하는지 확인 (부분 reorder 금지 — 전체 순서 배열 요구)
        const totalCountRows = await tx
          .select({ id: inspectionResultSections.id })
          .from(inspectionResultSections)
          .where(
            and(
              eq(inspectionResultSections.inspectionId, inspectionId),
              eq(inspectionResultSections.inspectionType, inspectionType)
            )
          );
        if (totalCountRows.length !== sectionIds.length) {
          throw new BadRequestException({
            code: 'RESULT_SECTION_INCOMPLETE_ORDER',
            message: '전체 섹션 순서 배열이 필요합니다.',
          });
        }

        // 3. sortOrder 를 0..N-1 로 재할당 (tx 원자성으로 중간 상태 노출 없음)
        const now = new Date();
        for (let i = 0; i < sectionIds.length; i++) {
          await tx
            .update(inspectionResultSections)
            .set({ sortOrder: i, updatedAt: now })
            .where(
              and(
                eq(inspectionResultSections.id, sectionIds[i]),
                eq(inspectionResultSections.inspectionId, inspectionId),
                eq(inspectionResultSections.inspectionType, inspectionType)
              )
            );
        }

        // 4. 재정렬된 전체 리스트 반환
        const reordered = await tx
          .select()
          .from(inspectionResultSections)
          .where(
            and(
              eq(inspectionResultSections.inspectionId, inspectionId),
              eq(inspectionResultSections.inspectionType, inspectionType)
            )
          )
          .orderBy(asc(inspectionResultSections.sortOrder));

        // tx 커밋 후 parent cache 무효화는 tx 콜백 밖에서 실행되어야 하지만,
        // Drizzle transaction 은 콜백 반환값이 tx 성공 후 resolve 되므로 .then 기반
        // 단일 위치에서 invalidate 호출이 안전 — 함수 반환 이후 별도 처리.
        return reordered;
      })
      .then((reordered) => {
        this.invalidateParentCache(inspectionId, inspectionType);
        return reordered;
      });
  }

  async createFromCsv(
    inspectionId: string,
    inspectionType: InspectionType,
    csvContent: string,
    title: string | undefined,
    createdBy: string
  ): Promise<InspectionResultSection> {
    const lines = csvContent
      .replace(/^\uFEFF/, '') // UTF-8 BOM 제거 (Excel 한국어 CSV)
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    if (lines.length < 2) {
      throw new BadRequestException({
        code: 'CSV_TOO_FEW_ROWS',
        message: 'CSV must have at least a header row and one data row.',
      });
    }

    const parseCsvLine = (line: string): string[] => {
      const cells: string[] = [];
      let current = '';
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (inQuotes) {
          if (ch === '"' && line[i + 1] === '"') {
            current += '"';
            i++;
          } else if (ch === '"') {
            inQuotes = false;
          } else {
            current += ch;
          }
        } else {
          if (ch === '"') {
            inQuotes = true;
          } else if (ch === ',') {
            cells.push(current);
            current = '';
          } else {
            current += ch;
          }
        }
      }
      cells.push(current);
      return cells;
    };

    const headers = parseCsvLine(lines[0]);
    const rows = lines.slice(1).map(parseCsvLine);

    // 다음 sortOrder 계산
    const existing = await this.findByInspection(inspectionId, inspectionType);
    const maxSort = existing.reduce((max, s) => Math.max(max, s.sortOrder), -1);

    return this.create(
      inspectionId,
      inspectionType,
      {
        sortOrder: maxSort + 1,
        sectionType: 'data_table',
        title,
        tableData: { headers, rows },
      },
      createdBy
    );
  }
}

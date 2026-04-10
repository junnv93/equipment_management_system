import { Inject, Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import type { AppDatabase } from '@equipment-management/db';
import { eq, and, asc } from 'drizzle-orm';
import {
  inspectionResultSections,
  type InspectionResultSection,
} from '@equipment-management/db/schema';
import type { InspectionType } from '@equipment-management/schemas';
import type { CreateResultSectionInput, UpdateResultSectionInput } from './dto/result-section.dto';

@Injectable()
export class ResultSectionsService {
  constructor(
    @Inject('DRIZZLE_INSTANCE')
    private readonly db: AppDatabase
  ) {}

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
    return section;
  }

  async update(
    sectionId: string,
    inspectionId: string,
    inspectionType: InspectionType,
    dto: UpdateResultSectionInput
  ): Promise<InspectionResultSection> {
    const updateData: Record<string, unknown> = { updatedAt: new Date() };
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

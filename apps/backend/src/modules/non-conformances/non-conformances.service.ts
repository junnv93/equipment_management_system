import { Injectable, NotFoundException, BadRequestException, Inject } from '@nestjs/common';
import { eq, and, isNull, desc, asc, like, SQL } from 'drizzle-orm';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import * as schema from '@equipment-management/db/schema';
import { nonConformances } from '@equipment-management/db/schema/non-conformances';
import { equipment } from '@equipment-management/db/schema/equipment';
import { CreateNonConformanceDto } from './dto/create-non-conformance.dto';
import { UpdateNonConformanceDto } from './dto/update-non-conformance.dto';
import { CloseNonConformanceDto } from './dto/close-non-conformance.dto';
import { NonConformanceQueryDto, NonConformanceStatus } from './dto/non-conformance-query.dto';

@Injectable()
export class NonConformancesService {
  constructor(
    @Inject('DRIZZLE_INSTANCE')
    private readonly db: PostgresJsDatabase<typeof schema>
  ) {}

  /**
   * 부적합 등록 (장비 상태 자동 변경: non_conforming)
   */
  async create(createDto: CreateNonConformanceDto) {
    // 장비 존재 확인
    const equipmentResult = await this.db
      .select()
      .from(equipment)
      .where(eq(equipment.uuid, createDto.equipmentId))
      .limit(1);

    if (equipmentResult.length === 0) {
      throw new NotFoundException(`장비 UUID ${createDto.equipmentId}를 찾을 수 없습니다.`);
    }

    // 이미 부적합 상태인지 확인
    if (equipmentResult[0].status === 'non_conforming') {
      throw new BadRequestException('이미 부적합 상태인 장비입니다.');
    }

    // 트랜잭션으로 부적합 등록 + 장비 상태 변경
    const result = await this.db.transaction(async (tx) => {
      // 1. 부적합 등록
      const [nonConformance] = await tx
        .insert(nonConformances)
        .values({
          equipmentId: createDto.equipmentId,
          discoveryDate: createDto.discoveryDate,
          discoveredBy: createDto.discoveredBy,
          cause: createDto.cause,
          actionPlan: createDto.actionPlan,
          status: NonConformanceStatus.OPEN,
        } as any)
        .returning();

      // 2. 장비 상태를 non_conforming으로 변경
      await tx
        .update(equipment)
        .set({
          status: 'non_conforming',
          updatedAt: new Date(),
        } as any)
        .where(eq(equipment.uuid, createDto.equipmentId));

      return nonConformance;
    });

    return result;
  }

  /**
   * 부적합 목록 조회 (필터: equipmentId, status)
   */
  async findAll(query: NonConformanceQueryDto) {
    const {
      equipmentId,
      status,
      search,
      sort = 'discoveryDate.desc',
      page = 1,
      pageSize = 20,
    } = query;

    // 조건 구성
    const conditions: SQL[] = [isNull(nonConformances.deletedAt)];

    if (equipmentId) {
      conditions.push(eq(nonConformances.equipmentId, equipmentId));
    }

    if (status) {
      conditions.push(eq(nonConformances.status, status));
    }

    if (search) {
      conditions.push(like(nonConformances.cause, `%${search}%`));
    }

    // 정렬 처리
    const [sortField, sortDirection] = sort.split('.');
    const sortColumn = this.getSortColumn(sortField);
    const orderBy = sortDirection === 'asc' ? asc(sortColumn) : desc(sortColumn);

    // 전체 개수 조회
    const allItems = await this.db
      .select()
      .from(nonConformances)
      .where(and(...conditions));

    const totalItems = allItems.length;

    // 페이지네이션 적용 조회
    const offset = (page - 1) * pageSize;
    const items = await this.db
      .select()
      .from(nonConformances)
      .where(and(...conditions))
      .orderBy(orderBy)
      .limit(pageSize)
      .offset(offset);

    return {
      items,
      meta: {
        totalItems,
        itemCount: items.length,
        itemsPerPage: pageSize,
        totalPages: Math.ceil(totalItems / pageSize),
        currentPage: page,
      },
    };
  }

  /**
   * 정렬 필드에 해당하는 컬럼 반환
   */
  private getSortColumn(sortField: string) {
    switch (sortField) {
      case 'discoveryDate':
        return nonConformances.discoveryDate;
      case 'status':
        return nonConformances.status;
      case 'createdAt':
        return nonConformances.createdAt;
      case 'updatedAt':
        return nonConformances.updatedAt;
      default:
        return nonConformances.discoveryDate;
    }
  }

  /**
   * 단일 부적합 조회
   */
  async findOne(id: string) {
    const [nonConformance] = await this.db
      .select()
      .from(nonConformances)
      .where(and(eq(nonConformances.id, id), isNull(nonConformances.deletedAt)));

    if (!nonConformance) {
      throw new NotFoundException(`부적합 ID ${id}를 찾을 수 없습니다.`);
    }

    return nonConformance;
  }

  /**
   * 장비별 열린 부적합 조회
   */
  async findOpenByEquipment(equipmentId: string) {
    const results = await this.db
      .select()
      .from(nonConformances)
      .where(
        and(
          eq(nonConformances.equipmentId, equipmentId),
          isNull(nonConformances.deletedAt),
          eq(nonConformances.status, NonConformanceStatus.OPEN)
        )
      );

    return results;
  }

  /**
   * 장비가 부적합 상태인지 확인
   */
  async isEquipmentNonConforming(equipmentId: string): Promise<boolean> {
    const openNonConformances = await this.db
      .select()
      .from(nonConformances)
      .where(
        and(
          eq(nonConformances.equipmentId, equipmentId),
          isNull(nonConformances.deletedAt),
          eq(nonConformances.status, NonConformanceStatus.OPEN)
        )
      )
      .limit(1);

    return openNonConformances.length > 0;
  }

  /**
   * 원인분석/조치 기록 업데이트
   */
  async update(id: string, updateDto: UpdateNonConformanceDto) {
    const nonConformance = await this.findOne(id);

    if (nonConformance.status === NonConformanceStatus.CLOSED) {
      throw new BadRequestException('종료된 부적합은 수정할 수 없습니다.');
    }

    const [updated] = await this.db
      .update(nonConformances)
      .set({
        ...updateDto,
        updatedAt: new Date(),
      } as any)
      .where(eq(nonConformances.id, id))
      .returning();

    return updated;
  }

  /**
   * 부적합 종료 (기술책임자)
   * 장비 상태 복원: available
   */
  async close(id: string, closeDto: CloseNonConformanceDto) {
    const nonConformance = await this.findOne(id);

    if (nonConformance.status === NonConformanceStatus.CLOSED) {
      throw new BadRequestException('이미 종료된 부적합입니다.');
    }

    // 조치 완료 상태인지 확인 (corrected 상태에서만 종료 가능)
    if (nonConformance.status !== NonConformanceStatus.CORRECTED) {
      throw new BadRequestException('조치 완료(corrected) 상태에서만 종료할 수 있습니다.');
    }

    // 트랜잭션으로 부적합 종료 + 장비 상태 복원
    const result = await this.db.transaction(async (tx) => {
      // 1. 부적합 종료
      const [updated] = await tx
        .update(nonConformances)
        .set({
          status: NonConformanceStatus.CLOSED,
          closedBy: closeDto.closedBy,
          closedAt: new Date(),
          closureNotes: closeDto.closureNotes,
          updatedAt: new Date(),
        } as any)
        .where(eq(nonConformances.id, id))
        .returning();

      // 2. 해당 장비에 다른 열린 부적합이 있는지 확인
      const otherOpenNonConformances = await tx
        .select()
        .from(nonConformances)
        .where(
          and(
            eq(nonConformances.equipmentId, nonConformance.equipmentId),
            isNull(nonConformances.deletedAt),
            eq(nonConformances.status, NonConformanceStatus.OPEN)
          )
        )
        .limit(1);

      // 다른 열린 부적합이 없으면 장비 상태 복원
      if (otherOpenNonConformances.length === 0) {
        await tx
          .update(equipment)
          .set({
            status: 'available',
            updatedAt: new Date(),
          } as any)
          .where(eq(equipment.uuid, nonConformance.equipmentId));
      }

      return updated;
    });

    return result;
  }

  /**
   * 소프트 삭제
   */
  async remove(id: string) {
    await this.findOne(id);

    await this.db
      .update(nonConformances)
      .set({
        deletedAt: new Date(),
        updatedAt: new Date(),
      } as any)
      .where(eq(nonConformances.id, id));

    return { id, deleted: true };
  }
}

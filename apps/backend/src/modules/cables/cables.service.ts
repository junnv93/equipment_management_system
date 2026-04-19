import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { AppDatabase } from '@equipment-management/db';
import { eq, and, desc, asc, sql, or } from 'drizzle-orm';
import {
  cables,
  cableLossMeasurements,
  cableLossDataPoints,
  type Cable,
  type CableLossMeasurement,
  type CableLossDataPoint,
} from '@equipment-management/db/schema';
import { VersionedBaseService } from '../../common/base/versioned-base.service';
import { SimpleCacheService } from '../../common/cache/simple-cache.service';
import { CABLES_CACHE_PREFIX } from '../../common/cache/cache-key-prefixes';
import { CACHE_TTL, DEFAULT_PAGE_SIZE } from '@equipment-management/shared-constants';
import { likeContains, safeIlike } from '../../common/utils/like-escape';
import type { CreateCableInput } from './dto/create-cable.dto';
import type { UpdateCableInput } from './dto/update-cable.dto';
import type { CableQueryInput } from './dto/cable-query.dto';
import type { CreateMeasurementInput } from './dto/create-measurement.dto';

@Injectable()
export class CablesService extends VersionedBaseService {
  private readonly CACHE_PREFIX = CABLES_CACHE_PREFIX;

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

  /**
   * VersionedBaseService 훅 override — 409 발생 시 detail 캐시 자동 무효화.
   * 모든 updateWithVersion 호출 경로가 단일 정책 공유 → catch boilerplate 제거.
   */
  protected async onVersionConflict(id: string): Promise<void> {
    await this.cacheService.delete(this.buildCacheKey('detail', id));
  }

  private invalidateCache(id?: string): void {
    if (id) {
      this.cacheService.delete(this.buildCacheKey('detail', id));
    }
    this.cacheService.deleteByPrefix(this.CACHE_PREFIX + 'list:');
    this.cacheService.deleteByPrefix(this.CACHE_PREFIX + 'measurements:');
  }

  /**
   * 케이블 생성
   */
  async create(dto: CreateCableInput, createdBy: string): Promise<Cable> {
    const [created] = await this.db
      .insert(cables)
      .values({
        managementNumber: dto.managementNumber,
        length: dto.length ?? null,
        connectorType: dto.connectorType ?? null,
        frequencyRangeMin: dto.frequencyRangeMin ?? null,
        frequencyRangeMax: dto.frequencyRangeMax ?? null,
        serialNumber: dto.serialNumber ?? null,
        location: dto.location ?? null,
        site: dto.site ?? null,
        createdBy,
      })
      .returning();

    this.invalidateCache();

    return created;
  }

  /**
   * 케이블 목록 (페이지네이션 + 검색)
   */
  async findAll(query: CableQueryInput): Promise<{
    items: Cable[];
    meta: {
      totalItems: number;
      itemCount: number;
      itemsPerPage: number;
      totalPages: number;
      currentPage: number;
    };
  }> {
    const {
      search,
      connectorType,
      status,
      site,
      sort = 'createdAt.desc',
      page = 1,
      pageSize = DEFAULT_PAGE_SIZE,
    } = query;

    const cacheKey = this.buildCacheKey(
      'list',
      `${search ?? ''}_${connectorType ?? ''}_${status ?? ''}_${site ?? ''}_${sort}_${page}_${pageSize}`
    );

    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        const conditions = [];
        if (search) {
          const pattern = likeContains(search);
          conditions.push(
            or(safeIlike(cables.managementNumber, pattern), safeIlike(cables.serialNumber, pattern))
          );
        }
        if (connectorType) conditions.push(eq(cables.connectorType, connectorType));
        if (status) conditions.push(eq(cables.status, status));
        if (site) conditions.push(eq(cables.site, site));

        const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

        const [sortField, sortOrder] = sort.split('.');
        const sortColumn =
          sortField === 'managementNumber'
            ? cables.managementNumber
            : sortField === 'lastMeasurementDate'
              ? cables.lastMeasurementDate
              : cables.createdAt;
        const orderBy = sortOrder === 'asc' ? asc(sortColumn) : desc(sortColumn);

        const [rows, [{ count }]] = await Promise.all([
          this.db
            .select()
            .from(cables)
            .where(whereClause)
            .orderBy(orderBy)
            .limit(pageSize)
            .offset((page - 1) * pageSize),
          this.db
            .select({ count: sql<number>`count(*)` })
            .from(cables)
            .where(whereClause),
        ]);

        const totalItems = Number(count);
        return {
          items: rows,
          meta: {
            totalItems,
            itemCount: rows.length,
            itemsPerPage: pageSize,
            totalPages: Math.ceil(totalItems / pageSize),
            currentPage: page,
          },
        };
      },
      CACHE_TTL.LONG
    );
  }

  /**
   * 케이블 상세 (최신 측정 데이터 포인트 포함)
   */
  async findOne(id: string): Promise<Cable & { latestDataPoints: CableLossDataPoint[] }> {
    const cacheKey = this.buildCacheKey('detail', id);

    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        const [record] = await this.db.select().from(cables).where(eq(cables.id, id)).limit(1);

        if (!record) {
          throw new NotFoundException({
            code: 'CABLE_NOT_FOUND',
            message: `Cable with UUID ${id} not found.`,
          });
        }

        // 최신 측정의 데이터 포인트 조회
        let latestDataPoints: CableLossDataPoint[] = [];
        const [latestMeasurement] = await this.db
          .select()
          .from(cableLossMeasurements)
          .where(eq(cableLossMeasurements.cableId, id))
          .orderBy(desc(cableLossMeasurements.measurementDate))
          .limit(1);

        if (latestMeasurement) {
          latestDataPoints = await this.db
            .select()
            .from(cableLossDataPoints)
            .where(eq(cableLossDataPoints.measurementId, latestMeasurement.id))
            .orderBy(asc(cableLossDataPoints.frequencyMhz));
        }

        return { ...record, latestDataPoints };
      },
      CACHE_TTL.MEDIUM
    );
  }

  /**
   * 케이블 수정 (CAS)
   */
  async update(id: string, dto: UpdateCableInput): Promise<Cable> {
    const { version, ...updateFields } = dto;

    const updateData: Record<string, unknown> = {};
    if (updateFields.managementNumber !== undefined)
      updateData.managementNumber = updateFields.managementNumber;
    if (updateFields.length !== undefined) updateData.length = updateFields.length;
    if (updateFields.connectorType !== undefined)
      updateData.connectorType = updateFields.connectorType;
    if (updateFields.frequencyRangeMin !== undefined)
      updateData.frequencyRangeMin = updateFields.frequencyRangeMin;
    if (updateFields.frequencyRangeMax !== undefined)
      updateData.frequencyRangeMax = updateFields.frequencyRangeMax;
    if (updateFields.serialNumber !== undefined)
      updateData.serialNumber = updateFields.serialNumber;
    if (updateFields.location !== undefined) updateData.location = updateFields.location;
    if (updateFields.site !== undefined) updateData.site = updateFields.site;
    if (updateFields.status !== undefined) updateData.status = updateFields.status;

    const updated = await this.updateWithVersion<Cable>(
      cables,
      id,
      version,
      updateData,
      '케이블',
      undefined,
      'CABLE_NOT_FOUND'
    );

    this.invalidateCache(id);

    return updated;
  }

  /**
   * 측정 추가 (트랜잭션: measurement + data points + cable.lastMeasurementDate 갱신)
   */
  async addMeasurement(
    cableId: string,
    dto: CreateMeasurementInput,
    userId: string
  ): Promise<CableLossMeasurement> {
    // 케이블 존재 확인
    const [cable] = await this.db
      .select({ id: cables.id })
      .from(cables)
      .where(eq(cables.id, cableId))
      .limit(1);

    if (!cable) {
      throw new NotFoundException({
        code: 'CABLE_NOT_FOUND',
        message: `Cable with UUID ${cableId} not found.`,
      });
    }

    const measurementDate = new Date(dto.measurementDate);

    const result = await this.db.transaction(async (tx) => {
      const [measurement] = await tx
        .insert(cableLossMeasurements)
        .values({
          cableId,
          measurementDate,
          measuredBy: userId,
          measurementEquipmentId: dto.measurementEquipmentId ?? null,
          notes: dto.notes ?? null,
        })
        .returning();

      await tx.insert(cableLossDataPoints).values(
        dto.dataPoints.map((dp) => ({
          measurementId: measurement.id,
          frequencyMhz: dp.frequencyMhz,
          lossDb: dp.lossDb,
        }))
      );

      // 케이블의 최근 측정 정보 갱신
      await tx
        .update(cables)
        .set({
          lastMeasurementDate: measurementDate,
          measuredBy: userId,
          updatedAt: new Date(),
        })
        .where(eq(cables.id, cableId));

      return measurement;
    });

    this.invalidateCache(cableId);

    return result;
  }

  /**
   * 케이블의 측정 목록
   */
  async findMeasurements(cableId: string): Promise<CableLossMeasurement[]> {
    const cacheKey = this.buildCacheKey('measurements', cableId);

    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        return this.db
          .select()
          .from(cableLossMeasurements)
          .where(eq(cableLossMeasurements.cableId, cableId))
          .orderBy(desc(cableLossMeasurements.measurementDate));
      },
      CACHE_TTL.LONG
    );
  }

  /**
   * 측정 상세 (데이터 포인트 포함)
   */
  async findMeasurementDetail(
    measurementId: string
  ): Promise<CableLossMeasurement & { dataPoints: CableLossDataPoint[] }> {
    const cacheKey = this.buildCacheKey('measurement-detail', measurementId);

    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        const [measurement] = await this.db
          .select()
          .from(cableLossMeasurements)
          .where(eq(cableLossMeasurements.id, measurementId))
          .limit(1);

        if (!measurement) {
          throw new NotFoundException({
            code: 'CABLE_LOSS_MEASUREMENT_NOT_FOUND',
            message: `Measurement with UUID ${measurementId} not found.`,
          });
        }

        const dataPoints = await this.db
          .select()
          .from(cableLossDataPoints)
          .where(eq(cableLossDataPoints.measurementId, measurementId))
          .orderBy(asc(cableLossDataPoints.frequencyMhz));

        return { ...measurement, dataPoints };
      },
      CACHE_TTL.MEDIUM
    );
  }
}

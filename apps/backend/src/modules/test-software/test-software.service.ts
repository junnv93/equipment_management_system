import { Inject, Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import type { AppDatabase } from '@equipment-management/db';
import { eq, and, desc, sql, asc } from 'drizzle-orm';
import { testSoftware, type TestSoftware } from '@equipment-management/db/schema';
import { VersionedBaseService } from '../../common/base/versioned-base.service';
import { SimpleCacheService } from '../../common/cache/simple-cache.service';
import { CACHE_KEY_PREFIXES } from '../../common/cache/cache-key-prefixes';
import { CACHE_TTL, DEFAULT_PAGE_SIZE } from '@equipment-management/shared-constants';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { likeContains, safeIlike } from '../../common/utils/like-escape';
import type { CreateTestSoftwareInput } from './dto/create-test-software.dto';
import type { UpdateTestSoftwareInput } from './dto/update-test-software.dto';
import type { TestSoftwareQueryInput } from './dto/test-software-query.dto';

@Injectable()
export class TestSoftwareService extends VersionedBaseService {
  private readonly CACHE_PREFIX = CACHE_KEY_PREFIXES.TEST_SOFTWARE;

  constructor(
    @Inject('DRIZZLE_INSTANCE')
    protected readonly db: AppDatabase,
    private readonly cacheService: SimpleCacheService,
    private readonly eventEmitter: EventEmitter2
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
  }

  /**
   * PNNNN 관리번호 생성
   *
   * SELECT ... FOR UPDATE로 동시 삽입 시 중복 방지.
   * P0001부터 시작, 순차 증가.
   */
  private async generateNextManagementNumber(tx: AppDatabase): Promise<string> {
    const result = await tx.execute(
      sql`SELECT MAX(management_number) as max_num FROM test_software FOR UPDATE`
    );

    const maxNum = (result.rows[0] as { max_num: string | null } | undefined)?.max_num;

    if (!maxNum) {
      return 'P0001';
    }

    // Parse PNNNN → number, increment, zero-pad
    const numericPart = parseInt(maxNum.substring(1), 10);
    const nextNum = numericPart + 1;
    return `P${String(nextNum).padStart(4, '0')}`;
  }

  async create(dto: CreateTestSoftwareInput, createdBy: string): Promise<TestSoftware> {
    const result = await this.db.transaction(async (tx) => {
      const managementNumber = await this.generateNextManagementNumber(tx);

      const [created] = await tx
        .insert(testSoftware)
        .values({
          managementNumber,
          name: dto.name,
          softwareVersion: dto.softwareVersion ?? null,
          testField: dto.testField,
          primaryManagerId: dto.primaryManagerId ?? null,
          secondaryManagerId: dto.secondaryManagerId ?? null,
          installedAt: dto.installedAt ? new Date(dto.installedAt) : null,
          manufacturer: dto.manufacturer ?? null,
          location: dto.location ?? null,
          availability: dto.availability ?? 'available',
          requiresValidation: dto.requiresValidation ?? true,
          site: dto.site ?? null,
        })
        .returning();

      return created;
    });

    this.invalidateCache();

    return result;
  }

  async findAll(query: TestSoftwareQueryInput): Promise<{
    items: TestSoftware[];
    meta: {
      totalItems: number;
      itemCount: number;
      itemsPerPage: number;
      totalPages: number;
      currentPage: number;
    };
  }> {
    const {
      testField,
      availability,
      search,
      site,
      sort = 'createdAt.desc',
      page = 1,
      pageSize = DEFAULT_PAGE_SIZE,
    } = query;

    const cacheKey = this.buildCacheKey(
      'list',
      `${testField ?? ''}_${availability ?? ''}_${search ?? ''}_${site ?? ''}_${sort}_${page}_${pageSize}`
    );

    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        const conditions = [];
        if (testField) conditions.push(eq(testSoftware.testField, testField));
        if (availability) conditions.push(eq(testSoftware.availability, availability));
        if (search) {
          conditions.push(safeIlike(testSoftware.name, likeContains(search)));
        }
        if (site) conditions.push(eq(testSoftware.site, site));

        const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

        const [sortField, sortOrder] = sort.split('.');
        const sortColumn =
          sortField === 'name'
            ? testSoftware.name
            : sortField === 'managementNumber'
              ? testSoftware.managementNumber
              : sortField === 'testField'
                ? testSoftware.testField
                : testSoftware.createdAt;
        const orderBy = sortOrder === 'asc' ? asc(sortColumn) : desc(sortColumn);

        const [rows, [{ count }]] = await Promise.all([
          this.db
            .select()
            .from(testSoftware)
            .where(whereClause)
            .orderBy(orderBy)
            .limit(pageSize)
            .offset((page - 1) * pageSize),
          this.db
            .select({ count: sql<number>`count(*)` })
            .from(testSoftware)
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

  async findOne(id: string): Promise<TestSoftware> {
    const cacheKey = this.buildCacheKey('detail', id);
    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        const [record] = await this.db
          .select()
          .from(testSoftware)
          .where(eq(testSoftware.id, id))
          .limit(1);

        if (!record) {
          throw new NotFoundException({
            code: 'TEST_SOFTWARE_NOT_FOUND',
            message: `Test software with UUID ${id} not found.`,
          });
        }

        return record;
      },
      CACHE_TTL.MEDIUM
    );
  }

  async update(id: string, dto: UpdateTestSoftwareInput): Promise<TestSoftware> {
    const { version, ...updateFields } = dto;

    // Build update data, converting installedAt string to Date if present
    const updateData: Record<string, unknown> = {};
    if (updateFields.name !== undefined) updateData.name = updateFields.name;
    if (updateFields.softwareVersion !== undefined)
      updateData.softwareVersion = updateFields.softwareVersion;
    if (updateFields.testField !== undefined) updateData.testField = updateFields.testField;
    if (updateFields.primaryManagerId !== undefined)
      updateData.primaryManagerId = updateFields.primaryManagerId;
    if (updateFields.secondaryManagerId !== undefined)
      updateData.secondaryManagerId = updateFields.secondaryManagerId;
    if (updateFields.installedAt !== undefined)
      updateData.installedAt = updateFields.installedAt ? new Date(updateFields.installedAt) : null;
    if (updateFields.manufacturer !== undefined)
      updateData.manufacturer = updateFields.manufacturer;
    if (updateFields.location !== undefined) updateData.location = updateFields.location;
    if (updateFields.availability !== undefined)
      updateData.availability = updateFields.availability;
    if (updateFields.requiresValidation !== undefined)
      updateData.requiresValidation = updateFields.requiresValidation;
    if (updateFields.site !== undefined) updateData.site = updateFields.site;

    let updated: TestSoftware;
    try {
      updated = await this.updateWithVersion<TestSoftware>(
        testSoftware,
        id,
        version,
        updateData,
        '시험용 소프트웨어',
        undefined,
        'TEST_SOFTWARE_NOT_FOUND'
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

  async toggleAvailability(id: string, version: number): Promise<TestSoftware> {
    const current = await this.findOne(id);
    const newAvailability = current.availability === 'available' ? 'unavailable' : 'available';

    let updated: TestSoftware;
    try {
      updated = await this.updateWithVersion<TestSoftware>(
        testSoftware,
        id,
        version,
        { availability: newAvailability },
        '시험용 소프트웨어',
        undefined,
        'TEST_SOFTWARE_NOT_FOUND'
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

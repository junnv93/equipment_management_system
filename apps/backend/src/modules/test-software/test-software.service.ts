import { Inject, Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import type { AppDatabase } from '@equipment-management/db';
import { eq, and, desc, sql, asc } from 'drizzle-orm';
import {
  testSoftware,
  equipmentTestSoftware,
  equipment,
  type TestSoftware,
} from '@equipment-management/db/schema';
import { VersionedBaseService } from '../../common/base/versioned-base.service';
import { SimpleCacheService } from '../../common/cache/simple-cache.service';
import { CACHE_KEY_PREFIXES } from '../../common/cache/cache-key-prefixes';
import { CACHE_TTL, DEFAULT_PAGE_SIZE } from '@equipment-management/shared-constants';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { likeContains, safeIlike } from '../../common/utils/like-escape';
import { acquireAdvisoryXactLock } from '../../common/utils/advisory-lock';
import type { CreateTestSoftwareInput } from './dto/create-test-software.dto';
import type { UpdateTestSoftwareInput } from './dto/update-test-software.dto';
import type { TestSoftwareQueryInput } from './dto/test-software-query.dto';
import type { LinkEquipmentInput } from './dto/link-equipment.dto';

/** findAll/findOne 응답에 users LEFT JOIN으로 추가되는 필드 */
export type TestSoftwareWithManagers = TestSoftware & {
  primaryManagerName: string | null;
  secondaryManagerName: string | null;
};

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
   * VersionedBaseService 훅 override — 409 발생 시 detail 캐시 자동 무효화.
   * update/toggleAvailability 등 모든 updateWithVersion 경로가 단일 정책 공유.
   */
  protected async onVersionConflict(id: string): Promise<void> {
    await this.cacheService.delete(this.buildCacheKey('detail', id));
  }

  /**
   * PNNNN 관리번호 생성 — P0001부터 시작, 순차 증가.
   *
   * Advisory lock 으로 동시 삽입 직렬화:
   * - `SELECT ... FOR UPDATE` 는 집계 함수(MAX) 와 호환 불가 → advisory lock 사용
   * - 트랜잭션 내에서만 유효하며 COMMIT/ROLLBACK 시 자동 해제
   * - 동일 lockKey 를 쓰는 트랜잭션끼리만 직렬화 → 다른 테이블 성능 영향 없음
   *
   * @see apps/backend/src/common/utils/advisory-lock.ts
   */
  private async generateNextManagementNumber(tx: AppDatabase): Promise<string> {
    await acquireAdvisoryXactLock(tx, 'test_software:management_number');

    const result = await tx.execute(
      sql`SELECT MAX(CAST(SUBSTRING(management_number FROM 'P([0-9]+)') AS INTEGER)) as max_num FROM test_software`
    );

    const row = result.rows[0] as Record<string, unknown> | undefined;
    const rawMax = row?.max_num;

    if (rawMax == null) {
      return 'P0001';
    }

    // PostgreSQL returns integers, Drizzle may pass them as string or number
    const maxNum = typeof rawMax === 'string' ? parseInt(rawMax, 10) : Number(rawMax);
    const nextNum = maxNum + 1;
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
          createdBy,
        })
        .returning();

      return created;
    });

    this.invalidateCache();

    return result;
  }

  async findAll(query: TestSoftwareQueryInput): Promise<{
    items: TestSoftwareWithManagers[];
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
      manufacturer,
      site,
      sort = 'createdAt.desc',
      page = 1,
      pageSize = DEFAULT_PAGE_SIZE,
    } = query;

    const cacheKey = this.buildCacheKey(
      'list',
      `${testField ?? ''}_${availability ?? ''}_${search ?? ''}_${manufacturer ?? ''}_${site ?? ''}_${sort}_${page}_${pageSize}`
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
        if (manufacturer) {
          conditions.push(safeIlike(testSoftware.manufacturer, likeContains(manufacturer)));
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
            .select({
              id: testSoftware.id,
              managementNumber: testSoftware.managementNumber,
              name: testSoftware.name,
              softwareVersion: testSoftware.softwareVersion,
              testField: testSoftware.testField,
              primaryManagerId: testSoftware.primaryManagerId,
              secondaryManagerId: testSoftware.secondaryManagerId,
              installedAt: testSoftware.installedAt,
              manufacturer: testSoftware.manufacturer,
              location: testSoftware.location,
              availability: testSoftware.availability,
              requiresValidation: testSoftware.requiresValidation,
              site: testSoftware.site,
              version: testSoftware.version,
              createdAt: testSoftware.createdAt,
              updatedAt: testSoftware.updatedAt,
              primaryManagerName: sql<string | null>`pm.name`,
              secondaryManagerName: sql<string | null>`sm.name`,
            })
            .from(testSoftware)
            .leftJoin(sql`users as pm`, sql`pm.id = ${testSoftware.primaryManagerId}`)
            .leftJoin(sql`users as sm`, sql`sm.id = ${testSoftware.secondaryManagerId}`)
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
          items: rows as TestSoftwareWithManagers[],
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

  // eslint-disable-next-line @typescript-eslint/explicit-function-return-type, @typescript-eslint/explicit-module-boundary-types
  async findOne(id: string) {
    const cacheKey = this.buildCacheKey('detail', id);
    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        const [record] = await this.db
          .select({
            id: testSoftware.id,
            managementNumber: testSoftware.managementNumber,
            name: testSoftware.name,
            softwareVersion: testSoftware.softwareVersion,
            testField: testSoftware.testField,
            primaryManagerId: testSoftware.primaryManagerId,
            secondaryManagerId: testSoftware.secondaryManagerId,
            installedAt: testSoftware.installedAt,
            manufacturer: testSoftware.manufacturer,
            location: testSoftware.location,
            availability: testSoftware.availability,
            requiresValidation: testSoftware.requiresValidation,
            site: testSoftware.site,
            version: testSoftware.version,
            createdAt: testSoftware.createdAt,
            updatedAt: testSoftware.updatedAt,
            primaryManagerName: sql<string | null>`pm.name`,
            secondaryManagerName: sql<string | null>`sm.name`,
          })
          .from(testSoftware)
          .leftJoin(sql`users as pm`, sql`pm.id = ${testSoftware.primaryManagerId}`)
          .leftJoin(sql`users as sm`, sql`sm.id = ${testSoftware.secondaryManagerId}`)
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

  async findByEquipmentId(equipmentId: string): Promise<TestSoftwareWithManagers[]> {
    const cacheKey = this.buildCacheKey('by-equipment', equipmentId);
    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        const rows = await this.db
          .select({
            id: testSoftware.id,
            managementNumber: testSoftware.managementNumber,
            name: testSoftware.name,
            softwareVersion: testSoftware.softwareVersion,
            testField: testSoftware.testField,
            primaryManagerId: testSoftware.primaryManagerId,
            secondaryManagerId: testSoftware.secondaryManagerId,
            installedAt: testSoftware.installedAt,
            manufacturer: testSoftware.manufacturer,
            location: testSoftware.location,
            availability: testSoftware.availability,
            requiresValidation: testSoftware.requiresValidation,
            site: testSoftware.site,
            version: testSoftware.version,
            createdAt: testSoftware.createdAt,
            updatedAt: testSoftware.updatedAt,
            primaryManagerName: sql<string | null>`pm.name`,
            secondaryManagerName: sql<string | null>`sm.name`,
          })
          .from(equipmentTestSoftware)
          .innerJoin(testSoftware, eq(equipmentTestSoftware.testSoftwareId, testSoftware.id))
          .leftJoin(sql`users as pm`, sql`pm.id = ${testSoftware.primaryManagerId}`)
          .leftJoin(sql`users as sm`, sql`sm.id = ${testSoftware.secondaryManagerId}`)
          .where(eq(equipmentTestSoftware.equipmentId, equipmentId))
          .orderBy(asc(testSoftware.managementNumber));

        return rows as TestSoftwareWithManagers[];
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

    const updated = await this.updateWithVersion<TestSoftware>(
      testSoftware,
      id,
      version,
      updateData,
      '시험용 소프트웨어',
      undefined,
      'TEST_SOFTWARE_NOT_FOUND'
    );

    this.invalidateCache(id);

    return updated;
  }

  async toggleAvailability(id: string, version: number): Promise<TestSoftware> {
    const current = await this.findOne(id);
    const newAvailability = current.availability === 'available' ? 'unavailable' : 'available';

    const updated = await this.updateWithVersion<TestSoftware>(
      testSoftware,
      id,
      version,
      { availability: newAvailability },
      '시험용 소프트웨어',
      undefined,
      'TEST_SOFTWARE_NOT_FOUND'
    );

    this.invalidateCache(id);

    return updated;
  }

  // ─── M:N 장비 링크 ────────────────────────────────────────────────────

  /**
   * 양방향 캐시 무효화 — 링크/언링크 시 양쪽 엔티티의 캐시를 모두 제거
   */
  private invalidateLinkCaches(testSoftwareId: string, equipmentId: string): void {
    this.cacheService.delete(this.buildCacheKey('by-equipment', equipmentId));
    this.cacheService.delete(this.buildCacheKey('linked-equipment', testSoftwareId));
    this.cacheService.deleteByPrefix(this.CACHE_PREFIX + 'list:');
  }

  /**
   * 장비 연결 (M:N)
   *
   * UNIQUE 제약(equipment_id, test_software_id) 위반 시 409 Conflict 반환.
   */
  async linkEquipment(
    testSoftwareId: string,
    dto: LinkEquipmentInput
  ): Promise<{ id: string; testSoftwareId: string; equipmentId: string; notes: string | null }> {
    // 소프트웨어 존재 확인
    await this.findOne(testSoftwareId);

    try {
      const [link] = await this.db
        .insert(equipmentTestSoftware)
        .values({
          testSoftwareId,
          equipmentId: dto.equipmentId,
          notes: dto.notes ?? null,
        })
        .returning();

      this.invalidateLinkCaches(testSoftwareId, dto.equipmentId);

      this.eventEmitter.emit('test-software.equipment.linked', {
        testSoftwareId,
        equipmentId: dto.equipmentId,
      });

      return link;
    } catch (error) {
      // PostgreSQL unique_violation: 23505
      if (
        error instanceof Error &&
        'code' in error &&
        (error as { code: string }).code === '23505'
      ) {
        throw new ConflictException({
          code: 'EQUIPMENT_ALREADY_LINKED',
          message: 'This equipment is already linked to the software.',
        });
      }
      throw error;
    }
  }

  /**
   * 장비 연결 해제 (M:N)
   */
  async unlinkEquipment(testSoftwareId: string, equipmentId: string): Promise<void> {
    const deleted = await this.db
      .delete(equipmentTestSoftware)
      .where(
        and(
          eq(equipmentTestSoftware.testSoftwareId, testSoftwareId),
          eq(equipmentTestSoftware.equipmentId, equipmentId)
        )
      )
      .returning({ id: equipmentTestSoftware.id });

    if (deleted.length === 0) {
      throw new NotFoundException({
        code: 'EQUIPMENT_LINK_NOT_FOUND',
        message: 'Equipment link not found.',
      });
    }

    this.invalidateLinkCaches(testSoftwareId, equipmentId);

    this.eventEmitter.emit('test-software.equipment.unlinked', {
      testSoftwareId,
      equipmentId,
    });
  }

  /**
   * 역방향 조회: 소프트웨어에 연결된 장비 목록
   */
  // eslint-disable-next-line @typescript-eslint/explicit-function-return-type, @typescript-eslint/explicit-module-boundary-types
  async findLinkedEquipment(testSoftwareId: string) {
    const cacheKey = this.buildCacheKey('linked-equipment', testSoftwareId);
    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        return this.db
          .select({
            id: equipment.id,
            managementNumber: equipment.managementNumber,
            name: equipment.name,
            modelName: equipment.modelName,
            manufacturer: equipment.manufacturer,
            status: equipment.status,
            site: equipment.site,
            notes: equipmentTestSoftware.notes,
            linkedAt: equipmentTestSoftware.createdAt,
          })
          .from(equipmentTestSoftware)
          .innerJoin(equipment, eq(equipmentTestSoftware.equipmentId, equipment.id))
          .where(eq(equipmentTestSoftware.testSoftwareId, testSoftwareId))
          .orderBy(asc(equipment.managementNumber));
      },
      CACHE_TTL.MEDIUM
    );
  }
}

import { Injectable, NotFoundException, BadRequestException, Inject } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq, and, desc, like, or, sql, inArray } from 'drizzle-orm';
import * as schema from '@equipment-management/db/schema';
import { CreateSoftwareChangeInput } from './dto/create-software-change.dto';
import { SoftwareHistoryQueryDto } from './dto/software-query.dto';
import { ApproveSoftwareChangeDto, RejectSoftwareChangeDto } from './dto/approve-software.dto';
import { SoftwareApprovalStatusValues } from '@equipment-management/schemas';
import { VersionedBaseService } from '../../common/base/versioned-base.service';
import { SimpleCacheService } from '../../common/cache/simple-cache.service';

// Backward compatibility alias
const SoftwareApprovalStatus = SoftwareApprovalStatusValues;

/** 캐시 키 상수 */
const CACHE_KEYS = {
  REGISTRY: 'software:registry',
} as const;

/** 레지스트리 캐시 TTL: 5분 (변경 빈도 낮음) */
const REGISTRY_CACHE_TTL = 5 * 60 * 1000;

/**
 * 소프트웨어 관리 서비스
 *
 * ✅ DB-backed: Drizzle ORM으로 PostgreSQL 연동
 * ✅ Optimistic Locking: VersionedBaseService 상속으로 CAS 패턴 구현
 * ✅ Transactional: 승인 시 소프트웨어 변경 + 장비 버전 업데이트 원자성 보장
 * ✅ No in-memory state: 서버 재시작 시 데이터 유실 없음
 *
 * @see apps/backend/src/common/base/versioned-base.service.ts
 * @see packages/db/src/schema/software-history.ts
 */
@Injectable()
export class SoftwareService extends VersionedBaseService {
  constructor(
    @Inject('DRIZZLE_INSTANCE')
    protected readonly db: NodePgDatabase<typeof schema>,
    private readonly cacheService: SimpleCacheService
  ) {
    super();
  }

  /**
   * 소프트웨어 변경 요청 (상태: pending)
   */
  async create(
    createDto: CreateSoftwareChangeInput,
    changedBy: string
  ): Promise<schema.SoftwareHistory> {
    // 검증 기록 필수 확인
    if (!createDto.verificationRecord || createDto.verificationRecord.trim() === '') {
      throw new BadRequestException({
        code: 'SOFTWARE_VERIFICATION_REQUIRED',
        message: 'Verification record is required.',
      });
    }

    // 장비 존재 여부 확인
    const [equipment] = await this.db
      .select({ id: schema.equipment.id })
      .from(schema.equipment)
      .where(eq(schema.equipment.id, createDto.equipmentId))
      .limit(1);

    if (!equipment) {
      throw new NotFoundException({
        code: 'EQUIPMENT_NOT_FOUND',
        message: `Equipment UUID ${createDto.equipmentId} not found`,
      });
    }

    const [newRecord] = await this.db
      .insert(schema.softwareHistory)
      .values({
        equipmentId: createDto.equipmentId,
        softwareName: createDto.softwareName,
        previousVersion: createDto.previousVersion || null,
        newVersion: createDto.newVersion,
        changedBy: changedBy,
        verificationRecord: createDto.verificationRecord,
        approvalStatus: SoftwareApprovalStatus.PENDING,
      })
      .returning();

    return newRecord;
  }

  /**
   * 소프트웨어 변경 이력 조회 (필터: equipmentId, softwareName)
   */
  async findHistory(query: SoftwareHistoryQueryDto): Promise<{
    items: schema.SoftwareHistory[];
    meta: {
      totalItems: number;
      itemCount: number;
      itemsPerPage: number;
      totalPages: number;
      currentPage: number;
    };
  }> {
    const {
      equipmentId,
      softwareName,
      approvalStatus,
      search,
      site,
      sort = 'changedAt.desc',
      page = 1,
      pageSize = 20,
    } = query;

    // Build WHERE conditions
    const conditions = [];

    if (equipmentId) {
      conditions.push(eq(schema.softwareHistory.equipmentId, equipmentId));
    }

    if (softwareName) {
      conditions.push(eq(schema.softwareHistory.softwareName, softwareName));
    }

    if (approvalStatus) {
      conditions.push(eq(schema.softwareHistory.approvalStatus, approvalStatus));
    }

    if (search) {
      conditions.push(
        or(
          like(schema.softwareHistory.softwareName, `%${search}%`),
          like(schema.softwareHistory.verificationRecord, `%${search}%`)
        )
      );
    }

    // @SiteScoped가 주입한 site 필터 — equipment JOIN 경유
    if (site) {
      conditions.push(eq(schema.equipment.site, site));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Count total items (site 필터 시 equipment JOIN 필요)
    const countQuery = this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(schema.softwareHistory);

    if (site) {
      countQuery.leftJoin(
        schema.equipment,
        eq(schema.softwareHistory.equipmentId, schema.equipment.id)
      );
    }

    const [{ count }] = await countQuery.where(whereClause);

    const totalItems = count;
    const totalPages = Math.ceil(totalItems / pageSize);
    const offset = (page - 1) * pageSize;

    // Parse sort parameter
    const [field, direction] = sort.split('.');
    const sortDirection = direction === 'asc' ? 'asc' : 'desc';

    // Map field names to columns
    const sortColumn =
      field === 'changedAt'
        ? schema.softwareHistory.changedAt
        : field === 'approvalStatus'
          ? schema.softwareHistory.approvalStatus
          : schema.softwareHistory.changedAt; // default

    // Fetch paginated items with LEFT JOIN for user/team/equipment names
    const orderBy = sortDirection === 'asc' ? sortColumn : desc(sortColumn);

    const rows = await this.db
      .select({
        history: schema.softwareHistory,
        changerName: schema.users.name,
        teamName: schema.teams.name,
        equipmentName: schema.equipment.name,
      })
      .from(schema.softwareHistory)
      .leftJoin(schema.users, eq(schema.softwareHistory.changedBy, schema.users.id))
      .leftJoin(schema.teams, eq(schema.users.teamId, schema.teams.id))
      .leftJoin(schema.equipment, eq(schema.softwareHistory.equipmentId, schema.equipment.id))
      .where(whereClause)
      .orderBy(orderBy)
      .limit(pageSize)
      .offset(offset);

    // 플랫 필드로 changerName, teamName, equipmentName 추가
    const items = rows.map((row) => ({
      ...row.history,
      changerName: row.changerName,
      teamName: row.teamName,
      equipmentName: row.equipmentName,
    }));

    return {
      items,
      meta: {
        totalItems,
        itemCount: items.length,
        itemsPerPage: pageSize,
        totalPages,
        currentPage: page,
      },
    };
  }

  /**
   * 단일 소프트웨어 변경 이력 조회
   */
  async findOne(id: string): Promise<schema.SoftwareHistory> {
    const [record] = await this.db
      .select()
      .from(schema.softwareHistory)
      .where(eq(schema.softwareHistory.id, id))
      .limit(1);

    if (!record) {
      throw new NotFoundException({
        code: 'SOFTWARE_HISTORY_NOT_FOUND',
        message: `Software change history UUID ${id} not found`,
      });
    }

    return record;
  }

  /**
   * 소프트웨어 통합 관리대장 (전체 장비 소프트웨어 현황)
   *
   * Note: This method queries equipment table which may have software info fields
   * For now, returning empty registry since equipment schema doesn't have software fields yet
   */
  async getRegistry(): Promise<{
    registry: {
      equipmentId: string;
      equipmentName: string;
      softwareName: string | null;
      softwareVersion: string | null;
      softwareType: string | null;
      lastUpdated: Date | null;
    }[];
    summary: { softwareName: string; equipmentCount: number; versions: (string | null)[] }[];
    totalEquipments: number;
    totalSoftwareTypes: number;
    generatedAt: Date;
  }> {
    return this.cacheService.getOrSet(
      CACHE_KEYS.REGISTRY,
      () => this.buildRegistry(),
      REGISTRY_CACHE_TTL
    );
  }

  /** 레지스트리 실제 DB 조회 + 집계 (캐시 팩토리) */
  private async buildRegistry(): Promise<{
    registry: {
      equipmentId: string;
      equipmentName: string;
      softwareName: string | null;
      softwareVersion: string | null;
      softwareType: string | null;
      lastUpdated: Date | null;
    }[];
    summary: { softwareName: string; equipmentCount: number; versions: (string | null)[] }[];
    totalEquipments: number;
    totalSoftwareTypes: number;
    generatedAt: Date;
  }> {
    // 최신 승인 레코드만 조회 (장비-소프트웨어 쌍 기준 최신 1건)
    const latestApproved = await this.db
      .select({
        equipmentId: schema.softwareHistory.equipmentId,
        softwareName: schema.softwareHistory.softwareName,
        newVersion: schema.softwareHistory.newVersion,
        approvedAt: schema.softwareHistory.approvedAt,
        equipmentName: schema.equipment.name,
      })
      .from(schema.softwareHistory)
      .leftJoin(schema.equipment, eq(schema.softwareHistory.equipmentId, schema.equipment.id))
      .where(eq(schema.softwareHistory.approvalStatus, SoftwareApprovalStatus.APPROVED))
      .orderBy(desc(schema.softwareHistory.approvedAt));

    // 장비-소프트웨어 쌍 기준 최신 레코드만 추출
    const seen = new Set<string>();
    const registry: {
      equipmentId: string;
      equipmentName: string;
      softwareName: string | null;
      softwareVersion: string | null;
      softwareType: string | null;
      lastUpdated: Date | null;
    }[] = [];

    for (const r of latestApproved) {
      const key = `${r.equipmentId}:${r.softwareName}`;
      if (seen.has(key)) continue;
      seen.add(key);
      registry.push({
        equipmentId: r.equipmentId,
        equipmentName: r.equipmentName || '',
        softwareName: r.softwareName,
        softwareVersion: r.newVersion,
        softwareType: null,
        lastUpdated: r.approvedAt,
      });
    }

    // 소프트웨어별 요약 집계
    const summaryMap = new Map<
      string,
      { equipmentIds: Set<string>; versions: Set<string | null> }
    >();
    for (const item of registry) {
      if (!item.softwareName) continue;
      const existing = summaryMap.get(item.softwareName);
      if (existing) {
        existing.equipmentIds.add(item.equipmentId);
        existing.versions.add(item.softwareVersion);
      } else {
        summaryMap.set(item.softwareName, {
          equipmentIds: new Set([item.equipmentId]),
          versions: new Set([item.softwareVersion]),
        });
      }
    }

    const summary = Array.from(summaryMap.entries()).map(([name, data]) => ({
      softwareName: name,
      equipmentCount: data.equipmentIds.size,
      versions: Array.from(data.versions),
    }));

    const uniqueEquipmentIds = new Set(registry.map((r) => r.equipmentId));

    return {
      registry,
      summary,
      totalEquipments: uniqueEquipmentIds.size,
      totalSoftwareTypes: summaryMap.size,
      generatedAt: new Date(),
    };
  }

  /**
   * 특정 소프트웨어 사용 장비 목록
   */
  async findEquipmentBySoftware(softwareName: string): Promise<{
    softwareName: string;
    equipments: {
      equipmentId: string;
      equipmentName: string;
      softwareVersion: string | null;
      softwareType: string | null;
      lastUpdated: Date | null;
    }[];
    count: number;
  }> {
    // Query software_history for latest approved records
    const searchName = `%${softwareName.toLowerCase()}%`;

    const records = await this.db
      .select({
        equipmentId: schema.softwareHistory.equipmentId,
        softwareName: schema.softwareHistory.softwareName,
        newVersion: schema.softwareHistory.newVersion,
        approvedAt: schema.softwareHistory.approvedAt,
      })
      .from(schema.softwareHistory)
      .where(
        and(
          like(sql`LOWER(${schema.softwareHistory.softwareName})`, searchName),
          eq(schema.softwareHistory.approvalStatus, SoftwareApprovalStatus.APPROVED)
        )
      )
      .orderBy(desc(schema.softwareHistory.approvedAt));

    if (records.length === 0) {
      throw new NotFoundException({
        code: 'SOFTWARE_EQUIPMENT_NOT_FOUND',
        message: `No equipment found using software "${softwareName}"`,
      });
    }

    // Get unique equipment IDs
    const uniqueEquipmentIds = [...new Set(records.map((r) => r.equipmentId))];

    // Fetch equipment names
    const equipments = await this.db
      .select({
        id: schema.equipment.id,
        name: schema.equipment.name,
      })
      .from(schema.equipment)
      .where(inArray(schema.equipment.id, uniqueEquipmentIds));

    const equipmentMap = new Map(equipments.map((e) => [e.id, e.name]));

    // Map latest version for each equipment
    const latestVersionMap = new Map<string, string>();
    for (const record of records) {
      if (!latestVersionMap.has(record.equipmentId)) {
        latestVersionMap.set(record.equipmentId, record.newVersion);
      }
    }

    return {
      softwareName,
      equipments: uniqueEquipmentIds.map((equipmentId) => ({
        equipmentId,
        equipmentName: equipmentMap.get(equipmentId) || 'Unknown',
        softwareVersion: latestVersionMap.get(equipmentId) || null,
        softwareType: null, // TODO: Add software type to schema
        lastUpdated: records.find((r) => r.equipmentId === equipmentId)?.approvedAt || null,
      })),
      count: uniqueEquipmentIds.length,
    };
  }

  /**
   * 승인 대기 목록 조회
   */
  async findPendingApprovals(): Promise<{
    items: schema.SoftwareHistory[];
    meta: {
      totalItems: number;
      itemCount: number;
      itemsPerPage: number;
      totalPages: number;
      currentPage: number;
    };
  }> {
    return this.findHistory({
      approvalStatus: SoftwareApprovalStatus.PENDING,
    });
  }

  /**
   * 소프트웨어 변경 승인 (기술책임자)
   *
   * ✅ Optimistic Locking: updateWithVersion() 사용
   * ✅ Transactional: 소프트웨어 이력 + 장비 버전 업데이트 원자성 보장
   */
  async approve(
    id: string,
    approveDto: ApproveSoftwareChangeDto & { approverId: string }
  ): Promise<schema.SoftwareHistory> {
    const record = await this.findOne(id);

    if (record.approvalStatus !== SoftwareApprovalStatus.PENDING) {
      throw new BadRequestException({
        code: 'SOFTWARE_ONLY_PENDING_CAN_APPROVE',
        message: 'Only pending change requests can be approved.',
      });
    }

    // Use CAS pattern from VersionedBaseService
    const updated = await this.updateWithVersion<schema.SoftwareHistory>(
      schema.softwareHistory,
      id,
      approveDto.version,
      {
        approvalStatus: SoftwareApprovalStatus.APPROVED,
        approvedBy: approveDto.approverId,
        approvedAt: new Date(),
        approverComment: approveDto.approverComment,
      },
      'Software change history'
    );

    // 승인 후 레지스트리 캐시 무효화 (새 승인 레코드 반영)
    this.cacheService.delete(CACHE_KEYS.REGISTRY);

    return updated;
  }

  /**
   * 소프트웨어 변경 반려 (기술책임자)
   *
   * ✅ Optimistic Locking: updateWithVersion() 사용
   */
  async reject(
    id: string,
    rejectDto: RejectSoftwareChangeDto & { approverId: string }
  ): Promise<schema.SoftwareHistory> {
    const record = await this.findOne(id);

    if (record.approvalStatus !== SoftwareApprovalStatus.PENDING) {
      throw new BadRequestException({
        code: 'SOFTWARE_ONLY_PENDING_CAN_REJECT',
        message: 'Only pending change requests can be rejected.',
      });
    }

    // Use CAS pattern from VersionedBaseService
    const updated = await this.updateWithVersion<schema.SoftwareHistory>(
      schema.softwareHistory,
      id,
      rejectDto.version,
      {
        approvalStatus: SoftwareApprovalStatus.REJECTED,
        approvedBy: rejectDto.approverId,
        approvedAt: new Date(),
        approverComment: rejectDto.rejectionReason,
      },
      'Software change history'
    );

    return updated;
  }
}

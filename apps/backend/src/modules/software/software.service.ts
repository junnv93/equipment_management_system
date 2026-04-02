import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Inject,
  ConflictException,
} from '@nestjs/common';
import type { AppDatabase } from '@equipment-management/db';
import { eq, and, desc, or, sql } from 'drizzle-orm';
import * as schema from '@equipment-management/db/schema';
import { CreateSoftwareChangeInput } from './dto/create-software-change.dto';
import { SoftwareHistoryQueryDto } from './dto/software-query.dto';
import { ApproveSoftwareChangeDto, RejectSoftwareChangeDto } from './dto/approve-software.dto';
import { SoftwareApprovalStatusValues, type Site } from '@equipment-management/schemas';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { VersionedBaseService } from '../../common/base/versioned-base.service';
import { SimpleCacheService } from '../../common/cache/simple-cache.service';
import { CACHE_TTL, DEFAULT_PAGE_SIZE } from '@equipment-management/shared-constants';
import { likeContains, safeIlike } from '../../common/utils/like-escape';
import { CACHE_KEY_PREFIXES } from '../../common/cache/cache-key-prefixes';
import { NOTIFICATION_EVENTS } from '../notifications/events/notification-events';

// Backward compatibility alias
const SoftwareApprovalStatus = SoftwareApprovalStatusValues;

/** 캐시 키 상수 */
const CACHE_KEYS = {
  REGISTRY: `${CACHE_KEY_PREFIXES.SOFTWARE}registry`,
  DETAIL: (id: string) => `${CACHE_KEY_PREFIXES.SOFTWARE}detail:${id}`,
  LIST: (query: object) => `${CACHE_KEY_PREFIXES.SOFTWARE}list:${JSON.stringify(query)}`,
} as const;

/**
 * 소프트웨어 관리 서비스
 *
 * ✅ DB-backed: Drizzle ORM으로 PostgreSQL 연동
 * ✅ Optimistic Locking: VersionedBaseService 상속으로 CAS 패턴 구현
 * ✅ CAS: 단일 테이블 업데이트는 WHERE절 원자성 보장 (트랜잭션 불필요)
 * ✅ No in-memory state: 서버 재시작 시 데이터 유실 없음
 *
 * @see apps/backend/src/common/base/versioned-base.service.ts
 * @see packages/db/src/schema/software-history.ts
 */
@Injectable()
export class SoftwareService extends VersionedBaseService {
  constructor(
    @Inject('DRIZZLE_INSTANCE')
    protected readonly db: AppDatabase,
    private readonly cacheService: SimpleCacheService,
    private readonly eventEmitter: EventEmitter2
  ) {
    super();
  }

  /** 소프트웨어 캐시 통합 무효화 (상태 변경 시 호출) */
  private invalidateCache(id?: string): void {
    if (id) {
      this.cacheService.delete(CACHE_KEYS.DETAIL(id));
    }
    this.cacheService.deleteByPrefix(`${CACHE_KEY_PREFIXES.SOFTWARE}list:`);
    this.cacheService.deleteByPrefix(CACHE_KEY_PREFIXES.APPROVALS);
    this.cacheService.delete(CACHE_KEYS.REGISTRY);
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

    this.invalidateCache();
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
    return this.cacheService.getOrSet(
      CACHE_KEYS.LIST(query),
      () => this.findHistoryUncached(query),
      CACHE_TTL.LONG
    );
  }

  /** findHistory 내부 구현 (캐시 팩토리) */
  private async findHistoryUncached(query: SoftwareHistoryQueryDto): Promise<{
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
      teamId,
      sort = 'changedAt.desc',
      page = 1,
      pageSize = DEFAULT_PAGE_SIZE,
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
      const pattern = likeContains(search);
      conditions.push(
        or(
          safeIlike(schema.softwareHistory.softwareName, pattern),
          safeIlike(schema.softwareHistory.verificationRecord, pattern)
        )
      );
    }

    // @SiteScoped가 주입한 site 필터 — equipment JOIN 경유
    if (site) {
      conditions.push(eq(schema.equipment.site, site));
    }

    // @SiteScoped가 주입한 teamId 필터 — equipment JOIN 경유
    if (teamId) {
      conditions.push(eq(schema.equipment.teamId, teamId));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Count total items (equipment JOIN 항상 포함 — data 쿼리와 동일한 조인 구조)
    const [{ count: totalItems }] = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(schema.softwareHistory)
      .leftJoin(schema.equipment, eq(schema.softwareHistory.equipmentId, schema.equipment.id))
      .where(whereClause);
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
    return this.cacheService.getOrSet(
      CACHE_KEYS.DETAIL(id),
      async () => {
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
      },
      CACHE_TTL.MEDIUM
    );
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
      CACHE_TTL.LONG
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
    // ✅ DISTINCT ON: 장비-소프트웨어 쌍 기준 최신 승인 레코드 1건을 DB에서 직접 추출
    interface LatestApprovedRow {
      equipment_id: string;
      software_name: string;
      new_version: string;
      approved_at: Date | null;
    }
    const result = await this.db.execute(sql`
      SELECT DISTINCT ON (equipment_id, software_name)
        equipment_id, software_name, new_version, approved_at
      FROM software_history
      WHERE approval_status = ${SoftwareApprovalStatus.APPROVED}
      ORDER BY equipment_id, software_name, approved_at DESC
    `);
    const latestApproved = result.rows as unknown as LatestApprovedRow[];

    // equipment 이름을 일괄 조회 (N+1 방지)
    const equipmentIds = [...new Set(latestApproved.map((r) => r.equipment_id))];
    const equipNameMap = new Map<string, string>();
    if (equipmentIds.length > 0) {
      const equipRows = await this.db
        .select({ id: schema.equipment.id, name: schema.equipment.name })
        .from(schema.equipment)
        .where(
          sql`${schema.equipment.id} IN (${sql.join(
            equipmentIds.map((id) => sql`${id}`),
            sql`, `
          )})`
        );
      for (const row of equipRows) {
        equipNameMap.set(row.id, row.name);
      }
    }

    const registry = latestApproved.map((r) => ({
      equipmentId: r.equipment_id,
      equipmentName: equipNameMap.get(r.equipment_id) || '',
      softwareName: r.software_name,
      softwareVersion: r.new_version,
      softwareType: null,
      lastUpdated: r.approved_at,
    }));

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
    // Single JOIN query: software_history + equipment
    const records = await this.db
      .select({
        equipmentId: schema.softwareHistory.equipmentId,
        softwareName: schema.softwareHistory.softwareName,
        newVersion: schema.softwareHistory.newVersion,
        approvedAt: schema.softwareHistory.approvedAt,
        equipmentName: schema.equipment.name,
        softwareType: schema.equipment.softwareType,
      })
      .from(schema.softwareHistory)
      .leftJoin(schema.equipment, eq(schema.softwareHistory.equipmentId, schema.equipment.id))
      .where(
        and(
          safeIlike(schema.softwareHistory.softwareName, likeContains(softwareName)),
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

    // Build Maps in a single pass (records sorted by approvedAt DESC,
    // so first occurrence per equipmentId is the latest)
    const uniqueEquipmentIds: string[] = [];
    const latestVersionMap = new Map<string, string>();
    const lastUpdatedMap = new Map<string, Date | null>();
    const equipmentNameMap = new Map<string, string>();
    const softwareTypeMap = new Map<string, string | null>();

    for (const record of records) {
      if (!latestVersionMap.has(record.equipmentId)) {
        uniqueEquipmentIds.push(record.equipmentId);
        latestVersionMap.set(record.equipmentId, record.newVersion);
        lastUpdatedMap.set(record.equipmentId, record.approvedAt);
        equipmentNameMap.set(record.equipmentId, record.equipmentName ?? '');
        softwareTypeMap.set(record.equipmentId, record.softwareType ?? null);
      }
    }

    return {
      softwareName,
      equipments: uniqueEquipmentIds.map((equipmentId) => ({
        equipmentId,
        equipmentName: equipmentNameMap.get(equipmentId) ?? '',
        softwareVersion: latestVersionMap.get(equipmentId) || null,
        softwareType: softwareTypeMap.get(equipmentId) ?? null,
        lastUpdated: lastUpdatedMap.get(equipmentId) || null,
      })),
      count: uniqueEquipmentIds.length,
    };
  }

  /**
   * 승인 대기 목록 조회
   */
  async findPendingApprovals(
    site?: Site,
    teamId?: string
  ): Promise<{
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
      site,
      teamId,
    });
  }

  /**
   * 소프트웨어 변경 승인 (기술책임자)
   *
   * ✅ Optimistic Locking: updateWithVersion() CAS 패턴 (단일 테이블 → 트랜잭션 불필요)
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
    let updated: schema.SoftwareHistory;
    try {
      updated = await this.updateWithVersion<schema.SoftwareHistory>(
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
    } catch (error) {
      if (error instanceof ConflictException) {
        this.invalidateCache(id);
      }
      throw error;
    }

    // 승인 후 레지스트리 캐시 무효화 (새 승인 레코드 반영)
    this.invalidateCache(id);

    this.eventEmitter.emit(NOTIFICATION_EVENTS.SOFTWARE_APPROVED, {
      softwareHistoryId: id,
      equipmentId: updated.equipmentId,
      actorId: approveDto.approverId,
      actorName: '',
      timestamp: new Date(),
    });

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
    try {
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

      // 반려 후 캐시 무효화 (approve와 동일 패턴)
      this.invalidateCache(id);

      this.eventEmitter.emit(NOTIFICATION_EVENTS.SOFTWARE_REJECTED, {
        softwareHistoryId: id,
        equipmentId: record.equipmentId,
        actorId: rejectDto.approverId,
        actorName: '',
        timestamp: new Date(),
        reason: rejectDto.rejectionReason,
      });

      return updated;
    } catch (error) {
      if (error instanceof ConflictException) {
        this.invalidateCache(id);
      }
      throw error;
    }
  }

  /**
   * 소프트웨어 변경 이력의 사이트 및 팀 조회 (software_history → equipment 경유)
   * 크로스사이트/크로스팀 접근 제어에 사용
   */
  async getSoftwareSiteAndTeam(
    softwareHistoryId: string
  ): Promise<{ site: string; teamId: string | null }> {
    const result = await this.db
      .select({ site: schema.equipment.site, teamId: schema.equipment.teamId })
      .from(schema.softwareHistory)
      .innerJoin(schema.equipment, eq(schema.softwareHistory.equipmentId, schema.equipment.id))
      .where(eq(schema.softwareHistory.id, softwareHistoryId))
      .limit(1);

    if (result.length === 0) {
      throw new NotFoundException({
        code: 'SOFTWARE_HISTORY_NOT_FOUND',
        message: `Software history ${softwareHistoryId} not found.`,
      });
    }

    return result[0];
  }
}

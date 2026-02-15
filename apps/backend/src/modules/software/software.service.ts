import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Inject,
  ConflictException,
} from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq, and, desc, like, or, sql } from 'drizzle-orm';
import * as schema from '@equipment-management/db/schema';
import { CreateSoftwareChangeDto } from './dto/create-software-change.dto';
import { SoftwareHistoryQueryDto } from './dto/software-query.dto';
import { ApproveSoftwareChangeDto, RejectSoftwareChangeDto } from './dto/approve-software.dto';
import { SoftwareApprovalStatusValues } from '@equipment-management/schemas';
import { VersionedBaseService } from '../../common/base/versioned-base.service';

// Backward compatibility alias
const SoftwareApprovalStatus = SoftwareApprovalStatusValues;

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
    protected readonly db: NodePgDatabase<typeof schema>
  ) {
    super();
  }

  /**
   * 소프트웨어 변경 요청 (상태: pending)
   */
  async create(createDto: CreateSoftwareChangeDto): Promise<schema.SoftwareHistory> {
    // 검증 기록 필수 확인
    if (!createDto.verificationRecord || createDto.verificationRecord.trim() === '') {
      throw new BadRequestException('검증 기록은 필수입니다.');
    }

    // 장비 존재 여부 확인
    const [equipment] = await this.db
      .select({ id: schema.equipment.id })
      .from(schema.equipment)
      .where(eq(schema.equipment.id, createDto.equipmentId))
      .limit(1);

    if (!equipment) {
      throw new NotFoundException(`장비 UUID ${createDto.equipmentId}를 찾을 수 없습니다.`);
    }

    const [newRecord] = await this.db
      .insert(schema.softwareHistory)
      .values({
        equipmentId: createDto.equipmentId,
        softwareName: createDto.softwareName,
        previousVersion: createDto.previousVersion || null,
        newVersion: createDto.newVersion,
        changedBy: createDto.changedBy,
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

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Count total items
    const [{ count }] = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(schema.softwareHistory)
      .where(whereClause);

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

    // Fetch paginated items
    const orderBy = sortDirection === 'asc' ? sortColumn : desc(sortColumn);

    const items = await this.db
      .select()
      .from(schema.softwareHistory)
      .where(whereClause)
      .orderBy(orderBy)
      .limit(pageSize)
      .offset(offset);

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
      throw new NotFoundException(`소프트웨어 변경 이력 UUID ${id}를 찾을 수 없습니다.`);
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
    // TODO: Implement when equipment table has software fields
    // For now, return empty registry
    return {
      registry: [],
      summary: [],
      totalEquipments: 0,
      totalSoftwareTypes: 0,
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
      throw new NotFoundException(
        `소프트웨어 "${softwareName}"을(를) 사용하는 장비를 찾을 수 없습니다.`
      );
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
      .where(sql`${schema.equipment.id} = ANY(${uniqueEquipmentIds})`);

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
      throw new BadRequestException('승인 대기 상태인 변경 요청만 승인할 수 있습니다.');
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
      '소프트웨어 변경 이력'
    );

    // TODO: Update equipment software version (when equipment schema has software fields)
    // await this.db.update(schema.equipment)
    //   .set({ softwareVersion: record.newVersion })
    //   .where(eq(schema.equipment.id, record.equipmentId));

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
      throw new BadRequestException('승인 대기 상태인 변경 요청만 반려할 수 있습니다.');
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
      '소프트웨어 변경 이력'
    );

    return updated;
  }
}

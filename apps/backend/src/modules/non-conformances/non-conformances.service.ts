import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Inject,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { eq, and, isNull, desc, asc, like, SQL, ne, sql } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '@equipment-management/db/schema';
import {
  nonConformances,
  type NonConformance,
} from '@equipment-management/db/schema/non-conformances';
import { equipment } from '@equipment-management/db/schema/equipment';
import { CreateNonConformanceDto } from './dto/create-non-conformance.dto';
import { UpdateNonConformanceDto } from './dto/update-non-conformance.dto';
import { CloseNonConformanceDto } from './dto/close-non-conformance.dto';
import { RejectCorrectionDto } from './dto/reject-correction.dto';
import { NonConformanceQueryDto, NonConformanceStatus } from './dto/non-conformance-query.dto';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { VersionedBaseService } from '../../common/base/versioned-base.service';
import { CacheInvalidationHelper } from '../../common/cache/cache-invalidation.helper';
import { SimpleCacheService } from '../../common/cache/simple-cache.service';
import { NOTIFICATION_EVENTS } from '../notifications/events/notification-events';

/**
 * 부적합 상태 전이 규칙 (State Machine)
 *
 * open → analyzing: 원인분석 시작
 * open → corrected: 즉시 조치 완료 (markCorrected)
 * analyzing → corrected: 조치 완료 (update status or markCorrected)
 * corrected → closed: 기술책임자 승인 종료
 * corrected → analyzing: 기술책임자 반려 (재작업 요청)
 */
const VALID_TRANSITIONS: Record<string, string[]> = {
  [NonConformanceStatus.OPEN]: [NonConformanceStatus.ANALYZING, NonConformanceStatus.CORRECTED],
  [NonConformanceStatus.ANALYZING]: [NonConformanceStatus.CORRECTED],
  [NonConformanceStatus.CORRECTED]: [NonConformanceStatus.CLOSED, NonConformanceStatus.ANALYZING],
  [NonConformanceStatus.CLOSED]: [], // 종료 상태 — 전이 불가
};

@Injectable()
export class NonConformancesService extends VersionedBaseService {
  private readonly logger = new Logger(NonConformancesService.name);

  private readonly CACHE_PREFIX = 'non-conformances';
  private readonly CACHE_TTL = 120_000; // 2분 (MEDIUM)

  constructor(
    @Inject('DRIZZLE_INSTANCE')
    protected readonly db: NodePgDatabase<typeof schema>,
    private readonly cacheInvalidationHelper: CacheInvalidationHelper,
    private readonly cacheService: SimpleCacheService,
    private readonly eventEmitter: EventEmitter2
  ) {
    super();
  }

  private buildCacheKey(type: string, id: string): string {
    return `${this.CACHE_PREFIX}:${type}:${id}`;
  }

  /**
   * 상태 전이 유효성 검증
   * @throws BadRequestException 허용되지 않는 전이인 경우
   */
  private validateTransition(currentStatus: string, targetStatus: string): void {
    const allowed = VALID_TRANSITIONS[currentStatus];
    if (!allowed || !allowed.includes(targetStatus)) {
      throw new BadRequestException(
        `상태 전이가 허용되지 않습니다: ${currentStatus} → ${targetStatus}. ` +
          `허용된 전이: ${currentStatus} → [${allowed?.join(', ') || '없음'}]`
      );
    }
  }

  /**
   * 부적합 등록 (장비 상태 자동 변경: non_conforming)
   */
  async create(createDto: CreateNonConformanceDto): Promise<NonConformance> {
    // ncType 필수 검증
    if (!createDto.ncType) {
      throw new BadRequestException('부적합 유형(ncType)은 필수입니다');
    }

    // 장비 존재 확인
    const equipmentResult = await this.db
      .select()
      .from(equipment)
      .where(eq(equipment.id, createDto.equipmentId))
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
          ncType: createDto.ncType,
          actionPlan: createDto.actionPlan,
          status: NonConformanceStatus.OPEN,
        })
        .returning();

      // 2. 장비 상태를 non_conforming으로 변경
      await tx
        .update(equipment)
        .set({
          status: 'non_conforming',
          updatedAt: new Date(),
        })
        .where(eq(equipment.id, createDto.equipmentId));

      return nonConformance;
    });

    // 캐시 무효화 (장비 상태 non_conforming으로 변경됨)
    await this.cacheInvalidationHelper
      .invalidateAfterNonConformanceCreation(createDto.equipmentId)
      .catch((err) =>
        this.logger.warn(`Cache invalidation failed after NC creation: ${err.message}`)
      );

    // 📢 알림 이벤트 발행 (부적합 등록)
    const equip = equipmentResult[0];
    this.eventEmitter.emit(NOTIFICATION_EVENTS.NC_CREATED, {
      ncId: result.id,
      equipmentId: createDto.equipmentId,
      equipmentName: equip.name ?? '',
      managementNumber: equip.managementNumber ?? '',
      reporterTeamId: equip.teamId ?? '',
      ncType: createDto.ncType,
      actorId: createDto.discoveredBy ?? '',
      actorName: '',
      timestamp: new Date(),
    });

    return result;
  }

  /**
   * 부적합 목록 조회 (필터: equipmentId, status) - with team relations
   */
  async findAll(query: NonConformanceQueryDto): Promise<{
    items: Array<
      NonConformance & {
        discoverer?: {
          id: string;
          name: string;
          email: string;
          team: { id: string; name: string } | null;
        } | null;
        corrector?: {
          id: string;
          name: string;
          email: string;
          team: { id: string; name: string } | null;
        } | null;
        closer?: {
          id: string;
          name: string;
          email: string;
          team: { id: string; name: string } | null;
        } | null;
        rejector?: {
          id: string;
          name: string;
          email: string;
          team: { id: string; name: string } | null;
        } | null;
      }
    >;
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
      status,
      site,
      search,
      sort = 'discoveryDate.desc',
      page = 1,
      pageSize = 20,
    } = query;

    // Use Drizzle relational query to include user→team relations
    const items = await this.db.query.nonConformances.findMany({
      where: (nc, { eq: eqFn, isNull: isNullFn, like: likeFn, and: andFn }) => {
        const conditions = [isNullFn(nc.deletedAt)];

        if (equipmentId) {
          conditions.push(eqFn(nc.equipmentId, equipmentId));
        }

        if (status) {
          conditions.push(eqFn(nc.status, status));
        }

        // 🔒 사이트 필터: 장비의 사이트로 부적합 격리
        if (site) {
          const siteEquipmentIds = sql`${nc.equipmentId} IN (SELECT id FROM equipment WHERE site = ${site})`;
          conditions.push(siteEquipmentIds);
        }

        if (search) {
          conditions.push(likeFn(nc.cause, `%${search}%`));
        }

        return andFn(...conditions);
      },
      with: {
        equipment: {
          columns: {
            id: true,
            name: true,
            managementNumber: true,
          },
        },
        discoverer: {
          columns: {
            id: true,
            name: true,
            email: true,
          },
          with: {
            team: true, // ← Critical: includes team relation
          },
        },
        corrector: {
          columns: {
            id: true,
            name: true,
            email: true,
          },
          with: {
            team: true, // ← Critical: includes team relation
          },
        },
        closer: {
          columns: {
            id: true,
            name: true,
            email: true,
          },
          with: {
            team: true, // ← Critical: includes team relation
          },
        },
        rejector: {
          columns: {
            id: true,
            name: true,
            email: true,
          },
          with: {
            team: true,
          },
        },
      },
      orderBy: (nc, { desc: descFn, asc: ascFn }) => {
        const [sortField, sortDirection] = sort.split('.');
        const isAsc = sortDirection === 'asc';

        switch (sortField) {
          case 'discoveryDate':
            return isAsc ? [ascFn(nc.discoveryDate)] : [descFn(nc.discoveryDate)];
          case 'status':
            return isAsc ? [ascFn(nc.status)] : [descFn(nc.status)];
          case 'createdAt':
            return isAsc ? [ascFn(nc.createdAt)] : [descFn(nc.createdAt)];
          case 'updatedAt':
            return isAsc ? [ascFn(nc.updatedAt)] : [descFn(nc.updatedAt)];
          default:
            return [descFn(nc.discoveryDate)];
        }
      },
      limit: pageSize,
      offset: (page - 1) * pageSize,
    });

    // Get total count for pagination
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

    const allItems = await this.db
      .select()
      .from(nonConformances)
      .where(and(...conditions));

    const totalItems = allItems.length;

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
  private getSortColumn(
    sortField: string
  ):
    | typeof nonConformances.discoveryDate
    | typeof nonConformances.status
    | typeof nonConformances.createdAt
    | typeof nonConformances.updatedAt {
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
   * 단일 부적합 조회 (cache-aside)
   */
  async findOne(id: string): Promise<NonConformance> {
    const cacheKey = this.buildCacheKey('detail', id);
    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        const [nonConformance] = await this.db
          .select()
          .from(nonConformances)
          .where(and(eq(nonConformances.id, id), isNull(nonConformances.deletedAt)));

        if (!nonConformance) {
          throw new NotFoundException(`부적합 ID ${id}를 찾을 수 없습니다.`);
        }

        return nonConformance;
      },
      this.CACHE_TTL
    );
  }

  /**
   * 장비별 열린 부적합 조회
   */
  async findOpenByEquipment(equipmentId: string): Promise<NonConformance[]> {
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
  async update(id: string, updateDto: UpdateNonConformanceDto): Promise<NonConformance> {
    const nonConformance = await this.findOne(id);

    // 상태 변경이 요청된 경우 중앙화된 전이 검증
    if (updateDto.status && updateDto.status !== nonConformance.status) {
      this.validateTransition(nonConformance.status, updateDto.status);
    } else if (nonConformance.status === NonConformanceStatus.CLOSED) {
      throw new BadRequestException('종료된 부적합은 수정할 수 없습니다.');
    }

    // version은 CAS용이므로 SET 절에서 제외
    const { version, ...updateFields } = updateDto;

    try {
      const updated = await this.updateWithVersion<NonConformance>(
        nonConformances,
        id,
        version,
        updateFields,
        '부적합'
      );

      // 캐시 무효화: detail 캐시 삭제
      this.cacheService.delete(this.buildCacheKey('detail', id));

      return updated;
    } catch (error) {
      // CAS 실패 시 stale cache 방지
      if (error instanceof ConflictException) {
        this.cacheService.delete(this.buildCacheKey('detail', id));
      }
      throw error;
    }
  }

  /**
   * 부적합 종료 (기술책임자)
   * 장비 상태 복원: available
   */
  async close(
    id: string,
    closeDto: CloseNonConformanceDto,
    closedBy: string
  ): Promise<NonConformance> {
    const nonConformance = await this.findOne(id);

    // 중앙화된 상태 전이 검증 (corrected → closed)
    this.validateTransition(nonConformance.status, NonConformanceStatus.CLOSED);

    // damage/malfunction 유형은 수리 기록 필수 검증
    if (this.requiresRepair(nonConformance.ncType as string) && !nonConformance.repairHistoryId) {
      throw new BadRequestException('손상/오작동 유형은 수리 기록이 필요합니다');
    }

    // CAS + 트랜잭션으로 부적합 종료 + 장비 상태 복원
    // 트랜잭션 내부이므로 updateWithVersion() 직접 사용 불가 (tx 컨텍스트)
    // → 동일한 404/409 분기 패턴을 수동 적용
    let result: { updated: NonConformance; equipmentStatusRestored: boolean };
    try {
      result = await this.db.transaction(async (tx) => {
        // 1. 부적합 종료 (CAS: version 검증)
        const [updated] = await tx
          .update(nonConformances)
          .set({
            status: NonConformanceStatus.CLOSED,
            closedBy,
            closedAt: new Date(),
            closureNotes: closeDto.closureNotes,
            version: sql`version + 1`,
            updatedAt: new Date(),
          } as Record<string, unknown>)
          .where(and(eq(nonConformances.id, id), eq(nonConformances.version, closeDto.version)))
          .returning();

        if (!updated) {
          // 404 vs 409 구분 (updateWithVersion 패턴)
          const [existing] = await tx
            .select({ id: nonConformances.id, version: nonConformances.version })
            .from(nonConformances)
            .where(eq(nonConformances.id, id))
            .limit(1);

          if (!existing) {
            throw new NotFoundException(`부적합 UUID ${id}를 찾을 수 없습니다.`);
          }

          throw new ConflictException({
            message: '다른 사용자가 이미 수정했습니다. 페이지를 새로고침하세요.',
            code: 'VERSION_CONFLICT',
            currentVersion: existing.version,
            expectedVersion: closeDto.version,
          });
        }

        // 2. 해당 장비에 다른 열린 부적합(closed가 아닌 모든 상태)이 있는지 확인
        const otherOpenNonConformances = await tx
          .select()
          .from(nonConformances)
          .where(
            and(
              eq(nonConformances.equipmentId, nonConformance.equipmentId),
              isNull(nonConformances.deletedAt),
              ne(nonConformances.status, NonConformanceStatus.CLOSED),
              ne(nonConformances.id, id)
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
            })
            .where(eq(equipment.id, nonConformance.equipmentId));
        }

        return { updated, equipmentStatusRestored: otherOpenNonConformances.length === 0 };
      });
    } catch (error) {
      // CAS 실패 시 stale cache 방지
      if (error instanceof ConflictException) {
        this.cacheService.delete(this.buildCacheKey('detail', id));
      }
      throw error;
    }

    // 성공 시 detail 캐시 삭제
    this.cacheService.delete(this.buildCacheKey('detail', id));

    // 캐시 무효화 (장비 상태가 available로 복원되었으면 equipmentStatusChanged=true)
    await this.cacheInvalidationHelper
      .invalidateAfterNonConformanceStatusChange(
        nonConformance.equipmentId,
        result.equipmentStatusRestored
      )
      .catch((err) => this.logger.warn(`Cache invalidation failed after NC close: ${err.message}`));

    // 📢 알림 이벤트 발행 (부적합 종료)
    this.eventEmitter.emit(NOTIFICATION_EVENTS.NC_CLOSED, {
      ncId: id,
      equipmentId: nonConformance.equipmentId,
      equipmentName: '',
      managementNumber: '',
      reporterTeamId: '',
      actorId: closedBy,
      actorName: '',
      timestamp: new Date(),
    });

    return result.updated;
  }

  /**
   * 부적합 조치 반려 (기술책임자)
   * corrected → analyzing 상태로 되돌림 (재작업 요청)
   */
  async rejectCorrection(
    id: string,
    dto: RejectCorrectionDto,
    rejectedBy: string
  ): Promise<NonConformance> {
    const nonConformance = await this.findOne(id);

    // 중앙화된 상태 전이 검증
    this.validateTransition(nonConformance.status, NonConformanceStatus.ANALYZING);

    try {
      const updated = await this.updateWithVersion<NonConformance>(
        nonConformances,
        id,
        dto.version,
        {
          status: NonConformanceStatus.ANALYZING,
          rejectedBy,
          rejectedAt: new Date(),
          rejectionReason: dto.rejectionReason,
        },
        '부적합'
      );

      // 성공 시 detail 캐시 삭제
      this.cacheService.delete(this.buildCacheKey('detail', id));

      // 캐시 무효화 (장비 상태는 변경되지 않음 — non_conforming 유지)
      await this.cacheInvalidationHelper
        .invalidateAfterNonConformanceStatusChange(nonConformance.equipmentId, false)
        .catch((err) =>
          this.logger.warn(`Cache invalidation failed after NC rejection: ${err.message}`)
        );

      // 📢 알림 이벤트 발행 (조치 반려)
      this.eventEmitter.emit(NOTIFICATION_EVENTS.NC_CORRECTION_REJECTED, {
        ncId: id,
        equipmentId: nonConformance.equipmentId,
        equipmentName: '',
        managementNumber: '',
        reporterTeamId: '',
        reason: dto.rejectionReason,
        actorId: rejectedBy,
        actorName: '',
        timestamp: new Date(),
      });

      return updated;
    } catch (error) {
      // CAS 실패 시 stale cache 방지
      if (error instanceof ConflictException) {
        this.cacheService.delete(this.buildCacheKey('detail', id));
      }
      throw error;
    }
  }

  /**
   * 소프트 삭제
   */
  async remove(id: string): Promise<{ id: string; deleted: boolean }> {
    await this.findOne(id);

    await this.db
      .update(nonConformances)
      .set({
        deletedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(nonConformances.id, id));

    // detail 캐시 무효화
    this.cacheService.delete(this.buildCacheKey('detail', id));

    return { id, deleted: true };
  }

  /**
   * 수리 기록을 부적합에 연결 (1:1 관계)
   * RepairHistoryService에서 호출됨
   */
  async linkRepair(ncId: string, repairId: string): Promise<void> {
    // 부적합 존재 확인
    const nc = await this.findOne(ncId);

    if (nc.status === NonConformanceStatus.CLOSED) {
      throw new BadRequestException('종료된 부적합에는 수리를 연결할 수 없습니다');
    }

    if (nc.repairHistoryId) {
      throw new BadRequestException('이미 수리 기록이 연결되어 있습니다 (1:1 관계)');
    }

    // 연결
    await this.db
      .update(nonConformances)
      .set({
        repairHistoryId: repairId,
        resolutionType: 'repair',
        updatedAt: new Date(),
      })
      .where(eq(nonConformances.id, ncId));

    // detail 캐시 무효화
    this.cacheService.delete(this.buildCacheKey('detail', ncId));
  }

  /**
   * 부적합을 'corrected' 상태로 변경
   * 수리 완료 시 자동 호출됨
   */
  async markCorrected(
    id: string,
    correctionData: {
      correctionContent: string;
      correctionDate: Date;
      correctedBy: string;
    }
  ): Promise<void> {
    const nc = await this.findOne(id);

    // 중앙화된 상태 전이 검증 (open/analyzing → corrected)
    this.validateTransition(nc.status, NonConformanceStatus.CORRECTED);

    // damage/malfunction 유형은 수리 연결 필수
    if (this.requiresRepair(nc.ncType as string) && !nc.repairHistoryId) {
      throw new BadRequestException(`${nc.ncType} 유형은 수리 기록이 필요합니다`);
    }

    await this.db
      .update(nonConformances)
      .set({
        status: NonConformanceStatus.CORRECTED,
        correctionContent: correctionData.correctionContent,
        correctionDate: correctionData.correctionDate.toISOString().split('T')[0],
        correctedBy: correctionData.correctedBy,
        updatedAt: new Date(),
      })
      .where(eq(nonConformances.id, id));

    // detail 캐시 무효화
    this.cacheService.delete(this.buildCacheKey('detail', id));

    // 📢 알림 이벤트 발행 (조치 완료 — 승인 요청)
    this.eventEmitter.emit(NOTIFICATION_EVENTS.NC_CORRECTED, {
      ncId: id,
      equipmentId: nc.equipmentId,
      equipmentName: '',
      managementNumber: '',
      reporterTeamId: '',
      actorId: correctionData.correctedBy,
      actorName: '',
      timestamp: new Date(),
    });
  }

  /**
   * 수리 ID로 연결된 부적합 찾기
   */
  async findByRepairId(repairId: string): Promise<NonConformance> {
    const results = await this.db
      .select()
      .from(nonConformances)
      .where(and(eq(nonConformances.repairHistoryId, repairId), isNull(nonConformances.deletedAt)))
      .limit(1);

    return results[0] || null;
  }

  /**
   * 부적합 유형이 수리를 필요로 하는지 확인
   */
  private requiresRepair(ncType: string): boolean {
    return ['damage', 'malfunction'].includes(ncType);
  }
}

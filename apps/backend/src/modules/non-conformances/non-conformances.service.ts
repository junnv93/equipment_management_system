import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Inject,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { eq, and, isNull, SQL, ne, sql, or, notInArray, isNotNull } from 'drizzle-orm';
import type { AppDatabase } from '@equipment-management/db';
import {
  nonConformances,
  type NonConformance,
} from '@equipment-management/db/schema/non-conformances';
import { equipment } from '@equipment-management/db/schema/equipment';
import { CreateNonConformanceDto } from './dto/create-non-conformance.dto';
import { UpdateNonConformanceDto } from './dto/update-non-conformance.dto';
import { CloseNonConformanceDto } from './dto/close-non-conformance.dto';
import { RejectCorrectionDto } from './dto/reject-correction.dto';
import { NonConformanceQueryDto } from './dto/non-conformance-query.dto';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { VersionedBaseService } from '../../common/base/versioned-base.service';
import { CacheInvalidationHelper } from '../../common/cache/cache-invalidation.helper';
import { SimpleCacheService } from '../../common/cache/simple-cache.service';
import { CACHE_KEY_PREFIXES } from '../../common/cache/cache-key-prefixes';
import { CACHE_TTL, DEFAULT_PAGE_SIZE } from '@equipment-management/shared-constants';
import { NOTIFICATION_EVENTS } from '../notifications/events/notification-events';
import { likeContains, safeIlike } from '../../common/utils/like-escape';
import { equipmentBelongsToSite, equipmentBelongsToTeam } from '../../common/utils/site-filter';
import {
  EquipmentStatusEnum,
  NonConformanceStatusValues as NonConformanceStatus,
  type NonConformanceStatus as NonConformanceStatusType,
  type NonConformanceType,
  REPAIR_REQUIRING_NC_TYPES,
  NC_CORRECTION_PREREQUISITES,
  getNCPrerequisite,
  getNCTypesRequiring,
  ResolutionTypeEnum,
} from '@equipment-management/schemas';
import type { NonConformanceDetail } from './non-conformances.types';

/**
 * 부적합 상태 전이 규칙 (State Machine)
 *
 * 3단계 워크플로우: open → corrected → closed
 * open → corrected: 조치 완료
 * corrected → closed: 기술책임자 승인 종료
 * corrected → open: 기술책임자 반려 (처음으로 되돌림)
 */
const VALID_TRANSITIONS: Record<string, string[]> = {
  [NonConformanceStatus.OPEN]: [NonConformanceStatus.CORRECTED],
  [NonConformanceStatus.CORRECTED]: [NonConformanceStatus.CLOSED, NonConformanceStatus.OPEN],
  [NonConformanceStatus.CLOSED]: [], // 종료 상태 — 전이 불가
};

@Injectable()
export class NonConformancesService extends VersionedBaseService {
  private readonly logger = new Logger(NonConformancesService.name);

  private readonly CACHE_PREFIX = CACHE_KEY_PREFIXES.NON_CONFORMANCES;

  constructor(
    @Inject('DRIZZLE_INSTANCE')
    protected readonly db: AppDatabase,
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
   * 목록 조회 공통 필터 조건 빌더 (data 쿼리 + count 쿼리 SSOT)
   * → 필터 조건이 한 곳에서만 정의되어 data/count 불일치 방지
   */
  private buildListConditions(params: {
    equipmentId?: string;
    status?: string;
    ncType?: string;
    search?: string;
    pendingClose?: boolean;
  }): SQL[] {
    const conditions: SQL[] = [isNull(nonConformances.deletedAt)];

    if (params.equipmentId) {
      conditions.push(eq(nonConformances.equipmentId, params.equipmentId));
    }
    if (params.status) {
      conditions.push(eq(nonConformances.status, params.status as NonConformanceStatusType));
    }
    if (params.ncType) {
      conditions.push(eq(nonConformances.ncType, params.ncType as NonConformanceType));
    }
    if (params.search) {
      conditions.push(safeIlike(nonConformances.cause, likeContains(params.search)));
    }
    // 종료 승인 대기: 전제조건이 충족된 NC만 표시
    // NC_CORRECTION_PREREQUISITES SSOT 기반: repair → repairHistoryId, recalibration → calibrationId
    if (params.pendingClose) {
      const repairTypes = getNCTypesRequiring('repair');
      const recalibrationTypes = getNCTypesRequiring('recalibration');
      conditions.push(
        and(
          // repair 전제조건: 해당 유형이 아니거나 수리 이력 있음
          or(
            notInArray(nonConformances.ncType, [...repairTypes]),
            isNotNull(nonConformances.repairHistoryId)
          )!,
          // recalibration 전제조건: 해당 유형이 아니거나 교정 기록 있음
          or(
            notInArray(nonConformances.ncType, [...recalibrationTypes]),
            isNotNull(nonConformances.calibrationId)
          )!
        )!
      );
    }

    return conditions;
  }

  /**
   * 상태 전이 유효성 검증
   * @throws BadRequestException 허용되지 않는 전이인 경우
   */
  private validateTransition(currentStatus: string, targetStatus: string): void {
    const allowed = VALID_TRANSITIONS[currentStatus];
    if (!allowed || !allowed.includes(targetStatus)) {
      throw new BadRequestException({
        code: 'NC_INVALID_TRANSITION',
        message: `Status transition not allowed: ${currentStatus} → ${targetStatus}. Allowed: ${currentStatus} → [${allowed?.join(', ') || 'none'}]`,
      });
    }
  }

  /**
   * 부적합 등록 (장비 상태 자동 변경: non_conforming)
   */
  async create(createDto: CreateNonConformanceDto): Promise<NonConformance> {
    // ncType 필수 검증
    if (!createDto.ncType) {
      throw new BadRequestException({
        code: 'NC_TYPE_REQUIRED',
        message: 'Non-conformance type (ncType) is required',
      });
    }

    // 장비 존재 확인
    const equipmentResult = await this.db
      .select()
      .from(equipment)
      .where(eq(equipment.id, createDto.equipmentId))
      .limit(1);

    if (equipmentResult.length === 0) {
      throw new NotFoundException({
        code: 'EQUIPMENT_NOT_FOUND',
        message: `Equipment UUID ${createDto.equipmentId} not found`,
      });
    }

    // 이미 부적합 상태인지 확인
    if (equipmentResult[0].status === EquipmentStatusEnum.enum.non_conforming) {
      throw new BadRequestException({
        code: 'NC_EQUIPMENT_ALREADY_NON_CONFORMING',
        message: 'Equipment is already in non-conforming status.',
      });
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

      // 2. 장비 상태를 non_conforming으로 변경 (version bump: close와 일관성 유지)
      await tx
        .update(equipment)
        .set({
          status: EquipmentStatusEnum.enum.non_conforming,
          version: sql`version + 1`,
          updatedAt: new Date(),
        } as Record<string, unknown>)
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
      ncType,
      site,
      teamId,
      search,
      pendingClose = false,
      sort = 'discoveryDate.desc',
      includeSummary = false,
      page = 1,
      pageSize = DEFAULT_PAGE_SIZE,
    } = query;

    // buildListConditions()로 data/count 쿼리 필터 일관성 보장
    const filterParams = { equipmentId, status, ncType, search, pendingClose };

    // site 필터: equipmentBelongsToSite() 서브쿼리로 단일 쿼리 처리
    // 별도 사전 조회 없이 DB 레벨에서 IN (SELECT ...) 적용

    // Use Drizzle relational query to include user→team relations
    const items = await this.db.query.nonConformances.findMany({
      where: () => {
        const conditions = this.buildListConditions(filterParams);
        if (site) {
          conditions.push(equipmentBelongsToSite(nonConformances.equipmentId, site));
        }
        if (teamId) {
          conditions.push(equipmentBelongsToTeam(nonConformances.equipmentId, teamId));
        }
        return and(...conditions);
      },
      with: {
        equipment: {
          columns: {
            id: true,
            name: true,
            managementNumber: true,
          },
        },
        repairHistory: {
          columns: {
            id: true,
            repairDate: true,
            repairDescription: true,
            repairResult: true,
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

    // Count 쿼리 — buildListConditions()로 data 쿼리와 동일한 필터 보장
    // site/teamId 필터 시 innerJoin으로 equipment 조건 적용
    const countConditions = this.buildListConditions(filterParams);
    if (site) {
      countConditions.push(eq(equipment.site, site));
    }
    if (teamId) {
      countConditions.push(eq(equipment.teamId, teamId));
    }

    const countQuery = this.db.select({ total: sql<number>`count(*)::int` }).from(nonConformances);
    if (site || teamId) {
      countQuery.innerJoin(equipment, eq(nonConformances.equipmentId, equipment.id));
    }
    const [{ total: totalItems }] = await countQuery.where(and(...countConditions));

    // Summary 집계 (includeSummary=true일 때만)
    // ✅ status 필터 제외한 기본 조건으로 전체 상태별 건수 반환
    let summary: Record<string, number> | undefined;
    if (includeSummary) {
      const summaryConditions = this.buildListConditions({
        equipmentId,
        ncType,
        search,
      });
      if (site) {
        summaryConditions.push(eq(equipment.site, site));
      }
      if (teamId) {
        summaryConditions.push(eq(equipment.teamId, teamId));
      }

      const summaryQuery = this.db
        .select({
          status: nonConformances.status,
          count: sql<number>`count(*)::int`,
        })
        .from(nonConformances);
      if (site || teamId) {
        summaryQuery.innerJoin(equipment, eq(nonConformances.equipmentId, equipment.id));
      }
      const summaryRows = await summaryQuery
        .where(and(...summaryConditions))
        .groupBy(nonConformances.status);

      summary = {
        [NonConformanceStatus.OPEN]: 0,
        [NonConformanceStatus.CORRECTED]: 0,
        [NonConformanceStatus.CLOSED]: 0,
      };
      for (const row of summaryRows) {
        summary[row.status] = row.count;
      }
    }

    return {
      items,
      meta: {
        totalItems,
        itemCount: items.length,
        itemsPerPage: pageSize,
        totalPages: Math.ceil(totalItems / pageSize),
        currentPage: page,
      },
      ...(summary && { summary }),
    };
  }

  /**
   * 장비의 사이트 조회 (크로스사이트 인가 체크용)
   *
   * create, findOpenByEquipment 등 equipmentId만 있는 엔드포인트에서 사용.
   */
  async getEquipmentSiteAndTeam(
    equipmentId: string
  ): Promise<{ site: string; teamId: string | null }> {
    const result = await this.db
      .select({ site: equipment.site, teamId: equipment.teamId })
      .from(equipment)
      .where(eq(equipment.id, equipmentId))
      .limit(1);

    if (result.length === 0) {
      throw new NotFoundException({
        code: 'EQUIPMENT_NOT_FOUND',
        message: `Equipment UUID ${equipmentId} not found`,
      });
    }

    return result[0];
  }

  /**
   * 경량 부적합 조회 (인가 체크용 — JOIN/캐시 없음)
   *
   * 컨트롤러의 enforceSiteAccess()에서 사용.
   * equipment.site를 함께 반환하여 크로스사이트 검증에 활용.
   */
  async findOneBasic(id: string): Promise<{
    id: string;
    equipmentId: string;
    equipmentSite: string;
    equipmentTeamId: string | null;
  }> {
    const result = await this.db
      .select({
        id: nonConformances.id,
        equipmentId: nonConformances.equipmentId,
        equipmentSite: equipment.site,
        equipmentTeamId: equipment.teamId,
      })
      .from(nonConformances)
      .innerJoin(equipment, eq(nonConformances.equipmentId, equipment.id))
      .where(and(eq(nonConformances.id, id), isNull(nonConformances.deletedAt)))
      .limit(1);

    if (result.length === 0) {
      throw new NotFoundException({
        code: 'NON_CONFORMANCE_NOT_FOUND',
        message: `Non-conformance UUID ${id} not found`,
      });
    }

    return result[0];
  }

  /**
   * 단일 부적합 조회 (cache-aside)
   */
  async findOne(id: string): Promise<NonConformanceDetail> {
    const cacheKey = this.buildCacheKey('detail', id);
    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        const nonConformance = await this.db.query.nonConformances.findFirst({
          where: and(eq(nonConformances.id, id), isNull(nonConformances.deletedAt)),
          with: {
            equipment: {
              columns: { id: true, name: true, managementNumber: true },
            },
            repairHistory: {
              columns: {
                id: true,
                repairDate: true,
                repairDescription: true,
                repairResult: true,
              },
            },
            discoverer: {
              columns: { id: true, name: true, email: true },
              with: { team: true },
            },
            corrector: {
              columns: { id: true, name: true, email: true },
              with: { team: true },
            },
            closer: {
              columns: { id: true, name: true, email: true },
              with: { team: true },
            },
            rejector: {
              columns: { id: true, name: true, email: true },
              with: { team: true },
            },
          },
        });

        if (!nonConformance) {
          throw new NotFoundException({
            code: 'NC_NOT_FOUND',
            message: `Non-conformance ID ${id} not found`,
          });
        }

        return nonConformance;
      },
      CACHE_TTL.MEDIUM
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
    const [row] = await this.db
      .select({ exists: sql<number>`1` })
      .from(nonConformances)
      .where(
        and(
          eq(nonConformances.equipmentId, equipmentId),
          isNull(nonConformances.deletedAt),
          eq(nonConformances.status, NonConformanceStatus.OPEN)
        )
      )
      .limit(1);

    return !!row;
  }

  /**
   * 원인분석/조치 기록 업데이트
   */
  async update(id: string, updateDto: UpdateNonConformanceDto): Promise<NonConformance> {
    const nonConformance = await this.findOne(id);

    // 상태 변경이 요청된 경우 중앙화된 전이 검증
    if (updateDto.status && updateDto.status !== nonConformance.status) {
      this.validateTransition(nonConformance.status, updateDto.status);

      // corrected 전이 시 전제조건 검증 (SSOT: NC_CORRECTION_PREREQUISITES)
      if (updateDto.status === NonConformanceStatus.CORRECTED) {
        this.validateCorrectionPrerequisite(nonConformance);
      }
    } else if (nonConformance.status === NonConformanceStatus.CLOSED) {
      throw new BadRequestException({
        code: 'NC_CLOSED_CANNOT_UPDATE',
        message: 'Closed non-conformances cannot be updated.',
      });
    }

    // version은 CAS용이므로 SET 절에서 제외
    const { version, ...updateFields } = updateDto;

    const statusChanged = updateDto.status && updateDto.status !== nonConformance.status;

    try {
      const updated = await this.updateWithVersion<NonConformance>(
        nonConformances,
        id,
        version,
        updateFields,
        'Non-conformance'
      );

      // 캐시 무효화: detail 캐시 삭제
      this.cacheService.delete(this.buildCacheKey('detail', id));

      // 상태 변경 시 교차 엔티티 캐시 무효화 (대시보드, 장비 상세 등)
      if (statusChanged) {
        await this.cacheInvalidationHelper
          .invalidateAfterNonConformanceStatusChange(nonConformance.equipmentId, false)
          .catch((err) =>
            this.logger.warn(`Cache invalidation failed after NC update: ${err.message}`)
          );
      }

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

    // 전제조건 검증 (SSOT: NC_CORRECTION_PREREQUISITES)
    this.validateCorrectionPrerequisite(nonConformance);

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
            throw new NotFoundException({
              code: 'NC_NOT_FOUND',
              message: `Non-conformance UUID ${id} not found`,
            });
          }

          throw new ConflictException({
            message: 'This record has been modified by another user. Please refresh the page.',
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

        // 다른 열린 부적합이 없으면 장비 상태 복원 (CAS: version 검증)
        let equipmentStatusRestored = false;
        if (otherOpenNonConformances.length === 0) {
          // 장비 현재 version 조회 (CAS용)
          const [currentEquipment] = await tx
            .select({ id: equipment.id, version: equipment.version, status: equipment.status })
            .from(equipment)
            .where(eq(equipment.id, nonConformance.equipmentId))
            .limit(1);

          if (
            currentEquipment &&
            currentEquipment.status === EquipmentStatusEnum.enum.non_conforming
          ) {
            const [updatedEquipment] = await tx
              .update(equipment)
              .set({
                status: EquipmentStatusEnum.enum.available,
                version: sql`version + 1`,
                updatedAt: new Date(),
              })
              .where(
                and(
                  eq(equipment.id, nonConformance.equipmentId),
                  eq(equipment.version, currentEquipment.version)
                )
              )
              .returning({ id: equipment.id });

            if (!updatedEquipment) {
              throw new ConflictException({
                message:
                  'Equipment has been modified by another user. Please refresh and try again.',
                code: 'VERSION_CONFLICT',
              });
            }
            equipmentStatusRestored = true;
          }
        }

        return { updated, equipmentStatusRestored };
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
   * corrected → open 상태로 되돌림 (재작업 요청)
   */
  async rejectCorrection(
    id: string,
    dto: RejectCorrectionDto,
    rejectedBy: string
  ): Promise<NonConformance> {
    const nonConformance = await this.findOne(id);

    // 중앙화된 상태 전이 검증
    this.validateTransition(nonConformance.status, NonConformanceStatus.OPEN);

    try {
      const updated = await this.updateWithVersion<NonConformance>(
        nonConformances,
        id,
        dto.version,
        {
          status: NonConformanceStatus.OPEN,
          rejectedBy,
          rejectedAt: new Date(),
          rejectionReason: dto.rejectionReason,
        },
        'Non-conformance'
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
   *
   * CAS: findOne에서 읽은 version으로 updateWithVersion 적용
   * → 다른 경로(update, close, rejectCorrection)와의 동시 수정 충돌 감지
   */
  async linkRepair(ncId: string, repairId: string): Promise<void> {
    const nc = await this.findOne(ncId);

    if (nc.status === NonConformanceStatus.CLOSED) {
      throw new BadRequestException({
        code: 'NC_CLOSED_CANNOT_LINK_REPAIR',
        message: 'Cannot link repair to a closed non-conformance',
      });
    }

    if (nc.repairHistoryId) {
      throw new BadRequestException({
        code: 'NC_REPAIR_ALREADY_LINKED',
        message: 'A repair record is already linked (1:1 relationship)',
      });
    }

    try {
      await this.updateWithVersion<NonConformance>(
        nonConformances,
        ncId,
        nc.version,
        {
          repairHistoryId: repairId,
          resolutionType: ResolutionTypeEnum.enum.repair,
        },
        'Non-conformance',
        undefined,
        'NC_NOT_FOUND'
      );

      this.cacheService.delete(this.buildCacheKey('detail', ncId));
    } catch (error) {
      if (error instanceof ConflictException) {
        this.cacheService.delete(this.buildCacheKey('detail', ncId));
      }
      throw error;
    }
  }

  /**
   * 부적합을 'corrected' 상태로 변경
   * 수리 완료 시 자동 호출됨
   *
   * CAS: findOne에서 읽은 version으로 updateWithVersion 적용
   * → 다른 경로(update, linkRepair)와의 동시 수정 충돌 감지
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

    // 중앙화된 상태 전이 검증 (open → corrected)
    this.validateTransition(nc.status, NonConformanceStatus.CORRECTED);

    // 전제조건 검증 (SSOT: NC_CORRECTION_PREREQUISITES)
    this.validateCorrectionPrerequisite(nc);

    try {
      await this.updateWithVersion<NonConformance>(
        nonConformances,
        id,
        nc.version,
        {
          status: NonConformanceStatus.CORRECTED,
          correctionContent: correctionData.correctionContent,
          correctionDate: correctionData.correctionDate.toISOString().split('T')[0],
          correctedBy: correctionData.correctedBy,
        },
        'Non-conformance',
        undefined,
        'NC_NOT_FOUND'
      );

      this.cacheService.delete(this.buildCacheKey('detail', id));
    } catch (error) {
      if (error instanceof ConflictException) {
        this.cacheService.delete(this.buildCacheKey('detail', id));
      }
      throw error;
    }

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
   * @deprecated validateCorrectionPrerequisite 사용 권장
   */
  private requiresRepair(ncType: string): boolean {
    return (REPAIR_REQUIRING_NC_TYPES as readonly string[]).includes(ncType);
  }

  /**
   * 부적합 유형별 조치 완료 전제조건 검증 (NC_CORRECTION_PREREQUISITES SSOT 기반)
   *
   * - repair: repairHistoryId 필수
   * - recalibration: calibrationId 필수
   * - null: 전제조건 없음
   */
  private validateCorrectionPrerequisite(nc: {
    ncType: string;
    repairHistoryId: string | null;
    calibrationId: string | null;
  }): void {
    const prerequisite = getNCPrerequisite(nc.ncType);

    if (prerequisite === 'repair' && !nc.repairHistoryId) {
      throw new BadRequestException({
        code: 'NC_REPAIR_RECORD_REQUIRED',
        message: `${nc.ncType} type requires a repair record before correction`,
      });
    }

    if (prerequisite === 'recalibration' && !nc.calibrationId) {
      throw new BadRequestException({
        code: 'NC_RECALIBRATION_REQUIRED',
        message: `${nc.ncType} type requires an approved calibration record before correction`,
      });
    }
  }
}

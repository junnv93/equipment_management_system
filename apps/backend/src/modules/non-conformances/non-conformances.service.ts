import { Injectable, NotFoundException, BadRequestException, Inject, Logger } from '@nestjs/common';
import { eq, and, isNull, SQL, ne, sql, or, notInArray, isNotNull, inArray } from 'drizzle-orm';
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
import {
  VersionedBaseService,
  createVersionConflictException,
} from '../../common/base/versioned-base.service';
import { CacheInvalidationHelper } from '../../common/cache/cache-invalidation.helper';
import { SimpleCacheService } from '../../common/cache/simple-cache.service';
import { CACHE_KEY_PREFIXES } from '../../common/cache/cache-key-prefixes';
import { createScopeAwareCacheKeyBuilder } from '../../common/cache/scope-aware-cache-key';
import {
  CACHE_TTL,
  DEFAULT_PAGE_SIZE,
  EXCLUDED_OVERDUE_EQUIPMENT_STATUSES,
} from '@equipment-management/shared-constants';
import { NOTIFICATION_EVENTS } from '../notifications/events/notification-events';
import { CACHE_EVENTS, type NCAttachmentCachePayload } from '../../common/cache/cache-events';
import { DocumentService } from '../../common/file-upload/document.service';
import type { DocumentRecord } from '@equipment-management/db/schema/documents';
import { type DocumentType } from '@equipment-management/schemas';
import type { MulterFile } from '../../types/common.types';
import { likeContains, safeIlike } from '../../common/utils/like-escape';
import { equipmentBelongsToSite, equipmentBelongsToTeam } from '../../common/utils/site-filter';
import {
  EquipmentStatusEnum,
  NonConformanceStatusValues as NonConformanceStatus,
  type NonConformanceStatus as NonConformanceStatusType,
  type NonConformanceType,
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

  private readonly buildCacheKey = createScopeAwareCacheKeyBuilder(
    CACHE_KEY_PREFIXES.NON_CONFORMANCES,
    new Set(['list'])
  );

  constructor(
    @Inject('DRIZZLE_INSTANCE')
    protected readonly db: AppDatabase,
    private readonly cacheInvalidationHelper: CacheInvalidationHelper,
    private readonly cacheService: SimpleCacheService,
    private readonly eventEmitter: EventEmitter2,
    private readonly documentService: DocumentService
  ) {
    super();
  }

  /**
   * 캐시 무효화 헬퍼
   *
   * detail은 ID 지정 삭제, list는 prefix 삭제로 전체 스코프 무효화.
   */
  private invalidateListCache(): void {
    this.cacheService.deleteByPrefix(`${this.CACHE_PREFIX}list:`);
  }

  /**
   * VersionedBaseService 훅 override — 409 발생 시 detail 캐시 자동 무효화.
   * 모든 updateWithVersion 호출 경로(update/close/rejectCorrection/remove/linkRepair...)
   * 가 단일 정책을 공유 → catch boilerplate 제거.
   */
  protected async onVersionConflict(id: string): Promise<void> {
    await this.cacheService.delete(this.buildCacheKey('detail', { id }));
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
    site?: string;
    teamId?: string;
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
    // site/teamId 필터: equipmentBelongsToSite/Team 서브쿼리로 SSOT 통일
    // data/count/summary 3개 쿼리 모두 동일 조건 사용
    if (params.site) {
      conditions.push(equipmentBelongsToSite(nonConformances.equipmentId, params.site));
    }
    if (params.teamId) {
      conditions.push(equipmentBelongsToTeam(nonConformances.equipmentId, params.teamId));
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
  async create(createDto: CreateNonConformanceDto, discoveredBy: string): Promise<NonConformance> {
    // ncType 필수 검증
    if (!createDto.ncType) {
      throw new BadRequestException({
        code: 'NC_TYPE_REQUIRED',
        message: 'Non-conformance type (ncType) is required',
      });
    }

    // 트랜잭션으로 장비 검증 + 부적합 등록 + 장비 상태 변경 (TOCTOU 방지)
    let equipmentData: { name: string; managementNumber: string | null; teamId: string | null };
    const result = await this.db.transaction(async (tx) => {
      // 1. 장비 존재 확인 + 상태 검증 (트랜잭션 내부 — race condition 방지)
      const [currentEquip] = await tx
        .select({
          id: equipment.id,
          version: equipment.version,
          status: equipment.status,
          name: equipment.name,
          managementNumber: equipment.managementNumber,
          teamId: equipment.teamId,
        })
        .from(equipment)
        .where(eq(equipment.id, createDto.equipmentId))
        .limit(1);

      if (!currentEquip) {
        throw new NotFoundException({
          code: 'EQUIPMENT_NOT_FOUND',
          message: `Equipment UUID ${createDto.equipmentId} not found`,
        });
      }

      if (currentEquip.status === EquipmentStatusEnum.enum.non_conforming) {
        throw new BadRequestException({
          code: 'NC_EQUIPMENT_ALREADY_NON_CONFORMING',
          message: 'Equipment is already in non-conforming status.',
        });
      }

      // 이벤트용 장비 데이터 캡처 (트랜잭션 내 최신 데이터)
      equipmentData = {
        name: currentEquip.name,
        managementNumber: currentEquip.managementNumber,
        teamId: currentEquip.teamId,
      };

      // 2. 부적합 등록 (previousEquipmentStatus: NC close 시 장비 상태 복원에 사용)
      const [nonConformance] = await tx
        .insert(nonConformances)
        .values({
          equipmentId: createDto.equipmentId,
          discoveryDate: createDto.discoveryDate,
          discoveredBy,
          cause: createDto.cause,
          ncType: createDto.ncType,
          actionPlan: createDto.actionPlan,
          status: NonConformanceStatus.OPEN,
          previousEquipmentStatus: currentEquip.status,
        })
        .returning();

      // 3. 장비 상태를 non_conforming으로 변경 (CAS: close()와 동일한 version 검증 패턴)
      const [updatedEquip] = await tx
        .update(equipment)
        .set({
          status: EquipmentStatusEnum.enum.non_conforming,
          version: sql`version + 1`,
          updatedAt: new Date(),
        } as Record<string, unknown>)
        .where(
          and(eq(equipment.id, createDto.equipmentId), eq(equipment.version, currentEquip.version))
        )
        .returning({ id: equipment.id });

      if (!updatedEquip) {
        throw createVersionConflictException(currentEquip.version + 1, currentEquip.version);
      }

      return nonConformance;
    });

    // 캐시 무효화 (장비 상태 non_conforming으로 변경됨 + 목록 캐시)
    this.invalidateListCache();
    await this.cacheInvalidationHelper
      .invalidateAfterNonConformanceCreation(createDto.equipmentId)
      .catch((err) =>
        this.logger.warn(`Cache invalidation failed after NC creation: ${err.message}`)
      );

    // 📢 알림 이벤트 발행 (부적합 등록) — 트랜잭션 내 최신 장비 데이터 사용
    const equip = equipmentData!;
    await this.eventEmitter.emitAsync(NOTIFICATION_EVENTS.NC_CREATED, {
      ncId: result.id,
      equipmentId: createDto.equipmentId,
      equipmentName: equip.name ?? '',
      managementNumber: equip.managementNumber ?? '',
      reporterTeamId: equip.teamId ?? '',
      ncType: createDto.ncType,
      actorId: discoveredBy,
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

    const cacheKey = this.buildCacheKey('list', {
      equipmentId,
      status,
      ncType,
      site,
      teamId,
      search,
      pendingClose,
      sort,
      includeSummary,
      page,
      pageSize,
    });

    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        // buildListConditions()로 data/count/summary 쿼리 필터 일관성 보장 (site/teamId 포함)
        const filterParams = { equipmentId, status, ncType, search, pendingClose, site, teamId };

        // summary 조건 분기를 위해 미리 선언
        const summaryFilterParams = { equipmentId, ncType, search, site, teamId };

        // data + count (+ 조건부 summary) 병렬 실행
        // Use Drizzle relational query to include user→team relations
        const [items, [{ total: totalItems }], summaryRows] = await Promise.all([
          this.db.query.nonConformances.findMany({
            where: () => and(...this.buildListConditions(filterParams)),
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
                  team: true,
                },
              },
              corrector: {
                columns: {
                  id: true,
                  name: true,
                  email: true,
                },
                with: {
                  team: true,
                },
              },
              closer: {
                columns: {
                  id: true,
                  name: true,
                  email: true,
                },
                with: {
                  team: true,
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
          }),
          // Count 쿼리 — buildListConditions() SSOT로 data 쿼리와 동일한 필터 보장
          this.db
            .select({ total: sql<number>`count(*)::int` })
            .from(nonConformances)
            .where(and(...this.buildListConditions(filterParams))),
          // Summary 집계 (includeSummary=true일 때만)
          // ✅ status 필터 제외한 기본 조건으로 전체 상태별 건수 반환
          // buildListConditions() SSOT: site/teamId도 서브쿼리로 통일 (innerJoin 불필요)
          includeSummary
            ? this.db
                .select({
                  status: nonConformances.status,
                  count: sql<number>`count(*)::int`,
                })
                .from(nonConformances)
                .where(and(...this.buildListConditions(summaryFilterParams)))
                .groupBy(nonConformances.status)
            : Promise.resolve([] as { status: string; count: number }[]),
        ]);

        let summary: Record<string, number> | undefined;
        if (includeSummary) {
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
      },
      CACHE_TTL.LONG
    );
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
    const cacheKey = this.buildCacheKey('detail', { id });
    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        const nonConformance = await this.db.query.nonConformances.findFirst({
          where: and(eq(nonConformances.id, id), isNull(nonConformances.deletedAt)),
          with: {
            equipment: {
              columns: { id: true, name: true, managementNumber: true, teamId: true },
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
    // corrected 상태는 수정됐지만 미검증 — open과 함께 "활성 부적합"으로 취급
    const results = await this.db
      .select()
      .from(nonConformances)
      .where(
        and(
          eq(nonConformances.equipmentId, equipmentId),
          isNull(nonConformances.deletedAt),
          inArray(nonConformances.status, [
            NonConformanceStatus.OPEN,
            NonConformanceStatus.CORRECTED,
          ])
        )
      );

    return results;
  }

  /**
   * 장비가 부적합 상태인지 확인
   */
  async isEquipmentNonConforming(equipmentId: string): Promise<boolean> {
    // corrected 상태는 수정됐지만 미검증 — open과 함께 "활성 부적합"으로 취급
    const [row] = await this.db
      .select({ exists: sql<number>`1` })
      .from(nonConformances)
      .where(
        and(
          eq(nonConformances.equipmentId, equipmentId),
          isNull(nonConformances.deletedAt),
          inArray(nonConformances.status, [
            NonConformanceStatus.OPEN,
            NonConformanceStatus.CORRECTED,
          ])
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

    // CAS 충돌 시 detail 캐시 무효화는 onVersionConflict() 훅이 처리.
    const updated = await this.updateWithVersion<NonConformance>(
      nonConformances,
      id,
      version,
      updateFields,
      'Non-conformance'
    );

    // 성공 경로: detail + list 캐시 삭제
    this.cacheService.delete(this.buildCacheKey('detail', { id }));
    this.invalidateListCache();

    // 상태 변경 시 교차 엔티티 캐시 무효화 (대시보드, 장비 상세 등)
    if (statusChanged) {
      await this.cacheInvalidationHelper
        .invalidateAfterNonConformanceStatusChange(nonConformance.equipmentId, false)
        .catch((err) =>
          this.logger.warn(`Cache invalidation failed after NC update: ${err.message}`)
        );
    }

    return updated;
  }

  /**
   * 부적합 종료 (기술책임자)
   * 장비 상태 복원: previousEquipmentStatus (없으면 available 폴백)
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
    // updateWithVersion(tx)으로 SSOT CAS 패턴 적용
    // CAS 충돌 시 detail 캐시 무효화는 onVersionConflict() 훅이 처리.
    const result: { updated: NonConformance; equipmentStatusRestored: boolean } =
      await this.db.transaction(async (tx) => {
        // 1. 부적합 종료 (CAS: updateWithVersion SSOT 패턴)
        const updated = await this.updateWithVersion<NonConformance>(
          nonConformances,
          id,
          closeDto.version,
          {
            status: NonConformanceStatus.CLOSED,
            closedBy,
            closedAt: new Date(),
            closureNotes: closeDto.closureNotes,
          },
          'Non-conformance',
          tx,
          'NC_NOT_FOUND'
        );

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
            // previousEquipmentStatus가 유효한 복원 대상이면 사용, 아니면 available 폴백
            const prev = nonConformance.previousEquipmentStatus;
            const isRestorablePrev =
              prev && !(EXCLUDED_OVERDUE_EQUIPMENT_STATUSES as readonly string[]).includes(prev);
            const restoreStatus = isRestorablePrev
              ? (prev as typeof EquipmentStatusEnum.enum.available)
              : EquipmentStatusEnum.enum.available;

            const [updatedEquipment] = await tx
              .update(equipment)
              .set({
                status: restoreStatus,
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
              throw createVersionConflictException(
                currentEquipment.version + 1,
                currentEquipment.version
              );
            }
            equipmentStatusRestored = true;
          }
        }

        return { updated, equipmentStatusRestored };
      });

    // 성공 시 detail + list 캐시 삭제
    this.cacheService.delete(this.buildCacheKey('detail', { id }));
    this.invalidateListCache();

    // cross-entity 캐시 무효화는 NC_CLOSED 이벤트 → CacheEventListener가 처리
    // (장비 상세/목록/대시보드 캐시 — CACHE_INVALIDATION_REGISTRY 참조)

    // 📢 알림 이벤트 발행 (부적합 종료)
    // emitAsync: cross-entity 캐시 무효화(equipment detail/list) 리스너 완료까지 await.
    // emit(fire-and-forget)은 HTTP 응답 후에도 캐시가 stale할 수 있어 read-after-write 일관성 훼손.
    await this.eventEmitter.emitAsync(NOTIFICATION_EVENTS.NC_CLOSED, {
      ncId: id,
      equipmentId: nonConformance.equipmentId,
      equipmentName: (nonConformance as NonConformanceDetail).equipment?.name ?? '',
      managementNumber: (nonConformance as NonConformanceDetail).equipment?.managementNumber ?? '',
      reporterTeamId: (nonConformance as NonConformanceDetail).equipment?.teamId ?? '',
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

    // CAS 충돌 시 detail 캐시 무효화는 onVersionConflict() 훅이 처리.
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

    // 성공 시 detail + list 캐시 삭제
    this.cacheService.delete(this.buildCacheKey('detail', { id }));
    this.invalidateListCache();

    // cross-entity 캐시 무효화는 NC_CORRECTION_REJECTED 이벤트 → CacheEventListener가 처리

    // 📢 알림 이벤트 발행 (조치 반려)
    await this.eventEmitter.emitAsync(NOTIFICATION_EVENTS.NC_CORRECTION_REJECTED, {
      ncId: id,
      equipmentId: nonConformance.equipmentId,
      equipmentName: (nonConformance as NonConformanceDetail).equipment?.name ?? '',
      managementNumber: (nonConformance as NonConformanceDetail).equipment?.managementNumber ?? '',
      reporterTeamId: (nonConformance as NonConformanceDetail).equipment?.teamId ?? '',
      reason: dto.rejectionReason,
      actorId: rejectedBy,
      actorName: '',
      timestamp: new Date(),
    });

    return updated;
  }

  /**
   * 소프트 삭제 (CAS: version 검증 + 교차 캐시 무효화)
   */
  async remove(id: string, version: number): Promise<{ id: string; deleted: boolean }> {
    const nc = await this.findOne(id);

    // CAS 충돌 시 detail 캐시 무효화는 onVersionConflict() 훅이 처리.
    await this.updateWithVersion<NonConformance>(
      nonConformances,
      id,
      version,
      { deletedAt: new Date() },
      'Non-conformance',
      undefined,
      'NC_NOT_FOUND'
    );

    // detail + list 캐시 무효화
    this.cacheService.delete(this.buildCacheKey('detail', { id }));
    this.invalidateListCache();

    // 교차 엔티티 캐시 무효화 (대시보드, 장비 상세의 부적합 목록)
    await this.cacheInvalidationHelper
      .invalidateAfterNonConformanceStatusChange(nc.equipmentId, false)
      .catch((err) =>
        this.logger.warn(`Cache invalidation failed after NC delete: ${err.message}`)
      );

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

    // CAS 충돌 시 detail 캐시 무효화는 onVersionConflict() 훅이 처리.
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

    this.cacheService.delete(this.buildCacheKey('detail', { id: ncId }));
    this.invalidateListCache();

    // repairHistoryId 변경은 pendingClose 필터 결과에 영향 → 대시보드 캐시 무효화
    await this.cacheInvalidationHelper
      .invalidateAfterNonConformanceStatusChange(nc.equipmentId, false)
      .catch((err) =>
        this.logger.warn(`Cache invalidation failed after NC linkRepair: ${err.message}`)
      );
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

    // CAS 충돌 시 detail 캐시 무효화는 onVersionConflict() 훅이 처리.
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

    this.cacheService.delete(this.buildCacheKey('detail', { id }));
    this.invalidateListCache();

    // 교차 엔티티 캐시 무효화 (대시보드, 장비 상세의 부적합 상태)
    await this.cacheInvalidationHelper
      .invalidateAfterNonConformanceStatusChange(nc.equipmentId, false)
      .catch((err) =>
        this.logger.warn(`Cache invalidation failed after NC markCorrected: ${err.message}`)
      );

    // 📢 알림 이벤트 발행 (조치 완료 — 승인 요청)
    await this.eventEmitter.emitAsync(NOTIFICATION_EVENTS.NC_CORRECTED, {
      ncId: id,
      equipmentId: nc.equipmentId,
      equipmentName: (nc as NonConformanceDetail).equipment?.name ?? '',
      managementNumber: (nc as NonConformanceDetail).equipment?.managementNumber ?? '',
      reporterTeamId: (nc as NonConformanceDetail).equipment?.teamId ?? '',
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

  // ============================================================================
  // 첨부 관리 (Service 계층 — Controller는 라우팅/가드만)
  // ============================================================================

  async listAttachments(ncId: string, type?: DocumentType): Promise<DocumentRecord[]> {
    return this.documentService.findByNonConformanceId(ncId, type);
  }

  async uploadAttachment(
    ncId: string,
    file: MulterFile,
    documentType: string,
    actorId: string | null,
    equipmentId: string,
    description?: string
  ): Promise<{ document: DocumentRecord; message: string }> {
    const document = await this.documentService.createDocument(file, {
      documentType: documentType as DocumentType,
      nonConformanceId: ncId,
      description: description || undefined,
      uploadedBy: actorId || undefined,
    });
    const payload: NCAttachmentCachePayload = {
      ncId,
      equipmentId,
      documentId: document.id,
      actorId,
    };
    await this.eventEmitter.emitAsync(CACHE_EVENTS.NC_ATTACHMENT_UPLOADED, payload);
    return { document, message: '첨부가 업로드되었습니다.' };
  }

  async deleteAttachment(
    ncId: string,
    documentId: string,
    actorId: string | null,
    equipmentId: string
  ): Promise<{ message: string }> {
    const doc = await this.documentService.findByIdAnyStatus(documentId);
    if (doc.nonConformanceId !== ncId) {
      throw new BadRequestException({
        code: 'DOCUMENT_OWNER_MISMATCH',
        message: 'Document does not belong to this non-conformance.',
      });
    }
    await this.documentService.deleteDocument(documentId);
    const payload: NCAttachmentCachePayload = { ncId, equipmentId, documentId, actorId };
    await this.eventEmitter.emitAsync(CACHE_EVENTS.NC_ATTACHMENT_DELETED, payload);
    return { message: '첨부가 삭제되었습니다.' };
  }
}
